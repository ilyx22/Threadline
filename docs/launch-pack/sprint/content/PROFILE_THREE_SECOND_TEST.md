# Three-second profile test

**Status: drafted; owner review pending.** Prepared 26 September 2026 (TODO_AUDIT TC5 / C18).
- Part A covers the live public site. It is a **report only**: the site is frozen and owner-approved, so nothing in Part A is a task or an edit request.
- Part B covers the drafted profiles in `sprint/social/PROFILES.md`, with suggested fixes. No account has been created.

## The test

A qualified visitor must be able to tell, in about three seconds, without scrolling or clicking:

| # | Question | Pass condition |
| --- | --- | --- |
| 1 | **Buyer:** who is it for? | The buyer is named in the first thing read (the headline, eyebrow, bio line 1 or tagline) |
| 2 | **Problem:** what goes wrong today? | A problem the buyer recognises, stated or plainly implied |
| 3 | **Mechanism or proof:** why believe it? | How it works, or verified proof. At launch the mechanism does this job, because no client proof is held |
| 4 | **Next action:** what do I do now? | One primary CTA, visible, with a destination that loads |

Scoring: **pass** / **weak** (present but slow or implied) / **fail** (absent, or it leads nowhere).

Sources:
- Content engine, "Profile-as-funnel architecture": "The profile is a conversion asset, not a biography… A qualified visitor should understand within seconds: who… what problem… why credible… next step."
- Charlie Morgan: "Great content poured into a weak profile is a leak."
- Master to-do P1 (three-second profile test).

---

## Part A. The live site (report only; the site is frozen)

**Method:**
- A read-only, logged-out fetch of `https://threadline-fawn.vercel.app`, `/how-it-works` and `/who-its-for` on 26 September 2026, cross-read with the copy in `src/content/home.ts` and `public-site.ts`.
- This was a text fetch. There was no screenshot and no phone viewport, so "above the fold" is judged from document order.
- Nothing was changed.

### Home `/`

| Test | Result | Observation |
| --- | --- | --- |
| Buyer | pass | The eyebrow reads "A managed authority system for expert-led B2B firms". The fit line reads "Built for firms where judgement is what clients buy and one conversation is worth a lot." The buyer is the umbrella, not the wedge (BRAND_GUIDELINES §6). The eyebrow is small type, so the headline carries most of the three seconds. |
| Problem | pass (implied) | Headline: "Make the expertise that wins you work visible before the sales call." The problem (the expertise is invisible to buyers) is implied, not stated. It is stated plainly in section 02 ("Strong firms know far more than the market does"), which sits below the hero. |
| Mechanism / proof | pass | Mechanism: "every reply teaches the next piece. You talk, record when useful, approve and sell. We run everything else." The labelled illustrative desk object ("What one buyer has met before the first call") shows the output. Proof: the founder figures "100m+ views / 10,000+ conversions" appear under "Built by someone who has done it" (CLAIMS_AUDIT P-01; the owner kept them). |
| Next action | pass | One primary CTA, "See if Threadline fits", links to `/apply` and is repeated in the navigation. The secondary CTA "How it works" links to `/how-it-works`. |

**Observations for the owner (no action requested):**
- The page `<title>` repeats the headline, so a shared link carries the promise.
- The CLAIMS_AUDIT items are still present as approved. They are listed in PROOF_BANK_AND_CLAIMS_REGISTER §A for reference:
  - the "twenty minutes" figures (FAQ);
  - "10 to 14 days" (FAQ);
  - "month to month" (FAQ);
  - "You do" on ownership (FAQ).

### `/how-it-works` (the planned profile link destination)

| Test | Result | Observation |
| --- | --- | --- |
| Buyer | weak | Hero: "How the machine works." Sub: "Your expertise goes in at one end. Six stations later the market has met it, answered it, and taught the next piece." It does not name the buyer; it assumes the visitor already knows. |
| Problem | weak | The problem is implied ("expertise goes in") but not stated in the hero. |
| Mechanism / proof | pass | Six stations, "Who does what", "What we refuse to do", and "One idea, start to finish". This is the clearest mechanism surface Threadline has. |
| Next action | pass | "See it run on your business" links to `/apply`. "Read the Playbook" links to `/playbook`. |

**What this means for the profiles, not the site:** a profile visitor arrives at `/how-it-works` already told the buyer and the problem by the bio. So the profile must carry tests 1 and 2 on its own, and the destination carries 3 and 4. See Part B, fix F2.

### `/who-its-for`

| Test | Result | Observation |
| --- | --- | --- |
| Buyer | pass | "Expert-led B2B businesses with something proven to sell." |
| Problem | pass | "…enough value per client that one good conversation matters." |
| Mechanism / proof | weak | Fit criteria rather than mechanism. It links to how it works. |
| Next action | pass | "See if Threadline fits" links to `/apply`. |

**Observation:** this page contains "one conversation a month pays for itself" and "Twenty minutes of recording and one approval pass a week". Both are already reported in CLAIMS_AUDIT (C-01 and T-01…T-04). No action.

### The site-to-profile gap (observation)

The domain the profiles will link to, `threadlinehq.com`, has no web record today (D-02). The live site is reachable only at the Vercel URL. **At the time of writing, every profile's next action has no working destination on the planned domain.**

---

## Part B. The drafted profiles (suggested fixes)

Scores assume the owner has **not** yet connected the domain. The "after D-02" column shows the change once `https://threadlinehq.com/how-it-works` returns 200.

| Surface (PROFILES.md) | Buyer | Problem | Mechanism / proof | Next action (now → after D-02) | Verdict |
| --- | --- | --- | --- | --- | --- |
| LinkedIn tagline A + About + pinned LI-3 | pass | pass | pass (pinned loop) | **fail** → pass ("Visit website" button) | Passes after D-02 |
| LinkedIn tagline B (wedge) | pass (sharper) | pass | pass | fail → pass | Best ICP score; owner decision |
| X bio A + pinned X-3 + header | pass | pass | pass | **fail** → pass (website field) | Passes after D-02 |
| Threads bio + pinned TH-3 | pass | pass | pass | **fail** → pass (profile link) | Passes after D-02 |
| Instagram bio (reserve only) | pass | **weak** | weak | **fail**: "See how it works below." points at nothing → pass | Fix F3 |
| YouTube description (reserve only) | pass | pass | pass (loop line) | fail → pass. The banner is a gap, so the header is blank | Passes after D-02; banner still missing |
| TikTok bio (reserve only) | pass | **fail** | weak | **fail**: "How it works:" dangles → pass | Fix F4 |

### Suggested fixes to the drafts

**F1. A next action that does not depend on D-02 (all active profiles: LinkedIn, X, Threads).**
- The drafts leave link fields empty until D-02. That is correct (no dead links), but it leaves test 4 with nothing.
- If the calendar starts before D-02 (the owner's alternative in CALENDAR_14_DAYS, precondition 1), give each profile an on-platform next action:
  - **X and Threads:** end the pinned post's reply with "Follow for the full loop, one piece at a time." Replace it with the link after D-02.
  - **LinkedIn:** leave the custom button off until D-02; the built-in Follow button remains. Add a closing About line, "Questions about how it works? Message the page.", so replies stay human (C19).
- Record the choice in the asset register.

**F2. Match the profile promise to the site hero (X, Threads, LinkedIn).**
- The bios promise "authority content", but the site's promise is "visible before the sales call". "Authority content" is Threadline's own vocabulary, not the buyer's.
- A visitor who clicks through meets a different promise, and `/how-it-works` does not restate the buyer (Part A). Use the site's wording so the click-through reads as one message:
  - **X, version A** (147 of 160): "For expert-led B2B firms whose best thinking is stuck in calls and proposals. We make it visible to the right buyers, then learn from who responds."
  - **Threads, version A** (135 of 150): "For expert-led B2B firms: your best thinking is stuck in calls. We make it visible to the right buyers, then learn from buyer response."
  - **LinkedIn tagline, version A** (110 of 120): "For expert-led B2B firms: the expertise in your calls, made visible to the right buyers before the sales call."
  - For version B, swap the buyer phrase exactly as PROFILES.md describes.

**F3. Instagram bio (reserve only).**
- There is no problem line.
- "You talk. You record. You approve. You sell." cuts a canonical line that BRAND_GUIDELINES §6 says to use word for word.
- "See how it works below." points at an empty link field.
- Suggested (133 of 150; line breaks counted):

  > For expert-led B2B firms.
  > Your best thinking is stuck in calls.
  > We make it visible to the right buyers, then learn from who responds.

  Add "See how it works below." only once the link loads.

**F4. TikTok bio (reserve only).**
- 80 characters cannot hold all four tests, so use the bio for buyer and problem, and let the pinned video carry the mechanism.
- Suggested (69 of 80): "For expert-led B2B firms whose best thinking is stuck in sales calls."
- Drop "How it works:" until the website field exists and loads.

**F5. The pinned mechanism needs a picture on LinkedIn.**
- LI-3 is 30 words of arrows ("evidence → idea → … → next test"). In a feed, an image of the loop reads in three seconds; the arrow text does not.
- Attach a loop diagram drawn to BRAND_GUIDELINES §5: ink on paper, with the marigold thread on the one path, and the labels as live text beside the image, not inside it.
- The same image serves the X-3 and TH-3 pins.

**F6. The avatar and name carry no meaning on their own.**
- The mark and "Threadline" do not say what the company does, so the bio's first line carries tests 1 and 2 on every platform.
- Keep every bio **buyer-first**. All the drafts already do this; the pack's original "Short bio" did not (PROFILES §7).

**F7. There is no proof slot, and that is correct.** Do not fill the social-proof gap with the site's "100m+ / 10,000+" (PROFILES gate 4). The mechanism is the credibility at launch. Add a proof line only from a permissioned entry in the proof bank (PROOF_BANK_AND_CLAIMS_REGISTER §D).

**F8. YouTube banner.** The kit has none (PROFILES, Assets). A blank header is acceptable while the channel is reserve-only. Before the first upload, the banner should carry the buyer line, because YouTube shows it before the description.

### Re-test before the first post

Run the test logged out, on a phone and on a desktop, for each active profile (PROFILES security checklist, last item). Record pass, weak or fail per question in the asset register, with the date.
