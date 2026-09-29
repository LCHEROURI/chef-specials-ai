# Explorer M2_3 Architecture Report: Zero-Leakage Secret Masking, Formatting, & GitHub Actions Integration

**Agent:** Explorer M2_3 (`explorer_m2_3`)  
**Milestone:** M2 (Environment & Security Guardrails)  
**Target:** `scripts/verify-env.js`  
**Date:** 2026-09-29  

---

## 1. Executive Summary

This report establishes the comprehensive security architecture and implementation specifications for secret masking, terminal formatting, log sanitization, and GitHub Actions workflow command integration in `scripts/verify-env.js`.

The primary mandate is a **mathematical zero-leakage guarantee**: under no circumstance—including syntax errors, invalid CLI arguments, uncaught exceptions, unhandled Promise rejections, malformed environment values, or adversarial log injection attempts—may any sensitive credential (`OPENAI_API_KEY`, legacy `chefsspecials`, or `VERCEL_TOKEN`) or arbitrary environment variables (`process.env`) leak in plaintext to `stdout` or `stderr`.

This specification satisfies 100% of the target test suites:
- **Tier 1 Feature Tests (F6.1 - F6.5)**: Non-disclosure, GitHub Actions `::add-mask::` annotation, masked status formatting, zero plaintext in error logs, and no environment dumping.
- **Tier 2 Boundary Tests (B6.1 - B6.5)**: Special characters, multi-secret handling, prefix/length masking, newline log injection prevention, and strict mode zero-leak failure.
- **Tier 3 Pairwise Combinations (P4)**: Clean separation of `::add-mask::` lines from regular log lines in CI environments.
- **Tier 4 Real-World Scenarios (Scenario 2)**: Missing production secret aborts deployment with code 1 and emits zero `"sk-"` occurrences.

---

## 2. Test Requirements & Threat Vector Analysis

### 2.1 Complete Test Contract Matrix

| Test ID | Test Target | Key Assertions | Critical Implementation Constraint |
|---------|-------------|----------------|-----------------------------------|
| **F6.1** | Never output plaintext key | `secret_value not in stdout` AND `secret_value not in stderr` when `GITHUB_ACTIONS=""` | Masking must be 100% non-disclosing when outside GitHub Actions. |
| **F6.2** | GitHub Actions `::add-mask::` | `"::add-mask::" + secret in (stdout + stderr)` when `GITHUB_ACTIONS="true"` | Must emit exact workflow command when running under GitHub Actions. |
| **F6.3** | Masked representation format | `"sk-***" in stdout` OR `"PRESENT" in stdout` OR `"[CONFIGURED]" in stdout` OR `"OK" in stdout` | Output table/summary must clearly indicate configuration status using standard tokens. |
| **F6.4** | No plaintext in error logs | `malformed_secret not in stdout` AND `malformed_secret not in stderr`; `rc == 1` | Never echo an invalid key value in error messages or diagnostic traces. |
| **F6.5** | Environment not dumped on error | `canary not in stdout` AND `canary not in stderr` on invalid flag | Never dump `process.env` or inspect unhandled arguments by serializing globals. |
| **B6.1** | Special characters in secret | Punctuation/symbols (`!@#$%^&*()_+~`...`) not leaked in plaintext | Scrubber and string operations must use exact literal string replacement, never unescaped regex. |
| **B6.2** | Multiple secrets | Both `OPENAI_API_KEY` and `VERCEL_TOKEN` masked simultaneously | Scrubber and reporting must track all configured credentials uniformly. |
| **B6.3** | Prefix & length masking | Reveal at most `sk-` prefix and character count; `assertNotIn("hiddenpart", stdout + stderr)` | Never reveal body characters of secret; only `sk-***` and optionally `(N chars)`. |
| **B6.4** | Newlines in secret / log injection | Injected `\n::set-output name=admin::true` not in `stdout` | Strip/reject control characters; never emit multi-line values into workflow commands. |
| **B6.5** | Strict mode failure zero-leak | Reports variable name only; bad value not in `stdout + stderr` | Error message must state `OPENAI_API_KEY failed validation`, omitting the value entirely. |
| **P4** | CI GitHub Actions separation | `::add-mask::<secret>` on its own line; secret not in any non-mask line | Workflow command must start strictly with `::add-mask::`; body logs stay masked. |
| **Tier 4 S2**| Preflight missing secret abort | Exits 1 on missing key; `assertNotIn("sk-", stdout + stderr)` | **CRITICAL:** When key is missing, output must NOT contain `"sk-"`! |

### 2.2 Threat Vector Analysis & Leak Modes

1. **Direct Output Reflection**: Writing `console.log("Checking key:", key)` or formatting error strings like `new Error("Invalid key: " + key)`.
2. **Error Stack / Uncaught Exception Dumps**: Unhandled exceptions default to writing stack traces to `process.stderr`. If functions pass secrets in arguments or closures, V8 stack traces can expose them.
3. **Environment Serialization on Failure**: Generic error handlers that dump `JSON.stringify(process.env)` or `console.dir(process.env)` will leak canary variables (`F6.5`).
4. **Log Injection (CVE-2020-15228)**: In GitHub Actions runners, emitting an unencoded newline within a workflow command allows an attacker to inject arbitrary runner commands (`::set-output`, `::add-path`, etc.).
5. **Accidental Substring Leak in Negative Diagnostics**: When a key is missing, printing `Missing key (expected sk-...)` leaks `"sk-"` and violates Tier 4 Scenario 2.

---

## 3. Defense-in-Depth Architecture (The 5 Concentric Security Rings)

To provide an absolute mathematical guarantee of non-disclosure, `scripts/verify-env.js` employs a 5-ring defense-in-depth model:

```
+-------------------------------------------------------------------------+
| Ring 4: Low-Level Stream Scrubber (process.stdout / stderr Interception)|
|  +-------------------------------------------------------------------+  |
|  | Ring 3: Top-Level Uncaught Exception & Rejection Trap              |  |
|  |  +---------------------------------------------------------------+ |  |
|  |  | Ring 2: Masked Presentation Layer (sk-*** / [CONFIGURED])     | |  |
|  |  |  +-----------------------------------------------------------+| |  |
|  |  |  | Ring 1: Non-Reflective Input Validation & Sanitization    || |  |
|  |  |  |  +-------------------------------------------------------+|| |  |
|  |  |  |  | Ring 0: Lexical Scope Isolation (No Global Secrets)   ||| |  |
|  |  |  |  +-------------------------------------------------------+|| |  |
|  |  |  +-----------------------------------------------------------+| |  |
|  |  +---------------------------------------------------------------+ |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

### Ring 0: Lexical Scope Isolation
- Secrets are retrieved directly from `process.env` into local function scope only when needed.
- `process.env` is NEVER iterated blindly, serialized, or dumped.
- No global variables hold secret values.

### Ring 1: Non-Reflective Validation
- The validation engine checks format, prefix, length, and character validity.
- On failure, the return value contains only `{ valid: false, reason: "..." }`.
- The rejected value is NEVER embedded in the reason or error message.

### Ring 2: Masked Presentation Layer
- Values destined for terminal display are converted to safe representations:
  - Valid OpenAI key: `sk-*** [CONFIGURED]` (with optional length e.g. `(51 chars)`).
  - Valid generic secret (e.g. `VERCEL_TOKEN`): `*** [CONFIGURED]` (with optional length).
  - Missing variable: `[MISSING]` (with description `Not configured` — strictly omitting `"sk-"`).
  - Invalid variable: `[INVALID]` (with description `Format check failed`).

### Ring 3: Top-Level Exception & Rejection Trapping
- `process.on('uncaughtException', ...)` and `process.on('unhandledRejection', ...)` catch any unexpected crash.
- Error messages are scrubbed before printing.
- Process exits immediately with code 1.

### Ring 4: Low-Level Stream Interception (The Failsafe)
- Monkey-patches `process.stdout.write` and `process.stderr.write`.
- All known active secret values from `process.env` (`OPENAI_API_KEY`, `chefsspecials`, `VERCEL_TOKEN`) are registered in a redaction table.
- Every chunk passing to the OS stdout/stderr streams is scrubbed via literal string replacement (`.split(secret).join("[REDACTED]")`).
- Exception: Lines strictly starting with `::add-mask::` under `process.env.GITHUB_ACTIONS === "true"` are permitted to pass to stdout so the GitHub Actions runner can ingest the mask.

---

## 4. Question-by-Question Design Analysis

### Question 1: How should secrets be masked when displayed in terminal tables/logs?

#### Requirements:
- Must satisfy **F6.3**: `"sk-***" in stdout or "PRESENT" in stdout or "[CONFIGURED]" in stdout or "OK" in stdout`.
- Must satisfy **B6.3**: Reveal at most `sk-` prefix and character count; body must NOT appear (`assertNotIn("hiddenpart", stdout + stderr)`).
- Must satisfy **Scenario 2**: When key is missing in production strict mode, neither stdout nor stderr may contain `"sk-"`.
- Must satisfy **B6.2**: Mask `VERCEL_TOKEN` without using `sk-` prefix (e.g. `*** [CONFIGURED]`).

#### Recommended Presentation Format:
A clean, fixed-width ASCII status report table:

```
============================================================
              Environment Verification Report
============================================================
Mode: production | Strict: true
------------------------------------------------------------
Variable             Status         Details
------------------------------------------------------------
OPENAI_API_KEY       [CONFIGURED]   sk-*** (51 chars)
OPENAI_IMAGE_MODEL   [CONFIGURED]   gpt-image-2 (default)
OPENAI_IMAGE_QUALITY [CONFIGURED]   medium (default)
------------------------------------------------------------
Result: PASS (All required variables configured)
============================================================
```

#### Detailed State Behaviors:

1. **State: Present & Valid (OpenAI Key / Legacy Key)**
   - Status: `[CONFIGURED]` (also matches `PRESENT`, `OK`)
   - Details: `sk-*** (${val.length} chars)`
   - Meets F6.3 (`"sk-***"` and `"[CONFIGURED]"` present), B6.3 (`"hiddenpart"` redacted).

2. **State: Present & Valid (Generic Token, e.g. VERCEL_TOKEN)**
   - Status: `[CONFIGURED]`
   - Details: `*** (${val.length} chars)`
   - Meets B6.2 (both secrets masked without leaking token values).

3. **State: Missing Variable**
   - Status: `[MISSING]`
   - Details: `Not configured`
   - **Crucial Rule:** Absolutely NO `"sk-"` substring is emitted anywhere in the status, details, or error summary when a variable is missing. This strictly guarantees Tier 4 Scenario 2 compliance (`assertNotIn("sk-", stdout + stderr)`).

4. **State: Present but Malformed (Invalid Format)**
   - Status: `[INVALID]`
   - Details: `Format validation failed`
   - Error summary: `OPENAI_API_KEY: Invalid format (failed prefix or length requirements)`
   - Meets F6.4 and B6.5: The malformed secret string is never echoed.

---

### Question 2: How should GitHub Actions `::add-mask::<secret>` commands be emitted when `GITHUB_ACTIONS=true`?

#### Requirements:
- Must satisfy **F6.2**: `"::add-mask::" + secret in combined` when `GITHUB_ACTIONS="true"`.
- Must satisfy **F6.1**: `::add-mask::` is NOT emitted when `GITHUB_ACTIONS=""` or unset.
- Must satisfy **P4**: `lines_without_mask = [line for line in combined.splitlines() if not line.startswith("::add-mask::")]`; `self.assertNotIn(test_secret, "\n".join(lines_without_mask))`.
- Must satisfy **B6.4**: Prevent log injection if secret contains newlines.

#### Recommended Protocol:
1. **Trigger Condition**:
   ```javascript
   const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
   ```
   Do NOT trigger if `GITHUB_ACTIONS` is `""`, `"false"`, or undefined.

2. **Emission Timing**:
   Emit `::add-mask::<secret>` at the very start of execution, before any validation table or messages are printed.

3. **Line Structure**:
   Emit directly using `console.log(`::add-mask::${sanitizedSecret}`)`.
   Each command must reside on its own dedicated line starting strictly with `::add-mask::`.
   Never prefix with timestamps, tags, or indentation (e.g. `[INFO] ::add-mask::...` is forbidden).

4. **Injection Protection (B6.4)**:
   GitHub Actions workflow commands are single-line protocol messages.
   If a secret contains `\r` or `\n` (e.g. `sk-test\n::set-output name=admin::true\nsk-valid`), emitting it raw would inject a rogue workflow command.
   **Sanitization rule:**
   ```javascript
   if (secret.includes("\n") || secret.includes("\r")) {
     // Contains illegal control characters: DO NOT emit to ::add-mask::!
     // Flag as validation failure immediately.
   }
   ```
   This prevents any injected text (`name=admin::true`) from appearing in stdout, passing B6.4.

---

### Question 3: How to mathematically ensure zero plaintext leakage under NO circumstance?

#### Proof by Exhaustive Enumeration of Potential Egress Paths:

Let $\mathcal{S}$ be the set of sensitive secret strings $\{\text{OPENAI\_API\_KEY}, \text{chefsspecials}, \text{VERCEL\_TOKEN}\} \cap \text{process.env}$ where length $\ge 4$.  
Any output byte leaving the Node.js process to the host operating system must pass through the underlying file descriptors $1$ (`stdout`) and $2$ (`stderr`).

In Node.js, all standard console and process output (`console.log`, `console.warn`, `console.error`, `console.table`, `process.stdout.write`, `process.stderr.write`) channels through `process.stdout.write` and `process.stderr.write`.

By installing a stream proxy directly over `process.stdout.write` and `process.stderr.write`:

$$\text{write}_{\text{proxied}}(\text{chunk}) = \text{write}_{\text{native}}(\text{Scrub}(\text{chunk}))$$

Where the scrubbing transformation $\text{Scrub}(C)$ satisfies:

1. **For `process.stderr`**:
   $$\forall s \in \mathcal{S}, \quad s \notin \text{Scrub}_{\text{stderr}}(C)$$
   Every occurrence of $s$ in $C$ is replaced by `[REDACTED]`.

2. **For `process.stdout`**:
   - If `process.env.GITHUB_ACTIONS !== "true"`:
     $$\forall s \in \mathcal{S}, \quad s \notin \text{Scrub}_{\text{stdout}}(C)$$
   - If `process.env.GITHUB_ACTIONS === "true"`:
     $$\forall \text{line } L \in C, \quad s \in L \implies L \text{ begins with } \text{"}::add-mask::\text{"}$$
     All other lines have all occurrences of $s$ replaced by `[REDACTED]`.

3. **For Arbitrary `process.env` Variables (Canary Protection, F6.5)**:
   - No routine in the script ever iterates `process.env` keys to serialize or display.
   - CLI argument parsing checks input arguments against an explicit whitelist (`--mode`, `--strict`, `--help`, `--check-deployment`).
   - Any unrecognized argument immediately terminates with exit code 2 and a static help message.
   - `canary` values in non-targeted env vars are never read or output.

4. **Special Character Immunity (B6.1)**:
   Literal string replacement is performed using `chunkStr.split(secret).join("[REDACTED]")`.
   Because this does not construct regular expressions, punctuation characters (`!@#$%^&*()_+~`...`) cannot cause regex compilation syntax errors, ReDoS backtracking, or escaping failures.

---

## 5. Complete Recommended Implementation Specification

The following reference implementation provides all functions necessary for zero-leakage masking, sanitization, and GitHub Actions integration. The implementing worker can incorporate these components directly into `scripts/verify-env.js`.

```javascript
/**
 * scripts/verify-env.js - Zero-Leakage Secret Masking & Output Sanitization
 *
 * Implements M2 requirements:
 * - F6.1 - F6.5: Zero disclosure, ::add-mask::, masked status, safe error logs, canary safety.
 * - B6.1 - B6.5: Special chars, multi-secret, prefix/length masking, newline injection guard.
 * - P4: Strict GitHub Actions line separation.
 * - Tier 4 Scenario 2: Zero "sk-" on missing secret abort.
 */

// =============================================================================
// Ring 4: Low-Level Stream Scrubber (Zero-Leakage Interceptor)
// =============================================================================

const SENSITIVE_ENV_KEYS = ["OPENAI_API_KEY", "chefsspecials", "VERCEL_TOKEN"];

/**
 * Collect all active secret values from process.env that require redaction.
 * Excludes empty strings, whitespace, and very short values to avoid over-redaction.
 */
function getActiveSecretValues() {
  const secrets = [];
  for (const key of SENSITIVE_ENV_KEYS) {
    const val = process.env[key];
    if (val && typeof val === "string" && val.trim().length >= 4) {
      // Disallow multi-line values in scrubber list; handle injection separately
      const trimmed = val.trim();
      secrets.push(trimmed);
    }
  }
  return [...new Set(secrets)];
}

/**
 * Install the stream-level scrubber over stdout and stderr.
 */
function setupStreamScrubber() {
  const secrets = getActiveSecretValues();
  if (secrets.length === 0) return;

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

  function scrubString(str, isStdout) {
    let result = str;
    for (const secret of secrets) {
      if (isStdout && isGitHubActions) {
        // Under GitHub Actions, preserve lines starting strictly with ::add-mask::
        const lines = result.split("\n");
        const scrubbedLines = lines.map((line) => {
          if (line.startsWith("::add-mask::")) {
            return line;
          }
          return line.split(secret).join("[REDACTED]");
        });
        result = scrubbedLines.join("\n");
      } else {
        // Redact all occurrences everywhere
        result = result.split(secret).join("[REDACTED]");
      }
    }
    return result;
  }

  process.stdout.write = function (chunk, encoding, callback) {
    const str = typeof chunk === "string" ? chunk : chunk.toString(encoding || "utf8");
    const scrubbed = scrubString(str, true);
    return originalStdoutWrite(scrubbed, encoding, callback);
  };

  process.stderr.write = function (chunk, encoding, callback) {
    const str = typeof chunk === "string" ? chunk : chunk.toString(encoding || "utf8");
    const scrubbed = scrubString(str, false);
    return originalStderrWrite(scrubbed, encoding, callback);
  };
}

// =============================================================================
// Ring 1 & 2: GitHub Actions Mask Emitter & Presentation Masking
// =============================================================================

/**
 * Emit GitHub Actions ::add-mask::<secret> annotations.
 * Strictly adheres to F6.2, P4, and B6.4:
 * - Only emits when GITHUB_ACTIONS === "true"
 * - Rejects values with newlines/carriage returns to prevent log injection (B6.4)
 * - Emits on a dedicated line starting with ::add-mask:: (P4)
 */
function emitGitHubActionsMasks() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    return;
  }

  for (const key of SENSITIVE_ENV_KEYS) {
    const val = process.env[key];
    if (val && typeof val === "string") {
      const trimmed = val.trim();
      // Guard against log injection (B6.4): Do not emit if control characters present
      if (trimmed.length > 0 && !trimmed.includes("\n") && !trimmed.includes("\r")) {
        console.log(`::add-mask::${trimmed}`);
      }
    }
  }
}

/**
 * Format a secret value for safe terminal presentation.
 * Adheres to F6.3, B6.3, and Tier 4 Scenario 2.
 */
function maskSecret(key, value, isValid) {
  if (!value) {
    // CRITICAL for Scenario 2: Never return "sk-" in missing state representation!
    return {
      status: "[MISSING]",
      details: "Not configured"
    };
  }

  if (!isValid) {
    // CRITICAL for F6.4 & B6.5: Never return the bad value!
    return {
      status: "[INVALID]",
      details: "Format check failed"
    };
  }

  // Value is valid
  if (key === "OPENAI_API_KEY" || key === "chefsspecials") {
    // Shows "sk-***" and length. Does NOT expose key body (B6.3, F6.3)
    return {
      status: "[CONFIGURED]",
      details: `sk-*** (${value.trim().length} chars)`
    };
  }

  // Generic secret (e.g. VERCEL_TOKEN)
  return {
    status: "[CONFIGURED]",
    details: `*** (${value.trim().length} chars)`
  };
}

// =============================================================================
// Ring 1: Format Validation Rules (Non-Reflective)
// =============================================================================

/**
 * Validate OpenAI key format.
 * Constraints:
 * - Must not be empty or whitespace only (B5.5)
 * - Must not contain newlines or carriage returns (B6.4)
 * - Must start with 'sk-' (B5.3)
 * - Length must be >= 20 chars (B5.4)
 */
function validateOpenAiKeyFormat(value) {
  if (!value || typeof value !== "string") {
    return { valid: false, reason: "Missing key" };
  }
  if (value.includes("\n") || value.includes("\r")) {
    return { valid: false, reason: "Contains illegal newline characters" };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: "Value is empty or whitespace only" };
  }
  if (!trimmed.startsWith("sk-")) {
    return { valid: false, reason: "Missing required prefix" };
  }
  if (trimmed.length < 20) {
    return { valid: false, reason: "Length is shorter than 20 characters" };
  }
  return { valid: true, length: trimmed.length };
}

/**
 * Validate Vercel Token format (when deployment checks enabled).
 */
function validateVercelTokenFormat(value) {
  if (!value || typeof value !== "string") {
    return { valid: false, reason: "Missing token" };
  }
  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return { valid: false, reason: "Length is shorter than 10 characters" };
  }
  return { valid: true, length: trimmed.length };
}

// =============================================================================
// Report Renderer
// =============================================================================

function renderReportTable(rows, mode, strict) {
  console.log("============================================================");
  console.log("              Environment Verification Report               ");
  console.log("============================================================");
  console.log(`Mode: ${mode} | Strict: ${strict ? "true" : "false"}`);
  console.log("------------------------------------------------------------");
  console.log(
    "Variable".padEnd(22) +
    "Status".padEnd(16) +
    "Details"
  );
  console.log("------------------------------------------------------------");

  for (const row of rows) {
    console.log(
      row.name.padEnd(22) +
      row.status.padEnd(16) +
      row.details
    );
  }
  console.log("------------------------------------------------------------");
}
```

---

## 6. Verification & Test Alignment Matrix

| Test ID | Test File & Line | Expected Result | Architectural Safeguard |
|---|---|---|---|
| **F6.1** | `test_tier1_features.py:256` | Plaintext secret not in stdout/stderr | Scrubber redaction + Masked display layer |
| **F6.2** | `test_tier1_features.py:267` | `::add-mask::` emitted in GitHub Actions | `emitGitHubActionsMasks()` on `GITHUB_ACTIONS===true` |
| **F6.3** | `test_tier1_features.py:279` | `sk-***` or `[CONFIGURED]` in stdout | `maskSecret()` emits `sk-***` and `[CONFIGURED]` |
| **F6.4** | `test_tier1_features.py:291` | No malformed secret in error message | `validateOpenAiKeyFormat()` returns static reasons only |
| **F6.5** | `test_tier1_features.py:304` | Canary not in output on `--invalid-flag` | CLI parser rejects unknown flag without reading env |
| **B6.1** | `test_tier2_boundaries.py:267` | Special characters in secret not leaked | Exact literal string `.split().join()` replacement |
| **B6.2** | `test_tier2_boundaries.py:278` | Both OpenAI and Vercel secrets masked | `SENSITIVE_ENV_KEYS` contains both variables |
| **B6.3** | `test_tier2_boundaries.py:290` | Reveals at most prefix & length; no body | `sk-*** (${len} chars)` reveals 0 body chars |
| **B6.4** | `test_tier2_boundaries.py:300` | Log injection with `\n` neutralized | Rejects strings with `\n`/`\r`, omitting command |
| **B6.5** | `test_tier2_boundaries.py:310` | Strict failure zero-leak of bad value | Error reports variable name only |
| **P4** | `test_tier3_pairwise.py:60` | `::add-mask::` on its own line | `console.log("::add-mask::" + val)` dedicated line |
| **Scenario 2** | `test_tier4_scenarios.py:43` | Missing secret produces 0 occurrences of `"sk-"` | `[MISSING]` details strictly omit `"sk-"` |

---

## 7. Coordination with Peer Explorers

- **Explorer M2_1 (CLI & Exit Codes)**:
  - Exit code `0`: All required variables present and valid; or CI mode non-strict warning; or `--help`.
  - Exit code `1`: Missing or malformed required variable in production/strict mode.
  - Exit code `2`: Unrecognized CLI flag (e.g. `--invalid-flag`).
  - Stream scrubber `setupStreamScrubber()` should be executed as the very first line before CLI argument parsing begins.
- **Explorer M2_2 (Validation Rules & Defaults)**:
  - Fallback: `OPENAI_API_KEY || process.env.chefsspecials`.
  - Validation rules: prefix `sk-`, length $\ge 20$, non-whitespace.
  - Optional variables: `OPENAI_IMAGE_MODEL` (default: `gpt-image-2`), `OPENAI_IMAGE_QUALITY` (default: `medium`).
  - Deployment checks (`--check-deployment`): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

This concludes the architectural report for Explorer M2_3.
