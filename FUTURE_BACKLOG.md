# Threadline OS — Future backlog

Documented deliberately, and deliberately **not** blocking v1. Each item notes what exists today
so the next session knows what it is building on rather than starting from nothing.

Last updated: 2026-09-06

---

## Tier 1 — Highest value next

### 1. LinkedIn publishing and analytics
**Today:** `adapter_only`. Configuration UI, adapter interface and manual workflow all exist; the
adapter returns an explicit `unavailable` result rather than simulating a connection.
**Needs:** an approved LinkedIn Marketing Developer Platform application, OAuth flow, encrypted
token storage (a new concern — nothing in v1 stores a secret), and a `publish()` implementation.
**Effort:** large, mostly waiting on platform approval.

### 2. Automatic metric import
**Today:** every metric is entered by hand; `PerformanceSnapshot.source` already distinguishes
`manual` from `adapter`, and the time-series model supports repeated readings.
**Needs:** per-provider `fetchMetrics()` implementations plus a scheduled job. The whole
performance layer already works from snapshots, so this is purely an ingestion problem.
**Effort:** medium per provider.

### 3. Email delivery
**Today:** none. Members are created with an operator-set password shared out of band, and the UI
says so plainly.
**Needs:** a transactional provider, invitation and password-reset flows, and weekly-report
delivery. Report content already renders and prints cleanly.
**Effort:** medium.

### 4. Password reset and email verification
**Today:** not built. Auth is session-based with scrypt hashing; adding reset tokens is
straightforward once email exists.
**Effort:** small, blocked on item 3.

---

## Tier 2 — Meaningful product depth

### 5. Automated competitor ingestion
**Today:** the intelligence run collects from three real paths — internal workspace records, a URL
a person supplied (fetched and read server-side, SSRF-guarded), and pasted material.
`ResearchItem.collectedVia` distinguishes `manual` / `url` / `seed` / `adapter` / `run`, and
deduplication by fingerprint already exists.
**Needs:** scheduled, unattended collection per source. That requires either approved platform
API access (the same long pole as publishing) or a decision about scraping that we have
deliberately not taken. The review queue this item used to ask for now exists as the candidate
signal gate.

### 6. Advanced attribution
**Today:** single-touch. An inquiry links to one content item and one publish record.
**Needs:** tracked links, a session/identity model, and multi-touch weighting. Worth doing only
once clients have enough volume for multi-touch to say anything true.

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

### 10d. Automatic platform metric ingestion
**Today:** manual snapshots; tracking health flags them as stale after fourteen days.
**Needs:** platform API access, which is the long pole and deliberately not a launch blocker.

---

## Deferred from the Living SOP Engine (2026-09-06)

### 9a. Browser confirmation of the checklist save and call outcome
**Today:** both are covered by unit tests — `resolveCheck` for the toggle rule and
`assertCallOutcome` for the gates — and both surfaces render correctly.
**Needs:** somebody to tick a box and record a call outcome in a browser once. The tab stopped
receiving clicks part way through QA, so this is unconfirmed rather than known good.

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

### 8a. Breakpoint QA at 1024 / 768 / 390
**Today:** built responsive throughout and verified at roughly 1440px in a real browser, with no
console errors. Narrower widths are unverified because this environment cannot change the viewport.
**Needs:** twenty minutes with a browser and a device toolbar. This is the one open QA item.

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
**Today:** a cycle is started, collected and published by a person.
**Needs:** the background job runner in item 17, plus a decision about which sources can be
collected unattended. The run model already supports it — `status` moves forward on its own once
something is driving it.

### 9b. Evidence review queue
**Today:** collected evidence goes straight into the workspace, which is right at the volumes a
manual and URL-driven cycle produces (tens of items, not thousands).
**Needs:** a triage step before evidence becomes citable, and it only becomes necessary alongside
automated ingestion. Adding it now would put a queue in front of work a person already did by hand.

### 9c. Multi-touch attribution behind the proof view
**Today:** `ProofPeriod` attributes commercial value only where a buyer named a specific piece,
and the UI says so in those words.
**Needs:** item 6. Until then, widening the claim would be exactly the kind of overstatement the
proof module was built to prevent.

### 9d. Brief and proof export
**Today:** both render and print cleanly from the browser.
**Needs:** server-side document generation, the same dependency as item 17's report delivery.

---

## Platform and operational

### 15. Shared-store rate limiting
**Today:** in-memory sliding window, correct for a single instance.
**Needs:** Redis or equivalent before running multiple instances. Call sites do not change.

### 16. Object storage
**Today:** local disk behind a `StorageAdapter` interface, served through an authorised route that
re-checks membership per request.
**Needs:** an S3 or Supabase adapter. One file to implement.

### 17. Background jobs
**Today:** everything is request-driven. Reports and pattern detection are triggered by a person.
**Needs:** a queue for scheduled reports, metric imports and digest emails.

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
- **Tiered pricing.** One founding offer until repeated demand proves a second is wanted.
- **Automatic long-form upload.** Needs a verified OAuth consent screen we do not have.
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

## Status update — 2026-09-09 completion pass

- **#1 LinkedIn publishing/analytics** → connectors built to the mocked boundary for LinkedIn, YouTube, Instagram, TikTok and X; remaining work is credentials and platform review (external gates).
- **#2 Automatic metric import** → built (`src/lib/analytics`), with a `metrics.refresh` job; live data is an external gate.
- **#3 Email delivery** → built (capture + Resend); weekly-report delivery is a job away once a provider is configured.
- **#4 Password reset** → built, plus invitations.
- **#5 Automated competitor ingestion** → `ResearchProvider` interface built with truthful states; platform adapters plug in when access exists; scraping remains deliberately unbuilt.
- **#6 Advanced attribution** → superseded by attribution v1.5 (2026-09-06) and rev-share-ready fields (2026-09-09).
- **Background jobs, object storage, shared rate limit** → built.

Still deliberately open: payments/billing (#10), semantic search (#7), AI Brand Brain interview (#8), real-time script collaboration (#9), server-side PDF export, drag-and-drop, playbook email capture (after email is live), a bulk-row performance run beyond `qa:perf`'s five populated workspaces.
