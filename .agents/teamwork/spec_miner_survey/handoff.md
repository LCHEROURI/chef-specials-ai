# Handoff Report: Specification Mining for Chef Specials AI (R1 - R4)

**Handoff Type:** Hard (Task complete)  
**Agent:** Spec Miner (`survey_spec_miner`)  
**Target:** Orchestrator (`parent`, conversation ID: `23be2165-b02e-4b61-a055-0958cd3468f3`)  
**Specification Report Path:** `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/report.md`  
**Timestamp:** 2026-09-29T15:27:30Z  

---

## 1. Observation

Direct observations from codebase inspection, CLI tools, and network probes:

1. **Test & Script Definitions:**
   - In `package.json:7`:
     ```json
     "scripts": {
       "test": "node tests_api.js && ./scripts/verify-bootstrap.sh"
     }
     ```
   - Running `npm test` in `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo` outputs:
     ```text
     === STARTING API/GENERATE-IMAGE UNIT TESTS ===
     ✓ OPTIONS preflight handled with correct CORS headers.
     ✓ Non-POST rejected with 405 Method Not Allowed.
     ✓ Missing prompt rejected with 400.
     ✓ Stringified body safely parsed and unconfigured API key gracefully handled.
     ✓ DALL-E 3 size and quality properly sanitized to valid OpenAI values.
     ✓ GPT-Image-2 preserves next-gen image parameters.
     ✓ DALL-E 3 preserves b64_json response format.
     === ALL API UNIT TESTS PASSED (100%) ===
     PASS: universal bootstrap verified at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo
     ```
     Exited with code `0`.

2. **E2E Test File & Runner Constraints:**
   - In `tests_e2e.py:6-7`:
     ```python
     REPO_DIR = "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo"
     INDEX_HTML = f"file://{REPO_DIR}/index.html"
     ```
   - Running `python3 tests_e2e.py` locally failed with:
     ```text
     ModuleNotFoundError: No module named 'playwright'
     ```
     Exited with code `1`.
   - Python version is 3.14.6 (`/opt/homebrew/bin/python3`).

3. **Current GitHub Actions Configuration:**
   - `.github/workflows/bootstrap-check.yml:1-21` exists, triggered on PR and push to `main`, running only `bash scripts/verify-bootstrap.sh`. It does not execute `npm test` or `tests_e2e.py`.
   - Running `gh secret list -R LCHEROURI/chef-specials-ai` returned:
     ```text
     no secrets found
     ```

4. **Live Production Discrepancy & Routing Issue:**
   - Running `curl -sI https://chef-specials-ai.vercel.app/`:
     ```text
     HTTP/2 200 
     content-type: text/html; charset=utf-8
     last-modified: Tue, 15 Sep 2026 13:37:33 GMT
     server: Vercel
     ```
   - Running `curl -sI -X OPTIONS https://chef-specials-ai.vercel.app/api/generate-image`:
     ```text
     HTTP/2 404 
     x-vercel-error: NOT_FOUND
     ```
   - Running `curl -s -X POST https://chef-specials-ai.vercel.app/api/generate-image -H "Content-Type: application/json" -d '{"prompt":"test"}'`:
     ```text
     The page could not be found
     NOT_FOUND
     ```
   - In Git log, commit `4c6ec874` ("fix: resolve serverless 404, image API compatibility, recipe measurements, and filters") created `vercel.json`, `package.json`, and `api/generate-image.js`. However, the live Vercel production deployment has not been updated since Sept 15, 2026.
   - Vercel CLI check (`vercel whoami`) confirms authentication as `cherouri-9248`, and `vercel project ls` shows project `chef-specials-ai` exists under `laredj-chehrouris-projects` (updated 97 days ago).

5. **Serverless Endpoint Security & Fallbacks:**
   - In `api/generate-image.js:48-55`:
     ```javascript
     const apiKey = process.env.OPENAI_API_KEY || process.env.chefsspecials;
     if (!apiKey) {
       sendJson(response, 200, {
         setupNeeded: true,
         message: "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project..."
       });
       return;
     }
     ```
     When unconfigured, the endpoint returns HTTP 200 with `{ setupNeeded: true }`, allowing health check verification without requiring a funded third-party API key.

---

## 2. Logic Chain

1. **Tracing R1 (CI Requirements):**
   - Observations 1, 2, and 3 show that while `npm test` runs cleanly and quickly, `tests_e2e.py` requires Python Playwright and browser binaries (`playwright install --with-deps chromium`).
   - Observation 2 reveals a path portability issue: line 6 in `tests_e2e.py` hardcodes the local macOS absolute path. In GitHub Actions (`ubuntu-latest`), this must be resolved dynamically via `REPO_DIR = os.environ.get("REPO_DIR", ...)` or `os.path.dirname(__file__)`, or exported as an environment variable in the workflow.
   - Therefore, the CI specification must detail a GitHub Actions workflow (`.github/workflows/ci.yml`) setting up Node 20 LTS, Python 3.11/3.12, installing dependencies, running `scripts/verify-bootstrap.sh`, `npm test`, and `python tests_e2e.py`.

2. **Tracing R2 (Deployment Pipeline):**
   - Observation 4 demonstrates that the production website on Vercel is severely stale (Sept 15, 2026) and returns 404 on `/api/generate-image` because commit `4c6ec87` was never deployed.
   - Therefore, an automated deployment pipeline must be established to deploy pull requests to preview URLs and deploy pushes to `main` directly to production with `--prod`.
   - Vercel deployment requires `vercel.json` rewrites (already created in commit `4c6ec87`) and GitHub Actions secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

3. **Tracing R3 (Security Guardrails):**
   - Observation 5 shows `OPENAI_API_KEY` is the primary sensitive production secret, with `chefsspecials` as legacy fallback.
   - For Vercel CLI deployment in CI, `VERCEL_TOKEN` is also sensitive.
   - To prevent secret leaks in CI logs, a pre-flight verification script (`scripts/verify-env.sh`) must validate secret presence and format (e.g. `sk-` prefix, length check) while strictly masking all values (zero plaintext disclosure).

4. **Tracing R4 (Post-Deployment Health Check):**
   - Observation 4 demonstrates that static assets can return 200 while serverless endpoints return 404.
   - Therefore, a robust smoke test script (`scripts/smoke-test.sh`) must probe both static frontend (`GET /`, `GET /styles.css`, `GET /app.js`) and the serverless API (`OPTIONS /api/generate-image`, `GET 405`, `POST 400`, and `POST 200 setupNeeded/active`).
   - The script must assert that `/api/generate-image` never returns 404.

---

## 3. Caveats

1. **Read-Only Mining Boundary:** As Spec Miner, no production code or workflow files were altered. The identified `tests_e2e.py` path portability issue was documented as an edge case and specification requirement for the implementation agent.
2. **Missing Vercel GitHub Secrets:** `gh secret list` shows no secrets currently configured on the GitHub repository. Automated Vercel CLI deployment in GitHub Actions will require the repository owner to configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
3. **OpenAI API Key in CI vs Production:** `OPENAI_API_KEY` is not required for CI test runs (mock requests are used in `tests_api.js`, and `app.js` runs client-side), nor is it required for basic deployment routing health checks (because the serverless handler returns `{ setupNeeded: true }`). It is only required for live image generation.

---

## 4. Conclusion

The technical specifications, schemas, interfaces, error semantics, and acceptance criteria for R1, R2, R3, and R4 have been fully formalized and documented in `report.md`. The live routing failure (404 on `/api/generate-image`) has been diagnosed as an undeployed production release, providing clear verification criteria for the post-deployment smoke test suite.

---

## 5. Verification Method

To independently verify the observations and specifications:
1. **Verify Unit & Bootstrap Tests:**
   ```bash
   cd /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo
   npm test
   ```
   *Expected result:* Exits with code `0`, passes 100% of unit tests.
2. **Verify Live Deployment Discrepancy:**
   ```bash
   curl -sI https://chef-specials-ai.vercel.app/
   curl -sI -X OPTIONS https://chef-specials-ai.vercel.app/api/generate-image
   ```
   *Expected result:* Root returns 200; `/api/generate-image` returns 404 NOT_FOUND.
3. **Inspect Specification Report:**
   ```bash
   cat /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/spec_miner_survey/report.md
   ```
4. **Invalidation Conditions:**
   - Any modification to `tests_api.js` or `api/generate-image.js` that changes the signature or status codes.
   - Upstream Vercel project redeployment that alters the live 404 state prior to pipeline rollout.
