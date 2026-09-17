# Claude Code Efficiency Standard

**Status:** Architecture approved; environment installation and behavioral savings remain unverified until a real Claude Code run is available.

## Objective

Reduce context/token waste and Claude Code cost across Enjy's engineering projects without sacrificing task quality, MCP reliability, or verification discipline.

## Canonical Stack

```text
Claude Code
   ↓
Token Optimizer        ← P0 optimization
   ↓
MCP Optimizer          ← P1 context/MCP audit
   ↓
Context Mode           ← conditional; only after measured need
   ↓
Project work
   ↓
Code / Test / Verify
   ↓
CodeBurn               ← measurement / visibility
```

### Held tools

- Headroom — optional later; do not layer with other compressors without measurement.
- Squeez — hold until a specific output-compression bottleneck is proven.
- claudectx — hold until a specific context/session bottleneck is proven.
- Graphify — optional for genuinely large codebases with measurable navigation/re-reading waste.
- Ponytail — behavioral anti-overengineering aid, not a primary token optimizer.

## Non-Negotiable Rule

Do **not** install Token Optimizer + Context Mode + Headroom + Squeez + claudectx together and assume the combined result is better. Each layer must earn its place through a controlled before/after test.

## Rollout Sequence

1. **Baseline** — run one representative task without the optimization layer and record available token/cost/context evidence.
2. **Token Optimizer** — install and test first.
3. **Measure** — compare tokens/task, context waste, compaction behavior, task quality, and failures.
4. **MCP Optimizer** — audit unused, duplicate, and context-heavy MCP servers/tools.
5. **Measure again** — isolate the effect of MCP cleanup where possible.
6. **Context Mode** — introduce only if large logs, JSON, MCP output, repository reads, or repeated retrieval are demonstrated bottlenecks.
7. **CodeBurn** — maintain local usage visibility and before/after evidence.
8. **Rollout** — apply the minimum proven stack to the remaining projects.

## Project Matrix

| Project | Token Optimizer | MCP Optimizer | Context Mode | CodeBurn | Notes |
|---|---|---|---|---|---|
| ZMEDIA AI Growth Engine | Default | Audit | Conditional | Monitor | Complex automation/code workflows |
| Lead Gen / Roofing | Default | Audit | Conditional | Monitor | CRM, integrations, logs can become large |
| AI COO / Portfolio | Default | Audit | Conditional | Monitor | Reliability/evidence has priority over aggressive compression |
| IncomeOS / Academy | Default/minimum | Audit if MCP-heavy | Only if proven | Optional | Avoid unnecessary tooling |

## Measurement Contract

Record, when available:

- tokens per representative task
- context utilization / waste
- compaction frequency
- tool-output size
- cost per session/task
- latency
- task completion quality
- test/build failures
- MCP/tool errors

A percentage saving is not a fact until a before/after measurement exists.

## Verification States

- **VERIFIED:** real Claude Code execution produced current evidence.
- **STATIC ONLY:** configuration/spec was inspected but no behavioral run was executed.
- **HOLD:** intentionally not enabled because no measured need exists.
- **BLOCKED:** implementation cannot be executed because required environment access is unavailable.

## Current State

- Architecture: **APPROVED**
- Rollout design: **RECORDED**
- Token Optimizer installation: **BLOCKED pending direct Claude Code/Windows execution access**
- MCP Optimizer behavioral audit: **BLOCKED pending Claude Code/MCP environment access**
- Context Mode: **HOLD pending measurement**
- Headroom/Squeez/claudectx/Ponytail: **HOLD**
- CodeBurn behavioral measurement: **BLOCKED pending Claude Code environment access**

## Evidence Rule

Repository documentation is not execution proof. A plugin being available, a command being documented, or a configuration being written does not establish that the plugin ran successfully or reduced token usage.
