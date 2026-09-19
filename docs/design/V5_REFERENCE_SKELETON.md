# V5 — Reference skeleton (the completed Birdhouse reconstruction)

Source inspected: git tag `birdhouse-reconstruction-final` in the nested, git-ignored repository `thebirdhouse/` (components `Hero`, `LogosSection`, `ShowreelSection`, `WhySection`, `WhatSection`, `TestimonialsSection`, `IncludedSection`, `AboutSection`, `FaqSection`, `Footer`, `Navbar`; `styles/*.css`; `HANDOVER.md`), and the reference captures on disk at `thebirdhouse/reference/screenshots/home__1440x900__slice00–09.png` and `home__390x844__slice00–10.png`. All ten 1440 slices and five 390 slices (00, 01, 03, 06, 10) were viewed for this document.

## Clean-room rule

Nothing of the reference's identity carries into Threadline: no birds, houses, trees, clouds, grass, characters, SVG paths, Lottie/Rive/video files, copy, logos, statistics, testimonials, photographs or any other asset. What is recorded below is composition, scale, pacing and behaviour. Classification: **A** preserve macro composition or behaviour; **B** preserve the principle only; **C** discard as brand-specific.

## Section by section

### Navbar — A
- Hierarchy: wordmark left, four text links, one filled pill CTA right. Fixed; sits on the page ground colour, not on a panel.
- Spacing: 80 px tall; container 1280 px with 20 px gutters inside a 30 px section inset.
- Responsive: below 992 px the links disappear and only the CTA remains. Threadline keeps the restraint but adds a drawer so no destination is lost.
- Motion: none beyond hover.

### Hero — A (composition), C (artwork)
- Hierarchy: italic audience line → a four-line serif headline around 88 px → one sentence → one CTA. Left column about 600 px.
- Scene scale: the illustration owns roughly 55% of the panel width and its full height, rises above the headline's cap line, and runs off the panel's bottom edge, where a painted ground strip spans the full panel width. The scene is recognisable with the copy covered.
- Spacing: white panel with 40 px radius inset 30 px on a tinted ground; the ground colour shows on all sides.
- Rhythm role: the single biggest illustrated moment; sets character, palette and outline weight for the page.
- Responsive (390): copy centres and stacks above; the scene takes the lower half of the panel at full panel width. It is a separate tall cut, not the desktop scene scaled down.
- Motion: a continuous loop inside the scene and slow drifting layers. No entrance choreography is needed for the hero to read.

### Proof strip (logos) — C (content), B (rhythm)
- An italic serif line over a marquee. A low, quiet beat straight after the loudest one.
- Threadline has no logos to show. The principle kept: a short, quiet editorial strip after the hero.

### Statistic band with landscape — B
- Four white tiles sit inside a full-bleed illustrated landscape: a large central subject, a character perched at each tile, soft layers rising over the bottom edge into the next section.
- Scene scale: the illustration spans 100% of the viewport width and about 1.3 viewports of height. Tiles are small; the landscape is the subject.
- Rhythm role: the first full-bleed band; it changes the ground the page stands on.
- Responsive: tiles become a 2 × 2 block; characters re-seat around it; the central subject moves below.
- The statistics are discarded (Threadline publishes no numbers). The principle kept: content embedded in a landscape, not the reverse.

### Showreel band — B
- A full-bleed band with gradient masks top and bottom so it fades into the ground; no radius. The next white panel rides up over it with a negative margin (−5% to −20% by breakpoint).
- Principle kept: bands bleed and overlap; panels interrupt them. Threadline uses illustration, not video.

### "Why" — three tinted tiles — B
- A white panel; a centred serif heading; three pastel tiles, each led by an illustrated inset with a character, then a small serif title and grey body copy; one centred CTA.
- Scene scale: the inset is about half of each tile; characters break the inset frame.
- Rhythm role: the first dense, scannable moment. Pastel tiles appear here and in the mosaic only.
- Responsive: single column, inset first.
- Principle kept: pastel tiles used sparingly, always carrying artwork. Threadline does not reuse the three-up.

### "What we do" — B
- Heading left at about 64 px; three horizontal capsules each with a small animated icon that plays once on reveal. Deliberately low intensity between two loud sections.
- Principle kept: a quiet beat with small authored marks.

### Testimonials rail — C (content), B (mechanic)
- Heading left, arrow pair right, a 1.25-slide peeking rail with native scroll-snap. Content is client video and revenue claims: discarded entirely.
- The peek-and-drag mechanic is sound, but v4 already spent it on the expressions rail and the owner has rejected that rail. Not carried.

### Process mosaic — A (behaviour of artwork), B (layout)
- Three rows, each pairing a wide and a narrow tile, sides alternating; four pastel grounds. Every tile is a looping illustration with a character interacting with a document-like object; the heading lies over the artwork at the bottom left.
- Scene scale: artwork fills 70–80% of every tile and bleeds past its edge.
- Rhythm role: the densest, most playful run of the page; six illustrated beats in under two viewports.
- Responsive: one column; artwork keeps its scale and crops rather than shrinking.
- Principle kept: characters doing the work beside the artefact they produce; artwork that breaks its container. Threadline does not repeat a six-tile mosaic (the v4 workshop already failed as six boxes).

### About — C
- Photo collage left, heading and paragraphs right, text capped at 470 px. Real photography of a real team; nothing to carry except the two-column calm.

### FAQ — B
- Heading bottom-left, accordion right; first item open; one open at a time; 300 ms height change; plus rotates to 135°. A utilitarian beat before the footer. Threadline's homepage carries no FAQ in this pass.

### Footer — A (composition), C (artwork)
- A textured full-bleed field with a torn upper edge that rises into the last section; centred wordmark, one row of links, social icons, then a giant serif wordmark marquee and the legal line.
- Scene scale: about one viewport; the wordmark is about 190 px tall.
- Responsive: links stack to one centred column; the wordmark fits the width.
- Principle kept: the page ends in a landscape, not in a box, and the last section overlaps into it.

## System-level observations

- **Container and insets**: 1280 px container, 20 px gutters, panels inset 30 px from the viewport, radius 40 px (24 px on phones). Section padding about 100–120 px desktop, 64 px mobile.
- **Type**: one condensed display serif at about 88 / 64 / 28 px, one grotesque for body at about 19 px, an italic cut for audience lines. Body copy is often a mid grey-blue; headings a deep navy.
- **Palette**: one atmospheric field colour (pale sky) as the ground everywhere; white panels; four pastels for tiles; one saturated action colour; deep navy ink. Illustration supplies every other colour.
- **Outline**: illustrations use a heavy dark outline with flat fills and a little texture; UI uses none. The contrast between the two is what makes the artwork feel authored.
- **Motion**: reveals rise 30 px and fade over about 640 ms and reverse on exit; marquees; looping scene animation. Nothing depends on a scroll trigger to exist for long: looping artwork is present from load.
- **Responsive**: separate tall cuts of the large scenes; links hidden; single column; artwork keeps scale and crops.
- **Pacing**: loud hero → quiet strip → full-bleed landscape → dense tinted trio → quiet capsules → rail → dense mosaic → calm two-column → utilitarian accordion → landscape footer. No two adjacent sections share a macro layout.

## Transferable principles and Threadline's answer

| Principle | Threadline v5 |
|---|---|
| Scene-first art direction | Every homepage section is designed as a scene in one world: an editorial authority workshop connected by one continuous thread line. Components are derived from scenes, not the reverse. |
| One huge illustrated focal point per viewport | The archive, the press, the pegged line of artefacts, the test bench and the loom each own their viewport at human scale. |
| Full-bleed landscape bands between panels | Powder-sky market exteriors, an ink-navy archive interior and an immersive workshop interior alternate with parchment editorial panels; bands bleed and panels overlap them. |
| Characters with faces and ink outlines carry the story | Original human founder, operator and buyer characters with heavy ink-navy outlines and flat fills. No mascots, no animals, no anthropomorphic objects. |
| Pastel inset tiles used sparingly | Mint, coral, lilac and pale yellow colour objects and states inside scenes. Tinted containers are not a layout device. |
| Dense / sparse rhythm | A crowded archive against a nearly empty market; a quiet typographic statement before the memory frieze; a compact comparison device after the long bench interaction. |
| Big serif statements | Fraunces re-cut soft and slightly wonky for display, at hero and statement scale, left-aligned by default. |
| Motion that progresses the scene | The thread draws between scenes, one root object travels the workshop and changes physically at each station, signals return along the line, one failed part is lifted out and replaced. All essential content exists before any trigger fires. |
| Footer as landscape | The closing scene is the hero world changed, running into the footer with no CTA box. |

Palette: ink-navy, parchment, powder-sky, mint, coral, lilac, pale yellow, and a marigold accent used for the thread and for commercial signal. The thread is always drawn as a marigold stroke over a wider ink stroke so it reads on any ground.
