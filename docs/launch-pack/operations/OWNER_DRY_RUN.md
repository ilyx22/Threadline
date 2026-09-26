# Owner dry run: one synthetic client, end to end, with a real content deliverable

**Status: PENDING until the owner performs it.** Automated tests and walkthroughs do not complete it.

**Purpose.** Measure real owner effort and fulfilment quality before a real client arrives. This is the Blueprint's human-hours test.

**Label every output:** "SYNTHETIC / UNVALIDATED Delivery Load estimate".

## Isolation rules

- **Where:** the local build (`npm run dev` with the local database) or the primary deployment once it is configured. **Never threadlinex.**
- **Workspace:** create an organisation named `DRYRUN-2026-10 <reference firm>`.
  - The Blueprint suggests a real public company as the *imaginary* client. Use only its public material, label every assumption, and never contact it.
- **Keep synthetic activity out of proof, reporting and billing:**
  - Stripe in **test mode** only.
  - Invitations go only to addresses you own.
  - Publish through the **manual route**: record a placeholder URL and post nothing.
  - Never tick testimonial, case-study or proof permissions.
  - Exclude the org from commercial reporting.
  - Offboard it at the end.
- **Stopwatch:** time every step.
  - Record **active minutes** and **waiting minutes** separately, plus **context-switch minutes**.
  - Class each step as OWNER-ONLY / DELEGATABLE / AUTOMATABLE / WAITING.
  - Record any cash or vendor cost.
- **Planned friction.** Inject at least:
  - one script rejection;
  - one substantial revision;
  - one missing input;
  - one late approval;
  - one poor recording.

## Steps

| # | Step | Where (app) | Expected behaviour | Evidence to capture | Active | Waiting | Failures / friction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Application**: apply as the prospect | `/apply` | Confirmation shown; the application appears in Admin → Applications; the application-received email is queued (sent only if email is configured) | Screenshot; application id | | | |
| 2 | **Review**: qualify or decline | Admin → Applications | Decision recorded with a reason; the reply is drafted, not sent | Decision and reason | | | |
| 3 | **Conversion**: convert with the standard offer | Application → Convert | Org, engagement and frozen offer snapshot (£2,500 + £2,500 / 28 days × 3); test-mode invoice not sent | Engagement id; offer snapshot | | | |
| 4 | **Invitation**: invite the client admin (your second address) | Admin → Client → Team | Invite link (on screen if email is not configured); acceptance; two-factor offered | Accepted membership | | | |
| 5 | **Client teammate**: the admin invites an approver and a viewer | Settings → Team | The approver can approve; the viewer can only view | A screenshot for each role | | | |
| 6 | **Onboarding**, as the client, in 60–90 minutes | `/onboarding/[org]`, Brand Brain | Sections saved; operator prefill shows "waiting for your confirmation"; installation signed off only when complete | Brand Brain version; time taken | | | |
| 7 | **Expertise capture**: record a 20-minute expertise conversation (real voice, synthetic firm), upload it, mine it | Library → upload → **Mine it** | The transcript (or pasted notes if there is no processing worker) is mined into exact-quote evidence | The count of mined items | | | |
| 8 | **Actual content production**: 3–5 core messages, then **one finished short-form script plus one LinkedIn text post from the same root idea**, taken to recorded or final form | Create → Ideas → Scripts → Recording | The pieces pass internal QA against the checklist; the packaging passes the claims check | **Keep the deliverables.** Also record: AI draft acceptance %, rewrite minutes, correction reasons, and the source-to-derivative ratio | | | |
| 9 | **Revision and approval**: reject one script; request a change on a cut; re-cut; approve by bulk approval | Approvals | A change returns it for approval; bulk approval skips any item whose version changed | Version history | | | |
| 10 | **Distribution or its documented fallback**: schedule through a connected account, or the manual route | Distribution | Manual: the URL and time are recorded; nothing is posted publicly | Publish record | | | |
| 11 | **Results**: freeze an expectation **before** publishing; enter synthetic performance labelled SYNTHETIC | Performance → Learning | Diagnosis shows expected vs actual with an evidence class | Diagnosis screen | | | |
| 12 | **Report**: weekly report, then a four-week review; download the PDF | Reports | The report answers the nine required questions under Action / Results / Problems / Future | PDF | | | |
| 13 | **Support**: raise a Help request as the client; answer it as staff | Help; Admin | Status visible on both sides; blocking flag honoured | Request id | | | |
| 14 | **Offboarding**: export, then offboard | Settings → Your data; Admin → Offboarding | Access revoked; the export link works for 7 days; deletion scheduled | Export file | | | |

## Afterwards

Write the results to `operations/DRY_RUN_RESULTS_<date>.md`:

1. **Totals:** owner-only minutes; founder-side minutes (steps 6–9 as the client); operator minutes; waiting time; context-switch overhead; cash cost.
2. **Fulfilment quality:** would you publish the step 8 deliverables for a paying client? What would you change?
3. **Top three frictions**, each with a proposed fix.
4. **Founder time:** whether the internal 60-minute weekly estimate survives. It stays internal until real clients confirm it.
