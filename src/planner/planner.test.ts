import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGoal } from "./goal";
import { createPlan } from "./planner";

test("normalizes goals deterministically", () => {
  const a = normalizeGoal("  launch   roofing  ", { x: 1 });
  const b = normalizeGoal("launch roofing", { x: 1 });
  assert.equal(a.id, b.id);
  assert.equal(a.text, "launch roofing");
});

test("creates a dependency-ordered plan", () => {
  const goal = normalizeGoal("research then publish", { capabilities: ["research", "publish"] });
  const plan = createPlan(goal, [
    { name: "research", risk: "LOW" },
    { name: "publish", risk: "HIGH", requiresApproval: true },
  ]);
  assert.equal(plan.nodes.length, 2);
  assert.deepEqual(plan.nodes[1].dependencies, [plan.nodes[0].id]);
  assert.equal(plan.nodes[1].approvalRequired, true);
});
