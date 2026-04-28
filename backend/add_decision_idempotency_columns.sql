-- Decision Vault idempotency hardening migration
-- Safe to run multiple times on PostgreSQL.

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS idempotency_payload_hash VARCHAR(64);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_decisions_user_idempotency'
    ) THEN
        ALTER TABLE decisions
        ADD CONSTRAINT uq_decisions_user_idempotency
        UNIQUE (user_id, idempotency_key);
    END IF;
END $$;
