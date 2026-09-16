# Free AI OmniRoute Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verified free-first AI/tool registry and deterministic route selector to the Enjy AI COO without creating a second gateway.

**Architecture:** Keep registry data separate from routing logic. The router matches task capabilities against eligible registry entries, applies free-first policy, and returns ordered fallbacks; execution and evidence verification remain downstream.

**Tech Stack:** TypeScript, Node test runner, existing tsx/TypeScript toolchain.

**Spec:** `docs/superpowers/specs/2026-09-16-free-ai-omniroute-registry-design.md`

## Global Constraints

- No API keys, secrets, payments, or account creation.
- `UNVERIFIED` and `PAID_ONLY` entries are never production-eligible by default.
- Free-first is the default routing policy.
- No database migration in this change.
- No provider execution is claimed by the router; execution must produce evidence before `VERIFIED` success.

---

### Task 1: Define registry and routing contracts

**Files:**
- Create: `src/ai-gateway/registry-types.ts`
- Create: `src/ai-gateway/router-types.ts`

- [ ] Write the contracts for pricing/access/status/capabilities and route requests/results.
- [ ] Run `npm run lint` to establish the current baseline.

### Task 2: Add verified registry data

**Files:**
- Create: `src/data/free-ai-registry.ts`

- [ ] Add the six verified core providers with conservative metadata.
- [ ] Add model-family entries for Qwen and DeepSeek without asserting direct free API access.
- [ ] Add representative local/OSS and web-only entries as non-API tools.
- [ ] Ensure every entry has verification status and timestamp/source fields.

### Task 3: Implement free-first route selection

**Files:**
- Create: `src/ai-gateway/free-first-router.ts`
- Test: `tests/free-first-router.test.ts`

- [ ] Write failing tests for capability match, free-first ordering, unverified exclusion, paid exclusion, and fallback order.
- [ ] Run the focused test and verify it fails for the intended reason.
- [ ] Implement the smallest selector that makes the tests pass.
- [ ] Run the focused test again.

### Task 4: Expose the registry/router through a stable module

**Files:**
- Create: `src/ai-gateway/index.ts`

- [ ] Export registry and routing contracts/functions.
- [ ] Run `npm run lint`.
- [ ] Run `node --import tsx --test --test-concurrency=1 tests/free-first-router.test.ts`.

### Task 5: Verify and prepare integration

**Files:**
- No additional production files unless verification exposes a defect.

- [ ] Run the focused tests.
- [ ] Run the full TypeScript lint.
- [ ] Review the diff for secrets, paid routes, or false free claims.
- [ ] Only after all checks pass, open a pull request for integration into `main`.
