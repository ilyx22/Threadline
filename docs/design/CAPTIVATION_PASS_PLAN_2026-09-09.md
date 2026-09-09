# Captivation, information-architecture, graphics + interaction pass — plan (9 September 2026, evening)

Owner brief: the restraint-pass homepage is cleaner but still confusing, not captivating, too dependent on thin-line diagrams, repetitive in composition and explained inside-out. This plan precedes implementation. Success condition: a cold visitor understands the business faster with motion and illustration off.

Inputs read for this plan: the brief; the owner's three new intelligence documents (Starborn deep dive, Hydra / Inizio / platform-safety / offer-direction supplement, competitive-intelligence atlas) and the Birdhouse funnel document; fresh captures of Starborn, LeverBrands, Invisible Keyboard, Windmill, Demandii, Influent, Nova Impact and Understory (`reference-analysis/<site>/`, 1440 + 390, four widths for the first three); the frozen clones from the afternoon pass.

## 1. Current homepage map (restraint pass, tag `threadline-public-restraint-2026-09-09`)

| # | Section | Purpose |
|---|---|---|
| 1 | Hero panel + schematic line | Premise + division of labour + a first look at the system |
| 2 | The problem (symptom selector) | Four symptoms, each mapped to the stage that fixes it |
| 3 | The division of labour | You do four things; Threadline handles eleven |
| 4 | The machine (nine-station line) | The order of the work |
| 5 | Where most stop (return thread) | Publishing is the middle; five learning steps |
| 6 | One thesis, many packages (branch) | Derivatives share one history |
| 7 | Market memory (memory thread) | Familiarity, not fame |
| 8 | Reach is not the result | Right buyer over reach; illustrative numbers |
| 9 | How the system learns (diagnosis ledger) | Expected vs actual |
| 10 | Three service periods (period cards) | Engagement rhythm |
| 11 | Product proof (synthetic ledger) | The mechanism as proof |
| 12 | Fit | Good fit / not a fit |
| 13 | Apply CTA | The ask |

## 2. Problem diagnosis, section by section

| Current section | Verdict | Why |
|---|---|---|
| Hero | **REPLACE VISUALLY** (copy kept, hierarchy changed) | Introduces station names before tension; the line is a diagram, not a scene. Becomes a rich miniature machine with objects moving through it |
| The problem (selector) | **MOVE + REPLACE VISUALLY**: the four symptom points move to How it works (as the diagnostic's symptom list); the home problem section becomes a WITHOUT / WITH contrast | The selector explains stations before the visitor knows why a system matters |
| Division of labour | **MOVE EARLIER** (to 04) + **REPLACE VISUALLY** (asymmetric split, Threadline side expands) | One of the clearest ideas; too late on the page |
| The machine | **MERGE into the Authority Factory** (05); nine-station detail **DEMOTED** to How it works | Documentation-like; the factory becomes the centrepiece with chambers and objects |
| Where most stop | **MERGE into the learning loop** (08) | Adjacent version of the same argument |
| One thesis, many packages | **KEEP + REPLACE VISUALLY** (interactive MULTIPLY) | Good idea, abstract drawing |
| Market memory | **MOVE EARLIER** (to 03) + **REPLACE VISUALLY** (buyer pool, recognition accumulating) | This is the desired outcome; it belongs right after the problem |
| Reach is not the result | **KEEP + REPLACE VISUALLY** (route board with explicit commercial interpretation) | Principle is useful; the numbers lacked interpretation |
| How the system learns | **KEEP + REPLACE VISUALLY** (EXPECTED → ACTUAL → WHY → CHANGE → RETEST stepper) | The most proprietary idea; the ledger was static |
| Three service periods | **KEEP + REPLACE VISUALLY** (one continuous progression; the four cards go) | Cards read like pricing tiers |
| Product proof | **REMOVE FROM HOMEPAGE, PRESERVE** on How it works | A ten-record ledger is How-it-works material |
| Fit | **KEEP**, tighter | Legible already |
| Apply CTA | **REPLACE VISUALLY** (factory motif with outputs) | Return to the motif |
| — | **ADD: Comparison** (10) | The brief's "why not the alternative" is missing entirely |

## 3. Reference A / B / C classification

| Source | Component | Class | Reason |
|---|---|---|---|
| Birdhouse | Hero paper panel (frozen clone) | **A — reused** | Already verified; hero geometry stays, the art inside changes |
| Birdhouse | One obvious focal point per section, illustrated edge transitions, charm | B | Principle drives the object language |
| Birdhouse | Stat cluster, carousel, team grid, video hero | C | No proof to show; no video assets |
| Hydra | Selector → reactive diagram → explanation (frozen clone) | **A — reused** | Becomes the optional diagnostic on How it works (POSITION / CREATE / DISTRIBUTE / CONVERT / LEARN) |
| Hydra | Offer cards (frozen clone) | Retired from home | Owner: no four equal card boxes for the periods |
| Hydra | Sunk band + hairline surfaces, reveal easing | B | Kept |
| Starborn | "Why not just hire a ghostwriter?" comparison table (highlighted own column, hairline rows, check / cross / "sometimes") | **A — new clone** `starborn-comparison-table` | Exact skeleton for section 10 |
| Starborn | Numbered five-step list on hairlines | B | Used for the route board's numbering |
| Starborn | Case-study receipts, logos, MRR headline, video | C | Proof and claims Threadline cannot make; LinkedIn-only positioning |
| LeverBrands | "We do two things" split; Attention → Nurture → Monetise stage framing | B | Informs POSITION → REACH → CONVERT → LEARN as the factory's plain-language spine; wording not copied |
| LeverBrands | Dark theme, stat tiles, case cards | C | Off-palette; no proof |
| Invisible Keyboard | "You show up for 30 minutes a week. We handle the other 90%" banner; four numbered service blocks | B | Founder-is-the-source clarity; no time promise published |
| Invisible Keyboard | Slack mock, dark theme, pricing calculator | C | Not Threadline's delivery model |
| Windmill | Founder-OS productised framing | B | Tangibility principle only |
| Demandii | Founder-time objection handling; batch capture | B | Only as a reason to make division of labour prominent |
| Influent | Buyer-level measurement language | B | Commercial-response wording |
| Nova Impact | Restrained editorial service cards with line icons | B (caution) | Confirms restraint; icons are the thin-line style we are leaving |
| Understory | Eight-step process cards | C | Documentation density is the problem we are solving |

## 4. Exact A-class plan

| Clone | Source | What is cloned | Replaced in mutation | Why useful |
|---|---|---|---|---|
| `birdhouse-hero-panel` (frozen) | thebirdhouse.co hero | Panel radius/padding, 560px statement column, pill CTA, art bottom-right overlapping, stack < 992 | Copy hierarchy per the brief; the art becomes the miniature machine | Proven first-screen composition |
| `hydra-constraint-selector` (frozen) | workwithhydra.com "The diagnosis" | Tabs → reactive panel → symptom card + dark change card, easings, breakpoints | Five Threadline-native categories; the panel highlights the factory chamber; routes to Apply | Self-diagnosis without walls of copy |
| `starborn-comparison-table` (new) | starbornai.com "The honest comparison" | 1100px container; 1.4fr + 4 equal columns with 24px gaps; header row with a 32×4 accent pip over the own column; 15px/700 column names with 11px tracked sub-labels; 73px rows separated by 10%-alpha hairlines; 15px/500 row labels; check / cross / italic "sometimes" cells; own-column cells tinted; 12.5px footnote; collapses to a scrollable table at 390 | Threadline column; dimensions from the brief; "typically / depends / built-in / core to Threadline" wording; no prices; no time-to-calls claims | Forces the right comparison set with honest wording |

## 5. Proposed new homepage map

| # | Section | Headline (approved or brief-specified) | Visual |
|---|---|---|---|
| 01 | Hero | "You already have the expertise. We turn it into content people actually want to watch." + system line + low-burden line | Miniature Authority Machine (expertise token → signal chamber → root thesis → native expressions → response tokens → learning loop) |
| 02 | Commercial problem | "The market does not experience enough of what you know." (existing) | WITHOUT A SYSTEM vs WITH THREADLINE contrast board |
| 03 | Desired outcome / market memory | "We are not trying to make you famous…" + "Familiarity earns attention…" | Buyer pool: the same few buyers meeting the founder's thinking again, recognition accumulating |
| 04 | Founder burden | "The part we need from you is the part nobody else can fake." + "You talk. You record. You approve. You sell. Threadline handles the machine." | Asymmetric split: four founder tiles vs an expanding Threadline module stack |
| 05 | Authority Factory | "Your expertise goes in. A commercial authority system comes out." | Seven chambers with objects moving through; founder-touch badges on Input / Record / Approve / Sell |
| 06 | One idea, the right expressions | "One idea. The right expressions." | Root thesis card → MULTIPLY → five native tiles |
| 07 | Attention → commercial movement | "Reach is not the result." + "Threadline optimises for commercially valuable attention, not just reach." | Route board: nine filled steps from content to learning; illustrative reach comparison with interpretation |
| 08 | Learning loop | "Written down before, read against after." | Asset card stepper: EXPECTED → ACTUAL → WHY → CHANGE → RETEST |
| 09 | 12-week progression | "Three service periods. Real market evidence, not a promise about algorithms." | One continuous line; hypotheses fade, validated patterns thicken |
| 10 | Comparison | "You could just hire a ghostwriter." | Starborn-skeleton table |
| 11 | Who it is / is not for | "Built for a specific kind of business." | Two columns of filled check / cross tiles |
| 12 | Final CTA | "You already have the expertise. Let's build the system around it." | Factory outputs: Authority · Familiarity · Qualified demand · Learning |

Optional diagnostic ("Where is your authority system breaking?") goes to the top of How it works, reusing the frozen selector skeleton, so the homepage does not grow.

## 6. Content preservation matrix

| Existing information | Current location | New location | Treatment |
|---|---|---|---|
| Hero eyebrow / title / lead / sub / note | Hero | Hero | Preserved; hierarchy per brief (eyebrow → title → lead → sub → CTAs → note) |
| Problem title + lead | Home §2 | Home §02 | Preserved |
| Four symptom points | Home §2 selector | How it works diagnostic (symptom list) | Preserved, demoted |
| Division of labour: four verbs + bodies, eleven machine verbs, relief line | Home §3 | Home §04 | Preserved; brief's sub-lines added beneath the verbs |
| Nine stations + details | Home §4 + How it works | How it works | Preserved on How it works; the factory shows seven chambers |
| Return path five steps | Home §5 | Home §08 (as the RETEST close) + How it works | Preserved, merged |
| Branching title/lead/packages | Home §6 | Home §06 | Preserved; headline becomes the approved "One idea. The right expressions." with the existing title as sub-line |
| Memory title/lead/stages/note | Home §7 | Home §03 | Preserved |
| Attention title/lead/left/right/signals | Home §8 | Home §07 | Preserved; numbers kept as an interpreted aside |
| Learns title/lead/card/disclaimer | Home §9 | Home §08 | Preserved; card becomes the stepper (expected score added, labelled illustrative) |
| Twelve-weeks title/lead/periods/note | Home §10 | Home §09 | Preserved; rendered as one progression |
| Proof title/lead/chain/label | Home §11 | How it works (new section) | Preserved, demoted |
| Fit title/good/bad | Home §12 | Home §11 | Preserved |
| CTA title/lead | Home §13 | Home §12 (lead) + Apply page | Preserved; closing line from the brief added |
| Gates, stages, machine | How it works | How it works | Preserved |
| Who-it's-for profile, wedge note | Who it is for | Who it is for | Preserved |
| Playbook, calculator, apply | — | — | Untouched |

Nothing is deleted from the experience. The comparison table, the factory chamber contents, the route-board steps, the learning-loop demonstration values, the diagnostic categories and the closing line are new copy specified by the brief; they are added to `src/content/public-site.ts` under new keys and recorded in the claims ledger where they make a claim.

## 7. Graphics replacement map

| Current visual (line-heavy) | New visual concept |
|---|---|
| Hero schematic line (nodes on a thread, hollow circles, dashed return) | Miniature machine: filled expertise token, signal chamber with three tokens attaching, root thesis card with a coloured header band, three native tiles (text / video / carousel) fanning out, teal response tokens, a filled return path into a small "learn" module; layered with soft shadows and 3px thickness edges |
| Symptom selector stage strokes | Retired from home; on How it works the panel highlights a factory chamber instead of a stroke |
| Nine-node machine line | Seven chambers (rounded modules with label tabs, canvas-deep interiors) with an idea card travelling through; founder badges |
| Return thread with dashed path | Learning-loop stepper card with state chips; the "re-enters" step animates the card back to the start |
| Branch (thin curves to dots) | Root card physically multiplying into native tiles that look different from each other |
| Memory thread (wave with hollow nodes) | Buyer pool of filled avatars; one buyer's ring fills across five encounters |
| Attention hairline columns + ghost numeral | Route board of nine filled numbered steps; reach aside with explicit interpretation |
| Diagnosis ledger + inspection mark | Asset card with EXPECTED / ACTUAL panels, score, strengths / risks, diagnosis label chips |
| Period cards with tick-mark timelines | One continuous progression band with hypothesis dots fading and validated patterns thickening |
| Proof ledger | Moves off home |
| Check / cross list | Filled check / cross tiles |

Object language (`src/components/factory/objects.tsx`): `Token`, `SignalChip`, `ThesisCard`, `ContentTile` (text / video / post / thread / carousel / newsletter variants), `ResponseMarker`, `ScoreCard`, `Chamber`, `ModuleTile`, `OutputTile`. Depth: `--depth-1` soft ambient shadow + a 3px darker bottom edge; overlaps of 8–16px; no glass, no glow.

## 8. Motion plan (each with a job; reduced motion shows the end state)

| Motion | Where | Job |
|---|---|---|
| Expertise token enters, signals attach, card forms, tiles fan out, responses appear, loop returns (CSS keyframe sequence, ~10s, loops) | Hero | Causality and transformation |
| WITHOUT / WITH chains draw left to right on reveal | Problem | Progression |
| Buyer ring fills across five stops on scroll | Market memory | Accumulation |
| Threadline module stack expands on reveal; founder tiles stay still | Division of labour | Leverage |
| Idea card moves chamber to chamber with scroll; chamber lifts on hover / tap; founder badges light | Factory | Order, delegation |
| MULTIPLY: root card splits into five tiles (transform + opacity, staggered) | Expressions | Transformation |
| Steps light in order on reveal | Route board | Path |
| Stepper: state switches EXPECTED → ACTUAL → WHY → CHANGE → RETEST; card slides back to start on RETEST | Learning loop | Feedback |
| Dots fade, validated lines thicken with scroll | Progression | Uncertainty narrowing |
| None | Comparison, Fit | Calm |
| Outputs stack in on reveal | Final CTA | Payoff |

No ambient floating, no parallax, no auto-carousels. All transform / opacity; one scroll listener (rAF-throttled) shared via the existing pattern; IntersectionObserver reveals.

## 9. Responsive plan

| Visual | ≥1024 | 768 | 390 |
|---|---|---|---|
| Hero machine | Right of the statement, 54% wide | Below the statement, full width | Simplified vertical sequence: token → card → three tiles → response; no labels under 11px |
| Problem contrast | Two columns side by side | Two columns | Stacked: WITHOUT then WITH, each a vertical chain |
| Buyer pool | Pool left, five encounter stops right | Stacked | Pool as a 3×3 grid; stops as a vertical list |
| Division split | 40/60 asymmetric | 50/50 | Stacked; Threadline modules as a two-column tile grid |
| Factory | Horizontal rail of seven chambers, sticky heading | Two rows | Vertical accordion, one chamber open at a time, tap to open |
| Expressions | Root card left, tiles fan right | Root above, tiles 2-up | Root, then tiles stacked; MULTIPLY still a button |
| Route board | 3×3 S-path | 3×3 | Single column list |
| Learning stepper | Card with side rail of five states | Same | States as a horizontal scrollable chip row above the card |
| Progression | One band | One band | Vertical band with period stops |
| Comparison | Five-column table | Five columns, smaller type | Horizontal scroll inside its own container with the Threadline column first and sticky |
| Fit | Two columns | Two | Stacked |

Hover-only information: none. Every interactive element is a button with a visible label and focus ring.

## 10. Rejected ideas

- Starborn's MRR headline, receipts, case cards, logo wall and video hero: proof and claims Threadline cannot make; LinkedIn-only framing.
- LeverBrands' dark neon theme and "Attention → Nurture → Monetise" wording: off-palette and derivative.
- Invisible Keyboard's Slack mock and public pricing calculator: not Threadline's delivery model; pricing must stay private.
- Windmill's photographic hero and Demandii's stock-photo scribble style: tacky in Threadline's context.
- Understory's eight uniform process cards and Nova's line-icon service cards: the documentation density and thin-line style we are leaving.
- Hydra's four-constraint framework and orange stroke diagram: proprietary; Threadline's diagnostic has its own five categories and highlights chambers instead.
- Any 2.5D done with WebGL / canvas: CSS + SVG achieves the depth at a fraction of the cost.
- Animated mascots or a full illustrated factory building: cartoon overload the owner has already rejected.
- A homepage FAQ and testimonial block: no approved copy, no proof.

## Implementation order

PASS 1 palette / depth tokens / object primitives → PASS 2 hero → PASS 3 problem + memory → PASS 4 division → PASS 5 factory → PASS 6 expressions → PASS 7 route board → PASS 8 learning loop → PASS 9 progression + comparison + fit + CTA (+ How it works diagnostic and demoted sections) → PASS 10 responsive / a11y / motion / performance, full QA. Render and inspect after passes 2, 5, 8 and 10.
