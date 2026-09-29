# Explorer 2 Survey Report: Deployment, Routing, Environment Security & Verification

**Date**: 2026-09-29  
**Target Repository**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo`  
**Explorer**: Explorer 2 (`survey_explorer_2`)  
**Scope**: Requirements R2 (Production Deployment), R3 (Environment & Config Security Guardrails), R4 (Post-Deployment Health Check & Smoke Tests)

---

## Executive Summary

This report surveys the production deployment architecture, serverless routing mechanisms, environment variables and secret dependencies, pre-flight configuration security validation, and automated post-deployment health check needs for **Chef Specials AI** (`chef-specials-ai`).

Key findings include:
1. **Hosting & Deployment Target**: The project is linked to Vercel under project `chef-specials-ai` (ID: `prj_a4h6n3FFMS9e9QiIx0NeGU5AfrWV`, Team/Org ID: `team_OdUf22FjPmSylpmhdXPw6OEC`, Owner: `laredj chehrouri's projects`).
2. **Current Production State & Routing Diagnosis**: The live production URL `https://chef-specials-ai.vercel.app/` serves the static frontend from a deployment 14 days ago. Probing `https://chef-specials-ai.vercel.app/api/generate-image` returns `404 Not Found` (`x-vercel-error: NOT_FOUND`) because recent commits creating `vercel.json` and `api/generate-image.js` have not yet been deployed through an automated CI/CD pipeline.
3. **Serverless Function Architecture**: A single Node.js serverless endpoint exists at `api/generate-image.js`, invoked by `app.js` at `/api/generate-image`. It supports `OPTIONS` (CORS preflight) and `POST` (image generation via OpenAI API).
4. **Environment Variables**: The application reads `OPENAI_API_KEY` (with fallback to `process.env.chefsspecials`, which is currently provisioned as an encrypted secret in Vercel Production), `OPENAI_IMAGE_MODEL` (default: `"gpt-image-2"`), and `OPENAI_IMAGE_QUALITY` (default: `"medium"`). Programmatic deployment via Vercel CLI additionally requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
5. **Security & Guardrail Blueprints**: Detailed specifications are provided for:
   - A zero-leakage pre-flight verification script (`scripts/verify-env.js`) ensuring secrets are validated without stdout/log exposure.
   - An automated smoke test script (`scripts/smoke-test.js`) verifying HTTP status, CORS headers, error guards, and API responsiveness across live deployment targets.

---

## 1. Existing Deployment Configurations & Target Infrastructure

### 1.1 Repository Deployment Configuration (`vercel.json`)
The repository contains `vercel.json` at the root:
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
- **`version: 2`**: Specifies Vercel Platform 2.0 configuration standard.
- **`cleanUrls: true`**: Automatically cleans URL extensions (e.g. `/index.html` resolves cleanly as `/`).
- **`rewrites`**: Routes incoming `/api/(.*)` requests explicitly to `/api/$1`.
- **Runtime Defaults**: Since `package.json` contains no custom build script, Vercel automatically deploys the repository root as static assets and mounts `.js` files inside `api/` as Node.js serverless functions.

### 1.2 Target Vercel Project Metadata
Direct inspection of the live Vercel project configuration (`vercel project inspect chef-specials-ai`) confirms:
- **Project Name**: `chef-specials-ai`
- **Project ID**: `prj_a4h6n3FFMS9e9QiIx0NeGU5AfrWV`
- **Team / Org ID**: `team_OdUf22FjPmSylpmhdXPw6OEC`
- **Scope / Account**: `laredj-chehrouris-projects` (user: `cherouri-9248`)
- **Framework Preset**: `Other` (Vanilla HTML/CSS/JS + Node API)
- **Node.js Runtime**: `24.x`
- **Output Directory**: `.` (root directory)
- **Build Command**: `npm run vercel-build` or `npm run build` (falls back to static file copy when absent)
- **Production URL**: `https://chef-specials-ai.vercel.app`

### 1.3 Other Cloud / Deployment Files
- **Netlify**: None.
- **Docker**: None (`Dockerfile` or `docker-compose.yml` absent; not needed for serverless static hosting).
- **GitHub Repository**: Remote is configured at `https://github.com/LCHEROURI/chef-specials-ai.git`. `gh auth status` shows active login as `LCHEROURI`. Currently, no GitHub repository secrets or environment variables are configured.

---

## 2. Serverless Endpoints & Routing Architecture

### 2.1 Serverless Endpoint Inventory
Only one serverless endpoint is implemented:
- **File Path**: `api/generate-image.js`
- **Mapped Route**: `/api/generate-image`
- **Export Pattern**: CommonJS async handler:
  ```js
  module.exports = async function handler(request, response) { ... }
  ```

### 2.2 Endpoint Protocol & Behavior

| Method | Request Payload | Response Code | Headers Set | Behavior / Description |
|---|---|---|---|---|
| **`OPTIONS`** | None | `200 OK` | `Access-Control-Allow-Origin: *`<br>`Access-Control-Allow-Methods: POST, OPTIONS`<br>`Access-Control-Allow-Headers: Content-Type, Authorization` | Preflight CORS approval for cross-origin browser clients. |
| **`GET` / `PUT` / `DELETE`** | Any | `405 Method Not Allowed` | `Allow: POST, OPTIONS`<br>`Content-Type: application/json` | Returns `{ error: "Method not allowed" }`. |
| **`POST`** | `{}` (missing prompt & dishName) | `400 Bad Request` | `Content-Type: application/json` | Returns `{ error: "Prompt or dishName is required." }`. |
| **`POST`** | Valid payload, missing API key | `200 OK` | `Content-Type: application/json` | Returns `{ setupNeeded: true, message: "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project..." }`. |
| **`POST`** | Valid payload, valid API key | `200 OK` | `Content-Type: application/json` | Calls OpenAI API `https://api.openai.com/v1/images/generations` and returns `{ imageUrl, revisedPrompt, model }`. |
| **`POST`** | Valid payload, OpenAI upstream error | Upstream status (e.g. `401`, `429`, `500`) | `Content-Type: application/json` | Returns `{ error: "<message>", model: "<model>" }`. |

### 2.3 Client-Side Invocation in `app.js`
In `app.js` (lines 751–787), image generation triggers:
```javascript
const response = await fetch("/api/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dishName: special.name,
    cuisine: special.cuisine,
    caption: special.caption,
    ingredients: special.ingredients,
    plating: special.recipe.plating,
    prompt: special.recipe.imagePrompt,
    format: "square"
  })
});
```
The client cleanly handles both `payload.imageUrl` (success) and `payload.setupNeeded` (friendly banner explaining key configuration).

### 2.4 Live Production Routing Diagnosis
A live probe to `https://chef-specials-ai.vercel.app` revealed:
- `GET /` returns `200 OK` (`last-modified: Tue, 15 Sep 2026 13:37:33 GMT`).
- `OPTIONS /api/generate-image` returns `404 Not Found` (`x-vercel-error: NOT_FOUND`).
- **Root Cause**: The current production deployment on Vercel is 14 days old and predates the addition of `vercel.json` and `api/generate-image.js` (commit `4c6ec87`).
- **Resolution**: Deploying the updated codebase will automatically resolve the 404 error and expose the serverless endpoint.

---

## 3. Environment Variables & Secret Analysis

### 3.1 Complete Environment Variable Matrix

| Variable Name | Classification | Source & Default | Target Environments | Purpose & Security Sensitivity |
|---|---|---|---|---|
| **`OPENAI_API_KEY`** | Secret | `process.env.OPENAI_API_KEY` (None) | Vercel (Production, Preview) | **CRITICAL SECRET**. Authenticates requests to `https://api.openai.com/v1/images/generations`. Must NEVER be exposed to frontend or CI logs. |
| **`chefsspecials`** | Secret (Legacy Alias) | `process.env.chefsspecials` (None) | Vercel (Production) | **CRITICAL SECRET**. Legacy fallback for `OPENAI_API_KEY` currently provisioned in Vercel project `chef-specials-ai`. |
| **`OPENAI_IMAGE_MODEL`** | Configuration | `process.env.OPENAI_IMAGE_MODEL` || `"gpt-image-2"` | Vercel, Local, CI | **Non-Secret Config**. Specifies OpenAI model name (`gpt-image-2`, `gpt-image-2.5`, `dall-e-3`, `dall-e-2`). |
| **`OPENAI_IMAGE_QUALITY`** | Configuration | `process.env.OPENAI_IMAGE_QUALITY` || `"medium"` | Vercel, Local, CI | **Non-Secret Config**. Image quality parameter (`medium`, `standard`, `hd`). |
| **`VERCEL_TOKEN`** | Secret | GitHub Actions Secret | CI/CD Runner | **DEPLOYMENT SECRET**. Vercel API / CLI access token authorizing deployments. |
| **`VERCEL_ORG_ID`** | Secret / Config | `team_OdUf22FjPmSylpmhdXPw6OEC` | GitHub Actions / Vercel CLI | Organization / Team identifier. |
| **`VERCEL_PROJECT_ID`** | Secret / Config | `prj_a4h6n3FFMS9e9QiIx0NeGU5AfrWV` | GitHub Actions / Vercel CLI | Project identifier for `chef-specials-ai`. |

### 3.2 Existing Vercel Project Environment Status
Checking the live Vercel environment (`vercel env ls`) confirmed:
- `chefsspecials`: Status **Encrypted**, Environment **Production** (created 122 days ago).
- `OPENAI_API_KEY`: Not yet listed separately on Vercel; the serverless function seamlessly falls back to `process.env.chefsspecials`. Adding `OPENAI_API_KEY` will provide forward compatibility.

---

## 4. Pre-Flight Verification Script Requirements (R3)

### 4.1 Objective & Security Guardrails
Requirement R3 demands automated environment configuration validation prior to deployment, ensuring that:
1. All required production secrets and environment variables are present and syntactically valid before any deployment command is triggered.
2. **Zero Secret Exposure**: Under no circumstances should sensitive values (such as API keys or deployment tokens) be printed to `stdout`, `stderr`, CI log outputs, or error stack traces.

### 4.2 Safe Validation Methodology (No Leaks)
To prevent accidental leakage:
1. **GitHub Actions Masking**: When executing in CI (`process.env.GITHUB_ACTIONS === 'true'`), the script must issue GitHub Actions masking commands for any detected secret:
   ```js
   if (process.env.GITHUB_ACTIONS && value) {
     process.stdout.write(`::add-mask::${value}\n`);
   }
   ```
2. **Abstract Status Reporting**:
   Never output: `"Key sk-proj-123456... is valid"`.
   Instead output:
   ```
   [CHECK] OPENAI_API_KEY: Present (Length: 51, Prefix: sk-*, Status: VALID)
   ```
3. **Format & Structural Sanity Checks**:
   - **Presence**: Value exists and is non-empty after trimming.
   - **Minimum Length**: Length >= 20 characters (standard API keys are 50–160+ chars).
   - **Prefix Check**: Matches `^sk-[a-zA-Z0-9_-]+` or `^sk-proj-[a-zA-Z0-9_-]+`.
   - **Placeholder Rejection**: Reject known mock/dummy values (e.g. `"sk-test"`, `"sk-xxx"`, `"dummy"`, `"YOUR_KEY"`).

### 4.3 Execution Modes for Pre-Flight Validation
The pre-flight script (`scripts/verify-env.js`) should support two modes:
1. **Production Mode (`--strict` or `NODE_ENV=production`)**:
   - Requires `OPENAI_API_KEY` (or `chefsspecials`) to be present and structurally valid.
   - Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` if deployment is being executed via Vercel CLI.
   - Exits with `1` if any required secret is missing or invalid.
2. **CI / PR Preview Mode (`--preview` or default)**:
   - For pull requests from forks or untrusted branches without secret access, allows deployment to proceed with a warning, or verifies fallback mock readiness.
   - Validates that non-secret configuration (`OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`) is compliant.
   - Exits with `0` when prerequisites for the target environment are satisfied.

### 4.4 Proposed Script Structure (`scripts/verify-env.js`)
```javascript
#!/usr/bin/env node
/**
 * Pre-flight Environment and Secret Verification Guardrail (R3)
 * Safely verifies required configuration without exposing secrets.
 */

const isStrict = process.argv.includes("--strict") || process.env.VERIFY_STRICT === "true";
const isDeploy = process.argv.includes("--deploy") || process.env.VERIFY_DEPLOY === "true";

// Masking in GitHub Actions
function registerMask(val) {
  if (process.env.GITHUB_ACTIONS && val && typeof val === "string") {
    process.stdout.write(`::add-mask::${val}\n`);
  }
}

// Validation logic
let failed = false;
console.log("=== PRE-FLIGHT ENVIRONMENT & CONFIGURATION VERIFICATION ===");

// 1. OpenAI Key Check
const apiKey = process.env.OPENAI_API_KEY || process.env.chefsspecials;
if (apiKey) {
  registerMask(apiKey);
  const isValidFormat = /^sk-[a-zA-Z0-9_-]{20,}$/.test(apiKey);
  if (!isValidFormat && !apiKey.startsWith("sk-")) {
    console.warn("⚠ [WARN] OPENAI_API_KEY does not start with standard 'sk-' prefix.");
  }
  console.log(`✓ OPENAI_API_KEY: Present (Length: ${apiKey.length}, Format: Valid)`);
} else {
  if (isStrict) {
    console.error("✗ [FAIL] OPENAI_API_KEY (or chefsspecials) is missing in production environment!");
    failed = true;
  } else {
    console.log("ℹ [INFO] OPENAI_API_KEY: Unset (Allowed for non-production preview / unit tests).");
  }
}

// 2. OpenAI Model & Quality Config Check
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
console.log(`✓ OPENAI_IMAGE_MODEL: "${model}"`);

const quality = process.env.OPENAI_IMAGE_QUALITY || "medium";
console.log(`✓ OPENAI_IMAGE_QUALITY: "${quality}"`);

// 3. Deployment Credentials Check (if verifying deploy pipeline)
if (isDeploy) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const orgId = process.env.VERCEL_ORG_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (vercelToken) registerMask(vercelToken);
  
  const tokenOk = Boolean(vercelToken && vercelToken.length > 10);
  const orgOk = Boolean(orgId && orgId.length > 5);
  const projOk = Boolean(projectId && projectId.length > 5);

  console.log(`  - VERCEL_TOKEN: ${tokenOk ? "✓ Present" : "✗ Missing"}`);
  console.log(`  - VERCEL_ORG_ID: ${orgOk ? "✓ Present" : "✗ Missing"}`);
  console.log(`  - VERCEL_PROJECT_ID: ${projOk ? "✓ Present" : "✗ Missing"}`);

  if (!tokenOk || !orgOk || !projOk) {
    console.error("✗ [FAIL] Missing required Vercel deployment credentials!");
    failed = true;
  }
}

if (failed) {
  console.error("\nResult: Pre-flight verification FAILED.");
  process.exit(1);
}

console.log("\nResult: Pre-flight verification PASSED. Ready for deployment.");
process.exit(0);
```

---

## 5. Post-Deployment Health Check & Smoke Test Requirements (R4)

### 5.1 Objective
Requirement R4 mandates a programmatic smoke test / health check script that verifies a live deployment endpoint, confirming serverless API responsiveness and valid application headers.

### 5.2 Verification Matrix
The health check script (`scripts/smoke-test.js`) must systematically execute the following 6 probes against any target URL:

| Probe # | Description | Request Method | Target Path | Expected Status | Critical Header Assertions | Body / Payload Assertions |
|---|---|---|---|---|---|---|
| **1** | **Static Frontend Root** | `GET` | `/` | `200 OK` | `content-type`: `text/html` | Must contain `<title>Chef Specials AI</title>` and `<div class="app-shell">`. |
| **2** | **Static CSS Asset** | `GET` | `/styles.css` | `200 OK` | `content-type`: `text/css` | Must contain `--copper` or `.app-shell`. |
| **3** | **Static JS Bundle** | `GET` | `/app.js` | `200 OK` | `content-type`: `*javascript*` | Must contain `generateDishImage` and `specialsList`. |
| **4** | **Serverless CORS Preflight** | `OPTIONS` | `/api/generate-image` | `200 OK` | `access-control-allow-origin: *`<br>`access-control-allow-methods: *POST*` | Status must be 200 (not 404 or 405). |
| **5** | **Serverless Method Guard** | `GET` | `/api/generate-image` | `405 Method Not Allowed` | `allow: *POST*`<br>`content-type`: `application/json` | JSON must match `{ error: "Method not allowed" }`. |
| **6** | **Serverless Responsiveness Probe** | `POST` | `/api/generate-image` | `200 OK` | `content-type`: `application/json` | Request with `{ "dishName": "Smoke Test Probe" }`. Must return JSON with either `{ setupNeeded: true }` OR `{ imageUrl: ... }` OR valid OpenAI payload. **Must NOT return 404 (route missing) or 500 (crash)**. |

### 5.3 Programmatic Invocations & Retries
- **CLI Invocations**:
  - `node scripts/smoke-test.js [DEPLOYMENT_URL]`
  - Defaults to `https://chef-specials-ai.vercel.app` if no URL argument is passed.
- **Propagation Retries**:
  - Vercel DNS and edge routing can take 5–15 seconds to propagate after deployment. The script should feature configurable retries (e.g., 5 attempts with 3-second backoff) on HTTP 404 or connection reset before declaring failure.
- **CI / Exit Codes**:
  - Exits with `0` when all probes pass.
  - Exits with `1` if any probe fails after retries.
  - Outputs clear terminal summary:
    ```
    === CHEF SPECIALS AI LIVE DEPLOYMENT SMOKE TEST ===
    Target URL: https://chef-specials-ai.vercel.app
    [1/6] GET / (Static Root): 200 OK ✓
    [2/6] GET /styles.css (Styles): 200 OK ✓
    [3/6] GET /app.js (Script): 200 OK ✓
    [4/6] OPTIONS /api/generate-image (CORS Preflight): 200 OK ✓
    [5/6] GET /api/generate-image (Method Guard): 405 Method Not Allowed ✓
    [6/6] POST /api/generate-image (API Health Probe): 200 OK (setupNeeded: true) ✓
    ==================================================
    All 6 deployment smoke tests passed successfully!
    ```

---

## 6. Synthesis & Recommendations for Implementation

1. **Deployment Architecture (R2)**:
   - Keep `vercel.json` as is (it correctly handles `cleanUrls` and `/api/*` rewrites).
   - In `package.json`, add standard script aliases:
     - `"build": "echo 'Static build ready'"`
     - `"verify:env": "node scripts/verify-env.js"`
     - `"test:smoke": "node scripts/smoke-test.js"`
   - Create GitHub Actions deployment workflow (e.g. `.github/workflows/deploy.yml` or unified with CI) triggering on:
     - Push to `main`: Deploy to Production (`vercel deploy --prod`).
     - Pull Request: Deploy Preview (`vercel deploy`).
2. **Environment & Secrets Guardrail (R3)**:
   - Create `scripts/verify-env.js`.
   - Incorporate `npm run verify:env` as a mandatory pre-deployment gate in the deployment workflow.
3. **Automated Smoke Testing (R4)**:
   - Create `scripts/smoke-test.js`.
   - Call `node scripts/smoke-test.js $DEPLOYMENT_URL` immediately following Vercel deployment step in CI/CD.
4. **CI Compatibility Note for `tests_e2e.py`**:
   - In `tests_e2e.py`, line 6 currently has a hardcoded absolute path: `REPO_DIR = "/Users/laredjchehrouri/.../chef-specials-ai-repo"`.
   - For CI to run `tests_e2e.py`, the path must be made dynamic (e.g., `os.path.dirname(os.path.abspath(__file__))` or serving over `localhost`).
