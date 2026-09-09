# Public claims — evidence ledger

Governs every factual statement on the public site (`src/content/public-site.ts`, `src/app/(marketing)/**`). A statement is published only when its row is **VERIFIED** and the wording is supported by the evidence column. Canonical business truth lives in `HANDOFF.md` §16b and `docs/site/BRAND_SOURCE_OF_TRUTH.md`; this ledger points at it rather than restating it.

Statuses: VERIFIED · UNVERIFIED (not publishable) · RESTRICTED (true but not for public use) · RETIRED.

| ID | Claim (as published) | Status | Evidence / source | Where used | Reviewed |
|---|---|---|---|---|---|
| C-PRICE | £2,500 implementation, then £2,500 every 4 weeks; 12-week initial engagement (three service periods) | VERIFIED | HANDOFF §16b (locked commercial hypothesis); `src/lib/domain/service-period.ts` | footer, how-it-works CTA | 2026-09-09 |
| C-CADENCE | Threadline runs in 4-week service periods; never "monthly" | VERIFIED | HANDOFF §16b; cadence sweep in `scripts/qa/suite-reports.ts` | home §12 weeks, footer | 2026-09-09 |
| C-DIVISION | "You talk. You record. You approve. You sell. Threadline handles the machine." | VERIFIED (positioning statement, not a metric) | brief §6; product workflow: recording, approvals, publish gates exist in code | hero, footer | 2026-09-09 |
| C-POSITIONING | "You already have the expertise. We turn it into content people actually want to watch." | VERIFIED (positioning) | brief §6, HANDOFF §16b | hero, OG image | 2026-09-09 |
| C-MEMORY | "We are not trying to make you famous. We are trying to make you familiar to the people who matter." | VERIFIED (positioning) | brief §6 | home §memory | 2026-09-09 |
| C-EXPECTATION | Expectations are recorded before a piece goes out and read against afterwards | VERIFIED | `ContentExpectation` frozen rows; `readGap()`; QA report cases A–G | home §learns, how-it-works | 2026-09-09 |
| C-GATES | Fact-check gate, approval gate, publish-URL gate, 14-day reading gate exist in software | VERIFIED | `assertScriptTransition`, content/publish transitions, `MATURITY_DAYS = 14`; QA suites `suite-workflow`, `suite-diagnosis` | how-it-works §gates | 2026-09-09 |
| C-LOGIN-WALL | Login-walled platforms are refused by name, never scraped | VERIFIED | `src/lib/integrations/fetch-url.ts` LOGIN_WALLED; providers test | how-it-works §intel | 2026-09-09 |
| C-EVIDENCE-CLASSES | Commercial signals carry an evidence class that is never upgraded by arithmetic | VERIFIED | ADR-015; `assertEvidenceSupportable`; attribution suite | how-it-works §response, playbook ch.7 | 2026-09-09 |
| C-PAID-SEPARATE | Paid amplification is recorded separately from organic | VERIFIED (data field) | `PublishRecord.distributionMode` | how-it-works §distribute | 2026-09-09 |
| C-NO-CASE-STUDIES | "No client results to show yet" — everything in the proof section is a synthetic demonstration | VERIFIED | No client has agreed to share results; `ProofPermission` table empty; demo workspaces are `synthetic` | home §proof (labelled) | 2026-09-09 |
| C-SYNTHETIC-NUMBERS | The 1,204,000 / 1,900 figures in the attention scene are illustrative | VERIFIED (labelled on page) | Rendered with "numbers illustrative — no client figures are shown on this site" | home §attention | 2026-09-09 |
| C-WEDGE | Current research focus: senior founder/partner-led AI & digital transformation advisory, US/UK — a hypothesis being tested | VERIFIED (as hypothesis) | HANDOFF §16b "Active wedge (unvalidated)" | who-its-for | 2026-09-09 |
| C-REPLY-EITHER-WAY | Applications are read by a person and replied to either way | VERIFIED (operating commitment) | Applications land in `/admin/applications` with statuses; the founder commits to reply | apply, home | 2026-09-09 |
| C-NO-PROMISES | No promised leads, revenue, followers, views, virality, ROI | VERIFIED (doctrine) | brief §5; `OVERCLAIM` regex in `scripts/qa/public-qa.ts` | playbook ch.10, who-its-for | 2026-09-09 |
| C-FOUNDING | "Founding client programme" / "a small number of clients at a time" | VERIFIED | HANDOFF §2 (zero paying clients at 2026-09-09); capacity model in SOP_09 | hero, footer | 2026-09-09 |
| C-TEAM | Any statement about team size, years operating, awards, partners, certifications | RESTRICTED | None exist to state; must not appear | — | 2026-09-09 |
| C-TESTIMONIAL | Any testimonial, logo, named case study | RESTRICTED | Requires `ProofPermission` grants (allowPublicTestimonial / allowNamedCaseStudy / allowLogo) — none granted | — | 2026-09-09 |
| C-CALC | The calculator computes the cost of the current operation from the user's inputs and never projects revenue | VERIFIED | `src/lib/domain/calculator.ts` (no revenue projection; `calculator.test.ts`) | calculator | 2026-09-09 |
| C-PLAYBOOK-ORIGINAL | The Founder Authority System chapters are Threadline's own | VERIFIED | Authored in `src/content/public-site.ts`; reference `forbidden-to-copy.md`; brand-leak grep in public QA | playbook | 2026-09-09 |

Retired this pass: "A productised systems company, not an agency" (footer, retired — undefined and unhelpful); "Proof that we understand your market, inside a week" (old home; retired — a time promise); product screenshot mock-ups presented as the product (old home; retired in favour of labelled synthetic chain).
