# JARVIS — AI Surfer OS Gap Audit & Execution Plan

Date: 2026-09-24
Branch: feat/jarvis-voice-browser-skill
Repository: alkadyenjy2/enjY-ai-coo

## Scope

Benchmark JARVIS against the documented capabilities of The AI Surfer OS without replacing the existing JARVIS architecture.

The AI Surfer currently describes a private business command center with agents, memory, files, workflows, business context, private VPS execution, human-guided execution, and department-oriented agents. These are product claims; this document treats them as benchmark requirements, not as proof of implementation.

## Evidence-based JARVIS baseline

Verified from the current branch source:

- Protected /api/agent/command route with authentication and organization access middleware.
- Command classification and intent policy checks.
- Duplicate Guard.
- Human Approval Gate for sensitive actions.
- OpenAI Responses API adapter.
- Gemini execution path.
- Supabase-backed operational audit persistence with authenticated tenant context.
- Gmail send followed by verification.
- Connector status and environment status endpoints.
- BrowserSkill registry entry and a separate browser evidence gate.
- Existing free-first AI registry and routing primitives.

## Gap matrix

| Capability | JARVIS evidence | Gap | Action |
|---|---|---|---|
| Private command center | Existing Core AI COO UI/API surfaces | Partial | Keep current UI; expose agent/run state as a single operational view |
| Shared business context | memoryContext + project context + persistence | Partial | Normalize context contract; do not introduce a second memory system |
| Agent execution | Current command execution + deterministic tool handlers | Partial | Add explicit agent/job lifecycle records around existing execution |
| Human-guided execution | Human Approval Gate exists | Present | Preserve and extend to browser/login/CAPTCHA/high-risk actions |
| Evidence / verification | OperationalExecutionRecord + Gmail/Supabase verification | Present | Apply same evidence contract to every new adapter |
| Private/local runtime | Local Windows tooling exists; BrowserSkill is designed as local | Partial | Prefer local execution where possible; do not buy VPS yet |
| Department agents | No unified department registry found in the audited source | Gap | Add metadata-driven department definitions, not separate agent stacks |
| One-click deployment | No verified one-click deployment surface in JARVIS branch | Gap | Defer until agent lifecycle is stable |
| Agent observability | Operational records exist | Partial | Add lifecycle fields: queued/running/waiting_approval/verifying/completed/failed |
| Provider pool | OpenAI + Gemini paths and free-first registry exist | Partial | Add provider adapters only when credentials/capabilities are available |
| Cost controls | OperationsManager has budget/call counters | Partial | Replace hard-coded spend state with provider-aware measured usage before production claims |
| Autonomous follow-up | Existing command execution is request-driven | Gap | Add scheduled worker/automation only after approval/evidence contract is reusable |
| Reusable workflows | Existing handlers and skills exist | Partial | Factor repeatable operations into sub-workflow/tool contracts rather than cloning agents |
| Business outcome tracking | Operational logs exist | Partial | Add outcome/result metrics at workflow level |

## Architecture decision

Do NOT replace JARVIS with The AI Surfer OS, Ruflo, n8n, or another agent framework.

Target architecture:

Command Center
-> Intent / Policy Gate
-> Agent or Workflow Selection
-> Human Approval Gate when required
-> Existing tool/adapters
-> Evidence Verification
-> OperationalExecutionRecord
-> Supabase audit_logs

AI providers remain replaceable behind the existing gateway boundary.

## Provider strategy

### Free-first

1. Free/local runtime when available.
2. OpenRouter free routing.
3. Gemini free tier where available.
4. NVIDIA free prototype endpoints where the selected model is explicitly marked free.
5. Bytez free-tier models where the account/model is actually eligible.
6. RooyaLLM only when its available credit/budget is sufficient and the task requires it.

Never treat any free tier as unlimited.

### Provider discovery

Do not hardcode a model family from marketing copy. Prefer the provider model catalog/status endpoint, then select a model compatible with the requested capability.

## Implementation order

P0 — Preserve architecture
- No rewrite of command routing.
- No second memory system.
- No second workflow engine.

P1 — Agent lifecycle contract
- Define stable lifecycle states.
- Attach correlation/execution IDs.
- Persist state transitions with evidence.

P2 — Department metadata
- Define department IDs and capability requirements.
- Route departments to existing tools/workflows.
- Avoid creating nine independent agent implementations.

P3 — Provider adapter layer
- Reuse OpenAI-compatible transport where supported.
- Keep provider credentials server-side.
- Add budget/rate/error classification.
- Do not send paid requests during static validation.

P4 — Autonomous scheduling
- Only after P1 evidence contract is reusable.
- Prefer existing automation infrastructure.
- Scheduled execution must retain approval and evidence gates.

P5 — Behavioral verification
- Authenticated command.
- Real provider request.
- Real tool call.
- Real post-action verification.
- Durable audit record.
- Final terminal state.
- No PASS/DONE claim without all evidence.

## User intervention required

| Item | Why | Exact action | Link | Alternative without user intervention |
|---|---|---|---|---|
| OpenAI/Astra credential | Needed for live primary-model execution if not already configured | Add/verify server secret; never paste it in chat | https://platform.openai.com/api-keys | Use already-configured provider if live |
| OpenRouter key | Needed for live free-model fallback | Create key and store as server secret | https://openrouter.ai/settings/keys | Existing OpenRouter credential can be reused if already configured |
| NVIDIA NIM key | Needed for NVIDIA live endpoint | Create API key | https://build.nvidia.com/settings/api-keys | Skip NVIDIA and use OpenRouter/Gemini |
| Bytez key | Needed for Bytez inference | Create key and store server-side | https://bytez.com/api | Skip Bytez; use OpenRouter/free providers |
| RooyaLLM key | Needed for gateway live calls | Create key and store server-side | https://llm.rooyai.com/ | Skip until a free/local provider is insufficient |
| BrowserSkill local setup | Required for real browser evidence | Install bsk + extension and run doctor/real browser task | https://github.com/Tencent/BrowserSkill | Keep BrowserUse adapter as existing fallback |
| Voice benchmark | Required before claiming voice production readiness | Run one Arabic/English command and capture latency/result | JARVIS local UI | Keep voice marked unverified |
| PR approval/merge | Governance step | Review PR #24 and merge after CI/deployment evidence | https://github.com/alkadyenjy2/enjY-ai-coo/pull/24 | Leave PR draft/open until evidence exists |

## Current hard blockers

1. Live provider credentials cannot be assumed from source code.
2. BrowserSkill behavioral evidence is not present in repository source.
3. Vercel deployment status must be freshly checked before claiming production readiness.
4. The current server still contains a direct OpenAI/Gemini execution path; the free-first registry is not yet the authoritative runtime router.
5. No evidence currently proves 24/7 autonomous scheduled agent execution.

## Completion gate

A capability is considered operational only when all applicable evidence exists:

- configuration present
- authenticated request
- real external call
- expected response
- tool execution, if applicable
- post-action verification
- durable audit record
- final state
- no unresolved error

Static code presence alone is not behavioral success.
