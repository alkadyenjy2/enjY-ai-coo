import type { Goal, Plan, RiskLevel, TaskNode } from "../task-graph/types";
import { assertValidTaskGraph } from "../task-graph/validate";

export interface Capability {
  name: string;
  risk: RiskLevel;
  requiresApproval?: boolean;
}

export function createPlan(goal: Goal, capabilities: Capability[]): Plan {
  const available = new Map(capabilities.map((c) => [c.name, c]));
  const requested = typeof goal.context.capabilities === "object" && Array.isArray(goal.context.capabilities)
    ? goal.context.capabilities.filter((x): x is string => typeof x === "string")
    : [];

  const names = requested.length ? requested : ["observe"];
  const nodes: TaskNode[] = names.map((name, index) => {
    const capability = available.get(name) ?? { name, risk: "LOW" as RiskLevel, requiresApproval: false };
    return {
      id: `task-${index + 1}-${name}`,
      capability: name,
      input: { goal: goal.text },
      dependencies: index === 0 ? [] : [`task-${index}-${names[index - 1]}`],
      risk: capability.risk,
      approvalRequired: Boolean(capability.requiresApproval) || capability.risk === "HIGH" || capability.risk === "CRITICAL",
      state: index === 0 ? "READY" : "PENDING",
      attempts: 0,
      maxAttempts: 2,
    };
  });

  const plan: Plan = {
    id: `plan-${goal.id}`,
    goalId: goal.id,
    version: 1,
    status: "PENDING",
    nodes,
    createdAt: new Date().toISOString(),
  };
  assertValidTaskGraph(plan);
  return plan;
}
