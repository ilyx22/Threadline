# Booking questions and reminders: Diagnosis call and Founder Research

**Status: DRAFT — owner review** (26 September 2026). Nothing has been sent. No Calendly event has been created or changed from here. Closes master TODO line "Finalise commercial booking questions and reminder sequence" (audit row **CM12**) once the owner approves it and pastes it into Calendly.

**Labels.**
- **VERBATIM (EM §14):** copied exactly from Execution Manual V14.3 §14 (Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`). Do not edit.
- **ADAPTATION:** new wording, unapproved. Where it builds on an earlier draft (`../../outreach/OUTREACH_SEQUENCES.md` §9, `../../outreach/EMAIL_LIFECYCLE.md` §2, §4, §5), that is noted. Those earlier drafts are also unapproved.

**Authority basis** (as recorded in the Drive documents; the original course materials were not re-read):
- Charlie Morgan / Imperium, primary: the pre-call / show-rate system (EM §14: "BOOKED automatically creates: pre-call research task; qualification review; business-economics hypothesis; problem hypothesis; reminder sequence; call agenda"); diagnose before prescribing, and research calls are not disguised sales calls (Authority Reuse and Gap Register, rule 3; Drive `1EgeTpAkLwkg02aF6-c1IPUVedCMNS5Pq`).
- Daniel Fazio, tactical: pre-call copy, and "commercial event, questions and reminder sequence must be separately created/tested" (Gap Register, "Pre-call/show-up" row); "Replies are not bookings" (Gap Register rule 6); no unsupported forecasts (rule 7).

**VERBATIM (EM §14):**
> Immediate confirmation: what the diagnosis will cover + exact meeting details.
> Day-before reminder: concise reminder plus useful context/proof where appropriate.
> Day-of reminder: short exact link/time.
> If booking rate is good and show rate is poor, fix this stage instead of increasing outreach.

There is no Threadline client proof yet, so the day-before reminder carries **context, never proof** (library passage A rule: never imply case studies exist).

**Placeholders.** `{{…}}` fields below are neutral. When pasting into Calendly workflows, map each to Calendly's own variable and check the name in Calendly; do not guess. Sender is always a real named person (`{{sender_name}}`), per `OUTREACH_SEQUENCES.md` §0.2.

---

## Part 1. Commercial event: "Diagnosis call"

### 1.1 Event settings (ADAPTATION, proposed)

| Setting | Proposed value | Why |
|---|---|---|
| Event name | **Diagnosis call** | D-02; SALES_CALL_GUIDE §0 |
| Length | **45 minutes (proposed)** | `src/lib/templates/master.ts` discovery template; SALES_CALL_GUIDE §0. If shortened, re-time the guide's stages |
| Location | Video link generated per booking | "exact meeting details" (EM §14) |
| Minimum notice | 24 hours | Leaves time for the 15–30 minute prep (SOP 03) and the day-before reminder |
| Buffer after | 15 minutes | Time to log VOC, outcome and dated next action straight after the call |
| Description shown on the booking page | See 1.2 | |
| Where the link appears | `NEXT_PUBLIC_BOOKING_URL` on `/apply`, the commercial emails and replies. **Never** in research messages (track separation, `OUTREACH_SEQUENCES.md` §1) | A6 |

### 1.2 Booking-page description (ADAPTATION)

> A 45-minute diagnosis. We'll look at how work comes in for you today, where content fits, and whether the problem Threadline solves is actually yours. If it is, I'll show you the one part of the system that's relevant. If it isn't a fit, I'll say so.
>
> It's a commercial conversation, and we'll talk about what working together would involve. No guarantees of views, leads or revenue are made on this call or anywhere else.

### 1.3 Booking questions (six; ADAPTATION)

Calendly already collects name and email. Six questions, no more. Order runs easiest first.

| # | Question (as the invitee sees it) | Type | Required | Maps to (prospect record) |
|---|---|---|---|---|
| 1 | **Your firm and its website** | One line | Yes | firm, website |
| 2 | **Your role** | One line | Yes | contact role; decision-maker check in OPEN |
| 3 | **Roughly what is a typical client engagement worth to you?** (a range is fine) | Radio: Under £5k / £5k–£15k / £15k–£50k / Over £50k / Prefer to discuss on the call | Yes (with the "prefer to discuss" option) | `typicalDealValueMinor` (band only; confirm on the call) |
| 4 | **Where does most of your new work come from today?** | Checkboxes: Referrals / Outbound / Events or speaking / Content / Partners / Other | Yes | `acquisitionNote` |
| 5 | **What does your content set-up look like right now?** | Radio: Nothing regular / I do it myself when I can / Someone helps (freelancer, team member or agency) / A regular, working system; plus optional one line | Yes | current state; constraint hypothesis |
| 6 | **What prompted you to book, and where did you hear about Threadline?** | Paragraph | No | why-now (OPEN); booking source for attribution (ledger D11) |

Rules:
- Question 3 is qualification context, not objection ammunition (library passage D rule: "ask deal/engagement value early because it is a real qualification/economic-fit input"). The "prefer to discuss" option keeps the form from blocking a good-fit buyer.
- Do not add a budget question. Price is disclosed on the call (SALES_CALL_GUIDE §9), not screened on the form.
- Answers feed prep (EM §14): the business-economics hypothesis and the problem hypothesis, written as hypotheses, not facts.

### 1.4 Immediate confirmation (sent on booking)

ADAPTATION, built on `OUTREACH_SEQUENCES.md` §9 item 1. Covers "what the diagnosis will cover + exact meeting details" (EM §14).

**Subject:** `Diagnosis call confirmed: {{date}} at {{time}} ({{timezone}})`

> Hi {{first_name}},
>
> You're booked for a 45-minute diagnosis call on {{date}} at {{time}} ({{timezone}}).
> Join here: {{meeting_link}}
> Need to move it? {{reschedule_link}}
>
> What we'll cover:
> 1. How new work comes in for {{firm}} today, and what a good client is worth to you.
> 2. Where content fits now, and where it stalls.
> 3. The one constraint that matters most, in your words, checked with you before anything else.
> 4. If it's a fit, how Threadline would handle it, and what working together involves, including the terms. If it isn't, I'll say so.
>
> Nothing to prepare. If there's a piece of content or a page you'd like me to look at first, reply with the link.
>
> {{sender_name}}, Threadline
> {{sender_email}}

### 1.5 Day-before reminder (24 hours before)

ADAPTATION, built on `OUTREACH_SEQUENCES.md` §9 item 2. "Concise reminder plus useful context" (EM §14). No proof, no forecast.

**Subject:** `Tomorrow at {{time}}: your diagnosis call`

> Hi {{first_name}}, looking forward to tomorrow at {{time}} ({{timezone}}).
>
> One thing worth having to hand: roughly what a typical engagement is worth to you, and how many more you could take on. It's the number that tells us whether this is worth doing at all.
>
> {{optional_context_line}}
>
> If something's come up, move it here: {{reschedule_link}}
>
> {{sender_name}}

`{{optional_context_line}}` (ADAPTATION, use only if true and checked): "I've had a look at {{specific_public_item}} ahead of the call." Delete the line if there is nothing specific. Never add a client result, a view count or a promise.

### 1.6 Day-of reminder (2 hours before)

ADAPTATION, built on `OUTREACH_SEQUENCES.md` §9 item 3. "Short exact link/time" (EM §14).

**Subject:** `Today at {{time}}`

> Today at {{time}} ({{timezone}}): {{meeting_link}}

### 1.7 No-show (10 minutes after the start time, sent once)

ADAPTATION, built on `EMAIL_LIFECYCLE.md` §5. Send by hand after checking they are not simply late in the waiting room.

**Subject:** `Another time?`

> Looks like today didn't work out, {{first_name}}. No problem at all. If you'd still like the diagnosis, pick another time here: {{booking_link}}

**Close the loop (3 business days later, only if no reply; then stop):**

> I'll leave this here, {{first_name}}. If the content side becomes a priority for {{firm}}, the link stays open: {{booking_link}}. Good luck with {{recent_thing_or_"the quarter"}}.

Record the no-show on the prospect (`/admin/prospects/[id]`) with a dated next action. No third message. Repeated no-shows are a show-rate signal to fix at this stage, not a reason to add outreach volume (EM §14, verbatim above).

### 1.8 Reschedule

**A. The invitee rescheduled (sent automatically on reschedule).** ADAPTATION.

**Subject:** `Moved: diagnosis call now {{date}} at {{time}}`

> Thanks for letting me know, {{first_name}}. You're now booked for {{date}} at {{time}} ({{timezone}}), 45 minutes: {{meeting_link}}. Same plan as before; nothing to prepare.

The day-before and day-of reminders re-time to the new slot.

**B. Threadline needs to move it (sent by hand, at least 24 hours ahead where possible).** ADAPTATION.

**Subject:** `Need to move our call on {{date}}`

> Hi {{first_name}}, I'm sorry, I need to move our call on {{date}}. Could you pick a time that suits you here: {{reschedule_link}}? If none work, reply with two options and I'll fit around you.

Never blame the prospect; never invent a reason.

---

## Part 2. Research event: "Founder Research — 20 mins"

This event exists (per Drive: THREADLINE_CHAT_HANDOFF_2026-09-16 and the master TODO). It stays **genuinely research**: no pitch, no commercial link, no qualifying questions, and no follow-up into sales unless the person asks (`OUTREACH_SEQUENCES.md` §1; research-call open, playbook V1: “I’m not going to pitch you.”).

**Open issue carried forward:** the approved playbook invitation asks for "15 minutes" and the event is 20. Do not send research invitations until the owner resolves it (`OUTREACH_SEQUENCES.md` §0.1; TODO audit §19 item 8). The copy below says 20 minutes to match the event.

### 2.1 Booking questions (ADAPTATION)

Name and email only, plus one optional question:

| # | Question | Type | Required |
|---|---|---|---|
| 1 | Anything you'd like me to know before we talk? | Paragraph | No |

No deal value, budget, role screening or acquisition-channel questions: those would make a research call look like a sales qualifier. Economics come up only inside the conversation, in the playbook's order, and only if the interview is commercially literate.

### 2.2 Confirmation (sent on booking)

ADAPTATION, the `EMAIL_LIFECYCLE.md` §2A draft with exact details added.

**Subject:** `Research conversation, {{date}} at {{time}}`

> Thanks for making time, {{first_name}}. Booked for {{date}} at {{time}} ({{timezone}}), 20 minutes: {{meeting_link}}. To move it: {{reschedule_link}}.
>
> This is research: how work comes in for you, and where content helps or breaks. No pitch, and I won't add you to anything.

### 2.3 Reminders

- Day before (ADAPTATION): "Looking forward to tomorrow at {{time}}, {{first_name}}. If something's come up, move it here: {{reschedule_link}}."
- Day of (ADAPTATION): "Today at {{time}}: {{meeting_link}}"
- No-show (ADAPTATION, once, then stop): "Looks like today didn't work out, no problem at all. If you'd still like to talk, here's the link: {{research_booking_link}}. If not, thanks anyway." No close-the-loop chase on the research track.

### 2.4 Thanks (within one business day)

ADAPTATION, identical to `EMAIL_LIFECYCLE.md` §2B and the `OUTREACH_SEQUENCES.md` §2.5 thank-you:

**Subject:** `Thank you, and the notes I mentioned`

> Thanks for the time today, {{first_name}}. Genuinely useful, especially {{their_phrase}}. As promised: {{asset_or_link}}. If anything I'm working on becomes relevant to you later, I'll ask first; I won't add you to anything.

Delete the "As promised" sentence if nothing was promised. After this, no further contact without a genuine new reason. If they asked about working together during the call, send the diagnosis link in a **separate** message that says so plainly (`OUTREACH_SEQUENCES.md` §1: "this call was research, so let me not blur the two").

---

## Part 3. Checks before going live (owner)

- [ ] Create the Diagnosis call event (45 minutes, or record a different length and update SALES_CALL_GUIDE §0 and `CAMPAIGN_PACK.md` `{{call_length}}`).
- [ ] Paste the six questions; confirm Calendly's variable names for every `{{field}}`.
- [ ] Decide whether Calendly sends 1.4–1.8 automatically or a person sends them; do not let Calendly's default emails send alongside these (double messages).
- [ ] Book one test slot from a second address on each event, check every message arrives with the right link and time zone, then cancel (audit row A5).
- [ ] Set `NEXT_PUBLIC_BOOKING_URL` to the diagnosis event only.
- [ ] Track booked → attended per event so show rate is visible (Gap Register rule 6).
