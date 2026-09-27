# Production activation runbook

This runbook takes the live app from "database: false" to "ok", in order. It takes about 2–3 hours. Nothing here is secret. Where a value is a secret, you generate it and paste it into Vercel; it never goes in a document or a chat.

**Before you start:**
- **Baseline (27 Sept, checked live):** `npm run smoke:prod` passes **5 of 9** on `threadline-fawn.vercel.app`. The target is 9 of 9.
- **Where settings go:** every setting below goes on the Vercel project **`threadline`** → Settings → Environment Variables, with the environment set to **Production only** (untick Preview) and **Sensitive** ticked for secrets, unless it says otherwise.
- **Most variables already exist, but blank.** 28 variables were saved empty on 12 September and are scoped "Production and Preview" (on `threadlinex` too). For each one below: open **⋯ → Edit**, paste the value, untick **Preview**, save. Only add a variable when it is not in the list. A blank value counts as unset.
- **Delete these leftovers** on `threadline` (⋯ → Remove): `SEED_DEMO_PASSWORD`, `SESSION_SECRET` (unused), `STORAGE_ROOT` and `JOBS_POLL_MS` (local-only), `RATE_LIMIT_FAIL_OPEN`, and the blank `LINKEDIN_*` / `YOUTUBE_*` placeholders until those apps exist.
- **Redeploying:** after adding variables, redeploy once (Deployments → latest → Redeploy). Hobby allows 100 deploys a day, so batch your changes.

## 0. Isolate the mirror (5 min)

- In Vercel, open **`threadlinex`** → Settings → Git → **Disconnect**. That's the recommendation (D-04).
- If you keep it instead, add `DEPLOYMENT_ROLE` = `mirror` there before any secret.
- On **`threadline`**, add `DEPLOYMENT_ROLE` = `primary`.

## 1. Database (30 min)

1. Sign in at console.neon.tech and check the project list first. Don't create a second production database if one exists. Otherwise create a project named `threadline-prod` in **AWS Europe (London)**.
2. In the project, click **Connect**. With **Connection pooling** on, copy the string into `DATABASE_URL` (edit the existing blank one). Turn pooling off and copy the direct string into a new `DIRECT_URL`. Both Production only.
3. Retention (decision D-03): the Free plan caps the restore window below 7 days, so 7 days or more needs a paid plan. That is a billing decision for you.
4. Migrations, from your machine. The direct string goes in a git-ignored file that Next.js does **not** load, so no local build can reach production:
   - Create `.env.activation.local` in the repo root with one line: `DIRECT_URL='<direct string>'`. The single quotes are needed because the string contains `&`.
   - Then run, in Git Bash:
     ```
     set -a; . ./.env.activation.local; set +a; export DATABASE_URL="$DIRECT_URL"; npm run db:deploy; npx prisma migrate status
     ```
   - `migrate status` should say "Database schema is up to date" (31 migrations).
5. Create your staff account in the same shell (the demo seed refuses to run in production):
   ```
   OWNER_EMAIL="you@threadlinehq.com" OWNER_NAME="Your Name" npm run owner:create
   ```
   It asks for a password (12+ characters, hidden) and creates the internal workspace plus your super-admin account. It never overwrites anything.
6. Delete `.env.activation.local` when activation is finished.

## 2. Security keys (10 min)

Generate each value in a terminal, paste it straight into Vercel, and keep a copy in your password manager:

| Variable | Generate with |
| --- | --- |
| `CREDENTIAL_ENCRYPTION_KEYS` | `node -e "console.log('k1:'+require('crypto').randomBytes(32).toString('base64'))"` |
| `CRON_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` (at least 16 characters) |
| `DEPLOYMENT_ROLE` | Not generated: `primary` |
| `NEXT_PUBLIC_APP_URL` | Not generated: set it to `https://threadlinehq.com` once the domain is connected (step 5), and use `https://threadline-fawn.vercel.app` until then |

**Losing `CREDENTIAL_ENCRYPTION_KEYS` makes sealed secrets unreadable. Keep it safe.** It must be set **before your first sign-in**, because staff two-factor stores its secret with it.

## 3. Email (30 min)

1. In resend.com, add the domain **`mail.threadlinehq.com`**. A subdomain keeps app email separate from your Google Workspace mail on the root domain. Add the DNS records it shows at Namecheap. **Keep the existing MX, SPF, DKIM and DMARC records.**
2. Set these variables. **The sender must use the domain you verified**, or Resend refuses to send:
   - `EMAIL_PROVIDER` = `resend`
   - `RESEND_API_KEY` = your Resend key
   - `EMAIL_FROM` = `Threadline <hello@mail.threadlinehq.com>`
   - `OPS_NOTIFY_EMAIL` = your inbox (new variable)
   - `EMAIL_REPLY_TO` = a real Google Workspace inbox, e.g. `hello@threadlinehq.com` (new variable). `mail.threadlinehq.com` sends only and has no mailbox, so without this, client replies bounce
   - Email is only a *warning* on the health check, but invitations never arrive without it, so it's required for the journey test.
3. In Resend → Webhooks, add `https://<site>/api/email/resend` for delivered, delayed, bounced and complained, then put its signing secret in `RESEND_WEBHOOK_SECRET`.

## 4. Files (30 min)

1. In Cloudflare R2, create a **private** bucket `threadline-prod`, then an API token with read/write on that bucket only.
2. Add these variables:
   - `STORAGE_PROVIDER` = `s3`
   - `S3_BUCKET`
   - `S3_REGION` = `auto`
   - `S3_ENDPOINT` = `https://<account>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_FORCE_PATH_STYLE` = `true`
3. Set the bucket CORS policy: allow `PUT` and `GET` from your site's origin, allow the `content-type` header, and **expose `ETag`**.
4. **Spending cap.** R2 has no hard limit, so Threadline enforces one itself (owner decision, 27 Sept):
   - `STORAGE_BUDGET_GBP` (optional, default `50`) is the most you will pay R2 a month. The app turns it into a storage ceiling: £50 is about 3,600 GB, after a 10% safety margin and a conservative exchange rate (`STORAGE_USD_PER_GBP`, default 1.20).
   - New uploads are refused past the ceiling. Data exports are never blocked.
   - The daily job alerts staff (in-app, and by email to `OPS_NOTIFY_EMAIL`) once a month per threshold: at 8 GB, when the free 10 GB is passed, at half the budget, and at 90%.
   - Also add a Cloudflare lifecycle rule that aborts unfinished multipart uploads after 1 day.
5. Leave the processing worker for later. Uploads work without it; transcripts and scans wait until you add one.

## 5. Domain (20 min)

1. In Vercel → `threadline` → Domains, add `threadlinehq.com` and `www.threadlinehq.com`.
2. At Namecheap → Advanced DNS, add exactly the A/CNAME records Vercel shows. **Don't touch the MX or TXT mail records.**
3. Once it's verified, set `NEXT_PUBLIC_APP_URL` = `https://threadlinehq.com` and redeploy.

## 6. Optional now, advised soon

| Service | Variables | Notes |
| --- | --- | --- |
| Upstash Redis | `RATE_LIMIT_STORE` = `redis`, `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN` | Shared login and form rate limits |
| Sentry | `ERROR_REPORTING_DSN` | Errors reach you |
| Uptime monitor (free, e.g. UptimeRobot) | none | Watch `https://<site>/api/health`: it returns 200 only when the database answers |
| Anthropic | `ANTHROPIC_API_KEY` | Real AI drafting instead of labelled demo text |
| Stripe | `STRIPE_SECRET_KEY` (test mode first) and the webhook | Only if you want online payment; a manual invoice also works |

## 7. Verify (10 min)

1. Redeploy **once**. The pending code fix (the commit after `e39748d`) is pushed at this point, and the push itself is the redeploy. Then run `npm run smoke:prod` (and `-- https://threadlinehq.com` once the domain is live). **All 9 checks should pass.**
2. Sign in, open **Account security**, enrol two-factor and save the recovery codes.
3. Admin → System: no configuration errors.
4. Send yourself a client invitation to a second address you own. The email should arrive.
5. Upload a file over 10 MB in a test workspace's Library. It should upload in parts with a progress bar.
6. Vercel → Cron Jobs → run `/api/cron/jobs` manually. It should answer `ran`.

Then tell me it's done, and I'll re-run the smoke test and read the system report with you.
