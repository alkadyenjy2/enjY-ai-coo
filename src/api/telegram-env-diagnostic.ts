const TELEGRAM_ENV_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "JARVIS_TELEGRAM_REFRESH_TOKEN",
  "JARVIS_TELEGRAM_ORGANIZATION_ID",
  "JARVIS_TELEGRAM_ALLOWED_CHAT_IDS",
] as const;

type TelegramEnvKey = (typeof TELEGRAM_ENV_KEYS)[number];

export function getTelegramEnvDiagnostic(
  env: Partial<Record<TelegramEnvKey, string | undefined>>,
): Record<TelegramEnvKey, boolean> {
  return Object.fromEntries(
    TELEGRAM_ENV_KEYS.map((key) => [key, Boolean(env[key]?.trim())]),
  ) as Record<TelegramEnvKey, boolean>;
}
