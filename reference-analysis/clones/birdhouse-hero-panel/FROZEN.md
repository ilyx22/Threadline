# FROZEN — birdhouse-hero-panel (clone baseline)

**Reference:** thebirdhouse.co, hero section (white rounded panel on a tinted canvas; statement column left; illustration cluster right overlapping the panel's lower edge).
**Captured:** 2026-09-09, `reference-analysis/birdhouse/components/hero-panel/` — 1440/1024/768/390, default + hover on the CTA, 30 measured nodes at desktop, 23 at tablet/phone.
**Verified:** 2026-09-09 with `verify-clone.ts` (tolerance 4px), `verify/report.json`.

| Width | Root Δ | Nodes within 4px | Worst | Notes |
|---|---|---|---|---|
| 1440 | Δw 0 · Δh 0 | 4 / 14 | 21px | every text node is 21px higher than the capture, which recorded the reference mid-reveal (`translateY(20.56px)`, opacity 0.31); the settled position is the container top — the clone is at the settled position |
| 1024 | Δw 0 · Δh 0 | 4 / 14 | 19px | same artefact (`translateY(19px)` at this width) |
| 768 | Δw 0 · Δh −204 | 1 / 13 | 204px | the reference's tablet illustration is a separate mobile video node not present in the desktop tree (unmatched); its height is not measurable from the capture — clone uses 560px |
| 390 | Δw 0 · Δh −57 | 0 / 13 | 67px | h1 line count differs (the reference headline contains inline icon chips); illustration node unmatched as above |

**Fidelity achieved:** section padding 80 / 30 / 24 (10px sides on phone), white wrapper (60px radius → 30 on phone, 64px top padding → 22 on phone/tablet, 1500 max), 1280 container with 20px sides, 500px statement column with 32px gaps (20 on phone), eyebrow 26px italic serif (14 on phone), h1 90/99 → 64/70.4 → 48/52.8, lead 20/24 → 14/16.8, pill CTA 60px tall / 60px radius / 40px sides (30 on phone), illustration footprint 85% of the wrapper width bottom-right at desktop, stacked beneath the text from 991px down.

**Motion:** CTA `all 0.3s ease` on hover; the reference reveals the text column with a 20px rise (observed in the capture); the clone renders the settled state.

**Deviations (documented, accepted):** neutral grey cluster instead of the character illustration and video background; placeholder copy; tablet illustration height estimated.

**Mutation:** `src/components/public/hero-panel.tsx` — Threadline's existing hero copy (eyebrow, two-line H1 with the marker highlight, lead, the four-verb line, two CTAs, the note) inside one paper panel; the illustration slot holds Threadline's schematic line with the founder at its start. Panel radius, padding, statement width, stacking breakpoints and CTA geometry are this skeleton's; type, colour, and art are Threadline's.
