-- Durable idempotency for operational audit events.
-- NULL is allowed for existing non-operational event types; the unique index
-- only constrains rows that explicitly carry a key.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_idempotency_key_uidx
  ON public.audit_logs (idempotency_key);

NOTIFY pgrst, 'reload schema';
