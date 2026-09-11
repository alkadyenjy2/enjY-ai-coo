import type { TaskNode, VerificationStatus } from "./types";

export interface EvidenceRecord {
  planId: string;
  taskId: string;
  status: VerificationStatus;
  evidence: string;
  timestamp: string;
}

export function verifyTask(task: TaskNode): EvidenceRecord {
  if (task.state !== "SUCCEEDED") {
    return { planId: "unknown", taskId: task.id, status: "FAILED", evidence: "TASK_NOT_SUCCEEDED", timestamp: new Date().toISOString() };
  }
  if (!task.evidence) {
    return { planId: "unknown", taskId: task.id, status: "FAILED", evidence: "EVIDENCE_MISSING", timestamp: new Date().toISOString() };
  }
  return { planId: "unknown", taskId: task.id, status: "VERIFIED", evidence: task.evidence, timestamp: new Date().toISOString() };
}
