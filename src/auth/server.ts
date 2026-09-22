import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { runPersistenceContext } from "../adapters/request-context";

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
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
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

function getServerSecretKey(): string | null {
  const secret = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  return secret || null;
}

async function authenticateTrustedInternalRequest(req: Request): Promise<AuthContext | null> {
  const internalType = req.header("x-jarvis-internal");
  if (internalType !== "telegram" && internalType !== "worker") return null;
  const serverSecret = getServerSecretKey();
  const suppliedSecret = req.header("x-jarvis-internal-key")?.trim() || "";
  if (internalType === "telegram") {
    if (!serverSecret || !suppliedSecret || suppliedSecret !== serverSecret) return null;
  } else {
    const timestamp = Number(req.header("x-jarvis-worker-timestamp") || 0);
    const signature = req.header("x-jarvis-worker-signature")?.trim() || "";
    if (!serverSecret || !signature || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 300000) return null;
    const crypto = await import("node:crypto");
    const body = JSON.stringify(req.body || {});
    const payload = `${timestamp}.${body}`;
    const expected = crypto.createHmac("sha256", serverSecret).update(payload).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  }
  const serverSecret = getServerSecretKey();
  const suppliedSecret = req.header("x-jarvis-internal-key")?.trim() || "";
  if (!serverSecret || !suppliedSecret || suppliedSecret !== serverSecret) return null;

  const config = getRuntimeConfig();
  const organizationId = String(req.body?.organization_id || req.query.organization_id || "").trim();
  if (!config || !organizationId || !/^[0-9a-f-]{36}$/i.test(organizationId)) return null;

  const admin = createClient(config.url, serverSecret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", String(req.header("x-jarvis-worker-user-id") || ""))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.user_id) return null;

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(String(membership.user_id));
  if (userError || !userData.user) return null;

  return { user: userData.user, accessToken: serverSecret, supabase: admin };
}

async function authenticateTrustedTelegramRequest(req: Request): Promise<AuthContext | null> {
  return authenticateTrustedInternalRequest(req);
}

export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  const trustedTelegramAuth = await authenticateTrustedInternalRequest(req);
  if (trustedTelegramAuth) return trustedTelegramAuth;

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



  return runPersistenceContext(
    {
      organizationId: access.organizationId,
      userId: auth.user.id,
      accessToken: auth.accessToken,
    },
    () => next(),
  );
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
