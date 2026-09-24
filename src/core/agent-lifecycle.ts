export const AGENT_LIFECYCLE_STATES = [
  "RECEIVED",
  "ROUTED",
  "DISPATCHED",
  "RUNNING",
  "NEEDS_APPROVAL",
  "VERIFYING",
  "VERIFIED",
  "COMPLETED",
  "FAILED",
  "BLOCKED",
] as const;

export type AgentLifecycleState = (typeof AGENT_LIFECYCLE_STATES)[number];

const allowedTransitions: Record<AgentLifecycleState, AgentLifecycleState[]> = {
  RECEIVED: ["ROUTED", "BLOCKED"],
  ROUTED: ["DISPATCHED", "BLOCKED"],
  DISPATCHED: ["RUNNING", "NEEDS_APPROVAL", "BLOCKED"],
  RUNNING: ["NEEDS_APPROVAL", "VERIFYING", "COMPLETED", "FAILED", "BLOCKED"],
  NEEDS_APPROVAL: ["RUNNING", "BLOCKED", "FAILED"],
  VERIFYING: ["VERIFIED", "FAILED"],
  VERIFIED: ["COMPLETED"],
  COMPLETED: [],
  FAILED: [],
  BLOCKED: [],
};

export function canTransition(from: AgentLifecycleState, to: AgentLifecycleState): boolean {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function appendLifecycleState(
  history: AgentLifecycleState[],
  next: AgentLifecycleState,
): AgentLifecycleState[] {
  const current = history[history.length - 1];
  if (!current) return [next];
  if (current === next) return history;
  if (!canTransition(current, next)) {
    throw new Error(`Invalid JARVIS lifecycle transition: ${current} -> ${next}`);
  }
  return [...history, next];
}

export function buildLifecycleHistory(input: {
  needsApproval?: boolean;
  executed?: boolean;
  verification?: "VERIFIED" | "FAILED" | "NOT_REQUIRED";
}): AgentLifecycleState[] {
  let history: AgentLifecycleState[] = ["RECEIVED", "ROUTED", "DISPATCHED"];

  if (input.needsApproval) {
    history = appendLifecycleState(history, "NEEDS_APPROVAL");
    return history;
  }

  if (input.executed === false) {
    return appendLifecycleState(history, "BLOCKED");
  }

  history = appendLifecycleState(history, "RUNNING");

  if (input.verification === "VERIFIED") {
    history = appendLifecycleState(history, "VERIFYING");
    history = appendLifecycleState(history, "VERIFIED");
    return appendLifecycleState(history, "COMPLETED");
  }

  if (input.verification === "FAILED") {
    history = appendLifecycleState(history, "VERIFYING");
    return appendLifecycleState(history, "FAILED");
  }

  return appendLifecycleState(history, "COMPLETED");
}
