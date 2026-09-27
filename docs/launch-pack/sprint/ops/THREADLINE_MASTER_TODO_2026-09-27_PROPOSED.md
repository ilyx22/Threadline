# Threadline: Master TODO (proposed replacement, 27 September 2026)

**Upload this to Drive as a new file.** Do not overwrite `THREADLINE_UPDATED_MASTER_TODO_2026-09-21.md`; keep it as history.

This file restates every open line of that TODO with its current status. Obsolete lines are removed; the appendix says why.

**Evidence base, as of 27 September 2026:**
- repo `main` @ a6c0ad5, plus the uncommitted sprint files in `docs/launch-pack/sprint/`
- `docs/implementation/BACKEND_COMPLETION_LEDGER.md` (the ledger)
- `docs/launch-pack/sprint/TODO_AUDIT.md` (a line-by-line audit of the old TODO)
- `sprint/ops/DEFECT_REGISTER.md` (DR-nn)
- `sprint/ACTIVATION_RUNBOOK.md`
- `docs/launch-pack/OWNER_DECISIONS.md` (D-01…D-09)
- `docs/launch-pack/REVIEW_INDEX.md`

## Status key

| Status | Meaning |
| --- | --- |
| **DONE** | Implemented and tested, or produced, with the evidence cited. Code items are *simulated*: nothing is live-verified until production is activated |
| **CLAUDE-DONE-TONIGHT** | Produced in the 26–27 September sprint. It waits for owner review; it is not approved |
| **IN PROGRESS TONIGHT** | Another assistant session is producing it tonight. Confirm on delivery |
| **CLAUDE-QUEUED** | The assistant can do it without owner accounts, money, decisions or sending. It is scheduled in the sprint below |
| **OWNER** | Needs the owner's account, secret, decision, identity, money, sending or calls |
| **EXTERNAL** | A platform approval or review clock |
| **DEFER** | Explicitly deferred until earned, or until Client #1 signs |

**Standing decisions**, respected throughout:
- **The public frontend is frozen.** It is approved at `threadline-fawn.vercel.app`. The proof band stays by owner decision (O-01 closed). Public-copy conflicts are reported, not edited (DR-37…42). A change needs the owner to lift the freeze.
- **Commercial cadence is four-week periods.** The offer is a 12-week, three-period initial engagement: £2,500 implementation plus £2,500 every four weeks. Pricing is never public.
- **Company-led and covert initially.** There is no fabricated founder or persona. Founder-personal commercial activity waits on employer clearance (D-05).
- **A person approves before anything leaves the building.** No model sends, publishes or approves.

---

## ☀ Morning owner checklist: do these first, in this order

The list is ordered by how much each step unblocks. The steps in section 1 follow `sprint/ACTIVATION_RUNBOOK.md` exactly. Nothing secret goes in a document or a chat.

**1. Activate production (about 2–3 hours). This unblocks everything live.**
Today, `smoke:prod` passes 6 of 10: health 503, no database, 5 configuration errors, cron 503.
- [ ] **OWNER.** Isolate the mirror: disconnect `threadlinex`'s Git, and set `DEPLOYMENT_ROLE=primary` on `threadline` (D-04; runbook §0).
- [ ] **OWNER.** Database: Neon (EU), set `DATABASE_URL` and `DIRECT_URL`, run `prisma migrate deploy`, set PITR to 7 days or more, run `npm run owner:create` (runbook §1).
  - It unblocks the live application path, the owner dry run and the verbatim library import.
- [ ] **OWNER.** Keys: `CREDENTIAL_ENCRYPTION_KEYS` (**before** the first sign-in, because staff two-factor is enforced) and `CRON_SECRET`, then enrol two-factor (runbook §2).
- [ ] **OWNER.** Email: Resend domain and key, `EMAIL_FROM`, `OPS_NOTIFY_EMAIL`, webhook secret (runbook §3).
- [ ] **OWNER.** Files: R2 private bucket; CORS allowing PUT/GET and exposing `ETag` (runbook §4).
- [ ] **OWNER.** Redeploy once, then run `npm run smoke:prod`; the target is 10 of 10. Tell Claude, who re-runs it and reads Admin → System with you (runbook §7).
- [ ] **CLAUDE-QUEUED.** Before you run the runbook: commit the uncommitted fixes and the `owner:create` / `smoke:prod` scripts. Needs your OK (DR-24…29).

**2. Employer clearance (D-05). This unblocks sending, the LinkedIn page and verbatim passage A.**
- [ ] **OWNER.** Send the Deloitte outside-business / conflict request today. Until it is cleared:
  - research outreach is signed by a real named person and is honest about the research;
  - the founder's public persona is not used.

**3. Booking and domain (D-02). This unblocks content CTAs, signatures, profile links and send-ready outreach.**
- [ ] **OWNER.** Connect `threadlinehq.com` and `www` to the `threadline` project, and add the Namecheap A/CNAME records (keep MX, SPF, DKIM and DMARC). Then set `NEXT_PUBLIC_APP_URL` (runbook §5).
  - The domain has **no web record** today; it is not returning a 502.
- [ ] **OWNER.** Resolve **15 vs 20 minutes**: the verbatim playbook asks for 15, while the live Calendly event is 20 (K-05, DR-32). Outreach is not send-ready until this is settled.
- [ ] **OWNER.** Create the commercial "Diagnosis call" Calendly event (45 minutes proposed) and set `NEXT_PUBLIC_BOOKING_URL`.
- [ ] **OWNER.** Test a research booking end to end from a second address: invitation → 20-minute event → confirmation → CRM record.

**4. Accounts. This unblocks the CRM, social profiles and live AI.**
- [ ] **OWNER.** Attio: create the API key, set `ATTIO_API_KEY`, and import `sprint/prospects/prospects.csv` (68 rows; add an `owner` column on import).
- [ ] **OWNER.** Reserve the `threadline` / `threadlinehq` handles, with unique passwords in a password manager and 2FA. Fill `sprint/social/ASSET_REGISTER_TEMPLATE.csv` as you go.
- [ ] **OWNER.** Anthropic key with a console spend limit. Also set `AI_PRICE_INPUT_PER_MTOK` and `AI_PRICE_OUTPUT_PER_MTOK`, so AI cost is recorded rather than "unknown".
- [ ] **OWNER.** Advisory: Upstash (shared rate limits) and the error DSN (runbook §6).

**5. Decisions and approvals, in one sitting. These unblock contracts, invoices, onboarding copy and first sends.**
- [ ] **OWNER.** Decisions:
  - D-01: approve the offer and the 14-day terms.
  - D-03: RPO/RTO and retention (recommended: option B / option 2).
  - D-07: support owner and response times.
  - D-09: legal entity and postal address.
  - The tracked-link cookie basis (ATT-02) and whether the ICO fee applies.
  - Risk reversal wording.
- [ ] **OWNER.** Work through `REVIEW_INDEX.md` and mark each item APPROVED or send it back. Suggested order:
  1. outreach and email lifecycle;
  2. sales call guide and one-pager;
  3. onboarding pack;
  4. brand kit;
  5. newsletter graphics.
- [ ] **OWNER.** Review tonight's sprint files:
  - `sprint/emails/`, `sprint/contracts/`, `sprint/social/`, `sprint/stack/`;
  - `sprint/ops/`: the defect register, agent register and Brand Brain gap map;
  - the A-tier one-pagers and the content register, once delivered.
- [ ] **OWNER.** Send `sprint/contracts/` to a solicitor (MSA, SOW, DPA outline).

**6. First sends.** Only once steps 2 and 3 are clear (D-05 cleared, booking tested, 15/20 settled).
- [ ] **OWNER.** Rehearse the research call once (`sales/RESEARCH_INTERVIEW_SCRIPT.md`).
- [ ] **OWNER.** Send the first controlled A-tier research invitations through a permitted channel. Log each one as a touch.

---

## Sprint days 1–4 (Sunday 27 to Wednesday 30 September)

| Day | Owner | Claude |
| --- | --- | --- |
| **Day 1 (Sun 27)** | Morning checklist steps 1–3: activation, the D-05 request, the domain, 15/20, the Diagnosis event, the booking test. Step 5 decisions if time allows | Commit the fixes on your OK (DR-24…29, including removing the leftover debug logging, DR-25). Re-run `smoke:prod` after activation. Fill in D-07 and D-09 details wherever they are provided |
| **Day 2 (Mon 28)** | Step 4 accounts: the Attio import, handles and 2FA, the Anthropic key. Start REVIEW_INDEX (outreach, email, sales). Review the content register and pre-scores (C12) | Schema and actions: message version and reply class on the touch; `problemEnergy` and `awarenessState`; cash, hours and CAC on the scoreboard; required VOC and next action on attended calls (DR-48, DR-49). Run the public QA and accessibility sweeps (report only; DR-52) |
| **Day 3 (Tue 29)** | **Owner dry run**, 14 steps with a stopwatch (`operations/OWNER_DRY_RUN.md`). Record the results in `DRY_RUN_RESULTS_2026-09-29.md`. Approve the A-tier one-pagers. Engage the solicitor | Fix what the dry run finds. Fix the uncleared-stories defect (DR-17) on your OK. Write the ROOT_ID lineage test and the owner / next-action / due-date enforcement audit (DR-50, DR-51). Run the IR tabletop with you (30 minutes) |
| **Day 4 (Wed 30)** | If D-05 is cleared and booking is tested: the first 5–10 A-tier research invitations, logged as touches. Create the LinkedIn Company Page if cleared. Confirm the 1–14 October content calendar (C20) | Build the outbound scoreboard view. Set up the weekly call-to-content pass (DR-53). Update the ledger and this TODO. Draft the Brand Brain changes you approved from the gap map |

**The four-week sprint after Day 4:**
- **Week 1:** activation verified live; the dry run is done; the first touches go out.
- **Week 2:** 5–10 qualified touches a day; the first research interviews; submit the platform app reviews (Meta in one business verification, TikTok, Google, LinkedIn).
- **Week 3:** interviews toward 10. Decide on Commercial Response Validation (CRV) only if more than five converge.
- **Week 4:** Threadline's own four-week review: ACTION → RESULTS → PROBLEMS → FUTURE. Freeze nothing that the evidence doesn't support.

---

## Launch asset pack (26 September)

- [x] **DONE.** Brand kit: `docs/launch-pack/brand-kit/` (83 files: guidelines; SVG and PNG in light, dark and mono; icons, avatars, LinkedIn and X headers; report, cover and email-signature templates; OFL font noted). It awaits owner review.
- [x] **DONE.** Onboarding pack: `onboarding/` (13 files, every requested piece). It awaits owner review. The D-07 support times are placeholders.
- [x] **DONE.** Call scripts: the `sales/` call guide, live one-pager, research interview script, close-to-kickoff card and verbatim library (31 of 31 exact). The source defects (numbering, 15 vs 20) are flagged for the owner (DR-32, DR-33).
- [x] **DONE.** Email scripts: `outreach/EMAIL_LIFECYCLE.md` §1–12 and `sprint/emails/` (the campaign, the reply playbook, the test plan and the list filter). They are not send-ready until D-02 and D-05.
- [x] **DONE.** Newsletter graphics: `newsletter-graphics/` (14 graphics, SVG, 1080 and 1200 PNG, alt text, contact sheet, sample layout). The layout is not inbox-tested (DR-34).
- [ ] **OWNER.** Asset acceptance: work through `REVIEW_INDEX.md` and mark each item DRAFT / READY FOR OWNER REVIEW / APPROVED.

## The next 10 tasks (first-client v1), restated

1. [x] **DONE.** Audit and pin the backend state. Evidence: the ledger snapshot and checkpoint log; unit tests 824/824; QA 623 plus 2 gated; marketing-v9 62/62; tsc and eslint clean.
2. [ ] **OWNER.** Durable PostgreSQL and recovery.
   - The code is done (INF-01, 02, 04, 08; the restore drill passed on 113 tables).
   - Activation is morning step 1.
3. [x] **DONE.** Critical data and security gaps are closed in code:
   - tenant file scope and SVG refused (SEC-02);
   - staff MFA (SEC-08);
   - rate limits (SEC-03/06), headers (SEC-04) and monitoring (INF-07/10).

   Still open: **OWNER**, Upstash and the DSN; **CLAUDE-QUEUED**, the IR tabletop (Day 3).
4. [x] **DONE.** Application → conversion → workspace → invite: COM-01…03 and TEAM-02…04; journeys 1 and 2. A live check follows activation.
5. [ ] **OWNER.** Email and scheduled work. The code is done (COM-01, REP-03, NOT-02, JOB-01…04). What remains is Resend and `CRON_SECRET` (morning step 1).
6. [x] **DONE.** Minimum operator path: the learning-loop panel (LRN-01), one queue (OPS-01), manual publish (INT-04), CSV metrics (INT-05), and reports (REP-01/02).
7. [ ] **OWNER.** Safe full-journey rehearsal. Simulated it is done (VER-01..10: journeys 19/19 and 87/87). The live owner dry run is Day 3.
8. [ ] **OWNER.** Claim and legal readiness:
   - keep the proof-band evidence privately (the band stays by owner decision);
   - D-09, the ICO fee, the cookie basis;
   - solicitor review of `sprint/contracts/`.
9. [ ] **OWNER.** Commercial and delivery rehearsal. Manual invoicing is DONE (BIL-01, journey 8, `sprint/contracts/INVOICE_TEMPLATE.html`). Still to come: the signed scope, the kickoff, the Day-7 plan and the timed benchmark, all in the dry run.
10. [ ] **OWNER.** Keep acquisition moving: the Attio import, the booking test, content review, first invitations (morning steps 3–6).

**Current boundary.**
- The code is complete against the ledger: no row is blocked by unfinished code.
- The blockers are configuration, owner decisions and platform approvals.
- v1 remains: Apply → review → convert → invite → onboard → operate → approve content → record results → weekly report.
- Publishing, invoicing and metric entry stay manual for v1. OAuth publishing, payment automation and advanced agents are built but gated. They are not launch gates.

## Current position

- [x] **DONE.** Business architecture, doctrine, wedge, pricing hypothesis, sales doctrine, SOPs and the application architecture.
- [x] **DONE.** 15 initial prospects plus 53 new, re-checked 26 Sept, in `sprint/prospects/prospects.csv`. Regavon was removed; RousseauAI was re-qualified.
- [x] **DONE.** Domain, Google Workspace/MX, SPF, DKIM and DMARC (15 Sept). Attio workspace. The "Founder Research — 20 mins" Calendly event.
- [x] **DONE.** Charlie Morgan/Imperium and Daniel Fazio authority audits.
- [~] **IN PROGRESS TONIGHT.** Authority addendum (`sprint/authority/AUTHORITY_ADDENDUM.md`).
- [x] **DONE.** Brand-led content launch pack and A-tier micro-asset pack (Drive). They await founder review.
- [x] **DONE.** The frontend is approved and **frozen** at `threadline-fawn.vercel.app`.
- [ ] **OWNER.** Proof band: keep the source, timeframe and definition on file privately. It is not removed (owner decision).
- [ ] **OWNER.** Fresh live end-to-end verification after activation (`smoke:prod` 10/10, then the dry run).
- [ ] **OWNER.** Canonical domain: `threadlinehq.com` has no web record. Connect it (morning step 3).
- [ ] **EXTERNAL.** Native platform routes. The manual fallback is DONE (INT-04/05).
- [ ] **OWNER.** Ten founder interviews and Commercial Response Validation (weeks 2–3).
- [ ] **OWNER.** The offer stays a founding hypothesis until the interviews and CRV support it.

## 24 September transcript audit: controls

The six operating shifts and the offer-framing test (installation-first framing for cold prospects, with the full 12-week terms disclosed) stand unchanged. The status of each control:

- [~] **IN PROGRESS TONIGHT.** Content Funnel + PESTO/Objection taxonomy, as Threadline's own tagged content register.
  - In code, `Idea.pesto` and `funnelRole` are DONE (AI-04).
  - **CLAUDE-QUEUED:** the objection/decision tag, commercial job, ICP theme, proof layer, CTA eligibility and evidence-status fields on Idea.
- [~] **CLAUDE-DONE-TONIGHT.** Voice/Tone + Avatar + Creative Brief template: the gap map is in `sprint/ops/BRAND_BRAIN_GAP_MAP.md`.
  - **OWNER:** approve the proposed field changes.
  - **CLAUDE-QUEUED:** implement them (about 8.5 h in total).
- [~] **CLAUDE-DONE-TONIGHT.** Proof Bank / Claims Register: mapped in the gap map §4.
  - **IN PROGRESS TONIGHT:** Threadline's own register (`sprint/content/PROOF_BANK_AND_CLAIMS_REGISTER.md`).
  - **CLAUDE-QUEUED:** the `ProofItem` columns, if approved.
- [ ] **CLAUDE-QUEUED.** Human→AI→human anti-slop gate. Judge v0.2 already has a gating no-invented-detail criterion (AI-05). Still to add: the slop-pattern criterion, the "one specific sentence" rule, and a QA checklist.
- [~] **IN PROGRESS TONIGHT.** Three-second profile conversion test (`sprint/content/PROFILE_THREE_SECOND_TEST.md`). It is applied as a report only to the frozen site, and to `sprint/social/PROFILES.md`.
- [ ] **CLAUDE-QUEUED.** Call-to-content mining. The exact-quote miner is DONE (AI-01). Sales-call VOC and objections are not mined yet (DR-53).
- [x] **DONE.** Content-assisted attribution: `Prospect.demandSource`, with content-sourced and content-assisted kept separate (LP-05, ATT-01).
- [ ] **DEFER.** Outbound capacity gate. Revisit after the first 20–30 touches. The funnel and capacity support exist (LP-05, CAP-01).
- [~] **IN PROGRESS TONIGHT.** Client case-study template (`sprint/sales-extra/CASE_STUDY_TEMPLATE.md`).
- [x] **CLAUDE-DONE-TONIGHT.** Manual-first agent register: `sprint/ops/AGENT_REGISTER.md` (trigger, inputs, output, owner, boundary, failures, cost, fallback, promotion evidence).

## P0: Build state (restated)

- [x] **DONE.** Repo, branch, commit and environment confirmed (ledger snapshot; `DEPLOYMENT_INVESTIGATION.md`).
- [x] **DONE.** Compared against the 16 Sept handoff (`LATEST_HANDOFF_FINDINGS_DISPOSITION.md`, `BACKEND_GAP_ANALYSIS_2026-09-25.md`).
- [x] **DONE.** Truthful Last Verified State: 114 models, PostgreSQL, 11 migrations, 824 unit tests, QA 623 plus 2 gated. The ledger's "Remaining requirements by blocker" is the authority.
- [x] **DONE.** Full test suite, lint, type-check, build and migration checks.
- [ ] **CLAUDE-QUEUED.** Run `qa:public`, `qa:browser`, `qa:perf`, `qa:vitals` and `qa:visual:compare` on a local production build. Marketing-v9 62/62 is done; the others have no current result (DR-52).
- [ ] **OWNER.** PostgreSQL production persistence (morning step 1).
- [x] **DONE.** Secrets, sessions, environment separation, demo password removed (SEC-09, INF-04/05, `scripts/ops/create-owner.ts`). A live `env:check` follows activation.
- [x] **DONE.** Roles tested independently; client direct-URL and server-action access refused; tenant isolation and file ownership (tenancy suite 86/86, SEC-01/02, TEAM-09).
- [x] **DONE.** Recovery and failure paths (JOB-02 UNCERTAIN state, `db:drill`, TECHNICAL_HANDOFF §9 and §11).
- [x] **CLAUDE-DONE-TONIGHT.** One defect register: `sprint/ops/DEFECT_REGISTER.md` (53 rows; every S1 row is owner configuration or an owner decision).
- [x] **DONE.** Launch-critical code defects fixed (ledger: none outstanding). Tonight's uncommitted fixes: DR-24…29.
- [x] **CLAUDE-DONE-TONIGHT.** Documentation reconciled:
  - FINAL audit §6, §8 and §9 now match the ledger;
  - this replacement TODO is drafted.

## P0: Approved frontend, maintenance only

- [x] **DONE.** The frontend is approved and frozen. 104 protected files match the baseline.
- [ ] **OWNER.** Proof strip: private substantiation file only. A change needs the owner to lift the freeze.
- [ ] **OWNER.** Legal identity, privacy, retention and cookie corrections. Supply D-09 and D-03 and the cookie basis; Claude then fills the hidden legal sections in (a permitted legal correction).
- [ ] **OWNER.** Canonical domain and redirect (morning step 3).
- [x] **DONE.** Application submit → persistence → notification → review, simulated (COM-01/02, journey 1). A live test follows activation.
- [ ] **CLAUDE-QUEUED.** Accessibility, keyboard and functional sweep of the frozen routes. **Report only**; fixes need the owner's sign-off under the freeze.
- [ ] **OWNER.** Decide whether to lift the freeze for the reported public-copy conflicts:
  - "month to month" vs four-week periods;
  - "twenty minutes a week";
  - "10 to 14 days";
  - "You own the content";
  - the "one conversation a month" outcome line.

  See DR-38…42.

## P0: Narrow first-client backend journey

- [x] **DONE.** Migrations and job wiring (JOB-01). The defect register is done tonight.
- [ ] **OWNER.** PostgreSQL, backups and PITR. Rerun `db:drill` on a Neon branch after activation.
- [ ] **OWNER.** Private object storage: the R2 bucket and CORS. The code is DONE (SEC-02, FILE-01/02/04).
- [ ] **OWNER.** Encrypted secrets, the DSN and Upstash. The code is DONE (SEC-04/08/11, INF-07/10).
  - **CLAUDE-QUEUED:** the IR tabletop rehearsal.
- [x] **DONE.** Reviewed conversion, invitation and onboarding, with duplicate and expired guards and audit events (COM-03, TEAM-03/04).
- [ ] **OWNER.** Confirmation, invitation and report emails with retries and alerts: needs Resend. The code is DONE (COM-01, REP-03, NOT-02, JOB-02 Idempotency-Key).
- [ ] **OWNER.** Protected Vercel cron: needs `CRON_SECRET`. Hourly cron (Pro or an external scheduler) is a later decision (DR-10).
- [x] **DONE.** Minimum operator loop, end-to-end synthetic path, isolation and negatives (VER-01..10, tenancy and hostile-input suites).
- [x] **DONE.** OAuth, auto-publishing and payment automation are built but gated, and are not presented as live (INT-01..03, BIL-02 test mode).

## P1: Extend and time the delivery method

- [ ] **CLAUDE-QUEUED.** A synthetic walkthrough of the full chain with a screenshot at each step, as the rehearsal for the owner dry run.
- [x] **DONE.** Client Home is action-first (CX-01).
- [x] **DONE.** "Threadline is working on…" comes from real records (CX-01).
- [x] **DONE.** Internal material is hidden from clients (tenancy suite, CX-06, REP-01).
- [ ] **CLAUDE-QUEUED.** Recording Room, teleprompter, fullscreen and print: a headless-Chrome test.
- [x] **DONE.** Intelligence, Diagnosis, Install and Proof flows (suites; ENG-03; PRF-01).
  - Tonight's uncommitted fixes: the diagnosis review is every four weeks, not monthly (DR-27), and there is a "Getting set up" nav item (DR-26).
- [ ] **CLAUDE-QUEUED.** ROOT_ID survives every derivative: an end-to-end lineage test (DR-51).
- [x] **DONE.** Content states from idea to learning (DEL-01, LRN-01).
- [ ] **CLAUDE-QUEUED.** Owner, next action and due date required on every active record: an enforcement audit (DR-50).
- [x] **DONE.** Write-back of URL, platform id, status, provenance and freshness (INT-03/04/05). Tracked links, UTMs, booking source and evidence labels (ATT-01..03). First-touch, last-touch and linear views. The four-week report runs belief → actual → diagnosis → intervention → next test (REP-02, AI-07). Scores are labelled as rubric-based with version and confidence (AI-05).
- [ ] **OWNER.** One realistic fulfilment cycle with a stopwatch, split into owner-only / delegatable / automatable / waiting / switching, with failures and workarounds logged. This is the Day 3 dry run, recorded in EffortEntry (CX-08).

## P2: External platforms (gated; not launch gates)

- [x] **DONE.** Domain, Workspace/MX, SPF, DKIM and DMARC.
- [ ] **DEFER.** Smartlead and a multi-domain stack. Initial research outreach stays low-volume within the `sprint/emails/BULK_LIST_FILTER_SPEC.md` limits.
- [ ] **OWNER.** Safe test accounts for TikTok, Instagram, LinkedIn, YouTube and X, after D-05.
- [~] **IN PROGRESS TONIGHT.** Stack and lead-gen system:
  - done so far: `sprint/stack/STACK.md`, `LEAD_GEN_SYSTEM.md`, `STACK_SETUP_CHECKLIST.md`;
  - `TIKTOK_API_APPLICATION.md`: TikTok review text drafted.
- [ ] **OWNER.** TikTok app in the developer organisation.
  - **EXTERNAL:** Login Kit, posting and display; the sandbox; the review clock. The connector is DONE (INT-03); posts stay private until the app is audited.
- [ ] **EXTERNAL.** Meta: one business verification covers Instagram, Facebook and Threads. Submit all three permission sets together (INT-06).
- [ ] **EXTERNAL.** Google/YouTube project, OAuth consent and verification.
- [ ] **EXTERNAL.** LinkedIn developer app. The Company Page needs a personal admin, so it waits on D-05.
- [ ] **OWNER.** X developer app and paid tier (a money decision).
- [ ] **OWNER.** LLM key with spend limits (morning step 4). Per-workspace AI budgets are DONE (AI-08).
- [ ] **OWNER.** Metricool as an operator bridge. Optional; paid.
- [ ] **DEFER.** Bright Data as the first ResearchProvider, and the Apify / EnsembleData benchmark (D-08). A desk comparison is in `research/RESEARCH_PROVIDER_AUDIT.md`. The optional Apify adapter is built and off.
- [ ] **EXTERNAL.** One end-to-end route per platform, after the reviews.
- [x] **DONE.** A safe fallback for every platform (INT-04 manual publish, INT-05 CSV import). A single "connected" flag is never trusted (INT-02 identity checks).

## P0: CRM, booking and initial validation

- [x] **DONE.** Attio workspace, list and core fields.
- [ ] **OWNER.** Link the OS to Attio: set `ATTIO_API_KEY`. The code is DONE (COM-04 outbox and retries).
- [x] **CLAUDE-DONE-TONIGHT.** Prospects imported, deduplicated, prioritised and re-checked: `sprint/prospects/prospects.csv` (68 rows, with status, next action and due date).
  - **OWNER:** import it, add the owner column, spot-check.
- [ ] **OWNER.** Test invitation → 20-minute event → confirmation → CRM (morning step 3).
- [x] **DONE.** Research and commercial booking are kept separate (`outreach/OUTREACH_SEQUENCES.md` §1, `sprint/emails/CAMPAIGN_PACK.md`).
  - **OWNER:** create the Diagnosis event.
- [~] **IN PROGRESS TONIGHT.** The promised one-page asset per A-tier account (`sprint/a-tier-assets/`, 23 accounts plus INDEX).
  - **OWNER:** approve each one immediately before sending.
- [ ] **OWNER.** Rehearse the research call and the VOC fields. The script is ready.
- [ ] **OWNER.** Send the first controlled A-tier research invitation (Day 4, if D-05 and booking are clear).
- [ ] **CLAUDE-QUEUED.** Log the message version and reply class per touch. `ProspectTouch` has channel, time and note today (DR-48).
- [ ] **OWNER.** 5–10 qualified research touches per working day. The first 20–30 touches are instrumentation.
- [ ] **CLAUDE-QUEUED.** Outbound scoreboard: add cash, acquisition hours and practical CAC to the existing funnel counts (DR-48).
- [ ] **OWNER.** Run outbound (primary) and brand content (trust layer) as complementary engines. The operating rule is recorded (STRATEGY_RECONCILIATION §5).
- [x] **DONE.** Speed-to-lead mechanics (AI-06: routing, speed-to-lead measure, human-sent drafts).
  - **OWNER:** set the same-day SLA.
- [ ] **OWNER.** At least ten proper founder interviews. Test authority system vs ghostwriting perception.
- [x] **DONE.** Exact interview fields (`RESEARCH_INTERVIEW_SCRIPT.md` §1, `ValidationConversation`).
- [ ] **CLAUDE-QUEUED.** Problem Energy 0–5 and awareness-state fields. Neither exists in the schema yet (DR-48).
- [x] **DONE.** The problem is validated only when more than five converge (LP-02, enforced). Touch → cash is tracked (Prospect timestamps, SalesCall, CommercialEvent).
- [ ] **DEFER.** CRV batches on 2–3 framings, until the interviews converge (D-06).
- [ ] **DEFER.** Freezing problem, outcome and positioning, until the evidence aligns.

## P1: Brand and content engine

- [ ] **OWNER.** Deloitte outside-business clearance (D-05; morning step 2).
- [ ] **OWNER.** Reserve handles; unique credentials, 2FA and recovery (morning step 4). Claude can pre-check public handle availability.
- [ ] **OWNER.** LinkedIn Company Page, after D-05.
- [x] **DONE.** Logo, avatar, name, bio, link and CTA standardised (`brand-kit/`, `sprint/social/PROFILES.md`). The link waits on D-02.
- [x] **DONE.** Social asset register template (`sprint/social/ASSET_REGISTER_TEMPLATE.csv`).
  - **OWNER:** fill it in as accounts are created.
- [~] **IN PROGRESS TONIGHT.** Content register (`sprint/content/CONTENT_REGISTER.csv` and `.md`): the tagged register of all 66 Drive-pack items, which covers:
  - the content lanes;
  - PESTO and objection/decision tags;
  - ROOT_ID, ICP theme, content job, funnel stage, format, CTA, destination, status and evidence boundary;
  - evergreen / seasonal / time-sensitive / retired tags;
  - the commercial job;
  - the four-part gate and anti-slop gate scores;
  - an approve / rewrite / reject recommendation.
- [~] **CLAUDE-DONE-TONIGHT.** Client Brand Brain templates: the gap map is done.
  - **OWNER:** approve the changes.
  - **CLAUDE-QUEUED:** implement them.
- [x] **DONE.** First content inventory: the Drive pack (30 X, 15 Threads, 10 LinkedIn, 10 scripts, 1 YouTube outline) and `sprint/social/CALENDAR_14_DAYS.md`.
- [ ] **OWNER.** Review the pack and mark it approve / rewrite / reject, using the register's pre-scores.
- [ ] **DEFER.** Add 20 X posts only after live signal. The X library toward 1,000 grows in learning batches. The 7–14-day buffer comes only after the first live signal.
- [~] **IN PROGRESS TONIGHT.** Three-second profile test on the active surfaces (with the register).
- [ ] **OWNER.** Schedule only through official tools; replies stay human.
- [ ] **OWNER.** Publish the first batch (the 1–14 October calendar) once D-02, D-05 and the accounts are done. Then capture a baseline and compare expected vs actual.
- [ ] **OWNER.** Feed replies and objections into Attio and the next batch.
- [ ] **CLAUDE-QUEUED.** Weekly call-to-content pass. Claude runs it once real transcripts exist (DR-53).
- [x] **DONE.** Content-assisted vs direct pipeline kept separate (LP-05).
- [x] **DONE.** High cadence is treated as a stretch goal; the launch cadence is modest and review-led (STRATEGY_RECONCILIATION §4, `CALENDAR_14_DAYS.md`).

## P1: ResearchProvider, corpus and Judge calibration

**Internal agent promotion ladder**
- [x] **CLAUDE-DONE-TONIGHT.** A manual version, trigger, data, output, owner, boundary, failures, cost and fallback for each operator (the call/objection miner, trend scout, inbox triage, speed-to-lead and performance summariser): `sprint/ops/AGENT_REGISTER.md`.
- [ ] **CLAUDE-QUEUED.** Dogfood on internal and public data only; scores stay advisory. This runs with the corpus below.
- [x] **DONE.** Promotion through manual → sandbox → supervised live → production, with a reversible switch and audit (LRN-03 `JudgePromotion`: human promotion and rollback).
- [x] **DONE.** No uncalibrated Judge in approval, publishing or outbound (DEL-04, AI-09, AI-06; `calibrated: false` on every verdict).

**Provider and corpus**
- [x] **DONE.** Provider-agnostic interface; search, post, creator, comments and transcript capabilities; normalised fields; the outlier fallback chain returning UNKNOWN; provenance and freshness; hidden-outcome evaluations; winners beside losers; correction logs (LP-06, `corpus.test.ts`, LRN-03, CorrectionEntry, JudgeEvaluation).
- [ ] **CLAUDE-QUEUED.** A real 100–300-item wedge corpus with ordinary and losing examples, from public data (no paid provider per D-08). This is 1–2 days of work, weeks 2–3.
- [ ] **DEFER.** Benchmark acceptance, edit minutes and false positives/negatives; raise autonomy only when earned. Both need the corpus and live use.

## P1: Editing and delivery economics

- [ ] **OWNER.** Pick 3–5 raw clips. Produce the Descript, OpusClip, human and hybrid versions. Choose the standard route. Build acceptable / premium / reject examples.
- [ ] **CLAUDE-QUEUED.** An editing scorecard with the twelve criteria, the fallback and overflow route (with decision points left open), and the file handoff, naming, storage and revision SOP, based on the app's actual behaviour (FILE-02, DEL-02, CX-06).
- [ ] **DEFER.** Test human capacity only where needed. No native video editor. No permanent price for heavy editing.

## P1: Commercial and Client #1 readiness

- [~] **IN PROGRESS TONIGHT.** Sales-extra templates in `sprint/sales-extra/`. Confirm each item on delivery:
  - `MINIMUM_VIABLE_METHOD.md`: the Client #1 minimum viable method page (Diagnose → Position → Create → Record → Produce/Distribute → Measure → Improve, mapped to app routes);
  - `INSTALLATION_LED_FIRST_TOUCH.md`: the installation-led first-touch variant, with the full 12-week terms beside the current framing;
  - `PROPOSAL_TEMPLATE.md`: the proposal template;
  - `BOOKING_QUESTIONS_AND_REMINDERS.md`: the commercial booking questions and the reminder and no-show copy;
  - `CASE_STUDY_TEMPLATE.md`: the client case-study template.
- [x] **DONE.** Scope, exclusions and about 12–16 core assets per four-week period, as a V1 hypothesis (`sprint/contracts/ORDER_FORM_SOW.md`).
- [ ] **OWNER.** The founding price hypothesis stays private (D-01; ENG-02 has £10,000 in code). Decide the controllable risk reversal (the wording is drafted).
- [x] **DONE.** One-page offer and qualification scorecard (`03 Acquisition and Sales/DRAFT_*`, four-week wording). They await owner review.
- [x] **CLAUDE-DONE-TONIGHT.** SOW/order form, services agreement, DPA outline and invoice template (`sprint/contracts/`).
- [x] **DONE.** The Charlie/Imperium contract is kept as a labelled reference only.
- [ ] **OWNER.** Solicitor review before any real client data (IP, confidentiality, prompts and methods, datasets, generalised learning).
- [ ] **OWNER.** Entity, company number, address, privacy contact, retention, ICO fee and cookie basis (D-09, D-03, ATT-02).
- [ ] **OWNER.** PI and cyber insurance; Cyber Essentials.
- [x] **DONE.** Manual invoice and payment route (BIL-01, journey 8).
  - **OWNER:** add the bank details; issue a live test invoice after activation.
  - Stripe-hosted payment is test mode only (BIL-02).
- [x] **DONE.** Onboarding link, intake, workspace creation and kickoff flow (COM-03, `suite-onboarding`, `onboarding/KICKOFF_AGENDA.md`).
- [ ] **OWNER.** Verify the Day-7 installation plan (dry-run step 6). Rehearse the 3–5-minute demo; Claude can seed a demo workspace.
- [x] **DONE.** Approved sales language kept word for word (LP-08, 31 of 31 exact). Objection material, including in-housing and heavy editing (`LIVE_CALL_ONE_PAGER.md`, SALES_CALL_GUIDE §10).
- [ ] **CLAUDE-QUEUED.** The five-outcome exit is enforced in code today, but VOC, next action and due date are optional. Make them required for attended calls (DR-49).

## P2: Execute Client #1 and create proof (DEFER until Client #1 signs; the tooling is built)

- [ ] **DEFER.** Day-0 baseline (ATT-03); baseline fields labelled measured, reported or unavailable (ATT-01); founder and client time and approval burden (CX-08).
- [ ] **DEFER.** Persistent asset IDs and tracked destinations (ContentRoot, TrackedLink); weekly commercial-signal capture (INT-08); evidence classes preserved, with no causality claims.
- [ ] **DEFER.** The four-week ACTION → RESULTS → PROBLEMS → FUTURE review, covering believed, happened, failed, changed and next (REP-02, LRN-01).
- [ ] **DEFER.** Delivery load, margin and revisions (CAP-01, DEL-06); the optional success interview with permission; proof assets from one verified record (PRF-01; graphic 14).
- [ ] **DEFER.** Adjust cadence, price, founder-burden claims and staffing from Clients 1–3.

## Explicitly defer until earned (unchanged)

- [ ] **DEFER.** Smartlead and multi-mailbox infrastructure.
- [ ] **DEFER.** Paid acquisition, until pain, closes, proof, economics and capacity are validated (generally around £10k+ recurring revenue per four-week period).
- [ ] **DEFER.** Revenue share or performance pricing.
- [ ] **DEFER.** Generic billing software.
- [ ] **DEFER.** Fine-tuning.
- [ ] **DEFER.** A native video editor.
- [ ] **DEFER.** Newsletter as a standard client deliverable.
- [ ] **DEFER.** Partner and affiliate infrastructure.
- [ ] **DEFER.** Broad competitor expansion.
- [ ] **DEFER.** A category SEO library.
- [ ] **DEFER.** Exact founder-time claims.
- [ ] **DEFER.** Further platform integrations without a client need. Facebook and Threads were already built under the scope override; they are gated.
- [ ] **DEFER.** Rebuilding the OS.

## Fastest dependency order (updated)

1. Keep the frontend frozen. The proof band stays; public-copy conflicts are the owner's call.
2. Activate production (runbook §0–7) and verify `smoke:prod` 10/10. **The code is already complete.**
3. Run the owner dry run on live production and record the timings and failures.
4. Get the solicitor-reviewed contracts, D-09, D-03, the cookie basis and a tested manual invoice before any real client data.
5. In parallel: D-05, the domain, booking, Attio, the content review and the first research invitations. Truthful contact never waits on backend automation.
6. Interviews to ten, then CRV only on convergence, then the timed editing benchmark.
7. Close and serve Client #1 only after the live minimum path works.
8. Promote native publishing, payment automation and agents only when client use and evidence justify it (see AGENT_REGISTER promotion rules).

## Daily operating rule (unchanged)

Before Client #1: **live validation, replies and calls → controlled outreach → bounded content block → launch-critical build and tool work.**

After Client #1: **client result and retention → active sales pipeline → outreach → content → bounded process and build work.**

---

## Appendix: removed or rewritten, and why

| Removed or rewritten line (old TODO) | Why |
| --- | --- |
| Launch pack: "brand kit / newsletter graphics not located"; onboarding, call scripts and emails "[~]" | Superseded. All of them exist in `docs/launch-pack/` and the Drive folder `14Yn_BrojRjwJcEz9va-EHM8PXjUY1Sff`; they await owner review |
| "Local repository check (26 September)": checkout `ea12201`, SQLite, 77 models, 175 actions, dependencies absent | Obsolete. `main` @ a6c0ad5 runs PostgreSQL with 114 models and 824 unit tests |
| "The backend is reported to contain 77 models and 175 server actions… audit before accepting" (P0 intro) | Audited. Replaced by the ledger's verified state |
| "Delivery estimate: 7–10 focused working days (5–7 if clean)" | Overtaken. The code is complete against the ledger; the remaining work is configuration and owner actions (about 2–3 hours of activation) |
| "Current boundary: the backend is substantial but not yet a complete first-client journey" | Overtaken. Every journey passes in simulation. The boundary is now live activation |
| "The 21 September 502 check concerned threadlinehq.com" | Wrong symptom. The domain has **no web record** (DNS was never pointed at Vercel). Restated as a connect-the-domain task |
| "Substantiate **or remove** '100m+ views / 10,000+ conversions'" (three places) | The owner decided the proof band stays and the frontend is frozen (O-01 closed). Restated as private substantiation |
| "[~] An AI-assisted synthetic architecture review… not a dry run" | Superseded by `operations/OWNER_DRY_RUN.md` and VER-01..10 |
| "Replace the permanent queue worker assumption with a protected cron route" | Done (JOB-01). Only `CRON_SECRET` remains |
| Separate lines for OAuth routes, auto-publishing and payment automation "outside the critical path" | Merged. They are built but gated (INT-01..03, BIL-02) |
| "Test Bright Data as the first ResearchProvider" and "Benchmark Bright Data against Apify/EnsembleData" as open work | Conflicted with D-08 and the "deferred from Client #1" heading. Restated as DEFER |
| Duplicate lines: Next-10 items 2, 5 and 7 repeat the P0 items; transcript controls TC1, TC4, TC5, TC6, TC7 and TC2/3 repeat content items C8, C16, C18, C22, C23 and C9 | Kept once, with a cross-reference, so progress is not counted twice |
| Header dates (filename 2026-09-21, audit 24 Sept, reconciled 26 Sept) | Replaced by one date: 27 September 2026 |
| "Around £10k+ MRR" | Reworded to "recurring revenue per four-week period", to match the four-week commercial cadence |
