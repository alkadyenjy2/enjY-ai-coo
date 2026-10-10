/**
 * Canonical portfolio context injected into JARVIS command reasoning.
 * Keep this compact and safety-critical; the linked Markdown document is the detailed reference.
 */
export function getPortfolioContext(): string {
  return `
CANONICAL PORTFOLIO CONTEXT (source of truth: docs/MASTER_PORTFOLIO_CONTEXT.md)
Use this context for portfolio questions and task routing. These notes include historical status; verify live state before making current claims.

1) JARVIS / ENJY AI COO — portfolio coordinator and personal AI COO for intent, planning, authorized execution, verification, audit, recovery and reporting. Repo: alkadyenjy2/enjY-ai-coo. Known components: Vercel, Supabase, Telegram (@Alkadyenjybot), Gmail verification, model gateway and memory gateway. Preserve Auth → Intent Policy Gate → Human Approval → Duplicate Guard → Execution → Evidence → Audit. No parallel orchestrator or backend replacement.

2) Side Hustle Hub / IdeaCollector — capture, organize and retrieve side-hustle ideas; separate from JARVIS. Repo: alkadyenjy2/saved-ideas-dashboard; Vercel project side-hustle-hub. Public access/persistence must be verified.

3) RIZKAHA / FLOURISH — career, CV, opportunities and career-growth support. Canonical backend is Firebase/Firestore, NOT Supabase. Verify authenticated persistence; do not migrate casually.

4) ZA Media AI Growth Engine — media growth, lead intake/qualification, evidence packs and revenue workflow. Repo: alkadyenjy2/za-media-ai-growth-engine. Canonical backend/runtime is Convex ONLY; React + convex/react. Do not add Supabase runtime or Vercel API routes. Canonical host https://qualified-nightingale-421.eu-west-1.convex.site; Meta webhook /meta-webhook. PRODUCTION_OUTBOUND_FROZEN = true: no outbound sending or unfreezing without explicit authorization and passing evidence gates. Previously checked /health was 404 and webhook 503 due to missing META_VERIFY_TOKEN; recheck live state.

5) ZE Outsource — managed outsourcing acquisition: discover → qualify → email/DM outreach → capture/dedup → matching → evidence pack → reply tracking → reporting. Markets USA, Saudi Arabia, UAE, Qatar, Bahrain; Egypt removed. Email and DMs only; no cold calls; Zoom/WhatsApp only after a reply. Stack includes Supabase project aislifqpskbduzvvbepz, Edge Function revenue-loop-persist, scenario-specific Make, Meta inbox, and research/outreach options Apollo, Firecrawl, Browser Use, AgentMail/Resend (verify current connections). Do not send until data integrity, consent/DNC, approval and idempotency are verified; no fake leads.

6) Short Drama World — episodic short-form drama production, rendering, asset tracking and publishing evidence. Repo: alkadyenjy2-short-drama-video-agent. THE ENVELOPE and THE LAST VOICEMAIL are known titles. Do not call anything published without a platform receipt; provider credentials/database status previously blocked full production proof.

7) Scholarship OS / Hidden Scholarships — help Egyptian and Arab/MENA students 17–28 find and qualify for Bachelor/Master scholarships, prepare documents, apply and track deadlines. Repo: alkadyenjy2/Scholarship-AI-Agent-Team. Official sources and evidence quote required; last_verified_at within 30 days plus confidence. No source means do not publish; empty state beats fake data. No ads before $500 MRR; proposed $9 Document Pro and $19 Deadline Alerts Pro.

8) NileCare — coordination-only medical travel and logistics, not diagnosis/treatment. Repo: alkadyenjy2/NileCare; Neon database; staging https://nilecare-psi.vercel.app. Do not use Paymob. Production persistence was previously unverified/empty.

9) Roofing AI Operations / Dialer — roofing operations and authenticated dashboard/metrics. Repo: alkadyenjy2/roofing-ai-operations; Vercel + Supabase session/RLS. Separate from ZE Outsource. /api/health previously returned 200, dashboard-metrics returned 401 without valid session; never bypass auth/RLS.

SHARED TOOL BOUNDARIES:
- GitHub = implementation/CI/PR/deployment evidence. Notion = product/business truth (connection must be verified).
- Remote Desktop Commander = authorized local inspection; never print secrets. Browser Use = UI evidence, not backend proof.
- Supabase is used by JARVIS, ZE and Roofing; NOT RIZKAHA or ZA Media runtime. Firebase/Firestore belongs to RIZKAHA. Convex belongs to ZA Media. Neon belongs to NileCare.
- Vercel hosts several frontends/services but URL alone does not prove deployment health. Cloudflare Pages was only a ZA Media frontend preview, not backend proof. Make is scenario-specific; never add a second orchestrator.
- Keep projects distinct. No fabricated leads, scholarships, users, webhook events, outreach or test outcomes. No sends, calls, publishing, spending, production writes or unapproved deployments without required authorization.
- Start read-only, reuse existing connections, prefer free/zero-cost paths, then EXECUTE and VERIFY. Status must be Verified / Failed / Blocked / Not checked. “Done/pass/healthy/deployed” requires fresh evidence (SHA, CI/runtime, canonical endpoint, database/session or provider receipt).
- If user asks for full detail, point to docs/MASTER_PORTFOLIO_CONTEXT.md and verify the current state rather than treating historical notes as current facts.
`.trim();
}
