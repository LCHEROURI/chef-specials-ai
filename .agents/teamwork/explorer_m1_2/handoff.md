# Handoff Report: CI Workflow Schema & Environment Specification

**From**: Explorer M1_2 (`explorer_m1_2`)  
**To**: Orchestrator & Worker M1  
**Milestone**: M1 (Test Portability & CI Pipeline)  
**Date**: 2026-09-29T15:35:45Z  
**Type**: Hard Handoff  

---

## 1. Observation

1. **Repository Dependency & Script State (`package.json:6-8`)**:
   ```json
   "scripts": {
     "test": "node tests_api.js && ./scripts/verify-bootstrap.sh"
   }
   ```
   No `dependencies` or `devDependencies` fields exist in `package.json`. No `package-lock.json` or `requirements.txt` is present in the repository root.

2. **Existing GitHub Workflow Baseline (`.github/workflows/bootstrap-check.yml:3-9,14-20`)**:
   ```yaml
   on:
     pull_request:
     push:
       branches: [main]

   permissions:
     contents: read
   ...
   runs-on: ubuntu-latest
   ...
         uses: actions/checkout@v5
   ```
   The existing workflow enforces read-only content permissions and targets `ubuntu-latest`.

3. **E2E Test Dependencies & Browser Launch (`tests_e2e.py:4,6,12`)**:
   Line 4 imports `playwright.async_api`. Line 12 launches headless Chromium: `await p.chromium.launch(headless=True)`. In a clean environment lacking Playwright, execution fails with:
   ```
   ModuleNotFoundError: No module named 'playwright'
   ```

4. **Setup-Node Caching Pitfall**:
   Testing `actions/setup-node@v4` with `cache: 'npm'` in repositories lacking a lockfile produces a fatal runner error:
   ```
   Error: Dependencies lock file is not found in /.../chef-specials-ai-repo. Supported file patterns: package-lock.json,npm-shrinkwrap.json
   ```

5. **Local Unit & Bootstrap Test Pass (`npm test`)**:
   Executing `npm test` locally executes `node tests_api.js && ./scripts/verify-bootstrap.sh` and exits with code 0:
   ```
   === ALL API UNIT TESTS PASSED (100%) ===
   PASS: universal bootstrap verified at /Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo
   ```

6. **Schema Validation Result**:
   Validating the formulated candidate workflow against the official GitHub Actions Draft-07 JSON Schema (`https://www.schemastore.org/github-workflow.json`) via `npx --yes ajv-cli validate --spec=draft7 -s github-workflow-schema.json -d candidate_ci.json` exited with code 0:
   ```
   .agents/teamwork/explorer_m1_2/candidate_ci.json valid
   ```

---

## 2. Logic Chain

1. **Security & Least Privilege**: Based on Observation 2, `permissions: contents: read` must be defined at the root level of `.github/workflows/ci.yml`. This strictly limits the default `GITHUB_TOKEN` to read-only repository access, preventing rogue actions or supply chain attacks from writing tags or publishing releases.
2. **Trigger Coverage**: To satisfy Requirement R1 of `ORIGINAL_REQUEST.md`, triggers must include `push: branches: [main]`, `pull_request: branches: [main]`, and `workflow_dispatch`. `workflow_dispatch` enables manual invocation via GitHub UI or CLI without opening PRs.
3. **Concurrency Optimization**: Setting `concurrency: group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}` immediately cancels obsolete runs on open pull requests while allowing every merge to `main` to run to completion, maintaining a pristine audit log.
4. **Lockfile Discipline**: Based on Observations 1 and 4, `actions/setup-node@v4` must configure `node-version: 20` but must NOT declare `cache: 'npm'`, avoiding a fatal lockfile resolution failure.
5. **Runtime Isolation for Playwright**: Based on Observation 3, `actions/setup-python@v5` with `python-version: '3.11'` must be followed by `python -m pip install playwright` and `python -m playwright install --with-deps chromium`. The `--with-deps` flag installs necessary Linux shared libraries (`libnss3`, `libatk1.0-0`, etc.) via `sudo apt-get`. Limiting to `chromium` saves ~400 MB download size and ~60–90 seconds per CI run.
6. **Execution Sequencing & Fail-Fast**: `npm test` (Observation 5) executes first (~1 second). If API tests or bootstrap markers fail, CI aborts immediately before launching Playwright.
7. **Dynamic Path Coupling**: Running `python tests_e2e.py` with `env: REPO_DIR: ${{ github.workspace }}` ensures that the dynamic path resolution implemented by `explorer_m1_1` accurately locates `index.html` inside the GitHub Actions runner.
8. **Schema Conformance**: Based on Observation 6, the resulting YAML conforms strictly to GitHub Actions schema.

---

## 3. Caveats

1. **Dependency on Feature 1 (Path Portability)**: The E2E step relies on `tests_e2e.py` accepting `REPO_DIR` (as specified by `explorer_m1_1`'s handoff). If line 6 of `tests_e2e.py` remains hardcoded to the local macOS path, `tests_e2e.py` will fail in CI with `net::ERR_FILE_NOT_FOUND`.
2. **Future Lockfile Addition**: If `package-lock.json` is generated in future releases, `cache: 'npm'` can be safely re-introduced into `actions/setup-node`.
3. **External Network Availability**: Step `python -m playwright install --with-deps chromium` requires external network connectivity from the GitHub runner to Microsoft Playwright CDNs and Ubuntu apt repositories. On standard GitHub-hosted runners, this is natively permitted.

---

## 4. Conclusion

The exact, schema-compliant specification for `.github/workflows/ci.yml` is ready for implementation by the Worker.

### Exact File Content for `.github/workflows/ci.yml`

```yaml
name: Continuous Integration

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

permissions:
  contents: read

jobs:
  ci:
    name: Test & Verify
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: |
          python -m pip install --upgrade pip
          python -m pip install playwright

      - name: Install Playwright Chromium & dependencies
        run: python -m playwright install --with-deps chromium

      - name: Run unit & API tests
        run: npm test

      - name: Run Playwright E2E tests
        env:
          REPO_DIR: ${{ github.workspace }}
        run: python tests_e2e.py
```

---

## 5. Verification Method

To independently verify this workflow file upon implementation:

1. **Verify YAML Syntax**:
   ```bash
   npx --yes js-yaml -c .github/workflows/ci.yml > /tmp/ci_check.json
   ```
   **Pass Condition**: Command exits with code 0 and emits valid JSON.

2. **Verify Schema Compliance**:
   ```bash
   npx --yes ajv-cli validate --spec=draft7 -s .agents/teamwork/explorer_m1_2/github-workflow-schema.json -d /tmp/ci_check.json
   ```
   **Pass Condition**: Output displays `/tmp/ci_check.json valid` and exits with code 0.

3. **Verify Local Test Execution**:
   ```bash
   npm test
   ```
   **Pass Condition**: Exits with code 0, printing:
   `=== ALL API UNIT TESTS PASSED (100%) ===` and `PASS: universal bootstrap verified`.

4. **Verify Concurrency and Triggers Inspection**:
   Inspect `.github/workflows/ci.yml` to confirm presence of `push: branches: [main]`, `pull_request: branches: [main]`, `workflow_dispatch:`, `permissions: contents: read`, and `cancel-in-progress`.
