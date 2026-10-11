export type ReadOnlyStatus = "READ_ONLY_COMPLETED" | "READ_ONLY_BLOCKED";

export interface ReadOnlyStatusResult {
  content: string;
  status: ReadOnlyStatus;
}

/** Recognizes a persisted read-only portfolio result returned by /api/agent/command. */
export function parseReadOnlyStatusResult(payload: unknown): ReadOnlyStatusResult | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
  const data = payload as Record<string, unknown>;
  const record = data.executionRecord;
  if (record === null || typeof record !== "object" || Array.isArray(record)) return null;
  const executionRecord = record as Record<string, unknown>;
  if (executionRecord.tool !== "n8n Model-Free Status") return null;
  const results = executionRecord.results;
  if (results === null || typeof results !== "object" || Array.isArray(results)) return null;
  const resultStatus = (results as Record<string, unknown>).status;
  if (resultStatus !== "READ_ONLY_COMPLETED" && resultStatus !== "READ_ONLY_BLOCKED") return null;
  if (typeof data.content !== "string" || !data.content.trim()) return null;
  return {
    content: `${data.content.trim()}\n\nStatus: ${resultStatus}`,
    status: resultStatus,
  };
}
