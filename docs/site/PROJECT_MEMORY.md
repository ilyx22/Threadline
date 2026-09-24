# Project memory — Threadline (site + system)

Read this first in any new session. It states what is true now; history is in `docs/site/DECISIONS_LOG.md` and `docs/checkpoints/`.

## Identity
Threadline: a managed authority system for expert-led (B2B) firms — the expertise that wins the work, made visible before the sales call. Managed outcome; the software is the mechanism and the proof. Public copy never says "content growth", "content agency", "ghostwriting" or a platform name as the category (DEC-025). Founding-client programme, one offer, £2,500 implementation + £2,500 every 4 weeks, 12-week initial engagement — **internal figures, not published on the site (DEC-017, 2026-09-09)**. Not a video production company, not a platform buffet: a low-friction founder authority + qualified-demand system, video-led where it adds information or trust, text-native and platform-prescribed otherwise (DEC-021). Publishing through official rails; engagement human; no automated social behaviour (DEC-018).

## Current architecture (2026-09-09)
Next.js 15 App Router · React 19 · Prisma 6 (SQLite dev, Postgres-ready) · Zod 4 · server actions only for mutations · first-party auth · 77 models (13 migrations) · AES-256-GCM credential keyring · OAuth state/PKCE · durable jobs table · captured/Resend email · local/S3 storage · memory/Redis-REST rate limit · connectors for LinkedIn, YouTube, Instagram, TikTok, X · analytics normaliser with five field states · research providers (internal, manual, URL) · webhooks for Stripe/HubSpot/Pipedrive/Attio/GoHighLevel with signature verification.

## Authoritative files
- Business truth: `HANDOFF.md` (§13, §16b), `docs/PRODUCT_SPEC.md`, working resources.
- Public site: `src/content/public-site.ts` (copy), `docs/site/BRAND_SOURCE_OF_TRUTH.md`, `docs/site/CLAIMS_EVIDENCE_LEDGER.md`, `docs/site/PLACEHOLDERS.json`.
- Design: `design-system/threadline-design-dna.json`, `docs/design/THREADLINE_PUBLIC_DESIGN_SYSTEM.md`, `docs/design/CUSTOMISATION_GUIDE.md`, `src/app/public.css`.
- Reference analysis (historical input only): `reference-analysis/birdhouse/`.
- QA: `docs/QA_REPORT.md`, `scripts/qa/*`, `docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`.

## Current design direction (homepage second pass, 2026-09-24)
Public homepage: the Birdhouse composition with the illustrated Threadline world (DEC-030, `src/components/marketing-v9`, `src/styles/marketing-v9/index.css`, copy in `src/content/home.ts` + `marketing-v5.ts`). Pale canvas `#e8f1f8`, white panels inset 30px with a 40px radius, Instrument Serif statements (5.4rem hero, 3.9rem sections) with an italic serif audience line, Inter body, one action colour `#1f63d6` for pills and marks, five pastels (sky, peach, mint, lilac, butter) for tiles. The hero, the visibility-gap band and the closing landscape are generated scenes (Nano Banana, DEC-033, `public/marketing/`); the station tiles, burden tiles and capsules use a 17-object flat set with HTML labels; the frieze, the expressions line and the bench stay code-drawn v5 components retoned through `--v5-*`. Sections: hero panel with the cropped workshop scene running off the panel; a ticker; the full-bleed vault band with the market-memory panel riding over it; the working relationship (capsules + two tiles); the six-tile workshop mosaic; the expressions line; the learning bench in a panel; fit around the gate; the closing night panel with the evolved scene and a giant wordmark marquee. Reveals rise and fade once per section; marquees loop; reduced motion turns everything off. Who it is for and the Playbook are in the same system (DEC-031): the Playbook is one interactive page (`src/components/marketing-v9/playbook`, data in `src/content/playbook.ts`) with a start button, a maxims marquee, a sticky chapter rail with browser-kept read-state, ten chapters each carrying an object to use, the two tools, the three periods and the hand-over. How it works, Apply, the calculator and Not found are in the same system too (DEC-032): How it works carries the busy machine, the six-station stage in a night panel, the seven stages as tiles (the founder's three tinted), the four gates and the synthetic chain stamped Illustrative; Apply and the calculator wrap their unchanged form and model in one panel. The paragraphs below describe superseded directions.

## Previous design direction (dry editorial rebuild, 2026-09-24, rejected as a regression)
Public homepage: a premium editorial page in the manner of a serious B2B strategy studio (DEC-029, `src/components/home`, `src/styles/home/home.css`, copy in `src/content/home.ts`). Warm neutral ground `#f4f2ed`, paper sheets with 1px hairlines and a soft shadow, deep ink `#15181c`, one terracotta accent `#b4472a`; Instrument Serif headings at a measured size, Inter elsewhere, 11px tracked labels. Nine sections: hero with a stack of labelled sheets, the visibility gap as two index sheets, market memory as five encounter tickets, the working relationship as two ledgers, the Authority Workshop as a six-station rail, one idea feeding four expression sheets, the learning ledger (three illustrative cases, five states), fit lists, a closing band. No illustrations, characters, coloured panels, gradients or dashboards; motion is entry settles and the rail marker only; both interactive objects read without scripting. The shared v5 nav and footer are restyled by the `v8` layout class. Inner pages keep their earlier layouts pending the same pass. The paragraphs below describe superseded directions.

## Previous design direction (v5 illustrated world, 2026-09-21)
Public: an illustrated Threadline world — an editorial authority workshop connected by one continuous thread, drawn in code (`src/components/marketing-v5/art/`) as a restrained editorial system: faceless architectural scale figures, one 1.6-unit ink line, square-shouldered machinery, tags sized to their text, no perpetual loops (DEC-028). Palette (muted on purpose): ink `#172033`, parchment `#f5f2ea`, sky `#d9e2e6`, mint / coral / lilac / butter pastels for objects, one marigold `#c88b2d` accent (the thread, signals, actions). Instrument Serif headings + Inter body and labels on the marketing scenes (Fraunces and JetBrains Mono remain for the product surfaces). Eight scenes — hero, problem with the market-memory statement and frieze, an illustrative "what you receive" engagement sheet, founder burden, the Authority Workshop (whole bench visible, six named stations, no sticky track), the testing bench, fit with the comparison abacus, closing — each with a phone recomposition; nothing hidden before it enters; reduced motion renders authored final states; every invented number labelled illustrative. Docs: `docs/design/V5_*.md`, handoff `THREADLINE_FRONTEND_V5_HANDOFF.md`. The paragraphs below describe superseded directions.

## Previous design direction (v4, 2026-09-12)
Public: the marketing experience ported from the `thebirdhouse/` workspace — bone `#F3F0E8` ground, ink `#121316`, cobalt `#1F3BD6` system colour, one vermilion `#E2432A` signal, steel/mist neutrals, night `#0E1330` bands; Fraunces + Inter + JetBrains Mono; the Authority Workshop object language; four signature scenes (hero machine, expertise vault, memory formation, diagnostic instrument). Documented in `docs/design/marketing-v4/`. The paragraphs below describe the superseded v3 direction.

## Previous design direction (v3, 2026-09-09)
Public: warm linen canvas, paper cards with ink outlines and hard offset shadows, Fraunces display + Inter + JetBrains Mono labels, the Authority Factory (thread + conveyor + original cast). Client portal calm/dark; admin dense/dark; auth screens on paper.

In progress (2026-09-09, DEC-022, separate process): a visual pass toward ~70% premium editorial / 20% interactive product visualisation / 10% playful illustrated character, component-first clean-room reconstruction of selected reference components (Birdhouse for composition, Hydra for interaction); content, sections and section order preserved; the Authority Factory expressed as system visualisation rather than a literal cartoon factory. Re-baseline `qa-baselines/public/` when it lands.

## Baseline tags
- `threadline-pre-public-experience-rebuild-2026-09-09` — before this pass (rollback point).
- `threadline-public-baseline-2026-09-09` — approved public product baseline after this pass (screenshots + geometry in `qa-baselines/public/`).

## Public routes
`/` · `/how-it-works` · `/who-its-for` · `/playbook` · `/playbook/[chapter]` (10) · `/apply` · `/calculator` · `/login` · `/forgot-password` · `/reset-password` · `/invite` · `/t/[slug]` · `/sitemap.xml` · `/robots.txt` · `/opengraph-image` · `/icon.svg`.

## Non-negotiables
Never "monthly" for cadence · no promised outcomes · no AI-led positioning · no invented proof · synthetic labelled · one CTA per viewport · every-claim-in-the-ledger · nothing from the reference's forbidden list · tenancy and evidence classes never weakened by design work.

## Known external gates
Credentials: email provider, S3, Redis, platform OAuth client ids, Anthropic key, booking URL, production domain. Provider review: Meta App Review, TikTok audit, Google OAuth verification, LinkedIn/X access tiers. Live client data: real results for proof. Founder decisions: approve canonical scripts, legal pages, domain.

## Completion state
See `docs/QA_REPORT.md` (verification) and `docs/checkpoints/CURRENT_PASS_CHECKPOINT.md` (what was done this pass and what is next).

## Next action
Set the production domain and email provider; approve the canonical scripts; run the first real research conversations. Everything else is built and verified.
