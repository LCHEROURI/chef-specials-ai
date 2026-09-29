# Codebase & Test Inventory Survey Report

**Project Root**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo`  
**Git Commit HEAD**: `4c6ec87` (`main`)  
**Git Remote**: `https://github.com/LCHEROURI/chef-specials-ai.git`  
**Report Date**: 2026-09-29T15:27:30Z  
**Investigator**: Explorer 1 (`survey_explorer_1`)

---

## 1. Executive Summary

Chef Specials AI is a static restaurant menu and specials application coupled with a single Vercel Serverless Function (`/api/generate-image`) for AI-powered dish photo generation. 

- **Frontend**: Zero-build static web application (HTML5, Vanilla CSS3, Vanilla ES2020 JavaScript). No bundler (Webpack/Vite/Parcel) is used or required.
- **Backend**: A single Vercel Serverless Function (`api/generate-image.js`) utilizing Node.js with native `fetch` to proxy requests to OpenAI's Images API.
- **Test Suites**:
  1. API Unit Tests: `tests_api.js` (Node native test suite with `node:assert`).
  2. Universal Bootstrap Verification: `scripts/verify-bootstrap.sh` (POSIX Bash safety check).
  3. End-to-End Tests: `tests_e2e.py` (Headless Chromium tests via Python Playwright).
- **Execution Verification**: Both `npm test` (running `tests_api.js` + `verify-bootstrap.sh`) and `tests_e2e.py` were executed and passed locally at 100%.
- **Critical CI/CD Discoveries**:
  1. `tests_e2e.py` contains a hardcoded absolute local path (`REPO_DIR = "/Users/laredjchehrouri/..."`), which will fail in GitHub Actions CI unless updated or configured dynamically.
  2. The production Vercel deployment (`https://chef-specials-ai.vercel.app`) was last deployed 97 days ago; currently, `/api/generate-image` returns `404 NOT_FOUND` on production because commit `4c6ec87` (which added `vercel.json` and the serverless rewrite) has not yet been deployed to Vercel production.
  3. The GitHub repository currently has zero secrets configured (`gh secret list` returns empty).

---

## 2. Repository Inventory

### 2.1 File & Directory Tree

```
/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/
├── .agents/                               # Multi-agent coordination metadata
├── .git/                                  # Git version control directory
├── .github/
│   └── workflows/
│       └── bootstrap-check.yml            # Existing CI workflow (runs verify-bootstrap.sh)
├── .gitignore                             # Ignores .DS_Store
├── AGENTS.md                              # Repository safety constitution
├── ORIGINAL_REQUEST.md                    # Authoritative user requirements
├── README.md                              # App documentation and Vercel setup
├── WORKFLOW.md                            # Detailed agent workflow & containment rules
├── api/
│   └── generate-image.js                  # Vercel serverless function (Node.js)
├── app.js                                 # Frontend application logic (Vanilla JS)
├── assets/
│   └── chef-specials-ai-concept.png       # UI background asset for sidebar
├── index.html                             # Single-page application markup
├── package.json                           # NPM package manifest (scripts only)
├── scripts/
│   └── verify-bootstrap.sh                # Universal bootstrap validation script
├── skills/
│   └── progressive-distillation/
│       └── SKILL.md                       # Progressive distillation skill docs
├── styles.css                             # Responsive & print stylesheet
├── tests_api.js                           # API unit tests (Node.js assert)
├── tests_e2e.py                           # E2E test suite (Python Playwright)
├── vercel.json                            # Vercel deployment & routing config
└── verification-screenshot.png            # UI verification snapshot
```

### 2.2 Manifests & Dependencies

#### `package.json`
```json
{
  "name": "chef-specials-ai",
  "version": "1.0.0",
  "private": true,
  "description": "Upscale dinner specials, chef-ready recipe details, social captions, and dish photo generator.",
  "scripts": {
    "test": "node tests_api.js && ./scripts/verify-bootstrap.sh"
  },
  "keywords": [
    "restaurant",
    "menu",
    "chef",
    "specials",
    "ai"
  ],
  "author": "LCHEROURI",
  "license": "MIT"
}
```

- **Dependencies**: 0 production dependencies, 0 devDependencies.
- **Lockfile**: Neither `package-lock.json` nor `yarn.lock` exists.
- **`node_modules`**: Not present and not required for `npm test`.

---

## 3. Detailed Test Suite Analysis

### 3.1 Unit & Contract Tests: `tests_api.js`
- **Location**: `/tests_api.js`
- **Execution Command**: `node tests_api.js`
- **Runner**: Node.js built-in `node:assert`.
- **External Dependencies**: None (uses native Node globals including `fetch`).
- **Test Scenarios Covered**:
  1. `OPTIONS` HTTP preflight request — verifies HTTP 200 and `Access-Control-Allow-Origin: *` header.
  2. Non-POST rejection — verifies HTTP `405 Method Not Allowed` with `Allow: POST, OPTIONS`.
  3. Missing input validation — verifies HTTP 400 when neither `prompt` nor `dishName` is supplied.
  4. Stringified JSON request body handling — verifies graceful JSON parsing and verifies that missing `OPENAI_API_KEY` returns HTTP 200 with `{ setupNeeded: true }`.
  5. OpenAI request payload sanitization:
     - Normalizes DALL-E-3 sizes (e.g. invalid `1024x1536` maps to `1024x1792`).
     - Normalizes DALL-E-3 quality to `"standard"`.
     - Preserves `b64_json` response format.
     - Preserves `gpt-image-2` dimensions (`1024x1536`) and quality (`"medium"`).
- **Execution Status**: PASSED (100% pass rate).

### 3.2 Bootstrap Integrity: `scripts/verify-bootstrap.sh`
- **Location**: `/scripts/verify-bootstrap.sh`
- **Execution Command**: `bash ./scripts/verify-bootstrap.sh`
- **Runner**: Bash (`set -euo pipefail`).
- **Checks Performed**:
  - Ensures execution inside git root via `git rev-parse --show-toplevel`.
  - Verifies presence of:
    - `AGENTS.md`
    - `WORKFLOW.md`
    - `skills/progressive-distillation/SKILL.md`
  - Validates safety markers inside `AGENTS.md`: `git rev-parse --show-toplevel`, `Repository lock`, `WORKFLOW.md`.
  - Validates markers in `WORKFLOW.md`: `commit`, `push`, `merge`.
  - Validates core skill principle in `skills/progressive-distillation/SKILL.md`: `Experience → Reflection → Principle → Experiment → Save`.
- **Execution Status**: PASSED (`PASS: universal bootstrap verified`).

### 3.3 End-to-End Tests: `tests_e2e.py`
- **Location**: `/tests_e2e.py`
- **Execution Command**: `python3 tests_e2e.py`
- **Runner**: Python 3 `playwright` (`async_playwright`).
- **Required Libraries**: `playwright` (Python package) + Playwright Chromium browser binary.
- **Test Scenarios Covered**:
  1. Page loading and title assertion (`Chef Specials AI`).
  2. Initial card rendering count (default 3 dinner specials).
  3. Category filter functionality (`Pasta` produces pasta/noodle dishes like Hilopites, Tagliolini, Ravioles).
  4. Seasonal category filter verification.
  5. Smart count query parsing ("4 specials" -> exactly 4 cards rendered).
  6. Smart count query parsing ("1 special" -> exactly 1 card rendered).
  7. Recipe panel detail view and realistic culinary measurements (e.g., `tbsp`, `tsp`, `portion`, `cup`, `pinch`, `oz`).
  8. Save Special toggle state (`Saved ✓`), sidebar persistence, and LocalStorage quota hygiene (verifies no raw base64 payloads stored).
  9. Prompt fallback disclosure toggle visibility.
  10. Clipboard copy button interaction and user feedback (`Copied ✓`).
  11. Print media stylesheet emulation (verifies `.marketing-kit` and `.prompt-fallback` are hidden with `display: none` under `@media print`).
  12. Console error detection (verifies 0 browser console errors during entire lifecycle).
- **Execution Status**: PASSED (100% pass rate with headless Chromium).
- **CRITICAL DEFECT IDENTIFIED**:
  Lines 6-7 contain:
  ```python
  REPO_DIR = "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo"
  INDEX_HTML = f"file://{REPO_DIR}/index.html"
  ```
  In GitHub Actions CI runners, this directory path will not exist, causing E2E tests to fail. The implementer must resolve this path dynamically (e.g. `Path(__file__).resolve().parent` or `os.environ.get("REPO_DIR", ...)` or serving via local HTTP server).

---

## 4. Runtime Environments & Dependency Matrix

| Component | Target Version | Local Verified Version | Required Packages / Tools |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS 20 or 22 recommended) | `v22.22.2` | Zero external npm packages. Native `node:assert`, `fetch`. |
| **NPM** | `>= 9.0.0` | `10.9.7` | Standard package manager |
| **Python** | `>= 3.10` | `3.14.6` | `playwright` |
| **Browser Engine** | Chromium Headless | Chromium 147.x (via Playwright) | `playwright install chromium` / `playwright install --with-deps chromium` |
| **CLI Utilities** | Bash, Git, Curl | `bash 3.2/5.x`, `git 2.39+`, `curl 8.x` | `git rev-parse`, standard POSIX utilities |
| **Vercel CLI** | `^39.0.0` or `^52.0.0` | `52.0.0` | Authenticated as `cherouri-9248` |
| **GitHub CLI** | `^2.x` | `2.96.0` | Authenticated as `LCHEROURI` |

---

## 5. Serverless Architecture & API Routing

### 5.1 Route Definition
- **File**: `api/generate-image.js`
- **Route Path**: `/api/generate-image`
- **Handler Signature**: `module.exports = async function handler(request, response)` (Vercel Serverless Function format).
- **Configuration** (`vercel.json`):
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

### 5.2 Endpoint Contract & Behaviors
- **HTTP Methods Allowed**: `POST`, `OPTIONS`.
- **CORS Headers**: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`.
- **OPTIONS Request**: Returns HTTP 200 OK immediately with CORS headers.
- **GET Request**: Returns HTTP 405 Method Not Allowed with `Allow: POST, OPTIONS`.
- **Environment Variables**:
  - `OPENAI_API_KEY` (Required for live generation; fallback variable: `chefsspecials`).
  - `OPENAI_IMAGE_MODEL` (Optional, defaults to `"gpt-image-2"`).
  - `OPENAI_IMAGE_QUALITY` (Optional, defaults to `"medium"`).
- **Graceful Unconfigured Behavior**:
  If `OPENAI_API_KEY` is not present, the endpoint does not crash or throw 500; it returns HTTP 200 with:
  ```json
  {
    "setupNeeded": true,
    "message": "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project. Add OPENAI_API_KEY to chef-specials-ai for Production, then redeploy."
  }
  ```

---

## 6. Frontend Build & Serving Strategy

- **Build Step**: NONE. Pure vanilla static assets.
- **Serving Mechanism**:
  - `index.html` is the root document.
  - `styles.css` is directly linked via `<link rel="stylesheet" href="styles.css" />`.
  - `app.js` is directly included via `<script src="app.js"></script>`.
  - `assets/chef-specials-ai-concept.png` is referenced directly in CSS.
- **Vercel Deployment Behavior**:
  - Zero build configuration is needed in Vercel. Vercel automatically deploys root static files to the edge CDN and serves `api/*.js` as serverless lambdas.

---

## 7. Current Infrastructure & Deployment Status

### 7.1 Live Production Status
- **Live URL**: `https://chef-specials-ai.vercel.app/`
- **Status of Static Frontend**: HTTP 200 OK (Served by Vercel Edge).
- **Status of Live API Endpoint**:
  ```bash
  $ curl -I -s https://chef-specials-ai.vercel.app/api/generate-image
  HTTP/2 404
  x-vercel-error: NOT_FOUND
  ```
  **Root Cause**: The current production deployment on Vercel is 97 days old. Commit `4c6ec87` (which added `vercel.json` routing and the fixed `api/generate-image.js`) has not yet been deployed to Vercel production.

### 7.2 GitHub Repository & CI State
- **Remote**: `https://github.com/LCHEROURI/chef-specials-ai.git`
- **Workflows**: Only `.github/workflows/bootstrap-check.yml` exists, which only runs `bash scripts/verify-bootstrap.sh`.
- **Secrets**: `gh secret list` shows no secrets currently configured in the GitHub repository.

---

## 8. Recommendations for Implementation Phase

1. **CI Pipeline (`.github/workflows/ci.yml`)**:
   - Create a comprehensive workflow triggered on `push` (to `main`) and `pull_request`.
   - Job steps:
     1. `actions/checkout@v4`
     2. `actions/setup-node@v4` (Node 20 or 22).
     3. Run `npm test` (verifies `tests_api.js` and `verify-bootstrap.sh`).
     4. `actions/setup-python@v5` (Python 3.11 or 3.12).
     5. Run `pip install playwright && playwright install --with-deps chromium`.
     6. Run `python tests_e2e.py`.
2. **E2E Path Fix**:
   - In `tests_e2e.py`, resolve `REPO_DIR` dynamically:
     ```python
     REPO_DIR = os.environ.get("REPO_DIR", os.path.dirname(os.path.abspath(__file__)))
     ```
     This allows local runs and CI runs to succeed transparently without breaking any tests.
3. **Environment Security Guardrails Script (R3)**:
   - Create `scripts/verify-env.sh` (or `scripts/preflight-check.sh`) to check for `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, and Vercel deployment credentials before deployment, masking secrets and avoiding stdout leaks.
4. **Post-Deployment Smoke Test Script (R4)**:
   - Create `scripts/smoke-test.sh` (or `node scripts/smoke-test.js`) that takes a base URL (defaulting to `https://chef-specials-ai.vercel.app`), verifies:
     - `GET /` returns 200 and expected HTML title/headers.
     - `OPTIONS /api/generate-image` returns 200 with CORS headers.
     - `POST /api/generate-image` returns valid JSON response (either 200 setupNeeded/imageUrl or expected contract).
5. **Production Deployment Workflow (R2)**:
   - Establish GitHub Actions deployment workflow using Vercel CLI or Vercel Action (`amondnet/vercel-action` or CLI `vercel deploy`).
   - Define PR preview deployments and production promotion on `main`.
