-- Prevent duplicate durable audit rows when an execution is retried.
-- Preflight deliberately fails instead of deleting or rewriting existing audit evidence.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE execution_id IS NOT NULL
    GROUP BY organization_id, execution_id, type
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'audit_logs contains duplicate (organization_id, execution_id, type) keys; review and reconcile duplicates before applying idempotency index';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_execution_idempotency_key
  ON public.audit_logs (organization_id, execution_id, type);
