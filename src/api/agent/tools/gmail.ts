import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GMAIL_NOT_CONFIGURED: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are required.",
    );
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret, process.env.GMAIL_REDIRECT_URI || "http://localhost:53682/oauth2callback");
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function getGmailClient() {
  return google.gmail({ version: "v1", auth: getOAuthClient() });
}

function assertEmailAddress(value: string): string {
  const email = String(value || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`GMAIL_INVALID_RECIPIENT: Invalid recipient address '${email}'.`);
  }
  return email;
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function encodeRawMessage(to: string, subject: string, body: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export interface GmailSendResult {
  success: true;
  messageId: string;
  threadId?: string;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<GmailSendResult> {
  const recipient = assertEmailAddress(to);
  const normalizedSubject = String(subject || "").trim();
  const normalizedBody = String(body || "");

  if (!normalizedSubject) throw new Error("GMAIL_INVALID_SUBJECT: Subject is required.");
  if (!normalizedBody.trim()) throw new Error("GMAIL_INVALID_BODY: Body is required.");
  if (normalizedSubject.length > 998) throw new Error("GMAIL_INVALID_SUBJECT: Subject exceeds RFC line limits.");

  const gmail = getGmailClient();
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodeRawMessage(recipient, normalizedSubject, normalizedBody) },
  });

  if (!response.data.id) throw new Error("GMAIL_SEND_FAILED: Gmail returned no message id.");

  return {
    success: true,
    messageId: response.data.id,
    threadId: response.data.threadId || undefined,
  };
}

export interface GmailVerificationResult {
  verified: boolean;
  sent: boolean;
  messageId: string;
  labelIds: string[];
  threadId?: string;
}

export async function verifyEmailSent(messageId: string): Promise<GmailVerificationResult> {
  if (!messageId?.trim()) throw new Error("GMAIL_INVALID_MESSAGE_ID: messageId is required.");

  const gmail = getGmailClient();
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId.trim(),
    format: "metadata",
    metadataHeaders: ["To", "Subject", "Date"],
  });

  const labelIds = response.data.labelIds || [];
  const sent = labelIds.includes("SENT");

  return {
    verified: Boolean(response.data.id) && sent,
    sent,
    messageId: response.data.id || messageId,
    labelIds,
    threadId: response.data.threadId || undefined,
  };
}

export interface GmailRecentEmail {
  id: string;
  threadId?: string;
  labelIds: string[];
  snippet?: string;
}

export async function listRecentEmails(limit = 10): Promise<GmailRecentEmail[]> {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const gmail = getGmailClient();
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: safeLimit,
  });

  return (response.data.messages || []).map((message) => ({
    id: message.id || "",
    threadId: message.threadId || undefined,
    labelIds: [],
  }));
}

export const GMAIL_REQUIRED_SCOPES = [GMAIL_SEND_SCOPE, GMAIL_READ_SCOPE] as const;
