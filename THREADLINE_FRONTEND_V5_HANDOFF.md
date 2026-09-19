# THREADLINE — frontend v5 handoff (19 September 2026)

The public site was rebuilt as an illustrated Threadline world: an editorial authority workshop connected by one continuous thread. Branch `frontend/visual-rebuild-v5`; checkpoint before the work: tag `threadline-pre-v5-rebuild-2026-09-19`. Decision record DEC-026 in `docs/site/DECISIONS_LOG.md`.

Companion documents: `docs/design/V5_CURRENT_FAILURE_AUDIT.md`, `V5_REFERENCE_SKELETON.md`, `V5_THREADLINE_VISUAL_SYSTEM.md`, `V5_COMPONENT_MAP.md`, `V5_MOTION_SYSTEM.md`, `V5_VISUAL_QA_REPORT.md`; captures in `docs/design/v5/`.

## Files

**Added**

- `src/components/marketing-v5/art/kit.tsx` — the illustration kit (people, artefacts, props, the thread, plates, grain).
- `src/components/marketing-v5/art/{HeroArt,ProblemArt,MemoryArt,BurdenArt,WorkshopArt,ExpressionsArt,MovementArt,SmallArt,HeroExplorations}.tsx` — the scenes; `HeroArt` doubles as the closing (`evolved`).
- `src/components/marketing-v5/{Sections,Nav,Footer,Motion,WorkshopStage,Bench,Expressions}.tsx`.
- `src/content/marketing-v5.ts` — every homepage sentence.
- `src/styles/marketing-v5/{index,tokens,art,page,motion,inner}.css`.
- `src/app/(marketing)/design-lab/page.tsx` — internal, `notFound()` in production, disallowed in `robots.ts`.
- `scripts/qa/marketing-v5.ts` (+ `npm run qa:marketing`).
- `docs/design/V5_*.md`, `docs/design/v5/`.

**Changed**

- `src/app/(marketing)/layout.tsx` and `page.tsx` — the v5 composition; `public.css` and `public-v3.css` still load for the inner pages.
- `src/app/public.css` — the `.tl-public` palette retokened to the v5 world (ink-navy, parchment, sky, marigold), so How it works, Who it is for, Playbook, Apply and the calculator take the palette without a rewrite.
- `src/app/(marketing)/playbook/page.tsx` — imports the calculator from its new home.
- `src/app/robots.ts` — disallows `/design-lab`.
- `package.json` — `qa:marketing`.
- `qa-baselines/public/*` — re-taken on the v5 build after the critique passes.

**Removed (obsolete)**

- `src/components/marketing-v4/*` except `AcquisitionCalculator.tsx`, which moved to `src/components/marketing-v5/`.
- `src/content/marketing-site.ts`, `src/content/marketing-tokens.ts`.
- `src/styles/marketing/marketing.css`, `src/styles/marketing/marketing-extra.css` (the generated v4 port and its additions).

`public-v3.css` and the `src/components/public/*` and `src/components/factory/*` families remain: the inner pages use them. Nothing under `src/app/app`, `src/app/admin`, `src/lib`, `prisma` or the server actions changed.

## Responsive decisions

- Every panoramic scene has a wide (1440-unit) and a tall (400-unit) composition; CSS shows one per breakpoint at 760px. The tall compositions are re-drawn, not scaled: the hero stacks archive → press → line; the vault crops to its densest part with the outside below; the frieze and the street become vertical strips on a vertical thread.
- The workshop: sticky stage with six scroll sentinels above 900px; below it, the camera pans along the bench one station at a time, driven by the same buttons.
- The expressions: the arc above 900px; a vertical list with each artefact drawn beside its label below.
- The loom is a diagram the visitor can pan sideways below 760px (the only intentional horizontal scroller, inside its own container).
- The comparison abacus turns its column headings vertical below 600px.
- Nav links move into a drawer below 900px; every control is at least 44px.

## Motion dependencies

None added. CSS keyframes and transitions plus one `IntersectionObserver` component (`Motion.tsx`) and one for the workshop sentinels. No animation library; no raster assets; no video.

## Accessibility behaviour

Every scene SVG is `role="img"` with a full description. The bench and workshop are keyboard-operable (tablist with arrow keys; the stage responds to arrow keys and has focusable dots); the expressions respond to hover, focus and press; the drawer closes on Escape. Focus rings are 3px marigold. Reduced motion removes every animation and transition and leaves each scene in its authored final state. Nothing is hidden before it enters the viewport; the page reads with JavaScript off.

## Asset provenance

All artwork is authored in code in this repository (`src/components/marketing-v5/art/`), by hand, for Threadline. No SVG paths, characters, motifs, copy, logos or assets from any reference site were used. Fonts are the existing Google Fonts loaded through `next/font` (Fraunces, Inter, JetBrains Mono).

## Portal and admin

The product surfaces keep their own dark palette and were not touched. What can transfer later: the `--v5-*` tokens as accent and state colours (marigold for signal/action, mint/coral for pass/fail states, sky/lilac for environment fields), the Fraunces axis settings for headings, the artefact silhouettes as icons for content kinds, and the 44px control rule. What must not transfer: the marketing layouts, the panoramas, the grain.

## Tests run and results

TESTS_TABLE

## Remaining limitations

- No git remote is configured on this machine for a push from the session; the branch is local until pushed (see `HANDOFF.md` §20 for the commands).
- Vercel builds `main`; this work is on `frontend/visual-rebuild-v5` and needs a merge to deploy.
- The site still has no privacy notice route (PH-LEGAL) and no `DATABASE_URL` in production (the application form persists only where a database is configured).
- The bench and loom are dense at 320px; readable, not generous.
