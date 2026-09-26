# Why production deployments did not trigger (26 September 2026)

Evidence was taken from Vercel's deployment list for team `ilyx22s-projects` (both projects), read through the Vercel API on 26 September 2026, and from `git log`. Times are UTC.

## What happened

| Commit | Pushed (UTC) | `threadline` production | `threadlinex` production |
| --- | --- | --- | --- |
| 6efc71d, b53c976, 356423c, b510a8f | 02:31 to 03:20 | built | built (356423c CANCELED, then b510a8f READY) |
| 22d040f | 03:48 | **none** | READY |
| ee33430, 0c3c944, 8efaf8d, 6e00e4a | 04:08 to 04:56 | READY | only 8efaf8d |
| backend/completion branch commits | 06:40 to 07:09 | previews only, some commits skipped on one project or the other | same |
| f34a61e (branch), 1bdf602 | 07:04 to 07:09 | last deployment of the window, 07:09 | — |
| **70c5123** (the merge to `main`) | **07:22** | **none, not even a record** | **none** |
| 3e9da68 | 14:23 | READY | READY |
| cd90b6c | 15:58 | READY (production, `dpl_5nKR6rKvA8UrqdmCyyfQzVXN2XRa`) | READY (production, `dpl_B1JfuoDBrbtv7Bqs2cKsrMH3hKPD`) |

## Cause

**The account hit Vercel's Hobby deployment quota.** The team's deployment list holds exactly **100 deployments created between 23:21 on 25 September and 07:09 on 26 September**, which is under eight hours. The Hobby plan allows 100 deployments per day. After 07:09 no deployment of any kind exists until 14:23. No deployment record exists for 70c5123 on either project; that fits a push refused for quota rather than a failed build (a failed build would leave an ERROR record). The GitHub commit status that would name the limit could not be read here (no GitHub CLI on this machine); it is visible on the commit page on GitHub. Deployments resumed once the rolling 24-hour count fell below the limit.

Why the quota was reached: every push created up to **four builds per commit**:

- a production build of `main` on each of the two projects;
- a preview build of `master` on each project, because `master` was pushed alongside `main` as a mirror branch;
- plus a preview build on each project for every commit on a work branch (`backend/completion`, `frontend/visual-rebuild-v5`).

Twenty-five commits in a morning is a hundred deployments.

The earlier single misses (22d040f on `threadline`; ee33430, 0c3c944 and 6e00e4a on `threadlinex`) are superseded or cancelled builds. When commits arrive minutes apart, Vercel cancels or skips the older queued build on that project (see the CANCELED records at 03:20 and 03:29). They are not the same failure.

The Vercel connector's `deploy_to_vercel` was refused by this workspace's permission rules. That refusal is unrelated to the missing deployments.

## Fixes applied in the code

1. `vercel.json` now sets `git.deploymentEnabled.master = false`, so pushes to `master` no longer build on either project. This halves the builds per `main` push.
2. Work-branch commits are no longer pushed one by one; branches are pushed once when ready.
3. `DEPLOYMENT_ROLE` (`primary` | `mirror`, see below) stops a second project from running the job queue.

If the owner wants every push to build on both projects, the lasting fix is the Pro plan (6,000 deployments per day) or disconnecting Git from the project that is not canonical.

## Canonical production project

**`threadline` (`prj_lFCTw9JJONkL9G1iYVEgM9se303T`, https://threadline-fawn.vercel.app) is the canonical production project.** The reasons:

- The implementation brief names threadline-fawn.vercel.app as "the approved public site".
- The public-freeze evidence (`evidence-public-freeze.txt`) and the marketing QA suites are defined against it.
- It is the original project: it was created a few minutes before `threadlinex`.
- It built production for every `main` push except one superseded commit.

`threadlinex` (`prj_Kw5aevhSNHqWZ2s25VyPeyGlu4dg`, https://threadlinex.vercel.app) is a second project connected to the same repository. Neither project has a custom domain, and both have Vercel Authentication on every URL except the production domain.

## Separation: database, cron, environment

| | `threadline` (canonical) | `threadlinex` (mirror) | Preview builds (both) | Local |
| --- | --- | --- | --- | --- |
| `DEPLOYMENT_ROLE` | `primary` | `mirror` | unset (previews never cause side effects anyway) | unset |
| Database | Neon **main** branch: `DATABASE_URL` pooled, `DIRECT_URL` direct | Its own Neon branch (e.g. `staging`), **never** the main branch; or no database, if it only shows the public site | A separate Neon branch (e.g. `preview`) | Embedded PostgreSQL on 55432 |
| `PRODUCTION_DATABASE_URL` | — | set to the main branch's pooled URL, so the app refuses to start its checks if someone pastes the production URL | same | — |
| Cron (`/api/cron/jobs`, daily 07:00) | runs the queue | answers `{"skipped":"mirror deployment"}` | Vercel runs cron only on production deployments | manual |
| `CRON_SECRET`, `CREDENTIAL_ENCRYPTION_KEYS` | production values | **different** values | different values | none |
| Email, CRM, Stripe | live configuration (Stripe test mode only in this build) | none: the mirror never sends, syncs or bills | none | capture provider |

Why a mirror must not share the production database: the job queue and the daily tick live in the database. Two deployments draining one queue would not duplicate work, because leases and idempotency keys prevent that. But a mirror that runs an older or newer build could run jobs with different code. It would also double the attack surface for the same client data.

**Owner action.** Set `DEPLOYMENT_ROLE=primary` on `threadline` and `DEPLOYMENT_ROLE=mirror` on `threadlinex` before adding a database to either. Alternatively, disconnect Git from `threadlinex` (Settings → Git → Disconnect), and then threadline-fawn is the one address to watch. The consolidated steps are in `docs/OWNER_ACTIVATION_CHECKLIST.md` §0.
