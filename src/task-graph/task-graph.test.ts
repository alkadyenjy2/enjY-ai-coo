import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "./types";
import { assertValidTaskGraph, validateTaskGraph } from "./validate";

const base: Plan = {
  id: "p1", goalId: "g1", version: 1, status: "PENDING", createdAt: "2026-01-01T00:00:00.000Z",
  nodes: [
    { id: "a", capability: "observe", input: {}, dependencies: [], risk: "LOW", approvalRequired: false, state: "READY", attempts: 0, maxAttempts: 2 },
    { id: "b", capability: "execute", input: {}, dependencies: ["a"], risk: "MEDIUM", approvalRequired: false, state: "PENDING", attempts: 0, maxAttempts: 2 },
  ],
};

test("accepts a valid DAG", () => assert.deepEqual(validateTaskGraph(base), []));
test("rejects missing dependencies", () => assert.ok(validateTaskGraph({ ...base, nodes: [{ ...base.nodes[0], dependencies: ["missing"] }] }).some((error) => error.includes("Missing dependency"))));
test("rejects cycles", () => {
  const nodes = base.nodes.map((n) => ({ ...n }));
  nodes[0].dependencies = ["b"];
  const errors = validateTaskGraph({ ...base, nodes });
  assert.ok(errors.some((e) => e.includes("Cycle detected")));
});
test("rejects succeeded tasks without verification", () => {
  const nodes = base.nodes.map((n) => ({ ...n }));
  nodes[0].state = "SUCCEEDED";
  assert.throws(() => assertValidTaskGraph({ ...base, nodes }), /missing verification status/);
});
