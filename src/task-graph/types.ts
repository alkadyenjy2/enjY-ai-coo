export type TaskState =
  | "PENDING"
  | "READY"
  | "WAITING_APPROVAL"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type VerificationStatus = "VERIFIED" | "FAILED" | "NOT_REQUIRED";

export interface Goal {
  id: string;
  text: string;
  context: Record<string, unknown>;
}

export interface TaskNode {
  id: string;
  capability: string;
  input: Record<string, unknown>;
  dependencies: string[];
  risk: RiskLevel;
  approvalRequired: boolean;
  state: TaskState;
  attempts: number;
  maxAttempts: number;
  result?: unknown;
  evidence?: string;
  verificationStatus?: VerificationStatus;
}

export interface Plan {
  id: string;
  goalId: string;
  version: number;
  status: TaskState;
  nodes: TaskNode[];
  createdAt: string;
}
