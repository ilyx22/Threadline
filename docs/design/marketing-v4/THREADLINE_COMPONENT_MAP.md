# THREADLINE — COMPONENT MAP

What each section is, what it says, what it shows, and where it lives. The homepage renders `design-system/sections.ts` in order; every word comes from `content/site.ts`.

| # | Section (id) | Job in the commercial story | Composition mechanic | Original scene | Files |
|---|---|---|---|---|---|
| — | Navbar | Wordmark with the cobalt thread; How it works · Who it is for · Playbook; one CTA | fixed bar on the ground | — | `components/Navbar.tsx`, `Icons.tsx` (`Thread`, `Arrow`) |
| 01 | Hero | *Make the expertise that wins the work visible before the sales call.* CTA: See if Threadline fits; secondary: How it works | paper panel, 600px statement column, scene running off the lower-right edge (from 1200) | **Signature 1 — the authority machine**: a six-beat 8s timeline (blocks arrive → the buyer question docks and the stack aligns under AUTHORITY → three expressions peel → a piece reaches a buyer, STRANGER → RECOGNISE → REMEMBER → vermilion PROFILE VISIT / NAMED ENQUIRY → a signal returns); hover for formats and meanings; replay control; three beats on phones | `Hero.tsx`, `HeroScene.tsx` (client), `Frame.tsx`, `styles/hero-choreo.css` |
| 02 | Material ticker | The expertise already exists; where it lives today | italic line over a marquee, edge-masked | mist chips | `MaterialTicker.tsx`, `Marquee.tsx` |
| 03 | Problem (`#problem`) | Strong firms know far more than the market can see | **cinematic moment 1** — a full-bleed band split hard at the firm boundary: night on the left, bone on the right; the memory panel rides 120px up over the seam | **Signature 2 — the expertise vault**: fourteen blocks populate the dark half in under a second; THE THING BUYERS ALWAYS ASK lies buried under the last row; one card lifts off the pile and stops at the firm boundary; the market half stays almost empty | `ProblemSection.tsx`, `.band-split`, `.scene-problem` |
| 04 | Memory (`#memory`) | Familiar to the people who matter, not famous | paper panel riding 120px up over the split band; copy left, scene right | **Signature 3 — memory formation**: a 6.4s timeline; five pieces pass one buyer (a COMPANY UPDATE is ignored; THE METHOD WE USE WHEN… earns RECOGNISE; the judgement, REMEMBER; the proof, TRUST; the trigger, CONVERSATION); the buyer gains rings, steps closer, fills cobalt then vermilion; stamps land on the trace; each stamp explains its stage on hover / tap | `MemorySection.tsx` (client), `.scene-memory`, `memory.passes` |
| 05 | Burden (`#burden`) | You talk, record, approve, sell — Threadline handles everything around those | **cinematic moment 2** — a full-bleed night band; twelve mono labels along its top and bottom edges | **The slabs and the sweep** — four calm slabs with one enormous verb each while the machinery moves around them: the edge strips scroll slowly, and a pile of eight task chips approaches the founder and is swept up into the top strip | `BurdenSection.tsx`, `.band-night`, `.burden-*`, `burden.pile` |
| 06 | Workshop (`#workshop`) | The system, revealed as a place | mosaic: 40/60 · 60/40 · 40/60 tiles in cobalt-soft, mist, vermilion-soft, mist, steel-soft and **night**; hover, tap or focus runs one station at a time (neighbours recede) and reads its explanation | six workstations, each with a 1.5–2.5s micro-story: **signals sorted into bins**, **fragments condensing into a thesis**, **a thesis fanning into frames**, **frames through the door into the field**, **signals into the evidence tray**, **expected vs actual with a lever and one change** | `WorkshopSection.tsx` (client), `.wk-*` |
| 07 | Expressions (`#expressions`) | Idea first, expression second | cobalt-soft panel; pinned root-thesis card + 2.25-peek rail with arrows | the root thesis unlocks and seven **frames** peel out of it in turn; hover, focus or `?` shows the one sentence each expression exists for (`frames[].why`) | `ExpressionsSection.tsx` (client), `Frame.tsx` |
| 08 | Movement (`#movement`) | Reach is not the result | scene left, bleeding 12% off the container edge; copy right | **The staircase** — five descending plates; one signal travels them and is transformed at each (dot → ring → cobalt → person → vermilion opportunity, recorded with its evidence class); loops only while on screen | `MovementSection.tsx`, `.scene-movement`, `.mv-token` |
| 09 | Diagnosis (`#diagnosis`) | Expected → actual → why → change → retest | sticky heading left; instrument right | **Signature 4 — the instrument**: three illustrative cases (weak hook; wrong audience; no destination), five states (keyboard-operable, auto-run until touched); ACTUAL hatches the mismatch, WHY opens the readout and tips the failed component vermilion while the root thesis stays lit, CHANGE is a lever the user drags, RETEST reruns the gauges in cobalt | `DiagnosisSection.tsx` (client), `.instrument*`, `.piece*`, `.gauge*`, `.readout*`, `.control` |
| 10 | Cycle (`#cycle`) | Twelve weeks: establish → calibrate → refine → concentrate | one band bleeding off the right edge of the viewport, never cards; four phase columns beneath | **The accumulator** — twelve hypothesis dots fade, drop and tilt while three validated cobalt stacks rise as the band scrolls (`--p`) | `CycleSection.tsx` (client), `.scene-cycle` |
| 11 | Comparison (`#comparison`) | You could just hire a ghostwriter | five slots per alternative; Threadline row in cobalt with paper slots | **the work table** — slot objects drop into each alternative's tray row by row, Threadline last; narrower jobs simply fill fewer slots | `ComparisonSection.tsx`, `.compare*` |
| 12 | Fit (`#fit`) | Strong fit / poor fit | two columns of verdict tiles | **the sorting** — verdict tiles slide in from the middle into GOOD FIT / NOT OUR MODEL; the marks are small | `FitSection.tsx`, `.verdict*` |
| 13 | Closing (`#closing`) | *Your expertise already wins the work. The question is whether the market sees enough of it.* CTA | **cinematic moment 3** — a night panel overlapping 280px into the ink footer; paper CTA | **The machine, evolved** — the hero callback: the stack assembles, expressions travel out into the market, twelve buyers light in sequence, two signals loop back to the bench, and a sixth cobalt layer lands: ONE LAYER TALLER | `ClosingSection.tsx`, `.closing-panel.is-night`, `.scene-closing`, `closing.taller` |
| — | Footer | link columns, the giant scrolling wordmark set in type, the legal line | ink band | — | `Footer.tsx`, `Marquee.tsx` |

## Inner pages

| Route | Purpose | Files |
|---|---|---|
| `/apply` | Three questions, read by a person; posts nowhere yet (integration step); `mailto:` fallback | `app/apply/page.tsx`, `content/site.ts` → `apply` |
| `/playbook` | **The Expert Firm LinkedIn Playbook** — eleven original chapters with a Do / Not-this pair each; platform safety is a rule of the resource | `app/playbook/page.tsx`, `content/playbook.ts` |
| `/privacy-policy` | Threadline's own short notice; owner inputs in square brackets | `app/privacy-policy/page.tsx`, `content/privacy.ts` |

## Reusable primitives

| Primitive | Class / component | Notes |
|---|---|---|
| Object surface | `.obj` + `.is-<tone>`; `.is-lifted` | the 2.5D base of every scene object |
| Token | `.token` (+ `.dot`) | a labelled slab or pill in mono |
| Frame | `<Frame kind label />` (`.frame*`) | seven native-content silhouettes |
| Buyer marker | `.buyer.is-l0…is-l4` | familiarity levels |
| Verdict tile | `.verdict.is-yes / .is-no` | fit lists |
| Chip | `.chip` | the ticker |
| Slot | `.slot.is-full / .is-half` | comparison |
| Tab | `.tab` (+ `[aria-selected]`, `.is-active`) | instrument states and cases |
| Buttons | `.button-primary` (+ `.is-lg .is-sm .is-ink`), `.button-secondary`, `.text-link`, `<Arrow />` grows on hover | |
| Type | `.h1-88 .h2-64 .h3-28 .eyebrow-serif .label .body-lead .body-copy .body-note` | |
| Layout | `.container .panel .padding-vertical.padding-* .section-head .split .gap-*` | |
| Motion | `<Reveal as once delay>`, `.assemble` with `--i --ax --ay --as`, `.signal-loop`, `data-play` timelines (`.hero-scene`, `.scene-memory`), `data-active` workstations, `data-why` expressions | see the motion system |
| Marquee | `<Marquee msPerSlide gap containerClass>` | two copies, −50%, pauses on hover |

## Content keys (`content/site.ts`)

`brand · links · nav · hero · material · problem · memory · burden · workshop · expressions · movement · diagnosis · cycle · comparison · fit · closing · footer · apply` — and `content/playbook.ts`, `content/privacy.ts`. Rules at the top of `site.ts`: no pricing, no proof, illustrative labelled, no platform in a headline, no promised numbers.
