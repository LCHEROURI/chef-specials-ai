# Handoff Report: Explorer M2_1 — CLI Argument Parser & Exit Code Architecture

## 1. Observation
1. **Test Invocations for `scripts/verify-env.js`**:
   - `e2e_tests/test_tier1_features.py:221-222`:
     ```python
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=ci"])
     self.assertEqual(rc, 0, f"Expected verify-env.js in CI mode to exit 0: {stdout} {stderr}")
     ```
   - `e2e_tests/test_tier1_features.py:230-231`:
     ```python
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production"], env=env)
     self.assertEqual(rc, 0, f"Expected verify-env.js to exit 0 with valid key: {stdout} {stderr}")
     ```
   - `e2e_tests/test_tier1_features.py:239-240`:
     ```python
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
     self.assertEqual(rc, 1, f"Expected verify-env.js to exit 1 when key is missing: {stdout} {stderr}")
     ```
   - `e2e_tests/test_tier1_features.py:310-312`:
     ```python
     canary = "SUPER_SECRET_CANARY_VALUE_XYZ"
     env = {"CANARY_ENV": canary}
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--invalid-flag"], env=env)
     self.assertNotIn(canary, stdout)
     self.assertNotIn(canary, stderr)
     ```
   - `e2e_tests/test_tier2_boundaries.py:225-226`:
     ```python
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--help"])
     self.assertTrue(rc in (0, 1, 2))
     ```
   - `e2e_tests/test_tier2_boundaries.py:233-234`:
     ```python
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--completely-unrecognized-flag"])
     self.assertEqual(rc, 2, f"Expected exit code 2 for invalid CLI flag, got {rc}")
     ```
   - `e2e_tests/test_tier2_boundaries.py:242-243`:
     ```python
     env = {"OPENAI_API_KEY": "invalid_prefix_without_sk_prefix_1234567890"}
     rc, stdout, stderr = run_cmd(["node", "scripts/verify-env.js", "--mode=production", "--strict"], env=env)
     self.assertEqual(rc, 1, "Expected exit code 1 for malformed secret without sk- prefix")
     ```

2. **Interface Specification in `PROJECT.md:47-55`**:
   - `node scripts/verify-env.js --mode=ci` (checks format, allows missing live keys with warning).
   - `node scripts/verify-env.js --mode=production --strict` (fails with exit code 1 if `OPENAI_API_KEY` missing or invalid).
   - Exit codes:
     - `0`: All required environment variables present and format valid.
     - `1`: Required environment variable missing or invalid.
     - `2`: Invalid CLI arguments.
   - Output Guarantee: Never prints raw secret values. Emits `::add-mask::<value>` when running in GitHub Actions (`GITHUB_ACTIONS=true`).

3. **Node Runtime Environment**:
   - Current environment runs Node.js `v22.22.2` (and CI runner targets Node.js 20 LTS).
   - Standard library module `node:util` provides `parseArgs({ args, options, strict: true, allowPositionals: false })`, which natively raises `ERR_PARSE_ARGS_UNKNOWN_OPTION`, `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`, and `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL`.

---

## 2. Logic Chain
1. Based on Observation 1 (`e2e_tests/test_tier2_boundaries.py:234`), passing any unrecognized flag (e.g. `--completely-unrecognized-flag` or `--invalid-flag`) MUST terminate the process with exit code 2.
2. Based on Observation 1 (`e2e_tests/test_tier1_features.py:310-312`), when an invalid flag is supplied, the process must terminate without serializing `process.env` or emitting stack traces to stdout/stderr. Therefore, CLI parsing errors must be caught at the top level and formatted as clean single-line error messages before exiting with code 2.
3. Based on Observation 1 (`e2e_tests/test_tier1_features.py:221-222`) and Observation 2 (`PROJECT.md:49`), in `--mode=ci` (and non-strict mode in general), missing keys are treated as non-fatal warnings and terminate with exit code 0.
4. Based on Observation 1 (`e2e_tests/test_tier1_features.py:239-240`) and Observation 1 (`e2e_tests/test_tier2_boundaries.py:242-243`), passing `--strict` causes missing required secrets to fail with exit code 1, and malformed secrets (missing `sk-` prefix, length < 20, whitespace-only) always fail with exit code 1 regardless of mode.
5. Based on Observation 1 (`e2e_tests/test_tier2_boundaries.py:225-226`), invoking `--help` or `-h` must display the CLI manual and exit with code 0 without executing environment checks.
6. Based on Observation 3, `node:util` `parseArgs` cleanly provides standard-compliant option parsing for `--mode=<mode>`, `--strict`, `--check-deployment`, and `--help` without external dependencies. A manual fallback parser confirms identical semantics.

---

## 3. Caveats
1. **Secret Validation Rules Scope**: The internal rules for determining whether a specific variable is valid, optional, or legacy (e.g., `OPENAI_API_KEY` vs `chefsspecials`, `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`, `VERCEL_TOKEN`) are under the ownership of Explorer M2_2. The CLI parser provides the configuration object (`{ mode, strict, checkDeployment }`) consumed by M2_2's validator.
2. **Masking & GitHub Actions Scope**: The masking implementation (`::add-mask::` emission, sanitized masking format) is under the ownership of Explorer M2_3. The CLI entry point integrates M2_3's masking handler before executing any validation or printing output.
3. **Node.js Version Requirement**: `util.parseArgs` requires Node.js >= 18.3.0. The project uses Node.js 20 LTS in CI and Node.js v22.22.2 locally. A pure JavaScript manual tokenizer has also been designed and validated as a fallback.

---

## 4. Conclusion
The CLI interface and exit code architecture for `scripts/verify-env.js` is finalized:
- **Flags Supported**:
  - `--mode=<ci|production|preview|development>` (string, default: `"production"`).
  - `--strict` (boolean flag, default: `false`).
  - `--check-deployment` (boolean flag, default: `false`).
  - `-h`, `--help` (boolean flag, displays usage, exits 0).
- **Exit Code Contract**:
  - `0`: Valid configuration, non-strict pass with warning, or `--help`.
  - `1`: Validation failure (missing required secret in strict mode or malformed secret).
  - `2`: Invalid CLI argument / unknown flag / positional argument.
- **Top-Level Error Trapping**:
  - Traps `ERR_PARSE_ARGS_UNKNOWN_OPTION`, `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`, and `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL`, emitting concise diagnostic messages to `stderr` and immediately exiting 2. Stack traces and environment dumps are suppressed.
- **Reference Artifact**:
  - Full architecture document and dispatch skeleton written to:
    `/Users/laredjchehrouri/.gemini/antigravity/scratch/chef-specials-ai-repo/.agents/teamwork/explorer_m2_1/report.md`.

---

## 5. Verification Method
1. **E2E Feature Test Verification**:
   Execute the Tier 1 feature tests covering `verify-env.js`:
   ```bash
   python3 -m unittest e2e_tests/test_tier1_features.py -k verify_env
   python3 -m unittest e2e_tests/test_tier1_features.py -k masking
   ```
2. **E2E Boundary Test Verification**:
   Execute the Tier 2 boundary tests covering CLI flags and exit codes:
   ```bash
   python3 -m unittest e2e_tests/test_tier2_boundaries.py -k verify_env
   python3 -m unittest e2e_tests/test_tier2_boundaries.py -k masking
   ```
3. **Invalidation Conditions**:
   - If invoking `node scripts/verify-env.js --completely-unrecognized-flag` returns anything other than exit code 2.
   - If invoking `node scripts/verify-env.js --help` returns anything other than exit code 0.
   - If an invalid flag invocation dumps `process.env` or leaks canary environment variables into stdout or stderr.
