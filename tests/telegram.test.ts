import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createTelegramRouter } from "../src/api/telegram";

async function withServer(handler: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use("/api/telegram", createTelegramRouter());
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await handler(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("Telegram status reports unconfigured when no bot token is present", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/telegram/status`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(body.configured, false);
      assert.equal(body.webhookSecretConfigured, false);
      assert.deepEqual(body.capabilities, []);
    });
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
  }
});

test("Telegram webhook delegates a text update to the JARVIS handler", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_WEBHOOK_SECRET = "test-secret";
  const received: Array<{ chatId: number; text: string }> = [];

  try {
    const app = express();
    app.locals.jarvisTelegramHandler = async ({ chatId, text }: { chatId: number; text: string }) => {
      received.push({ chatId, text });
    };
    app.use("/api/telegram", createTelegramRouter());
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    assert.ok(address && typeof address === "object");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/telegram/webhook`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-telegram-bot-api-secret-token": "test-secret",
        },
        body: JSON.stringify({ message: { chat: { id: 12345 }, text: "status" } }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
      await new Promise((resolve) => setImmediate(resolve));
      assert.deepEqual(received, [{ chatId: 12345, text: "status" }]);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
  }
});

test("Telegram webhook rejects an invalid configured secret", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_WEBHOOK_SECRET = "expected-secret";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/telegram/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": "wrong-secret" },
        body: JSON.stringify({ message: { chat: { id: 1 }, text: "hello" } }),
      });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { ok: false, error: "invalid webhook secret" });
    });
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
  }
});
