# Phone audit of the public site (25 September 2026)

The owner's note: "the phone is too narrow, some stuff hard to read", and "happy to change structure of boxes etc for the mobile only if it helps". This is the part-by-part audit at 390px (an iPhone 14/15 width), measured on the dev server and checked against the live site for the two form pages. Every finding names the measurement, then the fix. Fixes are phone-only (759px and under); desktop and tablet do not change. Decision DEC-036.

## How it was measured

- Full-page screenshots of all six public pages at 390px (`scripts/qa/.shots/phone-audit/`), read in 1300px slices.
- A probe run on each page collecting: content widths of panels, tiles and lists; a histogram of every visible text size; every text element under 13px with its colour; rendered image sizes; horizontal scrollers; characters per line of body copy; page height.
- The Apply and Calculator pages re-shot against the live site (`scripts/qa/.shots/phone-live/`) because the dev-server shots caught them mid-compile.

## The two root causes

**1. Width.** A phone is 390px wide. The white panel sat 12px in from each edge and had 20px of padding, so copy inside a panel had 310px, and tiles inside those panels had 282 to 294px. Sections outside panels had 334px. Two-column lists inside panels had 143px per column. Body copy ran at 19px in 310px, about 34 characters a line. That is the "too narrow" feeling: a quarter of the screen was margin.

**2. Small type.** The site uses many labels at 11 to 12.5px (the stage and station tags, "The idea", "Do this today", the tool names, the footer small print). At desktop scale they read as fine print; at phone scale, with the viewer's arm's length the same, they are the smallest text on screen and they are in the faint grey. Counts of text elements under 13px: Home 55 of 219, How it works 38 of 127, Playbook 116 of 412. On top of that, the drawn labels inside the testing bench rendered at 4px tall on a phone (the SVG scales with the tile).

## Part by part

### Global (every page)

| Part | Finding at 390px | Fix |
| --- | --- | --- |
| White panels | 12px inset + 20px padding = 310px of copy | Inset 0, padding 20px, radius 28px: 350px of copy (+13%) |
| Free-standing sections | 20px gutter = 334px | 16px gutter = 358px |
| Body copy | 19.2px, 34 characters a line | 17px at 1.6 line height, about 40 characters a line |
| Lead copy | 20.8px | 17.5px |
| Headings | H1 46px in 310px wrapped to 4 to 5 lines | H1 41px, H2 32px, in a wider column: 3 to 4 lines |
| Tags and labels | 11.5px in faint grey (`#6b768a`), 19 to 72 per page | 12.5px in the soft ink; gold on night panels |
| Footer small print | 13px at 50% white | 14px at 62% white |
| Nav | Fine; logo now 20% larger and heavier (18px wordmark, 29px mark) | none beyond the logo |
| Buttons | Full width, 44px or taller | none |
| Horizontal page overflow | None on any page | none |

### Home

| Part | Finding | Fix |
| --- | --- | --- |
| Hero scene | Rendered 349×129px: the archive, press, line and buyers are 30px-tall figures | Cropped to a 4:3 frame, anchored on the press, line and buyers, so the figures are about 2.5 times larger. The archive is out of frame on phones only |
| Ticker | Reads fine as a marquee | none |
| The visibility gap | Copy fine; the two rooms are 334px wide with legible plates | Rooms gain 24px of width from the gutter change |
| Market memory (five encounters) | A sideways strip 900px wide in a 310px window: two of five tiles visible, the second caption clipped ("RECOGNISI"), no hint that it scrolls | Five rows: the tile at 88px on the left, the number, name and caption on the right. The drawn thread under the strip is hidden on phones because the rows are vertical |
| Working relationship capsules | Fine | Padding trimmed to gain width |
| What you do / What Threadline does | Two tiles 480px and 900px tall because the objects are 120px in two columns | Objects at 84px: the tiles are about half as tall, labels 13px |
| How the work is done (six stations) | Six tiles about 380px tall each (2,300px of scrolling) with a 180px object above three lines of copy | Six rows: object 96px on the left, copy on the right, about 150px each |
| One idea, the right expressions | Line art and the four forms read fine | none |
| Commercial learning (the bench) | The drawn labels in the bench are 4px tall; the five step tabs wrap 3 + 2 | Drawn labels hidden under 600px; the step panel already carries the words. Tabs unchanged |
| Fit | Two columns of 143px, each item wrapping to 3 or 4 lines | One column |
| Closing | Fine | none |

### How it works

| Part | Finding | Fix |
| --- | --- | --- |
| Hero | Bench scene at 310×173px: small but the operator and tools read | Gains 40px of width |
| The line, station by station | The two half-renders sit in a 1,100px strip inside a 310px window; the dots scroll it but the marker and halves are a sideways swipe | The two halves stack at full width (358px each, so each station is about 2.5 times larger), the marker is hidden and the lit caption plus the pressed dot carry the state. Keyboard and dot behaviour unchanged |
| Stage by stage (seven tiles) | 282px of copy per tile, 12px "YOU · INPUT" labels | Wider tiles, labels 12.5px |
| Gates | Fine | none |
| Step by step (ten-link chain) | Fine; knots on the left, copy readable | none |
| Closing | Fine | none |

### Who it is for

| Part | Finding | Fix |
| --- | --- | --- |
| Hero | The gate scene is a 349×112px strip: the figures are 40px tall | Cropped to 5:3 centred on the gate |
| The profile (seven rows) | Object 72px above the copy, tiles 294px wide; fine but narrow | Wider tiles, padding trimmed |
| Research note | 14px in faint grey | Reads at the new gutter; unchanged |
| The fit | Already one column inside a panel | none |
| Closing | Fine | none |

### The Playbook

| Part | Finding | Fix |
| --- | --- | --- |
| Hero, numbers, chapter map | Fine at three columns | none |
| Chapter rail | Two rows of five 44px marks, "0 of 10 read" | none |
| Chapter heads and copy | 374px wide (outside a panel); fine | Body at 17px |
| "The idea" / "Do this today" / "Turn the card" labels | 11.5px faint, 72 of them | 12.5px soft ink |
| Widgets (crates, sentence, deck, rooms, evidence, expectation card, encounter slider) | All fit and work; the sort-the-deck card shows one card at a time by design | none |
| Bench (chapter 9) | Same 4px labels as the homepage bench | Labels hidden under 600px |
| Small indices in the widgets | 10px monospace indices | 11.5px |
| Page length | 24,800px (about 30 screens) | By design: ten chapters with a jump rail. Not changed |

### Apply and Calculator (checked on the live site)

Both are styled correctly on the live site at 390px: 44px inputs, labels at 14px, the progress bar, the results cards. The dev-server screenshots that showed them unstyled were taken during a recompile and are not a bug. No changes.

### Not found

Uses the same panel and wordmark rules; inherits the width change.

## What was not changed, and why

- The playbook's length and the sort-the-deck card: they are the interaction, not a layout fault.
- The closing scenes (349×195px): the night line reads as a silhouette and the copy above it is the point.
- Contrast of the faint grey on the pale canvas (about 4.2:1) passes for large text and is now only used for text 14px and over on phones.

## Verification

- Full-page shots at 390px after the change, in `scripts/qa/.shots/phone-after/`.
- `qa:marketing` and the launch audit at 390 and 430: no horizontal overflow, no clipped text, no unnamed controls.
- Desktop (1440) and tablet (1024) shots unchanged, since every rule sits under `max-width: 759px`.
