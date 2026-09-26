# Claims audit: public and client-facing numbers (27 September 2026)

**Rules** (Master Blueprint; Router overlay 7–8 Sept; the brief):

- No fabricated proof.
- Earlier-business results are never presented as Threadline outcomes.
- No quantitative founder-hours claim until measured real-client delivery load validates it (Blueprint, "Public low-burden benefit").
- Unsupported proprietary-data scale claims are prohibited.
- Recurring billing is never "monthly".
- Pricing stays off the public site.

Each claim below is checked for its source, owner, timeframe, meaning and publishing permission. The status says what was done.

## Proof figures

| ID | Claim | Where | Source | Owner / timeframe / meaning / permission | Status |
| --- | --- | --- | --- | --- | --- |
| P-01 | "100m+ views", "10,000+ conversions" | Home proof band (`src/content/home.ts` `proof`); Playbook hero facts (`src/content/playbook.ts`) | The owner's statement on 26 Sept 2026, recorded only in a code comment ("wording to be confirmed"). No written evidence in Drive or the repo. The Drive documents record related but different facts: "TikTok partner" work, and about 10k followers after about 60 uploads. | **Owner:** the founder, from work before Threadline. **Timeframe:** not recorded. **Meaning of "conversions":** not recorded (sales? sign-ups? clicks?). **Permission:** the founder's own history, so no third party is needed. **Substantiation:** none on file. | **Home:** relabelled "Before Threadline: the founder's own content work", so it is no longer read as a Threadline result. **Playbook hero:** removed; it sat among Playbook facts, unattributed, and read as a Threadline outcome. It was replaced by "8 things to do" and "0 email walls". **Owner action O-01:** send the source (analytics exports or platform screenshots), the timeframe and the definition of "conversions". If it cannot be substantiated, delete the home band (`proof` in `home.ts`, one section). |
| P-02 | "I've worked in creator/content ecosystems for years, including as a TikTok partner…" | Verbatim sales library A (calls only, never public) | Founder-approved script | Founder's first-person history | Allowed on calls **by the founder only**. The public brand never names or shows the founder. |
| P-03 | "82/100" score example | Verbatim library I | Illustration of how a score is explained | n/a | Must never be presented as a client's score (operator note added). |
| P-04 | Engagement values "£10k", "£25k and capacity for another three" | Verbatim library D | Examples that echo the prospect's own numbers | n/a | On calls, use the prospect's real figures. Never quote them as Threadline results. |

## Time and cadence commitments

Every numeric time commitment found, traced to its source:

| ID | Claim | Where | Source found | Verdict and action |
| --- | --- | --- | --- | --- |
| T-01 | "About twenty minutes of recording a week… and one approval pass" | Home FAQ | **None.** The Blueprint forbids a quantitative founder-hours claim until it is measured. | **Inaccurate claim; corrected:** "A short recording session when it is useful, and one approval pass per batch… the time it takes you is measured, not assumed." |
| T-02 | "A teleprompter, a checklist, twenty minutes" | How-it-works station detail (`public-site.ts`) | None | Corrected to "one short session". |
| T-03 | "Twenty minutes, not a writing task" | Role card (`public-site.ts`) | None | Corrected to "A short session, not a writing task". |
| T-04 | "Twenty minutes of recording and one approval pass a week" | Who-it's-for, founder's role | None | Corrected to "A short recording session and one approval pass per batch". |
| T-05 | "The founder's time is meant to stay under 60 minutes a week… the promise" | In-app Time page (clients saw it) | None. It came from an earlier internal model; the offer never promised it. | Now an **internal planning target (estimate)**, shown to staff only. Clients see "record the time the work actually takes". Measure it in the owner dry run (O-15). |
| T-06 | "Onboarding takes 10 to 14 days" | Home FAQ | None. The doctrine is Day-7 installation: onboarding starts at payment with no dead time (Blueprint §9, SOP 05). | Corrected to "Onboarding starts as soon as the agreement is signed…". Day 7 is an internal aim, not a public promise. |
| T-07 | "Engagements run month to month" | Home FAQ | Contradicts the offer: a 12-week initial engagement in three four-week periods, never monthly. | Corrected to "The first engagement is twelve weeks, in three four-week periods… After that it continues four weeks at a time." |
| T-08 | "Read it in twenty minutes" vs "15 minutes" | Playbook description vs hero meta | Reading time (not a founder commitment); the two figures were inconsistent | Aligned to fifteen minutes. |
| T-09 | "It takes about 25 minutes and saves as you go" | In-app onboarding intro (`src/lib/templates/master.ts`) | An estimate, already phrased "about" | Kept as an estimate. Re-measure in the dry run. |
| T-10 | Discovery call "45 minutes", Brand Brain "60 minutes" | Internal SOP templates | SOP 04 (60–90 min kickoff); the discovery structure | Internal meeting lengths, not client burden claims. OK. |
| T-11 | Research call "15 minutes" | Drive playbook (verbatim) | Playbook | Canonical research ask. The "20 minutes" found was only offline demo text for a client's inbound reply, not a Threadline booking length. |
| T-12 | "30-day strategy approved" | Installation milestone (app) | Clashed with four-week periods | Renamed "First four-week period strategy approved". |
| T-13 | "~12–16 core assets per four-week period" | Blueprint and Router (internal) | Commercial hypothesis | Internal scope hypothesis. Not public. Must not become a hard video package (7 Sept overlay). |

## Other claims

| ID | Claim | Where | Verdict |
| --- | --- | --- | --- |
| C-01 | "If one additional good customer is worth four figures or more, content that starts one conversation a month pays for itself." | Who-it's-for, economics | Implied outcome and return claim; corrected to "a handful of the right conversations can justify the work". |
| C-02 | "Who owns the content? You do." | Home FAQ | Legal/IP wording. The Router requires qualified counsel to review ownership language before scale. Left as is, flagged O-14. |
| C-03 | "A small number of firms at a time", "answered either way" | Home closing | Operating commitments the owner controls (tagged C-FOUNDING, C-REPLY-EITHER-WAY). Keep only if honoured. |
| C-04 | CTA `threadlinehq.com/how-it-works` | Drive content launch pack | Not the live domain (threadline-fawn.vercel.app). Replace before any post (O-13). |
| C-05 | "Slow on day one. Inevitable by day ninety." | Home engagement headline | Rhetorical; "inevitable" could be read as a promise. Not changed under the design freeze. Owner review suggested (O-17). |

## Verification

- The `marketing-v9` suite checks: no exact pricing, no promised outcomes, illustrative material labelled.
- Public freeze hashes were re-recorded for the three changed content files (see `docs/implementation/evidence-public-freeze.txt`). No layout, illustration, typography or component file changed.
