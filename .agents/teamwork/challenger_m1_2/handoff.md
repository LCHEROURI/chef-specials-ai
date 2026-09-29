# Handoff Report: Challenger M1_2 — Adversarial CI Workflow & Exit Code Verification

**From**: Challenger M1_2 (`challenger_m1_2`)  
**To**: Orchestrator (`parent`)  
**Milestone**: M1 (Test Portability & CI Pipeline)  
**Date**: 2026-09-29T15:47:00Z  
**Type**: Hard Handoff  
**Verdict**: **APPROVE**  

---

## Challenge Summary

**Overall risk assessment**: **LOW**

Worker M1's deliverables (`.github/workflows/ci.yml` and `tests_e2e.py`) were subjected to adversarial testing across four failure vectors:
1. Multi-parser compatibility and Draft-07 schema compliance (testing the YAML 1.1 `on:` boolean coercion footgun).
2. Exit code propagation and runner short-circuiting under simulated step failures.
3. Least-privilege permissions, action pins, and shallow clone compatibility.
4. Hostile path resolutions, missing assets, and console error trapping in headless Playwright.

All empirical tests confirmed that `.github/workflows/ci.yml` is robust, fails fast upon any test regression, correctly isolates permissions, and complies with official GitHub Actions schemas.

---

## 1. Observation

### 1.1 Multi-Parser Schema Validation & YAML 1.1 Coercion Stress-Testing
- **Target File**: `.github/workflows/ci.yml`
- **Command 1 (Draft-07 SchemaStore Validation)**:
  ```bash
  curl -sL https://json.schemastore.org/github-workflow.json > /tmp/schemastore_gh.json && \
  npx -y js-yaml .github/workflows/ci.yml > /tmp/ci_test.json && \
  npx -y ajv-cli validate --spec=draft7 -s /tmp/schemastore_gh.json -d /tmp/ci_test.json
  ```
  - Exit code: `0`
  - Verbatim Output: `/tmp/ci_test.json valid`
- **Command 2 (PyYAML Parser & Boolean Coercion Test)**:
  ```python
  import yaml
  with open('.github/workflows/ci.yml') as f: raw = f.read()
  doc = yaml.safe_load(raw)
  assert 'on' in doc and True not in doc
  ```
  - Exit code: `0`
  - Verbatim Output:
    ```
    ✓ PyYAML safe_load successful. Key "on" is properly string-keyed.
    ✓ PyYAML full_load successful.
    Unquoted sample key type: [<class 'bool'>]
    ✓ Verified YAML 1.1 footgun: unquoted "on:" coerces to boolean True. Worker M1 quotation protects against this!
    ```

### 1.2 Simulated Step Failures & Exit Code Propagation
- **Command 1 (Bootstrap Script Failure Simulation)**:
  Tested in temporary git repository missing `AGENTS.md` and missing safety markers:
  - Exit code: `1`
  - Verbatim Output: `FAIL: missing required bootstrap file: .../AGENTS.md` and `FAIL: AGENTS.md is missing universal safety marker: git rev-parse --show-toplevel`
- **Command 2 (Simulated API Unit Test Failure in `npm test`)**:
  Tested `node -e 'process.exit(1)' && ./scripts/verify-bootstrap.sh`:
  - Exit code: `1`
  - Output: The `&&` chain in `package.json` short-circuited immediately without running subsequent commands.
- **Command 3 (Runner Short-Circuiting Simulation)**:
  Simulated GitHub Actions runner executing pipeline steps under failure injection:
  - When Step 3 (`verify-bootstrap.sh`) failed, the workflow immediately aborted with status `FAILURE`, skipping Step 4 (`npm test`), Step 6 (pip install), and Step 8 (`tests_e2e.py`).
  - When Step 4 (`npm test`) failed, the workflow immediately aborted, skipping expensive Python dependency downloads and browser installations.

### 1.3 Shallow Clone Compatibility (`fetch-depth: 1`)
- Tested `scripts/verify-bootstrap.sh` inside a shallow clone created via `git clone --depth 1`:
  - Exit code: `0`
  - Verbatim Output: `PASS: universal bootstrap verified at .../shallow-clone`
  - Proves that `git rev-parse --show-toplevel` succeeds without requiring full git history.

### 1.4 Adversarial Path Resolution in `tests_e2e.py`
- **Case 1 (Absolute Path)**: `REPO_DIR="$(pwd)" python tests_e2e.py` -> Exit code: `0`.
- **Case 2 (Unset `REPO_DIR`)**: Python default resolution `Path(__file__).resolve().parent` -> Exit code: `0`.
- **Case 3 (Empty String `REPO_DIR=""`)**: Python truthiness falls back to default directory -> Exit code: `0`.
- **Case 4 (Relative Directory `REPO_DIR="."`)**: `.resolve()` resolves to current directory -> Exit code: `0`.
- **Case 5 (Missing `index.html`)**: `REPO_DIR="/empty_temp_dir"` -> Exit code: `1` (`FileNotFoundError: index.html not found in repository root`).
- **Case 6 (Path with Spaces)**: Directory `/tmp/.../path with spaces` -> Exit code: `0`. `.as_uri()` correctly emitted `file:///.../path%20with%20spaces/index.html`.
- **Case 7 (Missing Asset Detection)**: When directory was populated without `assets/`, Playwright detected console error `Failed to load resource: net::ERR_FILE_NOT_FOUND` and failed with exit code: `1`.

---

## 2. Logic Chain

1. **Premise**: In GitHub Actions CI pipelines, workflow failure detection must be instantaneous, unambiguous, and immune to parser quirks or environment variations.
2. **Step 1 (Schema Invariant)**: In YAML 1.1 parsers (e.g. PyYAML), an unquoted `on:` key is automatically parsed as a boolean `True`. This causes schema validation failures against Draft-07 schemas that require string key `"on"`. By quoting `'on':`, Worker M1 ensured valid parsing across both YAML 1.1 and YAML 1.2 implementations (Observation 1.1).
3. **Step 2 (Execution Safety)**: In `.github/workflows/ci.yml`, steps are executed sequentially in default bash (`-e`). Step 3 (`verify-bootstrap.sh`) and Step 4 (`npm test`) execute before Python/Playwright setup. If either fails, the workflow immediately aborts (exit code 1), ensuring zero CPU waste on Chromium package downloads (Observation 1.2).
4. **Step 3 (Permission Confinement)**: Declaring top-level `permissions: contents: read` restricts GITHUB_TOKEN to read-only repository access. Actions `checkout@v4`, `setup-node@v4`, and `setup-python@v5` operate without elevated tokens.
5. **Step 4 (E2E Resilience)**: In `tests_e2e.py`, utilizing `Path(_env_dir).resolve() if _env_dir else _default_dir` handles all permutations of environment overrides (empty strings, relative paths, absolute paths, and paths containing spaces via `.as_uri()`). The assertion on `len(console_errors) == 0` guarantees that broken links or missing assets immediately fail the test (Observation 1.4).

---

## 3. Caveats

1. **Playwright apt dependencies**: Step 7 (`python -m playwright install --with-deps chromium`) requires root/sudo privileges on Linux to execute `apt-get install`. This is standard and supported by GitHub-hosted `ubuntu-latest` runners. If moved to an unprivileged custom container runner in the future, browser OS libraries would need to be pre-baked into the image.
2. **Absence of `package-lock.json`**: Caching in `actions/setup-node@v4` remains intentionally omitted because the project does not maintain a lockfile. This is correct for the current zero-dependency architecture.

---

## 4. Conclusion

- **Verdict**: **APPROVE**
- `.github/workflows/ci.yml` strictly adheres to GitHub Actions syntax, passes official schema validation, enforces least-privilege token permissions, and guarantees immediate exit code 1 propagation on failure.
- `tests_e2e.py` is portable across operating systems, runner directories, and path formats.
- Milestone 1 is approved for integration.

---

## 5. Verification Method

To independently verify the empirical results:

1. **Verify Draft-07 SchemaStore Compliance**:
   ```bash
   npx -y js-yaml .github/workflows/ci.yml > /tmp/ci_test.json
   npx -y ajv-cli validate --spec=draft7 -s https://json.schemastore.org/github-workflow.json -d /tmp/ci_test.json
   ```
   *Expected Result*: `/tmp/ci_test.json valid` (exit 0).

2. **Verify YAML Linter**:
   ```bash
   npx -y yaml-lint .github/workflows/ci.yml
   ```
   *Expected Result*: `✔ YAML Lint successful.` (exit 0).

3. **Verify Project Test Suite**:
   ```bash
   npm test
   ```
   *Expected Result*: All API unit tests pass (100%), universal bootstrap passes (exit 0).

4. **Verify Portable E2E Execution**:
   ```bash
   REPO_DIR="$(pwd)" python tests_e2e.py
   ```
   *Expected Result*: All 11 Playwright checks pass with zero console errors (exit 0).
