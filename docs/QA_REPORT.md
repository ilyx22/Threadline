# Threadline OS — Exhaustive QA / Verification Report

Date: 8 September 2026 · Branch: `master` · Database: SQLite dev (`prisma/dev.db`, 12 migrations, schema up to date)

Every verdict below was produced by running the feature, not by reading it. The harness lives in `scripts/qa/` and every number here can be regenerated with the commands in §11.

---

## 1. Executive verdict

**Does Threadline actually work? — MOSTLY, and the core spine works end to end.**

- The core learning loop — client created → onboarding → research run → signal → idea → script (fact-check gate) → frozen Judge expectation → recording → editing → approval → publish → tracked click → buyer-named event → performance → diagnosis → correction → retest → verdict → weekly report → trajectory — ran three times through the real server actions (happy path, bad outcome, text-led) with **0 failures** after fixes.
- Tenancy, roles and auth hold under 57 cross-tenant read/write attacks, IDOR and route substitution: **0 leaks**.
- **495 in-process checks: 480 PASS, 2 PASS WITH EXTERNAL GATE, 10 PARTIAL, 0 FAIL, 3 N/A.** Plus 8/8 performance smoke checks and a production-build browser sweep at 1440/1024/768/390 with **no runtime errors, no hydration errors, no layout overflow** on any of 33 routes.
- 11 defects were found and fixed during the pass (2 × P1, 5 × P2, 4 × P3), each with a regression check that now passes.
- "MOSTLY" rather than "YES" because several brief items are **not built** (testimonial permission, discovery economics fields, verbatim sales scripts, email delivery, background jobs, object storage, live platform/analytics adapters) and three product gaps remain open as P2/P3 (weekly report lacks the §33 sections; a text-led piece still receives a "Record:" task; a client's first pieces cannot be banded against their own history until three exist). None of these blocks a first client; all are listed in §12.

## 2. Coverage

| Layer | How it was tested | Checks |
|---|---|---|
| Server actions, guards, domain rules, data layer | In-process harness (`scripts/qa/*.ts`) driving the real actions with real DB sessions | 495 |
| Three complete synthetic engagements | `suite-core-spine.ts` (Meridian Forecasting / Halden Compliance / Orrin Legal, all `@example.test`) | 110 of the 495 |
| Rendered UI, responsive, accessibility, runtime errors | Headless Chrome over CDP against `next build && next start` (`browser-qa.ts`) | 33 routes × 4 widths + keyboard |
| Performance | `perf-smoke.ts`: 20 clients through `createClientAction`, timed reads, 10 concurrent dashboards | 8 |
| Static | typecheck · lint · 100+ unit tests · `verify:features` (77) · `verify-routes` (29) · production build · migrate status | all green |

Not tested (no real path exists yet, see §12): email sending, scheduled jobs, object storage, live OAuth token exchange against a real provider, real-model AI output (demo provider only — `ANTHROPIC_API_KEY` is the external gate).

## 3. Master matrix (in-process)

| Area | Pass | Ext | Partial | Fail | N/A | Verdict |
|---|---:|---:|---:|---:|---:|---|
| tenancy:read / tenancy:write | 57 | 0 | 0 | 0 | 0 | PASS |
| roles · auth · visibility | 28 | 0 | 0 | 0 | 0 | PASS |
| gate:factcheck · gate:stages · gate:approval · gate:publish · gate:ideas · gate:run | 46 | 0 | 0 | 0 | 0 | PASS |
| diagnosis (cases A–G) · expectation · correction · lineage · velocity | 32 | 1 | 0 | 0 | 0 | PASS WITH EXTERNAL GATE (Case D: ICP relevance unobservable without analytics scopes) |
| corpus (ladder, capture, rating, outlier) · judge · judge:action · calibration | 30+ | 0 | 0 | 0 | 0 | PASS |
| attribution (links, redirect, model, coverage, events, journey) · synthetic | 40 | 0 | 1 | 0 | 0 | PARTIAL (duplicate-deal dedupe unmeasurable: inquiry has no visitor) |
| hostile input (text, numbers, ids, enums, comments, inquiries) · files · files:route | 34 | 0 | 1 | 0 | 0 | PARTIAL (decimal score accepted) |
| concurrency | — | — | 1 | 0 | 0 | PARTIAL (double-submit idea creates two rows; approval race fixed) |
| onboarding · onboarding:effects · brandbrain · readiness · packaging | 35 | 1 | 1 | 0 | 1 | PARTIAL (voice step has no banned-phrase field; testimonial permission not built) |
| sales · sales:access · validation · acquisition · delivery | 31 | 0 | 2 | 0 | 2 | PARTIAL (SOP checklist not attached to prospect; delivery-load aggregation view absent; economics/scripts not built) |
| reports · periods · cadence | 21 | 0 | 2 | 0 | 0 | PARTIAL (§33 sections; print/export verified only as stylesheet) |
| spine:happy · spine:bad · spine:text · spine:isolation | 110 | 0 | 2 | 0 | 0 | PARTIAL (text-led "Record:" task; bad-week report shows the miss but no learning because the diagnosis was made after that week) |
| **Total** | **480** | **2** | **10** | **0** | **3** | |

## 4. Core-spine result (three synthetic engagements)

All three tenants were created by the operator through `createClientAction`, the founder logged in with the issued password (wrong password refused), completed onboarding through the real steps, and the workspace was built (offer row + Brand Brain populated, banned phrase carried).

| Step | Meridian (happy) | Halden (bad outcome) | Orrin (text-led) |
|---|---|---|---|
| Recording readiness | submitted → assessed ready | submitted → assessed ready | none required, nothing downstream demanded one |
| Research run → signal → idea | 1 customer-language signal approved, promoted with lineage | same | same; idea reformatted to `text_post` |
| Script | demo-generated, parked in `needs_fact_check`; unverified claim **blocked** ready_to_record; verified → approved by founder | same | same (list script) |
| Judge expectation | frozen on script and content, `calibrated:false`, byte-identical after diagnosis | same | same |
| Production | raw → recorded (task closed, second click refused) → editing → review → changes requested (note required) → editing → review → approved | same | same, but a "Record:" task was created for a text post (P3) |
| Publish | draft → ready → published (URL required) → content live | same | same |
| Attribution | click recorded via `/t/<slug>`; founder logs inquiry; founder **cannot** self-declare a class; operator records buyer-named call | click only — nobody came | as happy |
| Performance → diagnosis | 9.8k views + buyer-named call → `none`, thesis preserved | 140 views, 18% retention → `retention_structure`; approved; correction recorded; retest (9.8k views + call) → `none`; verdict "worked"; second verdict **refused** (QA-009) | 9.8k views, no retention data → `none`, never blames retention |
| Weekly report | shipped=1, no overclaim, finalised, frozen | shipped=1 that week, miss listed | as happy |
| Trajectory | published 1 · diagnosed 1 | published 2 · diagnosed 2 · corrections 1 · worked 1 | published 1 · diagnosed 1 |
| Isolation | Meridian's founder cannot diagnose, move or finalise anything of Halden's; ROOT listings per tenant | | |

Clock note: the diagnosis engine correctly refuses to read a piece younger than 14 days. The harness backdates publish timestamps (the only direct writes it makes, documented in the suite header); no gate or guard is bypassed.

## 5. Defects found and fixed (all with regression checks that now pass)

| ID | Sev | Where | What was wrong | Fix | Regression |
|---|---|---|---|---|---|
| QA-001 | P1 | `actions/auth.ts` login `next` | Open redirect: `//evil`, `/\evil`, scheme-prefixed and over-long paths accepted | `security/safe-path.ts` (`safePath`) | `safe-path.test.ts`, tenancy suite auth block |
| QA-002 | P1 | `integrations/oauth.ts` `safeReturnTo` | Same class; over-long path truncated instead of refused | delegates to `safePath`, returns null | `oauth.test.ts` |
| QA-005 | P1 | `actions/attribution.ts` | A commercial event could be recorded as `directly_tracked` / `buyer_named` with no visitor / inquiry to support it | `assertEvidenceSupportable()` before insert | `attribution.test.ts`, attribution suite |
| QA-008 | P1 | `actions/reports.ts` | Generating a report for a period with a **final** report overwrote the frozen payload | refuses with workflow error | reports suite "generating again refuses…" |
| CONC-APPROVE | P2 | `actions/content.ts` `moveContentAction` | Two concurrent approvals both succeeded (double stage-change events) | `updateMany` guarded by current stage; second returns "Already moved." | workflow suite double-click race |
| QA-003 | P2 | `data/content-learning.ts` | Traceable-attribution set duplicated/inconsistent between modules | single exported `TRACEABLE_ATTRIBUTION` | `content-learning.test.ts` |
| QA-004 | P2 | `domain/corpus.ts` `readOutlier` | A piece with 0 views was banded rather than marked unknown | early return `unknown` with reason | `corpus.test.ts` |
| QA-006 | P2 | `actions/onboarding.ts` | Unknown step key accepted and persisted | validated against `ONBOARDING_STEPS` | onboarding suite |
| QA-009 | P2 | `actions/learning.ts` `recordCorrectionVerdictAction` | A recorded verdict could be silently flipped, corrupting learning velocity | write-once; refuses with workflow error | spine suite "second verdict cannot flip" |
| SYNTH-LOCK | P2 | `actions/proof.ts` | A synthetic workspace could lock a proof period | `assertNotSyntheticProof` | attribution suite synthetic block |
| QA-007 | P3 | `actions/workspace.ts` | Invalid website string stored raw | `cleanUrl` or empty | onboarding suite |
| CADENCE | P3 | forms, calculator, onboarding, `templates/master.ts` | "per month" / "monthly fee" wording for the four-week service period | reworded; repo sweep in reports suite | reports suite cadence sweep (excludes comments/tests) |
| QA-010 | P3 | `components/app/topbar.tsx` | Second `<h1>` on every app page (breadcrumb) | `<p>` | browser sweep (one h1 per page) |
| QA-011 | P3 | `admin/metrics/funnel-panel.tsx` | Two unlabelled number inputs | `htmlFor`/`id` | browser sweep |

## 6. Security

- Auth: anonymous, expired and malformed cookies refused on every protected action; rate limit engages; login enumeration-safe; disabled user refused; redirect targets sanitised (QA-001/002).
- Tenancy: 27 scoped reads and 30 write attacks (IDOR ids, route-slug substitution, cross-org attachments) all refused; visitor identity scoped per org; tracked-link destinations refuse `javascript:`, `data:`, credentials-in-URL and Threadline's own login/admin routes.
- Files: upload path traversal/size/type refused; file route 401/403/200/404 correct.
- Credentials: AES-256-GCM keyring (`CREDENTIAL_ENCRYPTION_KEYS`) verified by unit tests; OAuth state single-use; no token logged.
- Synthetic safety: synthetic workspaces excluded from portfolio proof and cannot lock proof periods.

## 7. AI / Judge

Demo provider throughout (no `ANTHROPIC_API_KEY`). Judge: arithmetic is ours, rubric v0.1, `calibrated:false` on every expectation, expectations immutable (byte-compared after approval), gated on missing subject. Calibration cases and the corpus ladder (creator_format/creator/cohort/platform/none with minimums 3/3/5/8) pass on persisted rows. Real-model output quality is an **external gate**.

## 8. Diagnosis cases A–G

All seven cases pass on persisted data through `diagnoseContentAction` (Case D = PASS WITH EXTERNAL GATE: "viral, wrong audience" is reported as `mixed`, never as a commercial winner, because ICP relevance is unobservable without analytics scopes). Expected-vs-actual is frozen; corrections keep chronology; improving / flat / declining / missing-period trajectories read correctly and are never softened.

## 9. Integrations

| Provider | Status |
|---|---|
| OAuth (LinkedIn, YouTube, Meta, TikTok, X) | state/return-path/encryption verified; token exchange **external gate** (needs real client credentials) |
| Analytics ingestion | adapters report `unavailable` honestly; manual snapshot path verified |
| CRM | manual inquiry path verified; adapters need credentials |
| Booking | URL only |
| Email, jobs, object storage | **not built** |

## 10. Responsive / accessibility / performance

- Production build, headless Chrome, 33 routes × {1440, 1024, 768, 390} + keyboard: **92 PASS, 30 PARTIAL (29 are the 24px-target note at 390px, 1 is the pipeline scrollWidth note), 0 FAIL — 0 runtime exceptions, 0 hydration errors, 0 Next error overlays, 0 failed page loads, 0 horizontal overflow** (one route, `/pipeline` at 1024, reports `documentElement.scrollWidth` 40px over the viewport with no element, layout box or text past the edge; screenshot verified clean — noted, not counted).
- Mobile (390): hamburger navigation, stacked cards, kanban scrolls inside its own container (screenshots in `scripts/qa/.shots/`).
- Keyboard: Tab reaches real controls with a visible focus ring on the dashboard and production board.
- Remaining a11y notes (P3): many inline text links and the logo link are under the 24px target minimum (WCAG 2.5.8) at 390px; no skip link.
- Dev-server only: intermittent `SyntaxError: Unexpected end of JSON input` → 500 after HMR recompiles under concurrent navigation. Not reproducible on the production build; not an application defect.
- Performance (20 extra clients, 24 orgs total): create p50 77ms / max 632ms; `listClients` 141ms; `portfolioSummary` 15ms; `cockpit` 17ms; per-client dashboard ≤31ms; 10 concurrent dashboard loads 108ms. Note: the master template seeds structure, not content — see §12.

## 11. Verification commands

```
npm run typecheck && npm run lint && npm test && npm run verify:features   # all green
npm run build                                                              # green
npx prisma migrate status                                                  # up to date
npm run qa:all        # 495 in-process checks, master matrix, non-zero exit on FAIL
npm run qa:spine      # three synthetic engagements only (add --keep to inspect tenants)
npm run qa:perf       # 20-client performance smoke
npm run build && npm start &  npm run qa:browser   # responsive/a11y/runtime sweep (headless Chrome)
```

## 12. Remaining defects and gaps (none P0/P1)

| Sev | Item | Note |
|---|---|---|
| P2 | Weekly report lacks the brief §33 sections (what we learned / expected vs actual / weakest link / data limitations / next test) | payload has shipped/performance/wins/misses/learnings/nextWeek; the learning data exists (diagnoses, corrections) but is not rendered into the report |
| P2 | Diagnosis band is `unknown` for a client's first pieces | own-history baseline needs 3 comparable pieces and the corpus cohort baseline is not passed into `actualForContent`; retention/engagement/qualified-action branches still name causes |
| P3 | Text-led pieces receive a "Record:" task and pass through the recording stage | wording/skip for `text_post` format |
| P3 | Double-submit of "create idea" makes two rows | no idempotency key |
| P3 | Onboarding voice step has no banned-phrase field | phrases can be set in Brand Brain after build |
| P3 | Duplicate booked_call on one deal counted once only when a visitor exists | manual-inquiry dedupe unmeasured |
| P3 | 24px target size and skip link | a11y polish |
| P3 | `qa:perf` measures empty workspaces | template seeds no content rows |
| Not built | testimonial-if-successful permission; discovery economics fields; verbatim sales scripts; SOP checklist attached to prospect; delivery-load aggregation view; email; jobs; object storage; live platform/analytics adapters; ResearchProvider | brief items, reported honestly as N/A |

## 13. Founder manual QA (15 minutes, demo data)

1. Log in as `alex@northbeamadvisory.com` (demo password in HANDOFF §9) → dashboard shows "3 things need you today".
2. Create → open an idea → "Write script" → add a factual claim → try "Ready to record": refused until the claim is verified.
3. Production → Recording Room → mark a piece recorded → it moves to Editing and the task closes.
4. Move a piece to "Changes requested" without a note: refused; with a note: recorded in the event log.
5. Distribution → publish a record without a URL: refused; with a URL: content goes live.
6. Pipeline → "Log an inquiry" → try to record a booked call with attribution: only the operator can set the class.
7. Results → What we are learning: expectation, diagnosis, correction and verdict for the seeded pieces; a second verdict on the same correction is refused.
8. Reports → finalise a draft → generate again for the same week: refused, the final report is untouched.
9. Resize to phone width: hamburger nav, no sideways scroll on any screen.
10. As `qa` operator: Admin → Clients → New client → the founder can log in with the password you set.


---

# Completion + public experience pass — verification (9 September 2026)

Supersedes the executive verdict above for launch readiness. Everything below was run on this tree after the pass; regenerate with the commands in §11 plus `npm run qa:public`, `npm run qa:visual` and `npm run jobs:worker -- --once`.

## Verdict: **MOSTLY — technically launch-ready to the external gates**

- Every handoff / QA finding is dispositioned (`docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`): 59 reviewed, 28 fixed this pass, 11 already fixed and verified, 2 superseded, 13 deliberate non-features, 2 pure external gates, 3 founder inputs, **0 still broken**.
- Infrastructure that was "not built" is now built to the mocked boundary with tests: email, invites/reset, jobs, S3 storage, shared rate limit, five platform connectors, analytics ingestion, research providers, CRM/payment webhooks, rev-share-ready attribution.
- The public experience is rebuilt on an original design system and verified at 20 widths on a production build.
- "MOSTLY" because live delivery, storage, rate-limit store, platform credentials and review, and real client proof remain external gates; and because three founder inputs (domain, legal pages, canonical-script approval) are open. None is an implementation gap.

## Exact verification results

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npm test` | 625 tests in 154 suites: 625 pass, 0 fail, 0 skipped (1.5s) |
| `npm run build` | exit 0 (Next 15; new routes: `/playbook`, `/playbook/[chapter]` ×10, `/api/webhooks/[provider]`, `/admin/scripts`, `/admin/delivery`, `/forgot-password`, `/reset-password`, `/invite`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/icon.svg`) |
| `npx prisma migrate status` | 13 migrations, up to date; clean-database `migrate deploy` + seed verified on a temporary SQLite file (orgs 4, users 6, content 34) |
| `npm run qa:all` | **494 checks: 485 PASS · 2 PASS WITH EXTERNAL GATE · 4 PARTIAL · 0 FAIL · 3 N/A** |
| `npm run qa:spine` | three engagements incl. the text-led one: 0 FAIL (text piece starts in editing with no record task; second verdict refused; expectations byte-identical) |
| `npm run qa:perf` | 9/9 — 20 clients, five populated with 60 pieces / 3 snapshots each (900 snapshots seeded in 3.5s); reads ≤ 94ms across 24 orgs; 10 concurrent dashboards 78ms |
| `npm run qa:browser` (prod build) | **122 checks: 101 PASS · 21 PARTIAL · 0 FAIL** — 33 app/admin routes × 4 widths, keyboard reach; no runtime, console or hydration errors, no overflow. Partials: 20 routes list inline text links inside dense tables under the 24px WCAG 2.5.8 minimum at 390px (rows remain reachable; tracked as P3 polish), and the pipeline table at 1024px scrolls inside its own container by design |
| `npm run qa:public` (prod build) | **62 checks: 62 PASS · 0 PARTIAL · 0 FAIL** — 11 routes × 20 widths, audit at 5 widths, brand-leak / placeholder / cadence / overclaim greps clean, reduced-motion honoured, application submits and persists (`db=true`) |
| `npm run qa:visual` | 30 captures (5 widths × 6 pages), every reveal fired (27/27 home, 11/11 how-it-works, 7/7 who-its-for, 10/10 playbook); `qa-baselines/public/geometry.json` written |

Remaining PARTIALs in `qa:all` (all assessed, none material): duplicate-deal dedupe with no visitor is now enforced at write time so the attribution read has nothing left to de-duplicate (harness note); decimal scores are valid input; print/export is browser print by design; the synthetic bad-week report shows the miss but not the learning because the harness stamps the diagnosis after that week (clock artefact).

## Responsive QA (20 widths)

1920 · 1600 · 1440 · 1366 · 1280 · 1200 · 1024 · 900 · 820 · 768 · 760 · 720 · 640 · 600 · 500 · 460 · 430 · 390 · 375 · 320 — every public route: no horizontal overflow, no console or hydration errors, skip link, one `h1`, nav and Apply present, metadata present, `lang="en-GB"`, no reference-brand / placeholder / "monthly" / overclaim text. Deeper checks (headings, labels, 44px targets, screenshots) at 1440 / 1024 / 768 / 390 / 320. Findings fixed during the sweep: hero scene overflow at 1200–1280 (negative margin + non-shrinking crates), memory-weave path exceeding its viewBox, crate SVG wider than its wrapper at 1024, 40px targets in nav/footer/auth links, "go viral" / "guaranteed revenue" wording in the not-fit list (rephrased so the overclaim grep and the doctrine agree), calculator heading order, and the application QA selecting fields by id.

## Visual QA assets

`qa-baselines/public/{1440,1024,768,390,320}-{home,how-it-works,who-its-for,playbook,apply,login}.jpg` (30 files) and `qa-baselines/public/geometry.json` — the approved public product baseline; `npm run qa:visual:compare` reports the largest x/y/w/h deltas and document-height changes against it. Viewport captures for inspection: `reference-analysis/threadline-self/responsive/*.jpg` (gitignored).

## Security re-audit of new surfaces

- Webhooks: signature verified before parsing (Stripe timestamped HMAC, HubSpot v3, shared-secret HMAC for Pipedrive/Attio/GoHighLevel); unverified deliveries stored, never acted on; `(provider, externalId)` unique; rate limited per org; no attribution invented.
- Tokens: SHA-256 at rest, single-use via conditional update, 30m/72h TTL, newer token supersedes, enumeration-safe responses, rate limited, reset ends other sessions.
- Storage: tenant-scoped keys enforced before any network call; traversal refused in every adapter; reads proxied through the membership-checked file route.
- Jobs: payloads are JSON without secrets (email jobs carry links, not token hashes); dead jobs are visible, not looped.
- Connectors: tokens read from the encrypted keyring at call time; provider responses stored with secrets stripped; expired tokens flagged for reconnect.
- Research: SSRF guards unchanged; instruction-shaped text flagged and never forwarded as instruction; login walls refused by name.
- Public site: no new mutation surface beyond the existing application action; skip link and 44px targets; forms re-validated server-side.

## External gates

| Category | Item |
|---|---|
| CREDENTIAL | `RESEND_API_KEY`/`EMAIL_FROM`; `S3_*`; `RATE_LIMIT_REDIS_*`; `LINKEDIN/YOUTUBE/INSTAGRAM/TIKTOK/X_CLIENT_*`; per-workspace webhook secrets; `ANTHROPIC_API_KEY`; `NEXT_PUBLIC_BOOKING_URL`; production domain in `NEXT_PUBLIC_APP_URL` |
| PROVIDER REVIEW | Meta App Review (instagram_content_publish / insights); TikTok app audit (public posting); Google OAuth verification (YouTube scopes); LinkedIn Community Management / Marketing Developer access; X API tier |
| LIVE CLIENT DATA | Real results for proof; Judge calibration from client outcomes; ICP relevance from analytics scopes |
| FOUNDER DECISION | Approve canonical script blocks in `/admin/scripts`; confirm the production domain; decide when to add playbook email capture |
| LEGAL / CONTENT | Privacy notice and terms pages (the footer currently links the "What we do not promise" chapter) |

## Public content / claim blockers

None that block publishing: every statement on the site is VERIFIED in `docs/site/CLAIMS_EVIDENCE_LEDGER.md` or labelled synthetic. Open owner inputs are in `docs/site/PLACEHOLDERS.json` (domain, email provider, booking URL, legal pages).

## Founder manual QA (20 minutes)

1. Open `/` on desktop and on a phone: the hero reads before anything moves; scroll the machine and watch stations light in order; the return pipe pulse travels back; the stamp lands on "Published".
2. `/playbook` → chapter 4: the thread branches; turn the card; use the "Do this" line.
3. `/apply`: complete the three steps with test data; confirm the application appears in `/admin/applications`; choose "Create prospect from this application" and land on a prospect with a next action due in two days.
4. On that prospect: save discovery economics with only a deal value ("one more customer is worth" reads revenue with margin unknown); book a call; the script panel shows CANONICAL COPY IMPORT REQUIRED until `/admin/scripts` → "Import draft documents verbatim" → approve one block; return and record its use on the call.
5. `/admin/delivery`: log 25 active minutes and a work class on any task in a client workspace, reload, see it aggregated by period.
6. Client settings (as a client admin): answer the interview-willingness question and tick one permission; on the admin client page confirm an outcome; the testimonial ask becomes appropriate only then.
7. `/forgot-password` with a demo address; run `npm run jobs:worker -- --once` and read the captured link from the `EmailMessage` row (or the worker log); reset the password; other sessions are gone.
8. Create an idea and double-click Save: one idea. Send a `text_post` idea's script "to recording": it lands in Editing with no recording task.
9. Reports → a finalised report shows sections 07–12 (expected vs actual, learned, weakest link, what changed, next tests, limitations).
10. Resize to 320px: no sideways scroll on any public page.

## Safe rollback

`git checkout threadline-pre-public-experience-rebuild-2026-09-09` (or `git reset --hard` to it) — the tree before this pass. Approved public baseline after it: `threadline-public-baseline-2026-09-09`. The dev database is rebuilt from migrations + seed with `npm run db:reset`.
