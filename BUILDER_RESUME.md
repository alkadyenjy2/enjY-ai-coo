# Builder Resume Handoff

Purpose: resume canonical JARVIS work without redesign.

Canonical branch: main
Last GitHub HEAD audited: 92af38dc2fa1c7870a92fadad752d55ce0c975f4
Stack observed: React/Vite/Express/TypeScript + Supabase + Browser Use.

Architecture is frozen: Auth/identity authority → intent/policy gate → human approval where required → real capability dispatch → duplicate guard → evidence verification → audit/history.

Rules:
- Do not introduce n8n/Inngest/Make as the JARVIS orchestrator.
- Do not bypass approval, authority, duplicate guard, or evidence gates.
- No synthetic success or fake persistence.
- Supabase must fail closed when unconfigured.
- Browser Use/Gmail/Telegram/external providers must fail closed without real credentials.
- Pull/read main first; smallest surgical fix only.
- Run the existing targeted tests and full verification before commit.
- Commit verified changes to GitHub before spending builder credits.

Known package scripts include auth E2E, webhook signatures, production guardrails, Telegram, Browser Worker, lifecycle, persistence-context, and routing tests.
