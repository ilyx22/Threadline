# Master TODO audit (26 September 2026)

**What was audited.** The newest master TODO: Drive file `1lRHytJCSFBJpMbqYXGrljQVjgE1vbs0V`, `THREADLINE_UPDATED_MASTER_TODO_2026-09-21.md` (modified 26 Sept 05:00). Older duplicates were ignored. Drive was read only; nothing in Drive was changed.

**Scope.** Every open `[ ]` and partial `[~]` checklist line: **215 lines** (209 open, 6 partial). The 19 `[x]` lines were only checked for contradictions.

**Evidence base, as of 26 Sept, repo `main` @ a6c0ad5 plus uncommitted sprint files:**
- `docs/implementation/BACKEND_COMPLETION_LEDGER.md` (the ledger)
- `docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md`
- `docs/OWNER_ACTIVATION_CHECKLIST.md` (OAC)
- `docs/TECHNICAL_HANDOFF.md`
- `docs/launch-pack/**`, including the `sprint/` files that exist at the time of writing
- greps of `src/` and `prisma/schema.prisma` (114 models)

**Production facts (verified 26 Sept):**
- Both Vercel deployments serve the site.
- `/api/health` reports `database:false` and 5 configuration errors.
- Cron returns 503.
- The assistant gets 403 when setting Vercel env vars.
- `threadlinehq.com` has Google mail and DMARC, but no web record.
- The Calendly event "Founder Research — 20 mins" exists (per Drive).

## Classification key

| Class | Meaning |
| --- | --- |
| **DONE-IN-CODE** | Implemented and tested (simulated, local PostgreSQL, mocks) with a ledger row or file cited. **Not** LIVE_VERIFIED: nothing is, because production has no database yet |
| **DONE-IN-ASSETS** | The asset exists in `docs/launch-pack/**`. Owner approval is still a separate state (REVIEW_INDEX) |
| **CLAUDE-CAN-DO** | The assistant can finish it without owner accounts, secrets, decisions, money or sending. The exact work is stated |
| **OWNER-ONLY** | Needs the owner's account, secret, decision, identity, money, sending or calls. Where the code is already done and only configuration remains, the item is here |
| **EXTERNAL-GATE** | Platform approval or review clock |
| **DEFER** | Explicitly deferred until earned. It also covers items that cannot start until Client #1 has signed; those carry a note |
| **OBSOLETE** | Superseded; the newer source is cited |

Row IDs are local to this audit. Sections follow the TODO's order.

---

## 1. Launch asset pack (26 September)

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| L1 | Brand kit ("not located") | DONE-IN-ASSETS | `brand-kit/`: 83 files. It has the guidelines, SVG and PNG masters in light, dark and mono, the icons and avatars, the LinkedIn and X headers, and four templates: report, report cover, presentation cover and email signature. The font licence (OFL) is noted in `INVENTORY.md` §A | Owner review, REVIEW_INDEX §1 |
| L2 | Onboarding [~] | DONE-IN-ASSETS | `onboarding/`: 13 files. They cover every requested piece: welcome, pre-kickoff, kickoff, Brand Brain, recording, team, approvals, roadmap, results, FAQ and support | Owner review. The D-07 support times are still placeholders |
| L3 | Call scripts [~] | DONE-IN-ASSETS | `sales/`: `SALES_CALL_GUIDE.md`, `LIVE_CALL_ONE_PAGER`, `RESEARCH_INTERVIEW_SCRIPT.md` (§2 flags the question-numbering defect), `CLOSE_TO_KICKOFF_CARD.md` and `APPROVED_VERBATIM_LIBRARY.md` (31/31 exact). The 15-minute defect is flagged in STRATEGY_RECONCILIATION K-05 | Owner review; the owner resolves the 15 vs 20 minutes |
| L4 | Email scripts [~] | DONE-IN-ASSETS | `outreach/EMAIL_LIFECYCLE.md` §1–12 match the TODO's gap list one for one. `sprint/emails/` adds the commercial cold-email campaign, the reply playbook, the test plan and the list filter | Owner review. Not send-ready until D-02 (booking) and D-05 (identity) |
| L5 | Ten newsletter graphics | DONE-IN-ASSETS | `newsletter-graphics/`: 14 graphics, editable SVGs, 1080 and 1200 PNGs, `alt.json`, the contact sheet and a sample layout. The README maps all ten requested items | Owner review. The sample layout is not inbox-tested |
| L6 | Asset acceptance / status marking | OWNER-ONLY | `REVIEW_INDEX.md` approval record: everything is READY FOR OWNER REVIEW or DRAFT | The owner works through REVIEW_INDEX and marks each item APPROVED |

## 2. The next 10 tasks

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| N1 | Audit and pin backend state | DONE-IN-CODE | Ledger snapshot and checkpoint log; `DEPLOYMENT_INVESTIGATION.md`. `MASTER_LAUNCH_CHECKLIST`: unit 824/824, QA 623 + 2 gated, marketing-v9 62/62; tsc and eslint clean | None. Keep the ledger current |
| N2 | Durable PostgreSQL and recovery | OWNER-ONLY | The code is done (INF-01, INF-02, INF-04, INF-08; restore drill passed). Production still reports `database:false` | OAC §1 / `sprint/ACTIVATION_RUNBOOK.md` §1: Neon, the two URLs, `migrate deploy`, PITR of 7 days or more |
| N3 | Critical data and security gaps | DONE-IN-CODE | SEC-02 (tenant file scope, SVG refused), SEC-08 (staff MFA), SEC-03/06 (rate limits), SEC-04 (headers), INF-07/INF-10 (monitoring adapter) | Owner: Upstash and the error DSN (advisory). Claude: an incident-response tabletop rehearsal (see the CLAUDE-CAN-DO list) |
| N4 | Application → conversion → workspace → invite | DONE-IN-CODE | COM-01, COM-02, COM-03, TEAM-02, TEAM-03 and TEAM-04; journeys 1 and 2 | A live check after N2 (`npm run smoke:prod`) |
| N5 | Email and scheduled work | OWNER-ONLY | The code is done (COM-01, REP-03, NOT-02, JOB-01 to JOB-04). The blockers are the Resend key and domain and `CRON_SECRET`. Cron returns 503 | OAC §2–3 |
| N6 | Minimum operator path | DONE-IN-CODE | LRN-01 (the learning-loop panel), OPS-01 (one queue), INT-04 (manual publish), INT-05 (CSV metrics), REP-01/REP-02 | — |
| N7 | Safe full-journey rehearsal | OWNER-ONLY | Simulated: VER-01..10, with journeys 87/87 and 19/19. The live, owner-run rehearsal is `operations/OWNER_DRY_RUN.md` (14 steps), still PENDING | Run it after N2 and N5 |
| N8 | Claim and legal readiness | OWNER-ONLY | Drafts exist: `sprint/contracts/` (MSA, SOW, DPA outline, README). The owner items are D-09, the solicitor, the ICO fee and the cookie basis (ATT-02) | Engage a solicitor; decide D-09 |
| N9 | Commercial and delivery rehearsal | OWNER-ONLY | Manual invoicing is in code (BIL-01, journey 8), plus `sprint/contracts/INVOICE_TEMPLATE.html`. Still needed: a signed scope, the kickoff, the Day-7 plan and the timed benchmark | Covered by the dry run and D-01 |
| N10 | Keep acquisition moving | OWNER-ONLY | `sprint/prospects/prospects.csv` holds 68 rows, all "not contacted". The Calendly event exists | Import into Attio, test the booking, review content, send the first invitations |

## 3. Current position (open and partial lines)

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| CP1 | [~] Synthetic architecture review is not a dry run | OBSOLETE | Superseded by `operations/OWNER_DRY_RUN.md`, a founder-run dry run with a real deliverable and timings, and by VER-01..10 | Track the dry run under N7 |
| CP2 | Substantiate or remove "100m+ / 10,000+" | OWNER-ONLY | CLAIMS_AUDIT P-01. The owner decided the proof band stays (O-01 closed; the frontend is frozen) | Keep the source, timeframe and definition on file privately |
| CP3 | Backend, DB, permissions, integrations, payment, cron and journey need fresh E2E | OWNER-ONLY | Simulated E2E is done. Live is blocked by configuration (health shows `database:false`) | OAC §0–5, then `smoke:prod` and the dry run |
| CP4 | 21 Sept 502 on threadlinehq.com | OWNER-ONLY | Stale wording: the domain now has **no web record**; it is not returning a 502 (D-02) | Add the domain in Vercel and set the DNS at Namecheap |
| CP5 | Native/provider routes not tested E2E | EXTERNAL-GATE | INT-02, INT-03 and INT-06 are EXTERNAL_CONFIGURATION_REQUIRED. The manual fallback works (INT-04, INT-05) | Platform app reviews |
| CP6 | Ten founder interviews and CRV not done | OWNER-ONLY | No interviews recorded | Owner's calls |
| CP7 | Offer is still a hypothesis | OWNER-ONLY | This depends on CP6 | — |

## 4. Transcript-derived controls

| ID | Item | Class | Evidence | Next action (exact) |
| --- | --- | --- | --- | --- |
| TC1 | Content Funnel + PESTO/Objection taxonomy | CLAUDE-CAN-DO | Partly done: `Idea.pesto` and `Idea.funnelRole` (AI-04). There is no objection/decision tag, commercial job, ICP theme, proof layer, CTA eligibility or evidence status | Add the missing fields to Idea (a migration and tests), **and** build Threadline's own tagged content register from the Drive pack |
| TC2 | Voice/Tone + Avatar + Creative Brief template | CLAUDE-CAN-DO | Partly done: `voiceProfileSchema` (`phrasesUsed`/`phrasesAvoided`, `soundsLikeMe`/`notMe`), founder stories and opinions, the `IcpProfile` model, `onboarding/BRAND_BRAIN_GUIDE.md`. No creative brief, hot takes or boundaries | Map the gaps between the fields and the spec; write the template doc; add the missing fields |
| TC3 | Proof Bank / Claims Register | CLAUDE-CAN-DO | `ProofItem` has source and `claimStatus` only. There is no evidence class, date, permitted or prohibited wording, or placement. `claims/CLAIMS_AUDIT.md` is a report, not a register | Build Threadline's register as a CSV from CLAIMS_AUDIT; optionally extend `ProofItem` |
| TC4 | Human→AI→human anti-slop gate | CLAUDE-CAN-DO | Judge v0.2 has a gating "no-invented-detail" criterion (AI-05), and DEL-05 enforces package claims. There is no slop-pattern check and no "one specific sentence" rule | Add the criterion and tests to the Judge rubric, plus a QA checklist |
| TC5 | Profile conversion (three-second) test | CLAUDE-CAN-DO | Not found anywhere | Write the test and apply it to the frozen site (report only) and to `sprint/social/PROFILES.md` |
| TC6 | Call-to-content mining in the weekly loop | CLAUDE-CAN-DO | The exact-quote miner exists (AI-01) and runs on transcripts. `SalesCall.voc` and `objections` are not mined | Add a job that mines call VOC and objections into ideas; add the weekly SOP step |
| TC7 | Content-assisted attribution | DONE-IN-CODE | LP-05: `Prospect.demandSource` (content_sourced and content_assisted kept separate), ATT-01 | — |
| TC8 | Outbound capacity gate | DEFER | It is explicitly "after the first stable sample". Funnel (LP-05) and capacity (CAP-01) support exist | Revisit after 20–30 touches |
| TC9 | Client case-study template | CLAUDE-CAN-DO | Only graphic 14 (a layout) exists | Write the template with the TODO's fields |
| TC10 | Manual-first agent register | CLAUDE-CAN-DO | `research/AGENT_WORKFLOWS.md` covers inputs, outputs and failures, but not cost, fallback or the promotion threshold for each operator | Write the register: 5 operators × the TODO's columns |

## 5. P0: establish the real build state

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| B1 | Confirm repo, branch, commit and environment | DONE-IN-CODE | Ledger snapshot; `DEPLOYMENT_INVESTIGATION.md` | — |
| B2 | Compare against the 16 Sept handoff, TODO and QA | DONE-IN-CODE | `docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`, `BACKEND_GAP_ANALYSIS_2026-09-25.md` | — |
| B3 | Truthful Last Verified State | DONE-IN-CODE | Ledger snapshot and "Remaining requirements by blocker"; MASTER_LAUNCH_CHECKLIST test counts | Fix the stale audit sections (B15) |
| B4 | Install and run the full test suite | DONE-IN-CODE | Unit 824/824 (MASTER_LAUNCH_CHECKLIST) | — |
| B5 | Run every public QA script in package.json | CLAUDE-CAN-DO | marketing-v9 (62/62) and run-all are evidenced. No current results for `qa:public`, `qa:browser`, `qa:perf`, `qa:vitals` or `qa:visual:compare` | Run the five on a local production build and record the results |
| B6 | Lint, type-check, build and migration checks | DONE-IN-CODE | tsc and eslint clean; 11 migrations applied to empty PostgreSQL (INF-01); production build used by marketing-v9 | — |
| B7 | PostgreSQL production persistence | OWNER-ONLY | Health shows `database:false` | OAC §1 |
| B8 | Secrets, sessions, env separation, demo password removed | DONE-IN-CODE | SEC-09, INF-04 (seed guard), INF-05 (`DEPLOYMENT_ROLE`), `scripts/ops/create-owner.ts` | A live `env:check` after configuration |
| B9 | Admin/operator and client roles tested independently | DONE-IN-CODE | Tenancy suite 86/86; permissions matrix in the audit §4 | — |
| B10 | Direct-URL and server-action access as a client | DONE-IN-CODE | Tenancy suite; SEC-01 | — |
| B11 | Tenant isolation and file ownership | DONE-IN-CODE | SEC-02, FILE-01, TEAM-09 (scope.test.ts) | — |
| B12 | Recovery and failure paths, manual fallbacks | DONE-IN-CODE | JOB-02 (the UNCERTAIN state), `db:drill`, TECHNICAL_HANDOFF §9 and §11 | — |
| B13 | One defect register (severity, owner, due) | CLAUDE-CAN-DO | The 19 fixed findings are in the audit §3. There is no single register of open defects: the 4 failing `smoke:prod` checks, CSP inline scripts, stale docs and the public FAQ claims | Write `DEFECT_REGISTER.md` |
| B14 | Fix launch-critical defects | DONE-IN-CODE | Ledger: "No row is blocked by unfinished code" | — |
| B15 | Reconcile handoff/TODO docs with what passes | CLAUDE-CAN-DO | The FINAL audit §6, §8 and §9 are stale (old counts; "missing: CX-08, FILE-02…"; risks 4 and 5 are fixed) and contradict §1 and the ledger. This Drive TODO is stale too (see §19) | Fix the audit sections; draft a replacement master TODO for the owner to upload (Drive stays untouched) |

## 6. P0: approved frontend, maintenance only

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| F1 | Verify the proof strip | OWNER-ONLY | P-01; the owner decided (O-01) | Keep the evidence privately; a change needs the owner to lift the freeze |
| F2 | Legal identity, privacy, retention and cookie corrections | OWNER-ONLY | The legal-page sections stay hidden until the details are provided (OAC §9); D-09, D-03, ATT-02 | The owner supplies the details; Claude then fills them in (a permitted legal correction) |
| F3 | Canonical domain and redirect | OWNER-ONLY | D-02; no web record | Vercel → Domains, then Namecheap A/CNAME records |
| F4 | Application submit → persistence → notification → review | DONE-IN-CODE | COM-01, COM-02, journey 1 (simulated) | Live test after OAC §1 and §3 (`smoke:prod` and one test application) |
| F5 | Repair only genuine a11y, functional or legal defects | CLAUDE-CAN-DO | No current a11y sweep evidence | Run an axe/keyboard/functional sweep of the frozen routes; report only, since fixes need owner sign-off under the freeze |

## 7. P0: narrow first-client backend journey

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| J1 | Repo, migrations, job wiring, defect register | DONE-IN-CODE | Ledger; JOB-01 | See B13 for the register |
| J2 | PostgreSQL, migrations, backups, restore rehearsal | OWNER-ONLY | INF-01 and INF-08 code done; the drill passed locally | OAC §1; rerun `db:drill` on a Neon branch |
| J3 | Private object storage, tenant auth, SVG refused | OWNER-ONLY | Code: SEC-02, FILE-01, FILE-02, FILE-04. Missing: the R2 bucket and CORS | OAC §4 |
| J4 | Encrypted secrets, MFA, headers, rate limit, monitoring, IR runbook with rehearsal | OWNER-ONLY | Code: SEC-04, SEC-08, SEC-11, INF-07, INF-10, runbook (TECHNICAL_HANDOFF §9). Needed: `CREDENTIAL_ENCRYPTION_KEYS`, DSN, Upstash. No IR rehearsal is evidenced | OAC §2 and §5. Claude runs the IR tabletop |
| J5 | Reviewed conversion, invitation, onboarding; duplicate and expired guards | DONE-IN-CODE | COM-03 (idempotent), TEAM-03 and TEAM-04, audit events | — |
| J6 | Confirmations, invitations and report emails with retries and alerts | OWNER-ONLY | COM-01, REP-03, NOT-02, JOB-02 (Idempotency-Key) | Resend (OAC §3) |
| J7 | Protected Vercel cron | OWNER-ONLY | JOB-01 (`/api/cron/jobs`, bearer, 45 s budget); it returns 503 today | `CRON_SECRET`; Vercel plan decision |
| J8 | Minimum operator loop | DONE-IN-CODE | Same as N6 | — |
| J9 | End-to-end synthetic path with isolation and negatives | DONE-IN-CODE | VER-01..10 (journeys 87/87, 19/19), tenancy and hostile-input suites | — |
| J10 | OAuth, auto-publish and payment automation kept off the critical path | DONE-IN-CODE | Built but gated: INT-01..03 and BIL-02 are EXTERNAL_CONFIGURATION_REQUIRED or test-mode only, not presented as live | — |

## 8. P1: extend and time the delivery method

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| D1 | Walk the full chain from onboarding to the next test | CLAUDE-CAN-DO | Simulated journeys exist. There is no screenshot walkthrough of the chain | A local synthetic walkthrough on embedded PostgreSQL, with a screenshot at each step, as a rehearsal for the owner dry run |
| D2 | Client Home action-first: Record, Approve, Decide | DONE-IN-CODE | `src/app/app/[org]/page.tsx` lines 281–303; CX-01 | — |
| D3 | "Threadline is working on…" drawn from real records | DONE-IN-CODE | CX-01 | — |
| D4 | Internal research, costs, AI spend, QA and notes hidden from clients | DONE-IN-CODE | Tenancy suite; CX-06 (internal comments); REP-01 (drafts hidden) | — |
| D5 | Recording Room, teleprompter, fullscreen, print | CLAUDE-CAN-DO | `production/recording/recording-room.tsx` exists; no QA script covers it | Headless-Chrome test of all four modes |
| D6 | Intelligence, Diagnosis, Install, Proof flows | DONE-IN-CODE | `suite-diagnosis`, `suite-corpus-judge`, ENG-03, PRF-01 | — |
| D7 | ROOT_ID survives every derivative | CLAUDE-CAN-DO | `rootId` is on Idea and Asset (CX-05) and ContentRoot. There is no end-to-end lineage test through package, publish and metrics | Write a lineage test |
| D8 | Content states from idea to learning | DONE-IN-CODE | DEL-01, `suite-workflow`, LRN-01 | — |
| D9 | Every active record requires an owner, next action and due date | CLAUDE-CAN-DO | Fields exist (DEL-01, COM-02, Prospect). Whether they are *required* is unverified | Audit enforcement per model; add validation and tests where it is missing |
| D10 | Write back URL, platform ID, status, provenance, freshness | DONE-IN-CODE | INT-03, INT-04, INT-05 (snapshot freshness) | — |
| D11 | Tracked links, UTMs, booking source, evidence labels | DONE-IN-CODE | ATT-01..03, `suite-attribution` | — |
| D12 | First-touch, last-touch and linear views | DONE-IN-CODE | `src/lib/data/attribution.ts` line 160 | — |
| D13 | Four-week report: belief → actual → diagnosis → intervention → next test | DONE-IN-CODE | REP-02, AI-07 | — |
| D14 | Scores labelled as rubric-based, with version and confidence | DONE-IN-CODE | Judge rubric v0.2 versioning (AI-05); ContentExpectation carries confidence and rubric version | — |
| D15 | One realistic fulfilment cycle with a stopwatch | OWNER-ONLY | OWNER_DRY_RUN has Active and Waiting columns | Owner runs it |
| D16 | Split time: owner-only, delegatable, automatable, waiting, switching | OWNER-ONLY | EffortEntry (CX-08) records it; the split comes from the dry run | During the dry run |
| D17 | Log missing information, revisions, failures, workarounds | OWNER-ONLY | Dry-run "Afterwards" section | During the dry run |

## 9. P2: external platforms (deferred from Client #1)

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| E1 | Low-volume research outreach; defer Smartlead | DEFER | TODO and Blueprint. `sprint/emails/BULK_LIST_FILTER_SPEC.md` sets sending limits | — |
| E2 | Test accounts on 5 platforms | OWNER-ONLY | Needs the owner's identity and accounts | After D-05 |
| E3 | TikTok app | OWNER-ONLY | Developer organisation account | — |
| E4 | TikTok Login Kit, Posting and Display, sandbox | EXTERNAL-GATE | Connector built (INT-03); `TIKTOK_APP_AUDITED` gate | Claude can script the sandbox test once keys exist |
| E5 | TikTok review demo and clock | EXTERNAL-GATE | `docs/PLATFORM_APPLICATIONS.md` | Claude can draft the demo script and compliance text |
| E6 | Meta / Instagram setup and review | EXTERNAL-GATE | INT-06; one business verification covers IG, FB and Threads (OAC §7) | Submit the three permission sets together |
| E7 | Google / YouTube project and verification | EXTERNAL-GATE | OAC §7 | — |
| E8 | LinkedIn developer app and Company Page | EXTERNAL-GATE | Also blocked by D-05 (a page needs a personal admin) | — |
| E9 | X app and paid tier | OWNER-ONLY | A money decision (paid tier) | — |
| E10 | LLM key with spend limits | OWNER-ONLY | `ANTHROPIC_API_KEY`; per-workspace budgets exist (AI-08) | Create the key with a limit in the Anthropic console |
| E11 | Metricool as an operator bridge | OWNER-ONLY | Needs a paid account | Optional |
| E12 | Bright Data as the first ResearchProvider | DEFER | D-08: defer research providers until the first client | — |
| E13 | Benchmark Bright Data, Apify and EnsembleData | DEFER | Desk comparison in `research/RESEARCH_PROVIDER_AUDIT.md`; D-08 | — |
| E14 | One E2E route per platform | EXTERNAL-GATE | Depends on E4–E9 | — |
| E15 | Safe fallback for every platform | DONE-IN-CODE | INT-04 manual publish with evidence, INT-05 CSV import (OAC §7 last paragraph) | — |
| E16 | Never trust a single "connected" flag | DONE-IN-CODE | INT-02 account identity checks; `PROVIDER_STATES` in `research/providers.ts` | — |

## 10. P0: CRM, booking and initial validation

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| A1 | Link the OS to Attio | OWNER-ONLY | COM-04 is code done (outbox, retries); `Prospect.crm*` fields exist | `ATTIO_API_KEY` (OAC §6) |
| A2 | Import and dedupe the 15 prospects | DONE-IN-ASSETS | `sprint/prospects/prospects.csv`: the 15 re-checked (RECHECK-01..) plus 53 new; `PROSPECTS_README.md` | Owner imports into Attio. The CSV lacks an `owner` column; add it on import |
| A3 | Prioritise 8, verify contacts, drop Regavon, re-qualify RousseauAI | DONE-IN-ASSETS | The CSV `verification_notes` say "Checked 2026-09-26"; the README records Regavon removed and RousseauAI re-qualified | Owner spot-checks |
| A4 | State, owner, next action and due date on every prospect | DONE-IN-ASSETS | CSV `status`, `next_action` and `due_date` (for example 2026-10-01) | Add the owner on import |
| A5 | Test invitation → 20-minute event → confirmation → CRM | OWNER-ONLY | Needs the Calendly account and a test booking | Book a test slot from a second address |
| A6 | Research and commercial booking kept separate | DONE-IN-ASSETS | `outreach/OUTREACH_SEQUENCES.md` §1; `sprint/emails/CAMPAIGN_PACK.md` (the tracks never mix); D-02 | The owner creates the Diagnosis-call event |
| A7 | Finalise the one-page asset per account before sending | CLAUDE-CAN-DO | Only a one-line `pre_completed_value` per row; no built one-pagers | Build one-page assets for the A-tier rows, branded with `brand-kit/templates` |
| A8 | Rehearse the research call and VOC fields | OWNER-ONLY | The script is ready (`RESEARCH_INTERVIEW_SCRIPT.md`) | Owner rehearsal |
| A9 | Send the first A-tier invitation | OWNER-ONLY | Sending; blocked by D-05 identity and the booking link | — |
| A10 | Log source, message version, channel, time, response, state, next | CLAUDE-CAN-DO | `ProspectTouch` has `kind`, `channel`, `at` and `note`, but **no message version** and no response class per touch | Add `messageVersion` (and a reply class) to the touch, with tests |
| A11 | 5–10 qualified touches a day | OWNER-ONLY | Sending | — |
| A12 | First 20–30 touches as instrumentation | OWNER-ONLY | Sending | — |
| A13 | Outbound scoreboard (… cash, acquisition hours, practical CAC) | CLAUDE-CAN-DO | Funnel counts through to won exist (`src/lib/data/acquisition.ts`, LP-05, ATT-04). No cash, acquisition hours or CAC for Threadline itself | Add those three measures to the Acquisition page, with tests |
| A14 | Outbound and brand as complementary engines | OWNER-ONLY | An operating rule; the strategy is recorded (STRATEGY_RECONCILIATION §5) | — |
| A15 | Speed-to-lead rule | DONE-IN-CODE | AI-06 (`leads/index.ts`: routing, speed to lead, human-sent drafts) | Owner sets the same-day SLA |
| A16 | Ten proper founder interviews | OWNER-ONLY | Calls | — |
| A17 | Capture the exact interview fields | DONE-IN-ASSETS | `RESEARCH_INTERVIEW_SCRIPT.md` §1 VOC record; the `ValidationConversation` model | — |
| A18 | Score Problem Energy 0–5 and awareness state | CLAUDE-CAN-DO | The script says to record both (line 85). **Neither field exists** in the schema (grep: 0 hits) | Add `problemEnergy` and `awarenessState` to ValidationConversation, with UI and tests |
| A19 | Test authority-system versus ghostwriting perception | OWNER-ONLY | Interview evidence | — |
| A20 | Validate only if more than 5 converge | DONE-IN-CODE | LP-02 thresholds enforced on the move to validated; the wedge convergence fix | — |
| A21 | Small CRV batches on 2–3 framings | DEFER | After convergence; D-06 | — |
| A22 | Track touch through to cash | DONE-IN-CODE | Prospect funnel timestamps, SalesCall, CommercialEvent | — |
| A23 | Freeze problem, outcome and positioning | DEFER | Only when the evidence aligns | — |

## 11. P1: brand and content engine

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| C1 | Deloitte outside-business clearance | OWNER-ONLY | D-05 | This gates C3, A9 and library A |
| C2 | Reserve handles | OWNER-ONLY | `sprint/social/PROFILES.md` (no handle availability checked) | Claude can pre-check public availability |
| C3 | LinkedIn Company Page | OWNER-ONLY | Needs a personal admin; D-05 | — |
| C4 | Standardise logo, avatar, name, bio, link and CTA | DONE-IN-ASSETS | `brand-kit/icons/avatar-*`, `brand-kit/social/*`, `PROFILES.md` | The link waits on D-02 |
| C5 | Unique credentials, password manager, 2FA | OWNER-ONLY | — | — |
| C6 | Social asset register | DONE-IN-ASSETS | `sprint/social/ASSET_REGISTER_TEMPLATE.csv` | Owner fills it in as accounts are created |
| C7 | Define content lanes | CLAUDE-CAN-DO | Not in the brand guidelines or the sprint files | Write the six lanes with examples mapped from the Drive pack |
| C8 | PESTO and objection/decision tags | CLAUDE-CAN-DO | PESTO is in code (AI-04); the objection/decision tag is missing | As in TC1 |
| C9 | Client Brand Brain templates (four) | CLAUDE-CAN-DO | Partial (TC2, TC3) | As in TC2 and TC3 |
| C10 | Content operating database with ROOT_ID and the rest | CLAUDE-CAN-DO | The client OS has ContentRoot and Idea. Threadline's own content has no register | Build a register CSV/Sheet from the Drive pack (66 items), with every column |
| C11 | [~] First content inventory | DONE-IN-ASSETS | Drive pack `1RVAWSpIeDADlyDzxaERmFp5S3NkEFfKd` (30 X, 15 Threads, 10 LinkedIn, 10 scripts, 1 YouTube outline); `sprint/social/CALENDAR_14_DAYS.md` | Founder review (C12) |
| C12 | Review the pack: approve, rewrite or reject | OWNER-ONLY | — | Claude pre-scores it first (C14–C17) so the review is quick |
| C13 | [~] 50–100 X learning batch | DEFER | The TODO says to add 20 only after live signal | — |
| C14 | Tag X assets (evergreen and the rest) | CLAUDE-CAN-DO | `evergreen` has 0 hits anywhere | Put it in the C10 register |
| C15 | Four-part gate | CLAUDE-CAN-DO | Not applied | Score each item in the register |
| C16 | Anti-slop gate on the pack | CLAUDE-CAN-DO | Not applied | Check each item in the register |
| C17 | Tag by commercial job | CLAUDE-CAN-DO | Not applied | Put it in the register |
| C18 | Three-second profile test on active surfaces | CLAUDE-CAN-DO | As in TC5 | — |
| C19 | Schedule only through official tools; replies stay human | OWNER-ONLY | An operating rule; needs accounts | — |
| C20 | Publish the first batch, capture a baseline, compare | OWNER-ONLY | The calendar (1–14 Oct) exists, but its preconditions (D-02, D-05, accounts) are unmet | — |
| C21 | Feed replies and objections into Attio and the next batch | OWNER-ONLY | Ongoing | — |
| C22 | Weekly call-to-content pass | OWNER-ONLY | Needs real transcripts. The miner exists (AI-01); see TC6 | Claude runs the pass once calls exist |
| C23 | Content-assisted versus direct pipeline | DONE-IN-CODE | LP-05 | — |
| C24 | 7–14-day buffer after first signal | DEFER | Gated on live signal | — |
| C25 | X library toward 1,000 | DEFER | Explicitly learning batches | — |
| C26 | High cadence treated as stretch | DONE-IN-ASSETS | STRATEGY_RECONCILIATION §4 (no hard-coded daily or 300 figures) | — |
| C27 | Modest, review-led launch cadence | DONE-IN-ASSETS | Same file, and `CALENDAR_14_DAYS.md` | — |

## 12. Internal agent promotion ladder

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| AG1 | Manual version of each operator first | CLAUDE-CAN-DO | AGENT_WORKFLOWS is partial | Put it in the TC10 register |
| AG2 | Trigger, data, output, owner, boundary, failures, cost, fallback | CLAUDE-CAN-DO | As above | As above |
| AG3 | Dogfood on internal and public data; scores stay advisory | CLAUDE-CAN-DO | LRN-03 held-out path exists; there is no corpus yet | Together with R5 |
| AG4 | Promotion ladder with a reversible switch and audit | DONE-IN-CODE | LRN-03 (`JudgePromotion`: human promotion and rollback) | — |
| AG5 | No uncalibrated Judge in approval, publishing or outbound | DONE-IN-CODE | DEL-04 (no auto-approve), AI-09 (no autonomous tools), AI-06 (a human sends) | — |

## 13. ResearchProvider, corpus and Judge calibration

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| R1 | Provider-agnostic interface | DONE-IN-CODE | `src/lib/research/providers.ts`; LP-06 | — |
| R2 | Search, post, creator, comments, transcript | DONE-IN-CODE | The `Capability` type; the Apify adapter (optional) | — |
| R3 | Normalised fields | DONE-IN-CODE | ResearchExample and ExampleAnalysis; `corpus.ts` ExampleMetrics | — |
| R4 | Outlier fallback chain returning UNKNOWN | DONE-IN-CODE | `src/lib/domain/corpus.test.ts` rules 1–3 | — |
| R5 | Real 100–300-item wedge corpus with ordinary and losing examples | CLAUDE-CAN-DO | No corpus | Collect public posts from the wedge (public URL reading plus manual capture, no paid provider per D-08), record capture time and metrics, and prepare an import file. Large: 1–2 days |
| R6 | Provenance and freshness | DONE-IN-CODE | Provenance type; `capturedAt` | — |
| R7 | Hidden-outcome evaluations | DONE-IN-CODE | LRN-03 leakage refusal; the diagnosis suite freezes forecasts | — |
| R8 | Winners beside comparable losers | DONE-IN-CODE | Corpus baseline rules | Needs R5 data |
| R9 | Correction logs | DONE-IN-CODE | CorrectionEntry, JudgeEvaluation | — |
| R10 | Benchmark acceptance, edit minutes, false positives and negatives | DEFER | Needs the corpus and live use | — |
| R11 | Increase autonomy only when earned | DEFER | By definition | — |

## 14. P1: editing and delivery economics

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| ED1 | Pick 3–5 raw clips | OWNER-ONLY | Needs real footage | — |
| ED2 | Produce the Descript, OpusClip, human and hybrid versions | OWNER-ONLY | Paid tools and editors | — |
| ED3 | Scoring rubric for the versions | CLAUDE-CAN-DO | None | Write a scorecard sheet with the TODO's twelve criteria |
| ED4 | Select the standard route | OWNER-ONLY | A decision after ED3 | — |
| ED5 | Document the fallback and overflow route | CLAUDE-CAN-DO | None | Draft it, with the decision points left open |
| ED6 | Test human capacity only where needed | DEFER | Conditional | — |
| ED7 | Acceptable, premium and reject examples | OWNER-ONLY | Needs ED2 outputs | — |
| ED8 | File handoff, naming, storage, revision workflow | CLAUDE-CAN-DO | The app's storage, versions and approvals (FILE-02, DEL-02, CX-06) are the basis | Write the SOP from the app's actual behaviour |
| ED9 | No native video editor | DEFER | Explicit | — |
| ED10 | No permanent price for heavy editing | DEFER | SALES_CALL_GUIDE line 202 | — |

## 15. P1: commercial and Client #1 readiness

| ID | Item | Class | Evidence | Next action |
| --- | --- | --- | --- | --- |
| CM1 | Client #1 minimum viable method | CLAUDE-CAN-DO | Spread across FIRST_PERIOD_ROADMAP and SALES_CALL_GUIDE §8; no one-page method | Write one page: Diagnose → … → Improve, mapped to app routes |
| CM2 | Scope, exclusions, about 12–16 assets | DONE-IN-ASSETS | `sprint/contracts/ORDER_FORM_SOW.md` line 93; SALES_CALL_GUIDE line 195 | Owner review |
| CM3 | Founding price hypothesis; no public pricing | OWNER-ONLY | D-01; ENG-02 has it in code (£10,000) | Approve D-01 |
| CM4 | Controllable risk reversal | OWNER-ONLY | Wording drafted (SALES_CALL_GUIDE lines 201 and 256; MSA) | Owner decides |
| CM5 | One-page offer and qualification scorecard | DONE-IN-ASSETS | `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_*` updated to four-week wording (INVENTORY §C) | Owner review |
| CM6 | Installation-led first-touch variant | CLAUDE-CAN-DO | Not drafted | Draft variant B with Day-7 deliverables and the full 12-week terms beside variant A, and a logging plan |
| CM7 | Proposal, SOW/order form and agreement | CLAUDE-CAN-DO | MSA, SOW, DPA outline and README exist in `sprint/contracts/`. **There is no proposal template** | Write `PROPOSAL_TEMPLATE.md` |
| CM8 | Solicitor review before real data | OWNER-ONLY | — | Engage a solicitor with `sprint/contracts/` |
| CM9 | Entity, company number, address, privacy contact, retention, ICO, cookie | OWNER-ONLY | D-09, D-03, ATT-02 | — |
| CM10 | PI and cyber insurance, Cyber Essentials | OWNER-ONLY | Money | — |
| CM11 | Test a manual invoice and payment route | DONE-IN-CODE | BIL-01 (journey 8); `sprint/contracts/INVOICE_TEMPLATE.html` | Owner adds bank details; a live invoice after the database |
| CM12 | Commercial booking questions and reminder sequence | CLAUDE-CAN-DO | D-02 proposes a 45-minute Diagnosis event; no booking questions are drafted anywhere | Draft the questions plus reminder and no-show copy for the owner to paste into Calendly |
| CM13 | Onboarding link, intake, workspace, kickoff | DONE-IN-CODE | COM-03, `suite-onboarding`, `onboarding/KICKOFF_AGENDA.md` | — |
| CM14 | Verify the Day-7 installation plan | OWNER-ONLY | ENG-03 in code; verification is dry-run step 6 | — |
| CM15 | Rehearse the 3–5-minute demo | OWNER-ONLY | SALES_CALL_GUIDE §8 demo map | Claude can seed a demo workspace |
| CM16 | Approved sales language kept verbatim | DONE-IN-CODE | LP-08 `canonical-library.test.ts`; 31/31 exact | — |
| CM17 | Objection material, including in-housing and heavy editing | DONE-IN-ASSETS | `LIVE_CALL_ONE_PAGER.md` line 22; SALES_CALL_GUIDE §10 and lines 202–204 | Owner review |
| CM18 | Every call exits into one of five outcomes, with VOC and a dated next action | CLAUDE-CAN-DO | The five-outcome enum is enforced (`recordCallOutcomeAction`). **VOC, next action and due date are optional** (`acquisition.ts` lines 559–569) | Make them required for attended calls, with a test (30 min) |

## 16. P2: execute Client #1 and create proof (all DEFER: blocked until Client #1 signs)

| ID | Item | Class | Tooling already in code |
| --- | --- | --- | --- |
| X1 | Day-0 baseline over 30–90 days | DEFER | ATT-03 baselines |
| X2 | Label baseline fields measured, reported or unavailable | DEFER | ATT-01 evidence classes |
| X3 | Founder and client time, approval burden | DEFER | CX-08 EffortEntry |
| X4 | Persistent asset IDs and tracked destinations | DEFER | ContentRoot and TrackedLink |
| X5 | Weekly commercial-signal capture | DEFER | CommercialEvent, manual entry (INT-08) |
| X6 | Preserve evidence classes; no causality claims | DEFER | ATT-01 |
| X7 | Four-week ACTION → RESULTS → PROBLEMS → FUTURE review | DEFER | REP-02 |
| X8 | Believed, happened, failed, changed, next | DEFER | REP-02, LRN-01 |
| X9 | Delivery load, margin, revisions | DEFER | CAP-01, DEL-06 |
| X10 | Optional success interview with permission | DEFER | PRF-01, SOP 04 ask |
| X11 | Proof assets from one verified record | DEFER | PRF-01 placements; graphic 14 |
| X12 | Adjust cadence, price and staffing from Clients 1–3 | DEFER | — |

## 17. Explicitly defer until earned

DF1–DF13 are all **DEFER**, exactly as the TODO says:
- Smartlead
- paid acquisition
- revenue share
- billing software
- fine-tuning
- video editor
- newsletter as a standard deliverable
- partner infrastructure
- broad competitor expansion
- SEO library
- founder-time claims
- extra integrations
- rebuilding the OS

**Caveat on "extra integrations":** Facebook and Threads connectors were built anyway under the "Current scope override" (INT-06). That is consistent with the override, but not with this defer line.

---

## 18. Summary

### Counts (215 lines)

| Class | Count |
| --- | --- |
| DONE-IN-CODE | 51 |
| DONE-IN-ASSETS | 18 |
| CLAUDE-CAN-DO | 41 |
| OWNER-ONLY | 58 |
| EXTERNAL-GATE | 7 |
| DEFER | 39 (12 of them only until Client #1 signs) |
| OBSOLETE | 1 |

**69 of 215 lines (32%) are done** in code or assets but still unticked in the Drive TODO. Nothing is LIVE_VERIFIED: every DONE-IN-CODE row is simulated until the owner completes OAC §0–5.

### CLAUDE-CAN-DO, in order (grouped, with effort)

**1. Acquisition unblockers (about 9 h)**

| # | Work | Effort |
| --- | --- | --- |
| 1 | A7: one-page pre-completed assets for the A-tier rows of `prospects.csv` | 3–4 h |
| 2 | CM12: Diagnosis-call booking questions, plus reminder and no-show copy | 45 min |
| 3 | A10, A18, A13, CM18: schema and actions. Add `messageVersion` and reply class on the touch, `problemEnergy` and `awarenessState` on the interview, and cash, acquisition hours and CAC on the scoreboard; make VOC and a dated next action required. Migrations and tests included | 4 h |

**2. Content pre-review (about 7 h).** This makes the owner's review of the Drive pack quick (C12).

| # | Work | Effort |
| --- | --- | --- |
| 4 | One tagged register of all 66 pack items (C10, C14, C8/TC1, C17, C7), scored on the four-part gate (C15) and the anti-slop gate (C16/TC4), with an approve/rewrite/reject recommendation for each | 5 h |
| 5 | Three-second profile test (TC5/C18) on the frozen site (report only) and on the `PROFILES.md` drafts | 1 h |

**3. Commercial documents (about 8 h)**

| # | Work | Effort |
| --- | --- | --- |
| 6 | CM7: proposal template | 2 h |
| 7 | CM6: installation-led variant | 1 h |
| 8 | TC3: Threadline Proof Bank and Claims Register | 1.5 h |
| 9 | TC2/C9: Brand Brain template gap map | 1.5 h |
| 10 | TC9: case-study template | 1 h |
| 11 | CM1: minimum-viable-method page | 45 min |

**4. Verification on local PostgreSQL (about 13 h)**

| # | Work | Effort |
| --- | --- | --- |
| 12 | B5: run `qa:public`, `qa:browser`, `qa:perf`, `qa:vitals` and `qa:visual:compare`; D5: Recording Room, teleprompter, fullscreen and print test | 2 h |
| 13 | D7: ROOT_ID lineage test; D9: owner, next action and due-date enforcement audit | 3 h |
| 14 | D1: synthetic walkthrough with screenshots; N3/J4: incident-response tabletop | 4.5 h |
| 15 | F5: accessibility and functional sweep (report only) | 2 h |
| — | TC6: mine call VOC and objections into ideas | 1.5 h |

**5. Documentation hygiene (about 3.5 h)**

| # | Work | Effort |
| --- | --- | --- |
| 16 | B13: defect register | 1.5 h |
| 17 | B15: fix the stale FINAL audit §6, §8 and §9; draft a replacement master TODO for the owner to upload | 2 h |

**6. Longer or lower priority**

| # | Work | Effort |
| --- | --- | --- |
| 18 | TC10, AG1, AG2: agent register | 1.5 h |
| 19 | ED3, ED5, ED8: editing scorecard, fallback route and handoff SOP | 2.5 h |
| 20 | R5/AG3: 100–300-item wedge corpus from public data | 1–2 days |

**Total without the corpus: about 45 hours.**

### OWNER-ONLY morning checklist, ordered by what it unblocks

1. **Vercel isolation (5 min).** Retire `threadlinex` (D-04: Settings → Git → Disconnect), and set `DEPLOYMENT_ROLE=primary` on `threadline`.
2. **Database (30 min).** Neon (EU) → `DATABASE_URL` and `DIRECT_URL` → `prisma migrate deploy` → PITR 7 days → `npm run owner:create` (ACTIVATION_RUNBOOK §1).
   - Unblocks: N2, B7, J2, CP3, the live F4 check, the live smoke tests, the dry run, and the verbatim-library import in `/admin/scripts`.
3. **Keys (15 min).** Set `CREDENTIAL_ENCRYPTION_KEYS` and `CRON_SECRET`, then enrol your own two-factor. Unblocks J4 and J7.
4. **Email (30 min).** Resend domain and key, `EMAIL_FROM`, `OPS_NOTIFY_EMAIL`, and the Resend webhook secret. Unblocks N5 and J6.
5. **Files (20 min).** R2 private bucket with CORS (expose `ETag`). Unblocks J3.
6. **Domain (15 min, D-02).** Add `threadlinehq.com` and `www` to `threadline`, and create the Namecheap A/CNAME records (keep the MX, SPF, DKIM and DMARC).
   - Unblocks: F3, CP4, the content CTAs, profile links, signatures and the email trust layer.
7. **Booking.** Copy the research Calendly link into the placeholders; create the "Diagnosis call" event and set `NEXT_PUBLIC_BOOKING_URL`; test a research booking end to end (A5).
8. **Decisions (one sitting).**

   | Decision | What it unblocks |
   | --- | --- |
   | D-05: employer clearance (C1) | Sending, the LinkedIn page and library A |
   | D-01: offer and 14-day terms (CM3) | — |
   | D-09: legal entity and address (F2, CM9) | Commercial email and contracts |
   | D-03: RPO/RTO and retention | — |
   | D-07: support times | — |
   | Cookie basis and ICO fee | — |
   | Risk reversal (CM4) | — |
   | 15 → 20-minute wording | — |

9. **Attio.** Create the API key, then import `sprint/prospects/prospects.csv`, adding an owner column (A1, N10).
10. **Reviews.** Work through `REVIEW_INDEX.md` (L6), the content pack (C12, after Claude's pre-scoring) and the sprint emails and contracts. Keep the P-01 evidence on file privately (CP2/F1).
11. **Solicitor and insurance (CM8, CM10).** Send `sprint/contracts/`.
12. **Owner dry run** after steps 2–5 (N7, N9, D15–D17, CM14). Record the results in `DRY_RUN_RESULTS_<date>.md`.
13. **Advisory keys.** Upstash, error DSN, and an Anthropic key with a spend limit (E10).
14. **Acquisition.** Rehearse the research call (A8), send the first invitations (A9), then 5–10 touches a day (A11, A12), then interviews (A16, A19).
15. **Social.** Handles, 2FA and the register (C2, C5); the LinkedIn page after D-05 (C3); publishing (C19–C21).
16. **Later.** Platform apps (E2, E3, E9, E11) and the editing benchmark (ED1, ED2, ED4, ED7).

## 19. Contradictions and stale items in the TODO itself

1. **The launch-pack section is stale.** It calls the brand kit and newsletter graphics "not located", and onboarding, call scripts and emails "[~]". All of them now exist in `docs/launch-pack/` and in the Drive folder `14Yn_BrojRjwJcEz9va-EHM8PXjUY1Sff`, awaiting owner review.
2. **The "Local repository check (26 Sept)" paragraph is obsolete.** It describes checkout `ea12201`: SQLite, 77 models, "175 actions", dependencies absent. The current `main` is `a6c0ad5`: PostgreSQL, 114 models, 824 unit tests. The 77 and 175 counts also appear in P0 as unverified handoff numbers.
3. **Many items are done but unticked.** These include Next-10 items 1, 3, 4 and 6; 11 of 15 P0 build-state items; and most P1 verification items. Only configuration and the owner's own actions remain.
4. **The code is complete, but the TODO does not say so.**
   - The "7–10 focused working days" delivery estimate and the "backend … not yet a complete first-client journey" boundary are overtaken.
   - Per the ledger, no row is blocked by code. The blocker is configuration (OAC §0–5).
5. **The 502 line is wrong.** `threadlinehq.com` returns no web record rather than a 502 (DNS was never pointed at Vercel).
   - The TODO also never mentions the second deployment, `threadlinex` (D-04).
6. **Proof claims.** The TODO says to "substantiate or remove" the claims three times (CP2, F1, next-10 item 8). The owner has since decided the proof band stays and the frontend is frozen (CLAIMS_AUDIT P-01, O-01 closed). The live action is private substantiation, not removal.
7. **The frontend freeze hides other public-copy conflicts the TODO does not list** (CLAIMS_AUDIT, reported only):
   - T-07: "Engagements run month to month" contradicts the 12-week initial engagement in four-week periods. This is the **"monthly" conflict**.
   - T-01 to T-04: "about twenty minutes of recording a week" breaks the founder-hours claim ban.
   - T-06: "10 to 14 days" onboarding contradicts the Day-7 aim.
   - C-02: IP ownership.

   The TODO's own wording is four-week throughout (lines 329–333) apart from the "300-post/month" do-not-copy note.
8. **15 versus 20 minutes.** The TODO correctly records the 20-minute Calendly event (lines 51 and 218). The canonical playbook's verbatim script still asks for "15 minutes" (K-05, T-11). Resolved 28 Sept 2026: the owner chose 20 minutes everywhere.
9. **Scope override versus deferrals.**
   - Line 23 says the advanced backend stays in scope without a cut-off. Line 63, J10 and DF12 say OAuth, auto-publishing and extra integrations are not launch gates.
   - Both are now true: the connectors are built but gated.
   - P2's heading "deferred from Client #1" and D-08 (defer providers) conflict with the Bright Data and Metricool tests being listed as open work.
10. **Duplicates inflate the count.**
    - Next-10 repeats P0 and P1: N2 = J2 = B7; N5 ≈ J6 + J7; N7 = J9 + dry run.
    - The transcript controls repeat the content list: TC1 = C8; TC4 = C16; TC5 = C18; TC6 = C22; TC7 = C23; TC2/TC3 = C9.
11. **Dates in the header are inconsistent.** The filename says 2026-09-21, the audit date 24 Sept, and "last reconciled" 26 Sept.
12. **Repository documents contradict each other** (not the TODO, but the TODO relies on them).
    - `FINAL_BACKEND_IMPLEMENTATION_AUDIT.md` §6, §8 and §9 still show 727 tests and 526 checks.
    - They list risks 4 and 5 (contractor scope, SSRF), which the ledger says are fixed (TEAM-09, SEC-10).
    - They list CX-08, FILE-02, FILE-05 and AI-06 as "missing", against its own §1 and the ledger. This is B15.
13. **Sprint status at the time of writing.**
    - Present: `sprint/` `ACTIVATION_RUNBOOK.md`, `contracts/` (5 files plus a preview), `emails/` (4), `prospects/` (README and a 68-row CSV), `social/` (3).
    - `stack/` exists but is empty. There is no `authority/` folder yet.
    - Earlier cross-references to `CALENDAR_14_DAYS.md` and `CONTRACTS_README.md` now resolve.
