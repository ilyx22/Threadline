# THREADLINE — frontend v5 handoff (19 September 2026)

The public site was rebuilt as an illustrated Threadline world: an editorial authority workshop connected by one continuous thread, then reviewed and shortened to eight scenes with a concrete "What you receive" example. Branch `frontend/visual-rebuild-v5`; checkpoint before the work: tag `threadline-pre-v5-rebuild-2026-09-19`; the first v5 build is commit `5c69ab3`. Decision record DEC-026 in `docs/site/DECISIONS_LOG.md`.

Companion documents: `docs/design/V5_CURRENT_FAILURE_AUDIT.md`, `V5_REFERENCE_SKELETON.md`, `V5_THREADLINE_VISUAL_SYSTEM.md`, `V5_COMPONENT_MAP.md`, `V5_MOTION_SYSTEM.md`, `V5_VISUAL_QA_REPORT.md`; captures in `docs/design/v5/`.

## Homepage rebuild (24 September 2026, latest)

The owner rejected the interim homepage (the `marketing-v7` experiment: oversized editorial type, empty layouts, a generic trace diagram, coloured bands) and asked for a premium, restrained, editorial front page in the manner of a serious San Francisco B2B strategy studio, keeping the product strategy and copy ideas. The source of truth for the direction is `docs/site/FOUNDER_FEEDBACK_DESIGN_BRIEF.md`; the audit is `docs/site/SITE_REVAMP_AUDIT_2026-09-24.md`. Decision DEC-029.

### What ships

- **Files.** `src/components/home/{Home,Workshop,Loop}.tsx`, `src/content/home.ts`, `src/styles/home/home.css`, `scripts/qa/marketing-home.ts` (`npm run qa:marketing`). `src/app/(marketing)/page.tsx` renders `Home`; the marketing layout imports `home.css` and carries the `v8` class, which restyles the shared v5 nav and footer to the same paper-and-ink system. `marketing-v7` (components, styles, QA) was removed. The v5 illustrated components remain in the repository for `/design-lab` and the inner pages' primitives but are no longer on the homepage.
- **Structure.** Nine sections: proposition and fit (hero), the visibility gap, market memory, the working relationship, the Authority Workshop, one idea and the right expressions, commercial learning, fit, and a closing band with the application call. Homepage height about 8,400 px at 1440 (the illustrated v5 was 12,100; the v7 interim 10,800).
- **Visual system.** Warm neutral ground (`#f4f2ed`), paper sheets (`.h-sheet`: 1px hairline, 2px radius, a soft shadow), deep ink type, one accent (terracotta `#b4472a`) used for indices, marks, stamps and the active state only. Instrument Serif for headings at a measured size (h1 up to 3.9rem, h2 up to 2.55rem), Inter for everything else, 11px tracked capitals for labels. No coloured panels, gradients, illustrations, characters or dashboards. Every section head is an editorial two-column: index and eyebrow, heading left, body right.
- **Objects.** Hero: a stack of three labelled sheets (point of view, short video, working document) with a three-line ledger, stamped illustrative. Gap: a dense twelve-item index sheet beside a sparse four-item sheet, joined by one strand. Memory: five encounter tickets on a hairline timeline, marks accumulating to the call. Roles: two ledgers with "Approve" as the only handoff. Workshop: a six-station rail with a moving marker and, per station, what happens, who decides and the object on a sheet (fragments, root idea v1, expressions, placements, signals, root idea v2). Expressions: a root-idea sheet feeding four form sheets down a spine, then the route to conversation. Learning: three illustrative cases, five states, a ledger with expected marks and actual levels as thin rules. Fit: two hairline lists.
- **Interaction.** Two client components only. The workshop rail and the learning loop are `role="tablist"` with Arrow, Home and End keys carrying focus; every station's sheet and the Expected ledger are in the server HTML, so both read in full without scripting. Motion is a settle on entry (transform only, staggered by index) and the rail marker moving; nothing loops; `prefers-reduced-motion` switches every animation and transition off.
- **Copy.** Protected ideas kept verbatim or near-verbatim: the hero proposition, inside the firm and what the market sees, famous versus familiar, talk, record when useful, approve and sell, the Authority Workshop, one idea and the right expressions, expected, actual, why, change, retest. Operating detail on the Threadline side names only capabilities the application has (research runs and sourced signals, root ideas and claims checks, approval queue and audit record, publishing records and measured links, evidence classes, attribution, expected-versus-actual diagnosis, the weekly report). Illustrative numbers and theses are stamped and captioned as illustrative; no pricing, proof, promises or AI framing.

### Checks

On the production build of 24 September 2026 (`NEXT_DIST_DIR=.next-qa npx next build`, served with `npx next start -p 3001`):

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Production build | `next build` | ok; `/` 4.78 kB, 111 kB first load (the v5 homepage was 9.5 kB / 115 kB) |
| Homepage acceptance | `npm run qa:marketing` (`marketing-home`) | 37 / 37: nine sections; the protected copy; six stations, five states, three cases; workshop and ledger by click and by Arrow / Home / End with focus; no horizontal overflow and no clipped heading or label at 1440 / 1024 / 768 / 390 / 320; tap targets ≥ 40px on phones; all station sheets, the Expected ledger and the five encounters in the server HTML; reduced motion runs no animation and hides nothing; no pricing, no promised outcomes, illustrative material labelled, no AI framing |
| Public routes | `npm run qa:public` | 54 pass · 8 partial · 0 fail (the partials are the pre-existing inner-page notes) |
| Web vitals | `npm run qa:vitals` | LCP 156 ms at 1440, 40 ms at 390; CLS 0.018 / 0.000 |
| Eye pass | full pages at 1440, 1024, 390 and 320, plus hero crops, two rounds | one fix from the first round: the hero stack rebuilt as a labelled cascade and the headline measure widened |

### Remaining limitations

- The inner pages (`/how-it-works`, `/who-its-for`, `/playbook`, `/apply`) keep their earlier layouts under the restyled nav and footer; they need the same design pass once the homepage direction is approved.
- The hero stack and the ledger are HTML objects with no image weight, but they are also the page's only visual moments; the brief's 10% tactile allowance is largely unused and could take one signature object later.
- The learning ledger's rules are proportional to invented values; the illustrative stamp is the only guard against reading them as data.
- Real client proof, the privacy notice and production database configuration remain open, as before.

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
