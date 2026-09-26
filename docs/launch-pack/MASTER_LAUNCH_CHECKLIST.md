# Master launch checklist (26 September 2026)

**Status words:**

| Status | Meaning |
| --- | --- |
| Implemented | The code exists |
| Tested (simulated) | Checked against a local database and mock providers |
| Configured | Production settings are present |
| Verified live | Checked on the running deployment |
| Drafted, awaiting owner review | Produced; the owner has not reviewed it |
| Owner-approved | Signed off by the owner |
| Externally blocked | Waiting on an owner input or an outside service |

Launch-ready means the business items are owner-approved, production is verified live, and the owner dry run is done. Passing tests alone does not make it launch-ready.

**Related files:** decisions are in `OWNER_DECISIONS.md` (D-01…D-09), what to review is in `REVIEW_INDEX.md`, and canonical sources are in `SOURCE_REGISTER.md`.

## Business

| Item | Status |
| --- | --- |
| Founding offer (£2,500 + £2,500 every four weeks × 3) | Implemented; offer approval pending (D-01) |
| Public site and proof band | **Owner-approved, frozen**. The three content files were restored to the approved baseline after an unapproved edit in commit 5b9fd64 |
| Canonical domain threadlinehq.com, and its redirect | Mail configured and verified live (MX, DMARC). Website not connected: externally blocked (D-02) |
| Legal identity pack | Externally blocked (D-09) |
| Recovery objectives and retention | Decision pending (D-03) |
| Support owner and response times | Decision pending (D-07) |
| Founder identity for commercial activity | Employer clearance pending (D-05) |

## Assets

| Item | Status |
| --- | --- |
| Brand kit, including social headers | Drafted, awaiting owner review |
| Onboarding pack (13 files, including pre-kickoff, kickoff agenda, first-period roadmap, results guide) | Drafted, awaiting owner review |
| Sales: call guide, one-pager, research interview script, close-to-kickoff card | Drafted, awaiting owner review |
| Verbatim library A–M | Owner-approved in its source (SOP 03). Needs import and approval in `/admin/scripts` once the database exists |
| Outreach sequences and the client email lifecycle | Drafted, awaiting owner review. **Not send-ready**: the booking link, the 15-vs-20-minute wording and identity (D-02, D-05) are open |
| 14 newsletter graphics and a sample newsletter layout | Drafted, awaiting owner review |
| Brand-led content launch pack (Drive) | Drafted, awaiting owner review (unchanged) |
| A-tier micro-assets (Drive) | Drafted; not sent |

## Acquisition

| Item | Status |
| --- | --- |
| Research booking: Calendly "Founder Research — 20 mins" | Configured (recorded live in Drive); not verifiable from here |
| Commercial diagnosis booking event | Externally blocked (D-02) |
| Funnel tracking: targeted, touches, demand source | Implemented; tested (simulated) |
| Early commercial test with recorded uncertainty | Implemented; tested (simulated); owner review (D-06) |

## Delivery and operations

| Item | Status |
| --- | --- |
| Owner dry run (14 steps, with a real deliverable) | **Pending: the owner performs it** |
| Production database, secrets, email, storage, cron, monitoring, backups | Implemented and tested (simulated). Externally blocked (owner checklist §0–§5) |
| threadlinex isolation | Verified live: inert (no database, cron refused). Retire it or mark it as a mirror (D-04) |
| Unit and QA tests | Unit 824/824; QA run-all 623 passed + 2 external gate; marketing-v9 62/62 (26 Sept) |
