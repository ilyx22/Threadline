# THREADLINE — FRONTEND HANDOFF

The state of the Threadline marketing frontend in this workspace, how it was made, how it is verified, and how it ports into the production Threadline repository.

---

## 1. What this workspace is

This Next.js project began as a faithful reconstruction of a reference marketing site. On 11 September 2026 it was **transformed in place** into the Threadline marketing experience: the composition mechanics were kept, every piece of reference identity was removed, and an original Threadline visual world was built on top (`THREADLINE_VISUAL_SYSTEM.md`).

Checkpoints in this repository's git history:

- `reconstruction-baseline`, `birdhouse-reconstruction-final` — the reference reconstruction, untouched (rollback).
- the commits after them — the Threadline mutation.

Run: `npm install && npm run dev` (port 3100) or `npm run build && npm run start`.

## 2. What was retained, replaced, removed

**Retained (mechanics and tooling):** section registry (`design-system/sections.ts`), token pipeline (`tokens.ts` → generated CSS, `verify:tokens`), `Reveal`, `Marquee`, the rail pattern, the viewport-slice capture and responsive / links / functional QA scripts under `scripts/` (re-pointed at the new routes), the layout rhythm (1280 container, 30px gutters, panel radii, section overlaps).

**Replaced with original Threadline work:** all tokens (palette, type, radii, motion), `styles/*.css` (hand-authored; the generated-from-reference stylesheets are gone), every component under `components/`, every word under `content/`, the icon and OG image, the four documents you are reading.

**Removed:** the reference's videos, images, Lottie and Rive files (`public/assets`), its logo and wordmark SVGs, its section components (hero video, logo strip, showreel, why-cards, what-cards, testimonials, process mosaic content, about, FAQ), the consent banner, the placeholder-overlay dev tooling and its manifest, the imported third-party LinkedIn playbook (`/linkedin`, `content/playbook.ts` old version, `styles/playbook.css`, `reference-linkedin/`), and the `lottie-web` / `@rive-app/canvas` dependencies. The `reference/` and `reference-analysis/` folders (the reconstruction's measurements and notes) remain as the record of what the mechanics were measured from; nothing in `app/`, `components/`, `styles/` or `public/` imports from them.

## 3. Routes

| Route | Status |
|---|---|
| `/` | the twelve-section homepage |
| `/apply` | the application (form posts nowhere yet — see §7) |
| `/playbook` | The Expert Firm LinkedIn Playbook, eleven original chapters |
| `/privacy-policy` | Threadline's notice with bracketed owner inputs |

## 4. Verification (production build, 11 September 2026)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | 0 errors |
| Build | `npm run build` | 4 static routes, first-load JS 114 kB on `/` |
| Tokens | `npm run verify:tokens` | every `var()` resolves; no dead tokens |
| Functional | `npm run verify:functional` | see `local/data/functional-report.json` — 47 checks: document structure, anchors, no pricing, no third-party names, reveals, tile toggle, rail arrows and end states, instrument states / cases / keyboard, cycle progress, comparison / fit / closing, reduced motion (nothing hidden, nothing running), inner pages, playbook rules, console |
| Responsive | `npm run verify:responsive` | 20 widths (1920 → 320) × 4 pages: overflow, elements wider than the viewport, text collisions, broken images, console errors — see `local/data/responsive-report.json` |
| Links | `npm run verify:links` | every internal destination and anchor resolves |
| Visual | `npm run capture:local` | viewport slices at seven viewports for the four pages (`local/screenshots/`) — the review medium, because reveals reverse on exit and a full-page capture is legitimately mostly transparent |

Results of the final run are recorded in §9.

## 5. Similarity review (Threadline vs the reference)

Reviewed side by side at 1280 and 1440 using the reference's own slices in `reference/screenshots/` (git-ignored, regenerable) and `local/screenshots/`.

- **Identity**: no shared colour (warm stone / ink / ember / slate vs pale blue / navy / cyan), no shared face (Fraunces / Inter / JetBrains Mono vs Instrument Serif / Roboto), no shared mark, no shared asset, no shared word. The reference's mascots, houses, clouds, birds, videos and logos do not exist here.
- **Composition**: the panel-on-ground, the band-with-overlap, the mosaic, the rail and the overlapping footer are recognisably the same *kind* of page architecture — that is the point of starting here — but every panel is filled with a different object world, the mosaic tiles carry scenes instead of video, the rail carries frames instead of thumbnails, and the section order tells a different story.
- **Test**: with the wordmark covered, none of the twelve sections could be mistaken for the reference; with the wordmark covered, none of them could be mistaken for a generic SaaS page either (no feature grid, no icon boxes, no dashboard mock, no gradient).

## 6. Accessibility

One `h1` per page; landmark `nav` / `main` / `footer`; skip link; every scene is a single `role="img"` with a descriptive `aria-label` and its objects `aria-hidden`; the instrument is a real `tablist` with arrow / Home / End keys and `aria-live` on the panel; the workshop tiles are buttons with `aria-expanded`; rail buttons carry labels and disable at the ends; focus rings are ember, 2px, offset 3px; targets ≥ 44px; contrast ratios in the visual system §3; reduced motion honoured (motion system §5).

## 7. Known limitations and owner inputs

- `links.email` (`hello@threadline.example`) and `brand.domain` are placeholders. `content/privacy.ts` has bracketed inputs.
- The application form has no action yet. In the production repository the equivalent form posts to a rate-limited server action (`submitApplicationAction`); wire this form to it during the port.
- `public/og.png` is a generated placeholder card in system fonts; replace with a rendered card once the wordmark is final.
- There is no analytics or consent layer by design; if one is added, the privacy notice changes first.
- The founder story is intentionally absent from the homepage; the visual system leaves room for it on an About surface later.

## 8. Port plan into the production Threadline repository

Only after visual approval, and in this order:

1. **Tokens** — `design-system/tokens.ts` values into the production public stylesheet (`src/app/public.css` `.tl-public` scope): palette (rename `--color-*` → `--tl-*` or keep), type scale, radii, motion timings.
2. **Primitives** — `.obj`, `.token`, `.frame`, `.buyer`, `.verdict`, `.slot`, `.tab`, buttons, type classes (`styles/components.css`, `styles/base.css`) → the production `src/components/public/primitives.tsx` + object components; `Frame.tsx` and `Icons.tsx` port as-is.
3. **Marketing components** — the twelve sections, adapting `content/site.ts` into `src/content/public-site.ts` under a `HOME_V4` key so every approved sentence stays traceable to the claims ledger; the `/playbook` content into the existing playbook route (it replaces nothing — it is a new resource beside the ten-chapter Founder Authority System, or it supersedes it, an owner decision).
4. **Motion** — `Reveal` (the production repo already has an IntersectionObserver reveal; adopt the reverse-on-exit behaviour and `.assemble`), `Marquee`, the cycle's `--p` listener.
5. **QA** — the production suites (`qa:public`, `qa:visual`, `qa:browser`) run as before; add this repo's functional checks to them.
6. **Portal and admin** — last, and conservatively: tokens and type only.

Nothing from this repository's `reference/`, `reference-analysis/` or `.git` ports.

## 9. Final run record (11 September 2026, production build on :3100)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | 4 static routes; `/` first-load JS 114 kB |
| `npm run verify:tokens` | PASS — every `var()` resolves, no dead tokens |
| `npm run verify:functional` | **47 / 47** checks passed (`local/data/functional-report.json`) |
| `npm run verify:responsive` | **PASS** — 20 widths × 4 pages, no overflow, no collisions, no broken images, no console errors (`local/data/responsive-report.json`) |
| `npm run verify:links` | PASS — 62 link instances, 20 unique destinations, every anchor resolves |
| `npm run capture:local` | seven viewports × four pages captured; 0 unsettled slices at 1440 and 390 |

Defects found and fixed during the pass: signal tokens parked at the scene origin before their animation delay (`animation-fill-mode: both`); later-staggered objects never appearing in captures (stagger compressed to ≤ 1.1 s per scene); the Expression tile's frames cropped at the tile top; the hero scene colliding with the copy between 992 and 1199 (side-by-side now starts at 1200); the expressions rail forcing its grid column wide on phones (`minmax(0, 1fr)`); workshop tile scenes overlaying their headings on phones (in-flow scene box); burden verbs overflowing two-up tiles at 375 / 320 (single column below 480); nav anchors dead on inner pages (absolute `/#…`); one running transition under reduced motion (scene transitions pinned).

Rollback: `git checkout birdhouse-reconstruction-final` restores the reference reconstruction.

---

## 10. Art-direction pass (v2, 11 September 2026, later the same day)

Owner direction: keep the architecture, objects and motion; replace the soft stone / ember / slate / sage palette with something sharper (bone ground, ink type, cobalt system colour, one warm vermilion signal, steel / mist neutrals), raise contrast between sections, add asymmetry, scale shifts and two or three memorable full-bleed moments.

Done: the palette retokened (`design-system/tokens.ts`; visual system §3) and every role remapped (cobalt = system and action, vermilion = the market's response, steel = the market before it responds, night = the dark bands); radii sharpened (40 / 24 / 12); three cinematic full-bleed moments (the split, the night band, the night closing — visual system §8); the expressions panel tinted cobalt-soft; the diagnosis tile in the mosaic turned night; the movement scene bleeding left and the twelve-week band bleeding right; the founder verbs enlarged to a 100px scale on unequal staggered slabs. No component was redesigned; every scene, object and motion from v1 is intact.

Verification on the v2 production build: `npx tsc --noEmit` 0 errors · `npm run build` 4 routes · `verify:tokens` PASS · `verify:functional` 47 / 47 · `verify:links` PASS · `verify:responsive` PASS at 20 widths × 4 pages · viewport slices recaptured at seven viewports. Tag: `threadline-marketing-v2`.


---

## 11. Signature motion, illustration and interaction pass (v3, 11 September 2026)

Owner direction: make the site feel alive, memorable and authored without redesigning it, rewriting copy, changing positioning or touching the backend; use the reconstruction only as an engineering and motion reference; build in three phases and evaluate each before the next.

Phase 1 (hero, diagnostic, workshop), Phase 2 (memory, burden, expressions, closing) and Phase 3 (vault, movement, accumulator, work table, sorting) are all in. What the page now does is described scene by scene in `THREADLINE_MOTION_SYSTEM.md` §3 and row by row in `THREADLINE_COMPONENT_MAP.md`. Four signature scenes (hero machine, expertise vault, memory formation, diagnostic instrument); tactile moments on every section; the closing is the hero machine one layer taller. Wit: the buyer ignores the COMPANY UPDATE; THE THING BUYERS ALWAYS ASK is buried under the pile; the insight card stops at the firm boundary; the weak HOOK falls over; the founder's pile is swept into the machinery.

Content additions in `content/site.ts` (no approved sentence changed): `memory.passes`, `expressions.frames[].why`, `problem.buried` / `problem.crossing`, `burden.pile`, `closing.taller`; `diagnosis` restructured into three cases with why / change / retest verdicts and lines (all labelled illustrative). New files: `components/HeroScene.tsx`, `styles/hero-choreo.css`. Everything else is edits to existing components and stylesheets.

Interaction model (all input modes): hover starts a workstation, stamp note or why-sentence on pointer devices and a click keeps it; a keyboard press (Enter / Space) or a touch tap toggles; focus and blur mirror hover. The hero and memory timelines start from an `IntersectionObserver` and play once (replay control on the hero); loops (`.signal-loop`, `.mv-token`) pause while their section is hidden. Reduced motion renders every scene's final composition (hero and memory `data-play="still"`).

Defects found and fixed during the pass: hover-then-click toggled a station off on pointer devices (one gesture now); the staircase token faded from its first frame (opacity keyframes made explicit); the vault's crossing card ran past the boundary and started over the pile (re-plotted; z-order animated); the memory buyer landed on a neighbour (pool re-spaced, landing moved); closing frames clipped by the panel edge; fit verdicts and the memory passes reported as horizontal overflow (stages clipped with `overflow-x: clip`; the responsive checker taught that `clip` clips); the gauge's "expected" caption wider than its cell; `verify:tokens` not recognising custom properties declared inside one-line rules.

| Gate (v3 production build on :3100) | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | 4 static routes |
| `npm run verify:tokens` | PASS — every `var()` resolves |
| `npm run verify:functional` | **73 / 73** (hero, vault, memory, workshop, expressions, movement, instrument, closing, emulated-touch and reduced-motion checks added) |
| `npm run verify:responsive` | PASS — 20 widths × 4 pages, no overflow, collisions, broken images or console errors |
| `npm run verify:links` | PASS — 7 internal routes, 12 anchors, every anchor resolves |
| `npm run capture:local` | seven viewports × four pages; home 0 unsettled slices at every viewport; playbook 3 slices at 390 / 430 flagged unsettled (page and capture script unchanged since v2 — long-chapter reveals still animating at capture time, a timing flag, not a defect) |
| Timed frames | hero beats at 0.9 / 2.9 / 4.2 / 6.9 / 8.8s; vault at 0.9 / 4.2 / 7s; memory at 1.2 / 3 / 5 / 7.5s; burden, movement, closing, expressions-why, stamp note; 390px variants — reviewed frame by frame, not only in the suites |

Tag: `threadline-marketing-v3`. Rollback: `git checkout threadline-marketing-v2`.
