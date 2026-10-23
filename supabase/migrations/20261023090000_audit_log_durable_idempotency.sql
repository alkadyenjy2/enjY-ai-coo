-- Durable idempotency for one operational audit row per organization/execution.
-- The application supplies a stable execution ID as idempotency_key. NULL keys on
-- older and non-operational audit events remain allowed by PostgreSQL unique indexes.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_org_idempotency_key_uidx
  ON public.audit_logs (organization_id, idempotency_key);
