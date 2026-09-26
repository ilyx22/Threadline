# Client and operator usability verification (27 September 2026)

Each requirement is checked against existing features. The "evidence" column names the code path and the automated check. Where only local verification exists, it says so: production has no database, so none of this is verified live.

| Requirement | Result | Evidence |
| --- | --- | --- |
| Invites and roles | ✓ Client admin invites teammates with a role (client admin, member, viewer) and profiles (approver, commercial, contributor). Invitation links show on screen until email is configured. | `src/lib/actions/team.ts`, `roles.ts`; QA journeys 2 and 3 |
| Ownership, approval, commercial and viewing permissions | ✓ Capabilities per role (`can(role, cap)`); the approver profile gates approval; commercial sees billing and leads; a viewer is read-only | `roles.ts`; the permission matrix suite |
| Contractor scope | ✓ Editors see only assigned pieces and those pieces' files, tasks, scripts and publish records | TEAM-09; QA contractor checks |
| Approvals routed to people who can act | ✓ `notify` targets `approvers` (client admins and approver profiles). Waiting approvals escalate to the backup approver and the owner, once per item per day. | `src/lib/notify/index.ts` |
| Owner of the next action | ✓ Tasks, scripts, wedges and prospects carry an owner and a due date. No active record may exist without a next action and a due date. | `assertActiveRecord`; Admin → Queue shows cause, owner and next action |
| Bulk approval tied to versions | ✓ Bulk approve skips any item whose version changed after the page loaded. An approval covers that exact version; a change returns it for approval. | `bulkApproveAction` (`src/lib/actions/review.ts`) |
| Notifications deduplicated and configurable | ✓ Deduplicated per person on a key. Email preference is off / immediate (with quiet hours and snooze) / daily digest. In-app always. | `notify/index.ts`; Account → notifications |
| Simple feedback | ✓ Comments on versions ("Earlier version" marked). Requesting changes needs a note. | Review flow |
| Support ownership and status | Partial. Help requests have a status and a blocking flag, visible to the client. There is **no named owner or response-time field**. | `src/lib/actions/support.ts`. Owner decision O-06: who owns support, and the stated response times |
| Queues show blocked, overdue, failed and uncertain work | ✓ Admin → Queue → "Everything, in order" (blocked, overdue, failed processing, uncertain posts). Admin → System lists uncertain posts, failed processing and suppressed addresses. | `src/lib/data/admin.ts` |
| Disconnect next actions | ✓ A revoked or expired connection shows "Reconnect the account"; nothing publishes or syncs meanwhile; the manual route stays available | `src/lib/domain/integration-capability.ts` |
| Offboarding revocation and retention | ✓ Offboarding revokes memberships and connections and schedules export then deletion. The retention **periods** are an owner decision (defaults 30-day export, then 90 days). | `src/lib/commercial/offboarding.ts`, `actions/offboarding.ts`; O-03 |
| Installation terminology | Fixed: "30-day strategy approved" → "First four-week period strategy approved" | `src/lib/domain/installation.ts` |
| Installation page discoverability | Gap: not in the client sidebar (reached from This week and Recording → Your setup). Not changed: navigation is outside this pass's scope and the frontend freeze. | Onboarding pack README gap 1 |
| Founder time | Changed: measured without a client-facing promise; staff see the internal target | Effort page |

Automated checks re-run for this pass are listed in `../README.md` → Verification.
