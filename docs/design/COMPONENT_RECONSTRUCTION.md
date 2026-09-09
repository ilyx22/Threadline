# Component-first clean-room reconstruction

The method used for the 9 September 2026 public-site pass, and the record of what was harvested, cloned, verified and mutated. The principle:

> If we like a reference component: clone it first, prove the clone, freeze the clone, then mutate that working skeleton into Threadline. Never look at a component, absorb a vague "vibe", and rebuild something inspired by it from memory.

## The pipeline

| Stage | Tool / location | Output |
|---|---|---|
| OBSERVE | `reference-analysis/tools/capture-reference.ts` (whole page, 20 widths) | `reference-analysis/<site>/{screenshots,responsive,dom,geometry,styles,typography,motion,assets,verify}` |
| CAPTURE + MEASURE | `reference-analysis/tools/capture-component.ts <site> <url> "<anchor text>" <name> [--click=text=…] [--hover=text=…] [--climb=section]` | `reference-analysis/<site>/components/<name>/<width>.{default,hover,clickN}.jpg` and `.measure.json` (every descendant's box relative to the component root, computed typography, borders, radii, shadows, transitions, animations, exposed keyframes); `capture.json` records the method and states |
| READ | `python reference-analysis/tools/summarise-measure.py <measure.json> [depth]` | a compact tree with `[path]` ids used by `data-ref` |
| CLONE | `reference-analysis/clones/<name>/index.html` — one self-contained HTML file, neutral placeholder copy and assets, the reference's geometry, type scale, surfaces, states and transitions | the clone baseline |
| VERIFY | `reference-analysis/tools/verify-clone.ts <site> <name>` — opens the clone at each width, measures the elements marked `data-ref="<reference path>"`, compares position/size (tolerance 4px) and type/surface styles against the reference measure | `reference-analysis/clones/<name>/verify/{<width>.jpg,<width>.measure.json,report.json}` |
| FREEZE | The clone folder is committed and not edited again. It is outside `src/` and `public/`, never built or served | `reference-analysis/clones/<name>/FROZEN.md` states the verified result |
| DUPLICATE + MUTATE | A Threadline React component is written **from the frozen clone's CSS and structure** (same boxes, spacing, states and easings), then copy, palette, type, glyphs and data become Threadline's | `src/components/public/<name>.tsx` |
| INTEGRATE | The mutation replaces the presentation of an **existing** Threadline section; the section's content module is unchanged | `src/app/(marketing)/**` |
| QA | reference vs clone (verify report) · clone vs mutation (measured with the same tool against the production build) · old section vs new section (`qa-baselines/public/` before/after, `npm run qa:visual:compare`) | `docs/design/COMPONENT_RECONSTRUCTION.md` (this file) |

Clean-room boundaries: rendered DOM, computed styles, bounding boxes, public fonts and assets, visible interactions, screenshots. No source maps, no private repositories, no authentication, no infrastructure, no credentials. Reference-specific brand, copy, names, figures, testimonials, logos and illustrations are replaced with neutral placeholders in the clone and with Threadline originals in the mutation (`reference-analysis/<site>/forbidden-to-copy.md`).

## Component harvest (9 September 2026)

Classification: **A** = clone the skeleton first; **B** = take the principle only; **C** = ignore.

| # | Source | URL / section | Class | Why | Intended Threadline use |
|---|---|---|---|---|---|
| 1 | Birdhouse | thebirdhouse.co — hero: white 60px-radius panel on a tinted canvas, statement left (italic serif eyebrow, 90px serif H1, 20px lead, one pill CTA) and an illustration cluster right that overlaps the panel's bottom edge | **A** | The cleanest measured instance of "one paper panel, statement left, picture right"; proportions (500px text column inside a 1280 container, 64px top padding, 80/30px section padding) are worth inheriting exactly | Home hero (existing copy, existing CTAs) |
| 2 | Hydra | workwithhydra.com — "The diagnosis": pill tabs → white diagram panel whose SVG highlights the selected stage → symptom card + dark "what we change first" card | **A** | Proven interaction geometry for choose → diagram reacts → explanation; transitions and responsive collapse are measured | Home "The problem": the four existing symptom points become the tabs; the diagram is Threadline's nine-station line; the explanation panel reuses the existing how-it-works stage copy |
| 3 | Hydra | workwithhydra.com — "Where to start": three link cards with eyebrow → title → body → sunk diagram box (stage chips over a rule + mono caption) → fact line → arrow link | **A** | The card skeleton is exactly the shape of Threadline's "Three service periods" content; the inner diagram box gives each period a picture without an illustration | Home "Three service periods" (four cards) |
| 4 | Birdhouse | Whole-page surface system: one canvas, white cards, no rules, no shadows, large radii | B | Global principle already partly applied; the shadow/outline language is what the restraint pass removes | `public.css` surfaces |
| 5 | Birdhouse | Footer giant clipped wordmark | B | Threadline already has it; keep, remove the wavy thread | Footer |
| 6 | Birdhouse | 2×2 stat cluster with mascots | C | Threadline has no client figures to show and will not invent any | — |
| 7 | Birdhouse | Card carousel with arrows, team photo grid, video hero background | C | Content Threadline does not have | — |
| 8 | Hydra | Hero: centred 56–72px sans headline with italic violet phrase and hand-drawn underline, two pill CTAs, one testimonial | B (device only) | Threadline's hero stays left-aligned (ref 1); the "one emphasised phrase" device maps to the existing marker highlight | — |
| 9 | Hydra | System diagram (funnel → pipes → stations → gauge → result) | B | Cloning the drawing would clone their content; the principle — schematic nodes on one line, one accent for the active node, hairline strokes — redraws Threadline's machine | Machine section, how-it-works |
| 10 | Hydra | Big stat row on hairline rules (300+ / 9.2/10 / 30+) | B | Hairline evidence layout for the "Reach is not the result" comparison; no stats invented | Attention section |
| 11 | Hydra | Case-study rows (numbered, hairline rules, big figures, arrow) | B | Threadline's synthetic proof chain becomes a numbered hairline ledger | Product proof section |
| 12 | Hydra | FAQ accordion | C (proposal) | Threadline has no FAQ content; adding one is an owner decision, recorded in OWNER DECISIONS | — |
| 13 | Hydra | Inputs / System / Output three-card row | B | Already expressed by the hero's in/out/back line | — |
| 14 | Hydra | Section reveal: opacity + translate 0.7s `cubic-bezier(0.16, 1, 0.3, 1)` | B | Threadline's reveal keeps its own 500ms; the easing is adopted for the drawn thread | `public.css` |

## A-class clone results

Filled in from `reference-analysis/clones/<name>/verify/report.json` after verification. See each clone's `FROZEN.md`.

| Clone | Captured | Fidelity (verify-clone, 4px tolerance) | Responsive | Motion | Deviations | Baseline |
|---|---|---|---|---|---|---|
| `birdhouse-hero-panel` | 1440/1024/768/390, default + CTA hover, 30 nodes | 1440: root Δ0 × Δ0, 13/14 structural nodes within tolerance after allowing for the reference's mid-reveal capture (text column recorded at translateY 20.56px); 1024: Δ0 × Δ0 | panel 60px→30px radius, text column 500px → centred stack below 992, h1 90 → 64 → 48px, CTA 60px pill (30px radius on phone), illustration 85% of the wrapper bottom-right → below the text | CTA `all .3s ease`; reference text reveal noted, clone renders settled state | neutral grey cluster instead of the character/video art; tablet illustration height estimated (560px); placeholder copy line counts | `reference-analysis/clones/birdhouse-hero-panel/` (+ `verify/report.json`, `FROZEN.md`) |
| `hydra-constraint-selector` | 1440/1024/768/390, default + 3 tab states, 56 nodes | 1440: root Δ0 × Δ0, 24/31 within tolerance (misses are placeholder-text widths); 768: Δ0 × Δ0, 24/31; 1024: Δh −14 (heading wrap); 390: diagram correctly absent, 11/29 | tabs → 2-col grid and diagram hidden < 640; cards stack < 1024; heading `clamp(2rem, 4.2vw, 3.5rem)`, lead 16 → 17.28px ≥ 1280, card title 22 → 28.8px | tab 0.15s `cubic-bezier(.4,0,.2,1)`; strokes 0.5s / 0.3s `cubic-bezier(.16,1,.3,1)`; reveal 0.7s | `9999px` vs `3.35544e+07px` radius (identical rendering); neutral re-drawing of the stage art | `reference-analysis/clones/hydra-constraint-selector/` |
| `hydra-offer-cards` | 1440/1024/768/390, default + link hover, 92 nodes | 1440: root Δ0 × Δ0, **37/38** within tolerance (worst 30px = placeholder link text); 1024/768: Δh ±22 (body line counts); 390: −176 (reference swaps in a taller mobile SVG) | 3 → 2 → 1 columns at 1024 / 768; section padding 128 → 96 < 640 | reveal 0.7s; arrow `transform .3s` on hover (4px assumed) | single responsive diagram instead of desktop/mobile pair; placeholder copy | `reference-analysis/clones/hydra-offer-cards/` |

## Threadline mutations

Recorded per component in the same FROZEN.md files under "Mutation", and summarised in `docs/design/THREADLINE_PUBLIC_DESIGN_SYSTEM.md`.
