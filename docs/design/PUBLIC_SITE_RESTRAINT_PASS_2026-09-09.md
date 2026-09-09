# Public site — the restraint pass (9 September 2026)

The record of what this pass changed on the public site, what it deliberately did not, and what it proposes for the owner's decision. Verification numbers are in `docs/QA_REPORT.md` and `HANDOFF.md` §20.

## 1. Content preservation report

**Before — home page sections (v1, morning of 9 Sept):** Hero · The problem · The division of labour · The machine · Where most stop · One idea, many expressions · Market memory · Commercial attention · How the system learns · The first 12 weeks · Product proof · Fit · Apply CTA · Footer.

**After — home page sections (v2):** Hero · The problem · The division of labour · The machine · Where most stop · One idea, many expressions · Market memory · Commercial attention · How the system learns · The first 12 weeks · Product proof · Fit · Apply CTA · Footer.

| | |
|---|---|
| REMOVED | **NONE**, except the exact price line in the footer and the three price chips on the how-it-works CTA (owner decision, §2). |
| ADDED | Presentation wrappers only: the symptom selector around the four existing problem points (interaction labels "Symptom 01 of 04", "Where the line fixes it", "↑ addressed here", "See how the line works"); the period-card fact line ("Weeks 1–4 · one 4-week service period"); the "Published / most stop here" labels on the return thread; anchor ids on the how-it-works stages. No new narrative section. |
| REORDERED | **NONE.** |
| MERGED | **NONE.** |
| MAJOR COPY CHANGES | **NONE.** Every sentence in `src/content/public-site.ts` is unchanged except the footer's `FOOTER.small` (price removed; now states the 12-week initial engagement, 4-week service periods, and that commercial terms are discussed during the qualified sales process). |
| PUBLIC PRICING REMOVED | Footer small print (all pages); how-it-works CTA chips "£2,500 implementation" / "£2,500 every 4 weeks" (the third chip, "12-week initial engagement", was removed with them as part of the same chip row; the fact survives in the footer and on the home page). |

Other pages: How it works, Who it is for, Apply, Calculator, Playbook (index + 10 chapters), 404, auth — same sections, same order, same copy. The how-it-works stage copy is now also shown inside the home page selector's dark card (reuse, not new copy). Figures removed from the Apply and Who-it-is-for headers were decoration, not information.

## 2. Pricing visibility audit (DEC-017)

Public surfaces audited for "£2,500", "£5,000", "£10,000", "2.5k", "starting from £" and the internal package figures: home, how-it-works, who-its-for, apply (all three steps), calculator (inputs, outputs and copy — it costs the founder's own operation and never states Threadline's fee), FAQ (none exists), footer, hidden/expandable content (playbook reveals, mobile menu), metadata and Open Graph text, JSON-LD (none), sitemap/robots, public seed examples, the login/forgot/reset/invite pages, the 404 page, the OG image.

| Where price appeared | Action |
|---|---|
| `src/content/public-site.ts` `FOOTER.small` (rendered in the footer of every public page) | Replaced with a non-price statement of the engagement structure |
| `src/app/(marketing)/how-it-works/page.tsx` CTA chips | Removed |
| `docs/site/CLAIMS_EVIDENCE_LEDGER.md` C-PRICE | Marked VERIFIED (internal) · PUBLIC USE NOT PERMITTED |
| `scripts/qa/public-qa.ts` | New `PRICE` grep; any match fails the route |

Internal pricing is intact: `Organization.periodFee` and the admin client forms, `src/lib/domain/service-period.ts`, sales economics, HANDOFF §16b, the seed's illustrative client offers (a *client's* £2,500 forecast diagnostic in `prisma/seed.ts` is that client's price, not Threadline's).

Not done, by instruction: no "starting from", no approximate price, no scarcity, no urgency, no "contact us for pricing" plastered anywhere. CTAs unchanged ("Apply", "See how it works").

## 3. What changed visually

- **Typography:** display weight 500 → 450 with a lighter Fraunces SOFT axis; section title scale now `clamp(2rem, 4.2vw, 3.5rem)` (the measured reference scale); eyebrows quiet (ink-faint) by default; numerals get their own style.
- **Spacing:** hairline rules between sections instead of alternating bands (three sunk bands remain); ledgers instead of card grids for lists; 20ch/42rem/62ch measures.
- **Colour:** illustration palette reduced to ink + accent + signal; steel and stamp fills gone from drawings; one accent per section; the only dark surface is the selector's "what changes" card.
- **Borders:** 1.5px ink outlines → 1px hairlines; the 6/8/10px offset shadows → none; the 20px radius → 16 / 12 / 8 by role; buttons → pills.
- **Illustrations:** cartoon stations, crates, striped belts, the return pipe and the wavy footer thread → the schematic set (thread, nodes, spool, fork, cut, route, pulse, loop, inspection mark). Character use cut from fourteen figures on the home page to two.
- **Density:** thirty-plus outlined chips → zero on the home page (the "Threadline handles" list is a serif sentence, packages are a ledger, signals are a dotted list).
- **Cards:** every scene lost its box except the machine panel, the diagnosis record, the selector and period cards, and the Apply panel.
- **Animation:** conveyor stripes, bob and blink retired; return pulse now moves in SVG units (the v1 CSS `offset-path` pulse overflowed narrow viewports); stamp-in no longer rotates.
- **Interaction:** symptom selector (tabs, keyboard arrows, live region), hover arrows on text links, selector stroke transitions.
- **Mobile:** hero stacks to a centred column with a compact line; tabs become a 2-column grid; the machine is a vertical rail; memory-thread labels move out of the SVG into a list; period cards 1-up.

## 4. Owner decisions and proposals (not implemented)

1. **FAQ section.** Hydra's accordion FAQ is a strong client-friendly pattern (harvest #12). Threadline has no FAQ copy; adding one would be a new narrative section. Proposal: a five-question FAQ on the home page after Fit, drawn from `Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Answer_and_Objection_Vault.md`. Decision needed: yes/no and which questions.
2. **Calculator's public role.** It never reveals Threadline's price, so it was preserved unchanged. Proposal: rename the footer link "Cost of the status quo" to "What your content costs today" for clarity. Cosmetic; decision needed because it is copy.
3. **Hero H1 emphasis.** The yellow marker highlight on "the expertise." is the last v1 device on the page. It is defensible (one moment) but could be dropped for pure type. Decision needed; no change made.
4. **"Threadline handles" list.** Now a serif sentence of eleven verbs. An alternative is a two-column list. Presentation only; flagging because the owner may prefer the list reading.
5. **Reference-brand grep.** Done, not a decision: the public QA brand-leak sweep now also fails on Hydra's name and its signature phrases, alongside the Birdhouse terms.

## 5. Preserved invariants

Business copy and mechanisms; claims discipline; application flow and server action; calculator maths; sticky Apply; skip link; 44px targets; reduced-motion behaviour; the `.tl-public` scope (the authenticated product's design system is untouched); tenancy, auth and every product workflow; no client-specific forks; no new mutation surfaces.
