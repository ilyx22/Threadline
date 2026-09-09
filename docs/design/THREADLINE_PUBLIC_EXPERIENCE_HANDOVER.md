# Threadline public experience — handover (v2, 9 September 2026)

What the public site is, where everything lives, and how to work on it without breaking the product behind it. Read with `THREADLINE_PUBLIC_DESIGN_SYSTEM.md` (the system), `COMPONENT_RECONSTRUCTION.md` (how the three reference-derived components were made) and `PUBLIC_SITE_RESTRAINT_PASS_2026-09-09.md` (what changed in this pass and what did not).

## 1. Concept

**The Threadline Authority Factory**, drawn as a system: raw expertise enters as a spool, travels a line of stations, leaves as packages, and the market's answer comes back along the thread. The site's job is to make a founder understand the mechanism (research → decisions → production → distribution → response → learning), the division of labour (you talk, record, approve, sell), what is and is not promised, and to apply.

- Original drawing set in `src/components/factory/schematic.tsx`; two figures (Founder, Buyer) from `primitives.tsx` as the 10% of character.
- Editorial first: Fraunces display on linen and paper, hairlines instead of outlines, one accent per section.
- No reference brand material anywhere (`reference-analysis/*/forbidden-to-copy.md`; `npm run qa:public` greps for it).

## 2. Where things live

| Thing | Location |
|---|---|
| Every public word | `src/content/public-site.ts` |
| Tokens, surfaces, components, motion | `src/app/public.css` (scoped `.tl-public`) |
| Public primitives | `src/components/public/primitives.tsx` (Section, Eyebrow, Title, Lead, Mark, PublicButton, TextLink, Card, Stamp, Chip, SyntheticLabel, LedgerRow) |
| Reference-derived components | `src/components/public/{hero-panel,symptom-selector,period-cards}.tsx` |
| Nav / footer / sticky Apply | `src/components/public/{nav,footer,sticky-apply}.tsx` |
| Machine (scroll-lit line) | `src/components/factory/machine.tsx` |
| Scenes | `src/components/factory/scenes.tsx` |
| Pages | `src/app/(marketing)/{page,how-it-works,who-its-for,apply,calculator,playbook}` + `src/app/not-found.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.svg` |
| Auth pages (inherit the system) | `src/app/(auth)/*` |
| Design DNA | `design-system/threadline-design-dna.json` |
| Claims, brand truth, decisions, placeholders, memory | `docs/site/*` |
| Reference analysis (clean-room) | `reference-analysis/{birdhouse,hydra}/`, tools in `reference-analysis/tools/`, frozen clones in `reference-analysis/clones/` |
| Visual baselines | `qa-baselines/public/` (current), `qa-baselines/public-pre-restraint-2026-09-09/` (the v1 site, kept as history) |

## 3. Motion

Each animation has one job and a reduced-motion still: thread draw (lineage), return pulse (learning; SVG `animateMotion` so it scales), node breathe (attention), stamp-in (gate), selector transitions (state), one quiet reveal per block. No animation library.

## 4. Responsive

Container 1200; hero panel full-bleed inside 30px margins. Breakpoints 640 / 768 / 992 / 1024 / 1280. Verified at 20 widths (1920 → 320) by `npm run qa:public`: no horizontal overflow, one H1, skip link, 44px targets, metadata, reduced-motion honoured, no brand leak, no placeholder, no "monthly", no overclaim, **no price disclosure**.

## 5. QA commands

```bash
npm run build && npm start        # production server (never QA the dev server)
npm run qa:public                 # 11 routes × 20 widths + greps + application submit
npm run qa:browser                # app/admin routes × 4 widths, a11y, runtime errors
npm run qa:visual                 # rewrite qa-baselines/public/*
npm run qa:visual:compare         # geometry deltas against the baseline
node scripts/qa/run.cjs shoot --out=<dir>   # full-page screenshots for inspection
```

Reference tooling: `reference-analysis/tools/capture-component.ts` (capture + measure a component with states), `summarise-measure.py` (read a measure file), `verify-clone.ts` (clone vs reference report).

## 6. Rules that keep the site honest

- No client results, logos, testimonials, figures or case studies until a client agrees (claims ledger; proof permissions in the product).
- Synthetic demonstrations are labelled as such on the page.
- Exact service pricing is never public (DEC-017). Internal commercial terms are unchanged.
- Never "monthly"; cadence is 4-week service periods.
- No promise of leads, revenue, followers, views, virality, algorithmic favour or ROI. Do not lead with AI.
- Content, sections and section order change only with the owner's decision; presentation may.

## 7. External gates and owner inputs

`docs/site/PLACEHOLDERS.json`: production domain, email provider, booking URL, legal pages. Platform credentials and reviews: `docs/PLATFORM_APPLICATIONS.md`.
