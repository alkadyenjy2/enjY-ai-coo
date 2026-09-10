import type { Request, Response as ExpressResponse, Router } from "express";
import express from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type Session } from "@supabase/supabase-js";

const TELEGRAM_API = "https://api.telegram.org";
const telegramAuthContext = new AsyncLocalStorage<{ chatId: number }>();
const originalFetch = globalThis.fetch.bind(globalThis);
let telegramAuthFetchInstalled = false;
let refreshPromise: Promise<Session | null> | null = null;
let cachedSession: Session | null = null;

export interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number };
    from?: { id?: number; username?: string; first_name?: string };
  };
}

function getTelegramToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

function getWebhookSecret(): string | null {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  return secret || null;
}

function getTelegramOrganizationId(): string | null {
  const organizationId = process.env.JARVIS_TELEGRAM_ORGANIZATION_ID?.trim();
  return organizationId || null;
}

function getTelegramRefreshToken(): string | null {
  const refreshToken = process.env.JARVIS_TELEGRAM_REFRESH_TOKEN?.trim();
  return refreshToken || null;
}

function getAllowedChatIds(): Set<number> | null {
  const raw = process.env.JARVIS_TELEGRAM_ALLOWED_CHAT_IDS?.trim();
  if (!raw) return null;

  const ids = raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isSafeInteger(value));

  return new Set(ids);
}

function isTelegramCommandRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return url.includes("/api/agent/command");
}

async function getTelegramAccessToken(): Promise<string | null> {
  const refreshToken = getTelegramRefreshToken();
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
  const supabaseKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  )?.trim();

  if (!refreshToken || !supabaseUrl || !supabaseKey) return null;

  if (cachedSession?.access_token && cachedSession.expires_at && cachedSession.expires_at > Math.floor(Date.now() / 1000) + 60) {
    return cachedSession.access_token;
  }

  if (!refreshPromise) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    refreshPromise = supabase.auth
      .refreshSession({ refresh_token: cachedSession?.refresh_token || refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          cachedSession = null;
          return null;
        }
        cachedSession = data.session;
        return data.session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  const session = await refreshPromise;
  return session?.access_token || null;
}

function installTelegramAuthFetchBridge(): void {
  if (telegramAuthFetchInstalled) return;
  telegramAuthFetchInstalled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<globalThis.Response> => {
    if (!isTelegramCommandRequest(input)) return originalFetch(input, init);

    const context = telegramAuthContext.getStore();
    const organizationId = getTelegramOrganizationId();
    if (!context || !organizationId) return originalFetch(input, init);

    const accessToken = await getTelegramAccessToken();
    if (!accessToken) return originalFetch(input, init);

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("content-type", "application/json");

    let body = init?.body;
    if (typeof body === "string") {
      try {
        const payload = JSON.parse(body) as Record<string, unknown>;
        payload.organization_id = organizationId;
        body = JSON.stringify(payload);
      } catch {
        return originalFetch(input, init);
      }
    }

    return originalFetch(input, { ...init, headers, body });
  };
}

installTelegramAuthFetchBridge();

async function telegramCall<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = getTelegramToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await originalFetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { ok?: boolean; result?: T; description?: string };
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || response.statusText}`);
  }
  return data.result as T;
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
  });
}

export function createTelegramRouter(): Router {
  const router = express.Router();

  router.post("/webhook", express.json({ limit: "256kb" }), async (req: Request, res: ExpressResponse) => {
    const expectedSecret = getWebhookSecret();
    if (expectedSecret && req.header("x-telegram-bot-api-secret-token") !== expectedSecret) {
      return res.status(401).json({ ok: false, error: "invalid webhook secret" });
    }

    const update = req.body as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();
    if (!chatId || !text) return res.status(200).json({ ok: true, ignored: true });

    const allowedChatIds = getAllowedChatIds();
    if (allowedChatIds && !allowedChatIds.has(chatId)) {
      return res.status(403).json({ ok: false, error: "telegram chat is not authorized" });
    }

    // Telegram owns the webhook acknowledgement. JARVIS execution is delegated asynchronously
    // by the host callback so this transport stays independent from the agent implementation.
    const handler = (req.app as typeof req.app & {
      locals: { jarvisTelegramHandler?: (input: { chatId: number; text: string; update: TelegramUpdate }) => Promise<void> };
    }).locals.jarvisTelegramHandler;

    if (!handler) return res.status(503).json({ ok: false, error: "JARVIS Telegram handler not configured" });

    res.status(200).json({ ok: true });
    void telegramAuthContext.run({ chatId }, () => handler({ chatId, text, update })).catch(async (error: unknown) => {
      try {
        await sendTelegramMessage(chatId, `JARVIS execution failed: ${error instanceof Error ? error.message : "unknown error"}`);
      } catch {
        // Transport failure is intentionally not re-thrown after Telegram acknowledgement.
      }
    });
  });

  router.get("/status", (_req: Request, res: ExpressResponse) => {
    const configured = Boolean(getTelegramToken());
    const webhookSecretConfigured = Boolean(getWebhookSecret());
    const commandAuthConfigured = Boolean(getTelegramRefreshToken() && getTelegramOrganizationId());
    const allowedChatIdsConfigured = Boolean(getAllowedChatIds());
    res.json({
      ok: true,
      configured,
      webhookSecretConfigured,
      commandAuthConfigured,
      allowedChatIdsConfigured,
      capabilities: configured ? ["webhook", "sendMessage", ...(commandAuthConfigured ? ["authenticated_command_execution"] : [])] : [],
    });
  });

  return router;
}

export async function setTelegramWebhook(webhookUrl: string): Promise<unknown> {
  const secret = getWebhookSecret();
  return telegramCall("setWebhook", {
    url: webhookUrl,
    ...(secret ? { secret_token: secret } : {}),
    allowed_updates: ["message"],
    drop_pending_updates: false,
  });
}
