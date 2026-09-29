# Dispatch to E2E Test Writer (Independent Opaque-Box Test Suite)

## Objective
Design and implement a comprehensive opaque-box E2E test suite and runner for Chef Specials AI, covering all features across 4 tiers based on user requirements. Publish `TEST_INFRA.md` and `TEST_READY.md` when the test suite is ready.

## Scope Boundaries
- You own: creation of test files inside `e2e_tests/`, `TEST_INFRA.md`, and `TEST_READY.md`.
- DO NOT modify existing application source code (`index.html`, `app.js`, `api/generate-image.js`, `styles.css`).
- Write metadata / progress reports in your working directory: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/test_writer_e2e/`.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Project root: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo`

## Methodology & 4-Tier Test Requirements
Follow the systematic 4-tier approach:
1. **Tier 1 — Feature Coverage (>=5 per feature)**:
   - For all core features in ORIGINAL_REQUEST (CI workflow schema & steps, bootstrap verification, Node API unit tests, Playwright E2E integration, secret validation preflight, secret masking, smoke test execution, serverless route handling, Vercel deployment config, preview vs prod promotion).
2. **Tier 2 — Boundary & Corner Cases (>=5 per feature)**:
   - Missing arguments, invalid JSON payloads, malformed secret values, non-existent endpoints, empty payloads, timeouts, special characters, whitespace, case insensitivity.
3. **Tier 3 — Cross-Feature Combinations (pairwise coverage)**:
   - Interactions between pre-flight check and deployment, deployment and smoke test, CI workflow and test suites, secret masking in CI environments.
4. **Tier 4 — Real-World Application Scenarios (>=5 realistic application scenarios)**:
   - Full simulated CI pipeline execution, automated pre-flight failure aborting deployment, deployment followed by comprehensive smoke test, live serverless mock invocation.

## Deliverables
1. `TEST_INFRA.md` documenting test architecture, feature inventory, methodology, and coverage thresholds.
2. Full test suite and runner located in `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/e2e_tests/` (executable via a simple command, e.g., `python -m unittest discover e2e_tests` or `node e2e_tests/runner.js`).
3. `TEST_READY.md` summarizing test counts per tier, feature checklist, and the command to run the full test suite.
4. `handoff.md` in your working directory.

## Completion Criteria
- Test files created and verified.
- `TEST_READY.md` and `TEST_INFRA.md` written.
- Send completion message to orchestrator with summary of coverage.

## 2026-09-29T15:29:49Z
You are E2E Test Writer (test_writer_e2e).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/test_writer_e2e
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/test_writer_e2e/DISPATCH.md, ORIGINAL_REQUEST.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md, and PROJECT.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md.
Design and implement the independent opaque-box E2E test suite across 4 tiers in e2e_tests/.
Write TEST_INFRA.md and publish TEST_READY.md with the runner command and coverage summary.
Execute and verify the test runner works.
Write handoff.md in your working directory and notify orchestrator when done.

