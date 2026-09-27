# Case study template

**Status: DRAFT — owner review** (26 September 2026). **Placeholders only.** No Threadline case study exists yet, and nothing here may be filled with invented, illustrative or "typical" results. Use this only after a real client's meaningful win, a proof interview, and the permission gates in §1 are passed.

**Labels.** **VERBATIM** = founder-approved wording (source given). **ADAPTATION** = new, unapproved.

**Governs:** Execution Manual V14.3 §23 "Proof capture + client proof interview" and §22 ("Use careful causality language. Never claim Threadline caused an outcome where only correlation exists"), Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`; SOP 04 success-interview rule; library passages A, B and L (`../../sales/APPROVED_VERBATIM_LIBRARY.md`); the five canonical evidence classes (ATT-01, `src/lib/domain/enums.ts` `EVIDENCE_CLASS_CANONICAL`; colour mapping in `../../brand-kit/BRAND_GUIDELINES.md`); proof permissions (PRF-01, `ProofPermission` in `prisma/schema.prisma`).

**Authority basis** (as recorded in the Drive documents): Charlie Morgan / Imperium, primary: proof capture and retention from real delivery (Gap Register "Delivery" row; EM §23). Daniel Fazio, tactical: the case-study interview, "use only after a meaningful verified win and separate permission for public use" (Gap Register "Proof interviews" row); no unsupported forecasts (rule 7).

**VERBATIM rules that apply to every case study:**
- EM §23: "Do not fabricate proof or pressure clients to make claims they cannot support."
- Library A rule: "do not use “privacy policy” as a blanket dodge for lack of case studies. Truthful privacy is a trust signal; fabricated or implied undisclosed proof is prohibited."
- SOP 04 (library, "Also founder-approved"): "This is willingness to consider a later interview, not advance permission to publish. Seek separate approval for actual public proof. Respect NO and do not pressure clients with weak results."

---

## 1. Permission gates (all must pass before drafting for any audience beyond Threadline)

ADAPTATION. Each gate maps to a stored field so the app can refuse a placement that is not permitted (PRF-01: "placements refused without permission, flagged on withdrawal or expiry"). Record them at `/app/[org]/performance/proof`.

| Gate | Question | Stored as | If no |
|---|---|---|---|
| G0 Willingness | At onboarding, did they say YES / MAYBE / NO to the library B ask? (exact words recorded) | `interviewWillingness` | NO: do not ask again aggressively (library L). Stop |
| G1 Genuine win | Is there a meaningful, truthful result worth discussing, confirmed by the client? | `successConfirmedAt`, `successNote` | Do not ask for a testimonial; run an honest diagnosis and renewal-or-exit conversation (library L) |
| G2 Interview | Did they agree to a recorded 20–30 minute proof interview? | `allowInterview` | Stop at internal learning |
| G3 Internal use | May the material be used internally (sales training, operator examples)? | `allowInternalUse` | Keep in the client workspace only |
| G4 Placement | Which of these, exactly? Anonymous case study · named case study · testimonial (private, e.g. proposal) · public testimonial · published metrics · logo | `allowAnonCaseStudy`, `allowNamedCaseStudy`, `allowTestimonial`, `allowPublicTestimonial`, `allowPublishMetrics`, `allowLogo` | Only the ticked placements may be used |
| G5 Exact-copy approval | Has the client approved **this exact text**, every number and every quote? | written approval, dated, with `grantedAt` / `grantedNote` | Do not publish; the order form (§6) says willingness is not consent |
| G6 Scope and expiry | What it covers and until when | `scopeNote`, `expiresAt` | On withdrawal or expiry, pull every placement (the app flags them) |

Metrics need **G4 published metrics** separately from a named case study: a client may allow their name but not their numbers.

---

## 2. Evidence classes: how every claim in the case study is labelled

Every factual sentence carries one evidence basis **and**, if it concerns a commercial outcome, one evidence class. Print the class name beside any colour; colour alone never carries meaning (BRAND_GUIDELINES).

**Evidence basis** (whether Threadline observed it): `measured` · `client_reported` · `unavailable`.

**The five evidence classes** (canonical names, ATT-01; descriptions from `ATTRIBUTION_CLASS_META`):

| Class | Meaning | Case-study section | Wording allowed |
|---|---|---|---|
| **DIRECTLY_TRACKED** | "A tracked link, content ID, booking or CRM path supports the connection." | Measured facts | "came through a tracked link from {{asset}}" |
| **BUYER_NAMED_CLIENT_ATTRIBUTED** | "The buyer or the client said the content influenced this." | Client-reported facts | "{{client}} told us the buyer mentioned {{asset}}" |
| **MULTI_TOUCH_INFLUENCED** | "One identifiable touch in a longer journey. Not the cause on its own." | Client-reported facts | "was one of several touches before…" |
| **ASSOCIATED_CORRELATED** | "It happened in the same period. Causality is not established." | Inference | "in the same period…"; never "because of", "led to", "drove", "generated" |
| **QUALITATIVE_ONLY** | "Authority, trust or buyer language, with no defensible monetary path." | Inference / qualitative | a quote or observation, no £ figure attached |

An attribution model that splits credit never raises a class ("arithmetic redistributes credit, it does not create evidence", schema comment on `CommercialEvent.attribution`).

---

## 3. The template

ADAPTATION throughout. Delete any section that has nothing true in it rather than padding it.

> **{{client_display_name — named only if G4 named case study; otherwise "{{a descriptor, e.g. a UK AI governance advisory firm}}"}}**
> Case study · {{engagement_period, e.g. weeks 1–12}} · approved by the client on {{approval_date}}

### 3.1 Before (baseline)

Captured before meaningful delivery (EM §23: "Capture baseline before meaningful delivery"; kickoff agenda part 1).

| Baseline item | Value | Basis | Source and date |
|---|---|---|---|
| {{baseline_item_1, e.g. publishing cadence}} | {{value}} | measured / client_reported / unavailable | {{source}}, {{date}} |
| {{baseline_item_2}} | {{value}} | … | … |

- **The original constraint (their words):** "{{constraint_quote}}"
- **Why they acted then:** "{{why_now_quote}}"

### 3.2 What Threadline did

Factual, no adjectives: the installation steps completed, what was produced, channels, volume. Every count comes from the workspace, not memory.

- {{implementation_fact_1}}
- {{implementation_fact_2}}

### 3.3 Measured facts (Threadline observed these)

Only `measured` basis. DIRECTLY_TRACKED for commercial items.

| Fact | Value | Period | Class | Source |
|---|---|---|---|---|
| {{e.g. core assets published}} | {{n}} | {{dates}} | n/a (output) | workspace |
| {{e.g. enquiries via tracked links}} | {{n}} | {{dates}} | DIRECTLY_TRACKED | tracked link report |

### 3.4 Client-reported facts (the client told us these)

Only `client_reported` basis. BUYER_NAMED_CLIENT_ATTRIBUTED or MULTI_TOUCH_INFLUENCED for commercial items. Say so in the sentence: "{{client}} reports…".

| Fact | Value | Class | Reported by, date |
|---|---|---|---|
| {{e.g. a buyer said on a sales call they'd watched several videos}} | {{detail}} | BUYER_NAMED_CLIENT_ATTRIBUTED | {{name}}, {{date}} |

### 3.5 Inference (our reading, labelled as such)

ASSOCIATED_CORRELATED or QUALITATIVE_ONLY. Open with "Our reading:" and name the uncertainty.

> Our reading: {{inference}}. This happened in the same period as {{activity}}; we can't show that one caused the other. {{what_else_changed_in_the_period}}.

### 3.6 What didn't work, and what we changed

Required, not optional (library J: "If the trajectory falls, show the fall and diagnose it. Honest diagnosis is part of the product.").

| Expected | Actual | Why (diagnosis) | Change | Retest result |
|---|---|---|---|---|
| {{expected}} | {{actual}} | {{why}} | {{change}} | {{retest}} |

### 3.7 In their words

Quotes from the proof interview (EM §23 question list), exact and approved under G5. No edited-for-effect quotes.

> "{{quote_on_before_state}}" — {{attribution_per_G4}}
> "{{quote_on_experience_of_the_system}}"
> "{{quote_advice_to_another_client}}"

### 3.8 What this does not show

Always included. ADAPTATION:
> This is one client over {{period}}. It doesn't show that the same results would happen for another firm, and where we've said "in the same period", we mean exactly that. Figures marked client-reported were given to us by {{client}} and not independently checked by Threadline.

---

## 4. Checklist before any use

- [ ] G0–G6 passed and recorded; the placement being used is ticked.
- [ ] Every number has a basis (measured / client_reported / unavailable), a source and a date.
- [ ] Every commercial claim has one of the five classes; no class raised by arithmetic.
- [ ] No causal verbs ("drove", "generated", "led to", "because of") on ASSOCIATED_CORRELATED or QUALITATIVE_ONLY items.
- [ ] §3.6 and §3.8 are present.
- [ ] The client approved this exact text and every number (dated).
- [ ] Not used anywhere public until also checked against the claims register (`../../claims/CLAIMS_AUDIT.md`, audit row TC3).
- [ ] Repurposed outputs (EM §23: testimonial clips, website proof, proposal proof, sales-call evidence, email and social proof) each respect the same placement ticks.
