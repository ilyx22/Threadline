# H04: first commercial email campaign pack and baseline (4 November 2026)

> **DRAFT. Nothing is sent until the owner (1) approves this pack and (2) gives a separate send go after the I01 dress rehearsal and I05 sign-off.** Approving the pack is not a send go. Nobody is enrolled, nothing is imported into Attio, and no Smartlead campaign exists yet.

**Master to-do item:** H04, "Correct email operating pack and one baseline. AI advisory segment, one complete sending configuration, follow-ups and one metric family; historical thresholds not forecasts." It feeds H10 (first test limits), I01 (dress rehearsal), I05 (batch sign-off) and I06 (first send).
**Track:** COMMERCIAL only. Research invitations stay as they are in `../../outreach/OUTREACH_SEQUENCES.md` §2. One person never gets both tracks, and commercial email is never presented as research.
**Supersedes for this first batch only:** the CE1 design in `CAMPAIGN_PACK.md` and `TEST_PLAN.md` (S2 segment, 4 steps, Loom-placement test at about 1,000 first touches). Those files are unchanged and stay the reference for later scale. Why: see §6.

## 0. What the owner must approve

Tick each one. Any item left unticked blocks the send go.

| # | Approval | Recommendation in this pack |
|---|---|---|
| OA-1 | The segment: **S1, AI/tech advisory and transformation**, as the first commercial cell | Yes. Matches H04, D01's lead niche and `OUTREACH_RECONCILIATION_2026-10-15.md` §7 |
| OA-2 | The test design: **one plain baseline, no A/B arms, no Loom** | Yes. Reconciliation §6 option 1, "baseline first" |
| OA-3 | The sending configuration in §1 (4 mailboxes, 20 contacts, 5 new a day, window, plain text, no links) | Yes |
| OA-4 | Sending through **Smartlead**, recorded as a deliberate deviation from the course rule "DO NOT use sending software" (reconciliation §3) | Yes. Smartlead was already chosen on 21 Oct (A06); this records it as a deviation |
| OA-5 | Each line in §2 marked **NEW — needs approval** | Approve or edit line by line |
| OA-6 | The footer: entity name, postal address, privacy wording (§1.4) | **Blocked** until the legal identity exists (D-09 / CM9 / N8) |
| OA-7 | Where the 20 contacts come from (§4.1): option A (move 11 S1 B-tier rows from the 68 to the commercial track) or option B (a fresh S1 list under E09) | Option A, topped up from E09 if fewer than 20 rows pass |
| OA-8 | No price in writing on this batch, **even on a second ask** (overrides `REPLY_PLAYBOOK.md` CURIOUS "second ask") | Yes, until D01 is decided |
| OA-9 | The metric family and stop rules in §3 | Yes |
| OA-10 | The separate **send go**, given after I01 passes and the §4 checklist is complete | Owner only |

## 1. Sending configuration (one)

### 1.1 Mailboxes and volume

| Setting | Value | Reason |
|---|---|---|
| Campaign mailboxes | **4 of the 10**: both mailboxes on **teamthreadline.com** and both on **threadlineteam.com** (check the exact addresses in Smartlead before you set it up; ilyas.s@teamthreadline.com is the mailbox verified at 82/82 to inbox) | This is the reconciliation's "Starter" shape (4 accounts, 2 domains). If something goes wrong, at most 2 of the 5 domains are exposed. |
| Other 6 mailboxes | Warm-up only. No campaign sends. | Reserve capacity for the next batch, with their reputation untouched |
| First batch | **20 contacts**, each sent email 1 once | Big enough to prove delivery, rendering, opt-out, stop-on-reply and Attio logging on real recipients. Small enough that a footer, list or copy defect touches 20 people, not 150. It also keeps manual Attio logging realistic (Smartlead Base has no API) |
| New first touches | **5 a day** for 4 business days (20 in total) | At 5 a day, one bounce can be traced to its row the same day |
| Per-mailbox campaign limit | Lower it from 15 to **5 a day** on the 4 campaign mailboxes. The peak is about 15 emails a day across the 4 (new emails plus follow-ups), so about 4 per mailbox | The course rule is at most 20 a day per mailbox, warm-up included. Five cold sends leave plenty of headroom |
| Warm-up | **Stays ON** on all 10 for the life of each mailbox. On the 4 campaign mailboxes, set warm-up to **10 a day** with reply rate **40–45%**, per the course's "accounts in active campaigns" settings (A06) | Total per campaign mailbox stays at or under 15 a day, inside the 20 cap |
| Daily health | Each campaign mailbox needs **≥ 96%** reputation. If one drops below, stop cold sends on it and lower its warm-up reply rate to 30% for 7 days (course rule, A06) | — |

### 1.2 Window and timing

- **Days:** Monday to Friday only. Gaps are counted in business days.
- **Window:** **13:00–16:00 UK time** (GMT, since 25 Oct), with random spacing and no bursts. That is 08:00–11:00 US Eastern (EST since 1 Nov), which matches the course window for most US rows. UK rows receive the email in the UK afternoon, still in business hours. **NEW — needs approval.** If Smartlead's schedule can send in each lead's own time zone, use 08:00–11:00 recipient local time instead. A US West-coast row would receive it at 05:00–08:00, so prefer East and Central US rows for this batch.
- **Sequence:** email 1 on Day 0, follow-up 1 at **+2 business days**, follow-up 2 at **+4 business days**. These are the first two gaps of the course schedule "every 2, 2 & 3 days", as used in `CAMPAIGN_PACK.md` §4 steps 2–3. There is no step 4 (§6, C3).
- **Stop on reply:** ON. Any reply of any kind ends the sequence for that person, and so do a bounce and an opt-out. Turn on Smartlead's "stop on reply", and test it in I01.

### 1.3 Format: plain text, no tracking, no links in email 1

- **Plain text** only. No HTML, signature images, attachments or logos.
- **Open tracking OFF** (no pixel). **Click tracking OFF.**
- **No links in email 1**, and none in the follow-ups either: no website, no Calendly, no Loom. The booking link goes out by hand only after someone replies.
- **Why:** (a) Deliverability. These are new domains with no sending history. Links, tracking domains and pixels are spam-filter signals, and the course checklist (A06) says "tracking OFF, plain text, no links/images in email 1". (b) Rendering. A pixel is an image, so it breaks the plain-text rule. (c) Law. The ICO treats tracking pixels in email as storage/access technology under PECR regulation 6, which needs consent; counsel to confirm. (d) Opens are unreliable anyway, so they are not in the metric family (§3).

### 1.4 Opt-out line and footer (every email, never spun)

The footer is adapted from `CAMPAIGN_PACK.md` §3. The one-click unsubscribe *link* is removed because it would be a link, and §3 itself allows "remove that clause and keep the reply opt-out". The privacy notice is written as plain text, not a link.

```text
--
{{sender_name}} | Threadline | {{sender_email}}
{{legal_entity_name}}{{company_number_line}} | {{postal_address}}
This is a business email about Threadline's services, sent to your work address.
Your details came from {{data_source}}. Privacy notice: threadlinehq.com/privacy
Not relevant? Reply "no thanks" and we won't email you again.
```

- **Lines 1, 3, 5:** from `CAMPAIGN_PACK.md` §3. The last line drops "or unsubscribe here: {{unsubscribe_link}}".
- **Line 4:** "Privacy notice: threadlinehq.com/privacy" is **NEW — needs approval**. It replaces `{{privacy_url}}` with plain text. Some mail apps turn a bare domain into a link automatically; it still carries no tracking. Counsel to confirm this meets UK GDPR Art. 14, and that the /privacy page names the legal entity (CM9 is open).
- **Also turn on** Smartlead's `List-Unsubscribe` header, if Base supports it. It is a mail header, not a body link (`BULK_LIST_FILTER_SPEC.md` §6). Check this in I01.
- **BLOCKER:** `{{legal_entity_name}}` and `{{postal_address}}` do not exist yet (OWNER_DECISIONS D-09; master to-do CM9 / N8). CAN-SPAM requires a physical postal address, and PECR requires the sender to be identified. **No send until both are filled.**
- **Sender:** `{{sender_name}}` = the owner's real name as shown on the mailbox (display name "Ilyas S"). Identity was cleared on 16 Oct 2026. Signed "{{sender_name}}, Threadline". No persona.

## 2. The sequence (S1 baseline, message version `H04-S1-B1-step{1|2|3}`)

**Rules:** no price, no guarantee or risk reversal (D04 is open; `CAMPAIGN_PACK.md` §1.3 says to delete the line when it is not approved), no outcomes, views or leads, no clients, case studies or "100m+ views" (claims P-01, unsubstantiated), and no "quick" for a 60-minute call. No spintax: one exact text, so one message version (§6, C6). UK English. Each source is cited after its line.

### 2.1 Email 1 (Day 0), about 70 words before the footer

**Subject:** `Question for {{first_name}}`. Source: `CAMPAIGN_PACK.md` §5.3/5.4. It is true because the email ends with a real question.

```text
Hi {{first_name}},

{{first_line}}

Threadline turns the judgement behind {{firm}}'s AI work into short videos and posts that show buyers how you think differently.

You talk. You record. You approve. You sell. Threadline handles the machine.

Nothing goes out until you approve it, and every four weeks we show you which ideas your buyers responded to.

Open to a call to see whether it fits {{firm}}?

Thanks,
{{sender_name}}, Threadline
```

| Line | Source | Status |
|---|---|---|
| "Hi {{first_name}}," | `CAMPAIGN_PACK.md` §5.3, spintax `{Hi\|Hello}` resolved | Draft adaptation, approve with pack |
| `{{first_line}}` | First-line patterns, `CAMPAIGN_PACK.md` §2.1; verified per row (§4.2) | Per-row check |
| "Threadline turns the judgement behind…" | `CAMPAIGN_PACK.md` §6.1, the S1 offer-sentence swap, word for word | Draft adaptation. **Depends on D01:** if the owner picks a scope other than video-led, this line changes |
| "You talk. You record. You approve. You sell. Threadline handles the machine." | Execution Manual V14.3 §2 | **VERBATIM, approved**. Never edit or spin |
| "Nothing goes out until you approve it, and every four weeks we show you…" | `CAMPAIGN_PACK.md` §5.3 conviction line, spintax resolved to "every four weeks" and "responded to" | Draft adaptation. It is true of the process and claims no results |
| "Open to a call to see whether it fits {{firm}}?" | `CAMPAIGN_PACK.md` §5.3 CTA without `{{call_length}}` | **NEW — needs approval.** The 60-minute length is stated honestly in the reply that carries the booking link (Calendly diagnosis event: 60 minutes, 4 hours' notice, F03) |
| "Thanks, / {{sender_name}}, Threadline" | `CAMPAIGN_PACK.md` §5.3 | Draft adaptation |
| P.S. referral line (§5.3) | Dropped: founder-led firms of 1–10 people have no "someone else" | — |

### 2.2 Follow-up 1 (+2 business days, same thread, no new subject)

```text
{{first_name}}, is getting {{firm}}'s thinking in front of more buyers a priority this quarter?
```
Source: `CAMPAIGN_PACK.md` §5.5, arm B step 2, word for word (14 words; EG-FUP bump of 15 words or fewer). Draft adaptation. Footer included.

### 2.3 Follow-up 2, close the loop (+4 business days, same thread)

```text
I'll leave this here, {{first_name}}. If it becomes a priority, just reply.
```
Source: `CAMPAIGN_PACK.md` §5.5 step 4, word for word (13 words). It keeps the PB "close the loop … no problem at all" stop. Draft adaptation. Footer included. **The sequence then stops.** Non-responders are not contacted again within 90 days, and only if there is a genuinely new trigger (`CAMPAIGN_PACK.md` §4).

### 2.4 Personalisation fields

| Field | Filled from | Rule |
|---|---|---|
| `{{first_name}}` | The founder's own site or profile | As they use it publicly |
| `{{firm}}` | Trading name on their site | — |
| `{{first_line}}` | One true, specific sentence about them (`CAMPAIGN_PACK.md` §2.1 patterns 1–7), with `first_line_url` logged | URL opened **within 7 days of the send**. No first line, no send. Never a comparison with "most firms" (§6, C8) |
| `{{data_source}}` | What was actually used for this row, for example "your firm's website" | Must be true per contact (UK GDPR Art. 14) |
| `{{sender_name}}`, `{{sender_email}}` | The sending mailbox | Real person and real mailbox |

### 2.5 Worked example, from a real row (AI-12, `prospects.csv`, company name only)

**Summone Consulting** (UK; B-tier; fit 6; the row's channel says a founder business address is published on the site). Observation on file (26 Sept): the homepage line "We build the AI products we sell". Before use: re-open https://summone.co.uk within 7 days, confirm the line is still there, confirm the founder is still in role, confirm the firm is **incorporated** (Companies House; a Scottish partnership also counts as a corporate subscriber under PECR), and double-verify the founder's published work address (not a generic inbox).

```text
Subject: Question for {{first_name}}

Hi {{first_name}},

Your homepage puts it plainly: "We build the AI products we sell."

Threadline turns the judgement behind Summone Consulting's AI work into short videos and posts that show buyers how you think differently.
[verbatim line, conviction line and CTA as in 2.1, with {{firm}} = Summone Consulting]
--
[footer, with {{data_source}} = "your firm's website"]
```
`{{first_line}}` uses pattern 7 ("their site's own words"). It quotes the site and makes no claim about the "5 live AI products" or "3-month average time to ROI", which are their claims, not ours. **Fit caution from the row:** the offer is diffuse (enterprise Copilot work through to local SEO), so the owner may prefer to leave it out (§4.2 fit check).

## 3. One metric family: the first-touch cohort funnel

All counts are **raw numbers** for the 20-person cohort, each attributed to the **date that person's email 1 was sent** (Alchemy Metrics counting rule, adopted in reconciliation §5). Denominator: **first touches** (distinct people sent email 1).

| # | Metric | Definition | Read from |
|---|---|---|---|
| M1 | Sent | Email 1 sent; plus total emails by step | Smartlead campaign analytics |
| M2 | Delivered / bounced | Hard bounces ÷ M1; delivered = sent − bounced | Smartlead analytics |
| M3 | Human replies, by class | Any human reply (not auto-replies or out-of-office), each with one class: INTERESTED, CURIOUS, SEND_INFO, NOT_NOW, OBJECTION, REFERRAL, NOT_FIT, UNSUBSCRIBE (`REPLY_PLAYBOOK.md` §2), plus the step it followed | Smartlead inbox → Attio "Last reply type" |
| M4 | Positive replies | Replies whose label is **Engaged**, meaning "anything that isn't directly negative" (EG-MGMT) ÷ M1 | Attio |
| M5 | Calls booked | Diagnosis calls booked ÷ M1 | Calendly → Attio stage "Call booked" |
| Guardrails | Opt-outs, spam complaints, reply-response hours (target under 6), mailbox reputation | — | Inbox, Smartlead |

**Historical thresholds are reference points, not forecasts.** The sources quote Loom OS KPIs (2% positive replies, 1% bookings, judged at about 500 first touches) and Loom Alchemy ranges (3–5% / 1.5–2.5%). Those figures are course benchmarks from other senders and offers, and they are measured *with a Loom*, which this baseline does not use. At 20 first touches, 2% means 0.4 of a reply, and `TEST_PLAN.md` §4.2 says any rate with a denominator under 10 people is too thin to read. **This batch is judged on operations, not on performance:** delivered cleanly, every reply answered the same business day, every event correctly in Attio, no complaints. Reply and booking counts are recorded as the first real baseline, and nothing is concluded from them.

**Stop rules (pause the campaign, tell the owner the same day):**
- **Any hard bounce:** 1 of 20 is 5%, over the 2% source gate (`BULK_LIST_FILTER_SPEC.md` §4.7). Re-verify the source before you continue.
- **Any spam complaint.**
- **A campaign mailbox under 96% reputation:** handle it as in §1.1.
- **Any defect** in a merge field or the footer. Example: an empty `{{first_line}}`.

## 4. Pre-send checklist and logging routine

### 4.1 Where the 20 come from (OA-7)

The 68 rows in `prospects.csv` are a **research-track** list. `BULK_LIST_FILTER_SPEC.md` §5 excludes every domain in it from commercial email, so none of the 68 can be emailed without an owner decision. None of them has been contacted.

- **Option A (recommended):** the owner moves the **11 S1 B-tier rows AI-06 to AI-16** to the commercial track and removes them from research outreach. Those rows are not on the named Playbook V1 batch or the hold list. The 15 RECHECK rows (the named research batch) and all 12 S1 A-tier rows stay on research (A-tier Dream accounts stay research, `CAMPAIGN_PACK.md` §2.2). Expect some of the 11 to drop out: several have only a contact form, a generic inbox or LinkedIn. Top up to 20 with fresh S1 rows sourced under E09 and `BULK_LIST_FILTER_SPEC.md` (S1 filters).
- **Option B:** all 20 from a fresh E09 S1 list. The 68 stay research-only.

### 4.2 Checklist (every box before the send go)

- [ ] **Legal identity:** entity name, company number if any, and postal address in the footer; /privacy names the entity (D-09, CM9). Legitimate interests assessment recorded (`CAMPAIGN_PACK.md` §3.1).
- [ ] **E05 import:** rows imported into Attio as People + Company + Deal at stage **Lead**, with Source = cold email and Message version = `H04-S1-B1`. Commercial and research rows are kept apart, and spot-checked against the CSV.
- [ ] **Suppression**, in the order of `BULK_LIST_FILTER_SPEC.md` §5: opt-outs and the Attio "Do not contact" list; research-track domains (the 15 named firms, the hold list and every research row still in `prospects.csv`); existing Attio records; anyone touched in the last 90 days; the conflict list; duplicates. Load the suppression list into Smartlead's blocklist.
- [ ] **Per-row fit and evidence check**, by a person, on each of the 20: business-model filter passes; founder still in role, and not new in the last 30 days; UK rows incorporated (no sole traders or English/Welsh/NI partnerships); `first_line` URL opened within 7 days and the line true; `data_source` true; a personal work address double-verified "Valid" (no catch-all, info@ or guesses); not a West-coast US row (§1.2).
- [ ] **Wedge uncertainty note** recorded in `/admin/market` (D-06; `CAMPAIGN_PACK.md` B6).
- [ ] **Replies covered:** someone checks the inbox at about 09:00, 13:00 and 17:00 UK on every send day and every follow-up day, and answers the same business day.
- [ ] **I01 dress rehearsal** (owner-controlled inboxes only, such as ilyas@threadlinehq.com plus one Gmail and one Outlook address the owner controls; no prospect). Check: lands in the inbox, not spam; renders as plain text; every merge field filled; footer correct; the message source shows no tracking domain or pixel; follow-up 1 arrives in the same thread; a reply stops the sequence; a "no thanks" reply is logged as UNSUBSCRIBE, blocklisted in Smartlead and ticked "Do not contact" in Attio; `List-Unsubscribe` header present or confirmed absent. Record the results against I01.
- [ ] **I04:** the 4 campaign mailboxes at 100% / ≥ 96%, warm-up ON at the §1.1 settings, campaign limit 5.
- [ ] **I05:** the owner signs off the final 20 rows and message version.
- [ ] **OA-10 send go** from the owner, given separately and in writing.

### 4.3 Logging routine into Attio (manual; Smartlead Base has no API or webhooks, E10)

1. **Each send day, after the window (about 16:30 UK):** move that day's 5 Deals from **Lead** to **Contacted**. Add a dated line to the campaign note (the Attio list "H04 batch 1"): M1 sent and M2 bounced, from Smartlead analytics.
2. **At each inbox check (about 09:00, 13:00, 17:00 UK):** for every human reply, open the Deal and set stage **Replied** (or **Not now** / **Lost** for NOT_NOW-without-date / NOT_FIT). Set **Last reply type** to the class and **Message version** to `H04-S1-B1-step{n}`. Log the prospect's exact words in a note. Add one Attio task with the next action and its due date. Reply using `REPLY_PLAYBOOK.md`, with **no price** (OA-8) and no risk reversal.
3. **Opt-out or bounce:** that day, tick **Do not contact** on the Person, add them to the Smartlead blocklist, and set Lost reason = opt-out / bounced.
4. **Booking:** when the Calendly diagnosis event is booked, set stage **Call booked** (M5) and keep the Message version.
5. **Batch close (7 business days after the last follow-up 2, per `TEST_PLAN.md` §4.2 "all steps done plus 7 business days"):** write the M1–M5 counts and guardrails into the campaign note and report them to the owner. That report is the input for H10's next-batch limit.

## 5. What this pack does not decide

The volume for batch 2 (H10), the offer scope (D01), the guarantee (D04), the price in writing, Loom or evergreen audio, LinkedIn or DM blocks, and the use of the remaining 6 mailboxes.

## 6. Conflicts between the sources, and how the draft resolves them

| # | Conflict | Resolution in this draft |
|---|---|---|
| C1 | Segment: `CAMPAIGN_PACK.md` §5.1 / `BULK_LIST_FILTER_SPEC.md` recommend **S2** (strategy/GTM); the reconciliation §7, the sales guide and H04 say **S1** | S1 (OA-1). The S1 offer swap from `CAMPAIGN_PACK.md` §6.1 is used |
| C2 | Test design: CE1 is a two-arm Loom-placement test, which the reconciliation §6 calls confounded | One baseline, no arms (OA-2) |
| C3 | Length: CAMPAIGN_PACK has 4 steps (+2/+4/+7); H04 and this brief ask for email 1 + 2 follow-ups | 3 steps at +2/+4; step 4's close-the-loop wording becomes follow-up 2 |
| C4 | Loom: Loom OS (and reconciliation §6, option 1) puts a Loom in email 1; the course checklist (A06) says no links in email 1; Loom recording honesty (reconciliation §4) and the scripts depend on D01, which is open | No Loom and no link. The Loomless body order is used. The CTA is a call question, not "can I send a video", because the video does not exist (`OUTREACH_SEQUENCES.md` §6: never promise an asset that doesn't exist yet) |
| C5 | Unsubscribe: the footer has a one-click link (`CAMPAIGN_PACK.md` §3) versus no links | Reply opt-out plus the header; §3's own fallback |
| C6 | Spintax on 50%+ of email 1 (`CAMPAIGN_PACK.md` §1.2) versus one readable message version for a 20-person baseline | No spintax now; revisit at volume, where it is a deliverability measure |
| C7 | Caps: course 20/mailbox incl. warm-up; Smartlead currently 15/mailbox campaign limit; A06 "10 cold + 10 warm" | Campaign limit 5, warm-up 10 on the 4 campaign mailboxes |
| C8 | First lines: the research playbook's verbatim "much stronger than the way most AI consultancies present themselves" versus the campaign pack rule "no 'we see this a lot' claims" | Commercial first lines describe only the prospect; no comparison with other firms |
| C9 | Diagnosis call length: 45 proposed (`OUTREACH_SEQUENCES.md` §0.1, claims T-11) versus the 60-minute Calendly event as configured (F03) | 60 minutes, stated in the reply that carries the link; the email names no length and never says "quick" |
| C10 | Price: `REPLY_PLAYBOOK.md` gives £2,500 in writing on a second ask (D03 decided the price), versus "copy must not state price" with D01 open, and the pricing-private doctrine | No price in writing on this batch (OA-8); move to the call |
| C11 | Risk reversal: `CAMPAIGN_PACK.md` §1.3 drafts a milestone refund; D04 (23 Oct) chose a proportional views refund shape but says "no guarantee wording … until then" | No risk-reversal line or guarantee anywhere |
| C12 | List: the brief calls the 68 "prepared" for the campaign, but they are research-track rows that `BULK_LIST_FILTER_SPEC.md` §5 excludes at domain level | Owner moves specific rows across, or builds a fresh list (OA-7) |
| C13 | Sending method: the course says manual sending; Threadline runs Smartlead | Kept as a recorded deviation (OA-4) |
| C14 | Window: course 08:00–11:00 recipient local time, UK and US separately, versus one UK-time window for one campaign | 13:00–16:00 UK (08:00–11:00 ET); per-lead time zones if Smartlead offers them |
| C15 | The older cold email in `OUTREACH_SEQUENCES.md` §3 promises "each week reads back" and links a `{{source_url}}` | Not used (superseded there); four-week cadence and no links |
