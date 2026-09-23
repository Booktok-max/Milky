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
const TRANSACTIONS_PATH = path.join(NEWSLETTER_DATA_DIR, 'transactions.json');
let dailyNewsletterCache = null;
let tiktokAccessTokenCache = null;
let tiktokTrendCache = null;
let nytBooksCache = null;
let openAlexCache = new Map();

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const NYT_BOOKS_API_BASE = 'https://api.nytimes.com/svc/books/v3';
const TIKTOK_FIELDS = [
  'id',
  'create_time',
  'username',
  'video_description',
  'like_count',
  'comment_count',
  'share_count',
  'view_count',
].join(',');
const TIKTOK_HASHTAGS = ['booktok', 'bookrecommendations', 'bookish'];

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

function validNewsletterPublicationYear(year) {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year > 0 && year <= currentYear + 1;
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
    year: validNewsletterPublicationYear(doc.first_publish_year) ? doc.first_publish_year : null,
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
    .filter(doc => doc.cover_i && validNewsletterPublicationYear(doc.first_publish_year))
    .slice(0, lane.count * 2)
    .map(doc => newsletterBookFromDoc(doc, lane.label)), seed);
}

async function fetchNewsletterLanguageLane(lane, seed) {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: { q: `language:${lane.code}`, limit: '12', sort: 'readinglog' },
    headers: { 'User-Agent': 'AtomicShelfReaderNewsletter/1.0 (https://atomic-shelf.com)' },
  });
  return seededShuffle((response.data.docs || [])
    .filter(doc => doc.cover_i && validNewsletterPublicationYear(doc.first_publish_year))
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

  function readTransactions() {
    try {
      return JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  function writeTransactions(transactions) {
    fs.mkdirSync(NEWSLETTER_DATA_DIR, { recursive: true });
    const temporaryPath = `${TRANSACTIONS_PATH}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(transactions, null, 2));
    fs.renameSync(temporaryPath, TRANSACTIONS_PATH);
  }

  function saveTransaction(transaction) {
    const transactions = readTransactions();
    const index = transactions.findIndex(item => item.id === transaction.id);
    if (index === -1) transactions.push(transaction);
    else transactions[index] = transaction;
    writeTransactions(transactions);
    return transaction;
  }

  function findTransaction({ orderTrackingId, merchantReference }) {
    return readTransactions().find(transaction =>
      (orderTrackingId && transaction.pesapalOrderTrackingId === orderTrackingId) ||
      (merchantReference && transaction.merchantReference === merchantReference)
    );
  }

  function paymentStatusFromPesapal(status) {
    const description = String(status?.payment_status_description || '').toLowerCase();
    const code = String(status?.status_code || '').toLowerCase();
    if (description === 'completed' || code === '1' || code === 'completed') return 'completed';
    if (description.includes('cancel')) return 'cancelled';
    if (description.includes('fail') || description.includes('reject') || code === 'failed') return 'failed';
    return 'pending';
  }

  function updateTransactionStatus(transaction, status, source) {
    if (!transaction) return null;
    const nextStatus = paymentStatusFromPesapal(status);
    if (transaction.status === 'completed' && nextStatus !== 'completed') return transaction;
    const updated = {
      ...transaction,
      status: nextStatus,
      statusDescription: status?.payment_status_description || status?.status_code || transaction.statusDescription,
      lastStatusSource: source,
      updatedAt: new Date().toISOString(),
    };
    return saveTransaction(updated);
  }
}

function tiktokIsConfigured() {
    return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
  }

  function tiktokDateString(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  function tiktokVideoUrl(video) {
    return video.username
      ? `https://www.tiktok.com/@${encodeURIComponent(video.username)}/video/${encodeURIComponent(video.id)}`
      : `https://www.tiktok.com/`;
  }

  function tiktokScore(video, now = Date.now()) {
    const views = Math.max(Number(video.view_count) || 0, 0);
    const likes = Math.max(Number(video.like_count) || 0, 0);
    const comments = Math.max(Number(video.comment_count) || 0, 0);
    const shares = Math.max(Number(video.share_count) || 0, 0);
    const created = Number(video.create_time) > 0 ? Number(video.create_time) * 1000 : now;
    const ageDays = Math.max(0, (now - created) / 86400000);
    const recency = Math.max(0.2, 1 - (ageDays / 30));
    const engagement = likes + (comments * 3) + (shares * 4);
    return Math.round(((Math.log10(views + 1) + Math.log10(engagement + 1)) * recency) * 100) / 100;
  }

  function normalizeTikTokVideo(video) {
    const createdAt = Number(video.create_time) > 0
      ? new Date(Number(video.create_time) * 1000).toISOString()
      : null;
    return {
      id: String(video.id || ''),
      source: 'TikTok Research API',
      creator: video.username ? `@${video.username}` : 'TikTok creator',
      description: String(video.video_description || '').trim(),
      createdAt,
      url: tiktokVideoUrl(video),
      metrics: {
        views: Number(video.view_count) || 0,
        likes: Number(video.like_count) || 0,
        comments: Number(video.comment_count) || 0,
        shares: Number(video.share_count) || 0,
      },
      score: tiktokScore(video),
    };
  }

  async function getTikTokAccessToken() {
    if (tiktokAccessTokenCache && tiktokAccessTokenCache.expiresAt > Date.now()) {
      return tiktokAccessTokenCache.token;
    }
    const response = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });
    const token = response.data?.access_token;
    if (!token) throw new Error('TikTok did not return an access token');
    const expiresIn = Number(response.data.expires_in) || 7200;
    tiktokAccessTokenCache = { token, expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000 };
    return token;
  }

  async function fetchTikTokTrends() {
    if (!tiktokIsConfigured()) {
      return {
        configured: false,
        source: 'TikTok Research API',
        updatedAt: null,
        items: [],
        message: 'TikTok Research API access is not configured yet.',
      };
    }
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 86400000);
    const conditions = [{
      or: TIKTOK_HASHTAGS.map(hashtag => ({
        operation: 'EQ',
        field_name: 'hashtag_name',
        field_values: [hashtag],
      })),
    }];
    if (process.env.TIKTOK_REGION_CODE) {
      conditions.push({
        operation: 'IN',
        field_name: 'region_code',
        field_values: process.env.TIKTOK_REGION_CODE.split(',').map(value => value.trim().toUpperCase()).filter(Boolean),
      });
    }
    const accessToken = await getTikTokAccessToken();
    let cursor;
    let searchId;
    const videos = [];
    for (let page = 0; page < 2; page += 1) {
      const body = {
        query: { and: conditions },
        max_count: 100,
        start_date: tiktokDateString(start),
        end_date: tiktokDateString(now),
        is_random: false,
      };
      if (cursor !== undefined) body.cursor = cursor;
      if (searchId) body.search_id = searchId;
      const response = await axios.post(`${TIKTOK_API_BASE}/research/video/query/`, body, {
        params: { fields: TIKTOK_FIELDS },
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const data = response.data?.data || {};
      videos.push(...(data.videos || []));
      if (!data.has_more || data.cursor === undefined) break;
      cursor = data.cursor;
      searchId = data.search_id;
    }
    const seenVideoIds = new Set();
    const items = videos
      .filter(video => {
        if (!video.id || seenVideoIds.has(String(video.id))) return false;
        seenVideoIds.add(String(video.id));
        return true;
      })
      .map(normalizeTikTokVideo)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18);
    return {
      configured: true,
      source: 'TikTok Research API',
      window: { start: tiktokDateString(start), end: tiktokDateString(now) },
      updatedAt: new Date().toISOString(),
      items,
      message: items.length ? null : 'No public BookTok videos matched the current 30-day query.',
    };
  }

  async function buildTikTokTrends() {
    if (tiktokTrendCache && tiktokTrendCache.expiresAt > Date.now()) return tiktokTrendCache.payload;
    const payload = await fetchTikTokTrends();
    tiktokTrendCache = { payload, expiresAt: Date.now() + 15 * 60 * 1000 };
    return payload;
}

function nytIsConfigured() {
  return Boolean(process.env.NYT_BOOKS_API_KEY);
}

function nytListName() {
  return String(process.env.NYT_BOOKS_LIST || 'hardcover-fiction').trim() || 'hardcover-fiction';
}

function normalizeNytBook(book) {
  const title = String(book.title || 'Untitled');
  const author = String(book.author || 'Unknown author');
  const searchQuery = `${title} ${author}`.trim();
  return {
    rank: Number(book.rank) || null,
    title,
    author,
    description: String(book.description || '').trim(),
    publisher: String(book.publisher || '').trim(),
    publicationYear: null,
    cover: book.book_image || null,
    source: 'The New York Times Books API',
    listName: nytListName(),
    weeksOnList: Number(book.weeks_on_list) || 0,
    catalogueUrl: `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(searchQuery)}`,
    amazonUrl: book.amazon_product_url || `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`,
  };
}

async function fetchNytBooks() {
  if (!nytIsConfigured()) {
    return {
      configured: false,
      source: 'The New York Times Books API',
      list: nytListName(),
      publishedDate: null,
      updatedAt: null,
      items: [],
      message: 'NYT Books API access is not configured yet.',
    };
  }
  const date = new Date().toISOString().slice(0, 10);
  const response = await axios.get(`${NYT_BOOKS_API_BASE}/lists/${date}/${encodeURIComponent(nytListName())}.json`, {
    params: { 'api-key': process.env.NYT_BOOKS_API_KEY },
    timeout: 10000,
  });
  const results = Array.isArray(response.data?.results?.books) ? response.data.results.books : [];
  const items = results
    .filter(book => book && book.title && book.author)
    .slice(0, 15)
    .map(normalizeNytBook);
  return {
    configured: true,
    source: 'The New York Times Books API',
    list: nytListName(),
    publishedDate: response.data?.results?.published_date || date,
    updatedAt: new Date().toISOString(),
    items,
    message: items.length ? null : 'No books were returned for this NYT list today.',
  };
}

async function buildNytBooks() {
  if (nytBooksCache && nytBooksCache.expiresAt > Date.now()) return nytBooksCache.payload;
  const payload = await fetchNytBooks();
  nytBooksCache = { payload, expiresAt: Date.now() + 60 * 60 * 1000 };
  return payload;
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

// ---- Current plans (server-side payment validation) --------------------
// Never trust an amount sent from the browser. Derive it from the same
// controlled dataset used by the public pricing page.
const PRICING_DATA_PATH = path.join(__dirname, 'pricing-data.json');
const BILLING_TERMS = ['monthly', '3_month', '6_month', '12_month'];

function loadPaymentPlans() {
  let pricingData;
  try {
    pricingData = JSON.parse(fs.readFileSync(PRICING_DATA_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to load payment pricing data: ${error.message}`);
  }

  if (!Array.isArray(pricingData.plans) || !pricingData.plans.length) {
    throw new Error('Payment pricing data must contain at least one plan.');
  }

  return Object.fromEntries(pricingData.plans.map(plan => {
    if (!plan.id || !plan.name || !Number.isFinite(Number(plan.monthly_price))) {
      throw new Error(`Invalid payment pricing record for plan "${plan.id || 'unknown'}".`);
    }
    const amounts = { monthly: Number(plan.monthly_price) };
    for (const term of BILLING_TERMS.slice(1)) {
      const total = plan.commitments?.[term]?.discounted_total_rounded_down_10;
      if (!Number.isFinite(Number(total))) {
        throw new Error(`Missing ${term} payment total for plan "${plan.id}".`);
      }
      amounts[term] = Number(total);
    }
    return [String(plan.id).toLowerCase(), { name: plan.name, amounts }];
  }));
}

const PLANS = loadPaymentPlans();

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
    const { plan, term = 'monthly', email, phone, first_name, last_name } = req.body || {};

    const planInfo = PLANS[String(plan || '').toLowerCase()];
    if (!planInfo) {
      return res.status(400).json({ error: 'Unknown plan. Use one of: ' + Object.keys(PLANS).join(', ') });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone is required' });
    }
    const billingTerm = String(term || 'monthly').toLowerCase();
    const amount = planInfo.amounts[billingTerm];
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'Unknown billing term. Use monthly, 3_month, 6_month, or 12_month.' });
    }
    if (!NOTIFICATION_ID) {
      return res.status(500).json({ error: 'Server not fully configured: PESAPAL_NOTIFICATION_ID missing. Run /api/register-ipn first.' });
    }

    const token = await getAccessToken();

    const merchantReference = `AS-${planInfo.name.toUpperCase()}-${billingTerm.toUpperCase()}-${Date.now()}`;
    const transaction = {
      id: merchantReference,
      merchantReference,
      pesapalOrderTrackingId: null,
      plan: String(plan || '').toLowerCase(),
      commitment: billingTerm,
      customerName: [first_name, last_name].filter(Boolean).join(' ') || null,
      customerEmail: email || null,
      amount,
      currency: CURRENCY,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTransaction(transaction);

    const orderPayload = {
      id: merchantReference,
      currency: CURRENCY,
      amount,
      description: `Atomic Shelf - ${planInfo.name} plan (${billingTerm.replace('_', ' ')})`.slice(0, 100),
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

    saveTransaction({
      ...transaction,
      pesapalOrderTrackingId: result.data.order_tracking_id || null,
      updatedAt: new Date().toISOString(),
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
    const transaction = updateTransactionStatus(
      findTransaction({ orderTrackingId }),
      status,
      'status_lookup'
    );
    res.json({ ...status, transaction_status: transaction?.status || paymentStatusFromPesapal(status) });
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
      const transaction = updateTransactionStatus(
        findTransaction({ orderTrackingId: OrderTrackingId, merchantReference: OrderMerchantReference }),
        status,
        'callback'
      );
      paid = transaction?.status === 'completed' || paymentStatusFromPesapal(status) === 'completed';
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
  const transaction = findTransaction({
    orderTrackingId: req.query.OrderTrackingId,
    merchantReference: req.query.OrderMerchantReference,
  });
  if (transaction && transaction.status !== 'completed') {
    saveTransaction({
      ...transaction,
      status: 'cancelled',
      statusDescription: 'Cancelled by customer',
      lastStatusSource: 'cancellation',
      updatedAt: new Date().toISOString(),
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
    if (OrderTrackingId) {
      const status = await fetchStatus(OrderTrackingId);
      console.log('IPN status:', OrderMerchantReference, status.payment_status_description);
      updateTransactionStatus(
        findTransaction({ orderTrackingId: OrderTrackingId, merchantReference: OrderMerchantReference }),
        status,
        'ipn'
      );
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

app.get('/api/readers/open-library', async (req, res) => {
  const resource = String(req.query.path || '').replace(/^\/+/, '');
  const isSearchResource = resource === 'search.json' || resource === 'search/lists.json';
  const isListEditionsResource = /^people\/[^/]+\/lists\/[^/]+(?:\/[^/]+)?\/editions\.json$/.test(resource);
  if (!isSearchResource && !isListEditionsResource) {
    return res.status(400).json({ error: 'Unsupported Open Library resource.' });
  }
  const params = { ...req.query };
  delete params.path;
  try {
    const response = await axios.get(`https://openlibrary.org/${resource}`, {
      params,
      headers: { 'User-Agent': 'AtomicShelfReaders/1.0 (https://atomic-shelf.com)' },
      timeout: 10000,
    });
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json(response.data);
  } catch (error) {
    console.error('Open Library reader proxy error:', resource, error.response?.data || error.message);
    res.status(502).json({ error: 'The Open Library catalogue is temporarily unavailable.' });
  }
});


function normalizeOpenAlexWork(work) {
  const authors = (work.authorships || []).map(authorship => ({
    name: authorship.author?.display_name || 'Unknown author',
    id: authorship.author?.id || null,
    institutions: (authorship.institutions || []).map(institution => institution.display_name).filter(Boolean).slice(0, 3),
  })).filter(author => author.name);

  const topics = (work.topics || []).map(topic => topic.display_name).filter(Boolean).slice(0, 5);
  const primaryLocation = work.primary_location || {};
  const bestOaLocation = work.best_oa_location || {};
  const source = primaryLocation.source || {};

  return {
    id: String(work.id || ''),
    source: 'OpenAlex',
    lane: 'Research & Scholarly',
    type: work.type || null,
    title: work.display_name || 'Untitled scholarly work',
    authors,
    publicationYear: work.publication_year || null,
    publicationDate: work.publication_date || null,
    topics,
    institutionNames: [...new Set(authors.flatMap(author => author.institutions))].slice(0, 6),
    citations: Number(work.cited_by_count) || 0,
    openAccess: Boolean(work.open_access?.is_oa),
    accessStatus: work.open_access?.oa_status || null,
    accessUrl: bestOaLocation.landing_page_url || bestOaLocation.pdf_url || primaryLocation.landing_page_url || null,
    doi: work.doi || null,
    sourceName: source.display_name || null,
    sourceType: source.type || null,
    url: work.id || 'https://openalex.org/',
  };
}

async function fetchOpenAlexScholarly(query, page = 1) {
  const normalizedQuery = String(query || '').trim();
  const cacheKey = `${normalizedQuery.toLowerCase()}|${page}`;
  const cached = openAlexCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.payload;

  const params = {
    filter: 'type:book|book-chapter',
    per_page: '12',
    page: String(Math.max(1, Math.min(Number(page) || 1, 5))),
  };
  if (normalizedQuery) params.search = normalizedQuery;
  if (process.env.OPENALEX_API_KEY) params.api_key = process.env.OPENALEX_API_KEY;
  if (process.env.OPENALEX_MAILTO) params.mailto = process.env.OPENALEX_MAILTO;

  const response = await axios.get('https://api.openalex.org/works', {
    params,
    headers: {
      'User-Agent': 'AtomicShelfReaders/1.0 (https://atomic-shelf.com)',
      Accept: 'application/json',
    },
    timeout: 10000,
  });

  const payload = {
    source: 'OpenAlex',
    lane: 'Research & Scholarly',
    query: normalizedQuery || null,
    page: Number(page) || 1,
    items: (response.data?.results || []).map(normalizeOpenAlexWork),
    meta: {
      count: Number(response.data?.meta?.count) || 0,
      nextPage: response.data?.meta?.next_cursor ? null : null,
    },
    updatedAt: new Date().toISOString(),
  };

  openAlexCache.set(cacheKey, { payload, expiresAt: Date.now() + 30 * 60 * 1000 });
  if (openAlexCache.size > 40) {
    const oldestKey = openAlexCache.keys().next().value;
    if (oldestKey) openAlexCache.delete(oldestKey);
  }
  return payload;
}


app.get('/api/readers/scholarly', async (req, res) => {
  try {
    const query = String(req.query.q || 'research').trim().slice(0, 160);
    const page = Math.max(1, Math.min(Number(req.query.page) || 1, 5));
    res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    res.json(await fetchOpenAlexScholarly(query, page));
  } catch (error) {
    console.error('OpenAlex scholarly search error:', error.response?.data || error.message);
    res.status(502).json({
      source: 'OpenAlex',
      lane: 'Research & Scholarly',
      items: [],
      error: 'The scholarly catalogue is temporarily unavailable.',
    });
  }
});

app.get('/api/readers/tiktok', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    res.json(await buildTikTokTrends());
  } catch (error) {
    console.error('TikTok trend generation error:', error.response?.data || error.message);
    res.status(502).json({
      configured: tiktokIsConfigured(),
      source: 'TikTok Research API',
      items: [],
      error: 'TikTok trends are temporarily unavailable.',
    });
  }
});

app.get('/api/readers/nyt', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600');
    res.json(await buildNytBooks());
  } catch (error) {
    console.error('NYT Books reader API error:', error.response?.data || error.message);
    res.status(502).json({
      configured: nytIsConfigured(),
      source: 'The New York Times Books API',
      list: nytListName(),
      items: [],
      error: 'The NYT bestseller feed is temporarily unavailable.',
    });
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
