create or replace function public.ai_core_job_enqueue(p_job_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_job public.ai_core_jobs%rowtype;
  v_message_id bigint;
begin
  select * into v_job from public.ai_core_jobs where id = p_job_id for update;
  if not found then raise exception 'AI_CORE_JOB_NOT_FOUND'; end if;
  if v_job.user_id <> (select auth.uid()) and current_user not in ('service_role', 'postgres') then
    raise exception 'AI_CORE_JOB_FORBIDDEN';
  end if;
  select * into v_message_id from pgmq.send('ai-core-executions', jsonb_build_object('job_id', v_job.id, 'organization_id', v_job.organization_id, 'user_id', v_job.user_id));
  update public.ai_core_jobs
  set status = 'QUEUED', current_step = 'QUEUED', updated_at = now(),
      state_history = case
        when jsonb_typeof(state_history) = 'array' and state_history ? 'QUEUED' then state_history
        else state_history || jsonb_build_array('QUEUED')
      end
  where id = p_job_id;
  return v_message_id;
end;
$function$;

revoke all on function public.ai_core_job_enqueue(uuid) from public, anon;
grant execute on function public.ai_core_job_enqueue(uuid) to authenticated, service_role;