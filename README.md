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
