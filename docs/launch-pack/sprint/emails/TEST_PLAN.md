# CE1 test plan: one segment, Loom placement, 1,000 first touches

**Status:** ADAPTATION (draft, owner review), 26 September 2026; restructured the same day to the revised authority order (`../authority/AUTHORITY_ADDENDUM.md`, "ADD"). Nothing has been sent. The emails are in `CAMPAIGN_PACK.md`; read its §0 (authority order, blockers, infrastructure) first. This replaces the earlier "first 300 sends across four segments" plan.

**Method authority (in rank order, ADD §B):**
- **EasyGrow 2.0** (Imperium Acquisition): "9_ Sending Looms" (Drive `1FH9_rgnEGJXjfc9PsenWP27pAfcnb4n1`) for the sequence and daily volume; "10_ Managing Prospects" (`1_DJsPQ_dVQIQQQaaCF_1ZJNkLck_NQb9`) for labels and the Engaged track; Loom Alchemy Metrics (`1Vdw1icoz-5eYm2lYBDnZfQ3MpFi7BrcY`), The Loom Doctor (`1zTcCZN4G6wYwiIB_puMXeDHzwVieWWQM`) and Testing Flow (`1VZUEj8iTCfN2fte5cXV8_kgqBKsMEpAA`) plus the Loom OS versions (`1bLrCyZd…`, `1yedXPko…`) for KPIs, sample sizes and the one-variable rule; "14 Your Easygrow Roadmap" (`1OgnSxoIlNyxNo-I91G0iIUxXdy7VVrPl`) for "Choose ONE system" and the 120-day commitment; "15 Scaling_ Account Creation" (`1oS-3LmrkXclDZMp6QHAz_eaKaqDdVORG`) for infrastructure; Theory of Show Rate (`1gYEyOre…`) for show-rate reads.
- **Imperium Academy-level Threadline documents** (now rank 3): Execution Manual V14.3 §10 control loop (Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`); Control Loop and Acquisition Operating Manual V14.2 (local, `Threadline Final Working Resources/03 Acquisition and Sales/`); GTM SOP §§7, 11, 22 (Drive `1Nwp2mzwaR8CNYKtxzvob2pLTBm0sCA_uoMmvEr5vP_g`); First US Playbook V1 "Protect qualified inventory" (Drive `1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s`).
- **Fazio** (tactical, rank 5): Commercial Response Validation and reply-to-booking tracking (Fazio Integration Audit items 1 and 5, Drive `1R_z8MqPbe2OflFNKCUNeCsXDsaKSKl--gflF5i7rX98`).

---

## 1. What this test is, and is not

- **It is** the first EasyGrow proof-of-concept cell: one segment (recommended S2, strategy and GTM consulting; `CAMPAIGN_PACK.md` §5.1), one system (Loom OS cold email), one variable (where the Loom sits).
- **It is** a Commercial Response Validation batch in the EM §5 sense, now run by volume rather than after an interview gate (ADD D1).
- **It is not** a four-segment comparison. EG: "Choose ONE system to start"; "Don't try to run 4 systems at once unless you have a team" (Roadmap). At 100 a day, four cells cannot each reach a 500-first-touch sample in reasonable time (ADD D3).
- **It is not** a market verdict. GTM §22 still holds: one copy angle, one lead source, broken deliverability or a small noisy sample is not market failure.

"First touches" means distinct people receiving step 1. Steps 2–4 and Engaged-track touches are counted separately.

---

## 2. Design

### 2.1 Cells and split

| Cell | Segment | Arm | Email 1 | Loom | First touches |
|---|---|---|---|---|---|
| CE1-S2-A | S2 strategy / GTM | **Loom-led** | Loom OS body with Loom link | Step 1 | 500 |
| CE1-S2-B | S2 strategy / GTM | **Loom in follow-up 2** | Loomless body, video offered | Step 3 | 500 |
| | | | | **Total** | **1,000** |

- **Random assignment:** sort each day's verified batch randomly, then alternate A, B. Never hand-pick "the good ones" for either arm.
- **Geography:** split UK/US as evenly as the list allows and record it. Geography is a cell attribute, not a test variable; do not read it at this sample size.
- **If the owner picks S1 instead** (`CAMPAIGN_PACK.md` §5.1 alternative), the design is the same with S1 in both arms.

### 2.2 The one variable

Loom placement (step 1 versus step 3). Segment, first-line standard, offer sentence, conviction points, risk-reversal line (or its absence), subject, sender pool, send window, footer, bumps and the Engaged track are identical. Arm assignment holds for all four steps.

Why this variable first: Loom recording is the biggest cost of the whole system (about 90–100 Looms a weekday at steady state, §2.3). If arm B (Loom only to people who have not replied by step 3) books as well as arm A, the system needs fewer, better-targeted Looms. EG's own guidance points both ways: Loom OS puts the Loom in the main email; the follow-up creation module uses "bump + loom" on the second follow-up (ADD D5, C.5).

### 2.3 Schedule and capacity

**Target:** 100 new first touches a weekday (50 per arm) once the domain set has warmed for at least 2 weeks (ADD D2; EG-SEND "100 MAIN → 100 FUP1 → 100 FUP2 → 100 FUP3"). The steady-state day is about 100 + 95 + 90 + 86 ≈ **370 emails** across 20 inboxes, inside the 20-per-inbox cap only if warm-up is light (see `CAMPAIGN_PACK.md` §0.4 capacity check).

| Business day | First touches | Step 2 (+2) | Step 3 (+4) | Step 4 (+7) | Total | Looms recorded |
|---|---|---|---|---|---|---|
| 1–2 | 100 | — | — | — | 100 | 50 (arm A) |
| 3–4 | 100 | ~95 | — | — | ~195 | 50 |
| 5–7 | 100 | ~95 | ~90 | — | ~285 | 50 + ~45 (arm B step 3) = ~95 |
| 8–10 | 100 | ~95 | ~90 | ~86 | ~371 | ~95 |
| 11–12 | — | ~95 | ~90 | ~86 | ~271 | ~45 |
| 13–14 | — | — | ~90 | ~86 | ~176 | ~45 |
| 15–17 | — | — | — | ~86 | ~86 | — |

- **1,000 first touches in 10 business days**; the last step 4 goes out on about business day 17. Allow **7 more business days** for late replies and bookings before the full read (C3), so the read lands in about week 5 after the first send, plus 2–4 weeks of warm-up before it.
- Assumes about 5% of people leave at each step (reply, bounce or opt-out).
- **Capacity:** 100 verified prospects a weekday is 4–7 hours of sourcing by EG's own sizing, and the Looms are another 4–5 hours at steady state (about 3 minutes each to record, name and load). That is more than one owner can do alongside replies and calls (`../stack/LEAD_GEN_SYSTEM.md` §6.4). **Owner decision (B10):** hire a lead sourcer (EG keeps deliverability, metrics, testing and engaged prospects in-house but allows sourcing to be delegated) or run the **solo fallback: 50 new a weekday (25 per arm)**, which takes 20 business days to reach 1,000 and keeps every other rule the same.

### 2.4 Checkpoints (instrumentation before judgement)

| Checkpoint | When | Check | If it fails |
|---|---|---|---|
| **C0** | Before send 1 | Full 4-step sequence for both arms sent to seed inboxes (Gmail and Outlook) from every domain. Merge fields, spintax output, Loom link, footer, unsubscribe, reply routing. | Fix; do not send |
| **C1** | After the first 100 first touches (day 1) | Every merge field correct; per-inbox bounce under 2%; no complaint; replies arriving in the monitored inbox; every Loom opens and is named after the prospect | Pause and fix before continuing |
| **C2** | After the first 300 first touches (day 3) and then **weekly** | Per-inbox bounce, complaints, seed placement **per arm** (arm A carries a link in email 1), blocklist check on every domain | Pause the affected inbox or domain; fix deliverability before any copy change |
| **C3** | 500 first touches per arm, all steps done, plus 7 business days | Full read (§4, §5) | — |

Hard stops at any time: an inbox reaching **5% bounce** (stop its sequence; warn at 2%); a second spam complaint in the cell; any blocklist listing. Pause that inbox or domain and investigate.

---

## 3. What to measure

Record per cell (arm), per step and per inbox. Keep raw counts, not only rates. **Attribute every event to the prospect's initial send date** (EG Loom Alchemy Metrics).

| Metric | Definition | Where |
|---|---|---|
| First touches | Distinct people sent step 1 | Sending tool |
| Sends | All emails, by step | Sending tool |
| Bounces / bounce rate | Hard bounces ÷ sends, per inbox | Sending tool |
| Spam complaints | Postmaster Tools / tool | Postmaster Tools |
| **Loom views (LVR)** | Looms viewed at least once ÷ Looms sent, from Loom's own counts. Arm A counts from step 1; arm B from step 3. | Loom |
| **Human replies** | Any human reply (exclude auto-replies and out-of-office; include opt-outs) | Inbox → `/admin/prospects` |
| **Positive replies (PRR)** | Replies labelled **Engaged** (anything that is not directly negative, EG-MGMT) ÷ first touches | `/admin/prospects` label |
| **Booked (ABR)** | Diagnosis calls booked ÷ first touches | SalesCall created |
| Showed | Call happened | SalesCall `attended` |
| Qualified | Fit and economics confirmed | SalesCall `qualified` |
| Closed | Paid and signed | SalesCall / order |
| Opt-outs | Replies or clicks asking to stop | Suppression list |
| Reply response time | Hours from their reply to ours (target under 6) | Inbox |
| Step of reply | Which step the reply followed | Tool |
| Engaged touch that booked | ENG-1 to ENG-8, or direct | `/admin/prospects` |
| Sourcing and Loom minutes | Per 100 prospects; per Loom | Timer / notes |

Opens are not tracked (plain text, tracking off; EG-COPY). Record the channel on every touch; do not blend cold email with LinkedIn, warm or inbound results (CL "Channel rule").

---

## 4. Sample gates and KPI floors

### 4.1 KPI floors (EG Loom OS; Loom Alchemy in brackets)

| Metric | Floor (Loom OS) | Loom Alchemy range | Threadline status |
|---|---|---|---|
| LVR | 10% | 15–25% ("Minimum!") | Planning benchmark, not a Threadline fact |
| PRR | 2% | 3–5% | Same |
| ABR | 1% | 1.5–2.5% | Same |
| Show rate | EG expects no-shows 10–20% of the time | — | Read only after 30 bookings |

Rate meanings follow EG usage (ADD C.11: "inferred from usage"). Once Threadline's own samples meet the gates below, its actuals replace these (ADD §B rank 4).

### 4.2 Do not judge before (ADD E.1.7)

| Question | Gate | Notes |
|---|---|---|
| Is deliverability broken? | Any time on a hard stop; otherwise C2 | Hard stops in §2.4 |
| Is the Loom being watched? | 100 Looms sent in the arm | LVR |
| Does the Loom produce interest? | **45 Loom views** | PRR read |
| Does interest become bookings? | **9–10 positive replies** | ABR read |
| Does the cell work at all? / A versus B | **About 500 first touches per arm**, all steps done, plus 7 business days | No copy or offer decision before this (ADD D2) |
| Show rate | **30 bookings** (Theory of Show Rate) | Across both arms; fix reminders, not outreach |
| Qualification | 10 calls held | — |
| Sales script | 30–50 calls held (EG sales reps; AOM §11 "about 30") | Before wholesale script changes |

A rate whose denominator is under 10 is still too thin to read.

### 4.3 A versus B, honestly

At 500 per arm, a floor-level ABR is about 5 bookings per arm, so even a doubling (5 versus 10) is not statistically reliable. The rule is practical:
- **Arm A wins** if its bookings are at least **1.5×** arm B's **and** at least **4 more**; then Loom-led becomes the standard.
- **Arm B wins** on the mirror rule; then Looms go only to step 3 non-responders.
- **Otherwise "no clear difference":** choose by **owner minutes per booking** (sourcing plus Looms plus replies). If still tied, use arm B (fewer Looms).
- **If ABR is at or above 1% in either arm, change nothing else** in that arm (EG Testing Flow: "If ABR is in KPI, change nothing"); scale volume instead.

### 4.4 What 1,000 first touches can realistically buy

At the Loom OS floors, 1,000 first touches give about 100 Loom views (arm A plus arm B's step 3), 20 positive replies and 10 bookings. At the Loom Alchemy midpoint it would be about 20 bookings. After C3, replace the floors with actuals and recompute (§6).

---

## 5. First-broken-stage decision table

Work top to bottom. Fix only the **first** stage that fails; everything downstream is unreadable until it is fixed (EG Testing Flow; EM §10; PB "Protect qualified inventory"; GTM §11). Thresholds are the EG floors in §4.1.

| # | Symptom (after its §4.2 gate) | Broken stage | Check, in this order | The one variable to change next |
|---|---|---|---|---|
| 1 | Bounce 2%+ in an inbox, complaints, spam placement or blocklist | **Deliverability** | SPF, DKIM, DMARC; warm-up age; per-inbox volume (20 cap, warm-up included); the arm A link; list verification | Infrastructure fix. Never raise per-inbox volume; add inboxes. Resume only when seeds land in the inbox. |
| 2 | Clean placement, **LVR under 10%** after 100 Looms | **List or first line** | (a) Re-check 20 sent contacts against `BULK_LIST_FILTER_SPEC.md`; under about 70% pass → list. (b) Screened inboxes (assistants replying) → channel (Loom Doctor). (c) Otherwise the first line / subject is not earning the click. | (a) one list filter; (b) flag the segment for another system; (c) a different first-line pattern (`CAMPAIGN_PACK.md` §9 row 2) |
| 3 | LVR in KPI, **PRR under 2%** after 45+ views | **Loom / offer** | Is the offer said in the first 20 seconds? Is the Loom under 2 minutes? Is the observation specific? Read the reply wording. | Loom opening (§9 row 1), then the offer sentence (§9 row 3) |
| 4 | PRR in KPI, **ABR under 1%** after 9–10 positive replies | **Reply handling / booking** | Reply time under 6 hours; booking link works; slots 2–4 days out and 10+ visible; questions answered with curiosity plus the link (`REPLY_PLAYBOOK.md`); Engaged track actually run to 8 | Reply template for the dominant question, or the booking event. Not outreach volume. |
| 5 | 30+ bookings, show rate under 80% | **Reminders / pre-call** | 24-hour confirmation, the one-hour "still good for our call?" message, no-show protocol, booking horizon (never more than 5 days) | Reminder sequence (`SALES_CALL_GUIDE.md` §0.1). "If booking rate is good and show rate is poor, fix this stage instead of increasing outreach" (EM §14). |
| 6 | 10+ calls held, under about 50% qualified | **Qualification / targeting** | Which filter let them through: size, keywords, economics? | One list filter |
| 7 | Qualified calls but no closes | **Offer / sales** | Outside this test; `SALES_CALL_GUIDE.md`. No wholesale changes before 30–50 calls. | — |

If every stage is in KPI, add volume (new domains and inboxes), not changes (EG "Better to pump more volume into a 'sub-par' system than to try improving it"; AOM §14 "More → Better → New").

---

## 6. The one-variable rule and the Friday loop

- **One meaningful variable per cycle,** aimed at the first broken stage (EG Testing Flow "Ceteris Paribus"; EM §10; CL "Friday recalculation").
- **Never change niche + offer + message + channel together** (CL; AOM §11).
- **Stay on the one system for about 120 days** unless it is shown to be screened (EG Roadmap; Loom Doctor). Give it 2–4 weeks to reach full capacity before reading anything (EG Cold Email Mastery).
- **Version everything:** `CE{test}-{segment}-{arm}-step{n}`, e.g. `CE1-S2-B-step3`. The next test is `CE2-…`; keep the previous version as the control where volume allows.
- **No mid-test changes** except checkpoint fixes (errors, deliverability, legal defects).

### Friday control loop

1. Freeze the week's raw counts, attributed to initial send dates.
2. Calculate LVR, PRR and ABR per arm (only where the denominator is 10 or more) and compare with §4.1.
3. Recalculate: `required first touches = target closes ÷ (ABR × show × qualified × close)`, then `daily quota = remaining required first touches ÷ remaining working days` (CL; EM §10). Floors stay labelled as benchmarks until replaced.
4. Identify the first broken stage (§5), only for metrics past their gate.
5. Change one variable, or nothing ("If ABR is in KPI, change nothing").
6. Preserve every other variable and the previous version.
7. Export the suppression list; re-verify next week's batch.

---

## 7. Results sheet (one row per arm per step per week)

`test_id | segment | geography | arm | step | message_version | inbox | domain | initial_send_week | first_touches | sends | bounces | complaints | looms_sent | loom_views | human_replies | engaged | not_interested | opt_outs | booked | showed | no_show | qualified | closed | median_reply_hours | sourcing_minutes | loom_minutes | notes`

At C3, write a one-page read: first broken stage, the arm decision and why, the one variable for CE2 (or "none: in KPI, add volume"), and any reply language worth copying into `REPLY_PLAYBOOK.md`.
