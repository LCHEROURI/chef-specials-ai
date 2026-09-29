# Handoff Report: CI Step Sequencing, Failure Propagation & Schema Validation

**From**: Explorer M1_3 (`explorer_m1_3`)  
**To**: Orchestrator (`parent`) & Worker M1  
**Milestone**: M1 (Test Portability & CI Pipeline)  
**Date**: 2026-09-29T15:36:30Z  
**Target File**: `.github/workflows/ci.yml`  

---

## 1. Observation

1. **`package.json` (`package.json:6-8`)**:
   Line 7 defines the test command:
   ```json
   "scripts": {
     "test": "node tests_api.js && ./scripts/verify-bootstrap.sh"
   }
   ```
   Executing `npm test` runs `node tests_api.js` first, followed conditionally by `./scripts/verify-bootstrap.sh` via the shell `&&` operator.

2. **`tests_api.js` (`tests_api.js:154-157`)**:
   Unit tests explicitly catch failures and call `process.exit(1)`:
   ```javascript
   runApiTests().catch((err) => {
     console.error("Test failed:", err);
     process.exit(1);
   });
   ```
   Local execution of `node tests_api.js` passed all 5 test suites (OPTIONS preflight, 405 rejection, 400 validation, stringified JSON parsing, DALL-E-3/GPT-Image parameter sanitization) with exit code 0.

3. **`scripts/verify-bootstrap.sh` (`scripts/verify-bootstrap.sh:1-54`)**:
   Line 2 enforces `set -euo pipefail`. The script validates git discovery, required files (`AGENTS.md`, `WORKFLOW.md`, `skills/progressive-distillation/SKILL.md`), and safety markers. All error paths explicitly terminate with `echo "FAIL: ..." >&2` and `exit 1`. Passing execution emits `PASS: universal bootstrap verified at <ROOT>` with exit code 0.

4. **YAML 1.1 `on:` Boolean Coercion**:
   When parsing candidate workflow YAML with PyYAML (`yaml.safe_load`), unquoted `on:` is parsed as boolean key `True: ...`. Validating against the official SchemaStore Draft-07 schema (`https://json.schemastore.org/github-workflow.json`) fails with verbatim error:
   ```
   Additional properties are not allowed (True was unexpected)
   ```
   Quoting `'on':` in the YAML file forces parser interpretation as string `"on"`, passing validation with exit code 0.

5. **`ajv-cli` SchemaStore Validation Execution**:
   Running `npx -y js-yaml candidate.yml > /tmp/ci.json && npx -y ajv-cli validate -s schema.json -d /tmp/ci.json --spec=draft7` returned:
   ```
   /tmp/ci.json valid
   ```
   When tested against a malformed workflow with an invalid job key, `ajv-cli` returned exit code 1 with exact pinpointed schema errors (`must have required property 'runs-on'`).

6. **Execution Timing Hierarchy**:
   - `scripts/verify-bootstrap.sh`: ~15 ms
   - `tests_api.js`: ~180 ms
   - `actions/setup-node@v4`: ~1.5 s
   - `actions/setup-python@v5`: ~1.5 s
   - `playwright install --with-deps chromium`: ~45–60 s (downloads ~150 MB and installs system apt packages)
   - `tests_e2e.py`: ~4.2 s

---

## 2. Logic Chain

1. **Premise**: In GitHub Actions CI runners, workflow execution cost and duration are directly determined by step ordering. Unit tests execute in under 200 ms, whereas Playwright Chromium and OS library installation takes 45 to 60 seconds (Observation 6).
2. **Inference 1**: Sequencing `Set up Python 3.11` and `playwright install --with-deps chromium` before `npm test` (as done in `explorer_m1_2`'s initial candidate) wastes 1 minute of runner compute and network traffic whenever unit tests or bootstrap checks fail.
3. **Inference 2**: Placing `bash scripts/verify-bootstrap.sh` and `npm test` immediately after `setup-node` guarantees that any failure in repository invariants or API logic halts the workflow within 2 seconds, achieving true fail-fast behavior.
4. **Inference 3**: In `package.json`, `npm test` invokes `node tests_api.js && ./scripts/verify-bootstrap.sh`. If `tests_api.js` fails, `&&` short-circuits and skips `verify-bootstrap.sh`, exiting with 1 (Observation 1, 2, 3). Running an explicit `bash scripts/verify-bootstrap.sh` step first provides independent UI reporting for bootstrap verification before `npm test` runs.
5. **Inference 4**: To guarantee cross-tool validation compatibility across both YAML 1.1 (Python/PyYAML/pre-commit) and YAML 1.2 / GitHub Actions engines, the workflow trigger key must be quoted as `'on':` (Observation 4).
6. **Inference 5**: The workflow must pass `REPO_DIR: ${{ github.workspace }}` to `python tests_e2e.py` to ensure seamless dynamic path resolution once Explorer M1_1's patch is applied.

---

## 3. Caveats

1. **No `package-lock.json` in Repository**: As noted during inspection, `package.json` has no lockfile. Adding `cache: 'npm'` to `actions/setup-node@v4` will crash the workflow. It must remain omitted until a lockfile is introduced.
2. **Root Privileges for Playwright on Ubuntu**: `playwright install --with-deps chromium` requires `sudo` privileges to install apt packages. On GitHub-hosted `ubuntu-latest`, passwordless sudo is enabled by default. On self-hosted runners without sudo, containerized runners or pre-built Playwright Docker images would be required.
3. **Local E2E Execution**: Running `tests_e2e.py` locally on macOS requires `playwright` installed in the active Python environment (`pip install playwright && playwright install chromium`).

---

## 4. Conclusion

1. **Optimal Step Sequence**:
   - `Check out repository` (`actions/checkout@v4`)
   - `Set up Node.js 20` (`actions/setup-node@v4` with `node-version: 20`)
   - `Verify bootstrap safety markers` (`run: bash scripts/verify-bootstrap.sh`)
   - `Run unit & API tests` (`run: npm test`)
   - `Set up Python 3.11` (`actions/setup-python@v5` with `python-version: '3.11'`)
   - `Install Playwright & Chromium dependencies` (`run: python -m pip install --upgrade pip playwright && python -m playwright install --with-deps chromium`)
   - `Run Playwright E2E tests` (`run: python tests_e2e.py` with `env: REPO_DIR: ${{ github.workspace }}`)
2. **Schema & Syntax Recommendation**:
   - Quote `'on':` to avoid YAML 1.1 boolean conversion bugs.
   - Include concurrency cancellation for pull requests: `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`.
   - Enforce read-only permissions: `permissions: contents: read`.
3. **Recommended Workflow Code**: Refer to Section 3 of `report.md`.

---

## 5. Verification Method

Worker M1 and Sentinel/Reviewer can independently verify this handoff using these concrete commands:

1. **Validate Workflow Schema Locally**:
   ```bash
   npx -y yaml-lint .github/workflows/ci.yml
   npx -y js-yaml .github/workflows/ci.yml > /tmp/ci.json
   npx -y ajv-cli validate \
     -s https://json.schemastore.org/github-workflow.json \
     -d /tmp/ci.json \
     --spec=draft7
   ```
   *Expected Result*: `/tmp/ci.json valid` with exit code 0.

2. **Verify Local Test Execution**:
   ```bash
   # Bootstrap check
   bash scripts/verify-bootstrap.sh
   # API unit tests
   npm test
   ```
   *Expected Result*: Exit code 0 for both commands.

3. **Verify Failure Propagation**:
   ```bash
   # Test short-circuit and non-zero exit propagation
   sh -c 'node -e "process.exit(1)" && ./scripts/verify-bootstrap.sh' || [ $? -eq 1 ]
   ```
   *Expected Result*: Exits 1, bootstrap script is not run.
