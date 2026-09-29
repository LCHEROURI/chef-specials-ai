# Chef Specials AI: Requirements & CI/CD Standards Specification Report

**Document Date:** 2026-09-29T15:27:00Z  
**Author:** Specification Miner (`survey_spec_miner`)  
**Target Repository:** `https://github.com/LCHEROURI/chef-specials-ai.git`  
**Repository Root:** `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo`  
**Working Directory:** `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey`

---

## 1. Executive Summary & Specification Scope

This document provides the authoritative, formal technical specification for implementing the continuous integration, production deployment, environment security guardrails, and post-deployment verification for **Chef Specials AI** (`chef-specials-ai`), in direct response to `ORIGINAL_REQUEST.md` and `DISPATCH.md`.

Four core requirements are formalized:
1. **R1: Continuous Integration (CI) Pipeline** — GitHub Actions workflow executing on push and pull requests, running bootstrap validation, Node API unit tests, and Playwright headless browser E2E tests.
2. **R2: Production Deployment & Release Pipeline** — Automated build and deployment to Vercel, deploying preview environments for pull requests and promoting releases to production on `main` branch merges.
3. **R3: Environment & Configuration Security Guardrails** — Pre-flight security verification script validating mandatory production secrets (`OPENAI_API_KEY`) and optional parameters without stdout/log secret exposure.
4. **R4: Automated Post-Deployment Health Check** — Programmatic smoke test suite validating HTTP status codes, security/platform headers, and serverless API responsiveness (confirming resolution of the 404 serverless routing bug on live deployments).

---

## 2. Authoritative Sources Examined

The following authoritative files and live systems were directly probed:
1. `ORIGINAL_REQUEST.md` — Core user requirements and acceptance criteria.
2. `package.json` — Scripts configuration (`"test": "node tests_api.js && ./scripts/verify-bootstrap.sh"`).
3. `tests_api.js` — Unit test suite for `api/generate-image.js` covering OPTIONS preflight, method rejection, parameter sanitization, and fallback responses.
4. `scripts/verify-bootstrap.sh` — Bash verification for universal agent bootstrap safety markers in `AGENTS.md`, `WORKFLOW.md`, and skills.
5. `tests_e2e.py` — Playwright asynchronous E2E test suite verifying interactive app flow, pasta/seasonal filters, count parsing, recipe modal, and LocalStorage hygiene.
6. `vercel.json` — Vercel configuration routing `/api/(.*)` to `/api/$1`.
7. `api/generate-image.js` — Serverless Node.js handler consuming `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, and `OPENAI_IMAGE_QUALITY`.
8. `app.js` & `index.html` & `styles.css` — Client-side SPA application files.
9. `.github/workflows/bootstrap-check.yml` — Existing baseline GitHub Actions workflow.
10. Live production target `https://chef-specials-ai.vercel.app/` — Probed via HTTP/2 curl requests; identified live 404 routing discrepancy on `/api/generate-image`.
11. Local CLI environment:
    - Node.js LTS (v20+), Python 3.14.
    - Vercel CLI v52.0.0 (authenticated as `cherouri-9248`, team `laredj-chehrouris-projects`, project `chef-specials-ai`).
    - GitHub CLI `gh` (authenticated as `LCHEROURI` with `repo`, `workflow` scopes).

---

## 3. Formal Specification: R1 — Continuous Integration (CI) Workflow

### 3.1 GitHub Actions Workflow Schema & Structure
- **Workflow File Path:** `.github/workflows/ci.yml` (can supersede or complement `bootstrap-check.yml`).
- **Workflow Name:** `CI` or `Continuous Integration`
- **Permissions:** `contents: read` (principle of least privilege).
- **Concurrency:**
  ```yaml
  concurrency:
    group: ci-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```

### 3.2 Workflow Triggers
- **Push Event:**
  - Branch filter: `[ main ]`
- **Pull Request Event:**
  - Branch filter: `[ main ]`
  - Types: `[ opened, synchronize, reopened ]`
- **Manual Trigger:**
  - `workflow_dispatch:` (enables testing and on-demand verification).

### 3.3 Runner Matrix & Runtime Environments
- **Runner OS:** `ubuntu-latest`
- **Node.js Environment:**
  - Action: `actions/setup-node@v4`
  - Version: `20` (Node.js LTS)
  - Caching: Optional npm cache (no package-lock currently in repo root; fallback to direct setup).
- **Python Environment:**
  - Action: `actions/setup-python@v5`
  - Version: `3.11` or `3.12`
  - Dependencies: `pip install playwright`
- **Browser Runtime:**
  - Command: `playwright install --with-deps chromium` (installs headless Chromium binary and required Ubuntu OS shared libraries).

### 3.4 Step Execution Sequence
The workflow job `test` must execute steps in this exact deterministic order:

| Step # | Name | Tool / Action | Command / Parameters | Expected Result |
|--------|------|---------------|----------------------|-----------------|
| 1 | Checkout Repository | `actions/checkout@v4` | `fetch-depth: 1` | Repository files placed in `$GITHUB_WORKSPACE` |
| 2 | Setup Node.js | `actions/setup-node@v4` | `node-version: 20` | Node 20 LTS and npm ready in PATH |
| 3 | Install Node Dependencies | Shell | `npm install` | Clean exit code 0 |
| 4 | Setup Python | `actions/setup-python@v5` | `python-version: '3.11'` | Python 3 and pip ready in PATH |
| 5 | Install Python Dependencies | Shell | `pip install playwright` | Playwright package installed |
| 6 | Install Playwright Chromium | Shell | `playwright install --with-deps chromium` | Chromium browser engine & Linux deps ready |
| 7 | Universal Bootstrap Verification | Shell | `bash scripts/verify-bootstrap.sh` | Confirms safety markers; exit code 0 |
| 8 | Run API & Unit Tests | Shell | `npm test` | Executes `tests_api.js` + `verify-bootstrap.sh`; exit code 0 |
| 9 | Run Headless Playwright E2E Tests | Shell | `python tests_e2e.py` | Full browser verification; exit code 0 |

### 3.5 Exit Code Semantics & Failure Handlers
- Every step runs with bash `-e` (`pipefail`).
- Any assertion error in `tests_api.js` or `tests_e2e.py` throws an unhandled exception resulting in exit code `1`.
- Any failure immediately terminates the workflow and sets the GitHub commit / PR status check to `failure`.
- The workflow succeeds with exit code `0` only if all unit, bootstrap, and E2E tests pass.

### 3.6 Critical Portability Constraint for `tests_e2e.py`
In `tests_e2e.py` line 6:
```python
REPO_DIR = "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo"
INDEX_HTML = f"file://{REPO_DIR}/index.html"
```
*Portability Constraint:* In GitHub Actions, the runner path is `/home/runner/work/chef-specials-ai/chef-specials-ai`. Running `tests_e2e.py` without dynamic path resolution will fail in CI.  
*Required Specification:* `tests_e2e.py` must support dynamic resolution:
```python
REPO_DIR = os.environ.get("REPO_DIR", os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = f"file://{REPO_DIR}/index.html"
```
Or the CI workflow must export `REPO_DIR="$GITHUB_WORKSPACE"` before invoking `python tests_e2e.py`.

---

## 4. Formal Specification: R2 — Production Deployment & Release Pipeline

### 4.1 Target Platform Architecture
- **Platform:** Vercel
- **Project Name:** `chef-specials-ai`
- **Scope / Organization:** `laredj-chehrouris-projects` (or account ID associated with `VERCEL_ORG_ID`)
- **Production URL:** `https://chef-specials-ai.vercel.app`

### 4.2 Release Cadence & Triggering Rules
1. **Pull Request (Preview Deployment):**
   - Trigger: Pull request opened, synchronized, or reopened against `main`.
   - Behavior: Builds and deploys a preview environment.
   - Output: Unique preview URL (e.g. `https://chef-specials-ai-git-<branch>-<scope>.vercel.app`).
   - Guardrail: Never overwrites or promotes to the production domain.
2. **Main Branch Update (Production Deployment):**
   - Trigger: Push or merge to branch `main`.
   - Dependency: Must only proceed after all CI verification checks (R1) pass.
   - Behavior: Builds with `--prod` and deploys to production alias `https://chef-specials-ai.vercel.app`.

### 4.3 Required Deployment Secrets & Configuration
To execute automated Vercel deployments via CI/CD, the following GitHub Repository Secrets must be configured in `LCHEROURI/chef-specials-ai`:
- `VERCEL_TOKEN`: Vercel personal access token with deploy scope.
- `VERCEL_ORG_ID`: Vercel organization ID / user account identifier.
- `VERCEL_PROJECT_ID`: Vercel project ID for `chef-specials-ai`.

### 4.4 Build Artifact & Serverless Routing Specification
- **Routing Specification (`vercel.json`):**
  ```json
  {
    "version": 2,
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": "/api/$1"
      }
    ]
  }
  ```
- **Static Asset Handling:**
  - Files `index.html`, `styles.css`, `app.js`, and `assets/` are automatically served as immutable static assets at `/`.
- **Serverless API Endpoint Handling:**
  - Any file under `api/*.js` is built as a Vercel Serverless Function running on the Node.js LTS runtime.
  - Endpoint `api/generate-image.js` serves requests at `/api/generate-image`.
  - The rewrite rule guarantees that client fetch calls to `/api/generate-image` map directly to the serverless function without requiring `.js` in the request path.
- **Vercel CLI Execution Sequence:**
  - For Preview:
    ```bash
    npx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
    npx vercel build --token=$VERCEL_TOKEN
    PREVIEW_URL=$(npx vercel deploy --prebuilt --token=$VERCEL_TOKEN)
    ```
  - For Production:
    ```bash
    npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
    npx vercel build --prod --token=$VERCEL_TOKEN
    npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
    ```

### 4.5 Standalone Release Script Specification (`scripts/deploy.sh`)
To allow programmatic and manual CLI releases outside of GitHub Actions:
- **CLI Interface:**
  ```bash
  ./scripts/deploy.sh [--prod | --preview] [--skip-tests] [--target-url <url>]
  ```
- **Execution Lifecycle:**
  1. Runs R3 pre-flight environment verification (`scripts/verify-env.sh`).
  2. Runs R1 test suite (`npm test`).
  3. Executes Vercel build & deploy.
  4. Triggers R4 post-deployment smoke test (`scripts/smoke-test.sh`).

---

## 5. Formal Specification: R3 — Environment & Configuration Security Guardrails

### 5.1 Environment Variables Inventory
The application and deployment pipeline rely on the following environment variables:

| Variable Name | Classification | Required In | Default Value | Allowed / Valid Values | Description |
|---------------|----------------|-------------|---------------|------------------------|-------------|
| `OPENAI_API_KEY` | Sensitive Secret | Production / Vercel | None | Regex: `^sk-[a-zA-Z0-9_-]{20,}$` | Secret key for OpenAI Image Generation API |
| `chefsspecials` | Sensitive Secret (Legacy) | Production / Vercel | None | Valid API Key | Backward-compatibility alias for `OPENAI_API_KEY` |
| `OPENAI_IMAGE_MODEL` | Configuration | Optional (all) | `"gpt-image-2"` | `"gpt-image-2"`, `"dall-e-3"`, `"dall-e-2"` | Active OpenAI model family |
| `OPENAI_IMAGE_QUALITY` | Configuration | Optional (all) | `"medium"` | `"medium"`, `"standard"`, `"hd"` | Image rendering fidelity |
| `VERCEL_TOKEN` | Sensitive Secret | CI / Deployment | None | String (min 24 chars) | Vercel CLI authentication token |
| `VERCEL_ORG_ID` | Configuration / ID | CI / Deployment | None | String (team_... or user ID) | Vercel team/account ID |
| `VERCEL_PROJECT_ID` | Configuration / ID | CI / Deployment | None | String (prj_...) | Vercel project ID for `chef-specials-ai` |

### 5.2 Secret Non-Disclosure Guarantees
The environment verification script must enforce strict non-disclosure:
1. **Never Echo Plaintext Secrets:** `OPENAI_API_KEY` and `VERCEL_TOKEN` must NEVER be printed to `stdout`, `stderr`, or CI job logs.
2. **Masking Format:** If displaying verification status, display only the variable name and a masked representation:
   - Example: `OPENAI_API_KEY: [PRESENT] (format: sk-***... length: 51)`
3. **CI Masking Directives:** In GitHub Actions environments (`GITHUB_ACTIONS=true`), the script should emit `echo "::add-mask::$val"` for any processed secret values.
4. **Sanitized Error Reporting:** In case of format errors (e.g. missing `sk-` prefix), output `FAIL: OPENAI_API_KEY does not match expected prefix 'sk-'` without displaying the invalid string.
5. **No Memory Dumps:** The script must not dump `process.env` or print unhandled exception objects that could serialize environment keys.

### 5.3 CLI Interface Specification for `scripts/verify-env.sh` (or `verify-env.js`)
- **Invocation Syntax:**
  ```bash
  ./scripts/verify-env.sh [OPTIONS]
  # or: node scripts/verify-env.js [OPTIONS]
  ```
- **CLI Flags:**
  - `--mode <mode>`: Validation mode. Options: `prod` (default), `preview`, `ci`, `local`.
    - In `prod`: Requires `OPENAI_API_KEY`.
    - In `ci`: Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
  - `--env-file <path>`: Optional path to a `.env` file to validate.
  - `--strict`: Fails if optional variables contain non-standard values.
  - `--help`: Displays usage guide.
- **Exit Code Semantics:**
  - `0`: All required variables are present, non-empty, and valid.
  - `1`: One or more mandatory variables are missing or malformed.
  - `2`: Invalid CLI invocation arguments or file access error.

---

## 6. Formal Specification: R4 — Automated Post-Deployment Health Check

### 6.1 Root Cause Context: Discovered Live 404 Discrepancy
Direct probing of the live deployment `https://chef-specials-ai.vercel.app/` revealed:
- `GET /`: Returns `200 OK` (Vercel static cache, modified Sept 15, 2026).
- `OPTIONS /api/generate-image`: Returns `404 NOT_FOUND` (`x-vercel-error: NOT_FOUND`).
- `POST /api/generate-image`: Returns `404 NOT_FOUND` (`The page could not be found`).
*Cause:* Commit `4c6ec874` implemented `vercel.json`, `package.json`, and `api/generate-image.js` locally and pushed to GitHub `main`, but has not yet been deployed to Vercel production.  
*Significance for R4:* The post-deployment health check script must specifically guard against this failure mode by probing both the static frontend and the serverless API endpoint.

### 6.2 CLI Interface Specification for `scripts/smoke-test.sh` (or `smoke-test.js`)
- **Invocation Syntax:**
  ```bash
  ./scripts/smoke-test.sh [TARGET_URL] [OPTIONS]
  # or: node scripts/smoke-test.js [TARGET_URL] [OPTIONS]
  ```
- **Positional Arguments:**
  - `TARGET_URL`: Base deployment URL (e.g. `https://chef-specials-ai.vercel.app` or a Vercel preview deployment URL).
  - Defaults to environment variable `DEPLOYMENT_URL` if omitted, or falls back to `https://chef-specials-ai.vercel.app`.
- **Options / Flags:**
  - `--timeout <seconds>`: Timeout per HTTP request (default: `10`).
  - `--retries <count>`: Number of retry attempts with exponential backoff for cold starts / DNS propagation (default: `3`).
  - `--retry-delay <seconds>`: Delay between retries (default: `5`).
  - `--require-active-key`: Asserts that `POST /api/generate-image` returns live image data or OpenAI response rather than `setupNeeded: true`.
  - `--verbose`: Prints request/response headers and timing metrics.

### 6.3 Health Check Test Matrix & Assertions

The smoke test must execute and assert on 5 distinct probes:

| Probe # | Target Path | Method | Headers / Payload | Required Assertions |
|---------|-------------|--------|-------------------|---------------------|
| 1 | `/` | `GET` | None | • HTTP Status: `200 OK`<br>• Header `content-type`: includes `text/html`<br>• Body contains `<title>Chef Specials AI</title>`<br>• Header `server`: `Vercel` or valid server |
| 2 | `/styles.css` & `/app.js` | `GET` | None | • HTTP Status: `200 OK`<br>• Content-Type: `text/css` and `javascript`<br>• Non-empty response body |
| 3 | `/api/generate-image` | `OPTIONS` | None | • HTTP Status: `200 OK`<br>• Header `Access-Control-Allow-Origin`: `*`<br>• Header `Access-Control-Allow-Methods`: contains `POST`<br>• MUST NOT return `404` |
| 4 | `/api/generate-image` | `GET` | None | • HTTP Status: `405 Method Not Allowed`<br>• Header `Allow`: contains `POST, OPTIONS`<br>• JSON Body: `{"error": "Method not allowed"}` |
| 5 | `/api/generate-image` | `POST` | `Content-Type: application/json`<br>`{}` (empty payload) | • HTTP Status: `400 Bad Request`<br>• JSON Body contains error: `"Prompt or dishName is required."` |
| 6 | `/api/generate-image` | `POST` | `Content-Type: application/json`<br>`{"prompt": "smoke test ping"}` | • If `OPENAI_API_KEY` is not configured: HTTP Status `200 OK`, JSON body contains `{ "setupNeeded": true }`<br>• If `OPENAI_API_KEY` is configured: HTTP Status `200 OK` (with `imageUrl`) or valid OpenAI upstream error<br>• **CRITICAL ASSERTION:** Under NO circumstance can status be `404 NOT_FOUND` |

### 6.4 Exit Code Semantics
- `0`: All 6 probes passed successfully within timeout and retry limits.
- `1`: Assertion failure (e.g. 404 Not Found, 500 Internal Server Error, missing CORS headers, incorrect HTML title).
- `2`: Network connectivity failure, DNS resolution error, or request timed out after maximum retries.

---

## 7. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | CI / Test | `npm test` script | Runs full repository unit and bootstrap verification suite | Command line: `npm test` | Console log with test progress and pass summary | Exits with code 1 if tests fail | `package.json` line 7 |
| 2 | CI / Bootstrap | Universal Bootstrap Verification | Verifies safety markers in `AGENTS.md`, `WORKFLOW.md`, and `skills/progressive-distillation/SKILL.md` | `bash scripts/verify-bootstrap.sh` | `PASS: universal bootstrap verified at <path>` | Exits with code 1 and error message on missing file/marker | `scripts/verify-bootstrap.sh` |
| 3 | CI / Unit Test | Serverless API Unit Suite | Unit tests `api/generate-image.js` using Node.js built-in `assert` and mock requests/responses | `node tests_api.js` | `=== ALL API UNIT TESTS PASSED (100%) ===` | Throws assertion error and exits with code 1 | `tests_api.js` |
| 4 | CI / E2E Test | Playwright E2E Verification | Headless browser test suite verifying UI categories, smart count parsing, recipe modal, LocalStorage quota safety, and print styles | `python tests_e2e.py` | `=== ALL PLAYWRIGHT E2E CHECKS PASSED SUCCESSFULLY (100%) ===` | Throws assertion error or Python traceback with exit code 1 | `tests_e2e.py` |
| 5 | CI / Workflow | Bootstrap Check GitHub Workflow | Baseline GitHub Actions workflow for pull request and push to main | Git push / PR trigger | GitHub Actions job status | Workflow failure on non-zero exit code | `.github/workflows/bootstrap-check.yml` |
| 6 | Deployment | Vercel Project Linkage | Live Vercel project `chef-specials-ai` under team `laredj-chehrouris-projects` | Vercel CLI / HTTP requests | Deployed web app at `https://chef-specials-ai.vercel.app` | Returns HTTP 404 on un-deployed endpoints | Vercel CLI probe (`vercel project ls`) & `README.md` |
| 7 | Deployment | Clean URL & Serverless Rewrites | `vercel.json` rewrite configuration mapping `/api/(.*)` to `/api/$1` | HTTP requests to `/api/*` | Route resolution to `api/*.js` serverless function | 404 if `vercel.json` is missing or un-deployed | `vercel.json` |
| 8 | Serverless API | CORS Preflight Handling | Handles HTTP `OPTIONS` requests and returns open CORS headers | HTTP `OPTIONS /api/generate-image` | HTTP 200, `Access-Control-Allow-Origin: *` | None | `api/generate-image.js` lines 17-24 |
| 9 | Serverless API | Method Enforcement | Rejects non-POST/OPTIONS HTTP methods | HTTP `GET /api/generate-image` | HTTP 405 Method Not Allowed, `Allow: POST, OPTIONS` | HTTP 405 with JSON `{ "error": "Method not allowed" }` | `api/generate-image.js` lines 26-30 |
| 10 | Serverless API | Missing Prompt Validation | Validates presence of `prompt` or `dishName` in request payload | JSON body `{}` | HTTP 400 Bad Request | HTTP 400 with `{ "error": "Prompt or dishName is required." }` | `api/generate-image.js` lines 43-46 |
| 11 | Serverless API | Unconfigured Key Graceful Fallback | Returns structured setup notification when `OPENAI_API_KEY` is not configured | Valid JSON body, no env var | HTTP 200 with `{ setupNeeded: true, message: ... }` | Handled gracefully without crash or 500 error | `api/generate-image.js` lines 48-55 |
| 12 | Serverless API | Dual Key Name Support | Supports both standard `OPENAI_API_KEY` and legacy `chefsspecials` env vars | Environment variables | Uses either key if present | Falls back to setup notification if neither is present | `api/generate-image.js` line 48 |
| 13 | Serverless API | DALL-E 3 vs GPT-Image Parameter Normalization | Normalizes image dimensions (`1024x1792` vs `1024x1536`) and quality (`standard` vs `medium`) based on model | Request body `model`, `size`, `quality` | Sanitized OpenAI API generation payload | N/A | `api/generate-image.js` lines 71-104 |
| 14 | Security | Pre-flight Environment Verification | Script interface for validating required production secrets before release | CLI command `./scripts/verify-env.sh` | Formatted validation report with masked credentials | Exits with code 1 if required variables are missing | `ORIGINAL_REQUEST.md` R3 & `DISPATCH.md` |
| 15 | Verification | Automated Smoke Test Suite | Programmatic post-deployment verification script for live URLs | CLI command `./scripts/smoke-test.sh <URL>` | Multi-probe health report with timing metrics | Exits with code 1 on failed assertion, code 2 on network failure | `ORIGINAL_REQUEST.md` R4 & `DISPATCH.md` |

---

## 8. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | E2E Test Suite | Execution on non-local machine (CI runner) | `tests_e2e.py` line 6 hardcodes `REPO_DIR = "/Users/laredjchehrouri/..."`. On `ubuntu-latest`, this directory does not exist, causing `page.goto()` to fail. Requires dynamic `os.environ.get("REPO_DIR", ...)` or `os.path.dirname(__file__)`. |
| 2 | Playwright Python Dependencies | `python3 tests_e2e.py` on fresh environment | Fails with `ModuleNotFoundError: No module named 'playwright'`. CI must execute `pip install playwright` followed by `playwright install --with-deps chromium`. |
| 3 | Live Vercel Serverless Routing | `curl -X OPTIONS https://chef-specials-ai.vercel.app/api/generate-image` | Returns `HTTP/2 404 NOT_FOUND` with header `x-vercel-error: NOT_FOUND` because commit `4c6ec87` containing `vercel.json` has not been deployed to Vercel production yet. |
| 4 | Serverless API Stringified JSON Body | `request.body = JSON.stringify({...})` | `api/generate-image.js` safely detects string bodies and parses them via `JSON.parse(body)` inside a try-catch block, preventing JSON parse crashes. |
| 5 | Serverless API DALL-E 3 Aspect Ratio | `model: "dall-e-3"`, `size: "1024x1536"` | DALL-E 3 does not support `1024x1536`. Handler normalizes size to `1024x1792` to prevent OpenAI API 400 bad request error. |
| 6 | Serverless API Quality Mapping | `model: "dall-e-3"`, `quality: "medium"` | DALL-E 3 only supports `standard` or `hd`. Handler normalizes `medium` to `standard`. |
| 7 | Secret Masking during Verification | Invalid `OPENAI_API_KEY` (e.g. malformed or short) | Script must NOT print the invalid key value. Must only output `FAIL: OPENAI_API_KEY format invalid (expected sk- prefix, min 20 chars)`. |
| 8 | Post-Deployment Cold Starts & Propagation | Immediate smoke test check after Vercel deployment | Vercel DNS or edge function cold start may take 1-3 seconds. Smoke test script must implement retry logic with exponential backoff before failing. |
| 9 | GitHub Actions Missing Vercel Secrets | Deployment workflow executed on fork or unconfigured repo | Without `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID`, deployment step fails. Script / workflow must produce a clean, actionable error message directing user to configure repo secrets. |
| 10 | LocalStorage Quota Safety in E2E | Generating dish image and saving special | `app.js` and `tests_e2e.py` specifically strip `data:image` base64 strings before saving to LocalStorage to avoid 5MB quota exhaustion. Smoke/E2E test asserts `data:image` is not in LocalStorage. |

---

## 9. Acceptance Criteria Verification Checklist

Based on `ORIGINAL_REQUEST.md` and this formal specification:

### CI Pipeline (R1)
- [x] **Workflow Existence & Schema:** `.github/workflows/ci.yml` defined conforming strictly to GitHub Actions schema.
- [x] **Triggers:** Configured for `push` to `main`, `pull_request` to `main`, and `workflow_dispatch`.
- [x] **Dependency Setup:** Steps include Node 20 LTS setup, Python setup, `pip install playwright`, and `playwright install --with-deps chromium`.
- [x] **Test Execution:** Sequentially runs universal bootstrap verification (`scripts/verify-bootstrap.sh`), Node API unit tests (`npm test` / `node tests_api.js`), and headless Playwright E2E tests (`python tests_e2e.py`).
- [x] **Exit Code Semantics:** Fails fast (exit 1) on any failure; succeeds with exit 0 when all tests pass.

### Deployment & Release Pipeline (R2)
- [x] **Platform Configuration:** Target defined as Vercel project `chef-specials-ai`.
- [x] **Preview & Production Split:** Preview deployments generated on pull requests; production promotions executed on `main` updates.
- [x] **Serverless Routing:** `vercel.json` rewrites `/api/(.*)` to `/api/$1` ensuring clean endpoint resolution.
- [x] **Artifact Handling:** Static files (`index.html`, `styles.css`, `app.js`, `assets/`) and serverless functions (`api/generate-image.js`) deployed without manual intervention.

### Environment Security Guardrails (R3)
- [x] **Variable Inventory:** Mandatory (`OPENAI_API_KEY`) and optional (`OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`) variables documented.
- [x] **Validation Interface:** CLI interface defined for `scripts/verify-env.sh` with `--mode`, `--strict`, and exit code semantics.
- [x] **Zero Secret Disclosure:** Strict masking guarantees specified (never echo raw keys; mask all but prefixes/lengths).

### Automated Post-Deployment Health Check (R4)
- [x] **Programmatic Interface:** CLI interface defined for `scripts/smoke-test.sh` with `TARGET_URL`, timeouts, and retries.
- [x] **Comprehensive Probes:** Validates frontend root (200), static assets (200), CORS OPTIONS preflight (200), GET method rejection (405), payload validation (400), and API responsiveness (200 setupNeeded/active).
- [x] **Routing Bug Resolution:** Explicitly verifies that `/api/generate-image` does NOT return `404 NOT_FOUND`.

---
*End of Specification Report.*
