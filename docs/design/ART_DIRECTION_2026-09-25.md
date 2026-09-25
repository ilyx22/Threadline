# Threadline art direction: the editorial workshop (proposal, 25 September 2026)

Status: **proposal, not implemented.** The owner's correction of 25 September stands above every earlier brief: the illustrated world stays; its execution quality rises. Nothing below is built until the owner approves it. The site as it stands is tagged `checkpoint/before-art-direction-2026-09-25` (also a branch of the same name); `git checkout checkpoint/before-art-direction-2026-09-25` returns to it at any time.

## What the correction changes

The last three passes treated "premium" as "quieter": faceless stick figures, one thin line, isolated objects on pastel tiles, the same rounded panel for every section. The correction says the opposite. The workshop language was right; the drawing was not good enough. The balance stays 70% editorial and consultancy, 20% interactive product visualisation, 10% tactile character. The language stays: thread, paper, routing and sorting, stations, inputs becoming finished work, evidence returning, cause and effect you can see.

What goes: clip-art objects, children's-book proportions, stick people, oversized lone icons, pastel classroom cards, literal machinery, decoration that does not explain anything, one panel treatment everywhere.

## 1. Illustration style

**One name for it: the editorial workshop.** Every scene is a cutaway of a real working room, drawn the way a good architecture or design studio draws a studio: measured, warm, slightly witty, with the tools in use and the work in progress. Think ink-and-wash technical illustration with flat colour, not cartoon and not 3D render.

- **Drawn scenes, not object icons.** A section gets a scene with a before and an after in the same frame (the input on the left, the output on the right, the thread between them). Tiles that today hold one big object (the six stations, the burden tiles, the profile rows) get small scenes: a station in use, with hands on the work.
- **One fixed camera.** A gentle three-quarter view from slightly above, eye height about a person and a half, 30 degrees off the bench. Every scene on every page uses it, so the pages feel like one room seen from one chair. No isometric grids, no straight-on elevations except for diagrams.
- **One scale.** People are about 1.75 units tall against a bench of 0.9 units; a sheet of paper is A4 against the hand. Objects never balloon to fill a tile.
- **Detail where the eye lands, restraint elsewhere.** The working area of a scene (the press nip, the jar levels, the peg on the line) is drawn at full detail; backgrounds are simplified to two or three masses.
- **Wit in the staging, not in the faces.** A stack of binders leaning, a peg holding a phone like laundry, a jar with a marker clipped a touch too high: small, dry, physical jokes a strategy buyer enjoys.

## 2. Materials and textures

A fixed material kit, named and reused, so the world is consistent and buyable:

| Material | Used for | Rendering |
| --- | --- | --- |
| Oak | benches, poles, easels, the press frame | flat warm fill `#C9A87A`, a second darker face `#A8865A`, grain as three short strokes at most |
| Paper (white and parchment) | sheets, cards, documents | flat white `#FFFFFF` / parchment `#EFE6D6`, a single soft edge shadow `#E4DCCB` on the underside, ruled lines in ink at 40% |
| Ink | outlines, text marks, the founder's notes | `#101A33` |
| Brass | rims, clips, the press gear, hinges | `#D9B15A` with one highlight stroke |
| Glass | jars, the porthole, screens | `#F3F8FC` fill at 90% with the object behind showing, two vertical highlight strokes |
| Linen | coats and aprons | flat `#D3E6F6` (sky), `#DCD3F6` (lilac), `#EFE6D6` (parchment) with one fold line |
| Thread | the Threadline | marigold `#F2A51F` over an ink hairline; the only warm accent; always a physical thread with weight (sag, knots, a spool end) |

Texture is paper grain at 3% on white panels only, never on the artwork. No gradients, no drop shadows beyond the paper underside, no glow, no noise on objects.

## 3. Colour palette

Ground and panels stay as built (canvas `#E8F1F8`, white panels, night `#101A33`). Artwork uses the material kit above plus two signal colours reserved for states: mint `#CFEADB` for confirmed and improved, coral `#FFC8B4` for failed and short. Butter `#FFE6A6` is retired from artwork and kept only as a tile ground. Lilac is the buyer's colour everywhere (the same buyer appears on every page in a lilac coat); sky is Threadline's people; parchment is everyone else. Section tile grounds move from the five pastels to three: sky, parchment and white, so the pages stop reading as a classroom.

## 4. Line quality

One ink line at 1.6 units for every object at hero scale, thinned to 1.2 for interior detail and thickened to 2.2 for the ground line and the bench edge only. Corners are square with a 1 to 3 unit radius; no rounded blob shapes. Lines taper at the ends of paper edges and thread, which is what separates a drawn line from a vector stroke. Ruled lines on paper, level marks on jars and wood grain are at 40% ink, never full ink.

## 5. Character treatment

The correction rules out simplistic faceless people, and the earlier rejection rules out cartoon faces. The middle is the **studio figure**: drawn with real posture, weight and clothing, a hair mass, hands that hold things, and a face suggested by a single nose-and-brow stroke, no eyes and no mouth. Readable as a person at any size, never cute, never a portrait.

- A small recurring cast: **the founder** (parchment coat, sleeves up, always with a notebook or on a call), **the buyer** (lilac coat, always meeting the work somewhere ordinary), **two Threadline operators** (sky coats, marigold aprons, always at a station with hands on the work). Nobody else.
- People are the minority of any scene: one or two figures, sized to the bench, doing something legible. The scene's subject is the work moving, not the person.
- Never a figure standing and looking. If a figure is in frame, they are pegging, winding, reading, stamping, lifting, pointing at a level.

## 6. Motion principles

Motion shows cause and effect once, then stops.

- **The thread draws.** On reveal, the thread draws through the scene from input to output in about 1.4 seconds; knots appear where a decision was made. Everything else in the scene is already there.
- **Objects change state, they do not float.** A jar fills, a block lifts out and a fresh one drops in, a peg takes a sheet, a stamp lands. Each is a single 400 to 700 millisecond move with an ease-out, triggered by the reader (a tab, a button, a scroll into view), never on a loop.
- **Reveals are settles, not slides.** Copy and tiles rise 12 to 30 pixels and fade in once per section. No parallax, no scroll-scrubbed animation, no marquee inside artwork (the ticker and the wordmark marquee stay because they are typographic).
- **Reduced motion renders the finished state.** Every scene is authored so the final frame is the complete explanation.
- **Raster scenes get motion through overlays, not filters.** The thread and the state changes are SVG drawn over the raster in the same coordinate space, authored per scene from a coordinate sheet, not traced from pixels.

## 7. Desktop and mobile

The world does not shrink; it recomposes.

- **Desktop (1200 and up):** wide cutaways, the scene running off the panel edge as the reference does; two-room and six-station panoramas as diptychs at native resolution.
- **Tablet (768 to 1199):** the same scenes at full container width, copy above; diptychs stay side by side.
- **Phone (under 768):** every panorama is built from separable vignettes, so on phones it becomes a vertical strip of vignettes with the thread drawn as an SVG connector between them, each vignette at its own 1:1 resolution. Nothing is a desktop image scaled to 360 pixels. The station line becomes six vignettes with a stepper; the five encounters stay five tiles; the two rooms stack with the hatch between them.
- **Containers vary by role.** Hero: white panel with the scene bleeding. Bands: full bleed with masked edges. Diagrams: paper sheet with hairlines, no radius. Interactive objects: an inset night or mint stage. Lists: no container at all, hairline rules. The 40-pixel rounded panel is used for the hero, the closing and at most one section between.

## Applying it, page by page (what the owner will see)

| Page | Scenes (all re-rendered in the new style, same camera, same cast) | Kept as code (interactive or labelled) |
| --- | --- | --- |
| Home | Hero (archive → press → line → buyers, the founder at the desk, one operator at the press). Visibility gap as one continuous cutaway with the wall (two halves at native resolution). Five encounters (the buyer, five ordinary places). Working relationship as one scene: the founder at a small desk on the left, the operators' long bench on the right, the thread between. Six station vignettes in use. Expressions: the spool and the line with the four forms pegged. Learning: the bench scene. Closing: the night line. | Ticker, capsules (typographic), the interactive bench (rebuilt to the new pieces), expressions names and route, fit lists, band plates. |
| How it works | Hero (the eight-tool bench with an operator mid-task). The six-station diptych. Gates as four small scenes of a thing being refused (a sheet returned, a stamp withheld). The step chain as a paper ledger with the thread down its spine. | Stage tiles, the chain's labels, the stepper. |
| Who it is for | Hero (the gate, with the buyer walking through carrying the folder). Seven profile rows as small vignettes, not lone objects. | Fit columns, ledger typography. |
| Playbook | Hero: the ten chapter objects become ten small vignettes of a reader doing the thing (tapping a crate, filling the sentence, opening a drawer). Each chapter head gets its vignette. | Every widget, the rail, the tools. |

## Production method (so the style is consistent, not just described)

1. **A master style frame first.** One render establishes the camera, the cast, the materials and the line: the working relationship scene, since it has the founder, an operator, a bench, paper, a jar and the thread. Owner approves that frame before anything else is rendered.
2. **Every other scene is an edit of the master.** Rendered in the same chat with the master as the reference ("same room, same camera, same people, now show…"), so drift is small. Halves and vignettes are rendered from their parent scene the same way.
3. **Resolution rule.** Nothing is shown wider than about 700 pixels from a single render. Wider scenes are rendered in halves or vignettes and composed in HTML. If the owner takes the Pro tier, the same prompts render at 2K and the halves rule relaxes.
4. **Text never in artwork.** Labels, plates and captions are HTML; the thread and state changes are SVG.
5. **Objects still have a set**, but as scene cut-outs at the fixed camera, not icons: a jar, a block, a peg, a sheet, a spool, a stamp, a folder, drawn once in the master style and reused in the interactive pieces.
6. **A style sheet in the repo** (`docs/design/ART_DIRECTION_2026-09-25.md`, this file, plus a `style-frame/` folder with the approved master and the cast sheet) is the reference for every future render.

## Sequence and checkpoints

1. Owner approves this direction (or edits it).
2. Master style frame and cast sheet rendered and approved.
3. Homepage scenes rendered and wired; owner reviews at 1440, 1024, 390.
4. How it works, Who it is for, Playbook.
5. Motion overlays per scene.
6. Docs, QA suite, commit. Each step is its own commit, so any step can be reverted alone; the whole pass can be reverted to the checkpoint tag.

## Reverting

```
git checkout checkpoint/before-art-direction-2026-09-25      # look at the pre-pass site
git checkout frontend/visual-rebuild-v5                        # come back
git reset --hard checkpoint/before-art-direction-2026-09-25   # discard the pass entirely (on the branch)
```

The production build on :3001 is rebuilt from whichever commit is checked out.
