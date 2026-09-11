import test from "node:test";
import assert from "node:assert/strict";
import { decideRecovery, markRetry } from "./recovery";
import type { TaskNode } from "../task-graph/types";

const failed: TaskNode = { id: "t1", capability: "x", input: {}, dependencies: [], risk: "LOW", approvalRequired: false, state: "FAILED", attempts: 0, maxAttempts: 2 };

test("retries failed tasks below the attempt limit", () => {
  assert.equal(decideRecovery(failed), "RETRY");
  assert.equal(markRetry(failed).state, "READY");
});
test("blocks failed tasks at the attempt limit", () => {
  assert.equal(decideRecovery({ ...failed, attempts: 2 }), "BLOCK");
});
test("replans when a dependency is invalidated", () => {
  assert.equal(decideRecovery(failed, true), "REPLAN");
});
