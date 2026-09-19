# V5 visual QA report — 19 September 2026

Two full screenshot-and-critique passes were made on the v5 homepage before any automated gate ran, then a third on the production build. Captures are in `docs/design/v5/after/` (`1440-*.jpg` desktop, `390-*.jpg` phone) and `docs/design/v5/explorations/` (the design lab: the kit, the three hero compositions). The before-state is in `docs/design/v5/before/`.

## The ten questions, per scene

Answers are for the final build. "Card?" asks whether a card or grid crept in because it was easier.

| Scene | Single idea | Visual does the explaining? | Differs from the scene before? | Focal point in two seconds | Copy that could go | Card? | Could be generic SaaS? | Authored? | Advances the story? | Beside the reference? |
|---|---|---|---|---|---|---|---|---|---|---|
| Hero | Private expertise → visible to the right buyers, on one line | Yes: archive, press, pegged line, buyers, a reply coming back | — | The pegged line | None | No | No | Yes | Sets it | Holds |
| Strip | What the service is, in six tags | Partly (the tags hang on the thread; the words carry it) | Yes: a thin line after a panorama | The line | None | No (tags on a line) | No | Yes | Summarises | Holds |
| Problem | Dense inside, sparse outside | Yes: the vault, one strand through a hatch, one buyer with a referral and a deck | Yes: full-bleed night/sky split | The wall and the hatch | None | No | No | Yes | Yes | Holds |
| Memory | Familiar, not famous | The mega statement carries it; the frieze shows five encounters, knots accumulate | Yes: quiet typographic moment then a strip | The statement | The five-item list under the frieze repeats the frieze labels; kept for screen readers and no-JS | No | No | Yes | Yes | Holds |
| Burden | Calm founder, busy machine | Yes: two rooms side by side | Yes: lilac field, two framed rooms | The founder in the armchair | None | The two rooms are framed panels; they are rooms, not cards | No | Yes | Relief | Holds |
| Workshop | One root object changed at six stations | Yes: the bench, the carrier, six stations | Yes: immersive night panorama, sticky stage | The carrier | None | No | No | Yes | Mechanism | Holds |
| Expressions | Idea first, expression second | Yes: one spool, seven materially different objects | Yes: parchment, the thesis sheet, an arc | The spool | None | The thesis is a sheet of paper (an artefact) | No | Yes | Yes | Holds |
| Movement | Reach is not the result | Yes: the stepped street from glance to handshake | Yes: sky, descending steps | The buyer at the proof window | None | No | No | Yes | Yes | Holds |
| Diagnosis | Expected → actual → why → change → retest | Yes: jars with expected marks, the tipped block, the hook | Yes: the mint bench, interactive | The tipped block | None | The readout is a sheet | No | Yes | Learning | Holds |
| Cycle | Noise becomes pattern | Yes: twelve loose threads → cut or doubled → woven | Yes: one continuous drawing | The gather ring | None | No | No | Yes | Yes | Holds |
| Comparison | What surrounds the content | Yes: the abacus | Yes: paper-deep field, one device | Threadline's row | None | The abacus is a device, not a table of cards | No | Yes | Differentiation | Holds |
| Fit | A gate, two lists | Yes: the gate | Yes: typographic lists either side of one object | The gate | None | No | No | Yes | Fit | Holds |
| Closing | The opening world, changed | Yes: the same scene with the line fuller, knots tied, two signals returning | Yes: night, the mega headline, the dusk panel | The headline | None | No | No | Yes | Callback | Holds |

No scene answered "yes" to "could be generic SaaS" or "embarrassing beside the reference" in the final pass.

## What the first two passes found and changed

Pass one (desktop): station bins under the carrier at station 1; signal-tray labels overflowing; a stray black fill on the bench hook; folder labels cropped in the vault; grain filter panels showing on parchment scenes; the busy-machine art bottom-aligned leaving a dead lilac field; the seam thread crossing the tag strip; the closing scene identical to the hero.

Pass two (desktop + phone): the busy machine zoomed by `slice`; expression labels crossed by threads; the inspector covering the DESTINATION block; the phone vault too small to read; the gate art with a third of empty sky; the comparison header overlapping at 390; the nav CTA wrapping at 390; the loom illegible at 390 (now a diagram the visitor can pan); SVG bleed producing 17px of horizontal overflow at 1024 (artwork now clips to its box).

## Composition rules, checked

- One obvious focal point per viewport: yes for every scene above.
- No more than two consecutive sections share a macro layout: the sequence is panorama · line · full-bleed split · typographic + frieze · two rooms · sticky panorama · arc · stepped street · bench + panel · loom · device · gate · panorama.
- No scene is headline + paragraph + card grid.
- Five silhouettes recognisable alone: the pegged line, the vault split, the workshop bench, the loom, the abacus (also the gate and the stepped street).
- Three illustration-dominant scenes: problem, workshop, movement (also the frieze and the loom).
- One mostly typographic, quiet moment: market memory.
- One immersive full-bleed environment: the workshop (also the problem split and the closing).
- One transformation interaction: the bench (also the workshop carrier and the expressions).
- Nothing starts hidden; the page reads with JavaScript off (the workshop shows station 1 and the readable station list; the bench shows Expected; the expressions list is plain).

## Automated gates on the production build

GATES_TABLE

## Known limitations

- The bench and loom illustrations are small at 320–390; the loom pans, the bench keeps a legible readout panel under it.
- The design lab route exists only in development (`notFound()` in production, disallowed in robots).
- The phone captures were made with a 390-wide emulated viewport; sticky-nav behaviour was verified by measurement (top 0, position sticky) rather than by eye in every capture.
