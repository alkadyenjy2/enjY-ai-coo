import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3";

const invocationKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
const invocationKey = invocationKeys.default || Deno.env.get("SUPABASE_ANON_KEY") || "";
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
const appUrl = "https://enj-y-ai-coo.vercel.app";

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    if (!invocationKey || (req.headers.get("apikey") || "") !== invocationKey) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const secretRows = await sql`select decrypted_secret from vault.decrypted_secrets where name = 'ai_core_worker_shared_secret' limit 1`;
    const sharedSecret = secretRows[0]?.decrypted_secret || "";
    if (!sharedSecret) return Response.json({ error: "Worker shared secret unavailable" }, { status: 503 });

    const claimed = await sql`select * from public.ai_core_job_claim(300)`;
    if (!claimed.length) return Response.json({ processed: false, reason: "empty" });

    const job = claimed[0];
    const payload = { execution_id: job.job_id, organization_id: job.organization_id };
    const timestamp = Date.now();
    const body = JSON.stringify(payload);
    const signature = await hmacHex(sharedSecret, `${timestamp}.${body}`);

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
    if (!response.ok) return Response.json({ processed: false, retry: true, messageId: job.message_id, status: response.status, result }, { status: 502 });

    await sql`select public.ai_core_job_delete_message(${job.message_id}::bigint)`;
    return Response.json({ processed: true, messageId: job.message_id, result });
  } catch (error) {
    console.error("worker-error", error);
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});