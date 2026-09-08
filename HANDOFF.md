# HANDOFF — Threadline OS

If you are a new session picking this up cold: read this file top to bottom, then
`docs/BUILD_CHECKLIST.md` for state and `docs/ARCHITECTURE.md` for reasoning. Everything you need
is on disk; nothing depends on a previous conversation.

Last updated: 2026-09-07 (cadence, validation gate, wedge)

---

## 1. Product overview

**Threadline** is a **managed content growth service** for high-LTV, expert-led B2B businesses.
We do not sell software access. We sell a managed outcome:

> market intelligence -> positioning and creative strategy -> content execution -> distribution
> -> performance and commercial learning.

The client provides expertise and context, records in focused batches, approves the decisions that
matter, and sells — then tells us which conversations were real. Threadline handles everything
around those four actions.

**Threadline OS** is this repository — the software layer of that engagement. It is the mechanism
the service runs on and the proof that it ran. It is not sold self-serve; an internal operator
configures it around each client during a paid installation.

**Target customer (initial ICP).** Established B2B consultants, specialist agencies and expert-led
service firms with a proven offer at roughly GBP 5,000 and up, meaningful customer lifetime value,
visible content potential, and the capacity to take on more qualified demand.

**Core promise.** Threadline turns the founder's expertise into qualified demand, and shows its
working. The founder keeps expertise, judgment, face, voice, recording, approval and sales.
Threadline removes everything surrounding those.

**Philosophy.** One loop, not a toolbox:

```
UNDERSTAND → RESEARCH → DETECT SIGNALS → IDEATE → SCRIPT → RECORD → PRODUCE
  → APPROVE → DISTRIBUTE → MEASURE → LEARN → repeat
```

AI is **internal leverage**, never the public product category. No marketing surface leads with
"AI": the site sells the outcome first and reveals the operating system as the mechanism and the
proof.

---

## 2. Current state

### Complete and working

| Area | State |
|---|---|
| Auth, sessions, roles, capability matrix | Complete, tested |
| Multi-tenancy and isolation | Complete, tested against the database |
| Data model (60 models) + 6 migrations | Complete |
| **Attribution v1.5** (tracked links, touchpoints, three models, evidence classes) | Complete |
| **Synthetic dry-run workspace** (excluded from proof and portfolio) | Complete |
| **Delivery Load** (active/waiting minutes, cash cost, work class) | Complete |
| **Living SOP Engine** (prospect and wedge state machines, gated checklists) | Complete |
| **Operating cockpit** (`/admin`, ordered by commercial urgency) | Complete |
| **Reverse-engineered acquisition** (counted funnel, quota, weekly control loop) | Complete |
| **Market validation** (wedge states, research conversations, sample gate) | Complete |
| **Attribution class on commercial signals** | Complete |
| **Client surface** (simplified nav, server-enforced visibility) | Complete |
| **Recording readiness** (7 checks, 3 outcomes, client action) | Complete |
| **Long-form pilot** (entitlement, packaging, approval gate) | Complete |
| **Honest access methods** (manual / native delegated / API) | Complete |
| Design system (~40 primitives, 7 charts) | Complete |
| Client portal — all 9 nav sections + reports, tasks | Complete |
| Brand Brain (7 sections, inline editing) | Complete |
| Market Radar (research, competitors, tags, filters) | Complete |
| Signal engine (5 kinds, evidence, scoring, promotion) | Complete |
| **Intelligence runs** (sources, evidence, candidates, human gate, tests, frozen brief) | Complete |
| **Constraint diagnosis** (9 dimensions, activation gate, monthly review) | Complete |
| **Installation / day-7 win** (derived milestones, blockers, sign-off) | Complete |
| **Proof capture** (baseline vs months, recomputed observables, non-causal language) | Complete |
| Idea engine (CRUD, generation, scoring, bulk actions) | Complete |
| Script engine (versions, hooks, refinement, fact-check gate) | Complete |
| Recording Room + teleprompter | Complete |
| Production board (kanban + table, revisions, approvals) | Complete |
| Packaging (per-platform) | Complete |
| Distribution (calendar, list, publish records) | Complete |
| Performance (breakdowns, winners, learnings write-back) | Complete |
| Pipeline (attribution, CTA performance) | Complete |
| Library, Tasks, Weekly Reports | Complete |
| Settings (workspace, members, integrations) | Complete |
| Onboarding (15 steps, autosave, real build step) | Complete |
| Admin portal (8 surfaces) | Complete |
| Marketing site (rewritten around the outcome-first hierarchy) | Complete |
| Public application flow | Complete, verified end to end |
| Demo seed (2 client tenants + internal org) | Complete |
| Demo tour (9 stops) | Complete |
| AI abstraction + demo provider | Complete |
| File upload/storage/serving with per-request authorisation | Complete |

### Intentionally mocked, manual or adapter-only

These are **product decisions**, documented in the UI, not hidden gaps:

- **Social publishing (LinkedIn, YouTube, Instagram, TikTok, X)** — `adapter_only`. Adapter
  interface, configuration UI and manual workflow exist. The adapter returns an explicit
  `unavailable` result. No connection is ever simulated.
- **Metric import** — manual entry only. `PerformanceSnapshot.source` distinguishes
  `manual` / `adapter` / `seed` so imported data can be told apart later.
- **CRM (HubSpot, GoHighLevel) and Stripe** — `adapter_only`, same pattern.
- **Google Drive / Dropbox** — `manual_only`. Threadline stores links, not files.
- **Booking link** — the one genuinely `available` integration; it needs no credentials.
- **AI in demo mode** — without `ANTHROPIC_API_KEY` a deterministic provider composes output from
  the workspace's own stored context. Every result is visibly labelled as demo output.
- **Intelligence collection** — three real paths and no fourth that pretends. Internal sources
  (own content, performance, pipeline) need no credentials and are read directly. A URL supplied
  by a person is genuinely fetched and read, SSRF-guarded. Everything else is pasted in. Platforms
  that serve a login wall are refused **by name**, with the manual path offered — there is no
  background scraping and no simulated platform connection anywhere in the run.

### Not built (deliberate — see `FUTURE_BACKLOG.md`)

Email delivery, password reset, OAuth, payments, automated competitor ingestion, semantic search,
multi-touch attribution, mobile app, white-labelling, background jobs.

---

## 3. Architecture

**Stack.** Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Prisma 6 ·
SQLite (PostgreSQL-ready) · Zod 4 · Radix primitives · first-party auth · in-house SVG charts.

### Directories

```
src/app/
  (marketing)/        Public site: /, how-it-works, who-its-for, apply, calculator
  (auth)/login        Sign-in
  app/[org]/          Client portal — every module
  admin/              Internal operator portal
  onboarding/[org]/   15-step onboarding
  api/files/          Authorised file serving (the only tenant-data API route)
  no-access/          Plain denial explanation
src/components/
  ui/                 Design system primitives
  charts/             In-house SVG charts
  app/                Sidebar, topbar, command menu, filters, demo tour
  marketing/          Marketing sections and product visualisations
  forms/              ActionForm plumbing used by every mutating form
src/lib/
  actions/            Server Actions — the ONLY mutation path
  ai/                 provider · anthropic · mock · context · prompts · generators
  auth/               session · password · roles · guard · audit
  data/               Read repositories, always org-scoped
  domain/             Status unions, scoring, workflow rules, schemas
  integrations/       Registry + adapter interface
  reports/            Weekly report computation
  storage/            StorageAdapter (local disk)
  security/           Rate limiting
```

### Important components

- `src/lib/auth/guard.ts` — **the security boundary.** `requireOrgAccess` (throws, for actions),
  `requireOrgPage` (redirects to an explanation, for pages), `requireInternal` /
  `requireInternalStrict` for admin.
- `src/lib/auth/roles.ts` — the capability matrix used by BOTH the UI and the guards.
- `src/lib/domain/workflow.ts` — every legal state transition, including the fact-check gate.
- `src/lib/domain/intelligence.ts` — the run lifecycle and its publish gates, evidence
  fingerprinting, test ranking, and the bounded confidence step. **The human-approval gate lives
  here**: a run cannot be published while any candidate is undecided.
- `src/lib/domain/diagnosis.ts` — the nine dimensions, which of them volume actually helps, and
  the provisional ratings onboarding can honestly produce.
- `src/lib/domain/installation.ts` — milestone derivation from workspace facts. There is
  deliberately no "mark as done".
- `src/lib/domain/proof.ts` — comparison arithmetic and the non-causal phrasing rules.
- `src/lib/integrations/fetch-url.ts` — the SSRF-guarded public page reader. Read the header
  comment before touching it.
- `src/lib/actions/shared.ts` — `guarded()` translates known errors into structured
  `ActionResult`s so nothing throws across the RSC boundary.
- `src/components/forms/action-form.tsx` — standard form plumbing (pending state, field errors,
  toasts). Note the documented `never` trick on `ActionFn` that makes generic inference work.
- `src/lib/data/lineage.ts` — the lineage resolver: research → signal → idea → script → content →
  publish → performance → commercial signal.

### AI architecture

Nothing outside `src/lib/ai` imports a model SDK.

```
UI / action → generator → runGeneration/runStructured → provider (anthropic | mock)
```

Generators compose only the context blocks they need, render a versioned prompt template, validate
the response with Zod, retry once on retryable failures, and surface real errors otherwise. Every
call writes an `AiGeneration` row (provider, model, prompt key, latency, tokens, status).

Eight context blocks: `CLIENT_CONTEXT`, `FOUNDER_VOICE`, `OFFER_CONTEXT`, `ICP_CONTEXT`,
`MARKET_CONTEXT`, `PERFORMANCE_CONTEXT`, `CONTENT_HISTORY`, `TASK_CONTEXT`.

Nine generators. Two were added in the P0 upgrade:

- `extractSignals` — proposes candidate signals from a run's evidence. Evidence is passed with
  short reference ids and **every candidate must cite them**; a candidate whose citations do not
  resolve is dropped rather than repaired, and the discard count is reported to the operator. This
  is what makes "never invent evidence" enforceable rather than requested.
- `generateBriefSummary` — drafts the client-facing opening of a brief, from approved signals
  only. The operator edits it before publishing; it goes out as written.

### Auth architecture

Opaque random session tokens in a cookie; only the SHA-256 digest is stored, so a database read
cannot be replayed. Passwords use `scrypt` from `node:crypto` with per-user salt and constant-time
comparison. Sessions are revocable.

### Tenancy model

`User —< Membership >— Organization`, one role per membership. Every tenant table carries `orgId`.
Repositories take an `orgId` that must originate from an `AuthContext`. `middleware.ts` does a
cheap cookie check for redirect UX only — **it is not the security boundary.**

### Storage

Local disk under `storage/{orgId}/…` behind a `StorageAdapter`. Files are served only through
`/api/files/[...path]`, which re-checks membership on every request. Path traversal is rejected.

---

## 4. Database

SQLite by default (`file:./dev.db`), PostgreSQL-ready. 60 models. Six migrations:

- `20260902162730_init`
- `20260903015829_intelligence_run_diagnosis_installation_proof`
- `20260904185211_client_surface_readiness_longform_access`
- `20260905225216_living_sop_engine_acquisition_attribution`
- `20260906132504_attribution_touchpoints_synthetic_delivery_load`
- `20260906143000_visitor_token_scoped_per_org` (hand-written; scopes the visitor token per
  organisation, safe against existing data because the table is introduced by the migration before
  it)

### Key models

**Tenancy:** `User`, `Session`, `Organization`, `Membership`, `AuditLog`, `Notification`, `Task`

**Brand Brain:** `BrandBrain` (JSON blocks: company, founder, voice, contentRules), `Offer`,
`IcpProfile`, `ProofItem`

**Research:** `Competitor`, `ResearchItem`, `Tag`, `ResearchItemTag`

**Signals:** `Pattern`, `PatternEvidence` — `Pattern` also carries `runId`, `derivedFromId`
(self-relation: the signal a test came from), `rank`, `successMetric` and the performance
feedback fields

**Intelligence run:** `IntelligenceRun` (frozen `brief` payload), `RunSource`, `CandidateSignal`,
`CandidateEvidence`

**Diagnosis:** `ConstraintDiagnosis`, `ConstraintAssessment`

**Installation and proof:** `InstallationMilestone` (stored overlay only), `ProofPeriod`

**Creation:** `Idea`, `IdeaEvidence`, `Script`, `ScriptVersion` (append-only)

**Production:** `ContentItem` (the spine), `ContentEvent`, `Asset`, `Comment`

**Distribution:** `PlatformPackage`, `SocialAccount`, `PublishRecord`

**Measurement:** `PerformanceSnapshot` (time series), `Inquiry`, `WeeklyReport` (frozen payload),
`OperatingMetric`

**Internal:** `Integration`, `SupportIssue`, `SopDocument`, `OnboardingSession`, `Application`
(no orgId by design), `AiGeneration`, `InternalMetric`

### Lineage relations

```
ResearchItem ─< IdeaEvidence >─ Idea ─< Script ─< ScriptVersion
Pattern ─< PatternEvidence                │
                                          └─ ContentItem ─< PublishRecord ─< PerformanceSnapshot
                                                         └─< Inquiry
```

### Conventions

- No DB enums — statuses are `String`, constrained by Zod unions in `src/lib/domain/`
- No array columns — JSON-encoded `String`, read via `src/lib/db/json.ts`
- Money in integer **minor units** plus a `currency` field
- Org deletion cascades; user references become null so history survives departures

Full reasoning: `docs/DATA_MODEL.md`.

---

## 5. Auth and roles

| Role | Scope | Can |
|---|---|---|
| `super_admin` | Global | Everything, including destructive admin |
| `internal_operator` | Global (staff) | All client workspaces + admin portal; cannot create a super admin |
| `client_admin` | One org | Full workspace: approvals, settings, members |
| `client_member` | One org | Contribute (ideas, scripts, comments, recording); **cannot approve or change settings** |
| `editor` | One org | Production board, assets, comments only — no strategy, settings, pipeline or performance |

Defined once in `src/lib/auth/roles.ts` as a capability matrix. Both the navigation and the server
guards read it, so a hidden control is also a denied route. Tested in `src/lib/auth/roles.test.ts`.

Capabilities added in the P0 upgrade: `runs.manage`, `diagnosis.view`, `diagnosis.edit`,
`install.signoff`, `proof.view`, `proof.edit`. Members read; admins decide. The editor role has
none of them.

**The matrix also gates notifications.** Workspace-wide notifications carry no `userId`, so
without filtering they would reach every member including roles with no access to the surface they
link to. `listNotifications` takes the reader's role and excludes kinds they lack the capability
for — see `NOTIFICATION_CAPABILITY` in `src/lib/data/workspace.ts`.

---

## 6. Environment variables

| Name | Purpose | Required | Where obtained |
|---|---|---|---|
| `DATABASE_URL` | Database connection | **Yes** | SQLite default `file:./dev.db`; or a Postgres URL |
| `SESSION_SECRET` | Reserved for signed session material | Production | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | Public origin for absolute links | Production | Your deployment URL |
| `ANTHROPIC_API_KEY` | Enables live AI generation | No | console.anthropic.com → Settings → API keys |
| `ANTHROPIC_MODEL` | Model override (default `claude-sonnet-5`) | No | — |
| `NEXT_PUBLIC_BOOKING_URL` | External booking URL for the application flow | No | Any scheduling provider |
| `STORAGE_ROOT` | Upload directory (default `./storage`) | No | — |
| `SEED_DEMO_PASSWORD` | Password for seeded demo accounts | No | Set before seeding any shared environment |

`.env.example` documents all of these with no values. `.env` is git-ignored. **No secret is ever
exposed to the client** — no `NEXT_PUBLIC_` variable holds a credential.

---

## 7. Running locally

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run seed
npm run dev            # http://localhost:3000
```

Verification:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify         # all four in sequence
```

**Windows note:** stop the dev server before `npm run build` — a running server holds
`node_modules/.prisma/client/query_engine-windows.dll.node` and the build cannot replace it
(`EPERM: operation not permitted, rename`).

**Seed note:** the seed and tests import modules marked `server-only`, so both run with
`--conditions=react-server`. This is already wired into the npm scripts.

---

## 8. Deployment

1. **Database.** Provision PostgreSQL. In `prisma/schema.prisma` set
   `datasource db { provider = "postgresql" }`. The schema is written to be portable — no enums,
   no array columns, no Postgres-only types.
2. **Environment.** Set `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`. Optionally
   `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_BOOKING_URL`.
3. **Migrate.** `npx prisma migrate deploy`
4. **Seed** (first deploy only, and only if you want the demo workspace):
   `SEED_DEMO_PASSWORD=<strong value> npm run seed`
5. **Build and start.** `npm run build && npm start`

Before running more than one instance, replace two single-instance pieces:

- `src/lib/storage/index.ts` — implement `StorageAdapter` against object storage
- `src/lib/security/rate-limit.ts` — back the sliding window with a shared store

Both are single-file changes; call sites do not move.

---

## 9. Demo access

`npm run seed` builds:

- **Northbeam Advisory** (`/app/northbeam`) — the full demo. Fictional B2B sales-ops consultancy,
  founder Alex Morgan, GBP 8,000 engagement, ICP: B2B SaaS founders at GBP 500k–5m. 28 research
  items, 5 competitors, 8 signals, 32 ideas, 10 scripts, 34 content items across every stage,
  90 days of performance, 12 pipeline records, 3 weekly reports, tasks and notifications.
  Since the P0 upgrade it also holds two intelligence cycles (one published brief with 10 evidence
  items, 6 candidates, 4 approved and 3 ranked tests; one open cycle mid-collection), an active
  constraint diagnosis with all nine dimensions rated, a recorded strategy sign-off, and four
  proof periods (a locked baseline plus three months).
- **Lumenpath Studio** (`/app/lumenpath`) — a second tenant that exists so isolation can be
  demonstrated and tested rather than asserted.
- **Threadline** — the internal organisation, with 14 SOP documents and business metrics.

Accounts (password from `SEED_DEMO_PASSWORD`, default `threadline-demo-2026` — **development
value only, change it anywhere shared**):

| Email | Role | Lands on |
|---|---|---|
| `alex@northbeamadvisory.com` | client_admin | `/app/northbeam` |
| `jordan@northbeamadvisory.com` | client_member | `/app/northbeam` |
| `editor@threadline.com` | editor | `/app/northbeam` |
| `operator@threadline.com` | internal_operator | `/admin` |
| `ops@threadline.com` | super_admin | `/admin` |
| `priya@lumenpath.example.com` | client_admin | `/app/lumenpath` |

Seed logic: `prisma/seed.ts` with content in `prisma/seed/northbeam.ts`, `scripts.ts` and
`recording-queue.ts`. It is idempotent — it clears and rebuilds the demo organisations.

**Demo tour:** the "Demo tour" control in the top bar walks nine stops for sales calls.
Definition in `src/components/app/demo-tour.tsx`.

**QA helpers** (`scripts/`, not imported by the app): `dev-session.cjs` mints a session cookie for
a seeded user; `qa-submit-application.cjs` submits the public application form the way a
JavaScript-disabled browser would, exercising the real Server Action.

---

## 10. Feature map

| Module | Route | Key files | Limitations |
|---|---|---|---|
| Command centre | `/app/[org]` | `app/[org]/page.tsx`, `lib/data/dashboard.ts` | — |
| Brand Brain | `/app/[org]/intelligence` | `intelligence/brand-brain-editor.tsx`, `domain/brand-brain.ts` | — |
| Intelligence runs | `…/intelligence/runs` | `runs/`, `data/runs.ts`, `actions/runs.ts` | No background collection; see the collection table below |
| Constraint diagnosis | `…/intelligence/diagnosis` | `diagnosis/`, `domain/diagnosis.ts` | — |
| Installation | `/app/[org]/install` | `install/`, `domain/installation.ts` | — |
| Proof | `…/performance/proof` | `performance/proof/`, `data/proof.ts` | Single-touch attribution, stated on the page |
| Market Radar | `…/intelligence/radar` | `radar/radar-client.tsx`, `data/research.ts` | Manual/URL capture only |
| Signals | `…/intelligence/signals` | `signals/`, `data/patterns.ts` | — |
| Ideas | `/app/[org]/create` | `create/idea-board.tsx`, `actions/ideas.ts` | — |
| Scripts | `…/create/scripts` | `scripts/[id]/script-editor.tsx`, `actions/scripts.ts` | — |
| Recording Room | `…/production/recording` | `recording/recording-room.tsx` | — |
| Production board | `/app/[org]/production` | `production/production-board.tsx` | Drag-and-drop not implemented; stage moves via menu |
| Content detail + lineage | `…/production/[id]` | `production/[id]/`, `data/lineage.ts` | — |
| Packaging | `…/production/packaging` | `production/packaging/`, `actions/content.ts` | — |
| Distribution | `/app/[org]/distribution` | `distribution/distribution-view.tsx` | Publishing is manual |
| Performance | `/app/[org]/performance` | `performance/`, `data/metrics.ts` | Manual metric entry |
| Pipeline | `/app/[org]/pipeline` | `pipeline/`, `data/pipeline.ts` | Single-touch attribution |
| Library | `/app/[org]/library` | `library/library-client.tsx` | Local disk storage |
| Tasks | `/app/[org]/tasks` | `tasks/task-client.tsx` | — |
| Reports | `/app/[org]/reports` | `reports/`, `lib/reports/weekly.ts` | Print/PDF via browser print |
| Settings | `/app/[org]/settings` | `settings/**` | No email invitations |
| Onboarding | `/onboarding/[org]` | `onboarding/[org]/onboarding-flow.tsx` | — |
| Today / cockpit | `/admin` | `admin/page.tsx`, `data/cockpit.ts` | Ordered by commercial urgency |
| Attribution (operator) | `/app/[org]/performance/attribution` | `performance/attribution/**`, `data/attribution.ts` | `attribution.manage`; no client role holds it |
| Tracked redirect | `/t/[slug]` | `app/t/[slug]/route.ts` | Public; destination validated on write |
| Market validation | `/admin/market`, `…/[id]` | `admin/market/**`, `actions/validation.ts` | Sample gate has no override |
| Prospects | `/admin/prospects`, `…/[id]` | `admin/prospects/**`, `actions/acquisition.ts` | Links to an external CRM; is not one |
| Acquisition | `/admin/acquisition` | `admin/acquisition/**`, `domain/funnel.ts` | Refuses to project on unmeasured rates |
| Admin (clients, queue, SOPs) | `/admin/clients` etc. | `admin/**`, `data/admin.ts` | — |
| Marketing | `/`, `/how-it-works`, `/who-its-for` | `(marketing)/**` | — |
| Application | `/apply` | `apply/application-form.tsx` | — |
| Calculator | `/calculator` | `calculator/`, `domain/calculator.ts` | — |

---

## 11. Integrations

Registry: `src/lib/integrations/registry.ts`. Adapter: `src/lib/integrations/adapter.ts`.

| Provider | State | Needs | Manual fallback |
|---|---|---|---|
| Booking link | **available** | Nothing | n/a |
| YouTube | adapter_only | Google Cloud project, verified OAuth consent | Upload in Studio, paste the URL |
| LinkedIn | adapter_only | Approved Marketing Developer Platform app | Post manually, paste the URL |
| Instagram | adapter_only | Meta app + App Review | Publish in-app, paste the URL |
| TikTok | adapter_only | Approved Content Posting API | Publish in-app, paste the URL |
| X | adapter_only | Paid API tier credentials | Post manually, paste the URL |
| Stripe | adapter_only | Restricted API key | Record closed value manually |
| HubSpot / GoHighLevel | adapter_only | Private app token / location key | Add pipeline records manually |
| Google Drive / Dropbox | manual_only | Per-workspace OAuth | Paste shareable links |
| Web analytics | manual_only | Provider-specific | Tracked links + pipeline records |

**Next step for any of them:** implement `connect()` / `publish()` / `fetchMetrics()` on a subclass
of the adapter, and add encrypted credential storage — the product deliberately stores no secrets.

### Intelligence collection

Separate from the publishing adapters above, and the only genuinely automatic reading the product
does:

| Path | Applies to | Reality |
|---|---|---|
| Internal | own content, performance, pipeline | Read from this workspace's own records. Needs no credentials. |
| URL | competitor and creator posts, single pages | A person supplies a URL; the server fetches and extracts readable text. **SSRF-guarded** — see `src/lib/integrations/fetch-url.ts` and ADR-008. |
| Manual | sales calls, customer language, categories, notes | Pasted in. Blank-line separated blocks become separate evidence items. |

LinkedIn, Instagram, TikTok, X and Twitter are refused **by name** with the manual paste path
offered, because they serve a login wall to automated requests and Threadline holds no credentials
for them. A source that cannot be collected is recorded `unavailable` with the specific blocker,
and that text appears in the published brief.

---

## 12. AI

- **Provider abstraction** — `src/lib/ai/provider.ts`. `getProvider()` returns the Anthropic
  provider when `ANTHROPIC_API_KEY` is set, otherwise the demo provider. There is no third state.
- **Prompts** — `src/lib/ai/prompts.ts`, one function per template with a stable `key` recorded on
  every generation. House rules (no invented statistics, voice adherence, banned topics, no
  emoji/hype) are in the shared system prompt.
- **Context composition** — `src/lib/ai/context.ts`. Eight blocks, each token-budgeted. Proof
  marked `prohibited` is excluded from context entirely.
- **Generators** — `src/lib/ai/generators.ts`: `generateIdeas`, `generateScript`, `generateHooks`,
  `refineScriptContent`, `generatePackaging`, `detectPatterns`, `generateReportNarrative`,
  `extractSignals`, `generateBriefSummary`. Each validates output with Zod and returns typed data
  plus metadata including `isDemo`.
- **The citation gate** — `extractSignals` passes evidence with short reference ids and requires
  every candidate to cite them. Candidates whose citations do not resolve are **dropped**, and the
  discard count is surfaced to the operator. This is the mechanism behind "never invent evidence";
  without it the rule would be a request in a prompt, which is not an enforcement.
- **Demo behaviour** — `src/lib/ai/mock.ts` composes from the workspace's own Brand Brain,
  research and performance. It never invents facts about the business, and every result is
  flagged `isDemo: true` and labelled in the UI. The demo signal extractor obeys the same rule as
  the live one: it cites only reference ids it was given, and with no evidence it returns nothing
  rather than inventing a market observation.

---

## 13. Important product decisions

1. **SQLite by default, Postgres-ready** (ADR-001). The product must be demo-ready on any machine
   with zero infrastructure. Portability is preserved by avoiding DB enums, array columns and
   provider-specific types.
2. **First-party auth instead of NextAuth/Supabase** (ADR-002). Tenancy is the most important
   invariant; owning session resolution keeps it in one auditable place with no third-party token
   semantics in between.
3. **Server Actions as the only mutation path** (ADR-003). No REST surface for tenant data means
   no second path to secure.
4. **Local storage behind an interface** (ADR-004). Files are never served from a public static
   path; every read re-checks membership.
5. **Lineage via real foreign keys** (ADR-005). "Trace this post back to the research that caused
   it" is a query with a definite answer, not a heuristic.
6. **Fact-check gate is enforced, not advisory.** A script with unverified claims cannot reach the
   recording queue. Enforced in `domain/workflow.ts` and re-checked in the action.
7. **Revision requests require a reason.** The product refuses an unexplained rejection, because
   that is the largest source of wasted edit cycles.
8. **A publish record cannot be marked live without a URL.** Without it, measurement and
   attribution are impossible.
9. **Reports freeze their payload.** A report read months later shows the numbers the client was
   sent, not a silent re-query.
10. **Scores are computed, never generated.** Idea priority, pattern score, health score and every
    insight on the dashboard are deterministic arithmetic over stored records.
11. **Denials explain rather than error.** Pages redirect to `/no-access`; actions throw and report
    through the action result.
12. **Charts are in-house.** Full control of the visual system, no charting dependency, and format
    tokens instead of formatter functions so charts render from Server Components.
13. **Nothing the system proposes influences strategy until a human decides.** Candidate signals
    are a separate table precisely so this gate is structural rather than a convention: a run
    cannot publish while any candidate is undecided, and only an explicit approval creates a
    signal (ADR-006).
14. **Milestones and observed metrics are derived, not stored.** A stored "done" flag drifts and is
    believed anyway; a recomputed one cannot lie. The one exception is the strategy sign-off, which
    is a client decision rather than a record (ADR-007).
15. **The URL reader is narrow and guarded.** It reads pages a person supplied and nothing else. A
    login-walled platform is refused by name rather than returning an empty result that looks like
    "found nothing" (ADR-008).
16. **Proof never claims causation.** The product can show what changed while Threadline was
    engaged. It cannot show that Threadline caused it, and the wording is tested to make sure it
    never implies otherwise.
17. **More content is not the default answer.** The constraint diagnosis exists so the operator has
    to argue for it. Five of the nine dimensions are made worse by volume, and the product says so.

---

## 14. Testing

```bash
npm test          # 403 tests, 94 suites
```

| Suite | File | Covers |
|---|---|---|
| Role capability matrix | `src/lib/auth/roles.test.ts` | Every role's boundaries, assignment rules, superset invariant |
| Tenant isolation | `src/lib/auth/tenancy.test.ts` | Real database: cross-tenant reads empty, cross-tenant fetch by id null, search never leaks |
| Workflow | `src/lib/domain/workflow.test.ts` | Stage machines, fact-check gate, publish/schedule guards |
| Scoring | `src/lib/domain/scoring.test.ts` | Priority, pattern score, engagement, deltas, health; guards against NaN/Infinity |
| Calculator | `src/lib/domain/calculator.test.ts` | Cost maths, clamping, never claims zero founder involvement |
| Intelligence run | `src/lib/domain/intelligence.test.ts` | Lifecycle, publish gates (including the undecided-candidate refusal), evidence fingerprinting, bounded test ranking and confidence feedback |
| Diagnosis | `src/lib/domain/diagnosis.test.ts` | Weakest-dimension derivation, activation completeness, the volume verdict, and that onboarding alone can never complete a diagnosis |
| Installation | `src/lib/domain/installation.test.ts` | Derivation from facts, sign-off gating, and that a blocker overrides a complete derived state |
| Proof | `src/lib/domain/proof.test.ts` | Comparison maths, blanks rather than zeros, and a sweep asserting **no causal wording** in any statement or headline |
| URL reader | `src/lib/integrations/fetch-url.test.ts` | SSRF guards (private, loopback, link-local, CGNAT, IPv4-mapped IPv6, cloud metadata), login-wall refusals, and readable extraction |
| Client visibility | `src/lib/auth/visibility.test.ts` | Database-backed: client roles cannot read unpublished cycles, internal signals, draft diagnoses, operator notes or raw research — including through search |
| Recording readiness | `src/lib/domain/readiness.test.ts` | One blocking check blocks the setup; ready is refused with anything unassessed; a blocker with no client action is refused |
| Long-form pilot | `src/lib/domain/longform.test.ts` | Entitlement is off by default, long-form work is refused without it, and packaging cannot be approved without a title and thumbnail |
| Funnel maths | `src/lib/domain/funnel.test.ts` | Refuses to project on unmeasured rates, labels assumptions, and encodes no acquisition channel |

**Verified manually against the running app** (recorded in `docs/ACCEPTANCE_TESTS.md`):

- Every client-portal and admin route returns 200 for a permitted role
- Cross-tenant workspace access returns 404 for both directions
- A client account hitting `/admin` is redirected to `/no-access`
- An `editor` hitting `/pipeline` is redirected and **zero pipeline data appears in the response**
- Anonymous access to `/app/*` redirects to `/login`
- `/api/files` returns 401 anonymous, 404 for a non-existent asset, 404 for path traversal
- The public application form submits through the real Server Action and persists
- The application rate limiter engages (5 stored from 7 attempts)
- Onboarding renders and `/app/[org]` redirects into it while onboarding is incomplete
- Every new route returns 200 for a permitted role and denies an `editor` with **zero** run,
  diagnosis or proof content in the response
- A cross-tenant intelligence run URL returns 404
- The published brief renders its frozen payload, including the source that could not be collected

**Adversarial QA harness** (`scripts/qa/`, results in `docs/QA_REPORT.md`): runs the real server
actions in-process with real database sessions — tenancy/IDOR attacks, every role, workflow gates,
diagnosis cases A–G on persisted data, corpus/Judge, attribution, hostile input, onboarding,
sales/validation gate, reports/periods, and three complete synthetic engagements (happy, bad
outcome, text-led). Synthetic tenants use `qa-*` slugs and `@example.test` emails and are removed
on exit.

```bash
npm run qa:all       # 495 checks, master matrix, non-zero exit on FAIL
npm run qa:spine     # the three synthetic engagements only (--keep to inspect)
npm run qa:perf      # 20-client performance smoke
npm run build && npm start   # then, in another shell:
npm run qa:browser   # headless Chrome (CDP, no deps): 33 routes × 1440/1024/768/390, a11y, runtime errors
```

Run the browser sweep against a production build; the dev server's HMR races produce spurious 500s
under concurrent navigation.

**Still manual**: teleprompter scrolling and full-screen, drag interactions, and print output of the
weekly report.

---

## 15. Known issues

| Severity | Issue |
|---|---|
| Low | Production board has no drag-and-drop; stage moves are via an explicit menu. This is arguably better — every move is deliberate and audited — but it is not what a board usually implies. |
| Low | Weekly report "export" is browser print (print styles are implemented). No server-side PDF. |
| Low | Rate limiting is per-instance. Fine for single-instance; needs a shared store before scaling out. |
| Low | Global search is substring-based. Adequate at v1 volume; swap for full-text on Postgres. |
| Low | No email delivery, so member creation shares an operator-set password out of band. Stated in the UI. |
| Info | On Windows, the dev server must be stopped before `npm run build` (Prisma engine file lock). |
| Info | Seeded library assets have no `storagePath` — they are metadata records, so no download link renders for them. Files uploaded through the UI work normally. |
| Low | The URL reader extracts text with regex rather than a parser. Adequate for reading article text into evidence a human then reads; it is not a faithful renderer, and a JavaScript-rendered page returns nothing and says so. |
| Low | Proof observables are recomputed on every page load (a handful of counting queries). Correct by design (ADR-007) and cheap at this volume; memoise if a workspace ever gets large. |
| Info | A run's evidence is capped at 60 items when sent for synthesis. Beyond that, narrow the sources rather than widening the cap — a cycle reading 200 items produces vaguer signals, not better ones. |

---

## 16. Future backlog

See `FUTURE_BACKLOG.md`. Top items: LinkedIn publishing (needs platform approval), automatic
metric import, email delivery, password reset, automated competitor ingestion.

---

## 16b. Commercial and positioning state (locked)

**Positioning.** The immediate promise is creative: *you already have the expertise; we turn it
into content people actually want to watch.* The deeper outcome is commercial: *we run the system
around it so the content compounds into authority and qualified demand.* Threadline sits in the
marketing lane — workflow and time saved are mechanism, never the headline.

**Commercial hypothesis at launch:** GBP 2,500 implementation, GBP 2,500 **every four weeks**,
a **12-week initial engagement = three four-week service periods**, GBP 10,000 initial contract
value, **one offer**. No tiers.

A four-week period is not a calendar month and the difference is not cosmetic: four-week cycles
produce **thirteen** invoices a year, so summing period fees and calling the result MRR is wrong
by about 8%. The fee column is `Organization.periodFee`, the cadence constants live in
`src/lib/domain/service-period.ts`, and `monthlyEquivalent()` exists for the one case where a
comparison against something genuinely monthly is wanted. Threadline's own book-keeping in
`InternalMetric` stays calendar-monthly, because that is what it actually is.

`Organization.packageTier` predates this and is internal configuration, not a public price list —
there is no tiered pricing UI anywhere and none should be added.

**Niche.** "Expert-led B2B" is the **umbrella category, not a validated niche.** The operating
method is one active wedge and one validated expensive problem at a time.

**Active wedge (unvalidated):** senior founder- and partner-led **AI and digital transformation
advisory firms, US and UK**. Chosen on reachability and founder access. Zero research
conversations so far — it is in immersion and nothing about it is validated.

**Previous wedge, kept as history:** independent M&A and corporate finance advisors, 5–25 people.
Three research conversations, set aside rather than deleted, with the reason recorded. Its
prospect pipeline stays attached to it: reattaching those records to the new wedge would show a
pipeline for a hypothesis that has none, and the cost of changing wedge is exactly that.

**The validation gate has two thresholds and a convergence rule:**

| | |
|---|---|
| **5 conversations** | Interim checkpoint. Worth reviewing, not worth deciding on |
| **10 conversations** | Eligible for a formal validation decision — eligible, not validated |
| **more than 5 converging** | Required before a wedge can leave interviews for commercial testing |

Convergence counts conversations sharing an operator-assigned `problemTheme`. Whether two people
described the same expensive problem in different words is a judgement no string comparison can
make, so a person makes it and the system counts it; an unthemed conversation is excluded rather
than guessed at. Neither threshold has an override, and `readValidation` will not return a rate.

**Acquisition.** No channel is doctrine anywhere in the code. `src/lib/domain/funnel.ts` turns a
target into required first touches from Threadline's own recorded rates, and is channel-agnostic
by construction — a test asserts no channel name appears in the model. Booking, show and close are
measured; qualification is not recorded anywhere and is always labelled an assumption.

---

## 16c. The Living SOP Engine (Threadline running Threadline)

Threadline had a shelf of standard operating procedures. A shelf is not an operating system: it
requires the founder to remember which document applies, open it, find the section and hold the
next step in their head. This pass converts the acquisition and sales half of that shelf into
state.

### What it is

`src/lib/domain/sop.ts` holds every state the business moves through, and each one carries the
five things a person needs at the moment they are working: what the state means, why it matters
commercially, the exact checklist including which items need written evidence, what "done" is, and
where it can legally go next. The long-form SOP remains linked at the bottom of each card, and the
intent is that it is almost never opened.

**Prospects:** `new → qualified_a | qualified_b → contacted → replied → booked → call_ready →
showed → proposal | follow_up → won | lost | not_fit`.

**Market validation:** `candidate → immersion → interviews → commercial_test → validated`, with
`revised` reachable from anywhere.

**The call:** `open → economics → current_state → desired_state → constraint → consequence →
prescription → demo → commercials → decision`, ending in exactly one outcome.

### What is enforced rather than suggested

1. **No active record without a next action and a due date.** `assertActiveRecord` runs on every
   write. `invariantBreaches()` reports anything that got past it, and the cockpit surfaces the
   result — because "the code prevents it" and "it is not happening" are different claims.
2. **The checklist gates the transition.** A forward move is refused while a required item is
   unticked, or ticked without the evidence it asked for. An override is allowed with a written
   reason, which lands in the audit trail rather than being swallowed.
3. **A tick is not a finding.** Items whose value is what you learned require a note; a tick alone
   records only that somebody looked.
4. **Commercial testing needs the sample.** A wedge cannot leave `interviews` without five
   recorded research conversations. This gate has no override, because the whole purpose of the
   state is that the conversations happened.
5. **A call ends in one outcome, with their words.** Recording an outcome without the economics,
   current state, constraint and consequence is refused — that combination means the diagnosis was
   not made. An honest no-fit is exempt: discovering in two minutes that they cannot afford this is
   a correct outcome, not an incomplete call.
6. **Nothing is ever sent.** No action in this module contacts anybody. Sending is a human act
   performed in the operator's own tools and recorded here afterwards.

### How the evidence is read

`readValidation` will not return a rate, a percentage or a confidence score, and a test asserts
it. Five conversations cannot establish a rate; quoting one — to a prospect or to ourselves — is
the beginning of believing our own marketing. What it returns is a sentence describing what the
sample supports, including the case where we named every problem first, which is the weakest
evidence available.

### External CRM

Threadline does not contain a CRM and should not grow one. An external CRM (Attio preferred,
Pipedrive acceptable) owns contacts, companies, communications, deal history and broad pipeline.
Threadline owns the proprietary part: given the state a record is in, what exactly happens next.
The join is three columns — `crmProvider`, `crmRecordId`, `crmRecordUrl` — and **no
synchronisation**. Do not add one until a real workflow proves it saves repeated work.

### The acquisition arithmetic

```
required first touches = target wins / (booking x show x qualified x close)
daily quota            = remaining touches / remaining acquisition workdays
```

Every rate is counted from prospect and call records rather than typed in (ADR-012). The model
refuses to project when an input is zero or unrecorded, names the gap, and shows the measured
projection beside the one derived from the target's planning assumptions — never instead of it,
because while the sample is small one win or one no-show moves the measured figure enough to
rewrite the plan.

When the arithmetic demands more than 40 researched first touches a day it says so, and says that
the input making the arithmetic bad is upstream — the wedge, the list, the message, the booking
rate or the price. `weakestConversion` reports the lowest conversion with a real denominator and
deliberately does **not** call it broken: funnel steps are not comparable to one another, and
importing benchmarks to decide would mean treating another business as evidence about this one.

### The cockpit

`/admin` is now the operating cockpit rather than a portfolio list (the portfolio lives at
`/admin/clients`, where managing clients belongs). It answers one question — what matters now —
ordered by what can still change the commercial outcome today: replies, then dated commitments,
then call preparation, then decisions outstanding, then A-tier work, then the quota, then
qualification. Client delivery and measurement health sit alongside rather than above.

### Results and attribution

Architected, not built out. `Inquiry` gained an attribution class, an evidence basis and an
evidence source (§5j of DATA_MODEL). `resultsAlerts()` checks whether each client's measurement
can support any claim at all — baseline present, live URLs recorded, attribution stronger than
correlation — before anybody interprets a number. There is no analytics platform here and no
attribution provider integration; both remain backlog behind the Integration Decision Gate.

---

## 16d. Attribution v1.5

The question this answers is *which content is creating commercially valuable attention*, and the
chain it reconstructs is:

```
content asset -> tracked touchpoint -> visitor -> commercial event -> value -> what to make more of
```

### What was built

- **Tracked links.** `/t/<slug>` records the click and forwards to the client's real destination.
  This is what lets Threadline measure content it did not publish — the client posts manually, the
  caption carries a Threadline URL, and the touchpoint is still ours. **Social API approval is
  therefore not a launch blocker.**
- **Touchpoints and an anonymous visitor.** A random first-party token, unique per organisation.
  No fingerprinting, no device graph, no cross-device claims. Only the referring *host* is kept.
- **Commercial events.** Opt-in, enquiry, booked, showed, qualified, opportunity, won — each dated,
  each with a provenance (`native`, `crm`, `booking`, `payment`, `manual`, `client_reported`) and
  an external CRM reference where one exists.
- **Three attribution models:** first touch, last touch, and an even split across the distinct
  assets touched. All three checkable by hand.
- **Journey timelines**, showing what was recorded in order, including the gaps.
- **Reporting by asset, pillar, CTA and platform**, with assets missing a dimension grouped rather
  than dropped.
- **A content-to-commercial funnel** that draws only the stages with recorded events.
- **Tracking health**, which runs before anybody interprets a number.
- **Curated client Results**, grouped by evidence class, and an attribution section frozen into the
  weekly report payload.

### The rules that are enforced rather than documented

1. **A model redistributes credit; it never creates evidence.** `CommercialEvent.attribution` is
   set by a person and no code path raises it. A test asserts this across every model and class.
2. **Only touches before the event, inside a 90-day window, qualify.** The window is a judgement,
   written down as one.
3. **A repeated visit does not buy an asset more credit.** Linear splits across distinct assets.
4. **Credit reconciles.** The parts sum to the whole, including on awkward divisions.
5. **One deal, one credited outcome.** An opportunity that later closes is counted once, as the
   win — adding pipeline to revenue describes neither.
6. **Money is withheld below 50% defensible coverage**, with the reason shown.
7. **Missing tracking is missing data, not zero commercial value.** Said in those words on both
   surfaces.

### What was deliberately not built

No third-party connectors, no ad attribution, no fingerprinting or identity graph, no ML or
weighted attribution, no analytics warehouse or BI builder, no heatmaps or session replay, no lead
scoring, no public API, no CRM. Trakyo and equivalents remain optional future infrastructure behind
the Integration Decision Gate — the normalised boundary they would feed is `CommercialEvent`, whose
`source`, `externalProvider` and `externalRecordId` columns already describe an imported event.

### External CRM

Unchanged and deliberate. The CRM owns contacts, companies, communications and deal history.
Threadline stores provider, record id and record URL on a commercial event, and does not
synchronise. If nothing is connected, the UI says so rather than showing an empty integration.

---

## 16e. The synthetic client dry run

One dry run before client #1: a real company used as a public-information reference, treated as an
imaginary client, put through the **real** fulfilment path. It exists to find the SOP gaps, the
coordination burden and the true Delivery Load before a paying client finds them for us.

- `Organization.synthetic` is a column, not a naming convention (ADR-016). It stays
  `kind: "client"` on purpose — routing it around the real paths would defeat the exercise.
- Excluded from portfolio totals and MRR; refused by `assertNotSyntheticProof` wherever proof is
  used; banner above every page in the workspace.
- Clearing the marker carries the heavier confirmation, because that is the direction that turns a
  dry run into a claimed client result.
- **Nothing from it may become a case study, testimonial, proof point or claimed outcome.**

**Delivery Load** rides on `Task`: active minutes, waiting minutes, cash cost, a work class
(founder-only, becomes an SOP, AI-assisted, delegatable, automatable, delete) and a note. The
seeded dry run carries deliberate friction — a re-record after a readiness check passed a room that
still produced unusable audio, and a task with twenty minutes of work spread across two days of
waiting — because a perfect laboratory case teaches nothing.

The resulting estimate is labelled **synthetic, unvalidated** wherever it appears. It describes how
long the dry run took, not what a client will cost.

### Production benchmark

Not built, deliberately. Threadline does not edit video and should not. The comparison between
AI-heavy, human and hybrid editing is an external exercise; its outcome is a decision to record,
not a feature.

---

## 16f. Cadence, the validation gate and the wedge (2026-09-07)

Three consistency fixes, each of which had been quietly wrong in a way that would have produced a
confident number nobody could interpret.

### The cadence is four weeks

`Organization.periodFee` is what a client pays for **one four-week service period**. It was called
`monthlyFee`, and it was not one. The initial engagement is twelve weeks, which is three service
periods and not three months.

The arithmetic matters: four-week cycles bill **thirteen** times a year. Summing period fees into
an MRR figure understates the year by a full period — about 8% — and that error was propagating
into pipeline value, contract value and every revenue projection built on them.

`src/lib/domain/service-period.ts` holds the constants and the conversions.
`monthlyEquivalent()` exists for comparing against genuinely monthly figures and should always be
labelled as an equivalent, because it is a conversion and not a sum anybody is invoiced.

**The audit was contextual, not mechanical.** Not every "monthly" was wrong. `InternalMetric` is
Threadline's own book-keeping, reconciled against a real calendar month, and forcing it onto a
four-week cycle would make it disagree with the bank. It stays monthly and does not import this
module.

### Five is a checkpoint; ten opens a decision; convergence is a separate condition

The old gate let commercial testing start at five research conversations. Five is not a sample —
it is a number at which coincidence still looks like a pattern.

- **`INTERIM_CHECKPOINT = 5`** — a reading, not a gate. At five the system reports what it is
  hearing, and says in as many words that this is a checkpoint rather than permission.
- **`VALIDATION_DECISION_MINIMUM = 10`** — ten makes the wedge *eligible for a formal validation
  decision*. It does not pass one.
- **`CONVERGENCE_MINIMUM = 6`** — more than five must converge on the same expensive recurring
  problem. Ten conversations that agree on nothing are evidence the hypothesis is wrong, not
  evidence to test it. The two conditions fail separately and the error says which.

**Convergence cannot be string-matched, so it is not.** `ValidationConversation.problemTheme` is
assigned by the operator. Conversations with no theme are **excluded** from convergence rather
than guessed at — an LLM clustering the problem text would manufacture agreement out of shared
vocabulary, which is the exact failure this gate exists to prevent. The system counts what you
assign; deciding two founders described the same problem is a judgement only a person can make.

### The previous wedge is history, not deleted

The M&A / corporate-finance wedge is preserved as `active: false`, keeping its state, its three
research conversations and all 53 prospects. The current wedge — founder-led AI and digital
transformation advisories, US and UK — starts at `immersion` with **zero** conversations.

**The prospects were deliberately not reattached.** Moving them would pretend a pipeline exists
for a hypothesis that has none. The cost of changing wedge is exactly this, and a system that
hides it is not worth having.

---

## 16g. The research corpus and Judge V0 (2026-09-07)

### The corpus

Real content from the wedge's market, captured by hand. Not tenant data, no `orgId`, unreachable
from any client role: one corpus serves every client in the same wedge, which is the economic
argument for building it at all.

**Nothing is ranked by views.** An example is banded against the median of the same creator's
*other* examples — excluding itself, so a creator's own hit cannot inflate the baseline it is
measured against and disguise itself as typical. Below three baseline pieces the band is
`unknown` rather than a number nobody should trust. The most-viewed thing in a niche usually just
belongs to the largest account in it.

Below 100 examples the corpus screen says plainly that it is a reading list and not a signal
source. Seven illustrative rows ship with the seed, marked `illustrative` and shaped so the
banding is visible: one outperformer against four ordinary pieces by the same creator, plus a
250k-follower account with no baseline at all.

### Judge V0 — shipped uncalibrated, and it says so

Nine criteria, rubric `v0.1`, three of them **gating**: ICP relevance, authority, evidence. A
gating criterion below its floor rejects on its own regardless of the total, because a piece that
scores brilliantly everywhere and cannot be evidenced is not a good piece with one flaw.

**The model scores criteria; the verdict is our arithmetic.** No overall is ever asked of the
model, so the threshold stays auditable and cannot drift between runs.

**Every verdict is written `calibrated: false` — stored, not computed**, so a later calibration run
cannot retrospectively promote an opinion formed before there was any evidence for it.

**It is not wired into client idea or script approval.** This is deliberate and should stay that
way until the calibration says otherwise. An uncalibrated rubric in an approval path is a
confident opinion with authority it has not earned. It runs on corpus examples, where being wrong
costs nothing and teaches something.

### What calibration can and cannot say

Corpus examples have a known outcome, which makes them the only material available for checking
whether the Judge's opinion is worth anything. `/admin/research/calibration` reports the
separation between what actually outperformed and what did not, and puts the **worst misses
first** — the pieces the Judge rated low that went on to outperform are where the rubric is
missing something real.

Illustrative rows are excluded and the page says how many. Calibrating against invented outcomes
would be worse than not calibrating at all.

A good separation shows the rubric can tell good market content from ordinary market content. It
does **not** show the rubric can predict which of our scripts earns a client a buying
conversation. That is a different claim, only client outcomes can support it, and the word
"calibrated" is reserved for it — which is why nothing is ever marked calibrated however good the
separation looks.

---

## 16h. Platform applications

Researched 2026-09-07 against current official documentation. Full detail, sources and the filing
order are in `docs/PLATFORM_APPLICATIONS.md`. The three facts that change what gets built when:

1. **LinkedIn publishing to a founder's own profile needs no approval at all.** The self-serve
   Share on LinkedIn product grants `w_member_social` on app creation — 150 posts per member per
   day. Reading how those posts performed is the gated part, and it is a 4-week-to-4-month queue.
   Publishing and analytics are separately gated on the same platform, so they must be separately
   capable in code.
2. **An unaudited TikTok app is silenced, not throttled.** Every post is forced to `SELF_ONLY`
   while the API returns success. Audit status belongs in the connection record and an unaudited
   connection should refuse to publish rather than publish invisibly.
3. **Meta Business Verification and YouTube OAuth verification need nothing from the product.**
   Both are document-driven, both have their own clocks, and both should be filed now.

Manual ingestion stays the permanent fallback rather than a stopgap, because for the first several
months it is the only path there is.

---

## 17. DO NOT BREAK

1. **Tenant isolation.** No repository or action may obtain an `orgId` from anywhere except an
   `AuthContext`. Never accept `orgId` from client input. `src/lib/auth/tenancy.test.ts` guards
   this — if it fails, stop.
2. **Client data ownership.** Files are served only through `/api/files`, which re-checks
   membership per request. Never move uploads to `public/`.
3. **Workflow integrity.** Every state change goes through `src/lib/domain/workflow.ts`. Do not
   add a direct `prisma.contentItem.update({ stage })` that bypasses it.
4. **The fact-check gate.** A script with unverified claims must never reach the recording queue.
5. **The AI abstraction.** Nothing outside `src/lib/ai` imports a model SDK.
6. **Demo output is always labelled.** `isDemo` must reach the UI. Never present composed demo
   output as a live model call.
7. **Honest integrations.** Never show a connected state that is not real, and never add a button
   that silently does nothing.
8. **One core codebase.** Configuration changes between clients; the code does not. No
   client-specific forks, no single-client feature flags.
9. **Computed scores stay computed.** Do not let a model produce a number the UI presents as a
   metric.
10. **No fabricated proof.** No invented testimonials, logos, clients or results anywhere.
11. **The human decision gate on intelligence.** A candidate signal must never become a `Pattern`
    except through `decideCandidateAction`, and a run must never publish with a candidate still
    `pending`. This is the single most load-bearing claim the marketing site makes.
12. **Evidence citation.** A candidate signal without at least one `CandidateEvidence` row must not
    exist. If the generator returns a citation that does not resolve, drop the candidate — do not
    attach the nearest item to make it valid.
13. **Derived progress stays derived.** Do not add a "mark milestone complete" action, and do not
    store the observable proof figures. If you find yourself wanting to, read ADR-007 first.
14. **Non-causal proof language.** `src/lib/domain/proof.test.ts` sweeps every metric for causal
    wording. If it fails, the copy is wrong, not the test.
15. **The URL reader's SSRF guards.** Never relax the private-address check, never follow redirects
    automatically, and never add caller-supplied headers to the outbound request.
16. **The published brief is frozen.** A brief is what the client was sent. Do not add an edit path
    for `published`.
17. **The client surface is enforced server-side.** Hiding a nav item is never the control. Every
    client-scoped read goes through `clientScope` in `src/lib/domain/visibility.ts`, and the
    internal-only capabilities are denied to all three client roles.
    `src/lib/auth/visibility.test.ts` guards this — if it fails, stop.
18. **Readiness cannot be green without being checked.** A setup marked ready with an unassessed
    or blocking dimension, or a blocked setup with no client action, is refused.
19. **Long-form is never a default.** It is enabled per client, deliberately, with an audit line.
20. **Access method is not status.** "Set up" must never be renderable as "connected to an API".
21. **Never use `text-base` as a colour.** It is Tailwind's font-size utility and silently wins,
    which made every primary and accent button label invisible. Use
    `text-[color:var(--color-base)]`.
22. **No active record without a next action and a due date.** Enforced by `assertActiveRecord`
    on every write to a prospect or a wedge. Without it the pipeline quietly becomes a list of
    things that were once interesting.
23. **The funnel is counted, never stored.** Do not add a running counter for touches, bookings or
    wins. A stored counter drifts from the records the first time somebody corrects one, and then
    nothing can say which is right.
24. **Do not build a CRM here.** Contacts, companies, communications and deal history belong to an
    external CRM. Threadline links to it with three columns and does not synchronise.
25. **A commercial figure carries its attribution class.** Never render a content link as a cause
    without one, and never upgrade a correlation into a causal claim.
26. **The interview gate has no override, and it is two conditions.** Ten recorded conversations
    *and* more than five converging on the same expensive problem. Five is an interim checkpoint,
    never a gate. Adding a way round either condition removes the only thing standing between a
    hypothesis and a campaign nobody can interpret.
32. **A period fee is not a monthly fee.** Four-week cycles bill thirteen times a year. Never sum
    `periodFee` and label the result MRR — use `monthlyEquivalent()` and say it is an equivalent.
27. **No attribution model may raise an evidence class.** Arithmetic redistributes credit; it does
    not create evidence. `evidenceStrength()` is deliberately separate so the rule is visible, and
    `attribution.test.ts` asserts it across every model and every class.
28. **The tracked redirect never takes its destination from the request.** It comes from the stored
    row, validated on write. A redirector that accepts a target from the URL is an open redirect,
    and one on the company's own domain is a phishing primitive.
29. **Identity is a first-party token and nothing more.** No fingerprinting, no device signals, no
    cross-device stitching. `Visitor.token` is unique per organisation so one browser cannot link
    two clients.
30. **Money per asset stays gated on coverage.** Below half of commercial events being defensibly
    evidenced, revenue-per-asset is withheld with the reason shown.
31. **Synthetic never becomes proof.** `assertNotSyntheticProof` guards it, portfolio aggregates
    exclude it, and the banner is not decorative.

---

## 18. What happens next

**The next step is not in this repository.**

The biggest remaining gap in Threadline is not a feature. It is external evidence: who client #1
is supposed to look like, what expensive recurring problem enough of them describe without being
led, whether they take commercial action when shown the solution, and whether Threadline can
deliver it profitably and repeatably. No amount of building answers any of those.

The engine now exists to make that work legible rather than remembered. Use it:

1. **File the platform applications.** They cost an evening and the queues run for months —
   see `docs/PLATFORM_APPLICATIONS.md`. Nothing else on this list is blocked by them, which is
   exactly why they should go out before anything else does.
2. **Start the wedge.** The wedge changed, and the count is honestly back to zero: ten founder
   conversations to become eligible for a validation decision, with more than five of them
   converging on the same expensive recurring problem. Five is a checkpoint that reports, not a
   gate that opens. The gate will not let commercial testing start before that, which is the point.
2. **Set the acquisition target and work the quota.** The arithmetic will tell you how much
   activity the target implies, and refuse to guess when it cannot.
3. **Run the Friday review.** Freeze the counts, change one variable, write down what you expect.
4. **Sell.** Diagnose, do not pitch. A legitimate no-fit is a correct outcome.
5. **Client #1**, then document what was actually identical and what was configured.

Only after that does more building earn its place.

### The short technical list, when building is warranted again

1. **Breakpoint QA at 1024 / 768 / 390px**, plus a browser confirmation of the checklist save and
   the call outcome form (see §20). This is the one gap in the verification record.
2. **Set `SEED_DEMO_PASSWORD`** before the demo is shown anywhere shared.
3. **Email delivery**, then **password reset** (backlog #3, #4).
4. **LinkedIn publishing** — the self-serve product needs no approval and can be built now;
   the Community Management application for member analytics is the long pole and should already
   be filed (`docs/PLATFORM_APPLICATIONS.md`).
5. **Encrypted credential storage** — prerequisite for every real integration.
6. **Background jobs** for scheduled report generation and metric refresh.
7. **Object storage adapter** before any multi-instance deploy.

Everything else stays in `FUTURE_BACKLOG.md` until real use earns it.

---

## 19. Changelog

### Session 6 — cadence, the validation gate, the corpus and Judge V0 (2026-09-07)

**Consistency fixes.** The commercial cadence became four-week service periods
(`Organization.periodFee`, `ProofPeriod.kind: "period"`, `src/lib/domain/service-period.ts`) after
a contextual audit that deliberately left genuinely calendar-monthly concepts alone. The validation
gate became two conditions rather than one: five is an interim checkpoint, ten makes a wedge
eligible for a decision, and more than five must converge on the same problem — with convergence
counted from an operator-assigned `problemTheme` rather than inferred from text. The M&A wedge was
preserved inactive with its conversations and 53 prospects rather than deleted.

**The research corpus.** `ResearchExample` and `ExampleAnalysis`, not tenant-scoped, unique by
URL, with outlier bands computed against the creator's own median excluding the piece itself
(ADR-017). Seven illustrative seed rows. `/admin/research`.

**Judge V0.** Nine criteria, three gating, rubric `v0.1`. The model scores criteria and the verdict
is computed in code. Every verdict stored `calibrated: false` (ADR-018), and deliberately not
wired into client idea or script approval. `/admin/research/calibration` checks the rubric against
what actually outperformed, excludes illustrative rows, and states in writing what the separation
number cannot tell you.

**Platform applications.** `docs/PLATFORM_APPLICATIONS.md` — researched against current official
docs, not memory. LinkedIn publishing to a member's own profile turns out to need no approval at
all; member analytics is a months-long queue; an unaudited TikTok app publishes invisibly while
returning success.

Two migrations, 11 new tests (451 total). Browser QA did not run.

### Session 5 — attribution v1.5 and the synthetic dry run (2026-09-06)

- **Attribution v1.5.** Tracked links, anonymous touchpoints, dated commercial events, three
  checkable models, journey timelines, per-dimension reporting, a funnel that only draws what it
  can see, tracking health, curated client Results and a frozen attribution block in the report.
  See §16d.
- **The synthetic dry run.** One boolean on `Organization`, load-bearing in three places. See
  §16e.
- **Delivery Load** on `Task`, with active and waiting minutes kept apart.
- **Attribution capability** (`attribution.manage`) added, internal only. Clients keep the
  curated Results view; the plumbing is operator work.

**Found and fixed by browser QA:**

- The same deal was **credited twice** — once as an opportunity and once as the win — so credited
  value read £36K where one £18K deal had closed. Pipeline and revenue are different things and
  adding them together describes neither. Events are now deduplicated per lead, keeping the
  furthest-down-funnel one.
- The Delivery Load summary rendered a stray space before its full stop when there was no cash
  cost.

**Verified end to end in a browser and by request:** the tracked redirect returns 302 to the
stored destination with an httpOnly first-party cookie, records the touchpoint, 404s for unknown
and retired slugs; the journey timeline renders click → click → repeat click → form → enquiry →
booked → showed with provenance; a client role requesting the operator attribution page is
redirected to no-access with none of its content in the response.

### Session 4 — the Living SOP Engine (2026-09-06)

Threadline's own market validation, prospect pipeline, sales calls and acquisition arithmetic,
built against the full business resource pack (`Threadline Final Working Resources`), which was
present in the workspace for the first time.

- **The SOP library became state.** `src/lib/domain/sop.ts` holds every prospect and wedge state
  with its meaning, its commercial reason, its checklist, its completion criteria and its legal
  next states. Rendered as work rather than as documentation; the long-form SOP is a link nobody
  should need.
- **The operating invariant is enforced on every write** — no active record without a next action
  and a due date — and `invariantBreaches()` checks it rather than assuming it.
- **The funnel is counted, never stored.** Every rate derives from prospect and call records at
  read time (ADR-012). Qualification became measurable as a result, which closed backlog item 8b
  by not adding the field it asked for.
- **`/admin` became the cockpit.** Ordered by what can still change the commercial outcome today.
  The portfolio list moved to `/admin/clients`, which already existed for exactly that.
- **External CRM boundary written down and kept.** Three link columns, no synchronisation, no
  contact or company models. See §16c.
- **Attribution class on every commercial signal**, defaulting to the weakest honest answer, with
  a measurement-health check that runs before anybody interprets a number.

**Resource conflict resolved and recorded:** the Acquisition Operating Manual names cold email as
the primary delivery mechanism and LinkedIn as support. The Master Blueprint and the current
implementation prompt both say a platform is a component rather than the strategy, and that no
channel should be hard-coded. Precedence gave the latter: `Prospect.channel` is free text, the
funnel reports per channel from what is recorded, and a test asserts no channel name appears in
either the funnel or the SOP model.

**Found and fixed by browser QA:**

- A session cookie whose session no longer exists produced an **infinite redirect loop** between
  `/login` and `/app`: middleware sent the cookie-holder to the app, the guard found no session and
  sent them back, and the person could never reach the form to sign in again. Sessions expire, so
  this locks real users out — not only developers after a re-seed. The guard now flags that it
  checked the database and found nothing, and middleware clears the dead cookie instead of
  bouncing. The login page says the session ended.
- Closed prospects sorted to the top of the pipeline list, because SQLite orders nulls first and a
  closed record correctly has no due date. They also carried a red "No date" warning for a field
  they are not supposed to have — a warning that appears on correct states is a warning people
  learn to ignore.
- The quota on the cockpit did not say whether it came from measured rates or from planning
  assumptions. Both render identically, and only one is evidence.
- "Calls today: 0" was captioned "all prepared".
- `weakestConversion` (then `firstBrokenConversion`) fell back to naming the first judgeable step
  when nothing stood out, which would have sent the operator to change a variable that was not the
  constraint.
- The transition form and the record form on the same page both used `id="nextAction"`, breaking
  label association for both.

### Session 3 — launch hardening (2026-09-04)

Client/operator separation, recording readiness, the long-form pilot, honest access methods, and
the V14 positioning and validation corrections.

- **One system, two experiences.** `operatorNav` keeps the full loop; `clientNav` is eight
  destinations ordered by what a founder actually does. Raw research, undecided candidates,
  unapproved signals and draft diagnoses became internal-only *capabilities*, so the routes deny
  independently of the nav.
- **Visibility.** `src/lib/domain/visibility.ts` derives client visibility from state that
  already exists, and stores exactly one flag (`Pattern.visibility`) where nothing did. A second
  narrow addition (`Comment.internal`) gives operators somewhere private to write.
- **"Threadline is working on".** Eight real counts from persisted, tenant-scoped records. Reports
  a quiet week as quiet.
- **Approvals.** One queue answering one question, oldest first.
- **Recording readiness.** Seven checks, three honest outcomes, and gates that refuse a green
  status nobody earned. Wired in as an eighth installation milestone.
- **Long-form.** Entitlement via the existing `modulesEnabled`, packaging fields, and an approval
  gate that refuses a long-form package with no title or thumbnail.
- **Access methods.** `manual | native_delegated | api`, shown separately from status.
- **Positioning and validation (V14).** Public copy moved from workflow-led to creative-led;
  the wedge is documented as a hypothesis rather than hard-coded as a validated niche; funnel
  maths added to the existing metrics dashboard; demo fees aligned to the locked offer.

**Found and fixed by browser QA** (the first session with a real browser):

- `text-base` is Tailwind's **font-size** utility, so using it to mean "the base background
  colour" silently produced **invisible label text on every primary and accent button** —
  including the sign-in button, every marketing CTA and the sticky CTA. Seven occurrences.
- Middleware redirected a signed-in user from `/login` to `/app`, **which had no route** —
  so every signed-in user opening the login page got a 404. Fixed with a real `/app` entry route
  that resolves the caller's destination (middleware cannot: it has no database access).
- The Approvals nav badge said 7 while the page listed 29, because the badge omitted packaging.
  Both now read the same function.
- Blank required fields showed Zod's raw `"Invalid input: expected string, received undefined"`.
  Fixed centrally in `zodFieldErrors`, so every form in the product benefits.
- `/install/recording` highlighted the wrong nav item; it is now a child of Recording.

Counts moved to **49 models / 49 routes / 263 tests**.

**Not verified:** true breakpoint behaviour at 1024, 768 and 390px. This environment cannot change
the browser viewport — window resizing is ignored, iframes are refused by the app's own
clickjacking headers, and popups are blocked. QA ran at roughly 1440px, where the client surface,
approvals and recording setup all render correctly with no console errors. The narrower widths
remain the one open item.

### Session 2 — post-v1 P0 upgrade (2026-09-03)

Five P0 items, and deliberately nothing else. Existing modules were extended rather than rebuilt;
no v1 invariant was relaxed.

- **Intelligence Run.** A first-class cycle — declared sources, honest collection, deduplicated
  evidence with full provenance, AI-proposed candidates that must cite that evidence, a human
  approve/reject/edit gate, ranked content tests with a defined read, performance feedback into
  signal confidence, and a frozen client-facing brief. Reuses the existing signal engine
  (ADR-006), so the lineage chain research -> signal -> test -> idea -> script -> content ->
  publish -> inquiry stays unbroken.
- **Constraint diagnosis.** Nine dimensions, one named primary constraint, an activation gate
  requiring all nine plus a written commercial impact, a draft seeded from onboarding, and a
  monthly review that appends rather than overwrites. Five of the nine dimensions are made worse
  by more content, and the product says so on screen.
- **Day-7 win.** Seven milestones derived from real workspace records, an operator view with
  blockers, a calm client view, and one stored sign-off for the decision that is not a record.
- **Proof capture.** Baseline versus months, with platform-observable figures recomputed at read
  time and client-reported figures labelled as reported. The language rules are enforced by a test
  sweep rather than by good intentions.
- **Public site.** Rewritten around outcome -> pain -> mechanism -> division of labour ->
  intelligence proof -> first win -> fit -> product proof -> CTA. One dominant CTA per viewport, a
  sticky CTA, restrained scroll motion that leaves the page readable without JavaScript, and three
  new product visualisations.

**Found and fixed during this pass:**

- Workspace-wide notifications reached every member regardless of role, so an `editor` was being
  told an intelligence brief existed for a surface they cannot open. Notifications are now filtered
  by the reader's capabilities (`NOTIFICATION_CAPABILITY`).
- `testRankScore` could return a negative score for a negative evidence count. Clamped at both
  ends; the test that caught it asserts the score stays finite and non-negative for degenerate
  input.
- The first scroll-reveal implementation hid content before hydration, which would have left the
  marketing site blank without JavaScript. Rewritten to render visible and only arm the animation
  for blocks currently below the fold.

Counts moved from 39 models / 43 routes / 74 tests to **47 models / 47 routes / 188 tests**.

### Session 1 — v1 implementation session

Built from an empty repository:

- **Foundation:** stack selection with five recorded ADRs, five specification documents, Prisma
  schema (39 models), initial migration, TypeScript/ESLint/Tailwind/Next configuration.
- **Design system:** dark-first token system with a disciplined champagne accent, ~40 primitives,
  7 in-house SVG charts, the Threadline wordmark and thread symbol.
- **Security:** scrypt password hashing, digest-stored session tokens, a capability matrix, a
  four-layer enforcement chain, rate limiting, an audit log, and a private file-serving route.
- **Data layer:** 15 org-scoped repositories, a derived-metrics engine, and a lineage resolver.
- **AI layer:** provider abstraction, Anthropic provider, deterministic demo provider, eight
  context composers, seven prompt templates, seven validated generators, per-call accounting.
- **Client portal:** 20 routes across all nine navigation sections plus reports and tasks.
- **Onboarding:** 15 consultative steps with autosave and a build step that genuinely writes the
  Brand Brain, seeds research, generates ideas and creates tasks.
- **Admin portal:** 8 surfaces including client creation from a master template, a cross-client
  operator queue, a 14-document SOP library and business metrics.
- **Marketing site:** 5 pages including a 10-section home page, a 3-step application flow and an
  honest cost calculator.
- **Demo:** two client tenants plus the internal org, with realistic, internally consistent data.
- **Testing:** 74 automated tests plus a recorded manual acceptance pass.

Notable problems found and fixed during the build: React Server Component boundary violations
(icon components and functions crossing to client components), a `React.useId` hook called after an
early return in `AreaTrend`, generic-inference failure on `ActionForm` caused by parameter
contravariance, and role denials surfacing as error boundaries instead of explanations.

---

## 20. Last verified state

Run on **2026-09-07** (the research corpus and Judge V0), from a clean re-seed.

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | **PASS** — 0 errors, strict mode |
| Lint | `npm run lint` | **PASS** — 0 errors, 0 warnings |
| Tests | `npm test` | **PASS** — 451 tests, 107 suites, 0 failures |
| Production build | `npm run build` | **PASS** — 60 routes, including the two research surfaces |
| Migrations | `prisma migrate` | Valid — eight migrations, applied cleanly |
| Seed | `npm run seed` | **PASS** — 4 organisations, 7 illustrative corpus rows, no residue from QA runs |

64 models. Manual verification is recorded per-test in `docs/ACCEPTANCE_TESTS.md` sections P–AG.

**Browser QA did not run this session.** The corpus and calibration surfaces have been verified by
typecheck, lint, unit tests, a production build and an end-to-end script against the real database
— banding, the corpus reading and calibration's refusal on illustrative-only data were all
confirmed by running them — but nobody has opened either page in a browser. That is acceptance
test AG23, and it is open.

Previous run: 2026-09-06 (attribution v1.5) — 403 tests, 94 suites, 55 pages, six migrations. The
outstanding browser gaps from that session, recorded below, are still outstanding.

**Browser QA in this session was partial, and the gap is specific.** The market, prospects,
acquisition and cockpit surfaces were opened in real Chrome, signed in through the real form, and
verified visually with no console errors; the interview sample gate and the session-loop fix were
exercised end to end. Part way through, the browser tab began reporting `document.hidden === true`
and returning zero-size layout rectangles — the window was no longer visible to the renderer — and
from that point neither real nor synthetic clicks reached React. **The checklist save path and the
call outcome form were therefore not confirmed in a browser.** Their rules are covered by unit
tests (`resolveCheck`, `assertCallOutcome`), but a person should tick a box and record a call
outcome once before this is called done.

**Note on `npm run db:reset`:** Prisma refuses this command from an AI agent without explicit
human consent, which is correct behaviour. Use `npm run seed` instead — it is idempotent and
rebuilds the demo organisations in place.

Git: repository initialised locally; no commits made (the working tree holds the full
implementation). Commit hash: n/a.
