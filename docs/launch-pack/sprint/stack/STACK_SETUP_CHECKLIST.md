# Stack setup checklist (owner)

Work top to bottom; the order is deliberate. Prices were checked on 26 September 2026 and are cited in `STACK.md`.

- Items marked **£ PAID: owner approval** cost money. Nothing has been bought or signed up for.
- Secrets go only into Vercel → `threadline` → Settings → Environment Variables (Production), never into docs or chat.
- The detailed variable-by-variable steps are in `docs/OWNER_ACTIVATION_CHECKLIST.md` and `docs/launch-pack/sprint/ACTIVATION_RUNBOOK.md`. This list sequences the whole stack around them.

---

## Phase 0: decisions (15 minutes)

- [ ] **D1. Warm-up.**
  - Choose **one** warm-up per mailbox. Recommended: Smartlead's own warm-up, with **no Lemwarm** (STACK.md §b).
  - If the two domains are already being warmed by a tool, name that tool and keep it running until sending has moved across.
- [ ] **D2. Confirm the sending domains.**
  - Confirm that the two warmed domains are **secondary** domains, not `threadlinehq.com`.
  - Confirm how many mailboxes exist on each. The target is 2 per domain.
- [ ] **D3. Hosting plan.**
  - Approve the move to Vercel Pro. Vercel describes Hobby as personal, non-commercial use, and Hobby is capped at 100 deploys a day.
  - Decide whether to retire the `threadlinex` mirror (D-04).
- [ ] **D4. Legal details for the public site.**
  - Legal entity, company number, registered address, privacy contact.
  - Needed by: TikTok, Meta, Google and LinkedIn reviews, the PECR/GDPR notices and the CAN-SPAM postal address.

## Phase 1: app foundations (day 1)

| # | Do | Verify | Paid? |
|---|---|---|---|
| 1 | Vercel: upgrade the team to **Pro**. Set `DEPLOYMENT_ROLE=primary` on `threadline`. Retire or mirror `threadlinex`. | `/api/health` shows no role warning; a `main` push deploys | **£ PAID: owner approval** ($20 a month) |
| 2 | Neon: create an EU project (London or Frankfurt), plus a separate Preview branch. Set `DATABASE_URL` (pooled) and `DIRECT_URL`. Run `npx prisma migrate deploy`. **Move to the Launch plan before real client data**, for the 7-day restore window. | `/api/health` → `"database": true`; `prisma migrate status` up to date | Free now; **£ PAID: owner approval** on Launch (metered) |
| 3 | Security keys: set `CREDENTIAL_ENCRYPTION_KEYS` and `CRON_SECRET`; set up your own 2FA | The cron run returns `ran`; sign-in asks for a code | Free |
| 4 | Connect `threadlinehq.com` to Vercel. Set `NEXT_PUBLIC_APP_URL=https://threadlinehq.com`. **Keep the existing MX, SPF, DKIM and DMARC records.** | The site loads on the domain; OAuth redirect URIs use it | Free |
| 5 | Resend: verify `mail.threadlinehq.com` (the subdomain is safer next to Workspace). Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `OPS_NOTIFY_EMAIL`. Add the webhook → `RESEND_WEBHOOK_SECRET`. | A test invitation arrives; a test bounce appears in the suppression list | Free (100 a day) |
| 6 | Cloudflare R2: create a private bucket and a scoped token. Set the `S3_*` variables. Add CORS (PUT from the site, expose `ETag`). | Upload and download a file over 10 MB | Free tier |
| 7 | Upstash Redis → `RATE_LIMIT_*` variables | `npm run env:check` is clean | Free tier |
| 8 | Sentry Developer → `ERROR_REPORTING_DSN` | A test error appears | Free |

## Phase 2: outreach infrastructure (day 1–2; runs in parallel with Phase 1)

| # | Do | Verify | Paid? |
|---|---|---|---|
| 9 | DNS on **both** sending domains: SPF (one record only), DKIM 2048-bit, DMARC `p=none` with `rua` reporting to start; also check `threadlinehq.com` | An external checker (e.g. MXToolbox) shows pass; a Gmail "Show original" shows SPF, DKIM and DMARC all PASS and aligned | Free |
| 10 | Google Postmaster Tools: add both sending domains | Domains verified | Free |
| 11 | Mailboxes: 2 per sending domain (4 total), with real, truthful names and signatures that include the postal address | Each can send and receive | **£ PAID: owner approval** (Workspace Business Starter £5.90 per user a month as displayed; confirm Flexible or Annual) if any are new |
| 12 | Smartlead Base: connect the 4 mailboxes. Turn on Smartlead warm-up **only if D1 chose it**. Set sending limits: 25 a day per mailbox and 50 a day per domain, ramping from 20 a day if a domain is new to cold email. Add the custom tracking domain only if tracking is needed; the plan keeps open tracking **off**. Route replies to one monitored inbox. | The warm-up dashboard is healthy; a test campaign to seed inboxes lands in the primary tab | **£ PAID: owner approval** ($39 a month; first-month discount advertised) |
| 12b | **Only if D1 chose Lemwarm instead:** turn Smartlead warm-up **off** on those mailboxes first, then connect Lemwarm Essential | Only one warm-up network per mailbox | **£ PAID: owner approval** ($29 per mailbox a month) |
| 13 | MillionVerifier: buy 50k credits (they never expire) | A test list verifies | **£ PAID: owner approval** ($89 one-off) |

## Phase 3: lead data, CRM, booking (day 2)

| # | Do | Verify | Paid? |
|---|---|---|---|
| 14 | Apollo: start on Free. Upgrade to Basic only if the first 3 segment pulls need more credits. **Confirm the price in-app; it is unverified.** | Segment counts recorded; they become the addressable-list figures in LEAD_GEN_SYSTEM §6.3 | Free, then **£ PAID: owner approval** (~$59 a month, unverified) |
| 15 | Companies House: use the free web search for the legal-form check. Register an API key only if the maintainer automates the check. | Every UK row has `legal_form` | Free |
| 16 | Sales Navigator Core: **free trial** when A-tier research starts. Decide by day 25 of the trial whether to keep it. | Saved lead lists per segment | Trial free, then **£ PAID: owner approval** ($119.99 a month) |
| 17 | Attio: create a token with record read/write → `ATTIO_API_KEY` (+ `ATTIO_STAGE_MAP` if your stages differ). Stay on Free (3 seats, API included). | A test won deal mirrors | Free |
| 18 | Calendly: upgrade to **Standard**. Keep "Founder Research — 20 mins". Create "Diagnosis call" (45 min) with booking questions. Turn on email reminders at 24 h and 1 h. Put the research link in `{{research_booking_link}}` and set `NEXT_PUBLIC_BOOKING_URL` to the diagnosis link. | A test booking sends the confirmation and both reminders | **£ PAID: owner approval** ($10 a month); needed for a second event type |

## Phase 4: payments and AI (before the first client)

| # | Do | Verify | Paid? |
|---|---|---|---|
| 19 | Stripe **test mode** → `STRIPE_SECRET_KEY` (`sk_test_`), webhook at `/api/billing/stripe` → `STRIPE_WEBHOOK_SECRET` | A test invoice is recorded as paid | Fees per payment only |
| 20 | Anthropic: create a dedicated key **with a monthly spend limit** → `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`; set `AI_PRICE_*` from the pricing page | Generation leaves demo mode; cost records appear | **£ PAID: owner approval** (usage; set a cap) |
| 21 | Transcription worker: choose AssemblyAI (recommended) or Deepgram; the maintainer wires `PROCESSING_*` | A test video goes Processing → Processed | Free credits first |

## Phase 5: platform applications (start the clocks; see `TIKTOK_API_APPLICATION.md`)

- [ ] 22. **Before** any review: the site shows the privacy and terms links without opening a menu, with the legal entity filled in (D4).
- [ ] 23. **LinkedIn:**
  - create the app under a Threadline company Page;
  - add Share on LinkedIn;
  - redirect `https://threadlinehq.com/api/oauth/linkedin/callback`;
  - **ask the maintainer to update `LinkedIn-Version` from 202409 to 202609 first.**
- [ ] 24. **Meta:** start Business Verification in Business Manager (document-driven), then create the app.
- [ ] 25. **Google:**
  - Cloud project; YouTube Data API;
  - consent screen;
  - Search Console domain verification;
  - sensitive-scope verification (3–5 business days);
  - then the YouTube audit form (uploads stay private until it passes).
- [ ] 26. **TikTok:**
  - organisation → app → Login Kit + Content Posting (Direct Post) (+ Display API);
  - redirect `https://threadlinehq.com/api/oauth/tiktok/callback`;
  - verify the media domain;
  - **ask the maintainer to fix the Direct Post UX gaps (§6) before recording the demo;**
  - sandbox test with a private account → app review → Content Posting audit;
  - set `TIKTOK_APP_AUDITED=true` only after the audit passes.
- [ ] 27. **X:** only when a client needs it. Pay-per-use: **£ PAID: owner approval**, $0.015 per post and $0.20 per post with a URL.
- [ ] 28. LinkedIn Community Management API: only once the legal entity, company Page super admin and business email are all in place, because a rejection means building a new app.

## Phase 6: content tools (when the first recording is booked)

| # | Do | Paid? |
|---|---|---|
| 29 | Riverside Pro for remote founder recordings | **£ PAID: owner approval** ($24–29 a month) |
| 30 | Descript (editing) **or** OpusClip (clipping); start with one | **£ PAID: owner approval** (from $15–24 a month) |
| 31 | Metricool Starter as the publishing and analytics bridge while the API reviews run; **do not also buy Buffer** | **£ PAID: owner approval** ($20–36 a month) |

## Phase 7: go or no-go for the first send

- [ ] Seed test (Gmail and Outlook) lands in the inbox; postal address and opt-out are present in every step (C0).
- [ ] The dedupe ran against the research list, the admin prospects list and the suppression list.
- [ ] Every UK row is Ltd, PLC, LLP or Scottish partnership. Sole traders are excluded from email.
- [ ] The Legitimate Interests Assessment and the privacy notice (with the Art. 14 source line) are published.
- [ ] The reply-handling rule (positives answered within 1 business hour) and the Friday control loop are on the calendar.
- [ ] The first-300 test starts at 40 first touches a day (`../emails/TEST_PLAN.md`).

**Week-1 paid total if everything recommended is approved:** about $128–143 plus £23.60 a month, plus $89 one-off, plus API usage (STACK.md). The lean variant, without Apollo Basic, is about $69–84 plus £23.60 a month.
