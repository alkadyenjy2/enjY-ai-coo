import "dotenv/config";
import { sendEmail, verifyEmailSent } from "../src/api/agent/tools/gmail";

async function main() {
  if (process.env.GMAIL_LIVE_TEST !== "true") {
    console.log("🧪 Gmail tool test is configured but LIVE sending is disabled.");
    console.log("Set GMAIL_LIVE_TEST=true and GMAIL_TEST_TO=<your test inbox> to send one real test email.");
    return;
  }

  const to = process.env.GMAIL_TEST_TO;
  if (!to) throw new Error("GMAIL_TEST_TO is required when GMAIL_LIVE_TEST=true.");

  console.log("🧪 Testing Gmail Tool...");
  const result = await sendEmail(
    to,
    "JARVIS Gmail Tool Test",
    "This is a live verification email from JARVIS AI COO.\n\nIf you received this, Gmail execution is working.",
  );
  console.log("✅ Email sent:", result);

  const verified = await verifyEmailSent(result.messageId);
  console.log("🔎 Verification:", verified);

  if (!verified.verified) {
    throw new Error("Gmail send completed but SENT-label verification failed.");
  }

  console.log("🎉 Gmail live test PASSED.");
}

main().catch((error) => {
  console.error("❌ Gmail live test FAILED:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
