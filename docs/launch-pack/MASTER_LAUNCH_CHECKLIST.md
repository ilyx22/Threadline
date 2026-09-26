# Master launch checklist (27 September 2026)

Launch-ready means every row is ✓ in the **owner-approved** sense. Passing tests alone does not make it launch-ready.

| Status | Meaning |
| --- | --- |
| ✓ | done and verified |
| ◐ | produced, awaiting owner review |
| ✗ | not done |
| ⛔ | blocked by an external gate |

## 1. Business

| # | Item | Status | Owner action → verification |
| --- | --- | --- | --- |
| B-1 | Offer confirmed: £2,500 implementation + £2,500 every four weeks, 12 weeks / 3 periods, £10,000 | ◐ (in code and SOP 04; defaults unconfirmed) | O-02: confirm, or change per client → a test engagement shows the terms |
| B-2 | Proof claims substantiated or removed | ◐ | O-01: source, timeframe and definition for "100m+ / 10,000+", or delete the home band |
| B-3 | Legal: terms, privacy, DPA template, counsel review of ownership wording, postal address for commercial email | ✗ | O-14 |
| B-4 | Retention periods, RPO/RTO | ✗ | O-03: choose from operations/RPO_RTO_RETENTION_OPTIONS.md |
| B-5 | Support owner, response times, escalation contact | ✗ | O-06 |
| B-6 | Research-before-validation rule accepted (early tests with the uncertainty recorded) | ◐ | Review strategy §2 |

## 2. Assets

| # | Item | Status | Owner action |
| --- | --- | --- | --- |
| A-1 | Brand kit (logos, icons, guidelines, templates) | ◐ | O-08: approve, or mark changes |
| A-2 | Live favicon / OG image on the current mark | ✗ (frontend freeze) | O-07: approve replacement → then swap `src/app/icon.svg`, `opengraph-image.tsx` |
| A-3 | Onboarding pack | ◐ | O-16 |
| A-4 | Sales call guide, one-pager, verbatim library | ◐ (library founder-approved in source; adaptations pending) | O-09: approve adaptations; approve the library blocks in `/admin/scripts` after **Import canonical drafts** |
| A-5 | Outreach sequences, personalisation, examples | ◐ | O-09 |
| A-6 | Ten newsletter graphics | ◐ | O-16; O-10: confirm the PESTO expansion |
| A-7 | Brand-led content launch pack (Drive) | ◐ "drafted; owner review pending" | O-13: review; replace the `threadlinehq.com` CTA with the live domain |
| A-8 | Objection vault LinkedIn answer | ✗ stale | O-12 |

## 3. Acquisition

| # | Item | Status | Owner action → verification |
| --- | --- | --- | --- |
| Q-1 | Booking events: 15-minute research, 45-minute diagnosis | ✗ | O-05: create the events; set `NEXT_PUBLIC_BOOKING_URL` (primary only) → the apply page links to it |
| Q-2 | Branded inbox with SPF/DKIM/DMARC | ✓ as reported earlier (not re-verified; not reset) | — |
| Q-3 | Real LinkedIn profile truthful; no automation; no duplicate identities | owner | O-18 |
| Q-4 | First A-tier micro-assets produced before any "want me to send it?" message | ✗ | Owner; never imply an asset exists before it does |
| Q-5 | Funnel tracking in use: targeted, touches, replies, booked, attended, proposals, wins, demand source | ✓ implemented and tested locally | Needs the production DB |
| Q-6 | Apify research fallback | off | O-11 |

## 4. Delivery

| # | Item | Status | Owner action |
| --- | --- | --- | --- |
| D-1 | Owner dry run (12 steps, stopwatch) | ✗ | Run operations/OWNER_DRY_RUN.md; record results |
| D-2 | Founder time target validated | ✗ (internal estimate only) | From the dry run and client #1 |
| D-3 | Processing worker, scanning | ⛔ | Owner checklist §4 |
| D-4 | Social platforms connected (each is a feature) | ⛔ | Owner checklist §7 |

## 5. Software and operations

| # | Item | Status | Owner action → verification |
| --- | --- | --- | --- |
| S-1 | Code complete against the ledger | ✓ | — |
| S-2 | Unit 824/824; QA run-all; marketing-v9; freeze hashes | ✓ this pass (see README → Verification) | — |
| S-3 | threadline = primary; threadlinex = mirror or disconnected | ✗ | Owner checklist §0 |
| S-4 | Production database and migrations | ⛔ | §1 → health `database:true` |
| S-5 | Secrets, email, storage, cron, monitoring, backups | ⛔ | §2–§5 → health `configErrors:0`; drill on a Neon branch |
| S-6 | Vercel quota (Hobby: 100 deployments a day) | decision | §0 |

## Owner decisions and review tasks (index)

- **O-01** Substantiate or remove the proof figures.
- **O-02** Offer defaults and payment terms.
- **O-03** Retention and RPO/RTO.
- **O-04** threadlinex as a mirror or retired.
- **O-05** Booking events.
- **O-06** Support ownership.
- **O-07** Favicon / OG image.
- **O-08** Brand kit.
- **O-09** Sales and outreach adaptations; approve the imported library blocks.
- **O-10** PESTO expansion.
- **O-11** Apify.
- **O-12** Objection vault update.
- **O-13** Content launch pack review and CTA domain.
- **O-14** Legal pack.
- **O-15** Founder time target from the dry run.
- **O-16** Onboarding pack and graphics.
- **O-17** "Inevitable by day ninety" wording.
- **O-18** Research outreach from the owner's own real profile (strategy K-11).
