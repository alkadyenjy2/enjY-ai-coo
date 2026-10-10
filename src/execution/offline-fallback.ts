export interface OfflineFallbackInput {
  command: string;
  project: string;
  intent: string;
  missingDependency: string;
}

export interface OfflineFallbackRecord {
  id: string;
  timestamp: string;
  command: string;
  project: string;
  intent: string;
  tool: string;
  selectedTools: string[];
  actionsExecuted: Array<{ tool: string; status: string; details: string }>;
  results: { mode: string; status: "BLOCKED"; reason: string; responseSnippet: string };
  state_history: string[];
  evidence: string;
  verificationStatus: "FAILED";
  final_state_reason: string;
  errors: string[];
  approvalStatus: "AUTO_APPROVED";
}

export function createOfflineFallbackResult(input: OfflineFallbackInput): {
  content: string;
  executionRecord: OfflineFallbackRecord;
} {
  const reason = input.missingDependency.trim() || "REQUIRED_PROVIDER_UNAVAILABLE";
  const content = [
    "**[JARVIS BLOCKED]** The command was not executed because a required live provider is unavailable.",
    "",
    `- Project: ${input.project}`,
    `- Reason: ${reason}`,
    "- No external action was attempted; no success is claimed.",
    "- Next: connect an already-authorized provider or wire a verified free-first route into live execution.",
    "",
    `Status: BLOCKED - ${reason}`,
  ].join("\n");

  const executionRecord: OfflineFallbackRecord = {
    id: `exec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    command: input.command,
    project: input.project,
    intent: input.intent,
    tool: "Offline Fallback Engine",
    selectedTools: [],
    actionsExecuted: [],
    results: {
      mode: "offline_fallback",
      status: "BLOCKED",
      reason,
      responseSnippet: content.slice(0, 150),
    },
    state_history: ["RECEIVED", "ROUTED", "DISPATCHED", "BLOCKED"],
    evidence: `No external action was attempted. Live dependency unavailable: ${reason}.`,
    verificationStatus: "FAILED",
    final_state_reason: `Execution stopped safely because ${reason}.`,
    errors: [reason],
    approvalStatus: "AUTO_APPROVED",
  };

  return { content, executionRecord };
}
