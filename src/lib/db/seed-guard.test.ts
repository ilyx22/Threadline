import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONFIRM_PHRASE, seedRefusals } from "./seed-guard";

const okEnv = { SEED_DEMO_PASSWORD: "a-long-local-pass", SEED_CONFIRM_RESET: CONFIRM_PHRASE };
const local = "postgresql://u:p@127.0.0.1:55432/db";
const base = { env: okEnv, databaseUrl: local, orgSlugs: ["threadline", "northbeam"], userEmails: ["ops@threadline.com", "alex@northbeamadvisory.com"] };

describe("the demo seed guard (INF-04)", () => {
  it("allows a local demo-only database with explicit password and confirmation", () => {
    assert.deepEqual(seedRefusals(base), []);
  });
  it("refuses production and preview", () => {
    assert.ok(seedRefusals({ ...base, env: { ...okEnv, VERCEL_ENV: "production" } }).length);
    assert.ok(seedRefusals({ ...base, env: { ...okEnv, APP_ENV: "preview" } }).length);
    assert.ok(seedRefusals({ ...base, env: { ...okEnv, NODE_ENV: "production" } }).length);
  });
  it("refuses a remote host unless that exact host is allowed", () => {
    const remote = "postgresql://u:p@ep-x.neon.tech/db";
    assert.ok(seedRefusals({ ...base, databaseUrl: remote }).length);
    assert.deepEqual(seedRefusals({ ...base, databaseUrl: remote, env: { ...okEnv, SEED_ALLOW_HOST: "ep-x.neon.tech" } }), []);
  });
  it("has no default password and needs the confirmation phrase", () => {
    assert.ok(seedRefusals({ ...base, env: { SEED_CONFIRM_RESET: CONFIRM_PHRASE } }).some((r) => r.includes("SEED_DEMO_PASSWORD")));
    assert.ok(seedRefusals({ ...base, env: { SEED_DEMO_PASSWORD: "a-long-local-pass" } }).some((r) => r.includes("SEED_CONFIRM_RESET")));
  });
  it("never overwrites unknown organisations or users", () => {
    assert.ok(seedRefusals({ ...base, orgSlugs: ["threadline", "acme-real-client"] }).some((r) => r.includes("acme-real-client")));
    assert.ok(seedRefusals({ ...base, userEmails: ["founder@realfirm.co.uk"] }).some((r) => r.includes("non-demo user")));
  });
});
