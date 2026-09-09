# Hydra reference — analysis notes

**What was inspected live (9 Sep 2026):** `https://workwithhydra.com/` with headless Chrome over CDP at 20 widths (1920 → 320), plus three component captures with interaction states (`../components/*`). Raw observations live in the sibling folders (`dom/`, `geometry/`, `styles/`, `typography/`, `motion/`, `screenshots/`, `responsive/`); `verify/` records what was captured and when.

**What was not inspected:** the diagnostic quiz beyond its entry point, client login, source maps, private repositories, any authenticated area. Nothing from Hydra's copy, client names, logos, testimonials, figures or brand assets is used by Threadline; see `../forbidden-to-copy.md`.

**Why Hydra is a reference:** it is the *interaction and information-architecture* reference (the owner's secondary reference). It shows how a sophisticated service is explained with stateful, clickable diagrams rather than walls of copy. It is **not** the aesthetic reference: Threadline keeps its own warm palette, serif display and thread motif.

## Reading of the specimen (measured at 1440)

1. **One off-white canvas (#F4F3F0) with a "sunk" band (#ECEBE6) between 1px hairlines (#E2E1DC).** No gradients, no shadows anywhere on the page (`shadows` census is empty). Surfaces are white with a 1px ink border (#12121A) and a 12px radius; small diagram boxes use 8px.
2. **Type:** Archivo throughout (216 measured elements) at weight 750 for headings with tight tracking (-2.128px at 56px, -0.912px at 24px) and line-height ≈ 0.99; body 16–17.28px at 1.6; JetBrains Mono for eyebrows and labels (11px, +1.65px tracking, uppercase, #63636F). One accent (violet #4D26DB) for the emphasised italic phrase and links; butter (#FFD84D) reserved for the primary CTA; orange (#F58A1E) marks the constraint.
3. **The constraint selector** (`components/constraint-selector`): four pill tabs (42px tall, 1px border, radius full, 14px/700, mono index) → a white diagram panel (12px radius, 32px padding) whose SVG shows four stages as thick round-capped strokes; the selected stage fills orange with an "← throughput capped here" label; → two cards (1.2fr/1fr, 20px gap): a white symptom card (mono eyebrow, 28.8px heading, three × bullets) and a dark card (#12121A, butter eyebrow, one sentence, pill CTA). Tab switch transitions colour in 0.15s; the SVG strokes ease over 0.5s/0.3s with `cubic-bezier(0.16, 1, 0.3, 1)`. Below 640px the diagram is hidden, the tabs become a 2-column grid and the two cards stack.
4. **The offer cards** (`components/offer-cards`): three equal 440px cards in a sunk band with 128px vertical padding; each card is a link (white, 12px radius, 1px border, 32px padding) holding eyebrow → 24px heading → 14px body → an 8px-radius diagram box (sunk background, 400×76 SVG of stage chips over a rule with a mono caption) → a 10px mono fact line → a 14px/700 violet text link whose arrow moves on hover (0.3s). Cards stack at 390 with the same internal order.
5. **Section reveal:** wrappers transition opacity/transform over 0.7s with the same `cubic-bezier(0.16, 1, 0.3, 1)`; the page reads fully with motion off.
6. **Responsive scale:** h2 56px → 32px (390); eyebrows and mono labels keep their size; container padding 40px → 20px; the max content width is 1472px (92rem) with a 22ch heading measure and a 672px lead measure.

## What Threadline takes and what it refuses

Take (as **principles** and, for two components, as **cloned skeletons**): the stateful selector pattern (choose → diagram reacts → explanation follows), the card-with-mini-diagram pattern, hairline surfaces without shadows, one accent for emphasis, mono eyebrows at small size, reveal timing and easing, the 22ch/672px measures.

Refuse: Archivo, the violet/butter/orange palette, every sentence, the four-constraint framework and its names, client logos, results figures, testimonials, the quiz, the results disclaimer text, the "H" wordmark. Threadline's mutation of each clone carries Threadline's own content, palette and type.
