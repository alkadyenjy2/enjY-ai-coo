export type ReadOnlyN8nStatus = "READ_ONLY_COMPLETED" | "READ_ONLY_BLOCKED";

export interface ReadOnlyN8nResponse {
  content: string;
  status: ReadOnlyN8nStatus;
}

export function parseReadOnlyN8nResponse(
  httpStatus: number,
  payload: unknown,
): ReadOnlyN8nResponse | null {
  if (httpStatus !== 200 || payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const data = payload as Record<string, unknown>;
  if (
    data.approvalRequired !== false ||
    (data.status !== "READ_ONLY_COMPLETED" && data.status !== "READ_ONLY_BLOCKED")
  ) {
    return null;
  }

  const result = typeof data.result === "string" ? data.result.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const content = result || message;
  if (!content) return null;

  return {
    content: `${content}\n\nStatus: ${data.status}`,
    status: data.status,
  };
}
