# V5 — Current failure audit (public homepage v4)

Date: 19 September 2026. Subject: the deployed homepage at commit `ea12201` (`src/app/(marketing)/page.tsx`, components in `src/components/marketing-v4/`, copy in `src/content/marketing-site.ts`, styles in `src/styles/marketing/`). Owner verdict: the visual result is rejected. This document records why, what survives, and what is retired.

## 1. Before-state captures

Full-page captures from the v4 visual baseline (`qa-baselines/public/`, taken 12 September on the production build), copied unchanged:

| Width | File |
|---|---|
| 1440 | `docs/design/v5/before/before-1440-home.jpg` |
| 1024 | `docs/design/v5/before/before-1024-home.jpg` |
| 768 | `docs/design/v5/before/before-768-home.jpg` |
| 390 | `docs/design/v5/before/before-390-home.jpg` |
| 320 | `docs/design/v5/before/before-320-home.jpg` |

What the 1440 capture shows, top to bottom (page height about 14,000 px):

- Hero, vault and memory render. Each scene occupies a small fraction of its panel; the memory panel is mostly empty paper around a cluster of dots.
- The six-cell grid does not render at all: a blank bone region.
- The night burden band renders four large verb cards in the upper half; the lower half of the band is empty navy.
- The Authority Workshop is a blank paper panel roughly 1,900 px tall. None of the six tiles is visible.
- The expressions panel renders (thesis card and two rail cards).
- From movement to fit (about 3,000 px: staircase, instrument, twelve-week band, comparison, fit) the page is almost entirely blank bone with a few stray labels and a legend.
- Closing panel and footer render.

Roughly half the page height is empty in a full-page capture. The cause is reveal-gated content: sections start at `opacity: 0` and wait for an `IntersectionObserver` that a capture, a no-JS client or a fast scroll never fires. The 390 capture shows the same pattern over 16,000 px.

## 2. Frame: the owner's ten points

1. No realised visual world; a component vocabulary instead.
2. Graphics too abstract and too quiet.
3. Cards are the default answer.
4. Designed from components outward, not scenes outward.
5. Negative space is absence, not tension.
6. Motion assembles UI objects rather than advancing a world.
7. The bone + cobalt + vermilion palette is rejected.
8. Not captivating; no pull through the first minute.
9. The full-page experience is fragile (blank reveal-gated regions).
10. It meets its checklist more than the emotional bar.

## 3. Section by section

| Section | Single idea | What the visual actually is | Why it fails (points) |
|---|---|---|---|
| Hero | Expertise becomes visible before the call | Five stacked paper slabs with mono labels, a cobalt "AUTHORITY" slab, three small content frames, six buyer dots, two vermilion capsules, a thin curve | 1, 2, 4. A small abstract machine beside the copy. Without the timeline and labels it reads as UI parts. Nobody appears in it. |
| ProblemSection | The firm knows more than the market sees | Fourteen labelled chips on navy, two chips and one dot on bone | 2, 3, 5. The asymmetry is argued by chip count. The light half is empty rather than sparse-with-purpose. |
| MemorySection | Familiar, not famous | Twelve hollow circles, one turning vermilion, five stamps on a progress line | 1, 2. The owner's named example: a field of circles. No person, no context, no encounter. |
| ValueGrid | The system in six facts | 3 × 2 rounded cards, one cobalt | 3, 9. A card grid, and blank in the capture. |
| BurdenSection | Calm founder, busy system | Four giant rounded cards with one verb each, scrolling mono labels, task chips that fly off | 3, 5, 6. The relief is asserted by typography. Half the band is empty navy. |
| WorkshopSection | How the system works | Six tinted tiles, each with miniature tokens that slide on hover | 1, 3, 4, 9. The centrepiece is six boxes, and invisible in the capture. |
| ExpressionsSection | One idea, the right expressions | A thesis card and a horizontal rail of content-frame cards | 3. A carousel of cards; the idea-precedes-format point is carried by copy. |
| MovementSection | Reach is not the result | Five descending rounded plates with a moving dot | 2, 6, 9. Numbered boxes in a staircase; no buyer, no conversation. |
| DiagnosisSection | Expected → actual → why → change → retest | A dashboard instrument: tabs, three gauges, component chips, a slider | 1, 4. The strongest interaction on the page, presented as product UI. |
| CycleSection | Learning concentrates over twelve weeks | Grey dots fading, three stacks of cobalt bars, four text columns | 2. A chart without a subject. |
| ComparisonSection | Threadline covers the whole loop | Five rounded rows of circle slots | 5. Clear, but a sparse spreadsheet in a wide empty field. |
| FitSection | Who it is for | Two columns of stacked verdict cards with ticks and crosses | 3. Thirteen near-identical cards. |
| ClosingSection | The market should see enough of it | Dark rounded panel: headline, CTA, stack of slabs, dots, three frames | 1, 3. A CTA card above the footer; the callback is to slabs. |

Across the page: eleven of thirteen sections follow eyebrow → serif headline → paragraph → object cluster. Surfaces share one radius, one offset shadow and one border treatment. No character with a face appears anywhere.

## 4. Worth keeping

- **Narrative order**: problem → desired outcome → low founder burden → system → commercial movement → learning → comparison → fit → action.
- **Copy** in `marketing-site.ts`: the hero headline and audience line; "We are not trying to make you famous…"; "You talk. You record. You approve. You sell. Threadline handles the machine."; "One idea. The right expressions."; "Reach is not the result."; the twelve-week note about learning versus the algorithm; the comparison rows and their hedged capability wording; the fit lists; the closing pair of sentences.
- **The diagnostic state machine** (`DiagnosisSection.tsx`): three illustrative cases, five states, failing component, the lever that must pass a threshold, auto-run until touched, keyboard operation. The logic moves to an illustrated bench; the dashboard skin does not.
- **The acquisition model** (`src/lib/domain/acquisition-model.ts`, 9 tests) and the Playbook tools.
- **Honest labelling**: "illustrative" on every synthetic thesis, score and case; no pricing; no proof claims; evidence classes.
- **Input-mode rule**: hover starts, click keeps, keyboard and touch toggle, focus only when `:focus-visible`.
- **Routes, metadata, application flow, sitemap, robots, `appUrl()`**: untouched by the rebuild.
- **Type families**: Fraunces, Inter, JetBrains Mono remain candidates, to be re-cut rather than assumed.

## 5. Retired

- Palette: bone `#F3F0E8` + cobalt `#1F3BD6` + vermilion `#E2432A` + night `#0E1330` as the dominant system.
- The slab / token / chip / frame / buyer-dot / gauge / slot vocabulary as the illustration language.
- The six-cell value grid as a 3 × 2 card grid.
- Four giant verb cards.
- Six workshop tiles.
- The expressions carousel rail.
- The numbered staircase plates.
- Verdict card piles.
- The dark rounded CTA panel as the closing.
- Opacity-gated reveals for essential content; any section that is blank before an observer fires.
- One shared radius, shadow and border recipe for every surface.
- `marketing.css` (generated) and `marketing-extra.css` as the creative source of truth.

## 6. Against the reference's principles

| Reference principle (see `V5_REFERENCE_SKELETON.md`) | Current Threadline |
|---|---|
| The hero illustration owns more than half the panel and is recognisable with the copy covered | The hero scene is a cluster of parts that needs its labels |
| Characters with faces carry every illustrated moment | No characters; circles stand in for people |
| Full-bleed landscape bands separate white panels and change the ground | Bands change colour, not landscape; most are flat fields |
| Tiles are used once, densely, with artwork bleeding out of them | Cards recur in nine sections, artwork contained inside |
| Whitespace surrounds one large focal object | Whitespace surrounds small clusters or nothing |
| Motion is looping scene animation; the page is complete without scroll triggers | Motion is staggered assembly; the page is half blank without triggers |
| One confident palette with an atmospheric field colour | A neutral ground with two accents used as states |

The reference is not better engineered. It is art-directed from scenes outward and it never depends on a trigger to exist. Those are the two gaps v5 has to close.
