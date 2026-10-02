  }

  if (/حل المشكلة|تشخيص|سبب الخطأ|مشكلة|error|bug|diagnosis|debug/i.test(p)) {
    return "DIAGNOSIS";
  }

  if (/كود|عدل الكود|code|function|typescript|refactor|script/i.test(p)) {
    return "CODING";
  }

  if (/محتوى|انشئ مقال|مقال|content|write post|draft/i.test(p)) {
    return "CONTENT";
  }

  if (hasUrl) return "RESEARCH";

  return "GENERAL";
}

const INTENT_TOOL_POLICY: Record<string, string[]> = {
  DATABASE: ["query_supabase", "update_supabase", "check_connector_status"],
  EXECUTION: ["query_supabase", "update_supabase", "check_connector_status", "send_email", "browser_task", "execute_media"],
  SYSTEM_HEALTH: ["check_connector_status"],
  REPORTING: ["check_connector_status"],
  RESEARCH: [],
  RESEARCH_PLANNING: [],
  PLANNING: [],
  CODING: [],
  CONTENT: [],
  GENERAL: [],
  UNKNOWN: [],
};

function isToolAllowed(intent: string, toolName: string): boolean {
  const allowed = INTENT_TOOL_POLICY[intent] || [];
  return allowed.includes(toolName);
}

export function getReportingVerificationStatus(
  actions: Array<{ tool: string; status: string }>
): "VERIFIED" | "NOT_REQUIRED" {
  return hasRealExecutionStarted(actions) ? "VERIFIED" : "NOT_REQUIRED";
}

export function getSupabaseReadApiKey(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();
}

export function getSupabaseQueryActionStatus(
  httpStatus: number,
  payload: unknown,
): "success" | "failed" {
  if (httpStatus < 200 || httpStatus >= 300) return "failed";

  // PostgREST normally returns errors with non-2xx status codes, but an error-shaped
  // object must never be treated as successful evidence merely because HTTP is 2xx.
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const candidate = payload as Record<string, unknown>;
    if (typeof candidate.code === "string" && typeof candidate.message === "string" && candidate.code.trim() && candidate.message.trim()) {
      return "failed";
    }
  }

  return "success";
}

export function getDatabaseVerificationStatus(
  httpStatus: number,
  payload: unknown = null,
): "VERIFIED" | "FAILED" {
  return getSupabaseQueryActionStatus(httpStatus, payload) === "success" ? "VERIFIED" : "FAILED";
}

export function buildSupabaseReadUrl(
  supabaseUrl: string,
  table: string,
  select: string,
  authorizedOrganizationId?: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" + table + "?select=" + select;
  if (table === "leads") {
    if (!authorizedOrganizationId) throw new Error("Authorized organization context is required for leads reads.");
    return base + "&organization_id=eq." + encodeURIComponent(authorizedOrganizationId);
  }
  return base;
}

// Durable worker step for provider-backed media jobs. One invocation performs one bounded provider step.
app.post("/api/executions/worker", async (req, res) => {