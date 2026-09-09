# Threadline public design system — v2 (9 September 2026, the restraint pass)

Source of truth for the public site, with `design-system/threadline-design-dna.json`. Supersedes v1 (the illustrated "sticker" system of the morning of 9 September), whose diagnosis is in `VISUAL_DIAGNOSIS_2026-09-09.md`. The authenticated product (`/app`, `/admin`) keeps its own calmer system and is not affected.

Direction: about **70% premium editorial / consultancy, 20% interactive system visualisation, 10% playful illustrated character.** Premium here means proportion, typography, restraint, spacing, composition and implementation quality — not darkness, gradients or glass.

## 1. The world

The concept is still **the Authority Factory**: raw expertise goes in one end, content people want to watch comes out the other, and the market's answer travels back along a thread so the next batch is better informed. What changed is how it is drawn. v1 rendered a literal factory (monitors, crates, striped belts, rotated stamps, stick-figure cast everywhere). v2 renders a **system drawing**: one thread, nodes for stations, a spool for raw expertise, a fork for decisions, cut marks for production, a routing fork for distribution, a pulse for the market's answer, a loop for learning, an inspection mark for gates. The two human figures (Founder, Buyer) survive as the 10% of character, used twice on the home page and in two playbook chapters.

## 2. Colour

Tokens on `.tl-public` in `src/app/public.css`.

| Token | Value | Role |
|---|---|---|
| `--canvas` | #F4EEE3 | page ground (warm linen) |
| `--canvas-deep` | #ECE4D6 | sunk bands, diagram boxes |
| `--paper` | #FFFCF7 | panels, cards |
| `--line` | rgba(31,29,26,.14) | hairlines, quiet card borders |
| `--line-strong` | rgba(31,29,26,.34) | card borders, section rules |
| `--ink` / `--ink-soft` / `--ink-faint` / `--ink-ghost` | #1F1D1A / #4F4A42 / #7E776C / #A9A297 | text ladder |
| `--accent` / `--accent-deep` / `--accent-soft` | #D9582A / #B8461D / #F8E3D9 | the one accent: Apply, the active node, the thread's trunk |
| `--signal` / `--signal-soft` | #2C7C6A / #DCEBE6 | the market's answer, verdicts, "qualified" |
| `--stamp` / `--stamp-soft` | #E8B931 / #F7EBC4 | the marker highlight in the H1 and the eyebrow inside dark cards; nothing else |
| `--reject` | #C24A3A | refusals |

Rules: one accent per section; the illustration palette is ink + accent + signal only; steel and stamp fills are gone from drawings; no gradients; shadows are effectively none (the shared `--shadow-*` tokens remap to none / a 1px hairline / a very soft ambient for the few UI components that need them).

## 3. Type

- **Display** — Fraunces (variable; `opsz` 144 / `SOFT` 20 / `WONK` 0), weight **450**, letter-spacing −0.022em, line-height 1.0; size `clamp(2.75rem, 6.2vw, 5.625rem)` (90px at 1440, the reference hero scale).
- **Section title** — Fraunces, weight 450, `clamp(2rem, 4.2vw, 3.5rem)` (56px at 1440, 43px at 1024, 32px at ≤768 — the measured reference scale), line-height 1.04, max 20ch.
- **Sub title** — Fraunces 500, `clamp(1.375rem, 2vw, 1.75rem)`.
- **Numerals** — `.tl-numeral`, Fraunces 400 at opsz 144, tabular.
- **Lead** — Inter, `clamp(1.0625rem, 1.3vw, 1.25rem)` / 1.55, ink-soft, 42rem measure.
- **Body** — Inter 17px / 1.6, ink-soft, 62ch measure.
- **Label / eyebrow** — JetBrains Mono 11px, +0.14em, uppercase, weight 500, **ink-faint by default**; a section may promote its eyebrow to `accent-deep` once.

The type does the hierarchy; boxes no longer do.

## 4. Shape and surfaces

| Class | What it is |
|---|---|
| `.tl-card` | paper, 1px `--line-strong`, radius 16, no shadow; `.tl-card-hover` darkens the border on hover |
| `.tl-card-quiet` | paper, 1px `--line`, radius 16 |
| `.tl-rule` / `.tl-rule-strong` / `.tl-ledger` | hairline rules between sections, rows and list items — the default way to separate content |
| `.tl-dark`, `.tl-detail-dark` | the one ink surface (the "what changes here" card) |
| `.tl-band` | sunk band (`--canvas-deep`) between hairlines; used for three sections on the home page, not alternating |
| `.tl-btn` (+ `-primary`, `-lg`, `-sm`, `-ghost`) | pills: 52 / 60 / 44px tall, 1px border, accent fill for Apply only, no shadow, hover inverts |
| `.tl-textlink` | 15px/600 accent-deep with an arrow that moves 4px on hover |
| `.tl-chip` | quiet: canvas-deep fill, no border, 28px, mono 11px |
| `.tl-stamp` | a verdict label: 1px current-colour outline, never rotated, one per moment (`-signal`, `-reject`, `-ink`) |
| `.tl-synthetic` | dashed hairline label for synthetic demonstrations |

Radii: 48 (hero panel) / 16 (cards) / 12 (selector, detail and period cards) / 8 (diagram boxes) / 999 (buttons, tabs).

## 5. Components built from verified reference skeletons

See `COMPONENT_RECONSTRUCTION.md` for the method, captures, verification reports and frozen clones.

| Component | Skeleton | File |
|---|---|---|
| Hero panel | `reference-analysis/clones/birdhouse-hero-panel` | `src/components/public/hero-panel.tsx`, `.tl-hero-*` |
| Symptom selector | `reference-analysis/clones/hydra-constraint-selector` | `src/components/public/symptom-selector.tsx`, `.tl-tabs`, `.tl-selector-*`, `.tl-detail*`, `.tl-stage` |
| Period cards | `reference-analysis/clones/hydra-offer-cards` | `src/components/public/period-cards.tsx`, `.tl-offer-*`, `.tl-diagram-box`, `.tl-fact` |

## 6. Illustration

`src/components/factory/schematic.tsx` — glyphs (`Spool`, `Lens`, `Fork`, `Cut`, `Route`, `Pulse`, `Loop`, `InspectionMark`, `Package`, `STAGE_GLYPH`) and diagrams (`LineDiagram`, `HeroLine`, `ReturnThread`, `Branch`, `MemoryThread`, `PeriodTimeline`). Stroke 1.5px ink (`.tl-thread`), accent 2px for the trunk (`.tl-thread-accent`), soft hairline for guides (`.tl-thread-soft`); nodes 7–10px radius, filled with the accent when lit, with a breathing halo when active; labels 10–12px mono.

`src/components/factory/primitives.tsx` keeps the v1 cast and stations for the record; only `Founder`, `Buyer` and `ThreadWordmark` are used on the public site now.

## 7. Motion with a job

| Class | Job | Reduced motion |
|---|---|---|
| `.tl-draw` on a path | draws lineage as a section reveals (1.4s, ease-out-expo) | drawn instantly |
| `<animateMotion>` inside `ReturnThread` | the market's answer travelling back (2.6s loop, in SVG units so it scales) | a still dot at rest |
| `.tl-light` | the active node breathes (2s) | still |
| `.tl-stamp-in` | a verdict lands (320ms scale-in, no rotation) | shown |
| `.tl-tab` / `.tl-stage` | selector state changes (150ms / 300–500ms, `cubic-bezier(0.16, 1, 0.3, 1)`) | instant |
| `Reveal` | one quiet rise-and-fade per block (500ms) | shown |

The conveyor stripe animation is retired; `.tl-belt` remains as an inert hairline so nothing breaks.

## 8. Layout and responsive

Container 1200 (`.tl-container`), hero panel up to 1500 inside 30px margins (`.tl-hero-pad`), section padding `clamp(4.5rem, 9vw, 8rem)`. Breakpoints: 640 (tabs → 2-column grid, selector diagram hidden), 768 (period cards 2-up, memory labels shown), 992 (hero stacks below), 1024 (selector cards side by side, machine line horizontal), 1280 (period cards 4-up). Verified at the 20 public QA widths from 1920 to 320 with no horizontal overflow.

## 9. Sections (home, unchanged order)

Hero · The problem (selector) · The division of labour · The machine · Where most stop · One idea, many expressions · Market memory · Commercial attention · How the system learns · The first 12 weeks (period cards) · Product proof · Fit · Apply.

## 10. Copy and claims

No public copy changed in v2 except the removal of the exact service price from the footer and the how-it-works CTA (owner decision DEC-017; `docs/site/CLAIMS_EVIDENCE_LEDGER.md` C-PRICE). `npm run qa:public` now fails on any price disclosure. Interaction labels added: "Symptom 01 of 04", "Where the line fixes it", "↑ addressed here", "See how the line works", "Weeks 1–4 · one 4-week service period", "Published / most stop here".

## 11. Where to change things

`src/app/public.css` (tokens, surfaces, components, motion) · `src/content/public-site.ts` (every word) · `src/components/factory/schematic.tsx` (drawings) · `src/components/public/*` (components) · `src/app/(marketing)/*` (pages). Reference skeletons live under `reference-analysis/clones/*` and are frozen; edit the Threadline components, not the clones.
