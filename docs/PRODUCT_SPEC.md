# Threadline OS — Product Specification

Last updated: 2026-09-09 (§5.5 distribution and §5.6 performance brought to the current state
after the completion pass; the loop, modules and honesty constraints are unchanged. Owner doctrine
of 2026-09-09 — public pricing visibility, platform safety, cadence, offer direction — is recorded
in `HANDOFF.md` §13, §16b, §16f and §16i and applies to every surface described here.)

---

## 1. What Threadline is

Threadline is a **managed content growth service** for high-LTV, expert-led B2B businesses. We do
not sell software access. We sell a managed outcome.

### Positioning (locked)

> **You already have the expertise. We turn it into content people actually want to watch.**
>
> And we run the system around it, so the content compounds into authority and qualified demand.

Full form: *Threadline turns expert knowledge into high-quality content that builds authority and
qualified demand, without making the founder run the content machine.*

Threadline is in the **marketing lane**. Workflow and time saved are mechanism and secondary value
— never the headline result. Copy that leads with software, dashboards or hours reclaimed is wrong
and should be corrected toward the creative promise and the commercial outcome.

### Commercial hypothesis (launch)

| | |
|---|---|
| Implementation | GBP 2,500 |
| Monthly | GBP 2,500 |
| Initial engagement | 3 months |
| Offers | **One.** No Bronze/Silver/Gold, no tiers, no ascension |
| Long-form | PILOT / CUSTOM unless explicitly sold |

Tiers, add-ons and ascension are deferred until repeated demand proves they are wanted. There is
no tiered pricing UI in the product and none should be added.

### A productized service

Roughly **80% standard process, 20% configured** to the client's market, voice, offer, proof and
context. The client does not design the fulfilment system; they supply the context that shapes it.
Out-of-scope requests are not silently absorbed to save a deal — that is how a productized service
quietly becomes an agency.

The shape of it:

> market intelligence -> positioning and creative strategy -> content execution -> distribution
> -> performance and commercial learning.

The client should mainly:

- provide expertise and business context
- record in focused batches
- approve the decisions and assets that matter
- sell, and feed back real commercial outcomes

Threadline handles everything around those four actions, and increasingly so over time.

**Threadline OS** is the software layer of that engagement — the mechanism the service runs on and
the proof that it ran. It is not sold self-serve. It is configured *for* the client by an internal
operator during a paid installation, and the client has full visibility into all of it.

### What we are not

- Not an AI automation agency
- Not a generic content agency
- Not a social media management agency
- Not a self-serve SaaS product
- Not a collection of disconnected AI tools

### The core promise

> Threadline installs the operating system behind a founder's content.

The founder keeps the uniquely human work — expertise, judgment, face, voice, recording,
approval, sales. Threadline removes everything surrounding those actions.

### Positioning rule

AI is **internal leverage**, never the public product category. No marketing surface leads with
"AI". The website sells the business outcome first and reveals the operating system afterwards, as
the mechanism and the proof.

---

## 2. Market: umbrella, wedge and problem

**"Expert-led B2B" is the umbrella category, not a validated niche.** It is too broad to write a
first line to, and a business that speaks to all of it says nothing specific to any of it.

The operating method is **one active wedge and one validated expensive problem at a time**:

```
candidate wedges -> market immersion -> problem/solution validation
  -> freeze one wedge, problem and outcome hypothesis -> launch readiness
  -> funnel maths -> acquisition -> diagnosis and sales -> client #1
  -> measured delivery and proof -> improve the reusable 80%
```

Do not run acquisition against an unfrozen hypothesis: rewriting the offer mid-campaign destroys
the only signal the campaign was producing.

**Where the hypothesis lives.** In the `active-wedge` internal document (admin portal → SOPs),
deliberately as an editable document rather than a schema field — it is a belief that changes on
evidence, and a model would imply a permanence it has not earned.

**Reading the evidence honestly.** A first sample of around five conversations, most describing the
same core problem unprompted, is a *signal worth acting on* — enough to freeze a hypothesis and
test it. It is not proof. Five conversations cannot establish a rate, and a problem we named first
is much weaker evidence than one they raised themselves. Disconfirming conversations are the
valuable ones.

**Umbrella characteristics** (the pool wedges are drawn from): established B2B consultants,
specialist agencies and expert-led service firms with

- a proven offer at roughly **GBP 5,000 and up**, that clients already buy
- meaningful customer lifetime value, so a handful of extra qualified conversations changes the year
- visible content potential — opinions, methods and client work worth publishing
- capacity to take on more qualified demand
- a founder willing to appear, on camera and in writing

**Explicitly not designed around:** hobby creators, view-chasers, deal values below roughly
GBP 5,000, businesses already at capacity, enterprises with an internal content department, or
anyone expecting guaranteed reach, leads or revenue.

The platform is multi-tenant so the ICP can shift without a rebuild. **80–90% of the product is
identical between clients; only configuration changes.**

---

## 3. The operating loop

```
UNDERSTAND -> RESEARCH -> DETECT SIGNALS -> IDEATE -> SCRIPT -> RECORD -> PRODUCE
   -> APPROVE -> DISTRIBUTE -> MEASURE -> LEARN -> (back to UNDERSTAND)
```

Every module is a stage in one loop, not a standalone tool. Records retain lineage so a published
piece can be traced backwards to the research signal that caused it (see `docs/DATA_MODEL.md`
section "Lineage").

---

## 4. Product surfaces

| Surface | Audience | Route root |
|---|---|---|
| Marketing website | Prospects | `/` |
| Application flow | Prospects | `/apply` |
| ROI / cost calculator | Prospects | `/calculator` |
| Client portal | Founder + client team | `/app/[org]` |
| Onboarding | New client | `/onboarding/[org]` |
| Admin / operator portal | Threadline internal | `/admin` |

---

## 5. Client portal — module specification

Primary navigation: **HOME · INTELLIGENCE · CREATE · PRODUCTION · DISTRIBUTION · PERFORMANCE ·
PIPELINE · LIBRARY · SETTINGS**

### 5.1 HOME — Founder Command Centre

The most important screen. Answers "what do I do today?" in under five seconds.

- **Today** — record these / approve these / decisions required / overdue / alerts
- **This week** — recording queue, scheduled content, workflow status, shipped, deadlines
- **Performance snapshot** — published, views, retention, engagement, inbound signals, booked
  calls, winning content, output vs previous period
- **Operating metrics** — founder time spent, estimated hours saved, cycle time, approval
  turnaround, pieces shipped, bottleneck indicator
- **Latest insights** — derived statements computed from real stored data, never decorative

### 5.2 INTELLIGENCE

Five sub-surfaces:

1. **Brand Brain** — the context layer. Company / Offer / ICP / Founder / Voice / Proof /
   Content Rules. Structured, audited, editable inline, feeds every AI call.
2. **Intelligence runs** — the market intelligence cycle, and the thing the client actually
   reads. See 5.2.1.
3. **Constraint diagnosis** — nine rated dimensions of the demand problem, one named primary
   constraint. See 5.2.2.
4. **Market Radar** — research workspace. Competitors, research items, customer language,
   questions, objections, trends, content examples, offer examples. Tagged, filterable,
   searchable.
5. **Signals** — outliers, patterns, hypotheses, tests, learnings. Each carries evidence links,
   confidence/impact/effort and a computed priority score, plus a next experiment. Approved
   candidate signals from a run land here; tests derived from them link back to their parent.

#### 5.2.1 Intelligence runs

A run is one cycle of market intelligence, and it is the unit behind the sentence a client should
be able to read every week: *here is what Threadline found in your market, why it matters, and what
we are doing because of it.*

**Lifecycle:** `scoping -> collecting -> synthesis -> review -> published` (or `archived`).
Published briefs are frozen, the same rule the weekly report follows.

**Inputs (declared as sources):** approved research-source configuration, website and Brand Brain,
offer and ICP, selected competitors / creators / categories, manually supplied sales-call notes and
transcripts, customer-language sources, historic content, and available performance and pipeline
data.

**Collection is honest about what is possible.** Three real paths and no fourth that pretends:

| Path | Applies to | How it works |
|---|---|---|
| Internal | historic content, performance, pipeline | Read from records this workspace already holds. Needs no credentials because the data is already ours. |
| URL | competitor posts, creator posts, single pages | A person supplies a URL; the server fetches and extracts the readable text, SSRF-guarded. Platforms that serve a login wall are refused *by name*, with the manual path offered instead. |
| Manual | sales calls, customer language, categories, notes | Pasted in. Blank-line separated blocks become separate evidence items. |

A source that cannot be collected records status `unavailable` with the specific blocker in the
operator's words, and that appears in the published brief.

**Evidence keeps its provenance.** Every collected item stores source URL, source type, timestamp
and source metadata, and is fingerprinted (`ResearchItem.dedupeKey`) so the same item collected
twice is reused rather than duplicated — which keeps "three independent sources say this" a true
statement.

**Synthesis proposes; humans decide.** Extraction looks for customer language, pains, desires,
objections, competitor themes, content outliers, recurring hooks, offer shifts and content gaps.
Every candidate must cite evidence ids the generator actually supplied; any candidate whose
citations do not resolve is discarded rather than repaired. Candidates land as `pending`.

**The gate:** a run cannot be published while any candidate is undecided. Approving one creates a
`Pattern` in the existing signal engine and carries its evidence links across; rejecting one
requires a written reason. Approved signals become ranked content tests, each with a defined read;
tests seed ideas through the existing promotion path.

**The loop closes:** recording a test result moves the confidence of both the test and the signal
it came from, by one small bounded step, so a signal needs several consistent reads before the
system treats it as settled.

#### 5.2.2 Constraint diagnosis

A structured read on what is actually limiting demand, so the operation cannot default to assuming
more content is the answer.

Nine dimensions, each rated 1 (severely constrained) to 5 (strong): positioning, audience/ICP,
offer alignment, content-market fit, differentiation, creative quality, distribution, conversion
path, operations.

Stored: one primary constraint, supporting evidence, severity, confidence, why it matters
commercially, a recommended next action and experiment, and a review date.

**Only four of the nine can be answered by volume**, and the product says so on screen for whichever
constraint is current. Onboarding seeds a *draft* diagnosis by rating the four dimensions its
answers genuinely support; the remaining five need a person to look at the actual work, which also
means a questionnaire can never activate a diagnosis on its own.

**Gates:** all nine dimensions must be rated and a commercial impact written before a diagnosis can
become current. Exactly one diagnosis is current at a time; the previous becomes `superseded`.

Surfaced in onboarding (seeded), the admin client view (operator detail), the client portal, and
the monthly strategy review, which appends to the record rather than overwriting it.

### 5.3 CREATE

1. **Ideas** — full CRUD, AI generation using Brand Brain + Market Radar + performance history,
   scoring (novelty, relevance, proof strength, format fit -> priority), statuses
   `backlog -> shortlisted -> approved -> scripted` (plus `rejected`, `archived`), bulk actions,
   filters, search, evidence links.
2. **Scripts** — generation with hook variants, version history, refinement controls
   ("More like me", "Less hype", "Add proof", "Rewrite hook", "Generate 5 hooks", ...),
   QA states `ai_draft -> needs_fact_check -> ready_to_record -> approved`, flagged factual claims
   that must be explicitly verified by a human before approval.

### 5.4 PRODUCTION

1. **Recording Room** — founder-facing focus mode. Today / This week / Backlog. Teleprompter
   with font size, scroll speed, full-screen, paragraph highlighting, prev/next, completion.
   Batch time estimate. Raw asset attachment.
2. **Board** — kanban/table hybrid across `raw -> editing -> in_review -> changes_requested ->
   approved -> scheduled -> live`. Editor assignment, structured revision requests, approvals,
   revision counts, due dates, asset history, full event timeline.
3. **Packaging** — per-platform titles, captions, descriptions, hashtags, overlays, thumbnail
   concepts, CTA options, clip opportunities, repurposing instructions. Platform-specific by
   design, never one blob of copy reused everywhere.

### 5.5 DISTRIBUTION

Calendar + list. Publish records per piece per platform with status
`draft -> ready -> scheduled -> published` (plus `failed`), URL capture, account mapping, access
method (`manual | native_delegated | api`) and distribution mode (organic / paid amplified).
Connectors for LinkedIn, YouTube, Instagram, TikTok and X publish through the official APIs once
credentials and platform review exist; until then the integration card reads "credentials
missing" or "auth required" and the manual route is the normal path. Integration cards show the
capability-granular connection state; nothing fakes a connection, and no connector ever automates
human social behaviour (`HANDOFF.md` §16i).

### 5.6 PERFORMANCE

Per-asset metric snapshots: manual entry, or ingestion through the analytics normaliser, which
records each field as a value, `unavailable`, `unsupported`, `unknown` or `stale`, with provenance
and freshness, and never turns a missing figure into a zero. Derived views: top performers,
underperformers, over time, by format / topic / hook / CTA / platform. Auto-derived winners,
losers, learnings and next tests, which write back into the Signal Engine and Idea Engine.

### 5.7 PIPELINE

Lightweight commercial attribution — not a CRM. Inquiry -> qualified -> call booked -> won/lost,
each optionally linked to the content item and CTA that produced it. Answers one question:
*what content appears to be creating qualified conversations?*

### 5.8 LIBRARY

Centralised assets and knowledge: raw media, edited media, scripts, transcripts, research,
testimonials, case studies, brand assets, offer docs, thumbnails, reports. Searchable and
associable with content records.

### 5.9 REPORTS

Weekly executive summary generated from stored data: executive summary, shipped, wins, misses,
learnings, next week, client actions required, operating metrics. Printable / exportable.

### 5.10 TASKS

Client-facing task layer showing only what needs *their* attention (record, approve, upload,
decide, review). Internal users get operational tasks. Not a project-management tool.

### 5.11 SETTINGS

Workspace, members and roles, platforms and cadence, content rules, integrations, demo mode.

---

### 5.12 INSTALLATION — the first-value flow

Seven milestones with a target day each, all inside the first week: business context captured,
constraint diagnosis complete, first intelligence brief, 30-day strategy approved, first researched
scripts ready, first recording completed, first assets in production.

**Milestone state is derived from real workspace records**, not from a checkbox. The stored overlay
holds only what cannot be derived: an explicit human sign-off (the 30-day strategy, which is a
client decision rather than a record), an operator blocker, a note and a target date. A blocker
always overrides the derived status, including in the client's view.

The operator sees the action required and any blocker; the client sees a calm progress view with
one clear next step. The card disappears from Home once the installation is genuinely complete.

### 5.13 PROOF — baseline and monthly comparison

Tracks founder hours on content, content output, production cycle time, approval time,
audience and engagement quality, qualified inquiries, booked calls, attributable commercial signal
and notable qualitative outcomes.

**Two kinds of number, always labelled.** The baseline describes the operation *before* Threadline,
which nothing inside the product can observe, so every baseline figure is client-reported. For
engagement months, figures the platform can observe (pieces published, cycle time, approval time,
inquiries, calls booked, attributable value) are **recomputed from workspace records at read time**
and are not editable — so a month cannot be quietly improved by typing over it.

**Language rules, enforced by tests:** changes are *associated with* the period Threadline has been
engaged; commercial value is *attributed where trackable*; closed value is a *commercial signal*.
Nothing on the surface claims Threadline caused a number to move. Missing data renders as a blank,
never as a zero. A month where more went backwards than forwards says so in its headline.

Periods can be locked once shown to a client, following the same rule as a frozen weekly report.

---

### 5.14 The two experiences

One system, one database, one tenancy — two experiences.

**Operator surface** (Threadline staff): the full loop, including raw research, in-flight
intelligence cycles, undecided candidates, unapproved signals and draft diagnoses.

**Client surface** (client roles): eight destinations, ordered by what a founder actually does —
This week, Recording, Approvals, Content, Intelligence, Results, Reports, Settings.

**Curated transparency.** The client sees what needs them, approved strategy and intelligence,
content status, results and reports, and a real "Threadline is working on" view computed from
persisted records. They do not see raw or rejected research, undecided machine output, tentative
diagnoses, AI or provider accounting, vendor cost or margin, operator-private notes, or internal
queues that require nothing from them.

**Enforcement.** Hidden navigation is never the control. The internal-only surfaces are gated by
capabilities no client role holds, and every client-scoped read is narrowed in the repository (see
`src/lib/domain/visibility.ts` and ADR-009). `src/lib/auth/visibility.test.ts` asserts both against
a real database.

### 5.15 Acquisition support

Threadline's own acquisition is an **operating activity, not a software feature**. The product
contains no scraping, no sending infrastructure, no platform automation, no outreach extension and
no ads tooling, and none should be added.

What it does contain is arithmetic: `src/lib/domain/funnel.ts` turns a target into the first
touches it implies, from Threadline's own recorded rates.

```
required first touches = target wins / (booking x show x qualified x close)
```

Deliberately **channel-agnostic** — a channel is an operating choice that changes the booking rate,
not the formula, and no channel is doctrine anywhere in the code. Booking, show and close are
measured from recorded metrics; qualification is not recorded and is always labelled an assumption.
Where any rate is missing the model **refuses to project** and names the gap, because a funnel
model that always returns a figure is a random number generator with a formula attached.

---

## 6. Admin / operator portal

- **Clients** — all workspaces, status, package, onboarding stage, fee/MRR, last activity, alerts
- **Client setup** — create from master template; configure branding, offer, platforms, cadence,
  integrations, permissions, modules enabled
- **Operator view** — cross-client queue: overdue approvals, blocked production, missing
  recordings, upcoming reports, clients needing attention
- **Support / issue log** — issue, severity, client, owner, state, resolution, and whether it
  should become an SOP or product fix
- **SOP library** — editable structured internal documents
- **Applications** — inbound applications from the marketing site
- **Internal metrics** — lead source, calls, show rate, close rate, cash collected, setup fee,
  MRR, implementation hours, support hours, client health
- **Today / cockpit** — the operating queue, ordered by what can still change the outcome today
- **Market** — the wedge hypothesis, its state, and the research conversations behind it
- **Prospects** — Threadline’s own pipeline as a state machine, with per-state checklists
- **Acquisition** — the funnel counted from records, the quota, and the weekly control loop

The last four are Threadline running Threadline. See §6b.

---

## 6b. The operating cockpit and acquisition (Threadline running Threadline)

Threadline OS is the infrastructure used to deliver the service. It is also the infrastructure
used to *sell* it, and that half of the product has one purpose: the founder should not run the
business from memory.

### The daily loop it supports

Open Threadline, see what matters now, open the record, do the exact actions the state asks for,
complete them, watch the state advance, get the next action and its date, repeat.

### Today

`/admin` is a queue, not a dashboard, ordered by what can still change the commercial outcome
today:

1. replies to handle — the only thing on the page that can still become a booking today;
2. dated commitments, including the ones that have slipped;
3. preparation for calls that are actually happening;
4. decisions outstanding on proposals;
5. A-tier work, where competence is demonstrated before attention is asked for;
6. prospects ready for a first touch — the quota;
7. prospects sourced but unqualified.

Alongside: today's calls, the active wedge and whether it is frozen, client delivery blockers, and
whether each client's measurement can support a claim at all.

### Market validation

One wedge and one expensive problem at a time. "Expert-led B2B" is the umbrella category, not a
niche: it is too broad to write a first line to. The wedge moves through candidate, immersion,
interviews, commercial test and validated.

Two thresholds do two different jobs. **Five conversations** is an interim checkpoint — enough to
decide whether to keep booking, not enough to decide anything about a market. **Ten** makes the
wedge eligible for a validation decision. And eligibility is not validation: leaving interviews
for commercial testing also requires **more than five conversations converging on the same
expensive recurring problem**, where convergence is an operator judgement the system counts rather
than a string comparison it guesses at.

Whether the buyer raised the problem or agreed with ours is recorded separately, because those are
not the same evidence — and a sample where we named everything is no evidence at all, however
large it gets.

The product will not express any of this as a rate. At these sample sizes a percentage is false
precision somebody would eventually quote in a sales call.

### Acquisition

`required first touches = target wins / (booking x show x qualified x close)`, divided by the
remaining acquisition workdays. Every rate is counted from records. The model refuses to project
when an input is missing, shows the measured projection beside the assumed one, and says so when
the arithmetic is demanding a day nobody can work — because the input making it bad is upstream.

No channel is doctrine. Which channel carries a first touch is free text on the record, and the
funnel reports each separately because warm referrals, cold outreach and inbound convert
differently.

### What this is not

Not a CRM. Contacts, companies, communications and deal history belong to an external system;
Threadline links to it and owns the question that system cannot answer — given the state this
record is in, what exactly happens next. There is no sending, no scraping, no sequences and no
automation that contacts anybody. Sending is a human act, recorded here afterwards.

---

## 6c. Attribution and the synthetic dry run

### What attribution is for

Threadline optimises for commercially valuable attention rather than reach, which requires knowing
which content produced commercial conversations. The chain is content asset, tracked touchpoint,
visitor, commercial event, value — and then the only question that matters: what should we make
more of.

The client sees answers. The operator sees the plumbing.

### How the client sees it

Results groups every commercial figure by how strongly it is evidenced, and never sums them into
one number. "Pipeline directly tracked to content" and "pipeline that moved during the period" are
different claims; collapsing them is the most tempting dishonesty available to a reporting screen.
Each class carries its own sentence, and the correlated one says in as many words that the evidence
does not support a causal claim.

Money per asset is withheld when too few commercial events are traceable, with the reason given.
Missing tracking is described as missing data, never as zero commercial value.

### Publishing is not a prerequisite

A tracked Threadline link in a caption or a bio records the click whoever posted it. The service
therefore does not depend on any platform approving API access, and social API approval is not a
launch blocker.

### The synthetic dry run

One dry run before client #1: a real company used as a public-information reference, treated as an
imaginary client, put through the real fulfilment path to find the SOP gaps and the true Delivery
Load. It is marked structurally, excluded from portfolio totals, refused as proof, and labelled on
every page. Nothing from it may become a case study, a testimonial or a claimed outcome.

---

## 7. Onboarding

15 consultative steps: Welcome, Business, Offer, Customer, Founder, Voice, Existing Content,
Market, Current Operation, Goals, Commercial Path, Integrations, Review, System Build,
First Command Centre.

Principles: one clear decision per screen, progressive disclosure, contextual "why we ask",
visible progress, autosave, intelligent defaults, lossless back navigation, clearly marked
optional questions, review before completion, and an immediate transition from answers into a
populated workspace. Onboarding must *build* something — on completion it writes the Brand Brain,
seeds research, generates starter ideas and creates the founder's first tasks.

---

## 8. Design system

Dark-first, premium, calm, operator-focused. Restrained champagne-gold accent used only for
selected states, important metrics, small highlights and premium moments.

| Token | Value |
|---|---|
| Background | `#0B0D0F` |
| Secondary surface | `#111418` |
| Elevated card | `#161A1F` |
| Primary text | `#F5F2EB` |
| Secondary text | `#9CA3AF` |
| Accent (champagne) | `#C8A96B` |
| Positive | restrained emerald |
| Negative | restrained red |
| Warning | muted amber |

Typography: modern sans for all UI; an editorial serif used sparingly on marketing emphasis only.
Never a serif in dense app UI.

Full token list and component inventory: `docs/ARCHITECTURE.md`, section "Design system".

---

## 9. Honesty constraints (product-level, non-negotiable)

1. No fabricated testimonials, clients, logos, revenue or case studies on marketing surfaces.
   Founding-phase language is used instead.
2. No integration is presented as connected unless it genuinely is. An integration whose
   credentials, OAuth grant or platform review are missing shows that specific state with a manual
   fallback; capability is read from stored state, never inferred from configuration.
3. No button appears functional and silently does nothing.
4. AI output is always editable and never presented as verified fact. Factual claims are extracted
   and must be explicitly checked by a human before a script can be approved.
5. Calculator and savings language is framed as scenario/estimate, never guarantee.
6. **Nothing the system proposes influences strategy until a human decides on it.** Candidate
   signals land as `pending`; a run cannot be published while any is undecided; only an explicit
   approval creates a signal in the workspace; a rejection requires a reason.
7. **Every finding cites its evidence.** A candidate that cannot point at the collected item behind
   it is discarded, not repaired.
8. **A brief states what it could not read.** Sources that could not be collected appear in the
   published brief with the specific blocker, never omitted.
9. **Proof language never claims causation.** Changes are *associated with* the engagement period;
   commercial value is *attributed where trackable*; closed value is a *commercial signal*. Missing
   data renders blank, never zero. A bad month says it was a bad month.
10. **Progress is derived, not asserted.** Installation milestones complete because the work exists
    in the workspace, and an operator blocker always overrides a healthy-looking count.
11. **More content is not assumed to be the answer.** The constraint diagnosis names which of the
    nine dimensions is binding, and states plainly when volume would make the problem more
    expensive rather than smaller.

---

## 10. Demo

A fully seeded demo workspace (Northbeam Advisory, founder Alex Morgan, GBP 8,000 SaaS sales-ops
consulting engagement, ICP: B2B SaaS founders at GBP 500k–5m) with realistic Brand Brain,
research, signals, 30+ ideas, scripts, recording queue, production board across all stages,
distribution, 90 days of performance data, pipeline signals, weekly report, tasks and
notifications.

A discreet **Demo Tour** control walks a nine-stop narrative for sales calls.
