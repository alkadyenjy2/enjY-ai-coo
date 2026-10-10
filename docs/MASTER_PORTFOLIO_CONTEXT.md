# JARVIS Master Portfolio Context

**Purpose:** Canonical portfolio-level handoff for JARVIS (AI COO). This describes project purpose, canonical integrations and operating rules. It is not proof that every connector is currently connected or that any service is production-ready. Verify live state before execution.

## JARVIS / ENJY AI COO
- Purpose: personal AI COO and portfolio coordinator for intent understanding, planning, authorized execution, evidence verification, audit, recovery and reporting.
- Canonical repo: https://github.com/alkadyenjy2/enjY-ai-coo
- Known systems: Vercel project `enj-y-ai-coo`, Telegram bot `@Alkadyenjybot`, Supabase for persistence/audit, Gmail verification, model gateway/fallback, memory gateway and browser/tool adapters.
- Architecture: Auth → Intent Policy Gate → Human Approval Gate → Duplicate Guard → Execution Adapters → Evidence → Audit. Preserve tenant authority, approval, evidence and recovery gates. Do not introduce Temporal alternatives, Inngest, n8n, or a second orchestrator; do not replace the canonical backend.
- Previously observed blockers (recheck before relying): Vercel Auth perimeter OFF; Supabase audit-log read 401; model fallback review; Notion connection not verified.

## Side Hustle Hub / IdeaCollector
- Purpose: capture, organize, score and revisit side-hustle ideas. This is separate from JARVIS.
- Canonical repo: https://github.com/alkadyenjy2/saved-ideas-dashboard
- Host: Vercel project `side-hustle-hub`. A previously checked URL showed Deployment Protection/login, so public access was not certified. A related IdeaCollector repo/trigger may be separate.
- Goal: reliable personal idea capture/retrieval using real persistence, no fabricated records.

## RIZKAHA / FLOURISH
- Purpose: career and opportunity platform, including CV and career-growth support for women.
- Canonical data backend: Firebase / Firestore, NOT Supabase.
- Previous checks: production home/health 200 and security suite 50/50; authenticated persistence was not fully verified.
- Goal: secure, real user journeys and saved user data. Do not migrate backend casually.

## ZA Media AI Growth Engine
- Purpose: media/growth, lead intake, qualification, evidence packs and revenue workflow.
- Repo: https://github.com/alkadyenjy2/za-media-ai-growth-engine
- Canonical runtime: Convex ONLY; React + `convex/react`. Do not add Supabase runtime or Vercel API routes.
- Convex host: https://qualified-nightingale-421.eu-west-1.convex.site
- Webhook: https://qualified-nightingale-421.eu-west-1.convex.site/meta-webhook
- Tools: GitHub/CI, Convex, Cloudflare Pages frontend preview, Vercel (account-level deployment block previously reported), Meta integration and Notion CRM/evidence.
- Safety: `PRODUCTION_OUTBOUND_FROZEN = true`; do not send messages or unfreeze outbound without explicit authorization and passing evidence gates.
- Last verified blockers: PR #19 adds GET /health but was open/unmerged; live Convex /health returned 404; webhook returned 503 due to missing `META_VERIFY_TOKEN` in the checked environment. Cloudflare preview served frontend HTML, not backend health proof. Recheck canonical Convex /health JSON 200 and webhook after an authorized deploy/configuration.

## ZE Outsource
- Purpose: managed outsourcing acquisition: Lead Discovery → Qualification → email/DM outreach → capture/dedup → matching → evidence pack → reply tracking → reporting.
- Markets: USA, Saudi Arabia, UAE, Qatar and Bahrain; Egypt removed. Email and direct messages only; no cold calls. Zoom/WhatsApp only after a response.
- Systems: Supabase project `aislifqpskbduzvvbepz`, Edge Function `revenue-loop-persist`, scenario-specific Make Revenue Loop (scenario 7018414 was previously paused/over quota), Meta/Facebook inbox for `Ze outsourcing LLC`; Apollo, Firecrawl, Browser Use, AgentMail/Resend are prospect research/outreach options whose current connections must be verified.
- Previous audit: 613 leads; 608 keyed rows with 608 distinct idempotency keys; 5 rows missing keys. Upsert and audit were separate operations (partial persistence risk), and duplicate flag was unreliable. Make quota was 1002/1000, reset 2026-10-19 at last audit.
- Goal: real qualified prospects and compliant, auditable outreach. No fake leads. Do not send until data integrity, consent/DNC, approval and idempotency are verified. Never activate a webhook-only scenario without a complete processing chain.

## Short Drama World
- Purpose: episodic short-form drama production, rendering, asset tracking and publishing evidence.
- Repo: https://github.com/alkadyenjy2-short-drama-video-agent
- Work: THE ENVELOPE (30 episodes; EP01 reported published, EP02–10 need rerender, EP11–30 visuals planned); THE LAST VOICEMAIL pilot EP02–06 verified.
- Previous status: health/video routes 200, but DB status false, provider/platform credentials missing and publishing receipts unavailable. Never claim an episode published without a platform receipt.

## Scholarship OS — Hidden Scholarships
- Purpose: help Egyptian and Arab/MENA students ages 17–28 (Bachelor/Master) discover, match, check eligibility, save, prepare, apply, track deadlines and follow up.
- Repo: https://github.com/alkadyenjy2/Scholarship-AI-Agent-Team (verify repository/branch permissions before writes).
- Workflow: Profile → Discover → Match → Check Eligibility → Save → Prepare → Apply → Track → Follow Up.
- Evidence policy: official sources, evidence quote, `last_verified_at` within 30 days and confidence score; no source means do not publish. Empty state beats fake data.
- Business assumptions: no ads before $500 MRR; proposed $9 Document Pro and $19 Deadline Alerts Pro. Previous blockers included OCR secrets, Supabase access, DB-backed UI coverage and scholarship research.

## NileCare
- Purpose: coordination-only medical travel, provider discovery and logistics; not diagnosis or treatment.
- Repo: https://github.com/alkadyenjy2/NileCare
- Stack: Neon; staging https://nilecare-psi.vercel.app. User preference: do not use Paymob.
- Previous checks: health 200 and tests 32/32, but production tables were empty. Verify persistence before claiming operational readiness.

## Roofing AI Operations / Dialer
- Purpose: roofing operations, dashboard/metrics and lead workflow; separate from ZE Outsource.
- Repo: https://github.com/alkadyenjy2/roofing-ai-operations
- Stack: Vercel + Supabase-authenticated dashboard/metrics.
- Previous checks: `/api/health` returned 200; `/api/dashboard-metrics` returned 401 without a valid Supabase session. An owner session is required to verify metrics; never bypass session/RLS or expose credentials.

## Shared tool and data boundaries
- GitHub: implementation truth, source, CI, PR and deploy evidence.
- Notion: product/business truth and decisions; integration must be verified.
- Remote Desktop Commander: authorized local inspection/execution; never print secret values.
- Browser Use: real UI flow inspection; not a substitute for backend/runtime proof.
- Supabase: JARVIS, ZE and Roofing; NOT RIZKAHA or ZA Media runtime.
- Firebase/Firestore: RIZKAHA.
- Convex: ZA Media.
- Neon: NileCare.
- Vercel: JARVIS, Side Hustle Hub, Roofing, NileCare and some frontends; a URL/project alone does not prove a healthy deploy.
- Cloudflare Pages: ZA Media frontend preview only unless backend deployment is independently proven.
- Make: scenario-specific only; do not introduce another orchestrator.
- Meta/Facebook: page, token, permissions and webhook must each be independently verified.
- Apollo/Firecrawl/Browser Use/AgentMail/Resend: ZE research/outreach options subject to live connection, consent/DNC and approval checks.

## Mandatory JARVIS operating rules
1. Follow AUDIT → REUSE → CONNECT → EXECUTE → VERIFY → FIX → VERIFY → FINAL AUDIT → REPORT.
2. Start with read-only audit; reuse existing repos, accounts, sessions and tools; prioritize free/local paths.
3. Keep project boundaries and canonical backends. No casual migration or parallel orchestrator.
4. Never fabricate leads, scholarships, users, events, webhooks, outreach or test outcomes.
5. No outbound sending, calling, publishing, spending, production writes or unapproved deployments without the applicable authorization/gates.
6. Status labels: **Verified / Failed / Blocked / Not checked**. Separate fresh observations from historical notes.
7. “Done/pass/healthy/deployed” requires fresh evidence: exact SHA, CI/runtime result, canonical endpoint response, database/session proof or provider receipt.
8. Never request secrets in chat. If an owner-only action is required, name the precise blocker and do not claim completion.
9. Report primary provider, free/authorized fallback, whether cost/quota was consumed, evidence links and remaining blockers.
10. Maintain a compact human-blockers table.