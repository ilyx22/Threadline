# Project memory — Threadline (site + system)

Read this first in any new session. It states what is true now; history is in `docs/site/DECISIONS_LOG.md` and `docs/checkpoints/`.

## Identity
Threadline: a managed content-growth / authority system for expert-led businesses. Managed outcome; the software (Threadline OS) is the mechanism and the proof. Founding-client programme, one offer, £2,500 implementation + £2,500 every 4 weeks, 12-week initial engagement — **internal figures, not published on the site (DEC-017, 2026-09-09)**. Not a video production company, not a platform buffet: a low-friction founder authority + qualified-demand system, video-led where it adds information or trust, text-native and platform-prescribed otherwise (DEC-021). Publishing through official rails; engagement human; no automated social behaviour (DEC-018).

## Current architecture (2026-09-09)
Next.js 15 App Router · React 19 · Prisma 6 (SQLite dev, Postgres-ready) · Zod 4 · server actions only for mutations · first-party auth · 77 models (13 migrations) · AES-256-GCM credential keyring · OAuth state/PKCE · durable jobs table · captured/Resend email · local/S3 storage · memory/Redis-REST rate limit · connectors for LinkedIn, YouTube, Instagram, TikTok, X · analytics normaliser with five field states · research providers (internal, manual, URL) · webhooks for Stripe/HubSpot/Pipedrive/Attio/GoHighLevel with signature verification.

## Authoritative files
- Business truth: `HANDOFF.md` (§13, §16b), `docs/PRODUCT_SPEC.md`, working resources.
- Public site: `src/content/public-site.ts` (copy), `docs/site/BRAND_SOURCE_OF_TRUTH.md`, `docs/site/CLAIMS_EVIDENCE_LEDGER.md`, `docs/site/PLACEHOLDERS.json`.
- Design: `design-system/threadline-design-dna.json`, `docs/design/THREADLINE_PUBLIC_DESIGN_SYSTEM.md`, `docs/design/CUSTOMISATION_GUIDE.md`, `src/app/public.css`.
- Reference analysis (historical input only): `reference-analysis/birdhouse/`.
- QA: `docs/QA_REPORT.md`, `scripts/qa/*`, `docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`.

## Current design direction
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
