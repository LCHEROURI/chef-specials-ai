# Handoff Report: Deployment, Routing, Environment Security & Verification Survey

**Agent**: Explorer 2 (`survey_explorer_2`)  
**Date**: 2026-09-29  
**Working Directory**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_survey_2`  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Repository Deployment & Config Files**:
   - `vercel.json` exists at the project root (`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/vercel.json` lines 1–11):
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
   - `package.json` (`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/package.json` lines 6–8):
     ```json
     "scripts": {
       "test": "node tests_api.js && ./scripts/verify-bootstrap.sh"
     }
     ```
     No `"build"` or deployment/smoke script is currently present in `package.json`.
   - `.gitignore` (`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.gitignore` lines 1–2):
     ```
     .vercel
     ```

2. **Serverless Function & Client Routing**:
   - `api/generate-image.js` exists (`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/api/generate-image.js` lines 1–147).
     - Lines 1–2: Reads `process.env.OPENAI_IMAGE_MODEL` (fallback `"gpt-image-2"`) and `process.env.OPENAI_IMAGE_QUALITY` (fallback `"medium"`).
     - Lines 17–24: Handles `OPTIONS` method with CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`) and returns status `200`.
     - Lines 26–30: Rejects non-POST methods with `405 Method Not Allowed` and `Allow: POST, OPTIONS`.
     - Lines 43–46: Validates body, returns `400 Bad Request` if `!dishName && !prompt`.
     - Line 48: `const apiKey = process.env.OPENAI_API_KEY || process.env.chefsspecials;`
     - Lines 49–55: If no API key is present, returns `200 OK` with `{ setupNeeded: true, message: "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project..." }`.
   - Client invocation in `app.js` (`/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/app.js` line 752):
     Calls `fetch("/api/generate-image", { method: "POST", ... })`.

3. **Vercel Account & Live Production State**:
   - Running `vercel project inspect chef-specials-ai` outputs:
     - Project ID: `prj_a4h6n3FFMS9e9QiIx0NeGU5AfrWV`
     - Team ID: `team_OdUf22FjPmSylpmhdXPw6OEC`
     - Account: `laredj-chehrouris-projects` (user: `cherouri-9248`)
     - Node Version: `24.x`
     - Production URL: `https://chef-specials-ai.vercel.app`
   - Checking Vercel project environment variables (`vercel env ls`) outputs:
     `chefsspecials Encrypted Production 122d ago`
   - Live probing via curl:
     - `curl -sI https://chef-specials-ai.vercel.app/` returns `HTTP/2 200` (`last-modified: Tue, 15 Sep 2026 13:37:33 GMT`).
     - `curl -sI -X OPTIONS https://chef-specials-ai.vercel.app/api/generate-image` returns `HTTP/2 404` (`x-vercel-error: NOT_FOUND`).
   - Git commit history (`git log -n 5`):
     Commit `4c6ec87` on `main` ("fix: resolve serverless 404, image API compatibility, recipe measurements, and filters") was authored locally today and created `vercel.json` and `api/generate-image.js`. It has not yet been deployed to Vercel production.

4. **GitHub Repository State**:
   - Remote URL: `https://github.com/LCHEROURI/chef-specials-ai.git`
   - Running `gh secret list -R LCHEROURI/chef-specials-ai` returns `no secrets found`.
   - Workflow file `.github/workflows/bootstrap-check.yml` exists and only checks universal bootstrap.

5. **Unit & E2E Test Execution**:
   - `npm test` executes `node tests_api.js && ./scripts/verify-bootstrap.sh` and passes with code 0 (100% assertions pass).
   - In `tests_e2e.py` line 6: `REPO_DIR = "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo"`. This absolute path must be generalized for headless CI runners.

---

## 2. Logic Chain

1. **Why does live `/api/generate-image` return 404 today?**
   - Observation 3 shows the live Vercel deployment timestamp is `Tue, 15 Sep 2026 13:37:33 GMT` (14 days old).
   - Observation 1 and 3 show that `vercel.json` and `api/generate-image.js` were created in commit `4c6ec87` on `main`.
   - Therefore, the 404 is an artifact of pending deployment; once deployed, Vercel will mount `api/generate-image.js` at `/api/generate-image`.

2. **Why does the serverless function work even if `OPENAI_API_KEY` is not explicitly set?**
   - Observation 2 (line 48) shows the code checks `process.env.OPENAI_API_KEY || process.env.chefsspecials`.
   - Observation 3 shows `chefsspecials` is already configured in the Vercel project for Production.
   - Observation 2 (lines 49–55) shows that if neither is set, the function returns HTTP 200 with `{ setupNeeded: true }`.
   - Therefore, the route is safe against unhandled exceptions if the key is missing, and will authenticate automatically once deployed against the existing Vercel project.

3. **How should pre-flight verification (R3) guarantee zero secret leakage?**
   - Secrets (`OPENAI_API_KEY`, `VERCEL_TOKEN`) must never be written to stdout or stderr.
   - Calling `::add-mask::<value>` in GitHub Actions ensures any downstream runner log scrubbers redact accidental string occurrences.
   - Reporting only boolean status, character length, and static prefix format provides sufficient operational feedback without exposing sensitive entropy.

4. **How should smoke testing (R4) safely verify the deployment?**
   - Verifying `GET /`, `GET /styles.css`, and `GET /app.js` confirms static asset delivery and HTML shell integrity.
   - Verifying `OPTIONS /api/generate-image` confirms CORS preflight headers and that the serverless route is mounted.
   - Verifying `GET /api/generate-image` confirms the 405 Method Not Allowed guard works as specified.
   - Verifying `POST /api/generate-image` with `{ "dishName": "Smoke Test" }` confirms the Node runtime executes and returns valid JSON (status 200) without crashing (500) or failing route resolution (404).

---

## 3. Caveats

1. **GitHub Secrets Provisioning**:
   - `gh secret list` shows no secrets in `LCHEROURI/chef-specials-ai`. Automated CI/CD deployment via GitHub Actions will require the repository owner to configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub Secrets if using token-based CLI deployments. Alternatively, if Vercel's native GitHub app integration is enabled on the repository, Vercel handles deployments automatically on commit push.
2. **OpenAI Upstream Quota / Model Latency**:
   - The smoke test probe should not expect a real generated image from OpenAI on every test run, because doing so consumes live OpenAI quota and introduces 5–15 second latency. A valid 200 response with `{ setupNeeded: true }` or valid JSON payload proves end-to-end serverless execution.
3. **Localhost vs Live Preview in E2E Tests**:
   - `tests_e2e.py` currently loads `file://.../index.html`. For CI, running Playwright headless against either local static server (`npx serve` / Python `http.server`) or the deployed preview URL is necessary.

---

## 4. Conclusion

The application architecture is well-suited for automated Vercel deployment:
1. `vercel.json` is correctly structured and requires no breaking changes.
2. The serverless function in `api/generate-image.js` is robust, implements CORS preflight, enforces POST-only access, handles missing keys gracefully, and supports both `OPENAI_API_KEY` and legacy `chefsspecials`.
3. To fulfill requirements R2, R3, and R4, the repository needs:
   - `scripts/verify-env.js` (R3): A zero-leakage pre-flight script with GitHub Actions masking, validating `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, and deployment secrets.
   - `scripts/smoke-test.js` (R4): A programmatic multi-probe health check script testing static routes, headers, CORS preflight, and serverless responsiveness.
   - `.github/workflows/deploy.yml` (R2): An automated GitHub Actions pipeline executing pre-flight verification, deployment preview/production promotion, and post-deployment smoke testing.

---

## 5. Verification Method

1. **Verify Vercel Project Link and Metadata**:
   ```bash
   vercel project inspect chef-specials-ai
   ```
   Assert Project ID is `prj_a4h6n3FFMS9e9QiIx0NeGU5AfrWV`.

2. **Verify Serverless Function Local Unit Tests**:
   ```bash
   npm test
   ```
   Assert all unit tests pass with exit code 0.

3. **Verify Current Live Production Response**:
   ```bash
   curl -sI https://chef-specials-ai.vercel.app/
   # Returns HTTP 200
   curl -sI -X OPTIONS https://chef-specials-ai.vercel.app/api/generate-image
   # Currently returns HTTP 404 (confirming need for deployment)
   ```

4. **Verify Pre-Flight Script Specification (when implemented)**:
   ```bash
   node scripts/verify-env.js
   # Exit code 0, no secrets printed
   ```

5. **Verify Smoke Test Script Specification (when implemented)**:
   ```bash
   node scripts/smoke-test.js https://chef-specials-ai.vercel.app
   # Executes 6 probes against target
   ```
