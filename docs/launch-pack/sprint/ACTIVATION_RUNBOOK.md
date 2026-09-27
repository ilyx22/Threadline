# Production activation runbook

This runbook takes the live app from "database: false" to "ok", in order. It takes about 2–3 hours. Nothing here is secret. Where a value is a secret, you generate it and paste it into Vercel; it never goes in a document or a chat.

**Before you start:**
- **Baseline:** `node scripts/ops/smoke-prod.mjs https://threadline-fawn.vercel.app https://threadlinex.vercel.app` passes 6 of 10 today (26 Sept).
- **Where settings go:** every setting below goes on the Vercel project **`threadline`** → Settings → Environment Variables → **Production**, unless it says otherwise.
- **Redeploying:** after adding variables, redeploy once (Deployments → latest → Redeploy). Hobby allows 100 deploys a day, so batch your changes.

## 0. Isolate the mirror (5 min)

- In Vercel, open **`threadlinex`** → Settings → Git → **Disconnect**. That's the recommendation (D-04).
- If you keep it instead, add `DEPLOYMENT_ROLE` = `mirror` there before any secret.
- On **`threadline`**, add `DEPLOYMENT_ROLE` = `primary`.

## 1. Database (30 min)

1. Go to neon.tech, create a project in an EU region (London or Frankfurt, free tier), and name it `threadline-prod`.
2. Copy the **pooled** connection string into `DATABASE_URL` and the **direct** one into `DIRECT_URL`.
3. Under Settings → History retention, set 7 days or more (decision D-03, recommended option B).
4. From your machine, in the repo, run the migrations against the direct URL. Use a PowerShell session so the value doesn't land in your bash history:
   ```
   $env:DATABASE_URL="<direct url>"; $env:DIRECT_URL="<direct url>"; npx prisma migrate deploy
   ```
   Then check: `npx prisma migrate status` should say "Database schema is up to date".
5. Create your staff account (the demo seed refuses to run in production):
   ```
   $env:OWNER_EMAIL="you@threadlinehq.com"; $env:OWNER_NAME="Your Name"; npm run owner:create
   ```
   It asks for a password (12+ characters, hidden) and creates the internal workspace plus your super-admin account. It never overwrites anything.

## 2. Security keys (10 min)

Generate each value in a terminal, paste it straight into Vercel, and keep a copy in your password manager:

| Variable | Generate with |
| --- | --- |
| `CREDENTIAL_ENCRYPTION_KEYS` | `node -e "console.log('k1:'+require('crypto').randomBytes(32).toString('base64'))"` |
| `CRON_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | Not generated: set it to `https://threadlinehq.com` once the domain is connected (step 5), and use `https://threadline-fawn.vercel.app` until then |

**Losing `CREDENTIAL_ENCRYPTION_KEYS` makes sealed secrets unreadable. Keep it safe.**

## 3. Email (30 min)

1. In resend.com, add the domain `threadlinehq.com` (or a subdomain such as `mail.threadlinehq.com`, which is safer next to Google Workspace). Add the DNS records it shows at Namecheap. **Keep the existing MX, SPF, DKIM and DMARC records.**
2. Add these variables:
   - `EMAIL_PROVIDER` = `resend`
   - `RESEND_API_KEY` = your Resend key
   - `EMAIL_FROM` = `Threadline <hello@threadlinehq.com>`
   - `OPS_NOTIFY_EMAIL` = your inbox
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
3. Set the bucket CORS policy: allow `PUT` and `GET` from your site's origin, allow the `content-type` header, and **expose `ETag`**.
4. Leave the processing worker for later. Uploads work without it; transcripts and scans wait until you add one.

## 5. Domain (20 min)

1. In Vercel → `threadline` → Domains, add `threadlinehq.com` and `www.threadlinehq.com`.
2. At Namecheap → Advanced DNS, add exactly the A/CNAME records Vercel shows. **Don't touch the MX or TXT mail records.**
3. Once it's verified, set `NEXT_PUBLIC_APP_URL` = `https://threadlinehq.com` and redeploy.

## 6. Optional now, advised soon

| Service | Variables | Notes |
| --- | --- | --- |
| Upstash Redis | `RATE_LIMIT_STORE` = `redis`, `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN` | Shared login and form rate limits |
| Sentry | `ERROR_REPORTING_DSN` | Errors reach you |
| Anthropic | `ANTHROPIC_API_KEY` | Real AI drafting instead of labelled demo text |
| Stripe | `STRIPE_SECRET_KEY` (test mode first) and the webhook | Only if you want online payment; a manual invoice also works |

## 7. Verify (10 min)

1. Redeploy, then run `npm run smoke:prod -- https://threadlinehq.com`. **Every check should pass.**
2. Sign in, open **Account security**, enrol two-factor and save the recovery codes.
3. Admin → System: no configuration errors.
4. Send yourself a client invitation to a second address you own. The email should arrive.
5. Upload a file over 10 MB in a test workspace's Library. It should upload in parts with a progress bar.
6. Vercel → Cron Jobs → run `/api/cron/jobs` manually. It should answer `ran`.

Then tell me it's done, and I'll re-run the smoke test and read the system report with you.
