/**
 * Environment validation (INF-05, INF-06).
 *
 * One place that knows which variables each deployment needs and what a
 * half-configured service looks like. `configReport` is pure (it takes the env
 * as input) so it can be tested and printed by `npm run env:check`; the health
 * route and the staff system screen read it. It never returns a value, only a
 * variable name and what is wrong with it.
 *
 * Environments: APP_ENV (production | preview | development | test) wins; on
 * Vercel it falls back to VERCEL_ENV; otherwise NODE_ENV.
 */
export type Level = "error" | "warning";
export type ConfigIssue = { level: Level; name: string; message: string };
export type AppEnv = "production" | "preview" | "development" | "test";

type Env = Record<string, string | undefined>;
const set = (env: Env, k: string) => Boolean((env[k] ?? "").trim());

export function appEnv(env: Env = process.env): AppEnv {
  const v = (env.APP_ENV ?? env.VERCEL_ENV ?? env.NODE_ENV ?? "development").trim();
  return v === "production" || v === "preview" || v === "test" ? v : "development";
}

/**
 * Which deployment this is when more than one Vercel project builds the same
 * branch (INF-05). Exactly one project is the primary: it runs the scheduled
 * job runner and may cause side effects. Any other project is a mirror: it
 * serves pages but never runs jobs, writes to the CRM, sends or charges.
 * Unset means primary, so a single-project setup needs nothing.
 */
export function deploymentRole(env: Env = process.env): "primary" | "mirror" {
  return (env.DEPLOYMENT_ROLE ?? "").trim() === "mirror" ? "mirror" : "primary";
}

/** True when production-only side effects (email, publishing, CRM writes, billing) may run. */
export function sideEffectsAllowed(env: Env = process.env): boolean {
  return appEnv(env) === "production" && deploymentRole(env) === "primary";
}

export function configReport(env: Env = process.env): { env: AppEnv; issues: ConfigIssue[] } {
  const e = appEnv(env);
  const deployed = e === "production" || e === "preview";
  const onVercel = set(env, "VERCEL");
  const issues: ConfigIssue[] = [];
  const add = (level: Level, name: string, message: string) => issues.push({ level, name, message });

  // Database
  const db = env.DATABASE_URL ?? "";
  if (!db) add("error", "DATABASE_URL", "Not set.");
  else if (!/^postgres(ql)?:\/\//.test(db)) add("error", "DATABASE_URL", "Must be a PostgreSQL URL.");
  else if (deployed && /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(db)) add("error", "DATABASE_URL", "Points at a local database on a deployed environment.");
  if (!set(env, "DIRECT_URL")) add(deployed ? "error" : "warning", "DIRECT_URL", "Not set. Migrations need the direct (unpooled) URL.");
  if (e === "preview" && db && db === env.PRODUCTION_DATABASE_URL) add("error", "DATABASE_URL", "Preview shares the production database.");
  const role = (env.DEPLOYMENT_ROLE ?? "").trim();
  if (role && role !== "primary" && role !== "mirror") add("error", "DEPLOYMENT_ROLE", 'Must be "primary" or "mirror".');
  if (role === "mirror" && db && db === env.PRODUCTION_DATABASE_URL) add("error", "DATABASE_URL", "A mirror deployment shares the primary's production database.");
  if (e === "production" && onVercel && !role) add("warning", "DEPLOYMENT_ROLE", 'Not set. If a second Vercel project builds the same branch, set "primary" on the canonical project and "mirror" on the other, or both run the scheduled jobs.');

  // Origin
  if (deployed && !set(env, "NEXT_PUBLIC_APP_URL") && !onVercel) add("error", "NEXT_PUBLIC_APP_URL", "Not set; links in emails and OAuth callbacks would be wrong.");
  if (e === "production" && !set(env, "NEXT_PUBLIC_APP_URL")) add("warning", "NEXT_PUBLIC_APP_URL", "Not set; the Vercel production hostname is used until a custom domain is configured.");

  // Credentials at rest
  if (!set(env, "CREDENTIAL_ENCRYPTION_KEYS")) add(e === "production" ? "error" : "warning", "CREDENTIAL_ENCRYPTION_KEYS", "Not set; no integration credential, webhook secret or staff two-factor secret can be stored.");

  // Email
  const email = env.EMAIL_PROVIDER ?? "capture";
  if (email === "resend") {
    if (!set(env, "RESEND_API_KEY")) add("error", "RESEND_API_KEY", "EMAIL_PROVIDER=resend but no API key.");
    if (!set(env, "EMAIL_FROM")) add("error", "EMAIL_FROM", "EMAIL_PROVIDER=resend but no sender address.");
    if (!set(env, "RESEND_WEBHOOK_SECRET")) add("warning", "RESEND_WEBHOOK_SECRET", "Not set: bounces and spam complaints are not recorded, so bad addresses keep being mailed.");
  } else if (e === "production") {
    add("warning", "EMAIL_PROVIDER", `Is "${email}": no email leaves the system (invitations, confirmations and resets show links on screen instead).`);
  }

  // Storage
  const storage = env.STORAGE_PROVIDER ?? "local";
  if (storage === "s3") {
    for (const k of ["S3_BUCKET", "S3_REGION", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) if (!set(env, k)) add("error", k, "STORAGE_PROVIDER=s3 but this is missing.");
  } else if (onVercel && deployed) {
    add("error", "STORAGE_PROVIDER", "Is local on Vercel, whose filesystem is read-only and not shared: uploads would fail. Use s3 (Cloudflare R2 or S3).");
  }

  // Media processing (FILE-05)
  if ((env.PROCESSING_PROVIDER ?? "none") === "webhook") {
    if (!/^https:\/\//.test(env.PROCESSING_ENDPOINT ?? "")) add("error", "PROCESSING_ENDPOINT", "PROCESSING_PROVIDER=webhook but no https endpoint.");
    if ((env.PROCESSING_WEBHOOK_SECRET ?? "").length < 16) add("error", "PROCESSING_WEBHOOK_SECRET", "PROCESSING_PROVIDER=webhook but the shared secret is missing or shorter than 16 characters.");
    if (storage !== "s3") add("error", "PROCESSING_PROVIDER", "Needs STORAGE_PROVIDER=s3: the worker fetches files with a signed storage URL.");
  }

  // Rate limiting and client IP
  const rl = env.RATE_LIMIT_STORE ?? "memory";
  if (rl === "redis") {
    for (const k of ["RATE_LIMIT_REDIS_URL", "RATE_LIMIT_REDIS_TOKEN"]) if (!set(env, k)) add("error", k, "RATE_LIMIT_STORE=redis but this is missing.");
  } else if (deployed && onVercel) {
    add("warning", "RATE_LIMIT_STORE", "Is memory: each serverless instance keeps its own window, so limits are weaker. Use redis (Upstash).");
  }
  if (deployed && !onVercel && !set(env, "TRUSTED_PROXY_HOPS")) add("warning", "TRUSTED_PROXY_HOPS", "Not set off Vercel: every caller shares one rate-limit bucket.");

  // Jobs
  if (deployed && !set(env, "CRON_SECRET")) add(e === "production" ? "error" : "warning", "CRON_SECRET", "Not set: the scheduled job runner refuses every call, so queued work (emails, reports) never runs.");

  // AI
  if (!set(env, "ANTHROPIC_API_KEY")) add("warning", "ANTHROPIC_API_KEY", "Not set: generation runs in labelled mock mode.");

  // Billing (BIL-02): test mode only in this build.
  if (set(env, "STRIPE_SECRET_KEY") && !(env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")) add("error", "STRIPE_SECRET_KEY", "Is not a test-mode key; live billing needs an explicit owner decision.");
  if (set(env, "STRIPE_SECRET_KEY") && !set(env, "STRIPE_WEBHOOK_SECRET")) add("warning", "STRIPE_WEBHOOK_SECRET", "Not set: Stripe payments will not be recorded automatically.");

  // Monitoring
  if (e === "production" && !set(env, "ERROR_REPORTING_DSN")) add("warning", "ERROR_REPORTING_DSN", "Not set: errors are logged but not reported to an error tracker.");

  // Things that must NOT be set on deployments
  if (deployed && set(env, "SEED_CONFIRM_RESET")) add("error", "SEED_CONFIRM_RESET", "Set on a deployed environment; remove it.");
  if (deployed && env.RATE_LIMIT_FAIL_OPEN === "true") add("warning", "RATE_LIMIT_FAIL_OPEN", "Limits switch off whenever the store is unreachable.");

  return { env: e, issues };
}
