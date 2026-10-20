> **SUPERSEDED (21 Oct):** the main register is ChatGPT's `THREADLINE_LIVE_TOOLS_SUBSCRIPTIONS_REGISTER_2026-10-20_V11.md` (Drive 1K9BVs0fB4aB-FstXEmAg4JeC_H4q55Ko) plus Claude's `..._2026-10-21_V12_UPDATES.md`. This file was wrong on the social sign-up email (it is ilyas@threadlinehq.com, not social@) and on Instantly (planned, not purchased). Kept for history only.

# Threadline — live tools and subscriptions register (21 October 2026)

**New version.** It supersedes the Google Doc "THREADLINE — LIVE TOOLS & SUBSCRIPTIONS REGISTER" (last updated around 28 September), which is kept unchanged. Use this for account status, owner, cost and next action. STACK.md has vendor comparisons; STACK_SETUP_CHECKLIST.md has the setup order. "Account exists" never means "integrated and tested". **No passwords, keys, card details or full connection strings here.**

**Status words:** IN USE · LIVE VERIFIED (tested in production) · CONFIGURED (set up, not fully tested) · SETTING UP · DEFERRED (in the plan, no spend yet) · CONDITIONAL (add at the stated trigger) · UNVERIFIED (not checked in its billing/settings page).

---

## 1. Domains, email and core business accounts

| Tool | Status | Owner / login | Cost | Notes and next action |
|---|---|---|---|---|
| **Namecheap** | IN USE | account ilyx22 | Domains ~$11–15/yr each (see below) | Main: **threadlinehq.com** (Google Workspace mail + Vercel web; never use for cold email). Outreach (bought 19 Oct, order 217167805, $51.76 incl. tax; 1 yr, auto-renew, free privacy): **jointhreadline.com, threadlineteam.com, teamthreadline.com, threadlinehq.org**. Plus **threadlinehq.co** (owned since Sept; now outreach). All 5 outreach domains point to Zapmail nameservers (pns61–64.cloudns.*). Renewal ≈ Oct 2027 (new) / Sept 2027 (.co). |
| **Google Workspace** | IN USE | ilyas@threadlinehq.com (+ alias social@threadlinehq.com) | Plan/price UNVERIFIED | Business mail only. MX/SPF/DKIM/DMARC confirmed. Not used for outreach inboxes. |
| **Claude** | IN USE | owner | Plan UNVERIFIED | Coding and browser control. Not the same as an Anthropic API key. |
| **Google Drive / GitHub** | IN USE | owner | Free/UNVERIFIED | Launch pack and repo (main branch deploys). |

## 2. Product (live on threadlinehq.com)

| Tool | Status | Owner / login | Cost | Notes and next action |
|---|---|---|---|---|
| **Vercel** | LIVE VERIFIED | owner | **Hobby (free) — non-commercial only** | Project `threadline` at https://threadlinehq.com (apex; www → apex). Smoke test 9/9. `threadlinex` disconnected from Git. **Next:** Vercel Pro before the first paying client. |
| **Neon Postgres** | LIVE VERIFIED | Google sign-in | Free | threadline-prod, London, 33 migrations applied. Free restore window is short; **next:** choose recovery objectives and a paid plan before real client data. |
| **Cloudflare R2** | LIVE VERIFIED | Google sign-in, PayPal billing | Usage-based (free allowance); £50 cap with alerts | Private bucket; 15.3 MB upload tested through the app. **Next:** tenant-scoped retrieval test. |
| **Resend** | LIVE VERIFIED (sending) | ilyas@threadlinehq.com | Tier UNVERIFIED | mail.threadlinehq.com verified; webhook on threadlinehq.com rejects unsigned calls (401). **Next:** signed bounce/complaint and report-delivery tests. Separate from cold email. |
| **Production keys and cron** | LIVE VERIFIED | — | — | Encryption keys, cron secret, DEPLOYMENT_ROLE=primary; authorised cron run tested; owner account with 2FA and recovery codes. Keep the encryption key backed up in a password manager. |
| **Upstash / Sentry** | TO ACTIVATE | — | Free tiers | Rate limits and error alerts before real client data. |
| **Anthropic API** | TO ACTIVATE | — | Usage-based; set a spend cap | Needed for live AI drafting in the app. |
| **Transcription (AssemblyAI candidate)** | TO ACTIVATE | — | Usage-based | Needed before real recordings. |
| **Stripe** | CONDITIONAL | — | — | App has a test-only invoicing adapter; manual invoices until a live route is chosen. |

## 3. Sales and booking

| Tool | Status | Owner / login | Cost | Notes and next action |
|---|---|---|---|---|
| **Calendly** | IN USE | ilyas@threadlinehq.com, personal PayPal | Paid plan bought 28 Sept; exact plan/renewal UNVERIFIED | Research call (20 min) and Diagnosis call (60 min, 4 h notice, 15-min buffer, six questions, confirmation + day-before + 2-hour reminders). **Next:** second-address booking test. |
| **Attio** | IN USE | ilyas@threadlinehq.com | Free/trial; plan UNVERIFIED | Chosen as the prospect/sales record. **Next:** timezone to London, API token, import the 68 prospects, fix deal-duplication before client sync. |

## 4. Outreach infrastructure (warm-up first, capped budget)

**Agreed cap (20 Oct):** ≈ £45 domains + ≈ $86/month; monthly billing, no annual plans; expand on evidence.

| Tool | Status | Owner / login | Cost | Notes and next action |
|---|---|---|---|---|
| **Zapmail** | SETTING UP | i.sumra22@hotmail.com (consider moving to ilyas@threadlinehq.com later) | **Starter $39/month** (10 Google mailboxes; extra $3.50 each); **$49/month after 12 months**. Cancel = runs to period end, then mailboxes deleted; no refunds. Payment shown by onboarding progress — confirm in Billing. | 5 domains added; 3 connected (threadlinehq.co, threadlinehq.org, threadlineteam.com), 2 stuck on Zapmail's blacklist check (support ticket open). **Next:** create 10 mailboxes in one sitting (24-hour rule): ilyas@ + ilyas.sumra@ per domain, display name "Ilyas Sumra". |
| **Instantly** | SETTING UP | owner (account created) | **Growth $47/month** when chosen (unlimited inboxes + warm-up; 5,000 emails/month; 1,000 stored contacts). Trial/plan UNVERIFIED. | Replaces the earlier Smartlead plan (owner decision, course-aligned). **Next:** connect the 10 inboxes, warm-up only, health check before any campaign. No separate warm-up tool. |
| **Smartlead** | DROPPED | — | — | Superseded by Instantly. |
| **Apollo** | DEFERRED | — | Free plan for the pilot; Basic ~$49–65/month only when close to sending | 10-row then 50-row pilot after inboxes are warming. |
| **Clay** | DEFERRED | — | Free plan for the pilot; paid from ~$185/month only if the pilot earns it | |
| **MillionVerifier** | DEFERRED | — | Pay per use | Verify the first batch close to sending. |
| **LinkedIn Premium** | PLANNED (owner) | owner's LinkedIn | Free trial, then paid | To build the profile; **cancel before it converts** unless deliberately kept. |

## 5. Social accounts (created 20–21 Oct)

| Platform | Handle | Login | Status / next action |
|---|---|---|---|
| X | **@threadline_hq** | social@ | Photo, header, bio, link done. 2FA pending (back burner). |
| Instagram | **threadline_hq** | social@ | Photo and bio done; add link in the mobile app; 2FA pending. |
| Threads | **threadline_hq** | via Instagram | Linked. |
| TikTok | **@threadline_hq** | social@ | Created via US VPN — keep the location consistent or recreate normally. Bio done; 2FA pending. |
| YouTube | **@threadline_hq** (brand channel) | owner's Google account | Photo, banner, description done. (The older "Threadline Headquarters" @threadlinehq channel — confirm whether it is the owner's.) |
| LinkedIn (personal) | linkedin.com/in/ilyas-t-0962aa445 | owner | ID verification not needed. Confirm it's the only personal account. Company Page blocked until enough connections. |

## 6. Later / conditional (no spend now)

Riverside and one editor (Descript or OpusClip) after the editing comparison; Metricool or Postiz after a scheduler test (not both); Sales Navigator only if it saves real time; Apify/Bright Data, X API and other platform APIs only on a documented need.

## 7. Money

**Known recurring now:** Zapmail $39/mo (once confirmed) + Instantly $47/mo (once on Growth) ≈ **$86/mo**, plus Calendly (amount UNVERIFIED) and Namecheap renewals (~$60/yr for the 5 outreach domains + main domain). **Still UNKNOWN:** Google Workspace, Claude, Calendly and Attio exact charges — check each billing page and fill them in here.

Before any new payment, record: provider, exact plan, currency, monthly/annual term, renewal date, owner, cancellation path, spend cap, reason, and the test that proves it works.
