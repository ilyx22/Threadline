# Backend completion ledger

The durable record of the backend completion brief (`BACKEND_COMPLETION_BRIEF.md`). **On every resumption: read this file, run `git log --oneline -15` and `git status`, then continue from the first row in the "Work order" whose status is not IMPLEMENTED_TESTED / LIVE_VERIFIED / EXTERNAL_CONFIGURATION_REQUIRED-with-code-done.**

Statuses: EXISTING_VERIFIED · PARTIAL · MISSING · IMPLEMENTED_TESTED · EXTERNAL_CONFIGURATION_REQUIRED · PROVIDER_UNSUPPORTED · OWNER_DECISION_REQUIRED · LIVE_VERIFIED. A mock or contract test is never LIVE_VERIFIED.

## Snapshot at start (26 September 2026)

| Item | Value |
| --- | --- |
| Branch / commit at start | `frontend/visual-rebuild-v5` @ 6e00e4a (public site). Backend work on `backend/completion`, merged to `main` only at verified checkpoints |
| Deployed revision | threadlinex and threadline-fawn: 6e00e4a (Vercel, `main`) |
| Runtime | Node 24.15, Next 15, React 19, Prisma 6.19.3 |
| Database at start | SQLite (`prisma/dev.db`, seed + QA data only: 4 orgs incl. demo Northbeam/Lumenpath, 6 seed users, 5 test applications; no real client data). Vercel production had a SQLite URL on a read-only serverless filesystem, so no production data can exist |
| Migrations at start | 13 SQLite migrations (now preserved under `prisma/legacy-sqlite/migrations`) |
| Models / actions / tests | 77 models, ~172 server actions, 42 test files / 634 tests |
| Route handlers | `api/files/[...path]`, `api/webhooks/[provider]`, `t/[slug]` |
| Env names in use | DATABASE_URL, DIRECT_URL, SESSION_SECRET (unused), CREDENTIAL_ENCRYPTION_KEYS, EMAIL_PROVIDER/RESEND_API_KEY/EMAIL_FROM, STORAGE_PROVIDER/S3_*, RATE_LIMIT_STORE/UPSTASH_*, ANTHROPIC_API_KEY/ANTHROPIC_MODEL, NEXT_PUBLIC_BOOKING_URL, SEED_DEMO_PASSWORD |
| Drive sources | SRC-DRIVE: the brief mentions linked Drive sources; no links arrived with the brief, so none were read. The brief's explicit strategy requirements are the operative source |
| Public freeze | Approved site = threadline-fawn.vercel.app @ 6e00e4a. Protected-file hashes: `docs/implementation/evidence-public-freeze.txt` |

## Concept glossary (brief §2)

- **Signal**: one observed item of market evidence (a question, objection, phrase, trend) with its source and time. Model: `CandidateSignal`, `ResearchItem`.
- **Pattern**: a recurring signal across sources, with evidence links. Model: `Pattern`, `PatternEvidence`.
- **Idea**: a proposed piece of content derived from signals/patterns/sources. Model: `Idea`, `IdeaEvidence`.
- **Root**: the underlying argument that ideas, scripts, clips and derivatives trace back to (ROOT_ID lineage). Model: `ContentRoot`.
- **Expectation**: a frozen, pre-publication prediction for one piece (hypothesis, baseline, predicted class, confidence, rubric version). Model: `ContentExpectation`.
- **Diagnosis**: an operator-reviewed explanation of the gap between expectation and actual, with failure class and evidence. Model: `ContentDiagnosis`.
- **Correction**: the one change made in response to an approved diagnosis, with owner, next test and later verdict. Model: `CorrectionEntry`.

## Work order (dependency order from the brief)

Status key per row. "Evidence" names the test or proof.

### Stage 0 · Foundation and infrastructure (§3)

| ID | User outcome | Existing code | Gap | Deps | Status | Tests / evidence | External gate | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INF-01 | App runs on managed PostgreSQL | schema was SQLite | provider switch + PG baseline | none | IMPLEMENTED_TESTED | 727 unit tests and 526 QA checks on local PostgreSQL 18; 9 forward-only migrations apply to an empty database | Managed PG (Neon) account + Vercel env | Owner: create the managed PostgreSQL database (Neon) and set DATABASE_URL/DIRECT_URL in Vercel; then run prisma migrate deploy |
| INF-02 | Existing data preserved | SQLite dev.db | transfer + reconciliation | INF-01 | IMPLEMENTED_TESTED | `scripts/db/sqlite-to-postgres.ts`; evidence JSON: 77 tables / 1,276 rows reconciled | none (no production data exists) | done |
| INF-03 | PG used for DB-sensitive tests | tests hit dev.db | PG test DB + isolated fixtures | INF-01 | IMPLEMENTED_TESTED | all unit tests and all QA suites run on embedded PostgreSQL 18 (npm run db:local); each test creates and removes its own synthetic tenant | none | done |
| INF-04 | Explicit migrations, safe seed | `setup` ran seed; seed wipes all data unguarded | guard seed; explicit migrate; no shared prod creds | INF-01 | IMPLEMENTED_TESTED | src/lib/db/seed-guard.test.ts; seed refused on local PG without confirmation (exit 1, data intact) | none | done |
| INF-05 | Env separation prod/preview/test | none | env model + preview guards | INF-06 | IMPLEMENTED_TESTED | env.ts appEnv/sideEffectsAllowed; DEPLOYMENT_ROLE primary/mirror (a mirror never runs jobs or side effects, and may not use the primary's database); env.test.ts; separation table in docs/implementation/DEPLOYMENT_INVESTIGATION.md | Vercel env config | Blocker: missing configuration. Owner sets DEPLOYMENT_ROLE=primary on threadline and mirror on threadlinex (OWNER_ACTIVATION_CHECKLIST section 0) |
| INF-06 | Validated env + health | none | env schema, `/api/health`, internal health | none | IMPLEMENTED_TESTED | npm run env:check; GET /api/health (db + config error count, no values); env.test.ts | none | Verify /api/health on the live deployment after PG is configured |
| INF-07 | Email/storage/throttle/monitoring adapters | Resend, S3 (SigV4), Upstash exist; no Sentry | monitoring adapter; config visibility | INF-06 | IMPLEMENTED_TESTED | log.ts reportError sends Sentry-format envelopes (log.test.ts); Resend/S3/Upstash adapters; two-factor reset for super admins on the system screen | Resend key/domain, R2 bucket, Upstash, Sentry DSN | Owner: ERROR_REPORTING_DSN, RESEND_API_KEY, S3_*, RATE_LIMIT_REDIS_* |
| INF-08 | Backups + restore drill | none | backup/restore runbook + local restore test | INF-01 | IMPLEMENTED_TESTED | npm run db:drill: logical backup, restore into a freshly migrated scratch database, per-table reconciliation; evidence-restore-drill.json (97 tables, 1,916 rows) | Neon PITR config | Owner: enable point-in-time recovery on the managed database; rerun the drill against a Neon branch |
| INF-09 | Recovery objectives, runbooks | none | RPO/RTO pending owner; deploy/rollback runbooks | INF-08 | OWNER_DECISION_REQUIRED | Deployment, rollback, backup and incident procedures written in TECHNICAL_HANDOFF.md | OWNER_DECISION_REQUIRED (RPO/RTO) | Owner sets recovery point and time objectives |
| INF-10 | Structured redacted logs + alerts | console only | logger with request/tenant/job IDs, redaction; alerts | INF-06 | IMPLEMENTED_TESTED | log.ts JSON lines with redaction (secrets, emails); unhandled action errors reported with a support reference | alert destination | Alert destination is the error tracker (owner DSN) |

### Stage 1 · Security and identity (§4, §9 files, §17)

| ID | User outcome | Existing code | Gap | Deps | Status | Tests / evidence | External gate | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Staff access only via the internal org | `hasInternalOperatorRole` accepts an internal role in ANY org | scope to `kind:"internal"`; block internal roles in client orgs | none | IMPLEMENTED_TESTED | roles.test.ts (staff roles never mintable in client orgs); guard ignores staff roles outside the internal org; tenancy suite 86/86 | none | done |
| SEC-02 | Files readable only by authorised callers | `api/files` lets any-org operators read all files; SVG inline | scope by asset org + assignment; force download for active types; reject SVG | SEC-01 | IMPLEMENTED_TESTED | sniff.test.ts; hostile-input suite (SVG and HTML-as-PNG refused); file route serves only images/video/audio inline, sandboxed, no-store | none | done |
| SEC-03 | Trusted client IP | first X-Forwarded-For | trusted-proxy handling (Vercel `x-vercel-forwarded-for` / platform IP) | none | IMPLEMENTED_TESTED | client-ip.test.ts; Vercel headers or TRUSTED_PROXY_HOPS only | none | done |
| SEC-04 | CSP + HSTS without breaking public site | none | headers + public regression check | none | IMPLEMENTED_TESTED | next.config.ts CSP/HSTS/COOP; public marketing-v9 suite 62/62 on a production build with the headers | none | Recheck live headers after deploy |
| SEC-05 | Webhook integrity | unverified events stored and claim the id | only verified events claim ids; replay windows per provider contract | none | IMPLEMENTED_TESTED | webhooks.test.ts: Stripe/HubSpot/Attio HMAC, Pipedrive basic auth, HighLevel Ed25519 + location, replay windows, forged event cannot block genuine, concurrent duplicate | provider secrets | Owner: store each client's webhook credential on Settings > Integrations (staff only) |
| SEC-06 | Per-account login throttle | per-IP only | account-key throttle | SEC-03 | IMPLEMENTED_TESTED | per-account window keyed by email hash; tenancy suite login checks | none | done |
| SEC-07 | Session rotation, device list, revoke | no rotation/list | rotate on privilege change; list/revoke | none | IMPLEMENTED_TESTED | rotateSession on second-factor verify and enrolment; /account lists and revokes sessions | none | done |
| SEC-08 | Staff MFA (TOTP + backup codes) | none | enrolment, verification, recovery, enforcement for staff | SEC-01 | IMPLEMENTED_TESTED | totp.test.ts (RFC 6238 vectors), mfa.test.ts (sealed secret, replay refused, recovery codes single use); /login/verify; staff enforcement in production | none | Owner: enrol an authenticator on first staff sign-in in production |
| SEC-09 | SESSION_SECRET dead config | unused | use or drop | none | IMPLEMENTED_TESTED | SESSION_SECRET removed from docs: sessions are random tokens stored as SHA-256 digests; nothing to sign | none | done |
| SEC-10 | SSRF DNS pinning | resolve-then-fetch | pin resolved IP | none | IMPLEMENTED_TESTED | fetch-url.ts: pages and metadata fetched through node http/https with a guarded DNS lookup, so the checked address is the connected address; fetch-url.test.ts (EPRIVATE at connect time); verified against a live public page | none | done |
| SEC-11 | Credential encryption with key versions | AES-GCM keyring | rotation command | none | EXISTING_VERIFIED | AES-GCM keyring with key ids; secret-box tests cover rotation readability | key custody | Add a reseal command when keys rotate (resealCredential exists; no CLI) |
| SEC-12 | Cache boundaries per user/tenant | dynamic pages | verify no shared caching of authed responses | none | IMPLEMENTED_TESTED | security/cache-audit.test.ts (no authenticated route static or revalidated, no untenanted cross-request cache); live headers on signed-in pages: private, no-cache, no-store | none | done |

### Stage 2 · Client teams (§4)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEAM-01 | Five client permission profiles (admin, approver, contributor, viewer, commercial) | roles client_admin/client_member/editor | profile flags on Membership, capability mapping | SEC-01 | IMPLEMENTED_TESTED | roles.test.ts effectiveCapabilities (approver, viewer, commercial); membership.profiles; backfilled from roles | none | done |
| TEAM-02 | Invitation model (pending, hashed token, grant, inviter, expiry, state, audit) | AuthToken invite; user pre-created with fake hash | Invitation model; no user/membership before accept | TEAM-01 | IMPLEMENTED_TESTED | Invitation model; team.test.ts (no account before acceptance, one pending per address via partial unique index) | none | done |
| TEAM-03 | Safe acceptance (existing vs new user, wrong account, single use, POST only, idempotent) | accept page | rework | TEAM-02 | IMPLEMENTED_TESTED | team.test.ts (existing account never has its password set by a link, wrong account refused, concurrent accept single winner, idempotent repeat); core-spine founder acceptance | none | done |
| TEAM-04 | Resend/revoke/expire, rate limit, no duplicates | none | implement | TEAM-02 | IMPLEMENTED_TESTED | resend rotates token with cooldown and cap; revoke; daily expiry job | none | done |
| TEAM-05 | Role change, suspend, remove, transfer; immediate loss of access | partial actions | target-type checks, suspension, access cut | TEAM-01 | IMPLEMENTED_TESTED | suspend/reinstate; guard ignores suspended memberships; team.test.ts | none | done |
| TEAM-06 | Last admin/owner protected, explicit ownership transfer, race-safe | count check on remove only | owner designation + transactional transfer | TEAM-01 | IMPLEMENTED_TESTED | isOwner with one-owner partial unique index; transfer in a serialisable transaction; owner cannot be removed, suspended or demoted | none | done |
| TEAM-07 | Reassign stranded tasks/approvals; operator sees stranded work | none | implement | TEAM-05 | IMPLEMENTED_TESTED | open tasks of a suspended/removed member return to the unassigned queue (team.test.ts); strandedWork() for the operator queue | none | Show strandedWork in the operator cockpit (OPS-01) |
| TEAM-08 | Multiple experts with individual voice profiles; primary + backup contact | isPrimary unused | expert flag + voice link; primary/backup | TEAM-01 | IMPLEMENTED_TESTED | Membership.voiceNotes per expert; script generation for a named expert leads with their voice; team/expert-voice.test.ts | none | done |
| TEAM-09 | Contractor/editor assignment-scoped access; QA reviewer | editor role (client membership) | assignment model; scoped reads | SEC-01 | IMPLEMENTED_TESTED | team/scope.ts: editors see and act on assigned pieces only (board, piece page, actions, library, files, tasks, scripts, distribution, search); file route counts only active memberships; scope.test.ts; QA roles and journey 4 checks | none | done |
| TEAM-10 | Members UI without admin-typed passwords | members-client with password field | invite UI | TEAM-02 | IMPLEMENTED_TESTED | members screen rebuilt around invitations; addMemberAction and the admin-set founder password removed | none | done |

### Stage 3 · Commercial conversion and Attio (§6, §7)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COM-01 | Application confirmation + operator notification (one each) | template unused | enqueue on submit | JOB-01 | IMPLEMENTED_TESTED | one applicant confirmation and one operator alert per new application, idempotency keys | Resend | Owner: OPS_NOTIFY_EMAIL and Resend for real delivery |
| COM-02 | Application qualification fields (owner, next action, due, outcome) | status only | fields + UI | none | IMPLEMENTED_TESTED | owner/next action/due/outcome/reason on applications; admin qualification form | none | done |
| COM-03 | Convert application/prospect → workspace + engagement + founder invitation (idempotent, returning clients) | createClientAction (password, non-atomic) | convert command | TEAM-02, ENG-01 | IMPLEMENTED_TESTED | provisionClientWorkspace in one transaction, idempotent conversion, founder invited as owner (commercial.test.ts; core-spine) | none | done |
| COM-04 | Attio sync: mapping, remote IDs, outbox, retries, reconciliation, dead letters, manual resolution | Attio webhook only (wrong signature scheme) | full sync | JOB-01 | IMPLEMENTED_TESTED | CrmOutbox/CrmLink; Attio client per documented API; commercial.test.ts with mocked Attio (dependency order, no double send, review parking); production-only sends | Attio API key + workspace | Owner: ATTIO_API_KEY (and ATTIO_STAGE_MAP if stages differ); first live sync is EXTERNAL_CONFIGURATION_REQUIRED |
| COM-05 | Separate prospect research / deal stage / delivery status | Prospect state | explicit separation | COM-04 | EXISTING_VERIFIED | Prospect state, deal stage (CRM outbox) and delivery status (engagement) are separate records | none | done |
| COM-06 | Threadline deal value vs prospect economics stored separately | economics fields | verify | none | EXISTING_VERIFIED | Threadline fees on Engagement; the prospect's own economics on Prospect | none | done |
| COM-07 | Acquisition: ICP research, briefs, script variants, objection logs, follow-up queues, human-reviewed drafts, no auto-send | sales scripts, calls | follow-up queue + drafts | none | IMPLEMENTED_TESTED | sales/follow-ups.ts: due prospect actions and unread applications become owner tasks daily; queue on /admin/prospects; follow-ups.test.ts | none | done |
| ENG-01 | Engagement + agreement version, scope, entitlements, 28-day periods, activation date, pause/terminate | fees on Organization; periods computed from startedAt | Engagement + ServicePeriod models | none | IMPLEMENTED_TESTED | Engagement/ServicePeriod; activate/pause/resume/end; commercial.test.ts | none | done |
| ENG-02 | Offer config (£2,500 + £2,500/4 weeks × 3, £10,000) with preserved signed terms | fees on org | OfferTemplate + snapshot onto engagement | ENG-01 | IMPLEMENTED_TESTED | OfferTemplate standard £2,500 + £2,500/28 days x3 (= £10,000); terms frozen into offerSnapshot; live fees change only by scope change | owner confirms defaults | Owner confirms the defaults |
| ENG-03 | Installation checklist + early win date | onboarding sessions | installation record | ENG-01 | IMPLEMENTED_TESTED | commercial/installation.ts: client sign-off refused until every checklist item is complete; early win agreed in words, actual date and evidence recorded; installation.test.ts | none | done |
| ENG-04 | Versioned creative brief / per-person voice; invalidates downstream drafts | BrandBrain | versioning + invalidation | TEAM-08 | IMPLEMENTED_TESTED | Brand Brain versioned by a database trigger; AI drafts record the version used; stale drafts listed; restore as new version; ai/brain-versions.test.ts | none | done |
| ENG-05 | Scope changes with approval and effective version | none | model + flow | ENG-01 | IMPLEMENTED_TESTED | ScopeChange propose/decide with fee change from a named period (commercial.test.ts) | none | done |
| ENG-06 | DST-safe tenant timezone calendars | none | tz on org; storage in UTC; 28-day math | ENG-01 | IMPLEMENTED_TESTED | calendar.test.ts (DST weekends, year end, leap day, local-date conversion) | none | done |

### Stage 4 · Client experience and delivery (§5, §8, §9)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-01 | Home: needs you / needs your colleague / Threadline working, from real records | Home/This Week | role-aware split | TEAM-01 | IMPLEMENTED_TESTED | Home splits needs-you (role-aware) from waiting-on-colleagues (with names) and Threadline working; screenshots of /app/northbeam | none | done |
| CX-02 | Review batches, safe bulk decisions on selected current versions | approvals page | batch + stale checks | DEL-02 | IMPLEMENTED_TESTED | Bulk approval pinned to the versions shown; changed items skipped (workflow suite) | none | done |
| CX-03 | Save/resume, deep links after sign-in | safePath exists | verify | none | EXISTING_VERIFIED | safePath next-redirects after sign-in and second factor | none | done |
| CX-04 | Operator prefill of Brand Brain/ICP/voice; progressive onboarding | onboarding flow | prefill + client confirm | ENG-04 | IMPLEMENTED_TESTED | Brand Brain sections written by staff are marked prefilled until the client confirms (client edits confirm); confirm banner on the Brand Brain page; verified through the real actions | none | done |
| CX-05 | Voice notes/files/links with provenance | uploads | provenance fields | FILE-01 | IMPLEMENTED_TESTED | Asset.source, sourceNote and rootId recorded on every creation path (upload, direct, voice note, link, test clip, processing, export); shown on library cards | none | done |
| CX-06 | Consolidated comments per asset/version; internal notes stay internal | Comment model | visibility flag + version binding | DEL-02 | IMPLEMENTED_TESTED | Every comment and revision request records the version seen (taken before the revision count moves) and is marked when it concerns an earlier cut | none | done |
| CX-07 | Client help/recording guide + support request with owner/status | support page (admin) | client request path | none | IMPLEMENTED_TESTED | Help page: any member raises a support request into the operators' queue; operators notified; support/requests.test.ts | none | done |
| CX-08 | Measure founder input time, approval time, revision rounds, operator effort | none | effort records | DEL-01 | IMPLEMENTED_TESTED | EffortEntry (founder, team, operator, editor minutes per step); weekly totals with unrecorded weeks shown as such; founder-hour check; Time page; effort/effort.test.ts | none | done |
| DEL-01 | Connected pipeline with server-validated transitions, owner/due/deps/blocker/history on every item | workflow.ts transitions | owner/due/blocker uniformity; written path skips recording | none | IMPLEMENTED_TESTED | Pieces: editor, due date and blocker with blocked/unblocked history, shown in the operator queue; scripts: owner, due date, blocker; verified through the real actions | none | done |
| DEL-02 | Exact-version approvals (reviewer, authority, version/hash, reviewRequestedAt, scope, stale response) | approvedAt/approvedById only | Approval model | TEAM-01 | IMPLEMENTED_TESTED | Approval model with hash, label, reviewer, authority, scope; approvals.test.ts | none | done |
| DEL-03 | Material edit invalidates approval; package bound to approved release | none | hash check at publish | DEL-02 | IMPLEMENTED_TESTED | edits supersede approvals; scheduling/publishing call assertReleasable; approvals.test.ts; core-spine publishes after approval | none | done |
| DEL-04 | Designated approver + backup; extra reviewers optional; no auto-approve | none | routing | TEAM-01 | IMPLEMENTED_TESTED | Approver and backup approver via profiles and contact roles; approvers notified on review; escalation after three days to backup and owner; journeys suite | none | done |
| DEL-05 | Claims need evidence before release; AI cannot self-verify | script QA gate | extend to packages | none | IMPLEMENTED_TESTED | domain/package-claims.ts: figures in packaging must be in the script and verified; promise language refused; package-claims.test.ts; journey 9 | none | done |
| DEL-06 | Production checklists, editor assignment/backup, internal QA, turnaround metrics | template tasks | assignment + QA records | TEAM-09 | IMPLEMENTED_TESTED | delivery/qa.ts: editor QA checklist bound to the exact cut; turnaround medians from history per editor on the delivery page; qa.test.ts | none | done |
| FILE-01 | Tenant/assignment-scoped storage; fixed file route | see SEC-02 |  | SEC-02 | IMPLEMENTED_TESTED | See SEC-02; file route scoped to the asset's workspace and internal staff | none | Assignment scoping arrives with TEAM-09 |
| FILE-02 | Direct-to-storage multipart uploads with verification, expiry, cancel, cleanup | server actions (12 MB cap) | presigned multipart (S3/R2) | FILE-01 | EXTERNAL_CONFIGURATION_REQUIRED | storage/direct.ts: multipart direct uploads with 15-minute signed part URLs, assembly verified by size and content, failures deleted, abandoned uploads expired; library uses it above 10 MB; direct.test.ts (memory and S3 request shapes); journey 6 | R2 bucket + CORS | Blocker: missing configuration. R2 bucket, S3_* variables, and bucket CORS allowing PUT from the site origin and exposing ETag |
| FILE-03 | MIME/magic-byte validation, SVG rejection, quarantine/scan states | client MIME trusted | validation + scan status (pending/clean/failed/unsupported) | FILE-01 | EXTERNAL_CONFIGURATION_REQUIRED | Upload type and magic-byte checks; scan step per stored file through the processing worker; infected files quarantined (file route 423); processing/scan.test.ts; journey 6 | scanning provider | Blocker: missing configuration (a processing worker that runs a scanner, PROCESSING_SCAN=true) |
| FILE-04 | Short-lived signed reads; permission recheck; no URL logging | signed GET helper exists | wire | FILE-01 | IMPLEMENTED_TESTED | Files over 4 MB redirect after access checks to a five-minute signed storage URL pinning safe headers; direct.test.ts | none | Live use needs the S3 configuration of FILE-02 |
| FILE-05 | Long jobs (transcode/transcribe/scan) via suitable worker with checksummed callbacks | none | task model + callback | JOB-01 | EXTERNAL_CONFIGURATION_REQUIRED | processing/index.ts: signed submit and callback contract, forward-only states, transcripts stored once and mined, aggregated file state, retries; direct.test.ts; journey 6 | provider | Blocker: owner decision then configuration. Choose the processing worker (transcode, transcribe, thumbnail, scan), then set PROCESSING_PROVIDER, PROCESSING_ENDPOINT, PROCESSING_WEBHOOK_SECRET |
| FILE-06 | Deliverables index + async exports with expiring downloads | none | index + export job | FILE-04 | IMPLEMENTED_TESTED | exports/index.ts: on-demand JSON exports via a job, downloadable seven days through the checked file route, then deleted; exports.test.ts; journey 4 | none | done |

### Stage 5 · Jobs, notifications, integrations (§10, §11, §12)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JOB-01 | Protected cron dispatch on Vercel, leases, time budget, concurrency, jitter, dead letters, replay | queue + worker (QA shims loaded) | cron route, jitter, cancellation, admin view; drop QA preload | INF-06 | IMPLEMENTED_TESTED | /api/cron/jobs (bearer CRON_SECRET, 45 s budget, route.test.ts); daily Vercel cron; jobs also run right after the request that queued them; worker without QA shims | CRON_SECRET in Vercel | Owner: CRON_SECRET in Vercel; Pro plan for a more frequent cron if wanted |
| JOB-02 | At-least-once with business keys; uncertain external outcomes reconciled | idempotencyKey | uncertain state | JOB-01 | IMPLEMENTED_TESTED | UNCERTAIN state for publishes with no answer; stale claims released as UNCERTAIN; email carries an Idempotency-Key; Stripe writes carry idempotency keys; publishing.test.ts; journey 5 | none | done |
| JOB-03 | Due-record scheduling (catch-up) + outbox | none | schedule table | JOB-01 | IMPLEMENTED_TESTED | Daily tick (idempotent per day) catches up periods, invoices, reminders, renewals, access, digests; outbox for CRM | none | done |
| JOB-04 | All listed job types | email.send only enqueued | the rest | JOB-01 | IMPLEMENTED_TESTED | Job types: processing.submit, publish.run, publish.poll, export.build, mine.asset, plus the daily tick sweeps | various | done |
| NOT-01 | Notification preferences: responsibility, timezone, quiet hours, digest, dedupe, snooze, escalation | none | implement | JOB-04 | IMPLEMENTED_TESTED | notify() with per-person dedupe; email off/immediate/digest; quiet hours; snooze; escalation (notify.test.ts) | none | done |
| NOT-02 | Bounce/suppression, delivery state, marketing consent separate | EmailMessage status | suppression list + webhook | NOT-01 | EXTERNAL_CONFIGURATION_REQUIRED | email/delivery.ts: Resend webhooks verified (Svix scheme), permanent bounces and complaints suppress, suppression list on the system screen; delivery.test.ts | Resend webhook secret | Blocker: missing configuration (Resend webhook pointed at /api/email/resend, RESEND_WEBHOOK_SECRET) |
| INT-01 | OAuth start/callback routes with state/PKCE/allowlist/tenant binding | oauth.ts library | routes + UI | SEC-01 | IMPLEMENTED_TESTED | OAuth start/callback routes over the tested library (single-use state bound to workspace, PKCE, admin-only completion, scopes recorded as granted) | platform apps | Owner: platform developer apps and client ids per provider; live connection is EXTERNAL_CONFIGURATION_REQUIRED |
| INT-02 | Token refresh with locking; reconnect/revoke; account identity checks | refresh fn | job + lock | INT-01 | EXTERNAL_CONFIGURATION_REQUIRED | Token refresh on use and daily for tokens expiring within a day, under a per-integration advisory lock; refusal marks reconnect; account resolved after connecting; publishing.test.ts | platform apps | Blocker: provider approval (platform app credentials and reviews) |
| INT-03 | Publishing: packages, validation, schedule, cancel, status polling, partial threads, reconciliation | connectors (mock-tested) | publish job + states | INT-01, DEL-03 | EXTERNAL_CONFIGURATION_REQUIRED | publishing/index.ts: scheduled connector publishing, approval re-checked, claims, UNCERTAIN, processing polls, container finalisation, X threads with resume; publishing.test.ts; journeys 3, 5, 6 | platform reviews | Blocker: provider approval (platform app reviews), then a scheduler calling /api/cron/jobs more often than daily for timely publishing |
| INT-04 | Manual publishing complete with evidence | manual records | responsible publisher/due | DEL-03 | IMPLEMENTED_TESTED | Manual publish records require an approved current version (DEL-03); URL and time recorded | none | done |
| INT-05 | Metrics snapshots with definition/window/freshness; CSV import with mapping/dedupe/audit | snapshots; no CSV | CSV import | none | IMPLEMENTED_TESTED | CSV import with header mapping, URL/id matching, preview, per-row dedupe, audit (csv-import.test.ts) | none | done |
| INT-06 | Facebook/Threads capability per official APIs, or precise unsupported record | none | provider inventory | none | EXTERNAL_CONFIGURATION_REQUIRED | Facebook Page and Threads connectors built against the official Graph and Threads APIs (publish, processing status, finalisation, insights, account resolution); connectors.test.ts. Corrected from PROVIDER_UNSUPPORTED: both platforms have official APIs | Meta app review | Blocker: provider approval (Meta App Review for pages_manage_posts, pages_read_engagement, read_insights, threads_content_publish, threads_manage_insights; business verification) |
| INT-07 | Provider inventory doc (types, formats, scopes, versions, quotas, gates, test level) | PLATFORM_APPLICATIONS.md | complete | none | IMPLEMENTED_TESTED | Per-provider inventory table in TECHNICAL_HANDOFF.md section 7 (types, formats, scopes, versions, quotas, gates, test level) | none | done |
| INT-08 | Booking/form/CRM event connectors per official contracts; manual import path | webhook lib | verify contracts; manual import | SEC-05 | IMPLEMENTED_TESTED | Stripe, HubSpot, Pipedrive, Attio, HighLevel verified per official contracts (SEC-05); manual commercial event entry | client secrets | Owner/client: per-client webhook credentials |
| INT-09 | Retire legacy always-unavailable adapter after migrating callers | adapter.ts | migrate importMetricsAction | INT-03 | IMPLEMENTED_TESTED | Metric import runs through connectors; the legacy adapter keeps only configuration validation | none | done |
| ATT-01 | Evidence classes exactly as listed | enum lower-case variants | map/rename to exact names | none | IMPLEMENTED_TESTED | Canonical five classes mapped one to one and used in exports (attribution.test.ts) | none | done |
| ATT-02 | Consent-aware non-essential identifiers (tl_v fails closed) | tl_v always set | consent check | none | IMPLEMENTED_TESTED | Visitor cookie fails closed without consent or documented basis, never under GPC (attribution suite) | OWNER_DECISION (consent basis) | Owner: decide the lawful basis; then set TRACKED_LINK_VISITOR_COOKIE |
| ATT-03 | Baseline, destinations, UTMs, buyer-reported source, booked/show/qualified/sale/cash distinct | largely exists | verify | none | EXISTING_VERIFIED | Baselines, destinations, UTMs, buyer-reported source and funnel stages exist (attribution suite) | none | done |
| ATT-04 | Funnel views with denominators, low-sample states, followers-per-call labelled heuristic | funnel panel | labels + states | none | IMPLEMENTED_TESTED | Funnel rates carry sample size and a small-sample state; no followers-per-call figure exists anywhere; funnel.test.ts | none | done |

### Stage 6 · Intelligence and learning (§13, §14)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-01 | Source/idea miner with exact spans and provenance; transcript connector + manual import | runs, research items | span extraction; transcript import | FILE-05 | IMPLEMENTED_TESTED | research/miner.ts: exact-quote mining with offsets and provenance, unlocatable quotes dropped, transcripts mined automatically, library Mine it; miner.test.ts | Fathom (optional) | Optional: a transcript connector (Fathom) needs its API key and an owner decision; manual import and uploads work now |
| AI-02 | Market/trend researcher with schedules, dedupe, reliability, unavailable-source reasons | ResearchProvider | scheduled runs | JOB-03 | IMPLEMENTED_TESTED | research/schedules.ts: scheduled runs collect workspace records and public pages, dedupe, explain unreadable sources, leave manual sources for a person, one run at a time; schedules.test.ts | research API keys | Third-party research APIs would add sources; each needs its own key and approval |
| AI-03 | Versioned strategy/context engine with conflict resolution | BrandBrain/context | versioning | ENG-04 | IMPLEMENTED_TESTED | Versioned Brand Brain (trigger), per-expert voice, prefill and confirm, stale drafts; brain-versions.test.ts, expert-voice.test.ts | none | done |
| AI-04 | Drafting/repurposing with PESTO, funnel role, root links | generators | PESTO + funnel fields | none | IMPLEMENTED_TESTED | Ideas carry PESTO and funnel role; the measured mix feeds the performance context without quotas; content/mix.test.ts | Anthropic key | Live generation needs ANTHROPIC_API_KEY (missing configuration); demo mode is labelled |
| AI-05 | Judge/fact/voice QA | Judge v0.1 | extend criteria | none | IMPLEMENTED_TESTED | Judge rubric v0.2 adds clarity, repetition, platform and funnel fit, and a gating no-invented-detail criterion; judge.test.ts | none | done |
| AI-06 | Inbox/lead-assist with human release | none | ingestion + drafts + speed-to-lead | COM-04 | IMPLEMENTED_TESTED | leads/index.ts: authorised inbound sources, dedupe and merge, routing, qualification that refuses location alone, AI drafts a person approves and sends, follow-up reminders, speed to lead; leads.test.ts | channel APIs | Channel DMs without authorised APIs stay manual entry by design (verified provider limitation) |
| AI-07 | Learning/analytics report drafts | reportNarrative | wire | REP-01 | IMPLEMENTED_TESTED | Four-week review sections drafted from frozen figures and recorded corrections and diagnoses, only into empty sections, never finalised; review-draft.test.ts | none | done |
| AI-08 | Run records incl. cost/tokens, budgets, cancellation, concurrency, mock labelling | AiGeneration (no cost) | cost + budgets + cancel | none | IMPLEMENTED_TESTED | Costs and budgets; cancellation signal and time limit on every generation, recorded and never retried; cancel.test.ts; journey 9 | none | done |
| AI-09 | Prompt-injection/SSRF defences; tenant-isolated retrieval; no autonomous tools | quarantine flag, SSRF guard | tests + tool policy | SEC-10 | IMPLEMENTED_TESTED | ai/untrusted.ts: third-party text neutralised and fenced in prompts; quarantine uses the same detector; SSRF pinning; untrusted.test.ts (15 attacks, 5 ordinary sentences); journey 9 | none | done |
| LRN-01 | Learning loop operable end to end in the product (UI) | actions, no UI | UI | DEL-02 | IMPLEMENTED_TESTED | Learning loop panel on each piece (thesis, expectation, diagnosis approval, correction, verdict) | none | done |
| LRN-02 | Lessons fed into context with scope/version + rollback | none | implement | LRN-01 | IMPLEMENTED_TESTED | learning/lessons.ts: lessons from confirmed retests or a stated basis, workspace or platform scope, in the generation context, retire to roll back; lessons.test.ts | none | done |
| LRN-03 | Held-out evaluation, leakage checks, prompt/model comparison, promotion/rollback | calibration v0 | evaluation path | LRN-01 | IMPLEMENTED_TESTED | domain/evaluation.ts and learning/evaluation.ts: fixed held-out share, leakage exclusion and refusal at judging, AUC per variant, human promotion and rollback; evaluation tests | none | Meaningful results need a corpus of scored examples with known outcomes (owner research work) |

### Stage 7 · Reporting, cockpit, capacity, commercial lifecycle (§15, §16)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-01 | One actionable operator work queue with owner/deadline/cause/next action | cockpit + queue | unify + stranded work + failures | many | IMPLEMENTED_TESTED | ops/queue.ts: one ordered queue of every source needing a person with cause, owner, age and next action; queue.test.ts | none | done |
| OPS-02 | Jobs/dead-letter, email outbox, webhook log, connections, audit log, user admin views | none | admin views | JOB-01 | IMPLEMENTED_TESTED | /admin/system: config problems, jobs and dead letters (requeue), CRM backlog (retry), webhook log, email failures, audit | none | done |
| REP-01 | Weekly reports from real records; operator-only finalisation; immutable versions; revisions | weekly report (client can finalise) | restrict + versioning | TEAM-01 | IMPLEMENTED_TESTED | Staff-only drafting and finalising, immutable versions, corrections as new versions, client sees latest final only (reports suite) | none | done |
| REP-02 | Four-week reviews (ACTION → RESULTS → PROBLEMS → FUTURE) | none | model + builder | ENG-01 | IMPLEMENTED_TESTED | PeriodReview with frozen figures and four sections, versions (period-review.test.ts) | none | done |
| REP-03 | Delivery per version/recipient with dedupe + status; printable export | none | job + template | JOB-04 | IMPLEMENTED_TESTED | reports/pdf.ts server-side PDF; client downloads final versions only; pdf.test.ts; QA reports check | Resend | Emailing reports needs Resend (missing configuration) |
| CAP-01 | Effort, cost, turnaround, rework, WIP, capacity from availability | synthetic load | effort records + availability | CX-08 | IMPLEMENTED_TESTED | Operator load per client from recorded effort on the system screen; turnaround per editor on the delivery page | none | Capacity alerts need an owner decision on availability per person |
| BIL-01 | Manual invoices/payments (partial, credits, refunds, disputes, evidence) | none | models + UI | ENG-01 | IMPLEMENTED_TESTED | Invoices, partial payments, refunds, credit notes, voids, disputes; drafting automatic, issuing by a person (billing.test.ts, journey 8) | none | done |
| BIL-02 | Stripe-hosted Checkout/Invoicing (test mode), signed events, idempotent, one invoice authority | none | adapter + webhook | BIL-01 | IMPLEMENTED_TESTED | Stripe Invoicing adapter and billing webhook, test mode only, idempotent (billing.test.ts with mocked Stripe) | Stripe test keys | Owner: Stripe test keys and webhook secret; live mode is an owner decision |
| BIL-03 | Agreement/DPA version + signed evidence | none | model | ENG-01 | IMPLEMENTED_TESTED | AgreementDocument with version, signer and evidence location; engagement records the agreement version | OWNER/legal | Owner: the agreement documents themselves |
| BIL-04 | Overdue surfacing + approved reminders to commercial contact | none | job | BIL-01, NOT-01 | IMPLEMENTED_TESTED | Overdue surfaced; reminder drafts to the commercial contact, weekly at most, sent only on approval | owner policy | done |
| RNW-01 | Renewal review with lead time; renew/pause/expand/terminate/handover; Attio renewal opportunity | none | implement | ENG-01, COM-04 | IMPLEMENTED_TESTED | Renewal reviews 21 days ahead with task and CRM opportunity; decided by a person (renewals.test.ts, journey 8) | none | done |
| PRF-01 | Proof permissions with scope/assets/date/evidence; revocation flags placements | ProofPermission flags | scope detail + revocation | none | IMPLEMENTED_TESTED | Expiry, scope, placements refused without permission, flagged on withdrawal or expiry (placements.test.ts, journey 8) | none | done |
| OFF-01 | Offboarding workflow (final report, export, revocation, tokens, jobs, CRM, holds, deletion evidence) | status churned | implement | many | IMPLEMENTED_TESTED | Offboarding export, credential deletion, job cancellation, access window, legal hold, confirmed deletion with evidence (offboarding.test.ts, journey 8) | owner retention policy | Owner: retention periods |
| PRV-01 | Data inventory, retention table, subprocessors, DSAR workflow, incident register, access review | none | docs + workflow | none | OWNER_DECISION_REQUIRED | Data inventory and subprocessors listed in TECHNICAL_HANDOFF.md; export supports access requests | OWNER_DECISION | Owner: retention table, DPA, privacy contact |

### Stage 8 · Verification and documents (§18, §19)

| ID | Outcome | Status | Next |
| --- | --- | --- | --- |
| VER-01..10 | The ten acceptance journeys | IMPLEMENTED_TESTED | Journeys 1, 2, 8: `suite-journeys` (19 checks). Journeys 3, 4, 5, 6, 7, 9, 10: `suite-journeys-more` (87 checks, 0 partial, 0 fail) through real actions, route handlers and jobs, with platforms, storage, email and Stripe mocked at their boundaries. None is LIVE_VERIFIED: that needs configured provider accounts |
| DOC-01 | FINAL_BACKEND_IMPLEMENTATION_AUDIT.md | IMPLEMENTED_TESTED | docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md |
| DOC-02 | OWNER_ACTIVATION_CHECKLIST.md | IMPLEMENTED_TESTED | docs/OWNER_ACTIVATION_CHECKLIST.md |
| DOC-03 | TECHNICAL_HANDOFF.md | IMPLEMENTED_TESTED | docs/TECHNICAL_HANDOFF.md |
| DOC-04 | CLIENT_AND_OPERATOR_RUNBOOK.md | IMPLEMENTED_TESTED | docs/CLIENT_AND_OPERATOR_RUNBOOK.md |

## Remaining requirements by blocker (27 September 2026)

Every row not IMPLEMENTED_TESTED or EXISTING_VERIFIED, with the kind of blocker. **No row is blocked by unfinished code.**

| Blocker | Rows | What unblocks it |
| --- | --- | --- |
| Missing configuration | INF-01, INF-05, INF-07, INF-08, JOB-01, FILE-02, FILE-03, NOT-02, COM-04, BIL-02, AI-04 (live model) | The owner activation checklist, sections 0 to 8: Neon, DEPLOYMENT_ROLE, keys, Resend and its webhook, R2 bucket with CORS, Upstash, error DSN, CRON_SECRET, Attio key, Stripe test keys, Anthropic key |
| Provider approval | INT-02, INT-03, INT-06 (Facebook Page, Threads), and Instagram, LinkedIn, TikTok, X, YouTube publishing and analytics | Platform app reviews and access tiers (docs/PLATFORM_APPLICATIONS.md). One Meta business verification covers Instagram, Facebook and Threads |
| Owner decision | INF-09 (RPO/RTO), PRV-01 (retention, DPA, privacy contact), ATT-02 (tracked-link consent basis), BIL-03/BIL-04 (legal terms, reminder policy), OFF-01 (retention periods), FILE-05 (which processing worker to use), CAP-01 (availability per person for capacity alerts), ENG-02 (offer defaults) | The decisions listed in OWNER_ACTIVATION_CHECKLIST.md section 9 |
| Verified provider limitation | AI-06 channel DMs (LinkedIn, Instagram, X personal DMs have no authorised API for this use; manual entry and inbound sources instead); LinkedIn member-post impressions (Marketing Developer Platform only); TikTok posts stay private until the app is audited | Nothing in code; documented alternatives are in place |

**Corrected classification:** INT-06 (Facebook and Threads) was PROVIDER_UNSUPPORTED. That was wrong: both have official publishing and insights APIs. The connectors are now built, and the blocker is Meta App Review (provider approval).

## Owner-facing open items (never silently resolved)

- Public claims "100m+ views / 10,000+ conversions" need owner substantiation (commercial readiness issue; public copy frozen).
- Legal entity, company number, address, privacy contact, retention periods, governing law (hidden on legal pages).
- Consent basis for the tracked-link cookie `tl_v` (PECR).
- RPO/RTO and retention policy.
- Offer defaults confirmation (£2,500 + £2,500/28 days × 3).
- Managed PostgreSQL (Neon) account, Resend domain/key, R2 bucket, Upstash, Sentry DSN, Stripe test keys, Attio API key, platform app reviews.

## Checkpoint log

| When | Commit | What |
| --- | --- | --- |
| 26 Sep | 6eeb433 | INF-01, INF-02 implemented and tested locally; setup no longer seeds |
| 26 Sep | backend/completion | Foundation, security, identity, teams, commercial, approvals, reports, reviews, billing, offboarding, notifications, OAuth, CSV import, AI cost, restore drill, renewals, proof, consent, acceptance journeys, five documents. 727 unit tests, 526 QA checks, 62 public checks, restore drill passed |
| 26-27 Sep | main (local commits 70dcc16 .. b8917b5) | Direct uploads, processing callbacks and scanning, effort, lead inbox, Facebook and Threads, contractor scope, scheduled publishing with threads and uncertain results, email delivery and suppression, report PDF, Brand Brain versions, lessons, exports, comment versions, support requests, prefill and confirm, provenance, owner/due/blocker, QA and turnaround, package claims, injection defences, SSRF pinning, cache audit, one operator queue, source miner, scheduled research, PESTO mix, review drafts, held-out evaluation, cancellation; six bugs found by the new journeys fixed. 808 unit tests; journeys 87/87 |

## Resumption

```
git checkout main && git log --oneline -40
npm run db:local            # embedded PostgreSQL on :55432
DATABASE_URL=$(npm run -s db:local:url) DIRECT_URL=$(npm run -s db:local:url) npx prisma migrate deploy
DATABASE_URL=... npm test && DATABASE_URL=... node scripts/qa/run.cjs run-all
```

Next code work: none is outstanding against the ledger. Remaining work is configuration, provider approval and owner decisions (section above). After configuration: run the live checks in OWNER_ACTIVATION_CHECKLIST.md section 10 and move rows to LIVE_VERIFIED only on real evidence.
