# Threadline public experience — handover (v3.1, 11 September 2026)

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

## 7. The Birdhouse-derived reference build (11 September 2026) — what was retained, replaced and left out

A standalone Next.js reconstruction of thebirdhouse.co (`thebirdhouse/`, 826 MB, its own `.git`, `node_modules`, `.next`, Lottie/Rive artwork, 17 videos, over a thousand PNGs, an imported third-party "LinkedIn Playbook" route) was copied into this repository root on 11 September as the design reference for the overhaul.

| | Decision |
|---|---|
| **Retained** | The folder stays on disk, untouched, for the owner's reference. Its analysis notes (`thebirdhouse/reference-analysis/*.md`, `HANDOVER.md`) were read for principles only: viewport-sized reveals that reverse on exit, one focal picture per section, momentum and hover polish. Nothing from it is imported, built or served. |
| **Replaced** | Every composition principle it demonstrates is already expressed in Threadline's own object language (design system v3): the hero panel came from a measured clone in the afternoon pass, the rest of the homepage is original (`CAPTIVATION_PASS_2026-09-09.md`). |
| **Left out, deliberately** | Its logo, birds, houses, illustrations, videos, testimonials, customer logos, wording, colour identity and the imported playbook (third-party copy: "viral", "$3M+ in DM revenue"). None of it may ship (`reference-analysis/*/forbidden-to-copy.md`; `npm run qa:public` greps every reference brand name). |
| **Repository hygiene** | `thebirdhouse/` is listed in `.gitignore` (never committed: copied media, third-party content, nested `.git`) and in `tsconfig.json` `exclude` (its files were breaking the root typecheck and build). Both are reversible one-line entries. |

**Original Threadline work** on the public surface: everything under `src/components/public/`, `src/components/factory/`, `src/app/public.css`, `src/app/public-v3.css`, `src/content/public-site.ts` and `src/app/(marketing)/**`. The only reference-derived skeletons are the four frozen clones under `reference-analysis/clones/` (Birdhouse hero panel, Hydra selector, Hydra offer cards — retired, Starborn comparison table), each measured, verified and stripped of identity before mutation (`COMPONENT_RECONSTRUCTION.md`).

## 8. Client portal and admin adaptation (11 September 2026)

The authenticated product keeps its own dark, calm, dense system (DEC-004: one brand, three intensities). Applied from the public system, conservatively and in one place each:

- **Editorial serif for page and section titles** — the `text-hero` and `text-section` utilities in `src/app/globals.css` now use Fraunces (weight 450, opsz 72) so every portal and admin title reads as the same brand; body, tables, forms, metrics and labels stay Inter / mono.
- **Subtle depth on cards** — `src/components/ui/card.tsx` adds the existing `shadow-sm` token (low-contrast, no colour).
- Unchanged by design: the champagne accent (contrast-verified on dark surfaces; the public ember does not pass on ink at small sizes), radii, chips, status language, focus rings, tables, queues and forms. Marketing layouts are not pasted into the portal or admin.

Verified by `npm run qa:browser` (33 app/admin routes × 4 widths) after the change; see `docs/QA_REPORT.md`.

## 9. Known limitations and integration risks

- The reference build is inside the repository root; if it is ever removed from `.gitignore` or `tsconfig.json`'s `exclude`, the build breaks and third-party content would be staged. Move it outside the repo when convenient.
- The hero machine's entrance objects appear over ~7 s; full-page screenshot tools that capture at load show the scene mid-entrance (documented; use `probe --wait=8000`).
- The public application form is rate limited to five submissions per hour per IP in a memory store; repeated QA runs within an hour need a `next start` restart.
- The playbook is Threadline's own ten chapters (the Founder Authority System) and is finished; no LinkedIn-specific or third-party playbook was imported. Platform-safety doctrine (DEC-018) applies to every chapter.
- Remaining manual visual QA: the owner's own read of the homepage against the FINAL USER TEST (`CAPTIVATION_PASS_2026-09-09.md` §13), the portal titles in Fraunces on a real screen, and the open decisions in that document's §10.

## 10. External gates and owner inputs

`docs/site/PLACEHOLDERS.json`: production domain, email provider, booking URL, legal pages. Platform credentials and reviews: `docs/PLATFORM_APPLICATIONS.md`. Open design decisions: `CAPTIVATION_PASS_2026-09-09.md` §10.
