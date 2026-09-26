/**
 * Seed guard (INF-04).
 *
 * The demo seed deletes every organisation, user and internal record before it
 * writes. That is only acceptable on a local database that holds nothing but
 * earlier demo data. Every condition below must hold or the seed refuses to
 * run, before any write:
 *
 *  1. not a production or preview environment (NODE_ENV, VERCEL_ENV, APP_ENV);
 *  2. the database host is local (localhost, 127.0.0.1, ::1), unless
 *     SEED_ALLOW_HOST names that exact host;
 *  3. SEED_DEMO_PASSWORD is set explicitly, 12+ characters (no default);
 *  4. SEED_CONFIRM_RESET is exactly "wipe-local-demo-data";
 *  5. the database holds no organisation outside the demo set and no user
 *     outside the demo accounts, so unknown data is never overwritten.
 */
export const DEMO_ORG_SLUGS = ["threadline", "northbeam", "lumenpath", "dryrun"] as const;
export const DEMO_EMAIL_PATTERN = /^(ops|operator|editor)@threadline\.com$|@northbeamadvisory\.com$|@lumenpath\.example\.com$|@example\.com$/i;
export const CONFIRM_PHRASE = "wipe-local-demo-data";

export type SeedFacts = {
  env: Record<string, string | undefined>;
  databaseUrl: string | undefined;
  orgSlugs: string[];
  userEmails: string[];
};

export function seedRefusals({ env, databaseUrl, orgSlugs, userEmails }: SeedFacts): string[] {
  const out: string[] = [];
  for (const key of ["NODE_ENV", "VERCEL_ENV", "APP_ENV"]) {
    const v = env[key];
    if (v === "production" || v === "preview") out.push(`${key}=${v}: the demo seed never runs in production or preview.`);
  }
  let host = "";
  try {
    host = new URL(databaseUrl ?? "").hostname.replace(/^\[|\]$/g, "");
  } catch {
    out.push("DATABASE_URL is missing or not a URL.");
  }
  if (host && !["localhost", "127.0.0.1", "::1"].includes(host) && env.SEED_ALLOW_HOST !== host) {
    out.push(`Database host ${host} is not local. Set SEED_ALLOW_HOST=${host} only if this is a disposable database.`);
  }
  const pw = env.SEED_DEMO_PASSWORD;
  if (!pw || pw.length < 12) out.push("Set SEED_DEMO_PASSWORD (12+ characters). There is no default password.");
  if (env.SEED_CONFIRM_RESET !== CONFIRM_PHRASE) {
    out.push(`The seed deletes all organisations and users first. Set SEED_CONFIRM_RESET=${CONFIRM_PHRASE} to confirm.`);
  }
  const unknownOrgs = orgSlugs.filter((s) => !(DEMO_ORG_SLUGS as readonly string[]).includes(s));
  if (unknownOrgs.length) out.push(`Refusing to overwrite non-demo organisations: ${unknownOrgs.slice(0, 5).join(", ")}${unknownOrgs.length > 5 ? "…" : ""}.`);
  const unknownUsers = userEmails.filter((e) => !DEMO_EMAIL_PATTERN.test(e));
  if (unknownUsers.length) out.push(`Refusing to overwrite ${unknownUsers.length} non-demo user account(s).`);
  return out;
}
