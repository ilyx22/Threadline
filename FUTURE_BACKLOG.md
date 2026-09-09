# Threadline OS — Future backlog

Documented deliberately, and deliberately **not** blocking v1. Each item notes what exists today
so the next session knows what it is building on rather than starting from nothing.

Last updated: 2026-09-09

Items marked **DONE (2026-09-09)** were built in the completion pass (commit `5a08f25`, tag
`threadline-public-baseline-2026-09-09`) and stay here only so the "Today" line records what now
exists and what, if anything, still gates it. The full audit is
`docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`. Anything a connector or job may do is bounded
by the platform safety doctrine in `HANDOFF.md` §16i.

---

## Tier 1 — Highest value next

### 1. LinkedIn publishing and analytics — **DONE (2026-09-09), external gate remains**
**Today:** connectors for LinkedIn, YouTube, Instagram, TikTok and X in
`src/lib/integrations/connectors/` with the documented scopes, endpoints, request shapes,
publish/status/metrics parsing and error mapping, exercised through a mocked HTTP boundary
(`connectors.test.ts`). OAuth with PKCE, encrypted token storage (`Credential`, AES-256-GCM
keyring) and capability-granular connection state exist. With no credentials the integrations UI
reads "credentials missing"; nothing is simulated.
**Remains:** client credentials per platform and the platform reviews in
`docs/PLATFORM_APPLICATIONS.md` (LinkedIn member analytics is the long pole). No code is expected.

### 2. Automatic metric import — **DONE (2026-09-09), external gate remains**
**Today:** `src/lib/analytics` normalises provider responses into five per-field states, records
provenance, refuses duplicate ingestion and reports freshness; the `metrics.refresh` job drives
it. Manual snapshots remain valid and labelled.
**Remains:** live provider data, which needs the analytics scopes from item 1's reviews.

### 3. Email delivery — **DONE (2026-09-09), credential remains**
**Today:** `src/lib/email` with capture (default) and Resend providers, branded templates and an
`EmailMessage` log; sends are queued through jobs. Invitations and resets show their link directly
while `EMAIL_PROVIDER=capture`.
**Remains:** `RESEND_API_KEY`, `EMAIL_FROM` and a sending domain (founder input). Weekly-report
delivery by email is a job handler away once a provider is configured; playbook email capture is
deferred until then.

### 4. Password reset and email verification — **DONE (2026-09-09)**
**Today:** `AuthToken` (hashed, single-use, expiring), `/forgot-password`, `/reset-password`,
`/invite`; enumeration-safe, rate-limited; a reset ends other sessions (`tokens.test.ts`).
**Remains:** nothing.

---

## Tier 2 — Meaningful product depth

### 5. Automated competitor ingestion — **DONE as an interface (2026-09-09), external gate remains**
**Today:** `ResearchProvider` (`src/lib/research/providers.ts`) with internal, manual and URL
providers, truthful health states, provenance, fingerprints, dedupe and a prompt-injection
quarantine; an `unavailablePlatformProvider` names the blocker for any platform without access.
`ResearchItem.collectedVia` distinguishes `manual` / `url` / `seed` / `adapter` / `run`.
**Remains:** platform adapters, which plug in when approved API access exists (the same reviews as
item 1). Scraping remains deliberately unbuilt and is forbidden by doctrine, not merely deferred.

### 6. Advanced attribution — **SUPERSEDED**
Attribution v1.5 (2026-09-06: tracked links, first-party visitor, touchpoints, first / last /
linear models, evidence classes) and the rev-share-ready fields (2026-09-09) replaced this item.
See `HANDOFF.md` §16d and items 10a–10d below for what is still deliberately open.

### 7. Semantic search over the Brand Brain and research
**Today:** substring search via `contains`, scoped per organisation.
**Needs:** embeddings and a vector store. On PostgreSQL, `pgvector` fits behind the existing
`searchWorkspace` function without changing call sites.

### 8. AI-assisted Brand Brain interview
**Today:** the interview is a human conversation, transcribed and entered manually. The SOP for it
exists in the admin portal.
**Needs:** a recording/transcription integration and an extraction pass that proposes Brand Brain
entries for human approval. **Must remain proposal-then-approve** — auto-populating voice from a
transcript would quietly degrade the context layer.

### 9. Real-time collaboration on scripts
**Today:** version-based. Every edit appends a version; there is no concurrent editing.
**Needs:** a CRDT or operational-transform layer. Low priority — scripts are rarely edited by two
people at once.

---

## Tier 3 — Scale and commercial

### 10. Payments and subscriptions
**Today:** fees are recorded as fields on the organisation for reporting only. No billing.
**Needs:** Stripe subscriptions, invoicing, dunning. Deliberately out of v1: this is a high-ticket
service invoiced directly, not a self-serve product.

### 11. White-labelling and agency reseller mode
**Today:** `Organization.accentHex` exists and the design system is token-driven, so per-client
accent theming is a small step. Full white-labelling is not.
**Needs:** custom domains, per-tenant branding, a reseller hierarchy above organisations.

### 12. Mobile application
**Today:** the web app is responsive and the Recording Room works on a phone.
**Needs:** a native shell, mostly for camera capture and offline recording. Assess only if clients
actually ask.

### 13. Automated video editing
**Today:** production is coordinated, not performed. Editors work in their own tools.
**Needs:** a rendering pipeline. Large, and arguably not Threadline's job — coordination is the
product, not editing.

### 14. AI avatar generation
**Deliberately declined for now.** The product's premise is that the founder's actual face and
voice are the asset. Synthetic presenters contradict the positioning, and clients who want them
are not the ICP.

---

## Deferred from the corpus and Judge V0 (2026-09-07)

**Wiring the Judge into client idea and script approval.** Deliberately not built. The gate is not
engineering effort — it is the calibration reading. An uncalibrated rubric sitting in an approval
path is a confident opinion with authority it has not earned, and the separation on corpus content
does not license it: that number shows the rubric can tell good market content from ordinary market
content, not that it can predict which of our scripts earns a buying conversation. Revisit when
client outcomes exist to check it against, not when the corpus gets bigger.

**Automated corpus collection.** Every row is captured by hand today, which is what the product
claims and all it claims. Automation is gated on the same platform applications as everything else
(`docs/PLATFORM_APPLICATIONS.md`) and on the corpus being worth automating — below 100 examples
the bottleneck is judgement about what belongs in it, not typing speed.

**Rubric v0.2.** Do not change a weight before reading the worst misses. The calibration page puts
them first for that reason. A rubric edited to improve a separation number it was scored against is
a rubric fitted to its own test set.

**Cross-creator and cross-platform banding.** Bands are per-creator on purpose. Comparing across
creators means modelling audience size, platform distribution and topic, and getting any of those
wrong produces a confident ranking of big accounts. Not worth it below a few hundred examples.

**Judge verdicts on ideas and scripts as a background pass.** The polymorphic `subjectType` already
supports it; what is missing is a reason to spend the tokens before the rubric is trusted.

---

## Deferred from attribution v1.5 (2026-09-06)

### 10a. An attribution provider such as Trakyo
**Today:** native tracking plus manual and CRM-sourced events, normalised into `CommercialEvent`.
Its `source`, `externalProvider` and `externalRecordId` columns already describe an imported
event, so a provider would feed the existing model rather than a new one.
**Needs:** the Integration Decision Gate, and a client whose journey the current stack genuinely
cannot reconstruct. Never a dependency, never launch-critical.

### 10b. CRM synchronisation
**Today:** provider, record id and record URL stored on a commercial event. No sync.
**Needs:** evidence that manual mapping is costing real time across several clients.

### 10c. Multi-touch weighting
**Today:** first, last and an even split — all three checkable by hand.
**Needs:** enough journeys for a weighting to be derived from Threadline's own data rather than
imported from someone else's.

### 10d. Automatic platform metric ingestion — **DONE (2026-09-09), see item 2**
**Today:** ingestion exists; tracking health still flags manual snapshots as stale after fourteen
days, and adapter snapshots carry their own freshness state.
**Remains:** platform API access — the long pole and deliberately not a launch blocker.

---

## Deferred from the Living SOP Engine (2026-09-06)

### 9a. Browser confirmation of the checklist save and call outcome — **mostly closed**
**Today:** both are covered by unit tests — `resolveCheck` for the toggle rule and
`assertCallOutcome` for the gates — and both actions (`toggleWedgeCheckAction`,
`recordCallOutcomeAction`) were exercised in-process by the sales block of `qa:all` on
2026-09-09; the pages render without errors in the production browser sweep.
**Needs:** one human click on each, on the founder manual QA list in `docs/QA_REPORT.md`.

### 9b. Delivery, onboarding, renewal and proof workflows as state
**Today:** the modules exist and work; only acquisition and sales are encoded as a state engine.
**Needs:** client #1. The right states are the ones the first delivery actually reveals, and
encoding them beforehand would be guessing with extra steps.

### 9c. Editing style profile and structured editor hiring
**Today:** documented in the resource pack, not modelled.
**Needs:** more than one editor, and repeated evidence that vague feedback is costing revisions.

### 9d. Source-to-multi-asset repurposing as a first-class flow
**Today:** the idea and script models already carry the lineage this would need.
**Needs:** a client with enough source material — a podcast, a webinar, recorded sales calls —
for the derivative queue to be worth building.

### 9e. An attribution provider
**Today:** attribution class, evidence basis and evidence source on each signal, plus a
measurement-health check.
**Needs:** the Integration Decision Gate, and a client whose journey the current stack genuinely
cannot reconstruct. Not launch-critical, and never a dependency.

---

## Deferred from launch hardening (2026-09-04)

### 8a. Breakpoint QA at 1024 / 768 / 390 — **DONE (2026-09-09)**
Closed by `npm run qa:browser` (33 app/admin routes × 1440/1024/768/390 on a production build:
101 PASS, 21 PARTIAL target-size notes, 0 FAIL) and `npm run qa:public` (11 public routes × 20
widths from 1920 to 320: 62/62). Remaining: the 24px target-size polish in dense operator tables
(P3).

### 8b. Qualification rate as a recorded metric — **DONE 2026-09-06**
Closed by not adding the field. `SalesCall.qualified` records whether an attended call was
genuinely a fit, and the rate is counted from that. The funnel labels it measured when attended
calls exist and an assumption when they do not.

### 8c. Readiness history
**Today:** one assessment per organisation, overwritten on re-assessment, with the audit log
carrying the trail.
**Needs:** a versioned assessment if setups start changing often enough that the trajectory matters.

---

## Tier 2 (continued) — deferred from the post-v1 P0 upgrade

These were considered during the P0 work and deliberately left out of scope.

### 9a. Scheduled intelligence cycles
**Today:** a cycle is started, collected and published by a person. The job runner (item 17) now
exists, so the infrastructure half of this is done.
**Needs:** a decision about which sources can be collected unattended — only research providers
with permitted access qualify (`HANDOFF.md` §16i). The run model already supports it — `status`
moves forward on its own once something is driving it.

### 9b. Evidence review queue
**Today:** collected evidence goes straight into the workspace, which is right at the volumes a
manual and URL-driven cycle produces (tens of items, not thousands).
**Needs:** a triage step before evidence becomes citable, and it only becomes necessary alongside
automated ingestion. Adding it now would put a queue in front of work a person already did by hand.

### 9c. Multi-touch attribution behind the proof view
**Today:** attribution v1.5 exists (item 6, superseded) and the curated client Results view groups
by evidence class. `ProofPeriod` itself still attributes commercial value only where a buyer named
a specific piece, and the UI says so in those words.
**Needs:** enough tracked journeys for the proof view to cite touchpoint evidence without
widening the claim — exactly the overstatement the proof module was built to prevent.

### 9d. Brief and proof export
**Today:** both render and print cleanly from the browser.
**Needs:** server-side document generation. Email delivery (item 3) is built, so the remaining
dependency is the PDF renderer alone.

---

## Platform and operational

### 15. Shared-store rate limiting — **DONE (2026-09-09)**
**Today:** `RATE_LIMIT_STORE=memory` (default, per instance) or `redis` (Upstash-compatible REST)
behind one store interface; fails closed when the shared store is required and unreachable
(`rate-limit.test.ts`).
**Remains:** a Redis endpoint before running more than one instance. Configuration only.

### 16. Object storage — **DONE (2026-09-09)**
**Today:** `STORAGE_PROVIDER=local` or `s3` (SigV4 over `fetch`, tenant-scoped keys, private
bucket, proxied reads through the membership-checked file route), plus a memory adapter for tests
(`storage.test.ts`, ADR-023).
**Remains:** a bucket and the five `S3_*` values before a multi-instance deploy. Configuration
only.

### 17. Background jobs — **DONE (2026-09-09)**
**Today:** `Job` table with idempotency keys, leases with stale recovery, backoff and a dead state;
handlers for email, metric refresh and maintenance; `npm run jobs:worker` (or `--once`)
(`jobs.test.ts`, ADR-021).
**Remains:** scheduled report generation and digest emails as additional handlers, once email is
live and a client wants them.

### 18. Full-text search on PostgreSQL
**Today:** `contains`, which is adequate at v1 data volumes.
**Needs:** `tsvector` columns and indexes behind the same repository functions.

### 19. Audit log viewer for clients
**Today:** every state change is recorded in `AuditLog`; only the admin portal surfaces it.
**Needs:** a client-facing, filtered view. Small.

### 20. Browser extension for research capture
**Today:** research is pasted in.
**Needs:** an extension that posts to an authenticated endpoint. Would meaningfully raise research
volume, which is the strongest predictor of output quality.

---

## Explicitly not planned

- **Chat as primary navigation.** The product is an operating system with a defined loop, not a
  prompt box.
- **Guaranteed reach, lead or revenue claims** anywhere in the product or marketing.
- **Client-specific forks.** Configuration changes; the codebase does not. This is the single
  invariant that keeps the product good.
- **Simulated integrations.** If a connection is not real, the UI says so.
- **A separate client application.** One system, two experiences, one database. A second app is
  two codebases, two deployments and two places for a tenancy bug to live.
- **Acquisition tooling.** No scraping, no cold-email sending, no platform automation, no
  browser-extension outreach, no ads modules. Acquisition is an operating activity; building
  software for it before there is a client is the most expensive possible form of procrastination.
- **Automated human social behaviour** (doctrine, `HANDOFF.md` §16i, DEC-018). No browser bots or
  driver-operated social accounts, no cookie/session-token automation, no stored client social
  passwords, no auto-like, engagement pods, follow/unfollow, connection farming, bulk unsolicited
  replies/DMs/comments, no recommendation or location manipulation, no evasion of rate limits,
  app review or restrictions. Publishing, analytics and research use official rails; engagement
  is a person.
- **Geography spoofing.** The earlier SIM/eSIM + VPN idea for influencing organic recommendation
  geography is retired (DEC-019). Earn a US audience with US buyer problems, terminology and
  examples, genuine relationships, posting windows, audience-geography measurement and, where
  justified, legitimate paid geo-targeting.
- **Public pricing.** Exact service pricing is not published on the website (DEC-017); it is
  discussed in the qualified sales process. No "from £X", discounts, scarcity or urgency.
- **Tiered pricing.** One founding offer until repeated demand proves a second is wanted.
- **Automatic long-form upload before verification.** The YouTube connector can upload (item 1),
  but it stays behind Google's OAuth verification of the sensitive scope; until that passes the
  founder sees a warning screen and the long-form route stays manual by policy.
- **A CRM.** Contacts, companies, communications, calendar, email and deal objects belong to an
  external CRM. Threadline holds the state machine and links out with three columns. Building a
  worse CRM inside the product is a large amount of work that makes the product worse.
- **CRM synchronisation.** Manual link first. Sync only once a real workflow proves it saves
  repeated work, per the Integration Decision Gate.
- **Stored funnel counters.** Every rate is counted from records. A counter would drift the first
  time somebody corrected a record.
- **Fingerprinting or a cross-device identity graph.** Identity is a first-party token that says
  "same browser" and nothing else. Anything stronger would be a claim the mechanism cannot support.
- **ML or weighted attribution.** A model a client cannot check by hand has to be taken on trust,
  which is the opposite of what attribution is for.
- **Ad attribution, heatmaps, session replay, lead scoring, a BI builder, a public API.** None of
  these improve delivery, proof, optimisation, sales justification or retention.
- **Synthetic results as proof.** Structurally refused, not merely discouraged.
- **Machine-approved signals.** No "auto-approve high-confidence findings" setting. The human
  decision gate is the product's central claim, and a confidence threshold is not a person.
- **Stored progress flags.** Installation milestones and observable proof figures stay derived. A
  "mark as done" control would make the progress view unfalsifiable, which is worse than not
  having one.
- **Causal claims in proof.** The product will not say Threadline caused a number to move, and no
  configuration will make it.

---

## What is genuinely open (2026-09-09)

Payments/billing (#10), semantic search (#7), the AI Brand Brain interview (#8), real-time script
collaboration (#9), server-side PDF export (#9d), drag-and-drop on the board, playbook email
capture (after email delivery is live), a bulk-row performance run beyond `qa:perf`'s five
populated workspaces, and everything client #1 has to earn (#9b, #9c, #9e, #10a–10c, #8c).
Everything else in Tier 1 and the platform/operational tier is built and gated on credentials,
platform reviews or founder inputs listed in `HANDOFF.md` §18.
