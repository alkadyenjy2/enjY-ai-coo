# General Planner + Task Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a general-purpose AI CORE planner and governed task graph without breaking existing Temporal, persistence, or provider contracts.

**Architecture:** Add focused planner, task-graph, and policy modules around the existing Temporal runtime. The planner produces a typed DAG; policy gates side effects; Temporal executes durable nodes; persistence records evidence and terminal outcomes. Keep provider adapters behind existing contracts.

**Tech Stack:** TypeScript, Express, Temporal, existing persistence/adapters, Vitest/Jest-compatible repository test tooling.

**Spec:** `docs/superpowers/specs/2026-09-06-general-planner-task-graph-design.md`

## Global Constraints

- No production simulation or silent fallback.
- Production durable persistence is mandatory.
- High-risk/external side effects require explicit approval.
- Do not modify Revenue Loop, Call Outcome, Roofing/Solar, or telephony behavior.
- Do not add paid/cloud-only infrastructure.
- Preserve existing Temporal conformance behavior.

---

### Task 1: Establish typed task-graph contracts

**Files:**
- Create: `src/task-graph/types.ts`
- Create: `src/task-graph/validate.ts`
- Test: `src/task-graph/task-graph.test.ts`

**Interfaces:**
- Produces `Plan`, `TaskNode`, lifecycle/risk/verification types and `validateTaskGraph(plan)`.

- [ ] Write failing tests for valid DAGs, missing dependencies, duplicate ids, cycles, and invalid terminal states.
- [ ] Run the focused graph test and confirm failure.
- [ ] Implement the minimal types and validator.
- [ ] Run focused tests and confirm pass.
- [ ] Commit the graph contract.

### Task 2: Add deterministic goal normalization

**Files:**
- Create: `src/planner/goal.ts`
- Test: `src/planner/goal.test.ts`

**Interfaces:**
- Produces `normalizeGoal(text, context?)` returning a typed `Goal`.

- [ ] Write tests for whitespace, empty goals, context preservation, and stable ids for equivalent inputs where applicable.
- [ ] Run tests and confirm failure.
- [ ] Implement normalization without provider calls.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 3: Add planner proposal engine

**Files:**
- Create: `src/planner/planner.ts`
- Test: `src/planner/planner.test.ts`

**Interfaces:**
- Consumes `Goal` plus registered capabilities.
- Produces a `Plan` containing a valid DAG and explicit capability/risk metadata.

- [ ] Write tests for common multi-step goals and deterministic fallback planning.
- [ ] Run tests and confirm failure.
- [ ] Implement minimal planner with strict schema validation.
- [ ] Run graph + planner tests.
- [ ] Commit.

### Task 4: Add capability and risk policy

**Files:**
- Create: `src/policy/types.ts`
- Create: `src/policy/evaluate.ts`
- Test: `src/policy/policy.test.ts`

**Interfaces:**
- Produces `evaluateTaskPolicy(task, capabilities, context)` with allow/approval/reject decision.

- [ ] Write tests for low-risk auto-approval, external side effects, missing capability, and critical rejection.
- [ ] Run tests and confirm failure.
- [ ] Implement explicit least-privilege policy.
- [ ] Run focused tests.
- [ ] Commit.

### Task 5: Integrate task graph execution with Temporal

**Files:**
- Modify: `temporal-proof/workflows.ts`
- Modify: `temporal-proof/activities.ts`
- Create: `temporal-proof/plannerExecution.ts`
- Test: `temporal-proof/plannerExecution.test.ts`

**Interfaces:**
- Consumes validated `Plan` and policy decisions.
- Produces durable node lifecycle updates and final plan state.

- [ ] Write failing tests for dependency ordering and blocked nodes.
- [ ] Run tests and confirm failure.
- [ ] Implement execution loop using existing Temporal primitives.
- [ ] Preserve existing workflow state machine and signals.
- [ ] Run all Temporal tests.
- [ ] Commit.

### Task 6: Add evidence and durable execution recording

**Files:**
- Modify: `src/adapters/persistence.ts`
- Create: `src/task-graph/evidence.ts`
- Test: `src/task-graph/evidence.test.ts`

**Interfaces:**
- Produces evidence records linked to node/plan ids and verification status.

- [ ] Write tests for verified, failed, and missing evidence.
- [ ] Run tests and confirm failure.
- [ ] Implement persistence through the existing adapter only.
- [ ] Ensure production throws when durable persistence is unavailable.
- [ ] Run tests.
- [ ] Commit.

### Task 7: Add bounded retry and replan logic

**Files:**
- Create: `src/planner/recovery.ts`
- Test: `src/planner/recovery.test.ts`

**Interfaces:**
- Produces a safe recovery decision: retry, block, cancel, or bounded replan.

- [ ] Write tests proving successful side effects are not replayed.
- [ ] Run tests and confirm failure.
- [ ] Implement bounded recovery with attempt limits and dependency invalidation.
- [ ] Run focused tests.
- [ ] Commit.

### Task 8: Expose governed planner API

**Files:**
- Modify: `server.ts`
- Create: `src/planner/api.ts`
- Test: `src/planner/api.test.ts`

**Interfaces:**
- `POST /api/planner/plan` accepts a goal and returns a validated plan.
- `POST /api/planner/execute` starts governed execution.
- `GET /api/planner/:planId` returns current plan state.

- [ ] Write failing API tests for auth, validation, and execution gating.
- [ ] Run focused tests and confirm failure.
- [ ] Implement protected routes using existing auth/organization middleware.
- [ ] Run API tests.
- [ ] Commit.

### Task 9: Close production fallback guardrails

**Files:**
- Modify: `server.ts`
- Modify: relevant Temporal config/tests
- Test: production readiness tests

- [ ] Add a test proving production cannot silently initialize `TestWorkflowEnvironment` when `REQUIRE_LIVE_DEPENDENCIES=true`.
- [ ] Run the test and confirm failure.
- [ ] Implement fail-closed Temporal initialization.
- [ ] Run the complete suite.
- [ ] Commit.

### Task 10: Full conformance and launch gate

**Files:**
- Modify: CI workflow only where required.
- Create: planner E2E/conformance tests.

- [ ] Run typecheck.
- [ ] Run unit tests.
- [ ] Run build.
- [ ] Run planner → graph → policy → Temporal → persistence E2E.
- [ ] Verify no existing production workflows regress.
- [ ] Create PR from `feat/general-planner-task-graph` to `main` with evidence summary.
- [ ] Do not merge until review/CI evidence is green.
