# Strategy reconciliation: software against the approved strategy (27 September 2026)

**What this checks:** whether Threadline OS matches the approved commercial strategy.

**Sources:**
- Master Blueprint (Drive), SOP Router overlay (7–8 Sept), SOP 03/04 and the First US playbook.
- The brief's 18A continuation (the business launch asset pack).

## 1. Offer and positioning (confirmed; no change)

- **What Threadline is:** a premium managed authority and content service for expert-led B2B firms. Threadline OS supports delivery; it is not sold as self-service software.
- **Initial target (a hypothesis):** UK/US founder- and partner-led AI, digital-transformation and technology advisory firms. The playbook's business-model filter comes before any fit scoring.
- **Founding commercial hypothesis:**
  - £2,500 implementation, plus £2,500 every four weeks.
  - The 12-week initial engagement is three service periods, £10,000 in total.
  - One offer: no tiers, no guarantees.
  - Risk reversal covers controllable outputs only.
  - Price review after 2–3 paying clients.
- **Checked against newer sources:** the Router overlay of 7 Sept and SOP 04 (Drive) restate the same terms. No newer source changes them.
- **In code:** `OfferTemplate` defaults to £2,500 + £2,500 / 28 days × 3, and terms are frozen per engagement. Billing never labels four-week revenue as monthly.
- **Public site:** no pricing (checked by marketing-v9).
- **Brand:** presented as the Threadline brand. There is no founder name or face, no invented spokesperson, team, testimonials or credentials.
- **Implementation produces:** positioning, Brand Brain, voice guide, workflow, measurement, and initial content capability. These map to the installation milestones in the app; see `newsletter-graphics` #09.

## 2. Research interviews and validation (changed)

The historical rule is 10+ proper interviews, of which more than 5 must converge on the same expensive recurring problem. It must not block outreach, discovery or paid pilots. The four activities are now separate:

| Activity | Gate in the software | Change |
| --- | --- | --- |
| Starting outreach | None. Prospects, touches, replies and calls are independent of wedge state. | Confirmed (no code tied them) |
| Collecting research | None. Conversations are recorded on the wedge at any time. | None |
| Starting a commercial test (or a paid pilot) | **Interviews → commercial test** is allowed before the sample is in, only by an operator with `acquisition.manage`, and only with a written **uncertainty note** of at least 40 characters. The note is stored on the wedge (`testedBeforeValidation`, `uncertaintyNote/At/ById`), shown as a warning banner on the wedge page, and written to the audit trail with the counts. | **Changed.** Previously refused outright. |
| Declaring "validated" | **Commercial test → validated** needs 10 conversations with more than 5 converging, with no override. | **Moved.** The thresholds are unchanged but now guard validation, not testing. |
| Starting an engagement | Not tied to wedge state (applications → conversion → engagement). | Confirmed |

**Tests:**
- `src/lib/domain/sop.test.ts`, early-commercial-test block (4 tests).
- `scripts/qa/suite-sales-validation.ts`: an early test with a note is allowed and audited; a validated state cannot be declared early; a token override like "Founder says go." is refused.

**Also fixed:** the wedge page ignored conversation themes when counting convergence, so it always showed 0 converging. `getWedge` now passes the theme.

## 3. Time commitments (changed)

Every numeric time commitment was traced (claims audit T-01…T-13). None of the client-burden figures had a source, and the Blueprint forbids publishing one until real delivery load validates it.

- Public copy now describes the founder's part as "a short recording session and one approval pass per batch", measured rather than assumed.
- The in-app 60 min/week figure is an **internal planning target (estimate)**, shown to staff only.
- The owner dry run (operations/OWNER_DRY_RUN.md) records actual minutes, so a figure can later be earned.

## 4. Cadence and channels (confirmed, one wording change)

- **Cadence** defaults to 3 pieces a week (`MASTER_TEMPLATE.cadencePerWeek`). It is editable per client when creating the client, in the Brand Brain content rules and in workspace settings, so it follows client fit rather than a fixed package. The ~12–16 core assets per four-week period is an internal scope hypothesis, not a hard video package (Router 7 Sept).
- **Channels** are chosen per client ("The ones your buyers are actually in").
- **Marcos Ruiz/Vantage strategies** are references, not deliverables. Nothing in the product schedules a Ruiz-style cadence.
- **PESTO:** the idea prompt previously said "Balance the mix across PESTO". It now says the mix is weighted to the client's evidence and goals, "not an equal split". A Personal or Social-proof idea needs a real source in the context, or it is left out (never invented).

## 5. Marcos Ruiz / Vantage lessons (adopted as hypotheses, attributed)

| Lesson (attributed to Marcos Ruiz / Vantage; treated as a hypothesis) | Where it lives now |
| --- | --- |
| Outbound runs alongside content, not after it | Sales library K (organic + outbound + paid); `newsletter-graphics` #05; outreach sequences |
| Track the full funnel: targeted → touches → replies → qualified conversations → booked → attended → proposals → wins | Admin → Acquisition. It now counts **targeted** (prospects added), **touches** (a new touch log: first, follow-up, value sent, reply, booking), and labels the offer steps **proposal**. |
| Content-sourced and content-assisted demand tracked separately | Each prospect has a **demand source**: outbound / content-sourced / content-assisted / referral / other inbound. Content credit needs a note on how we know. Wins are reported by source, and the two content kinds are never blended. Client-side inquiries already record source and evidence strength. |
| Follower-to-call ratio as a diagnostic | **Audience to calls** card: followers per booked call from a recorded audience size. It shows no benchmark and no verdict, and 50:1 is not hard-coded anywhere (unit test). |
| Workflow: capture expertise → maintain voice/claims/evidence → mine → AI draft → check → human approval → publish/record → feed back | Existing pipeline; see research/AGENT_WORKFLOWS.md |
| PESTO adjustable, never fabricated | The prompt change above. The PESTO letters follow `src/lib/ai/generators.ts` (Personal, Expertise, Social proof, Trending, Opinion); owner to confirm (O-10). |
| No rented identities, engagement manipulation or misleading automation | Unchanged rules: nothing sends; no LinkedIn automation; the Apify adapter only reads public pages a person pointed at. |

## 6. Conflicts found, and decisions

| # | Conflict | Sources | Resolution / recommendation |
| --- | --- | --- | --- |
| K-01 | "Engagements run month to month" vs a 12-week initial engagement in four-week periods | Home FAQ vs Blueprint/SOP 04 | Public copy corrected (inaccurate claim) |
| K-02 | Founder time "twenty minutes" / "under an hour" vs the ban on quantitative founder-hours claims | Public copy and the app vs Blueprint | Corrected; measure first |
| K-03 | "Onboarding 10 to 14 days" vs Day-7 installation doctrine | Home FAQ vs Blueprint §9 / SOP 05 | Public copy made non-numeric; Day 7 stays an internal aim |
| K-04 | "30-day strategy" vs four-week periods | Installation milestone vs Router | Renamed |
| K-05 | Research call 15 min vs 20 min | Playbook (15) vs demo text (20, client-inbound context only) | 15 minutes for research; 45 for diagnosis. Booking events do not exist yet (O-05) |
| K-06 | Repo SOP 03/04 lacked the 8 Sept library and offer confirmation | Repo vs Drive | Repo copies updated from Drive; the import reads the library |
| K-07 | "Monthly" in the one-page offer, proposal checklist and scorecard | Repo drafts vs Router | Corrected to four-week wording |
| K-08 | `HANDOFF.md` statements (no billing, no PDFs, no CRM sync, local-only git, no workers) | HANDOFF vs current code | HANDOFF marked historical, with a current-state pointer |
| K-09 | Live favicon/OG image use an older identity; `BRAND_SOURCE_OF_TRUTH.md` and design DNA v3 describe an older look; the thread colour `#F2A51F` (proposal) vs `#C88B2D` (built) | Site vs brand kit | Brand kit follows the built site. Favicon/OG replacement is owner decision O-07 (frontend freeze) |
| K-10 | Content launch pack CTA `threadlinehq.com` vs live domain | Drive vs deployment | Replace before posting (O-13) |
| K-11 | The playbook suggests the founder's personal LinkedIn for research outreach; the brief says present under the brand, not the founder's face | Playbook vs brief | Both hold: **public marketing** is brand-led; **one-to-one research outreach** is a real person writing from their own real profile, which is honest and allowed. No fake or duplicate identities. Recommendation: keep; owner confirms (O-18). |
