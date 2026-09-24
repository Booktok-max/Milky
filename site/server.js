require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// ---- Config -----------------------------------------------------------
const ENV = (process.env.PESAPAL_ENV || 'sandbox').toLowerCase(); // 'sandbox' | 'production'
const PESAPAL_BASE = ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const NOTIFICATION_ID = process.env.PESAPAL_NOTIFICATION_ID; // set after /api/register-ipn
const APP_BASE_URL = process.env.APP_BASE_URL; // e.g. https://your-app.up.railway.app
const SETUP_KEY = process.env.SETUP_KEY; // simple shared secret to protect /api/register-ipn
const CURRENCY = process.env.PESAPAL_CURRENCY || 'USD';

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('WARNING: PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET not set.');
}
if (!APP_BASE_URL) {
  console.warn('WARNING: APP_BASE_URL not set — callback/IPN URLs will be wrong.');
}

// ---- Known plans (server-side source of truth for pricing) ------------
// Never trust an amount sent from the browser — look it up here instead.
const PLANS = {
  spark: { name: 'Spark', amount: 20 },
  enhanced: { name: 'Enhanced', amount: 50 },
  foundation: { name: 'Foundation', amount: 79 },
  starter: { name: 'Starter', amount: 100 },
  momentum: { name: 'Momentum', amount: 249 },
  growth: { name: 'Growth', amount: 499 },
};

// ---- Transaction persistence (in-memory for now, upgrade to DB later) ----
// This provides idempotency and duplicate callback protection
const transactions = new Map(); // key: merchantReference, value: transaction record

function getTransaction(merchantReference) {
  return transactions.get(merchantReference);
}

function setTransaction(merchantReference, data) {
  transactions.set(merchantReference, {
    ...data,
    merchantReference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function updateTransaction(merchantReference, updates) {
  const existing = transactions.get(merchantReference);
  if (existing) {
    transactions.set(merchantReference, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

// ---- Security helpers ----------------------------------------------------
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

function validateSignature(data, signature, secret) {
  if (!signature || !secret) return false;
  const expectedSignature = generateSignature(data, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// ---- Email notification helpers -----------------------------------------
// TODO: Replace with actual email service integration (Brevo, SendGrid, etc.)
async function sendPaymentConfirmationEmail(transaction) {
  console.log('TODO: Send payment confirmation email for:', transaction.merchantReference);
  console.log('To:', transaction.email, 'Plan:', transaction.planName, 'Amount:', transaction.amount);
  
  // Placeholder for actual email implementation
  // This should integrate with your email service (Brevo, etc.)
  // Return success/failure status
  return { success: true, method: 'placeholder' };
}

async function sendPaymentFailedEmail(transaction, error) {
  console.log('TODO: Send payment failed notification for:', transaction.merchantReference);
  console.log('Error:', error);
  
  // Placeholder for actual email implementation
  return { success: true, method: 'placeholder' };
}

async function sendAdminNotification(transaction, eventType) {
  console.log('TODO: Send admin notification for:', eventType, transaction.merchantReference);
  
  // Placeholder for admin notification system
  return { success: true, method: 'placeholder' };
}

// ---- Token cache (Pesapal tokens last ~5 minutes) ----------------------
let cachedToken = null;
let cachedTokenExpiry = 0; // epoch ms

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }
  const res = await axios.post(
    `${PESAPAL_BASE}/api/Auth/RequestToken`,
    { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
    { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } }
  );
  if (!res.data || !res.data.token) {
    throw new Error('Pesapal auth failed: ' + JSON.stringify(res.data));
  }
  cachedToken = res.data.token;
  // Refresh a little early — cache for 4 minutes instead of the full 5.
  cachedTokenExpiry = Date.now() + 4 * 60 * 1000;
  return cachedToken;
}

// ---- One-time setup: register the IPN URL -----------------------------
// Visit this once after deploying (with the SETUP_KEY), copy the
// notification_id it returns into PESAPAL_NOTIFICATION_ID, then redeploy.
app.get('/api/register-ipn', async (req, res) => {
  try {
    if (!SETUP_KEY || req.query.key !== SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid or missing setup key' });
    }
    const token = await getAccessToken();
    const ipnUrl = `${APP_BASE_URL}/api/ipn`;
    const result = await axios.post(
      `${PESAPAL_BASE}/api/URLSetup/RegisterIPN`,
      { url: ipnUrl, ipn_notification_type: 'GET' },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json({
      message: 'Copy ipn_id below into PESAPAL_NOTIFICATION_ID and redeploy.',
      registered_url: ipnUrl,
      pesapal_response: result.data,
    });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- Create a payment request ------------------------------------------
app.post('/api/create-payment', async (req, res) => {
  try {
    const { plan, email, phone, first_name, last_name } = req.body || {};

    // Validate plan
    const planId = String(plan || '').toLowerCase();
    const planInfo = PLANS[planId];
    if (!planInfo) {
      return res.status(400).json({ 
        error: 'Unknown plan', 
        validPlans: Object.keys(PLANS),
        received: plan 
      });
    }

    // Validate contact info
    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone is required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check server configuration
    if (!NOTIFICATION_ID) {
      return res.status(500).json({ error: 'Server not fully configured: PESAPAL_NOTIFICATION_ID missing. Run /api/register-ipn first.' });
    }

    const token = await getAccessToken();

    // Generate unique merchant reference
    const merchantReference = `AS-${planInfo.name.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString('hex').slice(0, 8)}`;

    // Initialize transaction record
    setTransaction(merchantReference, {
      planId,
      planName: planInfo.name,
      amount: planInfo.amount,
      email,
      phone,
      first_name,
      last_name,
      status: 'pending',
      orderTrackingId: null,
      paymentStatus: null,
      ipnReceived: false,
      callbackReceived: false
    });

    const orderPayload = {
      id: merchantReference,
      currency: CURRENCY,
      amount: planInfo.amount,
      description: `Atomic Shelf — ${planInfo.name} plan`.slice(0, 100),
      callback_url: `${APP_BASE_URL}/api/callback`,
      cancellation_url: `${APP_BASE_URL}/api/cancelled`,
      notification_id: NOTIFICATION_ID,
      billing_address: {
        email_address: email || undefined,
        phone_number: phone || undefined,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
      },
    };

    const result = await axios.post(
      `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
      orderPayload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!result.data || !result.data.redirect_url) {
      return res.status(502).json({ error: 'Unexpected Pesapal response', details: result.data });
    }

    // Update transaction with Pesapal tracking ID
    updateTransaction(merchantReference, {
      orderTrackingId: result.data.order_tracking_id,
      status: 'created'
    });

    res.json({
      redirect_url: result.data.redirect_url,
      order_tracking_id: result.data.order_tracking_id,
      merchant_reference: merchantReference,
    });
  } catch (err) {
    console.error('create-payment error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- Transaction status lookup ------------------------------------------
async function fetchStatus(orderTrackingId) {
  const token = await getAccessToken();
  const result = await axios.get(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus`,
    {
      params: { orderTrackingId },
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    }
  );
  return result.data;
}

app.get('/api/status', async (req, res) => {
  try {
    const { orderTrackingId } = req.query;
    if (!orderTrackingId) return res.status(400).json({ error: 'orderTrackingId is required' });
    const status = await fetchStatus(orderTrackingId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- Callback page (customer lands here after paying) -------------------
app.get('/api/callback', async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.query;
  let statusHtml = '<p>We could not confirm your payment status automatically. If you were charged, contact us and we will verify manually.</p>';
  let paid = false;
  let title = 'Payment status';

  try {
    if (OrderTrackingId && OrderMerchantReference) {
      // Mark callback as received
      updateTransaction(OrderMerchantReference, {
        callbackReceived: true,
        callbackReceivedAt: new Date().toISOString()
      });

      const status = await fetchStatus(OrderTrackingId);
      const desc = status.payment_status_description || status.status_code;
      const paymentStatus = String(desc).toUpperCase();
      
      paid = paymentStatus === 'COMPLETED';
      
      statusHtml = `<p>Status: <b>${desc || 'Unknown'}</b></p>`;
      
      // Update transaction with callback status
      updateTransaction(OrderMerchantReference, {
        paymentStatus,
        callbackStatus: desc
      });

      if (paid) {
        updateTransaction(OrderMerchantReference, {
          status: 'paid',
          paidAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('callback status check error:', err.response?.data || err.message);
    statusHtml = '<p>There was an error confirming your payment status. Please contact us if you were charged.</p>';
  }

  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${title} — Atomic Shelf</title>
    <style>
      body{font-family:sans-serif;background:#14120F;color:#F3EEE3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem;text-align:center;}
      .card{max-width:480px;}
      h1{font-size:1.8rem;margin-bottom:1rem;}
      a{color:#FFB020;}
    </style></head>
    <body><div class="card">
      <h1>${paid ? "You're all set." : (title === 'Payment processing' ? 'Payment processing...' : 'Payment status unclear')}</h1>
      ${statusHtml}
      <p>Reference: ${OrderMerchantReference || 'n/a'}</p>
      <p><a href="https://atomic-shelf.com">Return to Atomic Shelf</a></p>
    </div></body></html>`);
});

app.get('/api/cancelled', (req, res) => {
  const { OrderMerchantReference } = req.query;
  
  // Update transaction status if we have a reference
  if (OrderMerchantReference) {
    updateTransaction(OrderMerchantReference, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
  }
  
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Payment cancelled — Atomic Shelf</title>
    <style>body{font-family:sans-serif;background:#14120F;color:#F3EEE3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;}</style></head>
    <body><div><h1>Payment cancelled</h1><p><a href="https://atomic-shelf.com/pricing.html" style="color:#FFB020;">Back to pricing</a></p></div></body></html>`);
});

// ---- IPN endpoint (Pesapal server-to-server notification) ---------------
app.get('/api/ipn', async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;
  console.log('IPN received:', { OrderTrackingId, OrderMerchantReference, OrderNotificationType });
  
  try {
    if (!OrderTrackingId || !OrderMerchantReference) {
      console.warn('IPN missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate IPN (idempotency)
    const existingTransaction = getTransaction(OrderMerchantReference);
    if (existingTransaction && existingTransaction.ipnReceived) {
      console.log('Duplicate IPN detected for:', OrderMerchantReference);
      return res.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
        duplicate: true
      });
    }

    // Fetch current status from Pesapal
    const status = await fetchStatus(OrderTrackingId);
    console.log('IPN status:', OrderMerchantReference, status.payment_status_description);
    
    // Update transaction record
    const paymentStatus = String(status.payment_status_description || status.status_code || '').toUpperCase();
    updateTransaction(OrderMerchantReference, {
      paymentStatus,
      ipnReceived: true,
      ipnReceivedAt: new Date().toISOString(),
      pesapalStatus: status
    });

    // Handle successful payment
    if (paymentStatus === 'COMPLETED') {
      updateTransaction(OrderMerchantReference, {
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      
      // Get updated transaction for email
      const completedTransaction = getTransaction(OrderMerchantReference);
      
      // Send confirmation email (with error handling)
      try {
        const emailResult = await sendPaymentConfirmationEmail(completedTransaction);
        updateTransaction(OrderMerchantReference, {
          emailSent: emailResult.success,
          emailSentAt: new Date().toISOString(),
          emailError: emailResult.success ? null : emailResult.error
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        updateTransaction(OrderMerchantReference, {
          emailSent: false,
          emailError: emailError.message
        });
        // Continue despite email failure - payment is still valid
      }
      
      // Send admin notification
      if (completedTransaction) {
        await sendAdminNotification(completedTransaction, 'payment_completed');
      }
      
      console.log('Payment completed for:', OrderMerchantReference);
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      updateTransaction(OrderMerchantReference, {
        status: paymentStatus.toLowerCase()
      });
      
      // Send admin notification for failed payments
      const failedTransaction = getTransaction(OrderMerchantReference);
      if (failedTransaction) {
        await sendAdminNotification(failedTransaction, `payment_${paymentStatus.toLowerCase()}`);
      }
    }

  } catch (err) {
    console.error('IPN processing error:', err.response?.data || err.message);
    // Still return 200 to Pesapal to avoid retries, but log the error
  }

  res.json({
    orderNotificationType: OrderNotificationType,
    orderTrackingId: OrderTrackingId,
    orderMerchantReference: OrderMerchantReference,
    status: 200,
  });
});

app.post('/api/ipn', (req, res) => res.redirect(307, `/api/ipn?${new URLSearchParams(req.query)}`));

app.get('/health', (req, res) => res.json({ ok: true, env: ENV }));

// ---- Transaction management endpoints ------------------------------------
app.get('/api/transaction/:merchantReference', (req, res) => {
  const { merchantReference } = req.params;
  const transaction = getTransaction(merchantReference);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  // Return safe subset of transaction data
  const safeTransaction = {
    merchantReference: transaction.merchantReference,
    planName: transaction.planName,
    amount: transaction.amount,
    status: transaction.status,
    paymentStatus: transaction.paymentStatus,
    createdAt: transaction.createdAt,
    paidAt: transaction.paidAt
  };
  
  res.json(safeTransaction);
});

// Admin endpoint for transaction reconciliation (protected by SETUP_KEY)
app.get('/api/admin/transactions', (req, res) => {
  if (!SETUP_KEY || req.query.key !== SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid or missing setup key' });
  }
  
  const allTransactions = Array.from(transactions.values());
  res.json({
    count: allTransactions.length,
    transactions: allTransactions
  });
});

// Admin endpoint to test payment status lookup
app.get('/api/admin/test-status', async (req, res) => {
  if (!SETUP_KEY || req.query.key !== SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid or missing setup key' });
  }
  
  const { orderTrackingId } = req.query;
  if (!orderTrackingId) {
    return res.status(400).json({ error: 'orderTrackingId is required' });
  }
  
  try {
    const status = await fetchStatus(orderTrackingId);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Public asset boundary ---------------------------------------------
// Keep internal records and operational tools outside the browser's reach.
// Public pages may still load explicitly approved assets such as pricing-data.json.
const BLOCKED_PUBLIC_PREFIXES = [
  '/ActiveClients/',
  '/Campaigns/',
  '/Content-Proposal/',
  '/dashboards/',
  '/Editorials/',
  '/leads/',
  '/reports/',
  '/staging/',
  '/Taskmaster/',
  '/Next%20priority%20from%20Milky%20project%20roadmap%20-%20Claude_files/',
  '/Next priority from Milky project roadmap - Claude_files/',
];
const BLOCKED_PUBLIC_FILES = new Set([
  '/commercial-truth.json',
  '/proof-audit.json',
  '/service-map.json',
  '/site-data-model.json',
  '/atomic-shelf-commitment-terms.md',
  '/Atomic_Shelf_Website_Relaunch_PRD.md',
  '/README.md',
  '/server.js',
  '/package.json',
  '/.env',
]);
const BLOCKED_PUBLIC_DOCUMENTS = new Set([
  '/Next priority from Milky project roadmap - Claude.html',
]);

app.use((req, res, next) => {
  let pathname;
  try {
    pathname = decodeURIComponent(req.path);
  } catch {
    return res.status(400).send('Invalid URL');
  }
  const normalizedPath = pathname.replace(/\/+/g, '/');
  const isBlockedPrefix = BLOCKED_PUBLIC_PREFIXES.some(prefix => normalizedPath.startsWith(prefix));
  if (isBlockedPrefix || BLOCKED_PUBLIC_FILES.has(normalizedPath) || BLOCKED_PUBLIC_DOCUMENTS.has(normalizedPath)) {
    return res.status(404).send('Not found');
  }
  next();
});

// ---- Serve pricing page (inject backend URL without hardcoded placeholders) --
app.use(express.static(__dirname, { index: false }));

const pricingHtmlPath = path.join(__dirname, 'pricing.html');
const checkoutHtmlPath = path.join(__dirname, 'checkout.html');

function injectBackendUrl(html) {
  const backendUrl = APP_BASE_URL || 'http://localhost:3000';
  const injection = `
    <script>
      window.__ATOMIC_SHELF_BACKEND_URL__ = ${JSON.stringify(backendUrl)};
    </script>
  `;
  return html.includes('</body>') ? html.replace('</body>', `${injection}</body>`) : html + injection;
}

app.get(['/', '/pricing.html'], (req, res) => {
  try {
    const html = injectBackendUrl(fs.readFileSync(pricingHtmlPath, 'utf8'));
    res.type('html').send(html);
  } catch (err) {
    console.error('Could not read pricing.html:', err.message);
    res.status(500).send('pricing.html not found — make sure it is in the same folder as server.js');
  }
});

app.get('/checkout.html', (req, res) => {
  try {
    const html = injectBackendUrl(fs.readFileSync(checkoutHtmlPath, 'utf8'));
    res.type('html').send(html);
  } catch (err) {
    console.error('Could not read checkout.html:', err.message);
    res.status(500).send('checkout.html not found — make sure it is in the same folder as server.js');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pesapal backend running on port ${PORT} (${ENV})`));
