// Payment persistence layer.
//
// Two adapters implement the same async interface:
//   - FileStore     JSON files under private-data/ (historical behaviour, default)
//   - PostgresStore selected when PAYMENT_STORE=postgres or DATABASE_URL is set
//
// The file adapter is never deleted: it is the default and the rollback path.
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(__dirname, 'private-data');
const TRANSACTIONS_FILE = 'transactions.json';
const COMMUNICATION_EVENTS_FILE = 'communication-events.json';

function readJsonArray(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writeJsonArray(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(records, null, 2));
  fs.renameSync(temporaryPath, filePath);
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function matchesTransaction(transaction, { orderTrackingId, merchantReference }) {
  if (!isObject(transaction)) return false;
  if (orderTrackingId && transaction.pesapalOrderTrackingId === orderTrackingId) return true;
  if (merchantReference && transaction.merchantReference === merchantReference) return true;
  if (merchantReference && transaction.id === merchantReference) return true;
  return false;
}

// JSON-file backed store. Mirrors the original synchronous implementation,
// exposed through the same async interface as the database adapter.
class FileStore {
  constructor(dataDir = DEFAULT_DATA_DIR) {
    this.dataDir = dataDir;
    this.type = 'file';
    this.transactionsPath = path.join(dataDir, TRANSACTIONS_FILE);
    this.communicationEventsPath = path.join(dataDir, COMMUNICATION_EVENTS_FILE);
  }

  async migrate() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    return { adapter: 'file', applied: [] };
  }

  async listTransactions() {
    return readJsonArray(this.transactionsPath);
  }

  async saveTransaction(transaction) {
    if (!isObject(transaction)) return null;
    const records = await this.listTransactions();
    const key = transaction.id || transaction.merchantReference;
    const index = key
      ? records.findIndex(item => isObject(item) && (item.id === key || item.merchantReference === key))
      : -1;
    if (index === -1) records.push(transaction);
    else records[index] = transaction;
    writeJsonArray(this.transactionsPath, records);
    return transaction;
  }

  async findTransaction(query) {
    const normalized = query || {};
    if (!normalized.orderTrackingId && !normalized.merchantReference) return undefined;
    return (await this.listTransactions()).find(transaction => matchesTransaction(transaction, normalized));
  }

  async findTransactionByIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) return null;
    const found = (await this.listTransactions()).find(transaction =>
      isObject(transaction) && transaction.idempotencyKey === idempotencyKey);
    return found || null;
  }

  async listCommunicationEvents() {
    return readJsonArray(this.communicationEventsPath);
  }

  async saveCommunicationEvent(event) {
    if (!isObject(event)) return null;
    const events = await this.listCommunicationEvents();
    events.push(event);
    writeJsonArray(this.communicationEventsPath, events);
    return event;
  }

  async close() {
    return undefined;
  }
}

// Resolve the store adapter. Postgres is opt-in and never silently replaces
// the file store: it requires an explicit opt-in or a DATABASE_URL.
function createStore(options = {}) {
  const requested = String(
    options.store
    || process.env.PAYMENT_STORE
    || (process.env.DATABASE_URL ? 'postgres' : 'file')
  ).toLowerCase();

  if (requested === 'postgres') {
    if (!process.env.DATABASE_URL && !options.pool) {
      throw new Error('PAYMENT_STORE=postgres requires DATABASE_URL (or an injected pool).');
    }
    const { PostgresStore } = require('./store-postgres');
    return new PostgresStore({ dataDir: options.dataDir, pool: options.pool });
  }

  if (requested === 'file') return new FileStore(options.dataDir);
  throw new Error(`Unknown PAYMENT_STORE "${requested}". Use "file" or "postgres".`);
}

module.exports = {
  DEFAULT_DATA_DIR,
  TRANSACTIONS_FILE,
  COMMUNICATION_EVENTS_FILE,
  FileStore,
  createStore,
};
