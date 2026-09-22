create or replace function public.ai_core_job_claim(p_visibility_seconds integer default 300)
returns table(message_id bigint, job_id uuid, organization_id uuid, user_id uuid, command text, input_payload jsonb)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  msg record;
  job public.ai_core_jobs%rowtype;
  next_retry integer;
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

  next_retry := job.retry_count + 1;
  if next_retry > job.max_retries then
    update public.ai_core_jobs
    set status = 'FAILED',
        current_step = 'FAILED',
        retry_count = next_retry,
        error_code = 'MAX_RETRIES_EXCEEDED',
        error_message = 'Durable execution exhausted its retry budget.',
        completed_at = now(),
        updated_at = now(),
        state_history = state_history || jsonb_build_array('FAILED')
    where id = job.id;
    perform pgmq.archive('ai-core-executions', msg.msg_id);
    return;
  end if;

  update public.ai_core_jobs
  set status = 'RUNNING',
      current_step = 'EXECUTING',
      retry_count = next_retry,
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

select cron.schedule(
  'ai-core-execution-worker',
  '*/10 * * * * *',
  $$
    select net.http_post(
      url := 'https://aislifqpskbduzvvbepz.supabase.co/functions/v1/ai-core-execution-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_core_worker_api_key')
      ),
      body := jsonb_build_object('source', 'pg_cron')
    ) as request_id;
  $$
);