import type { WorkflowInput } from "../../temporal-proof/workflows";
import type { Plan } from "../task-graph/types";

export const AUTHORITATIVE_VERIFICATION_TOOL = "Execution Verification Tool";

export function buildPlanExecutionInput(plan: Plan, command: string): WorkflowInput & { planId: string; plan: Plan } {
  return {
    testId: plan.id,
    planId: plan.id,
    plan,
    command,
    requireHumanApproval: plan.nodes.some((node) => node.approvalRequired),
    requireEvidence: true,
    maxLoopIterations: 1,
  };
}

export interface PlanVerificationInput {
  planId: string;
  stateHistory: string[];
  verificationStatus: string;
  evidence: string;
  verificationTool?: string;
}

export function verifyPlanEvidence(input: PlanVerificationInput): boolean {
  return (
    Boolean(input.planId) &&
    input.verificationStatus === "VERIFIED" &&
    input.stateHistory.includes("EXECUTED") &&
    input.stateHistory.includes("VERIFIED") &&
    input.stateHistory.includes("COMPLETED") &&
    input.evidence.includes(`plan=${input.planId}`) &&
    input.verificationTool === AUTHORITATIVE_VERIFICATION_TOOL
  );
}
