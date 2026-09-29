#!/usr/bin/env node
/**
 * runner.js
 * Node.js entry point for Chef Specials AI E2E Test Suite.
 * Forwards execution to the unified Python test runner with all CLI arguments.
 */

const { spawn } = require("node:child_process");
const path = require("node:path");

const runnerPy = path.join(__dirname, "runner.py");
const args = [runnerPy, ...process.argv.slice(2)];

const child = spawn("python3", args, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, "..")
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
