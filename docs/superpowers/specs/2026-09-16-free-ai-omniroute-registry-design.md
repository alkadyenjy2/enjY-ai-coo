# Free AI OmniRoute Registry Design

## Goal
Add a verified free-first provider/tool registry and deterministic routing layer to the existing Enjy AI COO codebase without creating a second AI gateway.

## Architecture
The registry is a pure data layer describing provider access, pricing status, capabilities, limits, automation mode, and fallback candidates. The router consumes a task capability request plus registry state and returns an ordered route plan. Execution remains outside the router; no provider call is considered successful without downstream verification/evidence.

## Scope
- Add typed registry entries for the verified core providers: OpenRouter, Gemini API, Groq, Mistral, Cerebras, and Hugging Face.
- Represent Qwen/DeepSeek as model families whose route depends on a provider, not as assumed free direct providers.
- Represent local/OSS and web-only tools as registry entries without pretending they are APIs.
- Implement free-first candidate selection with capability matching, account/card constraints, status filtering, priority, and fallback ordering.
- Add verification metadata and explicit statuses so unverified tools cannot be selected for production routes.
- Add tests for free-first routing, capability mismatch, unverified exclusion, fallback ordering, and paid-only exclusion.

## Non-Goals
- No automatic account creation, subscription, payment, or card use.
- No browser automation in this change.
- No secrets or API keys committed to the repository.
- No database migration.
- No replacement of the existing task planner or Temporal orchestration.
- No claim that a free tier means unlimited or commercial-use-free.

## Policy
`VERIFIED_FREE`, `FREE_TIER`, `LOCAL_FREE`, and `OSS_FREE` are eligible according to task policy. `UNVERIFIED`, `PAID_ONLY`, and disabled entries are excluded from production routing. Free-first is the default policy. A paid route is never selected unless a caller explicitly allows paid access.

## Verification
Registry verification is descriptive and timestamped. It does not itself execute provider calls. Runtime execution must attach evidence before reporting `VERIFIED` success.
