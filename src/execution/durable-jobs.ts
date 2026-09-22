import { createClient } from "@supabase/supabase-js";

export interface DurableJobInput {
  organizationId: string;
  userId: string;
  command: string;
  inputPayload?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface DurableJob {
  id: string;
  organization_id: string;
  user_id: string;
  command: string;
  status: string;
  current_step: string;
  state_history: string[];
  input_payload: Record<string, unknown>;
  execution_result: unknown;
  evidence_proof: string | null;
  approval_status: string;
  retry_count: number;
  max_retries: number;
  error_code: string | null;
  error_message: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function getConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("DURABLE_EXECUTION_SUPABASE_CONFIG_MISSING");
  return { url, key };
}

function adminClient() {
  const { url, key } = getConfig();
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function createDurableJob(input: DurableJobInput): Promise<DurableJob> {
  const client = adminClient();
  const { data, error } = await client
    .from("ai_core_jobs")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      command: input.command,
      input_payload: input.inputPayload || {},
      idempotency_key: input.idempotencyKey || null,
      status: "QUEUED",
      current_step: "RECEIVED",
      state_history: ["RECEIVED", "QUEUED"],
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505" && input.idempotencyKey) {
      const existing = await getDurableJobByIdempotency(input.organizationId, input.idempotencyKey);
      if (existing) return existing;
    }
    throw new Error(`DURABLE_JOB_CREATE_FAILED:${error.message}`);
  }
  return data as DurableJob;
}

export async function getDurableJob(id: string, organizationId: string): Promise<DurableJob | null> {
  const client = adminClient();
  const { data, error } = await client
    .from("ai_core_jobs")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(`DURABLE_JOB_READ_FAILED:${error.message}`);
  return (data as DurableJob | null) || null;
}

async function getDurableJobByIdempotency(organizationId: string, idempotencyKey: string): Promise<DurableJob | null> {
  const client = adminClient();
  const { data, error } = await client
    .from("ai_core_jobs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) throw new Error(`DURABLE_JOB_IDEMPOTENCY_LOOKUP_FAILED:${error.message}`);
  return (data as DurableJob | null) || null;
}

export async function updateDurableJob(
  id: string,
  patch: Partial<Pick<DurableJob, "status" | "current_step" | "state_history" | "execution_result" | "evidence_proof" | "approval_status" | "error_code" | "error_message" | "completed_at">>,
): Promise<DurableJob> {
  const client = adminClient();
  const next: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await client.from("ai_core_jobs").update(next).eq("id", id).select("*").single();
  if (error) throw new Error(`DURABLE_JOB_UPDATE_FAILED:${error.message}`);
  return data as DurableJob;
}
