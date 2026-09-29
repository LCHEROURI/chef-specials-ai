# Project: Chef Specials AI (CI/CD, Deployment, Security & Health Check)

## Architecture
Chef Specials AI is a zero-build static web application (HTML5, Vanilla CSS3, Vanilla JS ES2020) with a serverless backend (`api/generate-image.js`) deployed to Vercel.

### Key Components:
1. **Frontend**: Static single-page application (`index.html`, `styles.css`, `app.js`, `assets/`).
2. **Serverless API**: `api/generate-image.js` providing `/api/generate-image` endpoint for AI dish photography.
3. **Continuous Integration (CI)**: GitHub Actions workflow (`.github/workflows/ci.yml`) validating bootstrap safety, Node API unit tests, and Playwright headless Chromium E2E tests.
4. **Environment & Secrets Guardrails**: `scripts/verify-env.js` performing zero-leakage pre-flight validation of secrets (`OPENAI_API_KEY`, etc.).
5. **Deployment Automation**: Vercel configuration (`vercel.json`), deployment scripts (`scripts/deploy.sh`), and GitHub Actions release workflow (`.github/workflows/deploy.yml`) supporting PR previews and main branch production deployment.
6. **Post-Deployment Verification**: Programmatic smoke test suite (`scripts/smoke-test.js`) probing static root, assets, CORS preflight, method restriction, and serverless API responsiveness.
7. **E2E Test Infrastructure**: Independent opaque-box test runner validating all features across 4 tiers.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | E2E Test Portability | Fix hardcoded path in `tests_e2e.py` using dynamic `os.environ.get("REPO_DIR", ...)` | M1 | Survey |
| 2 | CI GitHub Actions Workflow | Implement `.github/workflows/ci.yml` with push, PR, and workflow_dispatch triggers | M1 | R1 |
| 3 | CI Dependency & Runtime Setup | Configure Node 20 LTS, Python 3.11, Playwright Chromium in CI runner | M1 | R1 |
| 4 | CI Test Execution Matrix | Execute `bash scripts/verify-bootstrap.sh`, `npm test` (`tests_api.js`), and `python tests_e2e.py` with exit code 0 enforcement | M1 | R1 |
| 5 | Environment Verification Script | Create `scripts/verify-env.js` checking mandatory & optional variables without leaking values | M2 | R3 |
| 6 | Secret Masking & Non-Disclosure | Ensure zero plaintext secret leakage, format validation, and GitHub Actions `::add-mask::` support | M2 | R3 |
| 7 | Programmatic Smoke Test Script | Create `scripts/smoke-test.js` accepting target URL, timeout, retries | M3 | R4 |
| 8 | Endpoint & Routing Verification | Probes for static root (200), CSS/JS (200), OPTIONS CORS (200), GET guard (405), API live probe (non-404) | M3 | R4 |
| 9 | Vercel Deployment Configuration | Verify and refine `vercel.json` routing rules and static asset mapping | M4 | R2 |
| 10 | Automated Release Script | Create `scripts/deploy.sh` orchestrating pre-flight verification, Vercel build/deploy, and smoke testing | M4 | R2 |
| 11 | Deployment GitHub Actions Workflow | Create `.github/workflows/deploy.yml` automating PR preview deployments and production promotions | M4 | R2 |
| 12 | Package Scripts Integration | Update `package.json` with convenience scripts (`verify-env`, `smoke-test`, `deploy`) | M4 | R2 |
| 13 | E2E Test Suite - Tier 1 | Feature coverage tests (>=5 tests per feature) | E2E Track | Dual Track |
| 14 | E2E Test Suite - Tier 2 | Boundary and corner cases (>=5 tests per feature) | E2E Track | Dual Track |
| 15 | E2E Test Suite - Tier 3 | Cross-feature combination testing | E2E Track | Dual Track |
| 16 | E2E Test Suite - Tier 4 | Real-world application scenarios | E2E Track | Dual Track |
| 17 | Final Acceptance & Verification | 100% pass of E2E test suite + Phase 2 adversarial coverage hardening | M5 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent opaque-box test harness & test suite (Tiers 1-4) publishing TEST_READY.md | none | DONE |
| 1 | M1: Test Portability & CI Pipeline | Fix `tests_e2e.py` path portability + `.github/workflows/ci.yml` schema and validation | none | DONE |
| 2 | M2: Environment Security Guardrails | Implement `scripts/verify-env.js` with zero-leakage secret checks & masking | none | READY |
| 3 | M3: Post-Deployment Smoke Test | Implement `scripts/smoke-test.js` programmatic endpoint & API verification | none | READY |
| 4 | M4: Deployment & Release Automation | Implement `scripts/deploy.sh`, `.github/workflows/deploy.yml`, and `package.json` scripts | M2, M3 | PENDING |
| 5 | M5: Final Verification & Hardening | Phase 1: 100% pass of E2E test suite; Phase 2: Adversarial coverage hardening | E2E, M1, M4 | PENDING |

## Interface Contracts
### `scripts/verify-env.js`
- **CLI Invocations**:
  - `node scripts/verify-env.js --mode=ci` (checks format, allows missing live keys with warning)
  - `node scripts/verify-env.js --mode=production --strict` (fails with exit code 1 if `OPENAI_API_KEY` missing or invalid)
- **Exit Codes**:
  - `0`: All required environment variables present and format valid.
  - `1`: Required environment variable missing or invalid.
  - `2`: Invalid CLI arguments.
- **Output Guarantee**: Never prints raw secret values. Emits `::add-mask::<value>` when running in GitHub Actions (`GITHUB_ACTIONS=true`).

### `scripts/smoke-test.js`
- **CLI Invocations**:
  - `node scripts/smoke-test.js <TARGET_URL> [--timeout <ms>] [--retries <n>]`
- **Verification Probes**:
  - Probe 1: `GET /` -> Status 200, Content-Type contains `text/html`.
  - Probe 2: `GET /styles.css` -> Status 200, Content-Type contains `text/css`.
  - Probe 3: `GET /app.js` -> Status 200, Content-Type contains `javascript`.
  - Probe 4: `OPTIONS /api/generate-image` -> Status 200, `Access-Control-Allow-Methods` includes `POST, OPTIONS`.
  - Probe 5: `GET /api/generate-image` -> Status 405 Method Not Allowed.
  - Probe 6: `POST /api/generate-image` with `{}` -> Status 400 Bad Request.
  - Probe 7: `POST /api/generate-image` with `{"prompt":"test","dishName":"test"}` -> Status 200 OK (returns JSON with `imageUrl` or `setupNeeded: true`), explicitly NOT 404.
- **Exit Codes**:
  - `0`: All probes passed.
  - `1`: Any probe failed or timed out.

### `scripts/deploy.sh`
- **CLI Invocations**:
  - `./scripts/deploy.sh [--prod] [--preview]`
- **Workflow**:
  - 1. Runs `node scripts/verify-env.js --mode=production`
  - 2. Executes `vercel deploy` (preview) or `vercel deploy --prod` (production)
  - 3. Extracts deployment URL from output
  - 4. Runs `node scripts/smoke-test.js <DEPLOYMENT_URL>`
  - 5. Exits 0 on success, non-zero on failure.

## Code Layout
- `.github/workflows/ci.yml` — Continuous Integration workflow
- `.github/workflows/deploy.yml` — Production & Preview deployment workflow
- `scripts/verify-bootstrap.sh` — Universal bootstrap verification script (existing)
- `scripts/verify-env.js` — Environment security pre-flight verification script
- `scripts/smoke-test.js` — Post-deployment health check & smoke test script
- `scripts/deploy.sh` — Automated deployment orchestration script
- `tests_e2e.py` — Dynamic path fix for Playwright E2E tests
- `package.json` — NPM scripts (`test`, `verify-env`, `smoke-test`, `deploy`)
- `vercel.json` — Vercel routing configuration
- `api/generate-image.js` — Serverless API handler
- `e2e_tests/` — Independent E2E test suite (Dual Track)
