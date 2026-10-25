-- Durable idempotency for one operational audit row per organization/execution.
-- Fail closed if existing rows would collide; never delete or rewrite audit evidence.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.audit_logs
    WHERE idempotency_key IS NOT NULL
    GROUP BY organization_id, idempotency_key
    HAVING COUNT(*) > 1
  ) OR EXISTS (
    SELECT 1
    FROM public.audit_logs
    WHERE type = 'ai_core_execution'
      AND execution_id IS NOT NULL
      AND idempotency_key IS NULL
    GROUP BY organization_id, execution_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'audit_logs has duplicate keys that prevent safe idempotency backfill; reconcile existing audit evidence before retrying migration';
  END IF;
END $$;

-- Backfill historical operational rows so the first retry after rollout cannot
-- create a second row for an execution that was already recorded before migration.
UPDATE public.audit_logs
SET idempotency_key = execution_id
WHERE type = 'ai_core_execution'
  AND execution_id IS NOT NULL
  AND idempotency_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_org_idempotency_key_uidx
  ON public.audit_logs (organization_id, idempotency_key);
