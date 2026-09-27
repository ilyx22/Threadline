# Threadline content register: summary

**Status of every item: drafted; owner review pending.** Prepared 26 September 2026. Nothing has been posted or scheduled. The Drive pack and the public site were not changed.

**What this is.** A pre-scored register of all 66 items in the Drive file `THREADLINE_BRAND_LED_CONTENT_LAUNCH_PACK_V1.md` (Drive id `1RVAWSpIeDADlyDzxaERmFp5S3NkEFfKd`), so the owner review (TODO_AUDIT C12) is quick. It closes the Claude-side work in TODO_AUDIT C8, C10, C14, C15, C16 and C17 (TC1/TC4 for Threadline's own content).

**File:** `CONTENT_REGISTER.csv` (66 rows, 29 columns, UTF-8 with BOM so it opens cleanly in Excel and Sheets).

The recommendations are Claude's pre-scores. The owner decides.

---

## 1. Result

| Platform | Items | APPROVE | REWRITE | REJECT |
| --- | --- | --- | --- | --- |
| X | 30 | 16 | 12 | 2 |
| Threads | 15 | 15 | 0 | 0 |
| LinkedIn Company Page | 10 | 8 | 2 | 0 |
| Short-form scripts | 10 | 8 | 2 | 0 |
| YouTube outline | 1 | 1 | 0 | 0 |
| **Total** | **66** | **48** | **16** | **2** |

- **REJECT (2):**
  - **X-12** repeats X-2 and LI-2 with less tension.
  - **X-23** is a fifth abstract take on TL-RT08 and uses a widely used line.
- **REWRITE (16):**
  - X-1, X-2, X-10, X-13, X-17, X-19, X-21, X-25, X-27, X-28, X-29 and X-30;
  - LI-8 and LI-10;
  - S-2 and S-9.
  - Every REWRITE row has a suggested rewrite in the `suggested_rewrite` column.
- **The 14-day calendar is affected.** Six scheduled X items are REWRITE: X-1 (day 1), X-10 (day 3), X-2 (day 5), X-21 (day 8), X-13 (day 12) and X-29 (day 14).
  - Either the owner approves the rewrite, or the slot is refilled from an approved held-back item, such as X-8, X-18 or X-26.
  - Every scheduled Threads and LinkedIn item is APPROVE.

## 2. How each column was scored

| Column | Values | Source |
| --- | --- | --- |
| `ASSET_ID` | `ROOT_ID-PLATFORMn`, for example `TL-RT03-X3` | CALENDAR_14_DAYS tag key |
| `ROOT_ID` | TL-RT01 to TL-RT10 (the pack's ten root theses) | Pack; calendar. Scheduled items keep the calendar's ROOT_ID |
| `PESTO` | P, E, S, T, O (Personal, Expertise, Social proof, Trending, Opinions) | After Marcos Ruiz (Birdhouse); transcript audit §2; BRAND_GUIDELINES §6 |
| `objection_decision_tag` | See the legend below | Transcript audit §2 ("Objections/decisions"); TODO C8 |
| `commercial_job` | Belief/POV · Methodology/competence · Implementation/demonstration · Proof · Demand capture · Nurture/objection | Content engine, "commercial jobs"; transcript audit §2 |
| `funnel_stage` | TOF / MOF / BOF | Content engine, register fields |
| `format` | one-liner, contrarian, observation, framework, list, question; video type for scripts | Content engine, register fields |
| `evergreen_status` | EVERGREEN / SEASONAL / TIME-SENSITIVE / RETIRED | Content engine. The content is evergreen; two CTAs are time-gated |
| Four-part gate | pass / weak / fail for authority, curiosity, perceived outcome and ICP relevance | Content engine, "The primary quality gate: four ingredients" |
| Anti-slop gate | Human source or evidence present? Specific proof or example present? | Transcript audit §2, "AI sandwich" |
| Claims check | `no`, or `FLAG:` plus the reason, for each of: guarantee, invented proof, unverifiable figure, "monthly", broken link | BRAND_GUIDELINES §6; CLAIMS_AUDIT; calendar flags F-01 to F-10 |
| `calendar_slot` | Day n / held back / not scheduled | CALENDAR_14_DAYS |

**The four-part gate is scored the same way as the calendar.**
- Every item the calendar rated was kept on the calendar's rating (✓ = pass, ~ = weak), so the two files agree.
- Authority rests on credible reasoning, never on proof: the company holds no publishable result.
- ICP relevance is "weak" wherever the item speaks to the umbrella ("B2B founders", "expert-led firms") and not the wedge (F-10).

**The decision rule.**
- **APPROVE:**
  - no gate fails;
  - no more than two gates are weak;
  - there is a concrete distinction or example;
  - there is no claims flag that needs a wording change.
  - Flags handled by a condition, such as labelling an illustrative figure, still allow APPROVE.
- **REWRITE:**
  - three or more gates are weak; or
  - the item has no concrete example and two weak gates; or
  - a claims flag needs new wording.
- **REJECT:** the item is redundant within its root, or cannot be made compliant without becoming a different post.

**APPROVE does not skip the human edit.** Transcript audit §2: "No direct model output is publishable." Every approved item still gets the human read, fact check and voice pass before it is posted.

### Objection and decision tag legend

| Tag | The buyer's question | Items |
| --- | --- | --- |
| OBJ-VOLUME | "We just need to post more." | 7 |
| OBJ-TRIED | "We tried content. It didn't work." | 6 |
| OBJ-TIME | "I don't have time. I'll end up project-managing it." | 6 |
| OBJ-PROOF | "Does it work? Show me the numbers." | 5 |
| OBJ-AGENCY | "How is this different from an agency, ghostwriter or tips account?" | 7 |
| OBJ-EXPERTISE | "Our expertise doesn't translate into content." | 8 |
| OBJ-OUTBOUND | "We already do outbound. Why content?" | 1 |
| DEC-MEASURE | "How will we know it is working?" | 17 |
| DEC-PLATFORM | "Which platforms and formats?" | 5 |
| DEC-QUALITY | "Is this piece good enough to publish?" | 4 |

## 3. What the register shows about the pack

1. **The PESTO mix is two letters: E 34, O 32.** There are no Personal, Social proof or Trending items. This follows from the pack's constraints (company-led, no proof held, drafted in advance), but it is lopsided.
   - **Social proof:** leave the slot empty. Do not fill it from the site's proof band. PROFILES gate 4 keeps "100m+ / 10,000+" off every profile and post.
   - **Trending:** the manual Trend Scout (transcript audit §3) can supply one or two reactive items a week once accounts are live. Trending items are time-sensitive by definition.
   - **Personal:** Threadline can speak as "we" about what it learned building the system, without naming the founder. For example: "We wrote down what we expected before each post in this batch. Here is what we got wrong." This becomes possible after the day-7 review. It must be true.
2. **Commercial jobs:**
   - Belief/POV 24, Methodology/competence 27, Implementation/demonstration 5, Nurture/objection 10.
   - Proof 0 and Demand capture 0.
   - Funnel: TOF 34, MOF 32, BOF 0.
   - This matches a trust layer for outbound (transcript audit §1). No item asks for a conversation, so the profile is the only conversion point, and it waits on D-02.
3. **Root balance is uneven.** TL-RT08 (authority is judgement) has 14 items; TL-RT10 has 3. Most of the REWRITE and both REJECT rows sit in TL-RT08, where the items restate the thesis without showing a judgement.
4. **Gate pattern:**
   - Authority passes in 64 of 66 items.
   - Curiosity is weak in 32 and ICP relevance is weak in 45: this is the umbrella-buyer issue (F-10).
   - Perceived outcome is weak in 23, mostly one-liners that name a problem but give the reader nothing to do.
   - No item fails a gate outright.
5. **Anti-slop:**
   - No item has a human source (a founder or client observation). All 66 are doctrine-derived drafts.
   - 31 are partial, because they describe Threadline's own method, which is the one thing only Threadline can say at launch.
   - 45 carry a specific example or list, 9 are partial and 11 have none.
   - The dominant AI pattern is the "X is not Y. It is Z." construction (transcript audit §2: "recycled 'not this but that' constructions"). A negation-led construction appears in about 25 items, 14 of them on X. Individually it is fine. In a feed it becomes a tic. At the human edit, vary it on any day that carries two such items.
6. **Claims (7 flags; none is "monthly"):**

   | Item | Flag | Handling |
   | --- | --- | --- |
   | X-30 | Guarantee-like "promise … qualified attention"; banned word family "virality" | REWRITE (F-03 fix) |
   | X-27 | Implies a client portal in use | REWRITE to a process statement (F-06) |
   | X-6, TH-12, S-5 | Illustrative view figures | APPROVE with conditions: never beside the site's figures; S-5 is labelled "Illustrative, not a client result" on screen (F-05) |
   | S-2 | CTA points at threadlinehq.com, which has no web record | REWRITE the CTA until D-02 |
   | YT-1 | Site and booking CTA not live; 15 vs 20 minute mismatch | APPROVE the outline; the CTA stays held, as the pack itself says (F-08) |

   - X-19 ("legible at scale") is a REWRITE for its closeness to the banned phrase "content at scale" (F-04). It is recorded in `reason`, not as a claims flag.
   - No item mentions pricing, "monthly" or a founder-time figure, or names a founder.

## 4. Owner review: the quickest path

1. Filter `recommendation` = APPROVE, then read the `reason` column. Change a row only where you disagree.
2. For each REWRITE, accept the `suggested_rewrite`, edit it, or reject it.
3. Confirm the two REJECTs.
4. Choose replacements for the six REWRITE items scheduled in the calendar if their rewrites are not approved by 30 September.
5. Decide F-10 (umbrella or wedge buyer wording). If it is the wedge, the opening words of the approved items change; the theses stay.
6. Record each decision in the `status` column (approved / rewrite approved / rejected), with a date.
