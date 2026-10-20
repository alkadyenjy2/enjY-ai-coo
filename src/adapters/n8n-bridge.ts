export type N8nCommandResult =
  | { status: "WAITING_FOR_APPROVAL"; commandHash?: string; approvalUrl?: string; message?: string; httpStatus: number }
  | { status: "READ_ONLY_RESULT"; resultStatus: "READ_ONLY_COMPLETED" | "READ_ONLY_BLOCKED"; commandHash?: string; result: string; projectRowsRead: number; message?: string; httpStatus: number }
  | { status: "UNCONFIGURED" | "BLOCKED"; message: string; httpStatus?: number };

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const TRUSTED_N8N_HOST = "zeoutsourse.app.n8n.cloud";

/**
 * Sends a command to the secret, server-side n8n webhook.
 * A command is accepted only when n8n explicitly confirms it is waiting for owner approval.
 * The app never treats a generic HTTP 200 as proof of execution.
 */
export async function submitN8nCommand(
  command: string,
  config: { webhookUrl?: string },
  fetcher: FetchLike = fetch,
): Promise<N8nCommandResult> {
  const normalizedCommand = String(command || "").trim();
  const webhookUrl = String(config.webhookUrl || "").trim();
  if (!webhookUrl) {
    return { status: "UNCONFIGURED", message: "N8N_COMMAND_WEBHOOK_URL is missing." };
  }
  if (!normalizedCommand || normalizedCommand.length > 5000) {
    return { status: "BLOCKED", message: "Command must contain 1 to 5000 characters." };
  }

  let target: URL;
  try {
    target = new URL(webhookUrl);
    if (
      target.protocol !== "https:"
      || target.hostname !== TRUSTED_N8N_HOST
      || target.port
      || !target.pathname.startsWith("/webhook/")
      || target.username
      || target.password
      || target.hash
      || target.search
    ) {
      throw new Error("N8N_COMMAND_WEBHOOK_URL must be the trusted HTTPS n8n production webhook URL without credentials, query, or fragment.");
    }
  } catch (error) {
    return {
      status: "BLOCKED",
      message: error instanceof Error ? error.message : "Invalid n8n webhook URL.",
    };
  }

  try {
    const response = await fetcher(target, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ command: normalizedCommand, source: "jarvis-web" }),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    const approvalUrl = typeof payload?.approvalUrl === "string" ? payload.approvalUrl : undefined;
    const validApprovalUrl = (() => {
      if (!approvalUrl) return undefined;
      try {
        const parsed = new URL(approvalUrl);
        return parsed.protocol === "https:"
          && parsed.origin === target.origin
          && parsed.pathname.startsWith("/form-waiting/")
          && !parsed.username
          && !parsed.password
          && !parsed.hash
          ? parsed.toString()
          : undefined;
      } catch {
        return undefined;
      }
    })();

    if (!response.ok || payload?.accepted !== true) {
      return {
        status: "BLOCKED",
        message: `n8n did not confirm an accepted command (HTTP ${response.status}).`,
        httpStatus: response.status,
      };
    }

    if (payload.status === "READ_ONLY_COMPLETED" || payload.status === "READ_ONLY_BLOCKED") {
      if (typeof payload.result !== "string" || !payload.result.trim()) {
        return { status: "BLOCKED", message: "n8n accepted a read-only status command but returned no result.", httpStatus: response.status };
      }
      return {
        status: "READ_ONLY_RESULT",
        resultStatus: payload.status,
        commandHash: typeof payload.commandHash === "string" ? payload.commandHash : undefined,
        result: payload.result,
        projectRowsRead: typeof payload.projectRowsRead === "number" && Number.isFinite(payload.projectRowsRead) ? payload.projectRowsRead : 0,
        message: typeof payload.message === "string" ? payload.message : undefined,
        httpStatus: response.status,
      };
    }

    if (payload.status !== "WAITING_FOR_APPROVAL") {
      return { status: "BLOCKED", message: `n8n returned an unrecognized command status (HTTP ${response.status}).`, httpStatus: response.status };
    }

    return {
      status: "WAITING_FOR_APPROVAL",
      commandHash: typeof payload.commandHash === "string" ? payload.commandHash : undefined,
      approvalUrl: validApprovalUrl,
      message: typeof payload.message === "string" ? payload.message : undefined,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      status: "BLOCKED",
      message: error instanceof Error && error.name === "TimeoutError"
        ? "n8n command request timed out; execution status is unknown."
        : "n8n command request failed; execution status is unknown.",
    };
  }
}
