import assert from "node:assert/strict";
import test from "node:test";

test("Telegram runtime environment diagnostic reports only presence booleans and never secret values", async () => {
  const module = await import("./telegram-env-diagnostic");
  const result = module.getTelegramEnvDiagnostic({
    TELEGRAM_BOT_TOKEN: "secret-token",
    TELEGRAM_WEBHOOK_SECRET: "secret-webhook",
    JARVIS_TELEGRAM_REFRESH_TOKEN: "secret-refresh",
    JARVIS_TELEGRAM_ORGANIZATION_ID: "org-123",
    JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: "12345",
  });

  assert.deepEqual(result, {
    TELEGRAM_BOT_TOKEN: true,
    TELEGRAM_WEBHOOK_SECRET: true,
    JARVIS_TELEGRAM_REFRESH_TOKEN: true,
    JARVIS_TELEGRAM_ORGANIZATION_ID: true,
    JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: true,
  });
  assert.equal(JSON.stringify(result).includes("secret-token"), false);
  assert.equal(JSON.stringify(result).includes("secret-webhook"), false);
  assert.equal(JSON.stringify(result).includes("secret-refresh"), false);
});

test("Telegram runtime environment diagnostic reports missing and blank variables as false", async () => {
  const module = await import("./telegram-env-diagnostic");
  assert.deepEqual(module.getTelegramEnvDiagnostic({ TELEGRAM_BOT_TOKEN: "  " }), {
    TELEGRAM_BOT_TOKEN: false,
    TELEGRAM_WEBHOOK_SECRET: false,
    JARVIS_TELEGRAM_REFRESH_TOKEN: false,
    JARVIS_TELEGRAM_ORGANIZATION_ID: false,
    JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: false,
  });
});
