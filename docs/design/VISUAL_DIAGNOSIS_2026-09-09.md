# Visual diagnosis — the public site before the restraint pass (9 September 2026)

Owner assessment: *the site feels a bit tacky.* This document is the section-by-section reading of the 9 September baseline (`qa-baselines/public/*.jpg`, captured from the production build at 1440/1024/768/390/320) that says specifically what produces that impression, what to keep, and what to change. Automated QA passed on the same build; technical correctness and visual taste are separate acceptance criteria.

## What is actually making it look tacky

Measured from `src/app/public.css`, `src/components/factory/*` and the baselines, in order of impact:

1. **The hard offset "sticker" shadow.** Every `.tl-card`, every button and the hero panel carry `6px 6px 0 0 var(--ink)` (8px on hover, 10px "pop", 3–4px on buttons) plus a 1.5px solid ink outline and a 20px radius. That combination is the neo-brutalist / cartoon-startup signature. It appears on the hero illustration panel, the "You" card, the machine panel, the branching panel, the memory panel, the diagnosis record, three of four period cards, the fit card, the CTA panel and the footer's top rule — so the eye meets it in every viewport.
2. **Stick-figure characters used as decoration.** Founder / Operator / Buyer (round head, dot eyes, one-line mouth, 80×140 figures) appear fourteen times on the home page alone: hero, problem scene, both division-of-labour cards, return loop, memory weave (×5), attention scene (×5), proof chain, CTA panel. They are drawn well for what they are, but as a *dominant* device they read as a children's book, not a consultancy.
3. **The literal factory.** Nine monitor-shaped "stations" on a striped conveyor with tiny 13px captions, crates with mono labels, a wavy dashed "return pipe", indicator lights, rotated stamps. The metaphor is right; the rendering is an amusement-park version of it. The station art is also the least legible thing on the page at 1024 (110px stations, 9 captions in a row).
4. **Everything is boxed, and every box competes.** Twelve sections; eleven have a bordered panel; the sections alternate canvas / deep-canvas bands so the page has no calm stretch. There is no section where type and whitespace are allowed to carry the message alone.
5. **Chip density.** The mono uppercase chip (`.tl-chip`, 1.5px ink border) is used for the twelve "Threadline handles" items, the three hero in/out/back labels, six package labels, four signal labels, three pricing chips. Thirty-plus outlined uppercase tokens on one page is a dashboard, not an editorial page.
6. **Five accent colours in play at once.** Ember (#D9582A), signal teal (#2C7C6A), stamp yellow (#F1C349), steel blue (#6B7A8C) and reject red (#C24A3A) all appear inside the machine panel simultaneously, plus their soft tints. The type palette is calm; the illustration palette is not.
7. **Rotated stamps and marker gimmicks.** `.tl-stamp` rotates −3°; SLOP / QUALIFIED / YES / NOT YET / PUBLISHED stamps, the wavy orange thread under the footer wordmark and behind the header wordmark, and the yellow marker highlight in the H1 are each defensible once; together they are the "startup with a sticker sheet" look.
8. **Mono label overuse.** The 12px mono uppercase eyebrow at 0.16em tracking in ember is correct as a section eyebrow, but it is also the label style for cards, station names, stamps, chips and captions, so nothing is quiet.

What is **not** the problem: the copy, the section order, the Fraunces/Inter pairing (the display serif is the best thing on the page), the linen canvas, the 1200px container and 62ch measures, the reveal timing, the sticky Apply, the accessibility work.

## Section-by-section

Format: SECTION · CURRENT PURPOSE · KEEP · CURRENT VISUAL PROBLEM · CHANGE · REFERENCE COMPONENT · CLASS · WHY.

### Home

| # | Section | Purpose | Keep | Visual problem | Change | Reference | Class | Why |
|---|---|---|---|---|---|---|---|---|
| 1 | Hero ("You already have the expertise.") | State the premise and the division of labour in one screen | All copy, both CTAs, the note, the H1 highlight | Two competing objects: 5.5rem serif left and a boxed cartoon scene right with hard shadow; three chips under it; the panel border fights the headline | Put the whole hero on one rounded paper panel (statement left, restrained system illustration right, illustration allowed to run off the panel edge); no outline, no shadow; chips replaced by one quiet in/out/back line | Birdhouse hero panel | **A** | Birdhouse's hero is the cleanest instance of "one paper panel on a tinted canvas, statement left, picture right" — proven proportions worth cloning before restyling |
| 2 | The problem | Four symptoms of the status quo | Title, lead, four points | Dashed cartoon crate scene + four identical quiet cards; nothing selects | Make the four points a selector: pick the symptom → the machine diagram highlights the station where it is fixed → the existing how-it-works stage copy explains what Threadline does there. Existing copy only. | Hydra constraint selector | **A** | Turns a static list into the site's first interaction without adding narrative; the reference skeleton has proven tab → diagram → explanation geometry |
| 3 | Division of labour (four things) | Low founder burden | Everything | "You" card with hard shadow and 2rem ember numerals; "Threadline" card is twelve chips | Two calm columns on hairline rules: the four verbs as a numbered editorial list; Threadline's ten verbs as a plain running list, not chips; one small figure pair at most | — | B | Editorial hierarchy does this better than outlines |
| 4 | The machine | The nine stations in order | Copy, scroll-lit order, the station names | The most literal cartoon on the site; nine monitors with 13px captions; belt stripes; five colours | Redraw as a schematic: nine nodes on one line (thin ink strokes, one accent for the lit node), thread instead of belt, captions shown one at a time for the lit node, mobile as a vertical rail | Hydra system diagram (principle) | B | The information (order + one job per station) survives; the rendering becomes a system drawing |
| 5 | Most stop at publish (return loop) | Publishing is the middle | Copy, five steps | Packaging monitor + belt + rotated stamp + giant dashed pipe + buyer figure | One thin return thread drawn on reveal, five steps as a hairline row | — | B | Same teaching, a tenth of the ink |
| 6 | One thesis, many packages | Derivatives share one history | Copy, six packages | Six outlined chips beside an ember branch in a shadowed box | Keep the branch (it is the thread motif at its best), remove the box shadow, package names as plain labels on the branch ends | — | B | Already close; restraint only |
| 7 | Market memory | Familiarity → conversation | Copy, five stages | Five stick figures on a wave inside a shadowed panel | Five small nodes on one thread with the stage names; no figures; no panel | — | B | Let the sentence and the line carry it |
| 8 | Reach is not the result | Reach vs the right buyer | Copy, both numbers, illustrative note | Two boxes with rotated SLOP / QUALIFIED stamps, four ghost figures, four chips | Two columns separated by a hairline: display numerals, one-line captions, the four signal kinds as a plain list; one small stamp at most, not rotated | Hydra stat row (principle) | B | Numbers plus hairlines read as evidence, stamps read as a game |
| 9 | Written down before, read against after | The diagnosis record | Copy, all five rows | Fine structure; outline + shadow + a monitor in the footer row | Keep as a hairline ledger; drop the outline shadow and the monitor; keep the RETEST verdict as text | — | B | This is the site's most credible object; it needs less decoration, not more |
| 10 | Three service periods | The engagement rhythm | Copy, four periods, note | Four cards, three with hard shadows, the fourth dashed | Four period cards with a small period-timeline diagram box in each (the reference card skeleton), hairline borders, no shadows | Hydra offer cards | **A** | The reference card (eyebrow → title → body → diagram box → fact line) is exactly this content's shape |
| 11 | Product proof (synthetic chain) | The mechanism as proof | Copy, ten records, synthetic label | Ten quiet cards, an operator figure | Ten records as a numbered hairline list in two columns; label stays; figure goes | — | B | A record reads as a record when it looks like a ledger |
| 12 | Fit | Good fit / not a fit | Copy, both lists | Rotated YES / NOT YET stamps, one shadowed card | Two columns on a hairline, check/cross glyphs as they are, labels as plain eyebrows | — | B | Restraint only |
| 13 | Apply CTA | The ask | Copy, button | Shadowed panel with two figures | One paper panel, no outline shadow, button only | — | B | — |
| — | Footer | Navigation + giant wordmark | Columns, wordmark, tagline; **price line removed** (owner decision) | Wavy orange thread through the wordmark; 1.5px ink top rule | Straight hairline; wordmark alone | Birdhouse footer wordmark (principle) | B | The wordmark is strong on its own |
| — | Header | Three links + Apply | Everything | Wavy thread under the wordmark; shadowed Apply button | Plain wordmark; flat primary button | — | B | — |

### How it works

| Section | Keep | Problem | Change | Class |
|---|---|---|---|---|
| Title + lead | All | — | — | — |
| Machine panel | Copy | As home §4 | Same schematic component | B |
| Seven stage cards | Copy, order, station art slots | Seven outlined cards with monitors at 180px | A numbered editorial list on hairlines with a small schematic glyph per stage | B |
| Gates | Copy | Four cards each with a rotated "GATE" stamp | Four hairline cells, plain eyebrow "Gate 01–04" | B |
| CTA panel | Copy, button | **Three price chips (owner decision: remove)**; shadow | Panel without price; hairline | B |

### Who it is for

Profile cards → two-column definition list on hairlines; fit section as home §12; CTA panel as above. Hero figures removed. Class B throughout.

### Apply, Calculator, Playbook, Auth

Apply: form card loses the outline shadow; sticky intro keeps the copy; figures removed. Calculator: unchanged in function (it costs the founder's own operation and never states Threadline's price); surface restraint only. Playbook: chapter cards and the chapter hero panel lose shadows; the turn-over reveal stays; chapter art becomes the schematic glyph set. Auth pages inherit the same surfaces.

## What to increase

Typography contrast (bigger display, quieter everything else), whitespace between sections (one calm band after each expressive one), hairline rules instead of outlines, one accent colour per section, fewer but better drawings (thread, nodes, spools, inspection marks), motion that only draws or lights, mobile recomposition that stacks to a single rail.

## What survives untouched

Every sentence of public copy, every section, the section order, the CTAs (except the price line and the price chips, removed by owner decision), the claims discipline, the application flow, the calculator, the playbook chapters, the sticky Apply, the skip link, the 44px targets, reduced-motion behaviour.
