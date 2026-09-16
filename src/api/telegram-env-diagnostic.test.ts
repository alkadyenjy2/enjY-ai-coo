import { describe, expect, it } from "vitest";

describe("Telegram runtime environment diagnostic", () => {
  it("reports only presence booleans and never secret values", async () => {
    const module = await import("./telegram-env-diagnostic");
    const result = module.getTelegramEnvDiagnostic({
      TELEGRAM_BOT_TOKEN: "secret-token",
      TELEGRAM_WEBHOOK_SECRET: "secret-webhook",
      JARVIS_TELEGRAM_REFRESH_TOKEN: "secret-refresh",
      JARVIS_TELEGRAM_ORGANIZATION_ID: "org-123",
      JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: "12345",
    });

    expect(result).toEqual({
      TELEGRAM_BOT_TOKEN: true,
      TELEGRAM_WEBHOOK_SECRET: true,
      JARVIS_TELEGRAM_REFRESH_TOKEN: true,
      JARVIS_TELEGRAM_ORGANIZATION_ID: true,
      JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: true,
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
    expect(JSON.stringify(result)).not.toContain("secret-webhook");
    expect(JSON.stringify(result)).not.toContain("secret-refresh");
  });

  it("reports missing and blank variables as false", async () => {
    const module = await import("./telegram-env-diagnostic");
    expect(module.getTelegramEnvDiagnostic({ TELEGRAM_BOT_TOKEN: "  " })).toEqual({
      TELEGRAM_BOT_TOKEN: false,
      TELEGRAM_WEBHOOK_SECRET: false,
      JARVIS_TELEGRAM_REFRESH_TOKEN: false,
      JARVIS_TELEGRAM_ORGANIZATION_ID: false,
      JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: false,
    });
  });
});
