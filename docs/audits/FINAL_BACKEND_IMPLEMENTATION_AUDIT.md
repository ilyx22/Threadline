# Final backend implementation audit

Date: 26 September 2026. Branch `backend/completion` (see `git log main..backend/completion`). This is a checkpoint audit of a large brief: it states what is done and tested, what is partial, and what is missing, without rounding up. The per-requirement record is `docs/implementation/BACKEND_COMPLETION_LEDGER.md`.

## 1. Verdict (updated 26 September 2026)

- **Code against the requirement ledger: COMPLETE.**
  - 101 requirements are implemented and tested, and 5 were verified as already correct.
  - 7 are implemented but need external configuration or platform approval to run live: FILE-02, FILE-03, FILE-05, NOT-02, INT-02, INT-03, INT-06.
  - 2 await an owner decision: INF-09 and PRV-01.
  - None is partial or missing, and none is blocked by unfinished code.
  - None is LIVE_VERIFIED: no production service is configured yet.
  - Section 18A (the business launch asset pack) was received and addressed on 26 September 2026. See ledger rows LP-01…LP-14 and `docs/launch-pack/README.md`.
  - Correction, 26 September 2026: commit 5b9fd64 had edited frozen public copy and re-recorded its hashes. This broke the owner's frontend freeze. The edit is reverted, the freeze is verified against baseline b344360, and claim concerns are now only reported.
    - Three more defects were found and fixed along the way:
      - the wedge page ignored conversation themes, so it always showed 0 converging;
      - "30-day strategy" clashed with the four-week periods;
      - several public claims were inaccurate: "month to month", numeric founder-time promises, and unattributed proof figures.
    - Unit tests: 824 passed, 0 failed.
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

## 6. Verification evidence (updated 26 September 2026 to match the ledger)

Earlier figures in this section (727 unit tests, 526 QA checks, "1 partial") were from the first checkpoint and are superseded. Current evidence, from `docs/launch-pack/MASTER_LAUNCH_CHECKLIST.md` and the ledger's checkpoint log:

| Check | Result |
| --- | --- |
| `npm test` on local PostgreSQL 18 | 824 passed, 0 failed (after the frontend-freeze correction; the §1 checkpoint table recorded 808 at the earlier checkpoint) |
| `node scripts/qa/run.cjs run-all` | 623 passed, 2 passed with an external gate, 0 partial, 0 failed (server-side PDF export now exists: REP-03) |
| Acceptance journeys 1, 2 and 8 (`suite-journeys`) | 19 of 19 |
| Acceptance journeys 3, 4, 5, 6, 7, 9 and 10 (`suite-journeys-more`) | 87 of 87, through real actions, route handlers and jobs, with providers mocked at their boundaries |
| Public site regression (`marketing-v9`) on a production build with the headers | 62 of 62; 104 protected public files match the approved baseline |
| Backup and restore drill (`npm run db:drill`) | passed: 113 tables, 2,928 rows reconciled |
| SQLite to PostgreSQL transfer (one-off, INF-02) | 77 tables, 1,276 rows reconciled |
| Types and lint (`tsc`, `eslint src`) | clean |
| Production smoke (`npm run smoke:prod`, 26 September) | 6 of 10: health 503, `database:false`, 5 configuration errors, cron 503 (`CRON_SECRET` not set). Configuration, not code; see OWNER_ACTIVATION_CHECKLIST sections 0 to 5 |

All ten acceptance journeys (VER-01..10) are now built and pass in simulation; journey 6's resumable large uploads and partial X threads, journey 7's effort measurement and journey 9's injection test set, listed here earlier as not built, are implemented (FILE-02, INT-03, CX-08, AI-09). None is LIVE_VERIFIED.

## 7. Public freeze proof

`docs/implementation/evidence-public-freeze.txt` holds SHA-256 hashes of the 104 public-site files at the approved revision (6e00e4a). `sha256sum -c` reports all 104 unchanged, and `git diff 6e00e4a -- <public paths>` is empty. Shared changes that reach public pages (security headers, the application form's confirmation emails) were checked with the public regression suite on a production build: 62 of 62.

## 8. Remaining risks (updated 26 September 2026 to match the ledger)

1. **Nothing is live-verified.** Every external integration is contract-tested with mocks only, and production has no database, keys, email, storage or scheduler configured (smoke 6 of 10).
2. **CSP allows inline scripts** (required by the Next.js App Router on static pages without nonces); other directives still block third-party scripts, framing and plugins.
3. **Daily cron only on the Hobby plan**: jobs also run right after the request that queued them, but a failed send, a due scheduled publish or a research schedule waits until the next day's run unless an external scheduler calls `/api/cron/jobs` more often (INT-03).
4. **No malware scanning until a processing worker is chosen.** The scan states and quarantine are built (FILE-03), but nothing scans until the owner picks a worker and sets `PROCESSING_SCAN=true` (FILE-05).
5. **Public commercial claims** ("100m+ views", "10,000+ conversions"): the owner has decided the proof band stays and the frontend is frozen (O-01 closed). The remaining action is to keep the source, timeframe and definition on file privately. Other frozen public-copy conflicts (month to month, twenty minutes a week, 10 to 14 days onboarding, content ownership) are reported in `docs/launch-pack/claims/CLAIMS_AUDIT.md` and not changed.
6. **Second deployment (`threadlinex`)** serves the same commit. It is inert today (no database, cron refused), but it must be retired or marked `DEPLOYMENT_ROLE=mirror` before any secret is added (D-04, INF-05).
7. **Verified provider limitations**: personal DMs on LinkedIn, Instagram and X stay manual entry (AI-06); TikTok posts stay private until the app is audited; LinkedIn member-post impressions need the Marketing Developer Platform.

Resolved since the first checkpoint (listed here earlier as open):
- Contractors seeing the whole production board: fixed by assignment-scoped access (TEAM-09, `team/scope.test.ts`, journey 4).
- SSRF DNS rebinding window: fixed by connecting to the checked address (SEC-10, `fetch-url.test.ts`).

## 9. Missing or partial requirements (updated 26 September 2026 to match the ledger)

**Missing: none. Partial: none.** No ledger row is blocked by unfinished code. The earlier list here (CX-08, FILE-02, FILE-05 and AI-06 missing; SEC-10, SEC-12, TEAM-08, TEAM-09, COM-07, ENG-03, ENG-04, CX-04 to CX-07, DEL-01, DEL-05, DEL-06, FILE-03, FILE-04, FILE-06, JOB-02, JOB-04, NOT-02, INT-02, INT-03, INT-07, INT-09, ATT-04, AI-01 to AI-05, AI-07, AI-09, LRN-02, LRN-03, OPS-01, REP-03 and CAP-01 partial; INT-06 unsupported) is superseded: each of those rows is now IMPLEMENTED_TESTED or EXTERNAL_CONFIGURATION_REQUIRED with code done.

| Ledger status | Rows | What unblocks them |
| --- | --- | --- |
| EXTERNAL_CONFIGURATION_REQUIRED (code done) | FILE-02, FILE-03, FILE-05, NOT-02, INT-02, INT-03, INT-06 (Facebook Page and Threads, corrected from PROVIDER_UNSUPPORTED) | R2 bucket and CORS; a processing worker; the Resend webhook secret; platform app reviews (one Meta business verification covers Instagram, Facebook and Threads) |
| OWNER_DECISION_REQUIRED | INF-09 (RPO/RTO), PRV-01 (retention, DPA, privacy contact) | Decision D-03 and the legal identity pack (D-09) |
| IMPLEMENTED_TESTED, needs configuration to run live | INF-01, INF-05, INF-07, INF-08, JOB-01, COM-04, BIL-02, AI-04 (live model) | OWNER_ACTIVATION_CHECKLIST sections 0 to 8 |
| IMPLEMENTED_TESTED, live use waits on an owner decision | ATT-02 (tracked-link consent basis), BIL-03/BIL-04 (legal terms, reminder policy), OFF-01 (retention periods), CAP-01 (availability per person), ENG-02 (offer defaults, D-01) | OWNER_ACTIVATION_CHECKLIST section 9 |

The ledger's "Remaining requirements by blocker" is the authority; this section mirrors it.
