# Threadline public design system

Source of truth: `design-system/threadline-design-dna.json` (values) and this document (intent). Implemented as CSS custom properties in `src/app/globals.css` under the `.tl-public` scope, consumed by the marketing route group only. The client portal and admin OS keep their dark, dense system; the public system reaches them only as type, focus rings and the stamp badge.

## 1. The world

**The Threadline Authority Factory.** Raw expertise arrives in crates — EXPERTISE, STORIES, PROOF, OPINIONS, EXPERIENCE. A conveyor carries them through stations: Scanner (research), Assembly (ideas and scripts), Record, Build, Inspector (the Judge and the fact-check stamp), Packaging (one thesis → many packages) and the Sorter (distribution). Packages leave for the market. A return pipe brings the market's response back to the front of the line — the part most content operations do not have — and the next batch is better informed.

- **Thread** = the idea's lineage. One continuous ember line from crate to package to buyer.
- **Machinery** = Threadline. Ink-outlined stations, steel bodies, one stamp-yellow light each.
- **Weave** = market memory. The same buyer meets the thread again and again until they stop walking.

It is a creative system, not a tagline. The public line stays "You already have the expertise. We turn it into content people actually want to watch."

## 2. Colour

| Token | Value | Role |
|---|---|---|
| `--canvas` | #F4EEE3 | page ground (warm linen) |
| `--canvas-deep` | #EAE1D2 | alternate bands, footer |
| `--paper` | #FFFBF4 | cards, stations' faces, form fields |
| `--paper-edge` | #E4DCCD | quiet dividers |
| `--ink` | #1F1D1A | text, outlines, shadows |
| `--ink-soft` / `--ink-faint` / `--ink-ghost` | #4F4A42 / #7E776C / #A9A297 | secondary, tertiary, hints |
| `--accent` / `--accent-deep` / `--accent-soft` | #D9582A / #B8461D / #FBE4D8 | the thread, and Apply only |
| `--signal` / `--signal-soft` | #2C7C6A / #D8EEE8 | learning: return pipe, diagnosis, verdicts |
| `--stamp` / `--stamp-soft` | #F1C349 / #FBEFC4 | stamps, indicator lights, marker highlight |
| `--reject` | #C24A3A | SLOP stamp, errors |
| `--steel` / `--steel-soft` | #6B7A8C / #DCE3EA | machine bodies |
| `--belt` | #3A3631 | conveyor |

Not sky blue, not navy, not cyan, not pastel houses. Ink on canvas is 13.9:1; accent on paper 4.6:1 (use it for large text or as a fill behind paper text).

## 3. Type

- **Display:** Fraunces (variable, `opsz` 144, `SOFT` 30). Hero 88/0.98 → 72 → 56 → 42px. Section 56/1.02 → 44 → 34px. Tracking −0.02em.
- **Body:** Inter. Lead 21/1.5, body 17/1.6, small 14.5/1.55. Max 62ch.
- **Label:** JetBrains Mono 12px, 0.16em tracking, uppercase — eyebrows, station labels, crate labels, stamps.
- One marker highlight per section (`.tl-mark`): the phrase that matters, on `--stamp-soft`.

Fonts load via `next/font/google` with `display: swap` and real fallbacks (Georgia / system-ui / ui-monospace).

## 4. Shape

Paper cards: 20px radius, 1.5px ink border, hard offset shadow `6px 6px 0 var(--ink)` (8px on hover). Buttons: 12px radius, `4px 4px 0` shadow that collapses to `1px 1px 0` on press — the button physically presses. Stations: 10px radius, 2px ink. Crates: 6px radius, ±2°. Stamps: 6px radius, −3°, `--stamp` fill, ink text. Nothing else rotates. No soft shadows anywhere on the public site.

## 5. Illustration

Original SVG/React primitives in `src/components/factory/`: `ThreadSpool`, `Crate`, `Conveyor`, `ScannerStation`, `AssemblyStation`, `RecordStation`, `InspectorStation`, `PackagingStation`, `DistributionSorter`, `SignalPulse`, `FeedbackPipe`, `Buyer`, `Founder`, `Operator`, `Stamp`. 2px ink outline, 1.5px detail, 3px thread; flat palette fills; front-on with a slight isometric cheat on belts; no vanishing point. Characters are 5.5 heads, round heads, dot eyes, one-line mouths, no noses. Never a bird, a house, a tree or a mascot.

## 6. Motion

Every major animation has a job:

| Animation | Teaches | Implementation | Reduced motion |
|---|---|---|---|
| Conveyor belt | work flows through a system | CSS keyframe on a dashed belt pattern, 12s linear, paused off-screen | still belt |
| Thread draw | one idea becomes many with one lineage | SVG `stroke-dashoffset`, 1.4s ease-out on reveal | drawn |
| Stamp | a gate exists (APPROVED / SLOP) | scale + rotate keyframe, 380ms overshoot | stamped |
| Signal pulse on the return pipe | the market's response comes back | `offset-path` / translate along the pipe, 2.2s | dot at the front of the line |
| Scroll-linked machine | the stages in order | one rAF-throttled scroll listener writes `--machine-progress`; stations light up in sequence | final state |
| Reveal | reading rhythm | IntersectionObserver 18%, once, 520ms, 70ms stagger | visible |

CSS, SVG and IntersectionObserver only. No animation library, no canvas, no WebGL. Nothing blocks the primary CTA; the hero is legible before any animation starts.

## 7. Responsive

Breakpoints 640 / 768 / 1024 / 1280; container 1200 (wide 1360, prose 720). Below 768 factory scenes become one vertical conveyor with one station per viewport; touch targets ≥ 44px; no parallax; conveyors at half speed. The story must read at 320.

## 8. Sections (homepage order)

hero · the problem · you do four things · the machine · most agencies stop here · one idea, many expressions · market memory · commercial attention · how the system learns · the first 12 weeks · product proof (synthetic-labelled) · fit · apply.

## 9. Copy and claims

Short, specific, human. No "unlock / leverage AI / revolutionise / supercharge / 10x / content at scale". Never "monthly": every 4 weeks, service period, 12-week initial engagement. No promised leads, revenue, followers, views, virality or ROI. Every factual statement is checked against `docs/site/CLAIMS_EVIDENCE_LEDGER.md`; anything synthetic is labelled on the page.

## 10. Where to change things

See `docs/design/CUSTOMISATION_GUIDE.md`.
