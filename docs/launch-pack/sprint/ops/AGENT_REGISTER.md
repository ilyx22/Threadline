# Agent register (27 September 2026)

**What this is.** Every AI or automated operator in Threadline OS, with its purpose, inputs, outputs, human checkpoint, current autonomy level, failure states, where it is logged, and what would earn promotion. This closes the TODO's "manual-first agent register" (transcript controls) and the internal agent promotion ladder items AG1 and AG2 (TODO_AUDIT TC10). It extends `docs/launch-pack/research/AGENT_WORKFLOWS.md`, which covers inputs, outputs and failures but not autonomy, cost, fallback or promotion.

**Source:** code on `main` @ a6c0ad5:
- `src/lib/ai/*`: generators, `runGeneration` / `runStructured`, cost, untrusted-text defences
- `src/lib/research/*`: the miner, providers, schedules and Apify
- `src/lib/leads/index.ts`
- `src/lib/learning/*`
- `src/lib/domain/judge.ts` and `src/lib/domain/content-diagnosis.ts`
- `src/lib/actions/{ideas,scripts,content,runs,performance,reports,learning,corpus,onboarding}.ts`
- `src/lib/reports/period-review.ts`
- `src/lib/jobs/handlers.ts`

## Autonomy ladder (from the master TODO)

The TODO's promotion path is: manual proof → sandbox → supervised live → production, with a reversible switch and an audit trail.

| Level | Name | Meaning in this app |
| --- | --- | --- |
| **L0** | Manual | A person does the work; software only records it |
| **L1** | Sandbox / advisory | The operator produces output that a person must review before it has any effect. It runs on demo, internal or public data, or its scores are advisory |
| **L2** | Supervised live | Runs on real client data. Every output passes a named human gate before it reaches a client, a platform or a prospect |
| **L3** | Production | Acts on its own, within bounds, with a reversible switch and an audit trail |

**Current state.**
- No AI operator is above L2.
- No AI output reaches a client, a platform or a prospect without a person (DEL-04, AI-06, AI-09; TODO_AUDIT AG5).
- **In production, nothing is running at all.** There is no database and no `ANTHROPIC_API_KEY`, so every generator runs the labelled demo provider (`isDemo: true`).
- The only L3 automation is deterministic (non-AI) scheduling in the daily tick. Its outputs are drafts or reminders, apart from publishing an already approved piece.

## Shared mechanics (all AI operators)

| Concern | Behaviour | Where |
| --- | --- | --- |
| Provider | Anthropic if `ANTHROPIC_API_KEY` is set. Otherwise a deterministic demo provider, with every result flagged `isDemo` and labelled in the UI | `ai/index.ts` `getProvider`, `isLiveAi` |
| Log | One `AiGeneration` row per attempt outcome: `kind`, `promptKey`, provider, model, status (ok / error), latency, input and output tokens, `costMicroUsd`, `isDemo`, `brainVersion`, `entityType` / `entityId`, error text | `ai/index.ts` `recordGeneration` |
| Cost | Computed from `AI_PRICE_INPUT_PER_MTOK` / `AI_PRICE_OUTPUT_PER_MTOK`. Stays **null (unknown) when prices aren't configured**; demo runs cost 0 | `ai/cost.ts` |
| Budget | Per-workspace monthly ceiling `Organization.aiBudgetMicroUsd`. Generation is refused once it is spent. Admin-level runs (`orgId: null`) aren't budgeted | `ai/index.ts` |
| Retries | One retry on a retryable error. One retry on a wrong JSON shape (`runStructured`). Cancel and timeout (120 s by default) are final and never retried | `ai/index.ts` |
| Untrusted text | Third-party text is neutralised and fenced as data, and injection-like lines are withheld. There is no tool use and no autonomous action | `ai/untrusted.ts`, `research/providers.ts` `quarantine` (AI-09) |
| Stale context | Each draft records the Brand Brain version it used. Drafts from older versions are listed for a check | `ai/brain-versions.ts` `staleDrafts` (ENG-04) |
| Lessons | Human-activated lessons go into the generation context. Retiring a lesson rolls it back | `learning/lessons.ts` (LRN-02) |

---

## A. AI operators (model calls)

| # | Operator | `AiGeneration.kind` | Entry point | Purpose | Inputs | Outputs | Human checkpoint | Level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | **Source / transcript miner** | `mine` | `research/miner.ts` `mineSource` / `mineAsset`; the "Mine it" action; job `mine.asset` (runs automatically on stored transcripts) | Turn transcripts, calls, notes and documents into evidence | Stored text, neutralised copy | `ResearchItem` rows (question, objection, expertise, story, proof, claim, idea seed), each an **exact quote** with character offsets and provenance | Items are evidence only. A person turns them into ideas. Nothing is approved by mining | L2 (auto-triggered, human-used) |
| A2 | **Signal extractor** | `signals` | `actions/runs.ts` `extractSignals` | Pull candidate market signals out of a research run | Run evidence (`ResearchItem`) | `CandidateSignal` rows; the unsupported ones are dropped and counted | Operator accepts or rejects each signal. Nothing changes strategy until a person decides | L2 |
| A3 | **Intelligence brief writer** | `brief` | `actions/runs.ts` `generateBriefSummary` | Summarise a run into a brief | Accepted signals and evidence | Brief summary text | Threadline reviews it before a client sees it | L2 |
| A4 | **Idea generator** | `ideas` | `actions/ideas.ts`, `actions/onboarding.ts` (first ideas at onboarding) | Propose content ideas | Brand Brain context, evidence, lessons, performance context, operator steer | `Idea` rows (`source: ai`) with PESTO, funnel role, scores and rationale | The operator shortlists, approves or rejects. Idea status starts at `backlog` | L2 |
| A5 | **Script generator** | `script` | `actions/scripts.ts` (generate and regenerate) | Draft a script in the founder's or a named expert's voice | Idea, Brand Brain version, expert `voiceNotes` (TEAM-08), proof (uncleared items flagged) | Script draft | 1. The operator edits. 2. Internal QA. 3. The client approves the exact version (hash-bound, DEL-02/03) | L2 |
| A6 | **Hook generator** | `hooks` | `actions/scripts.ts` `generateHooksAction` | Alternative hooks | Script and context | Hook options | The operator picks one; it then goes through script approval | L2 |
| A7 | **Script refiner** | `refine` | `generators.ts` `refineScriptContent` | Tighten, shorten or restyle on instruction | Script and instruction | Revised script (a new version) | Same as A5. An edit supersedes any approval | L2 |
| A8 | **Packaging generator** | `packaging` | `actions/content.ts` `generatePackagingAction` | Titles, captions, thumbnails text, CTA per platform | Approved script, context | Package drafts | DEL-05 automatic check: a figure not in the script, an unverified figure or promise language **cannot be approved**. Then client approval | L2 |
| A9 | **Pattern detector** | `patterns` | `actions/performance.ts` `detectPatterns` | Find recurring performance patterns | Metric snapshots, published pieces | `Pattern` rows with evidence | Operator review. Patterns are advisory | L1 |
| A10 | **Weekly report narrative** | `report` | `actions/reports.ts` `generateWeeklyReportAction` | Draft the weekly report's words | Real records for the week | Draft narrative | **Staff-only finalisation.** Immutable versions; the client sees the latest final only (REP-01) | L2 |
| A11 | **Four-week review drafter** | `review_draft` | `reports/period-review.ts` | Draft the ACTION → RESULTS → PROBLEMS → FUTURE sections | Frozen figures, approved diagnoses, corrections | Text **only into empty sections**; never finalises (AI-07) | Staff finalise | L2 |
| A12 | **Judge, pre-publication expectation** | `expectation` | `actions/learning.ts` | Freeze a forecast before publication | Idea, script or piece text; rubric v0.2 | `ContentExpectation` (scores, confidence, rubric version) | Advisory. Refused after publication. `calibrated: false` on every verdict; **may not block a human decision** | L1 |
| A13 | **Judge, corpus scoring** | `judge` | `actions/corpus.ts` `judgeExampleAction` (admin) | Score corpus examples to calibrate the rubric | `ResearchExample` | `JudgeVerdict` | Admin only. Used for calibration, not for client work | L1 |
| A14 | **Corpus example analyser** | `corpus` | `actions/corpus.ts` (admin) | Extract hook, thesis, format and driver from a public example | Example transcript and notes | `ExampleAnalysis` | Admin review | L1 |
| A15 | **Lead reply drafter** | `lead_reply` | `leads/index.ts` `draftReply` | Suggest a reply to an inbound lead | Lead thread (fenced as untrusted), client and offer context | `ReplyDraft` (`generatedBy: ai`, `isDemo`) | Draft → **a person approves or edits** → **the person sends it on the channel** → marks "I sent it". Threadline never sends a lead reply | L2 |

## B. Deterministic operators (no model; rules, schedules, jobs)

| # | Operator | Entry point | Purpose | Output | Human checkpoint | Level |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | **Scheduled research runs** (trend scout) | `research/schedules.ts` `runDueSchedules`, from the daily tick | Collect workspace records and public pages every 1–90 days | Research items with provenance and fingerprint; unreadable sources get a reason; manual sources are left for a person; one run at a time | Evidence only (A2/A3 gates apply) | L3 (collection only) |
| B2 | **Apify provider** (optional) | `research/apify.ts` | Fallback collection of public posts | Normalised research items | Off unless configured (D-08: deferred) | Off |
| B3 | **Lead intake and routing** (inbox triage) | `leads/index.ts` `ingestLead`, `routeOwner`, `qualifyLead` | Dedupe and merge inbound leads, route an owner, qualify with evidence (location alone is refused) | `Inquiry` and `LeadMessage` | A person qualifies, replies and closes | L3 (intake), L0 (reply) |
| B4 | **Speed-to-lead and follow-up reminders** | `leads/index.ts` `speedToLead`, `remindDueFollowUps` | Measure response time; create a task when a follow-up is due | Pipeline measure; `Task` (one per lead per date) | The owner acts on the task | L3 (reminders only) |
| B5 | **Prospect follow-up queue** (Threadline's own sales) | `sales/follow-ups.ts` `remindProspectFollowUps` (COM-07) | Turn due prospect actions and unread applications into owner tasks | `Task` on `/admin/prospects` | The owner sends by hand. There is no sequencer and no auto-send | L3 (reminders only) |
| B6 | **Content diagnosis rules** | `domain/content-diagnosis.ts` | SCORE → EXPLAIN → DIAGNOSE → PRESCRIBE → RETEST. `insufficient_data` / `mixed` come first; under 14 days is "too early to read" | `ContentDiagnosis` proposal | **The operator approves** the diagnosis and correction before any report shows them | L2 |
| B7 | **Constraint diagnosis** | `domain/diagnosis.ts` | Score the client's demand-system constraint from assessments | `ConstraintDiagnosis`; review every four weeks (28 days; uncommitted change 26 Sept) | Operator-entered and operator-reviewed | L0/L1 |
| B8 | **Held-out evaluation and Judge promotion** | `learning/evaluation.ts` (LRN-03) | Fixed held-out share, leakage refusal, AUC per variant | `JudgeEvaluation`; `JudgePromotion` | **A human promotes and rolls back.** This is the reversible switch the ladder asks for | L1 (the switch exists; nothing promoted) |
| B9 | **Publishing worker** | jobs `publish.run` / `publish.poll`; `queueDuePublishes` | Post an **approved** package at its scheduled time; poll status; resume partial threads | `PublishRecord`; UNCERTAIN when the platform doesn't answer | Approval is re-checked at send (hash). The manual route is always available | L3 for approved items. **Not live**: needs platform app reviews (INT-02/03/06) |
| B10 | **Daily tick drafting** | job `daily.tick` | Draft due invoices and overdue reminders, escalate stale approvals, send digests, expire uploads and exports, refresh tokens, sweep CRM outbox | Drafts, notifications, `Task`s | Invoices and reminders are **drafted** and sent only when a person approves (BIL-01/04) | L3 (drafts and housekeeping) |
| B11 | **CRM mirror** | `CrmOutbox`, job `crm.sync` (COM-04) | Mirror Threadline records to Attio | Attio records; ambiguous matches parked for a person | Manual resolution queue | L3. Not live: `ATTIO_API_KEY` |
| B12 | **Email sender** | job `email.send` | Transactional email with an Idempotency-Key | `EmailMessage`; suppression on bounce or complaint | Templates are fixed; no AI copy is emailed without approval | L3. Not live: Resend |

---

## Failure states and logging, per operator

| Operator | Failure states | Where logged | Manual fallback |
| --- | --- | --- | --- |
| All AI (A1–A15) | Error after one retry; wrong JSON shape twice; timeout or cancel (final); budget spent (refused); no key (demo output, labelled) | `AiGeneration` (status, error, `isDemo`, cost, tokens, `brainVersion`); the UI shows an error state with a retry | The operator writes the item by hand. Every surface accepts manual input |
| A1 miner | A quote not found in the source is **dropped, not repaired**; injection-like lines are withheld; `injectionFlag` is set; the text is too short to mine | `AiGeneration`; `ResearchItem.sourceMeta` (offsets, permission) | Manual research item entry |
| A2 / B1 research | Refused source with a reason; skipped while another run is open; duplicates counted | `RunSource` (status, `statusNote`, `itemsCollected`); `ResearchSchedule` | Paste material; add a manual source |
| A5–A8 drafting | A stale Brand Brain version; a claims-guard refusal (A8) | `AiGeneration.brainVersion`; stale-drafts list; approval records | The operator writes or edits the script or package |
| A10 / A11 reports | Draft only; a finalised version can't be overwritten (corrections become new versions) | `AiGeneration`; `WeeklyReport` / `PeriodReview` versions | Staff write the sections |
| A12 / A13 Judge | Uncalibrated (always, today); a post-publication expectation is refused | `AiGeneration`; `ContentExpectation`; `JudgeVerdict`; `JudgeCalibration` | Human judgement. The Judge is advisory |
| A15 lead reply | Empty draft refused; sent only from `approved`; a sent draft can't be discarded | `AiGeneration`; `ReplyDraft` (status, `approvedById`, `sentById`, timestamps); `LeadMessage` | The person writes the reply |
| B9 publishing | UNCERTAIN (no answer), partial thread, disconnected account, token refusal (reconnect) | `PublishRecord`; `Job` (dead letters on `/admin/system`) | Manual publish with URL and time (INT-04); CSV metrics (INT-05) |
| B10–B12 jobs | Dead letter after retries; stale lease released | `Job`; `/admin/system` (jobs, CRM backlog, email failures, webhook log); `AuditLog` | Requeue from `/admin/system`; manual send |

---

## TODO operators mapped to what exists

The TODO names five future operators: call/objection miner, trend scout, inbox triage, speed-to-lead and performance summariser. Here is where each stands against the ladder.

| TODO operator | Built as | Manual version (L0) | Level now | Gap to the next level | Cost basis | Promotion evidence required |
| --- | --- | --- | --- | --- | --- | --- |
| **Call / objection miner** | A1 miner (transcripts and library text) | Operator reads the call notes and logs objections | L2 for transcripts. **`SalesCall.voc` and `objections` aren't mined** (TODO_AUDIT TC6) | A job that mines sales-call VOC and objections into ideas; a weekly SOP step | Tokens per transcript (`AiGeneration.costMicroUsd`; null until prices are set) | Over 4 weeks of real calls: at least 80% of kept quotes judged useful by the operator; 0 invented quotes (structurally enforced); fewer than 10% of objections missed against a manual read of 5 calls |
| **Trend scout** | B1 scheduled research, with A2/A3 synthesis | Operator reads sources weekly | L3 collection, L2 synthesis | None for launch. D-08 defers paid providers. The TODO defers "3×/day trend bots" | Public fetch is free; Apify is per-run if approved | Signal acceptance rate ≥ 30% over 8 runs; at least one accepted signal becomes a published idea per four-week period |
| **Inbox triage** | B3 intake, routing and qualification | Owner reads inbound and tags it | L3 intake, L0 decision | Channel DMs stay manual by design (verified provider limitation) | None (deterministic) | Not a promotion candidate: qualification stays human |
| **Speed-to-lead** | B4 measure and reminders; A15 reply drafts | Same-day manual reply from an Attio queue (TODO "use now") | L3 reminders, L2 drafts | The owner sets the same-day SLA (TODO_AUDIT A15) | Tokens per draft | Median reply time within the SLA for 4 weeks; draft edit distance falling; **auto-send is never proposed** (AI-06) |
| **Performance summariser** | A9 patterns, A10 report, A11 review, B6 diagnosis | Operator writes the weekly report and the four-week review | L1 patterns, L2 reports | A corpus and live outcomes to calibrate (R5, R10) | Tokens per report | Staff edit minutes per report falling for 3 periods; 0 figures stated that aren't in the frozen record (checked at finalisation) |

## Promotion rules (apply to every operator)

1. **Evidence before promotion.** Promotion needs held-out examples plus correction logs showing useful separation, and a recorded human decision. For the Judge, that decision is `JudgePromotion`, with rollback.
2. **Never promoted past L2:**
   - anything that approves client work (DEL-04: no auto-approve);
   - anything that sends to a prospect or lead (AI-06; the TODO's "no autonomous outbound");
   - anything that states a claim (DEL-05: AI cannot self-verify).
3. **An uncalibrated Judge never gates a decision** (TODO AG5). It is `calibrated: false` in `domain/judge.ts` today.
4. **Demotion is immediate** on any invented quote, invented figure, cross-tenant leak or prompt-injection success. Retire the lesson or roll back the promotion, and record the reason.
5. **Measure the cost before promoting.** Set `AI_PRICE_INPUT_PER_MTOK` and `AI_PRICE_OUTPUT_PER_MTOK` when the Anthropic key is added. Otherwise `costMicroUsd` stays null and the promotion's cost can't be judged.

## Open items found while compiling

- **Admin-level runs aren't budgeted.** Corpus and judge runs log `orgId: null`, so they fall outside any workspace budget. This is acceptable internally; watch the spend in the Anthropic console (E10: key with a spend limit).
- **Stale schema comment.** The `AiGeneration.kind` comment lists 9 kinds. The code also writes `mine`, `expectation`, `judge`, `corpus`, `lead_reply` and `review_draft`. The field is a free string, so this is a documentation defect only (DEFECT_REGISTER DR-21).
- **Nothing is live-verified.** No AI operator has run against the live model in production. The first live run should be a supervised dogfood on Threadline's own internal workspace (TODO AG3).
