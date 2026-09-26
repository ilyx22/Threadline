# Newsletter graphics (launch pack, deliverable E)

Ten brand-led explanatory graphics for the Threadline newsletter, LinkedIn and sales follow-ups. Each uses a different diagram form, so no two read as the same template.

**Status of all ten: drafted; owner review pending.** None has been published or sent.

![Contact sheet](contact-sheet.png)

[Contact sheet (HTML)](contact-sheet.html)

## Rules these follow

- **Brand-led.** No founder name or face, no testimonials, no client results, no pricing, no promised outcomes.
- **Nothing presented as data.** The only proportions (graphic 04) and the example objections (graphic 08) are labelled *illustrative* on the image. The funnel shapes in 06 carry the note "Shapes show the order, not quantities."
- **Four-week periods.** Graphic 10 never uses the word "monthly".
- **Doctrine wording.**
  - Graphics 02, 05 and 10 follow the approved sales-script library (SOP 03, sections I, J and K).
  - The root idea in 07 is thesis 2 from the Brand-Led Content Launch Pack V1 (a draft pending founder review).
- **PESTO** (graphic 04) is attributed as "PESTO content mix, after Marcos Ruiz (Vantage)" and shown as an adjustable mix, not an equal split. The letter meanings are the ones the product already uses (`src/lib/ai/generators.ts`: personal, expertise, social_proof, trending, opinion).
  - **Owner check:** confirm this expansion matches Marcos Ruiz's own usage before public attribution. The repo defines it; no external source was consulted.
- **Vector and code only.** No image generation was used. All text and diagrams are SVG.
- **Brand tokens.**
  - Palette from `src/styles/marketing-v9/index.css`.
  - Type: Instrument Serif headings and Inter text.
  - One 3-unit line weight throughout.
  - The Threadline mark is reproduced from `src/components/brand/logo.tsx`, not redrawn.
- **Legibility.**
  - Body labels are 24–36 px on a 1200 px canvas, so 12–18 px when an email shows the image at 600 px.
  - Headlines are 72 px. Each graphic keeps its text to a few short lines so it still reads on a phone.
  - All 20 exports and the contact sheet were rendered in headless Chrome and inspected. Crossing lines, cramped arrows and a misplaced label were fixed and re-rendered.

## Editing and re-exporting

1. Edit the words or layout in `build.py` (one function per graphic), then run `python build.py`. This rewrites `src/*.svg` and `render/*.html`.
2. Run `sh render.sh` to re-export the PNGs and the contact sheet with headless Chrome. Set `CHROME=` if Chrome is not at the default Windows path. Fonts load from Google Fonts, so rendering needs a network connection.
3. The SVGs are self-contained. Each opens directly in a browser or Figma/Illustrator; install Instrument Serif and Inter locally if the editor does not fetch web fonts.

## The graphics

### 01-expertise-to-qualified-demand-journey

- **Diagram form:** Journey
- **Source (editable):** [`src/01-expertise-to-qualified-demand-journey.svg`](src/01-expertise-to-qualified-demand-journey.svg)
- **Exports:** [`export/01-expertise-to-qualified-demand-journey-1200.png`](export/01-expertise-to-qualified-demand-journey-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/01-expertise-to-qualified-demand-journey-1080.png`](export/01-expertise-to-qualified-demand-journey-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** A thread runs through eight numbered steps. Inside the firm: 1 expertise captured from calls, notes and decisions; 2 positioned for one buyer and one expensive problem; 3 expressed in the founder's voice in native formats; 4 distributed where those buyers already read. In the market: 5 the right buyers notice; 6 trust builds through repeated, useful, specific pieces; 7 they respond with a reply, a visit or a referral; 8 a qualified conversation, the outcome that counts.
- **Suggested use:** Newsletter opener on what Threadline does; LinkedIn company-page post; the how-it-works section of a sales follow-up email.
- **Status:** drafted; owner review pending

### 02-diagnosis-improvement-loop

- **Diagram form:** Loop
- **Source (editable):** [`src/02-diagnosis-improvement-loop.svg`](src/02-diagnosis-improvement-loop.svg)
- **Exports:** [`export/02-diagnosis-improvement-loop-1200.png`](export/02-diagnosis-improvement-loop-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/02-diagnosis-improvement-loop-1080.png`](export/02-diagnosis-improvement-loop-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** A loop of five stations: Score (rate the piece against a stated rubric), Explain (which parts carried it), Diagnose (idea, packaging or distribution), Prescribe (change one variable), Retest (read it again on the same root idea). At the centre: expected versus actual, with the expectation frozen before publishing. Each cycle logs what we believed, what happened, which assumption failed and what changes next.
- **Suggested use:** Newsletter section on how content is judged; four-week review explainer; the diagnosis step on a sales call (screen-share).
- **Status:** drafted; owner review pending

### 03-human-ai-draft-human-review

- **Diagram form:** Swimlane
- **Source (editable):** [`src/03-human-ai-draft-human-review.svg`](src/03-human-ai-draft-human-review.svg)
- **Exports:** [`export/03-human-ai-draft-human-review-1200.png`](export/03-human-ai-draft-human-review-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/03-human-ai-draft-human-review-1080.png`](export/03-human-ai-draft-human-review-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** Three lanes: founder, AI drafting, Threadline team. The founder talks and records the raw expertise; the AI writes a first draft from that source and the Brand Brain; the Threadline team checks facts, voice, claims and evidence; the founder approves that exact version, which is the gate; the team publishes only what was approved. The AI drafts and never publishes. A draft changed after approval comes back for approval.
- **Suggested use:** Answering the AI objection (newsletter, LinkedIn, sales follow-up); onboarding guide on approvals.
- **Status:** drafted; owner review pending

### 04-pesto-content-mix

- **Diagram form:** Proportional bars
- **Source (editable):** [`src/04-pesto-content-mix.svg`](src/04-pesto-content-mix.svg)
- **Exports:** [`export/04-pesto-content-mix-1200.png`](export/04-pesto-content-mix-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/04-pesto-content-mix-1080.png`](export/04-pesto-content-mix-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** PESTO content mix, after Marcos Ruiz (Vantage): Personal (a story from your own experience), Expertise (how the work is actually done), Social proof (only with permission, never invented), Trending (a current event read through your lens) and Opinion (a position you would defend to peers). A dashed bar of five equal slices is marked 'not the goal'; a second bar shows one client's illustrative weighting, led by expertise and opinion. Weights follow the evidence for each client and change.
- **Suggested use:** Newsletter section on content mix; client onboarding on how the mix is chosen. Keep the 'illustrative' footer tag.
- **Status:** drafted; owner review pending

### 05-content-plus-outbound-system

- **Diagram form:** Layered stack
- **Source (editable):** [`src/05-content-plus-outbound-system.svg`](src/05-content-plus-outbound-system.svg)
- **Exports:** [`export/05-content-plus-outbound-system-1200.png`](export/05-content-plus-outbound-system-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/05-content-plus-outbound-system-1080.png`](export/05-content-plus-outbound-system-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** A stack of layers under one destination, market memory: when a buyer has the problem, your name comes to mind. From the top: organic content creates familiarity and authority; outbound reaches specific buyers directly; the profile and content library prove competence when prospects check you; paid, dashed as later, only once message and proof are strong; attribution shows which combinations move buyers; the learning loop improves every layer each cycle.
- **Suggested use:** Newsletter on acquisition; sales call when a prospect asks whether content alone is enough.
- **Status:** drafted; owner review pending

### 06-views-attention-qualified-demand

- **Diagram form:** Funnel contrast
- **Source (editable):** [`src/06-views-attention-qualified-demand.svg`](src/06-views-attention-qualified-demand.svg)
- **Exports:** [`export/06-views-attention-qualified-demand-1200.png`](export/06-views-attention-qualified-demand-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/06-views-attention-qualified-demand-1080.png`](export/06-views-attention-qualified-demand-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** Three stacked tiers narrowing downwards. Views: someone's feed showed it; easy to count, says little. Attention: the right person stopped and stayed; harder to see, worth more. Qualified demand: a buyer who fits asked to talk; rare, the point. Beneath: 'Views are an observation, not an outcome.' The shapes show order, not quantities.
- **Suggested use:** LinkedIn post; newsletter on measurement; reply to the 'we got views but no clients' objection.
- **Status:** drafted; owner review pending

### 07-one-idea-native-formats

- **Diagram form:** Fan-out
- **Source (editable):** [`src/07-one-idea-native-formats.svg`](src/07-one-idea-native-formats.svg)
- **Exports:** [`export/07-one-idea-native-formats-1200.png`](export/07-one-idea-native-formats-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/07-one-idea-native-formats-1080.png`](export/07-one-idea-native-formats-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** One root idea at the top, 'More content can't fix unclear positioning', branches along a single thread into six native formats: a short video that shows it in under a minute, an X post with the argument kept tight, a LinkedIn decision memo, a Threads conversation opener, a diagram of the mechanism, and a YouTube piece with the full depth. Every piece keeps its root idea's ID, so the learning adds up.
- **Suggested use:** Newsletter on repurposing; LinkedIn post; onboarding (how one recording becomes several pieces).
- **Status:** drafted; owner review pending

### 08-sales-objections-to-content

- **Diagram form:** Mapping table
- **Source (editable):** [`src/08-sales-objections-to-content.svg`](src/08-sales-objections-to-content.svg)
- **Exports:** [`export/08-sales-objections-to-content-1200.png`](export/08-sales-objections-to-content-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/08-sales-objections-to-content-1080.png`](export/08-sales-objections-to-content-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** Flow across the top: heard on a call, logged, becomes a piece, seen before the next call. A table of illustrative examples follows. 'We tried content. It got likes, not clients.' is logged as proof and becomes 'Why views mislead, and what to read instead'. 'AI content all sounds the same.' is logged as AI and becomes 'How a human check keeps your voice yours'. 'I don't have time for this.' is logged as time and becomes 'What you actually do: talk, record, approve, sell'. 'Can't we just post more?' is logged as alternatives and becomes 'Why more volume can amplify the wrong thing'.
- **Suggested use:** Newsletter on sales-to-content; sales call on how call notes feed content. Keep the 'illustrative' footer tag.
- **Status:** drafted; owner review pending

### 09-what-implementation-establishes

- **Diagram form:** Checklist blocks
- **Source (editable):** [`src/09-what-implementation-establishes.svg`](src/09-what-implementation-establishes.svg)
- **Exports:** [`export/09-what-implementation-establishes-1200.png`](export/09-what-implementation-establishes-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/09-what-implementation-establishes-1080.png`](export/09-what-implementation-establishes-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** Six ticked blocks: what implementation establishes. Positioning: who it is for and the expensive problem. Brand Brain: beliefs, stories, proof and limits, confirmed by you. Voice guide: how you sound and what you would never say. Workflow: who records, reviews and approves, and when. Measurement: the baseline and what we read each period. First content: the first pieces in production. Set up once, at the start; everything after runs on it.
- **Suggested use:** Proposal / post-call follow-up explaining implementation; welcome email; newsletter.
- **Status:** drafted; owner review pending

### 10-four-week-review-cycle

- **Diagram form:** Calendar / timeline
- **Source (editable):** [`src/10-four-week-review-cycle.svg`](src/10-four-week-review-cycle.svg)
- **Exports:** [`export/10-four-week-review-cycle-1200.png`](export/10-four-week-review-cycle-1200.png) (1200 x 1500; web and email, display at 600 px wide) · [`export/10-four-week-review-cycle-1080.png`](export/10-four-week-review-cycle-1080.png) (1080 x 1350; LinkedIn and mobile feeds)
- **Alt text:** A calendar of four-week periods. Period 1, weeks 1 to 4: establish and calibrate. Period 2, weeks 5 to 8: refine and correct. Period 3, weeks 9 to 12: compound and concentrate. Period 4 onwards, dashed: compound harder. Each period ends in a four-week review. The first engagement is periods 1 to 3, twelve weeks. Every review follows the same four headings: action (what we did), results (what happened), problems (what went wrong) and future (what changes next).
- **Suggested use:** Proposal and post-call follow-up (engagement shape); onboarding guide on the review rhythm.
- **Status:** drafted; owner review pending

