import type { RiskLevel, TaskNode } from "../task-graph/types";

export interface CapabilityGrant {
  name: string;
  allowed: boolean;
  maxRisk: RiskLevel;
}

export type PolicyDecision = "ALLOW" | "REQUIRES_APPROVAL" | "REJECT";

const rank: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function evaluateTaskPolicy(task: TaskNode, grants: CapabilityGrant[]): PolicyDecision {
  const grant = grants.find((item) => item.name === task.capability);
  if (!grant || !grant.allowed || rank[task.risk] > rank[grant.maxRisk]) return "REJECT";
  if (task.approvalRequired || task.risk === "HIGH" || task.risk === "CRITICAL") return "REQUIRES_APPROVAL";
  return "ALLOW";
}
