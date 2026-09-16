export type TelegramEnvDiagnosticInput = Partial<Record<
  | "TELEGRAM_BOT_TOKEN"
  | "TELEGRAM_WEBHOOK_SECRET"
  | "JARVIS_TELEGRAM_REFRESH_TOKEN"
  | "JARVIS_TELEGRAM_ORGANIZATION_ID"
  | "JARVIS_TELEGRAM_ALLOWED_CHAT_IDS",
  string | undefined
>>;

const TELEGRAM_ENV_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "JARVIS_TELEGRAM_REFRESH_TOKEN",
  "JARVIS_TELEGRAM_ORGANIZATION_ID",
  "JARVIS_TELEGRAM_ALLOWED_CHAT_IDS",
] as const;

export function getTelegramEnvDiagnostic(
  env: TelegramEnvDiagnosticInput,
): Record<(typeof TELEGRAM_ENV_KEYS)[number], boolean> {
  return Object.fromEntries(
    TELEGRAM_ENV_KEYS.map((key) => [key, typeof env[key] === "string" && env[key].trim().length > 0]),
  ) as Record<(typeof TELEGRAM_ENV_KEYS)[number], boolean>;
}
