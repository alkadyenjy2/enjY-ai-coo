create extension if not exists pgmq;
do  begin if not exists (select 1 from pgmq.metrics_all() where queue_name='ai-core-browser-executions') then perform pgmq.create('ai-core-browser-executions'); end if; end ;
create or replace function public.ai_core_browser_job_enqueue(p_job_id uuid)
returns bigint language plpgsql security definer set search_path to '' as $$
declare v_job public.ai_core_jobs%rowtype; v_message_id bigint;
begin
 select * into v_job from public.ai_core_jobs where id=p_job_id for update;
 if not found then raise exception 'AI_CORE_JOB_NOT_FOUND'; end if;
 select * into v_message_id from pgmq.send('ai-core-browser-executions', jsonb_build_object('job_id',v_job.id,'organization_id',v_job.organization_id,'user_id',v_job.user_id));
 update public.ai_core_jobs set status='QUEUED',current_step='QUEUED',updated_at=now(),state_history=case when jsonb_typeof(state_history)='array' and state_history ? 'QUEUED' then state_history else state_history || jsonb_build_array('QUEUED') end where id=p_job_id;
 return v_message_id;
end; $$;
create or replace function public.ai_core_browser_job_claim(p_visibility_seconds integer default 300)
returns table(message_id bigint,job_id uuid,organization_id uuid,user_id uuid,command text,input_payload jsonb)
language plpgsql security definer set search_path to '' as $$
declare msg record; job public.ai_core_jobs%rowtype; next_retry integer;
begin
 select * into msg from pgmq.read('ai-core-browser-executions',greatest(60,least(p_visibility_seconds,900)),1);
 if not found then return; end if;
 select * into job from public.ai_core_jobs where id=(msg.message->>'job_id')::uuid for update;
 if not found then perform pgmq.delete('ai-core-browser-executions',msg.msg_id); return; end if;
 if coalesce(job.input_payload->>'kind','') <> 'browser_execution' then return; end if;
 next_retry:=job.retry_count+1;
 if next_retry>job.max_retries then
  update public.ai_core_jobs set status='FAILED',current_step='FAILED',retry_count=next_retry,error_code='MAX_RETRIES_EXCEEDED',error_message='Browser durable execution exhausted its retry budget.',completed_at=now(),updated_at=now(),state_history=state_history||jsonb_build_array('FAILED') where id=job.id;
  perform pgmq.archive('ai-core-browser-executions',msg.msg_id); return;
 end if;
 update public.ai_core_jobs set status='RUNNING',current_step='EXECUTING',retry_count=next_retry,locked_at=now(),updated_at=now(),state_history=state_history||jsonb_build_array('RUNNING') where id=job.id;
 message_id:=msg.msg_id; job_id:=job.id; organization_id:=job.organization_id; user_id:=job.user_id; command:=job.command; input_payload:=job.input_payload; return next;
end; $$;
create or replace function public.ai_core_browser_job_delete_message(p_message_id bigint)
returns boolean language sql security definer set search_path to '' as $$ select pgmq.delete('ai-core-browser-executions',p_message_id); $$;
revoke all on function public.ai_core_browser_job_enqueue(uuid) from public;
revoke all on function public.ai_core_browser_job_claim(integer) from public;
revoke all on function public.ai_core_browser_job_delete_message(bigint) from public;
grant execute on function public.ai_core_browser_job_enqueue(uuid) to authenticated,service_role;
grant execute on function public.ai_core_browser_job_claim(integer) to service_role;
grant execute on function public.ai_core_browser_job_delete_message(bigint) to service_role;


