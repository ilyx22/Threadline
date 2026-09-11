# Threadline public design system — v3 (9 September 2026, the captivation pass)

Source of truth for the public site, with `design-system/threadline-design-dna.json` (3.0.0). Supersedes v2 (the afternoon restraint pass: schematic line drawings, unchanged section order) and v1 (the morning "sticker" system; diagnosis in `VISUAL_DIAGNOSIS_2026-09-09.md`). The authenticated product (`/app`, `/admin`) keeps its own calmer system and is not affected.

Direction, unchanged: about **70% premium editorial / consultancy, 20% interactive system visualisation, 10% playful character.** What v3 changes is the *visualisation*: the system is drawn as tangible objects, not lines, and the homepage is ordered outside-in (problem → outcome → the founder's small part → the system → the commercial path → learning → progression → comparison → fit → ask). Threadline is a managed authority + qualified-demand system; the platform is a component, not the category, and no platform is named in a headline.

## 1. The world

Still **the Authority Factory**: raw expertise goes in, content people want to watch comes out, the market's answer comes back and the next cycle is better informed. v3 renders it as a *miniature machine of objects*: an expertise token, signal chips, a root-thesis card, native content tiles that look different from each other, response markers, and a return module labelled "Expected vs actual". On the homepage the founder appears only where the founder is needed (Input, Record, Approve, Sell). One Founder figure remains (section 04); the Buyer is now an avatar object.

## 2. Colour

Unchanged from v2 (tokens on `.tl-public` in `src/app/public.css`): linen canvas `#F4EEE3`, sunk band `#ECE4D6`, paper `#FFFCF7`, ink ladder `#1F1D1A / #4F4A42 / #7E776C / #A9A297`, accent ember `#D9582A` (deep `#B8461D`, soft `#F8E3D9`), signal teal `#2C7C6A` (soft `#DCEBE6`), stamp `#E8B931` (soft `#F7EBC4`), reject `#C24A3A`, hairlines at 14% / 34% ink.

v3 rules for the tones as *object fills*: paper by default; ember for the founder's tiles and the thesis card's header band; signal for the market's answer (response markers, "qualified", the improvement step); stamp for the commercial event and the enquiry marker; ink for exactly one dark module per scene (the "Expected vs actual" return module, the active chamber, the "what changes here" card). One accent per section still holds; an object scene may use ember + signal + stamp together because each has a fixed meaning.

## 3. Type

Unchanged from v2, with one addition:

- **Display sub-line** — `.tl-display-sub`: the second approved hero line, block, 0.5em of the display size, line-height 1.12, ink-soft, Fraunces at opsz 72. It replaces the marker highlight in the H1.

Display Fraunces 450 at `clamp(2.75rem, 6.2vw, 5.625rem)`; section titles `clamp(2rem, 4.2vw, 3.5rem)`; lead Inter `clamp(1.0625rem, 1.3vw, 1.25rem)`; body 17px; labels JetBrains Mono 11px +0.14em uppercase. Labels inside objects may drop to 10px, never below.

## 4. Shape and surfaces

v2 surfaces remain (`.tl-card`, `.tl-card-quiet`, `.tl-rule*`, `.tl-band`, `.tl-btn*`, `.tl-textlink`, `.tl-chip`, `.tl-stamp`, `.tl-synthetic`). Two changes:

- `.tl-btn` wraps and centres below 640px (no `nowrap` pill may widen a phone page).
- `.tl-textlink` carries `min-height: 44px` so text links meet the target size.

## 5. Objects (new in v3)

`src/components/factory/objects.tsx`, styled by the **Objects** block at the end of `src/app/public.css`; section-specific systems in `src/app/public-v3.css`.

| Object | Class | Use |
|---|---|---|
| `Obj` | `.tl-obj` + `.tl-obj-<tone>` | base surface; 3px bottom edge (`--edge`) + ambient (`--depth`); `--depth-lift` when raised |
| `Token` | `.tl-token` | a thing that moves ("Your expertise") |
| `SignalChip` | `.tl-signal` | a market signal (buyer question, objection, competitor gap) |
| `ThesisCard` | `.tl-thesis*` | root thesis: coloured header band, title, placeholder lines; `compact` for the travelling card |
| `ContentTile` | `.tl-tile*` | native content: `linkedin`, `video`, `x`, `threads`, `carousel`, `newsletter`, `post` — each with its own frame so the derivatives look different |
| `ResponseMarker` | `.tl-response*` | reply / profile / enquiry / call |
| `ScoreCard` | `.tl-score*` | big numeral with a label (route board, learning loop) |
| `Chamber` | `.tl-chamber*` | a factory station; renders a `button` when pressable; `.tl-chamber-active` lifts |
| `ModuleTile`, `OutputTile` | `.tl-module`, `.tl-output` | the Threadline job board; the four outputs in the CTA |
| `BuyerAvatar` | `.tl-buyer*` | recognition levels 0–4 (ring fills, then ember) |
| `VerdictTile` | `.tl-verdict*` | filled check / cross tiles for fit |

Rules: one focal object cluster per section; overlaps of 8–16px; no glass, glow, gradient or WebGL; depth is one soft ambient plus a 3px edge, never a drop shadow with an offset. Section systems: `.tl-machine` (hero, 900×560 scene, `.tl-mc-*` placements), `.tl-contrast*`, `.tl-pool*`, `.tl-labour*`, `.tl-factory*`, `.tl-multiply*`, `.tl-route*`, `.tl-loop*`, `.tl-prog*`, `.tl-compare*`, `.tl-fit`, `.tl-final*`, `.tl-diag*`; on How it works `.tl-stages` / `.tl-stage-tile` (stage rows with the founder's touchpoints badged in ember) and `.tl-gates` / `.tl-gate` (refusal tiles). Who it is for reuses `.tl-fit` and `VerdictTile`.

## 6. Components built from verified reference skeletons

See `COMPONENT_RECONSTRUCTION.md` for the method, captures, verification reports and frozen clones.

| Component | Skeleton | File |
|---|---|---|
| Hero panel | `reference-analysis/clones/birdhouse-hero-panel` (reused) | `src/components/public/hero-panel.tsx`, `.tl-hero-*`; the art is `hero-machine.tsx` |
| Diagnostic (How it works) | `reference-analysis/clones/hydra-constraint-selector` (reused) | `src/components/public/diagnostic.tsx`, `.tl-diag*` |
| Comparison | `reference-analysis/clones/starborn-comparison-table` (new) | `src/components/public/comparison.tsx`, `.tl-compare*` |

`period-cards.tsx` (Hydra offer-card skeleton) is retired from the homepage and kept in the tree.

## 7. Illustration

`src/components/factory/schematic.tsx` (the v2 drawing set: thread, nodes, glyphs, `LineDiagram`, `ReturnThread`, `Branch`, `MemoryThread`, `PeriodTimeline`) is kept for How it works (nine-station line, gates, proof chain) and the playbook. It is no longer used on the homepage. `primitives.tsx` keeps the cast; `Founder` is used once on the homepage and in the playbook.

## 8. Motion with a job

| Where | Motion | Reduced motion |
|---|---|---|
| Hero | objects enter once, 700ms each, staggered 0.2s → 7s (`tl-mc-in`) | shown |
| Factory | idea card travels a container-query track with scroll (one rAF-throttled listener, transform only); active chamber lifts; press holds | scroll link disarmed; press to explore |
| Expressions | MULTIPLY: one card → five tiles, 350ms | end state |
| Learning loop | tablist state switch, arrow keys | instant |
| Progression | scroll progress → CSS variable (dots fade, validated lines thicken) | end state |
| Reveal | one rise per block; route steps and CTA outputs stagger | shown |
| Comparison, fit | none | — |

The reduced-motion block in `public-v3.css` stops every keyframe and transition on the v3 systems. `npm run qa:public` verifies zero running animations under `prefers-reduced-motion` on every public route. No parallax, no ambient float, no auto-carousel, no animation library.

## 9. Layout and responsive

Container 1200; hero panel up to 1500 inside 30px margins with a 640px statement column and, from 1200, the machine absolute right (52%, 50% at ≥1440; panel min-height 680). Breakpoints: 640 (buttons stop wrapping; factory 2-up; pool cards back on the stage; comparison type grows), 768, 992 (hero machine leaves its grid stack for the placed scene), 1024 (pool and labour side by side; factory 4-up), 1200 (hero side by side), 1280 (factory 7-up), 1440. Verified at the 20 public QA widths (1920 → 320) with no horizontal overflow.

## 10. Sections (home, v3 order)

01 Hero · 02 Commercial problem · 03 Desired outcome · 04 Founder burden · 05 Authority Factory · 06 One idea, the right expressions · 07 Attention to commercial movement · 08 How the system learns · 09 Three service periods · 10 The honest comparison · 11 Who it is for · 12 The ask. How it works: diagnostic · stages · nine stations · gates · proof (synthetic) · CTA.

## 11. Copy and claims

Every approved sentence from v2 survives (`CAPTIVATION_PASS_2026-09-09.md` §3). New copy lives under `HOME_V3` and `DIAGNOSTIC` in `src/content/public-site.ts` and reuses the approved sentences by reference. New claims rows: C-COMPARISON, C-LEARNING-ILLUSTRATIVE, C-THESIS-ILLUSTRATIVE, C-FOUNDER-TOUCHPOINTS, C-ROUTE-STEPS. No price, tier, package, "starting from", guarantee, testimonial, logo or case study anywhere; `npm run qa:public` fails on price strings, reference brand names, placeholders, "monthly" and overclaims.

## 12. Where to change things

`src/content/public-site.ts` (every word; `HOME_V3` for the homepage, `DIAGNOSTIC` for the diagnostic) · `src/app/public.css` (tokens, surfaces, objects) · `src/app/public-v3.css` (section systems, reduced motion) · `src/components/factory/objects.tsx` (object primitives) · `src/components/public/*` (sections) · `src/app/(marketing)/*` (pages). Reference skeletons under `reference-analysis/clones/*` are frozen; edit the Threadline components, not the clones. Inspect with `node scripts/qa/run.cjs shoot --out=<dir> --widths=1440,390 --routes=/` (full pages) and `node scripts/qa/run.cjs probe --url=/ --width=1280 --wait=8000 --expr=1 --shot=<file>` (a viewport after the hero has settled).
