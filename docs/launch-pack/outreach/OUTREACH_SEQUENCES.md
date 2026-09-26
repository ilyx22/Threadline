# Outreach and follow-up sequences

**Status:** READY FOR OWNER REVIEW (26 September 2026), except where a section is marked DRAFT (blocked by the booking-length or identity decisions in §0). No message has been sent and nobody has been enrolled. Everything here is sent **manually by a person**, one prospect at a time. Nothing is automated.

**Labels used in this file:**
- **VERBATIM (playbook V1):** copied exactly from `THREADLINE_FIRST_US_RESEARCH_PROSPECT_BATCH_AND_OUTREACH_PLAYBOOK_V1` (Drive `1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s`), which the SOP Router names as a script authority. Do not edit.
- **ADAPTATION (draft, owner approval pending):** new wording, not yet approved.

The personalisation fields (`{{…}}`) and research rules are in `PERSONALISATION_AND_RESEARCH.md`. Worked examples are in `WORKED_EXAMPLES.md`.

---

## 0. Meeting lengths, booking, sender identity and domain

### 0.1 Meeting lengths (checked against Drive, 26 September 2026)

| Meeting | Length | Evidence | State |
|---|---|---|---|
| **Research conversation** (research track) | **20 minutes** | Calendly event **"Founder Research — 20 mins"**, recorded as live in THREADLINE_CHAT_HANDOFF_2026-09-16 (Drive `12UjpNtrzUzklBM6jBf77HyDT162bW_ueQBUKW4bUv5k`) and in the master TODO (Drive `1lRHytJCSFBJpMbqYXGrljQVjgE1vbs0V`) | **Exists** (not opened from here: the Calendly account is not connected to this session) |
| **Diagnosis sales call** (sales track) | **45 minutes, proposed** | Discovery structure in `src/lib/templates/master.ts`; no event recorded in Drive or any account checked | **Does not exist yet.** Owner to create |
| Brand Brain / kickoff (after WON) | 60–90 minutes | SOP 04; Execution Manual V14.3 | Booked per client |

**Source defect to reconcile before any research script is send-ready.** The approved playbook scripts (§2.2 and §2.3, VERBATIM) ask for "15 minutes", but the booked event is 20 minutes. The Drive 18A brief flags exactly this. The verbatim text is kept unchanged here; the owner decides whether to change the event to 15 minutes or approve a 20-minute version of the scripts. Until then §2.2 and §2.3 are **DRAFT, not send-ready**. Never ask for 15 minutes and then book 20.

**Open in the master TODO:** "test the research path invitation → Founder Research 20-minute event" and "Finalise commercial booking questions".

**Booking link on the site.** `NEXT_PUBLIC_BOOKING_URL` (shown on `/apply`) is not set in the repo. Put the diagnosis event there once it exists; send the research link by hand and never publish it on the site. **Verify:** submit a test application, confirm the link opens the diagnosis event, then cancel the test booking.

### 0.2 Sender identity

- The Drive master TODO: "Use a Threadline-led identity initially. Do not create a fabricated founder", and "Confirm the applicable Deloitte outside-business/conflict requirements before founder-personal commercial activity." The transcript audit (24 September): "Keep the brand company-led and covert initially."
- So: messages are signed by a **real named person** ({{sender_name}}), never a persona. Outreach from the founder's **personal LinkedIn** and any founder-first-person line (library passage A) wait for that employer clearance. **Owner decision:** who signs research and sales messages until then.
- Sender placeholders: {{sender_name}}, {{sender_email}}. Do not hard-code a person.

### 0.3 Domain and inbox

- Drive (chat handoff, 16 September): "Main domain: threadlinehq.com Defensive: threadlinehq.co". "Public brand says Threadline; 'HQ' is plumbing." A founder mailbox on threadlinehq.com is recorded there.
- DNS check (26 September 2026): threadlinehq.com has Google Workspace mail (MX) and a DMARC record, but **no website record yet**, so links to threadlinehq.com do not open a page. Do not put a website link in a message until the owner connects the domain to the approved site. Do **not** replace threadlinehq.com with a Vercel address.

---

## 1. Two tracks, kept apart

| | **Research track** | **Sales track** |
|---|---|---|
| Purpose | Understand how firms like theirs win work and where content breaks. This builds the interview evidence (10+ conversations, more than 5 converging). | Offer the Threadline engagement to a firm that may fit |
| Ask | A 20-minute research conversation (the live Calendly event; see §0.1 on the scripts' "15 minutes") | A diagnosis call (45 minutes proposed; event not yet created) |
| Pitch? | **No.** Do not pitch unless the prospect asks for commercial detail on their own (playbook "Do not do"). | Yes, honestly, with no guarantees |
| Record | In `/admin/market/[id]`, research conversations, with "they raised it" versus "we named it" | In `/admin/prospects/[id]`: state, reply class, next action |
| Move from research to sales | Only when the prospect asks about working together. Say so plainly: "Happy to talk about that separately — this call was research, so let me not blur the two." Book a separate diagnosis call. | — |

Rules for both tracks:
- Never disguise a sales pitch as research. The playbook and CAN-SPAM both prohibit it.
- One channel at a time. Never contact the same person simultaneously on four channels.
- Every active prospect has a next action and a due date.
- Only real profiles. No duplicate or new LinkedIn identities, no rented accounts, no engagement pods, no automated connection requests or messages.
- Outreach may start while the interviews are still being gathered. Starting outreach, collecting research, running a commercial test and declaring the wedge validated are separate steps. A commercial test that starts before the interview evidence is in must have its uncertainty recorded on the wedge in `/admin/market`.

---

## 2. Research track: the two-step, value-first interview request

### 2.1 Step 1: earn the micro-reply

Structure (playbook): one specific piece of evidence you actually noticed → one short diagnosis or opportunity → say that you made 2–3 useful ideas or one small asset → a permission question. The goal is a reply, not a call.

> **Precondition:** the ideas or asset must **already exist** before you write "I wrote down 3 content angles". If you have not made them yet, use the 2.3 variant, which offers to share them.

**LinkedIn, step 1: VERBATIM (playbook V1)**
> “Hey [Name] — I was looking at [specific firm/content/framework]. Your [specific credibility/POV] is much stronger than the way most AI consultancies present themselves. I spotted [one precise authority-system gap/opportunity] and wrote down 3 content angles that could make that expertise much more obvious to [buyer]. Want me to send them?”

**Email, step 1: VERBATIM (playbook V1)**
> Subject: 3 ideas for [Firm]
> “Hi [Name] — I was looking at [specific asset/work]. The bit that stood out was [specific observation]. I think there’s an opportunity to turn that into a much stronger visible authority asset for [buyer], so I sketched 3 angles. Happy to send them over if useful.”

### 2.2 Step 2: give the value, then ask for research time

After a "yes": send the short asset directly (2–3 ideas at most; A-tier gets the one-page format in §6), then ask:

**VERBATIM (playbook V1)**
> “Sent below — hope at least one is useful. I’m currently researching how senior founder-led AI advisory firms are handling founder content / authority internally as the category gets noisier. I’m not trying to turn this into a pitch. Would you be up for 15 minutes sometime this week so I can understand where the process actually works or breaks on your side?”

**Operator note (DRAFT until reconciled):** the booked research event is 20 minutes (§0.1). Do not send this wording with the 20-minute link until the owner resolves the mismatch.

### 2.3 The explicit-exchange variant (one message)

**VERBATIM (playbook V1)**
> “Hey [Name] — I’m researching how senior AI advisory firms are turning founder expertise into authority and demand. I had a look at [specific thing] and spotted [specific gap]. I’ve got 2–3 concrete ideas I’d happily share in exchange for 15 minutes of your perspective. No pitch — I’m trying to understand what the real bottleneck is before I build around assumptions.”

**Operator note (DRAFT until reconciled):** same 15 versus 20 minute mismatch as §2.2.

### 2.4 The research call (20-minute event)

- **Open:** use the playbook's "RESEARCH-CALL OPEN" verbatim (full text in `../sales/RESEARCH_INTERVIEW_SCRIPT.md`). It says: “I’m not going to pitch you.”
- **Core subset for a 20-minute call.** These are playbook questions, by number: 3 (how clients find you), 5 (how content gets made today), 7 (what makes it stop), 8 (how important founder visibility is), 11 (the most frustrating part), 12 (what you have tried), 13 (what it costs), 14 (what "working commercially" would mean).
- **Only if time allows and the conversation is commercially literate:** questions 18–23, including the price-sensitivity test, which comes after neutral discovery and never at the start.
- **Record:** the exact phrases, the VOC fields, and whether *they* raised the problem or you named it. Record problem energy on a 0–5 scale.

### 2.5 Research follow-ups (Day 0 → 3–4 business days → 7–10 days → stop)

**Follow-up 1: VERBATIM (playbook V1)**
> “Small add-on, [Name] — the other thing I noticed was [specific second observation]. I think it could become a strong [format/topic] because [buyer reason]. Happy to send the 3 angles if useful.”

**Follow-up 2, close the loop: VERBATIM (playbook V1)**
> “Will close the loop after this — I made the notes because [specific reason their expertise stood out]. If founder-content/authority isn’t a priority right now, no problem at all.”

Then stop, unless a genuinely new trigger (a new post, launch or role) gives a real reason to get back in touch.

**Thank-you after a research call.** ADAPTATION (draft, owner approval pending):
> "Thanks for the time today, {{first_name}} — genuinely useful, especially {{their_phrase}}. As promised, here are the notes I mentioned: {{asset_or_link}}. If anything I'm working on becomes relevant to you later I'll ask first; I won't add you to anything."

---

## 3. Sales track: cold email (commercial)

Use this only once the prospect passes the business-model filter and the message is openly commercial.

**Compliance notes.** These are not legal advice; confirm with counsel before sending at any volume.
- **US (CAN-SPAM, which applies to B2B too):**
  - The From and Subject lines must be truthful and not misleading.
  - The message must be identifiable as commercial.
  - It must include a valid physical postal address for the sender.
  - It must include a working opt-out, honoured promptly. The legal limit is 10 business days; honour it the same day.
- **UK (PECR and UK GDPR):**
  - Unsolicited marketing email to **corporate** subscribers (for example, name@company.co.uk) is allowed without prior consent, but you must identify yourself, give a valid contact address and offer a simple opt-out.
  - **Sole traders and some partnerships count as individuals.** Emailing them needs prior consent (or the soft opt-in, which does not apply to cold prospects). Check how the firm is constituted before emailing.
  - Keep a record of the legitimate-interests basis for processing the contact data, and honour objections.
- **Postal address:** Threadline's business postal address has not been set in the repo. **Owner decision:** choose the address or registered-office service to use before any commercial email is sent.
- Use the single branded Threadline inbox on threadlinehq.com (Google Workspace; SPF, DKIM and DMARC recorded complete on 15 September in the master TODO). Do not set up a multi-inbox or multi-domain sending stack before validation (playbook).
- **Wording rule** (Execution Manual V14.3): do not market generic "AI / Content OS / repurposing / authority / pipeline" language as unique. Lead with the specific observation and the closed learning loop, not category buzzwords.
- The quoted line “You talk. You record. You approve. You sell. Threadline handles the machine.” is **verbatim from Execution Manual V14.3** (§2).

**Cold email 1.** ADAPTATION (draft, owner approval pending):
> Subject: {{firm}} — {{observed_evidence_short}}
>
> Hi {{first_name}},
>
> I read {{source_title}} ({{source_url}}). {{observed_evidence}} is a stronger point of view than most {{category}} firms put in front of buyers — but from the outside it only shows up {{where_it_shows_up}}.
>
> Threadline does the research, scripting, production and publishing around expert-led firms, and each week reads back what your market actually responded to.
>
> “You talk. You record. You approve. You sell. Threadline handles the machine.”
>
> Worth a diagnosis call to see whether it fits {{firm}}? If it isn't a fit I'll say so.
>
> {{sender_name}}, Threadline · {{sender_email}}
> {{postal_address}} · Not interested? Reply "no thanks" and I won't email again.

**Follow-up (3–4 business days later).** ADAPTATION (draft): add one new, specific observation. Do not "bump".
> "One more thing I noticed, {{first_name}}: {{second_observation}}. That's the kind of idea that tends to get lost between a delivery call and a post. Happy to show you how we'd handle it — or leave it there if the timing's wrong."

**Close the loop (7–10 days).** ADAPTATION (draft):
> "I'll leave this here, {{first_name}}. If building visible authority around {{topic}} becomes a priority, I'm easy to find. Either way, good luck with {{recent_thing}}."

---

## 4. LinkedIn and X messages (manual, real profile only)

- **LinkedIn outbound is the launch acquisition channel** (Drive master TODO).
- Send from a **real** person's own LinkedIn profile, improved truthfully first (playbook). Never from a new, duplicate or fabricated identity. Outreach from the **founder's personal profile** waits for the employer-clearance decision in §0.2 (owner decision). Threadline's public brand is company-led; the person sending is who they really are.
- No automation: no connection-request tools, no auto-follow-ups, no scraping. LinkedIn prohibits unauthorised automated messaging.
- Engage with a recent post only when you have something genuinely useful to add. No engagement theatre, no pods.
- **Research:** use the §2.1 LinkedIn step 1 (VERBATIM).
- **Sales, connection note (under 300 characters).** ADAPTATION (draft):
> "{{first_name}} — your point on {{observed_evidence_short}} was the sharpest thing I've read on {{topic}} this month. I work on Threadline; we build the content engine around expert-led advisory firms. Would be glad to connect."
- **Sales, after they accept.** ADAPTATION (draft): send the cold email body in §3 as a DM, without the compliance footer. Keep the "if it isn't a fit I'll say so" line. Do not pitch in the connection note itself.
- **X DMs:** only where the person has open DMs and is active. Use the same research or sales wording, shortened. Do not cold-DM people who have closed their DMs.

### 4.1 Phone, and choosing one Primary system (Execution Manual V14.3)

- "One Primary system first; direct phone gets priority testing if legitimate founder numbers are readily available; otherwise LinkedIn/email can be Primary. Email matures in parallel. Build Secondary/Tertiary only after Primary proof." (verbatim). "Do not hard-code cold email as primary." (verbatim)
- **Phone, ADAPTATION (draft):** call only a number the firm publishes for business contact. Open with who you are and why you are calling in one sentence, ask if now is a bad time, and offer to send the observation instead. Research calls say they are research; sales calls say they are sales. UK: screen against the Corporate TPS before calling a business number; US: business-to-business calls to a published business line are generally permitted, but honour any do-not-call request immediately and record it.
- Record the channel on every first touch and compare reply and booking quality before choosing the scaled mix (playbook).

---

## 5. Warm introductions and referrals

**Asking a mutual contact for an introduction.** ADAPTATION (draft):
> "Would you be comfortable introducing me to {{first_name}} at {{firm}}? I'm {{research: 'researching how senior advisory firms turn expertise into demand and would value 20 minutes of their view' | sales: 'working on Threadline and think the way they talk about {{topic}} could reach far more of the right buyers'}}. Only if you think they'd welcome it — here's a two-line blurb you can forward: {{blurb}}."

**Blurb to forward.** ADAPTATION (draft):
> "{{sender_name}} works on Threadline, which runs the content engine around expert-led advisory firms. They asked to meet you because of {{observed_evidence_short}}. No obligation."

**After the introduction.** ADAPTATION (draft): reply within one business day. Move the introducer to Bcc. Ask for the call length that matches the track: 20 minutes for research (the live event), a diagnosis call for sales (45 minutes proposed, once the event exists).

**A client or contact refers someone.** ADAPTATION (draft):
> "{{referrer}} suggested we speak — thank you for being open to it. {{one_line_reason}}. Would a {{20|45}}-minute call next week work? If it's not relevant, just say and I'll close it off."

Record the prospect's source as a referral, and its content influence where it is known (see `PERSONALISATION_AND_RESEARCH.md` §5).

---

## 6. Sending a promised observation or sample

**Rule:** send it only once it exists and has been checked. Never write "attached", "I've put together an audit" or "here's your teardown" before the file or page actually exists. Never call a short observation an "audit".

**A-tier one-page format (playbook).**
- Header: "3 authority opportunities I noticed for [Founder/Firm]".
- The evidence (what is already strong), then the gap, then three angles, each with a hook and why the buyer cares.
- Optionally, one drafted 45–75 second script.
- **No pitch call to action inside the asset.**

**Cover message.** ADAPTATION (draft):
> "As promised, {{first_name}} — {{asset_title}} ({{link_or_attachment}}). It's based only on public material ({{source_url}}), so treat the angles as hypotheses; you'll know better than I do which land with your buyers."

B-tier prospects get truthful personalisation, not a bespoke asset, until they show signal. Do not spend 45 minutes on an artefact before they have replied (playbook).

---

## 7. Follow-up cadence (both tracks)

| Day | Action |
|---|---|
| 0 | First touch (§2 or §3) |
| 3–4 business days | One light follow-up, adding a second specific observation |
| 7–10 days | Close the loop |
| After that | Stop. Re-contact only on a genuine new trigger. |

- Treat Monday to Thursday as the main B2B window. Do not read weekend silence as a "no" until the Monday–Tuesday window has passed (playbook).
- Log every touch on the prospect, with its channel and date.

---

## 8. Replies: classify, then act (SOP Router §4)

Every reply gets one class, a next action and a due date, recorded on `/admin/prospects/[id]`.

**These reply templates are provisional.** The Execution Manual says: "Build reply templates only from repeated real conversations. Do not over-script early." Replace each one with wording drawn from real replies once patterns repeat.

| Class | Meaning | Response (ADAPTATION, draft) | Next action |
|---|---|---|---|
| **INTERESTED** | Wants to talk | "Great — here's a link for a {{20|45}}-minute slot: {{booking_link}}. If none of those work, send me two times." | Booked within 2 business days |
| **CURIOUS** | Asks what this is | Two sentences on what Threadline does, then: "Easiest is a short call — would {{20|45}} minutes work?" | Follow up in 3 business days |
| **SEND_INFO** | "Send me something" | Send only what exists: the relevant Playbook chapter link or the promised observation. "Happy to walk through it live if useful." | Follow up in 5 business days |
| **NOT_NOW** | Timing | "Understood. Is there a better time to check back, or would you rather I didn't?" | Their date, or close |
| **OBJECTION** | A specific concern | Answer honestly and briefly with the matching response from `../sales/SALES_CALL_GUIDE.md` §10. Never argue twice. | Their reply, or close in 7 days |
| **REFERRAL** | "Talk to X instead" | Thank them; ask if they would introduce you, or if you may mention them (§5) | Contact the referral |
| **NOT_FIT** | Wrong firm or wrong need | "Thanks for saying so — I'll close this off." | Close with the reason |
| **BOOKED** | A call is scheduled | Confirmation (§9) | Prep the day before |

**Qualifying by reply before booking a diagnosis call.** Ask at most two questions, and only what you cannot find in public: "Roughly what's a typical engagement worth for you?" and "Who else would be involved in a decision like this?"

---

## 9. Booking, reminders, no-shows, post-call

**Booking touches: three, every time** (Execution Manual V14.3 §14, verbatim): "Immediate confirmation: what the diagnosis will cover + exact meeting details." "Day-before reminder: concise reminder plus useful context/proof where appropriate." "Day-of reminder: short exact link/time." The booking tool's automatic emails do not replace these; send them by hand (or confirm the tool sends exactly these). "If booking rate is good and show rate is poor, fix this stage instead of increasing outreach." (verbatim)

**1. Immediate confirmation.** ADAPTATION (draft):
> "Booked for {{date_time}} ({{20|45}} minutes, {{meeting_link}}). {{research: 'This is a research conversation: how work comes in for you and where content helps or breaks. No pitch.' | sales: 'We'll cover how work comes in today, where content fits, and whether the problem Threadline solves is yours. If it isn't a fit I'll say so.'}}"

**2. Day-before reminder.** ADAPTATION (draft):
> "Looking forward to tomorrow at {{time}}, {{first_name}}. {{sales: 'One thing worth having to hand: roughly what a typical engagement is worth to you.'}} If anything's come up, just reply and we'll move it."

**3. Day-of reminder.** ADAPTATION (draft):
> "Today at {{time}}: {{meeting_link}}"

**No-show.** Wait 10 minutes, then send once. ADAPTATION (draft):
> "Looks like today didn't work out — no problem at all. Here's the link if you'd like to pick another time: {{booking_link}}."
If there is no response after 3 business days, send one close-the-loop message (§7), then stop.

**After a research call:** the thank-you in §2.5. Nothing commercial.

**After a diagnosis call** (within 24 hours). ADAPTATION (draft):
> "Thanks, {{first_name}}. What I heard: {{problem_in_their_words}}. What you want in 90 days: {{desired_in_their_words}}. What we agreed: {{next_step}} by {{date}}. {{if_proposal: 'The proposal will be with you by {{date}}.'}} If I've got any of that wrong, tell me."
Send nothing that was not promised on the call. One reminder before the agreed decision date, one close-the-loop message after it, then record the final state (NOT_FIT / FOLLOW_UP / PROPOSAL_PROCESS / WON; LOST if a follow-up or proposal ends without a yes).

---

## 10. Close-out and opt-out

- **An opt-out in any form** ("no thanks", "remove me", "stop", or anything that clearly means it):
  - Stop immediately on every channel.
  - Record it on the prospect (state closed, reason "opted out").
  - Reply once only if a reply is expected. ADAPTATION (draft): "Understood — I won't contact you again."
- **A request to delete data:** remove the prospect's personal data from the prospect record and any notes. Keep only what the law requires as evidence of the opt-out. Record the date.
- **Never:**
  - re-add someone who opted out;
  - move them to another channel;
  - "check in" months later without a genuine new trigger and a lawful basis.
- **When a sequence ends without an opt-out,** close the record with the reason (no reply, not now, not fit) and no further scheduled touches.
