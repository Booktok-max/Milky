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

const NEWSLETTER_DISCOVERY_LANES = [
  { label: 'Free to read on Open Library', query: 'fiction', params: { ebook_access: 'public', has_fulltext: 'true' }, sort: 'readinglog', count: 2 },
  { label: 'Popular in ShelfMates', query: 'fiction', sort: 'readinglog', count: 1 },
  { label: 'Classics', query: 'classics', sort: 'old', count: 2 },
  { label: 'Rising titles', query: 'fiction', sort: 'new', count: 2 },
  { label: 'Value picks', query: 'fiction', params: { ebook_access: 'public' }, sort: 'rating', count: 2 },
  { label: 'BookTok mentions', query: 'booktok', sort: 'readinglog', count: 1 },
];

const NEWSLETTER_LUCKY_LANES = [
  { label: 'Romance lists', query: 'romance' },
  { label: 'Fantasy lists', query: 'fantasy' },
  { label: 'Mystery lists', query: 'mystery' },
];

const NEWSLETTER_LANGUAGE_LANES = [
  { label: 'Spanish', code: 'spa' },
  { label: 'French', code: 'fre' },
  { label: 'German', code: 'ger' },
  { label: 'Japanese', code: 'jpn' },
];

function newsletterDailySeed(date) {
  return [...date].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function seededShuffle(items, seed) {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function escapeNewsletterHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function newsletterBookFromDoc(doc, lane, language = null) {
  const title = doc.title || 'Untitled';
  const author = (doc.author_name || [])[0] || 'Unknown author';
  const searchQuery = `${title} ${author}`.trim();
  const catalogueUrl = doc.key
    ? `https://openlibrary.org${doc.key}`
    : `https://openlibrary.org/search?q=${encodeURIComponent(title)}`;
  return {
    title,
    author,
    year: doc.first_publish_year || null,
    cover: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    url: catalogueUrl,
    lane,
    language,
    genre: (doc.subject || [])[0] || null,
    destinations: {
      googleBooks: `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(searchQuery)}`,
      gutenberg: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(searchQuery)}`,
    },
  };
}

async function fetchNewsletterLane(lane, seed) {
  const params = {
    q: lane.query,
    limit: String(lane.count * 3),
    ...(lane.sort ? { sort: lane.sort } : {}),
    ...(lane.params || {}),
  };
  const response = await axios.get('https://openlibrary.org/search.json', {
    params,
    headers: { 'User-Agent': 'AtomicShelfReaderNewsletter/1.0 (https://atomic-shelf.com)' },
  });
  return seededShuffle((response.data.docs || [])
    .filter(doc => doc.cover_i)
    .slice(0, lane.count * 2)
    .map(doc => newsletterBookFromDoc(doc, lane.label)), seed);
}

async function fetchNewsletterLanguageLane(lane, seed) {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: { q: `language:${lane.code}`, limit: '12', sort: 'readinglog' },
    headers: { 'User-Agent': 'AtomicShelfReaderNewsletter/1.0 (https://atomic-shelf.com)' },
  });
  return seededShuffle((response.data.docs || [])
    .filter(doc => doc.cover_i)
    .slice(0, 2)
    .map(doc => newsletterBookFromDoc(doc, 'Other languages', lane.label)), seed);
}

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
  const seed = newsletterDailySeed(date);
  const lanes = [
    ...NEWSLETTER_DISCOVERY_LANES,
    ...NEWSLETTER_LUCKY_LANES.map(lane => ({ ...lane, label: `I'm feeling lucky · ${lane.label}`, count: 1 })),
  ];
  const results = await Promise.allSettled([
    ...lanes.map(lane => fetchNewsletterLane(lane, seed)),
    ...NEWSLETTER_LANGUAGE_LANES.map(lane => fetchNewsletterLanguageLane(lane, seed)),
  ]);
  const uniqueBooks = seededShuffle(results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value), seed)
    .filter((book, index, allBooks) => {
      const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
      return allBooks.findIndex(candidate => `${candidate.title.toLowerCase()}|${candidate.author.toLowerCase()}` === key) === index;
    });
  const languageBook = uniqueBooks.find(book => book.language);
  const books = [
    ...(languageBook ? [languageBook] : []),
    ...uniqueBooks.filter(book => book !== languageBook),
  ].slice(0, 12);
  if (!books.length) throw new Error('No covered books were returned by the discovery lanes');
  dailyNewsletterCache = {
    date,
    subject: `Today's reader shelf: ${books.slice(0, 3).map(book => book.title).join(', ')}`,
    books
  };
  return dailyNewsletterCache;
}

function renderNewsletterPreview(newsletter) {
  const books = newsletter.books.map(book => `
    <article style="margin:0 0 28px;padding:0 0 24px;border-bottom:1px solid #ded8cc">
      <img src="${escapeNewsletterHtml(book.cover)}" alt="${escapeNewsletterHtml(book.title)} cover" width="160" style="display:block;width:160px;height:auto;margin:0 0 12px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#756d61">${escapeNewsletterHtml(book.lane)}${book.language ? ` · ${escapeNewsletterHtml(book.language)}` : ''}</p>
      <h2 style="margin:0 0 4px;font-size:22px;line-height:1.2"><a href="${escapeNewsletterHtml(book.url)}" style="color:#211d18">${escapeNewsletterHtml(book.title)}</a></h2>
      <p style="margin:0;color:#514a40">${escapeNewsletterHtml(book.author)}${book.year ? ` · ${escapeNewsletterHtml(book.year)}` : ''}</p>
    </article>`).join('');
  const text = [
    newsletter.subject,
    '',
    ...newsletter.books.map(book => [
      `${book.title} by ${book.author}`,
      `${book.lane}${book.language ? ` · ${book.language}` : ''}`,
      book.url,
    ].join('\n')),
  ].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#f5f1e8;color:#211d18;font-family:Arial,sans-serif">
    <main style="max-width:640px;margin:0 auto;padding:40px 24px;background:#fffdf8">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#756d61">Atomic Shelf · ${escapeNewsletterHtml(newsletter.date)}</p>
      <h1 style="margin:0 0 12px;font-size:34px;line-height:1.1">${escapeNewsletterHtml(newsletter.subject)}</h1>
      <p style="margin:0 0 32px;color:#514a40">A daily mix of reader-matched books, curated from today's discovery shelves.</p>
      ${books}
      <p style="font-size:12px;color:#756d61">Book covers and catalogue links are provided by Open Library.</p>
    </main>
  </body></html>`;
  return { html, text };
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

app.get('/api/newsletter/preview', async (req, res) => {
  const suppliedKey = req.get('x-preview-key') || req.query.key;
  const suppliedBearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!SETUP_KEY || (suppliedKey !== SETUP_KEY && suppliedBearer !== SETUP_KEY)) {
    return res.status(403).json({ error: 'Invalid or missing preview key.' });
  }
  try {
    const newsletter = await buildDailyNewsletter();
    res.json({ ...newsletter, ...renderNewsletterPreview(newsletter) });
  } catch (error) {
    console.error('newsletter preview generation error:', error.message);
    res.status(502).json({ error: 'The newsletter preview is temporarily unavailable.' });
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
