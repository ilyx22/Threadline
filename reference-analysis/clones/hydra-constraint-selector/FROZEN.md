# FROZEN — hydra-constraint-selector (clone baseline)

**Reference:** workwithhydra.com, home page, section "The diagnosis" (stateful selector: pill tabs → diagram panel → symptom card + dark change card).
**Captured:** 2026-09-09, `reference-analysis/hydra/components/constraint-selector/` — 1440/1024/768/390, default + three tab-click states, 56 measured nodes at desktop, 30 at phone.
**Verified:** 2026-09-09 with `verify-clone.ts` (tolerance 4px), `verify/report.json`.

| Width | Root Δ | Nodes within 4px | Worst | Notes |
|---|---|---|---|---|
| 1440 | Δw 0 · Δh 0 | 24 / 31 | 193px | the six misses are the emphasised `em` and the four tab widths — both driven by placeholder text length, not geometry |
| 1024 | Δw 0 · Δh −14 | 12 / 31 | 148px | heading wraps differently with placeholder copy; every offset below it is that one line |
| 768 | Δw 0 · Δh 0 | 24 / 31 | 111px | as 1440 |
| 390 | Δw 0 · Δh +77 | 11 / 29 | 110px | the reference hides the diagram panel below 640px (2 nodes correctly absent); the symptom list wraps one line more with placeholder copy |

**Fidelity achieved:** container (1472 max / 40px sides → 20px), eyebrow (mono 11px, +1.65px, uppercase), heading scale `clamp(2rem, 4.2vw, 3.5rem)` at weight 750 / −0.038em / 0.99, lead 16 → 17.28px at ≥1280, tab pills (42px, 1px border, 10×20 padding, 14/700, mono index, selected = inverted), panel (12px radius, 1px border, 32px padding, SVG 1120×200 with four 222-unit stages on 262-unit centres), card grid 1.2fr / 1fr with 20px gap and 24px top margin, symptom card (28.8px title at ≥1280, 22px below, list gap 12px, × glyph), dark card (ink, butter eyebrow, 16/26 body, 48px pill CTA) — all within tolerance.

**Responsive:** tabs become a 2-column grid and the diagram is hidden below 640px; cards stack below 1024px; measured breakpoints reproduced.

**Motion:** tab colour 0.15s `cubic-bezier(0.4, 0, 0.2, 1)`; stage stroke width 0.5s and stroke colour 0.3s `cubic-bezier(0.16, 1, 0.3, 1)`; wrapper reveal 0.7s same easing. Reduced motion removes all transitions.

**Deviations (documented, accepted):** placeholder copy changes line counts; the pill `border-radius` reads `9999px` instead of the reference's `3.35544e+07px` (identical rendering); the diagram's stage art (dots, capped label) is a neutral re-drawing of the observed shapes, not their asset.

**Mutation:** `src/components/public/symptom-selector.tsx` — the four existing "problem" points become the tabs; the panel diagram is Threadline's seven-stage line; the left card shows the symptom (existing copy); the dark card shows the existing how-it-works stage copy for the station where that symptom is addressed. Palette, type (Fraunces / Inter / JetBrains Mono) and glyphs are Threadline's; geometry, states and easing are this skeleton's.
