# F01: reconciled diagnosis-call script (DRAFT, 4 November 2026)

**Status: DRAFT for owner approval. Not approved.** Prepared by Claude for master to-do **F01** ("Reconcile and approve the sales script"). Nothing was sent, configured or changed. No existing file was edited. When the owner approves it, this file becomes the live script, and `SALES_CALL_GUIDE.md` and `LIVE_CALL_ONE_PAGER.md` become reference material until they are re-cut to match.
**Internal only.** It contains commercial terms. Pricing never appears on the public site.

**What the owner must approve (tick each one, or strike it and give a reason):**
1. [ ] The 60-minute run-of-show and its stage order (§1).
2. [ ] Every line marked **NEW — needs approval** (§2).
3. [ ] Every line marked **GUIDE ADAPTATION**: existing draft wording from `SALES_CALL_GUIDE.md` that is reused here and has never been approved.
4. [ ] The conflict resolutions in §6, each one individually.
5. [ ] That the placeholders in §3 stay **unfilled** until D01, D04, D08, F06/F09 and F13 are decided. This approval does not decide any of them.

**Labels.** **[LIB X]** = founder-approved passage X in `APPROVED_VERBATIM_LIBRARY.md`. Read it from there word for word; it is not re-typed here. **[EM]** = Execution Manual V14.3 source wording, quoted verbatim in `SALES_CALL_GUIDE.md` at the section cited. **[GUIDE §n ADAPTATION]** = existing unapproved draft line. **NEW — needs approval** = written for this file. **[PENDING Dxx]** = a placeholder that waits for that decision.

**Facts this draft relies on (checked 4 November 2026):**
- The Diagnosis event in Calendly is **60 minutes**, with four hours' minimum notice and a 15-minute buffer (master to-do F03). Founder Research is a separate **20-minute** event and is never used for selling (`RESEARCH_INTERVIEW_SCRIPT.md`; H09 §2, research track).
- The app's sales call (`/admin/prospects/[id]`) records one outcome: `won`, `follow_up`, `proposal_process`, `not_fit` or `lost`. It **refuses** any outcome other than `not_fit` until `economics`, `current_state`, `constraint` and `consequence` are marked covered. It refuses every outcome without the prospect's exact words (VOC). It refuses `follow_up` and `proposal_process` without a next action and a date (`src/lib/domain/sop.ts`, `assertCallOutcome`).
- The default offer in the app config is **£2,500 implementation plus £2,500 per 28-day period, three initial periods (£10,000, 84 days)**. D03 (owner, 23 October) keeps this price and sets the timing: implementation is paid at signature; each period is invoiced 14 days ahead and due by its first day; no work on a period before it is paid; solicitor wording pending (`../strategy/DECISION_2026-10-23_PRICE_AND_GUARANTEE_REMEDY.md`). **D01** (what the offer delivers) is deferred. **D04** is partly decided: the owner chose a proportional remedy shape internally, but the target, the fee at risk and the conditions are open, and **no guarantee wording may be used in sales**.

---

## 1. Run-of-show: 60 minutes

Stage order follows the Execution Manual §15 state map, which the app's `CALL_STAGES` mirrors. The wording is flexible; the information each stage captures is not. Times are budgets. If diagnosis runs long, cut the demo, never VERIFY.

| Clock | Stage (app field) | Purpose | Lines (§2) | Must capture before moving on |
|---|---|---|---|---|
| 0:00–0:03 | **Opening and permission** (`open`) | Recording consent, agenda, why now, who decides | 2.1 | Consent yes or no; decision-maker(s); why now |
| 0:03–0:10 | **Economics** (`economics`, required) | What one good client is worth | 2.2, [LIB D] later | Deal value, margin if shared, cycle, close rate, capacity, current sources |
| 0:10–0:17 | **Current state** (`current_state`, required) | How content is made today, and who does what | 2.3 | Who researches, writes, records, edits, approves, publishes; their own time, in their words |
| 0:17–0:20 | **Desired state** (`desired_state`) | What "working" means to them | 2.3 | Their words for success in 90 days and how they would know commercially |
| 0:20–0:26 | **Constraint** (`constraint`, required) | The one place the problem bites | 2.4 | Primary constraint, plus at most two secondary ones |
| 0:26–0:30 | **Consequence** (`consequence`, required) | The cost of leaving it unchanged | 2.4 | Their numbers: time, consistency, pipeline, pricing power |
| 0:30–0:32 | **Verify diagnosis** (noted under `constraint`) | Play the diagnosis back; they confirm or correct | 2.5 | Their yes. No prescription without it |
| 0:32–0:36 | **Prescription** (`prescription`) | How the standard process meets their constraint | 2.6, [LIB C], [LIB F] | Their reaction, in their words |
| 0:36–0:42 | **Relevant demo** (`demo`) | One path through real app screens, matched to the constraint | §4, [LIB I], [LIB H] | Which path, and whether it landed |
| 0:42–0:48 | **Offer fit and commercials** (`commercials`) | Terms, scope, exclusions, their economics against the fee | 2.7, [LIB D], [LIB E], [LIB G] | Their first reaction to the price, verbatim |
| 0:48–0:56 | **Decision** (`decision`) | Name the actual blocker; ask for the decision | 2.8, §5 | The blocker and the answer |
| 0:56–1:00 | **Next step and dated follow-up** (`decision`) | Leave with one state and a date | 2.9 | Outcome, next action, owner, due date, open question |

**Disqualify early, kindly.** If the business-model filter or a disqualifier fails (`SALES_CALL_GUIDE.md` §2), say so at that point and close as `not_fit`. The app allows `not_fit` without full coverage, and it still needs their words.

---

## 2. Lines by stage

### 2.1 Opening and permission (0:00–0:03)
- Consent, said before anything else [GUIDE §3 ADAPTATION]: "Before we start: I use a notetaker so I can listen properly instead of scribbling. It records and transcribes the call, and the notes stay with me. Is that OK? If you'd rather not, I'll switch it off." If they say no, remove it at once. The notetaker joining the call is not consent.
- Agenda [GUIDE §3 ADAPTATION]: "Here's what I'd suggest for the time. I'd like to understand how work comes in today and how content fits into that. Then we'll see whether the problem Threadline solves is actually your problem. If it is, I'll show you the one part of the system that's relevant, and we'll decide the next step together. If it isn't a fit, I'll say so. Does that work?"
- **NEW — needs approval** (time frame): "We've got the hour. I'll keep an eye on the clock so there's time at the end to decide what happens next, whatever that turns out to be."
- Questions [GUIDE §3]: "What made you take this call now?" / "Is anyone else involved in a decision like this?"

### 2.2 Economics (0:03–0:10)
- Bridge [GUIDE §4 ADAPTATION]: "I ask about the numbers early because whether this is worth doing depends almost entirely on what one good client is worth to you. That tells us how much has to go right for this to make sense."
- Capture the eight fields in `SALES_CALL_GUIDE.md` §4 on the prospect record. "Unknown" is a valid answer. Do not mention price yet.

### 2.3 Current state and desired state (0:10–0:20)
- Questions [GUIDE §5, from the repo discovery draft]: "How do customers find you today?" / "Who researches, writes, records, edits, approves and publishes today?" / "What gets delayed or abandoned?" / "How much of your own time goes into it each week?" (Record their answer. Never supply a figure.)
- Arrive knowing, then verify (SOP 03): name only patterns your prep can support, then ask which are true for them.
- Desired state [GUIDE §6]: "If the content side worked properly 90 days from now, what would be different?" / "What would you have to see to say content was genuinely working commercially, and not just getting views?"

### 2.4 Constraint and consequence (0:20–0:30)
- Use the ten diagnostic questions in `SALES_CALL_GUIDE.md` §7. Do not re-ask what prep already answered.
- Consequence [GUIDE §7]: "What does leaving this unchanged cost you: time, consistency, pipeline, pricing power?" / "What is your time on this currently displacing?"

### 2.5 Verify diagnosis (0:30–0:32)
- **NEW — needs approval:** "Let me play back what I've heard, and tell me where I've got it wrong. The thing that's really holding content back is {constraint, their words}. Leaving it costs you {consequence, their words}. What you want instead is {desired state, their words}. Is that right?" If they correct it, re-diagnose. Never prescribe on a corrected diagnosis.

### 2.6 Prescription (0:32–0:36)
- Division of labour [EM, quoted in GUIDE §8]: "You talk. You record. You approve. You sell. Threadline handles the machine."
- **[PENDING D01/D08]** What Threadline delivers: format (short-form video-led or multi-format), channels and output volume. Until D01 is decided, describe only the standard 80% / configured 20% process (SOP 03) and the about 12–16 core assets per four-week period working hypothesis, called a hypothesis (CM2). Do not promise a format or a channel list.
- Expectations: [LIB C] (difficulty and honesty). Headline if it fits: [LIB F] canonical headline.
- Risk reversal: **[PENDING D04]**. Say nothing about refunds or guarantees. The milestone-refund line in GUIDE §8 beat 3 is **withdrawn** from this draft (see §6, C3).

### 2.7 Offer fit and commercials (0:42–0:48)
- Price statement **[PENDING D01/D08 for scope; D03 decided for amounts]**, using the current default [GUIDE §9.1 ADAPTATION, amended]: "The initial engagement is twelve weeks. It's £2,500 to implement, then £2,500 every four weeks: £10,000 in total for the first twelve weeks. How do you feel about that?" Then stop talking and wait.
- Economics with their numbers: [LIB D], choosing main, alternative or contextualised. Work through it openly, revenue and gross profit separately, as in GUIDE §9 (labelled illustrative). Then [LIB E].
- Length: [LIB G] (preferred 12-week framing); [LIB J] for the arc of the three periods.
- Scope boundaries: the EM §3 exclusions (GUIDE §9). Show standard editing examples before any close [EM expectation-control rule, GUIDE §9]. YouTube long-form is pilot or custom only.
- Payment terms **[PENDING F06/F09; D03 timing]**: **NEW — needs approval**: "The implementation fee is paid when you sign. Each four-week period is invoiced two weeks before it starts and is due on its first day." Use it only after the solicitor's wording is in.

### 2.8 Decision (0:48–0:56)
- Name the actual blocker (EM §15). Work through the room-clearing order in GUIDE §10.1 (re-tie and value → money → timing → partner → fear), one at a time: "Is that the only thing stopping you, or is there something else?" [GUIDE §10.1 ADAPTATION].
- Close question [GUIDE §11 ADAPTATION]: "Based on what you've told me, I think this is a fit, and the economics you described make it worth testing. Do you want to go ahead with the initial twelve weeks?"
- **NEW — needs approval** (when it is not a fit): "Honestly, I don't think this is the right fit for you, and I'd rather say that now than sell you something that doesn't solve the problem. {Reason in one sentence.}"
- Never: an invented deadline, scarcity, "nothing to lose", or a discount.

### 2.9 Next step and dated follow-up (0:56–1:00)
| Outcome (app) | When | Before hanging up | Within 24 hours |
|---|---|---|---|
| `won` | A yes, and the payment condition **[PENDING F06/F09]** is met | Confirm legal and billing details; send the order form and payment route; book the 60–90 minute kickoff; ask [LIB B]; record `testimonial_permission_if_successful` | SOP 04 steps (`CLOSE_TO_KICKOFF_CARD.md`; SOP 04 candidate V2). A verbal yes without payment is `follow_up`, not `won` |
| `follow_up` | Interested; one named thing outstanding | Agree the next action, its date, its owner and the exact open question, and say them aloud | Recap in their words (GUIDE §12) |
| `proposal_process` | Fit confirmed; a second decision-maker or procurement needs the terms in writing | Book the decision conversation now, with a date | Standard order form or `../sprint/sales-extra/PROPOSAL_TEMPLATE.md`, agreed scope only |
| `not_fit` | A filter or disqualifier failed | Say why; suggest an alternative only if you honestly know one | Close the record with the reason |
| `lost` | Not a live-call outcome in practice. Recorded later, when a follow-up ends without a yes | | One close-the-loop message, then stop |

- Next step **NEW — needs approval**: "So we're clear: {next action} by {date}, and {who} owns it. I'll send a short note today with what we agreed, in your words, and nothing else."
- Deposit and next-working-day access **[PENDING F13]**: do not offer the £250 refundable deposit until the owner decides.

---

## 3. Placeholders that stay open (do not fill on a call)

| Placeholder | Decision | What to say until then |
|---|---|---|
| Deliverables: format, channels, volume | **D01 → D02 → D08** | The standard process plus the 12–16 working hypothesis, labelled as one. No channel list |
| Guarantee or remedy | **D04–D06** (shape chosen internally; terms open) | Nothing. If asked, the Objection Vault guarantee answer (§5) |
| Payment order and wording | **F06/F09** (solicitor), D03 timing | Amounts and four-week rhythm only. No sequence promise |
| Deposit, next-day access | **F13** | Nothing |
| Proof (founder background, samples) | **D07** | [LIB A] only once D07 confirms the TikTok-partner line. Otherwise GUIDE §10 non-founder version |

---

## 4. Relevant demo (0:36–0:42): real app screens, one path only

Use a client workspace that holds **only synthetic data**, and say so out loud. Never show a real client. Routes were checked under `src/app/app/[org]/` on 4 November 2026. Confirming that a seeded demo workspace exists in production belongs to the F15 mock sale.

| Confirmed constraint | Path | One point to make |
|---|---|---|
| Don't know what to say | `intelligence` (signals, radar, runs) → `create/ideas` | Each idea carries its evidence |
| Doesn't sound like me | `intelligence` (Brand Brain, versions) → `create/scripts` | Drafts are written against their voice and claims; a person approves every one |
| Recording is the bottleneck | `production/recording` | A prepared session. No minutes-per-week figure |
| Approvals eat my week | `approvals` → `production` | One decision point, tied to the exact version |
| We learn nothing | `performance` → `learning` → `reports` | Expected versus actual; [LIB I] |
| Can't tell what drives enquiries | `pipeline` → `performance/attribution` | Evidence classes; no causal overclaim |

Don't show: integrations that are not configured, internal prompts or scoring weights, or any client's data (GUIDE §8).

---

## 5. App coverage mapping and objection pointers

**Coverage.** After the call, mark `stagesCovered` honestly and write a `stageNotes` entry for each stage on the call record.

| Run-of-show stage | App stage | Required for an outcome? |
|---|---|---|
| Opening and permission | `open` | No |
| Economics | `economics` | **Yes** |
| Current state | `current_state` | **Yes** |
| Desired state | `desired_state` | No |
| Constraint, plus verify | `constraint` | **Yes** |
| Consequence | `consequence` | **Yes** |
| Prescription | `prescription` | No |
| Relevant demo | `demo` | No |
| Offer fit and commercials | `commercials` | No |
| Decision, next step | `decision` | No (but VOC, plus a next action and a date for live outcomes, are enforced) |

If one of the four required stages was skipped, the call has not diagnosed anything. Mark what actually happened. Then either book a dated follow-up to finish the diagnosis, or close as `not_fit`. Never tick a box to get past the check. A no-show is `attended = false` with **no outcome** (H09 §4).

**Objections.** Use the existing tables. Do not duplicate them here.
- Proof, AI, time, price, in-housing, heavy editing, alternatives, speed, one month, guarantee leads, LinkedIn connection: `SALES_CALL_GUIDE.md` §10 (approved lines first, adaptations labelled).
- Order of handling: GUIDE §10.1.
- Guarantee questions, until D04 closes: the Objection Vault answer only ("Not responsibly before we have enough proof…"). Do not use the views guarantee in any form.
- The LinkedIn Vault answer is stale (`ADMIN_SCRIPTS_CHECK.md`, finding 3). Use the GUIDE §10 adaptation.
- Email objections after the call: REPLY_PLAYBOOK §2 OBJECTION (as H09 §3 points out).

**Never say** (consolidated from LIB D, LIVE_CALL_ONE_PAGER, CLAIMS_AUDIT): "monthly" or "per month"; "nothing to lose"; "0.25 clients"; "one client in 90 days"; a follower or view target; "the algorithm needs 90 days"; any number of founder hours, including "twenty minutes" and "an hour every two weeks"; that case studies exist privately; "100m+ views / 10,000+ conversions" (unsubstantiated, D07); any data-scale claim about AI.

---

## 6. Conflicts between sources and how this draft resolves them

| # | Conflict | Sources | Resolution in this draft (owner to confirm) |
|---|---|---|---|
| C1 | Call length: "45–60 min, no event exists" / "45 minutes (proposed)" vs a live 60-minute event | GUIDE §0, ONE_PAGER, BOOKING_QUESTIONS §1.1–1.4, OWNER_DECISIONS D-02, CLAIMS_AUDIT T-11 vs master to-do F03, H09 | **60 minutes.** BOOKING_QUESTIONS §1.2, §1.4 and §1.8A still say 45 and need re-cutting when approved |
| C2 | Minimum notice: 4 hours vs 24 hours | GUIDE §0.1 and F03 (4 h) vs BOOKING_QUESTIONS §1.1 (24 h) | **4 hours** (owner selection in F03). The 24-hour figure is superseded |
| C3 | Risk reversal: milestone refund of the implementation fee vs proportional views remedy (D04, internal) vs SOP 04's no-views-guarantee sentence | GUIDE §8 beat 3, ONE_PAGER vs DECISION 2026-10-23, OFFER_BRIEF §4, SOP 04 candidate | **No risk-reversal beat at all** until D04–D06 close. The milestone line is withdrawn. The Objection Vault answer is the only guarantee response |
| C4 | Payment: split implementation and a £250 deposit ladder vs "implementation paid at signature" | GUIDE §9.1, ONE_PAGER vs D03; EM split-payment rule; F13 open | **Pay at signature (D03).** Concession ladder suspended. The EM split-payment rule stays as an owner-approved exception per deal, never offered by default. Deposit waits for F13 |
| C5 | Payment and signature taken live "on the call" vs a sequence pending solicitor review | GUIDE §11.1 vs F06/F09, SOP 04 V2 additions 2–3 | `won` needs only the payment condition **as F06/F09 defines it**. Neither is sent without the other until then |
| C6 | Deliverables: multi-format, video-led with text fallback, up to ~3 channels vs short-form video only on four platforms | GUIDE §9, MINIMUM_VIABLE_METHOD vs OFFER_BRIEF §1 | **Neither stated as decided.** Placeholder [PENDING D01] (§3) |
| C7 | Founder time: "no hours figure" vs "you talk for an hour every two weeks" vs the frozen public "twenty minutes" | GUIDE §10, ONE_PAGER vs OFFER_BRIEF §1 vs CLAIMS_AUDIT T-01…T-04 | **No figure on calls.** Public copy is frozen and reported only, not repeated |
| C8 | Passage A: "use only once identity is cleared" vs identity cleared 16 Oct | GUIDE §10, ONE_PAGER, LIB operator notes vs OWNER_DECISIONS D-05, CLAIMS_AUDIT | Identity is cleared, but the claim itself still needs its proof check (CLAIMS_AUDIT; D07). **Gate passage A on D07.** Until then, use the non-founder version |
| C9 | No proposal documents vs a full proposal template | GUIDE §0, §11.1 vs `PROPOSAL_TEMPLATE.md`, GUIDE §11 table (repo proposal checklist with "Monthly fee") | `proposal_process` only for a genuine second decision-maker or procurement. Use the standard order form or PROPOSAL_TEMPLATE (four-week wording). The repo checklist is historical |
| C10 | Stage order: economics before current state (EM §15, app) vs current state first (F01 task wording); desired state before or after consequence (EasyGrow note, GUIDE §0) | GUIDE §0, `CALL_STAGES` vs master to-do F01 | **The EM §15 / app order is kept.** Desired state sits before constraint and consequence, which covers the EasyGrow gap |
| C11 | No-show handling: calls at +0/+5/+10 and up to 3 rebook follow-ups vs one +10 message, one close-the-loop, one rebook | GUIDE §0.1, ONE_PAGER vs H09 §4.1 | **Defer to H09** (later, and more conservative on nuisance contact). It is outside the call script, but the ONE_PAGER needs re-cutting |
| C12 | "£2,500 every four weeks" vs "per 28-day period" | GUIDE, CLOSE card vs app config, D03 | Same thing. Say "every four weeks" aloud; contracts say 28-day periods (F09) |
| C13 | Research price-sensitivity question quotes the commercial price | RESEARCH_INTERVIEW_SCRIPT Q22 (approved) vs research/sales separation | No change. It is a labelled research test, not an offer. Never follow it with a pitch or a Diagnosis link in the same message |
| C14 | Library passages missing from `/admin/scripts`; the repo SOP 03 copy is stale | ADMIN_SCRIPTS_CHECK, findings 1 and 3 | Not fixed here (no edits). Read [LIB] from the launch-pack file until the owner loads it |

**Authority.** Where sources disagree on how to run a stage, this draft follows the order in GUIDE (owner decisions, law and platform terms first; then Charlie Morgan's Imperium acquisition material for call structure and close; then the Threadline SOPs; Daniel Fazio for tactics only). The honesty rules (no guarantees, no invented proof, no pressure) override every programme technique.
