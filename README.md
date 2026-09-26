# Threadline OS

The operating system behind a managed content growth service: market intelligence, strategy,
scripts, production, distribution and commercial learning in one place.

Threadline sells a managed outcome to expert-led B2B businesses, not software access. This
repository is the software layer of that engagement — a multi-tenant platform with a client
portal, an internal operator portal, a consultative onboarding flow and a public marketing site.

**Start here if you are picking this up cold:** [`HANDOFF.md`](./HANDOFF.md).

---

## Quick start

```bash
npm install
cp .env.example .env        # SQLite default needs no further configuration
npm run db:migrate          # create the database
npm run seed                # load the demo workspace
npm run dev                 # http://localhost:3000
```

Then sign in at `/login` with a seeded account (printed by the seed, and listed in
`HANDOFF.md` section 9).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint over `src` |
| `npm test` | Unit and tenancy tests (Node test runner) |
| `npm run verify` | typecheck → lint → test → build → verify:features |
| `npm run verify:features` | Feature-level assertions against the seeded database |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:reset` | Drop, re-migrate and re-seed (destructive; Prisma will ask for confirmation) |
| `npm run seed` | Load the demo workspace |
| `npm run db:studio` | Prisma Studio |
| `npm run jobs:worker` | Background job worker (email, metric refresh, maintenance); `-- --once` for a single pass |
| `npm run qa:all` / `qa:spine` / `qa:perf` | Adversarial harness against the real server actions (494 checks), the three synthetic engagements, the 20-client performance smoke |
| `npm run qa:browser` / `qa:public` / `qa:visual` | Headless-Chrome sweeps against a production build: 33 app/admin routes × 4 widths; 11 public routes × 20 widths; visual baselines (`qa:visual:compare` to diff) |

State on 2026-09-09 (commit `5a08f25`): 77 Prisma models, 13 migrations, 65 pages + 3 route
handlers, 625 unit tests in 154 suites, every gate above passing. Details in `HANDOFF.md` §20.

> **Note:** stop the dev server before `npm run build` on Windows — a running server holds the
> Prisma query-engine DLL and the build cannot replace it.

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Prisma 6 ·
SQLite by default, PostgreSQL supported · Zod · Radix primitives · first-party session auth ·
in-house SVG charts.

Architecture decisions and their reasoning: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
Platform API gates, what is filed and what is still queued: [`docs/PLATFORM_APPLICATIONS.md`](./docs/PLATFORM_APPLICATIONS.md).

---

## Repository layout

```
docs/                Product spec, architecture, data model, checklists, acceptance tests
prisma/              Schema, migrations, demo seed
scripts/             Development and QA helpers (not imported by the app)
src/app/             Routes: (marketing) incl. playbook, (auth) incl. forgot/reset/invite,
                     app/[org], admin, onboarding, api/files, api/webhooks, t/[slug]
src/components/      Design system, app chrome, charts, marketing, public + factory (public site)
src/lib/             actions, ai, analytics, auth, data, domain, email, integrations (connectors,
                     oauth, credentials, webhooks), jobs, reports, research, sales, security,
                     storage, utils
qa-baselines/        Approved public visual baselines (screenshots + geometry)
storage/             Uploaded files (git-ignored, served only through an authorised route)
```

---

## Environment

Copy `.env.example` to `.env`. The only required variable for local development is
`DATABASE_URL`, which defaults to SQLite.

Without `ANTHROPIC_API_KEY`, the AI layer runs a deterministic demo provider that composes output
from the workspace's own stored context. Every result is labelled in the UI as demo output — it is
never presented as a live model call.

Full variable reference: `HANDOFF.md` section 6.

---

## Deployment

1. Provision PostgreSQL (recommended for production).
2. In `prisma/schema.prisma`, set `provider = "postgresql"`.
3. Set `DATABASE_URL`, `DIRECT_URL` and `NEXT_PUBLIC_APP_URL`, then run `npm run env:check`.
4. `npx prisma migrate deploy`
5. `npm run build && npm start`

Uploaded files are written to local disk by default. For a multi-instance or serverless
deployment set `STORAGE_PROVIDER=s3` (with the `S3_*` values) and `RATE_LIMIT_STORE=redis` (with an
Upstash-compatible endpoint); both adapters are built and tested, and the rate limiter fails
closed if its shared store is unreachable. Run `npm run jobs:worker` alongside the app. Set
`CREDENTIAL_ENCRYPTION_KEYS` before connecting any platform or webhook; Threadline refuses to
store a secret it cannot encrypt.

Detailed steps: `HANDOFF.md` section 8.

---

## What this product will not do

These are deliberate product decisions, not gaps to be quietly filled later:

- It does not pretend to be connected. Connectors for LinkedIn, YouTube, Instagram, TikTok and X
  exist and publish through the official APIs, but only once the account owner's credentials and
  the platform's review are in place; until then the integrations page says "credentials missing"
  or "auth required", Threadline prepares everything, and the live URL is recorded by hand. No
  "Connect" button that cannot connect, and no simulated success.
- It does not automate human social behaviour. Publishing, analytics and research go through
  official rails with scoped, revocable OAuth; engagement (replies, comments, DMs, follows,
  likes) is a person. No browser bots, session-token automation, engagement pods, follow/unfollow
  automation or evasion of platform controls, ever (`HANDOFF.md` §16i).
- It does not publish exact service pricing on the website. Commercial terms are discussed in the
  qualified sales process; public copy carries no "from £X", discounts, scarcity or urgency.
- It does not present AI output as verified. Scripts carry extracted factual claims, and the
  system refuses to move a script to the recording queue while any claim is unverified.
- It does not fabricate proof. There are no invented testimonials, logos or results anywhere in
  the marketing site or the seeded demo.
- It does not promise savings. The calculator reports a current operating cost and one clearly
  labelled scenario.
- It does not let the system decide what matters. Findings from a market intelligence cycle are
  proposals: they cite the evidence behind them, a person approves or rejects each one, and a
  brief cannot be published while any is undecided.
- It does not claim credit. The proof view shows what changed while Threadline was engaged, with
  measured and reported figures distinguished, and never says Threadline caused it.
- It does not assume more content is the answer. The constraint diagnosis rates nine dimensions of
  the demand problem and states plainly when publishing more would make things worse.
