# Defect and risk register (27 September 2026)

**What this is.** The single register of open defects and risks that the master TODO asks for ("one defect register with severity, owner, next action and due date"; TODO_AUDIT B13, J1). The 19 defects fixed during the backend build are not repeated here; they are listed in `docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md` §3.

**Sources:**
- `sprint/TODO_AUDIT.md`
- `docs/implementation/BACKEND_COMPLETION_LEDGER.md`
- `docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md` (§8, as corrected tonight)
- `claims/CLAIMS_AUDIT.md`
- `strategy/STRATEGY_RECONCILIATION.md` (K-rows)
- `onboarding/README.md` ("UI gaps found")
- `operations/USABILITY_VERIFICATION.md`
- a read of `src/` for BRAND_BRAIN_GAP_MAP and AGENT_REGISTER
- the uncommitted working tree
- a production smoke run on 26 September: `node scripts/ops/smoke-prod.mjs https://threadline-fawn.vercel.app https://threadlinex.vercel.app` → **6/10**. It returned health 503, `database:false`, `configErrors 5`, and cron 503 "CRON_SECRET is not configured"

`docs/launch-pack/operations/TOOL_AUDIT_2026-09-26.md` did **not exist** when this register was finished. Its findings should be added as `DR-T*` rows when it lands.

## Keys

| Key | Values |
| --- | --- |
| **Severity** | **S1**: blocks launch or first client. **S2**: must be fixed before real client data or first sends. **S3**: should be fixed in the four-week sprint. **S4**: low or cosmetic |
| **Owner** | **Owner** (the founder), **Claude** (the assistant), **External** (a platform or provider) |
| **Status** | Open · Fixed (uncommitted) · Fixed tonight · Reported only (frozen public copy) · Accepted risk · Deferred |
| **Due** | Sprint days: Day 1 = Sun 27 Sept, Day 2 = Mon 28 Sept, Day 3 = Tue 29 Sept, Day 4 = Wed 30 Sept. "Wk n" = week n of the four-week sprint |

---

## A. Production and configuration (live)

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-01 | Production has no database: health 503, `database:false` | S1 | Smoke 26 Sept; ledger INF-01 | Owner | Open | `sprint/ACTIVATION_RUNBOOK.md` §1: Neon (EU), `DATABASE_URL` / `DIRECT_URL`, `migrate deploy`, PITR of 7 days or more, `npm run owner:create` | Day 1 |
| DR-02 | 5 configuration errors on `/api/health` | S1 | Smoke 26 Sept | Owner | Open | Runbook §2–4. Recheck Admin → System afterwards | Day 1 |
| DR-03 | Cron returns 503 (`CRON_SECRET` not set), so no scheduled work runs | S1 | Smoke 26 Sept; JOB-01 | Owner | Open | Runbook §2: generate and set `CRON_SECRET`, then run `/api/cron/jobs` once from Vercel | Day 1 |
| DR-04 | Second deployment `threadlinex` serves the same commit (inert today). If it isn't isolated, secrets could reach a mirror | S2 | D-04; INF-05; smoke "mirror cron does not run jobs" passes | Owner | Open | Runbook §0: disconnect its Git (recommended), or set `DEPLOYMENT_ROLE=mirror`. Set `primary` on `threadline` | Day 1 |
| DR-05 | `threadlinehq.com` has **no web record** (it is not returning a 502). Content CTAs, signatures and profile links point at it | S1 (acquisition) | D-02; CLAIMS_AUDIT C-04; TODO_AUDIT CP4 | Owner | Open | Runbook §5: Vercel domains, then Namecheap A/CNAME. Keep MX, SPF, DKIM and DMARC. Set `NEXT_PUBLIC_APP_URL` | Day 1 |
| DR-06 | Email isn't configured: no application confirmations, invitations or report emails. Invitation links are shown on screen and must be sent by hand | S1 | COM-01, NOT-02; onboarding README gap 8 | Owner | Open | Runbook §3: Resend domain and key, `EMAIL_FROM`, `OPS_NOTIFY_EMAIL`, webhook secret | Day 1 |
| DR-07 | Two-factor can't be enrolled until `CREDENTIAL_ENCRYPTION_KEYS` is set. Staff two-factor is enforced in production | S1 | SEC-08; onboarding README gap 7 | Owner | Open | Runbook §2: set the key **before** the first staff sign-in, then enrol and save the recovery codes | Day 1 |
| DR-08 | Private object storage isn't configured, so direct uploads over 10 MB and signed reads can't work live | S2 | FILE-02, FILE-04 | Owner | Open | Runbook §4: R2 private bucket; CORS allowing PUT/GET and exposing `ETag` | Day 2 |
| DR-09 | **Nothing is LIVE_VERIFIED.** Every integration and journey is simulated (824 unit, 623 QA plus 2 gated, journeys 19/19 and 87/87) | S1 | Ledger; audit §8.1 | Owner, then Claude | Open | After DR-01…08: `npm run smoke:prod -- https://threadlinehq.com` (10/10), then the owner dry run (`operations/OWNER_DRY_RUN.md`) | Day 2–3 |
| DR-10 | Daily cron only (Hobby plan): a failed send, a due scheduled publish or a research run waits up to a day | S3 | Audit §8.3; INT-03 | Owner | Accepted risk | Decide: Vercel Pro, or an external scheduler calling `/api/cron/jobs` hourly. Not needed while publishing is manual | Wk 2 |
| DR-11 | No malware scanning of uploads until a processing worker is chosen (the scan states and quarantine are built) | S2 (before client uploads) | FILE-03, FILE-05; audit §8.4 | Owner | Open | Decide the processing worker (FILE-05), set `PROCESSING_SCAN=true`. Until then, accept only known client files | Before Client #1 data |
| DR-12 | Vercel env vars can't be set by the assistant (403) | S4 | TODO_AUDIT production facts | Owner | Accepted | The owner sets every variable; nothing secret goes in a document or chat | — |
| DR-13 | Hobby deployment quota is 100 a day | S4 | Runbook; memory | Owner | Accepted | Batch the variable changes and redeploy once | — |
| DR-14 | Upstash (shared rate limits) and the error DSN (Sentry) aren't set. Rate limits are per instance, and errors reach nobody | S3 | INF-07, INF-10; runbook §6 | Owner | Open | Runbook §6 | Wk 1 |
| DR-15 | AI cost is recorded as unknown: `AI_PRICE_INPUT_PER_MTOK` / `AI_PRICE_OUTPUT_PER_MTOK` aren't set | S4 | `ai/cost.ts`; AGENT_REGISTER | Owner | Open | Set both when adding `ANTHROPIC_API_KEY` with a console spend limit (E10) | With the AI key |

## B. Security and platform risks (accepted or external)

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-16 | CSP allows inline scripts (Next.js App Router without nonces) | S3 | Audit §8.2; SEC-04 | Claude | Accepted risk | Revisit a nonce-based CSP only if the owner lifts the frontend freeze. Other directives block third-party scripts and framing | Deferred |
| DR-17 | **Uncleared founder stories are treated as cleared.** Onboarding copies every founder story into `approvedAnecdotes` (`actions/onboarding.ts` line 171). When `approvedAnecdotes` is empty, `ai/context.ts` line 148 sends *all* `founder.stories` under the heading "Stories cleared for use" | S2 | Code read (BRAND_BRAIN_GAP_MAP) | Claude (fix); Owner (approve the behaviour change) | Open | Proposed fix: send no stories when none are cleared, or label them "not cleared: do not use"; have onboarding fill `stories` only. Add a test | Day 3 |
| DR-18 | `IcpProfile.demographics` can't be edited. It is in the schema, the action and the AI context, but the audience form has no input | S4 | `brand-brain-editor.tsx` audience form; `actions/workspace.ts` line 414 | Claude | Open | Add the textarea (portal only; not public) | Wk 1 |
| DR-19 | Banned topics and phrases to avoid are **prompt instructions only**, with no post-generation check. The client guide overstates this: "the system won't generate anything that touches them" | S3 | `ai/context.ts` line 302; `onboarding/BRAND_BRAIN_GUIDE.md` | Claude | Open | Either soften the guide wording (asset, not frozen), or add a post-generation check that flags banned terms before approval | Wk 1 |
| DR-20 | No command-line reseal command for key rotation (`resealCredential` exists) | S4 | SEC-11 | Claude | Open | Add `npm run keys:reseal` when a rotation is first needed | Deferred |
| DR-21 | The `AiGeneration.kind` schema comment lists 9 kinds. Code writes 15 (`mine`, `expectation`, `judge`, `corpus`, `lead_reply`, `review_draft` are missing) | S4 | `prisma/schema.prisma` line 1578; AGENT_REGISTER | Claude | Open | Update the comment. No migration needed | Wk 1 |
| DR-22 | Platform limitations: TikTok posts stay private until the app is audited; personal DMs have no authorised API; LinkedIn member impressions need the Marketing Developer Platform | S3 | Ledger "verified provider limitation"; INT-02/03/06 | External | Accepted | Manual publish (INT-04) and CSV metrics (INT-05) are the fallback. Submit the platform reviews in week 2 or later | Wk 2+ |
| DR-23 | No incident-response tabletop rehearsal is evidenced (the runbook exists) | S3 | TODO_AUDIT J4/N3; TECHNICAL_HANDOFF §9 | Claude, with Owner | Open | A 45-minute tabletop: a leaked key, a cross-tenant report, a bad deploy rollback. Record the results | Wk 1 |

## C. Uncommitted work in the tree (26 September)

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-24 | **Forms lost what the person typed on a validation error.** React 19 `action` reset every uncontrolled field, for example the demand-source select | S2 | `components/forms/action-form.tsx` diff (switched to `onSubmit`) | Claude | Fixed (uncommitted), in progress | See DR-25. Then run the unit and QA suites and commit | Day 1 |
| DR-25 | The same diff **leaves `console.warn("[af-debug] …")` debug logging in** (3 calls), and **now resets every form on success by default**. Edit forms (Brand Brain, offer, ICP, proof) may briefly show stale values if the reset runs before the revalidated data re-renders | S2 | `action-form.tsx` diff | Claude | Open | Remove the debug calls. Keep reset-on-success opt-in for edit forms, or verify in a browser that the Brand Brain editor shows the saved values after Save | Day 1 |
| DR-26 | Installation page was missing from the client sidebar (onboarding README gap 1) | S3 | `lib/navigation.ts` diff adds "Getting set up" | Claude | Fixed (uncommitted) | Commit with DR-24. This is the client portal, not the frozen public site | Day 1 |
| DR-27 | "Monthly strategy review" contradicted four-week periods (the diagnosis review is now every 28 days; the template says "Next period") | S3 | `domain/diagnosis.ts`, `templates/master.ts`, diagnosis pages diff | Claude | Fixed (uncommitted) | Commit; `diagnosis.test.ts` is updated | Day 1 |
| DR-28 | The onboarding page threw an error page for a teammate without `brain.edit` | S3 | `app/onboarding/[org]/page.tsx` diff (`requireOrgPage`) | Claude | Fixed (uncommitted) | Commit | Day 1 |
| DR-29 | `owner:create` and `smoke:prod` npm scripts, and `scripts/ops/*`, are uncommitted, but the runbook depends on them | S2 | `package.json` diff; untracked `scripts/ops/` | Claude | Fixed (uncommitted) | Commit before the owner runs the runbook, or the owner runs `npx tsx scripts/ops/create-owner.ts` directly | Day 1 |

## D. Documentation and planning

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-30 | FINAL audit §6, §8 and §9 contradicted the ledger (727/526 counts; risks 4 and 5 already fixed; "missing CX-08, FILE-02…") | S3 | TODO_AUDIT B15 | Claude | **Fixed tonight** (uncommitted) | The §1 checkpoint table still records 808 unit / 616 QA from its checkpoint (the current figures are 824 / 623, now noted in §6). Leave it, or align it on commit | Day 1 |
| DR-31 | The Drive master TODO is stale: the launch pack "not located", "502", "77 models / 175 actions", "7–10 working days", the SQLite checkout paragraph | S3 | TODO_AUDIT §19 | Owner | Open | Upload `sprint/ops/THREADLINE_MASTER_TODO_2026-09-27_PROPOSED.md` to Drive as a **new** file | Day 1 |
| DR-32 | Research call **15 vs 20 minutes**: the verbatim playbook script asks for 15; the live Calendly event is 20. Outreach isn't send-ready | S1 (sending) | K-05; CLAIMS_AUDIT T-11 | Owner | Open | The owner decides the wording (or changes the event), then updates the canonical SOP | Day 1 |
| DR-33 | Malformed question numbering in the research interview script (a source defect, copied exactly) | S4 | `sales/RESEARCH_INTERVIEW_SCRIPT.md` §2 | Owner | Open | The owner corrects it in the Drive source; Claude re-syncs | Wk 1 |
| DR-34 | The sample newsletter layout isn't inbox-tested | S4 | TODO_AUDIT L5 | Owner | Open | Send a test to Gmail and Outlook once Resend is live | Wk 2 |
| DR-35 | `prospects.csv` has no `owner` column; the TODO requires an owner on every prospect | S4 | TODO_AUDIT A2/A4 | Owner | Open | Add it on the Attio import | Day 2 |
| DR-36 | Facebook and Threads connectors were built under the scope override, contrary to the "extra integrations" defer line | S4 | TODO_AUDIT §17 caveat; INT-06 | Owner | Accepted | Information only. They are gated and not presented as live | — |

## E. Public copy (frontend frozen: reported only)

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-37 | "100m+ views / 10,000+ conversions" proof band | S2 | CLAIMS_AUDIT P-01; O-01 closed | Owner | Reported only (kept by owner decision) | Keep the source, timeframe and definition on file privately | Wk 1 |
| DR-38 | "Engagements run month to month" contradicts the 12-week initial engagement in four-week periods (the **monthly conflict**) | S2 | CLAIMS_AUDIT T-07; K-01 | Owner | Reported only | The owner decides whether to lift the freeze for this legal or commercial correction. Contracts state the real terms | Before first proposal |
| DR-39 | "About twenty minutes of recording a week" breaks the no founder-hours claim rule | S3 | T-01…T-04 | Owner | Reported only | As DR-38 | Owner decision |
| DR-40 | "Onboarding takes 10 to 14 days" contradicts the Day-7 installation aim | S3 | T-06 | Owner | Reported only | As DR-38 | Owner decision |
| DR-41 | "Who owns the content? You do." is subject to a solicitor's review of IP | S2 | C-02 | Owner | Reported only | Resolve in the solicitor review (CM8); the public wording then follows | Before Client #1 |
| DR-42 | "…one conversation a month pays for itself" reads as an outcome claim | S3 | C-01 | Owner | Reported only | As DR-38 | Owner decision |
| DR-43 | Legal pages: entity, company number, address, privacy contact and retention are hidden until provided. The ICO fee is unchecked. The tracked-link cookie basis is undecided (`tl_v` fails closed, so no cookie is set meanwhile) | S2 | D-09, D-03, ATT-02; OAC §9 | Owner | Open | Supply the details; Claude fills them in (a permitted legal correction) | Before first commercial email |

## F. Onboarding and portal gaps (from `onboarding/README.md` and the TODO audit)

| ID | Defect / risk | Sev | Evidence | Owner | Status | Next action | Due |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DR-44 | No in-app pre-flight checklist per recording session; Router presets aren't modelled | S4 | Onboarding README gap 3 | Claude | Deferred | The guide covers it; build after Client #1 if used | After Client #1 |
| DR-45 | Support requests have no named owner, SLA or response-time field; the FAQ has `{{placeholders}}` | S3 | Gap 4; D-07 | Owner (D-07), then Claude | Open | Decide D-07; Claude fills in the FAQ and escalation guide | Day 1 decision |
| DR-46 | Retention period not approved (the offboarding default is a 30-day export, then 90 days) | S2 | Gap 5; D-03; INF-09, PRV-01 | Owner | Open | Decide D-03 (option B / option 2 recommended) | Day 1 decision |
| DR-47 | The export excludes file binaries (they are listed; download them one by one from the Library) | S3 | Gap 6; FILE-06 | Claude | Open | Keep the offboarding copy accurate. Build a bundled export after Client #1 if requested | After Client #1 |
| DR-48 | Fields the TODO requires are missing: message version and reply class on `ProspectTouch` (A10); `problemEnergy` and `awarenessState` on `ValidationConversation` (A18); cash, acquisition hours and CAC on the scoreboard (A13) | S3 | TODO_AUDIT | Claude | Open | Migration, UI and tests (about 4 h) | Wk 1 |
| DR-49 | VOC, next action and due date are optional on attended calls; the TODO requires them | S3 | `acquisition.ts` lines 559–569; CM18 | Claude | Open | Make them required for attended outcomes, with a test (30 min) | Wk 1 |
| DR-50 | "Every active record requires owner, next action and due date" isn't verified per model | S3 | TODO_AUDIT D9 | Claude | Open | Audit enforcement per model; add validation where it is missing | Wk 1 |
| DR-51 | No end-to-end ROOT_ID lineage test through package, publish and metrics | S3 | TODO_AUDIT D7 | Claude | Open | Write the lineage test | Wk 1 |
| DR-52 | No current results for `qa:public`, `qa:browser`, `qa:perf`, `qa:vitals` or `qa:visual:compare`; no accessibility sweep; the Recording Room modes are untested | S3 | TODO_AUDIT B5, F5, D5 | Claude | Open | Run them on a local production build and record the results. Report only for public routes (frozen) | Wk 1 |
| DR-53 | Sales-call VOC and objections aren't mined into ideas | S3 | TODO_AUDIT TC6; AGENT_REGISTER | Claude | Open | Add a mining job and a weekly SOP step | Wk 2 |

---

## Counts

| Severity | Open | Fixed or fixed-uncommitted | Accepted, reported or deferred |
| --- | --- | --- | --- |
| S1 | 8 (DR-01, 02, 03, 05, 06, 07, 09, 32) | 0 | 0 |
| S2 | 7 (DR-04, 08, 11, 17, 25, 43, 46) | 2 (DR-24, 29) | 3 (DR-37, 38, 41) |
| S3 | 12 | 4 (DR-26, 27, 28, 30) | 6 |
| S4 | 7 | 0 | 4 |

53 rows in total.

**Every S1 item is owner configuration or an owner decision.** None needs new code.
