create or replace function public.ai_core_browser_job_create_enqueue(
  p_organization_id uuid,
  p_user_id uuid,
  p_command text,
  p_input_payload jsonb,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_job public.ai_core_jobs%rowtype;
  v_existing public.ai_core_jobs%rowtype;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    raise exception 'AI_CORE_BROWSER_AUTH_REQUIRED';
  end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id=p_organization_id and user_id=p_user_id
  ) then
    raise exception 'AI_CORE_BROWSER_ORGANIZATION_FORBIDDEN';
  end if;
  select * into v_existing from public.ai_core_jobs
    where organization_id=p_organization_id and idempotency_key=p_idempotency_key
    order by created_at desc limit 1;
  if found then return v_existing.id; end if;
  insert into public.ai_core_jobs(
    organization_id,user_id,command,input_payload,idempotency_key,status,current_step,state_history
  ) values (
    p_organization_id,p_user_id,p_command,p_input_payload,p_idempotency_key,
    'QUEUED','RECEIVED',jsonb_build_array('RECEIVED','QUEUED')
  ) returning * into v_job;
  perform public.ai_core_browser_job_enqueue(v_job.id);
  return v_job.id;
end;
$$;
revoke all on function public.ai_core_browser_job_create_enqueue(uuid,uuid,text,jsonb,text) from public;
grant execute on function public.ai_core_browser_job_create_enqueue(uuid,uuid,text,jsonb,text) to authenticated,service_role;