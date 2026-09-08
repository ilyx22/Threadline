#!/usr/bin/env node
/** Launch the job worker under the react-server condition (server-only modules), any OS. */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const preload = path.join(__dirname, "..", "qa", "preload.cjs");
const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "--conditions=react-server", path.join(__dirname, "worker.ts"), ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, NODE_OPTIONS: `--require ${JSON.stringify(preload)}` },
});
process.exit(result.status ?? 1);
