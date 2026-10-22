import type { PersistenceResult } from "../adapters/persistence";

export interface PublicExecutionHistoryStatus {
  executionHistoryCount: null;
  inMemoryExecutionHistoryCount: number;
  executionHistoryCountSource: "authenticated_tenant_history";
  executionHistoryCountAvailable: false;
}

/**
 * Public health has no authenticated tenant context, so it cannot truthfully
 * report a durable tenant-scoped execution-history count.
 */
export function buildPublicExecutionHistoryStatus(inMemoryCount: number): PublicExecutionHistoryStatus {
  return {
    executionHistoryCount: null,
    inMemoryExecutionHistoryCount: Math.max(0, Math.floor(Number.isFinite(inMemoryCount) ? inMemoryCount : 0)),
    executionHistoryCountSource: "authenticated_tenant_history",
    executionHistoryCountAvailable: false,
  };
}

/** A successful HTTP write is not enough; require a returned durable row ID. */
export function isDurablePersistenceConfirmed(
  result: Pick<PersistenceResult, "persisted" | "source" | "recordId">,
): boolean {
  return result.persisted === true && result.source === "supabase" && typeof result.recordId === "string" && result.recordId.trim().length > 0;
}

export function isExecutionHistoryReadbackConfirmed(
  history: { source: "supabase" | "memory"; records: Array<{ id: string }> } | null,
  executionId: string,
): boolean {
  return history?.source === "supabase" &&
    Array.isArray(history.records) &&
    history.records.some((record) => record.id === executionId);
}

export function shouldReportSystemHealthSuccess(
  healthProbeVerified: boolean,
  persistenceConfirmed: boolean,
  readbackVerified: boolean,
): boolean {
  return healthProbeVerified && persistenceConfirmed && readbackVerified;
}
