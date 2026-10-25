const TRUSTED_N8N_HOST = "zeoutsourse.app.n8n.cloud";

export function isTrustedN8nWebhookConfigured(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:"
      && url.hostname === TRUSTED_N8N_HOST
      && !url.port
      && url.pathname.startsWith("/webhook/")
      && !url.username
      && !url.password
      && !url.hash
      && !url.search;
  } catch {
    return false;
  }
}

export interface PublicDatabaseFingerprint {
  supabase_project_ref: string | null;
  last_successful_write: string | null;
  last_execution_id: string | null;
}

/**
 * Return a non-secret database fingerprint and latest successful execution timestamp.
 * The read uses only the configured publishable/anon key; RLS denials are intentionally
 * represented as null evidence and must not make the health endpoint disclose DB errors.
 */
export async function getPublicDatabaseFingerprint(
  env: NodeJS.ProcessEnv = process.env,
  fetcher: typeof fetch = fetch,
): Promise<PublicDatabaseFingerprint> {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  const explicitRef = (env.SUPABASE_PROJECT_REF || "").trim();
  let inferredRef: string | null = null;
  try {
    const hostname = new URL(url).hostname;
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    if (match) inferredRef = match[1];
  } catch {
    // Invalid or absent URL leaves the inferred ref unset.
  }
  const result: PublicDatabaseFingerprint = {
    supabase_project_ref: explicitRef || inferredRef,
    last_successful_write: null,
    last_execution_id: null,
  };
  if (!url || !key) return result;

  try {
    const endpoint = `${url}/rest/v1/audit_logs?select=completed_at,execution_id&type=eq.ai_core_execution&status=eq.success&order=completed_at.desc&limit=1`;
    const response = await fetcher(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return result;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== "object" || rows[0] === null) return result;
    const row = rows[0] as { completed_at?: unknown; execution_id?: unknown };
    result.last_successful_write = typeof row.completed_at === "string" ? row.completed_at : null;
    result.last_execution_id = typeof row.execution_id === "string" ? row.execution_id : null;
    return result;
  } catch {
    return result;
  }
}
