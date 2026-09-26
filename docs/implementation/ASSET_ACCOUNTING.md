# Asset accounting: brand kit, onboarding resources, call and email scripts, newsletter graphics

26 September 2026. This covers every place these assets could be:

- the repository, including untracked files;
- every branch's history;
- the Desktop folders beside it;
- the working resources folder (`Threadline Final Working Resources/`, 66 files, tracked in git).

Paths are relative to the repository root.

The brief version this was checked against is `docs/implementation/BACKEND_COMPLETION_BRIEF.md`, which ends at section 19. **It has no section 18A.** If 18A names these assets with specific requirements (formats, counts, placement), that version is needed to confirm them.

## Summary

| Asset | Completion | Blocker |
| --- | --- | --- |
| Brand kit | **Partial.** The design tokens, the logo as a component and the art direction exist. There is no packaged kit: no logo files, no usage guide, no social or email variants. | Owner decision and design work. Every draft document is headed "DRAFT - BRANDING PENDING". Not a code task. |
| Onboarding resources | **In-app flow implemented and tested. Documents in draft.** | Owner review of the drafts (branding and legal). |
| Call scripts | **Drafts exist. The versioned script library and its importer are implemented. Nothing is imported or approved yet.** | Owner approval of each block. The import is one click on `/admin/scripts` once production has a database. |
| Email scripts | **Transactional emails implemented (9 templates). Outreach email scripts do not exist.** | Owner content. The outreach playbook deliberately stops before messages are written. |
| Ten newsletter graphics | **Do not exist anywhere.** | Creative production against a brand kit that does not exist yet. Not code-addressable, and not fabricated here. |

## Brand kit

| Item | Path | State |
| --- | --- | --- |
| Logo (mark and wordmark, drawn in code) | `src/components/brand/logo.tsx` | Implemented; used in the app shell |
| Design tokens (colour, type, spacing) | `design-system/threadline-design-dna.json`, `src/styles/marketing-v9/index.css`, `src/styles/marketing-v5/tokens.css` | Implemented for the site and app |
| Art direction and public design system | `docs/design/ART_DIRECTION_2026-09-25.md`, `docs/design/THREADLINE_PUBLIC_DESIGN_SYSTEM.md`, `docs/design/V5_THREADLINE_VISUAL_SYSTEM.md` | Written |
| Illustration set | `public/marketing/` (objects, scenes, bench) | In use on the approved public site (frozen) |
| Logo files (SVG/PNG exports), clear-space and misuse rules, colour codes for print, social avatars and banners, email header | none | **Missing** |

## Onboarding resources

| Item | Path | State |
| --- | --- | --- |
| In-app onboarding (progressive, save and resume) | `src/app/onboarding/[org]/onboarding-flow.tsx`, `src/lib/domain/onboarding.ts`, `src/lib/actions/onboarding.ts` | Implemented; covered by `node scripts/qa/run.cjs suite-onboarding` |
| Brand Brain intake | `Threadline Final Working Resources/04 Delivery and Client/DRAFT_Onboarding_Brand_Brain_Intake.md` | Draft (branding pending) |
| Recording readiness install | `Threadline Final Working Resources/04 Delivery and Client/DRAFT_Recording_Readiness_Install_V2.md` | Draft |
| Day 7 win plan | `Threadline Final Working Resources/04 Delivery and Client/DRAFT_Day7_Win_Plan.md` | Draft |
| Close to kickoff; client install day 7 | `Threadline Final Working Resources/02 SOPs/SOP_04_CLOSE_TO_KICKOFF.md`, `SOP_05_CLIENT_INSTALL_DAY7.md` | SOPs written |
| Client and operator runbook | `docs/CLIENT_AND_OPERATOR_RUNBOOK.md` | Written |

## Call and email scripts

| Item | Path | State |
| --- | --- | --- |
| Discovery and content diagnosis call | `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Sales_Discovery_and_Content_Diagnosis.md` | Draft; nine stages |
| Answers and objections | `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Answer_and_Objection_Vault.md` | Draft; four answers |
| Qualification scorecard, one-page offer, proposal checklist | same folder: `DRAFT_Qualification_Scorecard.md`, `DRAFT_One_Page_Offer.md`, `DRAFT_Proposal_SOW_Commercial_Checklist.md` | Drafts |
| Script library (versioned, checksummed, exact wording, snapshotted per call) | `src/lib/sales/scripts.ts`, `src/lib/sales/canonical-import.ts`, `/admin/scripts` | Implemented. The importer brings the two call documents in verbatim as **drafts** that cannot be used until a person approves them. The documents now ship with the function on Vercel (`next.config.ts` file tracing). Rows today: 0, because nothing has been imported into a production database. |
| Transactional email | `src/lib/email/templates.ts`: invite, password reset, weekly report, application received, operator alert, period review, payment reminder, notification, digest | Implemented; sent only through the job queue; suppression after bounces or complaints |
| Outreach email scripts | none | **Missing.** The prospect playbook (`THREADLINE_FIRST_US_RESEARCH_PROSPECT_BATCH_AND_OUTREACH_PLAYBOOK_V1.docx`) stops "before the user must personally send messages", and advises against scaled cold email for now. |
| Lead replies | `src/lib/leads` (AI-06) | Implemented as drafts a person approves and sends themselves. Nothing is sent automatically. |

## Ten newsletter graphics

None exist: no image files, no source files, no briefs, and no mention in any commit on any branch. The working documents mention newsletters only as a future content idea. These are creative deliverables. Producing them needs, in order:

1. the brand kit above;
2. a brief (topics, sizes, platform: email header or social);
3. design time.

None of this is built here. Placeholders presented as the real graphics would be fabricated deliverables.
