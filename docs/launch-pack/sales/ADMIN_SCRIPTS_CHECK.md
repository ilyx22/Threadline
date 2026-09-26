# `/admin/scripts` against the approved verbatim library

**Checked:** 26 September 2026, by reading code and documents. No code was changed and no script row was created or approved. The live `SalesScript` table in production has not been inspected: production has no database configured yet.
**Status:** findings for the owner. Actions are marked **Owner** or **Maintainer**.

## What `/admin/scripts` imports today

`src/lib/sales/canonical-import.ts` ("Import draft documents verbatim") reads exactly two repo files. Every block lands as `draft` and is usable on a call only after a person approves it (`approveScript`, `src/lib/sales/scripts.ts`).

| Source file | Parser | Blocks produced |
|---|---|---|
| `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Sales_Discovery_and_Content_Diagnosis.md` | `blocksFromDiscoveryDoc`: one block per `## ` section, text kept exactly | 10: `discovery.call_objective`, `discovery.current_machine`, `discovery.economics`, `discovery.content_diagnosis`, `discovery.consequence`, `discovery.desired_state`, `discovery.reframe`, `discovery.relevant_demo_only`, `discovery.service_explanation`, `discovery.scope_and_close` |
| `…/DRAFT_Answer_and_Objection_Vault.md` | `blocksFromObjectionDoc`: the "Approved answer" cell of each table row | 4: LinkedIn, guarantee leads, content manager, "just AI content" |

The import copies these files exactly, so **there is no drift between the import and its own sources.** The drift is between those sources and the approved library.

## Finding 1: the 8 September verbatim library (A–M) is not in `/admin/scripts` at all

- None of passages A–M is imported, and there is no parser or source file for them. Neither is the SOP 04 testimonial ask.
- The repo copy `Threadline Final Working Resources/02 SOPs/SOP_03_DIAGNOSIS_SALES_CALL_V14.md` is **stale**: it has no "VERBATIM SALES SCRIPT LIBRARY" section. The Drive copy (`11q7dbVBUAs0noq7hoNV2jEyHU6C9eElX`) has it. So re-running the import can never bring the library in.
- **Consequence:** the operator surface offers none of the founder-approved sales wording. The SOP Router's 8 September rule ("Do not silently paraphrase founder-approved script language in downstream operator surfaces") is not broken, because nothing is paraphrased. But the approved wording is simply missing.

**Owner action, available today without code:**
1. Open `/admin/scripts` and use the new script version form (`createScriptVersionAction`) once for each passage.
2. For each, paste the text from `APPROVED_VERBATIM_LIBRARY.md`, choosing the stage and key suggested below.
3. Approve each block.
4. Verify: `/admin/scripts` no longer shows "CANONICAL COPY IMPORT REQUIRED", and each block's checksum matches a fresh paste.

| Passage | Suggested key | Stage |
|---|---|---|
| A (both quotes) | `proof.privacy_case_study_honesty` | objection |
| B | `close.future_success_interview_ask` | close |
| C | `diagnosis.difficulty_honesty_frame` | diagnosis |
| D main / alternative / contextualised | `offer.deal_value_frame`, `offer.deal_value_alternative`, `offer.deal_value_contextualised` | offer |
| E | `offer.downside_asset_frame` | offer |
| F (4 quotes) | `offer.market_memory`, `offer.market_memory_system`, `offer.market_memory_headline`, `offer.market_memory_support` | offer |
| G (3 quotes) | `objection.one_month`, `objection.twelve_week_preferred`, `objection.twelve_week_learning_cycle` | objection |
| H | `diagnosis.early_performance_frame` | diagnosis |
| I (2 quotes) | `offer.content_diagnosis_explanation`, `offer.score_explanation_example` | offer |
| J, K, L, M | operating rules, not spoken scripts. Keep them in the SOP; do not load them as call scripts. | — |

**Maintainer action (optional, needs owner approval):**
1. Replace the repo SOP 03 copy with the current Drive version.
2. Add a third parser to `canonical-import.ts` for the "=== 8 SEPTEMBER 2026 — VERBATIM…" section: one block per quoted paragraph, text kept exactly.
3. Add a test that the checksum of each imported block matches `APPROVED_VERBATIM_LIBRARY.md`.

## Finding 2: character-level variants between the Drive copies

The library in this pack follows **SOP 03**, which the Router says was copied verbatim from the Execution Manual. The First US Playbook V1 holds two copies of several passages, and they differ from each other in apostrophe style only:

| Passage | SOP 03 and Playbook addendum | Playbook "ECONOMIC-FIT" / "12-WEEK MINIMUM" section |
|---|---|---|
| G first quote | `you'd mostly be paying` (straight `'`) | `you’d mostly be paying` (curly `’`) |
| D contextualised | `That's why` / `We don't need` (straight) | `That’s why` (curly) |

No word differs. **Owner:** confirm that SOP 03 is the reference text. If you want uniform curly apostrophes, change the Drive source first, then re-copy it. Do not normalise the text here.

## Finding 3: the imported drafts contain wording that is now stale or inaccurate

| Block | Text | Problem | Action |
|---|---|---|---|
| `objection.do_you_connect_to_linkedin` | "Threadline currently runs LinkedIn publishing manually and records the live URL; the adapter exists but we do not display a fake connected state without approved platform access." | Partly stale. A LinkedIn connection and publishing path is now implemented, but it needs LinkedIn's approved access and configured keys. The ledger lists INT-02/03/06 as EXTERNAL_CONFIGURATION_REQUIRED. The honesty principle still holds. | **Owner:** do not approve as it stands. Approve the adaptation in `SALES_CALL_GUIDE.md` §10 once platform access is known, or edit the Vault. |
| `discovery.economics` | "Monthly new-client capacity." | This is the prospect's own capacity, not Threadline billing, so it is acceptable. It is noted because the four-week doctrine is strict. | Optional: "New-client capacity per period." |
| `discovery.scope_and_close` | "…risk reversal, commercial terms…" | Consistent with the Blueprint (risk reversal only on controllable outputs). | Approve as is. |
| `objection.can_you_guarantee_leads` | "We guarantee controllable implementation/output milestones…" | Consistent with the Blueprint and the One Page Offer's risk-reversal rule. | Approve as is. |

## Finding 4: sales documents that are not imported but conflict with current doctrine

These are not in `/admin/scripts`, but operators may open them next to it:

| File | Conflicting text | Current doctrine |
|---|---|---|
| `DRAFT_One_Page_Offer.md` | "GBP 2,500/month", "3-month initial engagement", "12-16 core short-form assets/month", "Weekly optimisation + monthly strategy/reporting" | £2,500 **every four weeks**; a 12-week initial engagement of 3 service periods; about 12–16 core assets **per four-week period** (a working hypothesis, not a hard package); four-week reviews. The Router says "never label recurring as monthly." |
| `DRAFT_Proposal_SOW_Commercial_Checklist.md` | "Monthly fee", "Monthly core asset range" | "Fee per four-week period", "Core asset range per period" |
| `DRAFT_Qualification_Scorecard.md` | "GBP 2.5k-5k monthly fee" | "£2,500 every four weeks" (the founding hypothesis) |

**Owner:** mark these three as historical, or allow them to be revised to four-week wording. They are working drafts, not approved sales passages, so revising them does not touch approved wording. The revision is not made here because this task writes only inside `docs/launch-pack/`.

## Verification a reviewer can repeat

- `grep -c "VERBATIM" "Threadline Final Working Resources/02 SOPs/SOP_03_DIAGNOSIS_SALES_CALL_V14.md"` gives `0`. The Drive copy contains the section.
- `src/lib/sales/canonical-import.ts` names only `DOC_DISCOVERY` and `DOC_OBJECTIONS`.
- `/admin/scripts` shows "CANONICAL COPY IMPORT REQUIRED" until a block is approved (`src/app/admin/scripts/page.tsx:25`).
