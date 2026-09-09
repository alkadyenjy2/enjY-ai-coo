/**
 * Gmail Router for JARVIS AI COO.
 *
 * Thin integration layer over the canonical Gmail tool. Keeps provider logic
 * in gmail.ts and exposes one stable command contract to the JARVIS router.
 */

import {
  listRecentEmails,
  sendEmail,
  verifyEmailSent,
  type GmailRecentEmail,
  type GmailSendResult,
  type GmailVerificationResult,
} from "./gmail";

export interface GmailCommand {
  action: "send" | "verify" | "list";
  params?: {
    to?: string;
    subject?: string;
    body?: string;
    messageId?: string;
    limit?: number;
  };
}

export interface GmailSendRouterResult extends GmailSendResult {
  action: "send";
}

export interface GmailVerifyRouterResult extends GmailVerificationResult {
  action: "verify";
}

export interface GmailListRouterResult {
  action: "list";
  emails: GmailRecentEmail[];
}

/**
 * Execute exactly one Gmail action.
 *
 * Bulk sends are intentionally not supported by this router. JARVIS must
 * dispatch one explicit send at a time after its existing approval gate.
 */
export async function gmailRouter(
  command: GmailCommand,
): Promise<GmailSendRouterResult | GmailVerifyRouterResult | GmailListRouterResult> {
  switch (command.action) {
    case "send": {
      const to = command.params?.to?.trim();
      const subject = command.params?.subject;
      const body = command.params?.body;

      if (!to || !subject || !body) {
        throw new Error("GMAIL_INVALID_COMMAND: send requires to, subject, and body.");
      }

      const result = await sendEmail(to, subject, body);
      return { action: "send", ...result };
    }

    case "verify": {
      const messageId = command.params?.messageId?.trim();
      if (!messageId) {
        throw new Error("GMAIL_INVALID_COMMAND: verify requires messageId.");
      }

      const result = await verifyEmailSent(messageId);
      return { action: "verify", ...result };
    }

    case "list": {
      const emails = await listRecentEmails(command.params?.limit ?? 10);
      return { action: "list", emails };
    }

    default: {
      const exhaustive: never = command.action;
      throw new Error(`GMAIL_UNKNOWN_ACTION: ${String(exhaustive)}`);
    }
  }
}
