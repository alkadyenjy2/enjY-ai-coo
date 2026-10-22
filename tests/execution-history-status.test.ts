import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicExecutionHistoryStatus, isDurablePersistenceConfirmed } from "../src/core/execution-history-status.ts";

test("public health does not mislabel process-local memory as durable execution history", () => {
  assert.deepEqual(buildPublicExecutionHistoryStatus(3), {
    executionHistoryCount: null,
    inMemoryExecutionHistoryCount: 3,
    executionHistoryCountSource: "authenticated_tenant_history",
    executionHistoryCountAvailable: false,
  });
});

test("public health keeps process-local count separate when empty", () => {
  const status = buildPublicExecutionHistoryStatus(0);
  assert.equal(status.executionHistoryCount, null);
  assert.equal(status.inMemoryExecutionHistoryCount, 0);
  assert.equal(status.executionHistoryCountAvailable, false);
});

test("durable persistence is confirmed only by a Supabase result with a returned record id", () => {
  assert.equal(isDurablePersistenceConfirmed({ persisted: true, source: "supabase", recordId: "audit-1" }), true);
  assert.equal(isDurablePersistenceConfirmed({ persisted: true, source: "supabase" }), false);
  assert.equal(isDurablePersistenceConfirmed({ persisted: true, source: "memory" }), false);
  assert.equal(isDurablePersistenceConfirmed({ persisted: false, source: "memory", error: "HTTP 401" }), false);
});
