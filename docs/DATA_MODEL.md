# Threadline OS — Data Model

Source of truth: `prisma/schema.prisma`. This document explains intent, relationships and the
rules that the schema alone cannot express.

Last updated: 2026-09-02

---

## 1. Conventions

| Convention | Rule |
|---|---|
| Primary keys | `cuid()` strings |
| Tenant key | `orgId` on **every** tenant-owned table |
| Statuses | `String` columns; the legal values live in `src/lib/domain/*.ts` as Zod unions and are validated on every write |
| Lists / structured blobs | JSON-encoded `String` columns, read/written through `src/lib/db/json.ts` typed helpers |
| Money | Integer **minor units** (pence) plus a `currency` field. Never floats |
| Timestamps | `createdAt` / `updatedAt` on mutable records |
| Deletes | Org deletion cascades to all tenant data; optional user references become `null` so history survives staff departures |

**Why no database enums:** portability between SQLite and PostgreSQL (ADR-001) and because status
sets change during product evolution — a Zod union is a one-line change plus a migration-free
deploy, while a DB enum is a migration and a lock.

---

## 2. Tenancy core

```
User ──< Membership >── Organization
                 role: super_admin | internal_operator | client_admin | client_member | editor
```

- `Organization.kind` is `client` or `internal`. The internal Threadline org is a normal row.
- `User.isSuperAdmin` is the only global flag; every other permission derives from `Membership`.
- `Session` holds opaque tokens, enabling revocation and per-session audit.
- `AuditLog.orgId` is nullable so global admin actions are still recorded.

**Tenant key rule.** Every table below except `User`, `Session`, `Application`, `InternalMetric`
and global `SopDocument` rows carries `orgId`. Repository functions must filter on it.

---

## 3. Brand Brain (context layer)

| Model | Cardinality | Contents |
|---|---|---|
| `BrandBrain` | 1 per org | `company`, `founder`, `voice`, `contentRules` JSON blocks + `completeness` |
| `Offer` | many | price (minor units), mechanism, outcome, differentiators, guarantees, CTAs, exclusions |
| `IcpProfile` | many | pains, desires, objections, buying triggers, sophistication |
| `ProofItem` | many | testimonials, case studies, metrics, credentials + `claimStatus` |

The four `BrandBrain` JSON blocks are typed and validated by `src/lib/domain/brand-brain.ts`.
They are blocks rather than 40 columns because they are read as a whole (to compose AI context)
and edited as a whole (one section per form), while `Offer` / `IcpProfile` / `ProofItem` are
separate tables because individual records need identity, linking and lifecycle.

`ProofItem.claimStatus` (`allowed` / `needs_review` / `prohibited`) is enforced by the script
generator: prohibited proof is excluded from AI context entirely.

---

## 4. Market Radar

```
Competitor ──< ResearchItem >──< ResearchItemTag >── Tag
```

`ResearchItem.kind`: `competitor_post`, `customer_language`, `question`, `objection`, `trend`,
`content_example`, `offer_example`, `source`.

`collectedVia` records provenance (`manual` / `url` / `seed` / `adapter`) so a future ingestion
adapter can be distinguished from human-entered research. Tags are a real join table (not a
delimited string) so filtering and counting are index-backed queries.

---

## 5. Signal engine

```
Pattern ──< PatternEvidence >── ResearchItem
                             └─ ContentItem
Pattern ──< Idea
```

`Pattern.kind`: `outlier` | `pattern` | `hypothesis` | `test` | `learning` — one table because
these are lifecycle states of the same object (an outlier becomes a pattern, becomes a
hypothesis, becomes a test, becomes a learning) and keeping them in one table preserves the
evidence trail across that lifecycle.

`score` is derived, never hand-entered:

```
score = (confidence/100) * impact * (6 - effort)      // range 0 .. 25
```

Computed in `src/lib/domain/scoring.ts` and recalculated on every write.

### Run provenance and derivation

Three fields added post-v1 tie the signal engine to the intelligence cycle:

| Field | Purpose |
|---|---|
| `runId` | The intelligence cycle that produced this signal |
| `derivedFromId` | Self-relation: the signal a `test` was derived from |
| `rank`, `successMetric` | Ordering among a cycle's tests, and the measure it is read on |
| `feedbackNote`, `lastFeedbackAt` | Written back by the performance loop, never by a model |

`detectedBy` gains `intelligence_run` alongside `manual`, `performance_loop` and `ai`.

---

## 5b. Intelligence run

```
IntelligenceRun ──< RunSource            (declared inputs, honest collection status)
                ──< ResearchItem         (evidence, with provenance and a dedupe fingerprint)
                ──< CandidateSignal ──< CandidateEvidence >── ResearchItem
                                    └─ Pattern            (set on approval)
                ──< Pattern              (signals and tests produced by this cycle)
```

**`IntelligenceRun`** — one cycle. `status`:
`scoping | collecting | synthesis | review | published | archived`.
`brief` holds a **frozen JSON payload** written at publish time, the same rule `WeeklyReport`
follows: a brief read months later shows what the client was sent, not a silent re-query.

**`RunSource`** — a declared input. `collectionMode` is `manual | url | adapter`; `status` is
`pending | collected | unavailable | skipped`. A source that cannot be collected records
`statusNote` with the specific blocker, and that text reaches the published brief.

**`CandidateSignal`** — a proposal awaiting a human decision. This table exists *specifically* so
the approval gate is structural: a candidate is not a signal, and only
`decideCandidateAction` can turn one into a `Pattern`. `decision` is
`pending | approved | rejected`; `editedByHuman` records that a person changed the wording, so
provenance in the published brief stays truthful.

**`CandidateEvidence`** — the join that makes "cite your evidence" enforceable. A candidate with
no rows here cannot be created.

### Evidence provenance and deduplication

`ResearchItem` gains `runId`, `sourceMeta` (JSON: source type, collection mode, fetch timestamp)
and `dedupeKey`, with `@@unique([orgId, dedupeKey])`.

The fingerprint is a URL when there is one (normalised: host lowercased, `www.` and trailing
slash removed, tracking parameters stripped) and normalised text otherwise. Nullable on purpose:
items captured by hand are never forced into a fingerprint. Deduplication is what keeps "three
independent sources say this" an honest statement rather than the same quote counted three times.

---

## 5c. Constraint diagnosis

```
ConstraintDiagnosis ──< ConstraintAssessment      @@unique([diagnosisId, dimension])
```

Nine dimensions, each rated 1-5. `status` is `draft | active | superseded`; exactly one diagnosis
is `active` per organisation, enforced in the activation action. Activation additionally requires
all nine dimensions rated and a written `commercialImpact`.

Reviews append to `evidence` rather than overwriting it, so the history of what was believed and
when survives.

---

## 5d. Installation milestones

`InstallationMilestone` is a **stored overlay, not a state machine**. Completion is derived from
real workspace records in `src/lib/domain/installation.ts` (see ADR-007). The table holds only
`signedOffAt` (for the one milestone that needs a human decision rather than a record),
`blockedReason`, `note` and `targetDate`, keyed `@@unique([orgId, key])`.

---

## 5e. Proof capture

`ProofPeriod`, keyed `@@unique([orgId, kind, periodStart])`, `kind` = `baseline | month`.

Every stored figure is prefixed `reported` because every stored figure is client-reported. The
baseline describes the operation before the engagement, which the platform never observed. For
engagement months the observable figures — pieces published, cycle time, approval time, qualified
inquiries, calls booked, attributable value — are **recomputed from workspace records at read
time** and are deliberately not stored, so they cannot drift and cannot be edited.

`lockedAt` freezes a period once it has been shown to a client.

---

## 5f. Client visibility

One system, two experiences, one database. The client surface is a **filter over the same tenant**,
not a second application — so the invariant to protect is that the filter is enforced on the
server, in the repositories, rather than by which links are rendered.

Visibility is **derived** from state that already exists wherever that state answers the question:

| Entity | Client-visible when | Derived from |
|---|---|---|
| `IntelligenceRun` | `status = published` | Existing status |
| `ConstraintDiagnosis` | `status = active` | Existing status |
| `WeeklyReport` | `status = final` | Existing status |
| `Task` | `audience = client` | Existing audience |
| `ProofPeriod` | Always, locked or not | Nothing to hide |
| `ContentItem` | Always | It is their content |

Two columns were added, only where nothing existing could answer:

- **`Pattern.visibility`** (`internal | client_published`, default internal). Whether a signal is
  part of the client's approved strategy is an editorial decision no status encodes. Default
  internal, because silence is the safe direction.
- **`Comment.internal`** (default false). Operators need somewhere private to write; without it,
  the only place to put a note about an editor overrunning was a field the client could read.

Raw research needs no column: clients have no research browser at all, and reach the items that
mattered through the brief that cites them.

The filters live in `clientScope` in `src/lib/domain/visibility.ts` and are asserted against a real
database in `src/lib/auth/visibility.test.ts`.

---

## 5g. Recording readiness

```
RecordingReadiness ──< ReadinessCheck        @@unique([readinessId, key])
```

One record per organisation. `status` is `not_assessed | ready | ready_with_limitation | blocked`,
set by an operator from the seven checks; the suggestion is computed but the call is a person's.
`clientAction` is the single thing the client must do, and the domain refuses a blocked or limited
assessment without one.

Setup photos and test clips reuse `Asset` with two new categories (`setup_photo`, `test_clip`)
rather than a new model.

---

## 5h. Long-form and access method

Neither needed a new model.

- **Long-form entitlement** reuses `Organization.modulesEnabled`, a JSON string array that already
  existed. A client has long-form when it contains `long_form`, and nowhere else implies it.
- **Packaging** gained `workingTitle`, `thumbnailRef`, `approvedAt` and `approvedById` on
  `PlatformPackage`. Orientation is derived from format, never stored — there is no case where a
  long-form piece is shot vertically, and a stored orientation could disagree with the format.
- **`Integration.accessMethod`** (`manual | native_delegated | api`) is deliberately separate from
  `status`. Status answers *is the setup finished*; access method answers *what actually happens
  when something is published*. Collapsing them is how a product implies connectivity it lacks.

---

## 5i. Threadline's own commercial operations

Seven models with **no `orgId`**, following `Application` and `InternalMetric`. They hold
Threadline's own market validation, pipeline and acquisition target — not tenant data, never
readable from a client workspace, and guarded by `acquisition.view` / `acquisition.manage`, which
no client role holds. See ADR-011.

```
MarketWedge ──< ValidationConversation
     │  └──< SopCheck                       @@unique([wedgeId, state, key])
     └──< Prospect ──< SopCheck             @@unique([prospectId, state, key])
                └──< SalesCall

AcquisitionTarget      (one active at a time)
FunnelReview           @@unique([weekStart])
```

| Model | Holds |
|---|---|
| `MarketWedge` | One candidate market and the expensive problem claimed for it |
| `ValidationConversation` | One research conversation, with `volunteered` recorded separately |
| `Prospect` | A prospect moving through the state map, with the funnel timestamps |
| `SopCheck` | One checklist item on one state — shared by prospects and wedges |
| `SalesCall` | Preparation, the state map, and exactly one outcome |
| `AcquisitionTarget` | Target wins, period, and the planning assumptions |
| `FunnelReview` | The weekly control loop, with counts frozen at review time |

**What is not here.** No contact, no company record, no email or activity history, no deal object.
An external CRM owns those. Threadline stores `crmProvider`, `crmRecordId` and `crmRecordUrl` on a
prospect — a link, with no synchronisation. Duplicating a CRM here would mean maintaining a worse
one, and the proprietary part is the state machine, not the address book.

**The funnel is counted, not stored.** `Prospect.firstTouchAt`, `repliedAt` and `positiveReplyAt`,
plus `SalesCall.attended` / `qualified` / `offerMade` / `outcome`, are the only inputs. Every rate
is derived at read time. See ADR-012.

**`SopCheck` carries both foreign keys, one of which is always null.** A prospect check and a
wedge check are the same idea — a tick, plus what was found — and separate tables would duplicate
the shape and the rules. The two unique constraints tolerate the nulls because SQLite and
PostgreSQL both treat NULLs as distinct in a unique index.

**The invariant lives in the domain layer.** No active record may exist without a next action and
a due date, enforced by `assertActiveRecord` on every write rather than by a database constraint:
"active" is a property of the state, not of the row, and a conditional NOT NULL would need a
trigger maintained in two SQL dialects. `invariantBreaches()` reports any record that got past it
— because "the code prevents it" and "it is not happening" are different claims, and only one is
checkable.

---

## 5j. Attribution on a commercial signal

Three columns on `Inquiry`:

| Column | Default | Answers |
|---|---|---|
| `attribution` | `qualitative_only` | How strongly this is actually connected to the content |
| `evidenceBasis` | `client_reported` | Whether Threadline observed it or was told |
| `evidenceSource` | null | Where it came from — a tracked link, a booking answer, a buyer's words |

The classes are `directly_tracked`, `buyer_named`, `multi_touch`, `associated` and
`qualitative_only`, ranked by `ATTRIBUTION_STRENGTH`.

The defaults are the weakest honest answer rather than the flattering one. Linking an inquiry to a
piece of content is a claim about causality, and organic content does not have paid-advertising
certainty; an unclassified signal is therefore a correlation somebody reported until evidence says
otherwise. The class renders beside the content link everywhere the link appears, so no screen can
quietly upgrade a correlation into a cause.

The operator cockpit reads these to decide whether a client's measurement can support any claim at
all: `resultsAlerts()` flags a client publishing without a Day-0 baseline, live assets with no
recorded URL, and a period whose signals are all correlation — the last of which means monetary
efficiency metrics should stay hidden for that client.

---

## 5k. Attribution

Four models reconstruct the chain from content to commercial outcome:

```
TrackedLink ──< Touchpoint >── Visitor ──< CommercialEvent
                    │                          │
              ContentItem                  Inquiry
```

| Model | Holds |
|---|---|
| `TrackedLink` | A Threadline-owned redirect: slug, validated destination, the asset it carries |
| `Visitor` | An anonymous browser, as a first-party token. Unique **per organisation** |
| `Touchpoint` | One recorded contact: a click, a form, or something somebody reported |
| `CommercialEvent` | A dated commercial fact, with its provenance and its evidence class |

Plus `Inquiry.visitorId`, which joins a person to the anonymous journey they arrived through.

**The redirect is the point.** `/t/<slug>` records the click and forwards. That is what lets
Threadline measure content it did not publish: the client posts manually, the caption carries a
Threadline URL, and the touchpoint is still ours. Social API approval is therefore not a launch
blocker — see §11 of HANDOFF.

**Security.** The destination is never taken from the request; it comes from the stored row, which
was validated on write (`src/lib/domain/tracked-link.ts`). Schemes are limited to http and https,
credentials in the URL are refused, and a destination pointing back at Threadline's own sign-in,
API, admin or `/t/` routes is refused — that shape is a credential-harvesting hop wearing the
company's own domain. Slugs are random rather than sequential, because sequential slugs would let
anyone enumerate every client's destinations.

**Identity.** A random opaque token in a first-party cookie. It records that clicks came from the
same browser and claims nothing further. `@@unique([orgId, token])` rather than a global unique,
so one browser reading two clients' content produces two independent rows.

**Only the referring host is stored.** A full referring URL can carry personal data in its query
string; the host answers the only useful question.

---

## 5l. Delivery Load and the synthetic marker

Both reuse existing models rather than adding new ones.

**Delivery Load** is five columns on `Task`: `activeMinutes`, `waitingMinutes`, `costMinor`,
`workClass`, `loadNote`. Active and waiting are separate because they have different fixes —
active time falls with better tooling or delegation, waiting time falls by changing what the client
is asked for and when. Adding them together hides which problem you have. `workClass` is filled in
afterwards, from how the work actually went, so the delegation trigger comes from measured work
rather than a revenue milestone somebody picked.

**The synthetic marker** is one boolean on `Organization`. See ADR-016 for why it is a column and
not a naming convention, and why it stays `kind: "client"`.

---

## 5m. The research corpus and the Judge

Four models, none tenant-scoped — market evidence is not client data, and one
corpus serves every client in the same wedge, which is the economic argument for
building it at all.

| Model | Holds |
|---|---|
| `ResearchExample` | One real piece of market content, captured by hand, with metrics at capture |
| `ExampleAnalysis` | What an LLM extracted: hook, thesis, promise, proof, structure, CTA, why it worked |
| `JudgeVerdict` | One evaluation pass — subject is polymorphic across idea, script and example |
| `JudgeCalibration` | A frozen record of how well the Judge tracked reality on a given day |

**Outlier bands are computed, not stored** (ADR-017), and so is the rung of the
baseline ladder they were computed from (ADR-019). `format`, `buyerRelevance`
and `commercialIntent` are stored on the example because they are inputs a
person supplies, not conclusions the code draws.

**`ResearchExample.url` is unique.** Counting the same piece twice inflates the
corpus and distorts the creator baseline it contributes to.

**`illustrative`** marks the placeholder rows shipped with the seed. Never a real
creator and never real metrics, and excluded from calibration — a rubric checked
against invented outcomes would be worse than one never checked at all.

**`JudgeVerdict.subjectType` is polymorphic by design.** The same rubric scores a
candidate idea for a client and a corpus example with a known outcome, and that
is exactly what makes the second usable to check the first.

**`JudgeVerdict.calibrated` is stored rather than derived** (ADR-018).

**`JudgeCalibration.payload` is frozen**, for the same reason `WeeklyReport.payload`
is: a run records what was concluded on the evidence available that day, which is
the only way to tell whether a later rubric change helped.

---

## 5n. Service-period cadence

`Organization.periodFee` is the fee for **one four-week service period** — not a
monthly fee. Four-week cycles bill thirteen times a year, so summing period fees
and calling the result MRR is wrong by about 8%. `ProofPeriod.kind` is
`baseline | period` for the same reason: a comparison period that drifted with
the calendar would compare four weeks of work against five.

Constants and conversions live in `src/lib/domain/service-period.ts`. Anything
genuinely tied to the calendar — `InternalMetric`, which is reconciled monthly —
stays monthly and does not use them.

---

## 6. Idea engine

`Idea` carries the four component scores plus a derived priority:

```
priorityScore = 0.30*relevance + 0.25*novelty + 0.25*proofStrength + 0.20*formatFit
                + commercialIntent bonus (high +8, medium +3, low 0)
```

Status machine: `backlog -> shortlisted -> approved -> scripted`, with `rejected` and `archived`
reachable from any non-terminal state. Legal transitions are declared in
`src/lib/domain/workflow.ts` and enforced server-side — an illegal transition throws.

`IdeaEvidence` links an idea to the research items that justified it. `Idea.patternId` links it
to the signal it came from. Both are how the lineage view answers "why does this idea exist?".

---

## 7. Script engine

```
Idea ──< Script ──< ScriptVersion
```

`Script` holds identity and QA state; `ScriptVersion` holds content and is **append-only**.
Every generation, refinement and manual edit writes a new version with a `changeSummary`, so
version history is complete and revertible.

`ScriptVersion.claims` is a JSON array of `{ id, text, status, note }` where status is
`unverified` | `verified` | `removed`. **A script cannot enter `ready_to_record` or `approved`
while any claim is `unverified`** — enforced in `src/lib/domain/workflow.ts` and re-checked in the
server action. This is the mechanism behind the "never present unverified factual claims as safe"
rule.

QA states: `ai_draft -> needs_fact_check -> ready_to_record -> approved`.

---

## 8. Production, packaging, distribution

```
Script ──< ContentItem ──< Asset
                       ├──< ContentEvent      (full timeline / audit)
                       ├──< PlatformPackage ──< PublishRecord
                       └──< PublishRecord ──< PerformanceSnapshot
```

`ContentItem` is the spine of the operating loop. Stage machine:

```
raw -> editing -> in_review -> {changes_requested -> editing | approved}
approved -> scheduled -> live
```

`changes_requested` increments `revisionCount` and requires a `revision_request` comment — the
product refuses an unstructured rejection.

`ContentEvent` records every transition with actor, timestamps and note. It is the source for the
asset history and the operating metrics (cycle time = `createdAt -> liveAt`; approval turnaround =
`in_review -> approved`).

`PlatformPackage` is unique per `(contentItemId, platform)` — packaging is deliberately per
platform, never one shared caption.

`PublishRecord` is per piece per platform: `draft -> ready -> scheduled -> published`, plus
`failed`. `method` distinguishes `manual` from `integration`; v1 is manual for every provider and
the UI says so.

---

## 9. Performance and pipeline

`PerformanceSnapshot` is a time series per `PublishRecord`, not a single mutable row, so trends
and "views since publish" are real queries. `source` records whether a row was entered by a human,
imported by an adapter or seeded.

`Inquiry` is the lightweight commercial layer: `inquiry -> qualified -> call_booked -> won|lost`,
optionally linked to the `ContentItem` and `PublishRecord` that produced it plus the CTA used.
It exists to answer one question — *what content creates qualified conversations?* — and is
deliberately not a CRM.

---

## 10. Reporting and operating metrics

`WeeklyReport` stores a computed `payload` (JSON, schema in `src/lib/domain/report.ts`) so a
report is a **snapshot of what was true that week**, not a re-query that silently changes after
the fact. `narrative` optionally holds an AI-written executive summary; the numbers are always
computed deterministically from stored data, never generated.

`OperatingMetric` is one row per org per week: founder hours, hours saved, cycle time, approval
turnaround, pieces shipped, contractor cost.

---

## 11. Lineage

The strategically important query. Given a `PublishRecord`, the chain is:

```
PublishRecord
  -> ContentItem            (who approved it, when, revision count, full event timeline)
    -> Script -> ScriptVersion   (which hook was selected, which claims were verified)
      -> Idea                    (scores, rationale, status history)
        -> IdeaEvidence -> ResearchItem   (the research that justified it)
        -> Pattern -> PatternEvidence     (the signal that caused it)
  -> PerformanceSnapshot[]  (how it performed over time)
  -> Inquiry[]              (what commercial signal it produced)
```

Implemented as a single resolved read in `src/lib/data/lineage.ts` and rendered by the
`ContentLineage` component on every content detail page. This is the organisational memory the
product is selling.

---

## 12. Internal / operational tables

| Model | Purpose |
|---|---|
| `Integration` | Per-org provider configuration and honest status. Stores **non-secret config only** |
| `SocialAccount` | Publishing destinations, mapped to an integration when one exists |
| `SupportIssue` | Internal issue log with `becomesSop` / `becomesFix` flags |
| `SopDocument` | Editable internal SOPs; `orgId = null` means a global Threadline SOP |
| `OnboardingSession` | Per-org onboarding progress and autosaved answers |
| `Application` | Public marketing-site applications. **No `orgId` by design** |
| `AiGeneration` | Accountability record for every AI call |
| `InternalMetric` | Threadline's own business metrics, admin portal only |
| `IntelligenceRun` | One market intelligence cycle; `brief` is a frozen payload |
| `RunSource` | A declared input to a run, with an honest collection status |
| `CandidateSignal` | A proposal awaiting a human decision. Not yet a signal |
| `CandidateEvidence` | Join making the cite-your-evidence rule structural |
| `ConstraintDiagnosis` | What is actually limiting demand, and what it costs |
| `ConstraintAssessment` | One of nine rated dimensions of a diagnosis |
| `InstallationMilestone` | Stored overlay only: sign-off, blocker, note, target date |
| `ProofPeriod` | Client-reported figures for a baseline or an engagement month |
| `RecordingReadiness` | Whether a client can produce publishable footage, repeatably |
| `MarketWedge` | One candidate market and the expensive problem claimed for it |
| `ValidationConversation` | One research conversation, with what they said in their words |
| `Prospect` | A prospect in Threadline’s own pipeline, with the funnel timestamps |
| `SopCheck` | One checklist item on one state of a prospect or a wedge |
| `SalesCall` | Preparation, the state map, and exactly one outcome |
| `AcquisitionTarget` | Target wins, period, and the planning assumptions |
| `FunnelReview` | The weekly control loop, counts frozen at review time |
| `TrackedLink` | A Threadline-owned redirect that records the click and forwards |
| `Visitor` | An anonymous browser, as a first-party token |
| `Touchpoint` | One recorded contact between a person and a piece of content |
| `CommercialEvent` | A dated commercial fact, with provenance and evidence class |
| `ResearchExample` | One real piece of market content, captured by hand |
| `ExampleAnalysis` | Extracted variables from one example |
| `JudgeVerdict` | One adversarial evaluation pass |
| `JudgeCalibration` | A frozen record of the Judge checked against reality |
| `ReadinessCheck` | One of seven dimensions of a recording setup |

---

## 13. Indexing

Indexes are placed on the access patterns the app actually uses: `(orgId, status)` for every board
and queue, `(orgId, dueDate)` for date-driven views, `(orgId, capturedAt)` for time series,
`(contentItemId, createdAt)` for timelines, and unique constraints that encode business rules
(`(contentItemId, platform)`, `(scriptId, version)`, `(orgId, weekStart)`, `(userId, orgId)`,
`(orgId, dedupeKey)`, `(diagnosisId, dimension)`, `(orgId, key)` for milestones and
`(orgId, kind, periodStart)` for proof periods).

A note on `@@unique([orgId, dedupeKey])`: `dedupeKey` is nullable, and both SQLite and PostgreSQL
treat NULLs as distinct in a unique index, so hand-captured research items — which have no
fingerprint — never collide with each other.

## Completion pass additions (migration `20260908234429_completion_pass_email_jobs_scripts_permissions_economics`)

New models:

| Model | Purpose | Notes |
|---|---|---|
| `AuthToken` | Single-use invite / password-reset tokens | `tokenHash` (SHA-256) unique; `usedAt` consumed atomically; TTL 72h invite / 30m reset |
| `EmailMessage` | Every rendered email with provider and status | `captured` when no provider is configured |
| `Job` | Durable background job | `idempotencyKey` unique; `lockedAt/lockedBy` lease; `attempts/maxAttempts`; `dead` state |
| `SalesScript` | Canonical wording, versioned | `(key, version)` unique; `checksum` of `exactText`; `status` draft/approved/retired; `provenance` |
| `SalesCallScriptSnapshot` | Exact block frozen against a call | `script` relation is `Restrict` — a used script cannot be deleted |
| `ProofPermission` | Willingness + eight separate proof permissions per client | one per org; `successConfirmedAt` gates any testimonial ask |
| `WebhookEvent` | Inbound CRM/payment deliveries | `(provider, externalId)` unique; `verified`; `processedAt` |

Extended models:

| Model | Fields |
|---|---|
| `Application` | `role`, `typicalDealValue`, `acquisitionToday`, `capacityNote`, `prospectId` |
| `Prospect` | discovery economics: `econCurrency`, `typicalDealValueMinor`, `grossProfitMinor`, `grossMarginPct`, `ltvMinor`, `qualifiedOppValueMinor`, `cycleLengthDays`, `closeRatePct`, `capacityNote`, `acquisitionCostMinor`, `acquisitionNote`, `urgency`, `economicConsequence`, `economicsUpdatedAt` (all nullable — unknown is an answer) |
| `PerformanceSnapshot` | `providerRecordId`, `fetchedAt`, `provenance` (JSON field states), `unavailable` (JSON keys); unique `(publishRecordId, source, providerRecordId, capturedAt)` |
| `CommercialEvent` | rev-share-ready: `cashCollectedMinor`, `attributableRevenueMinor`, `attributionEligibility`, `attributionStatus`, `attributablePercentage`, `exclusionReason`, `collectedAt`, `externalDealId`, `externalPaymentId`, status history |
| `Idea` | `intendedJob` (discovery/authority/conversion), `requestId` (unique per org — idempotent create) |
| `ContentItem` | `intendedJob` |
| `PublishRecord` | `distributionMode` (organic/paid_amplified), `externalId`, `providerStatus`, `providerPayload` |
| `Asset` | `storageProvider` (local/s3) |

Platforms now include `threads`. Text-led work (`text_post`, `carousel`, or platforms x/threads/newsletter) enters production at `editing`, never `raw`.
