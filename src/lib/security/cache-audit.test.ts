import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Cache boundaries (SEC-12). Everything a signed-in person sees is rendered
 * per request and marked private by the framework. This audit fails the build
 * if any authenticated route opts into static rendering or time-based caching,
 * or if a server-side cache is keyed without the workspace.
 */
const root = path.resolve(process.cwd(), "src/app");
const AUTHED = ["app", "admin", "account", "onboarding", "api", "invite", "t"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(tsx?|jsx?)$/.test(name) ? [full] : [];
  });
}

describe("cache boundaries for authenticated routes (SEC-12)", () => {
  const files = AUTHED.flatMap((seg) => {
    const dir = path.join(root, seg);
    try {
      return walk(dir);
    } catch {
      return [];
    }
  });

  it("finds the authenticated route files", () => {
    assert.ok(files.length > 50, `only ${files.length} files found`);
  });

  it("no authenticated route opts into static rendering or revalidation", () => {
    const offenders = files.filter((f) => {
      const s = readFileSync(f, "utf8");
      return /export const dynamic\s*=\s*["']force-static["']/.test(s) || /export const revalidate\s*=\s*[1-9]/.test(s) || /generateStaticParams/.test(s);
    });
    assert.deepEqual(offenders.map((f) => path.relative(process.cwd(), f)), []);
  });

  it("no server-side cache is used across requests without a workspace key", () => {
    const src = walk(path.resolve(process.cwd(), "src")).filter((f) => !f.endsWith(".test.ts"));
    const offenders = src.filter((f) => /unstable_cache\(|"use cache"/.test(readFileSync(f, "utf8")));
    assert.deepEqual(offenders.map((f) => path.relative(process.cwd(), f)), [], "a shared cache needs a reviewed tenant key");
  });
});
