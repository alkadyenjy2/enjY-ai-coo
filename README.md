# AI CORE COO — AI Automation & Operations Systems

> AI automation systems that turn business conversations and operational events into qualified leads, CRM records, booked appointments, follow-ups, and verifiable execution.

## Portfolio Case Study — Clinic Lead-to-Booking Automation

**Role:** AI Automation Engineer / AI Systems Builder

**Use case:** Aesthetic-clinic lead automation across messaging channels.

**Workflow:**

```text
Lead Message → AI Receptionist → Qualification → CRM → Booking → Confirmation → Reminder → Follow-up → Human Handoff → Reporting
```

### Working automation demo

The portfolio demo uses **Make** as the orchestration layer, **Gemini** for AI lead qualification, and **Supabase** for structured CRM-style persistence and execution data.

Current non-production scenario:

- Make webhook intake
- AI qualification with lead score `0–100`
- Classification: `qualified | unqualified | needs_human`
- Primary-service extraction
- Idempotent lead upsert into Supabase
- Automated next-action selection
- Webhook response for the demo UI

The demo is intentionally isolated from the production Roofing revenue workflow.

### Runnable demo (this repository)

The interactive case study lives in this repo and runs with no credentials:

```bash
npm install
npm run dev          # http://localhost:3000 → "Clinic Demo" view
npm run test:clinic-demo
npm run build
```

What the demo actually executes:

| Stage | Implementation in this repo |
| --- | --- |
| Message intake | `POST /api/clinic/leads` — channel normalisation (`whatsapp` / `instagram` / `messenger` / `web`) + idempotency key |
| AI receptionist | Deterministic reply generator; no invented clinic pricing, no medical advice |
| Qualification | `qualifyLead()` returns `{ lead_score, status, qualification_reason, primary_service }` — the same contract the Make Gemini module must return |
| CRM | `clinic_demo_leads`-shaped records with `idempotency_key`, `next_action`, `handoff_required` |
| Booking | Labelled `demo-booking-adapter`, idempotent appointment creation |
| Confirmation + reminders | Confirmation, `+24h` reminder, same-day reminder on a deterministic virtual clock |
| Unbooked follow-up | Bounded ladder (`+6h`, `+24h`) that auto-stops once the lead books |
| Human handoff | Clinical-safety terms force `status = needs_human`, `handoff_required = true`, AI autonomy halted, escalation event logged |
| Reporting | `GET /api/clinic/metrics` aggregates conversations, qualified, booked, booking rate, follow-ups, handoffs, reminders, duplicates absorbed |

Code map:

- `src/clinic/engine.ts` — the pipeline engine (pure, deterministic, unit-tested)
- `src/clinic/routes.ts` — public `/api/clinic/*` API, mounted in `server.ts`
- `src/clinic/types.ts` — shared contracts (also the browser bundle's type source)
- `src/components/clinic/*` — the demo UI (workflow diagram, conversation, qualification, CRM, booking, reminders, follow-up, handoff, reporting)
- `tests/clinic-demo.test.ts`, `tests/clinic-routes.test.ts` — engine + API contract tests

> CI note: `.github/workflows/ci.yml` was **not** modified — the integration bot
> cannot write workflow files (GitHub Apps need the `workflows` permission for
> that). To gate the demo in CI, add this step to the `ci` job:
>
> ```yaml
> - name: Clinic demo engine + API contract tests
>   run: npm run test:clinic-demo
> ```

The UI always labels its own runtime: `DEMO · IN-MEMORY` versus `LIVE · SUPABASE`, and
`demo-booking-adapter` / `demo-notification-adapter` are named in the interface rather than
presented as live provider integrations.

### Optional live wiring

| Variable | Effect when set |
| --- | --- |
| `MAKE_CLINIC_WEBHOOK_URL` | The **Run Live Make Demo** button proxies the demo lead to the real Make webhook server-side and shows the real HTTP outcome. Unset, it reports `not_configured` instead of faking success. |
| `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | Enables the existing Supabase-backed persistence path used by the rest of the app. |

The browser bundle never receives a Make URL, a service-role key or any credential; the
webhook call is proxied through `/api/clinic/make-webhook`.

### Verification status (honest)

- **Verified here:** `npm run lint`, `npm run build`, and 26 passing tests covering qualification, idempotency, duplicate absorption, booking, reminders, bounded follow-up, handoff and metrics.
- **Not verified:** an end-to-end **Make execution** for scenario `7290390`. The webhook has previously returned *Accepted* without a corresponding entry in the scenario execution list. An HTTP 200 from Make only proves delivery was accepted — it is not evidence of a run. Until a real execution is inspected module-by-module (Webhook → Gemini → Supabase → Response) with a persisted CRM row, the Make leg is treated as **unproven**, not as working.
- **Not connected:** live WhatsApp / Instagram / Messenger credentials. The intake webhook is the normalised intake layer; no live channel is claimed.

## Core AI Operations System

AI CORE COO is an operating layer around AI models rather than a simple chatbot.

- Natural-language command center backed by an Express API and Gemini.
- Durable orchestration with Temporal workflows and retry policies.
- Human-approval signaling for side-effecting operations.
- Evidence/verification gates before completion.
- Operational history and execution logs for observability.
- Provider boundaries for external capabilities.
- Integrations for research, publishing, payments, lead qualification, CRM delivery, and operational auditing.
- Automated CI checks covering type safety, builds, operational-log mapping, and integration contracts.

## Reliability Patterns

- Event IDs and correlation IDs
- Idempotency keys
- Explicit qualification states
- CRM/source-of-truth boundaries
- Retry and error-handler design
- Execution logging
- Human handoff for uncertain or clinical-specific requests
- Verification before declaring an automation complete

## Architecture

```text
Customer Message
      ↓
Intake Layer
      ↓
AI Classification
      ↓
Qualification + Lead Score
      ↓
CRM / Data Layer
      ↓
Booking
      ↓
Confirmation + Reminder
      ↓
Follow-up / Human Handoff
      ↓
Reporting
```

## Stack

- Make — workflow orchestration
- Supabase — data/CRM persistence
- Google Gemini — AI qualification
- React 19 + Vite + TypeScript
- Express
- Temporal
- Browser Use Cloud
- Tailwind CSS
- GitHub Actions
- Vercel

## Engineering Proof

The repository contains a real Temporal workflow state machine with explicit states such as `RECEIVED`, `ROUTED`, `DISPATCHED`, `WAITING_FOR_APPROVAL`, `EXECUTED`, `VERIFIED`, `COMPLETED`, `REJECTED`, and `FAILED`.

External providers remain behind application-owned execution contracts. The portfolio focuses on the engineering layer around the model: orchestration, reliability, approvals, verification, auditability, integrations, and operational history.

## Portfolio Positioning

Relevant roles:

- AI Automation Engineer
- AI Integration Engineer
- AI Operations Engineer
- AI Agent Engineer
- Workflow Automation Engineer
- AI Systems Engineer

## About the Builder

**Enjy Alkady** — AI automation and operations systems builder focused on practical business automation, CRM workflows, AI qualification, integrations, and reliable execution.

The portfolio emphasizes working systems and verifiable architecture over chatbot-only demos.

## Status

Portfolio systems are actively being hardened and documented. Claims are limited to capabilities represented by the repositories and connected automation environments; production-scale metrics are not claimed unless independently measured.
