# Threadline v5 — visual system

The public site is an illustrated world: an editorial authority workshop connected by one continuous thread. This document records the system as implemented in `src/styles/marketing-v5/` and `src/components/marketing-v5/art/kit.tsx` after the review pass of 19 September 2026. Nothing here is aspirational; if the code and this file disagree, fix one of them.

## 1. Palette

All tokens are declared once on `.tl-public` in `src/styles/marketing-v5/tokens.css`. Scene artwork reads them through the `C` map in `kit.tsx` (`C.ink` = `var(--v5-ink)` and so on), so a token change recolours every scene.

| Token | Hex | Role |
|---|---|---|
| `--v5-ink` | `#172033` | Outlines, type, the thread's under-stroke, buttons, the rules between engagement steps |
| `--v5-ink-soft` | `#3f4858` | Lead paragraphs, eyebrows, list notes, engagement step text |
| `--v5-ink-faint` | `#69717d` | Tags, notes, the second line of a mega headline |
| `--v5-navy` | `#202a3e` | Archive and vault interiors, legs, phones |
| `--v5-navy-soft` | `#3a465d` | Wall panelling, the conveyor |
| `--v5-night` | `#151c2d` | The workshop and closing bands, the busy-machine window, the Threadline abacus row |
| `--v5-paper` | `#f5f2ea` | Page ground, ground lines in scenes, plates |
| `--v5-paper-deep` | `#e9e4d9` | The fit band (with the comparison), hairlines |
| `--v5-white` | `#fcfbf7` | Artefact sheets, the engagement sheet, readouts, the abacus |
| `--v5-sky` | `#d9e2e6` | Hero environment, train windows, lenses, one of the two rooms on the engagement sheet |
| `--v5-sky-deep` | `#b8cbd3` | The closing panel (dusk) |
| `--v5-mint` | `#c3d4cc` | Machine bodies, folders, the bench panel, the gate |
| `--v5-mint-deep` | `#88aa9b` | Jar fills that met expectation, the replaced block (bench and engagement sheet) |
| `--v5-coral` | `#c99180` | Shirts, the carrier cart, failed blocks, short jar fills |
| `--v5-coral-deep` | `#a95f4e` | The ILLUSTRATIVE stamp and the illustrative tag (`.v5-tag.is-warn`) |
| `--v5-lilac` | `#c5bfd0` | Press columns, the buyer's coat, binders, the other room on the engagement sheet |
| `--v5-lilac-deep` | `#948aa8` | Press cap |
| `--v5-butter` | `#dfd2a8` | Speech bubbles, crates, the engagement sheet's shadow, hover fills, the eyebrow and station-object lines on night |
| `--v5-gold` | `#c88b2d` | **The accent**: the thread's top stroke, knots, signals, beads, the pressed station button, the CTA hover, the expected-mark flags |
| `--v5-gold-deep` | `#96631c` | Small text on white/paper only (active tab number, lever label) |
| `--v5-wood` | `#bea483` | Shelves, benches, pegs, spool ends |
| `--v5-wood-deep` | `#8e7254` | Reserved |

The palette is muted on purpose: every pastel sits close to paper so the ink line and the one marigold accent carry the scene. The burden band uses one literal, `#e9e6ec` (a lighter lilac), because no token sits between paper and lilac; it is the only literal colour in `page.css`.

### Contrast pairs used for text

- Ink on paper, white, sky, mint, lilac, butter, wood: all ≥ 7:1.
- Ink-soft on paper ≥ 7:1; ink-faint on paper ≥ 4.5:1 (used at 12–15px for tags and notes, never smaller).
- Paper on night, ink, navy: ≥ 12:1. Paper at 0.78–0.8 opacity on night is still ≥ 8:1; at 0.55–0.66 (closing subline, notes, inactive station tags) it is used at ≥ 12px mono uppercase or ≥ 17px only.
- Gold-deep on white/paper is 3.6:1: used only for small emphasis text beside ink text, never for a sentence.
- Coral-deep on white/paper (the illustrative tag and stamp) is ≥ 3:1 at 12px bold uppercase; the same label is repeated in ink in the body copy.
- **Gold on paper is decorative only.** It carries the thread, beads and flags, always with an ink outline. It is never used as a text colour.
- Butter eyebrow on night ≥ 12:1.

## 2. Type

| Role | Face | Setting |
|---|---|---|
| Display (h1, h2, mega, h3, wordmark, verbs, relief, engagement step titles, station titles) | Instrument Serif, `--font-editorial` | weight 400, letter-spacing −0.028em; line-height 0.96 (h1), 0.99 (h2), 0.94 (mega), 1.08 (h3) |
| Eyebrow | Inter, `--font-inter` | 0.78rem, weight 700, letter-spacing 0.12em, uppercase, ink-faint (butter on night) |
| Body / lead | Inter, `--font-inter` | 17px body; lead `--v5-lead` = `clamp(1.0625rem, 1.35vw, 1.3125rem)`, line-height 1.5, max 52ch; engagement steps 16px, max 58ch |
| HTML tags (`.v5-tag`) | Inter | 11px, weight 700, letter-spacing 0.1em, uppercase; the numbered station buttons are 13px |
| Labels in scenes (`.v5-label` in SVG) | Inter | 14 SVG units standard, 12 small, 9.5 extra-small, 19 large; weight 650, letter-spacing 0.025em, mixed case |
| Hand notes in scenes (`.v5-hand`) | Instrument Serif italic | 24 units, the "?" over the deciding buyer |

Sizes: `--v5-h1` `clamp(2.6rem, 6.1vw, 5.6rem)`, max 18ch; `--v5-h2` `clamp(2.1rem, 4.4vw, 4rem)`, max 20ch; `--v5-mega` `clamp(2.5rem, 7.2vw, 7rem)`, max 16ch; `--v5-h3` `clamp(1.35rem, 1.9vw, 1.75rem)`. Fraunces (`--font-display`) and JetBrains Mono (`--font-label`) stay loaded for the product surfaces and inner pages; the v5 marketing scenes use the Instrument Serif / Inter pair only, which is what separates v5 from v4's Fraunces-and-mono voice.

Rules: headlines left-aligned, `text-wrap: balance`; the mega statement (an `h3` inside the problem section) splits into an ink line and an ink-faint second line (`.is-soft`); the comparison heading inside Fit is an `h3`; no tiny label carries essential meaning — every scene has a caption or list in HTML.

## 3. Spacing and layout

- `--v5-max` 1240px; `--v5-gutter` `clamp(20px, 4vw, 48px)`; everything reads through `.v5-wrap`.
- Sections: 120px top / 96–104px bottom on desktop (problem, engagement, burden, diagnosis, fit); the workshop 120 / 72; the memory block inside problem `clamp(80px, 9vw, 120px)` top; the comparison block inside fit sits 72px below the fit lists behind a 2px ink rule with 56px above the heading; closing 120px top with the art running into the footer. Phones (≤ 759px): 72 / 64, memory 56, comparison 48 / 40, closing 80.
- Radii: `--v5-r-lg` 36, `--v5-r-md` 20, `--v5-r-sm` 10. Stages and panels use 24–30px; the engagement sheet 14 units.
- Full-bleed scenes (hero, the vault, the memory frieze, closing) leave `.v5-wrap` so the art can own the viewport width. The engagement, burden, workshop, bench and fit stay inside it.
- The engagement section is a two-column grid, `1.25fr` of steps beside a `300–420px` sheet that is sticky at 96px; below 900px it is one column with the sheet under the steps.

## 4. Illustration grammar (the kit)

Everything is drawn from `art/kit.tsx`. Since the visual-quality pass of 21 September 2026 the grammar is editorial rather than animated:

- **One line**: `LINE` = 1.6 units of ink with round joins (`outline` export). Structural members (legs, poles, frames) are 3–6 units; hairlines inside objects 1.2–1.8. The thread is 2.6 gold over a 4.4 ink hairline (`Thread`, `w + 1.8`); the thin variant 1.8 over 3.6. Nothing uses a thin grey UI border.
- **Corners**: rectangles carry a 1–4 unit radius, never a pill; machinery is square-shouldered; tags and plates are 3-unit-radius rectangles sized to their text (`labelWidth`).
- **Fills**: flat and few. A scene uses paper, the cool grey-blue (`sky`), the warm parchment (`paper-deep`), wood and one muted lilac. Mint and coral appear only as states (met / short of expectation, the swapped part); gold only as the thread, knots, signals and Threadline's apron.
- **People** (`Person`): faceless scale figures, ~150 units tall at scale 1, origin at the feet — a 10.5-unit paper head, a tapered body in one tone, limbs as single 3.2-unit ink lines, no hands, no hair, no expression. `sit` bends the legs; `apron` marks a Threadline operator with a gold band. No skin tones, moods, glasses or hair styles exist any more.
- **Artefacts** (`Artefact`): eight silhouettes — post (sheet with a corner mark and rules), video (phone with a play mark), doc (three offset pages), proof (sheet with a check rosette), deep (open book), diagnostic (clipboard), nurture (envelope), update (parchment sheet, the piece the buyer ignores). `Pegged` hangs one from a small wooden peg on the thread; pegs do not sway.
- **Props**: `Crate`, `Folder`, `PaperStack`, `Binder`, `Gear` (still), `Lamp`, `Desk`, `Armchair`, `Spool`, `Signal` (gold tag with a label), `Spark` (a ring with a point — kept for the design lab, unused on the page), `Knot` (a gold bead with an ink centre), `Plate`.
- **Labels**: Inter, 11 units tracked capitals (`.v5-label`), `is-sm` 10, `is-xs` 9, `is-lg` 18 for the bench numbers. Every label sits inside an object sized to it: `Plate` and `Signal` measure their text; `Crate`, `Folder`, the bench blocks and the signal-tray pills use `textLength` / `lengthAdjust` so a long word compresses rather than escapes. No speech bubbles, no hand-drawn "?" marks.
- **Grain**: `Grain` is a low-intensity `feTurbulence` filter laid over environment scenes only (hero, vault, workshop, bench, busy machine, closing). Parchment scenes (memory frieze, engagement sheet, gate) carry none.
- **Crops**: `.v5-art` is `overflow: visible`. Where a scene must be cut, the cut is intentional: the tall vault is clipped by its own `clipPath` and its box, and its `compact` variant drops the objects a phone frame would halve; the wide vault shifts its folder row inside the canvas; every thread ends on a knot, a spool, a pole or the frame edge.
- **The illustrative stamp**: invented numbers and cases are marked twice — an ILLUSTRATIVE stamp drawn on the object (the engagement sheet) and an ink or coral-deep tag in the HTML beside it.

Depth is composition, not effect: overlap, occlusion (the buried crates, the porthole), ground lines, and a darker interior against a lighter outside.

## 5. The thread

- Always two strokes, ink under gold (`Thread`): 10/5 units standard, 8/3 `thin`; `dashed` for a signal travelling back.
- `pathLength={1}` on both paths so the draw animation is length-independent.
- **Knots** (`Knot`) mark an encounter, a decision or a recorded signal — the memory frieze, the five steps down the engagement sheet, the evolved hero line.
- **Seams** (`Seam` in `Sections.tsx`): a 140px SVG at the top of each section, positioned 70px above it, carrying the thread from one scene into the next. Start/end x are chosen per section so the cord lands in empty ground, never over copy: hero → problem 94→62, problem → engagement 8→30, engagement → burden 30→64, burden → workshop 64→22, workshop → diagnosis 22→50, diagnosis → fit 50→12, fit → closing 12→60.
- On the page the thread starts on the spool in the hero archive, hangs the line over the buyers, escapes the vault, runs behind the memory frieze, runs down the margin of the engagement sheet tying a knot at each step, crosses the workshop bench, runs the abacus wires in the fit section, passes the gate, and ends back at the archive in the closing scene. The wordmark carries a short cut of it.

## 6. Motion, transitions, accessibility

Motion is documented in `V5_MOTION_SYSTEM.md`. Summary: one observer sets `data-inview` on scenes; threads draw and objects settle on entry; loops run only in view; nothing is opacity-hidden before it enters; the workshop is driven by buttons, not scroll; reduced motion turns everything off and leaves the authored final state.

Accessibility as implemented:
- Focus ring: 3px gold outline, 3px offset, on every control.
- Every button and link is ≥ 44px tall (`.v5-btn`, `.v5-chip`, `.v5-tab`, `.v5-dot` at 44×44, drawer links, footer links). The workshop's ← → buttons carry `min-width: 44px`.
- Every scene SVG has `role="img"` and a one-paragraph `aria-label` describing what is drawn, including the engagement sheet; decorative SVGs (the wordmark thread, seams) are `aria-hidden`.
- The bench states and the Playbook diagnostic are `role="tablist"` with arrow-key movement; the workshop station buttons use `aria-pressed` inside a `role="group"` whose key handler moves focus with the selection; readouts are `aria-live="polite"`.
- Skip link, one h1, sequential headings (h2 per section; the memory statement and the comparison heading are h3), `aria-current="page"` in the nav, Escape closes the drawer.
- Without JavaScript: every caption, readout and step is in the served HTML; on phones the `scripting: none` media feature shows all six workshop captions instead of only the active one.

## 7. Responsive recomposition

- **Wide/tall art pairs**: `HeroArt`, `ProblemArt`, `MemoryArt` and the closing (`HeroArt evolved`) each have a `layout="tall"` composition, drawn separately from the same groups. Both are in the DOM; CSS shows one (`.is-tall` below 760px).
- **Engagement**: two columns with a sticky sheet from 900px; one column with the sheet under the steps below, max 420px wide.
- **Workshop**: below 900px the panorama is 320% wide inside an `overflow: hidden` frame and pans to the chosen station by a computed `--pan` that keeps the station centred and never overshoots the artwork; the controls wrap so ← → and the six numbered buttons fit inside 320px at 44px each; only the active caption shows (all six under `scripting: none`). From 1100px the six captions sit in six columns, three columns between 900 and 1099px.
- **Abacus** (inside Fit): below 1000px the comparison grid stacks; below 600px the column headers turn vertical, the name column gets a minimum width and beads shrink to 20px.
- **Lists**: the verbs go four → two → one; the fit lists stack with the gate first.
- **Hero copy**: the lead and CTA row sit beside the headline from 760px and stack below it on phones; CTAs go full-width.

## 8. Future portal and admin adaptation

The product surfaces (`/app`, `/admin`) keep their own dark palette and layout; nothing from the marketing scenes should be copied there. What can transfer:

- The type settings: Instrument Serif for page titles, Inter for body and labels — the same pair gives the product the same voice at a calmer scale.
- The accent logic: one marigold (`--v5-gold`) for "the market talking back" (signals, recorded events), mint-deep for "met expectation", coral for "short of expectation" — the bench's three fill colours are already the product's expected/actual semantics; the engagement sheet's signal pills are the same object as a recorded commercial event.
- The outline weight and the round-join rule for any product icon that needs to feel like the brand.
- `public.css` has been retokened to the v5 palette (`--accent` is ink, `--stamp` is gold, `--signal` is a deep green, `--reject` a deep coral), so the inner marketing pages already share the world; the product's `globals.css` is untouched.
