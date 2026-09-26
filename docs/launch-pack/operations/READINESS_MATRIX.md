# Production readiness matrix (26 September 2026)

**Status words:**
- **Implemented:** the code exists.
- **Tested (simulated):** local PostgreSQL and mock or sandbox providers.
- **Configured:** production settings are present.
- **Verified live:** checked on the deployment.
- **Externally blocked:** needs an owner input.

**Live evidence (26 Sept 2026, read-only):**
- `https://threadline-fawn.vercel.app` (project `threadline`) and `https://threadlinex.vercel.app` (project `threadlinex`) both serve the approved site.
- Both `/api/health` endpoints answer `{"status":"down","database":false,"configErrors":5}`.
- Both `/api/cron/jobs` answer **503 "CRON_SECRET is not configured"**.

**Access limits:**
- The Vercel connector gets **403 Forbidden** when reading or creating environment variables and integrations, so no production setting can be changed from here.
- Entering secrets or database URLs into dashboards is not something this assistant may do.
- No database account exists to connect.

| Capability | Implemented | Tested (simulated) | Configured | Verified live | State / blocker |
| --- | --- | --- | --- | --- | --- |
| Public site | ✓ | ✓ marketing-v9 62/62 | ✓ | ✓ 200; frozen hashes match b344360 | Owner-approved |
| Primary/mirror isolation | ✓ `DEPLOYMENT_ROLE` | ✓ | ✗ | ✓ **threadlinex is inert**: no database, cron refused, no email or billing keys, so it cannot run jobs, email or billing today | Externally blocked: D-04 (retire it, or set `mirror` before any secret) |
| PostgreSQL + migrations (62) | ✓ | ✓ PostgreSQL 18, restore drill | ✗ | ✗ `database:false` | Externally blocked: create Neon (EU), set `DATABASE_URL`/`DIRECT_URL`, run `prisma migrate deploy` |
| Encryption keys, cron secret | ✓ | ✓ | ✗ | ✗ cron 503 | Externally blocked (owner generates and stores the secrets) |
| Email (Resend), webhook, suppression, idempotency | ✓ | ✓ simulated | ✗ | ✗ | Externally blocked. The domain's mail DNS is in place (Google MX and DMARC `p=none` verified live); Resend sending records are not verified |
| Private storage (R2/S3), uploads, processing, scan | ✓ | ✓ | ✗ | ✗ | Externally blocked |
| Scheduled jobs, duplicate protection | ✓ (claimed ticks, idempotency) | ✓ | ✗ | Partly: the endpoint refuses safely without its secret | Externally blocked |
| Monitoring, alerts | ✓ health, Sentry hooks | ✓ | ✗ | Partly: the health endpoint is live | Externally blocked (Sentry DSN, alert email) |
| Backups and recovery | ✓ drill | ✓ 113 tables | ✗ | ✗ | Externally blocked, plus decision D-03 |
| Authentication, invitations, client access, two-factor | ✓ | ✓ journeys 1–10 | ✗ | ✗ (no database) | Externally blocked |
| Billing (Stripe) | ✓ | ✓ test mode | ✗ | ✗ | Externally blocked, plus decision D-01 |
| Domain threadlinehq.com | n/a | n/a | Mail only | ✓ MX and DMARC; ✗ no web record | Decision D-02 |
| Booking | link setting only | n/a | Calendly research event live (per Drive) | Not verifiable (no Calendly access) | Decision D-02 (commercial event and links) |

**First-client production readiness: NO.** The database, secrets, email, storage, cron and monitoring are all externally blocked. The launch assets are drafted and awaiting owner review. The owner dry run is pending.
