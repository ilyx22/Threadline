# G01: Landing-page audit against the offer (4 November 2026)

**REPORT ONLY. The public site is frozen and nothing was changed.** No source, copy or asset was edited, nothing was committed and no form was submitted. Rewriting is G02 and needs the owner, and publishing is G03/G08.

**Method.** Read-only GETs of the live pages on https://threadlinehq.com on 4 Nov 2026: `/`, `/how-it-works`, `/who-its-for`, `/playbook`, `/playbook/what-we-do-not-promise`, `/apply`, `/calculator`, `/privacy`, `/terms`, `/cookies`. All returned 200. The apply steps after step 1 and the success screen are client-rendered, so they were read from `src/app/(marketing)/apply/application-form.tsx`. The confirmation email was read from `src/lib/email/templates.ts` (`application_received`).

**Checked against:**
- [CA] `docs/launch-pack/claims/CLAIMS_AUDIT.md`
- [OD] `docs/launch-pack/OWNER_DECISIONS.md`
- [D23] `strategy/DECISION_2026-10-23_PRICE_AND_GUARANTEE_REMEDY.md`. D03 decided £10,000 for a 12-week initial engagement, made up of implementation plus 3 × 28-day periods, with no monthly framing. D04 decided the remedy shape (C, a proportional views refund) but its parameters are open and no guarantee wording may be used yet. D01 and D02 are deferred.
- [OB] `strategy/OFFER_BRIEF_2026-10-13.md`. This is D01's leading option: short-form video, fixed channels and two 60–90 minute recorded conversations per period.
- [H04] `sprint/emails/H04_FIRST_CAMPAIGN_PACK_2026-11-04.md`
- [H09] `sales/H09_RESPONSE_AND_NO_SHOW_PLAYBOOK_2026-11-04.md`
- Known facts: the price stays off the public site, the Calendly Diagnosis call is 60 minutes, and `NEXT_PUBLIC_BOOKING_URL` is unset.
- [F01] `sales/F01_SALES_SCRIPT_RECONCILED_DRAFT_2026-11-04.md` (a draft that appeared during this audit; not approved). Its "Never say" list includes "monthly", any founder-hours figure (including "twenty minutes") and "100m+ views / 10,000+ conversions". The live site says all three (H12, H9/F4, H3/P1), so the call script and the site disagree.

**Verdicts.**
- **OK** means consistent with the sources.
- **RISK** means unsubstantiated, unmeasured, ambiguous, or likely to confuse a buyer.
- **CONFLICT** means it contradicts a decided rule, another live statement, or the leading D01/D04 option. Rows that conflict only with the leading option are marked "(if D01)" or "(if D04)".

## 1. Per-page inventory

Types: **PR** promise/outcome · **PF** proof · **N** number · **T** time commitment · **$** pricing/period · **G** guarantee-like · **CTA** call to action (→ where it leads) · **L** legal.

### Home `/`

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| H1 | PR | "Make the expertise that wins you work visible before the sales call." | H04 rules (no outcomes) | **OK.** Positioning, with no result promised. |
| H2 | T | "You talk, record when useful, approve and sell. We run everything else." | OB §3; H09 T2 | **OK.** Matches the T2 one-liner. |
| H3 | PF/N | "Built by someone who has done it · 100m+ views · 10,000+ conversions" | CA P-01; H04 §rules | **RISK.** Substantiation is still open (source, timeframe, definition). H04 bans the same line in outreach, so the site states a claim sales may not repeat. |
| H4 | PR | "…when their problem arrives it is obvious who to call." | H04 (no outcomes) | **OK.** Describes the mechanism, with no number or timeframe. |
| H5 | N/$ | "Platforms are prescribed after diagnosis, not picked from a menu." | OB §2 (fixed channels); D02 | **CONFLICT (if D01).** The lead option drops "diagnose what fits" for fixed channels (LinkedIn, Shorts, Reels). |
| H6 | PR/G | "Slow on day one. Inevitable by day ninety." | D23 (no guarantee wording); H09 (no guarantees) | **RISK.** "Inevitable" reads as an assured outcome at 90 days, which is guarantee-like. |
| H7 | PR | "What you give us in week one is still working in month six." | D03 (12-week engagement) | **RISK.** An outcome claim that runs beyond the paid term. |
| H8 | T | "The weekly report shows what is true for your market" | H04 ("every four weeks we show you"); `period_review` email ("four-week review") | **RISK.** The cadence differs: the formal review is four-weekly and weekly digests are opt-in notifications. |
| H9 | T | "About twenty minutes of recording a week when it is useful, and one approval pass." | CA T-01 (no founder-hours number before measurement); OB ("an hour every two weeks") | **CONFLICT.** It breaks the Blueprint rule and is unmeasured (C01 dry run). It also differs from OB, the calculator (C2) and H09. |
| H10 | T | "Only where being on camera adds trust. Most of the work is written…" | OB §1–3 (short-form video core) | **CONFLICT (if D01).** Under the lead offer, most of the work is video. |
| H11 | T | "Onboarding takes 10 to 14 days" | CA T-06 (Day-7 installation aim); D03 (implementation paid at signature) | **RISK.** Differs from the internal aim and is not tied to the payment or kickoff sequence. |
| H12 | $ | "Is there a long contract? No. Engagements run month to month." | D03 (12-week initial engagement in 28-day periods); CA T-07; H09 ("never 'monthly'") | **CONFLICT.** It contradicts the decided terms and H14 on the same page. |
| H13 | $ | "…we recommend committing to at least the first twelve weeks." | D03 | **RISK.** Presents a fixed initial term as optional. |
| H14 | $ | "The first engagement is twelve weeks in three four-week periods." | D03 | **OK.** It matches, but sits beside H12. |
| H15 | $ | "Commercial terms are discussed on the call, once we both know it fits." | Price-private doctrine; H04 OA-8; H09 T3 | **OK.** No price is stated anywhere public. |
| H16 | N | "We take a small number of firms at a time." | H09 (no invented scarcity) | **RISK.** Fine if it is a true capacity limit; it needs a number the owner will stand behind. |
| H17 | G | "Leads, views and followers are not the scoreboard. Named enquiries and conversations are" | D23 D04 (views-based refund); OB ("guaranteed views") | **CONFLICT (if D04).** A views guarantee would make views the scoreboard. |
| H18 | L | "Who owns the content? You do. Every piece, transcript and asset…" | CA C-02 (client owns agreed outputs; Threadline keeps background IP) | **RISK.** Broader than the intended contract position, and the solicitor has not reviewed it. |
| H19 | PR | "Are you an agency? No. Threadline is a managed system…" | Category doctrine | **OK.** |
| H20 | PR | "Applications are read by a person and answered either way" | Success screen; confirmation email; OD D-07 | **OK.** Consistent across the journey. |
| H21 | CTA | "See if Threadline fits" / "See if it fits" → `/apply`; "Read the Playbook first" → `/playbook` | `NEXT_PUBLIC_BOOKING_URL` unset | **OK.** The links work. |
| H22 | L/CTA | Footer "Fine print: What actually matters" → `/playbook/what-we-do-not-promise` | G01 scope (legal links) | **RISK.** The link sits under the legal heading but opens Playbook chapter 8, which is not a statement of what is not promised. This matters once D04 exists. |

### How it works `/how-it-works`

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| W1 | T | "Seven stages every service period. You are needed at three of them, briefly." | CA T-01 | **RISK.** "Briefly" carries the unmeasured founder-time claim. |
| W2 | PR | "Login-walled platforms are refused by name, never scraped in the dark." | Platform-safety doctrine | **OK.** |
| W3 | PR | "Every factual claim is checked before it can be recorded." | Fact-check gate (software) | **OK.** A process claim backed by the gate. |
| W4 | T | "You record against a teleprompter. The Builder cuts and packages." | OB §2–3 (Threadline interviews the founder; clips come from conversation) | **CONFLICT (if D01).** Under the lead offer the founder does not use a teleprompter. |
| W5 | PR | "Paid amplification is recorded separately from organic reach" | OB §4 | **OK.** Consistent. |
| W6 | PR | "…a bad period reads as a bad period." / "never upgrades weak evidence into strong" | Reporting doctrine | **OK.** |
| W7 | PR | "Each gate is a rule in the software, not a policy in a document." | Backend ledger | **OK.** Confirm all four gates are live before G08. |
| W8 | N | "A piece younger than 14 days is 'too early to read', not diagnosed." | Playbook chapter 6 ("Read in 14 days") | **OK.** |
| W9 | PF | "Synthetic demonstration: illustrative, not a client result" | H04 (no invented results) | **OK.** Clearly labelled, including "One booked call". |
| W10 | CTA | "See it run on your business" → `/apply`; "Read the Playbook" → `/playbook` | — | **OK.** |
| W11 | CTA | "Apply for a diagnosis. We read every application and reply either way" → `/apply` | Confirmation email | **OK.** |

### Who it's for `/who-its-for`

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| F1 | PR | "Expert-led B2B businesses with something proven to sell." | OB (lead segment: AI/tech advisory) | **OK.** Wider than the likely niche. G02 narrows it if D01 picks one. |
| F2 | PR/N | "…content that starts one conversation a month pays for itself." | CA C-01; H04 (no outcomes) | **RISK.** Reads as an outcome or ROI claim. |
| F3 | N | "If it is worth forty pounds, this is the wrong tool." | — | **OK.** |
| F4 | T | "Twenty minutes of recording and one approval pass a week." | CA T-01/T-04; OB | **CONFLICT.** Same as H9. |
| F5 | $ | "Three 4-week periods before anyone can say what works for your market." | D03 | **OK.** |
| F6 | G | "Leads, views and follower counts are not the measure; named enquiries are." | D04 | **CONFLICT (if D04).** Same as H17. |
| F7 | T | "A report every week that shows what shipped, what we expected, what happened…" | H04; `period_review` email | **RISK.** Same cadence mismatch as H8. |
| F8 | PR | "Not a tool you learn. Not a ghostwriting retainer… Not an agency that stops at publish." | Category doctrine | **OK.** |
| F9 | G | "Not a fit: Wants guaranteed reach or virality" | D04 (views refund); OB headline | **CONFLICT (if D04).** The site turns away the buyer a views guarantee attracts. |
| F10 | PR | "Not a fit: Wants engagement pods or automation" | Platform safety | **OK.** |
| F11 | PR | "The application is a diagnostic… we will say so, and you keep the finding." | H09 (no application-reply template) | **RISK.** It promises each applicant a written finding, but no template or owner covers that step. |

### Playbook `/playbook` (and `/playbook/what-we-do-not-promise`)

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| P1 | PF/N | "100m+ views · 10,000+ conversions" (hero) | CA P-01; H04 | **RISK.** Same as H3. |
| P2 | N | "8 chapters · 0 vanity metrics" / "15 minutes, fully interactive" / "No email wall." | — | **OK.** |
| P3 | N | "The buyer for a £20,000 engagement is not on every platform." | Price-private doctrine | **OK.** An example buyer, not Threadline's fee. It could still be misread as a price signal. |
| P4 | PR | "Distribution is choosing the two rooms they are in…" | OB/D02 lead (three channels) | **RISK.** "Two rooms" differs from the leading channel set. |
| P5 | N | "A model of your assumptions, not a forecast." (funnel tool) | H04 (no forecasts) | **OK.** Well caveated. |
| P6 | PR | "Every claim checked? Always." / "The report shows a bad week as a bad week." | Fact-check gate; H8 | **OK.** "Week" repeats the weekly framing (see H8). |
| P7 | PF/N | "This playbook is the fifth of the system we can give away." | — | **RISK.** An unsupported fraction. |
| P8 | PR | "If you run a 7, 8 or 9-figure firm…" | Apply revenue bands (from "Under £250k"); F1 | **RISK.** Segment mismatch: the form accepts firms below seven figures. |
| P9 | CTA | "…want the other four-fifths run for you, book a call." · button "Book a call" → `/apply` | `NEXT_PUBLIC_BOOKING_URL` unset | **RISK.** The label promises a booking, but the link opens the application form, which offers no booking. |
| P10 | CTA | "See if Threadline fits →" (Diagnose tool) → `/apply` | — | **OK.** |

### Apply `/apply` (form and success screen)

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| A1 | $ | "Founding client programme" | OD D-01; D03 (founding terms are not public) | **RISK.** Implies special terms that are defined nowhere public. Privacy reuses the phrase. |
| A2 | PR | "Apply for a diagnosis, not a pitch." | H15 (terms discussed on the call); H09 T3 (price moves to the call) | **RISK.** The 60-minute Diagnosis call is also the commercial call. |
| A3 | PR | "Sometimes the honest finding is that more content would make the problem more expensive" | — | **OK.** |
| A4 | T | "Three short steps, about four minutes. Read by a person. Replied to either way." | Form (3 steps) | **OK.** |
| A5 | T | Success: "A person reads every application, usually within one working day." | Email `application_received`; OD D-07 | **OK.** Consistent. |
| A6 | CTA | Success fallback: "No booking link is configured on this installation, so scheduling happens by email…" | Env unset; Calendly Diagnosis is 60 minutes | **RISK.** Internal system wording shown to buyers, and it gives no call length. |
| A7 | PR | Success: "…including if we do not think we are the right fit, and why." | F11 | **OK.** It inherits F11's operational gap. |

### Calculator `/calculator`

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| C1 | N | "Nothing here projects revenue." | H04 (no forecasts) | **OK.** |
| C2 | T/PR | "Scenario: a workflow where you only record and approve · 1.4 hrs per week… valued at £85.5K" | CA T-01; H9 (20 minutes); OB | **RISK.** A third founder-time figure (1.4 h against 20 minutes), and the money value sits right next to the Threadline CTA. |
| C3 | CTA | "See if Threadline fits" → `/apply` | — | **OK.** |

### Footer, nav and legal (every page)

| # | Type | Exact quote | Checked against | Verdict and reason |
| --- | --- | --- | --- | --- |
| L1 | PR | "You talk. You record. You approve. You sell. Threadline handles the machine." / "Installed and run with you, not sold self-serve." | H09 T2 | **OK.** |
| L2 | L | Privacy: "Threadline is a founding-client programme and the operating company is being set up." | OD D-09; H04 line 4 (outreach footer points to /privacy; CM9 open); master to-do F2 | **RISK.** No legal entity, address or contact email, yet cold-email footers send people here for UK GDPR Art. 14. |
| L3 | L | Terms and Cookies: "Last updated 26 September 2026"; the terms cover use of the site only | D03 (commercial terms belong in the contract) | **OK.** Consistent with this being a site-use page. |
| L4 | CTA | "Sign in" / "Client sign in" → `/login` | — | **OK.** |

**Counts: 68 rows. OK 36, RISK 23, CONFLICT 9.** Of the 9 conflicts, 3 stand today (H9, F4, H12) and 6 depend on D01 or D04 (H5, H10, W4, H17, F6, F9).

## 2. Journey consistency (outreach / site → apply → confirmation → call → follow-up → contract)

| Step | What the buyer meets | Mismatch |
| --- | --- | --- |
| Outreach (H04) | No links, no price, no guarantee, no "100m+ views". Says "every four weeks we show you…" | **The site carries the proof band (H3/P1) that outreach is banned from using**, and says the report is weekly (H8/F7) where outreach says four-weekly. |
| Site → apply | Every CTA, including the Playbook's "Book a call", goes to `/apply`. No call length is shown anywhere. | **"Book a call" leads to a form with no booking (P9).** An outreach lead gets the Calendly Diagnosis link directly (H09 T1) and never sees `/apply`, so there are two entry routes with different first steps. |
| Apply success | "Usually within one working day"; booking box hidden because `NEXT_PUBLIC_BOOKING_URL` is unset | **The fallback text sounds internal (A6).** Nothing tells the applicant the call is 60 minutes. |
| Confirmation email | "We have your application… We reply either way, usually within one working day." | Consistent with the site. It has no next steps, no call length and no mention of the "finding" promised in F11. |
| Reply to applicant | H09 covers outreach replies only | **No template, owner or SLA exists for answering a site application, including the "you keep the finding" not-a-fit reply** (F11/A7). The one-working-day promise is public but not operationalised in H09. |
| Call | Calendly Diagnosis, 60 minutes (H09/F03). `BOOKING_QUESTIONS` §1.8A still says 45, and CA T-11 says 45 was proposed. | The site frames it as "a diagnosis, not a pitch" (A2), while the home FAQ and H09 T3 put commercial terms on that call. The internal 45/60 split is flagged in H09. |
| Follow-up | H09: never "monthly"; price off the public site; no guarantee | **The home page says "month to month" (H12)**, which contradicts H09 wording and D03. Price-private is consistent everywhere. No guarantee appears anywhere today, which is consistent with D04's "no wording yet". |
| Contract and payment | D03: 12-week initial engagement; implementation paid at signature; each period invoiced 14 days ahead | **"No long contract… month to month" (H12) contradicts this directly.** "Onboarding 10 to 14 days" (H11) is not tied to signature or payment. "You own everything" (H18) is broader than the IP position in CA C-02. |

## 3. What G02 would need to change (once D01/D04 are decided, for owner approval)

1. **Commercial term (needed now, whatever D01 decides).** Replace "No. Engagements run month to month" and the "recommend twelve weeks" line with the D03 shape: a 12-week initial engagement in three four-week periods, with no price. Remove the contradiction with H14.
2. **Founder time.** Choose one measured figure from the C01 dry run and use it everywhere: H9, F4, W1, C2's 1.4 h scenario and sales. If D01 follows OB, describe it as recorded conversations per period, not "twenty minutes a week".
3. **Report cadence.** Either confirm a weekly client report exists, or change H8, F7 and P6 to the four-weekly review that H04 and the `period_review` email use.
4. **If D01 is short-form video:** rewrite the on-camera FAQ (H10), "platforms prescribed after diagnosis" (H5), the teleprompter stage (W4), "two rooms" (P4) and the four-format section. If a niche is chosen, narrow the buyer (F1, P8) and align the apply revenue bands.
5. **If D04 is a views refund:** reconcile "views are not the scoreboard" (H17, F6, Playbook chapter 8) and "Not a fit: wants guaranteed reach" (F9). Either publish the guarantee with full, solicitor-reviewed terms (ASA/CAP: limitations clear before purchase) and link it from the "Fine print" footer (H22), or keep it off-site and give sales a line that explains the apparent contradiction.
6. **Proof.** Substantiate "100m+ views / 10,000+ conversions" and "Built by someone who has done it" on file, or replace them with proof that outreach may also use (H3, P1). Drop or support "the fifth of the system" (P7).
7. **Outcome wording.** Soften "Inevitable by day ninety" (H6), "still working in month six" (H7) and "pays for itself" (F2).
8. **Onboarding and ownership.** Align "10 to 14 days" with the Day-7 aim and the signature-then-kickoff sequence (H11). Have the solicitor word content ownership (H18).
9. **Booking path (G08).** Set `NEXT_PUBLIC_BOOKING_URL` to the 60-minute Diagnosis event, state "60 minutes" on the CTA and success screen, rename or relink the Playbook "Book a call" (P9), and replace the internal fallback text (A6). Reconcile "a diagnosis, not a pitch" (A2) with the call's commercial role.
10. **Founding programme and legal identity.** Define "Founding client programme" or drop it (A1). Add the trading entity, address and contact to /privacy before cold-email footers point there (L2, D-09/F2).
11. **Operational (not copy).** Add an applicant-reply template, with the not-a-fit "finding", to H09 so that F11/A7 and the one-working-day promise are kept.
