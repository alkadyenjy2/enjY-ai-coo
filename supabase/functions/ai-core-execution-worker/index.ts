import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const appUrl = "https://enj-y-ai-coo.vercel.app";

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const callerKey = req.headers.get("apikey") || "";
  if (!secretKey || callerKey !== secretKey) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: claimed, error: claimError } = await supabase.rpc("ai_core_job_claim", { p_visibility_seconds: 300 });
  if (claimError) return Response.json({ error: claimError.message }, { status: 500 });
  if (!claimed || claimed.length === 0) return Response.json({ processed: false, reason: "empty" });

  const job = claimed[0];
  const payload = { execution_id: job.job_id, organization_id: job.organization_id };
  const timestamp = Date.now();
  const body = JSON.stringify(payload);
  const signature = await hmacHex(secretKey, `${timestamp}.${body}`);

  const response = await fetch(`${appUrl}/api/executions/worker`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-jarvis-internal": "worker",
      "x-jarvis-worker-timestamp": String(timestamp),
      "x-jarvis-worker-signature": signature,
      "x-jarvis-worker-user-id": String(job.user_id),
    },
    body,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return Response.json({ processed: false, retry: true, messageId: job.message_id, status: response.status, result }, { status: 502 });
  }

  const { error: deleteError } = await supabase.rpc("ai_core_job_delete_message", { p_message_id: job.message_id });
  if (deleteError) return Response.json({ processed: true, deletePending: true, messageId: job.message_id, error: deleteError.message, result }, { status: 500 });

  return Response.json({ processed: true, messageId: job.message_id, result });
});