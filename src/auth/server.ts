import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

export interface AuthContext {
  user: User;
  accessToken: string;
  supabase: SupabaseClient;
}

export interface OrganizationAccess {
  organizationId: string;
  role: string;
}

function getRuntimeConfig(): { url: string; publishableKey: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!url || !publishableKey || !url.startsWith("http")) return null;
  return { url: url.replace(/\/+$/, ""), publishableKey };
}

function extractBearerToken(req: Request): string | null {
  const header = req.header("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function isTemporalRequest(req: Request): boolean {
  return req.path.startsWith("/temporal") || req.originalUrl.includes("/api/temporal");
}

function getTemporalOwnershipSecret(): string | null {
  const secret = (
    process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  return secret || null;
}

function signTemporalWorkflowId(organizationId: string, workflowId: string): string | null {
  const secret = getTemporalOwnershipSecret();
  if (!secret) return null;
  const signature = createHmac("sha256", secret)
    .update(`${organizationId}.${workflowId}`)
    .digest("base64url");
  return `t:${organizationId}:${workflowId}:${signature}`;
}

function unwrapTemporalWorkflowId(value: string, organizationId: string): string | null {
  const raw = String(value || "").trim();
  const match = raw.match(/^t:([0-9a-f-]{36}):([^:]+):([A-Za-z0-9_-]+)$/i);
  if (!match) return null;
  const [, signedOrganizationId, workflowId, suppliedSignature] = match;
  if (signedOrganizationId.toLowerCase() !== organizationId.toLowerCase()) return null;

  const secret = getTemporalOwnershipSecret();
  if (!secret) return null;
  const expectedSignature = createHmac("sha256", secret)
    .update(`${organizationId}.${workflowId}`)
    .digest("base64url");

  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  return workflowId;
}

function installTemporalResponseBinding(req: Request, res: Response, organizationId: string): void {
  if (!isTemporalRequest(req)) return;
  const originalJson = res.json.bind(res);
  res.json = ((body: any) => {
    if (body && typeof body === "object" && typeof body.workflowId === "string") {
      const signedWorkflowId = signTemporalWorkflowId(organizationId, body.workflowId);
      if (signedWorkflowId) {
        body = { ...body, workflowId: signedWorkflowId };
      } else if (process.env.NODE_ENV === "production") {
        return originalJson({ success: false, error: "Temporal workflow ownership signing is not configured." });
      }
    }
    return originalJson(body);
  }) as Response["json"];
}

export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  const accessToken = extractBearerToken(req);
  if (!accessToken) return null;

  const config = getRuntimeConfig();
  if (!config) {
    const error = new Error("Supabase Auth is not configured on the server.");
    error.name = "AUTH_NOT_CONFIGURED";
    throw error;
  }

  const supabase = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { user: data.user, accessToken, supabase };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (process.env.NODE_ENV === "test" && process.env.AUTH_TEST_BYPASS === "true") {
    return next();
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }
    res.locals.auth = auth;
    next();
  } catch (error: any) {
    if (error?.name === "AUTH_NOT_CONFIGURED") {
      res.status(503).json({ success: false, error: "Authentication service is not configured." });
      return;
    }
    res.status(503).json({ success: false, error: "Authentication service unavailable." });
  }
}

export async function requireOrganizationAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (process.env.NODE_ENV === "test" && process.env.AUTH_TEST_BYPASS === "true") {
    const requestedId = String(req.body?.organization_id || req.query.organization_id || "").trim();
    if (requestedId) res.locals.organizationId = requestedId;
    return next();
  }

  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) {
    res.status(401).json({ success: false, error: "Authentication required." });
    return;
  }

  const requestedId = String(req.body?.organization_id || req.query.organization_id || "").trim();
  if (!requestedId || !/^[0-9a-f-]{36}$/i.test(requestedId)) {
    res.status(400).json({ success: false, error: "organization_id is required and must be a valid UUID." });
    return;
  }

  const { data: membership, error } = await auth.supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("organization_id", requestedId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    res.status(503).json({ success: false, error: "Organization authorization could not be verified." });
    return;
  }

  if (!membership) {
    res.status(403).json({ success: false, error: "You are not a member of this organization." });
    return;
  }

  const access: OrganizationAccess = {
    organizationId: String(membership.organization_id),
    role: String(membership.role || "member"),
  };
  res.locals.organizationId = access.organizationId;
  res.locals.organizationRole = access.role;

  if (isTemporalRequest(req)) {
    const workflowIdParam = String(req.params?.workflowId || "").trim();
    if (workflowIdParam) {
      const workflowId = unwrapTemporalWorkflowId(workflowIdParam, access.organizationId);
      if (!workflowId) {
        const allowLegacy = process.env.NODE_ENV !== "production" && process.env.ALLOW_LEGACY_TEMPORAL_WORKFLOW_IDS === "true";
        if (!allowLegacy) {
          res.status(403).json({ success: false, error: "Temporal workflow ownership proof is invalid or missing." });
          return;
        }
      } else {
        req.params.workflowId = workflowId;
      }
    }

    if (process.env.NODE_ENV === "production" && !getTemporalOwnershipSecret()) {
      res.status(503).json({ success: false, error: "Temporal workflow ownership signing is not configured." });
      return;
    }

    installTemporalResponseBinding(req, res, access.organizationId);
  }

  next();
}

export function getAuthContext(res: Response): AuthContext | null {
  return (res.locals.auth as AuthContext | undefined) || null;
}

export function getOrganizationAccess(res: Response): OrganizationAccess | null {
  const organizationId = res.locals.organizationId;
  if (!organizationId) return null;
  return {
    organizationId: String(organizationId),
    role: String(res.locals.organizationRole || "member"),
  };
}

export async function getAuthorizedOrganizations(auth: AuthContext): Promise<Array<{ id: string; role: string; name: string | null; slug: string | null }>> {
  const { data: memberships, error } = await auth.supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!memberships?.length) return [];

  const adminKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const config = getRuntimeConfig();
  const organizationClient = adminKey && config
    ? createClient(config.url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : auth.supabase;

  const organizations = await Promise.all(memberships.map(async (membership) => {
    const { data: organization } = await organizationClient
      .from("organizations")
      .select("id, name, slug")
      .eq("id", membership.organization_id)
      .maybeSingle();

    return {
      id: String(membership.organization_id),
      role: String(membership.role || "member"),
      name: organization?.name ? String(organization.name) : null,
      slug: organization?.slug ? String(organization.slug) : null,
    };
  }));

  return organizations;
}
