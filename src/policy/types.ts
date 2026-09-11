import type { RiskLevel } from "../task-graph/types";

export interface CapabilityGrant {
  name: string;
  allowed: boolean;
  maxRisk: RiskLevel;
}

export type PolicyDecision = "ALLOW" | "REQUIRES_APPROVAL" | "REJECT";
