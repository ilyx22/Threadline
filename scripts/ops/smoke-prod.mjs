#!/usr/bin/env node
/**
 * Production smoke test. Read-only: it only sends GET requests and never
 * creates, sends or changes anything.
 *
 *   node scripts/ops/smoke-prod.mjs https://threadlinehq.com [https://threadlinex.vercel.app]
 *
 * The optional second URL is the mirror; it must refuse to run jobs.
 * Exit code 0 when every check passes, 1 otherwise.
 */
const [primary = "https://threadline-fawn.vercel.app", mirror] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

async function get(url, init) {
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
    let body = null;
    try { body = await res.clone().json(); } catch { body = null; }
    return { status: res.status, body, location: res.headers.get("location") };
  } catch (error) {
    return { status: 0, body: null, error: String(error) };
  }
}

const health = await get(`${primary}/api/health`);
check("health answers 200", health.status === 200, `status ${health.status}`);
check("database reachable", health.body?.database === true, JSON.stringify(health.body));
check("no configuration errors", health.body?.configErrors === 0, `configErrors ${health.body?.configErrors}`);
check("production environment", health.body?.env === "production", `env ${health.body?.env}`);

const home = await get(`${primary}/`);
check("public site serves", home.status === 200, `status ${home.status}`);

const login = await get(`${primary}/login`);
check("sign-in page serves", login.status === 200, `status ${login.status}`);

const app = await get(`${primary}/admin`);
check("admin is protected (redirects when signed out)", [302, 303, 307, 308].includes(app.status), `status ${app.status} -> ${app.location ?? ""}`);

const cron = await get(`${primary}/api/cron/jobs`);
check("cron refuses without the secret (401, not 503)", cron.status === 401, `status ${cron.status} ${JSON.stringify(cron.body)}`);

const apply = await get(`${primary}/apply`);
check("apply page serves", apply.status === 200, `status ${apply.status}`);

if (mirror) {
  const m = await get(`${mirror}/api/cron/jobs`);
  check("mirror cron does not run jobs", m.status !== 200 || m.body?.skipped === "mirror deployment", `status ${m.status} ${JSON.stringify(m.body)}`);
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  (${r.detail})`}`);
}
console.log(`\n${results.length - failed}/${results.length} passed for ${primary}`);
console.log("Manual checks still needed: sign in, send yourself an invitation (email arrives), upload a file over 10 MB, run the cron job once from Vercel.");
process.exit(failed ? 1 : 0);
