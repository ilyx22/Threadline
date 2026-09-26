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
| INF-01 | App runs on managed PostgreSQL | schema was SQLite | provider switch + PG baseline | none | IMPLEMENTED_TESTED (local PG 18) | 634/634 unit tests on PG; baseline applies to empty PG | Managed PG (Neon) account + Vercel env | Owner: create Neon DB; set DATABASE_URL/DIRECT_URL in Vercel |
| INF-02 | Existing data preserved | SQLite dev.db | transfer + reconciliation | INF-01 | IMPLEMENTED_TESTED | `scripts/db/sqlite-to-postgres.ts`; evidence JSON: 77 tables / 1,276 rows reconciled | none (no production data exists) | done |
| INF-03 | PG used for DB-sensitive tests | tests hit dev.db | PG test DB + isolated fixtures | INF-01 | IMPLEMENTED_TESTED | all unit tests and all QA suites run on embedded PostgreSQL 18 (npm run db:local); each test creates and removes its own synthetic tenant | none | done |
| INF-04 | Explicit migrations, safe seed | `setup` ran seed; seed wipes all data unguarded | guard seed; explicit migrate; no shared prod creds | INF-01 | IMPLEMENTED_TESTED | src/lib/db/seed-guard.test.ts; seed refused on local PG without confirmation (exit 1, data intact) | none | done |
| INF-05 | Env separation prod/preview/test | none | env model + preview guards | INF-06 | IMPLEMENTED_TESTED | src/lib/env.ts appEnv/sideEffectsAllowed; env.test.ts (preview sharing prod DB refused, seed flags refused on deployments); CRM, email-sensitive work production-only | Vercel env config | Owner: set APP_ENV/VERCEL_ENV-scoped variables in Vercel |
| INF-06 | Validated env + health | none | env schema, `/api/health`, internal health | none | IMPLEMENTED_TESTED | npm run env:check; GET /api/health (db + config error count, no values); env.test.ts | none | Verify /api/health on the live deployment after PG is configured |
| INF-07 | Email/storage/throttle/monitoring adapters | Resend, S3 (SigV4), Upstash exist; no Sentry | monitoring adapter; config visibility | INF-06 | IMPLEMENTED_TESTED | log.ts reportError sends Sentry-format envelopes (log.test.ts with mocked fetch); Resend/S3/Upstash adapters existed | Resend key/domain, R2 bucket, Upstash, Sentry DSN | Owner: ERROR_REPORTING_DSN, RESEND_API_KEY, S3_*, RATE_LIMIT_REDIS_* |
| INF-08 | Backups + restore drill | none | backup/restore runbook + local restore test | INF-01 | MISSING | | Neon PITR config | local pg_dump/restore drill with reconciliation |
| INF-09 | Recovery objectives, runbooks | none | RPO/RTO pending owner; deploy/rollback runbooks | INF-08 | MISSING | | OWNER_DECISION_REQUIRED (RPO/RTO) | write runbooks in TECHNICAL_HANDOFF |
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
| SEC-10 | SSRF DNS pinning | resolve-then-fetch | pin resolved IP | none | PARTIAL | fetch-url tests | none | implement |
| SEC-11 | Credential encryption with key versions | AES-GCM keyring | rotation command | none | EXISTING_VERIFIED | secret-box tests | key custody | add rotate script |
| SEC-12 | Cache boundaries per user/tenant | dynamic pages | verify no shared caching of authed responses | none | PARTIAL | | none | audit `force-dynamic`/headers |

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
| TEAM-08 | Multiple experts with individual voice profiles; primary + backup contact | isPrimary unused | expert flag + voice link; primary/backup | TEAM-01 | PARTIAL | isExpert and primary/backup contact on memberships; founder invited as expert | none | Per-expert voice profiles in the Brand Brain (AI-03) |
| TEAM-09 | Contractor/editor assignment-scoped access; QA reviewer | editor role (client membership) | assignment model; scoped reads | SEC-01 | MISSING | | none | |
| TEAM-10 | Members UI without admin-typed passwords | members-client with password field | invite UI | TEAM-02 | IMPLEMENTED_TESTED | members screen rebuilt around invitations; addMemberAction and the admin-set founder password removed | none | done |

### Stage 3 · Commercial conversion and Attio (§6, §7)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COM-01 | Application confirmation + operator notification (one each) | template unused | enqueue on submit | JOB-01 | IMPLEMENTED_TESTED | one applicant confirmation and one operator alert per new application, idempotency keys | Resend | Owner: OPS_NOTIFY_EMAIL and Resend for real delivery |
| COM-02 | Application qualification fields (owner, next action, due, outcome) | status only | fields + UI | none | IMPLEMENTED_TESTED | owner/next action/due/outcome/reason on applications; admin qualification form | none | done |
| COM-03 | Convert application/prospect → workspace + engagement + founder invitation (idempotent, returning clients) | createClientAction (password, non-atomic) | convert command | TEAM-02, ENG-01 | IMPLEMENTED_TESTED | provisionClientWorkspace in one transaction, idempotent conversion, founder invited as owner (commercial.test.ts; core-spine) | none | done |
| COM-04 | Attio sync: mapping, remote IDs, outbox, retries, reconciliation, dead letters, manual resolution | Attio webhook only (wrong signature scheme) | full sync | JOB-01 | IMPLEMENTED_TESTED | CrmOutbox/CrmLink; Attio client per documented API; commercial.test.ts with mocked Attio (dependency order, no double send, review parking); production-only sends | Attio API key + workspace | Owner: ATTIO_API_KEY (and ATTIO_STAGE_MAP if stages differ); first live sync is EXTERNAL_CONFIGURATION_REQUIRED |
| COM-05 | Separate prospect research / deal stage / delivery status | Prospect state | explicit separation | COM-04 | PARTIAL | | none | |
| COM-06 | Threadline deal value vs prospect economics stored separately | economics fields | verify | none | PARTIAL | | none | |
| COM-07 | Acquisition: ICP research, briefs, script variants, objection logs, follow-up queues, human-reviewed drafts, no auto-send | sales scripts, calls | follow-up queue + drafts | none | PARTIAL | | none | |
| ENG-01 | Engagement + agreement version, scope, entitlements, 28-day periods, activation date, pause/terminate | fees on Organization; periods computed from startedAt | Engagement + ServicePeriod models | none | IMPLEMENTED_TESTED | Engagement/ServicePeriod; activate/pause/resume/end; commercial.test.ts | none | done |
| ENG-02 | Offer config (£2,500 + £2,500/4 weeks × 3, £10,000) with preserved signed terms | fees on org | OfferTemplate + snapshot onto engagement | ENG-01 | IMPLEMENTED_TESTED | OfferTemplate standard £2,500 + £2,500/28 days x3 (= £10,000); terms frozen into offerSnapshot; live fees change only by scope change | owner confirms defaults | Owner confirms the defaults |
| ENG-03 | Installation checklist + early win date | onboarding sessions | installation record | ENG-01 | PARTIAL | | none | |
| ENG-04 | Versioned creative brief / per-person voice; invalidates downstream drafts | BrandBrain | versioning + invalidation | TEAM-08 | PARTIAL | | none | |
| ENG-05 | Scope changes with approval and effective version | none | model + flow | ENG-01 | IMPLEMENTED_TESTED | ScopeChange propose/decide with fee change from a named period (commercial.test.ts) | none | done |
| ENG-06 | DST-safe tenant timezone calendars | none | tz on org; storage in UTC; 28-day math | ENG-01 | IMPLEMENTED_TESTED | calendar.test.ts (DST weekends, year end, leap day, local-date conversion) | none | done |

### Stage 4 · Client experience and delivery (§5, §8, §9)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-01 | Home: needs you / needs your colleague / Threadline working, from real records | Home/This Week | role-aware split | TEAM-01 | PARTIAL | | none | |
| CX-02 | Review batches, safe bulk decisions on selected current versions | approvals page | batch + stale checks | DEL-02 | MISSING | | none | |
| CX-03 | Save/resume, deep links after sign-in | safePath exists | verify | none | PARTIAL | | none | |
| CX-04 | Operator prefill of Brand Brain/ICP/voice; progressive onboarding | onboarding flow | prefill + client confirm | ENG-04 | PARTIAL | | none | |
| CX-05 | Voice notes/files/links with provenance | uploads | provenance fields | FILE-01 | PARTIAL | | none | |
| CX-06 | Consolidated comments per asset/version; internal notes stay internal | Comment model | visibility flag + version binding | DEL-02 | PARTIAL | | none | |
| CX-07 | Client help/recording guide + support request with owner/status | support page (admin) | client request path | none | PARTIAL | | none | |
| CX-08 | Measure founder input time, approval time, revision rounds, operator effort | none | effort records | DEL-01 | MISSING | | none | |
| DEL-01 | Connected pipeline with server-validated transitions, owner/due/deps/blocker/history on every item | workflow.ts transitions | owner/due/blocker uniformity; written path skips recording | none | PARTIAL | workflow tests | none | |
| DEL-02 | Exact-version approvals (reviewer, authority, version/hash, reviewRequestedAt, scope, stale response) | approvedAt/approvedById only | Approval model | TEAM-01 | IMPLEMENTED_TESTED | Approval model with hash, label, reviewer, authority, scope; approvals.test.ts | none | done |
| DEL-03 | Material edit invalidates approval; package bound to approved release | none | hash check at publish | DEL-02 | IMPLEMENTED_TESTED | edits supersede approvals; scheduling/publishing call assertReleasable; approvals.test.ts; core-spine publishes after approval | none | done |
| DEL-04 | Designated approver + backup; extra reviewers optional; no auto-approve | none | routing | TEAM-01 | MISSING | | none | |
| DEL-05 | Claims need evidence before release; AI cannot self-verify | script QA gate | extend to packages | none | PARTIAL | | none | |
| DEL-06 | Production checklists, editor assignment/backup, internal QA, turnaround metrics | template tasks | assignment + QA records | TEAM-09 | PARTIAL | | none | |
| FILE-01 | Tenant/assignment-scoped storage; fixed file route | see SEC-02 | | SEC-02 | MISSING | | none | |
| FILE-02 | Direct-to-storage multipart uploads with verification, expiry, cancel, cleanup | server actions (12 MB cap) | presigned multipart (S3/R2) | FILE-01 | MISSING | | R2 bucket + CORS | implement against S3 API; contract test |
| FILE-03 | MIME/magic-byte validation, SVG rejection, quarantine/scan states | client MIME trusted | validation + scan status (pending/clean/failed/unsupported) | FILE-01 | PARTIAL | magic-byte validation and SVG/HTML refusal done (SEC-02) | scanning provider | Malware-scan states need a scanning provider (EXTERNAL_CONFIGURATION_REQUIRED) |
| FILE-04 | Short-lived signed reads; permission recheck; no URL logging | signed GET helper exists | wire | FILE-01 | PARTIAL | | none | |
| FILE-05 | Long jobs (transcode/transcribe/scan) via suitable worker with checksummed callbacks | none | task model + callback | JOB-01 | MISSING | | provider | |
| FILE-06 | Deliverables index + async exports with expiring downloads | none | index + export job | FILE-04 | MISSING | | none | |

### Stage 5 · Jobs, notifications, integrations (§10, §11, §12)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JOB-01 | Protected cron dispatch on Vercel, leases, time budget, concurrency, jitter, dead letters, replay | queue + worker (QA shims loaded) | cron route, jitter, cancellation, admin view; drop QA preload | INF-06 | IMPLEMENTED_TESTED | /api/cron/jobs (bearer CRON_SECRET, 45 s budget, route.test.ts); daily Vercel cron; jobs also run right after the request that queued them; worker without QA shims | CRON_SECRET in Vercel | Owner: CRON_SECRET in Vercel; Pro plan for a more frequent cron if wanted |
| JOB-02 | At-least-once with business keys; uncertain external outcomes reconciled | idempotencyKey | uncertain state | JOB-01 | PARTIAL | | none | |
| JOB-03 | Due-record scheduling (catch-up) + outbox | none | schedule table | JOB-01 | MISSING | | none | |
| JOB-04 | All listed job types | email.send only enqueued | the rest | JOB-01 | MISSING | | various | |
| NOT-01 | Notification preferences: responsibility, timezone, quiet hours, digest, dedupe, snooze, escalation | none | implement | JOB-04 | MISSING | | none | |
| NOT-02 | Bounce/suppression, delivery state, marketing consent separate | EmailMessage status | suppression list + webhook | NOT-01 | PARTIAL | | Resend webhook secret | |
| INT-01 | OAuth start/callback routes with state/PKCE/allowlist/tenant binding | oauth.ts library | routes + UI | SEC-01 | PARTIAL | oauth tests | platform apps | |
| INT-02 | Token refresh with locking; reconnect/revoke; account identity checks | refresh fn | job + lock | INT-01 | PARTIAL | | platform apps | |
| INT-03 | Publishing: packages, validation, schedule, cancel, status polling, partial threads, reconciliation | connectors (mock-tested) | publish job + states | INT-01, DEL-03 | PARTIAL | connector tests | platform reviews | |
| INT-04 | Manual publishing complete with evidence | manual records | responsible publisher/due | DEL-03 | PARTIAL | | none | |
| INT-05 | Metrics snapshots with definition/window/freshness; CSV import with mapping/dedupe/audit | snapshots; no CSV | CSV import | none | PARTIAL | | none | |
| INT-06 | Facebook/Threads capability per official APIs, or precise unsupported record | none | provider inventory | none | MISSING | | Meta app review | |
| INT-07 | Provider inventory doc (types, formats, scopes, versions, quotas, gates, test level) | PLATFORM_APPLICATIONS.md | complete | none | PARTIAL | | none | |
| INT-08 | Booking/form/CRM event connectors per official contracts; manual import path | webhook lib | verify contracts; manual import | SEC-05 | PARTIAL | webhook tests | client secrets | |
| INT-09 | Retire legacy always-unavailable adapter after migrating callers | adapter.ts | migrate importMetricsAction | INT-03 | MISSING | | none | |
| ATT-01 | Evidence classes exactly as listed | enum lower-case variants | map/rename to exact names | none | PARTIAL | attribution tests | none | |
| ATT-02 | Consent-aware non-essential identifiers (tl_v fails closed) | tl_v always set | consent check | none | MISSING | | OWNER_DECISION (consent basis) | |
| ATT-03 | Baseline, destinations, UTMs, buyer-reported source, booked/show/qualified/sale/cash distinct | largely exists | verify | none | PARTIAL | | none | |
| ATT-04 | Funnel views with denominators, low-sample states, followers-per-call labelled heuristic | funnel panel | labels + states | none | PARTIAL | | none | |

### Stage 6 · Intelligence and learning (§13, §14)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-01 | Source/idea miner with exact spans and provenance; transcript connector + manual import | runs, research items | span extraction; transcript import | FILE-05 | PARTIAL | | Fathom (optional) | |
| AI-02 | Market/trend researcher with schedules, dedupe, reliability, unavailable-source reasons | ResearchProvider | scheduled runs | JOB-03 | PARTIAL | | research API keys | |
| AI-03 | Versioned strategy/context engine with conflict resolution | BrandBrain/context | versioning | ENG-04 | PARTIAL | | none | |
| AI-04 | Drafting/repurposing with PESTO, funnel role, root links | generators | PESTO + funnel fields | none | PARTIAL | | Anthropic key | |
| AI-05 | Judge/fact/voice QA | Judge v0.1 | extend criteria | none | PARTIAL | judge tests | none | |
| AI-06 | Inbox/lead-assist with human release | none | ingestion + drafts + speed-to-lead | COM-04 | MISSING | | channel APIs | |
| AI-07 | Learning/analytics report drafts | reportNarrative | wire | REP-01 | PARTIAL | | none | |
| AI-08 | Run records incl. cost/tokens, budgets, cancellation, concurrency, mock labelling | AiGeneration (no cost) | cost + budgets + cancel | none | PARTIAL | | none | |
| AI-09 | Prompt-injection/SSRF defences; tenant-isolated retrieval; no autonomous tools | quarantine flag, SSRF guard | tests + tool policy | SEC-10 | PARTIAL | | none | |
| LRN-01 | Learning loop operable end to end in the product (UI) | actions, no UI | UI | DEL-02 | PARTIAL | content-diagnosis tests | none | |
| LRN-02 | Lessons fed into context with scope/version + rollback | none | implement | LRN-01 | MISSING | | none | |
| LRN-03 | Held-out evaluation, leakage checks, prompt/model comparison, promotion/rollback | calibration v0 | evaluation path | LRN-01 | PARTIAL | | none | |

### Stage 7 · Reporting, cockpit, capacity, commercial lifecycle (§15, §16)

| ID | Outcome | Existing | Gap | Deps | Status | Evidence | Gate | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-01 | One actionable operator work queue with owner/deadline/cause/next action | cockpit + queue | unify + stranded work + failures | many | PARTIAL | | none | |
| OPS-02 | Jobs/dead-letter, email outbox, webhook log, connections, audit log, user admin views | none | admin views | JOB-01 | MISSING | | none | |
| REP-01 | Weekly reports from real records; operator-only finalisation; immutable versions; revisions | weekly report (client can finalise) | restrict + versioning | TEAM-01 | PARTIAL | | none | |
| REP-02 | Four-week reviews (ACTION → RESULTS → PROBLEMS → FUTURE) | none | model + builder | ENG-01 | MISSING | | none | |
| REP-03 | Delivery per version/recipient with dedupe + status; printable export | none | job + template | JOB-04 | MISSING | | Resend | |
| CAP-01 | Effort, cost, turnaround, rework, WIP, capacity from availability | synthetic load | effort records + availability | CX-08 | PARTIAL | | none | |
| BIL-01 | Manual invoices/payments (partial, credits, refunds, disputes, evidence) | none | models + UI | ENG-01 | MISSING | | none | |
| BIL-02 | Stripe-hosted Checkout/Invoicing (test mode), signed events, idempotent, one invoice authority | none | adapter + webhook | BIL-01 | MISSING | | Stripe test keys | contract tests |
| BIL-03 | Agreement/DPA version + signed evidence | none | model | ENG-01 | MISSING | | OWNER/legal | |
| BIL-04 | Overdue surfacing + approved reminders to commercial contact | none | job | BIL-01, NOT-01 | MISSING | | owner policy | |
| RNW-01 | Renewal review with lead time; renew/pause/expand/terminate/handover; Attio renewal opportunity | none | implement | ENG-01, COM-04 | MISSING | | none | |
| PRF-01 | Proof permissions with scope/assets/date/evidence; revocation flags placements | ProofPermission flags | scope detail + revocation | none | PARTIAL | | none | |
| OFF-01 | Offboarding workflow (final report, export, revocation, tokens, jobs, CRM, holds, deletion evidence) | status churned | implement | many | MISSING | | owner retention policy | |
| PRV-01 | Data inventory, retention table, subprocessors, DSAR workflow, incident register, access review | none | docs + workflow | none | MISSING | | OWNER_DECISION | |

### Stage 8 · Verification and documents (§18, §19)

| ID | Outcome | Status | Next |
| --- | --- | --- | --- |
| VER-01..10 | The ten acceptance journeys | MISSING | build as PostgreSQL integration tests as features land |
| DOC-01 | FINAL_BACKEND_IMPLEMENTATION_AUDIT.md | MISSING | write at each checkpoint |
| DOC-02 | OWNER_ACTIVATION_CHECKLIST.md | MISSING | |
| DOC-03 | TECHNICAL_HANDOFF.md | MISSING | |
| DOC-04 | CLIENT_AND_OPERATOR_RUNBOOK.md | MISSING | |

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
