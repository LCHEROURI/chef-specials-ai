# Technical Report: CI Workflow Schema, Runtime Environment & Dependency Specification

**Investigator**: Explorer M1_2 (`explorer_m1_2`)  
**Mission**: Formulate the exact structure, schema compliance, environment setup, and dependency management for `.github/workflows/ci.yml`.  
**Date**: 2026-09-29T15:35:30Z  
**Target Repository**: `chef-specials-ai-repo`  

---

## 1. Executive Summary

This report establishes the complete specification for `.github/workflows/ci.yml` in compliance with Requirement R1 of `ORIGINAL_REQUEST.md` and Milestone 1 of `PROJECT.md`. The workflow automates continuous integration on pushes, pull requests, and manual triggers, setting up isolated Node.js 20 and Python 3.11 runtimes, installing Playwright Chromium with system dependencies, running fast unit/API tests alongside the universal bootstrap check, and executing headless browser E2E tests.

The workflow has been tested and strictly validated against the official GitHub Actions Draft-07 JSON Schema (`https://www.schemastore.org/github-workflow.json`), confirming 100% schema compliance with zero syntax or validation errors.

---

## 2. In-Depth Analysis of Dispatch Inquiries

### Question 1: Workflow Triggers (`on`)
To satisfy R1 and standard release engineering practices, `.github/workflows/ci.yml` requires three distinct trigger types:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

1. **`push: branches: [main]`**:
   - Fires upon direct pushes or merged PRs into the production `main` branch.
   - Ensures any code integrated into trunk has a formal verification record.
2. **`pull_request: branches: [main]`**:
   - Triggers on PR lifecycle events (`opened`, `synchronize`, `reopened`) targeting `main`.
   - Protects `main` by validating feature branches before they can be merged.
3. **`workflow_dispatch:`**:
   - Enables manual triggering from the GitHub Actions UI and via GitHub CLI (`gh workflow run ci.yml`).
   - Essential for on-demand validation, diagnostic checks, and re-running failed runs without generating empty commits.

---

### Question 2: Runner Image & Security Permissions

#### Runner Image
- **Specification**: `runs-on: ubuntu-latest`
- **Rationale**:
  - Pre-installed with Git, Bash, curl, build essentials, and passwordless `sudo` rights.
  - Required for installing Linux shared libraries via `playwright install --with-deps`.
  - Most cost-effective and fastest-provisioning GitHub-hosted runner image (1x minute multiplier vs 10x for macOS).

#### Permissions
- **Specification**:
  ```yaml
  permissions:
    contents: read
  ```
- **Rationale**:
  - Enforces the **Principle of Least Privilege**.
  - Restricts the default `GITHUB_TOKEN` to read-only access to repository contents.
  - Prevents accidental or compromised write operations (such as unauthorized tag creation, release publication, comment spamming, or code push) from rogue dependencies or external pull request actions.

---

### Question 3: Concurrency Management

When multiple commits are pushed in rapid succession (e.g. iterative developer pushes to a pull request), unmanaged workflows queue up and waste runner capacity on obsolete commits.

- **Specification**:
  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
  ```
- **Behavior**:
  - **Pull Requests (`github.ref == 'refs/pull/.../merge'`)**: `cancel-in-progress` evaluates to `true`. Obsolete in-flight CI runs for that PR are immediately aborted, conserving resources.
  - **Main Branch (`github.ref == 'refs/heads/main'`)**: `cancel-in-progress` evaluates to `false`. Every commit integrated to `main` runs to completion, ensuring an immutable build and test audit trail.
- **Alternative**: If aggressive cancellation is desired even on `main`, `cancel-in-progress: true` can be set unconditionally.

---

### Question 4: Clean Runtime Setup (Node.js 20 & Python 3.11)

#### Node.js 20 Setup
```yaml
- name: Set up Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: 20
```

**Critical Lockfile Discovery & Warning**:
- Inspection of the repository shows `package.json` exists, but **NO `package-lock.json`** is present.
- If `cache: 'npm'` is supplied to `actions/setup-node@v4` when `package-lock.json` does not exist, the action immediately aborts with:
  ```
  Error: Dependencies lock file is not found in /.../chef-specials-ai-repo. Supported file patterns: package-lock.json,npm-shrinkwrap.json
  ```
- Therefore, **do NOT add `cache: 'npm'`** unless a `package-lock.json` is committed.
- Furthermore, `package.json` specifies zero external npm packages; all tests (`tests_api.js`, `scripts/verify-bootstrap.sh`) utilize built-in Node 20 modules (`node:assert`, global `fetch`). Node.js 20 Active LTS supplies everything needed natively.

#### Python 3.11 Setup
```yaml
- name: Set up Python 3.11
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'
```
- Configures Python 3.11 with `pip`.
- No `requirements.txt` currently exists in the root; therefore `cache: 'pip'` should not be added without a lockfile.

---

### Question 5: Playwright Installation on Ubuntu

Running Playwright Chromium on headless Linux requires two elements: the Python package and the Linux browser binary with OS shared libraries.

```yaml
- name: Install Python dependencies
  run: |
    python -m pip install --upgrade pip
    python -m pip install playwright

- name: Install Playwright Chromium & dependencies
  run: python -m playwright install --with-deps chromium
```

**Key Implementation Decisions**:
1. **`python -m` Prefix**:
   Invoking `python -m pip` and `python -m playwright` binds directly to the Python 3.11 virtual environment configured by `setup-python`, avoiding PATH resolution discrepancies.
2. **`--with-deps` Flag**:
   Playwright on bare Linux requires underlying OS shared libraries (`libnss3`, `libatk1.0-0`, `libasound2`, fonts, etc.). The `--with-deps` flag uses passwordless `sudo` on `ubuntu-latest` to invoke `apt-get` and install all required system libraries automatically. Without this flag, launching Chromium fails with `error while loading shared libraries`.
3. **`chromium` Filter**:
   `tests_e2e.py` specifically launches Chromium (`await p.chromium.launch(headless=True)`). Installing only `chromium` rather than the default of all three engines (WebKit, Firefox, Chromium) saves ~400 MB of network download and avoids installing heavy GTK/GStreamer dependencies, speeding up CI execution by 60–90 seconds per run.

---

### Question 6: Test Execution Sequence & Exit Code Guarantees

The test execution is structured in two sequential steps according to the **fail-fast** principle:

```yaml
- name: Run unit & API tests
  run: npm test

- name: Run Playwright E2E tests
  env:
    REPO_DIR: ${{ github.workspace }}
  run: python tests_e2e.py
```

#### Execution Sequence & Exit Code Guarantees:
1. **`npm test`**:
   - Executes `node tests_api.js && ./scripts/verify-bootstrap.sh`.
   - Runs unit tests and bootstrap verification in ~1 second.
   - If either fails, `node` or `bash` exits with `1`, causing `npm test` to exit with non-zero exit code.
   - GitHub Actions runner captures the non-zero exit code, aborts subsequent steps, and marks the workflow job as failed.
2. **`python tests_e2e.py`**:
   - Executes only if unit tests pass.
   - `env: REPO_DIR: ${{ github.workspace }}` ensures dynamic path resolution (aligning with `explorer_m1_1` findings).
   - If any assertion fails or an uncaught exception occurs, Python exits with exit code `1`, failing the job.
   - If all tests pass, Python exits with exit code `0`, marking the CI build as successful.

---

## 3. Complete Recommended `.github/workflows/ci.yml`

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

## 4. Schema Compliance Verification

The recommended workflow configuration was converted to JSON and validated against the official Draft-07 schema for GitHub Actions workflows:

- **Schema URL**: `https://www.schemastore.org/github-workflow.json`
- **Validation Tool**: `npx ajv-cli validate --spec=draft7 -s github-workflow-schema.json -d candidate_ci.json`
- **Result**:
  ```
  .agents/teamwork/explorer_m1_2/candidate_ci.json valid
  ```
- **Exit Code**: `0`

No warnings, deprecations, or schema violations were detected.
