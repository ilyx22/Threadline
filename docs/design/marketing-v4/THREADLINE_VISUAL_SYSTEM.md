# THREADLINE — VISUAL SYSTEM (v2)

The identity of the Threadline marketing site, and the reasoning behind it. Tokens live in `design-system/tokens.ts` and are emitted as CSS custom properties (`npm run tokens:build`); this document explains what they are for.

Companion documents: `THREADLINE_COMPONENT_MAP.md` (what each section is and where it lives), `THREADLINE_MOTION_SYSTEM.md` (every motion and its job), `THREADLINE_FRONTEND_HANDOFF.md` (state, QA, port plan).

---

## 1. Where this came from, and what was kept

This project began as a faithful reconstruction of a reference marketing site (thebirdhouse.co). Its identity — name, artwork, videos, Lottie/Rive icons, clouds, mascots, testimonials, client logos, colours, copy, the imported third-party LinkedIn playbook — has been removed entirely. What was kept is the **composition**, because it was better than anything in the previous Threadline site:

| Kept mechanic | Where it now lives |
|---|---|
| Fixed top bar on the page ground; the first panel scrolls under it | `Navbar` |
| One large rounded paper panel with a statement column and a scene that runs off its lower-right edge | `Hero` — the Authority Stack |
| An italic line over a continuously moving strip | `MaterialTicker` — where the expertise lives today |
| A full-bleed band masked into the page colour at top and bottom, with the next panel riding up over it | `ProblemSection` (panorama) → `MemorySection` (panel, `margin-top: -120px`) |
| A grid whose heading sits inside the grid | `BurdenSection` (the frame of everything Threadline handles) |
| A mosaic of one wide and one narrow tinted tile per row, a heading laid over each | `WorkshopSection` |
| A horizontally scrolling rail with a partial next card visible and arrows that disable at the ends | `ExpressionsSection` |
| A photo-left / copy-right split | `MovementSection` (the staircase replaces the photo) |
| Heading left, interactive stack right | `DiagnosisSection` (the instrument) |
| A footer the section above overlaps into, with a giant scrolling wordmark | `ClosingSection` → `Footer` |
| Reveals that rise on enter and reverse on exit | `Reveal` |

Nothing visual from the reference ships. The similarity review is in the handoff.

## 2. The idea the visuals serve

Threadline is a **managed authority and qualified-demand system for expert-led B2B firms**. The commercial idea: *make the expertise that wins the work visible before the sales call.* The visual world is **the Authority Workshop** — an editorial and analytical workshop, not a factory and not a dashboard:

- raw expertise arrives as **blocks** (client calls, proposals, delivery, judgement, method);
- market evidence becomes **signal tokens**;
- fragments condense into a **root-thesis object**;
- one thesis becomes several **expression frames** (post, video, document, proof, deep asset, diagnostic, nurture);
- frames leave through a **door** into a **field of buyers**;
- buyers gain **familiarity rings**, then fill;
- **commercial signals** return to an **evidence tray**;
- **expected** is read against **actual** on **gauges**, the weak link named, one **lever** pulled, the piece retested;
- successful knowledge compounds into the **authority stack**.

Rules: filled geometry, physical overlap, a 2.5D bottom edge, one soft ambient shadow, controlled asymmetry, object transformation. Never: node graphs, hollow-ring diagrams, arrow spaghetti, flowcharts with prettier styling, glass, glow, gradients, dark SaaS.

## 3. Colour (v2 — the art-direction pass, 11 September 2026)

The first palette (stone / ember / slate / sage) read as soft, artisanal, boutique-consultancy. v2 is sharper: **high-trust advisory + media intelligence + modern operating system.**

| Token | Value | Role |
|---|---|---|
| `canvas` | `#F3F0E8` | page ground — warm bone |
| `paper` | `#FBFAF6` | panels, cards, frames, the burden slabs |
| `mist` / `mistDeep` | `#E6E6E0` / `#C9CBC5` | sunk surfaces (instrument bed, tile grounds); the 2.5D bottom face of objects |
| `ink` / `inkSoft` / `inkFaint` | `#121316` / `#3D4046` / `#6F747C` | type ladder; `ink` is the footer |
| **`cobalt`** / `cobaltDeep` / `cobaltSoft` | `#1F3BD6` / `#152A9E` / `#DEE3F8` | **the system colour**: primary action, the authority slab, the root-thesis band, the eyebrow, the validated pattern, the own row of the comparison, the strong-fit mark, the wordmark thread, one large lit object per scene; `cobaltSoft` tints the expressions panel and the intelligence tile |
| **`night`** / `nightRaised` | `#0E1330` / `#18204A` | the three cinematic bands and the diagnosis tile — a cobalt-ink, never grey or pure black; `nightRaised` for objects on night |
| **`vermilion`** / `vermilionDeep` / `vermilionSoft` | `#E2432A` / `#B32F1B` / `#FAE1DB` | **the one warm signal**: the market talking back — commercial-signal tokens, the actual gauge, the diagnosed weak link, the lever knob, the conversation state of a buyer, the eyebrow on night, focus rings; `vermilionSoft` tints the expression tile |
| `steel` / `steelSoft` | `#66717F` / `#D6DBE0` | secondary states — the market before it responds: signal chips before sorting, the expected gauge, the buyer's first ring, the poor-fit mark, half slots |

Discipline: cobalt is editorial, not corporate — it appears as *objects and actions*, never as a page wash, a header bar or a gradient; the ground stays bone. Vermilion is scarce enough to mean something: it is always *a response*. Night gives the page a light / dark rhythm (bone → night split → paper → night → paper → cobalt-soft → bone → night → ink) so sections stop reading as one continuous tasteful document.

Contrast: ink on canvas 15.2:1; `inkSoft` on paper 10.1:1; `inkFaint` on paper 4.9:1 (≥ 14px only); paper on cobalt 7.6:1; paper on night 16.8:1; paper on vermilion 4.5:1 (mono labels at 600 weight, uppercase); steel on mist 4.6:1.

## 4. Typography

| Role | Face | Setting |
|---|---|---|
| Display | **Fraunces** (variable: `opsz`, `SOFT`, `WONK`) 400 | hero 92px / 64 / 48, line-height 0.98, tracking −0.03em, `opsz 144 SOFT 30`; section headings 68 / 48 / 38, line-height 1.0; the founder verbs up to 100px; card headings 28 / 26 / 24 at `opsz 48` |
| Eyebrow | Fraunces *italic* 24px | cobalt-deep (vermilion on night); `SOFT 60 WONK 1` so the italic has character; the one device kept from the reference |
| Body / UI | **Inter** 400–600 | body 19px / 17px, line-height 1.45; lead 21px; notes 15px |
| Labels, evidence, diagnostics | **JetBrains Mono** 500 | 12px / 11px, +0.12em, uppercase; object labels down to 10px inside scenes, never smaller |

Scale contrast is the point: a 64px heading over a 15px note. Important ideas occupy space; explanatory text is short and never grey-on-grey below 15px.

## 5. Shape, depth, surfaces

- Radii: panels 40px, tiles and frames 24px, chips / tokens / inputs 12px, buttons and tabs 999px. Below 480px: 24 / 16 (sharper than v1's 44 / 28).
- **Object depth** (`.obj`): `box-shadow: 0 3px 0 0 <edge>, 0 10px 24px -14px rgba(18,19,22,.35)` — a solid bottom face plus one ambient. Lifted state adds 4px of travel and a deeper edge. Tones: paper, mist, cobalt, cobalt-soft, vermilion, vermilion-soft, steel, steel-soft, ink, night, night-raised.
- Panels: paper on canvas, no border, no shadow; they read by contrast and radius alone.
- Sunk surfaces: mist with a 1px inset hairline at 6% ink.
- Frames (`.frame`): white, 14px radius, a head row (avatar dot + mono kind), then a silhouette per kind — lines for a post, a night 16:9 with a play mark for video, three offset pages for a document, a cobalt stamp for proof, five lines for a deep asset, checkboxes for a diagnostic, an envelope for nurture.
- Buyer markers (`.buyer`): mist discs with an inset bottom face; levels 0–4 add a steel ring, a stronger steel ring, a cobalt-soft fill, then cobalt; the conversation state (level 4) is vermilion. On night surfaces the discs are `nightRaised`.

## 6. Layout

Container 1280 (20px side padding); full-bleed panels up to 1500 inside 30px gutters (10px below 480). Section rhythm 110px (56px below 992). Breakpoints 480 / 768 / 992 / 1200 / 1440. The hero goes side-by-side only from 1200; below that the scene stacks under a centred statement. The workshop mosaic becomes a single column below 992 with each tile's scene as an in-flow box above its heading. The expressions rail shows 2.25 cards at desktop, 1.25 below 992, 1.15 below 480 (the reference's peek, kept).

## 7. Hero directions considered

Three original directions were drafted before the homepage was mutated:

1. **The Authority Stack** *(chosen)* — raw blocks on a bench assemble into a stack whose top slab (cobalt) is the one lit object; expression frames peel off toward a field of buyers; signal tokens travel back into the bench. Chosen because it shows the whole mechanism (expertise → system → visible authority → learning) in one still image, it is memorable as a brand mark (a stack with a cobalt cap), and every element of it recurs later on the page so the hero teaches the object language.
2. **The Lens** — a dense cluster of expertise fragments resolves, through a lens object, into one sharp thesis projected as three expressions. Rejected: strong on positioning, silent on the market's answer and on learning; the lens reads as an optics metaphor rather than a workshop.
3. **The Bench Press** — a press shapes raw blocks into finished frames, with tokens returning. Rejected: closer to a factory than a workshop, and the press dominates the scene while the buyer is absent.

## 8. The three cinematic moments (v2)

Full-bleed, edge to edge, no masks, no gradients:

1. **The split** (`ProblemSection`) — the band is cut hard down the firm boundary: night inside the firm, a dense wall of paper expertise blocks with cobalt dots; bone outside it, two mist fragments and one undecided buyer. The memory panel then rides 120px up over the seam.
2. **The night band** (`BurdenSection`) — the founder's four verbs as paper slabs of deliberately unequal size on a twelve-column grid, staggered up and down, the fourth in cobalt; the twelve things Threadline handles run along the band's top and bottom edges in steel mono.
3. **The closing** (`ClosingSection`) — a night panel overlapping into the ink footer: the authority stack in paper with a cobalt cap, the buyer field lit in cobalt and vermilion, a paper CTA.

Asymmetry elsewhere: the movement staircase bleeds 12% off the container's left edge; the twelve-week band bleeds off the right edge of the viewport; the expressions panel sits in `cobaltSoft`; the diagnosis tile in the mosaic is night.

## 9. What the system refuses

Beige feature cards; SaaS grids; icon boxes; thin arrows; hollow-ring diagrams; repeated 50/50 sections; gradients; glassmorphism; a blue page wash or blue header bar (generic blue SaaS); an orange page; tiny grey paragraphs around diagrams; follower counters and vanity metrics; any figure, logo, testimonial or price. Illustrative examples are labelled illustrative where they appear.
