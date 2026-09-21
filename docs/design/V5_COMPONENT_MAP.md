# Threadline v5 — component map

State of `src/components/marketing-v5/` and `src/app/(marketing)/` after the review pass of 19 September 2026. The homepage is composed in `src/app/(marketing)/page.tsx` in the order below (eight scenes); every sentence comes from `src/content/marketing-v5.ts`.

## Homepage scenes

| # | Scene (`id`) | Single idea | Art and layouts | Interaction and input modes | Phone recomposition | Content keys | Files |
|---|---|---|---|---|---|---|---|
| 1 | Hero | Expertise leaves the firm's archive and hangs, visible, where the right buyers meet it | `HeroArt` wide (1440×540 panorama: archive → spool → press → pegged line → buyers → reply) and tall (400×800) | Loops only: rollers and gear spin, pegged artefacts sway, sparks twinkle, the founder's bubble blinks, one REPLY signal travels back. The secondary CTA links to `#engagement` | Tall composition; lead and CTAs stack under the headline; CTAs full-width | `hero` | `Sections.tsx` (`Hero`), `art/HeroArt.tsx` |
| 2 | Problem (`#problem`, with `#memory` inside it) | Inside: everything the firm knows. Outside: a website, two posts, one buyer guessing. Then the outcome: familiar to the people who matter | `ProblemArt` wide (1440×620 cutaway, `slice`) and tall (400×1040, the vault clipped and cropped); then the mega statement (an `h3`) and `MemoryArt` wide (1440×420 frieze, five moments, knots) and tall (400×1240) | Threads draw on entry; the partners' bubble and the phone-call bubble blink; sparks twinkle | Vault above, sky and buyer below; the frieze becomes a vertical strip along a thread | `problem` (including `problem.memory`) | `Sections.tsx` (`Problem`), `art/ProblemArt.tsx`, `art/MemoryArt.tsx` |
| 3 | Engagement (`#engagement`) | What you receive: one invented root idea through one four-week period — idea, outputs, rooms, signals, decision | Five typographic steps (`.v5-engagement-steps`) beside `EngagementArt` (420×1040 sheet: a thread down the margin with a knot per step; spool, three artefacts, two rooms with a measured link, four signal pills, a small bench with one block swapped, an ILLUSTRATIVE stamp). The sheet is `position: sticky` at 96px on desktop | None. The sheet settles on entry and its thread draws | Single column; the sheet sits under the steps, static, max 420px | `engagement` | `Sections.tsx` (`Engagement`), `art/EngagementArt.tsx` |
| 4 | Burden (`#burden`) | Calm founder, busy machine | `CalmFounder` (520×420) beside `BusyMachine` (760×420); verbs list and relief line below | Belt rollers, conveyed artefacts, gears; paused off screen | Panels stack; verbs 2 → 1 columns | `burden` | `Sections.tsx` (`Burden`), `art/BurdenArt.tsx` |
| 5 | Workshop (`#workshop`) | One root idea travels six stations — Listen, Decide the idea, Make it, Put it in the room, Read what came back, Change one thing — and is changed at each | `WorkshopArt` (1800×550 panorama, six plated stations, a carrier with six object states) inside `WorkshopStage`; the whole bench is visible at once and all six captions are listed under it in `.v5-stations` | Six numbered station buttons (`.v5-dot`, `aria-pressed`) and ← → in a `role="group"`; the group's `onKeyDown` handles ArrowLeft/Right/Up/Down, Home and End and moves focus to the chosen button. Choosing a station moves the carrier and marks that caption `data-on="true"`. No scroll-linked behaviour | Panorama is 400% of the frame (`PAN_SCALE`) and pans by `--pan` (computed per station so the station is centred and never past the artwork's edge); the controls wrap (the six 44px buttons drop to a full-width row under ← →, on one line even at 320); only the active caption is shown, all six when `scripting: none` | `workshop` | `WorkshopStage.tsx`, `art/WorkshopArt.tsx`, `Sections.tsx` (`Workshop`) |
| 6 | Diagnosis (`#diagnosis`) | Expected, actual, why, change, retest — on a bench | `Bench` (900×520: the piece on five blocks, three jars with expected flags, the hook, the inspector) | Case chips; five state tabs (arrow keys, Home/End); Back/Next/Run; a range lever in the Change state; auto-run every 1.6s | Grid stacks; chips wrap; the bench scales | `diagnosis` | `Bench.tsx`, `Sections.tsx` (`Diagnosis`) |
| 7 | Fit (`#fit`, with `#comparison` inside it) | Through the gate, or turned away kindly; then what each alternative covers | `GateArt` (420×310) between two typographic lists with knot bullets; below a rule, the HTML abacus (five rows on wires, beads full / half / empty, Threadline row on night) with an `h3` heading | None (the abacus is a `role="table"`) | Gate first, then the two lists; abacus column headers turn vertical, beads shrink to 20px | `fit`, `comparison` | `Sections.tsx` (`Fit`), `art/SmallArt.tsx` |
| 8 | Closing (`#closing`) | The opening world, changed: tidy archive, more on the line, knots, buyers lit, two signals back | `HeroArt evolved` wide and tall on a sky-deep dusk panel | The hero loops plus an ENQUIRY signal | Tall composition | `closing` | `Sections.tsx` (`Closing`), `art/HeroArt.tsx` |

Every scene section carries `data-scene`; `Motion` marks it `data-inview` for the draw and loop rules.

## Shared components

| Component | File | Notes |
|---|---|---|
| `Nav` | `Nav.tsx` (client) | Sticky, parchment with blur, ink hairline. Three links + Sign in + the CTA; a 44px drawer button below 900px; Escape and route change close the drawer. `Wordmark` (name + a short thread) is exported for the footer. |
| `Footer` | `Footer.tsx` | Ink band, gold top rule; columns from `FOOTER` in `public-site.ts`; the division-of-labour line from `burden.relief`. |
| `Motion` | `Motion.tsx` (client) | The single IntersectionObserver; sets `data-js` on `<html>`. Renders nothing. |
| `Seam` | `Sections.tsx` | The thread crossing between sections; `from`/`to` are percentages of width. |
| `Head` | `Sections.tsx` | Eyebrow + h2 (+ lead); `on="dark"` for night bands; `mega` for a full-width statement. |
| The kit | `art/kit.tsx` | `C`, `LINE`, `CH`, `labelWidth`, `At`, `Thread`, `Knot`, `Spool`, `Person` (faceless scale figure), `Artefact`, `Pegged`, `Crate`, `PaperStack`, `Folder`, `Binder`, `Gear` (still), `Lamp`, `Desk`, `Armchair`, `Spark`, `Signal`, `Plate`, `Grain`, `outline`; `SKIN` remains exported but unused. |
| `AcquisitionCalculator` | `AcquisitionCalculator.tsx` (client) | Moved from `marketing-v4/` unchanged; used by the Playbook hub; styled by `inner.css`. |
| Hero explorations | `art/HeroExplorations.tsx` | `HeroCutaway` (B) and `HeroTypographic` (C), design-lab only. |

Stylesheets: `src/styles/marketing-v5/index.css` imports `tokens.css`, `art.css`, `page.css`, `motion.css`, `inner.css` in that order; the marketing layout imports `public.css`, `public-v3.css`, then `marketing-v5/index.css`.

## Inner pages

`/how-it-works`, `/who-its-for`, `/playbook`, `/playbook/[chapter]`, `/apply`, `/calculator` keep their components (`src/components/public/*`, `src/components/factory/*`) and take the v5 palette through the retokened `.tl-public` variables in `src/app/public.css`: `--canvas` parchment, `--paper` white, `--ink` `#18213a`, `--accent` and `--accent-deep` ink (buttons, eyebrows), `--accent-soft` butter, `--signal` deep green, `--stamp` gold, `--reject` deep coral, `--steel-soft` sky. `inner.css` rounds `.tl-btn-primary`, thickens `.tl-card` borders, and styles the Playbook tools (`.pb-tool`, `.acq-*`). The application form and its server action are untouched.

## Design lab

`src/app/(marketing)/design-lab/page.tsx` — palette swatches, the people and artefact families, hero A/B/C, the vault, the workshop at station 3, and the two phone layouts. `notFound()` when `NODE_ENV === "production"`; `/design-lab` is in the `disallow` list in `src/app/robots.ts`; the page metadata is `noindex`.

## QA

`scripts/qa/marketing-v5.ts` (`npm run qa:marketing`) checks: eight scenes present and nothing hidden before reveal; the engagement example has five steps, a sheet and the illustrative label; the workshop starts at station 1 with all six captions readable on desktop, moves by station button, by ArrowRight and End on a focused button (focus follows), and has no keyboard handler on a non-focusable art element; the bench walks its states, lever and auto-run; no horizontal overflow at 1440/1024/768/390/320 and 44px targets at 390/320; the phone drawer; on a 390 phone the workshop controls stay inside the viewport at 44px, every one of the six stations is framed inside the artwork bounds, and there is no overflow after panning to the last station; reduced motion; the server HTML carries all six captions, the bench's Expected readout and the engagement steps; copy rules.

## Removed

In the review pass: the six-tag strip, the Expressions scene (`Expressions.tsx`, `art/ExpressionsArt.tsx`), the Movement scene (`art/MovementArt.tsx`), the Cycle scene (`CycleArt`), the standalone Comparison section and `TinyOperator` (the abacus now lives inside Fit); content keys `strip`, `memory` (now `problem.memory`), `expressions`, `movement`, `cycle`; the workshop's sticky sentinel track and caption block.

Earlier (v4, unreferenced after the rebuild): `src/components/marketing-v4/{BurdenSection,ClosingSection,ComparisonSection,CycleSection,DiagnosisSection,ExpressionsSection,FitSection,Footer,Frame,Hero,HeroScene,Icons,Marquee,MemorySection,MovementSection,Navbar,ProblemSection,Reveal,ValueGrid,WorkshopSection}.tsx`, `src/content/marketing-site.ts`, `src/content/marketing-tokens.ts`, `src/styles/marketing/marketing.css` (the generated port) and `src/styles/marketing/marketing-extra.css`. `AcquisitionCalculator.tsx` moved to `marketing-v5/` (git rename, identical). `src/components/marketing/reveal.tsx`, `public.css`, `public-v3.css` and the `public/` and `factory/` component folders remain because the inner pages use them.
