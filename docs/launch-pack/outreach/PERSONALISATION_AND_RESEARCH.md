# Personalisation fields and prospect research

**Status:** drafted; owner approval pending (27 September 2026).
**Sources:** First US Playbook V1 (Drive `1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s`): the business-model filter, the Authority-System Gap, the channel rule, and what to log before sending. SOP Router §3–4. `prisma/schema.prisma` (the Prospect fields).

**The rule behind every field:** only a **verified observation** goes into a message. Every observation has a source URL you opened yourself within the last 7 days. If a field cannot be filled truthfully, drop the sentence that needs it. Never fill it with a plausible guess.

---

## 1. Personalisation fields

| Field | What goes in it | Must be | Example (fictional) |
|---|---|---|---|
| `{{first_name}}` | The recipient's first name as they use it publicly | Checked on their own profile | "Dana" |
| `{{firm}}` | The firm's trading name | Checked on the firm's site | "Northgate Advisory" |
| `{{category}}` | How the buyer would describe the firm | Their words, not ours | "AI governance" |
| `{{buyer}}` | Who the firm sells to | Stated on their site or in their content | "COOs of regulated mid-market insurers" |
| `{{source_url}}` | The exact page, post or video you read | Opened within 7 days | a post URL |
| `{{source_title}}` | Its title, or a short description | Accurate | "the post on model-risk sign-off" |
| `{{observed_evidence}}` | One specific thing they said, did or published | A quote or a precise paraphrase, traceable to `{{source_url}}` | "your argument that the model-risk committee, not IT, should own AI pilots" |
| `{{observed_evidence_short}}` | The same, in 6–10 words | — | "model-risk committees owning AI pilots" |
| `{{second_observation}}` | A different, equally verified observation for the follow-up | Its own source URL, logged | — |
| `{{where_it_shows_up}}` | Where the expertise is currently visible | Observed | "in one long PDF and a conference talk" |
| `{{gap_hypothesis}}` | The Authority-System Gap you think exists | **Labelled a hypothesis**; never sent as a diagnosis | "strong doctrine, low distribution consistency" |
| `{{topic}}` | Their subject, in their language | — | "AI model risk" |
| `{{recent_thing}}` | A genuine recent event (a launch, talk or hire) | Verified and dated | "the new governance report" |
| `{{their_phrase}}` | An exact phrase from a call | From your notes | — |
| `{{asset_title}}` / `{{asset_or_link}}` | The promised observation or sample | **Exists before you mention it** | "3 authority angles for Northgate" |
| `{{booking_link}}` | The event matching the track | Research: 15 minutes, sent by hand. Diagnosis: 45 minutes (`NEXT_PUBLIC_BOOKING_URL`). | — |
| `{{sender_name}}` | The real sender's name | Real | — |
| `{{postal_address}}` | Threadline's business postal address | **Owner decision, not set yet.** It is required before any commercial email. | — |

**Never personalise with:**
- private information;
- anything from a leaked or paywalled source you should not have;
- their family or health;
- guesses about revenue presented as fact;
- invented mutual connections.

---

## 2. Research instructions (per prospect)

Allow about 10 minutes for a B-tier prospect. An A-tier prospect gets deeper research and a pre-completed value asset only when that is justified.

1. **Business-model filter first** (the playbook says it must pass before any A/B scoring):
   - founder- or partner-led expert B2B advisory, currently AI strategy, transformation, governance, fractional CAIO or specialist digital or technology advisory, in the UK or US;
   - consequential, trust-heavy work;
   - the founder is involved in sales or delivery;
   - credible proof;
   - economics that plausibly support the founding hypothesis;
   - the founder can appear in content;
   - more demand is wanted.

   **Reject or low priority:**
   - commodity chatbot or automation shops;
   - staff augmentation or dev shops;
   - low-ticket SMB work as the main model;
   - large consultancies;
   - firms whose authority machine is already mature (these are positive controls for the research track only).
2. **Verify it is current:** open the founder's latest posts and the firm's site today. Check the person still holds the role and the firm still trades. Stale research is a common source of embarrassing outreach.
3. **Find one real observation,** and record it with its URL. Look first for a point of view, a named framework, a proof point or a distinctive credential. It should be something only this firm would say.
4. **Score the Authority-System Gap qualitatively** across the playbook's 10 dimensions:
   1. expertise depth
   2. distinctive POV
   3. buyer specificity
   4. proof-of-work visibility
   5. distribution consistency
   6. format breadth
   7. owned media
   8. content-to-commercial path
   9. measurement and learning loop
   10. founder-time burden

   Write the gap as a **hypothesis**.
5. **Tier it:**
   - **A:** high-value economics, senior founder authority, a visible gap and good reachability. Worth deeper research and a one-page pre-completed asset before the ask.
   - **B:** qualified, but the gap is narrower or less certain. Truthful personalisation, no bespoke asset until they show signal.
   - **REJECT.**
6. **Choose the channel** (playbook rule):
   - A-tier with an active LinkedIn → LinkedIn first.
   - A-tier with a weak LinkedIn but a public business email → email.
   - Strong writing but no easy contact → email or contact form, then LinkedIn.
   - B-tier → the shortest truthful channel.
7. **Choose the track:** research (§2 of the sequences) or sales (§3). Never both in one message.

---

## 3. What to log before sending (playbook "What to log before send")

Record it on the prospect record in `/admin/prospects`: company, contact, tier, wedge, channel, `sourceNote`, `constraintHypothesis`, next action and due date. The rest goes in notes until there are dedicated fields.

- [ ] founder
- [ ] firm
- [ ] tier
- [ ] source URL
- [ ] the specific observed evidence
- [ ] the hypothesised Authority Gap
- [ ] the type of pre-completed value, if any
- [ ] primary channel
- [ ] date sent
- [ ] next action and date
- [ ] response state (a reply class once it replies)
- [ ] whether the response falsifies or supports any hypothesis

---

## 4. Funnel fields to record

Count each stage from records, not memory. The acquisition page computes the rates and flags any stage with fewer than 10 observations as too thin to read.

| Stage | Definition | Recorded where |
|---|---|---|
| **Targeted prospects** | Passed the filter and was tiered in the period | Prospect created with a tier |
| **Touches** | Every message actually sent: first touches **and** follow-ups | Each touch logged on the prospect, with channel and date. The first touch sets `firstTouchAt`. |
| **Replies** | Any human reply | `repliedAt` and a reply class |
| **Qualified conversations** | A reply or call that confirmed fit and economics | Reply class INTERESTED or BOOKED, plus a qualification note; on the call, `qualified` |
| **Booked** | A call exists | A SalesCall is created |
| **Attended** | The call happened | SalesCall `attended` |
| **Proposals** | An offer or proposal was made | SalesCall `offerMade`, or state PROPOSAL_PROCESS |
| **Wins** | Signed and paid (SOP 04) | Outcome `won` |

**Rules:**
- Diagnose the **first broken conversion**, using the playbook's mapping:

  | Where it breaks | What to look at |
  |---|---|
  | No reply | delivery, channel, list or stimulus |
  | Reply but no interest | problem or message |
  | Interest but no booking | the call to action or reply handling |
  | Booked but weak fit | qualification or the problem itself |
  | Qualified calls but no close | offer, proof or sales |

- Change one variable at a time.
- Treat the first 20–30 high-quality touches as instrumentation. Do not burn the market while a stage is visibly broken.
- Record the channel on every first touch. Warm, cold and inbound convert differently, so never blend them into one rate.

---

## 5. Content-sourced versus content-assisted demand

Record this for every reply, booked call and win. The two are kept apart, never summed into one "content" number.

| Value | Meaning | Evidence needed |
|---|---|---|
| **Content-sourced** | The first contact came *because of* content: they replied to a post, came in through a content link, or said "I saw your post on X". | The buyer named the piece, or a tracked link or UTM |
| **Content-assisted** | The first contact came another way (outbound, a referral), and content demonstrably helped: they mentioned reading it, or visited the library before booking. | The buyer's words, or a recorded visit |
| **None** | No content involvement is known | — |
| **Unknown** | Not asked yet | Ask at the call: "What made you reply or book?" |

- Do not upgrade "unknown" to "assisted" because it would look better.
- The attribution classes follow the Router (DIRECTLY_TRACKED, BUYER_NAMED_CLIENT_ATTRIBUTED, MULTI_TOUCH_INFLUENCED, ASSOCIATED_CORRELATED, QUALITATIVE_ONLY). Do not overclaim causality.
- **Follower-to-call ratio:** a diagnostic only. It is the audience size divided by booked calls over the same period, used to spot a content-to-commercial gap. There is no target. A published ratio from another business (for example "50:1") is a reference point, never a benchmark this business must hit.
