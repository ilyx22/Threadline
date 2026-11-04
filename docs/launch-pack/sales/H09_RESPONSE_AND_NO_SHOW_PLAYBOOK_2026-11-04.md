# H09: Response and no-show playbook (4 November 2026)

**Status: DRAFT for owner approval.** Nothing here has been sent, configured or changed in Smartlead, Attio or Calendly. It closes master to-do **H09** once the owner approves it. It is linked to E12/E13/E22 (routing, booking events, fields), F03 (Calendly), H07 (DM opt-outs) and J02 (research is kept separate from sales).

**Who reviews.** A human reads and answers every reply: the owner (Ilyas), or a named stand-in the owner approves in writing. AI may **draft** a reply, a classification or a log entry. AI never sends, never changes a sequence and never marks an opt-out without a human. If a draft and the human disagree, the human wins and the draft is thrown away.

**Wording labels used below.**
- **[APPROVED LIB x]**: a passage from `APPROVED_VERBATIM_LIBRARY.md`. Copy it exactly.
- **[DRAFT: file §]**: existing wording that is still unapproved (mostly `../sprint/emails/REPLY_PLAYBOOK.md`, which is PROVISIONAL, and `../sprint/sales-extra/BOOKING_QUESTIONS_AND_REMINDERS.md`). It is reused here so the owner approves it once.
- **[NEW]**: written for this file. **Needs owner approval.**

The approved library has no reply-email passages. Its only line that fits a reply is the passage F headline. Passage A must not be used until the founder's identity is cleared.

**Hard rules.** No guarantees. No invented results, clients, case studies, deadlines or scarcity. No pressure. Never "monthly" (say "every four weeks"). The price stays off the public site. The second-ask price reply in REPLY_PLAYBOOK §2 still waits for the owner. The Execution Manual's §13 applies: "Build reply templates only from repeated real conversations. Do not over-script early." Rewrite the templates after the first real campaign (CE1).

**Tooling facts.** Smartlead Base has no API and no webhooks, so every reply is logged in Attio **by hand, on the same working day** (E10). Attio Free deal stages are Lead → Contacted → Replied → Call booked → Call held → Proposal sent → Won → In Progress → Not now → Lost. Next actions and due dates are Attio **tasks**. The People record has a **Do not contact** checkbox. Calendly has two events: Founder Research (20 minutes) and Diagnosis (60 minutes).

---

## 1. Daily coverage routine

| When (UK time, working days) | What |
|---|---|
| **09:00 check** (about 20 minutes) | Smartlead master inbox (all 10 mailboxes), plus LinkedIn/X/Instagram DMs and the Calendly notifications in Gmail. Classify every new message (§2), act on it and log it in Attio (§5). Clear US replies that arrived after 17:00 the day before. |
| **15:30 check** (about 20 minutes) | Same sweep. **Every new lead who replied before 15:30 gets a human answer the same working day.** A reply that arrives after 15:30 is answered by 10:00 the next working day. |
| End of day (2 minutes) | Attio: filter the tasks due today. Each one is done, re-dated with a reason, or closed. No reply is left unclassified overnight. |
| Booked calls | Check about 1 hour before each call and again at its start time. The no-show steps in §4 run on call days, whatever the check schedule. |

**Proposed.** REPLY_PLAYBOOK §1.3 and CAMPAIGN_PACK B7 say morning, midday and late afternoon, with a target under 6 hours. This file proposes two checks as the minimum. Add a 12:30 glance on campaign-send days. **Owner to choose.**

**Days off (holiday, illness, full-day delivery work).** [NEW]
1. **Planned, the day before:** pause the Smartlead campaigns, or do not start a new batch, so no first touch lands while nobody can answer. Leave warm-up running.
2. **No new commercial bookings** on days off: block them in Calendly. Keep any confirmed calls, or move them using the reschedule message in §4.
3. **Unplanned:** one 10-minute check that day is enough. Handle opt-outs, bounces and calls booked for today or tomorrow. Leave everything else for the next working day, first thing.
4. **No auto-responder** that pretends to be a person. If the owner sets an out-of-office, it says truthfully when they are back.
5. **Opt-outs are never deferred:** suppress them the same day, even on a day off (§2).

---

## 2. Reply classification

**Do first, every class:** stop the person's sequence in Smartlead. Then set the Attio stage, create **one** task (the next action) with a **due date**, and log the touch (§5). Every person carries exactly one class and one open task.

| Class | How to recognise it | Immediate action (Smartlead / Attio) | Reply approach | Dated follow-up |
|---|---|---|---|---|
| **Interested** | Asks for a call or a time, "sounds good", "tell me when". | Stop the sequence. Stage **Replied**, then **Call booked** once they book. Task: "Confirm booking", due in 2 working days. | T1. Send the Diagnosis link (60 minutes). Ask no qualifying questions first. | Not booked in 2 working days: start the Engaged track (REPLY_PLAYBOOK §4.3). Booked: prep task the day before the call. |
| **Curious** | "How does it work?", "What does it cost?", "Send me info". Positive, but no request for a call yet. | Stop the sequence. Stage **Replied**. Task: "Follow up", due in 2 working days. | T2/T3. Give an honest one or two lines, then offer the call. Never dodge a direct question. Price: T3 on the first ask. The second ask waits for the owner (above). | Engaged track, one touch every 2 working days. Close as **Lost** ("no response, engaged") after the last touch. |
| **Not now** | Timing only: "after Q1", "busy until January", "come back in two months". | Stop the sequence. Stage **Not now**. Task: "Check in", due on **their** date. If they gave none, ask once (T4). If there is still no date, set **8 working weeks** [NEW default]. | T4. Accept it, confirm the date and leave the link. No "what changes between now and then?" by email. | **One** dated check-in (T5) on the task date. No answer after 5 working days: **Lost** ("not now, no response"). No further contact without a genuine new trigger. |
| **Not a fit** | Wrong firm, wrong need, too small, no budget for this kind of work, or "we do this in-house and it works". | Stop the sequence. Stage **Lost**, Lost reason "Not fit", in their words. No task. | T6. Thank them and close. Do not argue or reframe. | None. Repeated not-fit replies are a list-quality signal for the Friday review. |
| **Referral** | "Talk to X", "X handles this". | Stop the sequence for this person. Stage **Lost**, reason "Referred". New Attio Person for the referral: Source = referral, note who referred. Task: "Contact referral", due in 2 working days. | T7. Ask whether they will introduce you, or whether you may mention them. | Contact the referral only by the route they agree. The referral is a new prospect: run it through filtering, dedupe and the PECR check. **Never** add them to the cold sequence. |
| **Opt-out / "remove me"** | "Stop", "remove me", "unsubscribe", "not interested", "don't email again", an unsubscribe click, or anything that clearly means it. Includes "not interested" with no other words (REPLY_PLAYBOOK §2). | **Same day, even on a day off.** Unsubscribe the person in Smartlead and add them to the global block list (confirm the menu at I01). Tick Attio **Do not contact**. Stage **Lost**, reason "Opted out", with the date. Close every task. Stop every channel, including LinkedIn, X, Instagram and phone. | T8, only if a reply is expected. **No argument**, no "just one question", no pattern-break Loom. | **Never contact again**, in any campaign, segment or tool. Export the suppression list into every future list. A deletion request means removing their data everywhere and keeping only the email address and the date. |
| **Angry / complaint** | Rude, hostile or "how dare you". | Treat it as an opt-out, all steps above. Log the exact words. A second complaint in the same campaign cell pauses that cell (TEST_PLAN §2.4). | Explicit abuse gets no reply. A reasoned complaint gets T9: one apology, once. | None. Never re-contact. |
| **Auto-reply / OOO** | An automatic message with a return date. | Not a reply. Leave the sequence running, or pause it until 1 working day after the return date if that date falls after the last step. Stage unchanged. "Left the firm": remove the contact. A successor named in it is a new prospect (filtering, dedupe, PECR). | None. | Resume 1 working day after the return date. **Check in the I01 rehearsal** whether Smartlead's "stop on reply" treats an OOO as a reply. If it does, restart them by hand. |
| **Bounce** | A delivery failure (hard bounce) or "address not found". | Stop the sequence. Mark the address invalid and tick Do not contact on that address. Count it in the mailbox's bounce rate: warn at 2%, stop at 5% (REPLY_PLAYBOOK §3). | None. | Find another valid address only if one is published and passes the same checks. Otherwise **Lost**, reason "Bad data". |

**Research track (J02).** Treat replies to research invitations the same way for opt-outs, bounces and OOO. **Interested** means the Founder Research link (20 minutes), with no commercial link, no qualifying questions and no pitch. A researcher is **never** moved into a commercial sequence. If they ask about working together, send the Diagnosis link in a **separate** message that says so plainly (`OUTREACH_SEQUENCES.md` §1).

---

## 3. Reply templates (UK English)

Placeholders: `{{first_name}}`, `{{firm}}`, `{{booking_link}}` (the Diagnosis event), `{{their_date}}`. Keep the compliance footer on every commercial reply. Send from the same mailbox, in the same thread.

**T1 Interested** [DRAFT: REPLY_PLAYBOOK §2 INTERESTED; "60" replaces `{{call_length}}`]
> Great to hear, {{first_name}}. The easiest next step is a 60-minute call: {{booking_link}}. If none of the times suit, send me two that do and I'll move things around.
>
> Once you've booked, let me know and I'll confirm I've got it.

**T2 Curious: how does it work?** [DRAFT: REPLY_PLAYBOOK §2 CURIOUS]
> Good question, {{first_name}}. In one line: you talk, record and approve; we research, script, produce, publish and report back on what your buyers responded to. The honest answer to "would it work for {{firm}}" depends on how work comes in today, which is hard to do justice by email. Could we take 60 minutes? {{booking_link}}. No pressure on the call; if it isn't a fit, I'll say so.

Optional closing line, used only when it fits the conversation: [APPROVED LIB F, canonical headline] "We are not trying to make you famous. We are trying to make you familiar to the people who matter."

**T3 Curious: what does it cost? (first ask)** [DRAFT: REPLY_PLAYBOOK §2]
> Fair question, {{first_name}}. No point talking if it's out of range. It's one defined engagement: an implementation fee, then a fee every four weeks. Whether it's worth it depends almost entirely on what one good client is worth to {{firm}}, so I'd rather go through the numbers with you than send a figure without context. Happy to do that on a call: {{booking_link}}.

**T4 Not now** [DRAFT: REPLY_PLAYBOOK §2 NOT_NOW; the no-date variant is DRAFT: OUTREACH_SEQUENCES §8]
> Understood, {{first_name}}. I'll come back to you around {{their_date}}. If it moves up the list before then, here's the link: {{booking_link}}.

No date given:
> Understood. Is there a better time to check back, or would you rather I didn't?

If they answer "rather you didn't", that is an opt-out (T8).

**T5 Not-now check-in (on the dated task)** [NEW]
> Hi {{first_name}}, you mentioned {{their_date}} might be a better time to pick this up. Is it worth a conversation now, or should I leave it? Either answer is fine. {{booking_link}}

**T6 Not a fit** [DRAFT: REPLY_PLAYBOOK §2 NOT_FIT]
> Thanks for saying so, {{first_name}}. I'll close this off. Good luck with {{firm}}.

**T7 Referral** [DRAFT: REPLY_PLAYBOOK §2 REFERRAL]
> Thanks, {{first_name}}, that's helpful. Would you be comfortable introducing me to {{referral_name}}, or would you prefer I reach out and mention you pointed me their way?

**T8 Opt-out** [DRAFT: REPLY_PLAYBOOK §2 UNSUBSCRIBE and OUTREACH_SEQUENCES §10]
> Understood. I won't contact you again.

**T9 Reasoned complaint** [NEW]
> Sorry, {{first_name}}. That wasn't welcome, and I've removed you from everything. You won't hear from me again.

Objection replies (case studies, "is this AI?", time, "we have an agency", guarantees, "how did you get my email?") use the table in REPLY_PLAYBOOK §2 OBJECTION. Do not re-draft them here. That table includes one approved Objection Vault line and verbatim Execution Manual lines.

---

## 4. No-show playbook

**A no-show is a funnel event, not an outcome.** In the app's sales call, record `attended = false` and leave the **outcome empty**. Outcomes (won / follow_up / proposal_process / not_fit / lost) are only for calls that happened. The app also requires diagnosis coverage before any outcome other than not_fit. In Attio the stage **stays "Call booked"** while a rebook is open. Read the show rate only after 30 bookings. If it is poor, fix the booking and reminder stage, not outreach volume (EM §14).

### 4.1 Diagnosis call (60 minutes), proposed sequence

| When | Action | Wording |
|---|---|---|
| Start time | Check they are not just late in the waiting room. Optionally email the meeting link. Call **only** a business number they gave you, after the TPS/CTPS check (REPLY_PLAYBOOK §4.2). | [DRAFT: REPLY_PLAYBOOK §5] "I'm on the call now, {{first_name}}: {{meeting_link}}. Running late is fine." |
| +10 minutes, same day | **The same-day message, containing the one rebook offer.** Attio task: "No-show touch 2", due in 3 working days. Log the touch with class "No-show". | [DRAFT: BOOKING_QUESTIONS §1.7] Subject `Another time?` "Looks like today didn't work out, {{first_name}}. No problem at all. If you'd still like the diagnosis, pick another time here: {{booking_link}}" |
| +3 working days, if no rebook or reply | **Second dated touch: close the loop.** | [DRAFT: BOOKING_QUESTIONS §1.7] "I'll leave this here, {{first_name}}. If the content side becomes a priority for {{firm}}, the link stays open: {{booking_link}}. Good luck with {{recent_thing_or_"the quarter"}}." |
| +5 working days after touch 2 | **Close as no-show.** Stage **Lost**, Lost reason "No-show" (add the option if it is missing). No further contact without a genuine new trigger. | None |

If they rebook, treat it as a new booking: Calendly sends the confirmation and reminders, the stage stays Call booked, and the old call keeps `attended = false`. A **second** no-show gets the same-day message only, then close. Do not offer a third booking.

### 4.2 Founder Research call (20 minutes)

| When | Action | Wording |
|---|---|---|
| +10 minutes, same day | **One** message containing the rebook offer. Never include the Diagnosis link. Attio task: "Close research no-show", due in 5 working days. | [DRAFT: BOOKING_QUESTIONS Part 2] "Looks like today didn't work out, no problem at all. If you'd still like to talk, here's the link: {{research_booking_link}}. If not, thanks anyway." |
| +5 working days | Close the record with reason "Research no-show". **No chase message** (BOOKING_QUESTIONS Part 2: "No close-the-loop chase on the research track"; EMAIL_LIFECYCLE §5 differs, owner to confirm). | None |

### 4.3 Reschedules and cancellations (both call types)
- **They reschedule in Calendly:** no action beyond updating the Attio task date. The confirmation and reminders re-time automatically. [DRAFT: BOOKING_QUESTIONS §1.8A, which says "45 minutes": change it to 60 when it is approved.]
- **They cancel with a reason, or ask to move by email:** reply the same working day with the reschedule link once. Stage stays Call booked. Task: "Rebook check", due in 3 working days. No rebook by then: one T5-style check-in, then Lost ("cancelled, no rebook"). A cancellation that says "not interested" is an **opt-out**.
- **We need to move it:** at least 24 hours ahead where possible. [DRAFT: BOOKING_QUESTIONS §1.8B] "Hi {{first_name}}, I'm sorry, I need to move our call on {{date}}. Could you pick a time that suits you here: {{reschedule_link}}? If none work, reply with two options and I'll fit around you." Never blame them and never invent a reason.

---

## 5. Logging checklist per touch (Attio, by hand)

Smartlead cannot push anything to Attio, so log each touch **at the time you handle it**, during the 09:00 or 15:30 check.

- [ ] **Person and company exist** in Attio, deduplicated by email and domain. Create them if not, Source set.
- [ ] **Reply class** (deal field *Last reply type*): interested / curious / not now / not a fit / referral / opt-out / angry / OOO / bounce / no-show.
- [ ] **Message version** (deal field *Message version*): Smartlead campaign, variant and step (e.g. `CE1-A-step2`) or DM sequence step (H07). For a no-show, the call type.
- [ ] **Source** (deal field *Source*): Smartlead cold email / LinkedIn / X / Instagram / referral / inbound / research.
- [ ] **Owner:** Ilyas, or the named stand-in.
- [ ] **Stage** moved per §2 or §4.
- [ ] **Next action and due date:** exactly one open Attio task with a date. Only Lost or opted-out records have none.
- [ ] **Exact words:** paste the key line of their reply into the deal notes, without paraphrasing. Attended calls also need VOC in *Call notes* (E22).
- [ ] **Smartlead state matches:** the sequence is stopped, and an opt-out or bounce is unsubscribed or blocked. Tick **Do not contact** for opt-outs, complaints and hard bounces.
- [ ] **Template used:** T1–T9, or "custom", so the Friday review can see which wording works.
- [ ] **Research flag:** research-track people are never given a commercial stage or added to a commercial campaign (J02).

Known gap (E22): Attio holds only the **latest** reply type per deal. Until that changes, counting replies by message version relies on Smartlead analytics plus these notes.
