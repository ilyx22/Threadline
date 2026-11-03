# E20: integration register, by capability (3 Nov 2026)

> **What this is:** what each connection can actually **do** today, and when it was last proven. The subscriptions register (V14, Drive) covers cost and logins; A08 covers security. Neither says what is connected and tested.
>
> **Sources:**
> - the production Admin → System page (3 Nov);
> - today's live tests B04–B18;
> - the code's connector registry.
>
> Client social connections are tracked per client in the app (Settings → Integrations). The app shows "connected" only when a capability is proven, so this file doesn't duplicate those.
>
> **Status words:**
> - **LIVE**: tested end to end in production, with a date.
> - **CONFIGURED**: set up but not proven end to end.
> - **OFF**: not set.
> - **MANUAL**: the supported route is a person.

## Threadline's own platform

| Capability | Provider | Status | Last proven | Restriction | Fallback | Next action |
|---|---|---|---|---|---|---|
| App hosting and deploys | Vercel (Hobby) | LIVE | 3 Nov (about 40 deploys; one failed build blocked, production unaffected) | Hobby is non-commercial; 100 deploys a day | Roll back to the previous deploy | Upgrade to Pro before the first paying client |
| Database | Neon (London, free) | LIVE | 3 Nov (health: database true) | Short free restore window | — | Choose recovery objectives and plan before real client data |
| File storage | Cloudflare R2 | LIVE | 3 Nov (B09: upload, byte-identical read, tenant 404, signed-out 401) | £50 cap with alerts | Library link instead of upload | — |
| Malware scanning of uploads | none | **OFF** | — | PROCESSING_SCAN off | Accept only known client files | Choose a processing worker (DR-11) |
| Transactional email | Resend (mail.threadlinehq.com) | LIVE | 3 Nov (confirmation, ops alert, invitation and password reset all reached the Inbox) | Bounce/complaint webhook delivery not yet seen | Copy the link from the admin screen | Send one signed webhook test |
| Absolute links in emails | `NEXT_PUBLIC_APP_URL` | **OFF** (falls back to the Vercel production hostname) | — | Warning on Admin → System | — | **Owner:** set it to `https://threadlinehq.com` in Vercel |
| Scheduled jobs | Vercel cron + CRON_SECRET | LIVE | 3 Nov (50 jobs succeeded, none dead) | — | Run the job from Vercel by hand | — |
| Shared rate limits | Upstash | **OFF** (in-memory per instance) | — | Weaker limits | — | Before real client data (DR-14) |
| Error reporting | Sentry DSN | **OFF** | — | Errors are logged but nobody is alerted | Check Vercel logs | Before real client data (DR-14) |
| AI drafting | Anthropic API | **OFF** (labelled demo mode) | — | No live generation | Human-written scripts | B06/R1, when a client needs it; set a spend cap and AI_PRICE_* |
| Transcription | AssemblyAI (candidate) | **OFF** | — | — | Manual transcript | B08 |
| Tracked links and clicks | App `/t/<slug>` | LIVE | 3 Nov (302 to the stored destination; bots and previews not counted; 2 real clicks recorded) | No visitor cookie until the cookie basis is decided (DR-43), so clicks can't be joined into journeys | Manual matching | Owner decides the cookie basis |
| Payments | Stripe (test-only adapter) | MANUAL | — | Live route not chosen (F07/F08) | Bank-transfer invoice | F07–F12 |

## Sales and outreach

| Capability | Provider | Status | Last proven | Restriction | Fallback | Next action |
|---|---|---|---|---|---|---|
| Sending mailboxes (10) | Zapmail → Google | CONFIGURED | 3 Nov (warming at 100% in Smartlead) | Login is a personal hotmail address (A08) | — | Move or secure the login |
| Cold email send and warm-up | Smartlead Base | CONFIGURED (warm-up only) | 3 Nov (10 inboxes at 100%) | **No API or webhooks on Base**: nothing flows to Attio or the app automatically | Manual logging | Variant results come from Smartlead analytics (DR-48 narrowed) |
| Prospect CRM | Attio (Free) | CONFIGURED (workspace, list, fields) | — | Free plan; check on 4 Nov | — | E05 import (needs your go) |
| App → Attio sync (clients only) | Attio API | **OFF** (ATTIO_API_KEY not set) | — | **6 changes are queued**, including TEST B16 Co's company, person and won deal | — | **Mark test-b16 synthetic first** (synthetic rows are skipped when sent), then E06: scoped key, test one real record |
| Booking | Calendly (20-minute research, 60-minute diagnosis) | CONFIGURED | — | Not linked from /apply (NEXT_PUBLIC_BOOKING_URL not set) | Booking by email | Owner decides whether to show "Book a call" |
| Application → review → client | App | LIVE | 3 Nov (B16) | — | — | — |

## Client platforms: publishing and analytics

Connectors are built for LinkedIn, X, YouTube, TikTok, Facebook, Instagram (Meta) and Threads. None is approved or tested in production, so **the supported route for the first client is MANUAL**: the client or Threadline publishes from the client's own account, using the approved package and tracked link, then records the live URL.

| Platform | Publishing today | Analytics today | Gate | Next action |
|---|---|---|---|---|
| LinkedIn | MANUAL | MANUAL (enter metrics by hand) | Member analytics needs LinkedIn review | J08, later |
| X | MANUAL | MANUAL | Paid API tier | Later; on documented need |
| YouTube | MANUAL | MANUAL | OAuth consent screen verification | J08 |
| TikTok | MANUAL | MANUAL | App audit (otherwise posts are private only) | `sprint/stack/TIKTOK_API_APPLICATION.md` |
| Instagram, Facebook, Threads | MANUAL | MANUAL | Meta app review | J08 |
| Scheduler (Metricool, Postiz or Buffer) | not chosen | — | — | E15: test one, not all |

## Owner actions from this register

1. **Mark test-b16 as synthetic** before anyone sets the Attio key.
2. **Set `NEXT_PUBLIC_APP_URL=https://threadlinehq.com`** in Vercel.
3. **Decide whether to set `NEXT_PUBLIC_BOOKING_URL`** (the Calendly link) for applicants.
4. Before the first paying client: Vercel Pro, a backup plan for Neon, Upstash and Sentry (both free tiers), and a malware-scanning decision.
