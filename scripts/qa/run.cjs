#!/usr/bin/env node
/**
 * Launcher for the QA suites — sets NODE_OPTIONS for the preload shim and runs
 * tsx under the react-server condition, on any OS (npm scripts on Windows
 * cannot set env vars inline).
 *
 *   node scripts/qa/run.cjs run-all
 *   node scripts/qa/run.cjs suite-core-spine --keep
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const [suite = "run-all", ...rest] = process.argv.slice(2);
const preload = path.join(__dirname, "preload.cjs");
const target = path.join(__dirname, `${suite.replace(/\.ts$/, "")}.ts`);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "--conditions=react-server", target, ...rest],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_OPTIONS: `--require ${JSON.stringify(preload)}` },
  },
);
process.exit(result.status ?? 1);
