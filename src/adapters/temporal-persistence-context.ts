import { createHmac, timingSafeEqual } from "node:crypto";

export interface TemporalPersistenceContext {
  organizationId: string;
  userId: string;
  workflowId: string;
  expiresAt: number;
  signature: string;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  const secret = (
    process.env.TEMPORAL_WORKFLOW_OWNERSHIP_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  return secret || null;
}

function canonicalValue(input: Omit<TemporalPersistenceContext, "signature">): string {
  return [input.organizationId, input.userId, input.workflowId, String(input.expiresAt)].join(".");
}

function sign(input: Omit<TemporalPersistenceContext, "signature">, secret: string): string {
  return createHmac("sha256", secret).update(canonicalValue(input)).digest("base64url");
}

export function createTemporalPersistenceContext(
  organizationId: string,
  userId: string,
  workflowId: string,
  ttlMs = DEFAULT_TTL_MS,
): TemporalPersistenceContext | null {
  const secret = getSecret();
  if (!secret) return null;

  const unsigned = {
    organizationId,
    userId,
    workflowId,
    expiresAt: Date.now() + ttlMs,
  };
  return { ...unsigned, signature: sign(unsigned, secret) };
}

export function verifyTemporalPersistenceContext(
  context: TemporalPersistenceContext | undefined,
  expectedWorkflowId?: string,
): { organizationId: string; userId: string; workflowId: string } | null {
  const secret = getSecret();
  if (!secret || !context) return null;
  if (!context.organizationId || !context.userId || !context.workflowId || !context.signature) return null;
  if (!Number.isFinite(context.expiresAt) || context.expiresAt < Date.now()) return null;
  if (expectedWorkflowId && context.workflowId !== expectedWorkflowId) return null;

  const expected = sign(
    {
      organizationId: context.organizationId,
      userId: context.userId,
      workflowId: context.workflowId,
      expiresAt: context.expiresAt,
    },
    secret,
  );
  const supplied = Buffer.from(context.signature);
  const expectedBuffer = Buffer.from(expected);
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) return null;

  return {
    organizationId: context.organizationId,
    userId: context.userId,
    workflowId: context.workflowId,
  };
}
