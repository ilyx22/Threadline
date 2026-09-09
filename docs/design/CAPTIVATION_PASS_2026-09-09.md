# Captivation, information-architecture, graphics + interaction pass — record (9 September 2026, evening)

The as-built record of the pass planned in `CAPTIVATION_PASS_PLAN_2026-09-09.md`. Baseline before: tag `threadline-public-restraint-2026-09-09`. After: tag `threadline-public-captivation-2026-09-09`. The product behind the site (`/app`, `/admin`, API, schema, jobs) was not touched.

Owner brief, in one line: the restraint-pass homepage was cleaner but still confusing, not captivating, too dependent on thin-line diagrams, repetitive in composition and explained inside-out. Success condition: a cold visitor understands the business in about thirty seconds even with motion and illustration off, and understands that Threadline is a managed authority + qualified-demand system in which the platform is a component, not the category.

## 1. What changed

- **A new homepage order** (12 sections, §2) that moves from the commercial problem to the desired outcome, the founder's small part, the system, the commercial path, the learning loop, the 12-week progression, the honest comparison, fit and the ask. The station-by-station detail, the proof ledger and the four symptom points moved to How it works.
- **An object language instead of line diagrams** (`src/components/factory/objects.tsx`, "Objects" block in `src/app/public.css`, section systems in `src/app/public-v3.css`): filled 2.5D idea chips, thesis cards, signal tokens, content tiles, response markers, score cards, chambers, modules, output tiles, buyer avatars and verdict tiles. Soft ambient depth plus a 3px bottom edge; no glass, no glow, no dark SaaS.
- **Eleven new section components** in `src/components/public/`: `hero-machine`, `problem-contrast`, `buyer-pool`, `labour-split`, `factory`, `expressions`, `route-board`, `learning-loop`, `progression`, `comparison`, `final-cta`, plus `diagnostic` for How it works.
- **One new clean-room clone** (`reference-analysis/clones/starborn-comparison-table`, verified and frozen) behind the comparison section; the frozen Birdhouse hero panel is reused with new art inside it. The Hydra selector clone's interaction shape survives as the How-it-works diagnostic, re-pointed at Threadline's own five categories.
- **Content**: every approved sentence survives (§3). New copy specified by the brief lives under new keys `HOME_V3` and `DIAGNOSTIC` in `src/content/public-site.ts`; the older `HOME` object remains the source the new keys reuse by reference, so nothing was retyped.
- **No pricing, no proof, no tiers** (§8, §9).

## 2. The homepage as built

| # | id | Section | Component | Visual | Copy source |
|---|---|---|---|---|---|
| 01 | hero | You already have the expertise. / We turn it into content people actually want to watch. | `HeroPanel` (frozen Birdhouse skeleton) + `HeroMachine` | miniature Authority Machine: expertise token → three signal chips → root thesis card → text / native video / carousel tiles → profile-visit and named-enquiry markers → "Expected vs actual" return module; objects enter once, staggered | approved hero lines; system line; low-burden line; note |
| 02 | problem | The market does not experience enough of what you know. | `ProblemContrast` | WITHOUT A SYSTEM (dashed, ink-faint chain that ends in "a shrug") beside WITH THREADLINE (filled chain that ends in "Improvement feeds the next cycle") | `HOME.problem` title + lead |
| 03 | memory | We are not trying to make you famous… | `BuyerPool` | a 3×3 pool of buyer avatars with two piece cards laid over it; the same buyer at five encounters (Stranger → Conversation) as a filled ladder | `HOME.memory` title, lead, stages, note |
| 04 | labour | The part we need from you is the part nobody else can fake. | `LabourSplit` | four ember founder tiles (Talk / Record / Approve / Sell with the brief's sub-lines) beside a Threadline module board of thirteen jobs; the Founder figure is the one character on the page | "You talk. You record. You approve. You sell…"; relief line |
| 05 | factory-section | Your expertise goes in. A commercial authority system comes out. | `Factory` | seven chambers on one rail; an idea card travels the track with scroll; the chamber it is in lifts and explains itself in plain words; founder badges only on Input / Record / Approve / Sell; any chamber can be pressed and held | new station copy (brief), loop line |
| 06 | expressions | One idea. The right expressions. | `Expressions` | root thesis card (illustrative, labelled) that MULTIPLIES into five native tiles that look different from each other; "Back to one idea" | approved headline; `HOME.branching.lead`; illustrative thesis from the brief; caveat |
| 07 | route | Reach is not the result. | `RouteBoard` | nine filled, numbered steps from Content to Learning (the last three toned ember / stamp / signal); the quote; SLOP vs QUALIFIED cards with explicit readings; illustrative label | `HOME.attention`; "Threadline optimises for commercially valuable attention, not just reach." |
| 08 | learning | Written down before, read against after. | `LearningLoop` | EXPECTED → ACTUAL → WHY → CHANGE → RETEST as a keyboard-operable tab rail beside one asset card; Expected shows a labelled rubric score (82 / 100, illustrative) | `HOME.learns`; new state copy (brief) |
| 09 | twelve-weeks | Three service periods. Real market evidence, not a promise about algorithms. | `Progression` | one continuous band with period stops; hypothesis dots fade and validated patterns thicken with scroll; periods listed beneath as hairline rows, not cards | `HOME.twelveWeeks`; the 90-days line |
| 10 | comparison | You could just hire a ghostwriter. | `Comparison` (Starborn skeleton) | Threadline / Ghostwriter / Content agency / In-house across thirteen capability rows; Threadline column tinted; "core", "built in", "when useful", "first class" vs "typically", "sometimes", "rarely", "depends", "no" | new (brief); note on wording |
| 11 | fit | Built for a specific kind of business. | `VerdictTile` lists | filled check / cross tiles | `HOME.fit` |
| 12 | apply-cta | You already have the expertise. Let's build the system around it. | `FinalCta` | paper panel: the ask, then "Your expertise GOES IN" and four output tiles (Authority, Familiarity, Qualified demand, Learning) | brief's closing line; `HOME.cta.lead` |

How it works gained, in order: the diagnostic (POSITION / CREATE / DISTRIBUTE / CONVERT / LEARN — pick the description that sounds most like you; the panel lights the matching factory chamber and shows the matching symptom and the "what Threadline changes here" card), then the existing stage cards, then "Nine stations. One job each." (the scroll-lit machine line), the gates, the product proof chain (`id="proof"`, still labelled synthetic) and the CTA.

## 3. Content preservation matrix (as built)

| Existing information | Was | Now | Treatment |
|---|---|---|---|
| Hero eyebrow / title / lead / sub / note / both CTAs | Home hero | Home 01 | preserved; the second approved line is now a sub-display line under the H1 instead of a marker highlight |
| Problem title + lead | Home §2 | Home 02 | preserved verbatim |
| Four symptom points | Home §2 selector | How it works diagnostic (symptom list, one per category) | preserved, demoted |
| Division of labour: four verbs, eleven-plus machine jobs, relief line | Home §3 | Home 04 | preserved; brief's sub-lines under the verbs; Threadline board lists thirteen jobs |
| Nine stations + details | Home §4 + How it works | How it works "Nine stations. One job each." | preserved; the home factory shows seven chambers |
| Return path five steps | Home §5 | Home 08 (RETEST) + How it works | preserved, merged |
| Branching lead and packages | Home §6 | Home 06 | preserved; approved "One idea. The right expressions." headline |
| Memory title / lead / five stages / note | Home §7 | Home 03 | preserved verbatim |
| Attention title / lead / two scenes / illustrative numbers | Home §8 | Home 07 | preserved; readings added; label kept |
| Learns title / lead / disclaimer | Home §9 | Home 08 | preserved; the ledger card became the five-state loop |
| Twelve-weeks title / lead / four periods / note | Home §10 | Home 09 | preserved; rendered as one progression, not cards |
| Proof title / chain / synthetic label | Home §11 | How it works `#proof` | preserved, demoted |
| Fit title / good / bad | Home §12 | Home 11 | preserved verbatim |
| CTA lead | Home §13 | Home 12 | preserved; brief's closing line as the title |
| Stage cards, gates, machine | How it works | How it works | preserved |
| Who it is for, playbook, calculator, apply, auth, footer | — | — | untouched (footer already price-free) |

Nothing was deleted from the experience.

## 4. Graphics: what replaced what

| Retired (line-heavy) | Replacement |
|---|---|
| Hero schematic line | `HeroMachine`: nine placed objects on soft SVG paths (`.tl-machine`, 900×560 scene; grid stack below 992) |
| Symptom selector strokes | `Diagnostic` on How it works highlights a chamber |
| Nine hollow nodes on a rail (home) | `Factory`: seven `Chamber` objects, a travelling `ThesisCard`, a detail panel |
| Return thread | `LearningLoop` states; RETEST re-enters the same asset |
| Branch curves | `Expressions` tiles that differ by kind (`ContentTile` kinds: linkedin, video, x, threads, carousel, newsletter, post) |
| Memory wave | `BuyerPool` avatars (`BuyerAvatar` levels 0–4) |
| Hairline attention columns | `RouteBoard` filled steps + two `ScoreCard`s |
| Diagnosis ledger | `ScoreCard` + state chips |
| Period cards with tick timelines | `Progression` band (hypothesis / validated SVG) |
| Proof ledger on home | moved |
| Check / cross list | `VerdictTile` |

Depth: `--edge` (3px bottom edge), `--depth` (ambient), `--depth-lift` (raised / active). Palette unchanged from v2; the ember accent, the teal signal and the stamp yellow are used as object tones, never as glows.

## 5. Motion (as built; every one has a reduced-motion still)

| Where | Motion | Implementation |
|---|---|---|
| Hero | objects enter once in sequence (700ms each, delays 0.2s → 7s) | CSS keyframe `tl-mc-in` on `.tl-mc`, `--d` per object |
| Problem | chains reveal | `Reveal` (IntersectionObserver, `data-shown`) |
| Buyer pool / labour / route / CTA | one quiet rise per block; route steps light in order; outputs stack in | `Reveal` + CSS transition delays |
| Factory | idea card travels the track with scroll; active chamber lifts; press holds a chamber | one rAF-throttled scroll listener, `transform` only, `100cqw` container units |
| Expressions | MULTIPLY: one card → five tiles (350ms) | React state + CSS transitions |
| Learning loop | state switch on tab change; arrow keys move between states | `role="tablist"`, `data-state` |
| Progression | dots fade, validated lines thicken with scroll | rAF-throttled scroll progress → CSS variable |
| Comparison, fit | none | — |

Under `prefers-reduced-motion: reduce` the reduced-motion block in `public-v3.css` stops every keyframe and transition; the factory disarms its scroll link and the chambers are explored by pressing. `npm run qa:public` checks that no animation runs under reduced motion on every public route.

## 6. Responsive (as built)

| Component | ≥1440 | 1200–1439 | 992–1199 | 640–991 | ≤639 |
|---|---|---|---|---|---|
| Hero | statement left (640 max), machine absolute right 50% | machine right 52% | stacked, machine centred (max 880) | stacked | stacked; buttons wrap to full width |
| Hero machine | placed objects on paths | same | same | grid stack, paths hidden | grid stack |
| Problem contrast | two columns | two | two | two | stacked |
| Buyer pool | pool + ladder side by side (≥1024) | same | same | stacked | stacked; piece cards below the pool, not over it |
| Labour split | 40 / 60 | same | same | stacked | stacked; module board two-up |
| Factory | rail of 7 (≥1280) | 7 | 4 columns (≥1024) | 2 columns | accordion, one chamber open, no travelling card |
| Expressions | root left, tiles right | same | same | root above, tiles 2-up | stacked |
| Route board | 3 × 3 | 3 × 3 | 3 × 3 | 2 columns | single column |
| Learning loop | rail + card | same | same | rail above card | horizontal chip row above the card |
| Progression | one band | same | same | same | vertical band |
| Comparison | five columns | five | five | five (smaller type) | five columns at 13 / 10.5 / 13.5px, Threadline first (the reference's own phone behaviour) |
| Fit | two columns | two | two | two | stacked |

No hover-only information anywhere; every interactive object is a button or tab with a visible label and focus ring; targets are at least 44px (text links carry `min-height: 44px`).

## 7. References used and rejected

Used as A-class skeletons: Birdhouse hero panel (frozen, reused); Hydra selector (frozen, reused as the diagnostic); Starborn comparison table (new clone, verified, frozen; results in `COMPONENT_RECONSTRUCTION.md`). Used as principles only: Birdhouse's one focal point per section and charm; Hydra's sunk bands, hairlines and reveal easing; Starborn's numbered hairline steps; LeverBrands' service simplification; Invisible Keyboard's founder-is-the-source clarity; Demandii's founder-time objection; Influent's buyer-level wording; Windmill's tangibility. Rejected: every stat, receipt, logo, testimonial, MRR headline, video hero, dark or neon theme, pricing calculator, Slack mock, photographic hero, line-icon service card, eight-step process card, proprietary framework name and orange stroke diagram (`CAPTIVATION_PASS_PLAN_2026-09-09.md` §3 and §10). No reference copy, asset, colour, character, framework or claim appears in the site; `npm run qa:public` greps for the reference brand names.

## 8. Pricing audit

Grep of `src/content/public-site.ts`, `src/app/(marketing)/**`, `src/components/public/**`, `src/components/factory/**`, `not-found.tsx` and the OG image for `2,500`, `2500`, `£<digit>`, `starting from`, `from £`, `per month`, `/month`, `monthly`:

- No Threadline price, "starting from", discount, scarcity or urgency string anywhere on the public surface.
- The only `£` figure is the playbook's illustrative "£20,000 engagement" (a buyer's deal size, pre-existing, not Threadline pricing).
- The only "monthly" match is a calculator input id (`monthlyContractorCost`, not visible text); the visible calculator copy is unchanged and the cadence grep passes.
- The comparison table has no price row; the progression has no tier, plan, package or "from" wording; the periods are hairline rows, not cards.

Internal pricing (HANDOFF §16b) is unchanged and remains private (DEC-017).

## 9. Claims added or changed this pass

Recorded in `docs/site/CLAIMS_EVIDENCE_LEDGER.md`: C-COMPARISON (capability wording, not a measured comparison), C-LEARNING-ILLUSTRATIVE (the 82 / 100 rubric and the loop states are illustrative), C-THESIS-ILLUSTRATIVE (the AI-transformation root thesis and its derivatives are illustrative), C-FOUNDER-TOUCHPOINTS ("You are needed at four of them, briefly" — no exact time promise), C-ROUTE-STEPS (the nine-step route is a description of the mechanism, not a promise of leads). Where-used columns updated for the sentences that moved.

## 10. Owner proposals not implemented (decisions left open)

1. **H1 marker highlight** — the second approved line now sits under the H1 as a lighter display line. The yellow marker highlight from v1/v2 is retired from the hero (it read as decoration); say the word to bring it back.
2. **Hero machine loop** — objects enter once and rest. A slow re-run (every ~12s) is one CSS line away; left off because motion at rest argues against a calm product.
3. **Homepage FAQ** — still no approved copy; still not built (unchanged from the restraint pass).
4. **Diagnostic on the homepage** — kept off the homepage to hold the 12-section length; it sits at the top of How it works and is linked from the hero's secondary CTA path.
5. **A "Video agency" comparison column** — the brief listed four alternatives; a fifth column would push the phone table below readable type. The video question is answered by the "Video capability: when useful" row.
6. **Calculator link wording** and **list rendering** — unchanged from the restraint pass proposals.

## 11. Defects found and fixed during the pass

| Where | What | Fix |
|---|---|---|
| Hero machine | full-page captures showed an empty scene | not a defect: the objects animate in once; viewport probes confirm opacity 1. Entrance changed from a 12s loop to play-once so the scene rests |
| Hero, 1024 | statement and machine overlapped | side-by-side only from 1200; stacked and centred below |
| Hero, 1280 | "Named enquiry" marker collided with the carousel tile | marker positions moved left |
| Factory | travelling card overlapped the first chamber; founder badges truncated; item chips overflowed | dedicated 124px track above the rail; badges inside the chamber body; chips wrap; 7 columns only from 1280 |
| Final CTA, 390 | `white-space: nowrap` button pushed the page to 401px | pill buttons wrap and centre below 640 |
| Buyer pool, phones | piece cards covered the label and avatars | cards stack beneath the pool below 640 |
| Text links | 24px target | `min-height: 44px` |
| `probe.ts` | no way to wait between an evaluated scroll and the screenshot | `--after=<ms>` flag |

## 12. REQUIRED QA checklist — results (final build, evening of 9 September 2026)

Run on the final tree (tag `threadline-public-captivation-2026-09-09`), production build (`npm run build && npm start`), after the last CSS change. Every number below comes from that run.

**Information architecture.** Cold visitor reads (§13): the business is stated in the hero (managed system; you talk, record, approve, sell), the problem and the outcome are the next two screens, the system is the fifth. Threadline never reads as a LinkedIn agency, ghostwriter, video agency or platform buffet: no platform is in a headline; the comparison table places Threadline against those alternatives in capability wording; the video question is answered by a "when useful" row. Platform is a component: the only platform names on the homepage are inside content-tile labels (LinkedIn text, X post, Threads post) in the illustrative MULTIPLY scene and the comparison rows.

**Content.** Every approved sentence present (§3); internal pricing absent (§8); no invented proof, case study, logo, testimonial, number, guarantee, tier or rev-share (`qa:public` overclaim / placeholder / price greps); the illustrative labels are on the page (C-THESIS-ILLUSTRATIVE, C-LEARNING-ILLUSTRATIVE, C-SYNTHETIC-NUMBERS); the application flow unchanged and exercised end to end.

**References.** A-class components cloned first, verified and frozen before mutation (`COMPONENT_RECONSTRUCTION.md`); B-class taken as principles; C-class rejected (§7). Brand-leak grep across all ten reference names: clean on every route at every width.

**Visual.** Object language on every homepage section; no thin-line diagram, hollow node or arrow on the homepage; no glass, glow, gradient, dark SaaS or cartoon overload; one focal cluster per section; the palette unchanged (§4). Inspected by eye at 1440, 1280, 1024, 900, 768, 390 and 375 from viewport probes and full-page shoots.

**Responsive.** `qa:public`: 11 public routes × 20 widths (1920 → 320): **62 / 62 PASS** — no horizontal overflow, one H1, skip link, 44px targets, metadata, reduced motion honoured, no brand leak, no placeholder, no "monthly", no overclaim, no price, application submits and persists (`db=true`). Vertical flows on phones (§6); no hover-only information.

**Accessibility.** Factory chambers are buttons with labels and `aria-live` detail; the learning loop is a `tablist` with arrow keys; the comparison has `role="table"` semantics; the hero scene carries a descriptive `aria-label`; every decorative object cluster is `aria-hidden`; focus rings on every control; contrast unchanged from v2 (ink on paper / linen, paper on ember); `prefers-reduced-motion` stops every animation (`qa:public` reduced-motion check: `running=0` on every route).

**Performance.** CSS and SVG only; no animation library, canvas or WebGL; one rAF-throttled scroll listener per scroll-linked component; IntersectionObserver reveals; the only images are the OG image and the icon. Production build: exit 0. `qa:perf` (product): 9 / 9.

**Functional.** MULTIPLY / Back to one idea, chamber press / hold, learning-loop tabs and keys, progression scroll, diagnostic tabs on How it works, both hero CTAs, the apply flow — exercised in the production build by `qa:public` (application), by viewport probes (factory card position, MULTIPLY state) and by hand in the browser.

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0, 0 warnings |
| Unit tests | `npm test` | 625 tests in 154 suites: 625 pass, 0 fail |
| Production build | `npm run build` | exit 0 |
| Feature verification | `npm run verify:features` | 69 PASS · 2 EMPTY · 6 BLOCKED · 0 FAIL (77 checks) |
| Migrations | `npx prisma migrate status` | 13 migrations, up to date |
| Adversarial matrix | `npm run qa:all` | 494 checks: 485 PASS · 2 PASS WITH EXTERNAL GATE · 4 PARTIAL · 0 FAIL · 3 N/A (the same four assessed partials as before) |
| Synthetic engagements | `npm run qa:spine` | 0 FAIL; synthetic tenants removed |
| Performance | `npm run qa:perf` | 9 / 9 |
| Browser (prod build) | `npm run qa:browser` | 122 checks: 101 PASS · 21 PARTIAL · 0 FAIL (unchanged: dense-table target notes and one by-design inner scroller) |
| Public (prod build) | `npm run qa:public` | **62 / 62 PASS** |
| Visual baselines | `npm run qa:visual` | 30 captures (5 widths × 6 pages) + `geometry.json` re-baselined; every reveal fired; the v2 site kept in `qa-baselines/public-pre-captivation-2026-09-09/` |
| Clone verification | `verify-clone.ts starborn starborn-comparison-table` | `reference-analysis/clones/starborn-comparison-table/verify/report.json`; deviations in `FROZEN.md` |

Two harness defects were found and fixed during the battery, both in `scripts/qa/public-qa.ts`: the application check's confirmation regex matched "Playbook" in the nav (it now waits for "Application received" and reads `[role=alert]` first), and it did not explain the public form's 5-per-hour rate limit when repeated QA runs hit it (it now polls for the row and names the limit). Neither is a product defect; the product rate limit behaved correctly. A third, older one: the Hydra brand-leak term had been written with a literal backspace instead of `\b` and never matched; fixed and the grep extended to all ten references.

## 13. FINAL USER TEST (cold visitor, scroll once)

Walking the page as a founder who has never heard of Threadline, motion off:

1. **Hero (0–10s).** "You already have the expertise. We turn it into content people actually want to watch." Under it, in one line, that a system runs around it so content compounds into authority and qualified demand, then "You talk. You record. You approve. You sell. Threadline handles the machine." The picture beside it shows a thing labelled "Your expertise" becoming a root thesis, becoming three kinds of content, drawing a profile visit and a named enquiry, and feeding an "Expected vs actual" reading. The two buttons are "See if Threadline fits" and "See how the system works". A cold visitor can say: *a managed system that turns what I know into content and demand, and I only talk, record, approve and sell.*
2. **Problem (10–20s).** Without a system: sporadic posts, random reach, no learning, a shrug. With Threadline: expertise → intelligence → buyer-specific ideas → repeated exposure → commercial movement → diagnosis → improvement, and improvement feeds the next cycle.
3. **Outcome (20–30s).** Familiar, not famous: the same buyer meeting the same clear thinking five times until it is obvious who to call. By here the visitor knows the problem, the outcome and who does the work.
4. **Founder burden.** Four ember tiles for them; a board of thirteen jobs for Threadline.
5. **Factory.** Seven stations; a badge on the four where the founder appears; pressing any station explains it in one sentence.
6. **One idea, the right expressions.** Press MULTIPLY: one labelled-illustrative thesis becomes five visibly different native pieces; "a derivative is not a new idea".
7. **Reach is not the result.** Nine steps from content to learning; 1,204,000 in the wrong room vs 1,900 in the right room, both labelled illustrative; "No leads are promised."
8. **Learning.** Expected 82 / 100 (labelled a decision-support rubric, not a prediction) → Actual → Why → Change one lever → Retest at 14 days.
9. **Twelve weeks.** Three periods on one band; "We do not say the algorithm needs 90 days. We say the learning does."
10. **Comparison.** Ghostwriter, agency, in-house, Threadline; every non-Threadline cell says typically / sometimes / rarely / depends / no; the note says the column describes what is built in, not a measured comparison.
11. **Fit.** Seven checks, six crosses.
12. **Ask.** "You already have the expertise. Let's build the system around it." → Apply. Outputs: Authority, Familiarity, Qualified demand, Learning.

What the visitor cannot conclude from the page: a price, a promised number of leads, a guaranteed timeline, a client's name, that Threadline is a LinkedIn agency, a ghostwriter, a video agency or a platform buffet.

## 14. Rollback

`git checkout threadline-public-restraint-2026-09-09` restores the restraint-pass site; the pre-pass visual baseline is preserved in `qa-baselines/public-pre-captivation-2026-09-09/`. The database was not changed by this pass.
