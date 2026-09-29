# Test Infrastructure Specification: Chef Specials AI

## 1. Overview & Objectives

The Chef Specials AI E2E Test Suite provides an independent, opaque-box verification harness designed to rigorously validate all functional and operational requirements defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

The test suite runs strictly from the outside:
- It treats scripts, workflows, and serverless handlers as opaque components.
- It tests public CLI interfaces, process exit codes, stdout/stderr streams, HTTP/CORS responses, security sanitization, and real-world failure modes.
- It does NOT modify or rely on internal implementation hacks of application source files (`index.html`, `styles.css`, `app.js`, `api/generate-image.js`).

---

## 2. Test Architecture & Directory Layout

```
chef-specials-ai-repo/
├── e2e_tests/
│   ├── __init__.py                # Python package marker
│   ├── test_helpers.py            # Fixtures, mock HTTP servers, and execution wrappers
│   ├── test_tier1_features.py     # Tier 1: Core feature coverage (50 tests)
│   ├── test_tier2_boundaries.py   # Tier 2: Boundary & corner cases (50 tests)
│   ├── test_tier3_pairwise.py     # Tier 3: Cross-feature pairwise interactions (10 tests)
│   ├── test_tier4_scenarios.py    # Tier 4: Real-world operational scenarios (6 tests)
│   ├── runner.py                  # Standalone Python runner with filtering & reporting
│   └── runner.js                  # Node.js CLI entry point wrapper
├── TEST_INFRA.md                  # This test architecture document
└── TEST_READY.md                  # Test readiness & execution summary declaration
```

---

## 3. Four-Tier Testing Methodology & Thresholds

| Tier | Category | Minimum Requirement | Implemented Count | Focus Areas |
|------|----------|---------------------|-------------------|-------------|
| **Tier 1** | **Feature Coverage** | $\ge 5$ tests per feature | **50 tests** (10 features $\times$ 5) | Happy path, primary behavior, contract satisfaction |
| **Tier 2** | **Boundary & Corner Cases** | $\ge 5$ tests per feature | **50 tests** (10 features $\times$ 5) | Missing arguments, malformed secrets, timeouts, empty payloads, whitespace |
| **Tier 3** | **Cross-Feature Combinations** | Pairwise interaction coverage | **10 tests** | Preflight $\rightarrow$ Deploy, Deploy $\rightarrow$ Smoke, CI $\rightarrow$ Tests, Masking in CI |
| **Tier 4** | **Real-World Scenarios** | $\ge 5$ application scenarios | **6 scenarios** | End-to-end simulated CI, deployment abort, live smoke verification, stale routing bug |
| **TOTAL**| | | **116 tests** | Full opaque-box system verification |

---

## 4. Feature Inventory & Test Mapping

The test suite maps 1:1 to the 10 core features:

| Feature # | Feature Name | Target Artifact | Tier 1 Tests | Tier 2 Tests | Tier 3 & 4 Tests |
|-----------|--------------|-----------------|--------------|--------------|------------------|
| **F1** | CI Workflow Schema & Steps | `.github/workflows/ci.yml` | 5 | 5 | P3, S1 |
| **F2** | Universal Bootstrap Verification | `scripts/verify-bootstrap.sh` | 5 | 5 | P3, P7, S1 |
| **F3** | Node API Unit Tests | `tests_api.js` | 5 | 5 | P3, P7, S1 |
| **F4** | Playwright E2E Integration | `tests_e2e.py` | 5 | 5 | P3, S1 |
| **F5** | Secret Validation Preflight | `scripts/verify-env.js` | 5 | 5 | P1, P4, P8, S2 |
| **F6** | Secret Masking & Non-Disclosure | `scripts/verify-env.js` | 5 | 5 | P4, S2 |
| **F7** | Smoke Test Execution | `scripts/smoke-test.js` | 5 | 5 | P2, P5, P9, S3, S4 |
| **F8** | Serverless Route Handling | `api/generate-image.js` | 5 | 5 | P5, P6, P8, S5 |
| **F9** | Vercel Deployment Config | `vercel.json` | 5 | 5 | P6 |
| **F10**| Preview vs Production Promotion | `scripts/deploy.sh` & workflows | 5 | 5 | P1, P2, P10, S2, S3, S6 |

---

## 5. Expected Output Derivation & Authoritative Sources

For every test case in the suite, expected outcomes are derived strictly from documented interface contracts:

1. **`scripts/verify-bootstrap.sh`**:
   - Source: Existing implementation & `AGENTS.md`.
   - Contract: Exits 0 on valid repository; exits 1 with `FAIL: not inside a Git repository` if executed outside a git root.
2. **`tests_api.js`**:
   - Source: Existing implementation.
   - Contract: Exits 0 when `node tests_api.js` completes; runs without external `OPENAI_API_KEY`.
3. **`api/generate-image.js`**:
   - Source: Existing implementation & `tests_api.js`.
   - Contract: `OPTIONS` returns 200 with open CORS; `GET` returns 405; empty `POST` returns 400; unconfigured key returns 200 with `{ setupNeeded: true }`.
4. **`vercel.json`**:
   - Source: Commit `4c6ec87` & Vercel specification.
   - Contract: `version: 2`, `cleanUrls: true`, rewrite `/api/(.*)` $\rightarrow$ `/api/$1`.
5. **`scripts/verify-env.js`**:
   - Source: `PROJECT.md` § Interface Contracts.
   - Contract: `--mode=ci` exits 0; `--mode=production --strict` exits 1 if missing key; invalid flag exits 2; emits `::add-mask::<secret>` under `GITHUB_ACTIONS=true`; zero plaintext secret disclosure.
6. **`scripts/smoke-test.js`**:
   - Source: `PROJECT.md` § Interface Contracts & `spec_miner_survey/report.md`.
   - Contract: Probes `/` (200), `/styles.css` (200), `/app.js` (200), `OPTIONS /api/generate-image` (200 CORS), `GET /api/generate-image` (405), `POST /api/generate-image` with `{}` (400), and `POST /api/generate-image` with prompt (200 non-404); exits 1 if 404 or assertion fails.
7. **`scripts/deploy.sh`**:
   - Source: `PROJECT.md` § Interface Contracts.
   - Contract: Executes `verify-env.js` before deploying; fails if preflight fails; accepts `--prod` and `--preview`; runs `smoke-test.js` against deployed URL.

---

## 6. Execution Modes: Progressive vs Strict Acceptance

To support continuous verification throughout development without blocking on un-implemented milestones:

1. **Progressive Mode (Default during Milestone Development)**:
   - When a target script has not yet been authored by its assigned feature milestone agent, tests dependent on that script trigger `skipTest()` with a clear diagnostic message (e.g. `Feature 'Smoke Test' pending implementation (scripts/smoke-test.js not found)`).
   - Tests for completed/existing features run and enforce 100% assertions.
   - Exits 0 if all active tests pass.
2. **Strict Mode (`--strict` or `STRICT_E2E=1` for Milestone 5 Final Acceptance)**:
   - Any missing artifact or pending milestone test is treated as a hard failure (`AssertionError`).
   - Requires 100% pass across all 116 tests with 0 skips and 0 failures.

---

## 7. How to Run the Tests

### Option A: Unified Python Test Runner (Recommended)
```bash
# Run entire 4-tier suite in progressive mode
python3 e2e_tests/runner.py

# Run a specific tier (1, 2, 3, or 4)
python3 e2e_tests/runner.py --tier 1
python3 e2e_tests/runner.py --tier 2
python3 e2e_tests/runner.py --tier 3
python3 e2e_tests/runner.py --tier 4

# Run with verbose output or JSON summary
python3 e2e_tests/runner.py -v
python3 e2e_tests/runner.py --json

# Run in strict mode (Milestone 5 Acceptance Gate)
python3 e2e_tests/runner.py --strict
```

### Option B: Node.js Runner Wrapper
```bash
# Run entire suite via Node
node e2e_tests/runner.js

# Pass flags through Node runner
node e2e_tests/runner.js --tier 2
node e2e_tests/runner.js --strict
```

### Option C: Standard Python unittest Discovery
```bash
# Native discovery with zero external dependencies
python3 -m unittest discover -s e2e_tests -p "test_*.py"
```
