// Store contract tests. Every case runs against BOTH adapters:
//   - FileStore        (JSON files)
//   - PostgresStore    (real PostgreSQL via PGlite, in-process)
// The tests exercise the actual implementations (no mocks), including a
// restart/reinitialization durability check.
'use strict';

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { FileStore } = require('./store');
const { PostgresStore } = require('./store-postgres');
const paymentLib = require('./payment-lib');

const PGLITE_PATH = path.resolve(__dirname, 'node_modules', '@electric-sql', 'pglite');

function tempDir(label) {
  const dir = path.join(os.tmpdir(), `milky-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function removeQuietly(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

function sampleTransaction(overrides = {}) {
  return {
    id: 'TX-1',
    merchantReference: 'TX-1',
    pesapalOrderTrackingId: 'track-1',
    idempotencyKey: 'idem-1',
    plan: 'spark',
    commitment: 'monthly',
    amount: 20,
    currency: 'USD',
    status: 'pending',
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    ...overrides,
  };
}

// One shared Postgres instance for the adapter tests. PGlite startup is ~25s
// on first load (WASM); reusing a single instance with per-test truncation
// keeps the suite fast while still exercising the real SQL adapter.
let sharedPg = null;

async function getSharedPg() {
  if (sharedPg) return sharedPg;
  const { PGlite } = require(PGLITE_PATH);
  const db = await PGlite.create();
  const store = new PostgresStore({ pool: db });
  await store.migrate();
  sharedPg = { db, store };
  return sharedPg;
}

async function resetPg() {
  if (!sharedPg) return;
  await sharedPg.db.query('TRUNCATE payment_transactions, communication_events RESTART IDENTITY');
}

async function openStore(kind) {
  if (kind === 'file') {
    const dir = tempDir(kind);
    const store = new FileStore(dir);
    await store.migrate();
    return { store, dispose: () => removeQuietly(dir) };
  }
  const { store } = await getSharedPg();
  await resetPg();
  return { store, dispose: () => resetPg() };
}

after(async () => {
  if (sharedPg) {
    await sharedPg.db.close();
    sharedPg = null;
  }
});

const KINDS = ['file', 'postgres'];

describe('payment store: transactions', () => {
  for (const kind of KINDS) {
    it(`[${kind}] create, read, update, and single-record idempotent upsert`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        await store.saveTransaction(sampleTransaction());
        const byRef = await store.findTransaction({ merchantReference: 'TX-1' });
        assert.equal(byRef.merchantReference, 'TX-1');
        assert.equal(byRef.status, 'pending');
        const byTrack = await store.findTransaction({ orderTrackingId: 'track-1' });
        assert.equal(byTrack.pesapalOrderTrackingId, 'track-1');

        // Re-save the same reference with new data -> still one record.
        await store.saveTransaction(sampleTransaction({ status: 'success', paymentStatus: 'COMPLETED' }));
        const all = await store.listTransactions();
        assert.equal(all.length, 1);
        assert.equal(all[0].status, 'success');
        assert.equal(all[0].paymentStatus, 'COMPLETED');
      } finally {
        dispose();
      }
    });

    it(`[${kind}] pending -> success/failed/cancelled transitions`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        await store.saveTransaction(sampleTransaction());
        const pending = await store.findTransaction({ merchantReference: 'TX-1' });
        assert.equal(pending.status, 'pending');

        const done = saveTransition(store, pending, 'Completed');
        assert.equal((await done).status, 'success');

        const failedRecord = sampleTransaction({ id: 'TX-2', merchantReference: 'TX-2', pesapalOrderTrackingId: 'track-2', idempotencyKey: 'idem-2' });
        assert.equal((await saveTransition(store, failedRecord, 'Failed')).status, 'failed');
        const cancelledRecord = sampleTransaction({ id: 'TX-3', merchantReference: 'TX-3', pesapalOrderTrackingId: 'track-3', idempotencyKey: 'idem-3' });
        assert.equal((await saveTransition(store, cancelledRecord, 'Cancelled')).status, 'cancelled');
      } finally {
        dispose();
      }
    });

    it(`[${kind}] unknown transaction lookups are null-safe`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        assert.equal(await store.findTransaction({ merchantReference: 'NOPE' }), undefined);
        assert.equal(await store.findTransaction({ orderTrackingId: 'NOPE' }), undefined);
        assert.equal(await store.findTransactionByIdempotencyKey('NOPE'), null);
        assert.equal(await store.findTransaction({}), undefined);
        assert.equal(await store.findTransaction(null), undefined);
      } finally {
        dispose();
      }
    });

    it(`[${kind}] idempotency-key lookup works`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        await store.saveTransaction(sampleTransaction());
        const found = await store.findTransactionByIdempotencyKey('idem-1');
        assert.equal(found.merchantReference, 'TX-1');
      } finally {
        dispose();
      }
    });
  }
});

async function saveTransition(store, record, description) {
  const updated = paymentLib.applyProviderStatus(record, { payment_status_description: description }, 'ipn');
  await store.saveTransaction(updated);
  return store.findTransaction({ merchantReference: record.merchantReference });
}

describe('payment store: callback/IPN metadata', () => {
  for (const kind of KINDS) {
    it(`[${kind}] callbackReceivedAt is first-seen across duplicate callbacks`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        const first = paymentLib.applyCallbackReceipt(sampleTransaction(), '2026-09-25T16:55:29.073Z');
        await store.saveTransaction({ ...sampleTransaction(), ...first });

        // Duplicate callback later with a newer timestamp -> original is kept.
        const loaded = await store.findTransaction({ merchantReference: 'TX-1' });
        const duplicate = { ...loaded, ...paymentLib.applyCallbackReceipt(loaded, '2026-09-25T17:30:00.000Z') };
        await store.saveTransaction(duplicate);
        const after = await store.findTransaction({ merchantReference: 'TX-1' });
        assert.equal(after.callbackReceived, true);
        assert.equal(after.callbackReceivedAt, '2026-09-25T16:55:29.073Z');
      } finally {
        dispose();
      }
    });

    it(`[${kind}] ipn/callback metadata and paidAt survive status transitions and duplicates`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        let record = sampleTransaction();
        record.ipnReceived = true;
        record.ipnReceivedAt = '2026-09-25T16:55:17.249Z';

        // IPN completes the payment.
        record = paymentLib.applyProviderStatus(record, { payment_status_description: 'Completed' }, 'ipn');
        record.paidAt = '2026-09-25T16:55:17.251Z';
        await store.saveTransaction(record);

        // Duplicate callback + duplicate IPN via the real transition helper.
        for (const source of ['callback', 'ipn', 'callback', 'ipn']) {
          const loaded = await store.findTransaction({ merchantReference: 'TX-1' });
          const next = paymentLib.applyProviderStatus(loaded, { payment_status_description: 'Completed' }, source);
          await store.saveTransaction(next);
        }
        const final = await store.findTransaction({ merchantReference: 'TX-1' });
        assert.equal(final.status, 'success');
        assert.equal(final.ipnReceived, true);
        assert.equal(final.ipnReceivedAt, '2026-09-25T16:55:17.249Z');
        assert.equal(final.paidAt, '2026-09-25T16:55:17.251Z');
      } finally {
        dispose();
      }
    });
  }
});

describe('payment store: communication events', () => {
  for (const kind of KINDS) {
    it(`[${kind}] persists and lists communication events`, async () => {
      const { store, dispose } = await openStore(kind);
      try {
        const event = {
          id: 'payment-confirmation-TX-1',
          type: 'transactional',
          event: 'payment_completed',
          provider: 'brevo',
          recipient: 'a@example.com',
          transactionId: 'TX-1',
          status: 'skipped',
          reason: 'Brevo is not configured.',
          createdAt: '2026-09-25T16:31:29.448Z',
        };
        await store.saveCommunicationEvent(event);
        const events = await store.listCommunicationEvents();
        assert.equal(events.length, 1);
        assert.equal(events[0].transactionId, 'TX-1');
        assert.equal(events[0].status, 'skipped');
        assert.equal(events[0].reason, 'Brevo is not configured.');
      } finally {
        dispose();
      }
    });
  }
});

describe('payment store: restart/reinitialization durability', () => {
  for (const kind of KINDS) {
    it(`[${kind}] retains data after close and reopen`, async () => {
      const dir = tempDir('restart');
      try {
        if (kind === 'file') {
          const s1 = new FileStore(dir);
          await s1.saveTransaction(sampleTransaction());
          const s2 = new FileStore(dir);
          const got = await s2.findTransaction({ merchantReference: 'TX-1' });
          assert.equal(got.status, 'pending');
        } else {
          const { PGlite } = require(PGLITE_PATH);
          const db1 = await PGlite.create({ dataDir: dir });
          const st1 = new PostgresStore({ pool: db1 });
          await st1.migrate();
          await st1.saveTransaction(sampleTransaction());
          await db1.close();

          // Reopen the same data directory (simulates a process restart).
          const db2 = await PGlite.create({ dataDir: dir });
          const st2 = new PostgresStore({ pool: db2 });
          await st2.migrate();
          const got = await st2.findTransaction({ merchantReference: 'TX-1' });
          assert.equal(got.status, 'pending');
          assert.equal(got.amount, 20);
          await db2.close();
        }
      } finally {
        removeQuietly(dir);
      }
    });
  }
});