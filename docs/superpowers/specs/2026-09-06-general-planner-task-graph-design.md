# General Planner + Task Graph Design

**Status:** Approved for implementation

## Goal
Add a general-purpose planner/orchestrator to AI CORE COO that turns natural-language goals into validated task graphs, executes them through governed capabilities, records evidence, and supports safe recovery/replanning.

## Architecture
The planner produces a typed plan and DAG of task nodes; it does not execute side effects directly. A policy layer evaluates capability and risk before execution, Temporal remains the durable execution boundary, and operational persistence records state/evidence. Production paths must fail closed when required live dependencies are unavailable.

## Scope
- Goal normalization and structured planning.
- Typed task graph with dependencies and lifecycle states.
- Capability selection without leaking provider-specific SDK details.
- Risk/approval decision before side effects.
- Durable execution through existing Temporal workflows.
- Evidence and verification per task and for the overall plan.
- Retry/recovery and bounded replanning after failures.
- Deterministic behavior where possible; LLM only for goal interpretation/plan proposal.
- Tests for graph validation, policy decisions, execution transitions, recovery, and API integration.

## Non-goals
- Computer-use production implementation.
- Telephony implementation.
- Roofing-specific workflow logic.
- Replacing existing Revenue Loop or Call Outcome flows.
- Adding paid infrastructure or cloud-only dependencies.

## Production invariants
1. No simulated provider result may be reported as production success.
2. Durable persistence is required in production; in-memory fallback is development-only.
3. High-risk or external side effects require explicit approval according to policy.
4. Every completed task must have a terminal state and verification/evidence decision.
5. Failed tasks must preserve prior evidence and state history.
6. Replanning must be bounded and must not silently repeat already-completed side effects.

## Proposed core types
- `Goal`: id, text, context, requested outcome.
- `Plan`: id, goalId, status, nodes, edges, version, createdAt.
- `TaskNode`: id, capability, input, dependencies, risk, approval, state, attempts, result, evidence.
- `TaskState`: `PENDING | READY | WAITING_APPROVAL | RUNNING | SUCCEEDED | FAILED | BLOCKED | CANCELED`.
- `RiskLevel`: `LOW | MEDIUM | HIGH | CRITICAL`.
- `VerificationStatus`: `VERIFIED | FAILED | NOT_REQUIRED`.

## Execution model
Goal → Planner → Graph Validator → Policy/Risk → Approval Gate → Temporal Task Execution → Evidence/Verification → Durable Record → Recovery/Replan when needed.

## Acceptance criteria
- A free-form goal can produce a valid deterministic DAG representation.
- Cycles, missing dependencies, duplicate node ids, and invalid transitions are rejected.
- Tasks execute only when dependencies are satisfied.
- Policy decisions are explicit and testable.
- Production execution fails closed on unavailable required live providers.
- Evidence is attached to task outcomes and persisted.
- A failed node can retry safely or trigger bounded replan without replaying successful side effects.
- Existing Temporal conformance tests remain green.
