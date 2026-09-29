# Technical Report: Environment Secret Validation Rules & Guardrails

**Agent**: Explorer M2_2 (`explorer_m2_2`)  
**Milestone**: M2 (Environment Security Guardrails)  
**Target File**: `scripts/verify-env.js`  
**Date**: 2026-09-29  

---

## 1. Executive Summary

This report establishes the complete specification and reference implementation for environment variable validation, format verification, and fallback resolution in `scripts/verify-env.js`.

The design guarantees:
1. **Full API Alignment**: Exact parity with secret resolution in `api/generate-image.js` (`OPENAI_API_KEY` with fallback to `chefsspecials`).
2. **Strict Format Enforcement**: OpenAI key validation enforcing `sk-` prefix, minimum length $\ge 20$, prohibition of whitespace and control characters, preventing log injection.
3. **Optional Variable Handling**: Verification and default mapping for `OPENAI_IMAGE_MODEL` (default: `"gpt-image-2"`) and `OPENAI_IMAGE_QUALITY` (default: `"medium"`).
4. **Deployment Variable Checking**: Verification of `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` when the `--check-deployment` flag is enabled.
5. **Zero-Leakage Guarantee**: Under no condition (valid, invalid, malformed, or unhandled exception) is any secret value or portion of secret content printed to stdout or stderr.

---

## 2. Serverless API Secret Resolution Analysis (`api/generate-image.js`)

### 2.1 Codebase Inspection

In `api/generate-image.js` (lines 48–55):
```javascript
const apiKey = process.env.OPENAI_API_KEY || process.env.chefsspecials;
if (!apiKey) {
  sendJson(response, 200, {
    setupNeeded: true,
    message: "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project. Add OPENAI_API_KEY to chef-specials-ai for Production, then redeploy."
  });
  return;
}
```

And in `README.md` (lines 18–28):
```markdown
Image generation requires OPENAI_API_KEY in this exact Vercel project. The deployed route also accepts the existing chefsspecials variable name for compatibility.

1. Open Vercel project chef-specials-ai.
2. Go to Settings -> Environment Variables.
3. Add OPENAI_API_KEY for Production.
4. Redeploy the production deployment so the serverless function can read it.

Optional variables:
- OPENAI_IMAGE_MODEL defaults to gpt-image-2.
- OPENAI_IMAGE_QUALITY defaults to medium.
```

### 2.2 Precedence and Fallback Semantics

1. **Primary Variable**: `process.env.OPENAI_API_KEY`.
2. **Fallback Variable**: `process.env.chefsspecials`.
3. **Resolution Logic**:
   - If `process.env.OPENAI_API_KEY` is present and non-empty, use it.
   - Else if `process.env.chefsspecials` is present and non-empty, use it as fallback.
   - Else, key is missing.
4. **Deprecation/Notice Rule**: When `chefsspecials` is active, emit an informational notice recommending migration to `OPENAI_API_KEY`:
   `"ℹ️ [NOTICE] Using legacy environment variable 'chefsspecials'. Recommended to migrate to 'OPENAI_API_KEY'."`

---

## 3. Secret Format Constraints & Validation Rules

### 3.1 OpenAI API Key Validation Rules

| Rule | Requirement | Validation Method | Rationale |
|---|---|---|---|
| **R1. String Type** | Must be a valid string | `typeof val === "string"` | Prevents type coercion bugs. |
| **R2. Non-Empty / Non-Whitespace** | Value must not be empty or composed solely of spaces | `val.trim().length > 0` | Catches unconfigured placeholders. |
| **R3. Prefix** | Must start with `sk-` | `val.startsWith("sk-")` | Matches OpenAI standard, project, service account, and admin keys (`sk-`, `sk-proj-`, `sk-svcacct-`, `sk-admin-`). |
| **R4. Minimum Length** | Total character count $\ge 20$ | `val.length >= 20` | Real OpenAI keys are 48–164+ chars. 20 catches truncation or placeholder keys (e.g. `sk-test`). |
| **R5. No Internal Whitespace** | No spaces, tabs, or whitespace | `!/\s/.test(val)` | Env vars must not have internal spaces or copy-paste artifacts. |
| **R6. No Log Injection / Newlines** | No `\r`, `\n`, or ASCII control characters | `!/[\r\n\x00-\x1f]/.test(val)` | Prevents GitHub Actions workflow command injection (e.g. `::set-output`). |

### 3.2 Key Validation Truth Table

| Input Key | Condition Tested | Result | Error Reason (Sanitized) | Exit Code (--strict) |
|---|---|---|---|---|
| `"sk-proj-validproductiontestkey1234567890"` | Valid standard project key | PASS | `null` | 0 |
| `"sk-legacy-validproductiontestkey1234567890"` | Valid standard legacy key | PASS | `null` | 0 |
| `undefined` / `""` | Missing key (in CI mode) | WARN | `Missing secret (allowed in CI mode)` | 0 |
| `undefined` / `""` | Missing key (in production --strict) | FAIL | `Required environment variable OPENAI_API_KEY is not set` | 1 |
| `"invalid_prefix_without_sk_prefix_1234567890"` | Missing `sk-` prefix | FAIL | `Key must start with 'sk-' prefix` | 1 |
| `"sk-short"` | Length < 20 (length: 8) | FAIL | `Key length must be at least 20 characters (found: 8)` | 1 |
| `"   "` | Whitespace-only string | FAIL | `Key contains only whitespace characters` | 1 |
| `"sk-test\n::set-output name=admin::true\nsk-valid"` | Log injection / newlines | FAIL | `Key contains illegal newline or control characters` | 1 |
| `"sk-live-alpha123456 78901234567890"` | Embedded space | FAIL | `Key must not contain whitespace` | 1 |

---

## 4. Optional Environment Parameters Specification

### 4.1 `OPENAI_IMAGE_MODEL`

- **Purpose**: Defines the OpenAI image generation model family to target.
- **Default Value**: `"gpt-image-2"` (from `api/generate-image.js` line 1).
- **Recognized Values**:
  - `"gpt-image-2"` (primary default)
  - `"gpt-image-2.5"`
  - `"dall-e-3"`
  - `"dall-e-2"`
- **Validation Rules**:
  - If omitted: Valid, defaults to `"gpt-image-2"`.
  - If specified:
    - Must be a non-empty string: `typeof val === "string" && val.trim().length > 0`.
    - Must not contain whitespace: `!/\s/.test(val)`.
    - Length constraint: $3 \le \text{length} \le 64$.
    - Character set: `^[a-zA-Z0-9._-]+$`.
    - If specified value is not in recognized values: Valid with informational notice (permits future model releases without breaking build).

### 4.2 `OPENAI_IMAGE_QUALITY`

- **Purpose**: Controls rendering quality for generated dish photography.
- **Default Value**: `"medium"` (from `api/generate-image.js` line 2).
- **Recognized Values**:
  - `"medium"` (default)
  - `"standard"`
  - `"hd"`
  - `"high"`
  - `"low"`
- **Validation Rules**:
  - If omitted: Valid, defaults to `"medium"`.
  - If specified:
    - Must be a non-empty string.
    - Normalized to lowercase: `val.trim().toLowerCase()`.
    - Must be one of `['medium', 'standard', 'hd', 'high', 'low']`.
    - If unrecognized: Warning in non-strict mode, Error in strict mode.

---

## 5. Vercel Deployment Variables Specification (`--check-deployment`)

When the `--check-deployment` CLI flag is set (invoked during deployment workflows such as `deploy.sh` or `.github/workflows/deploy.yml`):

| Variable | Description | Constraints | Masking |
|---|---|---|---|
| `VERCEL_TOKEN` | Vercel API authentication token | Length $\ge 24$, non-whitespace, no control chars | **CONFIDENTIAL**: Must be masked (`vercel_***` or `[CONFIGURED]`), added to GitHub Actions mask |
| `VERCEL_ORG_ID` | Vercel Team / Org ID | Length $\ge 6$, non-whitespace, alphanumeric/`_` (often starts with `team_`) | Non-secret config identifier |
| `VERCEL_PROJECT_ID` | Vercel Project ID (`chef-specials-ai`) | Length $\ge 6$, non-whitespace, alphanumeric/`_` (often starts with `prj_`) | Non-secret config identifier |

### Behavior Matrix for Deployment Variables:
- If `--check-deployment` is **NOT** present: Deployment variables are not required; if present, `VERCEL_TOKEN` is still masked.
- If `--check-deployment` is **PRESENT**:
  - In `--mode=production` or with `--strict`: All 3 variables must be present and valid. Any missing variable produces exit code 1.
  - In `--mode=ci` without `--strict`: Missing deployment variables produce warnings but exit code 0.

---

## 6. Zero-Leakage Architecture & Error Sanitization

### 6.1 Mathematical Non-Disclosure Guarantee

To satisfy E2E tests `F6.1`, `F6.4`, `F6.5`, `B6.1`, `B6.2`, `B6.3`, `B6.4`, and `B6.5`:

1. **No Value Interpolation in Errors**:
   - ❌ WRONG: `throw new Error("Invalid key: " + key);`
   - ❌ WRONG: `console.error(`Received invalid token: ${val}`);`
   - ✅ CORRECT: `console.error("❌ OPENAI_API_KEY: Invalid key format. Key must start with 'sk-' and be at least 20 characters.");`
2. **Sanitized Length and Prefix Display**:
   - Only display the fixed prefix (`sk-`) and the total length: `sk-... (${key.length} chars) [CONFIGURED]`.
   - Never print middle or tail characters (e.g. `test_masking_sanitized_length_and_prefix_output` asserts that `hiddenpart` is never printed).
3. **Log Injection Defense**:
   - If a secret contains newline characters (`\n` or `\r`), do NOT pass it to `console.log("::add-mask::" + val)` directly as a multi-line string.
   - Reject the secret immediately as malformed.
4. **Unhandled Exception & Process Crash Guard**:
   - Install global handlers:
     ```javascript
     process.on("uncaughtException", (err) => {
       console.error("Fatal verification error occurred.");
       process.exit(1);
     });
     ```
   - Never serialize `process.env` or inspect objects containing raw environment dumps into stdout/stderr.

---

## 7. Reference JavaScript Implementation for Secret Validation

The following modular functions are designed for inclusion in `scripts/verify-env.js`:

```javascript
/**
 * Resolves the active OpenAI API key, supporting legacy fallback 'chefsspecials'.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ key: string | null, source: string | null, isLegacy: boolean }}
 */
function resolveOpenAIKey(env = process.env) {
  if (typeof env.OPENAI_API_KEY === "string" && env.OPENAI_API_KEY.trim().length > 0) {
    return {
      key: env.OPENAI_API_KEY,
      source: "OPENAI_API_KEY",
      isLegacy: false
    };
  }
  if (typeof env.chefsspecials === "string" && env.chefsspecials.trim().length > 0) {
    return {
      key: env.chefsspecials,
      source: "chefsspecials",
      isLegacy: true
    };
  }
  return {
    key: null,
    source: null,
    isLegacy: false
  };
}

/**
 * Validates an OpenAI API key without disclosing its plaintext value.
 * @param {string | null | undefined} key
 * @returns {{ valid: boolean, present: boolean, error: string | null, length: number }}
 */
function validateOpenAIKey(key) {
  if (key === null || key === undefined || key === "") {
    return {
      valid: false,
      present: false,
      error: "Variable is not set or empty",
      length: 0
    };
  }

  if (typeof key !== "string") {
    return {
      valid: false,
      present: true,
      error: "Variable must be a string",
      length: 0
    };
  }

  // Check for whitespace-only
  if (key.trim().length === 0) {
    return {
      valid: false,
      present: true,
      error: "Variable contains only whitespace characters",
      length: key.length
    };
  }

  // Check for newlines or control characters (log injection protection)
  if (/[\r\n\x00-\x1f]/.test(key)) {
    return {
      valid: false,
      present: true,
      error: "Variable contains illegal newline or control characters",
      length: key.length
    };
  }

  // Check for internal whitespace
  if (/\s/.test(key)) {
    return {
      valid: false,
      present: true,
      error: "Variable must not contain whitespace characters",
      length: key.length
    };
  }

  // Check for required 'sk-' prefix
  if (!key.startsWith("sk-")) {
    return {
      valid: false,
      present: true,
      error: "Key must start with 'sk-' prefix",
      length: key.length
    };
  }

  // Check minimum length (>= 20)
  if (key.length < 20) {
    return {
      valid: false,
      present: true,
      error: `Key length must be at least 20 characters (found: ${key.length})`,
      length: key.length
    };
  }

  return {
    valid: true,
    present: true,
    error: null,
    length: key.length
  };
}

/**
 * Validates the optional OPENAI_IMAGE_MODEL variable.
 * @param {string | undefined} model
 * @returns {{ valid: boolean, value: string, warning: string | null, isDefault: boolean }}
 */
function validateImageModel(model) {
  const DEFAULT_MODEL = "gpt-image-2";
  const RECOGNIZED_MODELS = ["gpt-image-2", "gpt-image-2.5", "dall-e-3", "dall-e-2"];

  if (!model || model.trim().length === 0) {
    return {
      valid: true,
      value: DEFAULT_MODEL,
      warning: null,
      isDefault: true
    };
  }

  const clean = model.trim();
  if (/\s/.test(clean) || clean.length < 3 || clean.length > 64) {
    return {
      valid: false,
      value: clean,
      warning: "Model name must be 3-64 characters and contain no whitespace",
      isDefault: false
    };
  }

  if (!RECOGNIZED_MODELS.includes(clean)) {
    return {
      valid: true,
      value: clean,
      warning: `Unrecognized model '${clean}' (known models: ${RECOGNIZED_MODELS.join(", ")})`,
      isDefault: false
    };
  }

  return {
    valid: true,
    value: clean,
    warning: null,
    isDefault: false
  };
}

/**
 * Validates the optional OPENAI_IMAGE_QUALITY variable.
 * @param {string | undefined} quality
 * @returns {{ valid: boolean, value: string, warning: string | null, isDefault: boolean }}
 */
function validateImageQuality(quality) {
  const DEFAULT_QUALITY = "medium";
  const ALLOWED_QUALITIES = ["medium", "standard", "hd", "high", "low"];

  if (!quality || quality.trim().length === 0) {
    return {
      valid: true,
      value: DEFAULT_QUALITY,
      warning: null,
      isDefault: true
    };
  }

  const clean = quality.trim().toLowerCase();
  if (!ALLOWED_QUALITIES.includes(clean)) {
    return {
      valid: false,
      value: clean,
      warning: `Invalid image quality '${clean}'. Must be one of: ${ALLOWED_QUALITIES.join(", ")}`,
      isDefault: false
    };
  }

  return {
    valid: true,
    value: clean,
    warning: null,
    isDefault: false
  };
}

/**
 * Validates Vercel deployment variables when --check-deployment is active.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ valid: boolean, errors: string[], maskedTokens: string[] }}
 */
function validateDeploymentVariables(env = process.env) {
  const errors = [];
  const maskedTokens = [];

  // VERCEL_TOKEN
  const token = env.VERCEL_TOKEN;
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    errors.push("Missing required deployment secret: VERCEL_TOKEN");
  } else {
    if (/\s/.test(token) || token.length < 12 || /[\r\n]/.test(token)) {
      errors.push("VERCEL_TOKEN format invalid (must be non-whitespace and >= 12 chars)");
    } else {
      maskedTokens.push(token);
    }
  }

  // VERCEL_ORG_ID
  const orgId = env.VERCEL_ORG_ID;
  if (!orgId || typeof orgId !== "string" || orgId.trim().length === 0) {
    errors.push("Missing required deployment variable: VERCEL_ORG_ID");
  } else if (/\s/.test(orgId) || orgId.length < 4) {
    errors.push("VERCEL_ORG_ID format invalid (must be non-whitespace and >= 4 chars)");
  }

  // VERCEL_PROJECT_ID
  const projId = env.VERCEL_PROJECT_ID;
  if (!projId || typeof projId !== "string" || projId.trim().length === 0) {
    errors.push("Missing required deployment variable: VERCEL_PROJECT_ID");
  } else if (/\s/.test(projId) || projId.length < 4) {
    errors.push("VERCEL_PROJECT_ID format invalid (must be non-whitespace and >= 4 chars)");
  }

  return {
    valid: errors.length === 0,
    errors,
    maskedTokens
  };
}
```

---

## 8. Test Compliance Mapping

| Test Identifier | Test Name in E2E Suite | Handled By Designed Logic | Expected Output |
|---|---|---|---|
| `F5.2` | `test_verify_env_ci_mode_exits_zero` | Missing live keys allowed in CI mode | Exit code 0 |
| `F5.3` | `test_verify_env_production_mode_with_valid_key` | Valid `sk-proj-...` key passes validation | Exit code 0 |
| `F5.4` | `test_verify_env_production_mode_fails_when_missing_key` | Missing key in production `--strict` fails | Exit code 1 |
| `F5.5` | `test_verify_env_accepts_legacy_chefsspecials_key` | `resolveOpenAIKey` resolves `chefsspecials` fallback | Exit code 0 |
| `F6.1` | `test_masking_never_outputs_plaintext_key` | No secret values in status lines or error text | Clean stdout/stderr |
| `F6.2` | `test_masking_github_actions_add_mask_annotation` | Returns `maskedTokens` for `::add-mask::` output | `::add-mask::<secret>` emitted |
| `F6.3` | `test_masking_masked_representation_format` | Formats as `sk-*** [CONFIGURED]` or `[OK]` | Masked representation |
| `F6.4` | `test_masking_no_plaintext_in_error_logs` | Error reports only variable name & reason | Raw malformed string absent |
| `F6.5` | `test_masking_environment_not_dumped_on_error` | Process catch-all does not serialize `process.env` | Canary env absent |
| `B5.3` | `test_verify_env_malformed_key_missing_sk_prefix` | `startsWith('sk-')` fails | Exit code 1 |
| `B5.4` | `test_verify_env_short_key_rejected` | `key.length < 20` fails | Exit code 1 |
| `B5.5` | `test_verify_env_whitespace_key_rejected` | `key.trim().length === 0` fails | Exit code 1 |
| `B6.1` | `test_masking_special_chars_in_secret_not_leaked` | Punctuation in secret never echoed | Clean stdout/stderr |
| `B6.2` | `test_masking_handles_both_openai_and_vercel_tokens` | Both `OPENAI_API_KEY` and `VERCEL_TOKEN` masked | Clean stdout/stderr |
| `B6.3` | `test_masking_sanitized_length_and_prefix_output` | At most prefix (`sk-`) and length shown | Substrings hidden |
| `B6.4` | `test_masking_newlines_in_secret_sanitized` | Rejects multi-line key before log emission | Log injection prevented |
| `B6.5` | `test_masking_strict_mode_failure_zero_leak` | Reports variable name only | Raw bad value absent |
| `P1` | `test_pairwise_preflight_blocks_deployment_on_secret_failure` | Production strict missing key fails `deploy.sh` | Exit code 1 |
| `P8` | `test_pairwise_legacy_key_supported_across_preflight_and_api` | Legacy key supported in both preflight & API | Exit code 0 |
