# Handoff Report: E2E Test Portability & Dynamic Path Resolution

**Target File**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/tests_e2e.py`  
**From**: Explorer M1_1 (`explorer_m1_1`)  
**To**: Orchestrator & Worker M1  
**Milestone**: M1 (Test Portability & CI Pipeline)  
**Date**: 2026-09-29T15:34:30Z  

---

## 1. Observation

1. **Target File Inspection (`tests_e2e.py:6-7`)**:
   Line 6 explicitly hardcodes a local macOS development path:
   ```python
   6: REPO_DIR = "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo"
   7: INDEX_HTML = f"file://{REPO_DIR}/index.html"
   ```
   No environment variable check (such as `os.environ.get("REPO_DIR")`) or dynamic script directory resolution (`Path(__file__).resolve().parent`) exists.

2. **Static Server Absence**:
   Throughout all 184 lines of `tests_e2e.py`, no HTTP server (e.g., `http.server`, `express`, `serve`) is initialized, bound to a port, or terminated. Line 22 navigates directly via Playwright to the file URL:
   ```python
   21:         print(f"Loading {INDEX_HTML}...")
   22:         await page.goto(INDEX_HTML)
   ```
   Zero port numbers are present in the script.

3. **Complete Inventory of Other Assumptions in `tests_e2e.py`**:
   - **Line 12**: Launches Chromium in headless mode: `await p.chromium.launch(headless=True)`.
   - **Line 13**: Grants browser clipboard permissions: `permissions=["clipboard-read", "clipboard-write"]`.
   - **Lines 37, 56, 69, 80, 92, 116, 134, 157**: Uses `await page.wait_for_timeout(300)` or `(100)` for DOM update settling.
   - **Line 127**: Evaluates `localStorage.getItem('chef-specials-ai-saved')` within `file://` context.
   - **Line 165, 172**: Uses `page.emulate_media(media="print")` and `media=None`.
   - **Line 176**: Asserts zero console errors: `assert len(console_errors) == 0`.
   - **Line 4**: Imports `playwright.async_api`. System Python `/opt/homebrew/bin/python3` does not have `playwright` installed (`ModuleNotFoundError: No module named 'playwright'`), but executing with a Playwright-enabled Python environment (`/Users/laredjchehrouri/.gemini/antigravity/scratch/scrapling/.venv/bin/python3 tests_e2e.py`) completed all 11 test cases with 100% success.

4. **URI Resolution Behavior**:
   Executing `python3 -c "from pathlib import Path; p = Path('/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/index.html').resolve(); print(p.as_uri())"` produces:
   ```
   file:///Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/index.html
   ```
   Testing with spaces in path (`Path('/tmp/my repo/index.html').as_uri()`) produces `file:///tmp/my%20repo/index.html`, confirming proper RFC 8089 URI encoding.

---

## 2. Logic Chain

1. **Premise**: In GitHub Actions CI runners (and any non-author local machines), the workspace path is `/home/runner/work/<repo>/<repo>` or a custom local path. The directory `/Users/laredjchehrouri/...` does not exist (Observation 1).
2. **Inference 1**: When `tests_e2e.py` runs on a CI runner with line 6 unchanged, `page.goto("file:///Users/laredjchehrouri/.../index.html")` will trigger `net::ERR_FILE_NOT_FOUND` and fail the build step.
3. **Inference 2**: Because `tests_e2e.py` resides at the top level of the repository, `Path(__file__).resolve().parent` evaluates to the exact repository root directory on any operating system, independent of the current working directory (`cwd`) from which Python is launched.
4. **Inference 3**: To allow custom test environments, CI matrix overrides, or container volumes, `os.environ.get("REPO_DIR")` must take precedence over the script location fallback. Passing relative paths like `REPO_DIR=.` must be handled via `.resolve()`.
5. **Inference 4**: Using `Path.as_uri()` on the resolved path to `index.html` (Observation 4) is superior to string interpolation (`f"file://{REPO_DIR}/index.html"`) because it handles slash formatting on POSIX/Windows and escapes spaces/special characters (`%20`).
6. **Inference 5**: An HTTP server is unnecessary for the current 11 E2E tests because all frontend logic, filter algorithms, smart count parsing, and LocalStorage state manipulation operate purely on client-side JavaScript without backend requests (Observation 2 & 3). However, supporting an optional `BASE_URL` / `APP_URL` environment variable enables seamless switching to live or dev HTTP servers if desired.

---

## 3. Caveats

1. **Serverless API Testing**: If future E2E tests attempt to trigger `/api/generate-image` from within the frontend UI (e.g. clicking the "Generate Dish Photo" button), `file://` cannot proxy relative `/api/*` endpoints. That capability is currently tested separately via `tests_api.js` and `scripts/smoke-test.js`.
2. **CI Runner Python Dependencies**: `tests_e2e.py` requires `playwright` and Chromium binaries. The GitHub Actions CI runner (`.github/workflows/ci.yml`) must run `pip install playwright && playwright install --with-deps chromium` before executing `python tests_e2e.py`.
3. **Timing Timeouts**: The script uses 300ms timeouts (`wait_for_timeout(300)`). If CI runner VMs experience severe CPU throttling, these timeouts could become a source of flakiness, though none was observed in local testing.

---

## 4. Conclusion

1. Line 6 of `tests_e2e.py` must be replaced with dynamic resolution supporting `os.environ.get("REPO_DIR")` with fallback to `Path(__file__).resolve().parent`.
2. `INDEX_HTML` must be generated using `pathlib.Path.as_uri()` with fallback/override support for `BASE_URL` or `APP_URL`.
3. No static HTTP server needs to be spawned in `tests_e2e.py`; continuing to use `file://` avoids port collisions and process cleanup issues in CI.
4. Recommended replacement code for Worker:

```python
from pathlib import Path

# Resolve repository directory dynamically (supports env override, CI runners, and relative invocations)
REPO_DIR = os.environ.get("REPO_DIR")
_repo_path = Path(REPO_DIR).resolve() if REPO_DIR else Path(__file__).resolve().parent
REPO_DIR = str(_repo_path)

_index_file = _repo_path / "index.html"
if not _index_file.is_file():
    raise FileNotFoundError(f"index.html not found at {_index_file}. (REPO_DIR={REPO_DIR})")

INDEX_HTML = os.environ.get("BASE_URL") or os.environ.get("APP_URL") or _index_file.as_uri()
```

---

## 5. Verification Method

1. **Verify Default Resolution**:
   Run from repo root:
   ```bash
   python3 -c "import os; from pathlib import Path; p = Path('tests_e2e.py').resolve().parent; assert (p / 'index.html').is_file(); print('PASS: default resolution')"
   ```

2. **Verify Relative Environment Override**:
   Run with `REPO_DIR="."`:
   ```bash
   REPO_DIR="." python3 -c "import os; from pathlib import Path; r = Path(os.environ['REPO_DIR']).resolve(); assert (r / 'index.html').is_file(); print('PASS: relative override')"
   ```

3. **Verify Invalid Path Detection**:
   ```bash
   REPO_DIR="/invalid/nonexistent" python3 -c "
   import os; from pathlib import Path
   r = Path(os.environ['REPO_DIR']).resolve()
   assert not (r / 'index.html').is_file()
   print('PASS: detected invalid REPO_DIR')
   "
   ```

4. **Verify Full E2E Execution**:
   Once playwright is available in the Python runtime:
   ```bash
   python3 tests_e2e.py
   ```
   **Pass Condition**: Exit code 0, and output finishes with:
   `=== ALL PLAYWRIGHT E2E CHECKS PASSED SUCCESSFULLY (100%) ===`  
   `Console errors recorded: []`  
   `✓ ZERO console errors during the entire E2E flow.`
