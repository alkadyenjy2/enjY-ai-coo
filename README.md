# AI CORE COO — AI Automation & Operations Systems

> AI automation systems that turn business conversations and operational events into qualified leads, CRM records, booked appointments, follow-ups, and verifiable execution.

## Career / ATS Documents

- [Canonical AI Operations & Automation resume](docs/ENJY_ALKADY_AI_OPERATIONS_RESUME.md)
- [Final ATS audit and verification record](docs/ATS_FINAL_AUDIT.md)
- [Portfolio readiness audit](docs/PORTFOLIO_READINESS_AUDIT.md)

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
npm run dev
npm run test:clinic-demo
npm run build
```

What the demo actually executes:

| Stage | Implementation in this repo |
| --- | --- |
| Message intake | `POST /api/clinic/leads` — channel normalisation + idempotency key |
| AI receptionist | Deterministic reply generator; no invented clinic pricing, no medical advice |
| Qualification | `qualifyLead()` returns `{ lead_score, status, qualification_reason, primary_service }` |
| CRM | `clinic_demo_leads`-shaped records with `idempotency_key`, `next_action`, `handoff_required` |
| Booking | Labelled `demo-booking-adapter`, idempotent appointment creation |
| Confirmation + reminders | Confirmation, `+24h` reminder, same-day reminder on a deterministic virtual clock |
| Unbooked follow-up | Bounded ladder (`+6h`, `+24h`) that auto-stops once the lead books |
| Human handoff | Clinical-safety terms force `needs_human`, halt AI autonomy, and log escalation |
| Reporting | `GET /api/clinic/metrics` aggregates conversations, qualified, booked, booking rate, follow-ups, handoffs, reminders, and duplicates absorbed |

### Verification status

- **Verified here:** lint, build, and 26 passing tests covering qualification, idempotency, duplicate absorption, booking, reminders, bounded follow-up, handoff, and metrics.
- **Not verified:** end-to-end Make execution for scenario `7290390`. An accepted webhook response is not treated as proof of a scenario run. The Make leg remains **unproven** until a real execution is inspected module-by-module and a persisted CRM result is confirmed.
- **Not connected:** live WhatsApp / Instagram / Messenger credentials.

The UI labels runtime state as `DEMO · IN-MEMORY` versus `LIVE · SUPABASE`; demo booking and notification adapters are explicitly labelled as such.

## Core AI Operations System

AI CORE COO is an operating layer around AI models rather than a simple chatbot.

- Natural-language command center backed by an Express API and Gemini.
- Durable orchestration with Temporal workflows and retry policies.
- Human-approval signaling for side-effecting operations.
- Evidence/verification gates before completion.
- Operational history and execution logs for observability.
- Provider boundaries for external capabilities.

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
