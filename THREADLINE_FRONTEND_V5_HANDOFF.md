# THREADLINE — frontend v5 handoff (19 September 2026)

The public site was rebuilt as an illustrated Threadline world: an editorial authority workshop connected by one continuous thread, then reviewed and shortened to eight scenes with a concrete "What you receive" example. Branch `frontend/visual-rebuild-v5`; checkpoint before the work: tag `threadline-pre-v5-rebuild-2026-09-19`; the first v5 build is commit `5c69ab3`. Decision record DEC-026 in `docs/site/DECISIONS_LOG.md`.

Companion documents: `docs/design/V5_CURRENT_FAILURE_AUDIT.md`, `V5_REFERENCE_SKELETON.md`, `V5_THREADLINE_VISUAL_SYSTEM.md`, `V5_COMPONENT_MAP.md`, `V5_MOTION_SYSTEM.md`, `V5_VISUAL_QA_REPORT.md`; captures in `docs/design/v5/`.

## Homepage rebuild, second pass (24 September 2026, latest)

The owner rejected the first rebuild of the day (a dry editorial page of paper sheets and hairlines) as a regression and asked for a re-do against the Birdhouse example and the project's own history. What the owner keeps pointing at is the reference's composition and warmth: a pale canvas, one big white panel with a giant serif statement and a scene that runs off its edge, pill actions, pastel tiles that carry artwork, full-bleed illustrated bands with the next panel riding over them, a ticker, and a landscape to end on. The second pass rebuilds the front page on those mechanics and brings the illustrated Threadline world back into every scene, retoned brighter and warmer. Decision DEC-030; the clean-room rule of `docs/design/V5_REFERENCE_SKELETON.md` still holds (composition and behaviour only; no asset, character or copy from the reference).

### What ships

- **Files.** `src/components/marketing-v9/{Home,ExpressionsArt}.tsx`, `src/styles/marketing-v9/index.css`, `scripts/qa/marketing-v9.ts` (`npm run qa:marketing`). The scenes are the v5 illustrated components (`marketing-v5/art/*`, `Bench`, `Motion`), which read their colours from `--v5-*` variables; the `.v9` layout class retones them (white paper, brighter sky, mint, coral, lilac, butter, a marigold thread) and restyles the shared nav and footer (pale canvas, pill action, the wordmark's thread back). `WorkshopArt` gained `StationScene`, a cropped single-station window for the mosaic; `Person` carries a `v5-person` class so a tile can drop the figures. The v8 files (`src/components/home`, `src/styles/home`, `marketing-home.ts`) were removed; copy still lives in `src/content/home.ts` and, for the stations and the bench, `src/content/marketing-v5.ts`.
- **Composition.** Canvas `#e8f1f8`; white panels inset 30px with a 40px radius (12px / 28px on phones); container 1280; Instrument Serif at 5.4rem for the statement, 3.9rem for section headings, an italic serif audience line in the action colour; Inter body at 18px; one action colour (`#1f63d6`) for pills, links and marks; five pastels for tiles.
- **Sections.** Hero panel (copy left, the workshop press, the pegged line and the buyers cropped from the hero scene on the right, bottom-aligned, running off the panel); a ticker (italic line over a marquee of where the expertise lives today); the visibility gap as the full-bleed vault band masked into the canvas, with the market-memory panel riding 120px up over it (centred statement, the five-encounter frieze); the working relationship (four capsules with small marks, then the calm-founder and busy-workshop tiles); the Authority Workshop as a six-tile pastel mosaic (wide tiles art-right / text-left, narrow tiles art-over-text, one station scene per tile, figures dropped); one idea and the right expressions (the spool, the line, four pegged forms, four form tiles, the route); the learning bench inside a white panel; fit lists around the gate; the closing night panel with the evolved scene and a giant wordmark marquee into the footer.
- **Motion.** Reveals rise 30px and fade over 640ms as a section is first seen (transform and opacity, staggered where a row has an index); the ticker and wordmark marquees loop; the bench animates its states; the thread draws on entry. Nothing is hidden without scripting; reduced motion switches every animation and transition off.

### The inner pages: Who it is for, and the interactive Playbook (same day, later)

The owner approved the second pass and asked for two things: the "Who it is for" tab to match the design, and an interactive playbook designed with the Birdhouse LinkedIn Playbook (`linkedin.thebirdhouse.co`) as the reference. The reference was read for its interaction vocabulary only (a start button with a time promise, a maxims marquee, tap-a-letter tabs, before/after levers, checklists, flip cards, a card deck, a slider-driven model, a 30/60/90 timeline, a checkbox routine); nothing of its content, artwork, numbers, claims or copy carries over.

- **Who it is for** (`src/components/marketing-v9/WhoItsFor.tsx`): a statement panel with the gate scene, the seven-point profile as a ledger of white tiles, the fit in one look as two pastel columns (the homepage's lists), the research-focus note, and the night closing panel with the evolved scene.
- **The Playbook** (`src/components/marketing-v9/playbook/{Playbook,Chapter,Widgets,Progress}.tsx`, data in `src/content/playbook.ts`, chapter text still in `PLAYBOOK` in `public-site.ts`): one interactive page. A statement panel with "Start the playbook · about 20 minutes, fully interactive" and four honest facts (10 chapters, 9 things to try, 2 tools, 0 promises); a marquee of the system's maxims; a sticky rail of ten chapter marks with "n of 10 read" kept in this browser only; ten chapters, each with the idea, the card to turn, the thing to do today, "mark as read", and an object to use: crates to tap (what counts as raw material), the one-sentence test with three blanks and a verdict, five drawers of where the language lives, a thesis-or-topic deck to sort, a room picker with the measurement rule, a five-encounter scrubber (famous versus familiar), the evidence ladder with an "add them into one number" switch, an expectation card that stamps a read-by date, the learning bench itself for chapter nine, and six flip cards of what can and cannot be promised. Then the two tools (the diagnostic and the model, restyled), the three periods of a first engagement stated without promises, and the hand-over to the application. Chapter routes at `/playbook/[chapter]` render the same chapter object on its own with the way back and the way on.
- **Accessibility and no-JS.** Every widget renders its full content in the HTML; the deck, drawers and cards are buttons and native `<details>`; the progress rail is a nav of links; reduced motion turns the flips and reveals off.

### The remaining pages: How it works, Apply, the calculator, Not found (same day, last)

The owner asked "what about the other pages such as how it works". The four pages still on the earlier layouts were brought into the same system, with their working parts untouched (the application form and its booking link, the calculator's logic, the diagnostic).

- **How it works** (`src/components/marketing-v9/HowItWorks.tsx`): a statement panel with the busy machine in a night tile (the eight jobs on the wall); the six-station line as the v5 interactive stage inside a night panel (numbered stations, ←/→ on the group, the six captions); the seven stages as a ledger of tiles, the three where the founder is needed tinted peach and marked "You · Input / Record / Sell"; the four gates as marks in one white panel; the synthetic demonstration as a ten-link chain on a marigold thread, stamped Illustrative and labelled "not a client result"; the night closing panel with the evolved scene and the hand-over to the application. The old page's sticky "Apply" bar, its schematic tiles and the duplicated diagnostic are gone (the diagnostic lives in the Playbook's tools).
- **Apply** (`src/app/(marketing)/apply/page.tsx`): one white panel, the statement, reassurance and meta on the left (sticky on desktop), the unchanged `ApplicationForm` in a canvas-coloured tile on the right. `publicBookingUrl()` is still read on the server and passed through.
- **The calculator** (`src/app/(marketing)/calculator/page.tsx`): the same panel with the statement above the unchanged `CalculatorClient`. Its own two-column grid is forced to one column below 1024px so the sliders fit a 320px phone (the old page let the card overflow there).
- **Not found** (`src/app/not-found.tsx`): one centred white panel on the canvas with the wordmark, the statement, the two ways on and the help line. It imports the v5 and v9 stylesheets itself because it renders outside the marketing layout.
- Styles are the `.hw-*`, `.ap-*` and `.nf-*` blocks at the end of `src/styles/marketing-v9/index.css`. `qa:marketing` gained thirteen checks (the stage with six stations, seven stages, four gates, the ten-link chain labelled illustrative; the stations respond; the form and the calculator are present inside the system; no horizontal overflow on the three new routes at 1024 / 390 / 320).

### The generated scenes and the object set (24 September 2026, evening)

The owner asked for a visual diagnosis of the homepage as rendered ("whether the graphics look premium or childish… generic AI-generated explainers… assembled from components"), then to have the artwork generated with Nano Banana and wired in. The diagnosis, the screenshots at 1440 / 1024 / 390, the prompts and every accepted or rejected render are in `docs/design/nano-banana-reference/` (README, PROMPTS.md, `scenes/`, `generated/`).

- **Three scenes** replace the code-drawn hero, vault band and closing landscape: `public/marketing/{hero,gap,closing}-scene.jpg` (Nano Banana 2, Flash tier, 1376 × 768; the hero and the gap band are cropped to the drawn content). Faceless figures with pale-blue oval heads and no hands, one line weight, the marigold thread as the only warm colour. The hero scene runs off the panel's right edge (122% width inside an overflow-hidden column); the gap band is full-bleed with the memory panel riding over its 150px canvas padding, so nothing in the drawing is covered any more; the closing panel's background is the render's own navy (`#121d39`).
- **The object set** (`public/marketing/objects/*.png`, 17 transparent objects split from two 3 × 3 sheets) replaces the station scenes, the burden tiles and the capsule icons. Six station tiles carry one object each (magnifier, spool, press, peg, ledger, stamp); "What you do" is four objects (microphone, camera, stamp, folder) on a sky tile; "What Threadline does" is eight labelled tools on the night tile, the gear cluster gone; the capsules use the same four objects. Every label is HTML; no text is drawn into artwork. `Obj` in `Home.tsx` wraps `next/image` with `fill`, `loading="eager"` (the QA harness screenshots without scrolling).
- **Also fixed from the diagnosis:** the bench now spans the panel (labels legible at 1440: the learning grid is one column), the fit gate is removed (two lists), the memory frieze scrolls horizontally on phones instead of stacking 1,600px tall, and the station art's "ROOT THESIS" plates read "ROOT IDEA" (How it works still uses the stage). The v5 scene components (`HeroArt`, `ProblemArt`, `BurdenArt`, `SmallArt`, `StationScene`) stay in the tree for the inner pages and the design lab.
- **Limits.** Flash renders are 1376 px wide: fine at 1× for the panels, soft on retina at 1440. The objects are ~250 px: fine for capsules and tiles at 1×. Regenerate the keepers on the Pro tier with the same prompts when the direction is approved. Recraft (vector) needs the owner's sign-in.

### Second artwork pass: the owner's notes (24 September 2026, late)

The owner reviewed the first artwork pass and listed what was wrong. Every point was addressed; the generated scenes are in `docs/design/nano-banana-reference/generated/` and served from `public/marketing/`.

- **The gap band was "way too huge" and visibly low-resolution.** It now sits inside the container at the render's own width (about 1220px, radius 28), so it is never upscaled. The two plates stay.
- **The hero's right side was cut off.** The scene is shown whole again; the copy column narrowed to 42% so the scene is larger without cropping.
- **"We are not trying to make you famous" needed generation.** A five-encounter scene (`memory-scene.jpg`) replaces the code-drawn frieze, with the five state captions in HTML under it and a horizontal scroller on phones.
- **The eight tools were not centred with "What you do".** Both tiles now centre their object grids in the tile, with a staggered rise.
- **Expected · Actual · Why · Change · Retest needed generation, and the Change step looked tacky.** A generated bench scene (`learning-scene.jpg`, the inspector lifting the failed block out with the fresh block waiting) sits beside the section head; the interactive bench keeps its five states but the hook is gone and the Change step now lifts the failed block up and out and drops the new block in from above.
- **How it works: hero and the line.** The hero tile carries `howitworks-hero.jpg` (eight tools on a bench, night); the station line is `StationLine.tsx`: the generated panorama (`howitworks-line.jpg`) with a marigold marker that moves to the chosen station, six numbered buttons with arrow keys, and the six captions lit in turn. On phones the panorama scrolls to the chosen station. The closing panel uses the night line scene.
- **Who it is for: hero and the closing line.** The gate scene (`whoitsfor-scene.jpg`) replaces the code-drawn gate; the closing reads "Not sure it fits? The application will tell you." over the night line scene.
- **The Playbook, assessed against the Birdhouse LinkedIn Playbook.** Its shape is the right one (start button with a time promise, honest counters, a maxims marquee, a chapter rail with progress, one object per chapter, tools, a timeline stated without promises). Two things were weaker: progress only moved when the reader pressed "Mark as read", and the chapters had no visual anchors. Now a chapter marks itself read after 2.5 seconds at 45% visibility (`AutoRead`; the manual control still un-marks), each chapter head carries one object from the set (crate, spool, magnifier, press, peg, ledger, tick sheet, stamp, bench, folder), and the hero carries a reading-desk scene. The interactions (crates, sentence blanks, drawers, sorter, rooms, scrubber, ladder, expectation card, bench, promise cards) were re-verified by the suite.
- **Still low resolution (graphics 2 and 3).** The Flash tier tops out at 1376 px, so the two widest scenes were re-rendered in pieces from their own chats: the gap band as two half-renders (`gap-left.jpg`, the workroom ending at the wall and hatch; `gap-right.jpg`, the empty room starting at the wall) shown side by side at about 610 px each, so each is drawn at more than twice its display size; and the five encounters as a square sheet of five large vignettes (`memory-sheet.jpg`) split into five tiles (`public/marketing/memory/encounter-1..5.jpg`, ~320–420 px each shown at 230 px) laid out in five columns over a real SVG thread that draws itself with five knots on reveal. The captions sit under each tile in HTML.
- **Motion.** A pixel trace of the marigold thread was attempted for a drawn-on overlay and rejected: the oak bench reads as the same colour and the traces wandered. Motion is applied where it is honest: the band plates slide in from each side, the frieze captions and the tool objects rise in sequence, the station marker glides, the bench blocks lift out and drop in, the expressions line still draws. Reduced motion turns all of it off.

### Checks

On the production build of 24 September 2026 (`NEXT_DIST_DIR=.next-qa npx next build`, served with `npx next start -p 3001`):

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Production build | `next build` | ok; `/` 5.66 kB, 111 kB first load |
| Homepage and inner-page acceptance | `npm run qa:marketing` (`marketing-v9`) | 64 / 64 after the generated artwork (the six labelled scenes, the 22 loaded objects, the scenes and objects in the server HTML, the band plates carrying "Inside the firm" and "What the market sees"); 63 / 63 after the remaining pages were added (How it works, Apply, the calculator: structure, the stage responding, no overflow at 1024 / 390 / 320; the suite now clears the Playbook read-state first because the QA Chrome profile persists between runs); 50 / 50 after the inner pages were added (Who it is for in the system; the Playbook's ten chapters, marks, objects, two tools and three periods; crates open and count; the deck answers; marking a chapter read lights its mark; no horizontal overflow on the three routes at 1024 / 390 / 320). The homepage part, 34 checks: ten sections; the protected copy; six mosaic tiles, five bench states, three cases; fourteen labelled illustrations; nothing hidden in a seen scene; the bench by click and by arrow key with focus; no horizontal overflow and no clipped heading or label at 1440 / 1024 / 768 / 390 / 320; tap targets ≥ 40px on phones; the six station scenes, the bench's Expected readout and the ticker's list in the server HTML; reduced motion runs no animation and hides nothing; no pricing, no promised outcomes, illustrative material labelled, no AI framing |
| Public routes | `npm run qa:public` | 54 pass · 8 partial · 0 fail (the partials are the pre-existing inner-page notes) |
| Web vitals | `npm run qa:vitals` | LCP 200 ms at 1440, 36 ms at 390; CLS 0.007 / 0.000 (with the generated hero as the LCP image) |
| Eye pass | full pages at 1440, 1024, 390 and 320 plus hero, mosaic and closing crops, three rounds | fixed on the way: the hero and closing scenes colliding with the copy (now cropped beside it), station scenes spilling past their tiles (clipped, figures dropped, bench-height window), the nav pill forcing a 353px layout at 320 (smaller under 480px), a five-line statement (measure widened) |

### Remaining limitations

- The scenes are the v5 illustrated world at its 21 September line weight (1.6 units); on the pale canvas they read lighter than the reference's heavy-outline artwork. If the owner wants more weight, `LINE` in `art/kit.tsx` and the thread widths are the two knobs, and every scene should be re-inspected after.
- The mosaic's station scenes are windows cut from the workshop panorama, so the machines were not composed for tiles; they fill their tiles adequately but not with the reference's deliberate bleed.
- The application form and the calculator keep their own component-level styling (Tailwind utilities on the old tokens) inside the new panels; they read as the product's paper cards rather than as v9 tiles. A rewrite of those two components was out of scope because their logic is the backend's contract.
- The earlier How-it-works objects (`src/components/factory/{machine,scenes,schematic}.tsx`, `src/components/public/sticky-apply.tsx`) are no longer rendered by any route but are left in place; `src/components/public/{diagnostic,primitives}.tsx` are still used by the Playbook's tools.
- The first rebuild of the day (v8) is in the git history at `2bb23cc` if any of its objects (the index sheets, the ledger) are wanted back.

## Visual-quality upgrade (21 September 2026)

The owner kept the concepts, copy and sequence and asked for the execution to move from children's-animation cues to a refined editorial / product-studio system. This pass changed the actual shapes, proportions, colour use, labels, motion and crops. The direction below supersedes the correction pass under it; its non-regression rules still hold.

### What changed

- **Figures.** `Person` is now a faceless architectural scale figure: a 10.5-unit paper head, a tapered one-tone body, limbs as single 3.2-unit ink lines, no hands, no hair, no expressions, no skin tones. `sit` and `apron` (the gold operator band) are the only variants. The props `skin`, `hairStyle`, `glasses`, `look` and `mood` no longer exist; every scene and the design lab were updated.
- **Line and corners.** One line weight, `LINE` = 1.6 units (was 2.15 outlines, 10.5-unit limbs, 7–11-unit poles). Structural members are 3–6 units. Rectangles carry 1–4-unit radii instead of 6–30; plates and signals are square-cornered tags sized to their text (`labelWidth`); the bench, readout, abacus, chips and frames in `page.css` lost their pill radii and 2–2.5px borders (now 1px, 4–6px radius).
- **Thread.** 2.6 gold over a 4.4 ink hairline (was 3.6 over 6.8); knots are gold beads with an ink centre. Every thread now ends deliberately: the vault's escaping strand ends on a knot on the ground (wide and tall), the engagement sheet's thread runs knot to knot, the hero and gate threads end on poles or the frame edge.
- **Colour.** Each scene uses paper, `sky`, `paper-deep`, wood and one lilac. The candy spread in the archive and vault (coral / mint / butter binders, folders and crates) is gone; mint and coral appear only as states (met / short, the swapped part); gold only as the thread, signals and the operator apron. Figures wear lilac, sky, wood or parchment.
- **Removed.** Speech bubbles (the coffee moment now shows the short video between the two figures), the buyer's hand-drawn "?", the dashed "talking" lines, the sparkle marks over the buyers (`Spark` is now a plain ring, unused on the page), the coral carrier cart (now wood), the toy rollers on the conveyor.
- **Motion.** Every perpetual loop is gone: gear spin, roller spin, peg sway, twinkle, talking dots, the conveyor belt rollers, the loom shuttle. What remains is functional and runs once per entry: the thread draw, the scene settle, the carrier moving to the chosen station, the reply signal travelling back, one conveyor pass in the busy workshop, the replacement block sliding in. `V5_MOTION_SYSTEM.md` lists them.
- **Labels.** `.v5-label` is Inter 11-unit tracked capitals (`is-sm` 10, `is-xs` 9, `is-lg` 18 for the bench numbers). `Plate`, `Signal`, `Crate`, `Folder`, the bench blocks and the signal-tray pills size or compress their text (`textLength` / `lengthAdjust`), so no label escapes its object.
- **Crops.** `.v5-art` stays `overflow: visible`. The wide vault's folder row moved inside the canvas (its first folder used to lose "CLIE" off the left edge); the tall vault renders `Vault compact`, which drops the folder and lamp a phone frame would cut in half, and sits 8 units in so its first label is whole. The closing scene's extra book no longer overlaps the post.
- **Composition.** Frames (burden, workshop stage, bench stage, closing band) share one 6px radius and a 1px ink or paper hairline; the engagement sheet has a paper edge plus a soft 14px shadow instead of a blurred drop; heading tracking eased from −0.028em to −0.02em.

### Checks performed

On the production build of 21 September 2026 (`NEXT_DIST_DIR=.next-qa`, one server on :3000):

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors (the removed figure props surfaced every stale call site, all updated) |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Unit | `npm run test` | 634 / 634 |
| Production build | `next build` | ok; `/` 9.54 kB, 115 kB first load (was 10.3 kB) |
| Marketing visual QA | `npm run qa:marketing` | 53 / 53 — eight scenes, nothing hidden before reveal, ten labelled illustrations, workshop by click and keyboard, phone controls inside a 390 viewport at 44px, every station framed with the pan clamped at 390 and 320, no horizontal overflow at 1440 / 1024 / 768 / 390 / 320, no-JS HTML, reduced motion |
| Public routes | `npm run qa:public` | 62 / 62 across eleven routes and twenty widths (320–1440) |
| Visual baselines | `npm run qa:visual` | re-taken; homepage 12,101 px at 1440, 15,850 px at 390 |
| Web vitals | `npm run qa:vitals` | LCP 232 ms at 1440, 88 ms at 390; CLS 0 at both |
| Product browser sweep | `npm run qa:browser` | 101 pass · 21 partial · 0 fail (the partials are the pre-existing empty-state screens) |
| Eye pass | full pages and detail crops at 1440, 390 and 320, three rounds | `docs/design/v5/after/*-full.jpg` and the per-scene captures; findings and fixes in `V5_VISUAL_QA_REPORT.md` |

### Remaining limitations

- The testing bench is still dense at 320–390 (five block labels at 9 units, jar labels at 9); the readout panel under it carries the reading.
- The workshop panorama at 1440 is a wide, quiet strip; the station captions under it do the explaining. On phones the panorama is 400% wide and shows one station per frame with its plate; a neighbouring station's tag can be cut at the frame edge, which is the pan, not a clipped label.
- The frieze's paper-headed figures sit on parchment; they read by their 1.6 outline, which is intentional but low-contrast at 320.
- Instrument Serif headings at the mega size are set tight; if the owner wants more air, `--v5-mega` and the −0.02em tracking in `page.css` are the two knobs.

## Owner review: visual-quality correction (previous pass)

The owner approves the ideas, structure, and storytelling, but rejected the original visual execution as too close to children's animation. The specific problems were thick toy-like outlines, sugary pastel colour, wide monospaced labels, cute facial expressions, speech bubbles, sparkly stars, overly rounded machinery, excessive looping movement, disconnected decorative curves between sections, and text or linework being clipped inside illustrations.

Treat the current refinement pass as an owner-authorised design direction. Preserve the concepts — the continuous thread, expertise archive, market visibility, deliverables, founder burden, workshop, expected → actual → why → change → retest loop, fit, and closing — while presenting them with the restraint and finish of a serious editorial/product studio.

### Changes already made

- V5 headings and the wordmark now use Instrument Serif, paired with Inter for UI copy and labels. Fraunces and the previous deliberately wonky display treatment were removed from V5.
- SVG labels now use Inter rather than JetBrains Mono, with tighter tracking and constrained lengths where they must fit inside objects.
- The palette is quieter and less candy-like. Outlines, borders, and thread strokes are thinner.
- Figures are faceless and more abstract, with smaller heads and hands. Smiles, speech bubbles, and cartoon reactions were removed.
- Cartoon sparkles were replaced by a restrained signal mark.
- Floating seam curves between sections were removed because their paths appeared clipped or disconnected.
- Decorative sway, twinkle, and talking loops were removed. Remaining mechanical motion is slower and has a clear purpose.
- Illustration frames use smaller radii and less toy-like framing.
- Mobile vault positioning and the clipped `REFERRAL` label were corrected.
- The mobile workshop is enlarged to 400%; it uses a clamped computed pan and shows only the active station plate.

### Non-regression rules

- Do not restore Fraunces, the wonky display face, or JetBrains Mono inside V5 illustrations.
- Do not reintroduce expressive cartoon faces, speech bubbles, twinkling stars, saturated candy pastels, thick toy outlines, or decorative motion loops.
- Do not restore the floating section-to-section seam curves unless a replacement is continuous, intentional, and verified at every target width.
- Do not apply global `overflow: hidden` to `.v5-art`. Crop only within an intentional scene container or SVG `clipPath`; otherwise labels and linework get silently cut off.
- Every SVG label must visibly fit its containing object. Shorten the wording or use `textLength`/`lengthAdjust`; never accept clipped text.
- Keep the mobile workshop panorama at 400% unless a replacement is visually verified. Only the active station plate should be visible on mobile, with no horizontal page overflow.
- Automated checks are necessary but insufficient. Visually inspect complete pages and detailed crops at 1440 px, 390 px, and 320 px after any illustration, typography, animation, or responsive change.
- These changes should not be undone unless the replacement is demonstrably equal or better in polish, legibility, and responsiveness.

### Remaining judgement calls

- Several scenes still use human figures. They are now deliberately faceless and minimal; any further refinement should move toward silhouettes or architectural editorial figures rather than restoring character animation.
- The founder-burden bench remains visually dense at 320 px and deserves close inspection after nearby layout changes.
- The engagement diagram is intentionally long. Monitor its mobile legibility and its effect on page rhythm.
- Recheck the exact mobile workshop framing after any changes to station widths, labels, or pan calculations.

## Files

**Added**

- `src/components/marketing-v5/art/kit.tsx` — the illustration kit (people, artefacts, props, the thread, plates, grain).
- `src/components/marketing-v5/art/{HeroArt,ProblemArt,MemoryArt,EngagementArt,BurdenArt,WorkshopArt,SmallArt,HeroExplorations}.tsx` — the scenes; `HeroArt` doubles as the closing (`evolved`); `EngagementArt` is the sheet in "What you receive".
- `src/components/marketing-v5/{Sections,Nav,Footer,Motion,WorkshopStage,Bench}.tsx`.
- `src/content/marketing-v5.ts` — every homepage sentence.
- `src/styles/marketing-v5/{index,tokens,art,page,motion,inner}.css`.
- `src/app/(marketing)/design-lab/page.tsx` — internal, `notFound()` in production, disallowed in `robots.ts`.
- `scripts/qa/marketing-v5.ts` (+ `npm run qa:marketing`) and `scripts/qa/web-vitals.ts` (+ `npm run qa:vitals`).
- `docs/design/V5_*.md`, `docs/design/v5/`.

**Changed**

- `src/app/(marketing)/layout.tsx` and `page.tsx` — the v5 composition; `public.css` and `public-v3.css` still load for the inner pages.
- `src/app/public.css` — the `.tl-public` palette retokened to the v5 world (ink-navy, parchment, sky, marigold), so How it works, Who it is for, Playbook, Apply and the calculator take the palette without a rewrite.
- `src/app/(marketing)/playbook/page.tsx` — imports the calculator from its new home.
- `src/app/robots.ts` — disallows `/design-lab`.
- `package.json` — `qa:marketing`.
- `qa-baselines/public/*` — re-taken on the v5 build after the critique passes.

**Removed (obsolete)**

- `src/components/marketing-v4/*` except `AcquisitionCalculator.tsx`, which moved to `src/components/marketing-v5/`.
- `src/content/marketing-site.ts`, `src/content/marketing-tokens.ts`.
- `src/styles/marketing/marketing.css`, `src/styles/marketing/marketing-extra.css` (the generated v4 port and its additions).

Removed in the review pass: `Expressions.tsx`, `art/ExpressionsArt.tsx`, `art/MovementArt.tsx`, the loom (`CycleArt`) and `TinyOperator` from `art/SmallArt.tsx`, and the content keys `strip`, `expressions`, `movement`, `cycle` (the market-memory copy moved under `problem.memory`).

`public-v3.css` and the `src/components/public/*` and `src/components/factory/*` families remain: the inner pages use them. Nothing under `src/app/app`, `src/app/admin`, `src/lib`, `prisma` or the server actions changed.

## Responsive decisions

- Every panoramic scene has a wide (1440-unit) and a tall (400-unit) composition; CSS shows one per breakpoint at 760px. The tall compositions are re-drawn, not scaled: the hero stacks archive → press → line; the vault crops to its densest part with the outside below; the frieze and the street become vertical strips on a vertical thread.
- The workshop: the whole bench is visible with all six captions listed under it above 900px; below it the panorama is 400% of the frame and pans to a computed, clamped `--pan` per station so every station is centred and the last never leaves an empty frame; the controls wrap so the six station buttons take their own row and the Next button stays inside 390px; only the active station plate and caption show on phones (all six captions when scripting is unavailable).
- The engagement sheet is sticky beside its steps above 900px and sits under them below.
- The comparison abacus turns its column headings vertical below 600px.
- Nav links move into a drawer below 900px; every control is at least 44px.

## Motion dependencies

None added. CSS keyframes and transitions plus one `IntersectionObserver` component (`Motion.tsx`) and one in the workshop stage that pauses its loops off screen. No animation library; no raster assets; no video.

## Accessibility behaviour

Every scene SVG is `role="img"` with a full description. The bench is a tablist with arrow keys; the workshop's six station buttons sit in a `role="group"` whose ←/→/Home/End handler moves the station and the focus; the drawer closes on Escape. Focus rings are 3px marigold. Reduced motion removes every animation and transition and leaves each scene in its authored final state. Nothing is hidden before it enters the viewport; the page reads with JavaScript off.

## Asset provenance

All artwork is authored in code in this repository (`src/components/marketing-v5/art/`), by hand, for Threadline. No SVG paths, characters, motifs, copy, logos or assets from any reference site were used. Fonts are Google Fonts loaded through `next/font` (Instrument Serif and Inter for the v5 scenes; Fraunces and JetBrains Mono remain for the product surfaces).

## Portal and admin

The product surfaces keep their own dark palette and were not touched. What can transfer later: the `--v5-*` tokens as accent and state colours (marigold for signal/action, mint/coral for pass/fail states, sky/lilac for environment fields), the Instrument Serif / Inter pairing for headings and labels, the artefact silhouettes as icons for content kinds, and the 44px control rule. What must not transfer: the marketing layouts, the panoramas, the grain.

## Tests run and results (19 September review pass; the 21 September checks are above)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| Marketing V5 QA suite | Pass (exit 0) |
| Full-page visual capture at 1440 px | Inspected |
| Full-page visual capture at 390 px | Inspected |
| Full-page visual capture at 320 px | Inspected |
| `npx next build` | Pass |
| `git diff --check` | Pass |

The `npm run build` wrapper encountered an `EPERM` while replacing the Prisma query engine because another process had the file open. Prisma generation had already completed in an earlier run, and the underlying Next.js production build passed independently.

## Remaining limitations

- No git remote is configured on this machine for a push from the session; the branch is local until pushed (see `HANDOFF.md` §20 for the commands).
- Vercel builds `main`; this work is on `frontend/visual-rebuild-v5` and needs a merge to deploy.
- The site still has no privacy notice route (PH-LEGAL) and no `DATABASE_URL` in production (the application form persists only where a database is configured).
- The bench illustration is dense at 320px; readable, not generous. The readout panel under it carries the reading.
