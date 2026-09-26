// PostgreSQL-backed payment store.
//
// Same async interface as FileStore, so payment routes do not care which
// adapter is configured. The full record is stored as jsonb (data) so no field
// is ever dropped by schema drift; scalar columns are indexed projections.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_FILES = ['001_payment_store.sql'];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function transactionRecordKey(record) {
  return String(record.merchantReference || record.id || crypto.randomUUID());
}

function splitStatements(sql) {
  // Strip line comments first so a ';' that appears inside a comment cannot
  // split a statement mid-way.
  const withoutComments = sql.replace(/--[^\n]*/g, '');
  return withoutComments
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
}

const TRANSACTION_UPSERT_SQL = `
INSERT INTO payment_transactions (
  record_key, record_id, merchant_reference, idempotency_key, pesapal_order_tracking_id,
  plan, billing_term, amount, currency, status, payment_status, status_description,
  callback_status, callback_received, callback_received_at, ipn_received, ipn_received_at,
  paid_at, last_status_source, notification_sent_at, created_at, updated_at, data
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
  $14, $15::timestamptz, $16, $17::timestamptz, $18::timestamptz,
  $19, $20::timestamptz, $21::timestamptz, $22::timestamptz, $23::jsonb
)
ON CONFLICT (record_key) DO UPDATE SET
  record_id = EXCLUDED.record_id,
  merchant_reference = EXCLUDED.merchant_reference,
  idempotency_key = EXCLUDED.idempotency_key,
  pesapal_order_tracking_id = EXCLUDED.pesapal_order_tracking_id,
  plan = EXCLUDED.plan,
  billing_term = EXCLUDED.billing_term,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  status_description = EXCLUDED.status_description,
  callback_status = EXCLUDED.callback_status,
  callback_received = EXCLUDED.callback_received,
  callback_received_at = EXCLUDED.callback_received_at,
  ipn_received = EXCLUDED.ipn_received,
  ipn_received_at = EXCLUDED.ipn_received_at,
  paid_at = EXCLUDED.paid_at,
  last_status_source = EXCLUDED.last_status_source,
  notification_sent_at = EXCLUDED.notification_sent_at,
  created_at = COALESCE(payment_transactions.created_at, EXCLUDED.created_at),
  updated_at = COALESCE(EXCLUDED.updated_at, payment_transactions.updated_at),
  data = EXCLUDED.data
RETURNING data`;

const EVENT_INSERT_SQL = `
INSERT INTO communication_events (
  event_key, event_type, event_name, provider, status, transaction_id, created_at, data
) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::jsonb)
ON CONFLICT (event_key) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status
RETURNING data`;

class PostgresStore {
  constructor({ pool, dataDir } = {}) {
    this.type = 'postgres';
    this.dataDir = dataDir;
    this.ownsPool = false;
    this.pool = pool || this.createPool();
  }

  createPool() {
    const { Pool } = require('pg');
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Postgres store requires DATABASE_URL.');
    this.ownsPool = true;
    const configured = process.env.DATABASE_SSL;
    let ssl;
    if (configured === 'false' || configured === '0') ssl = false;
    else if (configured === 'true' || configured === '1') ssl = { rejectUnauthorized: false };
    else {
      try {
        const host = new URL(connectionString).hostname;
        ssl = (host === 'localhost' || host === '127.0.0.1') ? false : { rejectUnauthorized: false };
      } catch {
        ssl = false;
      }
    }
    return new Pool({ connectionString, ssl, max: 5 });
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async migrate() {
    const applied = [];
    for (const file of MIGRATION_FILES) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const statement of splitStatements(sql)) await this.query(statement);
      applied.push(file);
    }
    const backfill = await this.importFromFiles();
    return { adapter: 'postgres', applied, backfill };
  }

  // One-shot, idempotent import of any records still held in JSON files.
  async importFromFiles() {
    if (!this.dataDir) return { transactions: 0, events: 0 };
    const { FileStore } = require('./store');
    const fileStore = new FileStore(this.dataDir);
    const records = await fileStore.listTransactions();
    const events = await fileStore.listCommunicationEvents();
    if (!records.length && !events.length) return { transactions: 0, events: 0 };
    let transactions = 0;
    for (const record of records) {
      if (await this.saveTransaction(record)) transactions += 1;
    }
    let written = 0;
    for (const event of events) {
      if (await this.saveCommunicationEvent(event)) written += 1;
    }
    return { transactions, events: written };
  }

  async saveTransaction(transaction) {
    if (!isObject(transaction)) return null;
    await this.query(TRANSACTION_UPSERT_SQL, [
      transactionRecordKey(transaction),
      transaction.id || transaction.merchantReference || null,
      transaction.merchantReference || transaction.id || null,
      transaction.idempotencyKey || null,
      transaction.pesapalOrderTrackingId || transaction.orderTrackingId || null,
      transaction.plan || transaction.planId || null,
      transaction.commitment || null,
      Number.isFinite(Number(transaction.amount)) ? Number(transaction.amount) : null,
      transaction.currency || null,
      transaction.status || null,
      transaction.paymentStatus || null,
      transaction.statusDescription || null,
      transaction.callbackStatus || null,
      typeof transaction.callbackReceived === 'boolean' ? transaction.callbackReceived : null,
      transaction.callbackReceivedAt || null,
      typeof transaction.ipnReceived === 'boolean' ? transaction.ipnReceived : null,
      transaction.ipnReceivedAt || null,
      transaction.paidAt || null,
      transaction.lastStatusSource || null,
      transaction.notificationSentAt || null,
      transaction.createdAt || null,
      transaction.updatedAt || null,
      JSON.stringify(transaction),
    ]);
    return transaction;
  }

  async listTransactions() {
    const result = await this.query('SELECT data FROM payment_transactions ORDER BY seq ASC');
    return result.rows.map(row => row.data).filter(isObject);
  }

  async findTransaction(query) {
    const normalized = query || {};
    const orderTrackingId = normalized.orderTrackingId || null;
    const merchantReference = normalized.merchantReference || null;
    if (!orderTrackingId && !merchantReference) return undefined;
    const result = await this.query(
      `SELECT data FROM payment_transactions
       WHERE ($1::text IS NOT NULL AND pesapal_order_tracking_id = $1)
          OR ($2::text IS NOT NULL AND (record_key = $2 OR record_id = $2))
       ORDER BY seq ASC
       LIMIT 1`,
      [orderTrackingId, merchantReference]);
    return result.rows[0] ? result.rows[0].data : undefined;
  }

  async findTransactionByIdempotencyKey(idempotencyKey) {
    if (!idempotencyKey) return null;
    const result = await this.query(
      'SELECT data FROM payment_transactions WHERE idempotency_key = $1 LIMIT 1',
      [idempotencyKey]);
    return (result.rows[0] && result.rows[0].data) || null;
  }

  async listCommunicationEvents() {
    const result = await this.query('SELECT data FROM communication_events ORDER BY seq ASC');
    return result.rows.map(row => row.data).filter(isObject);
  }

  async saveCommunicationEvent(event) {
    if (!isObject(event)) return null;
    await this.query(EVENT_INSERT_SQL, [
      String(event.id || crypto.randomUUID()),
      event.type || null,
      event.event || null,
      event.provider || null,
      event.status || null,
      event.transactionId || null,
      event.createdAt || null,
      JSON.stringify(event),
    ]);
    return event;
  }

  async close() {
    if (!this.ownsPool) return;
    if (typeof this.pool.end === 'function') await this.pool.end();
    else if (typeof this.pool.close === 'function') await this.pool.close();
  }
}

module.exports = {
  PostgresStore,
  TRANSACTION_UPSERT_SQL,
  EVENT_INSERT_SQL,
  splitStatements,
  isObject,
};
