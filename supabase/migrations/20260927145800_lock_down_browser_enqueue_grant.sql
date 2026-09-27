revoke all on function public.ai_core_browser_job_enqueue(uuid) from anon, authenticated;
grant execute on function public.ai_core_browser_job_enqueue(uuid) to service_role;
