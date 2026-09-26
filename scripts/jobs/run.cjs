#!/usr/bin/env node
/**
 * Launch the job worker under the react-server condition (server-only modules),
 * any OS. It runs the real application code: no QA shims are loaded (JOB-01).
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "--conditions=react-server", path.join(__dirname, "worker.ts"), ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(result.status ?? 1);
