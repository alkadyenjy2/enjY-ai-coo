# Claude Code Efficiency Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a measurable, reversible Claude Code performance layer across Enjy's AI engineering projects without stacking overlapping context/token optimizers.

**Architecture:** Token Optimizer is the first optimization layer. MCP Optimizer audits MCP context overhead before additional compression is introduced. Context Mode is conditional on measured heavy-output/context waste. CodeBurn is measurement only. Headroom, Squeez, claudectx, Graphify, and Ponytail remain held unless a specific bottleneck is demonstrated.

**Tech Stack:** Claude Code, Token Optimizer, MCP Optimizer, Context Mode, CodeBurn, GitHub repositories, Windows development environment.

**Spec:** `docs/claude-code-efficiency-standard.md`

## Global Constraints

- Measure before claiming savings.
- Do not install overlapping compressors/proxies/hooks as a bundle.
- Keep the stack reversible.
- Preserve Claude Code task quality and MCP workflow behavior.
- Do not expose secrets or project data unnecessarily to third-party services.
- Separate STATIC/SPEC review from BEHAVIORAL EXECUTION.
- No optimization result is considered verified without an actual Claude Code run and recorded evidence.

---

### Task 1: Establish the project efficiency standard

**Files:**
- Create: `docs/claude-code-efficiency-standard.md`

- [ ] **Step 1: Record the architecture and tool roles**

Define the canonical order: Token Optimizer → MCP Optimizer → conditional Context Mode → CodeBurn measurement. Explicitly mark Headroom, Squeez, claudectx, Graphify, and Ponytail as HOLD.

- [ ] **Step 2: Record the four-project applicability matrix**

Map ZMEDIA, Lead Gen, Portfolio/AI COO, and IncomeOS/Academy work to the minimum required tooling.

- [ ] **Step 3: Record acceptance metrics**

Track tokens/task, context waste, compaction frequency, tool-output size, cost/session when available, task completion quality, and regression/failure rate.

### Task 2: Baseline Claude Code before optimization

**Files:**
- Create or update: `docs/claude-code-efficiency-standard.md` with baseline evidence section

- [ ] **Step 1: Run one representative task without optimization**

Use the same repository/task shape that will be repeated after each layer.

- [ ] **Step 2: Capture measurements**

Record available `/cost` or equivalent Claude Code metrics plus task result quality and any compaction/context failures.

- [ ] **Step 3: Preserve the baseline**

Do not overwrite baseline values when testing later layers.

### Task 3: Install and test Token Optimizer on Windows

**Files:**
- No repository code changes required for installation; environment-level Claude Code configuration only.

- [ ] **Step 1: Install the plugin using its supported Windows path**

Use the Claude Code plugin marketplace installation documented by the current Token Optimizer project. Do not run its Unix `install.sh` path on Windows.

- [ ] **Step 2: Re-run the exact baseline task**

Keep repository, prompt, task scope, and model configuration as constant as practical.

- [ ] **Step 3: Compare measurements**

Record token/context reduction, quality, latency if available, and any regressions.

- [ ] **Step 4: Keep the layer only if evidence supports it**

No claimed savings without before/after measurements.

### Task 4: Audit MCP context with MCP Optimizer

**Files:**
- Update: `docs/claude-code-efficiency-standard.md`

- [ ] **Step 1: Inventory MCP servers/tools used by the Claude Code environment**

Record active, unused, duplicate, and high-context-cost MCP surfaces.

- [ ] **Step 2: Identify removal candidates**

Prefer disabling unused or duplicated context-heavy MCP servers before adding another compressor.

- [ ] **Step 3: Re-run the representative task**

Measure the effect independently from Token Optimizer where possible.

### Task 5: Add Context Mode only if the audit shows heavy-output waste

**Files:**
- Update: `docs/claude-code-efficiency-standard.md`

- [ ] **Step 1: Require a demonstrated bottleneck**

Qualifying examples include large logs, large JSON, repeated MCP responses, repository-wide reads, or repeated retrieval of the same data.

- [ ] **Step 2: Add Context Mode in isolation**

Do not simultaneously introduce Headroom, Squeez, or claudectx.

- [ ] **Step 3: Re-run the same task and measure**

Keep the layer only if context reduction improves cost/efficiency without unacceptable quality or workflow regressions.

### Task 6: Use CodeBurn as monitoring, not as an optimizer

**Files:**
- Update: `docs/claude-code-efficiency-standard.md`

- [ ] **Step 1: Record per-project token/cost observations**

Use CodeBurn for local visibility into Claude Code JSONL-derived usage data where supported.

- [ ] **Step 2: Record optimization deltas**

Maintain a simple before/after table for each enabled layer.

### Task 7: Roll the standard into the project portfolio

**Files:**
- Update: `docs/claude-code-efficiency-standard.md`

- [ ] **Step 1: ZMEDIA**

Apply Token Optimizer by default; MCP audit before adding context compression; Context Mode only for demonstrated large-data workflows.

- [ ] **Step 2: Lead Gen / Roofing**

Apply Token Optimizer and MCP audit; use Context Mode only when CRM, logs, or integration payloads become context-heavy.

- [ ] **Step 3: AI COO / Portfolio**

Use Token Optimizer plus MCP audit; prioritize reliability and evidence capture over aggressive compression.

- [ ] **Step 4: IncomeOS / Academy**

Use the minimum stack; do not add Context Mode unless the repository/workflow demonstrates the need.

### Task 8: Verification gate

- [ ] **Step 1: Confirm no unsupported success claims**

Separate configuration/spec evidence from behavioral execution evidence.

- [ ] **Step 2: Confirm reversibility**

Every enabled layer must have a documented uninstall/disable path.

- [ ] **Step 3: Record final status**

Mark each layer as `VERIFIED`, `STATIC ONLY`, `HOLD`, or `BLOCKED` based on actual evidence.
