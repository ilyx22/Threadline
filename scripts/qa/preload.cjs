/**
 * CJS preload: reroutes `next/headers`, `next/navigation` and `next/cache` to
 * the QA shims for every require() in the process. tsx compiles the project to
 * CJS, so this is the hook that actually fires. Everything else is real code.
 *
 *   NODE_OPTIONS="--require ./scripts/qa/preload.cjs" tsx --conditions=react-server <script>
 */
const Module = require("node:module");
const path = require("node:path");
const os = require("node:os");
const readUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try {
    return readUserInfo(...args);
  } catch (error) {
    if (error?.code !== "ERR_SYSTEM_ERROR") throw error;
    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || "codex",
      homedir: process.env.USERPROFILE || process.cwd(),
      shell: null,
    };
  }
};
const SHIMS = {
  "next/headers": path.join(__dirname, "shims", "next-headers.cjs"),
  "next/navigation": path.join(__dirname, "shims", "next-navigation.cjs"),
  "next/cache": path.join(__dirname, "shims", "next-cache.cjs"),
};
const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (SHIMS[request]) return SHIMS[request];
  return original.call(this, request, ...rest);
};
