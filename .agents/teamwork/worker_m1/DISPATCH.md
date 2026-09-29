# Dispatch to Worker M1 (Test Portability & CI Pipeline Implementation)

## Objective
Implement Milestone 1 (M1):
1. Fix `tests_e2e.py` path portability using dynamic path resolution.
2. Implement `.github/workflows/ci.yml` adhering strictly to GitHub Actions schema, with fail-fast sequencing, triggers, and Playwright Chromium setup.
3. Verify all tests (`npm test`, `tests_e2e.py`) pass cleanly and `.github/workflows/ci.yml` validates against the GitHub Actions schema.

## File Ownership
You exclusively own:
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/tests_e2e.py`
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.github/workflows/ci.yml`
Do NOT edit any other repository files.

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Explorer M1_1 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_1/handoff.md`
- Explorer M1_2 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_2/handoff.md`
- Explorer M1_3 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_3/handoff.md`

## Implementation Details
1. **Dynamic Path in `tests_e2e.py`**:
   Replace the hardcoded macOS path at line 6 with:
   ```python
   from pathlib import Path
   import os

   _default_dir = Path(__file__).resolve().parent
   _env_dir = os.environ.get("REPO_DIR")
   REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir

   if not (REPO_DIR / "index.html").exists():
       raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")

   INDEX_HTML = (REPO_DIR / "index.html").as_uri()
   ```
2. **CI Workflow `.github/workflows/ci.yml`**:
   - Quoted `'on':` key to avoid YAML 1.1 boolean parsing bug:
     - `push: branches: [main]`
     - `pull_request: branches: [main]`
     - `workflow_dispatch:`
   - Concurrency group `ci-${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`
   - `runs-on: ubuntu-latest`, `permissions: contents: read`
   - Steps in fail-fast order:
     - Checkout `actions/checkout@v4` with `fetch-depth: 1`
     - Setup Node.js `actions/setup-node@v4` with `node-version: 20` (NO npm cache flag)
     - Universal Bootstrap Verification: `bash scripts/verify-bootstrap.sh`
     - Unit & API Tests: `npm test`
     - Setup Python `actions/setup-python@v5` with `python-version: '3.11'`
     - Install Python dependencies: `python -m pip install --upgrade pip && python -m pip install playwright`
     - Install Playwright Chromium: `python -m playwright install --with-deps chromium`
     - Run Headless E2E Tests: `python tests_e2e.py` with `env: REPO_DIR: ${{ github.workspace }}`

## Verification Requirements
You MUST run the following commands and record outputs in your handoff report:
1. Validate YAML syntax and GitHub Actions schema of `.github/workflows/ci.yml`.
2. Run `npm test` and verify exit code 0.
3. Run `python tests_e2e.py` and verify all 11 tests pass with exit code 0.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Deliverables
- Modified `tests_e2e.py`
- Created `.github/workflows/ci.yml`
- Write `handoff.md` in `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1/handoff.md`
- Send completion message to orchestrator.

## 2026-09-29T15:36:44Z
<USER_REQUEST>
You are Worker M1 (worker_m1).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1/DISPATCH.md, ORIGINAL_REQUEST.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md, and PROJECT.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md.
Implement the dynamic path fix in tests_e2e.py and create .github/workflows/ci.yml per the specifications.
Execute tests (npm test, python tests_e2e.py, and schema validation on .github/workflows/ci.yml).
Record all verification outputs and commands in handoff.md.
MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
When done, send completion message to orchestrator.
</USER_REQUEST>
