# Playbook and landing page audit (26 September 2026)

The owner's questions: is the Playbook harder to follow than the best comparable resources (one big button, one thing per screen, several pieces folded into one)? Is the landing page too long, and is anything on it unnecessary or repeated? Should the site show results? Does it need an FAQ? Measured on the production build at 1440px and 390px.

## 1. The Playbook

### What was making it hard to follow

| Finding | Measurement | Why it costs attention |
| --- | --- | --- |
| Three navigation devices before chapter 1 | the ten-tile chapter map, the maxims marquee, the 1 to 10 rail | The reader is asked to choose three times before reading anything |
| All ten chapters on one scroll | 12,500px at 1440, 17,800px at 390 (about 20 phone screens) | There is no sense of "where am I" and no moment of completion; people skim and leave |
| Every chapter is four things | the idea, a card to turn, "do this today", an interactive object | Four decisions per chapter, ten chapters: forty decisions |
| The interactive objects are all different | crates, a sentence, drawers, a sorter, rooms, a scrubber, a ladder, a card, the bench, flip cards | Each one has to be learned; the best resources repeat one interaction |
| No single next action | the chapter ends and the next heading begins | The reader has to decide to continue instead of being carried |

### What changed today (approved: "if there's any way to make mine super easy to follow, please do")

- **One chapter at a time.** With scripting, only the current chapter shows. The bottom of every chapter is one large button: "Next · 02 Positioning is a decision, not a discovery". Back is a quiet secondary. The last chapter's button leads to the two tools. Without scripting all ten chapters render in order, as before, so nothing is lost.
- **The rail and the chapter map drive it.** Tapping a number or a tile jumps to that chapter (they set the hash; the stepper follows). Reading progress still counts once a chapter has been on screen.
- **The maxims marquee is gone** from the Playbook. It was decoration between two navigation devices.
- Page height at 390px drops from about 17,800px to one chapter's height (about 1,700px) plus the tools.

### What I recommend next, but did not do (your call)

- **Fold "the idea" and "the card to turn" into one.** The card's question is usually the idea's own objection. One card, question first, answer on tap, would cut each chapter from four things to three.
- **One interaction pattern for most chapters.** Keep the four that earn their difference (the crates, the sentence builder, the bench, the flip cards) and render the other six as the same tap-to-reveal card set. Fewer things to learn, and the page reads as one product.
- **Ten is a lot.** Chapters 6 (repeated exposure) and 7 (measure what the buyer did) could fold into 5 and 8. Eight chapters, eight steps on the rail.

## 2. The landing page

### Length

| Width | Before today | Now (with the track record and the FAQ) |
| --- | --- | --- |
| 1440 | 10,100px, 12 sections | about 11,000px, 14 sections |
| 390 | 10,500px | about 11,600px |

That is long for a landing page, but it is a sales page for a considered purchase, and every section is doing a different job. The problem is not the count; it is repetition inside three of them.

### Repeated or unnecessary, with a request for permission to remove

I have not removed any of these. Say which, and I will take them out the same day, in a way that can be put back.

| Candidate | Where | Why it is repeated or unnecessary | Saving at 390px |
| --- | --- | --- | --- |
| **The ticker strip** ("The expertise already exists. Today it lives in delivery notes, Slack threads…") | between the hero and the visibility gap | Decorative. Its point is made by the gap section that follows, and the marquee at the foot now carries the wordmark | about 180px |
| **The four capsules** (Talk, Record, Approve, Sell) | How we'll work together | The hero lead says "You talk, record when useful, approve and sell", the section headline says it again, and the FAQ now answers "What do you need from me?". The eight-jobs tile beside them is the part that adds information | about 520px |
| **The route line** ("Useful encounter → Recognised → Remembered → Asked → A conversation") | under One idea, multiple formats | The five encounters in "What we build instead" already show this arc with pictures | about 90px |
| **The six-station rows** | Our curated system | How it works covers the same six stations with the interactive line. On the homepage a single row of six small tiles would say "there is a system" without re-explaining it | about 700px on phones |
| **"Read the full fit description" and the like** | the "read more" links under sections | Each pulls the reader off the page before the closing; the nav already carries the pages | about 40px each |

If you approve all five, the phone page drops by roughly 1,500px, about two screens, with no idea lost.

### Order

The current order is right: problem (the gap) → what we build (memory) → how we work → the system → the formats → how we learn → the engagement → questions → close. The track record now sits straight after the hero, where a first-time visitor decides whether to keep reading.

## 3. Results

Added today, as a band straight under the hero, from the numbers you gave me:

> Built by someone who has done it. **100m+** views (reach we know how to get). **10,000+** conversions (what that reach was for). The founder's own numbers, across his own and client work. Not Threadline client results, which we will show when a client agrees.

Two things to confirm before this stays up:

1. **The attribution.** I have written "the founder's own numbers, across his own and client work". If some of those views or conversions came from work for employers or clients you cannot name, that wording holds; if they are entirely your own channels, say so and I will tighten it.
2. **What "conversions" means.** Enquiries, sign-ups, sales, booked calls? A buyer will ask. One word in the label ("10,000+ booked calls", "10,000+ enquiries") is stronger than "conversions" and safer.

I have kept the site's own doctrine intact: views are shown as proof of reach, conversions as the thing reach is for, and the line says plainly that these are not client results.

## 4. FAQ

Yes. A considered buyer arrives with the same eight questions, and answering them on the page is cheaper than answering them on the call. Added today, before the closing, as tap-to-open cards:

1. What do you need from me?
2. Do I have to be on camera?
3. Which platforms?
4. How long before it works?
5. What does it cost?
6. Do you guarantee leads?
7. Who owns the content?
8. Are you an agency?

Every answer is drawn from copy already on the site, except two that are commercial terms only you can confirm: **cost** ("Commercial terms are discussed on the call, once we both know it fits") and **ownership** ("You do. Every piece, transcript and asset lives in your workspace and stays yours"). If either is not what you intend to offer, tell me and I will change or remove it.

## 5. Verification

- Type-check and lint clean.
- The marketing suite's section count is updated to twelve; the illustrative-label check is satisfied by the stage's stamp.
- Screenshots at 1440 and 390 in `scripts/qa/.shots/pass13/`.

## 6. "Do what's best" (the owner's reply, 26 September)

Done the same day:

- Landing: the ticker strip, the four capsules, the route line and the learning section's "read more" link are removed; the six stations are one row of six small tiles (three on tablets, two on phones). The apply link under the engagement stays, because it converts. Eleven sections.
- Playbook: the card to turn now sits inside the idea, so each chapter is three things: the idea (with its question), do this today, and the interactive object.
- Left alone, on purpose: rebuilding six of the interactive objects as one pattern, and merging chapters 6 and 7, because both mean rewriting content blind. The track record's attribution and the meaning of "conversions", and the two commercial FAQ answers, still need the owner's word.

## 7. After reading the reference playbook (26 September, later)

What the reference does that ours did not: every section is one claim as the title, one line under it, and exactly one interaction with an imperative in the copy. No chapter numbering competing with the content, no idea box, no card, no separate "do today" box. Scrolling carries the reader; the interactions are the buttons.

Applied to ours the same day, in our own words and our own objects:

- Each chapter is now: the object, a small number, the title as the claim, the key idea as one lead line, the interactive object at full width, and one "Do this today" line under it. The idea box, the card to turn and the "do today" box are gone from the page (the card answers stay in the content file).
- The long scroll is back and the stepper is removed: with one thing per chapter the page reads as a rhythm, and hiding chapters broke it.
- The hero's four figures count up when seen: 100m+ views, 10,000+ conversions, 10 chapters, 0 vanity metrics. "15 minutes, fully interactive."
- Two lines the owner suggested were the reference site's own words. The site's clean-room rule (composition and behaviour only, never copy) means they are used in our own words: "Slow on day one. Inevitable by day ninety." on the homepage engagement, and the playbook closing "This playbook is the fifth of the system we can give away. If you run a 7, 8 or 9-figure firm and want the other four-fifths run for you, book a call."
- The diagnose tool's seven station chips are removed; the panel already names the station.
- The track record is two figures on one line under the hero. It stays under the hero rather than above it: proof after the promise reads as evidence; proof before the headline reads as a banner and pushes the headline below the fold on phones.

## 8. The landing page against the reference agency's homepage (structure only)

What their page does that ours now does or could do:

| Their structure | Ours | Action |
| --- | --- | --- |
| A proof line straight under the hero | The 100m+ / 10,000+ band | Done |
| The button repeated after each block | Asked only at the top and the bottom | Added one mid-page ask after the formats section |
| Client video testimonials | None | Needs real clients; nothing will be invented |
| A logo strip ("trusted by") | None | Needs real, permissioned logos |
| FAQ covering start time and contract length | FAQ has neither | Needs the owner's terms: onboarding days, contract length |
| A short "about us" origin story | None | Could be one paragraph in the owner's words |

## 9. The owner's decisions (26 September, evening)

- Playbook: chapters 6 and 7 merged. "Distribution is a place, not a blast" now carries the familiarity idea; "Expect first, then measure what the buyer did" carries the evidence idea. Eight chapters. The two old addresses redirect permanently.
- FAQ: "How fast can we start?" (10 to 14 days of onboarding) and "Is there a long contract?" (month to month, twelve weeks recommended), taken from the reference agency's terms for now at the owner's instruction, pending Threadline's own.
- Hero: the picture pans slowly back and forth along the line (22 seconds each way); the thread overlay moves with it. Off under reduced motion.
- Left as is at the owner's word: "conversions", testimonials and logos, the entity details.
