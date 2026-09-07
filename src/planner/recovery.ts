import type { TaskNode } from "../task-graph/types";

export type RecoveryDecision = "RETRY" | "REPLAN" | "BLOCK" | "CANCEL";

export function decideRecovery(task: TaskNode, dependencyInvalidated = false): RecoveryDecision {
  if (task.state === "CANCELED") return "CANCEL";
  if (dependencyInvalidated) return task.attempts < task.maxAttempts ? "REPLAN" : "BLOCK";
  if (task.state === "FAILED" && task.attempts < task.maxAttempts) return "RETRY";
  if (task.state === "FAILED") return "BLOCK";
  return "BLOCK";
}

export function markRetry(task: TaskNode): TaskNode {
  if (task.attempts >= task.maxAttempts) throw new Error(`RETRY_LIMIT_REACHED: ${task.id}`);
  return { ...task, attempts: task.attempts + 1, state: "READY" };
}
