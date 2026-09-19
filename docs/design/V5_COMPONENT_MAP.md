# Threadline v5 — component map

State of `src/components/marketing-v5/` and `src/app/(marketing)/` on 19 September 2026. The homepage is composed in `src/app/(marketing)/page.tsx` in the order below; every sentence comes from `src/content/marketing-v5.ts`.

## Homepage scenes

| # | Scene (`id`) | Single idea | Art and layouts | Interaction and input modes | Phone recomposition | Content keys | Files |
|---|---|---|---|---|---|---|---|
| 1 | Hero | Expertise leaves the firm's archive and hangs, visible, where the right buyers meet it | `HeroArt` wide (1440×540 panorama: archive → spool → press → pegged line → buyers → reply) and tall (400×800) | Loops only: rollers and gear spin, pegged artefacts sway, sparks twinkle, the founder's bubble blinks, one REPLY signal travels back | Tall composition; lead and CTAs stack under the headline; CTAs full-width | `hero` | `Sections.tsx` (`Hero`), `art/HeroArt.tsx` |
| 1b | Strip | The six things the system is, hung as tags on the line | HTML: an SVG thread and six `.v5-tagline` items with a wooden peg each | Tags hang in with a 70ms stagger on entry | 3 columns, then 2 | `strip` | `Sections.tsx` (`Strip`) |
| 2 | Problem (`#problem`) | Inside: everything the firm knows. Outside: a website, two posts, one buyer guessing | `ProblemArt` wide (1440×620 cutaway, `slice`) and tall (400×1040, the vault clipped and cropped) | Thread draws through the hatch on entry; the partners' bubble blinks | Vault above, sky and buyer below | `problem` | `Sections.tsx` (`Problem`), `art/ProblemArt.tsx` |
| 3 | Memory (`#memory`) | The same buyer meets the same clear thinking until it is obvious who to call | Mega typographic statement, then `MemoryArt` wide (1440×420 frieze, five moments, knots) and tall (400×1240) | Thread draws; sparks twinkle; the phone-call bubble | Frieze becomes a vertical strip along a thread; encounters list goes 2 → 1 columns | `memory` | `Sections.tsx` (`Memory`), `art/MemoryArt.tsx` |
| 4 | Burden (`#burden`) | Calm founder, busy machine | `CalmFounder` (520×420) beside `BusyMachine` (760×420); verbs list and relief line below | Belt rollers, conveyed artefacts, gears; paused off screen | Panels stack; verbs 2 → 1 columns | `burden` | `Sections.tsx` (`Burden`), `art/BurdenArt.tsx` |
| 5 | Workshop (`#workshop`) | One root idea travels six stations and is changed at each | `WorkshopArt` (1800×550 panorama, six stations, a carrier with six object states) inside `WorkshopStage` | Scroll (six sentinels move the carrier), buttons, dots, ← → keys on the focused stage; caption `aria-live` | Stage not sticky; the panorama pans by station inside a clipped frame; prev/next and dots drive it | `workshop` | `WorkshopStage.tsx`, `art/WorkshopArt.tsx`, `Sections.tsx` (`Workshop`) |
| 6 | Expressions (`#expressions`) | The idea determines the expression | Thesis sheet (HTML blockquote), `ExpressionsArt` (1200×600: spool on a stand, seven threads to seven artefacts with plates) | Hover, focus or press a button: the artefact lifts, the others dim, the why-sentence shows (`aria-expanded`, `aria-pressed` for a pinned one) | Arc hidden; vertical list with thumbnails; tap reveals the line inline | `expressions` | `Expressions.tsx`, `art/ExpressionsArt.tsx`, `Sections.tsx` (`ExpressionsSection`) |
| 7 | Movement (`#movement`) | Reach is not the result; attention becomes commercially legible step by step | `MovementArt` wide (1440×620 stepped street, evidence stamps) and tall (400×1300) | Thread draws; the meeting bubble | Vertical street along a thread with stamps | `movement` | `Sections.tsx` (`Movement`), `art/MovementArt.tsx` |
| 8 | Diagnosis (`#diagnosis`) | Expected, actual, why, change, retest — on a bench | `Bench` (900×520: the piece on five blocks, three jars with expected flags, the hook, the inspector) | Case chips; five state tabs (arrow keys, Home/End); Back/Next/Run; a range lever in the Change state; auto-run every 1.6s | Grid stacks; chips wrap; the bench scales | `diagnosis` | `Bench.tsx`, `Sections.tsx` (`Diagnosis`) |
| 9 | Cycle (`#cycle`) | Twelve loose threads become a few woven strands | `CycleArt` (1440×440 loom: hypotheses, the gather ring, cuts, the woven band) | Thread draws | Diagram in a pannable frame (900px min width); phases stack | `cycle` | `Sections.tsx` (`Cycle`), `art/SmallArt.tsx` |
| 10 | Comparison (`#comparison`) | What each alternative covers; Threadline adds the loop | HTML abacus: five rows on wires, beads full / half / empty; Threadline row on night; `TinyOperator` beside it | None (a `role="table"`) | Vertical column headers; smaller beads; name column min-width | `comparison` | `Sections.tsx` (`Comparison`), `art/SmallArt.tsx` |
| 11 | Fit (`#fit`) | Through the gate, or turned away kindly | `GateArt` (420×310) between two typographic lists with knot bullets | None | Gate first, then the two lists | `fit` | `Sections.tsx` (`Fit`), `art/SmallArt.tsx` |
| 12 | Closing (`#closing`) | The opening world, changed: tidy archive, more on the line, knots, buyers lit, two signals back | `HeroArt evolved` wide and tall on a sky-deep dusk panel | The hero loops plus an ENQUIRY signal | Tall composition | `closing` | `Sections.tsx` (`Closing`), `art/HeroArt.tsx` |

Every scene section carries `data-scene`; `Motion` marks it `data-inview` for the draw and loop rules.

## Shared components

| Component | File | Notes |
|---|---|---|
| `Nav` | `Nav.tsx` (client) | Sticky, parchment with blur, ink hairline. Three links + Sign in + the CTA; a 44px drawer button below 900px; Escape and route change close the drawer. `Wordmark` (name + a short thread) is exported for the footer. |
| `Footer` | `Footer.tsx` | Ink band, gold top rule; columns from `FOOTER` in `public-site.ts`; the division-of-labour line from `burden.relief`. |
| `Motion` | `Motion.tsx` (client) | The single IntersectionObserver; sets `data-js` on `<html>`. Renders nothing. |
| `Seam` | `Sections.tsx` | The thread crossing between sections; `from`/`to` are percentages of width; `tone="dark"` is reserved for a darker variant. |
| `Head` | `Sections.tsx` | Eyebrow + h2 (+ lead); `on="dark"` for night bands; `mega` for the memory statement. |
| The kit | `art/kit.tsx` | `C`, `SKIN`, `At`, `Thread`, `Knot`, `Spool`, `Person`, `Artefact`, `Pegged`, `Crate`, `PaperStack`, `Folder`, `Binder`, `Gear`, `Lamp`, `Desk`, `Armchair`, `Spark`, `Signal`, `Plate`, `Grain`, `outline`. |
| `AcquisitionCalculator` | `AcquisitionCalculator.tsx` (client) | Moved from `marketing-v4/` unchanged; used by the Playbook hub; styled by `inner.css`. |
| Hero explorations | `art/HeroExplorations.tsx` | `HeroCutaway` (B) and `HeroTypographic` (C), design-lab only. |

Stylesheets: `src/styles/marketing-v5/index.css` imports `tokens.css`, `art.css`, `page.css`, `motion.css`, `inner.css` in that order; the marketing layout imports `public.css`, `public-v3.css`, then `marketing-v5/index.css`.

## Inner pages

`/how-it-works`, `/who-its-for`, `/playbook`, `/playbook/[chapter]`, `/apply`, `/calculator` keep their components (`src/components/public/*`, `src/components/factory/*`) and take the v5 palette through the retokened `.tl-public` variables in `src/app/public.css`: `--canvas` parchment, `--paper` white, `--ink` `#18213a`, `--accent` and `--accent-deep` ink (buttons, eyebrows), `--accent-soft` butter, `--signal` deep green, `--stamp` gold, `--reject` deep coral, `--steel-soft` sky. `inner.css` rounds `.tl-btn-primary`, thickens `.tl-card` borders, and styles the Playbook tools (`.pb-tool`, `.acq-*`). The application form and its server action are untouched.

## Design lab

`src/app/(marketing)/design-lab/page.tsx` — palette swatches, the people and artefact families, hero A/B/C, the vault, the workshop at station 3, and the two phone layouts. `notFound()` when `NODE_ENV === "production"`; `/design-lab` is in the `disallow` list in `src/app/robots.ts`; the page metadata is `noindex`.

## Removed in this pass

Deleted (v4, unreferenced after the rebuild): `src/components/marketing-v4/{BurdenSection,ClosingSection,ComparisonSection,CycleSection,DiagnosisSection,ExpressionsSection,FitSection,Footer,Frame,Hero,HeroScene,Icons,Marquee,MemorySection,MovementSection,Navbar,ProblemSection,Reveal,ValueGrid,WorkshopSection}.tsx`, `src/content/marketing-site.ts`, `src/content/marketing-tokens.ts`, `src/styles/marketing/marketing.css` (the generated port) and `src/styles/marketing/marketing-extra.css`. `AcquisitionCalculator.tsx` moved to `marketing-v5/` (git rename, identical). `src/components/marketing/reveal.tsx`, `public.css`, `public-v3.css` and the `public/` and `factory/` component folders remain because the inner pages use them.
