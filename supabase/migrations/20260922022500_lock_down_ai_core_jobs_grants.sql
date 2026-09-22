revoke all on table public.ai_core_jobs from anon, authenticated;
grant select, insert, update on table public.ai_core_jobs to authenticated;
grant all on table public.ai_core_jobs to service_role;
