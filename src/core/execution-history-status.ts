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
