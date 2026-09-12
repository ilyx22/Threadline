# THREADLINE — MOTION SYSTEM

Every motion has a job. If a movement does not explain something about the system it is not on the page. No animation library: CSS transitions and keyframes, `IntersectionObserver` (`components/Reveal.tsx`, `HeroScene.tsx`, `MemorySection.tsx`), and one rAF-throttled scroll listener (`components/CycleSection.tsx`). Reveal and assembly timings live in `design-system/tokens.ts` → `motion.*`; the signature timelines are hand-authored percentage keyframes in `styles/hero-choreo.css` and `styles/scenes.css`.

The engineering of the scenes (absolute layers inside clipped fixed-aspect stages, transform + opacity only, reversible reveals, two-copy marquees, play-on-reveal) was learned from the Birdhouse reconstruction's audit. No timing, easing curve, path or asset was copied.

## 0. Vocabulary and rules

| Object | Class | Moves like |
|---|---|---|
| Expertise block | `.obj.token` / `.hc-card` | arrives from a direction, settles with a small overshoot; stacks align |
| Signal token | `.token.is-vermilion`, `.hc-signal`, `.cl-return`, `.mv-token` | pops in, travels a path, returns to the bench |
| Root thesis card | `.thesis-card`, `.hc-authority`, `.piece-thesis` | unlocks: a short lift and settle; stays lit |
| Expression card | `<Frame>` / `.hc-frame`, `.expression-slide` | peels from the source with a small rotation, one after another |
| Buyer marker | `.buyer.is-l0…l4` | gains a ring, steps closer, fills cobalt, then vermilion; never grows into a "growth" chart |
| Diagnostic part | `.part.is-failed/.is-fixed`, `.gauge-gap` | tips over when it fails; stands back up cobalt when fixed |
| Proof / authority stack | `.cl-slab`, `.sc-bench` | grows one layer at a time |

- Easing: place `cubic-bezier(0.22, 1, 0.36, 1)`; fast `cubic-bezier(0.16, 1, 0.3, 1)`.
- Durations: micro 120–240ms; major 500–900ms; hero and memory phases 700–1200ms per beat.
- No fade-up default; every object enters from a direction that says what it is doing. Nothing floats, bounces or drifts; no parallax.
- Loops run only while their scene is on screen (`[data-reveal='hidden']` pauses `.signal-loop` and `.mv-token`; the hero and memory timelines start from an observer and play once, with a replay control on the hero).

## 1. The primitive: reveal

`<Reveal>` toggles `data-reveal="hidden|shown"` as an element enters or leaves the viewport (threshold 0.15, a 5% bottom margin). Rise 30px and fade over 640ms, place easing. **It reverses on exit**, kept from the reference; `once` pins the signature scenes so they never disassemble (hero, vault, burden, thesis unlock, closing).

## 2. Assembly

Inside a revealed scene, children marked `.assemble` enter in order: delay `--i × 80ms`, from `translate3d(--ax, --ay, 0) scale(--as)` to rest over 900ms, fast easing. Direction is meaning: vault blocks rise (`--ay: 40px`, 420ms, 60ms stagger — the vault fills quickly), expression cards peel left-to-right out of the thesis (`--ax: -120px`, `--as: .86`), comparison slots drop into their trays (`--ay: -26px`, `--as: .6`), fit verdicts slide in from the middle to their column (`--ax: ±72px`), the closing frames travel out into the market (`--ax: -220…-380px`).

## 3. Signature timelines

### 3.1 Hero — the authority machine (`HeroScene.tsx`, `styles/hero-choreo.css`)

One 8s timeline (`--T`, ×0.55 on phones), started when 35% of the scene is visible; every element animates on the same clock with percentage beats.

| Beat | % of `--T` | What happens |
|---|---|---|
| 1 | 0–27 | five expertise blocks arrive from five directions and rotations into a loose pile (`hc-enter`, per-card delay `--i × 0.1s`) |
| 2 | 16–41 | the cobalt buyer-question token docks against the pile (`hc-dock`), the pile aligns into a stack (`hc-align`), the AUTHORITY cap appears (`hc-authority`) |
| 3 | 42–54 | three expressions peel from the same source with different silhouettes (`hc-peel`, format label on hover) |
| 4 | 56–77 | one piece reaches a buyer: STRANGER → RECOGNISE (a ring); another: → REMEMBER (a stronger ring) (`hc-piece-1/2`, `hc-target`, `hc-lbl-*`) |
| 5 | 77–85 | vermilion PROFILE VISIT and NAMED ENQUIRY pop beside the buyer (`hc-pop`) |
| 6 | 90–100 | a signal returns along the bench path (`hc-return`); two more loop every 9s afterwards (`hc-return-loop`) |

Phones: three beats (pile → stack + cap → expressions and lit buyers); the docking token, pieces, state labels and the loop are hidden. Hover lifts a card, shows its format and reveals the meaning of the signals (`title`). Replay remounts the scene.

### 3.2 The expertise vault (`ProblemSection.tsx`, `.scene-problem`)

On reveal the fourteen blocks populate the night half in 420ms with a 60ms stagger; the market half receives two mist fragments and one undecided buyer. Buried under the last row, partly occluded, a vermilion-soft card: THE THING BUYERS ALWAYS ASK. After 1.6s one card (OUR METHOD, IN ONE LINE) lifts off the pile, travels toward the firm boundary, overshoots by a hair, and stops at it (`pr-cross`, 4.2s). It never crosses.

### 3.3 Market memory (`MemorySection.tsx`, `.scene-memory`)

A 6.4s timeline (`data-play`) started at 40% visibility. Five pieces pass the target buyer in turn (`mm-pass`, 22% each, staggered 16%): a COMPANY UPDATE — the buyer does not move; THE METHOD WE USE WHEN… — RECOGNISE (a ring); THE JUDGEMENT BEHIND IT — REMEMBER (a stronger ring, the buyer steps closer and scales 1.08); HOW IT WAS APPLIED — TRUST (cobalt, 1.14); ASKED FOR THE METHOD — CONVERSATION (vermilion, 1.2). Each reaction stamps the trace (`mm-stamp-*`) and the fill steps along (`mm-fill`). Stamps are buttons: hover, focus or tap shows the one-line note.

### 3.4 Founder burden (`BurdenSection.tsx`)

The band's edge strips are slow marquees (48s) — the machinery moving. On reveal (once) eight task chips approach from the lower left, hover over the four calm slabs, and are swept up into the top strip (`burden-sweep`, 3.2s, 90ms stagger). What remains is TALK · RECORD · APPROVE · SELL.

### 3.5 Authority Workshop (`WorkshopSection.tsx`, `.wk-*`)

Six workstations, each with an internal 1.5–2.5s micro-story that runs while the station is active (hover on pointer devices, tap on touch, focus for keyboards; one station at a time, `data-active`, neighbours recede): signals sort into bins; fragments condense into a thesis; the thesis fans into frames; frames go through the door into the field; signals land in the evidence tray; the failed HOOK is replaced and the gauge recovers. Rest offsets are container-query units (`--rx/--ry` in `cqw/cqh`) so each story scales with its tile.

### 3.6 One idea → expressions (`ExpressionsSection.tsx`)

The root thesis card unlocks on reveal (`thesis-unlock`, 900ms); the seven expressions peel out of it left-to-right with a 90ms stagger. Hover, focus or the `?` control shows one sentence per expression (WRITTEN "Make the argument easy to encounter." VIDEO "Let buyers hear the judgement behind it." PROOF "Make the claim easier to believe." DOCUMENT "Make the thinking useful enough to keep." plus deep, diagnostic and nurture).

### 3.7 Attention → commercial movement (`MovementSection.tsx`)

One signal (`mv-token`, 9s loop, paused off screen) travels the staircase and is transformed at each plate: steel dot → identifiable visitor (ring) → response (cobalt) → person (paper with a cobalt ring) → opportunity (vermilion), which is recorded with its evidence class.

### 3.8 Expected → actual (`DiagnosisSection.tsx`, `.instrument*`)

A tiny product. Three illustrative cases (good idea / weak hook; high reach / wrong audience; high saves / no destination). EXPECTED shows the gauges; ACTUAL draws the mismatch as a hatched gap; WHY opens the readout, keeps the ROOT THESIS lit and tips the failed component vermilion; CHANGE hands the user a control (drag the lever past 60, or tap on touch); RETEST reruns the gauges in cobalt. Auto-run steps every 1.5s until the user takes over.

### 3.9 The accumulator (`CycleSection.tsx`, `.scene-cycle`)

`--p` 0 → 1 as the band crosses the viewport: hypothesis dots fade, drop and tilt (`opacity 1 − .85p`, `translateY(p × 22–44px)`), the validated stacks rise (`scaleY .25 + .75p`).

### 3.10 The work table, the sorting, the closing

Comparison objects drop into trays row by row (Threadline last); fit verdicts slide into GOOD FIT / NOT OUR MODEL from the middle; the closing is the hero machine evolved: the five slabs assemble, three expressions travel out into the market, twelve buyers light in sequence (`--d` per buyer), two vermilion signals loop back to the bench, and a sixth cobalt layer drops onto the stack — ONE LAYER TALLER.

## 4. State changes

| Interaction | Motion | Job |
|---|---|---|
| Workshop station | tile lifts 4px, story plays, neighbours recede (opacity .55, scale .985) | "this object can be examined" |
| Expressions rail arrows | native `scroll-behavior: smooth`; button pulses 200ms | peek and drag without a carousel library |
| Diagnosis state tabs | gauge bars re-width 600ms; readout opens with `grid-template-rows` 420ms | expected vs actual is the whole idea |
| Memory stamps | note fades and lifts 180ms | the stage explained |
| Buttons | arrow grows 18 → 30px; cobalt primary fills ink on hover (paper variant fills vermilion on night), 260ms | the reference's arrow device, redrawn as SVG |

Hover-and-click is one gesture on pointer devices: hover starts a station, stamp or sentence, a click keeps it, the pointer leaving ends it; keyboard presses and touch taps toggle.

## 5. Reduced motion

Under `prefers-reduced-motion: reduce` everything stops and **everything is visible in its final, meaningful composition**: the hero and memory scenes render `data-play="still"` (aligned stack, expressions out, buyers lit, signals beside the buyer; the memory buyer at CONVERSATION with the trace filled); reveals and assembly pinned to opacity 1 / no transform; marquees and edge strips still; the burden pile and the memory passes removed; the staircase token hidden; the why-sentences shown; the cycle band at `--p: 1`. Verified by `scripts/qa-functional.mjs` ("nothing hidden", "no running animations", "final composition" checks).

## 6. Performance rules

Transforms and opacity only (plus `width` on the memory trace fill and `grid-template-rows` on the readout, both bounded). Scenes are absolutely positioned percentages inside fixed-aspect stages with `container-type: size`, so stories scale without reflow. Loops pause off screen; one-shot timelines play once. `overflow-x: clip` on stages whose objects exit sideways. No video, no Lottie, no Rive, no canvas.
