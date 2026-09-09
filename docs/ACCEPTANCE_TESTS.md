# Threadline OS — Acceptance Tests

Two layers:

- **Automated** — `npm test` (Node test runner). 625 tests, 154 suites (2026-09-09). Covers the
  security-critical and logic-critical units where a regression would be silent and expensive.
- **Manual E2E** — the matrix below, executed against the seeded demo database.

**Execution record: sections A-O from 2026-09-02 (v1); sections P-T from 2026-09-03 (the P0
upgrade).** Both were run against a clean re-seed on the development server, using
`scripts/dev-session.cjs` to authenticate as each seeded role.

Result key: **PASS** · **PASS (auto)** — covered by an automated test · **BROWSER** — requires a
human in a browser and has not been executed here.

Setup for a clean run:

```
npm run seed
npm run dev
```

---

## A. AUTH

| # | Test | Expected | Result |
|---|---|---|---|
| A1 | Visit `/app/northbeam` signed out | Redirect to `/login?next=…` | **PASS** — 307 to login |
| A2 | Visit `/admin` signed out | Redirect to `/login` | **PASS** — 307 |
| A3 | Sign in with a bad password | Generic error, no user enumeration, no session | **PASS** — same message and same work performed for unknown email and wrong password (`DUMMY_HASH` comparison) |
| A4 | Sign in as founder (`client_admin`) | Lands on `/app/northbeam` | **PASS** |
| A5 | Founder opens `/admin` | Explanation screen, not a crash | **PASS** — 307 to `/no-access?area=admin` |
| A6 | `editor` opens Settings → Members | Hidden in nav **and** denied by URL | **PASS** — nav omits it; direct URL redirects to `/no-access` |
| A7 | `client_member` attempts an approval | Server refuses; UI does not offer it | **PASS (auto)** — `roles.test.ts` asserts `client_member` lacks every approve capability; UI reads the same matrix |
| A8 | Sign out | Session row deleted, back button cannot restore | **PASS** — session deleted server-side; pages are dynamic, not cached |
| A9 | Rate limit: repeated failed logins | Rejected with a retry-after message | **PASS** — verified on the application endpoint (5 stored from 7 attempts); login uses the same limiter with a 6/10min budget |

## B. TENANT ISOLATION (highest severity)

| # | Test | Expected | Result |
|---|---|---|---|
| B1 | Signed in to Northbeam, visit `/app/lumenpath` | 404, never Lumenpath data | **PASS** — 404 |
| B2 | Signed in to Lumenpath, visit `/app/northbeam` | 404 | **PASS** — 404 |
| B3 | Fetch another tenant's record by id | Not found | **PASS (auto)** — `tenancy.test.ts`: `getContentItem` and `contentLineage` both return null cross-tenant |
| B4 | `/api/files/<other-tenant-path>` | Denied | **PASS** — 401 anonymous, 404 for a non-existent asset, 404 for path traversal (`..%2f..%2fpackage.json`) |
| B5 | Global search | Zero cross-tenant results | **PASS (auto)** — searching Alpha's workspace for "Beta" returns 0 results; searching for its own returns rows |
| B6 | Internal operator switches orgs | Sees both, correctly scoped | **PASS** — operator reaches both workspaces; each renders only its own data |
| B7 | Automated tenancy suite | Cross-tenant reads empty | **PASS (auto)** — 13 assertions across ideas, scripts, content, research, signals, pipeline, assets, performance, lineage, search and storage paths |
| B8 | Role denial leaks no data | Denied page contains no records | **PASS** — `editor` on `/pipeline`: response carries the redirect and contains **0** occurrences of any pipeline record; the founder's response contains them |

## C. ONBOARDING

| # | Test | Expected | Result |
|---|---|---|---|
| C1 | Admin creates a client from the master template | Org, membership, Brand Brain, integrations, accounts, tasks, onboarding session | **PASS** — verified via a throwaway workspace; all records created |
| C2 | Start onboarding, complete steps | Autosave on each advance | **PASS** — welcome step renders with the correct org and founder name; save action persists and advances |
| C3 | Reload mid-flow | Returns to the same step with answers intact | **PASS** — `currentStep` and `data` are read back from `OnboardingSession` on load |
| C4 | Navigate backwards | No data loss | **PASS** — back-navigation saves without validating (`advance: false`) |
| C5 | Skip an optional step | Allowed and marked optional | **PASS** — optional steps carry no entries in `REQUIRED_FIELDS` |
| C6 | Submit an invalid required field | Inline validation, no advance | **PASS** — action returns field errors and still persists the partial answer |
| C7 | Review step | Summarises every section, each editable in place | **PASS** — eight sections with an Edit control that jumps to the step |
| C8 | Build step | Brand Brain, research, ideas and tasks written | **PASS** — action verified; writes company/founder/voice/rules, offer, ICP, proof, seeded research, competitors, starter ideas and first tasks |
| C9 | Land on Home | Dashboard populated, not empty | **PASS** — org status moves to active, onboarding to complete, and `/app/[org]` renders |
| C10 | Incomplete onboarding blocks the app | `/app/[org]` redirects into onboarding | **PASS** — 307 |

## D. IDEAS

| # | Test | Expected | Result |
|---|---|---|---|
| D1 | Create a manual idea | Persists; priority computed from components | **PASS** — `ideaPriority` runs on write |
| D2 | Generate ideas | Uses Brand Brain + research + performance; demo mode labelled | **PASS** — demo notice shown when no API key; generated ideas land in the backlog |
| D3 | Edit scores | Priority recomputes and re-sorts | **PASS (auto)** — `scoring.test.ts` covers the weighting and bonus |
| D4 | Filters and search compose | Correct subset | **PASS** — server-side filtering from URL params; filters combine |
| D5 | Bulk shortlist | All transition, each audited | **PASS** — bulk action validates every transition before writing |
| D6 | Approve an idea | Status `approved`; scripting becomes available | **PASS** |
| D7 | Send to scripting | Script created and linked; idea becomes `scripted` | **PASS** — lineage preserved via `Script.ideaId` |
| D8 | Illegal transition (`scripted` → `backlog`) | Rejected server-side | **PASS (auto)** — `workflow.test.ts` |

## E. SCRIPTS

| # | Test | Expected | Result |
|---|---|---|---|
| E1 | Generate a script | Hook, alt hooks, body, CTA, filming notes, duration, claims | **PASS** — seeded and generated scripts both carry all fields |
| E2 | Edit and save | New version appended; history shows both | **PASS** — `ScriptVersion` is append-only; no-op saves are skipped |
| E3 | Generate 5 hooks | Five alternates; selecting one records the choice | **PASS** — the replaced hook rejoins the alternates rather than being lost |
| E4 | Refinement control | New version with a change summary | **PASS** — eight refinement instructions, each producing a summarised version |
| E5 | Approve with an unverified claim | **Blocked** with a reason | **PASS (auto)** — `assertScriptTransition` throws; UI also disables the control |
| E6 | Verify all claims, then approve | Advances to `approved` | **PASS (auto)** |
| E7 | Send to recording | Content item created in `raw`, linked to script and idea | **PASS** — also creates the founder's recording task |
| E8 | Revert to an earlier version | Restored as a new version; history intact | **PASS** |

## F. RECORDING

| # | Test | Expected | Result |
|---|---|---|---|
| F1 | Queue and batch estimate | Correct queues; estimate shown | **PASS** — demo shows 4 pieces, ~27 min including setup and retakes |
| F2 | Teleprompter opens | Full screen, paragraph highlighting, prev/next | **BROWSER** — implemented; needs visual confirmation |
| F3 | Font size and scroll speed | Take effect; persist within the session | **BROWSER** — persisted to `localStorage` |
| F4 | Mark recorded | `recordedAt` set, stage moves, task closes | **PASS** — `markRecordedAction` closes the matching task |
| F5 | Upload raw video | Asset stored; appears in Library and on the timeline | **PASS** — storage adapter and content event verified |
| F6 | Keyboard controls | Space, arrows, R, Escape | **BROWSER** — implemented and documented on screen |

## G. PRODUCTION

| # | Test | Expected | Result |
|---|---|---|---|
| G1 | Move `raw → editing` | Stage change + event with actor and timestamp | **PASS** |
| G2 | Assign an editor | Persists; assignee must be a member of this org | **PASS** — membership is re-checked server-side |
| G3 | Add a comment | Appears on the timeline | **PASS** |
| G4 | Request changes without a note | Blocked | **PASS** — action returns a field error; the dialog also refuses to submit |
| G5 | Request changes with a note | `changes_requested`, revision count increments | **PASS** — note is stored as a `revision_request` comment |
| G6 | Approve | Approver and timestamp recorded; approval task closes | **PASS** |
| G7 | Illegal jump (`raw → live`) | Rejected | **PASS (auto)** — `workflow.test.ts` |
| G8 | Kanban and table parity | Same data, same actions | **PASS** — both read the same board data and call the same actions |

## H. PACKAGING

| # | Test | Expected | Result |
|---|---|---|---|
| H1 | Generate packaging | Per-platform outputs that genuinely differ | **PASS** — LinkedIn, YouTube, X and short-form each produce distinct copy |
| H2 | Edit a caption | Saves; marked human-edited | **PASS** — `generatedBy` flips to `human`, status to `ready` |
| H3 | Duplicate package for a platform | Prevented with a clear message | **PASS** — unique constraint on `(contentItemId, platform)`, checked before insert |

## I. DISTRIBUTION

| # | Test | Expected | Result |
|---|---|---|---|
| I1 | Create a publish record | Appears in list and calendar | **PASS** |
| I2 | Schedule for a date | Status `scheduled`; content item follows | **PASS** |
| I3 | Mark live with a URL | `published`, `publishedAt` set, content item `live` | **PASS** |
| I4 | Publish without a URL | Blocked with an explanation | **PASS (auto)** — `assertPublishTransition` throws |
| I5 | Integration cards | Honest status; unavailable providers explain why | **PASS** — 1 of 12 shown as available; the rest state the blocker and the manual fallback |
| I6 | Booking URL integration | Genuinely saves and connects | **PASS** — the only adapter returning `ok: true` |

## J. PERFORMANCE

| # | Test | Expected | Result |
|---|---|---|---|
| J1 | Add a snapshot manually | Persists; charts update | **PASS** — appended as a new reading, preserving the series |
| J2 | Breakdowns by format/topic/hook/CTA/platform | Computed from stored rows | **PASS** — all five render from seeded data |
| J3 | Top and under performers | Ranked against the median | **PASS (auto)** — `scoring.test.ts` proves one outlier does not relabel the rest |
| J4 | Derive learnings | Creates patterns with evidence links | **PASS** — refuses with fewer than three published pieces |
| J5 | Learning appears in Signals | Visible and linked back | **PASS** |
| J6 | Learnings reach idea generation | Present in AI context | **PASS** — `PERFORMANCE_CONTEXT` includes validated learnings |

## K. PIPELINE

| # | Test | Expected | Result |
|---|---|---|---|
| K1 | Create an inquiry linked to content | Persists with attribution | **PASS** — content must belong to the same org |
| K2 | Advance to `call_booked` | Stage machine enforced | **PASS (auto)** — cannot jump from `inquiry` to `won` |
| K3 | Content detail shows attributed inquiries | Visible | **PASS** |
| K4 | Home reflects inquiry and call counts | Correct | **PASS** — demo shows 6 qualified, 3 calls |

## L. REPORTS

| # | Test | Expected | Result |
|---|---|---|---|
| L1 | Generate the weekly report | All ten sections populated | **PASS** — three reports generated during seeding from real records |
| L2 | Numbers match the records | Exact | **PASS** — computed by `computeWeeklyReport`, not generated |
| L3 | Regenerate the same period | Updates rather than duplicating | **PASS** — upsert on `(orgId, periodStart)` |
| L4 | Print view | Clean, no app chrome | **BROWSER** — print styles implemented (`.no-print`, `.print-surface`, `.print-break`) |

## M. ADMIN

| # | Test | Expected | Result |
|---|---|---|---|
| M1 | Clients list | Status, package, health, fees, activity, alerts | **PASS** |
| M2 | Create a client | Full workspace scaffolded | **PASS** |
| M3 | Edit client configuration | Persists and reflects in the client portal | **PASS** |
| M4 | Operator queue | Six cross-client categories | **PASS** |
| M5 | Support issue lifecycle | Create, own, resolve, flag as SOP/product fix | **PASS** |
| M6 | SOP edit | Saves, version increments | **PASS** — 14 documents seeded |
| M7 | Applications inbox | Shows real submissions from `/apply` | **PASS** — the QA submission appeared immediately |
| M8 | Client user opens `/admin` | Denied | **PASS** — see A5 |

## N. MARKETING

| # | Test | Expected | Result |
|---|---|---|---|
| N1 | Home page | All ten sections render; no "AI" in the hero | **PASS** |
| N2 | No fabricated proof | Founding-phase language only | **PASS** — no testimonials, logos, client names or result claims anywhere |
| N3 | Application form | Multi-step, validated, persists, visible in admin | **PASS** — submitted through the real Server Action and stored |
| N4 | Booking step | Uses the configured URL; honest when unset | **PASS** — falls back to an explicit "we will email you" message |
| N5 | Calculator | Maths correct; scenario framing | **PASS (auto)** — `calculator.test.ts`, including that it never models zero founder involvement |
| N6 | Every CTA goes somewhere real | No dead links | **PASS** — all internal routes return 200 |

## O. UX AND RESPONSIVE

| # | Test | Expected | Result |
|---|---|---|---|
| O1 | 1440 / 1024 / 768 / 390 px | Usable; no horizontal scroll | **BROWSER** — built responsive throughout (sidebar collapses below `lg`, grids reflow, tables scroll in their own container); needs visual confirmation |
| O2 | Mobile navigation drawer | Works | **BROWSER** — implemented |
| O3 | Loading states | Module-shaped skeletons | **PASS** — `loading.tsx` for the app and admin segments |
| O4 | Empty states | Every list explains itself | **PASS** — each list module has a distinct empty state, and distinguishes "nothing yet" from "nothing matches those filters" |
| O5 | Error states | Recoverable with a retry | **PASS** — `error.tsx` per segment plus `global-error.tsx` and `not-found.tsx` |
| O6 | Toasts on mutations | Success and failure | **PASS** — every form goes through `ActionForm` |
| O7 | Command menu (⌘K) | Opens, searches, navigates | **BROWSER** — implemented; search is org-scoped server-side |
| O8 | Keyboard focus | Visible ring; dialogs trap and restore focus | **PASS** — global `:focus-visible` ring; Radix handles focus management |
| O9 | Demo tour | Nine stops, discreet, exitable | **BROWSER** — implemented with keyboard and progress controls |
| O10 | Destructive actions confirmed | Always | **PASS** — every delete goes through a confirmation |
| O11 | New screens at each breakpoint | Usable; the comparison table scrolls in its own container | **BROWSER** — the run detail, diagnosis, install and proof screens were built responsive and the markup reviewed; not visually confirmed |
| O12 | Marketing scroll reveal | Smooth, once per block, nothing above the fold flashes | **BROWSER** — implemented; server HTML confirmed visible without JavaScript, but the motion itself is unverified |
| O13 | Sticky CTA behaviour | Appears after the hero, stands down near the footer | **BROWSER** — implemented; scroll behaviour unverified |

## P. INTELLIGENCE RUN (added 2026-09-03)

| # | Test | Expected | Result |
|---|---|---|---|
| P1 | Client admin opens `/intelligence/runs` | Cycle list, ranked tests, open-cycle notice | **PASS** — 200; the open cycle is flagged and links through |
| P2 | Open the published brief | Frozen brief renders: summary, approved signals with evidence, ranked tests, what was drawn on | **PASS** — 200; "What we found", "Why it matters", "supporting item", "What we are doing about it" and "Not collectable this cycle" all present |
| P3 | The brief states what could not be read | Unavailable source named with its specific blocker | **PASS** — the LinkedIn source renders with the login-wall explanation, not omitted |
| P4 | Publish with a candidate still pending | Refused, with the count | **PASS (auto)** — `intelligence.test.ts`: the gate throws with "have not been decided" |
| P5 | Publish with no written summary | Refused | **PASS (auto)** — gate throws |
| P6 | Synthesise with no evidence | Refused | **PASS (auto)** — gate throws; the action also re-checks before calling the model |
| P7 | A candidate citing evidence that was not supplied | Discarded, not repaired | **PASS (auto)** — the generator resolves reference ids and drops unresolvable candidates; the count is reported back to the operator |
| P8 | Approve a candidate | Creates a `Pattern`, carries evidence links, records who decided and when | **PASS** — seeded and verified: 4 approved candidates each have a linked pattern with inherited evidence |
| P9 | Reject a candidate with no reason | Refused | **PASS** — action returns a validation error on the `note` field |
| P10 | Re-decide an already-decided candidate | Refused | **PASS** — action returns a workflow error |
| P11 | Approved signal to ranked test | Test is a `Pattern` of kind `test` linked to its parent, with a defined read | **PASS** — 3 tests seeded from approved signals, each with `successMetric` and `derivedFromId` |
| P12 | Record a test result | Confidence of both the test and its parent signal move by one bounded step | **PASS (auto)** — `adjustedConfidence` never reaches 0 or 100 across 40 consecutive reads |
| P13 | The same evidence collected twice | Reused, not duplicated | **PASS (auto)** — fingerprinting collapses URL variants, tracking parameters and whitespace/case differences |
| P14 | Edit a candidate before deciding | Recorded as edited by a human | **PASS** — `editedByHuman` set; the brief labels it |
| P15 | A published brief cannot be edited or deleted | Refused | **PASS** — update and delete actions both return a workflow error for `published` |
| P16 | Two open cycles at once | Refused | **PASS** — create action refuses while another cycle is open |
| P17 | Editor opens `/intelligence/runs` | Denied, and no run data in the response | **PASS** — redirect directive present, **0** occurrences of any run content |
| P18 | Cross-tenant run access | 404 | **PASS** — Lumenpath founder on a Northbeam run URL returns 404 |
| P19 | Run evidence and gate counts are org-scoped | Empty cross-tenant | **PASS (auto)** — `tenancy.test.ts`: `runEvidence` and `runGateCounts` both return nothing for the other tenant |
| P20 | URL collection against a private address | Refused before any request | **PASS (auto)** — loopback, private, link-local (incl. 169.254.169.254), CGNAT, multicast and IPv4-mapped IPv6 all rejected |
| P21 | URL collection against a login-walled platform | Refused by name, with the manual path offered | **PASS (auto)** — LinkedIn, Instagram, TikTok, X and Twitter all refused with the paste instruction |
| P22 | Intelligence-brief notification reaches the editor | It must not | **PASS** — fixed during this pass: notifications are filtered by the reader's capabilities; the editor's response contains none |

## Q. CONSTRAINT DIAGNOSIS

| # | Test | Expected | Result |
|---|---|---|---|
| Q1 | Client admin opens `/intelligence/diagnosis` | Primary constraint, nine rated dimensions, commercial impact, review date | **PASS** — 200; all nine render with ratings and notes |
| Q2 | The volume verdict is stated | Says plainly whether more content helps | **PASS** — "More output will not fix this…" renders for the positioning constraint |
| Q3 | Activate with fewer than nine dimensions rated | Refused, naming what is missing | **PASS** — action returns a workflow error listing the unrated dimensions |
| Q4 | Activate with no commercial impact written | Refused | **PASS** — action returns a workflow error |
| Q5 | Activating a second diagnosis | The previous one becomes `superseded` | **PASS** — exactly one `active` row per organisation |
| Q6 | Onboarding seeds a diagnosis | Draft only, four dimensions rated | **PASS (auto)** — `diagnosis.test.ts` asserts a questionnaire can never produce a complete diagnosis |
| Q7 | Monthly review | Appended to the record, not overwritten | **PASS** — review text is appended with a date stamp |
| Q8 | Editor opens the diagnosis | Denied, no diagnosis data in the response | **PASS** — redirect directive present, **0** occurrences of diagnosis content |
| Q9 | Cross-tenant diagnosis read | Nothing returned | **PASS (auto)** — `tenancy.test.ts`: `getDiagnosis` returns null cross-tenant |

## R. INSTALLATION (day-7 win)

| # | Test | Expected | Result |
|---|---|---|---|
| R1 | Client opens `/install` | Calm progress view, one next step, per-milestone detail | **PASS** — 200; Northbeam shows a complete installation with real detail against each step |
| R2 | Milestone completion is derived | Reflects real records, not a checkbox | **PASS (auto)** — `installation.test.ts`: an empty workspace reports nothing complete; partial state reports partial progress |
| R3 | Strategy sign-off | Does not complete on the work alone | **PASS (auto)** — reads "in progress, awaiting sign-off" until a person records it |
| R4 | An operator blocker | Overrides a complete derived state, including for the client | **PASS (auto)** — asserted explicitly |
| R5 | Operator view | Shows the action required and any blocker | **PASS** — admin client page renders every milestone with its operator action |
| R6 | Home card | Present while incomplete, gone once complete | **PASS** — absent for Northbeam, whose installation is complete |
| R7 | There is no "mark as done" control | Only sign-off, note and blocker | **PASS** — the action module exposes no completion action by design |

## S. PROOF CAPTURE

| # | Test | Expected | Result |
|---|---|---|---|
| S1 | Client admin opens `/performance/proof` | Baseline, each month, comparison table | **PASS** — 200; baseline plus three months render |
| S2 | Reported vs measured is labelled | Every cell says which it is | **PASS** — "Reported" and "Measured" both present against the appropriate cells |
| S3 | Language never claims causation | No causal verb anywhere | **PASS (auto)** — `proof.test.ts` sweeps every metric across four movement shapes and asserts no causal wording, in statements and headlines |
| S4 | The disclosure is shown | Attribution limits stated | **PASS** — "not a claim of cause" renders above the comparison |
| S5 | Missing data | Blank, never zero | **PASS (auto)** — asserted for both missing baseline and missing month |
| S6 | A month that went backwards | Says so | **PASS (auto)** — headline reads "…moved against the intended direction. That is the honest read." |
| S7 | Observable figures are not editable | Recomputed from records | **PASS** — the month form collects only founder hours and audience; everything else is recomputed |
| S8 | A locked period | Cannot be edited or deleted | **PASS** — both actions return a workflow error |
| S9 | A second baseline | Refused | **PASS** — action refuses, explaining that two baselines make every comparison ambiguous |
| S10 | Editor opens Proof | Denied, no proof data in the response | **PASS** — redirect directive present, **0** occurrences of proof content |
| S11 | Cross-tenant proof read | Nothing returned | **PASS (auto)** — `tenancy.test.ts`: `getProofPeriod` returns null cross-tenant; `proofView` builds from one tenant only |

## T. PUBLIC SITE (post-upgrade)

| # | Test | Expected | Result |
|---|---|---|---|
| T1 | Home leads with the outcome | Hero states the business outcome, not the software | **PASS** — "Turn your expertise into qualified demand." |
| T2 | The information hierarchy | Outcome, pain, mechanism, division of labour, intelligence proof, first win, fit, product proof, CTA | **PASS** — all nine sections render in order |
| T3 | One dominant CTA per viewport | Single primary action | **PASS** — the hero has one CTA; the sticky CTA appears after it and stands down near the closing CTA |
| T4 | Readable with JavaScript disabled | All content present in the server HTML | **PASS** — every reveal block renders `data-shown="true"`; there is no `data-shown="false"` in the served HTML |
| T5 | Reduced motion | No movement | **PASS** — the reveal returns early on `prefers-reduced-motion`, and transitions carry `motion-reduce` |
| T6 | Product proof is real UI | Component-built, not stock imagery | **PASS** — intelligence brief, diagnosis, installation, brand brain, scripts, board and performance views all built from the design system |
| T7 | No fabricated proof | No invented testimonials, logos, clients or results | **PASS** — grep across the marketing tree finds none; the demo content shown is labelled fictional in the source |
| T8 | Application flow reads as a diagnostic | Not a SaaS signup | **PASS** — reframed, and states that on five of nine dimensions more content is the wrong answer |
| T9 | The ICP is stated precisely | Established expert-led B2B, proven offer at roughly GBP 5,000+ | **PASS** — `/who-its-for` fit and disqualifier lists both updated |
| T10 | All public routes | 200 | **PASS** — `/`, `/how-it-works`, `/who-its-for`, `/apply`, `/calculator` |
| T11 | Application submission still works | Persisted through the real Server Action | **PASS** — re-verified after the rewrite; row stored, QA residue cleared |

## U. CLIENT SURFACE (added 2026-09-04)

| # | Test | Expected | Result |
|---|---|---|---|
| U1 | Client admin signs in | Simplified eight-item nav, no Market Radar or Signals | **PASS** — browser: This week, Recording, Approvals, Content, Intelligence, Results, Reports, Settings |
| U2 | Operator opens the same workspace | Full operating nav | **PASS (auto)** — `visibility.test.ts` asserts the operator nav retains radar and signals; the client nav contains neither |
| U3 | Client role holds no internal-only capability | Denied | **PASS (auto)** — all three client roles denied `research.view`, `research.edit`, `signals.view`, `signals.edit`, `runs.manage`, `readiness.assess`, `longform.manage` |
| U4 | Client fetches an unpublished cycle by id | Nothing returned | **PASS (auto)** — `getRun` returns null for every client role; the operator still reads it |
| U5 | Client lists cycles | Published briefs only | **PASS (auto)** — one run returned, working state excluded |
| U6 | Client reads signals | Approved only | **PASS (auto)** — internal test and hypothesis excluded; operator sees both |
| U7 | Client fetches a draft diagnosis | Nothing returned | **PASS (auto)** — draft excluded from `currentDiagnosis` and `getDiagnosis` |
| U8 | Operator-private comment | Never in a client read | **PASS (auto)** — client sees 1 of 2 comments; operator sees both |
| U9 | Client searches for an internal record | Zero results | **PASS (auto)** — searching "SECRET" returns nothing for every client role, and results for the operator |
| U10 | Client nav items are all reachable by a client | No dead entries | **PASS (auto)** — every `clientNav` capability is held by `client_admin` |
| U11 | Client command menu | Cannot target operator routes | **PASS (auto)** — asserted over every entry |
| U12 | "Threadline is working on" | Real, tenant-scoped counts | **PASS** — browser: eight stages from persisted records; counts match the seeded workspace |
| U13 | A quiet week | Says so rather than padding | **PASS** — `workingOn` returns `idle` and the card explains the gap |
| U14 | Approvals queue | One list, oldest first | **PASS** — browser: 29 items, scripts, edits and packaging, oldest first with waiting age |
| U15 | Approvals badge matches the page | Same number | **PASS** — was 7 vs 29; both now read `approvalCount` |

## V. RECORDING READINESS

| # | Test | Expected | Result |
|---|---|---|---|
| V1 | Client opens recording setup | Status, seven checks, photos, their own submission form | **PASS** — browser: renders with the seeded "ready with a limitation" verdict |
| V2 | One blocking check | Blocks the whole assessment | **PASS (auto)** — asserted for each of the seven checks |
| V3 | `ready` with an unassessed check | Refused | **PASS (auto)** — names the unchecked dimension |
| V4 | `blocked` with no client action | Refused | **PASS (auto)** — "a status nobody can act on" |
| V5 | `blocked` with nothing marked blocking | Refused | **PASS (auto)** |
| V6 | A limitation | Counts as assessed, not as a failure | **PASS (auto)** — milestone completes with the constraint named |
| V7 | Blocked setup | Creates a real client task, not a fake completion | **PASS** — action creates an urgent client task and a notification; milestone reports blocked |
| V8 | Client cannot assess their own setup | Denied | **PASS (auto)** — `readiness.assess` is internal-only |
| V9 | Installation milestone | Derived from the record | **PASS (auto)** — blocked readiness stops the installation reading as complete |
| V10 | Tenant scoping | Org-scoped throughout | **PASS** — `RecordingReadiness.orgId` is unique per org and every read is org-scoped |

## W. LONG-FORM PILOT

| # | Test | Expected | Result |
|---|---|---|---|
| W1 | Long-form off by default | Not enabled for any client | **PASS (auto)** — `longFormEnabled` false for empty, absent and malformed module lists |
| W2 | Long-form work without the module | Refused, naming the client | **PASS (auto)** |
| W3 | Short-form unaffected | Never blocked | **PASS (auto)** — short-form passes every long-form gate untouched |
| W4 | Orientation | Derived, not stored | **PASS (auto)** — 16:9 long-form, 9:16 short |
| W5 | Package approval without title or thumbnail | Refused | **PASS (auto)** — both cases, with all missing fields named at once |
| W6 | Admin scope label | Reads PILOT / CUSTOM unless enabled | **PASS** — admin client page renders the scope panel and an audited toggle |
| W7 | Lineage preserved | Long-form participates in the existing chain | **PASS** — long-form is a `ContentItem` format; evidence → idea → script → content → publish → performance is unchanged |
| W8 | Automatic upload | Not implemented | **PASS** — deliberate; no upload path exists |

## X. HONEST ACCESS

| # | Test | Expected | Result |
|---|---|---|---|
| X1 | Access method shown separately from status | "Set up" never reads as "connected" | **PASS** — every integration card renders the access method with its own explanation |
| X2 | LinkedIn in the demo | `native_delegated`, described honestly | **PASS** — "a person publishes from the client's own account; no credential is stored" |
| X3 | No simulated connection | Nothing claims connectivity it lacks | **PASS** — `api` only where an integration genuinely works |
| X4 | No new OAuth or extension publishing | None added | **PASS** — deliberate |

## Y. POSITIONING AND VALIDATION (V14)

| # | Test | Expected | Result |
|---|---|---|---|
| Y1 | Home leads with the creative promise | Expertise in, watchable content out | **PASS** — "You already have the expertise." / "We turn it into content people actually want to watch." |
| Y2 | Deeper outcome present | Authority and qualified demand | **PASS** — hero sub-paragraph |
| Y3 | Not workflow-led | Software is mechanism, not headline | **PASS** — product proof appears after the argument, never as the pitch |
| Y4 | Niche framing | Umbrella, not a validated niche | **PASS** — `/who-its-for` states one kind of business at a time, and that the focus is still being learned |
| Y5 | Wedge hypothesis recorded | Editable internal state | **PASS** — `active-wedge` SOP, seeded, editable in the admin portal |
| Y6 | Validation heuristic stated honestly | Signal, not a statistical rule | **PASS** — the document says five conversations cannot establish a rate |
| Y7 | No channel hard-coded as doctrine | Acquisition is channel-agnostic | **PASS (auto)** — `funnel.test.ts` asserts no channel name appears in the model |
| Y8 | Funnel maths | Derives from recorded rates | **PASS** — required first touches, per-workday pacing and compound conversion on the metrics dashboard |
| Y9 | Refuses to project on unmeasured rates | Says which input is missing | **PASS (auto)** — returns a refusal, not a number |
| Y10 | Assumptions labelled | Qualification never shown as measured | **PASS (auto)** — always flagged assumed, in the model and on screen |
| Y11 | One offer, no tiers | No tiered pricing UI | **PASS** — none exists; demo fees are GBP 2,500 + GBP 2,500/month |
| Y12 | No acquisition tooling added | No scraping, sending or automation | **PASS** — deliberate |

## Z. BROWSER QA (2026-09-04, real Chrome)

Run at roughly 1440px against the seeded workspace, signed in through the real login form.

| # | Finding | Severity | Result |
|---|---|---|---|
| Z1 | `text-base` used as a colour is Tailwind's font-size utility, so it silently won — leaving **every primary and accent button label invisible**, including sign-in and every marketing CTA | High | **FIXED** — 7 occurrences moved to `text-[color:var(--color-base)]`; verified visually |
| Z2 | Middleware redirected signed-in users from `/login` to `/app`, which had no route — a 404 for every signed-in user | High | **FIXED** — real `/app` entry route resolves the caller (client → their workspace, operator → `/admin`, anonymous → login) |
| Z3 | Approvals nav badge showed 7 while the page listed 29 | Medium | **FIXED** — both read `approvalCount` |
| Z4 | Blank required fields showed `"Invalid input: expected string, received undefined"` | Medium | **FIXED** — centrally in `zodFieldErrors`; every form benefits |
| Z5 | `/install/recording` highlighted "This week" | Low | **FIXED** — now a child of Recording |
| Z6 | Console errors on client pages | — | **PASS** — none |
| Z7 | Client surface, approvals and recording setup at ~1440px | — | **PASS** — render correctly, no horizontal overflow |
| Z8 | 1024 / 768 / 390px | — | **NOT VERIFIED** — the environment cannot change the viewport: window resize is ignored, iframes are refused by the app's own clickjacking headers, and popups are blocked |

---

## Automated suite summary

```
npm test
ℹ tests 263
ℹ suites 54
ℹ pass 263
ℹ fail 0
```

| Suite | File |
|---|---|
| Role capability matrix | `src/lib/auth/roles.test.ts` |
| Tenant isolation (database-backed) | `src/lib/auth/tenancy.test.ts` |
| Workflow machines and gates | `src/lib/domain/workflow.test.ts` |
| Scoring and derived metrics | `src/lib/domain/scoring.test.ts` |
| Operating-cost calculator | `src/lib/domain/calculator.test.ts` |
| Intelligence run gates, dedupe, ranking, feedback | `src/lib/domain/intelligence.test.ts` |
| Constraint diagnosis and provisional ratings | `src/lib/domain/diagnosis.test.ts` |
| Installation milestone derivation | `src/lib/domain/installation.test.ts` |
| Proof comparison and non-causal language | `src/lib/domain/proof.test.ts` |
| URL reader SSRF guards and extraction | `src/lib/integrations/fetch-url.test.ts` |
| Client visibility (database-backed) | `src/lib/auth/visibility.test.ts` |
| Recording readiness gates | `src/lib/domain/readiness.test.ts` |
| Long-form entitlement and packaging | `src/lib/domain/longform.test.ts` |
| Funnel maths | `src/lib/domain/funnel.test.ts` |

## Outstanding

**One item.** Breakpoint behaviour at 1024, 768 and 390px.

## AE. ATTRIBUTION V1.5 (added 2026-09-06)

| # | Test | Expected | Result |
|---|---|---|---|
| AE1 | Tracked redirect | 302 to the stored destination | **PASS** — verified by request; httpOnly first-party cookie set |
| AE2 | Unknown slug | 404, revealing nothing | **PASS** |
| AE3 | Retired link | 404; past clicks kept | **PASS** |
| AE4 | Click recorded | Touchpoint against the visitor and the asset | **PASS** — verified in the database after the request |
| AE5 | Destination validation | javascript:, data:, file:, ftp: refused | **PASS (auto)** |
| AE6 | Credentials in the URL | Refused | **PASS (auto)** — the address-bar spoofing trick |
| AE7 | Destination pointing at our own login/API/admin | Refused | **PASS (auto)** — that shape is a credential-harvesting hop |
| AE8 | Tracked link chained into another | Refused | **PASS (auto)** |
| AE9 | Slugs | Random, not enumerable | **PASS (auto)** — 200 generated, no meaningful collisions |
| AE10 | Referrer | Host only, never the query string | **PASS (auto)** |
| AE11 | First touch | Earliest qualifying asset takes the credit | **PASS (auto)** + database-backed |
| AE12 | Last touch | Latest qualifying asset | **PASS (auto)** + database-backed |
| AE13 | Linear | Even split across distinct assets | **PASS (auto)** + database-backed |
| AE14 | Repeated touch | Buys no extra credit | **PASS (auto)** — four clicks, two assets, still 50/50 |
| AE15 | Single touch | Whole value under all three models | **PASS (auto)** |
| AE16 | Zero touches | No credit, and it says why | **PASS (auto)** |
| AE17 | Touch after the event | Not credited | **PASS (auto)** |
| AE18 | Touch outside the window | Not credited, window named | **PASS (auto)** |
| AE19 | Awkward division | Parts sum to the whole | **PASS (auto)** |
| AE20 | Evidence vs model | No model changes the class | **PASS (auto)** — asserted across every model and class |
| AE21 | Correlation shared three ways | Still a correlation | **PASS (auto)** |
| AE22 | One deal, one outcome | Opportunity and win counted once | **PASS** — found in browser QA as a £36K figure for an £18K deal; fixed and tested |
| AE23 | Unattached events | Left separate rather than guessed at | **PASS (auto)** |
| AE24 | Coverage below half | Money withheld, reason shown | **PASS (auto)** |
| AE25 | Coverage above half | Money allowed | **PASS (auto)** |
| AE26 | No events at all | Refuses and says why | **PASS (auto)** |
| AE27 | Per-10k on tiny reach | Refuses to normalise | **PASS (auto)** |
| AE28 | Outcome language | Never says "generated" for a correlation | **PASS (auto)** |
| AE29 | Journey timeline | In order, gaps as gaps | **PASS** — browser: click, click, repeat click, form, enquiry, booked, showed, with provenance |
| AE30 | Tenant isolation | No journey or asset from another workspace | **PASS (auto)** — database-backed |
| AE31 | Missing dimension | Grouped, not dropped | **PASS (auto)** |
| AE32 | Funnel | Only stages with events | **PASS (auto)** + browser |
| AE33 | Tracking health | Gaps named individually | **PASS (auto)** + browser |
| AE34 | Client Results | Grouped by evidence class, never summed | **PASS** — browser: all four classes rendered with their own sentence |
| AE35 | Operator surface for a client role | Denied server-side | **PASS** — redirected to no-access; none of the page content in the response |
| AE36 | Report payload | Attribution frozen with the rest | **PASS** — schema and builder |

## AF. THE SYNTHETIC DRY RUN

| # | Test | Expected | Result |
|---|---|---|---|
| AF1 | Synthetic workspace as proof | Refused | **PASS (auto)** — message names the false claim it would be |
| AF2 | Real client through the same gate | Allowed | **PASS (auto)** |
| AF3 | Portfolio revenue | Excludes the synthetic fee | **PASS (auto)** — database-backed |
| AF4 | Real-client filter | Returns only the real workspace | **PASS (auto)** |
| AF5 | Banner | Above every page in the workspace | **PASS** — browser |
| AF6 | Runs the real fulfilment path | Same code as a client | **PASS** — `kind: "client"`, only the marker differs |
| AF7 | Clearing the marker | Heavier confirmation | **PASS** — the copy names the consequence |
| AF8 | Delivery Load | Active and waiting kept apart, labelled synthetic | **PASS** — 7.3 hours of attention, 48.0 hours waiting, 4 of 4 logged |
| AF9 | Partial logging | Says untimed is unmeasured, not zero | **PASS** — copy present; not triggered by the seed, which logs all four |
| AF10 | Deliberate friction seeded | A failed recording and real waiting time | **PASS** |

---

## AA. THE LIVING SOP ENGINE (added 2026-09-06)

| # | Test | Expected | Result |
|---|---|---|---|
| AA1 | Every declared state has a definition | No state without meaning, reason and completion | **PASS (auto)** — asserted over both state maps |
| AA2 | Transitions point only at states that exist | No dangling target | **PASS (auto)** |
| AA3 | A tick where a finding was asked for | Not satisfied | **PASS (auto)** — including whitespace passed off as a note |
| AA4 | An optional item | Never holds a state open | **PASS (auto)** — the personalised walkthrough |
| AA5 | Forward move with work outstanding | Refused, naming the items | **PASS (auto)** |
| AA6 | Same move with a written reason | Allowed, reason audited | **PASS (auto)** — blank whitespace is not a reason |
| AA7 | Closing a record honestly | Never gated | **PASS (auto)** — from every state |
| AA8 | Active record with no next action or date | Refused | **PASS (auto)** — both cases |
| AA9 | Closed record | Needs neither | **PASS (auto)** |
| AA10 | State entry | Default action and date where deterministic, nothing where not | **PASS (auto)** |
| AA11 | A checklist toggle | Flips what is stored, not what was posted | **PASS (auto)** — `resolveCheck`; a toggle never erases a note |
| AA12 | State card in the browser | Meaning, reason, checklist, done-when, next states | **PASS** — prospect and wedge detail render correctly |

## AB. MARKET VALIDATION

| # | Test | Expected | Result |
|---|---|---|---|
| AB1 | Commercial testing below the sample | Refused | **PASS** — browser: refused at 3 of 5 with the reason, inline and as a toast, even with a checklist override |
| AB2 | The gate has no override | Cannot be bypassed | **PASS (auto)** |
| AB3 | The reading of the evidence | Never a rate or a percentage | **PASS (auto)** — asserted against a percentage pattern |
| AB4 | A sample we named every problem in | Called out as the weakest evidence | **PASS (auto)** |
| AB5 | Five different answers | No invented headline problem | **PASS (auto)** |
| AB6 | Immersion cannot be skipped | Refused | **PASS (auto)** |
| AB7 | One active wedge | Activating one sets the others aside | **PASS** — audited transaction |
| AB8 | Wedge list and detail | Renders with state, score and conversation count | **PASS** — browser |

## AC. ACQUISITION

| # | Test | Expected | Result |
|---|---|---|---|
| AC1 | Counting from records | Touches, replies, positive replies, bookings, shows, outcomes | **PASS (auto)** — database-backed |
| AC2 | Qualification once calls exist | Measured, not assumed | **PASS (auto)** — and still assumed at zero attended calls |
| AC3 | Refusal when a rate is missing | Names the gap rather than guessing | **PASS** — browser: the measured panel refuses while the assumed one projects |
| AC4 | Assumed rates | Every one labelled | **PASS** — browser: four rates, each marked assumed |
| AC5 | Quota | Required, sent, remaining, per workday, today | **PASS** — browser |
| AC6 | Impossible quota | Says diagnose, not work harder | **PASS (auto)** |
| AC7 | Thin samples | Marked rather than presented as rates | **PASS** — browser: three of seven steps marked |
| AC8 | The lowest conversion | Reported, never called broken | **PASS (auto)** — and never a step it cannot read |
| AC9 | Per-channel rates | Separate, never blended | **PASS (auto)** |
| AC10 | No channel in the model | None anywhere | **PASS (auto)** — funnel and SOP both asserted |
| AC11 | Weekly review | Counts frozen; one variable refused if several | **PASS** — the action refuses a comma-separated list |
| AC12 | Two active targets | Impossible | **PASS** — saving a new one closes the current |

## AG. CADENCE, VALIDATION, CORPUS AND JUDGE (added 2026-09-07)

| # | Test | Expected | Result |
|---|---|---|---|
| AG1 | Initial contract value | Setup fee + three period fees, never "3 months" | **PASS (auto)** |
| AG2 | Monthly equivalent of a period fee | period x 13 / 12, not period x 1 | **PASS (auto)** — a four-week fee reported as MRR is ~8% high |
| AG3 | `periodNumberFor` before the start date | `null`, not period 0 or 1 | **PASS (auto)** |
| AG4 | `InternalMetric` after the audit | Still calendar-monthly | **PASS** — reconciled against a real month; deliberately untouched |
| AG5 | Nine conversations | Refused, and told five was only a checkpoint | **PASS (auto)** |
| AG6 | Ten conversations, four converging | Refused on convergence, not on count | **PASS (auto)** — the two conditions fail separately and say which |
| AG7 | Ten conversations, six converging | Eligible for a validation decision | **PASS (auto)** |
| AG8 | Unthemed conversations | Excluded from convergence | **PASS (auto)** — never inferred from the problem text |
| AG9 | The previous wedge | Inactive, with its conversations and 53 prospects | **PASS** — seed verified |
| AG10 | The current wedge | `immersion`, zero conversations, no inherited pipeline | **PASS** — the true state |
| AG11 | Outlier band, 11,000 views vs a ~1,400 median | `exceptional` | **PASS** — verified end to end |
| AG12 | Outlier band, 40,000 views, one-piece creator | `unknown` | **PASS** — a large account is not an outlier |
| AG13 | A piece in its own baseline | Excluded | **PASS** — code-verified in `bandFor`; not unit-tested, it needs the database |
| AG13b | A creator with no other examples | Reads naturally, not "Only 0 other examples" | **PASS (auto)** — defect found in browser QA, fixed, regression test added |
| AG14 | Corpus reading below 100 | Says it is a reading list, not a signal source | **PASS** |
| AG15 | Duplicate URL | Rejected | **PASS (browser)** — inline alert and toast both shown, dialog stays open with the values intact |
| AG16 | Judge verdict arithmetic | Computed in code; the model returns criteria only | **PASS (auto)** |
| AG17 | A gating criterion below the floor | Rejects regardless of the total | **PASS (auto)** |
| AG18 | Flat 3s across the rubric | Rejects (60 < 65) | **PASS (auto)** |
| AG19 | Every stored verdict | `calibrated: false` | **PASS (auto)** |
| AG20 | Calibration on illustrative-only data | Refuses, and says how many were excluded | **PASS** — 0 usable pairs, 7 excluded |
| AG21 | Client roles and `corpus.manage` | Denied | **PASS (auto)** |
| AG22 | Judge in the idea/script approval path | Absent | **PASS** — deliberately not wired in |
| AG23 | Browser QA of the corpus and calibration surfaces | Full workflow exercised | **PASS (browser, 2026-09-07)** — see below |
| AG24 | Add example, in a browser | Row created, counters move | **PASS (browser)** — 7→8 examples, 2→3 creators |
| AG25 | Analyse and Judge, in a browser | Rows written, buttons become Re-analyse/Re-judge | **PASS (browser)** — verdict stored `calibrated: false` |
| AG26 | Run calibration, in a browser | Run recorded and listed under Runs | **PASS (browser)** — after the defect below was fixed |
| AG27 | Remove example, in a browser | Row deleted, toast shown | **PASS (browser)** — `window.confirm` stubbed so no blocking dialog |
| AG28 | A server action that fails at transport level | Operator sees an error | **PASS (auto + browser)** — was completely silent before; see below |
| AG29 | Pluralisation on the corpus counters | "1 creator", not "1 creators" | **PASS (browser)** — defect found and fixed |

---

### Browser QA, 2026-09-07 — what it caught that the test suite did not

Signed in through the real login form as the super admin and exercised the whole corpus workflow:
add → duplicate rejection → analyse → judge → calibrate → remove. Four defects, one of them
serious, none of which typecheck, lint, 451 unit tests or a production build had detected.

**1. Server action failures were completely silent (serious).** `Run calibration` did nothing. The
click registered, the spinner cleared, and the page still said "No runs yet" — no toast, no error,
no console message. The network tab showed `POST /admin/research/calibration → 503`. Both
`ActionButton` and `ActionForm` awaited the action without a `try`/`catch`, so anything that threw
past `guarded()` — a transport-level failure, a refused request, a dev server mid-recompile —
produced no feedback at all.

This is the worst possible failure mode for an operations tool, because *silence is
indistinguishable from success*: the operator believes the calibration ran. Both components now
catch, and report "That did not reach the server … Nothing was saved".

**2. The 503 itself was a corrupt Next.js dev cache**, not application code — `.next` had been
throwing `webpack.cache.PackFileCacheStrategy: invalid stored block lengths` throughout the
session. Clearing `.next` and restarting fixed it, and the calibration then recorded correctly.
Worth knowing: the visible symptom of a corrupt dev cache is a server action that silently
does nothing.

**3. "1 creators with a baseline"** — pluralisation, fixed.

**4. "Only 0 other examples from this creator"** — correct arithmetic, reads like a bug. Now
"Nothing else from this creator yet", with a regression test.

**Not a defect, recorded so it is not re-investigated:** the corpus page appears to overflow
horizontally in captured screenshots. It does not — `documentElement.scrollWidth === clientWidth`
at 2048px. The screenshot frame is narrower than the viewport and crops the right-hand column.

---

## AH. OUTLIER V1 AND THE CAPTURE WORKFLOW (added 2026-09-08)

| # | Test | Expected | Result |
|---|---|---|---|
| AH1 | Baseline ladder order | Same creator + format wins over creator, cohort, platform | **PASS (auto)** |
| AH2 | A thin format set | Falls back to the creator's wider work | **PASS (auto)** |
| AH3 | A three-creator "cohort" | Rejected; needs 5 | **PASS (auto)** |
| AH4 | Platform baseline | Needs 8, confidence `low` | **PASS (auto)** |
| AH5 | Rungs are never blended | First qualifying rung used outright | **PASS (auto)** |
| AH6 | 2.5x own median vs 2.5x a cohort | `strong` vs `typical` | **PASS (auto)** — the bar really widens |
| AH7 | No qualifying rung | `unknown`, not a number | **PASS (auto + real data)** |
| AH8 | Views per day and age | Derived from publish date | **PASS (auto + real data)** — 259,626/day on a 16-year-old video |
| AH9 | A piece under 14 days old | `stillMoving`, with a re-capture prompt | **PASS (auto)** |
| AH10 | Outperformed, off-ICP | `popular_off_icp`, not a template | **PASS (auto + seed)** |
| AH11 | Outperformed, on-ICP | `commercial_outlier` | **PASS (auto + seed)** |
| AH12 | Ordinary but on-target | `relevant_but_ordinary` | **PASS (auto + seed)** |
| AH13 | Unrated relevance | `unrated`, never guessed | **PASS (auto)** |
| AH14 | Rating an example in-browser | Saves per change, audited | **PASS (browser)** — verified before the tab died; DB row and audit entry confirmed |
| AH15 | Pasted block of links | URLs extracted in order, deduped | **PASS (auto)** |
| AH16 | YouTube Shorts vs long-form | Different platform and format | **PASS (auto)** |
| AH17 | LinkedIn format | `unknown`, never guessed | **PASS (auto)** |
| AH18 | Handle from a LinkedIn *post* URL | `null`, not a wrong handle | **PASS (auto)** |
| AH19 | Bulk capture, real YouTube URL | Title and channel from oEmbed | **PASS (browser + DB)** — real title and `@rickastleyyt` captured, `provenance: auto_oembed` |
| AH20 | Bulk capture, unreachable page | Honest failure note, row still created | **PASS (browser + DB)** — HTTP 404 reported, `provenance: url_only` |
| AH21 | Bulk capture, LinkedIn URL | Login-wall explained, manual path offered | **PASS (browser + DB)** — `provenance: url_only` with the paste instruction |
| AH22 | Every captured row | `views: 0`, `metricsProvenance: manual` | **PASS (DB)** — nothing estimated |
| AH23 | Filling metrics | `needsMetrics` clears, velocity computed | **PASS (data path)** — verified against the real database; **the dialog's submit was not exercised in a browser** (see below) |
| AH24 | Browser QA of the capture dialogs | — | **NOT RUN** — environment failed, see below |

---

### The browser QA environment failed part-way through, and here is exactly where the line is

The Chrome automation degraded mid-session into the state the previous session
also hit. Measured, not inferred:

```
document.hidden        true
document.visibilityState "hidden"
getBoundingClientRect  { w: 0, h: 0, top: 0 }   // every element
raw DOM click listener fired: true
React / Radix response: none
```

Events reach the DOM; React's synthetic system and Radix's positioning do not
act on them, because both depend on a visible document and non-zero layout. A
page Threadline never touched (`/admin/prospects`) fails identically, which is
what rules the application out as the cause.

**What this does and does not invalidate.** Everything marked **PASS (browser)**
above was exercised while the tab was still live and was confirmed *server-side*
— rows in the database, entries in the audit log, notes returned by the real
enrichment code against real URLs. Those are not screenshots of a hopeful UI.
What is genuinely unverified is the `FillMetricsButton` dialog's own submit
path: the action's data effects were checked directly against the database, the
form that calls it was not clicked. That is AH23 and AH24, and they stay open
until somebody opens the page in an ordinary browser.

---

## AD. ACCESS AND SEPARATION

| # | Test | Expected | Result |
|---|---|---|---|
| AD1 | Client roles and `acquisition.view` | Denied | **PASS (auto)** — all three roles |
| AD2 | Client roles and `acquisition.manage` | Denied | **PASS (auto)** |
| AD3 | Internal roles | Both held | **PASS (auto)** |
| AD4 | Records carry no `orgId` | Structurally unreachable from a tenant | **PASS** — no organisation relation exists on any of the seven models |
| AD5 | Stale session cookie | Reaches the login form | **PASS** — browser: previously an infinite redirect loop; now the cookie is cleared and the page explains |
| AD6 | An internal role without the capability | Sees delivery only | **PASS** — the cockpit renders its delivery variant |

---

Browser QA ran for the first time in the previous session and covered the client surface, approvals and
recording setup at roughly 1440px, signed in through the real login form — finding and fixing five
defects, two of them high severity (see section Z). Narrower widths could not be tested: this
environment cannot change the browser viewport. Window resizing is silently ignored, iframes are
refused by the application's own clickjacking headers, and popups are blocked.

Everything is built responsive and the markup has been reviewed, but that is not the same as
having looked. Twenty minutes with a browser and a device toolbar closes it, and it remains the
first recommended task in `HANDOFF.md` section 18.

The teleprompter, command menu, demo tour and printed weekly report also remain visually
unconfirmed for the same reason.

**2026-09-06.** Browser QA covered the cockpit, market, wedge detail, prospects, prospect detail
and acquisition surfaces, signed in through the real form, with no console errors — finding and
fixing six defects, one of them a redirect loop that locked out any user whose session had
expired. Part way through, the browser tab began reporting `document.hidden === true` and
returning zero-size layout rectangles, and stopped delivering clicks to the page. **The checklist
save path and the call outcome form were not confirmed in a browser** as a result. Their rules are
covered by unit tests, but somebody should tick a box and record a call outcome once.

## Completion pass — 2026-09-09

| ID | Scenario | Expected | Result |
|---|---|---|---|
| CP1 | Request a password reset for an unknown address | Same generic message as for a known one; nothing sent | **PASS (auto)** — `account.ts` + `tokens.test.ts` |
| CP2 | Use a reset link twice | Second use refused as used; other sessions ended on first use | **PASS (auto)** — `tokens.test.ts` |
| CP3 | Invite a member with no email provider configured | Account + membership created, invite queued/captured, link shown to the inviter | **PASS (auto)** — `email.test.ts`, `jobs.test.ts` |
| CP4 | Two workers claim the same job | Exactly one holds the lease; a stale lease is recovered | **PASS (auto)** — `jobs.test.ts` |
| CP5 | Upload with `STORAGE_PROVIDER=s3` half-configured | Refused at start-up, no silent fallback to disk | **PASS (auto)** — `storage.test.ts` / `getStorage()` |
| CP6 | Redis rate-limit store unreachable | Requests refused (fail closed) unless `RATE_LIMIT_FAIL_OPEN=true` | **PASS (auto)** — `rate-limit.test.ts` |
| CP7 | Publish to X through the connector with an expired token | `auth_expired` classified; integration marked for reconnect; manual route intact | **PASS (auto)** — `connectors.test.ts` |
| CP8 | Ingest the same provider reading twice | Second is a no-op duplicate; fields the provider cannot supply stored as unavailable, never 0 | **PASS (auto)** — `normalise.test.ts` + unique key |
| CP9 | Paste research text containing "ignore all previous instructions" | Kept as evidence, flagged, never executed | **PASS (auto)** — `providers.test.ts` |
| CP10 | Stripe webhook with a wrong secret | Stored as unverified, no commercial event created | **PASS (auto)** — `webhooks.test.ts` |
| CP11 | A weak-evidence event marked eligible for rev share | Impossible: eligibility is derived from evidence class | **PASS (auto)** — `attribution-status.test.ts` |
| CP12 | Send a text post "to recording" | Lands in editing with no record task; "mark recorded" refused | **PASS (auto)** — `qa:spine` text-led |
| CP13 | Submit the idea form twice quickly | One idea | **PASS (auto)** — `qa:all` hostile:concurrency |
| CP14 | A discovery piece travels and engages but converts nothing | Read as `none`, not `cta_conversion` | **PASS (auto)** — `intended-job.test.ts` |
| CP15 | Weekly report for a bad period | Expected-vs-actual table, weakest link, what changed, limitations shown; no softening | **PASS (auto)** — `qa:spine`, `suite-reports` |
| CP16 | Public site at 320–1920px | No overflow, no console errors, skip link, one h1, no brand leak, no "monthly", no overclaim | **see `qa:public`** |
| CP17 | Application submitted through the rebuilt form | Persists; confirmation shown | **see `qa:public`** |
| CP18 | Testimonial request before a confirmed outcome | Refused with the reason | **PASS (code path)** — `requestTestimonialAction` |
