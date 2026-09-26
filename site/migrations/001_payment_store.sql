-- Milky payment store schema (idempotent, safe to run on every start).
-- Source of truth for the full record is data.jsonb; the scalar columns are
-- indexed projections used for lookups and never lose fields on evolution.

CREATE TABLE IF NOT EXISTS payment_transactions (
    record_key                 text PRIMARY KEY,
    record_id                  text,
    merchant_reference         text,
    seq                        bigserial,
    idempotency_key            text,
    pesapal_order_tracking_id  text,
    plan                       text,
    billing_term               text,
    amount                     numeric,
    currency                   text,
    status                     text,
    payment_status             text,
    status_description         text,
    callback_status            text,
    callback_received          boolean,
    callback_received_at       timestamptz,
    ipn_received               boolean,
    ipn_received_at            timestamptz,
    paid_at                    timestamptz,
    last_status_source         text,
    notification_sent_at       timestamptz,
    created_at                 timestamptz,
    updated_at                 timestamptz,
    data                       jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_merchant_reference_uidx
    ON payment_transactions (merchant_reference) WHERE merchant_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_idempotency_key_uidx
    ON payment_transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_transactions_tracking_idx
    ON payment_transactions (pesapal_order_tracking_id);

CREATE INDEX IF NOT EXISTS payment_transactions_record_id_idx
    ON payment_transactions (record_id);

CREATE INDEX IF NOT EXISTS payment_transactions_status_idx
    ON payment_transactions (status);

CREATE TABLE IF NOT EXISTS communication_events (
    event_key      text PRIMARY KEY,
    seq            bigserial,
    event_type     text,
    event_name     text,
    provider       text,
    status         text,
    transaction_id text,
    created_at     timestamptz,
    data           jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS communication_events_transaction_idx
    ON communication_events (transaction_id);

CREATE INDEX IF NOT EXISTS communication_events_created_idx
    ON communication_events (created_at);
