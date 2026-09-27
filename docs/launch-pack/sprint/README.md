# Sprint pack, 26–27 September 2026: start here

Everything below is **drafted, awaiting owner review**, except where marked. Nothing was sent, bought, applied for or published.

**Authority order used** (confirmed in your Drive; see `authority/AUTHORITY_ADDENDUM.md`):
1. Law and platform terms (please confirm this ranks first).
2. EasyGrow and Acquisition Nirvana (Charlie Morgan's Imperium acquisition programmes).
3. Imperium Academy.
4. Daniel Fazio (tactical).
5. PESTO after Marcos Ruiz (Birdhouse).

## Your morning, in order (about 1 working day)

1. **Decisions (30 min).** `ops/THREADLINE_MASTER_TODO_2026-09-27_PROPOSED.md` has the morning checklist at the top. `stack/STACK_SETUP_CHECKLIST.md` Phase 0 covers the warm-up choice, the sending domains, Vercel Pro and the legal details.
   - **Warm-up:** Smartlead's built-in warm-up **or** Lemwarm, **not both** on the same mailboxes.
2. **Employer clearance request (D-05).** Send it today.
3. **Production activation (2–3 h).** Follow `ACTIVATION_RUNBOOK.md` step by step.
   - Create your staff account with `npm run owner:create`.
   - Verify with `npm run smoke:prod`. It passes 6 of 10 today, and the target is 10 of 10.
4. **Domain and booking (45 min).**
   - Connect threadlinehq.com.
   - Settle 15 vs 20 minutes for research calls.
   - Create the "Diagnosis call" event, using `sales-extra/BOOKING_QUESTIONS_AND_REMINDERS.md`.
5. **Accounts (1–1.5 h).** Use `social/PROFILES.md` and `social/ASSET_REGISTER_TEMPLATE.csv`. The LinkedIn page waits on employer clearance.
6. **Outreach setup (1–2 h).**
   - Sending tool, list pull using `emails/BULK_LIST_FILTER_SPEC.md`, verification.
   - The recommended first segment is **strategy/GTM**.
   - Load the sequences from `emails/CAMPAIGN_PACK.md`, but do not send yet.
7. **Review and approve (2–3 h across the sprint).** The order is in `../REVIEW_INDEX.md`, plus this folder's drafts: contracts, emails, A-tier assets and content register.
8. **Log the day** in the sprint tracker sheet, then tell me: `DAY 1 — done/not done | numbers`.

## What was produced tonight

| Folder | Contents |
| --- | --- |
| `ACTIVATION_RUNBOOK.md` | Click-by-click production setup, plus the scripts `npm run owner:create` and `npm run smoke:prod` (tested) |
| `prospects/` | 68 researched firms across 4 segments, 23 A-tier and 36 B-tier, each with a real observation, a source link and a fit score. The original 15 were re-checked |
| `a-tier-assets/` | 23 one-page "3 authority opportunities" value assets, each claim sourced |
| `emails/` | EasyGrow-structured campaign pack (4 emails at +2/+4/+7 business days, Loom variant, reply within 6 hours), test plan, reply playbook, bulk-list filter spec |
| `sales-extra/` | Booking questions and reminders, proposal template, installation-led first touch, case-study template, one-page minimum viable method |
| `contracts/` | Services agreement, order form/SOW, DPA summary, invoice template. All drafts for a solicitor |
| `social/` | Bios for 6 platforms, asset register, 14-day calendar |
| `content/` | All 66 pack posts pre-scored: 48 approve, 16 rewrite (drafts included), 2 reject. Profile test; proof bank and claims register |
| `stack/` | Full tool and API stack with checked prices, TikTok/Meta/YouTube/LinkedIn/X application guide, lead-gen system with the maths, setup checklist |
| `authority/` | The EasyGrow / Acquisition Nirvana addendum and the changes applied |
| `ops/` | Replacement master TODO (upload as a **new** file), defect register, agent register, Brand Brain gap map |
| `TODO_AUDIT.md` | All 215 open lines of your Drive TODO, each classified |

## Code changes tonight (tested)

- **Forms kept wrong values after a refused save.** Fixed across 66 forms.
- **An onboarding error page** for teammates without Brand Brain access is fixed.
- **"Monthly" wording** changed to four-week on client-visible pages.
- **Unapproved founder stories** were given to the AI as "cleared". Fixed, with a test.
- **The TikTok connector** now meets TikTok's Direct Post rules: it checks the creator's settings first, uses the person's own privacy choice, keeps interactions off by default and passes through the commercial-content disclosure. Tested.
- **LinkedIn API version** updated from a retired one. It is configurable via `LINKEDIN_API_VERSION`.
- **New fields:** the message version on each outreach touch, and problem energy and awareness on each research interview. Migration included.
- **"Getting set up"** added to the client sidebar.
- **Scripts:** a first-admin bootstrap and a production smoke test.
- **The approved public frontend is unchanged:** all 104 protected files verified.
