# Customisation guide — public site

Where to change things without hunting through components.

| To change | Edit | Notes |
|---|---|---|
| Colours (canvas, paper, ink, accent, signal, stamp) | `src/app/public.css` — the `.tl-public { --canvas … }` block | Values are documented in `design-system/threadline-design-dna.json`; keep both in step. Shared UI primitives pick the change up automatically because the block remaps `--color-*`. |
| Fonts | `src/app/layout.tsx` (`Fraunces`, `Inter`, `JetBrains_Mono` via `next/font/google`) | Swap the family and the `--font-display` / `--font-label` variables keep working. Give every family a real fallback. |
| Type scale | `.tl-display`, `.tl-section-title`, `.tl-sub-title`, `.tl-lead`, `.tl-body`, `.tl-label` in `public.css` | `clamp()` values are the responsive scale. |
| Spacing and rhythm | `.tl-section`, `.tl-container` in `public.css` | Section padding is one clamp; container max-width 1200. |
| Radii, borders, shadows | `.tl-card`, `.tl-btn`, `.tl-chip`, `.tl-stamp` in `public.css` | Hard offset shadow is the signature; do not add soft shadows on the public site. |
| Illustration stroke, fills, cast | `src/components/factory/primitives.tsx` | All parts read CSS variables; a palette change recolours them. Add new stations by copying `Chassis`. |
| Motion durations / easings | `public.css` keyframes (`tl-belt`, `tl-stamp-in`, `tl-pulse-travel`, `tl-blink`, `tl-bob`, `.tl-draw`) | Reduced-motion block at the bottom must cover any new animation. |
| Homepage section order / visibility | `src/app/(marketing)/page.tsx` | Sections are independent; remove or reorder the `<Section>` blocks. |
| Copy | `src/content/public-site.ts` | One file. Every factual line has a `claim:` reference — update `docs/site/CLAIMS_EVIDENCE_LEDGER.md` when a claim changes. |
| Navigation | `NAV` and `FOOTER` in `src/content/public-site.ts` | Header and footer read the same arrays. |
| CTA labels / destinations | `SITE.primaryCta` / `SITE.secondaryCta` in `public-site.ts` | The sticky bar (`components/public/sticky-apply.tsx`) always points at `/apply`. |
| Playbook chapters | `PLAYBOOK.chapters` in `public-site.ts` | Add a chapter: slug, title, summary, scene (see `ChapterArt`), keyIdea, reveal, practice. The sitemap and index update automatically. |
| Metadata / OG | `src/app/layout.tsx` (defaults), per-page `metadata`, `src/app/opengraph-image.tsx`, `src/app/icon.svg` | Set `NEXT_PUBLIC_APP_URL` for absolute URLs. |
| Application questions | `src/lib/domain/application.ts` + `src/lib/actions/application.ts` + `src/app/(marketing)/apply/application-form.tsx` | Schema, form and admin review share the domain definition. |
| Visual baseline | `npm run qa:visual` after an intentional redesign | Commit `qa-baselines/public/*.jpg` and `geometry.json` as the new target. |
