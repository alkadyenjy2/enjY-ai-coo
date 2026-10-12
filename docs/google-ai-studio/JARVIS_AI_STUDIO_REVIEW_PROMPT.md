You are reviewing the existing JARVIS AI COO project, not creating a replacement product.

Canonical repository: https://github.com/alkadyenjy2/enjY-ai-coo

Goal: prepare a minimal, server-side Gemini configuration/verification plan for a non-production staging environment. Preserve the existing application architecture and authorization controls.

Hard constraints:
- Do not ask the user to paste secrets into chat or source code.
- Do not expose GEMINI_API_KEY in browser/client code, VITE_* variables, logs, generated artifacts, or screenshots.
- Do not add a second backend, database, orchestrator, authentication system, or alternate production deployment.
- Do not weaken authentication, organization access, approval gates, duplicate prevention, evidence collection, or audit logging.
- Do not send emails, messages, Meta events, or invoke live external automations.
- Do not activate a billable model route, paid plan, or Google Cloud billing.
- If this interface requires billing or does not support a server-side secret, stop and explain the blocker instead of bypassing it.

Tasks:
1. Identify the existing server-side Gemini integration and the current GEMINI_API_KEY contract.
2. Recommend the smallest code/config changes only if needed; prefer no code changes when existing support is sufficient.
3. Provide a sanitized, non-sensitive smoke-test procedure and expected outcomes for configured, missing, and invalid keys.
4. Ensure tests never require a real API key and never call a live provider by default.
5. Return a concise report listing exact files changed (if any), tests run, results, and any manual owner actions still required.

Do not claim a deployment or successful live model call unless it was actually executed and verified.