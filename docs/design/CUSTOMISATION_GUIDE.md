# Customisation guide — public site (v2)

Every visual decision on the public site is a token, a class or a component. Change it in one place.

| To change | Edit | Notes |
|---|---|---|
| Colours (canvas, paper, ink ladder, accent, signal, stamp) | `src/app/public.css` — the `.tl-public { --canvas … }` block | Documented in `design-system/threadline-design-dna.json`. Keep one accent; drawings read the same variables |
| Type scale | `.tl-display`, `.tl-section-title`, `.tl-sub-title`, `.tl-lead`, `.tl-body`, `.tl-label`, `.tl-numeral` in `public.css` | Fonts are loaded in `src/app/layout.tsx` (Fraunces variable with opsz/SOFT/WONK, Inter, JetBrains Mono) |
| Surfaces, borders, radii | `.tl-card`, `.tl-card-quiet`, `.tl-rule*`, `.tl-ledger`, `.tl-dark` | Hairlines only; no offset shadows — that was the v1 signature and it is gone on purpose |
| Buttons | `.tl-btn`, `-primary`, `-lg`, `-sm`, `-ghost`, `.tl-textlink` | Pills; the accent fill is reserved for Apply |
| Hero panel geometry | `.tl-hero-pad`, `.tl-hero-panel`, `.tl-hero-inner`, `.tl-hero-text`, `.tl-hero-art` | Derived from the frozen clone `reference-analysis/clones/birdhouse-hero-panel`; change the Threadline classes, not the clone |
| Symptom selector | `.tl-tabs`, `.tl-tab`, `.tl-selector-*`, `.tl-detail*`, `.tl-stage*`; `src/components/public/symptom-selector.tsx` (`STAGE_FOR` maps each symptom to a stage) | Skeleton: `reference-analysis/clones/hydra-constraint-selector` |
| Period cards | `.tl-offer-*`, `.tl-diagram-box`, `.tl-fact`; `src/components/public/period-cards.tsx` | Skeleton: `reference-analysis/clones/hydra-offer-cards` |
| Drawings | `src/components/factory/schematic.tsx` | 1.5px ink strokes, accent trunk, nodes; all read CSS variables |
| Motion durations / easings | `public.css` (`.tl-draw`, `.tl-light`, `.tl-stamp-in`, `.tl-tab`, `.tl-stage`), `ReturnThread` (`animateMotion dur`) | Reduced-motion block at the bottom of `public.css` |
| Copy | `src/content/public-site.ts` | Claims ledger first (`docs/site/CLAIMS_EVIDENCE_LEDGER.md`); never a price |
| Section order | `src/app/(marketing)/page.tsx` | Owner decision; record it in `docs/site/DECISIONS_LOG.md` |
| Baselines | `npm run qa:visual` after an approved change | Keep the previous folder if the change is a redesign, as `qa-baselines/public-pre-restraint-2026-09-09/` was kept |
