# Client and operator runbook

How Threadline is run day to day, by Threadline staff ("operator") and by the client's team. Each section says who can do it, where, and what to do when something goes wrong.

## 1. Winning and starting a client (operator)

1. **Application arrives.** The applicant gets a confirmation email; you get an alert (if `OPS_NOTIFY_EMAIL` is set). Open **Admin → Applications**, expand the card.
2. **Qualify.** Set the owner, the next action and its due date. Record the outcome when it is decided (lost, not a fit, no response need a reason).
3. **Convert.** In the same card, "Convert into a client": choose the workspace name and address. This creates the workspace, a draft engagement on the standard offer, invites the founder, and queues the won deal for the CRM. Converting twice is safe; it returns the same workspace.
   - If email is not configured, copy the invitation link shown and send it yourself.
4. **Founder accepts** (client): they choose their own password and land in their workspace as owner and primary contact.
5. **Activate the engagement** on the client's admin page (**Engagement** card): choose the date the first period starts. Periods appear; the setup and first period invoices are drafted.
6. **Record the signed agreement** (Billing card → Signed agreements): document, version, signer, where the signed copy is.

Recovery: an invitation expired or went astray → **Members → Invitations → Resend** (the old link stops working). Wrong address → **Revoke** and invite again.

## 2. The client's team (client admin)

- **Invite** from **Settings → People → Invite someone**: role plus profiles (Approver approves work; Commercial sees pipeline, results and billing; View only cannot change anything).
- **Existing Threadline users** sign in first, then open the link. Nobody ever sets another person's password.
- **Primary and backup contact**: in the person's menu → Profiles and contact. The backup approver hears about approvals left waiting three days.
- **Someone leaves**: Suspend (access ends on their next click; their open tasks return to the unassigned queue) or Remove. The owner can only be changed by **Make owner** on another admin.
- **Notifications**: each person chooses under **Account security → Notifications** whether a workspace emails them (never, as it happens, or a daily summary), quiet hours and snooze.

## 3. Onboarding and recording (client, operator)

- The founder works through onboarding at their own pace; progress saves. Operators can prefill the Brand Brain.
- Recording readiness problems appear at the top of the client's home screen until fixed.
- Contributors upload source material (call notes, voice notes, documents) in the Library. Only images, video, audio, PDF, text and Word files are accepted, and the file's content must match its type.

## 4. Approving and revising (client approver)

- **Approvals** lists everything waiting, oldest first, with the version being approved.
- Open an item to approve it or send it back with a note (a send-back without a note is refused).
- To approve several unchanged items at once, tick them and **Approve selected**. Anything that changed since the page loaded is skipped and left for you to look at again.
- An approval covers that exact version. If the script, cut or packaging changes afterwards, it comes back for approval; it cannot be published otherwise.

## 5. Publishing and evidence (operator)

- **Connected platforms**: a client admin connects an account from **Settings → Access** (where the platform app is configured). Scheduling and publishing refuse anything not approved in its current version.
- **Manual publishing**: post the approved package by hand, then record the URL and time on the publish record.
- **Numbers**: connected platforms refresh automatically where supported; otherwise **Performance → Import numbers from a CSV**: preview, then import. Re-importing the same file adds nothing.
- **Commercial evidence**: record inquiries, calls and deals; the evidence class says how strong the link to content is (from directly tracked to qualitative only). Client CRMs and payment tools can post events by webhook once their credential is stored (**Settings → Access → Inbound webhooks**, staff only).

## 6. The learning loop (operator)

On each piece (**Production → the piece → Learning loop**):
1. Attach it to the thesis it tests.
2. **Freeze the expectation** before it goes out.
3. After it has data, **Read the gap**, then correct and **approve the diagnosis**.
4. **Record the correction** (believed, actual, failed assumption, what changes), then later **record the verdict**.
Approved diagnoses and corrections appear in that week's report learnings.

## 7. Reports (operator drafts and finalises; client reads)

- **Weekly**: Reports → Generate. Check it, then **Mark final**: each reader gets one email. To correct a final report: open it → **Start a correction** with the reason; the client keeps seeing the current version until the correction is final.
- **Four-week reviews**: Reports → Four-week reviews → **Write review** for the period. Figures are computed from records; write Action, Results, Problems, Future; **Finalise and send**. Corrections work as for weekly reports.

## 8. Billing (operator; client admin and commercial can view)

- Invoices are **drafted** automatically for the setup fee and each period. Review them on the client's admin page and **Issue**. Issued invoices cannot be edited.
- **Payments**: record each payment (partial payments are fine) with the date, reference and where the evidence is. Refunds are recorded the same way.
- **Mistakes**: void an unpaid invoice with a reason, or issue a **credit note** against an issued one.
- **Disputes**: record them; reminders pause while a dispute is open.
- **Overdue**: reminder drafts appear under the Billing card. Edit, then **Approve and send**, or **Discard**. Nothing is sent automatically.
- **Stripe** (test mode only in this build): set the invoice authority to Stripe before issuing; payments, refunds and disputes then arrive by webhook. Do not mix manual and Stripe invoices on one engagement.

## 9. Scope, renewal and pausing (operator)

- **Scope change**: propose it on the Engagement card (with any fee change and the period it starts); approve or reject it. Live fees change only this way.
- **Pause / resume**: periods that have not started are held and re-planned when you resume.
- **Renewal**: 21 days before the initial term ends a renewal review opens (with a task and a CRM opportunity). Record the decision with what was agreed: renew, expand, pause, end or hand over.

## 10. Proof (client admin grants; operator places)

- The client grants each use separately (testimonial, named case study, published numbers, logo, …) in Settings. Withdrawing a permission is immediate.
- Before using a client's words, numbers or logo anywhere, record the use on their admin page (**Where their proof is used**). A use is refused without a current permission.
- When a permission is withdrawn or expires, its uses are flagged **take down**. Take them down, then mark them.

## 11. Offboarding (operator; deletion by a super admin)

1. Client admin page → **Offboarding** → Start: reason, export window, how long to keep data.
2. This ends the engagement, disconnects accounts and deletes stored tokens, cancels queued work and writes the full export. The client sees a download link on their home screen until access ends.
3. When access ends, client members are suspended automatically.
4. After the retention date a super admin types the workspace address to delete it. A legal hold blocks deletion. The offboarding record remains as evidence.

## 12. When something fails

| Symptom | Where to look | What to do |
| --- | --- | --- |
| Emails not arriving | Admin → System → Email failures | Check Resend configuration; resend the invitation |
| A job keeps failing | Admin → System → Jobs | Read the error; fix the cause; Requeue |
| Deal missing in Attio | Admin → System → CRM sync | Fix the mapping or the duplicate in Attio; Retry |
| Client's CRM events not appearing | Admin → System → Recent webhook deliveries | "refused" means the stored credential is wrong or missing |
| A page says "Something went wrong (Reference …)" | Error tracker, search the reference | — |
| Staff locked out of two-factor | A super admin resets their two-factor; they re-enrol |
