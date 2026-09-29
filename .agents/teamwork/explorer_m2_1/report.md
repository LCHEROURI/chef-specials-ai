# CLI Interface, Argument Parser & Exit Code Architecture for `scripts/verify-env.js`

## Executive Summary
This document specifies the CLI architecture, command-line argument parser, supported flags, and exit code contract for `scripts/verify-env.js`. The implementation relies exclusively on the Node.js standard library (using `node:util` `parseArgs` with an optional pure JS manual tokenization alternative) with zero third-party dependencies, conforms strictly to test expectations in `e2e_tests/test_tier1_features.py` (F5.1-F5.5, F6.1-F6.5) and `e2e_tests/test_tier2_boundaries.py` (B5.1-B5.5, B6.1-B6.5), and enforces rigorous exit codes:
- **0**: Clean pass, non-strict warning pass, or `--help` invocation.
- **1**: Environment validation failure (missing required secret in strict mode or malformed secret in any mode).
- **2**: Invalid CLI arguments (unknown flag, invalid mode value, unexpected positionals).

---

## 1. CLI Invocations and Supported Flags

### 1.1 Invocations Matrix
| Invocation Pattern | Primary Use Case | Expected Behavior & Exit Code |
|---|---|---|
| `node scripts/verify-env.js --mode=ci` | CI pipeline preflight | Checks secret formatting if present; missing live secrets emit a warning and exit 0 (non-strict). |
| `node scripts/verify-env.js --mode=production` | Pre-deployment sanity check | Validates production configuration. Exits 0 if valid or missing in non-strict mode. |
| `node scripts/verify-env.js --mode=production --strict` | Release blocking check (`deploy.sh --prod`) | Strictly requires `OPENAI_API_KEY` (or legacy `chefsspecials`). Exits 1 if absent or malformed. |
| `node scripts/verify-env.js --check-deployment` | Deployment configuration check | In addition to API secrets, validates Vercel deployment variables (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). |
| `node scripts/verify-env.js --check-deployment --strict` | Full CI/CD automated deployment gate | Fails with exit 1 if any app secret or deployment variable is missing or malformed. |
| `node scripts/verify-env.js --help` (or `-h`) | Developer assistance | Prints CLI usage guide and exits 0 immediately without inspecting environment. |
| `node scripts/verify-env.js` (no arguments) | Default invocation | Defaults to `--mode=production` in non-strict mode. Exits 0 if valid/absent, 1 if malformed. |

### 1.2 Flags Specification
| Flag | Type | Default Value | Allowed Values | Description |
|---|---|---|---|---|
| `--mode=<mode>` | String | `"production"` | `ci`, `production`, `preview`, `development` | Target deployment environment mode. In `ci`, missing secrets log warnings instead of failing. |
| `--strict` | Boolean | `false` | `true`, `false` (flag presence sets `true`) | When enabled, missing required variables cause exit code 1. When omitted, missing variables log warnings. |
| `--check-deployment` | Boolean | `false` | `true`, `false` (flag presence sets `true`) | Inspects Vercel deployment credentials (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). |
| `-h`, `--help` | Boolean | `false` | `true`, `false` | Displays help manual and exits 0 immediately. |
| Positional Arguments | N/A | None | Reject all | Any positional argument raises a CLI argument error (exit 2). |
| Unknown Flags | N/A | None | Reject all | Any unknown flag (e.g. `--invalid-flag`) raises a CLI argument error (exit 2). |

---

## 2. Argument Parsing Architecture (Node.js Standard Library)

### 2.1 Primary Recommended Implementation: `node:util` `parseArgs`
Introduced in Node.js v18.3.0 and stable in Node.js v20 LTS and v22:
- Utilizes `parseArgs` from standard module `node:util`.
- Enforces `strict: true` (automatically throws on unknown flags like `--completely-unrecognized-flag`).
- Enforces `allowPositionals: false` (automatically throws on unexpected positionals like `node verify-env.js run`).
- Error codes handled:
  - `ERR_PARSE_ARGS_UNKNOWN_OPTION`: Thrown when an unknown option is provided.
  - `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`: Thrown when option syntax or required value is missing.
  - `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL`: Thrown when positional arguments are supplied.

```javascript
const { parseArgs } = require("node:util");

class CliArgumentError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliArgumentError";
  }
}

const ALLOWED_MODES = ["production", "ci", "preview", "development"];

function parseCliArgs(args = process.argv.slice(2)) {
  try {
    const { values } = parseArgs({
      args,
      options: {
        mode: { type: "string", default: "production" },
        strict: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        "check-deployment": { type: "boolean", default: false },
      },
      strict: true,
      allowPositionals: false,
    });

    if (values.help) {
      return { help: true };
    }

    const mode = values.mode.toLowerCase();
    if (!ALLOWED_MODES.includes(mode)) {
      throw new CliArgumentError(
        `Invalid --mode value "${values.mode}". Allowed modes: ${ALLOWED_MODES.join(", ")}`
      );
    }

    return {
      help: false,
      mode,
      strict: values.strict,
      checkDeployment: values["check-deployment"],
    };
  } catch (err) {
    if (
      err.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" ||
      err.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" ||
      err.code === "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL" ||
      err instanceof CliArgumentError
    ) {
      throw new CliArgumentError(err.message);
    }
    throw err;
  }
}
```

### 2.2 Fallback Zero-Dependency Manual Tokenizer
For maximum portability across any Node.js runtime without relying on `node:util`:
```javascript
function parseCliArgsManual(args = process.argv.slice(2)) {
  const options = {
    help: false,
    mode: "production",
    strict: false,
    checkDeployment: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg === "--check-deployment") {
      options.checkDeployment = true;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      options.mode = arg.slice(7);
      continue;
    }

    if (arg === "--mode") {
      if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
        throw new CliArgumentError("Option '--mode <value>' requires an argument");
      }
      options.mode = args[++i];
      continue;
    }

    if (arg.startsWith("-")) {
      throw new CliArgumentError(`Unknown option '${arg}'`);
    }

    throw new CliArgumentError(`Unexpected argument '${arg}'. Positional arguments are not supported.`);
  }

  if (options.help) {
    return options;
  }

  const mode = options.mode.toLowerCase();
  if (!ALLOWED_MODES.includes(mode)) {
    throw new CliArgumentError(
      `Invalid --mode value "${options.mode}". Allowed modes: ${ALLOWED_MODES.join(", ")}`
    );
  }
  options.mode = mode;

  return options;
}
```

---

## 3. Exit Code Architecture (0, 1, 2)

### Exit Code 0: SUCCESS / PASS
- **All Required Variables Valid**: `OPENAI_API_KEY` (or legacy `chefsspecials`) is present, starts with `sk-`, length >= 20, non-empty, and free of invalid control characters.
- **Non-Strict Missing Secret Pass**: When `--strict` is not specified, missing secrets emit a warning notice (e.g. `[WARN] OPENAI_API_KEY is not configured (allowing non-strict pass)`) and exit 0.
- **Help Invocations**: Invoking `--help` or `-h` prints usage instructions and exits 0 immediately.

### Exit Code 1: VALIDATION FAILURE (DEFECT / SECURITY ISSUE)
- **Strict Mode Missing Variable**: In `--strict` mode, if a required variable (e.g. `OPENAI_API_KEY` in production) is missing.
- **Malformed Secret**: If any secret variable is provided but violates formatting constraints:
  - Missing prefix `sk-` (e.g., `invalid_prefix_...`).
  - Excessive shortness (length < 20 characters).
  - Whitespace-only string (e.g., `"   "`).
  - Newlines or illegal carriage returns that could cause log injection.
- **Strict Deployment Check Failure**: In `--check-deployment --strict` mode, missing `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID`.

### Exit Code 2: INVALID CLI ARGUMENT / SYNTAX USAGE ERROR
- **Unknown Flags**: Flags not in the supported specification (e.g., `--completely-unrecognized-flag`, `--invalid-flag`).
- **Invalid Option Argument**: Missing value for `--mode` or unrecognized mode enum (e.g., `--mode=staging`).
- **Unexpected Positional Arguments**: Passing positional arguments (e.g., `node verify-env.js start`).
- **Safety Requirement**: In Exit Code 2 scenarios, the script must output a succinct error message to `stderr` and exit with code 2 without dumping `process.env`, stack traces, or canaries (verifying test F6.5).

---

## 4. Complete Dispatch Skeleton

```javascript
#!/usr/bin/env node
"use strict";

const { parseArgs } = require("node:util");

// 1. Error Definitions
class CliArgumentError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliArgumentError";
  }
}

const ALLOWED_MODES = ["production", "ci", "preview", "development"];

// 2. CLI Parser
function parseCliArgs(args = process.argv.slice(2)) {
  try {
    const { values } = parseArgs({
      args,
      options: {
        mode: { type: "string", default: "production" },
        strict: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        "check-deployment": { type: "boolean", default: false },
      },
      strict: true,
      allowPositionals: false,
    });

    if (values.help) {
      return { help: true };
    }

    const mode = values.mode.toLowerCase();
    if (!ALLOWED_MODES.includes(mode)) {
      throw new CliArgumentError(
        `Invalid --mode value "${values.mode}". Allowed modes: ${ALLOWED_MODES.join(", ")}`
      );
    }

    return {
      help: false,
      mode,
      strict: values.strict,
      checkDeployment: values["check-deployment"],
    };
  } catch (err) {
    if (
      err.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" ||
      err.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" ||
      err.code === "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL" ||
      err instanceof CliArgumentError
    ) {
      throw new CliArgumentError(err.message);
    }
    throw err;
  }
}

// 3. Help Text Display
function printHelp() {
  console.log(`Usage: node scripts/verify-env.js [options]

Pre-flight environment security and secret configuration validator.
Validates required production and CI variables without leaking sensitive values.

Options:
  --mode=<mode>          Target environment: 'production', 'ci', 'preview', or 'development'
                         (default: 'production')
  --strict               Fail with exit code 1 if any required secret is missing
                         (default: false, emits warning in non-strict mode)
  --check-deployment     Validate Vercel deployment credentials (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
  -h, --help             Display this help message and exit

Exit Codes:
  0                      All validations passed, non-strict pass, or help displayed
  1                      Validation failure (missing required secret or malformed format)
  2                      Invalid CLI argument (unknown flag or invalid option value)
`);
}

// 4. Main Entry Point & Dispatcher
function main() {
  let cliOptions;
  try {
    cliOptions = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof CliArgumentError) {
      console.error(`Error: ${err.message}`);
      console.error("Run 'node scripts/verify-env.js --help' for valid options.");
      process.exit(2);
    }
    // Prevent any stack trace from leaking process.env
    console.error("Error: Failed to parse CLI arguments.");
    process.exit(2);
  }

  if (cliOptions.help) {
    printHelp();
    process.exit(0);
  }

  try {
    // A. Early Secret Registration & GitHub Actions Masking (Explorer M2_3 Interface)
    // setupSecretMasking();

    // B. Run Environment Validation Engine (Explorer M2_2 Interface)
    // const validationResult = runEnvironmentValidation(cliOptions);

    // Placeholder until Worker integrates M2_2 and M2_3:
    const isValid = true; 
    const exitCode = isValid ? 0 : 1;
    process.exit(exitCode);
  } catch (error) {
    // Ensure uncaught exceptions never serialize process.env
    console.error("Error: Environment verification failed unexpectedly.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCliArgs,
  CliArgumentError,
  ALLOWED_MODES,
  printHelp,
};
```

---

## 5. Test Matrix Verification Mapping
| Test ID | Command / Scenario | Input Flags | Expected Code | Architectural Enforcement |
|---|---|---|---|---|
| **F5.2** | `verify_env_ci_mode_exits_zero` | `--mode=ci` | 0 | `mode="ci"`, non-strict allows missing keys with warning |
| **F5.3** | `verify_env_production_mode_with_valid_key` | `--mode=production` | 0 | `mode="production"`, valid key passes format check |
| **F5.4** | `verify_env_production_mode_fails_when_missing_key` | `--mode=production --strict` | 1 | `strict=true` rejects missing `OPENAI_API_KEY` |
| **F5.5** | `verify_env_accepts_legacy_chefsspecials_key` | `--mode=production` | 0 | Accepts legacy variable fallback |
| **F6.5** | `masking_environment_not_dumped_on_error` | `--invalid-flag` | 2 | Catches unknown flag, prints error to stderr, exits 2, no canary leak |
| **B5.1** | `verify_env_missing_all_flags_default_help` | `--help` | 0 | `help=true` prints manual and exits 0 |
| **B5.2** | `verify_env_invalid_flag_exits_code_two` | `--completely-unrecognized-flag` | 2 | `ERR_PARSE_ARGS_UNKNOWN_OPTION` -> exits 2 |
| **B5.3** | `verify_env_malformed_key_missing_sk_prefix` | `--mode=production --strict` | 1 | Validation engine identifies missing `sk-` prefix |
| **B5.4** | `verify_env_short_key_rejected` | `--mode=production --strict` | 1 | Validation engine identifies short key (< 20 chars) |
| **B5.5** | `verify_env_whitespace_key_rejected` | `--mode=production --strict` | 1 | Validation engine identifies whitespace string |
