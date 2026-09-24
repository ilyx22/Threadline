# Prompts for Nano Banana (image) and Recraft (vector)

Rules that apply to every prompt: no faces, no mascots, no cartoon proportions, no glow, no gradients, no 3D render look, no stock-photo people, no logos, no real brands, no platform names or icons (no LinkedIn, no YouTube), no numbers, no text unless the prompt lists the exact words. Threadline's own style only; do not name any other company's website as a reference.

## Master style block (paste at the top of every image prompt)

```
Editorial illustration for a serious B2B strategy firm's website. Flat vector-style artwork with one consistent fine ink outline (about 1.5 px at 1600 px wide), flat fills, no gradients, no shadows, no glow, no texture. Palette, exactly: paper white #FFFFFF, pale sky blue #D3E6F6, deep navy #101A33, warm parchment #EFE6D6, oak wood #C9A87A, one muted lilac #DCD3F6 used sparingly, and a single marigold accent #F2A51F reserved for the thread. People, if any, are small faceless architectural scale figures: a plain oval head, a tapered coat, single-line limbs, no hands, no hair, no expressions, never the focus. Objects are physical: paper, folders, crates, a printing press, a spool of thread, pegs on a line, a work bench. Calm, precise, authored, like an annotated cutaway in a well-designed book. Generous negative space. Composition reads clearly at thumbnail size. No text anywhere unless specified.
```

## 1. Hero scene (replaces `scenes/1440-hero.jpg` artwork). Output 2400 × 1400, transparent or white background.

```
[master style block]
Scene: a private archive on the far left drawn as a dark navy room seen in cutaway, shelves of binders and folders, a founder seated at a desk; a single marigold thread leaves the archive, runs through a compact upright paper press in the centre (two rollers, a small gear, a stamped output tray), and continues to the right as a washing line strung between two thin poles, where four printed artefacts hang from wooden pegs: a written sheet, a small phone-shaped screen with a play triangle, a stapled document, a sheet with a circled tick. Under the line, four faceless scale figures stand looking up at the artefacts. The thread ends deliberately at the last pole; one short strand returns toward the press. Everything sits on one thin ground line. The right two thirds of the image must be light and open so headline text can sit to the left. Wide landscape, left-to-right reading order.
```

## 2. The visibility gap band (replaces `scenes/1440-gap.jpg` artwork). Output 2880 × 1000.

```
[master style block]
A full-width cutaway split into two rooms by a solid navy wall. Left room, sixty percent of the width, deep navy interior, dense and lit: three tiers of oak shelving crammed with binders, labelled folders, paper stacks and wooden crates; two faceless partners at a table with papers; a desk lamp. Right room, forty percent, pale sky blue and almost empty: one faceless buyer holding two thin sheets, a single framed "website" board on a stand, a lot of empty space. One marigold thread escapes through a small hatch in the wall and reaches the buyer. The imbalance between the crowded left and the empty right is the whole point. No text. Composition must keep the bottom 25 percent of the image free of important objects because a white panel will overlap it.
```

## 3. Closing landscape (replaces `scenes/1440-closing.jpg` artwork). Output 2400 × 1200, navy background #101A33.

```
[master style block] on a deep navy ground.
A quiet night scene: the same washing line as the hero, now longer and fuller, strung across the whole width with eight pegged artefacts, lit from below by two small lamps on posts; a marigold thread runs the full length and returns underneath as a second line back to a small spool at the left edge. No people, no press. Paper white and pale blue objects on navy; the marigold thread is the only warm colour. Wide, calm, cinematic in its emptiness.
```

## 4. Recraft — the object set (vector, one style, no text). Generate as SVG, one object per file.

Prompt for each object, same style block, ending with "single object, centred, no background, no text":
spool of marigold thread on a wooden axle · compact upright paper press with two rollers and a small gear · wooden peg on a line · written sheet with three ruled lines · phone-shaped screen with a play triangle · stapled document stack · sheet with a circled tick · wooden crate with a blank label plate · manila folder with a blank tab · paper stack · desk lamp · low oak work bench on two legs · brass-rimmed magnifier · sealed envelope · open ledger with a ribbon · small tabletop microphone · film camera on a short tripod · wooden stamp · returning arrow drawn as a thread with a knot.

These objects get composed in SVG/HTML with real, selectable, resizable labels. Never ask an image model to draw the labels.
