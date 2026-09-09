# FROZEN — starborn-comparison-table (clone baseline)

**Reference:** starbornai.com, home page, section "The honest comparison" (five-column comparison with the vendor's own column highlighted).
**Captured:** 2026-09-09, `reference-analysis/starborn/components/comparison-table/` — 1440/1024/768/390, 117 measured nodes.
**Verified:** 2026-09-09 with `verify-clone.ts` (tolerance 4px), `verify/report.json`.

| Width | Root Δ | Notes |
|---|---|---|
| 1440 | Δw 0 · Δh −3 | every node is 11–16px higher than the capture, which recorded the reference mid-reveal (`opacity 0, translateY(12px)` on its two reveal wrappers); relative to the settled state the structure matches (container 1100 / 40px, intro measures 790 / 576, table margin-top 80, header row, five 73px rows, footnote) |
| 1024 | Δw 0 · Δh +4 | 38 / 56 nodes within tolerance; heading width differs with placeholder text |
| 768 | Δw 0 · Δh +60 | reference heading and lead wrap differently at this width; row geometry matches |
| 390 | Δw 0 · Δh −108 | the reference keeps the five-column grid on phones with 13 / 10.5 / 13.5px type and 12px gaps — reproduced; residual delta is heading wrap and the reference's larger row padding at this width |

**Fidelity achieved:** container and measures; 1.4fr + 4 × 1fr grid with 24px gaps; 32×4 accent pip above the own column; 15px/700 names with −0.375px tracking and 11px/+1.1px uppercase sub-labels; the non-own names at 55% ink; 15px/500 row labels at 80% ink; 24px row padding on 10%-alpha hairlines; own-column cells tinted; check / cross / italic "sometimes" vocabulary; 12.5px footnote at 50% ink; 54.4px/600 heading with −0.04em tracking and an italic serif emphasis.

**Deviations (documented, accepted):** placeholder copy; oklch/oklab colours transcribed as observed (the mutation uses Threadline's palette); reveal transition not reproduced (the clone renders the settled state).

**Mutation:** `src/components/public/comparison.tsx` — Threadline / Ghostwriter / Content agency / In-house, thirteen capability dimensions from the brief, honest wording ("typically", "depends", "built in", "core to Threadline"), no prices, no time-to-result claims. Own-column tint becomes `--accent-soft`; the pip becomes an ember rule; Fraunces / Inter replace Inter / Instrument Serif; the phone layout keeps the reference's five-column grid at small type, with the Threadline column first.
