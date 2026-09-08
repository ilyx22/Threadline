/**
 * Registers the QA shims so `next/headers`, `next/navigation` and `next/cache`
 * resolve to controllable stand-ins. Everything else — Prisma, the domain, the
 * guards, the actions themselves — is the real code.
 *
 *   NODE_OPTIONS="--import ./scripts/qa/register.mjs" tsx --conditions=react-server scripts/qa/run.ts
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./hooks.mjs", pathToFileURL(import.meta.filename ?? new URL(import.meta.url).pathname));
