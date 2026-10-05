# AI Build Handoff

## Canonical repository
- Repository: alkadyenjy2/enjY-ai-coo
- Branch: main
- Product: JARVIS / Enjy AI COO
- Architecture: Auth -> Intent Policy Gate -> Human Approval -> verified execution -> Duplicate Guard -> Evidence Gate -> Record -> Report.
- Do not introduce n8n/Inngest/Make as the JARVIS orchestrator.

## Known closure state
The canonical runtime core has already been hardened and verified in prior work. Preserve it. Do not rebuild working components merely because a builder is available.

## Low-credit execution rule
1. Pull main and audit before editing.
2. Reuse the existing kernel, authority checks, approval flow, persistence and evidence logic.
3. Run existing verification first and spend credits only on confirmed failures.
4. Never fabricate execution records, audit evidence, credentials or external provider success.
5. Keep provider integrations fail-closed when configuration is absent.
6. Commit every actual fix to GitHub and verify CI/deployment after the commit.

## Definition of done
No known code-side defect remains; CI/build/runtime health is green with fresh evidence. External configuration blockers remain explicit and do not count as code failures.
