# Final backend implementation audit

Date: 26 September 2026. Branch `backend/completion` (see `git log main..backend/completion`). This is a checkpoint audit of a large brief: it states what is done and tested, what is partial, and what is missing, without rounding up. The per-requirement record is `docs/implementation/BACKEND_COMPLETION_LEDGER.md`.

## 1. Verdict (updated 27 September 2026)

- **Code against the requirement ledger: COMPLETE.**
  - 101 requirements are implemented and tested, and 5 were verified as already correct.
  - 7 are implemented but need external configuration or platform approval to run live: FILE-02, FILE-03, FILE-05, NOT-02, INT-02, INT-03, INT-06.
  - 2 await an owner decision: INF-09 and PRV-01.
  - None is partial or missing, and none is blocked by unfinished code.
  - None is LIVE_VERIFIED: no production service is configured yet.
  - The brief in the repository ends at section 19. A version with a section 18A has not been received; its requirements are not in this ledger.
- **First-client production readiness: NO.** Production has no database, keys, email, storage or scheduler configured. The blockers are listed by kind in the ledger's "Remaining requirements by blocker" and set out step by step in OWNER_ACTIVATION_CHECKLIST.md: section 0 (which project is production), then 1 to 9.

### Verification at this checkpoint

| Check | Result |
| --- | --- |
| Unit and database tests (`npm test`, local PostgreSQL 18) | 808 passed, 0 failed |
| QA run-all (all suites, including acceptance journeys 1 to 10) | 616 passed, 2 passed with an external gate, 0 partial, 0 failed |
| Acceptance journeys 3, 4, 5, 6, 7, 9, 10 (`suite-journeys-more`) | 87 passed |
| Public regression (`marketing-v9`) and public-file freeze | see the checkpoint log; 104 protected files unchanged |
| Backup and restore drill | passed: 113 tables, 2,928 rows |
| Types and lint (`tsc`, `eslint src`) | clean |

## 2. Before and after

| Area | Before (25 September) | After |
| --- | --- | --- |
| Database | SQLite; production could not persist anything | PostgreSQL with 11 forward-only migrations; reconciled transfer from SQLite; restore drill |
| Staff access | a staff role in any workspace granted access to all | staff roles count only in the internal organisation; staff two-factor; password-only sessions cannot reach data |
| Files | any declared type accepted, SVG served inline (stored XSS) | content sniffing, SVG/HTML refused, only media inline, sandboxed responses |
| Webhooks | unverified events stored under the provider's id (a forged event could block the real one); invented signature scheme for three providers | each provider's documented verification, replay windows, per-workspace dedupe in one transaction |
| Client IPs | first X-Forwarded-For entry (spoofable) | proxy-set headers only; per-account login throttle |
| Team | admin typed new members' passwords; invite created accounts up front; last admin could be demoted | invitations as pending records; acceptance never sets an existing account's password; profiles; suspension; owner and transfer; work returned on removal |
| Commercial | fees on the workspace; client creation not transactional | offers, engagements with frozen terms, DST-safe 28-day periods, scope changes, transactional provisioning, idempotent conversion, Attio outbox |
| Approvals | a timestamp on the record | approvals bound to a SHA-256 of the exact version; edits supersede; release refused otherwise; bulk approval pinned to versions |
| Reports | client admins could finalise; clients could see drafts | staff-only finalisation; immutable versions with corrections; four-week reviews; delivery emails |
| Billing, renewal, proof, exit | none | invoices, payments, credits, refunds, disputes, Stripe test mode, reminders by approval, renewals, proof placements, offboarding with evidence |
| Operations | console logs; no health check; worker loaded QA shims | env validation, health route, redacted JSON logs, Sentry-format reporting, cron runner, system screen |

## 3. Findings fixed during this work (beyond the planned items)

1. Client report pages showed drafts: the visibility rule existed but was never applied.
2. A designated approver without edit rights could not approve or send back work, nor approve packaging (found by the acceptance journeys).
3. The seed deleted every organisation and user with no guard and a default password.
4. The CRM mirror would crash, not park, when two local records matched one CRM record.
5. Report learnings ignored the learning loop (approved diagnoses and corrections).
6. Decimal idea scores were accepted into an integer column.
7. The job queue threw if a job vanished while running.
8. File downloads counted suspended memberships as access.
9. Nested content storage keys were refused by the S3 adapter, so content files could not be read back on S3.
10. Instagram treated a processed Reel container as published; it still needs `media_publish`, so Reels would never have gone live.
11. A refused token refresh was written inside a rolled-back transaction, so the reconnect prompt was lost.
12. The first Brand Brain version trigger would have refused every Brand Brain edit (text-array append); corrected in a forward migration before it left the machine.
13. LinkedIn could never publish: no member id was captured at connection (found by the new acceptance journeys).
14. Contractor search returned unassigned pieces and pipeline leads (journeys).
15. A publish claim left by a crashed worker stayed claimed forever (journeys).
16. The long-form entitlement check existed but was never called (journeys).
17. An expectation recorded after publication replaced the frozen forecast in diagnosis (journeys).
18. The restore drill failed on the Brand Brain trigger (journeys).
19. Email sends had no idempotency key, so a retried send after a timeout could deliver twice.

## 4. Permissions matrix (who may do what)

| Action | super_admin | internal_operator | client_admin | client_member (+profile) | editor |
| --- | --- | --- | --- | --- | --- |
| See a client workspace | all | all | own | own | own |
| Invite and manage members | yes | yes | yes (client roles only) | no | no |
| Grant staff roles | internal org only | no | never | never | never |
| Approve scripts, pieces, packaging | yes | yes | yes | approver profile | no |
| Edit production | yes | yes | yes | no | yes |
| Draft and finalise reports and reviews | yes | yes | no | no | no |
| See billing | yes | yes | yes | commercial profile | no |
| Issue invoices, record payments | yes | yes | no | no | no |
| Grant proof permissions | yes | no | yes | no | no |
| Offboard | yes | yes | no | no | no |
| Delete a tenant after retention | yes | no | no | no | no |

A viewer profile removes every create, edit, upload and complete power. A suspended membership grants nothing.

## 5. Source of truth

| Fact | Authority |
| --- | --- |
| Who someone is, their sessions | `User`, `Session` (hashed tokens) |
| Access to a workspace | `Membership` (role, profiles, status); staff via the internal organisation |
| What the client bought | `Engagement.offerSnapshot` and fees; changes only via approved `ScopeChange` |
| The calendar | `ServicePeriod` rows (calendar dates, workspace timezone) |
| Whether something may be released | `Approval` whose hash matches the current version |
| What the client was told | final `WeeklyReport` / `PeriodReview` versions |
| Money | `Invoice`, `Payment`, credit notes; Stripe only when it is the engagement's invoice authority |
| The CRM | Threadline's database, mirrored to Attio through `CrmOutbox`; never the reverse |
| Evidence of an exit | `OffboardingRecord` (survives tenant deletion) |

## 6. Verification evidence

| Check | Result |
| --- | --- |
| `npm test` on PostgreSQL 18 | 727 passed, 0 failed |
| `node scripts/qa/run.cjs run-all` | 526 passed, 0 failed, 1 partial (no server-side PDF export) |
| Acceptance journeys 1, 2 and 8 (`suite-journeys`) | 19 of 19 |
| Public site regression (`marketing-v9`) on a production build with the new headers | 62 of 62 |
| Backup and restore drill | passed: 97 tables, 1,916 rows reconciled |
| SQLite to PostgreSQL transfer | 77 tables, 1,276 rows reconciled |
| Types and lint | clean |

Acceptance journeys 3 to 7, 9 and 10 are covered in parts by the core-spine, tenancy, workflow, hostile-input and unit suites (see the ledger's VER row); journey 6's resumable large uploads and partial X threads, journey 7's effort measurement and journey 9's injection test set are not built.

## 7. Public freeze proof

`docs/implementation/evidence-public-freeze.txt` holds SHA-256 hashes of the 104 public-site files at the approved revision (6e00e4a). `sha256sum -c` reports all 104 unchanged, and `git diff 6e00e4a -- <public paths>` is empty. Shared changes that reach public pages (security headers, the application form's confirmation emails) were checked with the public regression suite on a production build: 62 of 62.

## 8. Remaining risks

1. **Nothing is live-verified.** Every external integration is contract-tested with mocks only.
2. **CSP allows inline scripts** (required by the Next.js App Router on static pages without nonces); other directives still block third-party scripts, framing and plugins.
3. **Daily cron only on the Hobby plan**: jobs also run right after the request that queued them, but a failed send waits until the next day's run.
4. **Contractors see the whole production board** (assignment scoping is modelled, not enforced).
5. **SSRF DNS rebinding window** remains between resolution and fetch.
6. **No malware scanning** of uploads (needs a provider).
7. **Public commercial claims** ("100m+ views", "10,000+ conversions") need the owner's substantiation.

## 9. Missing or partial requirements

Missing: CX-08 effort records, FILE-02 direct multipart uploads, FILE-05 media processing callbacks, AI-06 inbox/lead assist, and the unmet parts of the acceptance journeys. Partial: SEC-10, SEC-12, TEAM-08, TEAM-09, COM-07, ENG-03, ENG-04, CX-04 to CX-07, DEL-01, DEL-05, DEL-06, FILE-03, FILE-04, FILE-06, JOB-02, JOB-04, NOT-02, INT-02, INT-03, INT-07, INT-09, ATT-04, AI-01 to AI-05, AI-07, AI-09, LRN-02, LRN-03, OPS-01, REP-03, CAP-01. Unsupported: INT-06 (Facebook/Threads, needs a Meta app). Owner decisions: INF-09, PRV-01. The ledger gives the next action for each.
