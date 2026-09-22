create extension if not exists pgmq;
create extension if not exists pg_cron;

create table if not exists public.ai_core_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  command text not null,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','WAITING_FOR_APPROVAL','EXECUTED','VERIFIED','COMPLETED','FAILED','REJECTED')),
  current_step text not null default 'RECEIVED',
  state_history jsonb not null default '["RECEIVED"]'::jsonb,
  input_payload jsonb not null default '{}'::jsonb,
  execution_result jsonb,
  evidence_proof text,
  approval_status text not null default 'AUTO_APPROVED' check (approval_status in ('AUTO_APPROVED','WAITING','APPROVED','REJECTED')),
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 3 check (max_retries >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index if not exists ai_core_jobs_org_created_idx on public.ai_core_jobs (organization_id, created_at desc);
create index if not exists ai_core_jobs_ready_idx on public.ai_core_jobs (status, available_at) where status in ('QUEUED','RUNNING');
create index if not exists ai_core_jobs_user_idx on public.ai_core_jobs (user_id, created_at desc);

alter table public.ai_core_jobs enable row level security;

drop policy if exists ai_core_jobs_member_select on public.ai_core_jobs;
create policy ai_core_jobs_member_select on public.ai_core_jobs
for select to authenticated
using (is_org_member(organization_id));

drop policy if exists ai_core_jobs_member_insert on public.ai_core_jobs;
create policy ai_core_jobs_member_insert on public.ai_core_jobs
for insert to authenticated
with check (user_id = auth.uid() and is_org_member(organization_id));

drop policy if exists ai_core_jobs_member_update on public.ai_core_jobs;
create policy ai_core_jobs_member_update on public.ai_core_jobs
for update to authenticated
using (user_id = auth.uid() and is_org_member(organization_id))
with check (user_id = auth.uid() and is_org_member(organization_id));

select pgmq.create('ai-core-executions') where not exists (
  select 1 from pgmq.list_queues() where queue_name = 'ai-core-executions'
);