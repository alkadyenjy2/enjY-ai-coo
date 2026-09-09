#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
from pathlib import Path
p=Path('server.ts'); s=p.read_text()
s=s.replace('import { clinicRouter } from "./src/clinic/routes";\n','import { clinicRouter } from "./src/clinic/routes";\nimport { gmailRouter } from "./src/api/agent/tools/gmail-router";\n',1)
s=s.replace('const isExecutionIntent = /نفذ الخطة|نفذ|تحديث|تعديل السجلات|update|patch|execute|run workflow|تشغيل/i.test(p);','const isExecutionIntent = /نفذ الخطة|نفذ|تحديث|تعديل السجلات|update|patch|execute|run workflow|تشغيل|send_email|send email|ابعت ايميل|ارسل ايميل|إرسال بريد|إرسال إيميل|send mail/i.test(p);',1)
s=s.replace('EXECUTION: ["query_supabase", "update_supabase", "check_connector_status"],','EXECUTION: ["query_supabase", "update_supabase", "check_connector_status", "send_email"],',1)
s=s.replace('const { prompt, userProfile, activeProject, memoryContext, model = "gemini-3.6-flash" } = req.body;','const { prompt, userProfile, activeProject, memoryContext, model = "gemini-3.6-flash", gmailApprovalConfirmed = false } = req.body;',1)
old='const isSensitiveAction = /(send_email|delete|drop_table|transfer_funds|change_credentials|post_external|حذف|مسح_جدول|إلغاء_دائم)/i.test(userPromptStr);\n  if (isSensitiveAction) {'
new='const isSensitiveAction = /(send_email|delete|drop_table|transfer_funds|change_credentials|post_external|حذف|مسح_جدول|إلغاء_دائم)/i.test(userPromptStr);\n  const isEmailSendAction = /(send_email|send email|ابعت ايميل|ارسل ايميل|إرسال بريد|إرسال إيميل|send mail)/i.test(userPromptStr);\n  const emailApprovalGranted = isEmailSendAction && gmailApprovalConfirmed === true;\n  if (isSensitiveAction && !emailApprovalGranted) {'
s=s.replace(old,new,1)
marker='''            required: ["table", "matchColumn", "matchValue", "updatePayload"]\n          }\n        }\n      );'''
repl='''            required: ["table", "matchColumn", "matchValue", "updatePayload"]\n          }\n        },\n        {\n          name: "send_email",\n          description: "Sends one explicit email through the connected Gmail account. Only use when the request is explicitly approved by the human operator.",\n          parameters: {\n            type: Type.OBJECT,\n            properties: {\n              to: { type: Type.STRING, description: "Recipient email address." },\n              subject: { type: Type.STRING, description: "Email subject." },\n              body: { type: Type.STRING, description: "Plain-text email body." }\n            },\n            required: ["to", "subject", "body"]\n          }\n        }\n      );'''
if marker not in s: raise SystemExit('send declaration marker missing')
s=s.replace(marker,repl,1)
marker='''      } else if (call.name === "query_supabase" && supabaseUrl && supabaseApiKey) {'''
repl='''      } else if (call.name === "send_email") {\n        if (!emailApprovalGranted) {\n          executionErrors.push("Explicit human approval is required before sending email.");\n          verificationStatus = "FAILED";\n          responseText = "🔒 **[Human Approval Required]** إرسال الإيميل متوقف حتى يتم تأكيد الموافقة البشرية صراحةً.";\n          actionsTakenList.push({ tool: 'Human Approval Gate', status: 'blocked', details: 'send_email requires gmailApprovalConfirmed=true.' });\n        } else {\n          const args = (call.args || {}) as any;\n          try {\n            const sendResult = await gmailRouter({ action: "send", params: { to: args.to, subject: args.subject, body: args.body } });\n            const messageId = (sendResult as any)?.messageId;\n            if (!messageId) throw new Error("Gmail send returned no messageId.");\n            const verifyResult = await gmailRouter({ action: "verify", params: { messageId } });\n            const verified = Boolean((verifyResult as any)?.verified);\n            verificationStatus = verified ? "VERIFIED" : "FAILED";\n            actionsTakenList.push({ tool: 'Gmail Send Tool', status: 'success', details: `Sent email to ${args.to}; messageId=${messageId}` });\n            actionsTakenList.push({ tool: 'Gmail Verification Tool', status: verified ? 'success' : 'failed', details: `Post-send Gmail verification: ${JSON.stringify(verifyResult)}` });\n            responseText = verified ? `### 📧 Gmail — Email Sent & Verified\\n* **To:** \\`${args.to}\\`\\n* **Subject:** \\`${args.subject}\\`\\n* **Message ID:** \\`${messageId}\\`\\n* **Verification:** \\`VERIFIED\\`` : `⚠️ تم إرسال الإيميل لكن فشل التحقق من حالة الرسالة في Gmail. Message ID: \\`${messageId}\\``;\n          } catch (gmailErr: any) {\n            executionErrors.push(gmailErr?.message || String(gmailErr));\n            verificationStatus = "FAILED";\n            actionsTakenList.push({ tool: 'Gmail Send Tool', status: 'error', details: gmailErr?.message || String(gmailErr) });\n            responseText = `❌ فشل تنفيذ Gmail send_email: ${gmailErr?.message || String(gmailErr)}`;\n          }\n        }\n      } else if (call.name === "query_supabase" && supabaseUrl && supabaseApiKey) {'''
if marker not in s: raise SystemExit('send dispatch marker missing')
s=s.replace(marker,repl,1)
marker='''  if (connLower.includes("gemini")) {'''
repl='''  if (connLower.includes("gmail")) {\n    const hasGmail = Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);\n    return res.json({ status: hasGmail ? "REAL_LIVE" : "UNCONFIGURED", connectorId: "gmail", message: hasGmail ? "Gmail OAuth credentials configured." : "Gmail OAuth credentials missing.", authPresent: hasGmail, actualCall: false, latencyMs: 5, capabilitiesDiscovered: ["send_email", "verify_sent_email", "list_recent_emails"], evidence: hasGmail ? "Gmail OAuth runtime credentials present." : "Missing Gmail OAuth runtime credentials." });\n  }\n\n  if (connLower.includes("gemini")) {'''
if marker not in s: raise SystemExit('gmail status marker missing')
s=s.replace(marker,repl,1)
marker="    'STRIPE_WEBHOOK_SECRET'\n  ];"
repl="    'STRIPE_WEBHOOK_SECRET',\n    'GMAIL_CLIENT_ID',\n    'GMAIL_CLIENT_SECRET',\n    'GMAIL_REFRESH_TOKEN'\n  ];"
if marker not in s: raise SystemExit('env marker missing')
s=s.replace(marker,repl,1)
p.write_text(s)
PY
npm run lint
npm run build
