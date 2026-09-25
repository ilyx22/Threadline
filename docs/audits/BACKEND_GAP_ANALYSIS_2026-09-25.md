# Backend gap analysis and implementation order (25 September 2026)

Read-only audit of the backend after the frontend freeze. Method: three code audits (application-to-client journey; client operations, reporting and jobs; integrations, security and production readiness), `npm run verify:features` on the seeded local database (69 pass, 2 empty, 6 blocked, 0 fail), `prisma migrate status` (13 migrations, up to date on SQLite), the unit suite (634 pass), and the Vercel project and build logs for the deployed `main`. Every claim below has a file reference; nothing is inferred from the docs alone.

## Verdict in one paragraph

The libraries are well built and tested to their boundaries, and the client portal, admin cockpit and onboarding work end to end on seeded data. What is missing is the joins and the plumbing that turn them into a running service: nothing converts an application into an organisation, the invite flow has no UI, no email leaves the system unless a separate worker process runs, no OAuth callback exists so no platform can actually be connected, no payment can be collected, the weekly report is never scheduled or sent, the learning-loop write actions have no UI, and the deployed target (Vercel, SQLite schema, SSO-protected preview) cannot serve real clients as configured. None of this is hard; most of it is a few days each. The order below is by what a first paying client hits first.

## The full application-to-client journey today

| Step | State | Evidence |
| --- | --- | --- |
| Public application submits, rate-limited, dedupes by email | Works | `src/lib/actions/application.ts:17-65` |
| Booking link | Env-only (`NEXT_PUBLIC_BOOKING_URL`), not per workspace | `src/lib/actions/booking.ts:10` |
| "Application received" email | Template exists, never sent | `src/lib/email/templates.ts:63`; nothing enqueues it |
| Admin review, status, notes | Works (status only) | `src/lib/actions/admin.ts:417`; `applications-client.tsx:66-133` |
| Application → Prospect | Works | `src/lib/actions/economics.ts:74-109` |
| Prospect → client organisation | **Missing.** Admin retypes into `/admin/clients/new`; `Application` has no `orgId`, `Prospect` has no org link | `admin.ts:74-230`; schema ~l.1394 |
| Create org + founder | Works, but the admin sets the founder's password; if the email already exists the password is silently ignored | `admin.ts:62,92,114-125` |
| Invite by email | Backend complete, **no UI calls it**; members UI sets passwords directly | `account.ts:101-121` vs `settings/members/members-client.tsx:23` |
| Accept invite, login, forgot/reset | Work | `(auth)/invite/page.tsx`; `actions/auth.ts:103`; `account.ts:33,58` |
| Email delivery | Only via the `email.send` job, only if `npm run jobs:worker` runs; default provider captures to `EmailMessage` | `email/index.ts:304-310`; `jobs/handlers.ts:14` |
| Onboarding (15 steps, build step, gate) | Works | `domain/onboarding.ts:116-244`; `actions/onboarding.ts:133-545`; `app/[org]/layout.tsx:37-43` |
| Weekly report | Generated on demand from the UI; **never scheduled, never emailed** | `reports/weekly.ts:125`; `templates.ts:57` unused |

## Gaps by area

### A. Journey and onboarding
1. No convert-to-client action from an application or prospect (the single largest join).
2. Invite flow unreachable from any UI; founder and member passwords are set by admins.
3. Application-received email never sent; weekly-report email never sent.
4. Booking URL is global, not per workspace (code comment says otherwise).
5. Existing-email edge case silently drops the entered password.

### B. Client operations and learning
6. Learning-loop write actions (`createRoot`, `recordExpectation`, `diagnoseContent`, `approveDiagnosis`, `recordCorrection`, `recordCorrectionVerdict`, `actions/learning.ts:60-523`) are imported by no page. The learning page and the report's learning section only fill from seed or QA data. This is the product's core promise (expected → actual → why → change → retest) and it has no UI.
7. Automatic metric refresh (`metrics.refresh`, `metrics.refresh_org`) and `maintenance.prune` are never enqueued; nothing schedules recurring jobs.
8. Publishing is manual entry only; `connector.publish` is never called; `actions/performance.ts:134` still uses the legacy adapter that always returns "unavailable".

### C. Integrations
9. **No OAuth start/callback route.** `oauth.ts` has PKCE, state and `persistConnection`, but nothing calls them, so no platform can be connected end to end.
10. Webhooks: Pipedrive, Attio and GoHighLevel have no replay window; unverified deliveries are stored (capped at 600/min/org).

### D. Payments
11. **No payment collection of any kind.** Stripe exists only as an inbound webhook writing `CommercialEvent`. Fees are numbers on `Organization`. The backlog records this as deliberately out of v1 ("invoiced directly"). A decision is needed: manual invoicing with a recorded payment, or Stripe invoicing/checkout.

### E. Security
12. `api/files` grants every file to any `internal_operator` membership in any org (`route.ts:47`).
13. SVG allowed through `image/*` and served inline from the app origin with no CSP: stored-XSS risk.
14. No CSP, no HSTS (`next.config.ts:3-9` has nosniff, frame DENY, referrer, permissions only).
15. Rate limiter trusts the first `x-forwarded-for` (`rate-limit.ts:154-158`), spoofable.
16. `SESSION_SECRET` documented as required but never read.
17. SSRF guard resolves DNS then fetches separately (small rebinding window).
18. CSRF relies on Next's Origin check and SameSite=lax only (acceptable, note it).

### F. Production readiness
19. **Database.** Schema is `provider = "sqlite"`; all 13 migrations are SQLite SQL (`DATETIME`, lock file sqlite). The documented Postgres switch (`HANDOFF.md` §8) would fail at `migrate deploy`. On Vercel serverless a SQLite file is ephemeral or read-only, so the deployed app cannot persist an application. A Postgres baseline migration is required.
20. **Deployment.** Two Vercel projects (`threadline`, `threadlinex`) both build `main` cleanly; `threadline` has SSO protection on all non-custom domains and no custom domain, so the public site is not publicly reachable. Environment variables could not be listed (permission), so `DATABASE_URL` in production is unverified.
21. **Worker.** Long-running `npm run jobs:worker` cannot run on Vercel; no cron config, no Dockerfile. The worker path loads the QA preload shims (`scripts/qa/preload.cjs`) in production.
22. **Seed.** `seed.ts:78` wipes and rebuilds with no environment guard and a default password for six accounts including a super_admin; `npm run setup` chains migrate into seed.
23. **Observability.** No error tracking, no structured logging, no health endpoint, no backup notes.
24. `verify:features` marks email as blocked even when Resend is configured (stale check at `:430`).

## Implementation order

Each phase is its own set of commits and can be verified alone. Phases 1 to 3 are what a first client needs; 4 to 6 are what running several clients needs.

**Phase 0. Decisions from the owner (blocking, no code).** Postgres host (Neon or Supabase are the obvious fits for Vercel); Resend sending domain; payment model (manual invoice + recorded payment, or Stripe invoicing); booking provider URL; custom domain; where the worker runs (Vercel Cron hitting a protected route, or a small always-on host).

**Phase 1. Make production real.** Postgres baseline migration and provider switch; seed guarded and password-required; `SESSION_SECRET` either used or dropped from docs; health endpoint; error tracking (Sentry or equivalent) and a request logger; worker without QA shims plus a Vercel Cron route that runs `--once`; custom domain and SSO protection off for it; env checklist verified against a real deployment. Exit test: an application submitted on the live domain persists and is visible in `/admin/applications`.

**Phase 2. Close the journey.** Convert-to-client from an application or prospect (creates org, links `Application.orgId` and `Prospect.orgId`, issues the founder invite instead of a password); invite UI in members settings; application-received email; fix the existing-email edge case; per-workspace booking URL. Exit test: apply → accept → founder receives invite → sets password → onboarding → workspace, with no admin-typed password anywhere.

**Phase 3. Operations that run without a person.** Weekly report generation as a scheduled job and the report email; metric refresh and prune scheduled; learning-loop UI (record expectation before publish, diagnose after, approve, correction, verdict) so the report's learning section fills from real work. Exit test: a seeded client receives a weekly report by email with a populated learning section.

**Phase 4. Security hardening.** `api/files` scoped to the asset's org for operators; SVG forced to download or rejected; CSP and HSTS; trusted-proxy handling for `x-forwarded-for`; replay windows for the three remaining webhook providers; DNS pinning in the URL fetcher. Exit test: the existing suites plus a small hardening test file.

**Phase 5. Integrations to the platform edge.** OAuth start/callback route, wired `connector.publish` behind the capability gate, retire the legacy adapter in `actions/performance.ts`, metric refresh on a schedule. Exit test: with one platform's credentials, connect, publish one record, ingest one metric. Still gated externally by platform reviews.

**Phase 6. Payments.** Per the Phase 0 decision. Minimum: a recorded-payment model per period with an admin action and a client-visible statement; full: Stripe invoicing with the webhook already in place updating the same records.

## What is intentionally not in this order

Semantic search, AI Brand Brain interview, real-time collaboration, server-side PDF, drag-and-drop, white-labelling, mobile, scraping (forbidden by doctrine), and the Judge in the approval path (uncalibrated by design). All remain in `FUTURE_BACKLOG.md`.
