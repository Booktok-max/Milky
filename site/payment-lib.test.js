const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const paymentLib = require('./payment-lib');

const pricingData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-data.json'), 'utf8'));
const plans = paymentLib.buildPaymentPlans(pricingData);

describe('commercial pricing consistency', () => {
  it('covers all six standard plans with four billing terms', () => {
    for (const id of ['spark', 'enhanced', 'foundation', 'starter', 'momentum', 'growth']) {
      assert.ok(plans[id], `missing plan ${id}`);
      for (const term of paymentLib.BILLING_TERMS) {
        assert.ok(Number.isFinite(plans[id].amounts[term]), `${id} missing ${term}`);
      }
    }
  });

  it('matches the controlled pricing file exactly', () => {
    for (const record of pricingData.plans) {
      const expected = {
        monthly: Number(record.monthly_price),
        '3_month': Number(record.commitments['3_month'].discounted_total_rounded_down_10),
        '6_month': Number(record.commitments['6_month'].discounted_total_rounded_down_10),
        '12_month': Number(record.commitments['12_month'].discounted_total_rounded_down_10),
      };
      assert.deepEqual(plans[record.id].amounts, expected);
    }
  });
});

describe('plan lookup and tamper resistance', () => {
  it('resolves valid plans case-insensitively', () => {
    assert.equal(paymentLib.resolvePlan(plans, 'Spark').amounts.monthly, 20);
    assert.equal(paymentLib.resolvePlan(plans, 'GROWTH').amounts.monthly, 499);
  });

  it('rejects unknown plans and unknown billing terms', () => {
    assert.equal(paymentLib.resolvePlan(plans, 'surge'), null);
    assert.equal(paymentLib.resolvePlan(plans, 'orbit'), null);
    const badPlan = paymentLib.validateCreatePaymentRequest(
      { plan: 'nope', email: 'a@example.com' }, plans, { notificationConfigured: true });
    assert.equal(badPlan.ok, false);
    const badTerm = paymentLib.validateCreatePaymentRequest(
      { plan: 'spark', term: 'weekly', email: 'a@example.com' }, plans, { notificationConfigured: true });
    assert.equal(badTerm.ok, false);
  });

  it('ignores browser-supplied amounts and uses controlled totals', () => {
    const checked = paymentLib.validateCreatePaymentRequest(
      { plan: 'momentum', term: '6_month', email: 'a@example.com', amount: 1, monthly_price: 1 },
      plans, { notificationConfigured: true });
    assert.equal(checked.ok, true);
    assert.equal(checked.amount, 1190);
    assert.equal(checked.billingTerm, '6_month');
  });

  it('requires contact info, valid email, and server configuration', () => {
    assert.equal(paymentLib.validateCreatePaymentRequest(
      { plan: 'spark' }, plans, { notificationConfigured: true }).ok, false);
    assert.equal(paymentLib.validateCreatePaymentRequest(
      { plan: 'spark', email: 'not-an-email' }, plans, { notificationConfigured: true }).ok, false);
    assert.equal(paymentLib.validateCreatePaymentRequest(
      { plan: 'spark', email: 'a@example.com', idempotency_key: 'bad key!' },
      plans, { notificationConfigured: true }).ok, false);
    const missingConfig = paymentLib.validateCreatePaymentRequest(
      { plan: 'spark', email: 'a@example.com' }, plans, { notificationConfigured: false });
    assert.equal(missingConfig.ok, false);
    assert.equal(missingConfig.status, 500);
  });
});

describe('transaction lifecycle', () => {
  it('maps provider callbacks to explicit states', () => {
    assert.equal(paymentLib.mapProviderStatus({ payment_status_description: 'Completed' }), 'success');
    assert.equal(paymentLib.mapProviderStatus({ payment_status_description: 'Pending' }), 'pending');
    assert.equal(paymentLib.mapProviderStatus({ payment_status_description: 'Failed' }), 'failed');
    assert.equal(paymentLib.mapProviderStatus({ payment_status_description: 'Cancelled by user' }), 'cancelled');
    assert.equal(paymentLib.mapProviderStatus({}), 'pending');
    assert.equal(paymentLib.mapProviderStatus(null), 'pending');
  });

  it('rejects malformed callback data as pending rather than crashing', () => {
    for (const malformed of [undefined, null, {}, { payment_status_description: 42 }, { status_code: [] }]) {
      assert.equal(paymentLib.mapProviderStatus(malformed), 'pending');
      assert.ok(paymentLib.applyProviderStatus({ status: 'pending' }, malformed, 'ipn'));
    }
  });

  it('transitions pending records and never regresses success', () => {
    const pending = { status: 'pending' };
    assert.equal(paymentLib.applyProviderStatus(pending, { payment_status_description: 'Completed' }, 'ipn').status, 'success');
    assert.equal(paymentLib.applyProviderStatus(pending, { payment_status_description: 'Failed' }, 'ipn').status, 'failed');
    assert.equal(paymentLib.applyProviderStatus(pending, { payment_status_description: 'Cancelled' }, 'ipn').status, 'cancelled');
    const done = { status: 'success', lastStatusSource: 'ipn' };
    const repeated = paymentLib.applyProviderStatus(done, { payment_status_description: 'Failed' }, 'ipn');
    assert.equal(repeated.status, 'success');
  });

  it('handles duplicate and conflicting idempotency keys', () => {
    const previous = {
      plan: 'spark', commitment: 'monthly', amount: 20,
      customerEmail: 'a@example.com', redirectUrl: 'https://pay.example/1',
      pesapalOrderTrackingId: 'track-1', merchantReference: 'AS-SPARK-1',
    };
    const replay = paymentLib.findConflictingReplay(previous, {
      plan: 'spark', commitment: 'monthly', amount: 20, customerEmail: 'a@example.com',
    });
    assert.equal(replay.replay, true);
    assert.equal(replay.body.merchant_reference, 'AS-SPARK-1');
    const conflict = paymentLib.findConflictingReplay(previous, {
      plan: 'spark', commitment: 'monthly', amount: 999, customerEmail: 'a@example.com',
    });
    assert.equal(conflict.status, 409);
  });

  it('exposes a safe recovery policy', () => {
    assert.equal(paymentLib.retryableTransaction(null).status, 404);
    assert.equal(paymentLib.retryableTransaction({ status: 'pending' }).retryAllowed, true);
    assert.equal(paymentLib.retryableTransaction({ status: 'failed' }).retryAllowed, true);
    assert.equal(paymentLib.retryableTransaction({ status: 'success' }).ok, false);
    const safe = paymentLib.safeTransaction({
      merchantReference: 'AS-1', plan: 'spark', customerEmail: 'a@example.com',
      pesapalOrderTrackingId: 'secret-track', status: 'pending',
    });
    assert.equal(safe.customerEmail, undefined);
    assert.equal(safe.pesapalOrderTrackingId, undefined);
  });
});

describe('public/private deployment boundary', () => {
  it('blocks private runtime and planning assets from public serving', () => {
    const serverSource = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    for (const blocked of [
      '/Productions/', '/payment/', '/private-data/', '/Campaigns/', '/Images/', '/e/',
      '/proof-audit.json', '/site-data-model.json', '/server.js', '/payment-lib.js',
      '/package.json', '/.env', '/.env.example', '/Atomic_Shelf_Website_Relaunch_PRD.md',
    ]) {
      assert.ok(serverSource.includes(`'${blocked}'`), `server boundary missing ${blocked}`);
    }
  });

  it('keeps the deploy workflow aligned with the server boundary', () => {
    const deploy = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml'), 'utf8');
    for (const excluded of [
      '/Productions/', '/payment/', '/private-data/', '/server.js', '/payment-lib.js',
      '/proof-audit.json', '/site-data-model.json', '/.env',
    ]) {
      assert.ok(deploy.includes(excluded), `deploy boundary missing ${excluded}`);
    }
  });

  it('keeps server credentials out of browser code', () => {
    for (const page of ['checkout.html', 'pricing.html', 'index.html', 'readers.html']) {
      const html = fs.readFileSync(path.join(__dirname, page), 'utf8');
      for (const secret of ['PESAPAL_CONSUMER_SECRET', 'BREVO_API_KEY', 'TIKTOK_CLIENT_SECRET', 'SETUP_KEY']) {
        assert.ok(!html.includes(secret), `${page} exposes ${secret}`);
      }
    }
  });
});
