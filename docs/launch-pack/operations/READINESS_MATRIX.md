# Operational readiness matrix (27 September 2026)

Five separate states per component. A tick means verified, with the evidence named. Tests passing locally never counts as "verified live".

| State | Meaning |
| --- | --- |
| **Implemented** | The code exists |
| **Tested (simulated providers)** | Passes local tests against PostgreSQL and mock or sandbox providers |
| **Configured** | Production environment variables and services are set |
| **Verified live** | Checked on the production deployment |
| **Owner-approved** | The owner has signed it off |

**Live evidence (27 Sept 2026, read-only GET):**
- `https://threadline-fawn.vercel.app/` returns 200.
- `/api/health` returns `{"status":"down","database":false,"configErrors":5,"env":"production","commit":"b344360"}`.
- The public site is live. Everything behind sign-in is not.

| Component | Implemented | Tested (simulated) | Configured | Verified live | Owner-approved | Owner action (checklist §) → verification |
| --- | --- | --- | --- | --- | --- | --- |
| Public site (marketing-v9) | ✓ | ✓ marketing-v9 62/62 (re-run this pass) | ✓ | ✓ home 200 at b344360 | ✓ layout approved; copy corrections this pass pending review | Review the claims audit changes → re-run marketing-v9 |
| Primary/mirror separation | ✓ `DEPLOYMENT_ROLE` | ✓ unit tests (mirror refuses cron, email, billing) | ✗ | ✗ | ✗ | §0: set `primary` on threadline; set `mirror` on threadlinex, or disconnect its Git → `/api/cron/jobs` on the mirror answers "skipped" |
| Database and migrations | ✓ (Prisma, 60+ migrations incl. 2 new this pass) | ✓ local PG 18, restore drill | ✗ | ✗ health `database:false` | ✗ | §1: Neon EU; set `DATABASE_URL`/`DIRECT_URL`; `prisma migrate deploy` → health `database:true`, `migrate status` up to date |
| Secrets (encryption keys, cron secret, auth) | ✓ | ✓ | ✗ | ✗ (5 config errors) | ✗ | §2 → `npm run env:check` clean; health `configErrors:0` |
| Storage (S3/R2) and CORS | ✓ | ✓ S3 adapter tests | ✗ | ✗ | ✗ | §4 → upload > 10 MB succeeds; no CORS error |
| Email (Resend) and webhook | ✓ idempotency keys, suppression | ✓ simulated | ✗ | ✗ | ✗ | §3 → invitation email arrives; webhook event recorded |
| DNS email authentication (SPF/DKIM/DMARC) | n/a | n/a | Reported complete by the owner earlier | Not re-verified in this pass (no contrary evidence; not reset) | ✓ as reported | Only if delivery fails: check the Resend domain status |
| Cron / job runner | ✓ | ✓ | ✗ | ✗ | ✗ | §2 `CRON_SECRET`; Vercel cron → manual run returns `ran` |
| Monitoring and rate limits | ✓ health, Sentry hooks, rate limiter | ✓ | ✗ | Partly (health endpoint answers) | ✗ | §5 → alerts reach the owner; limits use Redis |
| Backups and recovery | ✓ drill script | ✓ drill 113 tables | ✗ | ✗ | ✗ RPO/RTO undecided | §1 PITR ≥ 7 days; decide RPO/RTO (options below) → `npm run db:drill` on a Neon branch |
| Billing (Stripe) | ✓ | ✓ test mode only | ✗ | ✗ | ✗ offer defaults unconfirmed | §6 → a test invoice in Stripe test mode; the live key only after approval |
| Social publishing | ✓ per platform | ✓ sandboxed | ✗ | ✗ | ✗ | §7 per platform (each is a feature) |
| Processing worker and malware scan | ✓ | ✓ | ✗ | ✗ | ✗ | §4 FILE-05 choice → a transcript appears after upload |
| AI provider | ✓ | ✓ mock | ✗ | ✗ | ✗ | §8 key → a generation records a real model and cost |
| Research: Apify (new, optional) | ✓ | ✓ 6 unit tests, stubbed network | ✗ (off) | ✗ | ✗ | O-11 → see the research provider audit |
| Booking events | ✗ (link only) | n/a | ✗ `NEXT_PUBLIC_BOOKING_URL` empty | ✗ | ✗ | O-05: create 15-minute research and 45-minute diagnosis events; set the URL |
| Acquisition funnel (touches, demand source) | ✓ (new) | ✓ unit + QA | n/a | ✗ (needs DB) | ✗ | — |
| Research gate split | ✓ (new) | ✓ unit + QA | n/a | ✗ (needs DB) | ✗ | Owner reviews the rule (strategy §2) |

**Verdict: first-client production readiness is NO.** The code and assets are ready for review. Production has no database, secrets, email, storage, cron or monitoring configured, and none of the launch assets is owner-approved yet. Launch readiness is a business state, not a test result.
