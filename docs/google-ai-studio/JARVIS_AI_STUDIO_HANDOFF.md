# JARVIS — Google AI Studio handoff (staging-safe)

## Purpose
Use Google AI Studio only to provision/inspect Gemini model access for the canonical JARVIS repository. The canonical application remains alkadyenjy2/enjY-ai-coo; do not create a second production backend or replace its auth, approval, audit, persistence, or orchestration layers.

## What the owner must do in Google
1. Sign in to the intended Google account and open https://aistudio.google.com/.
2. Open Get API key / API keys and create or select a key in the intended Google Cloud project.
3. Review the project, available model access, quotas, and billing/usage terms before enabling a billable model. Do not enable billing or accept paid terms without a separate decision.
4. Copy the key directly into the deployment platform's secret manager. Never paste it into ChatGPT, an issue, a PR, source code, a frontend variable, or a committed .env file.
5. Keep the key server-side as GEMINI_API_KEY. Do not use a VITE_* or other client-exposed variable name.
6. For local testing only, use an ignored local .env file and exclude it from shared artifacts. Never commit it.

## Repository contract
- Repo: https://github.com/alkadyenjy2/enjY-ai-coo
- Existing environment template: .env.example (placeholders only).
- Expected variable: GEMINI_API_KEY.
- Keep existing authorization, organization access, human approval, duplicate guard, evidence and audit gates intact.
- Do not call real Gmail, Telegram, Meta, Make, or other outbound integrations as part of an AI Studio test.
- Do not change production secrets, DNS, billing, deployments, or live model routing without separate explicit approval.
- Use a free, non-billable path where available. If Google shows billing requirements or uncertain cost, stop and report the requirement rather than enabling it.

## Safe verification sequence
1. Verify the key is saved in the intended staging service secret manager; never print its value.
2. Use existing project tests for model routing and configuration. A missing key should fail closed or report not_configured; it must not fake a successful model response.
3. Use a non-sensitive prompt such as: Reply with exactly: JARVIS GEMINI STAGING CHECK OK.
4. Verify only status, model name, latency and sanitized error category in logs. Do not log request headers, API keys, prompts containing personal data, or full provider responses.
5. Confirm a missing/invalid key returns a clear configuration/authentication error and does not trigger an alternate paid provider.
6. Leave production traffic and outbound automation unchanged.

## Important hosting note
Google AI Studio is a model-development/configuration surface, not a substitute for the JARVIS application host. The current Render staging service creation attempt was rejected because Render requires payment information. No card was added and no service was created. Do not upgrade to proceed.
