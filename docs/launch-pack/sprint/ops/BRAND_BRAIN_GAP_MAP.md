# Brand Brain gap map (27 September 2026)

**What this is.** The master TODO asks for four client Brand Brain templates: a Voice/Tone Guide, an Avatar/ICP Brief, a Creative Brief and a Proof Bank/Claims Register (P1 brand and content engine; transcript-derived controls). This file maps each one against the fields that exist in code today, and proposes the smallest change that closes each gap. **Nothing here is implemented.** It is a proposal for the owner to accept or reject (TODO_AUDIT rows TC2, TC3, C9).

**Code read (repo `main` @ a6c0ad5, plus uncommitted changes):**
- `prisma/schema.prisma`: `BrandBrain` (four JSON blocks, `version`, `confirmations`), `BrandBrainVersion`, `IcpProfile`, `Offer`, `ProofItem`, `ProofPermission`, `ProofPlacement`, `Membership.voiceNotes`, and `Idea` (`pesto`, `funnelRole`, `intendedJob`)
- `src/lib/domain/brand-brain.ts`: the zod schemas for the `company`, `founder`, `voice` and `contentRules` blocks, plus the completeness weights
- `src/app/app/[org]/intelligence/brand-brain-editor.tsx`: the fields the client and operator can actually edit
- `src/lib/ai/context.ts`: what the drafting prompts actually receive
- `src/lib/actions/workspace.ts` and `src/lib/actions/onboarding.ts`: how the fields get written

**Key.**

| Mark | Meaning |
| --- | --- |
| **Present** | A field exists, is editable in the UI, and reaches the AI context |
| **Partial** | Something close exists, but it is free text where structure is needed, or it is missing from the UI or the context |
| **Missing** | Nothing holds it |

---

## 1. Voice/Tone Guide

The TODO spec: *words/phrases used, words to avoid, register, story patterns, proof, hot takes, boundaries and examples of authentic writing.*

| Spec element | Where it lives in code | Status | Note |
| --- | --- | --- | --- |
| Words and phrases used | `voice.phrasesUsed` (list); `voice.vocabulary` (text) | **Present** | In the editor and in the context |
| Words to avoid | `voice.phrasesAvoided` (list) | **Present** | Prompt instruction only. Nothing checks a draft for them after generation |
| Register (formality, energy, person) | `voice.tone`, `voice.sentenceStructure`, `voice.humour` (all free text) | **Partial** | No structured register (for example formal / conversational / blunt, first person singular or plural). A text field works but can't be checked |
| Story patterns | `founder.stories` (list of stories) | **Partial** | This holds the stories themselves, not the *patterns* the founder tells them in (for example "mistake → lesson → rule") |
| Proof | `ProofItem` table (see §4) | **Partial** | See the Proof Bank row |
| Hot takes | `founder.opinions` ("Strong opinions"); `founder.beliefs` | **Present** | The label says "Strong opinions". A hot take and an opinion are the same field |
| Boundaries | `contentRules.bannedTopics`, `contentRules.complianceNotes`, `founder.approvedAnecdotes` | **Partial** | Banned topics exist. There is no field for personal no-go areas (family, employer, named clients) or for claims the founder won't make. Banned topics are a prompt instruction, not a post-generation check (see DEFECT_REGISTER DR-19) |
| Examples of authentic writing | `voice.soundsLikeMe`, `voice.notMe` (lists) | **Present** | Weighted double in completeness |
| Per-expert voice | `Membership.voiceNotes` (free text, TEAM-08) | **Partial** | One text field per expert. It is not structured like the workspace voice block |

**Smallest change (proposal).**
1. Add three optional list or text fields to `voiceProfileSchema`: `register` (a short text), `storyPatterns` (a list) and `boundaries` (a list of personal no-go areas and claims the founder won't make). They are JSON fields inside `BrandBrain.voice`, so **no migration is needed**. The versioning trigger already covers the block.
2. Add them to the Voice card in `brand-brain-editor.tsx`, and to the voice block in `context.ts`.
3. Fold `boundaries` into the existing banned-topics prompt block.
4. Tests: a schema default test, and a context-render test.

About 1.5 hours.

## 2. Avatar/ICP Brief

The TODO has no field list for this template. The spec used here is the interview capture list in the CRM section: *exact language, acquisition sources, economics, founder sales role, current content system, bottleneck, consequence, prior attempts, trust/status concerns, 90-day desired state, objections, falsifying evidence*, plus awareness state.

| Spec element | Where it lives in code | Status | Note |
| --- | --- | --- | --- |
| Name, description | `IcpProfile.name`, `description` | **Present** | — |
| Demographics | `IcpProfile.demographics` | **Partial** | In the schema, in the action (`workspace.ts` line 414) and in the context (`context.ts` line 214), but **there is no input in the editor**, so it can't be set from the UI (DEFECT_REGISTER DR-18) |
| Firmographics | `IcpProfile.firmographics` | **Present** | — |
| Pains, in their words | `IcpProfile.pains` (list; the hint says "Their words, not yours") | **Present** | — |
| Desired outcome / 90-day state | `IcpProfile.desires` | **Partial** | A list of outcomes, with no time horizon |
| Objections | `IcpProfile.objections` | **Present** | — |
| Buying triggers | `IcpProfile.triggers` | **Present** | — |
| Awareness / sophistication | `IcpProfile.sophistication` (low / moderate / high) | **Partial** | Sophistication is not awareness state (unaware → most aware) |
| Prior attempts / failed alternatives | — | **Missing** | `ValidationConversation.triedBefore` exists for Threadline's own research, not for a client's ICP |
| Trust and status concerns | — | **Missing** | — |
| Where they pay attention (channels, sources) | — | **Missing** | — |
| Buying roles (who signs, who influences) | — | **Missing** | — |
| Evidence behind the brief (which calls, which quotes) | — | **Missing** | Research items and mined quotes exist, but aren't linked to an ICP |

**Smallest change (proposal).**
1. Add the missing `demographics` textarea to the audience form. This is a UI-only fix of about 10 minutes.
2. Add four JSON-array columns to `IcpProfile`: `failedAlternatives`, `trustConcerns`, `attentionChannels` and `buyingRoles`. Add one enum-like string, `awareness` (unaware / problem_aware / solution_aware / product_aware / most_aware).
3. This is one additive migration with defaults `"[]"` and `null`, the same pattern as `pains`. Add the fields to the form, the action schema and `context.ts`.
4. Leave evidence linking for later.

About 2 hours with tests.

## 3. Creative Brief

The TODO asks for a creative brief *inside* Brand Brain. The ledger row ENG-04 ("versioned creative brief / per-person voice") was satisfied by versioning the Brand Brain as a whole, so **no brief object exists**. Today a brief's content is spread across four places.

| Brief element | Where it lives in code | Status | Note |
| --- | --- | --- | --- |
| Objective / commercial job | `Idea.intendedJob` (discovery / authority / conversion), `Idea.objective` | **Partial** | Set per idea, not per brief or per period |
| Audience | `IcpProfile` (primary flag) | **Present** | — |
| Key message / root thesis | `ContentRoot` (ROOT_ID lineage) | **Partial** | Roots exist per thesis. There is no brief pointing to the roots in play this period |
| Offer, mechanism, differentiators, CTA | `Offer.outcome`, `mechanism`, `differentiators`, `ctas`; `contentRules.preferredCtas` | **Present** | — |
| Pillars, topics, formats, platforms, cadence | `contentRules.pillars`, `topics`, `formats`, `platforms`, `cadencePerWeek` | **Present** | — |
| PESTO mix and funnel role | `Idea.pesto`, `Idea.funnelRole` (AI-04); the measured mix in `content/mix.ts` | **Partial** | Measured, not planned. By design there's no target mix ("without quotas") |
| Proof to use | `ProofItem` | **Partial** | See §4 |
| Mandatories and don'ts | `contentRules.bannedTopics`, `complianceNotes`, `voice.phrasesAvoided` | **Present** | — |
| Editing style profile | — | **Missing** | `onboarding/KICKOFF_AGENDA.md` promises an "editing style profile" at kickoff. No field holds it |
| Deliverables for the period (about 12–16 core assets) | Engagement entitlements (ENG-01) | **Partial** | Entitlements count assets. There is no brief text |
| Brief version and sign-off | `BrandBrain.version`, `confirmations` (CX-04) | **Present** | Via the Brand Brain versioning |

**Smallest change (proposal).**
- Add a fifth JSON block, `creativeBrief`, to `BrandBrain`. This is **one migration**, a single `String @default("{}")` column; the versioning trigger must then include the new column.
- The block holds:
  - `periodObjective` (text)
  - `commercialJob` (enum, as `Idea.intendedJob`)
  - `keyMessages` (list)
  - `rootIds` (list)
  - `proofToUse` (a list of ProofItem ids)
  - `editingStyle` (text: captions, pace, B-roll, reframing)
  - `mandatories` (list)
  - `exclusions` (list)
- Add a "Creative brief" card to the editor, add it to the context, and add it to the CX-04 prefill and confirm sections.

About 3 hours with the trigger migration and tests.

**Cheaper alternative (no schema change):** hold the brief as a document template in `onboarding/`, filled in at kickoff and pasted into `contentRules.complianceNotes`. Not recommended: the AI would see it as unstructured notes.

## 4. Proof Bank / Claims Register

The TODO spec: *source, exact claim, evidence class, date, permission, approved wording, prohibited wording and where it may be used.*

| Spec element | Where it lives in code | Status | Note |
| --- | --- | --- | --- |
| Source | `ProofItem.source` | **Present** | The hint reads "so it can be defended" |
| Exact claim | `ProofItem.title`, `body`, `metricLabel`, `metricValue` | **Partial** | No single field holds the exact claim wording |
| Evidence class | — | **Missing** on ProofItem | The five canonical classes exist for attribution (ATT-01) but aren't used on proof |
| Date (as of / evidence date) | `createdAt` only | **Missing** | A figure without an "as of" date goes stale silently |
| Permission | `ProofItem.claimStatus` (allowed / needs_review / prohibited); `ProofPermission` (workspace-level flags: testimonial, named or anonymous case study, metrics, logo, with expiry and scope, PRF-01) | **Partial** | Per-item status plus workspace-level flags. They aren't linked: an item doesn't say which permission flag it relies on |
| Approved wording | — | **Missing** | — |
| Prohibited wording | — | **Missing** | Only workspace-wide `phrasesAvoided` |
| Where it may be used | `ProofPlacement` (records where proof **was** placed, with revocation flags) | **Partial** | It records usage after the fact. There is no allowed-placement list on the item |
| Drafting guard | `context.ts` sends `allowed` and `needs_review` items, marking the latter "NOT YET CLEARED — do not state as fact"; `domain/package-claims.ts` (DEL-05) refuses figures in packaging that the script doesn't contain | **Present** | Good. The guard is on packaging figures, not on proof wording |

**Smallest change (proposal).**
1. Add six nullable columns to `ProofItem` in one additive migration:
   - `evidenceClass`, reusing the ATT-01 enum
   - `evidenceDate`
   - `approvedWording`
   - `prohibitedWording`
   - `allowedPlacements` (a JSON list: site, proposal, deck, social, case study)
   - `permissionFlag` (the `ProofPermission` flag it relies on)
2. Show them in the proof form.
3. In `context.ts`, send `approvedWording` in place of `title` and `body` when it is present.
4. Test: an item with approved wording renders only that wording.

About 2 hours.

**Threadline's own register** (TODO_AUDIT TC3) is a separate deliverable. It is in progress tonight in `sprint/content/PROOF_BANK_AND_CLAIMS_REGISTER.md`. If it uses the columns above, it can be imported once `ProofItem` is extended.

---

## Summary

| Template | Present | Partial | Missing | Smallest change | Migration? | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Voice/Tone Guide | 4 | 5 | 0 | 3 fields in the `voice` JSON block | No | 1.5 h |
| Avatar/ICP Brief | 5 | 3 | 5 | Demographics input; 5 IcpProfile columns | Yes, additive | 2 h |
| Creative Brief | 5 | 5 | 1 | A new `creativeBrief` JSON block | Yes, one column plus the trigger | 3 h |
| Proof Bank/Claims Register | 2 | 3 | 4 | 6 ProofItem columns | Yes, additive | 2 h |

**Order, if approved:** the demographics input (a bug) → Proof Bank (it protects claims) → Voice → ICP → Creative Brief.

None of these touches the public site. All four are workspace (client portal) changes and don't break the frontend freeze.

**Also noted while mapping** (these are in DEFECT_REGISTER):
- **DR-17.** Onboarding copies every founder story into `approvedAnecdotes` (`onboarding.ts` line 171).
- **DR-17.** When `approvedAnecdotes` is empty, `context.ts` line 148 sends *all* stories under the heading "Stories cleared for use". Both treat an uncleared story as cleared.
- **DR-19.** The client guide says banned topics are absolute ("the system won't generate anything that touches them"). In code, they are a prompt instruction only.
