require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

const NEWSLETTER_DATA_DIR = path.join(__dirname, 'private-data');
const NEWSLETTER_SUBSCRIBERS_PATH = path.join(NEWSLETTER_DATA_DIR, 'newsletter-subscribers.json');
let dailyNewsletterCache = null;

function readNewsletterSubscribers() {
  try {
    return JSON.parse(fs.readFileSync(NEWSLETTER_SUBSCRIBERS_PATH, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function saveNewsletterSubscriber(email) {
  fs.mkdirSync(NEWSLETTER_DATA_DIR, { recursive: true });
  const subscribers = readNewsletterSubscribers();
  if (!subscribers.some(item => item.email === email)) {
    subscribers.push({ email, subscribed_at: new Date().toISOString() });
    fs.writeFileSync(NEWSLETTER_SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2));
  }
}

async function buildDailyNewsletter() {
  const date = new Date().toISOString().slice(0, 10);
  if (dailyNewsletterCache?.date === date) return dailyNewsletterCache;
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: { q: 'fiction', sort: 'readinglog', limit: 12 }
  });
  const books = (response.data.docs || [])
    .filter(book => book.cover_i)
    .slice(0, 8)
    .map(book => ({
      title: book.title || 'Untitled',
      author: (book.author_name || [])[0] || 'Unknown author',
      year: book.first_publish_year || null,
      cover: `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`,
      url: book.key ? `https://openlibrary.org${book.key}` : null
    }));
  dailyNewsletterCache = {
    date,
    subject: `Today's reader shelf: ${books.slice(0, 3).map(book => book.title).join(', ')}`,
    books
  };
  return dailyNewsletterCache;
}

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

app.get('/api/newsletter/daily', async (req, res) => {
  try {
    res.json(await buildDailyNewsletter());
  } catch (error) {
    console.error('daily newsletter generation error:', error.message);
    res.status(502).json({ error: 'The daily reader shelf is temporarily unavailable.' });
  }
});

app.post('/api/newsletter/subscribe', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  try {
    saveNewsletterSubscriber(email);
    res.status(201).json({ message: 'You are on the daily reader shelf list.' });
  } catch (error) {
    console.error('newsletter subscription error:', error.message);
    res.status(500).json({ error: 'We could not save your subscription.' });
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
  '/private-data/',
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
