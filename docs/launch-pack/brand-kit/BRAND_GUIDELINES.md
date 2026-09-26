# Threadline brand guidelines

**Status: production-complete; owner approval pending.** Prepared 26 September 2026 for the launch asset pack.

Everything here is taken from what the approved public site and product already render. No mark, colour or typeface was invented or redrawn. Where the site and older brand documents disagree, the live site wins, and the conflict is listed in section 8.

Sources:
- `src/components/brand/logo.tsx`: the mark.
- `src/components/marketing-v5/Nav.tsx` and `src/styles/marketing-v5/page.css`: the public lockup.
- `src/styles/marketing-v9/index.css` and `src/styles/marketing-v5/tokens.css`: the colours.
- `src/app/layout.tsx`: the fonts.
- `docs/site/BRAND_SOURCE_OF_TRUTH.md`: the wording rules.
- `docs/design/ART_DIRECTION_2026-09-25.md`: the illustration direction (a proposal).

## 1. The logo

**The mark.** One continuous line runs through the stages of an operation and resolves at the second node. It is one thread, not a decorative icon. It is drawn on a 24-unit grid:
- Path: `M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5`.
- Stroke: 1.6 units, round caps and joins, 90% opacity.
- Nodes: two, each with radius 1.9. The first is solid and the second is at 55% opacity.

These opacities are part of the mark. Keep them in every colour version.

**The lockup** is the mark plus THREADLINE. The type is Inter Bold (700), upper case, tracked 0.22em. It is built exactly as the public site header draws it:
- The mark is 35 px against 21.5 px type.
- The gap between them is 14 px.
- The mark's stroke is 2.2 in the lockup; the header thickens it at that size.

The type is centred on the mark: the cap height sits exactly on the mark's centre line.

| File | Use |
| --- | --- |
| `logo/svg/threadline-lockup-light.svg` | Light grounds (white, canvas, paper): marigold mark, ink type |
| `logo/svg/threadline-lockup-dark.svg` | Night or other dark grounds: marigold mark, paper type |
| `…-mono-ink.svg` | One-colour print, or wherever marigold cannot print |
| `…-mono-black.svg` | Fax, stamps, legal forms, single-colour vendors |
| `…-mono-white.svg` | Photographs and any dark ground where marigold would clash |
| `logo/svg/threadline-mark-*.svg` | The mark alone, at the exact product geometry (stroke 1.6) |
| `logo/svg/threadline-mark-*-heavy.svg` | The mark alone with the site's 2.2 stroke. Use below 32 px (favicons, small avatars) |
| `logo/svg/threadline-wordmark-*.svg` | Type only. Use only where the mark already appears nearby, for example a footer beneath an avatar |

**Outlines and live text.**
- The master SVGs have the type **converted to outlines**. The outlines come from the Inter font file the site ships: the variable font was instanced at weight 700 with fontTools, so they are the font's own glyphs, not a tracing.
- The `*-text.svg` files keep live text for editing. They render correctly only where Inter is installed.

**PNG exports.** `logo/png/` holds transparent PNGs at 512, 1024 and 2048 px wide. They were rendered from the SVG masters in headless Chrome.

### Clear space
Keep clear space equal to **half the mark's height** on every side. In the lockup, the mark's height is the lockup's height. At the header size of 35 px, that is 17.5 px. No type, edges or other marks may enter it.

### Minimum sizes

| Item | On screen | In print |
| --- | --- | --- |
| Lockup | 120 px wide (the mark is then about 18 px) | 30 mm wide |
| Mark alone, standard stroke | 32 px | 8 mm |
| Mark alone, heavy stroke | 16 px | 5 mm |

### Do not
- Redraw, re-space or re-weight the mark.
- Change the curve, or drop or move the two nodes.
- Remove the node opacities.
- Recolour the mark in anything other than marigold, ink, black or white.
- Put the marigold lockup on a mid-tone photograph.
- Set THREADLINE in another typeface or in mixed case, or remove the tracking.
- Add a shadow, glow, gradient, outline or 3D effect.
- Rotate, skew or stretch the logo along one axis.
- Place the mark inside a circle or badge, except in the avatar and app-icon files supplied.
- Write "ThreadLine" or "Threadline OS" in public material. The OS is the internal product name.

## 2. Colour

These are the exact values from the site code: `--v9-*` for the live public palette and `--v5-*` for the mark.

| Role | Hex | Token | Use |
| --- | --- | --- | --- |
| Canvas | `#E8F1F8` | `--v9-canvas` | Page ground |
| Panel | `#FFFFFF` | `--v9-panel` | Cards, documents |
| Ink | `#17233A` | `--v9-ink` | Type, logo type, line art (15.7:1 on white) |
| Ink soft | `#3B475E` | `--v9-ink-soft` | Secondary type (9.3:1 on white) |
| Ink faint | `#6B768A` | `--v9-ink-faint` | Captions and labels on white only (4.6:1). On canvas it is 4.0:1, so use ink soft for small text there |
| Line | `rgba(23,35,58,0.12)` | `--v9-line` | Hairlines, table rules |
| Action | `#1F63D6` | `--v9-action` | Links and the one primary button (5.5:1 with white) |
| Action deep | `#164BA6` | `--v9-action-deep` | Hover and pressed states |
| Night | `#101A33` | `--v9-night` | Dark stages, slides, app icon |
| Marigold | `#C88B2D` | `--v5-gold` | The mark and the thread only. Never body text on light grounds (2.9:1 on white); 5.9:1 on night |
| Paper | `#F5F2EA` | `--v5-paper` | Type on night; parchment callouts |

**Tints**, for tiles and states only and never for type:
- sky `#DBEAF7`
- mint `#D9F0E3`
- peach `#FFE4D6`
- lilac `#E6DDFA`
- butter `#FFF0C2`

**Evidence colours in reports** are fixed so readers learn them:
- **mint:** measured
- **sky:** client-reported
- **peach:** inference

## 3. Typography

| Face | Role | Weights | Fallback stack |
| --- | --- | --- | --- |
| **Instrument Serif** | Headlines, report titles, pull quotes | Regular and Italic (the only styles it has) | `"Iowan Old Style", Georgia, "Times New Roman", serif` |
| **Inter** | Body, labels, tables, the wordmark | 400, 500, 600, 700 | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif` |

**Setting:**
- Headlines are set large and tight, with letter-spacing of −0.01 to −0.015em.
- Eyebrows are Inter 600, upper case, tracked 0.14 to 0.16em.
- Body line height is 1.45 to 1.55.
- Tables use tabular numerals.

**Licensing.** Both families are published on Google Fonts under the **SIL Open Font License 1.1**. The licence allows:
- use in print, on the web and in logos;
- embedding in PDFs;
- outlining text in artwork;
- redistributing the fonts, provided the licence and copyright notice travel with them.

This kit does **not** redistribute font files. The files in the site build are subsetted by `next/font` and carry no embedded licence text. The templates load the fonts from Google Fonts and fall back to the stacks above.

Owner check: before sending font files to any vendor, confirm the licence on each family's Google Fonts page (the "License" tab).

## 4. Spacing and shape

- **Spacing** uses a 4 px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. The site's section inset is 30 px.
- **Corner radii:**
  - 40 px (`--v9-r`) for large panels;
  - 20 px for tiles;
  - 10 px, or fully rounded pills, for chips.
- **Use of the rounded panel.** Keep it to heroes, covers and closings.
- **Hairlines** are 1 px in the line colour.
- **Diagrams** sit on paper, with hairlines and no radius.

## 5. Illustration, graphics, photography and charts

### Illustration: the illustrated workshop world
Drawn scenes show expertise being worked at a bench, with a thread running from input to output.
- One ink line weight: 1.6 units at hero scale.
- One camera: a three-quarter view from slightly above.
- One scale for people and objects.
- Flat fills from the material kit. No gradients, glow or noise.
- The thread is the only warm accent.
- People are studio figures with real posture and hands at work. A single nose-and-brow stroke suggests the face. They have no eyes and no mouth, and are never portraits or cartoon faces.

These rules follow `docs/design/ART_DIRECTION_2026-09-25.md`, which is itself still a proposal awaiting owner approval. The existing site scenes in `public/marketing/` are the reference.

### Graphics and diagrams
- Text never goes inside artwork. Labels and captions are live type beside or over the image.
- Draw graphics and diagrams in code or vector: ink on white or canvas, with the marigold thread for the one path that matters.

### Photography
- No photographs of people.
- No stock imagery of teams, handshakes or laptops.
- Threadline is presented as a brand. There is no founder face and no invented spokesperson.
- Product screenshots are allowed, with any demo data labelled.

### Charts
- Use real data only, with the evidence class labelled.
- Illustrative figures must say "Illustrative, not a client result" on the chart itself.
- No invented trend lines, and no rising curve drawn to suggest unmeasured growth.
- A falling result is shown as it is.

## 6. Voice and messaging

**Name the buyer before the promise**, for example "For expert-led B2B firms".

**Canonical lines** (use them word for word):
- "We are not trying to make you famous. We are trying to make you familiar to the people who matter."
- "You talk. You record. You approve. You sell. Threadline handles the machine."
- "Familiarity earns attention. Repeated valuable attention builds authority. Authority makes every other acquisition channel work harder."

**Tone:**
- Plain, specific and calm.
- Show judgement, not hype.
- Keep sentences short.
- Use British spelling in UK-facing material.

**Claims rules** (from `docs/site/BRAND_SOURCE_OF_TRUTH.md` and the SOPs):
- **No guarantees.** No promises of leads, revenue, followers, views or ROI, and no "the algorithm needs N days".
- **No fabricated or implied proof:**
  - no invented case studies, logos, testimonials, team members, credentials or spokespeople;
  - earlier founder track record is stated as such, never as a Threadline client result;
  - privacy is never an excuse for proof that does not exist.
- **Pricing stays off public material:**
  - no figures, no "starting from", no tiers, discounts or scarcity;
  - commercial terms are discussed in the qualified sales conversation.
- **Four-week periods, never "monthly":**
  - say "every four weeks", "service period" and "12-week initial engagement";
  - a four-week figure is never labelled monthly.
- **Brand-led, not founder-named.** Public material speaks as Threadline.
- **Cadence and platforms:**
  - no posting frequency is promised;
  - the platform mix is prescribed after diagnosis;
  - no automated engagement is implied.
- **No quantitative founder-time claim** until measured client data supports one.
- **AI is not the public category.** Do not say "AI-powered", "AI content" or "AI marketing".

**Words to avoid:** unlock, leverage, revolutionise, synergy, cutting-edge, game-changing, supercharge, 10x, content at scale, viral.

## 7. Templates in this kit

| File | Use |
| --- | --- |
| `templates/report-document.html` | A4 report or working document. Structured as Action / Results / Problems / Future, with evidence chips and an expected-vs-actual callout |
| `templates/report-cover.html` | A4 client report cover |
| `templates/presentation-cover.html` | 16:9 cover slide (1920×1080) |
| `templates/email-signature.html` | Table-based signature with inline styles, Threadline-branded only |

All the templates share `templates/_brand.css`. To print to PDF, use Chrome with "Background graphics" on. Replace every `{{placeholder}}` before use.

The email signature needs two things before it goes out:
- the logo PNG hosted at an https URL, because email clients do not render SVG;
- a registered name and postal address on any commercial email.

Previews of every template are in `previews/`.

## 8. Known conflicts (recorded here, not resolved)

1. **The favicon and share image use an older design:**
   - The live favicon, `src/app/icon.svg`, is a "T" with a cobalt wave on bone `#F3F0E8`, not the current thread mark.
   - The share image, `src/app/opengraph-image.tsx`, uses the same older palette: cobalt `#1F3BD6` and Georgia.
   - The files in this kit's `icons/` use the current mark.
   - Replacing the site favicon and share image is a public-file change that needs owner approval. It has not been done.
2. **The written brand sources are out of date:**
   - `docs/site/BRAND_SOURCE_OF_TRUTH.md` (9 September) describes a Fraunces wordmark with an ember thread.
   - `design-system/threadline-design-dna.json` v3 describes an ember accent `#D9582A` on linen.
   - The live site has since moved to the Inter lockup, the marigold mark and the v9 palette. This guide follows the live site. Both older files should be marked historical.
3. **Two marigolds.** `ART_DIRECTION_2026-09-25.md` proposes `#F2A51F` for the thread, while the built mark uses `#C88B2D`. Until the owner approves the art direction, the built value stands.
