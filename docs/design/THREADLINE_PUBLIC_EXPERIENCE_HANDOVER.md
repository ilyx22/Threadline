# Threadline public experience — handover

Date: 9 September 2026. Companion documents: `THREADLINE_PUBLIC_DESIGN_SYSTEM.md`, `CUSTOMISATION_GUIDE.md`, `design-system/threadline-design-dna.json`, `docs/site/*`.

## Design concept

**The Threadline Authority Factory.** Raw expertise (crates: EXPERTISE, STORIES, PROOF, OPINIONS, EXPERIENCE) enters a line of ink-outlined stations — Scanner (research), Assembly (ideas, scripts), Record, Build, Inspector (Judge and fact-check stamp), Packaging, Sorter (distribution). Packages leave for the market. A return pipe brings the market's response back to the front of the line; the next batch is better informed.

- Thread (ember line) = idea lineage. Machinery = Threadline. Weave = market memory.
- Original cast: Founder, Operator, Buyer, plus the stations and a signal pulse. No creatures, no houses, no trees.
- The public tagline stays "You already have the expertise. We turn it into content people actually want to watch." The factory is the creative system, not the slogan.

## Where the design lives

| What | Where |
|---|---|
| Tokens (colour, type, spacing, shape, motion) | `design-system/threadline-design-dna.json` (values) → `src/app/public.css` (`.tl-public` scope) |
| Fonts | `src/app/layout.tsx`: Fraunces (variable, opsz/SOFT/WONK) `--font-display`; Inter `--font-inter`; JetBrains Mono `--font-label` — all Google Fonts (OFL), `display: swap`, real fallbacks |
| Palette | canvas #F4EEE3 · canvas-deep #EAE1D2 · paper #FFFBF4 · ink #1F1D1A · accent (ember) #D9582A · signal #2C7C6A · stamp #F1C349 · reject #C24A3A · steel #6B7A8C · belt #3A3631 |
| Illustration primitives | `src/components/factory/primitives.tsx` (ThreadWordmark, ThreadLine, Crate, Conveyor, Scanner/Assembly/Record/Builder/Inspector/Packaging/Sorter stations, Founder, Operator, Buyer, SignalPulse, FeedbackPipe, BranchingThread, MemoryWeave, StampMark) |
| Composed scenes | `src/components/factory/scenes.tsx`; scroll-linked machine `src/components/factory/machine.tsx` |
| Public primitives | `src/components/public/primitives.tsx` (Section, Eyebrow, Title, Lead, Mark, PublicButton, Card, Stamp, Chip, SyntheticLabel), `nav.tsx`, `footer.tsx`, `sticky-apply.tsx` |
| Copy | `src/content/public-site.ts` |
| Pages | `src/app/(marketing)/{page,how-it-works,who-its-for,apply,calculator,playbook,playbook/[chapter]}`, `src/app/not-found.tsx`, `src/app/(auth)/*` (paper styling) |
| Metadata | per-page `metadata`, `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.svg` |

## Motion

Six animations, each with a job and a reduced-motion still: conveyor belt (flow), thread draw (lineage), stamp (gate), signal pulse (return), scroll-linked machine (order), reveal (rhythm). CSS keyframes + SVG dashoffset + IntersectionObserver + one rAF-throttled scroll listener. No animation library, no canvas. Verified: under `prefers-reduced-motion: reduce` zero animations run and every reveal is visible (`qa:public`).

## Responsive approach

Container 1200, breakpoints 640/768/1024/1280. Below 1024 the machine becomes a vertical conveyor; below 768 scenes reduce to one station; the nav keeps logo + Apply and moves links to a drawer. Automated at 20 widths (1920 → 320) in `qa:public`; screenshots at 1440/1024/768/390/320 in `qa-baselines/public/`.

## Public route map and CTA logic

`/` (story in the buyer's order) · `/how-it-works` (the machine in depth + gates) · `/who-its-for` (qualification) · `/playbook` + 10 chapters (value first, Apply at the end) · `/apply` (three-step diagnostic) · `/calculator` (footer only) · `/login`, `/forgot-password`, `/reset-password`, `/invite` (paper-styled auth). One primary action everywhere: Apply. Sticky Apply appears after the hero and hides near the closing CTA.

## Claims and placeholders

`docs/site/CLAIMS_EVIDENCE_LEDGER.md` governs every factual statement; `docs/site/PLACEHOLDERS.json` lists the open owner inputs (domain, email provider, booking URL, legal pages, canonical-script approval). No testimonials, logos, case studies or client numbers exist on the site; the proof section is a labelled synthetic chain.

## Reference analysis and forbidden-copy rules

`reference-analysis/birdhouse/` — captures at 20 widths, computed styles, geometry, motion, assets, DOM text; `site-dna/reference-design-dna.json`; `transferable-principles.md`; `forbidden-to-copy.md`; `notes/README.md` (what was and was not observable). The forbidden list is enforced by a grep in `qa:public` against rendered text. Reference images are gitignored and never served.

## Visual baselines

`qa-baselines/public/*.jpg` + `geometry.json` from `npm run qa:visual` on the production build. `npm run qa:visual:compare` reports the largest x/y/width/height deltas and document-height changes against that baseline. Reveal counts are reported (expected vs fired) so a capture with unfired reveals is not trusted.

## Known issues

- Document heights are long (12k px at 1440, 19k at 320) by design — one idea per screen; consider trimming the problem grid on mobile if bounce data says so.
- Fraunces renders slightly differently across engines at the `SOFT` axis; fallbacks are Georgia / Iowan Old Style.
- The playbook has no email capture yet (deferred until email delivery is live — a deliberate omission, not a placeholder).

## How to change the design safely

Follow `CUSTOMISATION_GUIDE.md`; change tokens in `public.css` and the DNA JSON together; keep the reduced-motion block covering any new animation; run `npm run build && npm start` then `npm run qa:public` and `npm run qa:visual:compare` before committing a visual change; re-baseline with `npm run qa:visual` only for an intentional redesign.
