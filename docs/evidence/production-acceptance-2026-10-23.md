# Production Acceptance Evidence — 2026-10-23

## Scope and integrity notes

- Canonical production alias: https://enj-y-ai-coo.vercel.app
- Vercel deployment: `dpl_36bVTvgZsUvFpko9pTgLvDgCvqGJ`
- Vercel project: `prj_7pAXdcpNnzbl7qdkFRwrgJuihO4L`
- Reported deployed source commit: `6b43b447b9ea6fa4d876cc847e9c38d0c50e4653`
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
- Interpretation: endpoint reports its configured readiness checks passing except Meta. It does **not** disclose a Supabase project ref or the latest durable write timestamp, and does not prove that a newly-created execution can be read back independently.

### `GET /api/health`

- Observed at: `2026-10-23T02:01:01.576Z`
- HTTP: `200 OK`
- Content type: JSON
- Response:
  ```json
  {
    "status": "ok",
    "system": "Core AI Operations Agent",
    "version": "2.5.0",
    "hasApiKey": true,
    "modelProviders": {
      "openai": true,
      "gemini": true,
      "meta": false
    },
    "executionHistoryCount": null,
    "inMemoryExecutionHistoryCount": 0,
    "executionHistoryCountSource": "authenticated_tenant_history",
    "executionHistoryCountAvailable": false,
    "timestamp": "2026-10-23T02:01:01.576Z"
  }
  ```
- Interpretation: process responds; authenticated tenant execution history is unavailable to this unauthenticated check. This is not proof of durable persistence.

### `GET /api/auth/me` — inconclusive

- The Vercel fetch helper returned `401` at its `share_link` stage with `deployment_authentication_required`.
- The response indicates that the temporary Vercel access/share link was not accepted; it did **not** establish the application's own authentication endpoint status. Do not classify this as an application-auth failure or as proof of a Deployment Protection outage.
- An ordinary browser/client session test remains required.

## Acceptance status

**PARTIAL / BLOCKED — Production Acceptance Not Verified**

Confirmed: canonical deployment metadata ties the production alias/deployment to source commit `6b43b447b9ea6fa4d876cc847e9c38d0c50e4653`; live unauthenticated readiness and health routes return JSON.

Not yet verified:
1. Runtime Supabase project identity / project ref.
2. Authenticated `/api/auth/me` behavior with a normal user session.
3. A live `SYSTEM_HEALTH` execution returning an `execution_id`, followed by an independent direct DB read of the same row with a timestamp after the request.
4. Negative persistence-gate test in an isolated test environment proving failed durable writes cannot report success.
5. Cross-organization isolation under live authenticated identities.

## Next acceptance test

Run in a controlled test environment using test-specific credentials and a separate direct database read credential:

1. Read `/api/ready` and record non-secret DB project ref and latest successful durable-write timestamp once the endpoint exposes them.
2. Read `/api/auth/me` with a normal authenticated session; verify expected user and organization.
3. Trigger `SYSTEM_HEALTH`; capture its `execution_id` and request timestamp.
4. Query the DB independently for that exact `execution_id`; verify organization, status, and `created_at` after the request.
5. In isolation only, force persistence failure and verify the caller receives failure, not success.
6. Test cross-organization reads/writes with distinct test identities.

Never log or commit credentials, tokens, raw secret values, or customer data. Do not run destructive/negative tests against production.
