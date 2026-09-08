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
| `npm run verify` | typecheck → lint → test → build |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:reset` | Drop, re-migrate and re-seed (destructive; Prisma will ask for confirmation) |
| `npm run seed` | Load the demo workspace |
| `npm run db:studio` | Prisma Studio |

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
src/app/             Routes: (marketing), (auth), app/[org], admin, onboarding, api
src/components/      Design system, app chrome, charts, marketing sections
src/lib/             actions, ai, auth, data, domain, integrations, reports, storage, utils
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
3. Set `DATABASE_URL`, `SESSION_SECRET` and `NEXT_PUBLIC_APP_URL`.
4. `npx prisma migrate deploy`
5. `npm run build && npm start`

Uploaded files are written to local disk by default. For a multi-instance or serverless
deployment, implement the `StorageAdapter` interface in `src/lib/storage/index.ts` against
object storage — call sites do not change. The same applies to the in-memory rate limiter in
`src/lib/security/rate-limit.ts`.

Detailed steps: `HANDOFF.md` section 8.

---

## What this product will not do

These are deliberate product decisions, not gaps to be quietly filled later:

- It does not publish to social platforms automatically. Every publishing API requires
  credentials or platform approval only the account owner can obtain, so Threadline prepares
  everything and records the live URL rather than showing a "Connect" button that cannot connect.
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
