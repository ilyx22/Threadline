# Current pass checkpoint — completion + public experience rebuild

Updated: 9 September 2026 (end of pass). Baseline before the pass: `threadline-pre-public-experience-rebuild-2026-09-09` (see `PRE_PUBLIC_REBUILD_STATE.md`).

## Completed

1. **Findings disposition** — `docs/audits/LATEST_HANDOFF_FINDINGS_DISPOSITION.md`: 59 items reviewed, 0 still broken.
2. **Schema** — migration `20260908234429_completion_pass_email_jobs_scripts_permissions_economics`: 7 new models, 8 extended (see `docs/DATA_MODEL.md`).
3. **Infrastructure** — email, tokens/invites/reset, jobs + worker, S3 storage, shared rate limit, five platform connectors, analytics ingestion, research providers, webhooks, rev-share-ready attribution. All with unit tests (`src/**/*.test.ts`).
4. **Product gaps** — report learning sections, cold-start baselines, text-led workflow + Threads, idempotent ideas, event dedupe, intended job, distribution mode, discovery economics, canonical scripts (+ `/admin/scripts`), proof permissions (client settings + admin), delivery load (`/admin/delivery`), application → prospect.
5. **Reference analysis** — `reference-analysis/birdhouse/` (20 widths; DNA; principles; forbidden-copy; notes).
6. **Public experience** — design DNA + `public.css`, factory primitives/scenes/machine, rebuilt home / how-it-works / who-its-for / apply / calculator / playbook (10 chapters) / not-found / auth screens, metadata (sitemap, robots, OG, icon), central content, claims ledger, brand truth, decisions log, placeholders, project memory, customisation guide, handover.
7. **QA** — `qa:public` (20 widths + application submit), `qa:visual` (+ `--compare`), `qa:perf` with realistic rows, harness updates for new behaviour, `qa:all` green.
8. **Docs reconciled** — HANDOFF §2/§15, ARCHITECTURE ADR-021…027, DATA_MODEL, FUTURE_BACKLOG, BUILD_CHECKLIST phase 16, ACCEPTANCE_TESTS CP1–CP18, `.env.example`, QA_REPORT (final section).

## Test state (see QA_REPORT for the final run)

typecheck · lint · unit tests · build · migrate status · qa:all · qa:spine · qa:perf · qa:browser · qa:public · qa:visual.

## Git state

Commits on `master` during this pass: baseline → infrastructure → product gaps → public experience → QA/docs. Final tag: `threadline-public-baseline-2026-09-09`.

## Migration state

13 migrations; `npx prisma migrate status` → up to date. Clean-database path verified by `npm run db:reset` + seed during the pass.

## Visual state

`qa-baselines/public/{1440,1024,768,390,320}-{home,how-it-works,who-its-for,playbook,apply,login}.jpg` + `geometry.json` — the approved public product baseline.

## Remaining (not bugs)

External gates and founder inputs only — listed in `docs/QA_REPORT.md` §16–17 and `docs/site/PLACEHOLDERS.json`.

## Exact next commands

```
npm run typecheck && npm run lint && npm test && npm run build
npm run qa:all && npm run qa:spine && npm run qa:perf
npm start &   # then
npm run qa:browser && npm run qa:public && npm run qa:visual:compare
```
