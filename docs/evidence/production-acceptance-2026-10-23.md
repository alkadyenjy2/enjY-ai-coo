# Production Acceptance Evidence — 2026-10-23

## Scope and integrity notes

- Canonical production alias: https://enj-y-ai-coo.vercel.app
- Vercel deployment: `dpl_36bVTvgZsUvFpko9pTgLvDgCvqGJ`
- Vercel project: `prj_7pAXdcpNnzbl7qdkFRwrgJuihO4L`
- Reported deployed source commit: `6b43b447b9ea6fa4d876cc847e9c38d0c50e4653`
- Production `SUPABASE_URL` hostname maps to project ref `aislifqpskbduzvvbepz`; Supabase project list identifies it as `core ai`, region `eu-west-1`, status `ACTIVE_HEALTHY`. Secret values were not printed or committed.
- Evidence capture date: 2026-10-23 (UTC timestamps below).
- This file records observations and limitations. It is not a claim of production acceptance. Git history is tamper-evident by commit identity, not absolutely immutable; retain CI artifacts and deployment logs for stronger provenance.

## Direct observations

### `GET /api/ready`

- Observed at: `2026-10-23T02:00:39.508Z`
- HTTP: `200 OK`
- Content type: JSON
- Response:
  ```json
  {
    "status": "ready",
    "requireLiveDependencies": true,
    "checks": {
      "process": true,
      "openai": true,
      "gemini": true,
      "meta": false,
      "supabase": true,
      "executionConfigured": true
    },
    "timestamp": "2026-10-23T02:00:39.508Z"
  }
  ```
- Interpretation: endpoint reports its configured readiness checks passing except Meta. It does not expose a durable-write watermark or prove that a newly-created execution can be read back independently.

### `GET /api/health`

- Observed at: `2026-10-23T02:01:01.576Z`
- HTTP: `200 OK`
- Response reported process status `ok`, version `2.5.0`, OpenAI/Gemini configured, Meta unavailable, and authenticated tenant execution history unavailable.
- Interpretation: process responds; this is not proof of durable persistence.

### `GET /api/auth/me`

- Direct unauthenticated HTTP request from the remote Windows laptop returned `401 Unauthorized`.
- Interpretation: consistent with an endpoint requiring an application session. It does not test successful authentication and does not establish a Vercel Deployment Protection failure.

### Independent production database inspection (read-only)

- Production Supabase project ref: `aislifqpskbduzvvbepz` (`core ai`, `eu-west-1`).
- Query executed at: `2026-10-23 02:33:24 UTC`.
- `public.audit_logs` rows where `type = 'ai_core_execution'`: `49`.
- Latest observed execution row: `2026-10-07 23:21:11.900647 UTC`.
- Latest observed successful execution row: `2026-10-07 23:19:30.246715 UTC`.
- Latest observed row had execution ID `exec-1791415271581`, status `failed`.
- Interpretation: no execution row newer than Oct 7 appeared in this query. This may mean no executions occurred; it does not alone prove a persistence regression. A fresh correlated request/readback test is still missing.

### CI and architecture-freeze verification

- CI run for the evidence commit merged into PR #62: https://github.com/alkadyenjy2/enjY-ai-coo/actions/runs/39890246546
- Architecture-freeze verification: https://github.com/alkadyenjy2/enjY-ai-coo/actions/runs/39890246568
- Both workflows completed with conclusion `success`.
- CI build, lint/typecheck, and the configured unit/contract tests completed successfully, including execution-history persistence truthfulness and persistence tenant-context tests.
- **Important:** the step named “Live authenticated E2E (approval authorization)” was marked successful only because its conditional skip path ran. The actual log explicitly says required `AUTH_E2E_*` secrets are not configured and live authentication/approval authorization remain unverified. The step's green status is not a passing live E2E result.
- The CI install also reported one high-severity npm audit finding; it has not been triaged or remediated as part of this acceptance check.

## Acceptance status

**PARTIAL / BLOCKED — Production Acceptance Not Verified**

Confirmed:
- Canonical deployment metadata ties the production alias/deployment to source commit `6b43b447b9ea6fa4d876cc847e9c38d0c50e4653`.
- Unauthenticated readiness and health routes return JSON.
- Production Supabase project identity is confirmed by matching the production environment's `SUPABASE_URL` project ref against the Supabase project list.
- Direct unauthenticated `/api/auth/me` returns `401 Unauthorized`.
- CI and architecture-freeze checks pass for the evidence commit/PR merge commit; unit/contract tests cover persistence and tenant-context behavior.

Not yet verified:
1. Successful authenticated `/api/auth/me` behavior with a normal test-user session.
2. A live `SYSTEM_HEALTH` execution returning an `execution_id`, followed by an independent direct DB read of that exact row with a timestamp after the request.
3. Negative persistence-gate test in an isolated test environment proving failed durable writes cannot report success.
4. Cross-organization isolation under distinct live authenticated test identities.
5. Triage/remediation decision for the high-severity npm audit finding.

## Blocking dependency and safe closure plan

The repository CI workflow skips live authenticated E2E unless these test-only GitHub Actions secrets are configured:
- `AUTH_E2E_SUPABASE_URL`
- `AUTH_E2E_SUPABASE_PUBLISHABLE_KEY`
- `AUTH_E2E_TEST_EMAIL`
- `AUTH_E2E_TEST_PASSWORD`
- `AUTH_E2E_MEMBER_ORG_ID`
- `AUTH_E2E_NON_MEMBER_ORG_ID` (recommended for the non-member isolation assertion)

The latest CI logs confirm all of these values were empty/unconfigured for the run. The connected remote Windows session also has none of these variables set at process, user, or machine scope. These must refer to a dedicated test project/user and two test organizations; do not use production credentials or customer data. Current connector capabilities available in this session do not provide a safe way to create or inject GitHub Actions repository secrets, and no authenticated application test session was available. Therefore these tests cannot honestly be marked passed yet.

Once test-only secrets exist:
1. Run the existing `npm run test:auth-e2e` through CI and confirm it actually executes rather than skips.
2. Run `SYSTEM_HEALTH` in the test environment; record request timestamp and `execution_id`.
3. Independently query `public.audit_logs` for that exact ID; compare status, organization, and `created_at`.
4. In the isolated test environment, simulate persistence failure and assert the API/workflow returns failure rather than success.
5. Use member and non-member test identities to verify cross-organization reads/writes are denied.
6. Triage the high-severity npm audit finding using a non-breaking dependency update and regression tests.
7. Preserve run URLs and sanitized outputs as acceptance evidence.

Never log or commit credentials, tokens, raw secret values, or customer data. Do not run destructive/negative tests against production. Mark every unexecuted test `NOT TESTED`, not passed.
