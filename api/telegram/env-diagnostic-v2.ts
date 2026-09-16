import { getTelegramEnvDiagnostic } from "../../src/api/telegram-env-diagnostic";

export default function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  res.status(200).json({
    ok: true,
    environment: getTelegramEnvDiagnostic({
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
      JARVIS_TELEGRAM_REFRESH_TOKEN: process.env.JARVIS_TELEGRAM_REFRESH_TOKEN,
      JARVIS_TELEGRAM_ORGANIZATION_ID: process.env.JARVIS_TELEGRAM_ORGANIZATION_ID,
      JARVIS_TELEGRAM_ALLOWED_CHAT_IDS: process.env.JARVIS_TELEGRAM_ALLOWED_CHAT_IDS,
    }),
  });
}
