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

## Second pass (26 September 2026): the owner's notes on the first pass

| Note | Where it applies | What changed |
| --- | --- | --- |
| "You didn't need to zoom the hero so much" | phone | The crop is 16:9 instead of 4:3, anchored a little further right, so the archive wall, the press, the line and the buyers are all in frame |
| "Under what the market sees, decrease the blank space" | phone | The band's bottom padding drops from 120px to 28px, and the memory panel no longer pulls up by 40px, so the gap matches the other sections |
| "What you do is repeated twice; remove the second" | everywhere | The four-object "What you do" tile is gone (the four capsules above already say it). The eight Threadline jobs stand alone in one wide tile: one row of eight on desktop, two columns on phones |
| "Useful encounter, recognised, remembered… is five separate lines" | phone | The route is one wrapping line with its arrows again (three lines at 390px) |
| "Expected, actual, why, change, retest: the copy is long, bullet it" | phone | Under 760px the paragraph is replaced by five numbered lines (`learning.steps` in `src/content/home.ts`); desktop keeps the paragraph |
| "The animated tool is too small on the phone, zoom in" | phone (under 600px) | The bench drawing renders at 170% width inside a stage that slides: to the jars for Expected, Actual and Retest, to the blocks for Why and Change. The drawn labels stay hidden; the panel text carries them |
| "A good fit vs not a fit: a neater table" | everywhere | Both lists are one table (`FitTable`), one pair per row, with the blue dot and the coral ring in the header. Who it is for uses the same table with the sky and peach column tints it had before |
| "Too much space between the buttons and the clothing-line picture" | phone | The closing copy's bottom padding is removed on phones and the scene sits 6px under the buttons |
| "Add a Threadline intro animation on loading the site" | everywhere | `src/components/marketing-v9/Intro.tsx`: the thread mark draws (0.7s), the two nodes pop, the wordmark settles, then the canvas lifts at 1.15s; gone by 1.6s. Plays once per browser session (an inline script marks the document before first paint on later pages), never captures the pointer, is skipped under reduced motion, and is removed from the DOM after its exit animation or at 2.6s, whichever is first. With no JavaScript the CSS still animates it out |
| "The menu in the top right clips the left side of the phone and looks crappy" | phone | The menu is a full-width white sheet under the bar: three numbered serif links (the current page in blue), Client sign in, and the blue button, with 20px gutters. The nav row itself has 16px gutters and the wordmark does not wrap, so nothing is pushed off the left edge at 360 or 390px. Checked open at both widths on the production build |
| "Increase the logo and boldness by 20% on PC too" | desktop | Wordmark 21.5px at weight 700, mark 35px with a 2.2 stroke (the phone keeps 15.5px / 24px, weight 600) |
| Live hydration error on the Playbook (found by the launch audit) | everywhere | The expectation card's "Read on" date was computed at render, so the server in UTC and a phone near midnight disagreed on the day. The date is now set after mount |

## Third pass (26 September 2026): the next notes

| Note | Where it applies | What changed |
| --- | --- | --- |
| "The fit table on the main page isn't colour coded like the rest" | everywhere | The homepage table now uses the same sky and peach column tints as Who it is for |
| "Make the 1 to 6 work on How it works (it doesn't work on phone)" | phone | The two half-renders were stacked, so the dots scrolled nothing. Now one half shows at a time (stations 1 to 3 on the left half, 4 to 6 on the right), the numbered marker sits on the chosen station, the dots sit above the picture, and only the chosen caption shows with "0N of 06". All six captions stay in the HTML without JavaScript |
| "Number 10 touches the bottom of its box in the chapter picker" | everywhere | The rail marks use line-height 1 with a 1px bottom nudge, so every number is centred |
| "Size-optimise How it works, Who it is for and the Playbook for phone" | phone | Section gaps 48px instead of 72 to 110; stage, gate and chain tiles tighter; the seven profile rows are object-left rows (64px object, copy beside it); the chapter map tiles smaller (52px objects); chapter heads, idea and do-today cards, tool panels and crate tiles tighter. Page heights at 390px: How it works 8,961 to 7,588, Who it is for 6,222 to 4,809, Playbook 24,279 to 21,938 |
| "Cost of the status quo: same fonts and styles as the rest, and optimise for phone" | everywhere | The calculator is rebuilt in the site's system: a paper tile of range inputs with serif values, a night tile with the total in butter and two gold bars, sky and peach tiles for the two figures, a mint tile for the scenario, the assumption and the notice as plain notes, the blue button. Two columns on desktop, one on phones with 18px tile padding. Same arithmetic and copy |
| Overflow at 320px (found by the suite) | phone | The bleeding hero and gate scenes use 16px negative margins under 380px to match the panel padding |

## Fourth pass (26 September 2026): rhythm, notes, the self-playing bench

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Inside the firm / what the market sees: the gap is too big" | everywhere | The heading's bottom space drops from 40px to 16px (8px on phones) and the band sits 8px under it instead of 28px |
| "A lot of section titles are uncentred" | phone | Every section head, the chapter heads and the form-page heads are centred on phones, like the hero. Desktop keeps its left-aligned editorial heads |
| "Remove the notes" | everywhere | Gone: "What the last station learns feeds the first", "The route ends in human conversation…", "Inference is labelled as inference…", "Our current research focus…", and the clause "and the last stage feeds the first" on How it works |
| "The illustrative cases should be animations by themselves, with headings above the jars" | everywhere | The bench plays itself once it is in view: five step headings above the stage (the current one lit), the reading under it with the step named, the change applied a beat after the block lifts, and the loop restarting after the retest. Hover, focus or a tap on a step pauses it; reduced motion never starts it and the steps stay tappable. The case chips, the lever and the Back/Next/Run buttons are gone; one labelled case remains ("Illustrative: Good idea, weak hook. Not a client result.") |
| "The gaps are inconsistent, check every page" | everywhere | One rhythm: every section carries only top space (`--v9-section`, 64 to 96px on desktop, 40px on phones), the closing carries its own, nothing carries bottom space. Applied to the homepage, How it works, Who it is for and the Playbook |
| "The moving Threadline banner should be on every page" | everywhere | `WordmarkMarquee` ends the homepage, How it works, Who it is for, the Playbook, Apply and the calculator |
| "The four gate boxes need not be that large" | everywhere | The mark sits beside the title instead of above it; padding and type reduced. Each gate is about 60% of its former height |
| "Does the footer need to be as long on phone" | phone | The three link columns sit side by side under the brand, rows are 36px, the end line stacks. The footer is about half as tall |

## Fifth pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "04 Change doesn't work when clicked during the animation" | everywhere | The change (the fresh block dropping in) was timed by the loop, and the loop pauses on hover or focus, so a click on step 4 never applied it. It now lands 1.1s after step 4 is entered, whichever way it was reached |
| "Remove the founding client programme small print, then centre the three footer columns" | everywhere | The small print is gone and the end line is the copyright alone. The three columns are centred in their cells with even spacing; on phones they sit side by side under the brand |
| "One idea, the right expressions: move the image up" | everywhere | The line art sits 20px under the heading instead of 40px (12px on phones) |
| "The visibility gap: space the text equally between the banner above and the rooms below" | everywhere | Equal space: 32px above the heading (ticker bottom + section top) and 32px below it (heading bottom + band gap) on desktop, 24px each on phones |
| "Number 10 still touches the edge of its box" | phone | The rail marks are now flex-centred with no padding and the rail has 12px of padding; in headless Chrome the number sits centred with 10px clear on every side, so this may be a Safari rendering of the grid centring, which is what changed |
| "Remove the short copy between the chapter titles and the idea" | everywhere | The chapter summary line is gone on the playbook page and the standalone chapter pages |
| "Remove the bottom copy about three four-week periods" | everywhere | The note under the three period tiles is gone |

## Sixth pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "The chapter pictures aren't aligned" | phone | The object is centred over its title (the wrapper was centred, the picture inside it was not) |
| "What Threadline does: put the title at the top of the graphic" | everywhere | The caption sits above the eight objects |
| "One idea, the right expressions: the line at the bottom of the four boxes" | everywhere | The faint room line ("Where the buyer reads" etc.) is removed from all four |
| "04 Change: make the box move instantly when clicked" | everywhere | Tapping step 4 (or 5) applies the change at once; the 1.1s beat remains only when the loop plays itself |
| "Move the ten boxes up by 0.3cm on phone" | phone | The rail sits 10px higher |
| "Animate the card turn, and remove the 'Turn the card' label" | everywhere | The answer fades and settles in over 360ms and the card tints; the label is gone, the plus icon and the question remain |
| "The 1 to 10 bar should not scroll with the page" | everywhere | The rail is no longer sticky |

## Seventh pass (26 September 2026): copy as a story, the playbook chapters

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Remove the read button in the playbook" | everywhere | The "Mark as read" button is gone; chapters still count as read when they have been on screen (the automatic reader stays), so the rail's tally and the "read" marks keep working |
| "A line divider between each chapter" | everywhere | A hairline rule between chapters, with the section space below it |
| Titles and copy as one story, no longer than before | homepage | Section eyebrows now read in sequence: The visibility gap; What we build instead; How we'll work together; Our curated system; One idea, multiple formats; How we test and perfect; Who this is for. Headlines: "Strong firms know far more than the market does." and "One idea, multiple formats." Bodies shortened in the gap, memory, roles, expressions and learning sections; the five learning steps rewritten as one clear line each. The hero, the memory headline, the founder-role headline and the five-word learning headline are unchanged (approved copy). No promises added, no em dashes |
| The inner pages' eyebrows | How it works, Who it is for | "The system, station by station", "Who does what", "What we refuse to do", "One idea, start to finish"; "Seven signs it fits", "The fit, plainly" |

## Eighth pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Animation when clicking the dropdown bar" | phone | The menu sheet fades and settles in over 260ms and its links follow in a 40ms stagger |
| "Remove Who this is for from the main page; replace it with what the engagement looks like" | homepage | The fit table is gone from the homepage (it stays on Who it is for). In its place: "Twelve weeks. Three periods. One honest verdict." with the three period tiles from the Playbook and a link to apply |
| "Expected, actual, why, change, retest in cool boxes" | everywhere | The five steps are five outlined cards on every width (a row of five on desktop, stacked on phones): number, name, one line. The paragraph is gone |
| Final copy update | everywhere | Hero lead, workshop body, How it works lead, Who it is for lead, Apply lead and calculator lead rewritten to be sharper and shorter. Approved and suite-protected lines unchanged. No promises, no em dashes |
| Body font | everywhere | Left as Inter, on purpose: against the Instrument Serif headings it is the quietest, most legible body face at 17px on a phone, and a serif body or a geometric sans would either drop legibility or make the site read as a generic startup. Reopen if you have a face in mind |
| "The jars are drawn poorly" | everywhere | The jars are now drawn in code rather than pasted from a render: clean glass with a rim, a highlight, a scale, a level that rises and changes colour, and a pegged expected mark. Same behaviour, same labels |

## Ninth pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Idea, hook, distribution are not centred; letter spacing differs" | everywhere | The labels were being stretched to a fixed length, which changed their spacing and pulled long ones off centre. Now one size (9.5px), one letter spacing, each centred under its block |
| "Be less defensive about the twelve weeks" | homepage and playbook data | Period titles and bodies rewritten: "It starts quietly", "The evidence starts arriving", "The loop is running"; "or it is stopped honestly" removed; the homepage headline is "Twelve weeks. Quiet at first, then it compounds." |
| "Wins you work" | homepage | Hero and closing headlines |
| "Reframe the no-promises language" | everywhere | Chapter 10 is now "What actually matters" (same URL); its cards say "Not the scoreboard" and "Always"; the profile row, the calculator notice, the acquisition model note and the playbook honesty line are reframed around what matters rather than what is not promised. The not-a-fit items about clients who want guarantees stay, because they describe the client |
| "Fix the formatting within Diagnose" | playbook | The widget now uses the site's own type and tiles: Inter labels, the chip tabs, the seven stations as a row of small pills, a white card and a night card with serif titles, the blue button |
| "Remove the first-engagement section from the playbook" | playbook | Gone (it lives on the homepage) |
| "Move the bottom CTA up 0.5cm and lengthen the footer" | everywhere | Closing sections sit 20px higher; the footer gains 20px at the top |
| "Add the privacy policy and the other legal pages" | everywhere | Three new pages in the site's system, linked from the footer's Fine print column: /privacy, /terms, /cookies. Written from what the site does (application data, client sessions, the tracked-link cookie, browser storage, Resend, Vercel). Square-bracketed placeholders need the owner: legal entity, company number, registered address, privacy contact, retention periods, governing law, storage provider. Note for the owner: the tracked-link cookie `tl_v` is a first-party measurement cookie; under PECR it may need consent, which is a decision for the owner and their adviser |

## Tenth pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Can the hero be a loop animation of the machine running?" | everywhere | Reverted the same day: the owner wanted the existing picture kept, not replaced. For the record, what shipped for an hour was a drawn machine in the site's kit that loops every nine seconds: a card leaves the archive on the thread, passes between the press rollers, comes out as a finished sheet, is pegged to the line and travels to the three buyers, and a signal returns along the lower thread as the next card sets off. The motion is SMIL, so it runs without JavaScript in every browser; under reduced motion the static final frame renders. The rendered hero image is retired from the homepage (the file stays in the repo) |
| "I don't have an entity yet, keep it as a hidden section" | legal pages | "Who we are" and "Law" stay in the content marked hidden and do not render; a short "Questions and requests" section explains that the operating company is being set up. Every other bracketed placeholder is replaced with plain wording, so nothing on the live pages reads as a template |

## Eleventh pass (26 September 2026)

| Note | Where it applies | What changed |
| --- | --- | --- |
| "Animate the regular hero without changing the picture" | desktop and tablet | An overlay drawn in the picture's own coordinates loops every eight seconds: a marigold pulse runs along the thread from the archive shelf to the wall, reappears at the press and runs up to the line, the four pegs light in turn, and a signal returns along the ground to the archive. The picture file and markup are unchanged. Hidden under reduced motion and on phones, where the picture is cropped |
| "Tidy up the illustration section, it's an eyeful" | everywhere | The section is now the heading, then the bench. The five outlined cards and the five tabs said the same five words, so they are one thing: the five steps above the stage carry their one-line notes and drive the bench. The separate scene picture and the case line are gone (the stage already says "Illustrative" and names the case) |
| "The five pieces in the graphic look low quality" | everywhere | The blocks are drawn in code like the jars: a front, top and side face, two grain strokes, mint when replaced, coral when at fault. The rendered block image is retired from the bench |
| "The five labels aren't vertically centred in the plank; space the boxes a little more and give the labels a UX box" | everywhere | The blocks sit 80 units apart instead of 74, each label sits on a small paper plate centred in the plank, and the rest bar above the blocks is widened to match |
| "Remove the assumption note and the what-this-is notice from the cost of the status quo" | everywhere | Both paragraphs are gone from the calculator's results column; the figures, the scenario tile and the button remain |
