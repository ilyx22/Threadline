# Threadline OS — Build Checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` complete · `[!]` blocked

This file is the durable source of truth for build state. It is updated as work proceeds so a new
session can resume from disk alone (see `/HANDOFF.md`).

---

## Phase 0 — Foundation

- [x] Audit repository (empty; greenfield)
- [x] Choose stack, record ADRs
- [x] `package.json`, dependencies installed
- [x] `docs/PRODUCT_SPEC.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DATA_MODEL.md`
- [x] `docs/BUILD_CHECKLIST.md`
- [x] `docs/ACCEPTANCE_TESTS.md`
- [x] Prisma schema + initial migration applied (39 models at v1; 47 after the P0 upgrade)
- [x] TypeScript / Next / Tailwind / ESLint / PostCSS config
- [x] `.env.example`, `.gitignore`
- [x] Git repository initialised

## Phase 1 — Design system

- [x] Design tokens in `globals.css` (`@theme`), dark-first
- [x] Typography scale, tabular numerics, focus rings
- [x] `cn()` utility, formatting helpers, date helpers
- [x] Logo: wordmark + thread symbol (SVG components)
- [x] Primitives: Button, IconButton, Card, Badge, Pill, Input, Textarea, Select, Checkbox,
      Switch, Slider, Label, Field
- [x] Overlays: Dialog, Sheet, DropdownMenu, Tooltip, Popover, ConfirmDialog
- [x] Structure: Tabs, Accordion, Table, DataTable, Separator, Breadcrumbs, SegmentedControl,
      ScrollArea
- [x] Feedback: Toast/Toaster, Skeleton, EmptyState, Progress, ErrorState
- [x] Data display: StatCard, ScoreBar, StageBadge, Timeline, Avatar, Kbd, CopyButton
- [x] Charts: AreaTrend, BarSeries, HorizontalRank, Sparkline, DonutSplit, RetentionCurve

## Phase 2 — Auth, tenancy, security

- [x] Password hashing (`node:crypto` scrypt) + constant-time verify
- [x] Session create/resolve/destroy, httpOnly cookie
- [x] Role capability matrix (`roles.ts`)
- [x] `requireUser`, `requireOrgAccess`, `requireInternal`, `requireCapability`
- [x] `middleware.ts` route protection
- [x] Login page + logout
- [x] Rate limiting (login, application form, AI actions)
- [x] Audit log writer
- [x] Tenancy unit tests (cross-tenant read empty, cross-tenant write throws)

## Phase 3 — Data layer

- [x] Prisma client singleton
- [x] Typed JSON helpers
- [x] Domain unions + labels (`domain/*`)
- [x] Scoring (idea priority, pattern score)
- [x] Workflow transition rules + guards
- [x] Repositories for every module (org-scoped)
- [x] Lineage resolver

## Phase 4 — AI layer

- [x] `AiProvider` interface
- [x] Anthropic provider
- [x] Mock provider (deterministic, context-aware, explicitly labelled)
- [x] `runGeneration` wrapper + `AiGeneration` accounting
- [x] Context composers (8 blocks)
- [x] Prompt templates (ideas, script, hooks, refine, packaging, patterns, report)
- [x] Generators with Zod-validated output + retry + real error surfacing

## Phase 5 — Client portal

- [x] App shell: sidebar, topbar, org switcher, user menu, mobile nav
- [x] Command menu (Cmd/Ctrl-K) + global search
- [x] Notifications panel
- [x] HOME — Founder Command Centre
- [x] INTELLIGENCE / Brand Brain (7 sections, inline editing)
- [x] INTELLIGENCE / Market Radar (research, competitors, tags, filters, search)
- [x] INTELLIGENCE / Signals (outliers, patterns, hypotheses, tests, learnings)
- [x] CREATE / Ideas (list, filters, bulk actions, detail, generation, scoring)
- [x] CREATE / Scripts (list, editor, versions, hooks, refinement, claims, QA states)
- [x] PRODUCTION / Recording Room + teleprompter
- [x] PRODUCTION / Board (kanban + table, assignment, comments, revisions, approvals)
- [x] PRODUCTION / Content detail + lineage + timeline
- [x] PRODUCTION / Packaging
- [x] DISTRIBUTION (calendar, list, publish records, accounts, integrations)
- [x] PERFORMANCE (snapshot entry, breakdowns, winners/losers, learnings write-back)
- [x] PIPELINE (inquiries, stages, attribution)
- [x] LIBRARY (assets, upload, search, filters)
- [x] REPORTS (weekly report generation + presentation + print)
- [x] TASKS
- [x] SETTINGS (workspace, members, content rules, integrations, demo)

## Phase 6 — Onboarding

- [x] 15-step flow with autosave, progress, back navigation
- [x] Per-step validation and "why we ask" context
- [x] Review step with edit-in-place
- [x] System build step (real work, honest progress)
- [x] Completion writes Brand Brain, research, ideas, tasks; lands in populated Home

## Phase 7 — Admin portal

- [x] Clients list + health + alerts
- [x] Client detail + configuration
- [x] Create client from master template
- [x] Operator cross-client queue
- [x] Support / issue log
- [x] SOP library (13 templates)
- [x] Applications inbox
- [x] Internal metrics

## Phase 8 — Marketing site

- [x] Layout, nav, footer, design system reuse
- [x] Home: hero, problem, new operating model, engine walkthrough, leverage, how it works,
      who it is for, positioning, FAQ, CTA
- [x] Product UI visualisations (real component-built, not screenshots)
- [x] `/how-it-works`, `/who-its-for`
- [x] `/apply` — multi-step application form, persisted, routes to booking
- [x] `/calculator` — ROI/cost scenario calculator with honest framing

## Phase 9 — Demo

- [x] Seed script: demo org, users, full Brand Brain
- [x] Research (competitors, items, tags), signals
- [x] 30+ ideas, scripts with versions
- [x] Content across all 7 stages, assets, comments, events
- [x] Packaging, publish records, 90 days performance
- [x] Pipeline inquiries, weekly reports, operating metrics, tasks, notifications
- [x] Second tenant (isolation proof) + internal org + SOPs + applications
- [x] Demo tour (9 stops)

## Phase 10 — QA and delivery

- [x] `npm run typecheck` clean
- [x] `npm run lint` clean
- [x] `npm test` passing
- [x] `npm run build` passing
- [x] Acceptance tests executed and recorded
- [~] Responsive checks (desktop / tablet / mobile) — built responsive throughout and markup reviewed; visual confirmation in a browser is outstanding (see docs/ACCEPTANCE_TESTS.md section O)
- [x] Loading / empty / error states verified
- [x] `README.md`
- [x] `HANDOFF.md`
- [x] `FUTURE_BACKLOG.md`
- [x] `.env.example` complete

---

## Phase 11 — Post-v1 P0 upgrade (2026-09-03)

Scope was fixed to five P0 items. Nothing else was added; anything encountered along the way went
to `FUTURE_BACKLOG.md` unless it was a blocker, a security issue, or genuinely required to make
these workflows function.

### P0-1 — Intelligence Run

- [x] Schema: `IntelligenceRun`, `RunSource`, `CandidateSignal`, `CandidateEvidence`; `Pattern`
      gains `runId`, `derivedFromId`, `rank`, `successMetric`, `feedbackNote`; `ResearchItem`
      gains `runId`, `sourceMeta`, `dedupeKey`
- [x] Domain rules: run lifecycle, publish gates, evidence fingerprinting, test ranking and
      bounded confidence feedback — `src/lib/domain/intelligence.ts`
- [x] Source declaration with honest collection modes (internal / URL / manual) and an explicit
      not-collectable state carrying the specific blocker
- [x] Real URL collection with SSRF guards — `src/lib/integrations/fetch-url.ts`
- [x] Internal collection from the workspace's own content, performance and pipeline
- [x] Manual intake: pasted call notes and customer language split into separate evidence items
- [x] Evidence keeps source URL, source type, timestamp and metadata; deduplicated by fingerprint
- [x] AI extraction of candidate signals with mandatory evidence citation; a candidate whose
      citations do not resolve is discarded rather than repaired
- [x] Human approve / reject / edit gate; approval creates a `Pattern` and carries evidence across
- [x] Approved signals become ranked content tests, each with a defined read
- [x] Tests seed ideas through the existing promotion path
- [x] Performance and commercial results feed back into signal confidence, in bounded steps
- [x] Client-facing brief, frozen at publish, reading as "what we found, why it matters, what we
      are doing about it"
- [x] Demo-provider output for both new prompts, citing only evidence that was supplied

### P0-2 — Constraint diagnosis

- [x] Schema: `ConstraintDiagnosis`, `ConstraintAssessment`
- [x] Nine dimensions, each with the question it asks and whether volume plausibly helps
- [x] Stored: primary constraint, evidence, severity, confidence, commercial impact, recommended
      action, experiment, review date
- [x] Activation gate: all nine rated, plus a written commercial impact
- [x] Seeded as a draft from onboarding answers (four dimensions only; five need a person)
- [x] Surfaced in onboarding, the client portal, the admin client view and Home
- [x] Monthly strategy review, appended to the record rather than overwriting it

### P0-3 — Day-7 win

- [x] Seven milestones with target days, owners and operator actions
- [x] Completion derived from real workspace records; only sign-off and blockers stored
- [x] Operator view: action required, blockers and per-milestone detail on the admin client page
- [x] Client view: calm progress with one clear next step — `/app/[org]/install`
- [x] Home card while incomplete, which disappears once the installation genuinely is complete

### P0-4 — Proof capture

- [x] Schema: `ProofPeriod` (baseline and months)
- [x] Nine measures: founder time, output, cycle time, approval time, audience quality, qualified
      inquiries, calls booked, attributable commercial signal, qualitative outcomes
- [x] Platform-observable figures recomputed at read time and deliberately not editable
- [x] Client-reported figures labelled as reported everywhere they appear
- [x] Comparison view with careful, non-causal language — enforced by tests
- [x] Period locking, following the frozen-report rule
- [x] Baseline seeded from onboarding answers

### P0-5 — Public website and UX conversion pass

- [x] New information hierarchy: outcome, pain, mechanism, you do / Threadline does, intelligence
      proof, fast first win, fit and disqualifiers, product proof, CTA
- [x] Hero rewritten to lead with the outcome rather than the software
- [x] One dominant CTA per viewport, plus a sticky CTA that stands down near the closing CTA
- [x] Subtle scroll reveal that keeps the page fully readable with JavaScript disabled
- [x] Three new product visualisations: intelligence brief, constraint diagnosis, installation
- [x] `/how-it-works` and `/who-its-for` rewritten around the updated ICP and mechanism
- [x] Application flow reframed as a diagnostic rather than a signup
- [x] No fabricated proof, no neon AI aesthetic, no feature grid

### QA

- [x] Tests added for every new domain module and for the new tenant boundaries
- [x] `npm run typecheck` clean
- [x] `npm run lint` clean
- [x] `npm test` passing — 188 tests, 38 suites
- [x] `npm run build` passing — 47 routes
- [x] New flows verified against the running application, per role and per tenant
- [x] Documentation updated to match the implementation
- [~] Browser-only visual QA of the new screens — carried forward from v1; see
      `docs/ACCEPTANCE_TESTS.md` section O

---

## Phase 12 — Launch hardening (2026-09-04)

Client/operator separation, recording readiness, the long-form pilot, honest access methods, and
the V14 positioning and market-validation corrections. Incremental throughout: no rebuilds, no new
parallel models where an existing abstraction fitted.

### Client surface

- [x] `operatorNav` (full loop) and `clientNav` (eight destinations) split from one definition
- [x] Surface resolved once in the workspace layout and passed to the chrome
- [x] Raw research, undecided candidates, unapproved signals and draft diagnoses made
      internal-only **capabilities**, so routes deny independently of the nav
- [x] `src/lib/domain/visibility.ts` — derived visibility, one stored flag, documented reasoning
- [x] Repository filters (`clientScope`) applied to runs, signals, diagnoses and comments
- [x] Global search scoped by role — raw research and internal signals never reachable
- [x] Notifications filtered by the reader's capabilities
- [x] `/approvals` — one queue, oldest first
- [x] "Threadline is working on" — eight counts from persisted, tenant-scoped records
- [x] Reports a quiet week as quiet rather than padding it

### Recording readiness

- [x] `RecordingReadiness` + `ReadinessCheck`; setup photos and test clips reuse `Asset`
- [x] Seven checks, each with the question asked and why it matters
- [x] `ready` refused with anything unassessed or blocking
- [x] `blocked` or `ready_with_limitation` refused without a client action
- [x] Client submits, operator assesses — a client cannot mark their own room ready
- [x] Blocked or limited setup creates a real client task and notification
- [x] Wired in as an eighth installation milestone, derived from the record

### Long-form pilot

- [x] Entitlement via the existing `modulesEnabled` — off by default
- [x] Long-form work refused for a client without the module
- [x] Orientation derived from format, never stored
- [x] Packaging: working title, final title, thumbnail reference, approval state
- [x] Approval refused without a final title, thumbnail and description
- [x] Admin scope panel with an audited enable/disable
- [x] No automatic upload, deliberately

### Honest access

- [x] `Integration.accessMethod`: `manual | native_delegated | api`
- [x] Rendered separately from status, so "set up" cannot read as "connected"
- [x] No new OAuth, no browser-extension publishing

### Positioning and validation (V14)

- [x] Public copy moved from workflow-led to creative-led, per the locked positioning
- [x] Login tagline corrected
- [x] "Expert-led B2B" presented as the umbrella, not a validated niche
- [x] Active wedge and problem hypothesis recorded as an editable internal document, including
      how to read validation evidence honestly
- [x] Funnel maths on the existing metrics dashboard, channel-agnostic, refusing to project on
      unmeasured rates
- [x] Demo fees aligned to the locked offer (GBP 2,500 + GBP 2,500/month)
- [x] No tiered pricing UI, no acquisition tooling, no channel hard-coded as doctrine

### Browser QA — defects found and fixed

- [x] `text-base` used as a colour is Tailwind's **font-size** utility and silently wins, leaving
      **every primary and accent button label invisible**. Seven occurrences fixed.
- [x] Middleware sent signed-in users from `/login` to `/app`, which had no route — a 404 for
      every signed-in user. Fixed with a real `/app` entry route.
- [x] Approvals nav badge (7) disagreed with the page (29); both now read one function
- [x] Raw Zod type errors shown for blank required fields; fixed centrally for every form
- [x] `/install/recording` highlighted the wrong nav item

### QA

- [x] `npm run typecheck` clean
- [x] `npm run lint` clean
- [x] `npm test` — 263 tests, 54 suites, 0 failures
- [x] `npm run build` — 49 routes
- [x] Migration applied and seed re-run on a clean database
- [x] Browser QA at ~1440px: client surface, approvals, recording setup, no console errors
- [~] Breakpoint QA at 1024 / 768 / 390 — this environment cannot change the viewport (window
      resize ignored, iframes refused by the app's own clickjacking headers, popups blocked)

---


## Phase 13 — the Living SOP Engine (2026-09-06)

Threadline's own market validation, prospect pipeline, sales calls and acquisition arithmetic.
Built against the full business resource pack, present in the workspace for the first time.

### Market validation

- [x] Wedge states: candidate, immersion, interviews, commercial test, validated, revised
- [x] Candidate scoring on economics, pain, reachability and precedent
- [x] Research conversations recorded with `volunteered` separate from the problem
- [x] Sample gate: no commercial testing below five recorded conversations, no override
- [x] The reading of the evidence is a sentence, never a rate — asserted by test
- [x] Exactly one active wedge, changed deliberately and audited

### Prospects and sales

- [x] Prospect states from sourced to won, lost or not a fit
- [x] Per-state checklists with the reason each item exists
- [x] Items whose value is a finding require the finding, not a tick
- [x] Forward transitions gated; override allowed with a written reason, into the audit trail
- [x] Reply classification with an objective per class, not a script
- [x] Pre-call preparation checklist, gated before the call can run
- [x] Sales state map with per-stage notes
- [x] One outcome per call, their exact words required, dated next action when still alive
- [x] A no-show recorded as a funnel event rather than an outcome

### The invariant

- [x] No active record without a next action and a due date, enforced on every write
- [x] Deterministic defaults supplied on state entry; nothing invented where timing depends on a
      conversation
- [x] `invariantBreaches()` reports anything that got past it, surfaced on the cockpit

### Acquisition

- [x] Required first touches from target wins and the four rates
- [x] Every rate counted from records rather than entered
- [x] Qualification promoted from assumption to measurement once call outcomes exist
- [x] Measured projection shown beside the assumed one, never instead of it
- [x] Daily quota, completed today, remaining today
- [x] Warning when the arithmetic demands an impossible day
- [x] Per-channel rates kept separate; no channel named anywhere in the model
- [x] Weekly control loop with frozen counts and one variable per week

### The cockpit

- [x] `/admin` reordered around what can still change the outcome today
- [x] Client delivery and measurement health alongside, not above
- [x] Portfolio list left at `/admin/clients`, where managing clients belongs

### Results and attribution

- [x] Attribution class, evidence basis and evidence source on every commercial signal
- [x] Defaults are the weakest honest answer
- [x] Class rendered beside the content link everywhere the link appears
- [x] Measurement-health alerts before any number is interpreted

### Deliberately not built

- [x] No CRM: no contacts, companies, communications or deal objects — three link columns only
- [x] No CRM synchronisation
- [x] No outreach sending, sequences, scraping or list building
- [x] No analytics platform, UTM builder or attribution provider integration
- [x] No delivery, onboarding, renewal or proof workflow automation — client #1 earns that

### QA

- [x] `npm run typecheck` clean
- [x] `npm run lint` clean
- [x] `npm test` — 337 tests, 73 suites, 0 failures
- [x] `npm run build` — 54 routes
- [x] Migration applied and seed re-run on a clean database
- [x] Browser QA: cockpit, market, wedge detail, prospects, prospect detail, acquisition — no
      console errors; the interview sample gate and the session-loop fix exercised end to end
- [~] Checklist save and call outcome not confirmed in a browser — the tab began reporting
      `document.hidden` with zero-size layout part way through and stopped receiving clicks

---


## Phase 14 — attribution v1.5 and the synthetic dry run (2026-09-06)

### Content identity and tracked links

- [x] Tracked redirect at `/t/<slug>`: records the click, forwards to the stored destination
- [x] Destination validated on write — schemes, credentials, and our own auth/API/admin routes
- [x] Random slugs, so client destinations cannot be enumerated
- [x] Retired links stop redirecting; the touchpoints they recorded are kept
- [x] The redirect never fails a visitor because measurement failed
- [x] Works for content Threadline did not publish — no social API needed

### Journey

- [x] Anonymous first-party visitor token, unique per organisation
- [x] Touchpoints: click, form, reported, provider — each with provenance
- [x] Only the referring host stored, never the full URL
- [x] No fingerprinting, no device signals, no cross-device stitching
- [x] `Inquiry.visitorId` joins a person to the journey they arrived through
- [x] Operator journey timeline, in order, gaps shown as gaps

### Attribution

- [x] First touch, last touch, linear — nothing weighted or learned
- [x] Only touches before the event and inside a 90-day window qualify
- [x] Linear splits across distinct assets; a repeat visit buys no extra credit
- [x] Credit reconciles to the whole on awkward divisions
- [x] One deal, one credited outcome — an opportunity that closes is counted once
- [x] Evidence class carried from the event and never raised by a model

### Commercial events and evidence

- [x] Seven funnel kinds, each dated, each with a source
- [x] Provenance: native, CRM, booking, payment, operator, client-reported
- [x] External CRM reference stored; no synchronisation, no fake connection
- [x] A hand-entered figure requires a note saying where it came from
- [x] Five evidence classes preserved and never collapsed into a binary

### Reporting

- [x] Credit by asset, pillar, CTA and platform; missing dimensions grouped, not dropped
- [x] Funnel draws only the stages with recorded events
- [x] Money per asset withheld below 50% defensible coverage, with the reason
- [x] Per-10k normalisation refuses below a readable amount of reach
- [x] Curated client Results grouped by evidence class, never summed into one figure
- [x] Attribution block frozen into the weekly report payload

### Tracking health

- [x] Baseline, live URLs, tracked links, commercial events, metric freshness
- [x] Runs before any number is interpreted
- [x] Says missing tracking is missing data, not zero commercial value

### Synthetic dry run

- [x] `Organization.synthetic` — a column, not a naming convention
- [x] Stays `kind: "client"` so it exercises the real fulfilment path
- [x] Excluded from portfolio totals and MRR
- [x] `assertNotSyntheticProof` refuses it wherever proof is used
- [x] Banner above every page in the workspace
- [x] Clearing the marker carries the heavier confirmation
- [x] Seeded with deliberate friction: a failed recording, and waiting time

### Delivery Load

- [x] Active minutes and waiting minutes kept apart
- [x] Cash cost and a work class filled in afterwards, from how it went
- [x] Summary labelled synthetic where the workspace is
- [x] Operator-only; a client has no reason to see how long their work took us

### Deliberately not built

- [x] No third-party connectors, ad attribution, fingerprinting or identity graph
- [x] No ML or weighted attribution, analytics warehouse, BI builder, heatmaps or session replay
- [x] No lead scoring, public API, SaaS billing, CRM or video editing
- [x] No Trakyo integration — the boundary it would feed exists; the integration does not

### QA

- [x] `npm run typecheck` clean
- [x] `npm run lint` clean
- [x] `npm test` — 403 tests, 94 suites, 0 failures
- [x] `npm run build` — 55 pages plus the redirect route
- [x] Two migrations applied; seed re-run on a clean database
- [x] Redirect verified by request: 302 to the stored destination, httpOnly first-party cookie,
      touchpoint recorded, 404 for unknown and retired slugs
- [x] Operator attribution surface verified in a real browser
- [x] Client role requesting it redirected to no-access, with none of its content in the response
- [x] Synthetic banner and Delivery Load summary verified in the dry-run workspace
- [~] Breakpoint QA below 1440px still outstanding from Phase 12

---

## Phase 15 — cadence, the validation gate, the corpus and Judge V0 (2026-09-07)

### Service-period cadence

- [x] `src/lib/domain/service-period.ts` — four-week period, three periods to an initial
      engagement, thirteen periods a year, and the monthly-equivalent conversion
- [x] `Organization.monthlyFee` renamed `periodFee`; `ProofPeriod.kind` `month` → `period`
- [x] Hand-written migration (`RENAME COLUMN`, an `UPDATE` for stored kinds, the new
      `problemTheme` column) applied with `migrate deploy`
- [x] Contract value and pipeline arithmetic read the constants rather than multiplying by 3
- [x] Calendar-monthly concepts audited and deliberately left monthly — `InternalMetric` is
      reconciled against a real calendar month, and forcing it onto a four-week cycle would
      make it disagree with the bank

### The validation gate

- [x] `INTERIM_CHECKPOINT = 5`, `VALIDATION_DECISION_MINIMUM = 10`, `CONVERGENCE_MINIMUM = 6`
- [x] Five is a checkpoint that reports, not a gate that opens: the error message says so
      explicitly when the count sits between five and ten
- [x] Ten makes a wedge *eligible for a decision* — it does not pass one. Convergence is the
      second, separate condition
- [x] `problemTheme` on `ValidationConversation`, assigned by the operator. Convergence counts
      assigned themes; unthemed conversations are excluded rather than guessed at
- [x] `readValidation` returns a reading — headline, convergence, what is missing — rather than
      a boolean

### The wedge

- [x] The M&A/corporate-finance wedge preserved as `active: false` with its state, its three
      conversations and all 53 prospects intact
- [x] The new wedge starts at `immersion` with zero conversations, which is the true state
- [x] Prospects deliberately **not** reattached — a pipeline for a hypothesis that has none

### The research corpus

- [x] `ResearchExample`, `ExampleAnalysis` — no `orgId`, unique `url`, `illustrative` marker
- [x] Bands computed against the creator's own median, excluding the piece itself (ADR-017)
- [x] `unknown` below three baseline pieces rather than a number nobody should trust
- [x] Corpus reading states its own weakness below 100 examples in as many words
- [x] Seven illustrative rows seeded, shaped so the banding is visible: one outperformer against
      four ordinary pieces by the same creator, and a large account with no baseline at all
- [x] `/admin/research`, guarded by `corpus.manage`, unreachable from any client role

### Judge V0

- [x] Nine criteria, three of them gating; rubric `v0.1`
- [x] **The model scores criteria; the verdict is our arithmetic** — no overall is ever asked for
- [x] Every verdict written `calibrated: false`, stored not computed (ADR-018)
- [x] The disclaimer appears on every surface that shows a score
- [x] **Not wired into client idea or script approval.** Deliberate: an uncalibrated rubric in an
      approval path is a confident opinion with authority it has not earned
- [x] `/admin/research/calibration` — separation between what outperformed and what did not,
      the worst misses first, and a written account of what the number cannot tell you
- [x] Illustrative rows excluded from calibration; the page says how many and why
- [x] `calibrated` never becomes true from corpus separation alone — reserved for client outcomes

### Verified end to end

- [x] 11,000 views banded `exceptional` against its creator's ~1,400 median; 40,000 views on a
      250k-follower account banded `unknown` for lack of a baseline
- [x] Calibration refused to conclude on 0 usable pairs and said why
- [ ] Browser QA of the corpus and calibration surfaces — not run this session

---

## Verification record

**Run 2026-09-07**, after the corpus and Judge V0, from a clean re-seed:

- `npm run typecheck` — PASS (0 errors, strict)
- `npm run lint` — PASS (0 errors, 0 warnings)
- `npm test` — PASS (451 tests, 107 suites, 0 failures)
- `npm run build` — PASS (60 routes, including the two research surfaces)
- `npm run seed` — PASS (4 organisations, 7 illustrative corpus rows, no QA residue)

**Run 2026-09-06**, after attribution v1.5, from a clean re-seed:

- `npm run typecheck` — PASS (0 errors, strict)
- `npm run lint` — PASS (0 errors, 0 warnings)
- `npm test` — PASS (403 tests, 94 suites, 0 failures)
- `npm run build` — PASS (55 pages plus the `/t/[slug]` redirect)
- `npm run seed` — PASS (4 organisations including the dry run, no QA residue)

Previous runs: 2026-09-06 (337 tests, 54 routes), 2026-09-04 (263 tests, 49 routes),
2026-09-03 (188 tests, 47 routes), 2026-09-02 (74 tests, 43 routes).

Manual acceptance results are recorded per-test in `docs/ACCEPTANCE_TESTS.md`.
Outstanding: breakpoint QA below 1440px, and a browser confirmation of the checklist save and
call outcome forms.
