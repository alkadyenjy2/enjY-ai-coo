-- Harden browser job creation RPC: caller executes under invoker privileges.
-- Existing authenticated-member RLS policies remain the authorization boundary.
alter function public.ai_core_browser_job_create_enqueue(uuid, uuid, text, jsonb, text) security invoker;
