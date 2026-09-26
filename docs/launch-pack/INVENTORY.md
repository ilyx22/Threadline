# Launch asset inventory (27 September 2026)

This inventory covers the repository, the app and Google Drive. Every item carries one class:

- **REUSABLE**: correct as it stands.
- **NEEDS REVISION**: usable, but a named fix is needed.
- **MISSING**: did not exist before this pass.
- **AWAITING OWNER APPROVAL**: produced, but not yet approved.

The "after this pass" column says what was done. Nothing here is owner-approved unless it says so.

## Sources read, and precedence

**Google Drive.** Access was confirmed and the files were read on 27 September 2026 with the owner's account. All seven files are owned by the owner.

| Source | Drive id | What it governs | State |
| --- | --- | --- | --- |
| THREADLINE_MASTER_BLUEPRINT_FINAL_WORKING (Doc) | 1xf87hFmxd9ox6ocFj2PTr1brwLL7dRBzzXnmeIF3gU0 | Commercial and strategy doctrine: offer, proof rules, the founder-hours claim ban, the Apify/Bright Data position | REUSABLE (canonical) |
| THREADLINE_FINAL_SOP_ROUTER_AND_STATE_MAP (Doc) | 12-Y9gblI7HgdtWXhd0zPdDKP49hqVoZlMEGaRTempN4 | Routing, the 7 Sept overlay, the four-week wording, verbatim-script authority | REUSABLE (canonical) |
| SOP_03_DIAGNOSIS_SALES_CALL_V14.md | 11q7dbVBUAs0noq7hoNV2jEyHU6C9eElX | Call sequence plus the approved verbatim library A–M | REUSABLE (canonical); the repo copy was stale and has been updated |
| SOP_04_CLOSE_TO_KICKOFF.md | 1iwAKxQaxZ981bfgraKjwfrrWbacB03EQ | Close → kickoff gate, offer confirmation, success-interview ask | REUSABLE (canonical); the repo copy was stale and has been updated |
| THREADLINE_FIRST_US_RESEARCH_PROSPECT_BATCH_AND_OUTREACH_PLAYBOOK_V1 (Doc) | 1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s | Research outreach method, scripts, channels, validation target, discovery economics | REUSABLE (canonical); the scripts are used verbatim in `outreach/` |
| DRAFT_Onboarding_Brand_Brain_Intake.md | 1qLzuNWDQv5JD5a7H5v1R0g5i7xocEaAK | Intake topics | NEEDS REVISION (marked draft); the in-app onboarding and Brand Brain now carry the questions |
| THREADLINE_BRAND_LED_CONTENT_LAUNCH_PACK_V1.md | 1RVAWSpIeDADlyDzxaERmFp5S3NkEFfKd | Brand-led social drafts (30 X, 15 Threads, 10 LinkedIn, 10 scripts, a YouTube outline) | AWAITING OWNER APPROVAL ("drafted; owner review pending"); the CTA domain `threadlinehq.com` is not the live domain (see the claims audit) |

**Precedence used:**

1. The current brief governs scope.
2. Approved strategy (Blueprint, Router, SOPs) governs commercial content.
3. Code and live checks govern status.
4. `HANDOFF.md` and older drafts are context only.

Where they conflicted, the conflict is recorded in `strategy/STRATEGY_RECONCILIATION.md` §6.

**Repository documents read:**

- `docs/implementation/BACKEND_COMPLETION_LEDGER.md`
- `docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md`
- `docs/OWNER_ACTIVATION_CHECKLIST.md`
- `docs/TECHNICAL_HANDOFF.md`
- `docs/CLIENT_AND_OPERATOR_RUNBOOK.md`
- `docs/implementation/ASSET_ACCOUNTING.md`
- `HANDOFF.md`
- `Threadline Final Working Resources/**` (66 tracked files)

## A. Brand

| Item | Location before | Class before | After this pass |
| --- | --- | --- | --- |
| Logo mark (drawn in code) | `src/components/brand/logo.tsx` | REUSABLE | Unchanged. Reproduced exactly as vector masters |
| Vector logo masters (light, dark, mono) | none | MISSING | `brand-kit/logo/svg/` (23 files): outlined masters and live-text versions. AWAITING OWNER APPROVAL |
| Transparent PNGs 512/1024/2048 | none | MISSING | `brand-kit/logo/png/` (27 files). AWAITING OWNER APPROVAL |
| Avatar, app icon, favicon set, apple-touch | Live favicon `src/app/icon.svg` uses an older "T + cobalt wave" identity | NEEDS REVISION | New set in `brand-kit/icons/`. The live favicon and OG image are **not** replaced (frontend freeze): owner decision O-07 |
| Colour, type, spacing, clear space, minimum sizes | spread across `marketing-v9/index.css`, `marketing-v5/tokens.css`, the design DNA | NEEDS REVISION (scattered, partly stale) | `brand-kit/BRAND_GUIDELINES.md`, with values taken from code tokens. AWAITING OWNER APPROVAL |
| Illustration, photo and chart guidance | `docs/design/ART_DIRECTION_2026-09-25.md` | REUSABLE | Summarised in the guidelines |
| Voice, messaging and claims rules | Blueprint, Router, `docs/site/BRAND_SOURCE_OF_TRUTH.md` (stale typography) | NEEDS REVISION | Guidelines §voice plus `claims/CLAIMS_AUDIT.md` |
| Document, report-cover, presentation-cover and email-signature templates | none | MISSING | `brand-kit/templates/` with previews. AWAITING OWNER APPROVAL |
| Font licensing | not recorded | MISSING | Instrument Serif and Inter are SIL OFL 1.1 on Google Fonts. The font files are not redistributed; the owner confirms before sending them to vendors |
| Browsable index | none | MISSING | `brand-kit/INDEX.html` and `INDEX.md` |

## B. Client onboarding

| Item | Before | Class | After |
| --- | --- | --- | --- |
| In-app onboarding, Brand Brain, installation, approvals, reports, help, export | app routes | REUSABLE (implemented and tested locally) | Unchanged. The "30-day strategy" label was corrected to four-week wording |
| Welcome guide, team and roles, Brand Brain guide, recording guide, review and approval, reporting/support/escalation, FAQ, offboarding and export | none (the Drive intake draft only) | MISSING | `onboarding/` (9 files). AWAITING OWNER APPROVAL |
| Day-7 win plan, recording readiness | `Threadline Final Working Resources/04 Delivery and Client/` | REUSABLE as sources | Referenced, not duplicated |

## C. Sales

| Item | Before | Class | After |
| --- | --- | --- | --- |
| SOP 03 call sequence and verbatim library A–M | Drive (current); repo copy lacked the library | NEEDS REVISION (repo stale) | Repo copy updated with the library copied exactly. `/admin/scripts` import now also reads the library (as drafts to approve) |
| SOP 04 offer confirmation and success ask | Drive (current); repo copy lacked the section | NEEDS REVISION | Repo copy updated |
| Discovery doc, objection vault, qualification scorecard, one-page offer, proposal checklist | `03 Acquisition and Sales/DRAFT_*` | NEEDS REVISION ("monthly" terms) | Four-week wording applied in the offer, the checklist and the scorecard. The objection vault's LinkedIn answer is stale (O-12) |
| Call guide OPEN → DECISION, qualification, demo map, economics, objections, next steps | partly in the drafts | MISSING as one resource | `sales/SALES_CALL_GUIDE.md`, `sales/LIVE_CALL_ONE_PAGER.md/.html`. Adaptations are labelled. AWAITING OWNER APPROVAL |
| Verbatim library for operators | Drive only | MISSING in repo | `sales/APPROVED_VERBATIM_LIBRARY.md` (founder-approved in the source) |
| `/admin/scripts` check | not done | MISSING | `sales/ADMIN_SCRIPTS_CHECK.md` |

## D. Outreach

| Item | Before | Class | After |
| --- | --- | --- | --- |
| Research outreach method, two-step scripts, follow-ups, research-call questions | Drive playbook | REUSABLE | Used verbatim, marked as such |
| Cold email, LinkedIn/X, warm intro, sample send, reply handling, booking, reminders, no-show, post-call, close-out, opt-out | partly in the playbook | MISSING as sequences | `outreach/OUTREACH_SEQUENCES.md`. AWAITING OWNER APPROVAL |
| Personalisation fields, research instructions, worked examples | partly | MISSING | `outreach/PERSONALISATION_AND_RESEARCH.md`, `outreach/WORKED_EXAMPLES.md` (fictional firms) |
| Booking events (15/20/45 min) | none configured; `NEXT_PUBLIC_BOOKING_URL` empty | MISSING (external) | Recommended: a 15-minute research event and a 45-minute diagnosis event. Owner decision O-05 |

## E. Newsletter graphics

| Item | Before | Class | After |
| --- | --- | --- | --- |
| Ten newsletter graphics | none | MISSING | `newsletter-graphics/`: 10 editable SVGs, 20 PNG exports, contact sheet, alt text, suggested use. AWAITING OWNER APPROVAL. The PESTO expansion needs owner confirmation (O-10) |

## F. Social and content

| Item | Before | Class | After |
| --- | --- | --- | --- |
| Brand-led content launch pack (Drive) | Drive | AWAITING OWNER APPROVAL | Unchanged. Its CTA domain must become the live domain before any use |
| Social posts in the app | none published | n/a | "drafted; owner review pending" |

## G. Software (strategy reconciliation)

| Item | Before | After |
| --- | --- | --- |
| Research gate | 10 interviews / 6 converging blocked any commercial test | Commercial tests may start early with the uncertainty written down. "Validated" still needs the full sample |
| Founder time "promise" (60 min/week) | Shown to clients as a promise | Shown to staff only, as an internal planning target (estimate) |
| Public time claims ("twenty minutes", "10 to 14 days") and "month to month" | public copy | Corrected (inaccurate claims; frozen-site exception) |
| "100m+ views / 10,000+ conversions" | unattributed on the home page and the Playbook hero | Home: attributed to the founder's work before Threadline, pending substantiation. Playbook hero: removed |
| Funnel stages | first touch → … → offer → won | Adds targeted and touches (a touch log), proposals, and wins by demand source (content-sourced and content-assisted kept apart), plus an audience-to-call diagnostic with no benchmark |
| Research providers | internal, pasted, public URL | Adds an optional Apify adapter (off unless approved), used as the fallback for refused public URLs |
| Wedge convergence display | ignored themes (always 0) | Fixed |
