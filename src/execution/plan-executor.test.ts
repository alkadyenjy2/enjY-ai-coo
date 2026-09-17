import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../task-graph/types";
import { buildPlanExecutionInput, verifyPlanEvidence } from "./plan-executor";

const plan: Plan = {
  id: "plan-goal-1",
  goalId: "goal-1",
  version: 1,
  status: "PENDING",
  createdAt: "2026-09-18T00:00:00.000Z",
  nodes: [
    {
      id: "task-1-observe",
      capability: "observe",
      input: { goal: "check system" },
      dependencies: [],
      risk: "LOW",
      approvalRequired: false,
      state: "READY",
      attempts: 0,
      maxAttempts: 2,
    },
  ],
};

test("builds a Temporal input that carries the exact plan identity", () => {
  const input = buildPlanExecutionInput(plan, "check system");
  assert.equal(input.planId, "plan-goal-1");
  assert.equal(input.command, "check system");
  assert.equal(input.requireEvidence, true);
  assert.equal(input.plan.nodes[0]?.id, "task-1-observe");
});

test("rejects a completed plan without authoritative verification evidence", () => {
  assert.equal(verifyPlanEvidence({
    planId: "plan-goal-1",
    stateHistory: ["RECEIVED", "ROUTED", "DISPATCHED", "EXECUTED", "COMPLETED"],
    verificationStatus: "VERIFIED",
    evidence: "description only",
    verificationTool: undefined,
  }), false);
});

test("accepts a completed plan only with authoritative verification evidence", () => {
  assert.equal(verifyPlanEvidence({
    planId: "plan-goal-1",
    stateHistory: ["RECEIVED", "ROUTED", "DISPATCHED", "EXECUTED", "VERIFIED", "COMPLETED"],
    verificationStatus: "VERIFIED",
    evidence: "[Execution Verification Tool]: plan=plan-goal-1 verified=true",
    verificationTool: "Execution Verification Tool",
  }), true);
});
