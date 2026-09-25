// Shared PesaPal payment logic: pure helpers used by site/server.js and tests.
// No express/axios requires here, so tests can load this file without I/O.
'use strict';

const BILLING_TERMS = ['monthly', '3_month', '6_month', '12_month'];

// Explicit transaction lifecycle states used across callback/IPN/status paths.
const TRANSACTION_STATES = ['pending', 'success', 'failed', 'cancelled'];

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function normalizePlanId(plan) {
  return String(plan || '').toLowerCase();
}

function listPlanIds(plans) {
  return Object.keys(plans || {});
}

function resolvePlan(plans, planId) {
  const normalized = normalizePlanId(planId);
  if (!normalized || !plans || !plans[normalized]) return null;
  return { id: normalized, ...plans[normalized] };
}

function normalizeBillingTerm(term) {
  return String(term || 'monthly').toLowerCase();
}

function resolveAmount(planRecord, term) {
  const billingTerm = normalizeBillingTerm(term);
  const amount = planRecord?.amounts?.[billingTerm];
  if (!Number.isFinite(amount)) return { billingTerm, amount: null };
  return { billingTerm, amount };
}

function buildPaymentPlans(pricingData) {
  if (!pricingData || !Array.isArray(pricingData.plans) || !pricingData.plans.length) {
    throw new Error('Payment pricing data must contain at least one plan.');
  }
  return Object.fromEntries(pricingData.plans.map(plan => {
    if (!plan.id || !plan.name || !Number.isFinite(Number(plan.monthly_price))) {
      throw new Error('Invalid payment pricing record.');
    }
    const amounts = { monthly: Number(plan.monthly_price) };
    for (const term of BILLING_TERMS.slice(1)) {
      const total = plan.commitments?.[term]?.discounted_total_rounded_down_10;
      if (!Number.isFinite(Number(total))) {
        throw new Error(`Missing ${term} payment total for plan.`);
      }
      amounts[term] = Number(total);
    }
    return [normalizePlanId(plan.id), { name: plan.name, amounts }];
  }));
}

function validateIdempotencyKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) return { key: null, error: null };
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    return { key: null, error: 'Invalid idempotency key.' };
  }
  return { key, error: null };
}

function validEmail(value) {
  return Boolean(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Validate an incoming create-payment payload against authoritative plans.
function validateCreatePaymentRequest(body, plans, options = {}) {
  const payload = body || {};
  const plan = resolvePlan(plans, payload.plan);
  if (!plan) {
    return { ok: false, status: 400, error: 'Unknown plan', validPlans: listPlanIds(plans), received: payload.plan };
  }
  const checkedKey = validateIdempotencyKey(payload.idempotency_key);
  if (checkedKey.error) return { ok: false, status: 400, error: checkedKey.error };
  if (!payload.email && !payload.phone) {
    return { ok: false, status: 400, error: 'email or phone is required' };
  }
  if (payload.email && !validEmail(payload.email)) {
    return { ok: false, status: 400, error: 'Invalid email format' };
  }
  const resolved = resolveAmount(plan, payload.term);
  if (!Number.isFinite(resolved.amount)) {
    return { ok: false, status: 400, error: 'Unknown billing term. Use monthly, 3_month, 6_month, or 12_month.' };
  }
  if (!options.notificationConfigured) {
    return { ok: false, status: 500, error: 'Server not fully configured: PESAPAL_NOTIFICATION_ID missing.' };
  }
  return { ok: true, plan, billingTerm: resolved.billingTerm, amount: resolved.amount, idempotencyKey: checkedKey.key };
}

function findConflictingReplay(previous, candidate) {
  if (!previous) return null;
  if (
    previous.plan !== candidate.plan ||
    previous.commitment !== candidate.commitment ||
    previous.amount !== candidate.amount ||
    (previous.customerEmail || null) !== (candidate.customerEmail || null)
  ) {
    return { status: 409, error: 'This idempotency key was already used for a different payment.' };
  }
  if (previous.redirectUrl && previous.pesapalOrderTrackingId) {
    return {
      status: 200,
      replay: true,
      body: {
        redirect_url: previous.redirectUrl,
        order_tracking_id: previous.pesapalOrderTrackingId,
        merchant_reference: previous.merchantReference,
        idempotent_replay: true,
      },
    };
  }
  return null;
}

// Map a provider status payload onto the explicit local lifecycle.
function mapProviderStatus(status) {
  const description = String(status?.payment_status_description || '').toLowerCase();
  const code = String(status?.status_code || '').toLowerCase();
  if (description === 'completed' || code === '1' || code === 'completed') return 'success';
  if (description.includes('cancel')) return 'cancelled';
  if (description.includes('fail') || description.includes('reject') || code === 'failed') return 'failed';
  return 'pending';
}

// Pure transaction transition. Recorded success never regresses.
// Missing/non-object transactions return null instead of throwing.
function applyProviderStatus(transaction, status, source) {
  if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) return null;
  if (!transaction.id && !transaction.merchantReference && !transaction.status) return null;
  const nextStatus = mapProviderStatus(status);
  if (transaction.status === 'success' || transaction.status === 'completed' || transaction.status === 'paid') {
    return { ...transaction, lastStatusSource: source || transaction.lastStatusSource };
  }
  return {
    ...transaction,
    status: nextStatus,
    statusDescription: status?.payment_status_description || status?.status_code || transaction.statusDescription,
    lastStatusSource: source,
    updatedAt: new Date().toISOString(),
  };
}

function buildMerchantReference(planName, billingTerm, randomHex, nowMs = Date.now()) {
  const suffix = String(randomHex || '00000000').slice(0, 8);
  return `AS-${String(planName || 'plan').toUpperCase()}-${String(billingTerm || 'monthly').toUpperCase()}-${nowMs}-${suffix}`;
}

function safeTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) return null;
  if (!transaction.id && !transaction.merchantReference && !transaction.status) return null;
  return {
    merchantReference: transaction.merchantReference,
    plan: transaction.plan ?? null,
    planName: transaction.planName ?? null,
    amount: transaction.amount ?? null,
    currency: transaction.currency ?? null,
    status: transaction.status ?? null,
    paymentStatus: transaction.paymentStatus ?? null,
    createdAt: transaction.createdAt ?? null,
    paidAt: transaction.paidAt ?? null,
  };
}

// Recovery policy: only pending records can be refreshed; completed ones never retry.
// Empty/missing transaction objects are treated as unknown, never retryable.
function retryableTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) {
    return { ok: false, status: 404, error: 'Transaction not found' };
  }
  if (!transaction.status) return { ok: false, status: 404, error: 'Transaction not found' };
  if (transaction.status === 'success' || transaction.status === 'completed' || transaction.status === 'paid') {
    return { ok: false, status: 409, error: 'Completed payments cannot be retried.' };
  }
  return { ok: true, retryAllowed: true };
}

module.exports = {
  BILLING_TERMS,
  TRANSACTION_STATES,
  IDEMPOTENCY_KEY_PATTERN,
  normalizePlanId,
  normalizeBillingTerm,
  listPlanIds,
  resolvePlan,
  resolveAmount,
  buildPaymentPlans,
  validateIdempotencyKey,
  validEmail,
  validateCreatePaymentRequest,
  findConflictingReplay,
  mapProviderStatus,
  applyProviderStatus,
  buildMerchantReference,
  safeTransaction,
  retryableTransaction,
};
