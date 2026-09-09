# FROZEN — hydra-offer-cards (clone baseline)

**Reference:** workwithhydra.com, home page, section "Where to start" (three link cards, each with a sunk mini-diagram box).
**Captured:** 2026-09-09, `reference-analysis/hydra/components/offer-cards/` — 1440/1024/768/390, default + hover on the first card's link, 92 measured nodes.
**Verified:** 2026-09-09 with `verify-clone.ts` (tolerance 4px), `verify/report.json`.

| Width | Root Δ | Nodes within 4px | Worst | Notes |
|---|---|---|---|---|
| 1440 | Δw 0 · Δh 0 | 37 / 38 | 30px | the one miss is the first card's arrow x (placeholder link text is shorter) |
| 1024 | Δw 0 · Δh −22 | 12 / 38 | 30px | reference body copy wraps one line more in the narrower 3-column card |
| 768 | Δw 0 · Δh +22 | 27 / 38 | 30px | two-column layout matched; body line count differs by one |
| 390 | Δw 0 · Δh −176 | 9 / 35 | 177px | the reference swaps in a taller mobile diagram SVG (`[…/3/0]`, chips with labels beneath); the clone keeps one responsive SVG — accepted deviation |

**Fidelity achieved:** section (sunk band, 1px hairlines top/bottom, 128px padding → 96px below 640), heading block (22ch, `clamp(2rem, 4.2vw, 3.5rem)`, lead 672px), 3-column grid with 20px gap and 56px top margin, card (white, 12px radius, 1px border, 32px padding, flex column), eyebrow → 24px title → 14/22.75 body → diagram box (sunk, 8px radius, 24×20 padding, 400×76 SVG) → 10px mono fact line → 14/700 link with arrow.

**Responsive:** 3 → 2 → 1 columns at 1024 / 768; container padding 40 → 20 below 640.

**Motion:** wrapper reveal 0.7s `cubic-bezier(0.16, 1, 0.3, 1)`; arrow `transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)` on hover (4px shift assumed — the static capture shows the transition, not its end value); the card itself declares a transform transition but no visible hover displacement was observed.

**Deviations (documented, accepted):** neutral placeholder copy; single responsive diagram instead of the reference's desktop/mobile pair; diagram art re-drawn from the observed shapes.

**Mutation:** `src/components/public/period-cards.tsx` — Threadline's four service-period cards (existing copy) with a 12-week timeline in the diagram box and the service-period fact line; no links (the cards are not destinations). Four columns at ≥1280, two at ≥768, one below.
