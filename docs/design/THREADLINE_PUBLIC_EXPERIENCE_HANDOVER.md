# Threadline public experience — handover (v3, 9 September 2026)

What the public site is, where everything lives, and how to work on it without breaking the product behind it. Read with `THREADLINE_PUBLIC_DESIGN_SYSTEM.md` (the system, v3), `COMPONENT_RECONSTRUCTION.md` (how the reference-derived components were made), `CAPTIVATION_PASS_2026-09-09.md` (what changed in the evening pass, the content preservation matrix, the pricing audit, the QA record and the open owner decisions) and `PUBLIC_SITE_RESTRAINT_PASS_2026-09-09.md` (the afternoon pass).

## 1. Concept

**The Threadline Authority Factory**, drawn as tangible objects: expertise goes in as a token, becomes a root thesis, becomes native content that looks different on each platform, draws buyer responses, and the reading of expected against actual feeds the next cycle. The homepage tells it outside-in: the commercial problem, the desired outcome (familiar, not famous), the founder's small part (talk, record, approve, sell), the seven-station factory, one idea → the right expressions, attention → commercial movement, the learning loop, the 12-week progression, the honest comparison, fit, the ask. Threadline is a managed authority + qualified-demand system; the platform is a component, not the category.

- Object primitives in `src/components/factory/objects.tsx`; the v2 schematic set (`schematic.tsx`) stays on How it works and in the playbook.
- Editorial first: Fraunces on linen and paper, hairlines, one accent per section, objects with a soft 3px edge and ambient depth. No glass, glow, dark SaaS, cartoon cast or thin-line diagrams on the homepage.
- No reference brand material anywhere (`reference-analysis/*/forbidden-to-copy.md`; `npm run qa:public` greps for the ten reference names).

## 2. Where things live

| Thing | Location |
|---|---|
| Every public word | `src/content/public-site.ts` — `HOME_V3` (homepage), `DIAGNOSTIC` (How it works diagnostic), `HOME` (the approved sentences the new keys reuse), `HOW_IT_WORKS`, `STATIONS`, `WHO_ITS_FOR`, `APPLY`, `PLAYBOOK`, `FOOTER`, `SITE` |
| Tokens, surfaces, objects | `src/app/public.css` (scoped `.tl-public`; the Objects block at the end) |
| Section systems, reduced motion | `src/app/public-v3.css` (imported by `src/app/(marketing)/layout.tsx`) |
| Public primitives | `src/components/public/primitives.tsx` |
| Object primitives | `src/components/factory/objects.tsx` |
| Homepage sections | `src/components/public/{hero-panel,hero-machine,problem-contrast,buyer-pool,labour-split,factory,expressions,route-board,learning-loop,progression,comparison,final-cta}.tsx` |
| How it works diagnostic | `src/components/public/diagnostic.tsx` |
| Retained from v2 | `symptom-selector.tsx`, `period-cards.tsx` (unused), `src/components/factory/{machine,scenes,schematic,primitives}.tsx` |
| Nav / footer / sticky Apply | `src/components/public/{nav,footer,sticky-apply}.tsx` |
| Pages | `src/app/(marketing)/{page,how-it-works,who-its-for,apply,calculator,playbook}` + `src/app/not-found.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.svg` |
| Auth pages (inherit the system) | `src/app/(auth)/*` |
| Design DNA | `design-system/threadline-design-dna.json` (3.0.0) |
| Claims, brand truth, decisions, placeholders, memory | `docs/site/*` (DEC-023 records this pass) |
| Reference analysis (clean-room) | `reference-analysis/{birdhouse,hydra,starborn,leverbrands,invisiblekeyboard,windmill,demandii,influent,novaimpact,understory}/`, tools in `reference-analysis/tools/`, frozen clones in `reference-analysis/clones/` |
| Visual baselines | `qa-baselines/public/` (current), `qa-baselines/public-pre-captivation-2026-09-09/` (the v2 site), `qa-baselines/public-pre-restraint-2026-09-09/` (the v1 site) |

## 3. Motion

Each animation has one job and a reduced-motion still (design system §8): hero objects enter once; the factory's idea card follows scroll on one rAF-throttled listener; MULTIPLY; the learning-loop tablist; the progression's scroll variable; one quiet reveal per block. No animation library, no parallax, no auto-carousel.

## 4. Responsive

Container 1200; hero panel full-bleed inside 30px margins, side by side from 1200. Breakpoints 640 / 768 / 992 / 1024 / 1200 / 1280 / 1440. Verified at 20 widths (1920 → 320) by `npm run qa:public`: no horizontal overflow, one H1, skip link, 44px targets, metadata, reduced motion honoured, no brand leak, no placeholder, no "monthly", no overclaim, **no price disclosure**. Phones: every scene becomes a vertical flow; the factory is an accordion; the comparison keeps five columns at small type with Threadline first; no hover-only information anywhere.

## 5. QA commands

```bash
npm run build && npm start        # production server (never QA the dev server; stop next start before building)
npm run qa:public                 # 11 routes × 20 widths + greps + application submit
npm run qa:browser                # app/admin routes × 4 widths, a11y, runtime errors
npm run qa:visual                 # rewrite qa-baselines/public/*
npm run qa:visual:compare         # geometry deltas against the baseline
node scripts/qa/run.cjs shoot --out=<dir> --widths=1440,390 --routes=/,/how-it-works   # full-page screenshots
node scripts/qa/run.cjs probe --url=/ --width=1280 --wait=8000 --expr=1 --shot=<file>  # a viewport shot after the hero settles
node scripts/qa/run.cjs probe --url=/ --width=390 --file=<expr.js> --after=700 --shot=<file>  # evaluate (e.g. scroll) then shoot
```

In Git Bash prefix `MSYS_NO_PATHCONV=1` so `--url=/` is not rewritten. Reference tooling: `reference-analysis/tools/capture-reference.ts` (`--widths=`, `--port=`), `capture-component.ts` (capture + measure a component with states), `summarise-measure.py`, `verify-clone.ts`.

## 6. Rules that keep the site honest

- No client results, logos, testimonials, figures or case studies until a client agrees (claims ledger; proof permissions in the product).
- Every synthetic thesis, score, number and asset is labelled illustrative on the page.
- Exact service pricing is never public (DEC-017); no tier, package or "starting from". Internal commercial terms are unchanged.
- The comparison table uses capability wording only, never a measured comparison.
- Never "monthly"; cadence is 4-week service periods. No exact founder-time promise.
- No promise of leads, revenue, followers, views, virality, algorithmic favour or ROI. Do not lead with AI. No platform in a headline.
- Content changes only with the owner's decision; presentation and order changed in this pass by owner instruction (DEC-023).

## 7. External gates and owner inputs

`docs/site/PLACEHOLDERS.json`: production domain, email provider, booking URL, legal pages. Platform credentials and reviews: `docs/PLATFORM_APPLICATIONS.md`. Open design decisions: `CAPTIVATION_PASS_2026-09-09.md` §10.
