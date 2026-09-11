import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTaskPolicy } from "./evaluate";
import type { TaskNode } from "../task-graph/types";

const task: TaskNode = { id: "t1", capability: "publish", input: {}, dependencies: [], risk: "HIGH", approvalRequired: true, state: "READY", attempts: 0, maxAttempts: 2 };

test("requires approval for high risk", () => {
  assert.equal(evaluateTaskPolicy(task, [{ name: "publish", allowed: true, maxRisk: "HIGH" }]), "REQUIRES_APPROVAL");
});
test("rejects capability outside grant", () => {
  assert.equal(evaluateTaskPolicy(task, []), "REJECT");
});
test("allows low risk capability within grant", () => {
  assert.equal(evaluateTaskPolicy({ ...task, risk: "LOW", approvalRequired: false }, [{ name: "publish", allowed: true, maxRisk: "LOW" }]), "ALLOW");
});
