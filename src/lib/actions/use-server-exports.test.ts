import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Next.js allows a "use server" module to export only async functions. A
 * constant exported from one compiles and passes every direct-call test, but in
 * production it breaks every server action on the pages that load the module
 * ("A 'use server' file can only export async functions, found object"). Found
 * 27 Sept 2026 on the client admin page; this check keeps it from returning.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}

describe('"use server" modules export only async functions', () => {
  it("has no exported constants, classes or re-exports in any server-action file", () => {
    const root = path.resolve("src");
    const offenders: string[] = [];
    for (const f of files(root)) {
      const src = readFileSync(f, "utf8");
      if (!/^\s*["']use server["'];?/.test(src)) continue;
      src.split(/\r?\n/).forEach((line, i) => {
        if (/^export\s+(const|let|var|class|default\s+(?!async))/.test(line) || /^export\s*\{/.test(line) || /^export\s+\*\s+from/.test(line)) {
          offenders.push(`${path.relative(root, f)}:${i + 1}: ${line.trim().slice(0, 80)}`);
        }
      });
    }
    assert.deepEqual(offenders, [], `Move these out of the "use server" file:\n${offenders.join("\n")}`);
  });
});
