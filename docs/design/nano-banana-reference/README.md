# Nano Banana reference folder — Threadline homepage, 24 September 2026

Screenshots of the live homepage (production build on http://localhost:3001/) taken for the visual diagnosis. Paste the files under `scenes/` into Nano Banana or Recraft as style and composition references. Nothing here is a design asset; it is the current state, with its faults.

## Folders

- `full-pages/` — the whole homepage at 1440 (desktop), 1024 (tablet) and 390 (phone). Long images; open in an image viewer, not a chat window.
- `scenes/` — one crop per section, at each width, full resolution. Named `<width>-<section>.jpg`. These are the files to paste.
- `viewer/` — reduced copies and zooms used during the review (`zoom-*` show the defects up close).

## Sections (use the 1440 file unless you are briefing a phone layout)

| File | What it shows | Diagnosis |
| --- | --- | --- |
| `1440-hero.jpg` | Statement panel; press, poles, pegged artefacts, four buyers | Keep composition; regenerate the scene |
| `1440-ticker.jpg` | Italic line + chip marquee | Keep as is |
| `1440-gap.jpg` | Full-bleed vault band (inside the firm / what the market sees) | Keep idea; regenerate as one authored image; fix the overlap |
| `1440-memory.jpg` | Five-encounter frieze on a thread | Keep idea; rebuild as an SVG sequence with real objects |
| `1440-capsules.jpg` | Talk / Record / Approve / Sell capsules | Keep; better icon set |
| `1440-burden.jpg` | Calm founder tile + night "machine" tile | Redesign the night tile; drop the gears |
| `1440-mosaic.jpg` | Six station tiles | Rebuild in SVG with HTML labels; fix overlaps |
| `1440-expressions.jpg` | Spool → line → four pegged expressions | Rebuild as a clean diagram |
| `1440-learning.jpg` | The interactive bench | Keep the interaction; redraw the readout |
| `1440-fit.jpg` | Two lists around a gate | Remove the gate; typographic |
| `1440-closing.jpg` | Night panel with the hero scene again | Replace with a different image |

Phone (`390-*`) and tablet (`1024-*`) crops exist for every section. See `PROMPTS.md` for the prompts.

## Generated so far (`generated/`, Nano Banana 2 Flash, 1376 × 768, 24 September 2026)

| File | Scene | Gemini chat | Review |
| --- | --- | --- | --- |
| `hero-archive-press-line.jpg` | Hero: navy archive cutaway → thread through the hatch → press with stamped tray → four artefacts on the line → four buyers from behind | `gemini.google.com/app/261a831933b4aa25` | Accepted first pass. Faceless figures, one line weight, nothing clipped. |
| `gap-two-rooms.jpg` | Visibility gap: crowded navy workroom left, near-empty sky-blue room right, one buyer with two sheets, thread through the wall | `gemini.google.com/app/807d639a078f989f` | Accepted first pass. |
| `closing-night-line.jpg` | Closing: six artefacts on a marigold line between two poles, thread returning to a spool, two flat lamps, navy ground | `gemini.google.com/app/37dd99fcdef6e503` | Third attempt. Rejected: brown thread, empty pegs, a sheet cut off at the frame (`app/5f9fcf73d7b9e08f`, two versions). |

Rejected and not saved: the restyle-from-screenshot hero (`app/b56f5d14163ac8b0`) reproduced the old vocabulary exactly.

Flash output is 1376 px wide. The hero panel at 1440 shows the scene at about 800 px, so this is usable; regenerate the keepers on the Pro tier for retina if the direction is approved.

The object set (18 vector objects for the station tiles, capsules and diagrams) is planned for Recraft in vector mode and needs the owner signed in at `recraft.ai`.

## The object set (`generated/objects/`, 17 transparent PNGs, ~200–290 px each)

Recraft needs a sign-in, so the set was produced in Nano Banana as two 3 × 3 sheets on pure white (`objects-sheet-a.jpg`, chat `app/f1f572bb9881b7d6`; `objects-sheet-b.jpg`, chat `app/fb4a30f6a153534f`), then split locally: the white exterior is flood-filled to alpha, so paper-white fills inside the ink outline survive. Sheet A's folder came out navy and was replaced by sheet B's manila folder. Objects: spool, press, peg, sheet-written, screen-video, document-stack, sheet-tick, crate, folder, paper-stack, lamp, bench, magnifier, ledger, microphone, camera, stamp. At 1024 px per sheet they are ~250 px each: enough for capsule icons and small tile objects at 1×, not for a hero. The returning-thread arrow stays drawn in code. `viewer/objects-contact.jpg` shows all seventeen on the sky pastel.
