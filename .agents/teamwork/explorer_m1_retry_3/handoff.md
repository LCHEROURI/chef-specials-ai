# Handoff Report: Explorer M1_Retry_3 — Conditional Existence Guard Analysis for `tests_e2e.py`

**Agent**: Explorer M1_Retry_3 (`explorer_m1_retry_3`)  
**Roles**: Explorer, Investigator, Synthesizer  
**Date**: 2026-09-29T15:52:00Z  
**Type**: Hard Handoff  
**Working Directory**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_retry_3`  
**Patch Artifact**: `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m1_retry_3/tests_e2e.patch`  

---

## 1. Observation

### 1.1 Current Implementation in `tests_e2e.py`
In `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/tests_e2e.py`, lines 7–15:
```python
_default_dir = Path(__file__).resolve().parent
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir

if not (REPO_DIR / "index.html").exists():
    raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")

INDEX_HTML = os.environ.get("BASE_URL") or os.environ.get("APP_URL") or (REPO_DIR / "index.html").as_uri()
```
And around line 27:
```python
        # 1. Load index.html
        print(f"Loading {INDEX_HTML}...")
        await page.goto(INDEX_HTML)
```

### 1.2 Verbatim Defect Reproduction
When running `tests_e2e.py` in an environment where `BASE_URL` or `APP_URL` is configured (such as targeting a remote preview URL or staging deployment) but the local filesystem does not have `index.html` at `REPO_DIR`, the script crashes prematurely with a `FileNotFoundError`:
- **Command**:
  ```bash
  BASE_URL="http://127.0.0.1:8765/index.html" REPO_DIR="/nonexistent" python tests_e2e.py
  ```
- **Exit Code**: `1`
- **Verbatim Error Output**:
  ```text
  Traceback (most recent call last):
    File "/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/tests_e2e.py", line 12, in <module>
      raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
  FileNotFoundError: index.html not found in repository root: /nonexistent
  ```

### 1.3 Reviewer Finding Reference
Reviewer M1_1 noted in `.agents/teamwork/reviewer_m1_1/handoff.md`:
> "### Finding 2: [Minor — Hard Dependency on Local `index.html` When `BASE_URL` is Provided]  
> - **What**: `tests_e2e.py` aborts if `(REPO_DIR / "index.html").exists()` is false, even if `BASE_URL` or `APP_URL` is supplied.  
> - **Where**: `tests_e2e.py`, lines 11–14  
> - **Why**: When testing against remote or staging deployments where only the test runner script is present without local repo assets, this causes an unnecessary `FileNotFoundError`."

### 1.4 Test Suite Constraints
In `e2e_tests/test_tier2_boundaries.py`, lines 178–187:
```python
    def test_playwright_e2e_path_portability(self):
        """B4.1: Verify tests_e2e.py supports dynamic repo path for CI environments."""
        with open(os.path.join(REPO_ROOT, "tests_e2e.py"), "r", encoding="utf-8") as f:
            content = f.read()
        has_dynamic = (
            "os.environ.get" in content or
            "os.path.dirname" in content or
            "REPO_DIR" in content
        )
        self.assertTrue(has_dynamic, "tests_e2e.py must reference REPO_DIR")
```
The test verifies that `tests_e2e.py` references `REPO_DIR` and uses dynamic environment resolution.

---

## 2. Logic Chain

1. **Premise**: `tests_e2e.py` is intended to support dual-mode testing:
   - **Local Mode**: When neither `BASE_URL` nor `APP_URL` is set, navigate to local `index.html` via `file://...` URI derived from `REPO_DIR`.
   - **Remote / Staging Mode**: When `BASE_URL` or `APP_URL` is set, navigate directly to that remote HTTP/HTTPS target.
2. **Defect**: Lines 11–12 evaluate `(REPO_DIR / "index.html").exists()` *before* evaluating `BASE_URL` or `APP_URL`. If the script is invoked in an environment lacking local repository files (or `REPO_DIR` points to an external or empty path), lines 11–12 raise `FileNotFoundError` unconditionally, preventing line 14 from ever resolving `INDEX_HTML` to the remote URL.
3. **Conditionality Requirement**: The local filesystem check `(REPO_DIR / "index.html").exists()` is only necessary when neither `BASE_URL` nor `APP_URL` is provided. If either is provided, the local file check should be bypassed entirely.
4. **Edge Case Handling**:
   - `BASE_URL` or `APP_URL` containing empty strings or whitespace (e.g. `BASE_URL=""` or `BASE_URL=" "`) should be treated as unset and fall back to local file mode.
   - `REPO_DIR` must remain referenced and resolved so that `test_playwright_e2e_path_portability` in `e2e_tests/test_tier2_boundaries.py` continues to pass.
5. **Formulated Solution**:
   Evaluate `_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()`.
   - If `_remote_url` is truthy: set `INDEX_HTML = _remote_url`.
   - Else: assert `(REPO_DIR / "index.html").exists()`, raise `FileNotFoundError` if missing, and set `INDEX_HTML = (REPO_DIR / "index.html").as_uri()`.

---

## 3. Caveats

1. **Remote Target Validity**: When `BASE_URL` or `APP_URL` is provided, `tests_e2e.py` assumes the remote host is reachable and running. If the remote server is down, Playwright will fail later during `page.goto(INDEX_HTML)` with a network error rather than an immediate local `FileNotFoundError`, which is the intended behavior.
2. **Read-Only Explorer Scope**: In accordance with the explorer role constraints, `tests_e2e.py` has not been modified in the repository by this agent. The fix is provided as a tested patch artifact at `.agents/teamwork/explorer_m1_retry_3/tests_e2e.patch` ready for Worker M1 to apply.

---

## 4. Conclusion

The clean conditional check should replace lines 11–14 of `tests_e2e.py` as follows:

### Proposed Replacement for `tests_e2e.py` (Lines 11–14)

```python
_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
if _remote_url:
    INDEX_HTML = _remote_url
else:
    if not (REPO_DIR / "index.html").exists():
        raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
    INDEX_HTML = (REPO_DIR / "index.html").as_uri()
```

### Complete Unified Diff (`tests_e2e.patch`)
```diff
--- a/tests_e2e.py
+++ b/tests_e2e.py
@@ -8,10 +8,13 @@
 _env_dir = os.environ.get("REPO_DIR")
 REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir
 
-if not (REPO_DIR / "index.html").exists():
-    raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
-
-INDEX_HTML = os.environ.get("BASE_URL") or os.environ.get("APP_URL") or (REPO_DIR / "index.html").as_uri()
+_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
+if _remote_url:
+    INDEX_HTML = _remote_url
+else:
+    if not (REPO_DIR / "index.html").exists():
+        raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
+    INDEX_HTML = (REPO_DIR / "index.html").as_uri()
 
 async def run_tests():
     print("=== STARTING PLAYWRIGHT E2E VERIFICATION ===")
```

---

## 5. Verification Method

### 5.1 Patch Verification
Verify that the patch file validates cleanly with git:
```bash
git apply --check .agents/teamwork/explorer_m1_retry_3/tests_e2e.patch
```

### 5.2 Functional Behavior Verification
After applying the patch (or running against the proposed logic), test the 4 key scenarios:

```bash
# 1. BASE_URL set with nonexistent REPO_DIR (must succeed without FileNotFoundError)
BASE_URL="http://127.0.0.1:8765/index.html" REPO_DIR="/nonexistent" python -c '
from pathlib import Path; import os
_default_dir = Path(".").resolve()
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir
_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
if _remote_url:
    INDEX_HTML = _remote_url
else:
    if not (REPO_DIR / "index.html").exists():
        raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
    INDEX_HTML = (REPO_DIR / "index.html").as_uri()
assert INDEX_HTML == "http://127.0.0.1:8765/index.html"
print("PASS: BASE_URL bypassed local file check")
'

# 2. APP_URL set with nonexistent REPO_DIR (must succeed without FileNotFoundError)
APP_URL="https://preview.vercel.app" REPO_DIR="/nonexistent" python -c '
from pathlib import Path; import os
_default_dir = Path(".").resolve()
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir
_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
if _remote_url:
    INDEX_HTML = _remote_url
else:
    if not (REPO_DIR / "index.html").exists():
        raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
    INDEX_HTML = (REPO_DIR / "index.html").as_uri()
assert INDEX_HTML == "https://preview.vercel.app"
print("PASS: APP_URL bypassed local file check")
'

# 3. Unset environment variables with nonexistent REPO_DIR (must raise FileNotFoundError)
REPO_DIR="/nonexistent" python -c '
from pathlib import Path; import os
_default_dir = Path(".").resolve()
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir
_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
try:
    if _remote_url:
        INDEX_HTML = _remote_url
    else:
        if not (REPO_DIR / "index.html").exists():
            raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
        INDEX_HTML = (REPO_DIR / "index.html").as_uri()
    print("FAIL: Should have raised FileNotFoundError")
except FileNotFoundError:
    print("PASS: FileNotFoundError raised when local index.html is missing")
'

# 4. Standard local execution (must resolve to file:// URI)
python -c '
from pathlib import Path; import os
_default_dir = Path(".").resolve()
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir
_remote_url = (os.environ.get("BASE_URL") or os.environ.get("APP_URL") or "").strip()
if _remote_url:
    INDEX_HTML = _remote_url
else:
    if not (REPO_DIR / "index.html").exists():
        raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")
    INDEX_HTML = (REPO_DIR / "index.html").as_uri()
assert INDEX_HTML.startswith("file://")
print("PASS: Default mode resolves to local file:// URI")
'
```

### 5.3 Invalidation Condition
This recommendation is invalidated if:
1. `tests_e2e.py` is called with `BASE_URL` or `APP_URL` set pointing to a remote server, yet still raises `FileNotFoundError` due to missing local files.
2. `test_playwright_e2e_path_portability` in `e2e_tests/test_tier2_boundaries.py` fails due to missing `REPO_DIR` references.
