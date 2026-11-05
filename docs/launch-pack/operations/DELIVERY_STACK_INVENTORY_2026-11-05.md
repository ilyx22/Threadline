# Delivery stack inventory: what exists, what's proven, what to test (5 Nov 2026)

Launch sequence V5, task 1.2 (`sprint/ops/LAUNCH_SEQUENCE_V5_2026-11-05.md`). Internal. Read-only inventory: nothing was signed up for, configured, called or sent.

**Sources:**
- Code: `src/lib/**`, `prisma/schema.prisma`, `scripts/qa/*`, `.env.example`.
- Local env files were checked for **names only**. Locally, only DB, storage (R2), email (Resend), encryption and cron are set. Production state comes from E20.
- Docs:
  - `sprint/ops/E20_INTEGRATION_REGISTER_2026-11-03.md` (E20)
  - `operations/TOOL_AUDIT_2026-09-26.md`
  - `research/RESEARCH_PROVIDER_AUDIT.md`, `research/AGENT_WORKFLOWS.md`
  - `strategy/SPEC_2026-10-27_KNOWLEDGE_BASE_AND_AUTO_RESEARCH.md` (SPEC)
  - `strategy/PLAN_2026-11-03_WEEKLY_RESEARCH_RUN.md`
  - `sprint/stack/STACK.md`, `sprint/stack/TIKTOK_API_APPLICATION.md`, `docs/PLATFORM_APPLICATIONS.md`
  - `sprint/ops/TOOLS_AND_SUBSCRIPTIONS_REGISTER_2026-10-21.md` (superseded locally by the V11/V12 Drive register)
  - `sprint/ops/C01_EDITING_COMPARISON_RUN_SHEET_2026-11-03.md` (C01)
  - `sops/C04_EDITING_AND_HANDOFF_SOP_DRAFT_2026-11-04.md`, `sops/candidates-2026-10-16/SUB03_*`
  - Master to-do V4.2, sections B, C, E and R.

**Status words:**
- **built-tested:** code exists and was exercised live, with a date.
- **built-untested:** code plus unit/QA tests against mocks or seeded data. **No real provider has been called.**
- **configured:** an account or setting exists, not proven end to end.
- **proposed-only:** named in a doc, with no account and no code.
- **missing:** needed by the chain, but nothing exists.

**The headline:** the app is a well-tested **workflow and record system**. Every step that touches an outside provider is either off or untested:
- AI drafting: Anthropic is off, so generation runs in labelled demo mode.
- Transcription: no worker exists.
- Scraping: the Apify adapter is off.
- Publishing: 7 connectors exist, with no credentials and no platform approval.
- Platform metrics: only manual entry and CSV import.

Editing has no code by design. **No editing tool has been used yet.**

---

## 1. Research and ideation

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Threadline knowledge base (SOPs, frameworks, pilot patterns; added to every generation as the PLAYBOOK block) | `src/lib/knowledge/index.ts`, `chunk.ts`; model `KnowledgeDoc`; `/admin/knowledge` | **built-tested.** Migration applied in production on 3 Nov; 10 entries loaded from Drive (Founder Content Engine, Birdhouse intelligence, Transcript Audit, SUB02, SUB03 script checks, pilot patterns). The block showed in generation provenance in B10 (demo mode). | Nothing now. Improve it from Client #1 evidence. | Covered by T1 and T9 |
| Brand Brain (client voice, ICP, offer, proof, banned topics) | `BrandBrain`, `BrandBrainVersion`, `IcpProfile`, `ProofItem`; onboarding flow | **built-tested** (B03/B04 live on 27 Oct and 3 Nov, synthetic workspace) | — | — |
| Idea generation | `src/lib/ai/generators.ts` `generateIdeas`, `prompts.ts`, `context.ts`; `Idea`, `IdeaEvidence` | **built-untested** with a real model: demo/mock only (`src/lib/ai/mock.ts`) | B06: Anthropic key | T9 |
| Source miner (exact quotes from transcripts/notes) | `src/lib/research/miner.ts` (+ test) | **built-untested** (needs Anthropic and a transcript) | B06 and B08 | T9 |
| Research runs and schedules (workspace records, pasted material, public URLs) | `src/lib/research/providers.ts`, `schedules.ts`, `collect.ts`; daily tick `src/lib/jobs/handlers.ts`; `IntelligenceRun`, `RunSource`, `ResearchSchedule` | **built-untested.** Unit tests cover schedules and providers. No real client run. Login-walled platforms are refused by design. | — | T10 |
| Public page reader (SSRF-guarded) | `src/lib/integrations/fetch-url.ts` (+ test) | **built-untested** against real sites | — | T10 |
| Weekly niche research, Stage 1 (Claude Code routine on Max, £0) | PLAN_2026-11-03 | **proposed-only.** The plan is approved in principle; the routine is **not created**, and there is no `docs/research/weekly/`. A one-off manual pilot ran on 27 Oct (`RESEARCH_PILOT_2026-10-27_AI_CONSULTANTS_LINKEDIN.md`). | Say "go" (PLAN step 1) | T1, then T10 |
| Auto research engine R3–R8 (generated plan, niche memory, YouTube collection, outlier ranking, transcripts, visual analysis, patterns view) | SPEC Part B | **missing** (spec only) | R1/B06; budget approvals | After T9/T10 |

**Env:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_PRICE_INPUT_PER_MTOK`, `AI_PRICE_OUTPUT_PER_MTOK`. All are **off** in production (E20). The default model id is in `src/lib/ai/anthropic.ts`; confirm it at B06.

## 2. Scripts and hooks ("AI scripter")

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Script, hooks, refine and packaging generators | `generators.ts`: `generateScript`, `generateHooks`, `refineScriptContent`, `generatePackaging`; `Script`, `ScriptVersion`, `PlatformPackage` | **built-untested** with a real model. B10 (3 Nov) ran the script path in **demo mode**. | B06 | T9 |
| Claims and banned-topic gates (unverified claims block "ready to record"; banned topics block approval) | DR-19 fix; delivery QA `src/lib/delivery/qa.ts` (+ test) | **built-tested** (B10 and B05 live, 3 Nov) | — | — |
| AI cost record per generation | `src/lib/ai/cost.ts`; `AiGeneration.costMicroUsd` | **built-untested** (null until `AI_PRICE_*` is set) | Spend cap in the Anthropic console | T9 |
| "AI scripter SOP" | **Not in the repo as one document.** Pieces exist: the SUB02 and SUB03 script checks and the Founder Content Engine (Drive, loaded as KB entries); the in-app SOP templates `script-qa` and `research` in `src/lib/templates/master.ts` | **configured** (as KB text). Never run against a real recording brief. | Point to the canonical Drive SOP if it is a separate file | T1 |
| Scripting on Claude Max (manual, outside the app) | How R9 content and the pilot were made | In use; ad hoc | — | T1 formalises it |

## 3. "Top videos", scraping and outlier analysis

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Research corpus, outlier ladder, Judge and calibration | `src/lib/domain/corpus.ts`, `src/lib/data/corpus.ts`, `judge`; `ResearchExample`, `ExampleAnalysis`, `JudgeVerdict`, `JudgeCalibration`, `JudgeEvaluation`; `/admin/research`, `/admin/research/calibration`; QA `scripts/qa/suite-corpus-judge.ts` | **built-untested** with real data. QA covers persisted rows. Not populated with a real niche. | 100–300 examples (J04); later | After T10 |
| URL → corpus row (oEmbed title/author/text) | `src/lib/integrations/corpus-enrich.ts` (+ test) | **built-untested.** By design, **no view counts**: no platform exposes them without login or API, so the operator types the numbers. | — | T10 |
| Apify adapter (scraper fallback for login-walled pages) | `src/lib/research/apify.ts` (+ test). Env: `RESEARCH_EXTERNAL_PROVIDERS`, `APIFY_TOKEN`, `APIFY_ACTOR_ID`, `APIFY_MAX_ITEMS`, `APIFY_INPUT_TEMPLATE` | **built-untested; OFF** (owner decision O-11) | Apify account and console usage limit; choose an Actor; approve the £10–30 pilot (R5). Cost: Free $5/mo usage; Starter $19/mo. | T10 |
| Bright Data / EnsembleData | J09; STACK.md (Bright Data PAYG $1.50 per 1k records) | **proposed-only** (no adapter; deferred until justified) | — | Only if T10 fails |
| YouTube Data API collection (R3, free quota) | SPEC | **missing** | Google Cloud project | Later |
| Third-party outlier tools (1of10, VidIQ, Sandcastles, etc.) | — | **Not named in any doc.** No tool chosen. The only "top videos" method so far is manual Claude-Max research (pilot on 27 Oct: LinkedIn blocked about half the profile fetches; YouTube views came from third-party scrapes). | Decide whether to trial one | T1 (optional add-on) |

## 4. Directed recording (Recording Room and teleprompter)

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Recording Room: ready list, teleprompter (keyboard, scroll, next/previous), full screen, print | `src/app/app/[org]/production/recording/recording-room.tsx`; QA `scripts/qa/recording-room-qa.ts` (headless, seeded data) | **built-tested in QA only.** Never used in a real recording session. | 1 h for the C01 recording | T2 |
| In-browser capture | — | **missing by design** (no MediaRecorder). The founder records on their own device and uploads. | — | — |
| Recording readiness (setup photo, test clip, sign-off) | `RecordingReadiness`, `ReadinessCheck`; `onboarding/RECORDING_GUIDE.md`, `DAY7_REHEARSAL_AND_RECORDING_READINESS.md` | **built-untested** (C12 run sheet ready) | ~2 h rehearsal (C08/C12) | T2 |
| Upload to private storage (512 MB limit) | `src/lib/storage/*` (R2, direct upload); env `STORAGE_PROVIDER`, `S3_*` | **built-tested** (B09 on 3 Nov: byte-identical read, tenant 404, signed-out 401; 15.3 MB earlier). **No 25–30 min source file tested yet.** | — | T2 |
| Riverside (remote recording, teleprompter) | STACK.md: Free 2 h one-off, 720p; Pro $24–29/mo | **proposed-only** ("after the editing comparison") | Only if remote clients need it | — |

## 5. Transcription and processing

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Processing contract (signed webhook out and callback in; transcode, transcribe, thumbnail, scan) | `src/lib/processing/index.ts`, `src/app/api/processing/`; `ProcessingTask`; env `PROCESSING_PROVIDER`, `PROCESSING_ENDPOINT`, `PROCESSING_WEBHOOK_SECRET`, `PROCESSING_SCAN` | **built-untested.** Tasks wait as `queued`. | — | — |
| **Transcription worker** | none, anywhere (no AssemblyAI or Deepgram code) | **missing.** The app expects an external worker, and nobody has built one. | B08: choose a provider; approve building a small worker | T4 |
| AssemblyAI (candidate) | STACK.md: Universal-2 $0.15/h, diarisation +$0.02/h, $50 free credit | **proposed-only** (E20: OFF) | Account (free credit) | T4 |
| Deepgram (fallback) | STACK.md | **proposed-only** | — | — |
| Upload malware scanning | `PROCESSING_SCAN` | **OFF** (DR-11) | Choose a worker | — |
| Interim route | Transcript exported from the editing tool (Descript/OpusClip) and pasted, or written by hand | Manual | — | T2/T4 |

## 6. Editing

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| OpusClip (R1 AI-only; R2 selection) | C01 run sheet. Reported: free about 60 min/mo, watermark, 3-day expiry; Starter $15/mo, Pro $29/mo | **proposed-only** (no account) | Free account | **T2 (C01)** |
| Descript (R3 text-based manual; R2 selection) | C01. Free about 60 min/mo, 720p, watermark; Hobbyist about $16–24/mo, Creator from $24 | **proposed-only** | Free account | T2 |
| CapCut desktop (R2 finish; R3 alternative) | C01. Pricing **unverified** (the page returned 404 in STACK) | **proposed-only** | Free account | T2 |
| Freelancer (R4, 2-clip paid test) | C01 R4; C11 | **proposed-only** | Approval and a quote | T2 (optional) |
| Submagic, Veed, Gling, Captions | — | **Not named in any doc** | — | Add to T2 only if the owner wants a fourth route |
| Editing standard and handoff | SUB03 V2 (15 checks); C04 SOP draft (12 criteria; every tool step "TO FILL after C01/C02") | **Draft**, waiting on C01/C02 | — | T2 fills it |
| Derivative/version tracking | `ContentRoot`, `ContentItem`, `Asset`; Library | **built-tested** for upload; derivative flow not run with real clips | — | T5 |

## 7. Client approval

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Approve an exact version; request changes; bulk approval skips changed versions; approval re-checked at publish | `src/lib/delivery/approvals.ts` (+ test); `Approval`, `ReviewBatch`; QA spine and approvals journeys | **built-tested** for ideas and scripts (B10, 3 Nov). The reject → revise → approve loop on a **video derivative** has not been run (B10 is `[~]`). | — | T5 |
| Approval notifications | B13 fix 3 Nov (scripts now notify approvers) | **built-tested** in part; signed bounce/complaint still open | — | T5 |

## 8. Publishing (autoposting)

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Scheduled publish job (approval gate, idempotent, UNCERTAIN never auto-retried, production only) | `src/lib/publishing/index.ts` (+ test); `PublishRecord`, `SocialAccount`, `Credential`; OAuth `src/lib/integrations/oauth.ts` | **built-untested** live | Platform apps (below) | T11 |
| LinkedIn connector (Posts API; `w_member_social`, analytics `r_member_postAnalytics`) | `connectors/linkedin.ts`; env `LINKEDIN_CLIENT_ID`/`_SECRET`, `LINKEDIN_API_VERSION` (default 202606; re-verify) | **built-untested** (mocked tests in `connectors.test.ts`) | LinkedIn developer app. "Share on LinkedIn" is self-serve and is the quickest real API test. | T11 |
| YouTube connector | `connectors/youtube.ts`; `YOUTUBE_CLIENT_ID`/`_SECRET` | **built-untested** | Google Cloud project, OAuth verification, audit | J08 |
| Instagram and Facebook connectors (Meta) | `connectors/meta.ts`, `facebook.ts`; `INSTAGRAM_*`, `FACEBOOK_*` | **built-untested** | Meta business verification and App Review | J08 |
| TikTok connector (privacy choice, SELF_ONLY detection) | `connectors/tiktok.ts`; `TIKTOK_CLIENT_ID`/`_SECRET`, `TIKTOK_APP_AUDITED` | **built-untested** (tested: posts SELF_ONLY until audited) | Developer app, sandbox, review, audit (3–7 weeks) | J08 |
| X and Threads connectors | `connectors/x.ts`, `threads.ts`; `X_*`, `THREADS_*` | **built-untested**; not in the client scope (D02) | — | — |
| Manual route (publish natively, paste the live URL) | Distribution `src/app/app/[org]/distribution/`; registry `manualFallback` | **The supported route for client #1** (E20). B11 is not yet tested end to end. | — | **T6** |
| Scheduler bridge: Metricool / Postiz / Buffer | E15; STACK.md (Metricool Free: 1 brand, 20 posts/mo; Starter €16–29, "limited" LinkedIn. Buffer Free: 3 channels; $5 per channel/mo. Postiz raised by the owner, cost not recorded) | **proposed-only** ("test one, not all") | Pick one free tier | T7 |

## 9. Views and reporting

| Component | Where | Status | Needs from owner | Test to run |
|---|---|---|---|---|
| Manual metric entry and snapshots with provenance | `PerformanceSnapshot` (source manual/adapter); Performance module | **built-tested** in part (B12 `[~]`: report generated from records, 3 Nov) | — | T8 |
| CSV metrics import (preview, then commit) | `src/lib/analytics/csv-import.ts` (+ test), `normalise.ts` | **built-untested** with a real platform or scheduler export | — | T8 |
| Automatic ingestion from connectors | `src/lib/analytics/ingest.ts`; `fetchMetrics` per connector | **built-untested** (blocked by platform approval) | J08 | Later |
| Expected vs actual, diagnosis, lessons | `ContentExpectation`, `ContentDiagnosis`, `src/lib/learning/*`; QA `suite-diagnosis.ts` | **built-untested** on real posts (14-day "too early" rule) | Real published posts (R9) | T8 |
| Tracked links | `/t/<slug>`; `TrackedLink` | **built-tested** (E20 LIVE, 3 Nov) | DR-43 cookie basis | T6 |
| Weekly/period reports and email | `WeeklyReport`, `PeriodReview`; Resend | **built-tested** (B12/B13 partial) | — | T8 |

## 10. Platform constraints already documented

- **TikTok:** an unaudited Direct Post app posts **SELF_ONLY (private)**, for at most 5 users per 24 h. Plan for 3–7 weeks from start to audit. The Research API is non-commercial only. Until the audit, TikTok is a manual channel (`TIKTOK_API_APPLICATION.md` §3; `connectors.test.ts`).
- **YouTube:** uploads from unverified API projects are **private until audit**. Quota is 10,000 units/day, plus 100 `videos.insert`/day. OAuth verification for sensitive scopes takes about 3–5 business days; the audit has no official timeline.
- **Instagram, Facebook, Threads:** Meta business verification first, then App Review per permission set. A connected Business/Creator account is required.
- **LinkedIn:**
  - Share (`w_member_social`) is self-serve: 150 requests per member per day.
  - Member post analytics (Community Management API) is for registered legal organisations only and takes about 4–8 weeks at best, 3–4 months typically. A rejection means creating a new app.
  - **Video views and impressions are not available to a non-partner app**, so the connector reports `views` as unsupported (`linkedin.ts`).
  - No LinkedIn automation tools of any kind.
- **No platform returns view counts unauthenticated.** Corpus numbers are typed by the operator, never estimated (`corpus-enrich.ts`).
- **X:** pay per use ($0.015 per post; $0.20 per post containing a URL). Out of the client scope.
- **Doctrine:** official OAuth only. No shared passwords, browser automation or rented accounts. Public content only for research, and others' content is always labelled.

---

## Proposed test order

Cheapest and most decision-relevant first. T1–T3 settle Gate 1 (can we decide what to say, and can it be edited well at a known cost?). Nothing below needs a paid plan before T7.

| # | Test (task) | Cost / owner time | What "pass" means |
|---|---|---|---|
| **T1** | **Ideation and scripting dry run (1.3).** Claude Max uses the KB entries, pilot patterns and SUB02/SUB03 script checks to produce a 12-angle brief for the owner's own recording (hook, point, proof source and claim boundary for each angle). Optionally, one free trial of an outlier tool alongside. | £0 · 20 min owner review | The owner would record **at least 8 of 12** angles as written or lightly edited. Every fact traces to a named source. No banned topic or unverifiable claim. The "AI scripter SOP" steps are written down from what actually happened. |
| **T2** | **C01 recording and editing comparison (1.4).** Record about 1 h in the Recording Room teleprompter, directed session against pure conversation. Upload the source to `test-dry-run` (tests the 512 MB limit on a real file). Edit 3–5 clips through R1 OpusClip, R2 hybrid and R3 Descript/CapCut (R4 freelancer optional). Judge blind. | £0 (free tiers) · about 1 h recording + about 2–3 h judging | At least one route produces clips that **pass all gating checks (1, 2, 3, 11, 12)** and that the owner "would publish" on at least 3 of 5 clips. The cost and minutes per accepted clip are within the bar in GUARANTEE_ECONOMICS V2, Part 2. Each tool's privacy, training and deletion terms are recorded. The upload succeeds and reads back intact. C04 "TO FILL" items can be filled. |
| **T3** | **C02/C03 route decision.** Standard and fallback route, plus acceptable / premium / reject examples from the T2 output. | £0 · 30 min | One route and one fallback are named, with observed steps. Three example clips are filed in the Library. |
| **T4** | **Transcription quality (B08, without code).** Run the T2 source through the AssemblyAI dashboard ($50 free credit). Compare it with the transcript from Descript/OpusClip. | £0 · 15 min | The transcript is accurate enough to select clips and check facts: names and numbers are right on a spot-check of 3 passages, and timestamps are usable. **Then** decide: build a small worker against `src/lib/processing` (the code is missing), or stay on the editor's transcript. |
| **T5** | **Approval loop on a real derivative (B10 remainder).** Upload a T2 clip as v01, package it, send it to the client view on `test-dry-run`, request changes, upload v02, approve. | £0 · 20 min (client sign-in) | The client sees only the approved package. A change creates a new version that needs re-approval. The notification arrives once. The publish record cannot be released before approval. |
| **T6** | **Manual publishing on Threadline's own accounts (B11; R9 dogfood).** Post one approved clip natively to LinkedIn video, Shorts, Reels and TikTok, with a tracked link. Record each live URL in the publish record. | £0 · 30 min | Four live URLs are recorded against the approved version, and the tracked link counts a real click. This is the route client #1 uses, documented step by step. |
| **T7** | **Scheduler bridge (E15).** One free tier only (Metricool Free or Buffer Free), on Threadline's own accounts. | £0 · 45 min | It schedules native **video** to LinkedIn (profile; check company page), Shorts, Reels and TikTok **publicly**. It exports or shows views per post. Cost at 4 platforms × 1 client is recorded. Fail on any platform → manual for that platform. |
| **T8** | **Metrics and report (B12).** At days 7 and 14 after T6: enter LinkedIn manually, import a native/scheduler CSV for the others, generate the report. | £0 · 20 min | Snapshots carry their source and date, and LinkedIn views are labelled manual. The CSV preview maps columns correctly and does not duplicate on re-import. The report shows expected vs actual, with nothing fabricated. |
| **T9** | **Anthropic live (B06/B07, R1).** Only when a client needs in-app generation: key with a console spend cap and `AI_PRICE_*` set. Run ideas, script, hooks, refine and miner on `test-dry-run` with the T4 transcript. | Usage-based (cap set by the owner) · 30 min | Outputs cite the Brand Brain version and the PLAYBOOK block. Mined quotes are exact. Claims gates fire. `costMicroUsd` is recorded. Quality is at least that of T1's Max output, judged blind. |
| **T10** | **Research automation.** (a) Owner says go → weekly Max routine (Stage 1); review after 4 runs. (b) Then the Apify pilot (R5): `RESEARCH_EXTERNAL_PROVIDERS`, `APIFY_*`, console limit £10–30, one niche, TikTok/IG/YouTube. | £0, then £10–30 | (a) Four weekly reports, each with at least 5 usable angles and limits stated. (b) A scheduled run returns items with Apify provenance, dedupes, stops at the cap, and the top-N ranking is judged useful by the owner. |
| **T11** | **First real API publish (J08, start the clocks in parallel).** LinkedIn "Share on LinkedIn" self-serve app → `LINKEDIN_CLIENT_*` → connect the owner's profile → schedule one approved post. In parallel, file the TikTok sandbox/review and Meta business verification. | £0 · 1–2 h, then platform wait | One scheduled post goes out once via the connector, with its URL recorded and an UNCERTAIN state handled. TikTok shows SELF_ONLY until audit, as the code expects. |

**Not worth testing yet:** X/Threads connectors (outside client scope), Bright Data/EnsembleData, Riverside, R3–R8 engine build, automatic metric ingestion (blocked by platform reviews).
