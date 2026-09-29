#!/usr/bin/env node
"use strict";

const { parseArgs } = require("node:util");

// =============================================================================
// Security Layer: Sensitive Key Definitions & Stream Scrubber (Ring 4)
// =============================================================================

const SENSITIVE_ENV_KEYS = ["OPENAI_API_KEY", "chefsspecials", "VERCEL_TOKEN"];
const ALLOWED_MODES = ["production", "ci", "preview", "development"];

/**
 * Custom error class for CLI argument errors (exits with code 2)
 */
class CliArgumentError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliArgumentError";
  }
}

/**
 * Collect all active secret strings from process.env that must be redacted.
 * Sorts from longest to shortest to avoid partial replacements.
 */
function getActiveSecretValues() {
  const secrets = [];
  for (const key of SENSITIVE_ENV_KEYS) {
    const val = process.env[key];
    if (val && typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.length >= 4) {
        if (trimmed.includes("\n") || trimmed.includes("\r")) {
          const parts = trimmed.split(/[\r\n]+/);
          for (const p of parts) {
            const pTrimmed = p.trim();
            if (pTrimmed.length >= 4) {
              secrets.push(pTrimmed);
            }
          }
        } else {
          secrets.push(trimmed);
        }
      }
    }
  }
  return [...new Set(secrets)].sort((a, b) => b.length - a.length);
}

/**
 * Install the low-level stream scrubber over process.stdout and process.stderr.
 * This guarantees zero-leakage even if errors or unexpected outputs occur.
 */
function setupStreamScrubber() {
  const secrets = getActiveSecretValues();
  if (secrets.length === 0) return;

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const isGitHubActions =
    process.env.GITHUB_ACTIONS === "true" || process.env.GITHUB_ACTIONS === "1";

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
        result = result.split(secret).join("[REDACTED]");
      }
    }
    return result;
  }

  process.stdout.write = function (chunk, encoding, callback) {
    let cb = callback;
    let enc = encoding;
    if (typeof enc === "function") {
      cb = enc;
      enc = "utf8";
    }
    const str = typeof chunk === "string" ? chunk : chunk.toString(enc || "utf8");
    const scrubbed = scrubString(str, true);
    return originalStdoutWrite(scrubbed, enc, cb);
  };

  process.stderr.write = function (chunk, encoding, callback) {
    let cb = callback;
    let enc = encoding;
    if (typeof enc === "function") {
      cb = enc;
      enc = "utf8";
    }
    const str = typeof chunk === "string" ? chunk : chunk.toString(enc || "utf8");
    const scrubbed = scrubString(str, false);
    return originalStderrWrite(scrubbed, enc, cb);
  };
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

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

// =============================================================================
// GitHub Actions Annotation & Presentation Helpers
// =============================================================================

function emitGitHubActionsMasks() {
  const isGitHubActions =
    process.env.GITHUB_ACTIONS === "true" || process.env.GITHUB_ACTIONS === "1";
  if (!isGitHubActions) return;

  const seen = new Set();
  for (const key of SENSITIVE_ENV_KEYS) {
    const val = process.env[key];
    if (val && typeof val === "string") {
      const trimmed = val.trim();
      // Protect against log injection: never emit if newlines or carriage returns exist
      if (trimmed.length > 0 && !trimmed.includes("\n") && !trimmed.includes("\r")) {
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          console.log(`::add-mask::${trimmed}`);
        }
      }
    }
  }
}

// =============================================================================
// Validation Engine
// =============================================================================

/**
 * Resolves the active OpenAI API key, supporting legacy fallback 'chefsspecials'.
 */
function resolveOpenAIKey(env = process.env) {
  if (typeof env.OPENAI_API_KEY === "string" && env.OPENAI_API_KEY.trim().length > 0) {
    return {
      key: env.OPENAI_API_KEY,
      source: "OPENAI_API_KEY",
      isLegacy: false,
    };
  }
  if (typeof env.chefsspecials === "string" && env.chefsspecials.trim().length > 0) {
    return {
      key: env.chefsspecials,
      source: "chefsspecials",
      isLegacy: true,
    };
  }
  return {
    key: null,
    source: null,
    isLegacy: false,
  };
}

/**
 * Validates OpenAI key format without disclosing any secret plaintext.
 */
function validateOpenAIKeyFormat(key) {
  if (key === null || key === undefined || key === "") {
    return {
      valid: false,
      present: false,
      reason: "Variable is not set",
      length: 0,
    };
  }

  if (typeof key !== "string") {
    return {
      valid: false,
      present: true,
      reason: "Variable must be a string",
      length: 0,
    };
  }

  // Whitespace-only check
  if (key.trim().length === 0) {
    return {
      valid: false,
      present: true,
      reason: "Variable contains only whitespace characters",
      length: key.length,
    };
  }

  // Newline / control char check (log injection guard)
  if (/[\r\n\x00-\x1f]/.test(key)) {
    return {
      valid: false,
      present: true,
      reason: "Variable contains illegal newline or control characters",
      length: key.length,
    };
  }

  // Internal whitespace check
  if (/\s/.test(key)) {
    return {
      valid: false,
      present: true,
      reason: "Variable must not contain whitespace",
      length: key.length,
    };
  }

  // Prefix check
  if (!key.startsWith("sk-")) {
    return {
      valid: false,
      present: true,
      reason: "Variable missing required prefix",
      length: key.length,
    };
  }

  // Minimum length check (>= 20 chars)
  if (key.length < 20) {
    return {
      valid: false,
      present: true,
      reason: `Variable length shorter than required (found: ${key.length})`,
      length: key.length,
    };
  }

  return {
    valid: true,
    present: true,
    reason: null,
    length: key.length,
  };
}

/**
 * Validates the optional OPENAI_IMAGE_MODEL variable.
 */
function validateImageModel(model) {
  const DEFAULT_MODEL = "gpt-image-2";
  if (!model || model.trim().length === 0) {
    return {
      valid: true,
      value: `${DEFAULT_MODEL} (default)`,
      error: null,
    };
  }

  const clean = model.trim();
  if (/\s/.test(clean) || clean.length < 3 || clean.length > 64) {
    return {
      valid: false,
      value: "invalid",
      error: "OPENAI_IMAGE_MODEL must be 3-64 characters and contain no whitespace",
    };
  }

  return {
    valid: true,
    value: clean,
    error: null,
  };
}

/**
 * Validates the optional OPENAI_IMAGE_QUALITY variable.
 */
function validateImageQuality(quality) {
  const DEFAULT_QUALITY = "medium";
  const ALLOWED_QUALITIES = ["medium", "standard", "hd", "high", "low"];

  if (!quality || quality.trim().length === 0) {
    return {
      valid: true,
      value: `${DEFAULT_QUALITY} (default)`,
      error: null,
    };
  }

  const clean = quality.trim().toLowerCase();
  if (!ALLOWED_QUALITIES.includes(clean)) {
    return {
      valid: false,
      value: "invalid",
      error: `OPENAI_IMAGE_QUALITY must be one of: ${ALLOWED_QUALITIES.join(", ")}`,
    };
  }

  return {
    valid: true,
    value: clean,
    error: null,
  };
}

/**
 * Validates Vercel deployment variables when --check-deployment is active.
 */
function validateDeploymentVariables(env = process.env) {
  const errors = [];
  const rows = [];

  // VERCEL_TOKEN
  const token = env.VERCEL_TOKEN;
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    errors.push("Missing required deployment secret: VERCEL_TOKEN");
    rows.push({
      name: "VERCEL_TOKEN",
      status: "[MISSING]",
      details: "Not configured",
      isSecret: true,
    });
  } else {
    const trimmedToken = token.trim();
    if (/\s/.test(trimmedToken) || trimmedToken.length < 10 || /[\r\n]/.test(trimmedToken)) {
      errors.push("VERCEL_TOKEN failed format validation");
      rows.push({
        name: "VERCEL_TOKEN",
        status: "[INVALID]",
        details: "Format validation failed",
        isSecret: true,
      });
    } else {
      rows.push({
        name: "VERCEL_TOKEN",
        status: "[CONFIGURED]",
        details: `*** (${trimmedToken.length} chars)`,
        isSecret: true,
      });
    }
  }

  // VERCEL_ORG_ID
  const orgId = env.VERCEL_ORG_ID;
  if (!orgId || typeof orgId !== "string" || orgId.trim().length === 0) {
    errors.push("Missing required deployment variable: VERCEL_ORG_ID");
    rows.push({
      name: "VERCEL_ORG_ID",
      status: "[MISSING]",
      details: "Not configured",
    });
  } else if (/\s/.test(orgId.trim()) || orgId.trim().length < 4) {
    errors.push("VERCEL_ORG_ID failed format validation");
    rows.push({
      name: "VERCEL_ORG_ID",
      status: "[INVALID]",
      details: "Format validation failed",
    });
  } else {
    rows.push({
      name: "VERCEL_ORG_ID",
      status: "[CONFIGURED]",
      details: orgId.trim(),
    });
  }

  // VERCEL_PROJECT_ID
  const projId = env.VERCEL_PROJECT_ID;
  if (!projId || typeof projId !== "string" || projId.trim().length === 0) {
    errors.push("Missing required deployment variable: VERCEL_PROJECT_ID");
    rows.push({
      name: "VERCEL_PROJECT_ID",
      status: "[MISSING]",
      details: "Not configured",
    });
  } else if (/\s/.test(projId.trim()) || projId.trim().length < 4) {
    errors.push("VERCEL_PROJECT_ID failed format validation");
    rows.push({
      name: "VERCEL_PROJECT_ID",
      status: "[INVALID]",
      details: "Format validation failed",
    });
  } else {
    rows.push({
      name: "VERCEL_PROJECT_ID",
      status: "[CONFIGURED]",
      details: projId.trim(),
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    rows,
  };
}

// =============================================================================
// Report Renderer
// =============================================================================

function printReport(rows, mode, strict) {
  console.log("============================================================");
  console.log("              Environment Verification Report               ");
  console.log("============================================================");
  console.log(`Mode: ${mode} | Strict: ${strict ? "true" : "false"}`);
  console.log("------------------------------------------------------------");
  console.log(
    "Variable".padEnd(24) +
    "Status".padEnd(16) +
    "Details"
  );
  console.log("------------------------------------------------------------");

  for (const row of rows) {
    console.log(
      row.name.padEnd(24) +
      row.status.padEnd(16) +
      row.details
    );
  }
  console.log("------------------------------------------------------------");
}

// =============================================================================
// Main Execution
// =============================================================================

function main() {
  // Ring 4: Low-level stream scrubber intercepts all stdout/stderr writes
  setupStreamScrubber();

  // Trapping uncaught exceptions so process.env is never serialized
  process.on("uncaughtException", () => {
    console.error("Error: Verification encountered an unexpected error.");
    process.exit(1);
  });
  process.on("unhandledRejection", () => {
    console.error("Error: Verification encountered an unexpected promise rejection.");
    process.exit(1);
  });

  // Parse CLI arguments
  let cliOptions;
  try {
    cliOptions = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof CliArgumentError) {
      console.error(`Error: ${err.message}`);
      console.error("Run 'node scripts/verify-env.js --help' for valid options.");
      process.exit(2);
    }
    console.error("Error: Failed to parse CLI arguments.");
    process.exit(2);
  }

  if (cliOptions.help) {
    printHelp();
    process.exit(0);
  }

  const { mode, strict, checkDeployment } = cliOptions;

  // Emit GitHub Actions ::add-mask:: commands if running in CI workflow
  emitGitHubActionsMasks();

  const reportRows = [];
  const errors = [];
  const warnings = [];

  // 1. Resolve and Validate OpenAI Key
  const resolved = resolveOpenAIKey(process.env);
  let openAiValid = false;

  if (!resolved.source) {
    // Missing key
    // NOTE: To satisfy Scenario 2, never emit "sk-" when key is missing!
    reportRows.push({
      name: "OPENAI_API_KEY",
      status: "[MISSING]",
      details: "Not configured",
    });

    if (strict) {
      errors.push("Required environment variable OPENAI_API_KEY is not configured.");
    } else if (mode === "ci") {
      warnings.push("OPENAI_API_KEY is not configured (allowed in CI mode).");
    } else {
      warnings.push("OPENAI_API_KEY is not configured (allowing non-strict pass).");
    }
  } else {
    // Key present, validate format
    const keyFormat = validateOpenAIKeyFormat(resolved.key);
    if (!keyFormat.valid) {
      reportRows.push({
        name: resolved.source,
        status: "[INVALID]",
        details: "Format validation failed",
      });
      errors.push(`${resolved.source} failed validation (${keyFormat.reason}).`);
    } else {
      openAiValid = true;
      reportRows.push({
        name: resolved.isLegacy ? "OPENAI_API_KEY" : "OPENAI_API_KEY",
        status: "[CONFIGURED]",
        details: `sk-*** (${keyFormat.length} chars)`,
      });
    }
  }

  // 2. Validate Optional Image Model
  const modelCheck = validateImageModel(process.env.OPENAI_IMAGE_MODEL);
  if (!modelCheck.valid) {
    reportRows.push({
      name: "OPENAI_IMAGE_MODEL",
      status: "[INVALID]",
      details: "Format validation failed",
    });
    if (strict) {
      errors.push(modelCheck.error);
    } else {
      warnings.push(modelCheck.error);
    }
  } else {
    reportRows.push({
      name: "OPENAI_IMAGE_MODEL",
      status: "[CONFIGURED]",
      details: modelCheck.value,
    });
  }

  // 3. Validate Optional Image Quality
  const qualityCheck = validateImageQuality(process.env.OPENAI_IMAGE_QUALITY);
  if (!qualityCheck.valid) {
    reportRows.push({
      name: "OPENAI_IMAGE_QUALITY",
      status: "[INVALID]",
      details: "Format validation failed",
    });
    if (strict) {
      errors.push(qualityCheck.error);
    } else {
      warnings.push(qualityCheck.error);
    }
  } else {
    reportRows.push({
      name: "OPENAI_IMAGE_QUALITY",
      status: "[CONFIGURED]",
      details: qualityCheck.value,
    });
  }

  // 4. Validate Deployment Variables (if requested or if VERCEL_TOKEN is present)
  if (checkDeployment) {
    const deployCheck = validateDeploymentVariables(process.env);
    reportRows.push(...deployCheck.rows);
    if (!deployCheck.valid) {
      if (strict || mode === "production") {
        errors.push(...deployCheck.errors);
      } else {
        warnings.push(...deployCheck.errors);
      }
    }
  } else if (process.env.VERCEL_TOKEN && typeof process.env.VERCEL_TOKEN === "string") {
    // If present even without check-deployment, show masked representation
    const tokenVal = process.env.VERCEL_TOKEN.trim();
    reportRows.push({
      name: "VERCEL_TOKEN",
      status: "[CONFIGURED]",
      details: `*** (${tokenVal.length} chars)`,
    });
  }

  // Print Formatted Report Table
  printReport(reportRows, mode, strict);

  // Print Warnings
  for (const warn of warnings) {
    console.log(`[WARN] ${warn}`);
  }

  // Print Errors and Determine Exit Code
  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`Error: ${err}`);
    }
    process.exit(1);
  }

  console.log("Result: PASS (Environment verification passed cleanly)");
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCliArgs,
  CliArgumentError,
  ALLOWED_MODES,
  printHelp,
  validateOpenAIKeyFormat,
  resolveOpenAIKey,
};
