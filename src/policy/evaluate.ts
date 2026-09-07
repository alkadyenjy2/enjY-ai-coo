import type { TaskNode } from "../task-graph/types";
import type { CapabilityGrant, PolicyDecision } from "./types";

const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;

export function evaluateTaskPolicy(task: TaskNode, grants: CapabilityGrant[]): PolicyDecision {
  const grant = grants.find((item) => item.name === task.capability);
  if (!grant || !grant.allowed || rank[task.risk] > rank[grant.maxRisk]) return "REJECT";
  if (task.approvalRequired || task.risk === "HIGH" || task.risk === "CRITICAL") return "REQUIRES_APPROVAL";
  return "ALLOW";
}
