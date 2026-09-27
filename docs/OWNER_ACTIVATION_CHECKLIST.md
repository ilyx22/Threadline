# Owner activation checklist

Only the things the owner has to provide or decide. Nothing here contains a secret: where a value is secret, the checklist says where it goes, never what it is. Set every variable in **Vercel → project → Settings → Environment Variables**, scoped to **Production** (and, where noted, **Preview** with *different* values). After changing variables, redeploy, then run the checks in the last column.

Legend for "Blocks": **First client** means the first real client cannot be onboarded safely without it. **Feature** means only that feature waits.

## 0. Which project is production (do this first)

Evidence and reasoning: `docs/implementation/DEPLOYMENT_INVESTIGATION.md`. The canonical production project is **`threadline`** (https://threadline-fawn.vercel.app). `threadlinex` builds the same branch.

**Checked live on 27 September 2026:** both projects hold the same 28 variables, saved **blank** on 12 September and scoped "Production and Preview". The runtime log confirms `DATABASE_URL` resolves to an empty string. A blank value counts as unset. Edit each existing variable (⋯ → Edit), paste the value, and untick **Preview** so previews never share production secrets. Never put real values on `threadlinex`. Remove `SEED_DEMO_PASSWORD`, `SESSION_SECRET` (unused), `STORAGE_ROOT`, `JOBS_POLL_MS`, `RATE_LIMIT_FAIL_OPEN`, and the blank LinkedIn/YouTube placeholders from `threadline`.

| What | Exact setting | Where | Verify | Blocks |
| --- | --- | --- | --- | --- |
| Mark the canonical project | `DEPLOYMENT_ROLE` = `primary` (Production) | Vercel → `threadline` → Settings → Environment Variables | `/api/health` shows no DEPLOYMENT_ROLE warning | First client |
| Either make `threadlinex` a mirror … | `DEPLOYMENT_ROLE` = `mirror` (Production). Give it its own Neon branch or no database; set `PRODUCTION_DATABASE_URL` to the main branch's pooled URL so a pasted production URL is refused | Vercel → `threadlinex` → Settings → Environment Variables | `GET /api/cron/jobs` with its cron secret answers `{"skipped":"mirror deployment"}` | First client |
| … or retire it | Disconnect Git (then it stops building and stops counting against the deployment quota) | Vercel → `threadlinex` → Settings → Git | No new `threadlinex` deployments after the next push | — |
| Deployment quota | Hobby allows 100 deployments a day; the 26 September pushes exceeded it. Pro lifts it to 6,000 | Vercel → Settings → Billing | Every `main` push shows a production deployment | Decision |

Every database, cron and key setting below goes on **`threadline`**. `threadlinex` gets different values, or none.

## 1. Database (blocks everything)

| What | Why | Exact setting | Where | Verify | Cost / gate | Blocks |
| --- | --- | --- | --- | --- | --- | --- |
| A managed PostgreSQL database (Neon recommended; the code is standard PostgreSQL) | Vercel's filesystem is read-only, so nothing persists today; the app is built for PostgreSQL | Create a project in the EU (London or Frankfurt). Copy the **pooled** connection string and the **direct** one | `DATABASE_URL` = pooled URL, `DIRECT_URL` = direct URL (Production). A **separate** Neon branch for Preview | `https://<site>/api/health` shows `"database": true` | Free tier suffices for the first clients | First client |
| Run the migrations once | Applies all 31 migrations (the full schema) | Put `DIRECT_URL='<direct>'` in the git-ignored `.env.activation.local` (Next.js does not load it), then: `set -a; . ./.env.activation.local; set +a; export DATABASE_URL="$DIRECT_URL"; npm run db:deploy`. See `docs/launch-pack/sprint/ACTIVATION_RUNBOOK.md` §1 | Terminal | `npx prisma migrate status` reports "Database schema is up to date" | None | First client |
| Point-in-time recovery | Recovery from mistakes | Neon: keep history retention at 7 days or more | Neon console | `npm run db:drill` against a Neon branch passes | The Free plan's restore window is shorter than 7 days; 7+ days needs a paid plan (owner billing decision, D-03) | First client |
| Recovery objectives | How much data you can afford to lose, and how fast you must be back | Decide RPO (e.g. 24 h) and RTO (e.g. 4 h) | Tell the maintainer; recorded in TECHNICAL_HANDOFF.md | — | Decision | Advisory |

## 2. Security keys (blocks first client)

| What | Why | Exact setting | Where | Verify | Blocks |
| --- | --- | --- | --- | --- | --- |
| Credential encryption key | Seals integration tokens, webhook secrets and staff two-factor secrets; staff two-factor is enforced in production and needs it | Generate: `node -e "console.log('k1:'+require('crypto').randomBytes(32).toString('base64'))"` | `CREDENTIAL_ENCRYPTION_KEYS` (Production; a different one for Preview). Keep a copy in your password manager: losing it makes sealed secrets unreadable | `npm run env:check` shows no error for it; staff can enrol two-factor on /account | First client |
| Cron secret | Protects the scheduled job runner | Generate 32 random bytes as above (base64url) | `CRON_SECRET` (Production) | Vercel → Cron Jobs → run `/api/cron/jobs` manually; it returns `ran` | First client |
| Your own two-factor | Staff accounts must use it in production | Sign in, open **Account security**, set up an authenticator, save the recovery codes | /account | Next sign-in asks for a code | First client |
| Change the demo super admin | The seeded `ops@threadline.com` account is demo data and must not exist in production | Production is empty (the seed refuses to run there); create your real staff account and delete nothing else | — | Only real staff accounts exist | First client |

## 3. Email (blocks first client)

| What | Why | Exact setting | Where | Verify | Cost / gate | Blocks |
| --- | --- | --- | --- | --- | --- | --- |
| Resend account and a verified sending domain | Invitations, confirmations, reports; without it links are shown on screen for you to send by hand | Verify `mail.threadlinehq.com` with the DNS records Resend gives you (keep the Google Workspace MX/SPF/DKIM/DMARC) | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM="Threadline <hello@mail.threadlinehq.com>"`. The sender's domain **must** be the verified domain | Send yourself an invitation from Members; it arrives | Free tier: 3,000 emails/month | First client (manual links work meanwhile) |
| Where application alerts go | You hear about new applications | Your inbox address | `OPS_NOTIFY_EMAIL` | Submit a test application on /apply | None | Advisory |
| Resend delivery webhook | Bounces and spam complaints stop further mail to that address | In Resend → Webhooks, add `https://<site>/api/email/resend` for delivered, delivery delayed, bounced, complained; copy its signing secret | `RESEND_WEBHOOK_SECRET` | Suppressed addresses appear on Admin → System after a test bounce | Included | Advisory |

## 4. Files (blocks first client uploads)

| What | Why | Exact setting | Where | Verify | Cost / gate | Blocks |
| --- | --- | --- | --- | --- | --- | --- |
| Storage spending cap (R2 has no hard limit) | Keeps the R2 bill under a monthly budget without a capped card | Optional: `STORAGE_BUDGET_GBP` (default 50) and `STORAGE_USD_PER_GBP` (default 1.20). Uploads are refused past the derived ceiling (about 3,600 GB at £50); staff are alerted at 8 GB, 10 GB, 50% and 90% | Vercel → `threadline` → Environment Variables (Production) | Admin → Notifications show storage alerts once thresholds are crossed | None | Advisory |
| Cloudflare R2 (or any S3-compatible) bucket, private | Uploads cannot live on Vercel's disk | Create a private bucket and an API token with read/write on it only | `STORAGE_PROVIDER=s3`, `S3_BUCKET`, `S3_REGION=auto`, `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE=true` | Upload a file in Library, download it | R2 has no egress fees | First client |

| Bucket CORS for direct uploads | Large recordings go straight from the browser to the bucket in parts | In the R2 bucket's CORS policy allow `PUT` from `https://<site>` (and the other project's address if used), allowed header `content-type`, **expose header `ETag`** | R2 dashboard → bucket → Settings → CORS | Upload a file over 10 MB in the Library; it shows progress and appears | Included | First large upload |
| Processing worker (transcode, transcribe, thumbnails, malware scan) | Transcripts and scanning happen outside the app, reported back by signed callback | Choose a worker (your own small service, or a transcription provider behind one); it must accept the signed task and call `https://<site>/api/processing/callback` with the same signature | `PROCESSING_PROVIDER=webhook`, `PROCESSING_ENDPOINT`, `PROCESSING_WEBHOOK_SECRET`; `PROCESSING_SCAN=true` once it scans | A new video in the Library shows "Processing", then "Processed"; an EICAR test file is quarantined | Worker cost | Feature (scanning: advisory until you decide) |

## 5. Rate limits and monitoring

| What | Why | Exact setting | Where | Verify | Blocks |
| --- | --- | --- | --- | --- | --- |
| Upstash Redis | Login and form limits shared across serverless instances | Create a Redis database | `RATE_LIMIT_STORE=redis`, `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN` | `npm run env:check` clean | Advisory (limits are per instance without it) |
| Error tracker (Sentry or GlitchTip) | Errors reach you, not just the logs | Create a project; copy its DSN | `ERROR_REPORTING_DSN` | Trigger a test error; it appears | Advisory |

## 6. Threadline's own CRM and billing

| What | Why | Exact setting | Where | Verify | Cost / gate | Blocks |
| --- | --- | --- | --- | --- | --- | --- |
| Attio API key | Won deals, companies, people and renewals mirror into your CRM | Attio → Workspace settings → Developers → create an access token with record read/write | `ATTIO_API_KEY`; if your deal stages are not Attio's defaults, `ATTIO_STAGE_MAP` as JSON, e.g. `{"won":"Closed won"}` | Convert a test application; /admin/system shows the CRM backlog empty | Attio plan | Feature |
| Stripe (test mode) | Invoices through Stripe, payments recorded automatically | Test secret key (`sk_test_…`) and a webhook endpoint at `https://<site>/api/billing/stripe` for `invoice.paid`, `charge.refunded`, `charge.dispute.created` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Issue a test invoice with billing set to Stripe; pay it with a test card; it shows paid | Live mode is a separate decision; this build refuses live keys | Feature (manual invoicing works without it) |
| Invoice terms and offer defaults | The standard offer is £2,500 setup plus £2,500 per 28 days for three periods (£10,000); payment terms 14 days | Confirm or change | Tell the maintainer, or edit per client on the engagement | — | Decision | First client |
| Agreements | Services agreement, order form and DPA | Your documents | Record each signed version on the client's admin page (Billing → Signed agreements) | — | Legal | First client |

## 7. Social platforms (each is a feature)

| Platform | What you need | Settings | Gate |
| --- | --- | --- | --- |
| LinkedIn | A LinkedIn developer app; Community Management API access for posting as a person/page | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`; redirect URL `https://<site>/api/oauth/linkedin/callback` | LinkedIn review |
| YouTube | Google Cloud project with YouTube Data API and a verified OAuth consent screen | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`; redirect `…/api/oauth/youtube/callback` | Google verification |
| Instagram | Meta app with Instagram Graph API | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | Meta app review |
| TikTok | TikTok developer app with Content Posting API | `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`; `TIKTOK_APP_AUDITED=true` only after audit | TikTok audit |
| X | X developer app | `X_CLIENT_ID`, `X_CLIENT_SECRET` | Paid API tier for posting |
| Facebook Page | Meta app with Pages permissions (built; publishes to the first Page the person manages, with the Page's own token) | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`; redirect `…/api/oauth/facebook/callback` | Meta App Review (pages_manage_posts, pages_read_engagement, read_insights) + business verification |
| Threads | Threads app (built) | `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`; redirect `…/api/oauth/threads/callback` | Meta App Review (threads_content_publish, threads_manage_insights) |

One Meta business verification covers Instagram, Facebook and Threads; submit the three permission sets together.

**Timely scheduled publishing.** Connected platforms publish from the job queue at the scheduled time only if something calls `/api/cron/jobs` often (every 5 to 15 minutes, with `Authorization: Bearer <CRON_SECRET>`), from an external scheduler or Vercel Pro cron. On Hobby it runs once a day.

Until a platform is approved, publishing is manual: approved packages are posted by hand and the URL recorded; numbers come in by CSV import on the Performance page.

## 8. AI

| What | Setting | Blocks |
| --- | --- | --- |
| Anthropic API key | `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`); without it generation runs in clearly labelled demo mode | Feature |
| Model prices for cost tracking | `AI_PRICE_INPUT_PER_MTOK`, `AI_PRICE_OUTPUT_PER_MTOK` in US dollars per million tokens, from your Anthropic pricing page | Advisory |
| Monthly AI budget per client | Set on request (stored per workspace) | Advisory |

## 9. Business and legal decisions

| Decision | Why it matters | Blocks |
| --- | --- | --- |
| Substantiation of the public "100m+ views" and "10,000+ conversions" figures | The site states them; you need evidence you could show on request, and what "conversions" means | Commercial readiness |
| Legal entity, company number, registered address, privacy contact | The privacy, terms and cookies pages have these sections hidden until provided | First client |
| Retention periods | How long client data is kept after an engagement ends (default in the offboarding form: 30-day export window, then 90 days) | First client |
| Lawful basis for the tracked-link visitor cookie | Until decided, clicks count but no visitor cookie is set; set `TRACKED_LINK_VISITOR_COOKIE=lawful-basis-documented` only after deciding | Feature |
| Custom domain | The site runs on `threadline-fawn.vercel.app` and `threadlinex.vercel.app`; set `NEXT_PUBLIC_APP_URL` to the final domain once attached | Advisory |
| Vercel plan | Hobby allows one scheduled run per day and 100 deployments a day (exceeded on 26 September; see `docs/implementation/DEPLOYMENT_INVESTIGATION.md`). Pro allows frequent runs and 6,000 deployments a day | Advisory |
| Processing worker | Which service transcodes, transcribes and scans files (FILE-05, FILE-03) | Feature |
| Capacity | Hours each operator and editor is available per week, so recorded time can become capacity alerts (CAP-01) | Advisory |
| Recovery objectives | RPO and RTO (INF-09) | First client |

## 10. After setting everything

1. Redeploy production from `main`.
2. Visit `/api/health`: `status` should be `ok`.
3. Sign in, open **Admin → System**: the configuration card should list no errors.
4. Run one test application through to an accepted invitation with a colleague's address you control.

## 11. Launch decisions and asset review (updated 26 September 2026)

- Decisions with sources, recommendations and dependencies: `docs/launch-pack/OWNER_DECISIONS.md` (D-01…D-09).
- What to review: `docs/launch-pack/REVIEW_INDEX.md`.
- Nothing here is secret.

**Live facts (26 Sept):**
- threadlinex serves the same build but is inert: no database, and cron answers 503 without its secret.
- threadlinehq.com has Google mail DNS and DMARC, but no web record.
- The Calendly "Founder Research — 20 mins" event is recorded live in Drive.

| What | Exact action | Where | Verify | Blocks |
| --- | --- | --- | --- | --- |
| Retire the mirror (D-04) | Settings → Git → Disconnect on project `threadlinex`. If you keep it instead, add `DEPLOYMENT_ROLE`=`mirror` there **before** any secret | Vercel | No new threadlinex deployments after the next push; or `/api/cron/jobs` on it answers `{"skipped":"mirror deployment"}` once it has a cron secret | Safe configuration |
| Mark the primary | `DEPLOYMENT_ROLE`=`primary` (Production) on `threadline` | Vercel → threadline → Environment Variables | `/api/health` shows no role warning | First client |
| Canonical domain (D-02) | Add `threadlinehq.com` and `www` to project `threadline`, then create the A/CNAME records Vercel shows at Namecheap. Keep the existing MX, SPF, DKIM and DMARC records | Vercel → Domains; Namecheap → Advanced DNS | `https://threadlinehq.com/api/health` answers with commit and status | Content CTAs, signatures |
| Booking links (D-02) | Copy the Calendly "Founder Research — 20 mins" link into the outreach placeholders `{{research_booking_link}}`. Create a "Diagnosis call" event (45 minutes proposed) with booking questions, and set its link as `NEXT_PUBLIC_BOOKING_URL` (threadline only) | Calendly; Vercel | The apply page shows the booking link after a redeploy | Send-ready outreach |
| Asset review | Work through `docs/launch-pack/REVIEW_INDEX.md`. In `/admin/scripts` (once the database exists), **Import canonical drafts**, then approve library A–M | Drive launch-pack folder; the app | Each item's status changes from READY FOR OWNER REVIEW to APPROVED in the manifest | First client |
| Owner dry run | Run `docs/launch-pack/operations/OWNER_DRY_RUN.md` | Local or primary | `DRY_RUN_RESULTS_<date>.md` written | First client |
