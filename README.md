# AI CORE COO — AI Operations Command Center

> A production-oriented AI operations system designed to turn natural-language business commands into governed, observable, and verifiable workflows.

## Portfolio Case Study

**Role:** AI Automation / AI Systems Engineer

**Problem**

Business operations often span research, content, payments, lead generation, CRM delivery, browser tasks, and memory. The goal of AI CORE COO is to provide one command center that can interpret an operator's request, route it to the right capability, execute it through durable workflows, apply approval and evidence gates, and record the operational outcome.

**What I built**

- Natural-language command center backed by an Express API and Gemini.
- Durable orchestration with Temporal workflows and retry policies.
- Human-approval signaling for side-effecting operations.
- Evidence/verification gates before a workflow is considered complete.
- Operational history mapped into execution logs for observability.
- Provider boundaries for external capabilities including Browser Use Cloud.
- Integrations for research, publishing, payments, lead qualification, CRM delivery, and operational auditing.
- Automated CI checks covering type safety, builds, operational-log mapping, and Browser Use/Temporal contracts.

## Architecture

```text
Operator (Voice/Text)
        |
        v
AI CORE COO Command Center
        |
        v
Intent / Tool Selection
        |
        v
Temporal Workflow
   |       |        |
Approval  Execute  Verify
   |       |        |
   |       +--> Provider Adapters
   |               |-- Browser Use Cloud
   |               |-- Stripe
   |               |-- Postiz
   |               |-- Whop
   |               |-- Research / Leads / CRM
   |
   +------> Audit / Execution History / Memory
```

The important design decision is that external providers remain behind application-owned execution contracts. For example, Browser Use is an execution adapter rather than a separate agent; its SDK details do not leak into the core execution contract.

## Engineering Proof

The repository contains a real Temporal workflow state machine with explicit states such as `RECEIVED`, `ROUTED`, `DISPATCHED`, `WAITING_FOR_APPROVAL`, `EXECUTED`, `VERIFIED`, `COMPLETED`, `REJECTED`, and `FAILED`. The workflow also supports retry behavior and non-retryable policy breaches.

Browser Use Cloud is connected through a thin adapter that validates the task, executes the Cloud run, waits for completion, and returns session/status/output/evidence data to the core system.

CI verifies the implementation rather than relying only on UI behavior.

## Stack

- React 19 + Vite
- TypeScript
- Express
- Google Gemini (`@google/genai`)
- Temporal
- Supabase
- Browser Use Cloud
- Tailwind CSS
- GitHub Actions
- Vercel

## Why this project matters

This is intentionally more than a chatbot UI. The portfolio value is in the operating-system layer around the model: orchestration, approval boundaries, execution adapters, verification, auditability, retries, and operational history.

## Portfolio Positioning

This project demonstrates experience relevant to:

- AI Automation Engineer
- AI Engineer / Agent Engineer
- AI Operations / AI COO systems
- Workflow Automation Engineer
- AI Integration Engineer

## Status

The codebase is actively being hardened and documented as a portfolio case study. Claims in this README are limited to capabilities represented in the repository; production-scale usage metrics are not claimed unless independently measured.
