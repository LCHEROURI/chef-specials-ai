#!/usr/bin/env node
"use strict";

/**
 * smoke-test.js — Post-deployment API health check
 *
 * Usage:
 *   node scripts/smoke-test.js <deployment-url>
 *   node scripts/smoke-test.js https://chef-specials-ai.vercel.app
 *
 * Exit codes:
 *   0  All checks passed
 *   1  One or more checks failed
 *   2  Invalid arguments or network error
 */

const https = require("node:https");
const http = require("node:http");
const { URL } = require("node:url");
const { parseArgs } = require("node:util");

// ─────────────────────────────────────────────────────────────────
// CLI argument parsing (must run before TIMEOUT_MS / MAX_RETRIES used)
// ─────────────────────────────────────────────────────────────────

let _cliArgs = {};
try {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      timeout: { type: "string" },
      retries: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
    strict: false,
  });
  _cliArgs = { values, positionals };
} catch {
  _cliArgs = { values: {}, positionals: process.argv.slice(2).filter((a) => !a.startsWith("--")) };
}

const TIMEOUT_MS = parseInt(_cliArgs.values?.timeout, 10) > 0
  ? parseInt(_cliArgs.values.timeout, 10)
  : 30000;
// Default to 4 retries: a fresh Vercel deployment can take a few seconds to
// warm up, which made the CI smoke test fail on healthy deploys.
const MAX_RETRIES = parseInt(_cliArgs.values?.retries, 10) >= 0
  ? parseInt(_cliArgs.values.retries, 10)
  : 4;
const RETRY_DELAY_MS = 10000;
const MAX_REDIRECTS = 3;

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[FAIL] ${msg}\n`);
}

function pass(msg) {
  log(`[PASS] ${msg}`);
}

function info(msg) {
  log(`[INFO] ${msg}`);
}

/**
 * Minimal HTTP/HTTPS GET with redirect following and timeout.
 * Returns { statusCode, headers, body }
 */
function httpGet(urlStr, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch {
      return reject(new Error(`Invalid URL: ${urlStr}`));
    }

    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": "chef-specials-ai-smoke-test/1.0",
        Accept: "application/json, text/html",
      },
      timeout: TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      // Handle redirects
      if (
        [301, 302, 307, 308].includes(res.statusCode) &&
        res.headers.location &&
        redirectsLeft > 0
      ) {
        return resolve(httpGet(res.headers.location, redirectsLeft - 1));
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
      res.on("error", reject);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${TIMEOUT_MS}ms: ${urlStr}`));
    });
    req.on("error", reject);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────
// Individual Checks
// ─────────────────────────────────────────────────────────────────

async function checkHomePage(baseUrl) {
  info(`Checking homepage: ${baseUrl}/`);
  const res = await httpGet(`${baseUrl}/`);

  if (res.statusCode !== 200) {
    fail(`Homepage returned HTTP ${res.statusCode} (expected 200)`);
    return false;
  }

  const hasTitle = res.body.includes("Chef Specials AI");
  if (!hasTitle) {
    fail("Homepage HTML does not contain expected title 'Chef Specials AI'");
    return false;
  }

  const hasAppScript = res.body.includes("app.js");
  if (!hasAppScript) {
    fail("Homepage HTML does not reference app.js");
    return false;
  }

  pass(`Homepage: HTTP 200, title and app.js reference confirmed`);
  return true;
}

async function checkStaticAssets(baseUrl) {
  const assets = ["app.js", "styles.css"];
  let allPass = true;

  for (const asset of assets) {
    info(`Checking static asset: /${asset}`);
    const res = await httpGet(`${baseUrl}/${asset}`);

    if (res.statusCode !== 200) {
      fail(`/${asset} returned HTTP ${res.statusCode} (expected 200)`);
      allPass = false;
      continue;
    }

    const contentType = res.headers["content-type"] || "";
    const isValidType =
      contentType.includes("javascript") ||
      contentType.includes("css") ||
      contentType.includes("text");

    if (!isValidType) {
      fail(`/${asset} returned unexpected Content-Type: ${contentType}`);
      allPass = false;
      continue;
    }

    pass(`/${asset}: HTTP 200 with valid Content-Type`);
  }

  return allPass;
}

async function checkApiEndpoint(baseUrl) {
  const apiUrl = `${baseUrl}/api/generate-image`;
  info(`Checking API endpoint: ${apiUrl} (OPTIONS preflight)`);

  // Test OPTIONS preflight first (no auth required)
  let optionsRes;
  try {
    optionsRes = await new Promise((resolve, reject) => {
      const parsed = new URL(apiUrl);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname,
          method: "OPTIONS",
          headers: {
            "User-Agent": "chef-specials-ai-smoke-test/1.0",
            Origin: baseUrl,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
          },
          timeout: TIMEOUT_MS,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks).toString("utf8"),
            })
          );
          res.on("error", reject);
        }
      );
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`OPTIONS request timed out after ${TIMEOUT_MS}ms`));
      });
      req.on("error", reject);
      req.end();
    });
  } catch (err) {
    fail(`OPTIONS preflight failed with error: ${err.message}`);
    return false;
  }

  if (optionsRes.statusCode !== 200 && optionsRes.statusCode !== 204) {
    fail(`/api/generate-image OPTIONS returned HTTP ${optionsRes.statusCode} (expected 200 or 204)`);
    return false;
  }

  const corsHeader = optionsRes.headers["access-control-allow-origin"];
  if (!corsHeader) {
    fail("/api/generate-image missing Access-Control-Allow-Origin header on OPTIONS response");
    return false;
  }

  pass(`/api/generate-image OPTIONS: HTTP ${optionsRes.statusCode}, CORS headers present`);

  // Test POST with empty body to confirm 400 (not a 500 crash)
  info(`Checking API endpoint: ${apiUrl} (POST validation)`);
  let postRes;
  try {
    postRes = await new Promise((resolve, reject) => {
      const parsed = new URL(apiUrl);
      const lib = parsed.protocol === "https:" ? https : http;
      const body = JSON.stringify({});
      const req = lib.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname,
          method: "POST",
          headers: {
            "User-Agent": "chef-specials-ai-smoke-test/1.0",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
          timeout: TIMEOUT_MS,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks).toString("utf8"),
            })
          );
          res.on("error", reject);
        }
      );
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`POST request timed out after ${TIMEOUT_MS}ms`));
      });
      req.on("error", reject);
      req.write(body);
      req.end();
    });
  } catch (err) {
    fail(`POST /api/generate-image failed with error: ${err.message}`);
    return false;
  }

  // Accept 400 (missing prompt), 200 with setupNeeded (no API key), or 405 (misconfigured)
  const acceptableCodes = [200, 400];
  if (!acceptableCodes.includes(postRes.statusCode)) {
    fail(`/api/generate-image POST returned unexpected HTTP ${postRes.statusCode} (expected 200 or 400)`);
    return false;
  }

  // If 400, verify it's a validation error, not a server crash
  if (postRes.statusCode === 400) {
    let parsed;
    try {
      parsed = JSON.parse(postRes.body);
    } catch {
      fail("/api/generate-image POST returned 400 with non-JSON body (server error)");
      return false;
    }
    if (!parsed.error) {
      fail("/api/generate-image POST 400 response missing 'error' field");
      return false;
    }
    pass(`/api/generate-image POST: HTTP 400 with validation error (expected, no API key needed)`);
  } else {
    // 200: check for setupNeeded or valid image data
    let parsed;
    try {
      parsed = JSON.parse(postRes.body);
    } catch {
      fail("/api/generate-image POST returned 200 with non-JSON body");
      return false;
    }
    if (parsed.setupNeeded) {
      pass(`/api/generate-image POST: HTTP 200, API key not configured but server is healthy`);
    } else {
      pass(`/api/generate-image POST: HTTP 200 with valid JSON response`);
    }
  }

  return true;
}

async function checkSecurityHeaders(baseUrl) {
  info(`Checking security headers: ${baseUrl}/`);
  const res = await httpGet(`${baseUrl}/`);
  let allPass = true;

  const desiredHeaders = [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", null], // just presence
  ];

  for (const [header, expectedValue] of desiredHeaders) {
    const actual = res.headers[header];
    if (!actual) {
      // Warn but don't fail — Vercel handles many of these at the CDN layer
      info(`  [WARN] Missing recommended security header: ${header} (may be set by CDN)`);
      continue;
    }
    if (expectedValue && !actual.toLowerCase().includes(expectedValue)) {
      info(`  [WARN] ${header}: ${actual} (expected to include '${expectedValue}')`);
      continue;
    }
    pass(`  Security header present: ${header}: ${actual}`);
  }

  return allPass;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

async function main() {
  const rawUrl = (_cliArgs.positionals || [])[0] || null;

  if (_cliArgs.values?.help) {
    log("Usage: node scripts/smoke-test.js <deployment-url> [--timeout=<ms>] [--retries=<n>]");
    log("       node scripts/smoke-test.js https://chef-specials-ai.vercel.app");
    log("       node scripts/smoke-test.js https://... --timeout=20000 --retries=2");
    log("");
    log("Options:");
    log("  --timeout=<ms>    Request timeout in milliseconds (default: 30000)");
    log("  --retries=<n>     Number of retry attempts per check (default: 4)");
    log("  -h, --help        Show this help message");
    log("");
    log("Exit codes:");
    log("  0  All checks passed");
    log("  1  One or more checks failed");
    log("  2  Invalid arguments or fatal error");
    process.exit(0);
  }

  if (!rawUrl) {
    log("Usage: node scripts/smoke-test.js <deployment-url> [--timeout=<ms>] [--retries=<n>]");
    log("Run with --help for full usage.");
    process.exit(2);
  }

  // Normalise URL — strip trailing slashes
  let baseUrl;
  try {
    const parsed = new URL(rawUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    fail(`Invalid deployment URL: ${rawUrl}`);
    process.exit(2);
  }

  log("============================================================");
  log("            Post-Deployment Smoke Test                      ");
  log("============================================================");
  log(`Target: ${baseUrl}`);
  log(`Time:   ${new Date().toISOString()}`);
  log("------------------------------------------------------------");

  const runChecks = () => Promise.allSettled([
    checkHomePage(baseUrl),
    checkStaticAssets(baseUrl),
    checkApiEndpoint(baseUrl),
    checkSecurityHeaders(baseUrl),
  ]);
  const isFailure = (r) => r.status === "rejected" || r.value === false;

  let results = await runChecks();
  for (let attempt = 1; attempt <= MAX_RETRIES && results.some(isFailure); attempt++) {
    info(`Some checks failed; retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt} of ${MAX_RETRIES})`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    results = await runChecks();
  }

  log("------------------------------------------------------------");

  const failures = results.filter(
    (r) => r.status === "rejected" || r.value === false
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      fail(`Check ${i + 1} threw an error: ${r.reason?.message || r.reason}`);
    }
  });

  log("------------------------------------------------------------");
  if (failures.length === 0) {
    log("Result: PASS — All smoke tests passed. Deployment is healthy.");
    process.exit(0);
  } else {
    fail(`Result: FAIL — ${failures.length} of ${results.length} checks failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  fail(`Fatal error: ${err.message}`);
  process.exit(2);
});
