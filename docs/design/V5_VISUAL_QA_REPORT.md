# V5 visual QA report — 19 September 2026

Two full screenshot-and-critique passes were made on the v5 homepage before any automated gate ran, then a third on the production build. Captures are in `docs/design/v5/after/` (`1440-*.jpg` desktop, `390-*.jpg` phone) and `docs/design/v5/explorations/` (the design lab: the kit, the three hero compositions). The before-state is in `docs/design/v5/before/`.

## The ten questions, per scene

Answers are for the final build after the review pass (eight scenes). "Card?" asks whether a card or grid crept in because it was easier.

| Scene | Single idea | Visual does the explaining? | Differs from the scene before? | Focal point in two seconds | Copy that could go | Card? | Could be generic SaaS? | Authored? | Advances the story? | Beside the reference? |
|---|---|---|---|---|---|---|---|---|---|---|
| Hero | Private expertise → visible to the right buyers, on one line | Yes: archive, press, pegged line, buyers, a reply coming back | — | The pegged line | None | No | No | Yes | Sets it | Holds |
| Problem + outcome | Dense inside, sparse outside; then "familiar, not famous" | Yes: the vault and the hatch; the frieze of one buyer across five encounters | Yes: full-bleed split, then a quiet typographic statement and a strip | The wall and the hatch; then the statement | The encounter list under the frieze was removed as repetition | No | No | Yes | Problem → desired state | Holds |
| What you receive | One illustrative idea through one four-week period: outputs, rooms, signals, decision | Yes: the engagement sheet with five knots on the thread | Yes: an editorial list beside a sticky sheet | The sheet | None; every step earns its line | The sheet is a document in the story | No | Yes | Makes the purchase tangible before the mechanism | Holds |
| Burden | Calm founder, busy machine | Yes: two rooms side by side | Yes: lilac field, two framed rooms | The founder in the armchair | None | The two rooms are framed panels; they are rooms, not cards | No | Yes | Relief | Holds |
| Workshop | One root object changed at six stations | Yes: the whole bench, six named stations, the carrier; the six captions are always listed | Yes: immersive night panorama | The carrier | None | No | No | Yes | Mechanism | Holds |
| Diagnosis | Expected → actual → why → change → retest | Yes: jars with expected marks, the tipped block, the hook | Yes: the mint bench, interactive | The tipped block | None | The readout is a sheet | No | Yes | Learning | Holds |
| Fit + comparison | A gate, two lists; then what surrounds the content | Yes: the gate; the abacus | Yes: paper-deep field, typographic lists, one device | The gate | None | The abacus is a device, not a table of cards | No | Yes | Fit and differentiation | Holds |
| Closing | The opening world, changed | Yes: the same scene with the line fuller, knots tied, two signals returning | Yes: night, the mega headline, the dusk panel | The headline | None | No | No | Yes | Callback | Holds |

No scene answered "yes" to "could be generic SaaS" or "embarrassing beside the reference" in the final pass.

## The review pass (length and purchase clarity)

The first v5 build had thirteen scenes and a sticky workshop track that added roughly three viewports of scrolling. The review pass cut the page to eight scenes: the tag strip, the Expressions arc, the commercial-movement street, the twelve-week loom and the standalone comparison were removed or folded (the market-memory statement and frieze now sit inside the problem section; the comparison abacus sits inside the fit section; the cadence sentence and the evidence-class language moved into the engagement example). A new "What you receive" scene shows one illustrative engagement before the mechanism. Page height: 1440-home 12,041 px (was 17,439 px at the first v5 build, −31%; v4 was 14,004 px); 1024 11,068; 768 13,304; 390-home 15,781 px (was 19,380 px, −19%; v4 was 18,632 px); 320 15,845 — from `qa-baselines/public/geometry.json`, production build of 19 September 2026. The phone page shortened less than the desktop page because the workshop captions, the engagement steps and the fit lists stack there; the sticky track that cost three viewports is gone at every width.

## The visual-quality upgrade (21 September 2026)

The owner kept the ideas and rejected the execution as children's-animation. This pass changed the drawing itself, not the colours alone: faceless architectural scale figures replace the cartoon people; one 1.6-unit line replaces the 2.15 outlines and 10.5-unit limbs; radii drop from 6–30 units to 1–4; the thread thins to 2.6 over a 4.4 hairline and ends on a knot, spool or pole in every scene; each scene uses paper, sky, parchment, wood and one lilac, with mint and coral reserved for states; speech bubbles, the "?" mark, the talking dashes and the sparkle marks are gone; every perpetual loop is gone. Full account in `THREADLINE_FRONTEND_V5_HANDOFF.md`.

Eye pass, three rounds on the production build, full pages and detail crops at 1440, 390 and 320 (`docs/design/v5/after/*-full.jpg` and the per-scene captures). Found and fixed on the way:

- The wide vault's first folder lost "CLIE" off the left edge — the folder row moved inside the canvas.
- The tall vault cut a folder, its label and the lamp at the phone frame's right edge — a `compact` variant drops them and the room sits 8 units in so "CLIENT CALLS" is whole; measured at 390: every label's box inside the frame.
- The closing scene's extra book overlapped the post — moved and scaled.
- The bench's five block labels were 8.5-unit free text — now 9-unit labels compressed to their block with `textLength`.
- The carrier's spool caption crossed the cart — a plate above the spool (kept from the previous pass) now clears the rear shelf.

Checked and accepted: the frieze's paper-headed figures on parchment (read by outline; low contrast at 320 by design); the workshop panorama on phones cutting a neighbouring station's tag at the frame edge (the pan, not a clipped label); the bench's density at 320–390 (the readout carries the reading).

## The final eye pass on the production build (19 September)

Made on the captures in `docs/design/v5/after/` (1440, 1024, 768, 390 and 320; the workshop at stations 1, 3 and 6). Found and changed: the carrier's spool caption ("ROOT THESIS", "ROOT THESIS · V2") sat under the bench top and crossed the cart's wheels at stations 2 and 6 — it is now a plate above the spool, under the rear shelf at station 6. At 320 the six station buttons wrapped five-and-one; below 360px the row now uses a 4px gap and runs 8px into each gutter so all six 44px buttons sit on one line. Checked and left: the muted palette and the Instrument Serif / Inter pairing read calmer than the first build and keep the ink line and the one marigold accent in charge; the engagement sheet is sticky beside the steps from 900px up and sits under them below that; the phone workshop shows one station per frame with its plate inside the frame and the six numbered buttons on their own row under the arrows; the bench remains dense at 320–390 (known limitation below). A note on the phone captures: the nav is sticky, so a viewport capture scrolled to the frame's top edge hides the station plate under the nav — the captures are taken 92px higher to show it; the plate itself is inside the frame (the suite measures it).

## What the first two passes found and changed

Pass one (desktop): station bins under the carrier at station 1; signal-tray labels overflowing; a stray black fill on the bench hook; folder labels cropped in the vault; grain filter panels showing on parchment scenes; the busy-machine art bottom-aligned leaving a dead lilac field; the seam thread crossing the tag strip; the closing scene identical to the hero.

Pass two (desktop + phone): the busy machine zoomed by `slice`; expression labels crossed by threads; the inspector covering the DESTINATION block; the phone vault too small to read; the gate art with a third of empty sky; the comparison header overlapping at 390; the nav CTA wrapping at 390; the loom illegible at 390 (now a diagram the visitor can pan); SVG bleed producing 17px of horizontal overflow at 1024 (the offending groups were pulled inside their viewBoxes; the artwork boxes stay `overflow: visible` so a drawn thread may cross a scene edge, and the tall vault's box is clipped because its clip-path already hides everything outside it).

## Composition rules, checked

- One obvious focal point per viewport: yes for every scene above.
- No more than two consecutive sections share a macro layout: the sequence is panorama · full-bleed split with a typographic statement and a frieze · list beside a sticky sheet · two rooms · panorama with captions · bench + panel · gate with lists and a device · panorama.
- No scene is headline + paragraph + card grid.
- Five silhouettes recognisable alone: the pegged line, the vault split, the engagement sheet, the workshop bench, the abacus (also the gate and the frieze).
- Three illustration-dominant scenes: hero, problem, workshop (also the frieze).
- One mostly typographic, quiet moment: market memory.
- One immersive full-bleed environment: the workshop (also the problem split and the closing).
- One transformation interaction: the bench (also the workshop carrier).
- Nothing starts hidden; the page reads with JavaScript off (the workshop shows the whole bench and all six captions; the bench shows Expected; the engagement steps are plain HTML).

## Automated gates on the production build

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Unit | `npm run test` | 634 / 634 |
| Build | `npm run build` (`NEXT_DIST_DIR=.next-qa`, beside a running dev server) | ok; `/` 10.3 kB, 116 kB first load; `/design-lab` → 404 in production |
| Marketing v5 | `npm run qa:marketing` | 53 pass · 0 partial · 0 fail (eight scenes; engagement example labelled; nothing hidden; ten labelled illustrations; workshop captions visible; dot click; ←/→/End on a focused station button move focus; no tabindex on the art; phone controls inside a 390 viewport at ≥ 44px; every station's plate inside the frame and the pan clamped to the artwork at 390 and 320; no horizontal overflow at 1440 / 1024 / 768 / 390 / 320; no-JS HTML carries the six station captions, Expected and the engagement steps; reduced motion renders every scene at opacity 1 with no running animation) |
| Public | `npm run qa:public` | 62 pass · 0 partial · 0 fail (eleven routes × twenty widths from 320 to 1440; brand-leak, placeholder, cadence, over-claim and price greps; application submit) |
| Visual | `npm run qa:visual` | baselines re-taken in `qa-baselines/public/` (heights above) |
| Browser sweep | `npm run qa:browser` | 101 pass · 21 partial · 0 fail (partials are the pre-existing empty-state screens in the product surfaces) |
| Web vitals | `npm run qa:vitals` | LCP 164 ms at 1440, 116 ms at 390; CLS 0.000 at both (local production server; a sanity check, not a lab score) |

## The verified mobile workshop defects, fixed

- At 390px the `.v5-stage-controls` row used to push the document to about 432px and clip the Next button. The controls now wrap (the six station buttons drop to their own centred row) and every control is 44px; the suite measures the Next button's right edge against the viewport and the document's scroll width after panning.
- The last station used to pan to 83% and leave most of the frame empty. The pan is now computed from each station's position and clamped so the window never passes the artwork's edge (`--pan` in `WorkshopStage.tsx`); the suite checks every station's plate sits inside the frame and the transform stays within bounds.
- The arrow-key handler used to sit on the non-focusable art. It now sits on the `role="group"` of station buttons: ←/→/Home/End move the station and move focus to that button; the suite dispatches keys on a focused button and checks focus followed.

## Known limitations

- The bench illustration is small at 320–390; the readout panel under it carries the reading.
- The design lab route exists only in development (`notFound()` in production, disallowed in robots).
- The phone captures were made with a 390-wide emulated viewport; sticky-nav behaviour was verified by measurement (top 0, position sticky) rather than by eye in every capture.
