create or replace function public.ai_core_get_worker_shared_secret()
returns text
language sql
security definer
set search_path = ''
as $function$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'ai_core_worker_shared_secret'
  limit 1;
$function$;

revoke all on function public.ai_core_get_worker_shared_secret() from public, anon, authenticated;
grant execute on function public.ai_core_get_worker_shared_secret() to service_role;