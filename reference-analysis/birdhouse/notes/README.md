# Birdhouse reference — analysis notes

**What was inspected live (9 Sep 2026):** `https://thebirdhouse.co/`, `https://www.thebirdhouse.email/`, `https://www.thebirdhouse.email/x-playbook` with headless Chrome over CDP at 20 widths (1920 → 320). Raw observations live in the sibling folders; `verify/capture-2026-09-09.json` records final URLs, titles, scroll heights and frame counts per capture.

**What was not inspected:** the playbook body (email-gated), authenticated areas, source maps, private repositories. The founder's supplied recording/PDF/notes were **not present in the repository** at the start of this pass (`Threadline Final Working Resources/` contains no Birdhouse material), so the playbook UX below is recorded as *reported by the founder in the brief*, not measured:

> one major concept at a time · oversized headings · short explanatory text · physical analogy · diagram/cartoon · interactive reveal · card flipping · sequential progression · reader momentum · visual variation · embedded persuasion · CTA transition at the end.

Threadline's `/playbook` translates those *principles* into its own chapters and mechanics. Nothing from the Birdhouse playbook's content was available to copy, and nothing was.

## Reading of the specimen (measured)

1. **One canvas, paper on top.** Sky-blue canvas (#DEF3FF), white 40px-radius cards, no rules, no shadows. Illustrated grass/cloud edges do the sectioning.
2. **Editorial serif vs plain sans.** Instrument Serif 90/99 (h1), 64/70 (h2), regular weight; Roboto 20/24 lead, 16/19 body, navy at 50–66% alpha for secondary text.
3. **Character-led proof.** Mascots beside numbers; a cluster of 12 in the hero. Characters are decorative on the agency site and instructional on the newsletter (one physical scene per post).
4. **Motion is light.** Two same-origin keyframes (marquee, loader), 0.3s hover eases, Swiper carousels. The pages work with motion off.
5. **Small nav, one action.** Four links + APPLY pill; at 390 only logo + APPLY remain. Header is not sticky.
6. **Direct-sale funnel with social proof first**, plus a value-first newsletter/playbook on a second domain.
7. **Responsive scale:** h1 90 → 64 → 48px; hero stacks at 390; document 8.2k px (1440) / 9.1k px (390) / 14.1k px (768 — the tablet width is the least tidy).

## What Threadline takes and what it refuses

See `../transferable-principles.md` and `../forbidden-to-copy.md`. In one line: take *warm single canvas, editorial type contrast, physical metaphor, character-led explanation, light purposeful motion, small nav, value-first resource*; refuse *every asset, colour, character, framework, claim, sentence and geometry*.
