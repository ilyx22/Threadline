# Threadline tool and API stack

Written 26 September 2026. Every price below was checked on that date against the vendor's own pricing page or documentation unless the row says **unverified**. Prices change often, so re-check before paying. Nothing has been bought, signed up for or applied for.

**How to read the tables**

- **When:**
  - **Now** means week 1, before the first send or first client.
  - **Soon** means before or at the first client.
  - **Later** means after the first client, or once volume proves the need.
- **API / approval:** the external gate, if there is one.
- **Env var:** the variable the app reads. Names come from `.env.example`, `src/lib/env.ts` and `docs/OWNER_ACTIVATION_CHECKLIST.md`. A dash means the tool sits outside the app.
- **Order:** the setup sequence used in `STACK_SETUP_CHECKLIST.md`.

**Doctrine that shapes every choice** (MASTER_BLUEPRINT §37, `docs/PLATFORM_APPLICATIONS.md`):

- Automate publishing through official rails. Do not automate human social behaviour.
- No rented or fake accounts.
- No LinkedIn automation tools of any kind, including connection, message, visit or scrape extensions.
- Buy the smallest stack that covers the launch needs. Do not buy two tools that do the same job (for example Metricool and Buffer, or Smartlead warm-up and Lemwarm on the same mailbox).

---

## (a) App infrastructure

| Tool | What it is for | When | Current price tier (checked 2026-09-26) | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Vercel** | Hosting for the Next.js app, cron and preview builds | **Now: upgrade to Pro** | Hobby is $0 but **"for personal, non-commercial use"** ([pricing FAQ](https://vercel.com/pricing)). Pro is $20/month per team and includes $20 of usage credit ([pricing](https://vercel.com/pricing)). Deployments per day: Hobby 100, Pro 6,000; Hobby is also capped at 100 per hour and 60 per 5 minutes ([limits](https://vercel.com/docs/limits)). | None | `DEPLOYMENT_ROLE`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` | 1 |
| **Neon Postgres** | The production database (97 tables) | **Now** | Free: $0, 0.5 GB per project, 100 CU-hours, **6-hour restore window**. Launch: pay-as-you-go at $0.106 per CU-hour plus $0.35 per GB-month, no minimum, restore window up to 7 days. Scale: $0.222 per CU-hour, up to 30 days ([pricing](https://neon.com/pricing)). | None | `DATABASE_URL` (pooled), `DIRECT_URL` | 2 |
| **Resend** | Transactional email from the app (invitations, reports, reminders). **Not cold email.** | **Now** | Free: 3,000 a month, **100 a day**, 3 domains. Pro: $20 a month for 50,000, no daily cap ([pricing](https://resend.com/pricing)). | Domain DNS verification | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`, `OPS_NOTIFY_EMAIL` | 4 |
| **Cloudflare R2** | Private file storage for uploads and recordings | **Now** | Free tier: 10 GB-month, 1M Class A and 10M Class B operations. Beyond that $0.015 per GB-month. **Egress is free** ([pricing](https://developers.cloudflare.com/r2/pricing/)). | None. A TikTok *pull-from-URL* post needs a verified domain, so add a custom domain later (see the TikTok doc). | `STORAGE_PROVIDER=s3`, `S3_BUCKET`, `S3_REGION=auto`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE=true` | 5 |
| **Upstash Redis** | Shared rate limits across serverless instances | Soon | Free: 256 MB and 500K commands a month. Pay-as-you-go: $0.2 per 100K commands. Fixed plans from $10 a month ([pricing](https://upstash.com/pricing/redis)). | None | `RATE_LIMIT_STORE=redis`, `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN` | 6 |
| **Sentry** | Error tracking | Soon | Developer: $0, 1 user, 5,000 errors a month. Team: $26 a month billed annually, 50,000 errors ([pricing](https://sentry.io/pricing/)). | None | `ERROR_REPORTING_DSN` | 7 |
| **Stripe** | Invoices and payments for £2,500 setup plus £2,500 every 4 weeks | Soon (test mode now) | No monthly fee. Standard UK cards cost 1.5% + 20p, premium UK cards 2.8% + 20p, EEA cards 2.5% + 20p and international cards 3.15% + 20p, plus 2% for currency conversion. Disputes cost £20 ([UK pricing](https://stripe.com/gb/pricing)). One £2,500 invoice paid by a standard UK card costs about £37.70. **Unverified:** Stripe Invoicing and Bacs Direct Debit fees were not on the page fetched, so check them in the dashboard. | Account verification (KYC) | `STRIPE_SECRET_KEY` (test `sk_test_` only; the app refuses live keys), `STRIPE_WEBHOOK_SECRET` | 8 |
| **Anthropic API** | Drafting, judging and Brand Brain generation | Soon | Per million tokens (input / output): Opus 5.5 $4 / $20, Sonnet 5 $2 / $10, Haiku 4.5 $1 / $5. Batch processing is 50% off ([pricing](https://claude.com/pricing)). | API key with a spend limit | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_PRICE_INPUT_PER_MTOK`, `AI_PRICE_OUTPUT_PER_MTOK` | 9 |
| **Transcription (processing worker)**: pick one | Transcribe founder recordings; the app calls a worker through a signed contract | Soon (before the first recording) | **AssemblyAI:** Universal-2 $0.15 an hour, Universal-3.5 Pro $0.21 an hour, diarisation +$0.02 an hour, $50 free credit ([pricing](https://www.assemblyai.com/pricing)). **Deepgram:** Nova-3 pre-recorded $0.0043 a minute ($0.26 an hour) pay-as-you-go, $200 free credit ([pricing](https://deepgram.com/pricing)). **OpenAI:** the pricing page shows transcription models at $0.003–$0.017 a minute; exact per-model rates were not captured ([pricing](https://developers.openai.com/api/docs/pricing)). | API key. The worker itself is a small service you run, or one hosted behind a provider. | `PROCESSING_PROVIDER=webhook`, `PROCESSING_ENDPOINT`, `PROCESSING_WEBHOOK_SECRET`, `PROCESSING_SCAN` | 10 |

**Transcription choice.** AssemblyAI is the cheapest per hour with diarisation, and its $50 credit covers roughly 300 hours at Universal-2. Deepgram is the fallback. At Threadline's volume (a few hours of founder audio per client per month) the cost is pennies, so choose on transcript quality for British accents and on diarisation.

**Vercel note.**
- The Hobby deployment cap stopped production deploys for seven hours on 26 September (`docs/TECHNICAL_HANDOFF.md` §8). Pro lifts the cap to 6,000 a day.
- The more important reason to move to Pro is that Vercel describes Hobby as **personal, non-commercial use**. Threadline is commercial.
- Pro also keeps runtime logs for 1 day instead of 1 hour ([limits](https://vercel.com/docs/limits)).
- Retiring `threadlinex` (checklist D-04) halves the deploy count either way.

**Neon note.** The activation checklist asks for 7 days or more of history. That is the **Launch** plan's window; Free restores only 6 hours back. Start on Free for setup. Move to Launch before the first client's data exists.

---

## (b) Outreach and deliverability

| Tool | What it is for | When | Current price tier (checked 2026-09-26) | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Smartlead** (recommended sender) | Cold-email sequences across several mailboxes, unified inbox, built-in warm-up | **Now** | Base: $39 a month, 2,000 contacts, 6,000 sends a month, 2,000 verified emails a month, unlimited mailboxes. Pro: $94 a month, 30,000 contacts, 90,000 sends. Unlimited Smart: $174 a month ([pricing](https://www.smartlead.ai/pricing)). The pricing table marks "unlimited warmup" only on Smart and above. Smartlead's help centre says **Base has warm-up through the "Foundation Pool"**, and Pro gets the better "Growth Pool" ([help](https://helpcenter.smartlead.ai/en/articles/438-understand-your-warmup-pool-and-upgrade-eligibility)). | API on all plans (not needed by the app today) | — | 11 |
| **Instantly** (alternative sender) | Same job | Only if Smartlead is rejected | Growth: $47 a month, 1,000 contacts, 5,000 emails a month, unlimited accounts and warm-up. Hypergrowth: $97 a month ([pricing](https://instantly.ai/pricing)). | — | — | — |
| **Lemwarm** | A warm-up network only. It does not send campaigns. | Only if you choose it **instead of** Smartlead warm-up (see below) | Essential: $29 per mailbox a month ($24 billed yearly). Smart: $49 per mailbox ($40 billed yearly). Included free with lemlist plans ([lemwarm.com](https://www.lemwarm.com/)). lemlist's guide: ramp up, then 14 days of stabilisation with no cold sends, then 30–40 cold a day plus 10 warm-up a day, with an **"absolute ceiling" under 70 a day per mailbox** ([lemlist help](http://help.lemlist.com/en/articles/14653207-how-to-set-up-and-use-lemwarm)). | — | — | (11b) |
| **Google Workspace mailboxes** on the two secondary sending domains | Real mailboxes that Smartlead sends from | **Now** | Business Starter: £5.90 per user a month. Business Standard: £11.80. New customers get a promotional rate ([pricing](https://workspace.google.com/pricing?hl=en_GB)). **Check at checkout** whether the price shown is Flexible or Annual. | — | — | 3 |
| **DNS authentication** (SPF, DKIM 2048-bit, DMARC with `rua`) on both sending domains and on `threadlinehq.com` | Inbox placement; required by Gmail and Outlook | **Now** (verify, not buy) | Free. Gmail: every sender needs SPF or DKIM. Senders of more than 5,000 a day need all three plus one-click unsubscribe. Keep spam rate below 0.10% and **never reach 0.30%** ([Google](https://support.google.com/a/answer/81126)). Outlook has required SPF, DKIM and DMARC for senders of more than 5,000 a day since 5 May 2025 ([Microsoft](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)). At 100 a day you are below both thresholds, but set all three anyway. | Registrar DNS (Namecheap) | — | 3 |
| **Google Postmaster Tools** | Domain reputation and spam-rate dashboard for Gmail recipients | **Now** | Free | DNS TXT verification | — | 3 |
| **MillionVerifier** (recommended verifier) | Second verification pass within 7 days of sending (`emails/BULK_LIST_FILTER_SPEC.md` §4) | **Now** | 50,000 credits for $89. Credits never expire. 100 free ([site](https://www.millionverifier.com/)). Prices for smaller packs were not shown. | — | — | 12 |
| **ZeroBounce** (alternative) | Same job, plus inbox-placement tests | Optional | Pay-as-you-go from $39 for 2,000. Free plan: 100 credits a month ([pricing](https://www.zerobounce.net/email-validation-pricing)). | — | — | — |
| **NeverBounce** (alternative) | Same job | — | **Unverified.** The pricing page returned 403. | — | — | — |

### Lemwarm and the sender's own warm-up: do not double-warm

A warm-up network sends and receives automated emails from your mailbox and marks them as important. **Smartlead has its own network (Foundation Pool on Base). Lemwarm is a second, separate network.** If both run on the same mailbox:

- the warm-up volumes add together;
- lemlist puts the total ceiling (cold, warm-up and manual replies together) at under 70 a day per mailbox, so 25 cold plus two warm-up streams can breach it;
- neither dashboard shows the other's traffic, so the numbers you read are wrong;
- two networks create two sets of filter labels and auto-replies in the mailbox.

Neither vendor documents running both together; lemlist's guide covers lemwarm only with lemlist. Treat running both as unsupported.

**Pick exactly one warm-up per mailbox:**

| Option | Sender | Warm-up | Monthly cost for 4 mailboxes | Use when |
|---|---|---|---|---|
| **A (recommended)** | Smartlead Base | Smartlead warm-up on; **no Lemwarm** | $39 | Cheapest. One dashboard. This is what the blueprint's "do not pay a second warm-up SaaS" means. |
| B | Smartlead Base | Smartlead warm-up **off**; Lemwarm Essential on each mailbox | $39 + 4 × $29 = $155 | Only if you already paid for Lemwarm or strongly prefer its network |
| C | lemlist Email plan (from $55 a month, [pricing](https://www.lemlist.com/pricing)) | Lemwarm Essential included | from $55 | Only if you would rather send from lemlist than from Smartlead |

**If your two domains are already warmed by a tool, keep that tool running.** Switching abruptly resets the pattern the providers have learned. Move sending into the new tool first, then retire the old warm-up gradually over about two weeks.

Whether to use any warm-up network is an owner decision, because these networks simulate engagement (`emails/BULK_LIST_FILTER_SPEC.md` §6).

**Mailbox arithmetic for 100 a day.** Two domains at no more than 50 a day each, with two mailboxes per domain at about 25 a day each, gives **4 sending mailboxes**. That fits Smartlead Base: 2,100 sends a month against a 6,000 cap. The 2,000-contact cap is reached after about 2.7 months at 735 new contacts a month, so archive finished contacts or move to Pro.

---

## (c) Lead data

| Tool | What it is for | When | Current price tier | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Apollo.io** | Bulk contact search and emails for the four segments | **Now** | **Official page did not render the table.** Third-party reports for 2026 ([Landbase](https://www.landbase.com/blog/apollo-pricing), [Warmly](https://www.warmly.ai/p/blog/apollo-pricing)): Free; Basic $59 per user a month ($49 billed annually); Professional $99 ($79 annually); Organization $149 ($119 annually). Credits: 1 per email, 8 per phone. **Confirm in-app before paying.** | — | — | 13 |
| **Companies House** (UK) | Legal-form check (email only Ltd, PLC, LLP or Scottish partnership); SIC-code discovery; officer names | **Now** | Free web search. Advanced search filters by SIC code, incorporation date, status, type and address ([advanced search](https://find-and-update.company-information.service.gov.uk/advanced-search)). API rate limit: 600 requests per 5 minutes ([guidelines](https://developer.company-information.service.gov.uk/developer-guidelines)). Whether the API is free was not stated on the page fetched; it is widely known to be free with a registered key, but **treat that as unverified**. | Free API key registration | — | 13 |
| **LinkedIn Sales Navigator** Core | Precise filters (headcount, seniority, "posted on LinkedIn", years in role) for A/B research and **manual** LinkedIn touches | Soon (free trial first) | Core: $119.99 a month or $1,079.88 a year. Advanced: $159.99 a month. 50 InMails a month ([compare plans](https://business.linkedin.com/sales-solutions/compare-plans)). | Use only through the LinkedIn interface. No export or scraping tools. | — | 14 |
| **Clay** | Waterfall enrichment and AI research columns | Later | Free: 500 actions and 100 data credits a month, 200 rows per table. Launch: $167 a month ([pricing](https://www.clay.com/pricing)). | — | — | — |
| **Crunchbase** | Funding signals (mostly irrelevant for bootstrapped advisory firms) | Later / skip | **Unverified officially.** Third-party: Pro about $99 a month, or $49 a month billed annually ([G2](https://www.g2.com/products/crunchbase/pricing)). | — | — | — |
| **Directories**: Clutch, Consultancy.uk, The Manifest | Discover firms by service, location and size | **Now** (free) | Free to browse. Clutch filters by location (UK, US), size, rate and industry ([Clutch](https://clutch.co/consulting)). Consultancy.uk lists UK advisory firms ([firms](https://www.consultancy.uk/firms)). | **Manual browsing only.** Check each site's terms before any bulk export. | — | 13 |

---

## (d) CRM and booking

| Tool | What it is for | When | Current price tier | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Attio** (exists) | Threadline's own CRM; the app mirrors won deals, companies, people and renewals | **Now** | Free: £0, up to 3 seats, 50,000 records, **API and webhooks included**. Plus: £34 per user a month (£27 billed annually). Pro: £74 (£59) ([pricing](https://attio.com/pricing)). | Access token with record read/write | `ATTIO_API_KEY`, `ATTIO_STAGE_MAP` | 15 |
| **Calendly** (exists: "Founder Research — 20 mins") | Booking links for research and diagnosis calls; reminders | **Now: Standard** | Free allows **one event type** and one calendar. Standard: $10 per seat a month ($120 a year) and adds automated reminders. Teams: $16 and adds routing forms ([pricing](https://calendly.com/pricing)). A second event type ("Diagnosis call") plus no-show reminders needs **Standard**. | — | `NEXT_PUBLIC_BOOKING_URL` (diagnosis call link) | 15 |

---

## (e) Content and social (Threadline's own channels first, clients later)

| Tool | What it is for | When | Current price tier | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Native schedulers** (LinkedIn, YouTube Studio, TikTok, Meta Business Suite) | Posting Threadline's own content | **Now** | Free | — | — | — |
| **Metricool** (bridge) | Scheduling and analytics across platforms while the first-party API reviews run | Soon | Free: 1 brand, 20 posts a month. Starter: from €16–29 ($20–36) a month, up to 10 brands. Advanced: from €43. The page says Starter has "limited" LinkedIn, and X is an add-on on Free and Starter. **Full API access is on Advanced and above** ([pricing](https://metricool.com/pricing/)). | — | — | 16 |
| **Buffer** (alternative; do not buy both) | Same job | — | Free: 3 channels, 10 scheduled posts per channel. Essentials: $5 per channel a month. Team: $10 per channel ([pricing](https://buffer.com/pricing)). | — | — | — |
| **Riverside** | Remote recording of the founder (separate local tracks, up to 4K), teleprompter | Soon (first client recording) | Free: 2 hours one-off, 720p, watermark. Pro: $24 a month billed annually ($29 monthly). Grow: $34 / $39 ([pricing](https://riverside.com/pricing)). **Teleprompter plan placement was not stated on the page.** | — | — | 17 |
| **Descript** | Text-based editing, captions | Soon | Free: 60 minutes of media a month. Hobbyist from $16 a month. Creator from $24 a month (30 media hours). Business from $50 ([pricing](https://www.descript.com/pricing)). The fetched page mixed monthly and annual figures, so **confirm which figure applies at checkout**. | — | — | 17 |
| **OpusClip** | Long-to-short clipping | Later | Free (watermark, 3-day export). Starter: $15 a month. Pro: $29 a month ([pricing](https://www.opus.pro/pricing)). | — | — | — |
| **CapCut** | Manual short-form editing | Optional | **Unverified.** The pricing page returned 404. | — | — | — |

---

## (f) Research provider (optional)

| Tool | What it is for | When | Current price tier | API / approval | Env var | Order |
|---|---|---|---|---|---|---|
| **Apify** | Public-content corpus pulls behind the ResearchProvider boundary (already wired in `src/lib/env.ts`) | Later (optional) | Free: $5 of usage a month. Starter: $19 a month. Scale: $199 a month. Compute costs $0.2 per compute unit on Free and Starter ([pricing](https://apify.com/pricing)). | Pick an Actor; respect platform terms. No authenticated scraping. | `RESEARCH_EXTERNAL_PROVIDERS=apify`, `APIFY_TOKEN`, `APIFY_ACTOR_ID` | 18 |
| **Bright Data** Web Scraper API | Alternative provider | Later (optional) | Free: 5,000 records a month. Pay-as-you-go: $1.50 per 1,000 records ([pricing](https://brightdata.com/pricing/web-scraper)). | Same rules | None yet (the app is wired only for Apify) | — |

**Never use a research provider to collect prospect contact data from LinkedIn.** LinkedIn's User Agreement §8.2 prohibits scraping and bots ([User Agreement](https://www.linkedin.com/legal/user-agreement)). Research providers are for public content signals only, in line with the RESEARCH action class.

---

## Week-1 stack (minimum to start sending and onboard a first client safely)

| Item | Monthly | One-off | Why it is in week 1 |
|---|---:|---:|---|
| Vercel Pro | $20 | | Commercial use; deploy cap |
| Neon (Free → Launch before client data) | ~$0–15 **(estimate; metered)** | | Database |
| Resend Free | $0 | | Transactional mail up to 100 a day |
| R2, Upstash, Sentry free tiers | $0 | | Storage, rate limits, errors |
| Stripe | $0 (fees per payment) | | Test mode |
| Smartlead Base (with its own warm-up; no Lemwarm) | $39 | | Sender |
| 4 Workspace mailboxes on the secondary domains | £23.60 (4 × £5.90; if they already exist, £0 extra) | | Sending seats |
| MillionVerifier 50k credits | | $89 | Second verification pass |
| Apollo Basic (monthly) | $59 **(unverified)** | | Bulk list |
| Calendly Standard | $10 | | Second event type and reminders |
| Attio Free | £0 | | CRM |
| Anthropic API | usage (set a hard cap, e.g. $50) | | Generation |
| **Total** | **about $128–143 + £23.60 a month, plus API usage** | **$89** | |

Lean variant: Apollo Free plus Companies House plus directories, with no Apollo Basic. That is about **$69–84 + £23.60 a month**.

## Post-first-client stack (add as each need appears)

| Add | Monthly | Trigger |
|---|---:|---|
| Neon Launch (metered) | ~$15–40 **(estimate)** | Client data exists; 7-day history required |
| Resend Pro | $20 | More than 100 transactional emails a day or 3,000 a month |
| Sentry Team | $26 (annual) | A second person needs error access |
| AssemblyAI or Deepgram usage | < $5 at a few hours a month | First recording |
| Riverside Pro | $24–29 | Remote founder recording |
| Descript Creator | from $24 | Edit volume above a few pieces a week |
| Metricool Starter | $20–36 | Client multi-brand scheduling and reporting while API reviews run |
| Sales Navigator Core | $119.99 | A-tier research volume justifies it after the free trial |
| Smartlead Pro | $94 | More than 2,000 active contacts or 6,000 sends a month |
| Attio Plus | £34 per user | More than 3 seats, or sequences and enrichment are needed |
| X API | pay per use: $0.015 per post created, **$0.20 per post with a URL** ([X docs](https://docs.x.com/x-api/getting-started/pricing)) | A client needs X publishing |
| **Typical total after client 1** | **about $300–450 + £24–60 a month** | Covered by one £2,500 fee roughly 5–7 times over |

## Discrepancies found in existing docs and code (report only; nothing changed)

1. **LinkedIn API version.**
   - `src/lib/integrations/connectors/linkedin.ts` sends `LinkedIn-Version: 202409`.
   - LinkedIn supports each version for at least a year. The oldest version currently documented is 202510, which sunsets on 15 October 2026 ([versioning](https://learn.microsoft.com/en-us/linkedin/marketing/versioning)).
   - 202409 is therefore very likely already sunset, and LinkedIn returns an error for a deprecated version header.
   - Update to 202609 before any live LinkedIn test.
2. **YouTube upload cost and visibility.**
   - `docs/TECHNICAL_HANDOFF.md` says an upload costs 1,600 units.
   - Current docs say `videos.insert` costs **1 unit in a separate Video Uploads bucket**, with a default of 100 uploads a day ([videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), [quota](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)).
   - Uploads from **unverified API projects created after 28 July 2020 are locked to private** until audit. `docs/PLATFORM_APPLICATIONS.md` does not mention this.
3. **TikTok connector UX gaps** that would fail the Direct Post audit. See `TIKTOK_API_APPLICATION.md` §6.
