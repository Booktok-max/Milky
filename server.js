require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

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
  foundation: { name: 'Foundation', amount: 79 },
  momentum: { name: 'Momentum', amount: 249 },
  growth: { name: 'Growth', amount: 499 },
};

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

    const planInfo = PLANS[String(plan || '').toLowerCase()];
    if (!planInfo) {
      return res.status(400).json({ error: 'Unknown plan. Use one of: ' + Object.keys(PLANS).join(', ') });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone is required' });
    }
    if (!NOTIFICATION_ID) {
      return res.status(500).json({ error: 'Server not fully configured: PESAPAL_NOTIFICATION_ID missing. Run /api/register-ipn first.' });
    }

    const token = await getAccessToken();

    const merchantReference = `AS-${planInfo.name.toUpperCase()}-${Date.now()}`;

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

  try {
    if (OrderTrackingId) {
      const status = await fetchStatus(OrderTrackingId);
      const desc = status.payment_status_description || status.status_code;
      paid = String(desc).toUpperCase() === 'COMPLETED';
      statusHtml = `<p>Status: <b>${desc || 'Unknown'}</b></p>`;
    }
  } catch (err) {
    console.error('callback status check error:', err.response?.data || err.message);
  }

  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${paid ? 'Payment received' : 'Payment status'} — Atomic Shelf</title>
    <style>
      body{font-family:sans-serif;background:#14120F;color:#F3EEE3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem;text-align:center;}
      .card{max-width:480px;}
      h1{font-size:1.8rem;margin-bottom:1rem;}
      a{color:#FFB020;}
    </style></head>
    <body><div class="card">
      <h1>${paid ? "You're all set." : 'Payment received — confirming'}</h1>
      ${statusHtml}
      <p>Reference: ${OrderMerchantReference || 'n/a'}</p>
      <p><a href="https://atomic-shelf.com">Return to Atomic Shelf</a></p>
    </div></body></html>`);
});

app.get('/api/cancelled', (req, res) => {
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
    if (OrderTrackingId) {
      const status = await fetchStatus(OrderTrackingId);
      console.log('IPN status:', OrderMerchantReference, status.payment_status_description);
      // TODO: mark the order as paid in your own storage / send yourself an email here.
    }
  } catch (err) {
    console.error('IPN status check error:', err.response?.data || err.message);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pesapal backend running on port ${PORT} (${ENV})`));
