# Threadline OS — Architecture

Last updated: 2026-09-02

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19 | Server Components + Server Actions give us server-enforced tenancy without a separate API tier |
| Language | TypeScript (strict) | Non-negotiable for a data model this size |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Design tokens live in one CSS file, not a JS config |
| Primitives | Radix UI (unstyled) + in-house components | Real accessibility (focus traps, ARIA, keyboard) without inheriting someone else's visual language |
| ORM | Prisma 6 | Typed queries, migrations, portable schema |
| Database | SQLite by default, PostgreSQL supported | See ADR-001 |
| Validation | Zod 4 | One schema per mutation, shared client/server |
| Auth | First-party session cookies + `node:crypto` scrypt | No external dependency, no vendor lock, fully server-verified |
| AI | Provider abstraction over Anthropic SDK, mock provider fallback | See section 7 |
| Icons | lucide-react | Consistent, tree-shaken |
| Charts | In-house SVG components | Full control of the visual system; no charting dependency |

**Deliberately not added:** a component kit (shadcn-style copy-in was preferred), a charting
library, a date library, a state-management library, an ORM query builder on top of Prisma,
tRPC (Server Actions cover it), NextAuth (see ADR-002).

---

## 2. Architecture decision records

### ADR-001 — SQLite default, PostgreSQL supported

**Decision.** `prisma/schema.prisma` targets SQLite by default via `DATABASE_URL="file:./dev.db"`,
and the schema is written to be provider-portable so it can be pointed at PostgreSQL by changing
the datasource provider and `DATABASE_URL`.

**Why.** The product must be demo-ready on any machine with zero infrastructure setup — a sales
call cannot depend on a Postgres container starting. Portability is preserved by:

- no database enums (statuses are `String` columns constrained by Zod unions in `src/lib/domain/`)
- no native array columns (list-valued fields are JSON-encoded `String` columns, read and written
  through typed helpers in `src/lib/db/json.ts`)
- no Postgres-only types or extensions
- `cuid()` string primary keys

**Consequence.** Moving to Postgres is a two-line change plus `prisma migrate dev`. Full-text
search is `contains`-based; a Postgres deployment can later swap in `tsvector` behind the same
repository functions. Documented in `HANDOFF.md`.

### ADR-002 — First-party auth instead of NextAuth/Supabase

**Decision.** Sessions are opaque random tokens stored in the `Session` table and set as an
`httpOnly`, `sameSite=lax`, `secure` (in production) cookie. Passwords are hashed with
`scrypt` from `node:crypto` with a per-user random salt and constant-time comparison.

**Why.** Tenancy enforcement is the single most important invariant in this product. Owning the
session lookup means every request resolves `user -> memberships -> org -> role` from our own
database in one place (`src/lib/auth/guard.ts`) with no third-party token semantics in between.
It also removes a hosted dependency from the demo path, and sessions are revocable.

**Consequence.** We own password reset and email verification (not in v1 scope; documented in
`FUTURE_BACKLOG.md`). No OAuth in v1.

### ADR-003 — Server Actions as the only mutation path

Every mutation is a Server Action in `src/lib/actions/*.ts`. Each action, without exception:

1. resolves the caller with `requireOrgAccess(orgSlug, roles)` (or `requireInternal()`),
2. validates input with a Zod schema,
3. performs writes scoped by `orgId` from the resolved context — **never** from client input,
4. writes an `AuditLog` row for state-changing operations,
5. calls `revalidatePath`.

There is no public REST surface for tenant data, so there is no second path to secure.

### ADR-004 — Local disk storage behind a storage interface

Uploads are written to `storage/{orgId}/...` on local disk via `src/lib/storage/index.ts`, which
exposes a `StorageAdapter` interface (`put`, `get`, `delete`, `signedUrl`). An S3/Supabase adapter
can be dropped in without touching call sites. Files are served through
`/api/files/[...path]/route.ts`, which re-checks org membership on every read — **files are never
served from a public static path.**

### ADR-005 — Lineage is modelled with real foreign keys

Rather than a generic "activity" table, the pipeline stages are explicit relations
(`Idea -> Script -> ContentItem -> PublishRecord -> PerformanceSnapshot -> Inquiry`) plus an
`Evidence` join for research and pattern links. This makes "trace this published post back to the
research that caused it" a query, not a heuristic. See `docs/DATA_MODEL.md`.

---

### ADR-006 — The intelligence run reuses the existing signal engine

**Decision.** An approved candidate signal becomes a `Pattern`, and a content test becomes a
`Pattern` of kind `test` linked to its parent through a self-relation, rather than either being a
new parallel entity.

**Why.** The signal engine already models evidence links, confidence, impact, effort and a computed
score, and `Idea.patternId` already carries lineage forward into scripts and content. Introducing a
second, parallel "finding" entity would have split the lineage in two and left two answers to the
question "why did we make this?".

**Consequences.** The full chain stays navigable in both directions with real foreign keys:
research -> candidate -> signal -> test -> idea -> script -> content -> publish -> performance ->
inquiry. `CandidateSignal` exists only as the pre-decision holding state, which is what makes the
human-approval gate enforceable rather than advisory.

### ADR-007 — Milestones and observed metrics are derived, never stored as claims

**Decision.** Installation milestone completion and the platform-observable half of the proof
comparison are computed from workspace records at read time. The only stored state is what cannot
be derived: an explicit human sign-off, an operator blocker, and figures only the client can know.

**Why.** A stored "done" flag drifts. It can be set by mistake, set optimistically, or left true
after the underlying work is deleted — and a progress screen that overstates reality is worse than
no progress screen, because it is believed. The same argument applies to a proof figure: a stored
count of published pieces can be edited; a recomputed one cannot.

**Consequences.** A milestone completes because the work exists. A month cannot be quietly improved
by typing over a number. The cost is a handful of counting queries per page load, which is
negligible at this data volume and can be memoised if it stops being.

**The deliberate exception:** the 30-day strategy sign-off. That is a client decision rather than a
record, so it is stored — and until it is recorded, the milestone reads *in progress, awaiting
sign-off* even when all the underlying work exists.

### ADR-008 — The URL reader is a narrow, guarded capability

**Decision.** Threadline fetches public pages a person supplied, and nothing else. No crawling, no
link following, no credentials, no background collection.

**Why.** The alternative to a real reader is a fake one, and the alternative to a narrow one is a
scraper that quietly breaks platform terms and creates an unbounded server-side request surface.
Because the URL comes from a user, every fetch is a server-side request to an
attacker-influenceable address, which is the classic SSRF shape.

**Consequences.** `src/lib/integrations/fetch-url.ts` enforces: http/https only; DNS resolution with
rejection of private, loopback, link-local, CGNAT and multicast addresses (including IPv4-mapped
IPv6 and cloud metadata endpoints); manual redirect handling so every hop is re-validated; and hard
caps on time, redirect count and response size. It sends no caller-supplied headers and identifies
itself honestly.

Platforms that serve a login wall are refused **by name** with the manual paste path offered
instead — because a reader that returns an empty result is indistinguishable from one that found
nothing, and that ambiguity is exactly what the honesty rules exist to prevent.

### ADR-009 — The client surface is a filter, not a second application

**Decision.** One system, one database, one tenancy, two experiences. The client surface is a
narrowed view of the same tenant, enforced in the repositories, rather than a separate client app.

**Why.** A second application means two codebases, two deployments and — the part that actually
matters — two places for a tenancy bug to live. It also duplicates every read, so the two
inevitably drift and the client eventually sees something the operator surface has already changed.

**Consequences.** Visibility is derived from state that already exists wherever that state answers
the question (a brief is visible because it is *published*, a diagnosis because it is *active*).
Exactly one visibility column was added, `Pattern.visibility`, because whether a signal is part of
the client's approved strategy is an editorial decision no status encodes; and one narrow flag,
`Comment.internal`, so operators have somewhere private to write.

The enforcement rule: **hidden navigation is never the control.** Internal-only surfaces are gated
by capabilities no client role holds, and every client-scoped read spreads a `clientScope` clause.
When the capability changed, the type checker enumerated every call site that needed a role — which
is the desired property: a new client-facing read cannot compile without deciding what it shows.

### ADR-010 — Acquisition is arithmetic, not a feature

**Decision.** The product contains no acquisition tooling — no scraping, sending infrastructure,
platform automation, outreach extension or ads modules — and no channel is named as doctrine
anywhere in the code. What it does contain is the funnel arithmetic that turns a target into
required activity, from Threadline's own recorded rates.

**Why.** Channel choice is an operating hypothesis that will change several times before the first
client; encoding one in software converts a reversible decision into a migration. Building the
tooling before there is a client is the most expensive available form of procrastination.

**Consequences.** `src/lib/domain/funnel.ts` is channel-agnostic by construction, and a test
asserts no channel name appears in the model. It **refuses to project** when a rate is unmeasured,
naming the gap — because a funnel model that always returns a number is a random number generator
with a formula attached.

**Superseded in part by ADR-012.** This ADR originally said qualification was always an
assumption, because nothing recorded it. Call outcomes now do, so it is measured when attended
calls exist and labelled an assumption when they do not. The principle is unchanged; only the
availability of the evidence changed.

### ADR-011 — Threadline's own operating records live here, without an `orgId`

**Context.** The Living SOP Engine holds Threadline's own market validation, prospects, sales
calls and acquisition target. These look like tenant data and are not: they belong to the business
running the product, not to any client of it.

**Decision.** They are ordinary models in the same schema with **no `orgId`**, following the
precedent already set by `Application` and `InternalMetric`. Access is guarded by two new
capabilities — `acquisition.view` and `acquisition.manage` — held only by internal roles, and the
routes live under `/admin`, which already refuses every client role at the layout.

**Why not a separate database or application.** The same argument as ADR-009. A second deployment
would duplicate auth, audit, the capability matrix and the deployment pipeline, and would create a
second place for an access bug to live. The distinction that matters is *who may read this*, and
that is already expressed as a capability.

**Why not scope them to an internal organisation row.** It would make every query carry a join
that means nothing, and it would imply these records are tenant data that happens to belong to
Threadline — inviting a future change that exposes them through a tenant-scoped surface. Having no
`orgId` at all makes the boundary structural: there is no organisation to leak them to.

**Consequence.** `reset()` in the seed must delete them explicitly, because the organisation
cascade does not reach them. That is written down in the seed itself.

---

### ADR-012 — The funnel is counted, never stored

**Context.** Every acquisition rate in the product — booking, show, qualified, close — could have
been stored as a running counter updated on each event. Most CRMs do exactly that.

**Decision.** Nothing is stored. `Prospect` carries `firstTouchAt`, `repliedAt` and
`positiveReplyAt`; `SalesCall` carries `attended`, `qualified`, `offerMade` and `outcome`. Every
rate is counted from those columns at read time in `src/lib/data/acquisition.ts`.

**Why.** A stored counter drifts from what happened the first time somebody corrects a record —
marks a call as a no-show, reclassifies a reply, deletes a prospect added in error. The counter
and the records then disagree, and there is no way to tell which is right. Counting at read time
cannot drift, because there is only one representation.

This is the same principle as ADR-007, applied to commercial rather than delivery metrics, and it
is what lets the product make a stronger claim than most: the number on the acquisition page is
not a summary of what was entered, it is a count of what exists.

**Consequence.** Qualification stopped being an assumption. It was previously unmeasurable and
always labelled a guess (see ADR-010); now that call outcomes record whether a prospect was
genuinely a fit, `funnelRates` promotes it to a measurement — and still labels it an assumption
whenever no attended calls exist. The deferred backlog item that asked for a qualification field
is closed by not adding one.

**What is deliberately not derived.** The weekly review freezes its counts into `FunnelReview`.
That is a snapshot of what was true when a decision was made, not a running metric, and it must
not change afterwards — the same reasoning that freezes `WeeklyReport.payload`.

---

### ADR-013 — A checklist write sends an instruction, not a value

**Context.** A checkbox that saves itself has to tell the server what it now is. The obvious
implementation — submit the form from the change handler — posts the value the box had *before*
the click, because the browser serialises form state on render. The tick appears, the server is
told nothing changed, and the next render puts it back.

**Decision.** A plain checklist item posts `mode=toggle` and no value. The server reads what is
stored and flips it (`resolveCheck` in `src/lib/domain/sop.ts`). An item that requires written
evidence posts `mode=set` with the value, because the operator presses a save button after the
render, by which time the serialised state is current.

**Why not fix the timing instead.** Two attempts were made — deferring the submit by a commit, and
driving the checkbox as a controlled component. Both add machinery whose correctness depends on
render timing, which is exactly the thing that was unreliable. Sending an instruction removes the
race rather than trying to win it, and the rule is then a pure function with tests.

### ADR-014 — Attribution reconstructs a journey; it never invents one

**Context.** Threadline needs to answer "which content created commercially valuable attention"
for content it did not publish, on platforms whose APIs it does not have, for buyers whose
journeys it can only partly see.

**Decision.** Four models — `TrackedLink`, `Visitor`, `Touchpoint`, `CommercialEvent` — record
observations. Three transparent attribution models read those observations. Nothing writes an
inference back.

- **A touchpoint is an observation.** Each row is something that happened: a click through a
  Threadline redirect, a form arriving, or an operator writing down what somebody said. Models
  read touchpoints; they never create them.
- **Identity is a first-party cookie and nothing else.** No fingerprinting, no device signals, no
  cross-device stitching. The token says "these clicks were the same browser", which is all it can
  honestly say. `Visitor.token` is unique *per organisation*, so one browser reading two clients'
  content produces two independent rows and neither client can be linked to the other through it.
- **Every foreign key is optional**, because most real journeys are partial. A model that needed a
  complete journey would say nothing about real data.

**Why only first touch, last touch and linear.** A client can check any of the three by hand. A
weighted or learned model cannot be checked, so it has to be taken on trust — which is the
opposite of what attribution is for. Adding one later would be a product decision, not a
modelling improvement.

**Linear splits across distinct assets, not touchpoint rows.** Otherwise one enthusiastic reader
clicking the same post four times makes it look like the strongest thing published. Rounding
remainder goes to the first asset so the parts still sum to the whole.

---

### ADR-015 — Evidence strength is never produced by arithmetic

**Context.** Splitting a deal across three assets is arithmetic. It is tempting to let the
existence of a tidy split imply the connection is well evidenced.

**Decision.** `CommercialEvent.attribution` is the evidence class, it is set by a person, and no
code path raises it. `evidenceStrength()` exists as a separate function that ignores the
attribution result entirely — so that the rule is visible when reading the code, and so a test can
assert that no model changes it.

The five classes stay distinct and are never collapsed into attributed/not-attributed:
`directly_tracked`, `buyer_named`, `multi_touch`, `associated`, `qualitative_only`.

**Money is gated on coverage.** Below half of commercial events being defensibly evidenced,
revenue-per-asset is withheld and the reason is shown. The failure this prevents is precise: four
correlations and one traceable large deal produce "£40,000 from this post", which is
arithmetically true and completely misleading.

**One deal, one credited outcome.** A deal that becomes an opportunity and then closes produces
two valued events; crediting both would add pipeline to revenue and describe neither. The
furthest-down-funnel event wins. Events with no lead attached are left alone — nothing says they
are the same deal, and guessing would be worse than the double count it avoided.

---

### ADR-016 — The synthetic workspace is a column, not a convention

**Context.** Threadline runs one dry run before its first client: a real company used as a public
reference, treated as an imaginary client, put through the actual fulfilment path to find out what
delivery is missing.

**Decision.** `Organization.synthetic`, a boolean. It stays `kind: "client"` deliberately — the
whole point is that it runs through the same code as a real client, and a separate kind would
route it around exactly the paths the dry run exists to exercise.

The marker is load-bearing in three places: portfolio and revenue aggregates exclude it,
`assertNotSyntheticProof` refuses it wherever proof is used, and a banner sits above every page in
the workspace. Clearing the marker is the dangerous direction and carries the heavier confirmation,
because it makes every figure in that workspace eligible to be quoted as a client result.

**Why not a naming convention.** A polished synthetic result is indistinguishable from a real one
once it has been screenshotted, and "we ran this for a company like yours" would be a lie. A
convention is something a person has to remember; a column is something the code enforces.


### ADR-017 — The corpus is banded, never ranked

**Context.** "What is working in this market" is the input to every idea
Threadline generates. The obvious implementation ranks collected content by
views.

**Decision.** Nothing is ranked by raw views. An example is banded against the
median of *the same creator's other examples*, and the band is computed at read
time rather than stored.

**Why not views.** The most-viewed thing in a niche belongs to the largest
account in it. Ranking by views produces a list of big accounts and teaches the
system that being famous is a content variable.

**Why not stored.** A band depends on the creator's other examples, so adding one
example changes the band of every other example by that creator. A stored band
would be wrong the moment the corpus grew, which is continuously. Same reasoning
as ADR-012.

**Consequence.** A creator with fewer than three other examples gets `unknown`
rather than a number. That is a real limitation and it is shown: the corpus
screen reports how many examples can be banded at all, and the empty state asks
for *ordinary* content from creators already present, because a corpus of nothing
but hits makes everything look typical.

---

### ADR-018 — The Judge ships uncalibrated, and says so

**Context.** An evaluation pass in front of a human is only useful if its opinion
is worth something. The rubric is a hypothesis about what makes expert-led B2B
content earn commercially valuable attention, and it has never been checked
against an outcome.

**Decision.** Ship it, mark it, and build the thing that can check it in the same
pass.

- Every verdict is written `calibrated: false` — **stored**, not computed, so a
  later calibration run cannot retrospectively promote an opinion formed before
  there was evidence for it.
- Every surface carries the disclaimer, and no verdict blocks a human decision.
- The **model scores criteria; the verdict is our arithmetic.** Asking the model
  for an overall would make the threshold un-auditable and let it drift between
  runs.
- Gating criteria — ICP relevance, authority, evidence — reject on their own
  regardless of the total. A piece that scores brilliantly everywhere and cannot
  be evidenced is not a good piece with one flaw.

**Why it is not wired into client idea or script approval yet.** An uncalibrated
rubric in an approval path is a confident opinion with authority it has not
earned. It runs on corpus examples, where being wrong costs nothing and teaches
something.

**How it gets calibrated.** Corpus examples have a known outcome. Scoring them
and checking whether the Judge rated the outperformers higher is the first honest
answer. The calibration page states its own limit in as many words: a separation
on corpus content shows the rubric can tell good market content from ordinary
market content, and says nothing about whether it can predict which of our
scripts earns a client a conversation. "Calibrated" is reserved for that second
claim.

---

### ADR-019 — The baseline ladder, and why weaker comparisons need higher bars

**Context.** ADR-017 banded every example against its own creator's median and
returned `unknown` when that creator had fewer than three other pieces. In a
hand-seeded corpus that is most of it, so most of the corpus said nothing.

**Decision.** Fall back down a ladder, and always report which rung was used.

| Rung | Comparison | Needs | Strong at | Exceptional at |
|---|---|---|---|---|
| `creator_format` | Same creator, same format, within 18 months | 3 | 2x | 5x |
| `creator` | Same creator, any format | 3 | 2x | 5x |
| `cohort` | Different creators, same platform and wedge, follower count within 5x | 5 | 3x | 8x |
| `platform` | Everything on that platform | 8 | 4x | 12x |
| `none` | — | — | `unknown` | `unknown` |

**The thresholds widen as the comparison weakens, and that is the whole point.**
Being 5x your own median is remarkable. Being 5x the median of a loose cohort of
other people is close to noise, because most of what is being measured is the
difference between accounts. A weaker baseline has to clear a higher bar to earn
the same word.

**Nothing is blended.** The first rung that meets its own minimum wins outright.
A weighted mixture of a good comparison and a bad one is a bad comparison
wearing a number that looks considered.

**`unknown` survives.** When no rung qualifies the answer is still "we cannot
say" — the ladder exists to use real evidence further afield, not to manufacture
a number from whatever was lying around.

**Confidence is reported next to every band**, so a `strong` resting on a
platform baseline is never mistaken for a `strong` resting on the creator's own
recent work.

---

### ADR-020 — Reach is not the finding; commercial standing is

**Context.** A corpus that ranks by outperformance answers "what travelled". The
question Threadline actually needs answered is "what is worth making", and those
diverge constantly — the highest-performing content in almost any professional
niche is the content that stopped being about the profession.

**Decision.** Every example carries two operator-assigned ratings —
`buyerRelevance` (direct / adjacent / off_icp) and `commercialIntent`
(commercial / mixed / entertainment) — and the reading combines them with the
band into a `commercialStanding`:

| Standing | Meaning |
|---|---|
| `commercial_outlier` | Outperformed **and** reached a plausible buyer. The only value that means "study this". |
| `popular_off_icp` | Outperformed in front of the wrong room. A warning, not a template. |
| `relevant_but_ordinary` | On target, performed normally. Baseline material, and load-bearing: a corpus of nothing but hits makes everything look typical. |
| `ordinary` | Neither. |
| `unrated` | Nobody has said who it was for. |
| `unknown` | No usable comparison yet. |

**The ratings are never inferred.** An LLM asked "is this relevant to our buyer?"
will find a way to say yes, because the question invites it to. The extraction's
opinion is shown beside the field as a suggestion and is never pre-selected.
`unrated` is an honest and common state, and the corpus reading counts it out
loud rather than treating it as a zero.

**Consequence.** The headline corpus statistic is commercial outliers, not
examples. The seed demonstrates the distinction directly: two pieces by the same
creator, both `exceptional` at roughly the same multiple, one a
`commercial_outlier` and one `popular_off_icp`.

---

## 3. Directory map

```
prisma/
  schema.prisma            Single source of truth for the data model
  migrations/              Committed SQL migrations
  seed.ts                  Seed entry point
  seed/                    Demo workspace content, split by module
src/
  app/
    (marketing)/           Public site: home, how-it-works, who-its-for, apply, calculator, faq
    (auth)/login           Sign-in
    app/[org]/             Client portal (all modules)
    onboarding/[org]/      15-step onboarding
    admin/                 Internal operator portal
    api/                   File serving + health only; no tenant CRUD
  components/
    ui/                    Design-system primitives (button, card, dialog, table, ...)
    charts/                In-house SVG chart components
    app/                   Portal chrome: sidebar, topbar, command menu, tour
    marketing/             Marketing-only sections
    modules/               Feature components per module
  lib/
    actions/               Server Actions (all mutations)
    ai/                    Provider abstraction, context composition, prompts, generators
    auth/                  Session, password, guard, roles
    data/                  Read repositories (always org-scoped)
    db/                    Prisma client, JSON helpers
    domain/                Status unions, scoring, workflow transition rules
                           + visibility.ts    client surface derivation and filters
                           + readiness.ts     recording setup checks and gates
                           + longform.ts      pilot entitlement and packaging gates
                           + funnel.ts        channel-agnostic acquisition arithmetic
                           + intelligence.ts  run gates, evidence dedupe, test ranking
                           + diagnosis.ts     nine dimensions, volume verdict
                           + installation.ts  milestone derivation
                           + proof.ts         comparison and non-causal language
    integrations/          Integration registry + adapter interfaces
    storage/               Storage adapter
    reports/               Weekly report generation
    utils/                 cn, dates, formatting, ids
docs/                      Specification, architecture, data model, checklists
storage/                   Uploaded files (git-ignored)
```

---

## 4. Tenancy and authorisation

### Model

`User` --< `Membership` >-- `Organization`. A membership carries exactly one role. A user may
belong to many organisations (an internal operator belongs to the internal org and is granted
cross-tenant read/write via `isSuperAdmin` / `internal_operator` role, resolved server-side).

### Roles

| Role | Scope | Capability |
|---|---|---|
| `super_admin` | Global | Everything, including client creation and destructive admin |
| `internal_operator` | Global (Threadline staff) | Read/write across client workspaces, admin portal, no billing/destructive org actions |
| `client_admin` | One org | Full workspace access, member management, approvals, settings |
| `client_member` | One org | Read + contribute; may create ideas, comment, record; cannot approve or change settings |
| `editor` | One org | Production board access, asset upload, comments; no strategy or settings surfaces |

Role capabilities are declared once in `src/lib/auth/roles.ts` as a capability matrix
(`can(role, capability)`), used by both the server guard and the UI so they cannot drift.

### Enforcement chain

1. `middleware.ts` — cheap cookie presence check, redirects anonymous users away from
   `/app`, `/admin`, `/onboarding`. **This is a UX optimisation, not the security boundary.**
2. `requireUser()` — resolves the session server-side on every protected page and action.
3. `requireOrgAccess(orgSlug, capability)` — the real boundary. Loads the membership, verifies
   the capability, returns a typed `AuthContext { user, org, role, membership }`.
4. Repositories in `src/lib/data/*` take `AuthContext` (or an `orgId` derived from it) and always
   filter by it. No repository function accepts a caller-supplied `orgId`.
5. File reads re-check membership per request.

**Invariant:** no query in `src/lib/data` or `src/lib/actions` may read or write a tenant table
without an `orgId` filter derived from `AuthContext`. A test in
`src/lib/auth/tenancy.test.ts` asserts cross-tenant reads return empty and cross-tenant writes
throw.

---

## 5. Design system

Tokens are defined once in `src/app/globals.css` under `@theme`, so Tailwind utilities
(`bg-surface`, `text-muted`, `border-line`, `text-accent`) are generated from them.

```
--color-base        #0B0D0F   page background
--color-surface     #111418   secondary surface / sidebar
--color-elevated    #161A1F   cards, popovers
--color-raised      #1C2126   hover / input backgrounds
--color-line        #232A31   default border
--color-line-strong #313A43   emphasised border
--color-ink         #F5F2EB   primary text (warm white)
--color-muted       #9CA3AF   secondary text
--color-faint       #6B7280   tertiary text
--color-accent      #C8A96B   champagne (sparing)
--color-accent-soft rgba(200,169,107,.12)
--color-positive    #4E9E7E
--color-negative    #C4645C
--color-warning     #C79A4B
```

**Accent discipline.** Gold is reserved for: the active navigation item, the single most important
metric on a screen, selected states, and premium moments (report headers, tour). Structure and
information density carry the design; colour does not.

Typography: `Inter` for all UI, with `Instrument Serif` used only on marketing hero and section
openers. Numeric data uses tabular figures (`font-variant-numeric: tabular-nums`).

Component inventory (`src/components/ui`): Button, IconButton, Card, StatCard, Badge, Pill,
Input, Textarea, Select, Checkbox, Switch, Slider, Label, Field, Form primitives, Dialog,
Sheet, DropdownMenu, Tooltip, Tabs, Accordion, Table, DataTable, EmptyState, Skeleton,
Toast/Toaster, Progress, Avatar, Separator, Breadcrumbs, SegmentedControl, SearchInput,
FilterBar, Kbd, ScoreBar, StageBadge, Timeline, CopyButton, ConfirmDialog.

Charts (`src/components/charts`): AreaTrend, BarSeries, HorizontalRank, Sparkline, DonutSplit,
RetentionCurve. All accept a common `series` shape, are theme-token driven, responsive via
`viewBox`, and degrade to an empty state with no data.

---

## 6. Rendering and data flow

- Pages are React Server Components that call `src/lib/data/*` directly. No client-side fetching
  of tenant data.
- Interactive surfaces are Client Components that receive plain serialisable props and invoke
  Server Actions.
- Optimistic UI is used only where a failure is recoverable and visible (board drag, task check).
- `loading.tsx` per route segment renders module-shaped skeletons, not spinners.
- `error.tsx` per segment renders a recoverable error card with a retry action.

---

## 7. AI architecture

```
src/lib/ai/
  provider.ts       AiProvider interface { complete(req): Promise<AiResult> }
  anthropic.ts      Real provider (@anthropic-ai/sdk), used when ANTHROPIC_API_KEY is set
  mock.ts           Deterministic demo provider, used otherwise
  index.ts          getProvider(), isLiveAi(), runGeneration() wrapper
  context.ts        Context composers
  prompts/          One file per prompt template, versioned by a `key`
  generators/       Task-level functions returning validated, typed objects
```

**Provider abstraction.** UI and actions never import the Anthropic SDK. They call generators
(`generateIdeas`, `generateScript`, `refineScript`, `generateHooks`, `generatePackaging`,
`detectPatterns`, `generateWeeklyNarrative`). Generators compose context, render a prompt
template, call `runGeneration`, and parse the result with a Zod schema. Invalid model output is
retried once, then surfaced as a real error state — never silently swallowed.

**Context composition** (`context.ts`) builds these blocks from stored data, each independently
composable and token-budgeted:

`CLIENT_CONTEXT` · `FOUNDER_VOICE` · `OFFER_CONTEXT` · `ICP_CONTEXT` · `MARKET_CONTEXT` ·
`PERFORMANCE_CONTEXT` · `CONTENT_HISTORY` · `TASK_CONTEXT`

**Demo mode.** Without `ANTHROPIC_API_KEY` the mock provider returns high-quality, deterministic,
brand-context-aware output derived from the workspace's own Brand Brain and research — so a demo
is coherent — and the UI displays an explicit "Demo generation" marker. It never claims a live
model call happened.

**Accountability.** Every generation writes an `AiGeneration` row (provider, model, prompt key,
latency, token counts, status, entity link). All AI output is editable, and scripts carry
extracted factual claims that a human must tick off before approval.

---

## 8. Integration architecture

`src/lib/integrations/registry.ts` declares every integration with: provider key, display name,
category, capabilities, required credentials, current implementation status
(`available` | `adapter_only` | `manual_only`) and the manual fallback description.

`IntegrationAdapter` interface: `describe()`, `validateConfig()`, `connect()`, `status()`,
plus optional `publish()` and `fetchMetrics()`.

v1 status: every social/CRM/booking integration ships as `adapter_only` or `manual_only` with an
honest, non-clickable-to-nowhere UI state and a working manual workflow. The one genuinely
functional "integration" is the configurable external booking URL, because it requires no
credentials. **No adapter simulates a successful connection.**

---

## 9. Security posture

- Server-side authorisation on every page, action and file read (section 4)
- Zod validation at every trust boundary, including the public application form
- In-memory sliding-window rate limiting (`src/lib/security/rate-limit.ts`) on login, the public
  application endpoint and AI generation actions
- Input sanitisation for any user text rendered as rich content; no `dangerouslySetInnerHTML`
  on user-supplied strings (the report renderer uses a strict, allow-listed markdown subset)
- Secrets are server-only; no `NEXT_PUBLIC_` variable holds a credential
- Security headers set in `next.config.ts`
- Audit log for every state transition, approval, permission change and admin action
- `.env` is git-ignored; `.env.example` documents every variable with no values

---

## 10. Testing

- `npm run typecheck` — strict TypeScript, zero errors
- `npm run lint` — ESLint (next/core-web-vitals + TS)
- `npm test` — Node's built-in test runner via `tsx` over `src/**/*.test.ts`, covering the
  security-critical and logic-critical units: role capability matrix, tenancy scoping, workflow
  transition legality, idea/pattern scoring, report derivation, calculator maths
- `docs/ACCEPTANCE_TESTS.md` — the manual end-to-end matrix, executed and recorded before release
