/**
 * QA identity control.
 *
 * `actAs(email)` mints a REAL session row — SHA-256 digest in the database,
 * raw token in the shimmed cookie jar — so every guard, membership lookup and
 * capability check downstream runs its genuine code path. Nothing about the
 * authorisation logic is faked; only the transport that carries the cookie.
 *
 * `anonymous()` empties the jar. `expiredSession()` and `malformedCookie()`
 * produce the two most common broken-cookie states.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../src/lib/db/client";

const SESSION_COOKIE = "threadline_session";

// tsx does not load .env; the app origin drives own-route checks on tracked links.
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";

type Jar = { cookies: Map<string, string>; headers: Map<string, string> };

function jar(): Jar {
  const g = globalThis as unknown as { __qa?: Jar };
  g.__qa ??= { cookies: new Map(), headers: new Map() };
  return g.__qa;
}

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function actAs(email: string): Promise<{ userId: string; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`QA: no user ${email}`);
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      token: digest(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 3_600_000),
      userAgent: "ThreadlineQA",
    },
  });
  jar().cookies.clear();
  jar().cookies.set(SESSION_COOKIE, token);
  return { userId: user.id, token };
}

export function anonymous() {
  jar().cookies.clear();
}

export async function expiredSession(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`QA: no user ${email}`);
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { token: digest(token), userId: user.id, expiresAt: new Date(Date.now() - 1000) },
  });
  jar().cookies.clear();
  jar().cookies.set(SESSION_COOKIE, token);
}

export function malformedCookie() {
  jar().cookies.clear();
  jar().cookies.set(SESSION_COOKIE, "not-a-real-token-at-all");
}

/** Remove every QA session so reruns do not accumulate rows. */
export async function cleanupSessions() {
  await prisma.session.deleteMany({ where: { userAgent: "ThreadlineQA" } });
}

/* --------------------------------- Results ----------------------------------- */

export type Verdict = "PASS" | "PASS_EXT" | "PARTIAL" | "FAIL" | "NA";

export type Finding = {
  area: string;
  feature: string;
  verdict: Verdict;
  detail: string;
  bug?: string;
};

export const findings: Finding[] = [];

export function record(area: string, feature: string, verdict: Verdict, detail: string, bug?: string) {
  findings.push({ area, feature, verdict, detail, bug });
  const tag =
    verdict === "PASS" ? " ok " : verdict === "PASS_EXT" ? "ext " : verdict === "PARTIAL" ? "part" : verdict === "FAIL" ? "FAIL" : " na ";
  console.log(`  [${tag}] ${(feature + " ".repeat(52)).slice(0, 52)} ${detail}${bug ? `  <${bug}>` : ""}`);
}

export function section(title: string) {
  console.log(`\n${title.toUpperCase()}`);
}

/**
 * Run an action and classify a refusal.
 *
 * A guard refuses in one of three shapes: a structured `{ok:false}` result, a
 * thrown NEXT_NOT_FOUND / NEXT_REDIRECT control-flow signal, or an AuthError
 * that `guarded()` turned into `code: "auth"`. All three are refusals; none is
 * an exception the harness should die on.
 */
export async function attempt<T>(fn: () => Promise<T>): Promise<
  | { outcome: "ok"; value: T }
  | { outcome: "refused"; via: "result" | "not_found" | "redirect" | "auth"; message: string }
  | { outcome: "threw"; message: string }
> {
  try {
    const value = await fn();
    const v = value as unknown as { ok?: boolean; error?: string; code?: string };
    if (v && typeof v === "object" && v.ok === false) {
      return {
        outcome: "refused",
        via: v.code === "auth" ? "auth" : "result",
        message: v.error ?? "",
      };
    }
    return { outcome: "ok", value };
  } catch (error) {
    const digest = (error as { digest?: string })?.digest ?? "";
    if (digest === "NEXT_NOT_FOUND") return { outcome: "refused", via: "not_found", message: digest };
    if (digest.startsWith("NEXT_REDIRECT")) return { outcome: "refused", via: "redirect", message: digest };
    return { outcome: "threw", message: error instanceof Error ? error.message : String(error) };
  }
}

export function fd(entries: Record<string, string | number | boolean | undefined | null>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v === undefined || v === null) continue;
    form.set(k, String(v));
  }
  return form;
}

export function summary(): { pass: number; ext: number; partial: number; fail: number; na: number; bugs: string[] } {
  const bugs = [...new Set(findings.filter((f) => f.bug).map((f) => f.bug!))];
  return {
    pass: findings.filter((f) => f.verdict === "PASS").length,
    ext: findings.filter((f) => f.verdict === "PASS_EXT").length,
    partial: findings.filter((f) => f.verdict === "PARTIAL").length,
    fail: findings.filter((f) => f.verdict === "FAIL").length,
    na: findings.filter((f) => f.verdict === "NA").length,
    bugs,
  };
}
