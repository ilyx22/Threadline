# Threadline diagnosis sales call guide

**Status:** READY FOR OWNER REVIEW (26 September 2026). Passages marked VERBATIM are APPROVED in their source; every ADAPTATION is unapproved until the owner signs it off. The call length depends on a booking event that does not exist yet (see §0).
**Governs:** SOP 03 (Drive `11q7dbVBUAs0noq7hoNV2jEyHU6C9eElX`), the Execution Manual V14.3 (Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`) §15 sales state map and §3 offer, and the SOP Router. Where they differ on stage names, the Execution Manual (the Router's primary script authority) is followed. This guide arranges them for use on a live call; it does not replace them.
**Approved wording:** every passage marked **[VERBATIM X]** is in `APPROVED_VERBATIM_LIBRARY.md` and must be read from there exactly. Everything marked **ADAPTATION (draft, owner approval pending)** is new wording that has not been approved yet.
**Internal only.** This guide contains the commercial terms. Pricing never appears on the public site.

---

## 0. What this call is

This is a diagnosis. Threadline has one defined, productised service. The call decides whether this prospect fits it, which part of the known problem is most acute, and whether the economics make sense. It ends in exactly one state. Do not ask the prospect to design the service, and do not build bespoke scope live.

| Item | Setting |
|---|---|
| Length | **45 minutes, proposed.** No diagnosis-call booking event was found in Drive or in any account checked (26 September 2026); 45 minutes is the discovery template in `src/lib/templates/master.ts`. The owner creates the event (see `../outreach/OUTREACH_SEQUENCES.md` §0). Only the 20-minute Calendly research event is recorded as live. |
| Who | The prospect's decision-maker: a founder, partner or principal. If the decision needs a second person, find that out in OPEN. |
| Prep | 15–30 minutes (SOP 03) |
| Record | Log fit, exact language, problem severity, desired state, objections, offer reaction, value maths, scope requests, next action and date, and the win or loss reason. Log them on the prospect (`/admin/prospects/[id]`) and the SalesCall straight after the call. |
| End states | **NOT_FIT** / **FOLLOW_UP** / **PROPOSAL_PROCESS** / **WON** (Execution Manual §15 post-call states). Each active state has a dated next action. LOST is not a post-call state: it is recorded later in the pipeline when a FOLLOW_UP or PROPOSAL_PROCESS ends without a yes. |

State map (Execution Manual §15; the SOP Router §5 uses the same order with shorter names):
**OPEN → BUSINESS ECONOMICS → CURRENT STATE → DESIRED STATE → PRIMARY CONSTRAINT → CONSEQUENCE → VERIFY DIAGNOSIS → PRESCRIPTION → RELEVANT DEMO → COMMERCIALS → ACTUAL BLOCKER / DECISION → NEXT STATE**

Rules (Execution Manual §15): use flexible conversation but fixed information states; never fake certainty; do not ask the client to design the service; never pitch before diagnosis; never feature-dump Threadline OS; only demo modules that support the diagnosed constraint or resolve an objection; quantify economic context, not fictional ROI; do not fight a legitimate NOT_FIT; log exact VOC and objections; version scripts from patterns, not one emotional call.

---

## 1. Prep checklist (15–30 minutes before)

- [ ] Re-read the application or reply thread, and the prospect record: tier, source, `economicsNote`, `constraintHypothesis`.
- [ ] Review the business: offer, likely deal size, buyer, and founder or principal credibility.
- [ ] Review their current public content: channels, cadence, formats, anything recent. Save one or two specific observations, each with its URL.
- [ ] Write a **business-economics hypothesis** (what one good client is likely worth to them) and a **problem hypothesis**: 1–3 hypotheses about their constraint, labelled as hypotheses and not facts (SOP 03; Execution Manual §14).
- [ ] Write the **call agenda** you will propose in OPEN (Execution Manual §14).
- [ ] Have **examples of standard Threadline editing** ready to show (Execution Manual expectation-control rule).
- [ ] Pick the **one** demo path that matches the most likely constraint (§8). Open it in a demo workspace that holds only synthetic data, labelled as such. Never show another client's workspace.
- [ ] Check the business-model filter (§2). If it clearly fails, the honest outcome is NOT_FIT. Run the call politely and briefly.
- [ ] Have `APPROVED_VERBATIM_LIBRARY.md` and `LIVE_CALL_ONE_PAGER.md` open.

---

## 2. Qualification and disqualification

### Business-model filter (First US Playbook V1: it must pass before any A/B scoring)

**Strong fit:**
- Founder- or partner-led AI strategy, AI transformation, AI governance or adoption, fractional CAIO, or specialist digital-transformation or technology advisory work. The UK and US are the current hypothesis markets.
- Consequential B2B work, where senior judgement and trust materially affect the purchase.
- The founder or principal is meaningfully involved in sales and/or delivery.
- They have credible proof or pedigree.
- Their economics plausibly support the founding commercial hypothesis.
- The founder can realistically appear in the content: on camera, voice-led or written.
- More qualified demand is wanted, and they have capacity for it.

**Reject or low priority:**
- A commodity chatbot or automation shop with little advisory differentiation.
- Staff augmentation or software development, where founder authority is not central.
- Low-ticket SMB workflow jobs as the dominant model.
- A large consultancy where the decision path makes founder-led content irrelevant.
- An already-mature content or authority machine with little gap Threadline could close.

### Disqualifiers during the call (repo `DRAFT_Qualification_Scorecard.md`, still valid)

- Pre-revenue, or an unclear offer.
- Low-ticket economics with no credible volume engine.
- Wants guaranteed virality or guaranteed revenue.
- Will not record or supply expertise.
- Expects Threadline to invent proof or expertise.
- Procurement complexity out of proportion to a founding-stage Threadline.
- Wants a bespoke software fork.

A disqualifier is not a failure. End with NOT_FIT, say why plainly, and suggest where they might go instead, if you honestly know somewhere.

> The repo scorecard's line "GBP 2.5k–5k monthly fee" is historical wording. The current offer is billed every four weeks, never monthly (§10).

---

## 3. OPEN (about 3 minutes)

Purpose: agree the agenda and the decision process, and find out why they are here now.

**ADAPTATION (draft, owner approval pending), agenda:**
> "Here's what I'd suggest for the time. I'd like to understand how work comes in today and how content fits into that. Then we'll see whether the problem Threadline solves is actually your problem. If it is, I'll show you the one part of the system that's relevant, and we'll decide the next step together. If it isn't a fit, I'll say so. Does that work?"

Questions:
- "What made you take this call now?" (why now)
- "What would make this a good use of the time for you?"
- "Is anyone else involved in a decision like this?"

---

## 4. BUSINESS ECONOMICS (about 6 minutes)

Capture these before any price is mentioned (Playbook "Discovery economics questions"). Each field is nullable on the prospect record, because "unknown" is a real answer.

- Average engagement or deal value (`typicalDealValueMinor`)
- Gross profit contribution, if they are comfortable sharing it (`grossProfitMinor` / `grossMarginPct`)
- Client lifetime and expansion potential (`ltvMinor`)
- Typical sales cycle (`cycleLengthDays`)
- Close rate (`closeRatePct`)
- Current capacity for new work (`capacityNote`)
- Rough value of one extra qualified opportunity (`qualifiedOppValueMinor`)
- Current acquisition sources: referral, outbound, events, content, partners (`acquisitionNote`)

**ADAPTATION (draft), bridge:**
> "I ask about the numbers early because whether this is worth doing depends almost entirely on what one good client is worth to you. That tells us how much has to go right for this to make sense."

---

## 5. CURRENT STATE (about 6 minutes)

These questions come from repo `DRAFT_Sales_Discovery_and_Content_Diagnosis.md` §1. They are in the `/admin/scripts` import as a draft.

- "How do customers find you today?"
- "What role does content play, if any?"
- "Who researches, writes, records, edits, approves and publishes today?"
- "Where does the work live?"
- "What gets delayed or abandoned?"
- "How much of your own time goes into it each week?" Record their answer; do not supply one.

**Arrive knowing, then verify (SOP 03 step 4).** Describe the patterns Threadline sees in this kind of firm, then ask which of them are true here. Use only patterns you can actually support from research. Never claim certainty the evidence does not give you.

---

## 6. DESIRED STATE (about 3 minutes)

- "If the content side worked properly 90 days from now, what would be different?"
- "What would you have to see to say content was genuinely working commercially, and not just getting views?"

Write down their words, not your summary.

---

## 7. PRIMARY CONSTRAINT and CONSEQUENCE (about 7 minutes)

**Constraint.** Narrow the diagnosis to where the known problem shows up (SOP 03 step 5):

| Stage | Diagnostic question |
|---|---|
| Research and topics | "How do you decide what to talk about?" |
| Positioning | "Could a buyer tell your view from three competitors'?" |
| Scripting | "Who turns what you know into something publishable?" |
| Recording | "What stops you recording?" |
| Editing and QA | "Who checks it before it goes out?" |
| Approvals | "How long does something wait for you?" |
| Distribution | "Which platforms, and who chose them?" |
| Conversion path | "When someone's interested, what do they do next?" |
| Learning | "Do you know which idea influenced which enquiry?" |
| Founder coordination | "How many decisions a week land on you?" |

**Consequence.** Quantify it where you can, and keep their numbers:
- "What does leaving this unchanged cost you: time, consistency, pipeline, pricing power?"
- "What is your time on this currently displacing?"
- "What does generic or inconsistent content stop you from doing?"

### VERIFY DIAGNOSIS (about 2 minutes; Execution Manual §15, SOP 03 step 8)

A separate stage, not a courtesy. Summarise the problem in their own words: the primary constraint, what it costs and what they want instead. Ask them to confirm or correct it. Do not move to PRESCRIPTION until they agree; if they correct you, re-diagnose rather than prescribing anyway.

---

## 8. PRESCRIPTION and RELEVANT DEMO (about 8 minutes)

**Prescription.** Explain how the standard Threadline process addresses the constraint you diagnosed, and which parts are configured to their business. Threadline owns a defined 80% process; their business, voice, market and proof make up the configured 20% (SOP 03). Explain the division of labour with the Execution Manual's line, **verbatim from Execution Manual V14.3** (§2):
> “You talk. You record. You approve. You sell. Threadline handles the machine.”

**Demo: one path, tied to the constraint.** No tours. Use a demo workspace that holds only synthetic data, and say that it is synthetic.

| Diagnosed constraint | Show (Threadline OS route in the client workspace, `/app/[org]/…`) | Say |
|---|---|---|
| "We don't know what to talk about" | `intelligence`: signals, radar, research runs → `create/ideas` | Where an idea comes from, and its evidence and provenance |
| "Nothing sounds like me" | `intelligence`: the Brand Brain editor and its versions → `create/scripts` | Voice, claims and evidence held in one place; drafts are written against it; nothing ships without human approval |
| "Recording is the bottleneck" | `production/recording`: the recording room and plan | The founder's part is a prepared session: prompts, order and estimated minutes |
| "Approvals and coordination eat my week" | `approvals` (bulk approval tied to exact versions) → `production` board | One decision point; an approval covers that exact version |
| "Content goes out and we learn nothing" | `performance` → `learning` → `reports/reviews` | Expected versus actual, the diagnosis, a lesson, the next test (SCORE → EXPLAIN → DIAGNOSE → PRESCRIBE → RETEST) |
| "We can't tell what drives enquiries" | `pipeline` → `performance/attribution` | Enquiries recorded with evidence class; content-sourced and content-assisted are kept apart; no causal overclaim |

To explain the diagnosis loop, use **[VERBATIM I]**. To set expectations about early performance, use **[VERBATIM H]**.

**Do not show:**
- Anything tied to an integration that is not configured, such as live platform publishing without approved access.
- Internal prompts, scoring weights or Judge logic. The SOP Router's IP rules keep these internal.
- Another client's data.

---

## 9. COMMERCIALS (about 5 minutes)

### Implementation versus ongoing, as the offer is structured

| | What it is | Fee |
|---|---|---|
| **Implementation** | Establishes the client's positioning, the Brand Brain (voice, claims and evidence), the voice guide, the workflow and approval routes, measurement and tracking, and the initial content capability: the first scripts and the recording set-up. | **£2,500**, once |
| **Ongoing service period** | Four weeks of research, strategy, scripts, production coordination, publishing workflow, measurement, diagnosis and reporting, run by Threadline. The working hypothesis is about 12–16 core short-form assets per period across up to about 3 channels, prescribed after diagnosis rather than guaranteed as a package. | **£2,500 every four weeks** |
| **Initial engagement** | 12 weeks = 3 service periods | **£10,000** (implementation plus three periods) |

Rules:
- **Say "every four weeks". Never say "monthly" or "per month."** Thirteen four-week periods make a year, not twelve.
- **One offer.** No tiers, no menus. Classify a request outside the offer as NOT_INCLUDED, POTENTIAL_ADD_ON_LATER or REPEATED_DEMAND_TO_REVIEW. Never custom-build to save a deal.
- **No guarantees** of views, leads, revenue or a fixed platform learning period. Risk reversal covers only controllable implementation and output milestones, and depends on the client meeting their agreed recording, approval and input obligations.
- **Heavy creator-style editing** is an optional premium intensity. It is not the default, and it is not priced until fulfilment economics are measured (SOP Router). Never describe standard editing as basic or budget. If they ask for it, **verbatim from Execution Manual V14.3** ("Suggested sales language"):
  > “We can absolutely do the heavier creator-style edit if you want. I’ll be transparent though — for your type of business, I usually don’t think that’s where the next pound is best spent. The biggest leverage is saying the right thing to the right buyer, with a strong hook, credible delivery and clean high-retention packaging. If you personally want the higher-production aesthetic, or the data shows your audience responds better to it, we can layer that on as a separate premium production intensity.”
- **Show standard editing before you close.** **Verbatim from Execution Manual V14.3:** Expectation-control rule: show examples of standard Threadline editing before close/onboarding. If a prospect expects entertainment/documentary-level editing, resolve that expectation before payment rather than allowing a silent scope mismatch.
- **Split payment.** **Verbatim from Execution Manual V14.3:** "Custom split-payment only when a qualified prospect is sold and money timing is isolated; usually split implementation, preserve total economics."
- **Scope boundaries** (Execution Manual §3, "Explicit exclusions unless separately sold"): paid ads management; full funnel building; email marketing management; appointment setting; website development; daily community management; sales-team management; unlimited bespoke creative (and so no unlimited revisions).
- **Volume and channels.** About 12–16 core short-form assets per four-week period is a **V1 workload/output hypothesis, not a fixed promise**; derivatives do not count towards it. Distribution runs across up to about 3 channels where sold. Delivery is video-led where video helps, with a text-led fallback (LinkedIn, X, Threads) when video is not the right format.
- **YouTube long-form: PILOT / CUSTOM** until workload is measured (Execution Manual §3). Never include it in the standard offer.
- **Do not discount** because delivery is templated. The price follows value and economics, not hours.

To explain why the engagement is 12 weeks, use **[VERBATIM G]** (preferred framing) and the **[VERBATIM J]** period story.

### Economics, with the assumptions shown

Use the prospect's own numbers with **[VERBATIM D]**: the main phrasing, the alternative phrasing, or the contextualised version. Then do the arithmetic openly, with every assumption stated.

**ILLUSTRATIVE WORKED EXAMPLE. These are not a real prospect's numbers and not a forecast.**

| Assumption (theirs) | Value |
|---|---|
| Average engagement value (revenue) | £15,000 |
| Gross margin on an engagement | 50% |
| Gross profit per engagement | £7,500 |
| Threadline initial engagement | £10,000 |

- **On revenue:** one incremental engagement (£15,000) is more than the initial engagement (£10,000).
- **On gross profit:** about 1.3 engagements (£10,000 ÷ £7,500) cover it.
- **What this does not say:** that any engagement will happen, when it would happen, or that Threadline would cause it. Deal revenue is not gross profit or ROI (SOP 03). Present it as asymmetric upside arithmetic, never as a forecast.

**Never say:** "worst case I get you 0.25 clients", "you have absolutely nothing to lose", "one client in 90 days", a follower target, or any fixed exposure frequency (Playbook guardrails).

To finish, use **[VERBATIM E]**, the downside-asset frame.

---

## 10. Objections: honest responses

The Playbook's and SOP 03's approved passages come first. Adaptations are labelled.

| Objection | Response |
|---|---|
| **Proof** ("Show me case studies") | **[VERBATIM A]**, both passages. This is the founder's own first-person line. **Identity gate (owner decision):** the Drive master TODO keeps a Threadline-led identity initially and requires confirming the employer's outside-business/conflict requirements before founder-personal commercial activity, so use passage A only once that is cleared. Until then, or if someone else is running the call, use the adaptation below. Never imply that case studies exist privately. |
| | **ADAPTATION (draft), non-founder operator version:** "Threadline is a newer productised system, so we don't have a library of Threadline case studies yet, and I won't pretend otherwise. What I can show you is exactly how the system works and how every result gets recorded, including the ones that don't go well. Where clients give permission, we'll use case studies. Where they don't, we protect their information." |
| **AI** ("Is this just AI content?") | **Verbatim from Execution Manual V14.3** (SOP Retention, preferred current framing): "Threadline does not use a generic ChatGPT workflow. The system is conditioned on the client" |
| | Repo Objection Vault, approved answer, draft import in `/admin/scripts`: "No. AI is internal leverage. Human-approved market evidence, business context and founder expertise drive strategy; the public product is the managed outcome." |
| | **Never claim** proprietary training or data scale that cannot be proved. The Execution Manual's prohibited example: "our AI is trained on $100m of in-house data." |
| | **ADAPTATION (draft), follow-on:** "Every draft is written against your Brand Brain (your voice, your claims and the evidence behind them), and nothing is published without a person approving that exact version. If a claim or a number isn't backed by your evidence, it can't be approved." |
| **Time** ("I don't have time for this") | Start with the Execution Manual line (verbatim): “You talk. You record. You approve. You sell. Threadline handles the machine.” Then **ADAPTATION (draft):** "That's the point of the division of labour. I won't quote you a number of hours, because we measure that in your workspace rather than assume it. You'll see your own time recorded each week, and if the process is asking too much of you, we change the process." *(Do not state a number of founder hours per week. The Blueprint forbids quantitative founder-hours claims until real delivery data validates one.)* |
| **Price** ("That's expensive") | **[VERBATIM D]** with their own numbers; **[VERBATIM E]**. |
| | **ADAPTATION (draft):** "Compared with what, is the useful question. Is it an internal hire, a freelancer, an agency, or your own evenings? Let's put the real alternative next to it." Then compare the full scope: research, strategy, scripting, production coordination, evidence lineage and the learning loop, plus the management burden, not one job title (Objection Vault, "Why not hire a content manager?"). If it genuinely doesn't make economic sense for them, say so. |
| **In-housing** ("We could build this ourselves") | **Verbatim from Execution Manual V14.3** (SOP Retention, rule 5): "You can build this internally. The question is whether you want to hire, train and manage the people and systems required to reproduce the output and keep improving it." Do not use fear or artificial lock-in. |
| **Editing** ("We want the heavy creator-style edit") | **Verbatim from Execution Manual V14.3:** “We can absolutely do the heavier creator-style edit if you want. I’ll be transparent though — for your type of business, I usually don’t think that’s where the next pound is best spent. The biggest leverage is saying the right thing to the right buyer, with a strong hook, credible delivery and clean high-retention packaging. If you personally want the higher-production aesthetic, or the data shows your audience responds better to it, we can layer that on as a separate premium production intensity.” Then show standard editing examples (§9). |
| **Alternatives** ("Why not hire a content manager, a ghostwriter or an agency?") | Objection Vault approved answer: "Compare the full research, strategy, scripting, production coordination, evidence lineage and learning loop - plus founder management burden - rather than one job title." |
| **Speed** ("How fast will this work?") | **[VERBATIM C]**, then **[VERBATIM H]**. Never claim a universal three-month learning period. **ADAPTATION (draft):** "Onboarding starts as soon as the agreement is signed. The first pieces are data about your market, not the finished system. What I can commit to is the process and its milestones, not the market's timing." |
| **"Can we do one month?"** | **[VERBATIM G]** |
| **"Can you guarantee leads?"** | Objection Vault approved answer: "Not responsibly before we have enough proof and control over the full sales chain. We guarantee controllable implementation/output milestones, then measure qualified commercial signals where trackable." |
| **"Do you connect to LinkedIn?"** | The Objection Vault answer is **stale** (see `ADMIN_SCRIPTS_CHECK.md`). **ADAPTATION (draft):** "Publishing runs through a platform's official access where Threadline has been approved for it. Where it hasn't, we publish manually and record the live link. Either way we'll never show you a connection that isn't real." |

Log the exact wording of every objection, how often it comes up, the response used and the result (Objection Vault rule).

---

## 11. ACTUAL BLOCKER / DECISION, then NEXT STATE

Before asking for a decision, name the **actual blocker** (Execution Manual §15): the one thing that would stop a yes today (budget timing, another decision-maker, a scope question, trust). Deal with that, not a generic objection. A one-call close is allowed when fit, trust and the decision process support it. It is not a forced doctrine. **No fake urgency**: no invented deadlines, no "only two spots left" unless that is literally true and recorded.

| End state | Criteria | Next action (always dated) |
|---|---|---|
| **WON** | Verbal yes to the one offer | Start SOP 04 the same day: confirm legal and billing details → agreement or order form with only the agreed scope → payment instructions → welcome note → workspace → book the 60–90 minute Brand Brain kickoff. Ask **[VERBATIM B]** and record `testimonial_permission_if_successful` as YES / MAYBE / NO with the exact wording. |
| **PROPOSAL_PROCESS** | Fit confirmed, but a formal proposal or another decision-maker is needed | Send the proposal (repo `DRAFT_Proposal_SOW_Commercial_Checklist.md`, with its "Monthly fee" field read as "fee every four weeks") by an agreed date; book the decision conversation now |
| **FOLLOW_UP** | Interested; timing or information outstanding | Always record (Execution Manual §15): the **blocker or reason**, the **next action**, its **due date**, its **owner**, and the **exact outstanding question or decision**. Send only what was promised. |
| **NOT_FIT** | A filter or disqualifier failed | Say why, thank them, and suggest an alternative if you honestly have one. Close the record with the reason. |

LOST is recorded later, when a FOLLOW_UP or PROPOSAL_PROCESS ends without a yes: record the exact reason, send one close-the-loop message, and do not chase.

**ADAPTATION (draft), close question:**
> "Based on what you've told me, I think this is a fit, and the economics you described make it worth testing. Do you want to go ahead with the initial twelve weeks?"

---

## 12. Follow-up after the call

The drafts are in `../outreach/OUTREACH_SEQUENCES.md` §9 (post-call). Rules:
- Send a recap within 24 hours (the master template rule), in their words: problem, desired state, what was agreed, and the dated next step.
- Send nothing that was not promised on the call.
- One reminder before the agreed decision date, and one close-the-loop message after it. Then stop and record the state.
- Never start fulfilment on a vague promise. If signature or payment stalls, keep them in sales follow-up (SOP 04 failure handling).

---

## Sources

- Drive SOP 03 (`11q7dbVBUAs0noq7hoNV2jEyHU6C9eElX`)
- Drive SOP 04 (`1iwAKxQaxZ981bfgraKjwfrrWbacB03EQ`)
- Drive SOP Router (`12-Y9gblI7HgdtWXhd0zPdDKP49hqVoZlMEGaRTempN4`)
- Drive Execution Manual V14.3 (Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`): §3 offer and exclusions, §14 pre-call system, §15 state map, the editing expectation block, SOP Retention
- Drive THREADLINE_CHAT_HANDOFF_2026-09-16 (`12UjpNtrzUzklBM6jBf77HyDT162bW_ueQBUKW4bUv5k`): the live Calendly "Founder Research — 20 mins" event
- Drive First US Playbook V1 (`1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s`)
- Repo `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_*.md`
- `src/lib/templates/master.ts` (discovery structure, 45 minutes)
- `prisma/schema.prisma` (the Prospect economics fields)
- App routes under `src/app/app/[org]/`
