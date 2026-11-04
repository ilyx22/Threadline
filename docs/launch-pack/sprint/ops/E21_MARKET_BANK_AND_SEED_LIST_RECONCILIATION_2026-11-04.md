# E21 — Market bank and seed-list reconciliation (4 Nov 2026)

**Status: DRAFT for owner review.** Desk reconciliation only. Nothing was sent, no accounts were touched, no existing file was changed. Counts below were computed from `../prospects/prospects.csv` on 4 Nov 2026.

**Master to-do item:** E21 (`THREADLINE_MASTER_TODO_2026-10-20_V4_2_INFRASTRUCTURE_STARTED.md`). Related: E05 (import the 68), E08 (Apollo/Clay pilot, 10 then 50), E09 (first reachable batch), H08 (research invitations, parked 20 Oct), J01 (ten interviews / more than five convergent accounts).

## Sources

| # | Source | What it contributed |
|---|---|---|
| S1 | `Threadline Final Working Resources/06 Research and Decisions/THREADLINE_AI_CONSULTANCY_MARKET_IMMERSION_AND_PAIN_BANK.docx` (6–8 Sept 2026) | ICP, immersion findings, H1–H5, pain ranking, benchmarks, Clutch slice, qualified-universe sizing |
| S2 | `Threadline Final Working Resources/03 Acquisition and Sales/THREADLINE_FIRST_US_RESEARCH_PROSPECT_BATCH_AND_OUTREACH_PLAYBOOK_V1.docx` | First 15-firm batch, filter, 10-dimension gap, VOC record, guardrails |
| S3 | `../prospects/prospects.csv` + `PROSPECTS_README.md` (26–27 Sept 2026) | The 68-row asset: tiers, observations, gap scoring, channel notes |
| S4 | `../a-tier-assets/INDEX.md` + 23 asset files (26 Sept 2026) | Re-checked A-tier observations and content dates |
| S5 | `../../strategy/RESEARCH_PILOT_2026-10-27_AI_CONSULTANTS_LINKEDIN.md`, `PLAN_2026-11-03_WEEKLY_RESEARCH_RUN.md` | Content-pattern evidence (other people's content) |
| S6 | `../../outreach/PERSONALISATION_AND_RESEARCH.md`, `WORKED_EXAMPLES.md` | Evidence rules (7-day observation rule); worked examples are fictional and are not used as evidence |
| S7 | `../emails/BULK_LIST_FILTER_SPEC.md` §5, `../../strategy/OUTREACH_RECONCILIATION_2026-10-15.md` | Research-track exclusion; the separate "100 a day" commercial quota |

**Not found:** the origin of the "25–50 firms / 20 content examples / 100 A/B-fit" targets. They appear only in the E21 wording itself (to-do V3.1, V4.1, V4.2). No local doc or working `.docx` states them. They are treated below as working targets of unknown source.

---

## 1. Language / problem / evidence bank

Evidence labels:
- **VERBATIM-BUYER** — words a target founder said to us about the problem Threadline solves (interview, reply, call).
- **PUBLIC-EVIDENCE** — words or facts the firm itself published, captured with a URL. This is the market's own language about *their* offer, not about content pain.
- **HYPOTHESIS** — our inference or test wording. Not buyer truth.

### 1a. Verbatim buyer language about the Threadline problem

**None exists yet.** No research interview, reply or call record was found in the repo (J01 open; CP6 "ten founder interviews … have not been completed"; H08 parked 20 Oct). The `/admin/market` database was not checked. Until one real conversation is logged, every "pain" line below is public evidence or hypothesis.

### 1b. Market language found in prospects' own published words (PUBLIC-EVIDENCE)

All from `observation` in S3 (captured 26 Sept 2026; re-verify before use). Quotes are the firms' words; numeric claims are their own and unaudited.

| Theme | Rows (of 59 qualified) | Example wording (firm, as published) | What it suggests |
|---|---|---|---|
| "We don't hand you a report and leave" | 7 (RECHECK-02, RECHECK-07, AI-07, AI-08, FRACT-06, FRACT-09, FRACT-10) | AIML Governance: "We do not hand you a governance report and walk away". Mahdlo: "We are not a consulting firm that hands you a deck and leaves." Insight AI: "I don't hand you a strategy. I rebuild the work." | Supports S1 finding D (positioning is converging) and H2 (harder to tell firms apart) — HYPOTHESIS until a founder says it |
| People and habits before technology | 6 (RECHECK-01, -12, -14, -15, AI-07, AI-10) | Ideal State: "People are ready. Organizations are not." AI Mindset: "Most AI initiatives fail not because of the technology, but because of the habits and behaviors around it." | Same doctrine recurs across firms; differentiation must come from proof, not slogan |
| Senior principal, not a bench | 3 (RECHECK-03, RECHECK-10, AI-01) | ArcPoint: "Every engagement is delivered by the principal. There is no bench." Foresight: "Large consulting firms sell access to a brand and a bench. FCG sells access to the experts." | Supports S1 finding B (founder authority is the commercial asset) |
| Policy versus provable governance | 2 (RECHECK-03, RECHECK-04) | Novara: "Most organizations can point to AI policies. Far fewer can demonstrate governance." | Content angle for governance clients; not Threadline pain |
| Hard numbers in positioning | 15 | e.g. percentage uplifts, ROI multiples, success rates | Firms' own claims, unaudited. Never repeat as fact. Matches pilot pattern 2 (S5) |
| Named frameworks | 9 | e.g. Periculum "6A Compass™", Northstar "Composite AI Debt Score", Biz Growth Spurt "PROFIT+" | Doctrine exists on site; the gap is distribution/proof (see 1c) |

### 1c. Observed authority-gap evidence (PUBLIC-EVIDENCE scored by us = desk HYPOTHESIS)

Frequency of each gap dimension in `gap_dimensions` across the 59 A/B rows (S3):

| Dimension | Rows | Note |
|---|---|---|
| 4 proof-of-work | 35 | most common |
| 5 distribution consistency | 27 | |
| 7 owned media | 27 | "no newsletter" written in 14 gap hypotheses |
| 8 content-to-commercial path | 25 | |
| 2 distinctive POV | 23 | |
| 10 founder-time burden | 19 | cannot be seen from outside — pure hypothesis |
| 9 measurement / learning loop | 18 | cannot be seen from outside — pure hypothesis |
| 3 buyer specificity | 11 | |
| 6 format breadth | 7 | |
| 1 expertise depth | 1 | expected: the filter selects for expertise |

Dated staleness found in A-tier assets (S4, PUBLIC-EVIDENCE): Blais Halpert newest technical piece Jul 2020; FJV blog Jan 2022; Holden blog Mar 2022; Flow Partners insights May 2024; Groove insights Jan 2025; Biz Growth Spurt Jul 2025 (previous May 2022); ASA resources Oct 2025. One correction: WrightCFO now posts weekly, so its gap is owned audience, not cadence.

### 1d. Problem hypotheses (HYPOTHESIS, S1 §3–4; none buyer-validated)

| Rank (desk) | Problem | Desk confidence (S1) | Evidence above |
|---|---|---|---|
| 1 | Differentiation / commoditisation pressure (H2) | High | 1b themes 1–2 (converging claims) |
| 2 | Making expertise visible before the sales call (H3) | High | 1b theme 3; 1c dims 4, 8 |
| 3 | Valuable expertise under-distributed (H1) | High | 1c dims 5, 7; stale dates |
| 4 | Founder bandwidth / consistency (H4) | Medium-high, needs VOC | dim 10 is inferred only |
| 5 | Turning technical expertise into compelling content | Medium-high, needs VOC | 1c dims 2, 3 |
| 6 | Referral reliance / inconsistent pipeline | Medium, needs direct evidence | none observed |
| 7 | Attribution of content to pipeline (H5) | Medium; must not be assumed primary | dim 9 is inferred only |

Also hypotheses: status/identity desire (S1, 7 Sept); market memory with a small buyer pool; value of visible diagnosis. Threadline test lines in S1/S2 — e.g. the commoditisation paragraph and "We are not trying to make you famous. We are trying to make you familiar to the people who matter." — are **our wording to test**, not buyer language.

The convergence standard (S1 §10) stays: vague agreement ("content is hard") does not count; we need repeated, independent variants of the core statement from more than five of ten-plus interviews (J01).

### 1e. Content and category evidence (other people's material; never Threadline results)

- **Content patterns (S5):** nine patterns from 43 LinkedIn posts (15 creators) and 25 YouTube videos (10 channels), late Sep–27 Oct 2026. Directional only; sample leans to established advisors; builder-audience outliers must be screened for buyer relevance.
- **Authority benchmarks (S1):** 8 mature founder authority systems described qualitatively (one of them, We Call Shotgun, is also row AI-14, a positive control).
- **Category supply (S1):** 1 direct comparator and 7 service-category comparators reviewed. Their case studies are seller claims, not audited proof, and are never cited as Threadline outcomes.
- **Raw universe (S1):** RevenueBase reported 9,844 US companies tagged "enterprise AI consulting" (2 Sept 2026), 8,193 at 1–50 staff. Third-party taxonomy; not qualified TAM. Clutch slice of 17 firms gave about 1 A + 2–3 B — directional, not a prevalence rate.

---

## 2. Reconciliation: older targets versus what exists

| Target | What exists now (computed) | Verdict |
|---|---|---|
| **Immersion: 25–50 firms** | S1 names 23 targeted AI-advisory candidates and reviews a 17-firm Clutch slice (40 firms), plus 8 benchmarks and 8 comparators. S3 adds 68 row-level firm audits, 33 of them AI advisory. 16 of S1's named candidates are not in the 68 (and not on the hold list). | **Met** for the AI wedge at desk level. S1 itself says desk immersion is "complete enough" and further browsing should be prospect- or question-specific. |
| **Immersion: 20 content examples** | 68 public content items in S5 (43 posts + 25 videos), plus 8 qualitative benchmark systems in S1. Each of the 68 prospect rows also carries one URL-cited observation. | **Met in number, partly met in usability.** The per-post tables (URLs, counts, multiples) sit only in session subagent reports, not in the repo. `docs/research/weekly/` does not exist yet, so the weekly run has not produced a report. Examples are creator-side, not from paying buyers. |
| **100 A/B-fit prospects** | 59 A/B rows (23 A, 36 B) of 68; 9 REJECT. Of the 36 B, 17 are named positive controls (research calls, not pain prospects), leaving **42 pain-oriented** (23 A + 19 B). AI-advisory wedge only: 29 A/B (12 A, 17 B); 21 after removing its 8 positive controls. By country: 39 US, 20 UK. | **Partly met (59 of 100).** All 68 are research track and every domain is excluded from commercial cold email (S7 §5). **Commercial-track rows built: 0** (no commercial list file exists). |
| **Apollo/Clay pilot (E08)** | Not run. Apollo and Clay are DEFERRED in the tools register; E08 is open. | **Missing.** Nothing to compare against the manual 68 yet. |
| **Founder VOC (J01)** | 0 interviews recorded; H08 parked by owner. | **Missing.** The bank has no VERBATIM-BUYER lines. |
| **A-tier pre-completed assets** | 23 of 23 built (12 verified, 11 partially verified) on 26 Sept. | **Met, but stale** — must be re-verified before any send. |

Note on "100": three different 100s exist and should not be merged — (a) the E21 seed-list target of 100 A/B-fit prospects (source not found); (b) the EasyGrow commercial quota of 100 new verified prospects a weekday (S3 README, S7); (c) S1's runway arithmetic at about 100 new qualified accounts a week. None of them is a send gate.

---

## 3. Gaps worth filling for the next outreach cycle only

**100 is not a pre-send gate.** The next send needs per-row readiness, not a list size: business-model filter passed, an observation re-opened within 7 days, the correct track (research or commercial, never both), suppression checked, and a compliant channel. A batch of 5–10 ready rows is enough to start (A11: roughly 5–10 qualified research touches per working day while learning). Do not redo the immersion.

Small, concrete items:

1. **Re-verify only the rows chosen for the next batch.** Every observation is 39 days old (26 Sept → 4 Nov), so 0 of 68 meet the 7-day rule today. Re-open the source URL, confirm the person and their latest activity, and update the A-tier asset if it changed.
2. **Settle the three open owner decisions only if those rows are in the batch:** Holden Advisors (Reed Holden or Brian Doyle), Blais Halpert (tax law boutique in or out), Starrett (which brand).
3. **Start the VOC log at the first conversation,** using S1's call-log fields plus problem energy 0–5 and awareness state. Add lines to 1a only from real conversations or replies. Owner decision needed first: H08 is parked.
4. **Commit the pilot's per-post source table** (or let the first weekly report carry it) so the 20-example bank can be inspected, with a buyer-relevance tag per item.
5. **Commercial track, when E08 runs:** build the 10-row pilot in a separate file by the EasyGrow method; measure fit rate, minutes per usable prospect and cost; compare with the manual 68. The pilot tests workflow, not market size.
6. **Optional candidate pool:** 16 AI-advisory firms named in S1 on 6 Sept but never row-researched (Pickett Strategy Group, Aurient, Atanium, SRJ Consulting & Services, Andreozzi Consulting, Vorsa Logic, AXL Consulting, Agilevent, ShiftElevates, Tethics, TAI Advisory, AI Consult Pro, Leanware, X2 Labs, Sketch Development, Crafted). Decide the track **before** researching them: once one is put on the research track, its domain is excluded from commercial email.
7. **Record where the 25–50 / 20 / 100 targets came from, or retire them,** so later to-do versions stop carrying unsourced numbers.

Not worth doing now: more broad desk immersion, a TAM re-estimate, or topping the 68 up to 100 before sending.

---

## 4. Data-quality notes on the 68 rows

Counts only; no contact details are reproduced here.

| Check | Result |
|---|---|
| Rows / columns | 68 rows, 23 columns. Tier totals match the README (23 A / 36 B / 9 REJECT). |
| Duplicates | 0 duplicate firm names; 0 duplicate website domains. |
| Status | 68 of 68 `not contacted`. |
| Due dates | 59 overdue (23 A due 1 Oct; 36 B due 8 Oct); 9 blank (all REJECT). Reset dates at import. |
| Evidence dates | All observations captured 26 Sept 2026; 0 rows within the 7-day rule. A-tier assets: 12 verified, 11 partially verified on 26 Sept. |
| Founder name blank | 6 rows: 3 B (AI-16 Head of AI, FRACT-08 CFO Advisors, FRACT-10 Charles River CFO) and 3 REJECT. `founder_role` blank in 4 (1 B, 3 REJECT). |
| Country | 1 blank and 1 "US (unverified)", both REJECT. Qualified: 39 US, 20 UK. |
| Email addresses | 0 email addresses in the file (no "@" anywhere). 13 rows (7 A, 6 B) carry a `find via tool` placeholder. 3 rows name email as the first channel. |
| Phone numbers | 16 qualified rows (6 A, 10 B) have a firm-published business phone inside the free-text `channel` field. No TPS/CTPS check is recorded; phones are for use only after a reply. Move them to a separate field at import (E05). |
| Channel field | Free text: 49 distinct values across 59 qualified rows. Normalise at import (primary channel + fallback). |
| LinkedIn activity | Not measured. 29 qualified rows say LinkedIn activity is unverified or not checked; 14 rows rely on search snippets. Treat every LinkedIn channel as provisional. |
| Gap fields | `gap_dimensions` filled for all 59 qualified rows (blank for 8 REJECT); `pre_completed_value` filled for all 23 A and no B (as designed). |
| Fit scores | A 7–8, B 5–7, REJECT 1–3; consistent with tier. |
| Research vs commercial eligibility | **No track/eligibility column exists.** Eligibility is set outside the file: README and S7 §5 make every domain in the CSV research-track and excluded from commercial cold email. `segment_priority` was deliberately not added. E05 must carry this into Attio (e.g. Source = research) so no row drifts into a commercial sequence. |
| Positive controls | 17 B rows are named as positive controls in the README, but the CSV has no flag for them (0 rows mention it). Flag at import. |
| Hold list | 4 firms on the research hold list (S7) are not in the CSV; suppress them anyway. |
| Third-party facts | README lists 6 facts taken from press or snippets rather than the firm's own site (e.g. a founder name from interviews, revenue and fee figures). Do not use them in a message without a primary source. |

---

## What could not be verified

- The source of the 25–50 / 20 / 100 targets.
- Whether any research conversations or VOC exist in the `/admin/market` database or Attio (only the repo was checked).
- Whether the 68 (or the 15 Attio accounts mentioned in N10) have already been imported into Attio (E05 says unconfirmed).
- The pilot's per-post tables (held in session reports, not in the repo).
- Any live web page: nothing was re-fetched for this reconciliation, so every observation remains as of 26 Sept 2026.
