import test from "node:test";
import assert from "node:assert/strict";
import { appendLifecycleState, buildLifecycleHistory, canTransition } from "../src/core/agent-lifecycle";

test("JARVIS lifecycle allows verified execution", () => {
  assert.deepEqual(buildLifecycleHistory({ executed: true, verification: "VERIFIED" }), [
    "RECEIVED",
    "ROUTED",
    "DISPATCHED",
    "RUNNING",
    "VERIFYING",
    "VERIFIED",
    "COMPLETED",
  ]);
});

test("JARVIS lifecycle blocks invalid terminal transition", () => {
  assert.equal(canTransition("COMPLETED", "RUNNING"), false);
  assert.throws(() => appendLifecycleState(["COMPLETED"], "RUNNING"), /Invalid JARVIS lifecycle transition/);
});

test("approval pauses before execution", () => {
  assert.deepEqual(buildLifecycleHistory({ needsApproval: true }), [
    "RECEIVED",
    "ROUTED",
    "DISPATCHED",
    "NEEDS_APPROVAL",
  ]);
});

test("failed verification terminates as FAILED", () => {
  assert.deepEqual(buildLifecycleHistory({ executed: true, verification: "FAILED" }), [
    "RECEIVED",
    "ROUTED",
    "DISPATCHED",
    "RUNNING",
    "VERIFYING",
    "FAILED",
  ]);
});
