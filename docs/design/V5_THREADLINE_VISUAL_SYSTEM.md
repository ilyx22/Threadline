# Threadline v5 — visual system

The public site is an illustrated world: an editorial authority workshop connected by one continuous thread. This document records the system as implemented in `src/styles/marketing-v5/` and `src/components/marketing-v5/art/kit.tsx` on 19 September 2026. Nothing here is aspirational; if the code and this file disagree, fix one of them.

## 1. Palette

All tokens are declared once on `.tl-public` in `src/styles/marketing-v5/tokens.css`. Scene artwork reads them through the `C` map in `kit.tsx` (`C.ink` = `var(--v5-ink)` and so on), so a token change recolours every scene.

| Token | Hex | Role |
|---|---|---|
| `--v5-ink` | `#18213a` | Outlines, type, the thread's under-stroke, buttons |
| `--v5-ink-soft` | `#3b4560` | Lead paragraphs, eyebrows, list notes |
| `--v5-ink-faint` | `#5d6782` | Tags, notes, the second line of a mega headline |
| `--v5-navy` | `#1f2a4a` | Archive and vault interiors, legs, phones |
| `--v5-navy-soft` | `#33416b` | Wall panelling, the conveyor |
| `--v5-night` | `#141b33` | The workshop and closing bands, the busy-machine window, the Threadline abacus row |
| `--v5-paper` | `#fbf6ec` | Page ground, ground lines in scenes, plates |
| `--v5-paper-deep` | `#f2e9d8` | Comparison band, alternate pavement steps, hairlines |
| `--v5-white` | `#fffdf8` | Artefact sheets, the thesis sheet, readouts, the abacus |
| `--v5-sky` | `#cfe3f2` | Hero and movement environment, train windows, lenses |
| `--v5-sky-deep` | `#9fc6e4` | The closing panel (dusk) |
| `--v5-mint` | `#bfe5d1` | Machine bodies, folders, the bench panel, the gate |
| `--v5-mint-deep` | `#7cc4a2` | Jar fills that met expectation, the replaced block |
| `--v5-coral` | `#f6a791` | Shirts, the carrier cart, failed blocks, short jar fills |
| `--v5-coral-deep` | `#e2735a` | Deep coral accents (reserved) |
| `--v5-lilac` | `#d3c6ee` | Press columns, the buyer's coat, binders, the gather ring |
| `--v5-lilac-deep` | `#a892dc` | Press cap, deep-piece accents |
| `--v5-butter` | `#f7e3a3` | Speech bubbles, crates, the woven band, the thesis sheet's shadow, hover fills |
| `--v5-gold` | `#f6a723` | **The accent**: the thread's top stroke, knots, signals, beads, the CTA hover, the expected-mark flags |
| `--v5-gold-deep` | `#c97f08` | Small text on white/paper only (thesis tag, active tab number, lever label) |
| `--v5-wood` | `#e3b98a` | Shelves, benches, pegs, spool ends |
| `--v5-wood-deep` | `#b98652` | Reserved |

The burden band uses one literal, `#ece6f7` (a lighter lilac), because no token sits between paper and lilac; it is the only literal colour in `page.css`.

### Contrast pairs used for text

- Ink on paper, white, sky, mint, lilac, butter, wood: all ≥ 7:1.
- Ink-soft on paper ≥ 7:1; ink-faint on paper ≥ 4.5:1 (used at 12–15px for tags and notes, never smaller).
- Paper on night, ink, navy: ≥ 12:1. Paper at 0.8 opacity on night is still ≥ 8:1; at 0.55–0.66 (closing subline, notes) it is used at ≥ 17px only.
- Gold-deep on white/paper is 3.6:1: used only for small emphasis text beside ink text, never for a sentence.
- **Gold on paper is decorative only.** It carries the thread, beads and flags, always with an ink outline. It is never used as a text colour.
- Butter eyebrow on night ≥ 12:1.

## 2. Type

| Role | Face | Setting |
|---|---|---|
| Display (h1, h2, mega, h3, wordmark, verbs, relief) | Fraunces variable, `--font-display` | weight 500, `"opsz" 144, "SOFT" 100, "WONK" 1` on h1/mega; `opsz 120, SOFT 80` on h2; `opsz 72, SOFT 60–80` on h3 and captions; letter-spacing −0.022em |
| Eyebrow | Fraunces italic | `clamp(1.15rem, 1.5vw, 1.4rem)`, `opsz 48, SOFT 100, WONK 1`, ink-soft (butter on night) |
| Body / lead | Inter, `--font-inter` | 17px body; lead `--v5-lead` = `clamp(1.0625rem, 1.35vw, 1.3125rem)`, line-height 1.5, max 52ch |
| Labels (`.v5-tag`, `.v5-label` in SVG) | JetBrains Mono, `--font-label` | 12px HTML tags; 15 SVG units standard, 13 small, 10.5 extra-small, 19 large; letter-spacing 0.06–0.12em, uppercase |
| Hand notes in scenes (`.v5-hand`) | Fraunces italic | 24 units, the "?" over the deciding buyer |

Sizes: `--v5-h1` `clamp(2.6rem, 6.1vw, 5.6rem)` at line-height 0.98, max 18ch; `--v5-h2` `clamp(2.1rem, 4.4vw, 4rem)` at 1.02, max 20ch; `--v5-mega` `clamp(2.5rem, 7.2vw, 7rem)` at 0.96, max 16–20ch; `--v5-h3` `clamp(1.35rem, 1.9vw, 1.75rem)`. The SOFT 100 / WONK 1 axes are what separate v5 from v4's straighter Fraunces: the letters are rounder and slightly irregular, matching the drawn world.

Rules: headlines left-aligned, `text-wrap: balance`; the mega headline splits into an ink line and an ink-faint second line (`.is-soft`); no tiny label carries essential meaning — every scene has a caption or list in HTML.

## 3. Spacing and layout

- `--v5-max` 1240px; `--v5-gutter` `clamp(20px, 4vw, 48px)`; everything reads through `.v5-wrap`.
- Sections: 110px top / 90px bottom on desktop; memory `clamp(88px, 10vw, 140px)`; closing 120px top with the art running into the footer. Phones (≤ 759px): 72 / 64, memory 64, closing 80.
- Radii: `--v5-r-lg` 36, `--v5-r-md` 20, `--v5-r-sm` 10. Stages and panels use 24–30px; the thesis sheet uses an asymmetric `6px 18px 6px 18px`.
- Full-bleed scenes (hero, problem, memory frieze, movement, closing) leave `.v5-wrap` so the art can own the viewport width.

## 4. Illustration grammar (the kit)

Everything is drawn from `art/kit.tsx`:

- **Outline**: 3 units ink, round joins and caps (`outline` export). Small parts use 2–2.4. Nothing uses a thin grey UI border.
- **Fills**: flat pastels from the palette; no gradients, no glass, no drop shadows.
- **People** (`Person`): ~160 units tall at scale 1, origin at the feet. Limbs are a 15-unit ink stroke with a 9-unit shirt-colour stroke on top (`Limb`), so an arm reads as outlined at any angle. Faces: two dots and a mouth (`smile`, `grin`, `flat`, `oh`); `look` shifts the eyes; six hair styles; optional glasses and a gold apron for operators. Five skin tones in `SKIN`.
- **Artefacts** (`Artefact`): eight silhouettes — post (sheet with avatar), video (phone with a play mark), doc (three offset pages), proof (sheet with a check rosette), deep (open book), diagnostic (clipboard), nurture (envelope), update (grey sheet, the piece the buyer ignores). `Pegged` hangs one from a wooden peg on the thread.
- **Props**: `Crate`, `Folder`, `PaperStack`, `Binder`, `Gear` (spins), `Lamp`, `Desk`, `Armchair`, `Spool`, `Signal` (gold pill with a label), `Spark`, `Knot`, `Plate` (a paper label with an ink border).
- **Labels**: `Plate` for words a visitor must read; ≥ 15 units standard, `is-xs` (10.5) only for object tags inside a scene that the HTML caption repeats.
- **Grain**: `Grain` is a low-intensity `feTurbulence` filter laid over environment scenes only (hero, vault, movement, workshop, bench, busy machine, closing). Parchment scenes (memory, expressions, loom, gate) carry none — it read as a grey panel there.

Depth is composition, not effect: overlap, occlusion (the buried crates, the porthole), ground lines, and a darker interior against a lighter outside.

## 5. The thread

- Always two strokes, ink under gold (`Thread`): 10/5 units standard, 8/3 `thin`; `dashed` for a signal travelling back.
- `pathLength={1}` on both paths so the draw animation is length-independent.
- **Knots** (`Knot`) mark an encounter, a decision or a recorded signal — the memory frieze, the woven band, the evolved hero line.
- **Seams** (`Seam` in `Sections.tsx`): a 140px SVG at the top of each section, positioned 70px above it, carrying the thread from one scene into the next. Start/end x are chosen per section so the cord lands in empty ground, never over copy.
- On the page the thread starts on the spool in the hero archive, hangs the line under the hero and the tag strip, escapes the vault, runs behind the memory frieze, crosses the workshop bench, fans from the thesis spool, descends the street, is woven in the loom, runs the abacus wires, passes the gate, and ends back at the archive in the closing scene. The wordmark carries a short cut of it.

## 6. Motion, transitions, accessibility

Motion is documented in `V5_MOTION_SYSTEM.md`. Summary: one observer sets `data-inview` on scenes; threads draw and objects settle on entry; loops run only in view; nothing is opacity-hidden before it enters; reduced motion turns everything off and leaves the authored final state.

Accessibility as implemented:
- Focus ring: 3px gold outline, 3px offset, on every control.
- Every button and link is ≥ 44px tall (`.v5-btn`, `.v5-chip`, `.v5-tab`, `.v5-dot`, drawer links, footer links).
- Every scene SVG has `role="img"` and a one-paragraph `aria-label` describing what is drawn; decorative SVGs (thumbnails, the wordmark thread, seams, the tiny operator) are `aria-hidden`.
- The bench states and the Playbook diagnostic are `role="tablist"` with arrow-key movement; the workshop dots and expression buttons use `aria-pressed`/`aria-expanded`; readouts and captions are `aria-live="polite"`.
- Skip link, one h1, sequential headings, `aria-current="page"` in the nav, Escape closes the drawer.

## 7. Responsive recomposition

- **Wide/tall art pairs**: `HeroArt`, `ProblemArt`, `MemoryArt`, `MovementArt` and the closing (`HeroArt evolved`) each have a `layout="tall"` composition, drawn separately from the same groups. Both are in the DOM; CSS shows one (`.is-tall` below 760px).
- **Workshop**: below 900px the panorama is 420% wide inside an `overflow: hidden` frame and `data-station` pans the camera by sixths; the stage stops being sticky and the sentinel track is hidden when JS is present.
- **Expressions**: below 900px the arc illustration hides and the button row becomes a vertical list with a thumbnail per artefact and the why-line inline.
- **Loom**: below 760px the 1440-unit drawing sits in an `overflow-x: auto` frame at 900px minimum width — a pannable diagram, the one deliberate horizontal scroller.
- **Abacus**: below 600px the column headers turn vertical, the name column gets a minimum width and beads shrink to 20px.
- **Lists**: five-column encounter/step lists become two columns then one; the verbs go four → two → one.
- **Hero copy**: the lead and CTA row sit beside the headline from 760px and stack below it on phones; CTAs go full-width.

## 8. Future portal and admin adaptation

The product surfaces (`/app`, `/admin`) keep their own dark palette and layout; nothing from the marketing scenes should be copied there. What can transfer:

- The type settings: Fraunces with `SOFT 80–100, WONK 1` for page titles, Inter body, JetBrains Mono for labels — the same axes give the product the same voice at a calmer scale.
- The accent logic: one marigold (`--v5-gold`) for "the market talking back" (signals, recorded events), mint-deep for "met expectation", coral for "short of expectation" — the bench's three fill colours are already the product's expected/actual semantics.
- The outline weight and the round-join rule for any product icon that needs to feel like the brand.
- `public.css` has been retokened to the v5 palette (`--accent` is ink, `--stamp` is gold, `--signal` is a deep green, `--reject` a deep coral), so the inner marketing pages already share the world; the product's `globals.css` is untouched.
