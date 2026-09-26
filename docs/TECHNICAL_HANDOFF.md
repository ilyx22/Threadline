# Technical handoff: Threadline backend

For whoever maintains Threadline after this build. The older `HANDOFF.md` at the repository root describes the product surfaces in depth; this document covers the backend completed in September 2026: architecture, states, configuration, data, jobs, providers, operations and tests. The requirement-by-requirement record is `docs/implementation/BACKEND_COMPLETION_LEDGER.md`.

## 1. Architecture

- **Next.js 15 (App Router) on Vercel**, React 19, TypeScript, Tailwind v4. Server actions (`src/lib/actions/*`) are the write API; route handlers exist only where an outside party calls in (`/api/*`, `/t/[slug]`).
- **PostgreSQL through Prisma 6.** One schema (`prisma/schema.prisma`, 97 models). The pre-PostgreSQL SQLite schema and its 13 migrations are kept read-only under `prisma/legacy-sqlite/` with a reconciled transfer script.
- **Tenancy.** Every tenant table carries `orgId`. The only way code obtains an `orgId` is from `requireOrgAccess` / `requireInternal` in `src/lib/auth/guard.ts`, which resolve the workspace from the URL and the person from the session. Staff roles count only inside the internal organisation.
- **Background work** is a database queue (`Job`), run by `/api/cron/jobs` (daily Vercel cron plus "right after the request that queued it"), or by `npm run jobs:worker` on a long-lived box.
- **External systems** sit behind small adapters with injectable `fetch`, so every contract is tested without touching the live service: Resend (email), S3/R2 (files), Upstash (rate limits), Attio (CRM), Stripe (billing, test mode only), social platform connectors, Sentry-format error reporting.

## 2. Roles, profiles and permissions

| Role | Where | Can |
| --- | --- | --- |
| super_admin | user flag | everything, including deleting a tenant after retention |
| internal_operator | membership in the internal org only | all client workspaces; admin portal; finalising reports; billing |
| client_admin | client workspace | settings, members, approvals, commercial, billing view |
| client_member | client workspace | contribute; powers adjusted by profiles |
| editor | client workspace | production board and files |

Client **profiles** layer on the role (`src/lib/auth/roles.ts`, `effectiveCapabilities`): `approver` (approve ideas, scripts, finished pieces and packaging), `commercial` (pipeline, results, billing), `viewer` (read-only), `contributor` (default). A **suspended** membership grants nothing. The **owner** cannot be removed, suspended or demoted; ownership moves by explicit transfer (one owner per workspace, enforced by a partial unique index).

Staff **two-factor** (RFC 6238 TOTP, sealed secret, single-use codes, hashed recovery codes) is enforced in production. A password-only session counts as signed out everywhere except `/login/verify`.

## 3. State machines

- **Invitation**: pending → accepted | revoked | expired. Token stored as a SHA-256 hash; single use by conditional update; resend rotates the token; an existing account must sign in to accept (a link never sets its password); the wrong signed-in account is refused.
- **Engagement**: draft → active ⇄ paused → ended | terminated. Terms are frozen from the offer at creation (`offerSnapshot`). Periods are 28-day calendar dates in the workspace's timezone (`src/lib/commercial/calendar.ts`); pausing holds periods that have not started; resuming re-plans them from the resume date.
- **Approval** (`Approval`): each decision on one exact version (SHA-256 of material fields). An edit, a new script version or a new cut supersedes it; scheduling and publishing call `assertReleasable`.
- **Weekly report / four-week review**: draft → final. Final versions are immutable; a correction is a new version with a reason; clients see only the latest final version.
- **Invoice**: draft → issued → paid, or void (only unpaid). Balance = total − payments (refunds negative) − issued credit notes.
- **Renewal review**: open → renewed | expanded | paused | ended | handed_over, decided by a person.
- **CRM outbox row**: pending → sent | failed (retried) | needs_review | dead.
- **Offboarding**: started (export written, credentials deleted, jobs cancelled) → access ends → retention → confirmed deletion (evidence kept in `OffboardingRecord`).

## 4. Configuration

Every variable is listed with its purpose in `.env.example`. `src/lib/env.ts` validates them per environment (`APP_ENV`, else `VERCEL_ENV`, else `NODE_ENV`); run `npm run env:check`. Rules enforced there include: PostgreSQL URL required and never local on a deployment; a preview must not share the production database; S3 and Redis must be complete if chosen; `CRON_SECRET` and `CREDENTIAL_ENCRYPTION_KEYS` required in production; live Stripe keys refused; seed flags refused on deployments. `GET /api/health` reports database reachability and the number of configuration errors (never values).

Only production (`sideEffectsAllowed`) writes to the CRM. Email goes to the `capture` provider unless `EMAIL_PROVIDER=resend`.

## 5. Data and migrations

Migrations in `prisma/migrations` are forward-only and never edited once applied:

| Migration | Adds |
| --- | --- |
| 20260926000000_postgres_baseline | the PostgreSQL schema (77 tables at the time) |
| …054056_identity_security_team | two-factor, session verification, invitations, work assignments, membership profiles/status/owner/expert/contact (+ one-pending-invite and one-owner indexes, backfill) |
| …055447_commercial_engagements | offers (standard offer row), engagements, service periods, scope changes, CRM outbox and links (+ engagement backfill) |
| …060826_versioned_approvals | approvals, review batches, comment version |
| …063000_report_versions_period_reviews | report versions, four-week reviews (+ one-draft indexes) |
| …070000_billing | invoices, lines, payments, disputes, agreements, reminders (+ number sequence, one-live-invoice index) |
| …073000_offboarding | offboarding fields and record |
| …080000_notification_preferences | notification dedupe, preferences |
| …083000_ai_cost_budget | AI run cost and demo flag, workspace AI budget |
| …090000_renewals | renewal reviews |
| …093000_proof_placements | proof expiry/scope, placements |

Deploy: `npx prisma migrate deploy` with `DIRECT_URL` set. Local database: `npm run db:local` (embedded PostgreSQL 18 on port 55432, data in `.pg-data/`).

**Data inventory and subprocessors**: client workspaces hold people (name, email, role), content, files, metrics, commercial events, invoices and payments, audit logs. Subprocessors when configured: Vercel (hosting), Neon (database), Cloudflare R2 (files), Resend (email), Upstash (rate limits), Anthropic (AI), Attio (Threadline's CRM), Stripe (billing), Sentry/GlitchTip (errors), and each social platform a client connects. Secrets at rest (platform tokens, webhook credentials, two-factor secrets) are AES-256-GCM sealed with `CREDENTIAL_ENCRYPTION_KEYS`. Session tokens and invitation tokens are stored only as hashes.

## 6. Jobs

| Type | Queued by | Does |
| --- | --- | --- |
| email.send | invitations, confirmations, reports, reviews, approved reminders, notifications, digests | sends through the configured provider; idempotency key per message |
| crm.sync | CRM outbox writes | sends one outbox row to Attio |
| daily.tick | the cron runner, once per UTC day | extends service periods; drafts due invoices and overdue reminders (never sends); opens renewals; flags withdrawn proof uses; closes access after offboarding windows; escalates stale approvals; sends opted-in digests; prunes tokens and sessions |
| metrics.refresh(_org), maintenance.prune | existing | platform metrics refresh; housekeeping |

Leases are five minutes; completion and failure are conditional on the lease holder; retries back off exponentially with jitter; dead jobs are listed on **Admin → System** with a requeue button.

## 7. Providers

| Provider | What is implemented | Test level | Live gate |
| --- | --- | --- | --- |
| Resend | transactional email | contract (capture provider in tests) | domain verification |
| S3 / R2 | private storage with content sniffing | contract with mocked HTTP | bucket and keys |
| Upstash | shared rate limits, fails closed | contract | database |
| Attio | companies (match on domain), people (match on email), deals (create then patch by id) through an outbox | contract with mocked HTTP | API key |
| Stripe | customers, invoices, items, finalise, void; billing webhook | contract with mocked HTTP; test mode only | test keys, webhook secret |
| Webhooks in | Stripe, HubSpot (v3), Pipedrive (basic auth), Attio (HMAC), HighLevel (Ed25519 + location) | unit tests with real signatures | per-client credentials |
| LinkedIn, YouTube, Instagram, TikTok, X | OAuth start/callback, publish and metrics connectors | contract with mocks | platform app review |
| Facebook / Threads | not built | — | Meta app review |
| Anthropic | generation with cost records and budgets | demo provider in tests | API key |

## 8. Deployment and rollback

- `main` deploys to both Vercel projects (`threadline` → threadline-fawn.vercel.app, `threadlinex` → threadlinex.vercel.app). **`threadline` is canonical** (`DEPLOYMENT_ROLE=primary`); `threadlinex` must be `DEPLOYMENT_ROLE=mirror` with its own database or none, and a mirror never runs the queue or causes side effects. The separation table (database, cron, keys per environment) is in `docs/implementation/DEPLOYMENT_INVESTIGATION.md`. Branch pushes build previews; `master` does not build (`vercel.json`).
- The Hobby plan allows 100 deployments a day across both projects. On 26 September pushes stopped deploying for seven hours because of it. Push work branches once, not per commit.
- Before promoting: `npm test` and `node scripts/qa/run.cjs run-all` against a local PostgreSQL; `npx next build`; the public regression suite `node scripts/qa/run.cjs marketing-v9` against a production build.
- Roll back application code with Vercel's "Promote" on the previous production deployment. Migrations are additive, so older code runs against a newer schema; never roll a migration back by hand. If a migration must be undone, write a new forward migration.
- If a push to `main` shows no deployment, check the deployment count for the past 24 hours before anything else (see the investigation).

## 9. Backup, incidents and retention

- Backups: the managed database's point-in-time recovery. The restore procedure is rehearsed by `npm run db:drill` (logical backup, restore into a fresh migrated database, per-table reconciliation); last evidence in `docs/implementation/evidence-restore-drill.json`.
- Incident first steps: check `/api/health`; **Admin → System** for configuration errors, dead jobs, CRM backlog, refused webhooks and email failures; the error tracker; Vercel runtime logs (JSON lines with request context, emails masked, secrets redacted).
- Revoking access fast: suspend the membership (effective on the next click); for staff, remove the internal membership; **Account security** lets anyone end their other sessions; a super admin can reset a colleague's two-factor (`resetMfaForUser`).
- Retention: offboarding sets an export window and a retention date; deletion is a super admin's typed confirmation, blocked by legal hold. Financial records (invoices, payments) are not deleted with the tenant.

## 10. Tests

| Command | What | Last result |
| --- | --- | --- |
| `DATABASE_URL=<local pg> npm test` | unit and database tests | 727 passed, 0 failed |
| `node scripts/qa/run.cjs run-all` | tenancy, workflow, diagnosis, corpus, attribution, hostile input, onboarding, sales, reports, core spine (3 engagements), acceptance journeys 1, 2, 8 | 526 checks passed, 0 failed, 1 partial (print export has no server-side PDF) |
| `node scripts/qa/run.cjs marketing-v9` (against a production build) | public site regression | 62 passed |
| `npm run db:drill` | backup and restore | passed, 97 tables |
| `npx tsc --noEmit`, `npx eslint` | types and lint | clean |

## 11. Supported manual operations

- **Publishing without a connected platform**: approve the package, post it by hand, record the URL on the publish record; import the numbers by CSV on the Performance page.
- **Invoicing without Stripe**: issue the drafted invoice, send it from your accounting tool, record payments with their evidence.
- **CRM without Attio**: the outbox holds every change until a key is configured; nothing is lost.
- **Email without Resend**: invitation and reset links are shown on screen to send yourself.
