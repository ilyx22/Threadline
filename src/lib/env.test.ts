import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appEnv, configReport, deploymentRole, sideEffectsAllowed } from "./env";

const names = (env: Record<string, string>, level?: "error" | "warning") =>
  configReport(env).issues.filter((i) => !level || i.level === level).map((i) => i.name);

describe("environment validation (INF-06)", () => {
  const pg = "postgresql://u:p@db.example.net:5432/app";
  it("resolves the environment from APP_ENV, then VERCEL_ENV, then NODE_ENV", () => {
    assert.equal(appEnv({ APP_ENV: "preview", VERCEL_ENV: "production" }), "preview");
    assert.equal(appEnv({ VERCEL_ENV: "production" }), "production");
    assert.equal(appEnv({}), "development");
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "preview" }), false);
  });
  it("requires a PostgreSQL database and refuses local ones on deployments", () => {
    assert.ok(names({}, "error").includes("DATABASE_URL"));
    assert.ok(names({ DATABASE_URL: "file:./dev.db" }, "error").includes("DATABASE_URL"));
    assert.ok(names({ VERCEL_ENV: "production", DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/x" }, "error").includes("DATABASE_URL"));
  });
  it("flags half-configured services and local storage on Vercel", () => {
    assert.ok(names({ DATABASE_URL: pg, EMAIL_PROVIDER: "resend" }, "error").includes("RESEND_API_KEY"));
    assert.ok(names({ DATABASE_URL: pg, STORAGE_PROVIDER: "s3" }, "error").includes("S3_BUCKET"));
    assert.ok(names({ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: pg }, "error").includes("STORAGE_PROVIDER"));
    assert.ok(names({ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: pg }, "error").includes("CRON_SECRET"));
  });
  it("refuses a preview that shares the production database, and seed flags on deployments", () => {
    assert.ok(names({ VERCEL_ENV: "preview", DATABASE_URL: pg, PRODUCTION_DATABASE_URL: pg }, "error").includes("DATABASE_URL"));
    assert.ok(names({ VERCEL_ENV: "production", DATABASE_URL: pg, SEED_CONFIRM_RESET: "x" }, "error").includes("SEED_CONFIRM_RESET"));
  });
  it("lets only the primary deployment cause side effects (INF-05)", () => {
    assert.equal(deploymentRole({}), "primary");
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "production" }), true);
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "production", DEPLOYMENT_ROLE: "mirror" }), false);
    assert.ok(names({ VERCEL_ENV: "production", DATABASE_URL: pg, DEPLOYMENT_ROLE: "mirror", PRODUCTION_DATABASE_URL: pg }, "error").includes("DATABASE_URL"));
    assert.ok(names({ VERCEL_ENV: "production", DATABASE_URL: pg, DEPLOYMENT_ROLE: "secondary" }, "error").includes("DEPLOYMENT_ROLE"));
    assert.ok(names({ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: pg }, "warning").includes("DEPLOYMENT_ROLE"));
  });
  it("reports names and problems only, never values", () => {
    const text = JSON.stringify(configReport({ DATABASE_URL: "postgresql://u:hunter2@127.0.0.1/x", VERCEL_ENV: "production" }));
    assert.doesNotMatch(text, /hunter2/);
  });
});
