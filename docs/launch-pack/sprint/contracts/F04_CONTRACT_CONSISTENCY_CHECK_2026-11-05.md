# F04 prep: contract consistency check (5 November 2026)

> **REPORT ONLY. NOT LEGAL ADVICE. No contract file was edited.** Prepared by Claude for master to-do F04 ("Finalise legal identity and agreements") ahead of F05 (solicitor review). It compares the v0.1 drafts of 26 September 2026 with the internal sources of truth as they stand today. Nothing here decides anything: every item is for the **Owner** (commercial choice) or the **Solicitor** (legal wording). No wording below is proposed as settled.

**Drafts checked:** `CLIENT_SERVICES_AGREEMENT.md` (MSA), `ORDER_FORM_SOW.md` (OF), `DPA_SUMMARY.md` (DPA), `CONTRACTS_README.md` (README); the invoice template was spot-checked for payment terms only.

**Sources of truth used:**
- `../../OWNER_DECISIONS.md` (26 Sept; D-01, D-03, D-07, D-09)
- `../../strategy/DECISION_2026-10-23_PRICE_AND_GUARANTEE_REMEDY.md` (owner decision D03 and D04 shape, 23 Oct; supersedes D-01's 14-day terms for timing)
- `../ops/THREADLINE_MASTER_TODO_2026-10-20_V4_2_INFRASTRUCTURE_STARTED.md` §0, §3, D01–D09, F01–F16
- `../ops/C09_SUPPORT_AND_RECOVERY_PLAN_2026-11-04.md`, `../../operations/RPO_RTO_RETENTION_OPTIONS.md`
- `../../onboarding/OFFBOARDING_AND_EXPORT.md`
- `../../sales/F01_SALES_SCRIPT_RECONCILED_DRAFT_2026-11-04.md`
- `src/lib/billing/invoices.ts` (read only, to check what the app actually does)

**Headline:** the drafts predate the 23 October owner decisions. Payment timing, the risk-reversal mechanism and the "no guarantees" framing all now conflict with internal decisions, and the scope schedule states as fixed what D01/D02 have left open.

---

## 1. Conflicts and gaps

Severity key: **Blocks signing** = the contract would say something the business has decided against, or cannot be signed without it. **Fix before solicitor** = settle or flag internally so the solicitor reviews the intended position, not a stale one. **Minor** = tidy-up or accuracy.

### 1a. Term, fees and payment

| # | Clause / location | Contract says | Source of truth says | Severity | Decision owner |
|---|---|---|---|---|---|
| P1 | MSA 5.3; OF §3 payment schedule and worked example; README C-10 | Period invoices issued "up to seven days before" the period; every invoice "payable within 14 days of its issue date" | D03 (23 Oct, owner decided): each period "invoiced 14 days before it starts and is due by its first day" | Blocks signing | Owner (confirm D03 timing is final); Solicitor (wording, F09) |
| P2 | MSA 5.3, 5.4; OF §3 row 1 | Implementation invoice issued on signature, payable within 14 days; fulfilment gate needs it paid | D03: "Implementation is paid at signature" | Blocks signing | Owner; Solicitor |
| P3 | MSA 5.6, 4.8 | Pause only after notice once an invoice is 7 days overdue; Service Period not extended | D03: "No work on a period before it is paid" | Blocks signing | Owner (which rule applies); Solicitor |
| P4 | MSA 5.3; OF §2–3 (Start Date, Period 1 invoice) | Period 1 invoice "on signature or up to seven days before the Start Date" | Master TODO §3 F06/F09: first-period treatment open; "An immediate start cannot rely on an invoice issued before the sale existed" | Fix before solicitor | Owner (first-period treatment); Solicitor |
| P5 | MSA 5.5; OF split-payment table; README C-11 | Implementation split "proposed 2 × £1,250" as a default, part 2 with the Period 2 invoice | D03 implementation at signature; F01 C4: split is an owner-approved per-deal exception, "never offered by default" | Fix before solicitor | Owner |
| P6 | MSA, OF (absent) | No deposit mechanism | Master TODO F01/F13 and D03 note: £250 refundable deposit and next-working-day access kept open, neither adopted nor rejected | Fix before solicitor (only if adopted) | Owner |
| P7 | README "Terms fixed"; OWNER_DECISIONS D-01 | Treats price and 14-day terms as "not reopened", pending D-01 approval | D03 decided the amounts (£10,000 / 12 weeks; £2,500 + 3 × £2,500) and changed the timing; solicitor wording pending (F05/F09) | Minor (amounts match; record D03 as the source) | Owner |
| P8 | MSA 2.1, Definitions; OF §2 | 12 weeks = three 28-day Service Periods; Initial Term end = Start Date + 83 days | D03 / F09: three 28-day periods, 84 days, not calendar months | Consistent. No action beyond solicitor check of continuation wording (MSA 2.2–2.3, C-01 notice still open) | Owner (C-01); Solicitor |
| P9 | App billing (not a contract, but the contract must match it) | n/a | `invoices.ts` drafts period invoices 7 days ahead and sets due = issue + 14 days, so a period would fall due about a week into the period, not by day 1 as D03 requires | Fix before solicitor (contract and app must agree before the first invoice) | Owner |
| P10 | MSA 13.2 | Termination if unpaid 21 days after due | Not covered by D03; interacts with P3 | Minor | Owner; Solicitor |

### 1b. Guarantee, risk reversal and claims

| # | Clause / location | Contract says | Source of truth says | Severity | Decision owner |
|---|---|---|---|---|---|
| G1 | MSA 7 (Day-7 installation milestone); OF §4 remedy line; README C-02 | Day-7 milestone with remedy Options A (time extension, recommended), B (credit) or C (refund of Implementation fee at Day 14) | F01 C3: milestone-refund line "withdrawn" from sales until D04–D06 close. D04 (23 Oct): owner chose remedy shape **C, proportional** shortfall refund on views, a different mechanism from MSA 7's Option C | Blocks signing (the contract would offer a remedy the owner has not chosen) | Owner (keep, drop or replace the milestone; relationship to D04); Solicitor |
| G2 | MSA 6.1, 6.3 | No guarantee of "any particular number of views"; the "only performance commitment" is the Day-7 milestone | D04 shape C is a views-based proportional refund, if offered. Target, fee at risk, media cap, eligible views, conditions and reserve are all open (D04–D06) | Blocks signing if any views remedy is offered; otherwise consistent | Owner (whether to offer at all); Solicitor (how a remedy schedule sits alongside a no-guarantee clause) |
| G3 | README "Terms fixed from the sources (not reopened)" | Lists "no guarantees of revenue, leads, views…" as fixed | Master TODO §0: "guarantee/refund/media cap/reserve… remain decisions"; D09 says the older blanket no-views-guarantee rule must be reconciled with later decisions | Fix before solicitor | Owner |
| G4 | MSA 3.3; OF §4 | "approximately 12 to 16 Core Assets per Service Period", "up to approximately three channels", video-led with text fallback | D01/D02 deferred ("decide in a bit"); F01 C6: neither multi-format nor short-form-only is decided; F01 calls 12–16 a "working hypothesis" | Blocks signing (the scope schedule cannot be completed) | Owner (D01, D02, D08) |
| G5 | MSA 3.5, OF §4 "Editing standard … as shown before signature" | Standard editing shown before signature | C01–C04 editing comparison not done; standard route not chosen (C09 §4: backup editor "none yet") | Fix before solicitor (examples must exist before first use) | Owner |
| G6 | MSA 3.2 | "scheduling and publishing through connected accounts or by hand" | C09 §4: publishing is manual for every platform at launch; E20: all client platforms manual until reviews pass | Minor (wording already allows "by hand") | Owner |

### 1c. Support, offboarding, export and retention

| # | Clause / location | Contract says | Source of truth says | Severity | Decision owner |
|---|---|---|---|---|---|
| S1 | MSA, OF (absent) | No support hours or response times | C09 §3 proposes hours (Mon–Fri, UK working hours) and targets; OWNER_DECISIONS D-07 recommends different times ("one working day" / "same working day"). C09 rule: no response time stated to a client until the owner approves | Fix before solicitor (decide whether support terms belong in the contract at all, and reconcile D-07 vs C09) | Owner |
| S2 | MSA 14.2; OF §8; DPA §8 | Export {{export_days}}, retention {{retention_days}}, audit logs {{audit_log_months}}; recommendation 30 / 90 / 6 years / 24 months | D-03 still undecided (C09 §6 item 4; OFFBOARDING "Owner decision pending"). App defaults match 30 / 90 | Blocks signing (placeholders) | Owner (D-03); Solicitor (match privacy notice and DPA) |
| S3 | MSA 14.1 | "prepare a full export of the Client's workspace data" and a list of contents | C09 §5: "everything" was an overclaim; export excludes internal staff notes, draft reports, intelligence and signals, tasks, tracked links and proof permissions; files are listed, not included | Fix before solicitor (avoid "full"; align the list with the corrected guide) | Owner; Solicitor |
| S4 | MSA 14.2 | Client "may download the export for {{export_days}} days" | C09 §5: each download link lasts seven days; the export window is the access period, so a client may need to prepare a new export | Minor | Owner |
| S5 | MSA 14.2; DPA §8 | Data retained, "then deleting it" | C09 §5: deletion is manual (super admin, typed confirmation), never on a timer; legal hold blocks it; the offboarding record is kept | Minor (operational commitment must be followed; consider saying the offboarding record survives) | Owner; Solicitor |
| S6 | DPA §5, §8 | Recovery "recommended RPO ≤ 1 hour, RTO 4 hours"; "Backups age out on the provider's point-in-time window (≥ 7 days)" | C09 §4: recovery objectives undecided; current Neon tier has "a short history"; RPO option B needs PITR ≥ 7 days (cost) | Fix before solicitor (DPA must not state a backup window not in place) | Owner |
| S7 | MSA 11.2 | On withdrawal of publicity approval, Threadline "will stop new uses promptly" | OFFBOARDING guide: "Withdrawing takes effect immediately" | Minor (align client guide and contract) | Owner; Solicitor |
| S8 | README "Not committed to git" | States drafts are not committed | The contract files are tracked in git | Minor (housekeeping) | Owner |

### 1d. Data protection and subprocessors

| # | Clause / location | Contract says | Source of truth says | Severity | Decision owner |
|---|---|---|---|---|---|
| D1 | DPA §4 Sentry/GlitchTip | Error reporting subprocessor, "CONFIRM which" | C09 §4: error alerts (Sentry) "not set up" | Fix before solicitor (list only live subprocessors) | Owner |
| D2 | DPA §4 processing worker; DPA §2 nature of processing ("transcription") | Worker "Not yet chosen"; transcription listed as processing | C09 §4: transcription "not connected" (B08), malware scanning off (DR-11) | Fix before solicitor | Owner |
| D3 | DPA §4 Vercel | Hosting subprocessor, region to confirm | C09 §4: Vercel to move from Hobby to Pro "before the first paying client" | Fix before solicitor (confirm plan and region) | Owner |
| D4 | DPA §6; MSA 8.6 | Generalised de-identified learnings across clients | README marks this the "Highest-risk item"; no newer source resolves it | Fix before solicitor | Solicitor |
| D5 | DPA §3 item 6 | Breach notice to client within {{breach_hours, proposed 48}} hours (C-16) | No newer decision | Fix before solicitor | Owner (C-16); Solicitor |
| D6 | MSA 10.3; DPA §9 | Privacy notice URL placeholder; privacy notice needed | D-09 open; master TODO F14 lists privacy/retention/cookie/ICO tasks as open | Blocks signing | Owner |

### 1e. Legal identity and insurance

| # | Clause / location | Contract says | Source of truth says | Severity | Decision owner |
|---|---|---|---|---|---|
| L1 | MSA Parties, signature; OF §1; invoice header | Entity, company number, address all placeholders | D-09 open; F04/F07 (Stripe business entity and KYC) unverified | Blocks signing | Owner |
| L2 | MSA 5.2; OF §3 VAT line; invoice | Either "not VAT registered" or VAT added | C-12 open (accountant) | Blocks signing | Owner (with accountant) |
| L3 | MSA 15.5 | Insurance statement placeholder | C-14 proposes PI cover before first client; F14 lists "applicable insurance" open | Fix before solicitor | Owner |

---

## 2. Placeholders still to fill

**Threadline identity (D-09):** `threadline_legal_entity`; entity type and company number; registered office or business address; signatory and title; day-to-day contact; notices email; billing email; privacy notice URL; bank account name and sort code (invoice).

**Tax:** VAT statement / VAT number (C-12).

**Fees and dates (per Order Form):** `implementation_fee`, `period_fee`, `initial_contract_value` (defaults present; confirm against D03); `order_date`, `start_date`, `kickoff_datetime`, `initial_term_end`, `baseline_start_date`; every invoice issue and due date in the schedule (to be recomputed once P1–P4 are settled); split amounts and reason, only if a split is approved.

**Commercial choices (README):** continuation notice days (C-01); risk-reversal remedy or its removal (C-02 / D04); revision rounds and Approval Window (C-03); late-payment pause (C-04); early exit (C-06); liability cap (C-07); client-block days (C-08); price-change notice (C-13); insurance statement (C-14); non-solicitation in or out (C-15); confidentiality years (MSA 9.4); breach-notice hours and subprocessor-notice days (C-16, DPA §3).

**Retention (D-03):** `export_days`, `retention_days`, `audit_log_months`.

**Scope (D01, D02, D08):** channels 1–3, format lead and fallback, repurposing rules, publishing responsibility per channel, reporting format, editing examples link, long-form YouTube pilot, other agreed items, Day-7 counts (3–5 pillars, 6–8 scripts) if the milestone stays.

**Versions:** `msa_version`, `dpa_version`.

**DPA §4:** region and transfer mechanism for each subprocessor; choice of error tracker and processing worker.

**Client fields** (completed per deal, not now): client legal name, company number, addresses, approvers, recording owner and cadence, access method per channel, data protection contact, testimonial answer.

---

## 3. Guarantee and refund wording: needs owner approval and solicitor review before any external use

None of the wording below is approved. It must not appear in outreach, sales calls, the website or a client-facing draft until the owner has approved it and a solicitor has reviewed it (master TODO §0; DECISION 2026-10-23; F01 §3).

| Location | Wording type | Flag |
|---|---|---|
| MSA 7 (whole clause) and OF §4 remedy line | Day-7 installation milestone; Options A (time extension), B (credit, amount blank), C ("refund backstop": refund of the Implementation fee, and unstarted period fees, if not delivered within 14 days) | **Owner approval + solicitor review.** Withdrawn from sales by F01 C3. Its Option C is not the D04 proportional remedy |
| MSA 6.1–6.3 | No-guarantee clause; "only performance commitment" is the milestone | **Owner + solicitor.** Must be reconciled with any D04 remedy schedule |
| MSA 3.3; OF §4 | "working scope, not a guarantee" for 12–16 Core Assets | **Owner + solicitor.** D01 open |
| MSA 13.3 | Refund of fees for unstarted periods on termination for Threadline's breach | **Solicitor** |
| D04 (internal only; not in any contract) | Proportional shortfall refund on views; target, fee at risk, media cap, eligible views, conditions and reserve all open | **Owner decision first (D04–D06), then solicitor (D06).** Not to be drafted into the contract until those are fixed |
| P6 (not in contracts) | £250 refundable deposit (F13) | **Owner decision first**, then solicitor |

---

## 4. Questions for the solicitor (short)

1. Payment timing (D03): can terms say period fees are "due by the first day of the period" and that no work starts on an unpaid period, while the Initial Term commitment (MSA 2.4) makes all three period fees payable? Debt or damages on early exit?
2. How should a first period be invoiced when service starts within 14 days of signature (F09)?
3. If a proportional views remedy (D04 shape C) is offered, how should it be drafted as a defined sole remedy alongside a general no-guarantee clause, and what consumer-style or advertising rules (CAP Code, DMCC Act 2024) apply to promoting it?
4. Should the Day-7 milestone stay as a service-level commitment if a views remedy is also offered, or would two remedies confuse the sole-remedy structure?
5. Is "approximately 12 to 16" safe from becoming a fixed-quantity obligation (MSA 3.3)?
6. Generalised learnings across clients vs processor status, including content sent to AI providers (MSA 8.6, DPA §6).
7. IP in AI-assisted outputs and assignment-on-payment timing (MSA 8.2; CDPA s9(3)).
8. Is a 48-hour processor breach-notice window appropriate, and should audit rights be questionnaire-first (DPA §3)?
9. Do support response times belong in the contract, an annex or only the onboarding guide?
10. Retention: does 30-day export + 90-day retention + manual deletion need stating differently in the DPA and privacy notice?
11. Liability cap level and UCTA reasonableness (MSA 15.3); insurance disclosure (15.5).
12. Automatic period-by-period continuation and notice prominence (MSA 2.2–2.3).

---

## 5. Suggested order (for the owner; not a decision)

1. Owner confirms D03 timing as contract input and decides P3–P6 (pause rule, first period, split default, deposit).
2. Owner decides whether any risk reversal goes into the contract now (G1–G3), or whether the contract proceeds with no remedy until D04–D06 close.
3. Owner decides D01/D02 (scope), D-03 (retention), D-07/C09 (support), D-09 (identity), C-12 (VAT).
4. Owner prunes the DPA subprocessor list to what is live (D1–D3).
5. Then send the drafts, this report and the decisions to the solicitor (F05).
