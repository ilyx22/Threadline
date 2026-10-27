# Research pilot: AI consultants on LinkedIn (27 Oct 2026)

Status: internal. A manual run of the R3 flow (spec: SPEC_2026-10-27_KNOWLEDGE_BASE_AND_AUTO_RESEARCH.md)
using Claude Max, at no API cost. Test niche only; this is not the D01 decision.
Everything here is other people's content: patterns only, never presented as Threadline's results.

## Method

- **LinkedIn:** public guest pages only. No login and no account. Covers 15 creators and 43 posts,
  late Sep–27 Oct 2026. Each post's outlier score is its reactions divided by the median of that
  author's other captured posts.
- **YouTube:** 10 channels and 25 videos, Aug–Oct 2026. YouTube itself was blocked (consent wall),
  so views came from third-party trackers (SponsorRadar, OutlierKit), with two spot-checks against
  YouTube. Each video's outlier score is its views divided by the channel's recent median.
- **LinkedIn platform research:** LinkedIn's March 2026 feed update and its engineering paper, plus
  vendor benchmarks (AuthoredUp, ContentIn, Metricool, RevBoss, Socialinsider) and van der Blom's
  2026 report (read secondhand only).

## What is winning (the patterns backed by both sources)

1. **A client scene as proof, client unnamed.** Show a scene from real work (a request turned down,
   a room of 73 Heads of AI, a 46-person firm rebuilt in 4 days), then the lesson.
   - LinkedIn: Vashishta about 2.5×, Shove about 3×.
   - YouTube: Ottley's case study 5.3×.
   - This is the pattern most native to consultants.
2. **A hard number in or near the hook,** such as firm size, days, money, or count.
   - LinkedIn: 111,000 attacks; 73 Heads of AI; "90+ slides, 7 exercises".
   - YouTube: "$297/mo" at 12×; "$10,000 websites" at 4.9×.
3. **A contrarian or alarm first line, written as an observation from the field.** Examples:
   "I'm seeing…", "Stop thinking…", "Everything you know about X is outdated".
   - Back it with one fact.
   - End on a real question, not "comment YES" (LinkedIn now demotes engagement bait).
4. **Small decision frameworks:** a 3-tier rule, or 3–10 numbered items. Give the reader a rule to
   use, not a list of tools. Readers add their own items in the comments.
5. **AI applied to one job function** ("X vs Y vs Z", "you do X, top people do Y"). It beats
   general AI news. Finance creators showed 5–6×.
6. **"I tested it so you don't" and curation with proof of effort** ("tried 100+, these 6").
   - These are strong on YouTube.
   - On LinkedIn, make them a carousel or multi-image post and write them for buyers.
7. **Personal milestones and gratitude** (book arrived, packed room, "someone I admire read this").
   These are the biggest multiples for mid-size consultants. Use them sparingly; they build
   affinity, not leads.
8. **Short, debatable claims of 45–120 words** draw comments equal to or above reactions. Bare
   questions or polls with no position flop.
9. **Soft or missing calls to action.** Promotion goes after real value, as a P.S. or in the
   first comment.

## What underperforms

- One-line reshares of news or model launches.
- Podcast, article or YouTube link drops.
- Webinar and registration promos: 2–28 reactions on a 1M-follower account.
- Abstract thesis posts with no scene or number.
- "I enjoyed presenting at…" recaps.
- Bare polls.

## Format and frequency (platform research)

- **Format:** on personal profiles, visual formats (document/carousel, multi-image, image) beat
  text-only, but the gaps between visual formats are small. Long text of 1,000+ characters gets
  about 1.18× reach; the sweet spot is 900–1,700 characters.
- **Video:** video only helps when it matches the post text.
- **Links:** the penalty for a link in the post is modest or missing on personal profiles, and the
  evidence is contested.
- **Frequency:** 2–4 posts a week is enough.
- **Timing:** about half of impressions arrive within 48 hours.
- Note that the outliers we sampled were mostly text-only, but guest view hides images, so this
  sample undercounts visual posts.

## Buyer audience versus builder audience (important for Threadline)

The biggest YouTube multiples (6–10×) came from newsjack and "I tested" videos on builder-facing
channels. Those audiences are other builders, who don't buy consulting. Buyer-attracting angles
are patterns 1, 2 and 5, plus anonymised audits and teardowns. The research engine must therefore
score buyer relevance, not just outlier size. That matches the existing `buyerRelevance` and
`commercialIntent` fields on ResearchExample.

## Limitations

- LinkedIn's anti-bot block hit about half of the profile fetches, mostly smaller agency founders,
  so the sample leans towards established advisors.
- No repost counts were available.
- Outlier scores come from 5–20 items per creator, so they are directional only.
- YouTube views are third-party scrapes.
- Hooks are first lines and titles only; no captions or visuals were analysed.

## What this tells us about building R3–R8

- **Public LinkedIn is reachable for roughly half of creators.** The auto version needs a paid
  scraper (Apify) or a manual import (pasting a URL and its numbers) for the rest.
- **YouTube needs the official API** (free quota), not page fetches.
- **Visual analysis (R6) needs the actual media.** Titles alone hid format and thumbnails here.
- **Buyer-relevance scoring is essential**; otherwise builder-audience outliers dominate.

## Source posts and videos

The full tables, with per-post URLs, reaction and comment counts, and outlier multiples, are in
the two subagent reports in session c1689ce0 (27 Oct 2026). The headline examples are:

- **LinkedIn:**
  - Vashishta "AI psychosis" (~19 Oct).
  - Grennan "Stop thinking the fix for AI adoption…" (~23 Oct).
  - Shove "73 Heads of AI" (late Sep).
  - Aharonoff "Budget vs actuals vs rolling forecast" (26 Oct).
  - Miller "hardest parts of running AI agents" (~18 Oct).
- **YouTube:**
  - Erhart, free website then $297/mo (EJ8sQIBEwRk, 12.1×).
  - Ottley, 46-person accounting firm (IXDYEF22CG8, 5.3×).
  - Saraev, viral GitHub repo test (dAzs_rU6080, 10.1×).
