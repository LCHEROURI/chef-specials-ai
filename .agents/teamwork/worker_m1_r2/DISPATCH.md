# Dispatch to Worker M1_R2 (Milestone 1 Patch Application & Verification)

## Objective
Apply the 3 verified patches identified by the retry explorers to achieve 100% test pass and schema compliance:
1. **Fix Concurrency in `.github/workflows/ci.yml`**:
   Update line 12 from:
   `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`
   to:
   `cancel-in-progress: true`
2. **Fix Pasta Flake in `tests_e2e.py`**:
   At line 54 (or the pasta keyword check), add `"hilopites"`:
   ```python
   has_pasta = any(k in " ".join(card_titles).lower() for k in ["tagliolini", "ravioles", "noodles", "orzo", "pappardelle", "mac and cheese", "pasta", "gnocchi", "hilopites"])
   ```
3. **Fix Dynamic Guard in `tests_e2e.py`**:
   Only verify `(REPO_DIR / "index.html").exists()` when `BASE_URL` and `APP_URL` are not set:
   ```python
   _base_url = os.environ.get("BASE_URL") or os.environ.get("APP_URL")
   if not _base_url and not (REPO_DIR / "index.html").exists():
       raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")

   INDEX_HTML = _base_url or (REPO_DIR / "index.html").as_uri()
   ```

## File Ownership
You exclusively own:
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/tests_e2e.py`
- `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.github/workflows/ci.yml`

## Input Information
- ORIGINAL_REQUEST.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md`
- PROJECT.md: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md`
- Explorer M1_Retry_1 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_retry_1/handoff.md`
- Explorer M1_Retry_2 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_retry_2/handoff.md`
- Explorer M1_Retry_3 Handoff: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_retry_3/handoff.md`

## Verification Requirements
You MUST run the following commands and record outputs in your handoff report:
1. `npm test` (must pass with exit code 0)
2. `python tests_e2e.py` (all 11 tests must pass with exit code 0)
3. `python3 e2e_tests/runner.py` (verify `test_ci_workflow_concurrency_group` now PASSES, 0 failures, 0 errors)
4. Validate `.github/workflows/ci.yml` schema

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Deliverables
- Write `handoff.md` in `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1_r2/handoff.md`
- Send completion message to orchestrator.

## 2026-09-29T15:53:05Z
You are Worker M1_R2 (worker_m1_r2).
Your working directory is /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1_r2
Read your dispatch instructions at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/worker_m1_r2/DISPATCH.md, ORIGINAL_REQUEST.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/ORIGINAL_REQUEST.md, and PROJECT.md at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/PROJECT.md.
Apply the 3 verified fixes to .github/workflows/ci.yml and tests_e2e.py.
Run tests (npm test, python tests_e2e.py, and python3 e2e_tests/runner.py).
MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Write handoff.md and notify orchestrator when done.
