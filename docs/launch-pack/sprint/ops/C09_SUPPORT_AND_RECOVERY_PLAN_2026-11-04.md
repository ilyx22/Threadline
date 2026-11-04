# C09: support and recovery plan (4 Nov 2026)

> **Status:** DRAFT. Every product statement below was checked against the code or production on 4 Nov 2026. The **owner decisions** in section 6 must be made before any support hours or response times are given to a client.
>
> **Scope:** launch with one to three clients and the owner doing delivery. No on-call rota, no support desk tool and no new build. This plan is what happens on the day something goes wrong.

## 1. Who handles support

| Role | Who | Notes |
|---|---|---|
| Support owner | **Ilyas** (owner) | The only staff member at launch. |
| Backup | **None at launch** | Stated honestly. If the owner is unavailable for more than one working day, tell active clients in advance, by email from ilyas@threadlinehq.com, with a return date. |
| Commercial or contract concerns | The person who signed the agreement (Ilyas) | Same person at launch. |

## 2. How a client reaches us, and what the product does

Verified in the code on 4 Nov 2026 (`src/lib/support/requests.ts`, `src/app/app/[org]/help`).

1. Any workspace member opens **Help**, writes **What do you need?**, and presses **Send to Threadline**.
2. Optionally they tick **This is stopping us from doing something**. This marks it as a blocking request, with severity high.
3. The request lands in **Admin → Support** with the workspace attached. Every active staff member gets an in-app notification ("Blocking: …" for blocking requests).
4. **New 4 Nov (C09):**
   - **The gap:** staff email notifications are off by default, so a blocking request used to wait until someone opened the admin.
   - **The fix:** a blocking request now also emails the operations inbox (`OPS_NOTIFY_EMAIL`, the same address that gets new-application alerts), with a link to Admin → Support. It sends at most once per request, and non-blocking requests don't email. Covered by a unit test (`requests.test.ts`).
5. The client sees their own requests' status:
   - Received;
   - Being looked at;
   - Waiting on something;
   - Resolved (with the resolution).

   They never see another workspace's requests.
6. A client can raise up to 10 requests per hour per workspace. After that the form replies: "We have them; someone will be in touch."

**Owner check after deploy:** raise one blocking request from the test-dry-run client account and confirm the email arrives in the ops inbox.

## 3. Response targets (proposal; owner decides)

Working days only. "Respond" means a human reply on the request, not a fix.

| Type | Proposed first response | Proposed aim to resolve or give a plan |
|---|---|---|
| Blocking (ticked) | Same working day if raised before 3pm UK time; otherwise by 10am the next working day | Next working day |
| Non-blocking | Within 2 working days | Within 5 working days, or a date |
| Anything touching publishing on the client's own account | Treated as blocking | — |

- **Proposed support hours:** Monday to Friday, 9am to 6pm UK time, excluding UK bank holidays.
- **Rule until the owner approves:** the client guides keep the `{{support_response_time}}` placeholder, and no response time is stated to a client.

## 4. When something breaks: fallback by failure

The current state of each route comes from `E20_INTEGRATION_REGISTER_2026-11-03.md`.

| Failure | How we notice | Fallback that keeps the client's week on track | Tell the client? |
|---|---|---|---|
| **Editing:** the editor (person or tool) is unavailable, late or below standard | Delivery board: item overdue or failing QA | Owner edits that week's pieces on the standard route chosen in C02. If capacity is short, ship fewer pieces at full quality rather than more at lower quality, and say so in the weekly report. Backup editor: **none yet** (C11 decides). | Yes, if a promised piece slips |
| **Upload or processing:** an upload fails, or there is no transcript | The upload error, or no transcript on the item | Client re-uploads, or sends a shared link (Drive, Dropbox or WeTransfer), and the file is attached in the Library. Transcription is **not connected** (B08), so today the transcript is always written by hand. Malware scanning is **off** (DR-11), so accept only the client's own known files. | Only if it delays them |
| **Publishing** | The live URL is not recorded by the scheduled day | Publishing is **manual for every platform** at launch. The client, or Threadline with delegated access, posts the approved package from the client's own account, then records the live URL on the item. If a scheduler is chosen later (E15) and fails, go back to manual. Never ask for a client password. | Yes, the same day |
| **Background job failed** (emails, reports, CRM sync) | Admin → Queue lists jobs; Admin → System shows failed or `dead` ones. Jobs retry with exponential backoff and are marked dead when attempts run out. | Fix the cause, then **Requeue** the job (or **Retry** a CRM outbox row) on Admin → System. Weekly report not emailed: send the report link by email by hand. | If a report was late |
| **Transactional email not arriving** (invitation, password reset) | The client says so | Copy the invitation or reset link from the admin screen and send it from ilyas@threadlinehq.com. Check Resend for a bounce. | — |
| **App down or a bad deploy** | `/api/health` is not ok; clients report errors | Roll back to the previous deployment in Vercel (one click; production stays on the last good build when a build fails). Error alerts (Sentry) are **not set up**, so check the Vercel logs (DR-14). | If down for over 1 hour in working hours |
| **Data loss or a mistaken delete** | Report from a client or staff | Neon point-in-time restore. The free tier has a short history, so this only covers recent mistakes. Recovery objectives are **undecided** (section 6, item 3). | Yes |
| **Cost or limits:** Vercel Hobby deploy cap, R2 £50 cap | Vercel or Cloudflare alerts | Batch deploys. Move Vercel to Pro before the first paying client (E20). | — |

## 5. Offboarding and export: accuracy check

Checked against `src/lib/commercial/offboarding.ts`, `src/lib/actions/offboarding.ts`, `src/lib/exports` and the admin offboarding panel on 4 Nov 2026.

| Client guide says (`OFFBOARDING_AND_EXPORT.md`) | Code does | Verdict |
|---|---|---|
| Export at Settings → Workspace → Your data → Prepare an export, admins only | Card "Your data" on the Settings page; needs `workspace.settings`, a client admin capability | Correct |
| "A JSON copy of **everything** recorded" | Covers workspace, members, Brand Brain, ideas, scripts and their versions, content, packages, publishes, inquiries, commercial events, **final** reports and reviews, invoices with lines and payments, approvals, **shared** comments, lead messages, time entries and a file list. It does not include internal staff notes, draft reports, intelligence and signals, tasks, tracked links or proof permissions. | **Overclaim:** the guide is corrected to list what's included |
| Files are listed, not included; download them from the Library | `files` lists assets; the export note says the same | Correct |
| Download link lasts seven days | `KEEP_MS` is 7 days; the file is deleted after that and the record kept | Correct |
| Offboarding ends the engagement, disconnects platforms and deletes stored access, cancels queued work, and prepares the export | All four steps, each logged in an OffboardingRecord | Correct |
| Download link on "This week" until access ends; members suspended when access ends | Home shows the export while offboarding; a daily job (`closeExpiredAccess`) suspends client admins, members and editors once `accessEndsAt` passes | Correct |
| Default 30-day export window, then data kept 90 days | The form defaults to `exportDays` 30 (range 7–90) and `retentionDays` 90 | Correct; the period is still an owner decision |
| Super admin deletes after retention; a legal hold prevents deletion; the record is kept | Deletion is never on a timer and needs typed confirmation plus `workspace.delete`; a legal hold blocks it; the OffboardingRecord outlives the tenant | Correct |
| Proof permissions can be withdrawn in Settings | The proof permissions card is on client Settings | Correct |

**Not yet exercised end to end in production:** a full offboarding of a real (synthetic) workspace. Doing it is irreversible for that workspace, so it needs the owner's go. The candidate is the synthetic test-b16 workspace, which would also tidy it up.

## 6. Owner decisions (C09 stays partial until these are made)

1. **Support hours and response targets:** approve or change section 3. Then the placeholders in `REPORTING_SUPPORT_ESCALATION.md` are filled.
2. **Escalation contact:** proposed ilyas@threadlinehq.com.
3. **Recovery objectives** (`operations/RPO_RTO_RETENTION_OPTIONS.md`): option A (lean, free) or option B (recommended for first clients: PITR history of at least 7 days and storage versioning; low cost).
4. **Retention after offboarding:** option 2 (the current default of 30 + 90 days) or another option. It must match the privacy notice and the DPA.
5. **Backup person:** none, or a named person for absences. If none, the advance-notice rule in section 1 applies.
6. **Go or no-go to run one full offboarding on test-b16** as the end-to-end proof.
