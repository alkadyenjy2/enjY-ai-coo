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
  select * into v_job
  from public.ai_core_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'AI_CORE_JOB_NOT_FOUND';
  end if;

  if v_job.user_id <> (select auth.uid()) and current_user <> 'service_role' then
    raise exception 'AI_CORE_JOB_FORBIDDEN';
  end if;

  select * into v_message_id
  from pgmq.send(
    'ai-core-executions',
    jsonb_build_object('job_id', v_job.id, 'organization_id', v_job.organization_id, 'user_id', v_job.user_id)
  );

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

create or replace function public.ai_core_job_claim(p_visibility_seconds integer default 300)
returns table(message_id bigint, job_id uuid, organization_id uuid, user_id uuid, command text, input_payload jsonb)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  msg record;
  job public.ai_core_jobs%rowtype;
begin
  if current_user <> 'service_role' then
    raise exception 'AI_CORE_WORKER_FORBIDDEN';
  end if;

  select * into msg from pgmq.read('ai-core-executions', greatest(30, least(p_visibility_seconds, 900)), 1);
  if not found then return; end if;

  select * into job from public.ai_core_jobs where id = (msg.message->>'job_id')::uuid for update;
  if not found then
    perform pgmq.delete('ai-core-executions', msg.msg_id);
    return;
  end if;

  update public.ai_core_jobs
  set status = 'RUNNING',
      current_step = 'EXECUTING',
      locked_at = now(),
      updated_at = now(),
      state_history = state_history || jsonb_build_array('RUNNING')
  where id = job.id;

  message_id := msg.msg_id;
  job_id := job.id;
  organization_id := job.organization_id;
  user_id := job.user_id;
  command := job.command;
  input_payload := job.input_payload;
  return next;
end;
$function$;

revoke all on function public.ai_core_job_claim(integer) from public, anon, authenticated;
grant execute on function public.ai_core_job_claim(integer) to service_role;

create or replace function public.ai_core_job_delete_message(p_message_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $function$
  select pgmq.delete('ai-core-executions', p_message_id);
$function$;

revoke all on function public.ai_core_job_delete_message(bigint) from public, anon, authenticated;
grant execute on function public.ai_core_job_delete_message(bigint) to service_role;
