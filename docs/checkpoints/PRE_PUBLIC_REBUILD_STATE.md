# Checkpoint — state before the public-experience rebuild and completion pass

Captured: 9 September 2026, before any change of this pass.

## Git

- Repository initialised this session (no prior commits existed; the whole build lived uncommitted on disk).
- Baseline commit: `2be88a9c2dc63e345a5323913d75718427e17ea9` on `master`
- Tag: `threadline-pre-public-experience-rebuild-2026-09-09`
- Not committed (by `.gitignore`): `.env`, `prisma/dev.db`, `storage/`, `.next/`, `scripts/qa/.shots/`
- Working resources (`Threadline Final Working Resources/`) are committed as they were supplied.

## Database

- Prisma 6, SQLite dev database `prisma/dev.db`, 12 migrations, `prisma migrate status` → up to date
- 70 models (last additions: ContentRoot, ContentExpectation, ContentDiagnosis, CorrectionEntry, Credential, OAuthState)

## Verification at baseline (exact)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npm test` | 578 tests, 135 suites, 0 failures |
| `npm run build` | exit 0 — 69 routes (see below) |
| `npm run verify:features` | PASS 69 · EMPTY 2 · BLOCKED 6 · FAIL 0 (77 checks) |
| `npm run qa:all` (previous day, same tree) | 495 checks: 480 PASS · 2 ext · 10 PARTIAL · 0 FAIL · 3 N/A |
| `npm run qa:browser` (production build) | 92 PASS · 30 PARTIAL · 0 FAIL |
| `npm run qa:perf` | 8/8 |

## Public routes (before)

`/` · `/how-it-works` · `/who-its-for` · `/calculator` · `/apply` · `/login` · `/t/[slug]` (tracked redirect) · `/no-access` · `/_not-found`

Public nav: How it works · Who it is for · Cost calculator · Sign in · Apply. Footer: Product / Company columns.

## App / admin routes (before)

App (`/app/[org]/…`): dashboard, approvals, create (ideas, ideas/[id], scripts, scripts/[id]), distribution, install (+recording), intelligence (+diagnosis, radar, runs, runs/[id], signals, signals/[id]), learning, library, performance (+attribution, proof), pipeline, production (+[id], packaging, recording), reports (+[id]), settings (+integrations, members), tasks. `/onboarding/[org]`.

Admin (`/admin/…`): index (cockpit), acquisition, applications, clients (+[id], new), market (+[id]), metrics, prospects (+[id]), queue, research (+calibration), sops (+[key]), support.

API: `/api/files/[...path]`. Middleware present.

## Design direction (before)

Dark-first single theme across public, client and admin (`--color-base #0b0d0f`, champagne accent `#c8a96b`, Inter + editorial serif). Public site uses product-screenshot mock views (`components/marketing/product-views.tsx`) and scroll-reveal fade-ins. No illustration system, no light theme, no distinct public design language.

## Known gaps carried into this pass

From `docs/QA_REPORT.md` §12, `HANDOFF.md` §15 and `FUTURE_BACKLOG.md` — all reconciled in
`docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`.

## Rollback

```
git checkout threadline-pre-public-experience-rebuild-2026-09-09
# or reset the branch to it:
git reset --hard threadline-pre-public-experience-rebuild-2026-09-09
npx prisma migrate reset --force   # if migrations added after this point must be discarded (re-seeds)
```

The SQLite database is not versioned; `npm run db:reset` (or `prisma migrate reset`) rebuilds it
from migrations + seed at any point.
