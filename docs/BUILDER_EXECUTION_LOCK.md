# Builder Execution Lock — Portfolio Closure

Date: 2026-10-04

## Source-of-truth rule

- GitHub repository code is implementation truth.
- Existing production databases/integrations are reused.
- Existing Notion/project plans are business/product truth when available.
- Builder/Lovable is an execution surface, not a second source of truth.
- Never create a competing backend, database, workflow engine, or orchestration runtime.
- Never mark an external integration VERIFIED without a real authenticated runtime result.
- Never fabricate production data, receipts, analytics, provider results, users, leads, or publication IDs.

## Global execution contract

For every project:
1. Inspect current repo and existing agent/integration code first.
2. Inspect project plan, README/AGENTS/roadmap, and Home/dashboard route.
3. Reuse existing code and adapters.
4. Make the smallest changes required for the acceptance criteria.
5. Build/typecheck/tests/browser smoke where applicable.
6. Fix failures in the same run.
7. Repeat verification after fixes.
8. Stop only at VERIFIED/PASS or a precise external blocker.
9. Do not ask architecture/tool/framework questions already settled by the repo.
10. Do not spend paid provider credits merely to test or manufacture green status.

## Project matrix

### JARVIS / AI CORE COO
Canonical repo: `alkadyenjy2/enjY-ai-coo`
Production: `https://enj-y-ai-coo.vercel.app`
Locked architecture:
Auth -> Intent Policy Gate -> Human Approval Gate -> Duplicate Guard -> Execution Adapters -> Evidence -> Audit.

Current production commit: `5a03ecba2733e805c274e9bb333845f810b9310d`
Current Vercel deployment: READY.
Implemented: auth boundary, org authorization, command routing, execution/audit path, adapters, production health/readiness, Scholarship Discovery route + tests.
Remaining: Telegram production security credentials/identity; fresh behavioral proof for BrowserSkill/Gmail/Meta where applicable; autonomous scheduling proof; current-commit GitHub CI evidence.

Do not replace orchestration with Temporal/Inngest/n8n.

### Short Drama World / 7mody
Canonical repo: `alkadyenjy2/alkadyenjy2-short-drama-video-agent`
Lovable cockpit: `49e2efaf-f8eb-4630-974d-6ec9573b088a`
Canonical universe: THE ENVELOPE.
Cockpit must remain a control surface around the canonical backend.
Latest cockpit fix commit: `b78382a42d49c019a02c424e3039232040379181`.
Verified in cockpit: typecheck, 1 test, build, nine-route browser smoke, no console/page errors.
External blockers remain: YouTube/TikTok/Meta credentials/approvals, canonical backend deployment URL, real generation provider endpoint/key, Railway activation, Telegram service alignment, partial Notion agent discovery.
Never fabricate publication or analytics.

### NileCare
Lovable project: `499c2cbb-0be3-481b-88cd-a6654095b1f1`.
Repo: `alkadyenjy2/NileCare`.
Goal: small medical-travel coordination CRM, not a medical provider.
Rules: no diagnosis, treatment recommendation, fabricated clinics/prices/claims.
Existing Cloud schema/RLS design is intentional and evidence-oriented.
Known unfinished work from latest Builder run: request-form type errors, admin dashboard/leads/clinics pages, first-admin claim flow, and full acceptance-test run.
Do not add AI, Meta, WhatsApp, Paymob, or complex workflow systems.

### IncomeOS / Flourish
Lovable project: `2b70779a-db92-4c99-85f6-4843ea7c37e6`.
Repo: `alkadyenjy2/IncomeOS`.
Existing stack: Expo/React Native + Supabase.
Current Builder state: core product exists; latest design pass completed Arabic font work, but remaining roadmap includes Home/"Your step today", Spark/companions, remaining page polish, and richer visual system.
Do not let a design pass replace functional completion. Preserve existing auth/data logic.

### Hub Dashboard
Lovable project: `1b825ff5-86d8-475f-904d-a3f03afe8bb0`.
Purpose: internal registry of AI/free tools mapped to projects.
Current implementation is local-browser data oriented.
Completion requires reliable CRUD/search/filter/export and a clear project/source-of-truth model; do not invent external integrations.

### Side Hustle Compass
Lovable project: `03f267cc-7e6b-48ec-b76e-82a0f3e96142`.
Purpose: mobile-first side-hustle/tool discovery registry.
Keep RTL/Egyptian-Arabic accessibility and local persistence.
Do not let visual redesign substitute for data/flow completion.

### Pixel Perfect Replication
Lovable project: `1f6d39fd-c35a-454e-b992-6fc4de9478eb`.
Purpose: screenshot-to-UI fidelity tool.
Treat as a utility, not a production business system. Acceptance is faithful rendering, responsive behavior, and no runtime errors.

### ZE Outsourcing AI Ops
Canonical repo: `alkadyenjy2/ze-outsourcing-ai-ops`.
Core revenue loop is historically production-verified:
Webhook -> Gemini qualification -> parse -> Supabase lead upsert -> audit log -> lifecycle routing -> provider-agnostic call queue.
Do not rebuild Make scenarios.
Known boundaries: Instagram publishing and Facebook comment ingestion remain unverified/blocked where credentials/permissions are missing.
Keep outbound calling dry-run by default.

### ZA Media AI Growth Engine
Repo: `alkadyenjy2/ZA-Media-AI-Growth-Engine02`.
Reuse existing Express/Vite/Supabase/Gemini stack.
Do not create a second marketing orchestration platform.
Verify real integrations before green status.

## One-shot Builder prompt contract

The Builder prompt for a project must:
- name the exact canonical repo/project;
- state what is already implemented;
- list exact acceptance criteria;
- list known blockers;
- forbid rebuilds and fake data;
- require inspect -> implement -> test -> fix -> verify in one run;
- require a factual final report with changed files, verification, blockers, preview and commit SHA;
- forbid questions unless an irreversible destructive action is required;
- forbid paid-provider calls unless credentials are already authenticated and the call is a real required production operation.

## Definition of Done

A project is closed only when:
- required Home/dashboard route exists and represents the real product state;
- core flows are implemented;
- existing agents/tools are wired to real boundaries;
- auth/authorization is enforced where needed;
- build/typecheck passes;
- available tests pass;
- browser smoke passes for web apps;
- production/deployment state is verified where deployment exists;
- external blockers are explicit and fail-closed;
- no fake success states exist.

