import type { Request, Response, Router } from "express";
import express from "express";

const TELEGRAM_API = "https://api.telegram.org";

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

async function telegramCall<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = getTelegramToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
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

  router.post("/webhook", express.json({ limit: "256kb" }), async (req: Request, res: Response) => {
    const expectedSecret = getWebhookSecret();
    if (expectedSecret && req.header("x-telegram-bot-api-secret-token") !== expectedSecret) {
      return res.status(401).json({ ok: false, error: "invalid webhook secret" });
    }

    const update = req.body as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();
    if (!chatId || !text) return res.status(200).json({ ok: true, ignored: true });

    // Telegram owns the webhook acknowledgement. JARVIS execution is delegated asynchronously
    // by the host callback so this transport stays independent from the agent implementation.
    const handler = (req.app as typeof req.app & {
      locals: { jarvisTelegramHandler?: (input: { chatId: number; text: string; update: TelegramUpdate }) => Promise<void> };
    }).locals.jarvisTelegramHandler;

    if (!handler) return res.status(503).json({ ok: false, error: "JARVIS Telegram handler not configured" });

    res.status(200).json({ ok: true });
    void handler({ chatId, text, update }).catch(async (error: unknown) => {
      try {
        await sendTelegramMessage(chatId, `JARVIS execution failed: ${error instanceof Error ? error.message : "unknown error"}`);
      } catch {
        // Transport failure is intentionally not re-thrown after Telegram acknowledgement.
      }
    });
  });

  router.get("/status", (_req: Request, res: Response) => {
    const configured = Boolean(getTelegramToken());
    const webhookSecretConfigured = Boolean(getWebhookSecret());
    res.json({
      ok: true,
      configured,
      webhookSecretConfigured,
      capabilities: configured ? ["webhook", "sendMessage"] : [],
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
