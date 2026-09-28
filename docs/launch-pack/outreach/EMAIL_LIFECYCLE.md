# Email lifecycle: research, sales and client emails

**Status:** every email here is a **DRAFT** (26 September 2026). None has been sent, and none is approved. This file fills the email gaps listed in the Drive 18A brief (`1CMSYazQKIce61IE0tfPiEIKULu2P1A3c`, section 18A, "Email scripts").

**Purpose classes** (never mix them in one message):
- **RESEARCH:** genuine research, no pitch.
- **SALES:** openly commercial; the compliance notes in `OUTREACH_SEQUENCES.md` §3 apply.
- **TRANSACTIONAL:** client service messages about an existing engagement.

**Sender:** always a real named person, via `{{sender_name}}` and `{{sender_email}}` (threadlinehq.com inbox). Founder-personal sending waits for the employer-clearance decision (`OUTREACH_SEQUENCES.md` §0.2).

**App template mapping.** The existing templates are in `src/lib/email/templates.ts`: invite, password_reset, weekly_report, application_received, application_operator_alert, period_review, payment_reminder, notification, digest. Emails marked **APP** below map to one of these and are sent by the product through the job queue once email is configured. The rest are sent by a person.

**Never** invent links, dates or SLAs, and never promise results.

| # | Email | Class | Sent by |
|---|---|---|---|
| 1 | Value delivery (promised observation) | RESEARCH or SALES | Person |
| 2 | Research booking and thanks | RESEARCH | Person |
| 3 | Explicitly commercial invitation | SALES | Person |
| 4 | Pre-call reminder | RESEARCH or SALES | Person |
| 5 | No-show and reschedule | RESEARCH or SALES | Person |
| 6 | Proposal recap and follow-up | SALES | Person |
| 7 | Welcome and kickoff | TRANSACTIONAL | Person; the account invite is APP `invite` |
| 8 | Missing inputs | TRANSACTIONAL | Person; in-app reminders use APP `notification` / `digest` |
| 9 | Approval or revision request | TRANSACTIONAL | APP `notification` / `digest` |
| 10 | Report delivery | TRANSACTIONAL | APP `weekly_report`, `period_review` |
| 11 | Renewal | TRANSACTIONAL / SALES | Person |
| 12 | Offboarding | TRANSACTIONAL | Person, plus the in-app export |

---

## 1. Value delivery: the promised observation

- **Audience:** a prospect who said "yes, send it".
- **Trigger:** the asset exists and has been checked.
- **Variables:** `{{first_name}}`, `{{asset_title}}`, `{{asset_or_link}}`, `{{source_url}}`.
- **Subject:** `{{asset_title}}`
- **Body:**
  > Hi {{first_name}}, as promised: {{asset_or_link}}. It's based only on public material ({{source_url}}), so treat the angles as hypotheses; you'll know better than I do which ones land with your buyers.
- **CTA:** none in the asset itself. On the research track, follow with the step-2 research ask (DRAFT until the 15 vs 20 minute issue is resolved).
- **Stop conditions:** no reply after the §7 cadence; an opt-out.
- **Status:** DRAFT.

## 2. Research booking and thanks

- **Audience:** a research interviewee.
- **Triggers:** booking confirmed (part A); call finished (part B).
- **Variables:** `{{first_name}}`, `{{date_time}}`, `{{meeting_link}}`, `{{their_phrase}}`, `{{asset_or_link}}`.
- **A. Confirmation**
  - **Subject:** `Research conversation, {{date_time}}`
  - **Body:**
    > Thanks for making time, {{first_name}}. Booked for {{date_time}} (20 minutes): {{meeting_link}}. This is research: how work comes in for you and where content helps or breaks. No pitch.
- **B. Thanks, within one business day**
  - **Subject:** `Thank you, and the notes I mentioned`
  - **Body:**
    > Thanks for the time today, {{first_name}}. Genuinely useful, especially {{their_phrase}}. As promised: {{asset_or_link}}. If anything I'm working on becomes relevant to you later, I'll ask first; I won't add you to anything.
- **CTA:** none.
- **Stop conditions:** after the thanks, no further contact without a genuine new reason.
- **Status:** DRAFT. The booked event is the live 20-minute Calendly event, and the invitation now says 20 minutes (owner decision, 28 Sept 2026; `OUTREACH_SEQUENCES.md` §0.1).

## 3. Explicitly commercial invitation

- **Audience:** a prospect who passes the business-model filter, or a research contact who asked about working together.
- **Trigger:** a qualified prospect; never sent off the back of a research call without the prospect's own request.
- **Variables:** `{{first_name}}`, `{{firm}}`, `{{observed_evidence}}`, `{{booking_link}}`, `{{postal_address}}`.
- **Subject:** `{{firm}}: a diagnosis call?`
- **Body:**
  > Hi {{first_name}}, this one is commercial, so I'll say so up front. Threadline does the research, scripting, production and publishing around expert-led advisory firms, and reads back what the market responded to. {{observed_evidence}} is the sort of expertise that tends to stay invisible. Would a diagnosis call be useful? {{booking_link}}. If it isn't a fit, I'll say so.
  >
  > {{sender_name}}, Threadline · {{postal_address}} · Reply "no thanks" and I won't email again.
- **CTA:** book the diagnosis call.
- **Stop conditions:** opt-out; close the loop after 7–10 days.
- **Status:** DRAFT. It is blocked until two owner actions are done: the diagnosis event does not exist yet, and the postal address is not set.

## 4. Pre-call reminder

Three touches, per Execution Manual V14.3 §14: an immediate confirmation, a day-before reminder and a day-of reminder. The wording is in `OUTREACH_SEQUENCES.md` §9.

- **Audience:** anyone booked.
- **Variables:** `{{time}}`, `{{meeting_link}}`.
- **Subjects:** `Tomorrow at {{time}}` (day before); `Today at {{time}}` (day of).
- **CTA:** join.
- **Stop conditions:** a cancellation.
- **Status:** DRAFT.

## 5. No-show and reschedule

- **Audience:** a booked person who did not join.
- **Trigger:** 10 minutes after the start time.
- **Variables:** `{{first_name}}`, `{{booking_link}}`.
- **Subject:** `Another time?`
- **Body:**
  > Looks like today didn't work out, {{first_name}}. No problem at all. Here's the link if you'd like to pick another time: {{booking_link}}.
- **CTA:** rebook.
- **Stop conditions:** no reply after 3 business days, then one close-the-loop message, then stop.
- **Status:** DRAFT.

## 6. Proposal recap and follow-up

- **Audience:** a prospect in PROPOSAL_PROCESS or FOLLOW_UP.
- **Trigger:** within 24 hours of the diagnosis call; then one reminder before the agreed decision date.
- **Variables:** `{{problem_in_their_words}}`, `{{desired_in_their_words}}`, `{{next_step}}`, `{{date}}`, `{{outstanding_question}}`.
- **Subject:** `Recap: {{firm}} and Threadline`
- **Body:**
  > What I heard: {{problem_in_their_words}}. What you want in 90 days: {{desired_in_their_words}}. What we agreed: {{next_step}} by {{date}}. Still open: {{outstanding_question}}. The proposal covers £2,500 implementation and £2,500 every four weeks for an initial 12 weeks (three four-week periods, £10,000), with the scope we discussed. If I've got anything wrong, tell me.
- **CTA:** a decision by the agreed date.
- **Stop conditions:** one reminder, one close-the-loop message, then record the state.
- **Status:** DRAFT. Internal only: pricing never goes on the public site.

## 7. Welcome and kickoff

- **Audience:** a new client (WON, with the SOP 04 gate passed).
- **Trigger:** signature and payment condition met.
- **Variables:** `{{first_name}}`, `{{kickoff_date_time}}`, `{{workspace_link}}`, `{{pre_kickoff_list}}`.
- **Subject:** `Welcome to Threadline: what happens next`
- **Body:**
  > Welcome, {{first_name}}. Onboarding starts now. Your Brand Brain and kickoff session is booked for {{kickoff_date_time}} (60–90 minutes). Before then, please send: {{pre_kickoff_list}}. For accounts, we only ask for delegated or native access; we never ask for passwords. You'll receive a separate invitation to your workspace ({{workspace_link}}).
- **App:** the workspace invitation is the `invite` template.
- **Stop conditions:** none; this is a one-off.
- **Status:** DRAFT.

## 8. Missing inputs

- **Audience:** a client admin or contributor.
- **Trigger:** an input is overdue: a recording, proof, access or Brand Brain confirmation.
- **Variables:** `{{first_name}}`, `{{item}}`, `{{why_it_matters}}`, `{{link}}`, `{{new_date}}`.
- **Subject:** `Waiting on: {{item}}`
- **Body:**
  > Hi {{first_name}}, we're waiting on {{item}}. {{why_it_matters}}. It's here: {{link}}. If it's easier, reply with a new date and we'll plan around {{new_date}}.
- **App:** in-app reminders use the `notification` and `digest` templates, following each person's email preference.
- **Stop conditions:** the input is received, or it is escalated to the client owner after one reminder.
- **Status:** DRAFT.

## 9. Approval or revision request

- **Audience:** the designated approver (with a backup).
- **Trigger:** a version is ready for review.
- **Variables:** `{{piece_title}}`, `{{link}}`, `{{due_date}}`.
- **Subject:** `Ready for your approval: {{piece_title}}`
- **Body:**
  > {{piece_title}} is ready: {{link}}. Approve it, or request changes with a note. Approval covers this exact version; if anything changes, it comes back to you. It would help to have it by {{due_date}}.
- **App:** the `notification` and `digest` templates. Waiting approvals escalate to the backup approver and the owner once a day (existing behaviour).
- **Stop conditions:** approved, or changes requested.
- **Status:** DRAFT.

## 10. Report delivery

- **Audience:** the client admin and anyone following reports.
- **Triggers:** a weekly report is final; a four-week review is final.
- **Variables:** `{{workspace}}`, `{{period}}`, `{{link}}`.
- **Subjects:** the app's own: "{{workspace}}: report for {{period}} is ready" and "Your four-week review: {{period}}".
- **App:** the `weekly_report` and `period_review` templates. The body is already in the app; do not duplicate it by hand.
- **Status:** DRAFT; the app templates exist and send once email is configured.

## 11. Renewal

- **Audience:** a client near the end of the initial 12 weeks.
- **Trigger:** the period-3 review.
- **Variables:** `{{first_name}}`, `{{where_we_started}}`, `{{what_changed}}`, `{{weakest_link}}`, `{{next_intervention}}`, `{{date}}`.
- **Subject:** `After the first twelve weeks`
- **Body:**
  > {{first_name}}, the third four-week review is here. Where we started: {{where_we_started}}. What we changed and what happened: {{what_changed}}. The current weakest link: {{weakest_link}}. What we'd do next: {{next_intervention}}. If you'd like to continue, the service carries on four weeks at a time. Shall we talk it through by {{date}}?
- **CTA:** a renewal conversation.
- **Stop conditions:** a decision.
- **Rules:** if results are weak, run an honest diagnosis and renewal-or-exit conversation, and do not ask for a testimonial (library L).
- **Status:** DRAFT.

## 12. Offboarding

- **Audience:** a client admin leaving.
- **Trigger:** the engagement ends.
- **Variables:** `{{first_name}}`, `{{export_window}}`, `{{retention_period}}`.
- **Subject:** `Closing your Threadline workspace`
- **Body:**
  > {{first_name}}, thank you for working with us. You can export your workspace from Settings → Your data; each download link lasts seven days, and the export is available for {{export_window}}. After that, data is kept for {{retention_period}} and then deleted. Tell us if you need anything moved first.
- **Blocked:** `{{export_window}}` and `{{retention_period}}` await the owner's retention decision. Do not send until it is made.
- **Status:** DRAFT.
