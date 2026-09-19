# Threadline v5 — motion system

Motion tells the same story as the static drawing: the thread is drawn as a scene arrives, objects settle, machines run while you look at them, one root object travels the bench, one failed part is swapped. Everything is CSS and one IntersectionObserver; there is no animation library. Sources: `src/styles/marketing-v5/motion.css`, `src/styles/marketing-v5/art.css`, `src/components/marketing-v5/{Motion,WorkshopStage,Bench,Expressions}.tsx`.

## 1. Grammar

| Category | Timing | Easing | Where |
|---|---|---|---|
| Micro (buttons, chips, links, arrows) | 200–220ms | `--v5-ease` `cubic-bezier(0.22, 1, 0.36, 1)` | hover fills, the arrow nudge |
| Draw (the thread) | 1.7s, second stroke +60ms | `--v5-ease` | `.v5-thread.is-draw` on scene entry |
| Settle (a scene's artwork) | 900ms from `translateY(14px)` | `--v5-ease` | hero, vault, frieze, street, loom, closing, both burden panels |
| Hang (the six tags) | 700ms from `translateY(-10px) rotate(-3deg)`, 70ms stagger via `--i` | `--v5-ease` | `.v5-tagline` |
| Object movement | 600–1100ms | `--v5-ease` | the workshop carrier (1100ms), bench blocks (600ms), the hook (900ms), jar fills (800ms), expression lift (360ms) |
| Loops | 1.4–14s | linear / ease-in-out | in-scene machinery, only while in view |

`--v5-ease-fast` `cubic-bezier(0.16, 1, 0.3, 1)` is declared for snappier object moves and is available to implementers; nothing on the page uses it yet.

### The draw

`Thread` renders two paths with `pathLength={1}`. When the scene is in view, `stroke-dasharray: 1` and `@keyframes v5-draw` run `stroke-dashoffset` 1 → 0. Before entry the paths carry no dash rule, so the thread is fully drawn in a capture, a print, or a browser without JavaScript.

### In-scene loops (`art.css`)

| Class | What it does | Period |
|---|---|---|
| `.v5-spin` (`is-slow`, `is-rev`) | Gears and roller crosses rotate | 14s / 9s |
| `.v5-sway` | A pegged artefact swings ±2.2° from its peg; every second one is offset −2.2s | 5.5s alternate |
| `.v5-twinkle` | A spark scales 1 → 1.18 and rotates 12° | 3.2s |
| `.v5-talk circle` | The three dots of a speech bubble blink in turn | 1.6s, 0.25s apart |
| `.v5-return` (`is-late`) | A signal pill travels back along the dashed thread and fades at each end | 7s, the late one −3.5s |
| `.v5-belt` | Conveyor rollers advance one roller pitch | 1.4s linear |
| `.v5-conveyed` | Artefacts ride the belt −140px → +140px | 6s linear |
| `.v5-shuttle` | The loom's shuttle bar rises and falls | 1.6s alternate |
| `.v5-newpart` / `.v5-block.is-new` | The replacement block slides in from the left | 700ms |

All loops are wrapped in `@media (prefers-reduced-motion: no-preference)` and are `animation-play-state: paused` under any `[data-inview="false"]` ancestor. Transform-driven loops sit on an inner `<g>` so the CSS transform never fights the SVG `transform` attribute on the placing group (`At`).

## 2. The observer contract (`Motion.tsx`)

- Runs once on mount; sets `document.documentElement.dataset.js = "1"`, which CSS reads as `[data-js]` to hide the workshop's readable track on phones and blank it on desktop.
- If `prefers-reduced-motion: reduce` matches, it returns before observing: no `data-inview` is ever set, nothing draws or loops.
- Otherwise it observes every `[data-scene]` with `threshold: 0.08` and `rootMargin: "0px 0px -4% 0px"`, setting `data-inview="true"` and `data-seen="true"` on entry and `data-inview="false"` on exit. Draw and settle animations use `both` fill, so re-entering replays them from the bottom edge of the viewport, where the reset is not visible.

Nothing is opacity-hidden before it enters. Entrance is transform-only; the HTML is complete and legible without the observer, and a full-page capture never shows a blank region. This is the rule that fixed the v4 captures.

## 3. The workshop stage (`WorkshopStage.tsx`)

- `WorkshopArt` takes `station` 0–5 and renders the carrier at `STATION_X[station]` through `--sx`; `.v5-carrier { transform: translateX(var(--sx)); transition: 1100ms }`. The carrier's object state (fragments → spool → three cuts → parcels → signal tray → spool v2) is a render switch, so the object changes as the cart arrives.
- Station plates dim to 0.55 opacity except the active one.
- Desktop (≥ 900px): the stage is `position: sticky; top: 84px`; below it an `<ol class="v5-stage-track">` of six sentinels, each `min-height: 56vh`. An observer with `rootMargin: "-45% 0px -45% 0px"` fires when a sentinel crosses the middle band of the viewport and sets the station. Buttons, dots and ← → on the focused stage call `goTo`, which also scrolls the matching sentinel into view (instantly under reduced motion).
- Phones (< 900px): the stage is static; the SVG is 420% wide inside `.v5-stage-art { overflow: hidden }` and `data-station` on `.v5-stage` translates it by sixths (`-16.667%` … `-83.333%`, 800ms). The track is `display: none` when `[data-js]` is set; without JavaScript it remains as the readable list.
- A second observer (`threshold: 0.2`) sets `data-inview` on the stage wrapper so the loom shuttle and gears pause when the panorama is off screen.

## 4. The bench (`Bench.tsx`)

- States 0–4: Expected, Actual, Why, Change, Retest, held in `state`; `data-state` and `data-applied` on `.v5-bench` drive CSS.
- Values: `expected` until state 1, `actual` from state 1, `after` in state 4. Jar fills transition `y`/`height` over 800ms; a fill below the mark by more than 12 turns coral, above by more than 12 turns butter, otherwise mint-deep.
- The failing block (`c.failing`) gets `.is-failed` from state 2: `rotate(12deg) translateY(4px)` about its bottom centre. When the change is applied (lever ≥ 60, or Retest, or the auto-run reaching state 4) it gets `.is-new` and the mint-deep fill with the slide-in animation. In state 3 before the lever is pulled, `.v5-hook` lowers 140px toward the bench.
- Auto-run (`Run the loop`): `STEP_MS = 1600` between states, 1100ms for the change step, which also sets the lever to 100. Any manual action stops the run.
- Keyboard: the state row is a `tablist`; ← → Home End move and focus; Back/Next buttons duplicate this for touch; the lever is a native `input[type=range]` with `aria-valuetext`.

## 5. Expressions (`Expressions.tsx`)

`active` follows hover and focus; `pinned` follows a press (toggle). The shown artefact is `active ?? pinned`. In the art, `.v5-expr.is-on .v5-expr-obj` lifts 16px and scales 1.06 over 360ms; siblings get `.is-off` at 0.4 opacity. On phones the art is hidden and the same state shows the why-line under the pressed list item.

## 6. Reduced motion

`@media (prefers-reduced-motion: reduce)` sets `animation: none !important; transition: none !important` on everything inside `.tl-public.v5`, and `Motion` never observes. What remains is the authored final state: every thread drawn, every artefact hanging still, the carrier at station 1 with its captions listed, the bench at its current state with the same colours, the expression sentence appearing without a lift. No composition depends on an animation having played.

## 7. Do not add

- Random floating or bobbing; parallax; anything that moves without a cause in the scene.
- Opacity-gated reveals (an element that is invisible until an observer fires).
- Scroll-jacking: the workshop's sticky stage never captures the wheel; scrolling past it is always possible.
- Springy toy easing on UI controls; keep them at 200ms with `--v5-ease`.
- A dependency: the current grammar is expressible in CSS; a library would need to earn its bundle cost in the handoff.
