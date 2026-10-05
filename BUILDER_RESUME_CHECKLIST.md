# Builder Resume Checklist

Status: CODE-LEVEL CLOSED / RESUME ONLY FOR VERIFIED REMAINING EXTERNALS

Canonical architecture: Auth + Intent Policy Gate + Human Approval + verification + Duplicate Guard + Evidence Gate. Do not introduce n8n/Inngest as the JARVIS orchestrator and do not redesign working components.

When credits return:
1. Pull/sync main and verify the latest SHA.
2. Run the existing verification suite before changing code.
3. Fix only fresh, reproducible defects.
4. Preserve fail-closed behavior and server-authoritative identity.
5. Never invent credentials, audit records, executions, or provider success.
6. Verify CI, deployment health, and external provider boundaries.
7. Commit every real change and verify the remote SHA/CI.

Definition of done: code + CI green, security/evidence gates proven, external blockers explicitly separated from code completion.