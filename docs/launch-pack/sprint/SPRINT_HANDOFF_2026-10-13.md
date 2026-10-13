# Threadline launch sprint: handoff

**Covers 26 September – 13 October 2026.** Written for the owner (Ilyas) and for any future session picking this up. No secrets are in this file; keys live only in Vercel (Production) and local git-ignored `.env.*.local` files.

---

## 1. Where things stand, in one paragraph

The product is **built, live and tested on `https://threadlinehq.com`**: database, file storage, email, booking, two-factor sign-in and the full client portal all work in production (smoke test 9/9). The launch pack (sales scripts, outreach, contracts, onboarding docs, prospects) is written and awaiting owner review. **What's left is selling**: deciding the offer (a brief is ready), setting up outreach (domains, social accounts, CRM) and sending the first messages. The sprint paused for about two weeks (from 29 September) for personal reasons and resumed on 13 October.

---

## 2. Production: what's live

| Piece | State | Detail |
|---|---|---|
| **Website + app** | ✅ Live | `https://threadlinehq.com` (www redirects to it). Vercel project `threadline`, deploys on every push to `main`. Latest: `d0f0256`. |
| **Mirror project** | ✅ Neutralised | `threadlinex` disconnected from Git (28 Sept); inert. |
| **Database** | ✅ Live | Neon `threadline-prod` (London, Free plan, Postgres 18.6). All 33 migrations applied. Free plan = 6-hour restore window only. |
| **File storage** | ✅ Live | Cloudflare R2 bucket `threadline-prod` (EU, private, CORS set). £50/month spending cap enforced in the app plus Cloudflare alerts at $5 and $50. A 15.3 MB upload was tested live. |
| **Email** | ✅ Live | Resend, domain `mail.threadlinehq.com` (verified), sender `Threadline <hello@mail.threadlinehq.com>`, replies go to `ilyas@threadlinehq.com`. Delivery webhook at `https://threadlinehq.com/api/email/resend`. |
| **Security** | ✅ Live | Encryption keys, cron secret, `DEPLOYMENT_ROLE=primary`, staff two-factor enforced. |
| **Scheduled jobs** | ✅ Live | Daily cron at 07:00 UTC; a manual run was tested. |
| **Owner account** | ✅ | `ilyas@threadlinehq.com`, super admin, two-factor on, recovery codes saved. |
| **Test client** | ✅ | "TEST - Threadline Dry Run Co" (`test-dry-run`), marked synthetic (never sent to the CRM). The invite was received, the password set, and onboarding started. |
| **CRM (Attio)** | ⏳ Not connected | The workspace exists; the API key isn't set, so CRM sync is held. The admin System page shows this honestly. |
| **AI (Anthropic)** | ⏳ Not connected | The app runs in labelled demo mode until a key is set. |
| **Transcription/processing** | ⏳ Not connected | Uploads show "Processing queued" until a provider (AssemblyAI recommended) is wired. |

**Health check:** `https://threadlinehq.com/api/health`. **Smoke test:** `NODE_OPTIONS=--use-system-ca node scripts/ops/smoke-prod.mjs https://threadlinehq.com` (on Windows, curl needs `--ssl-no-revoke`).

---

## 3. What was built or fixed during the sprint

**New features**
- **Onboarding on the kickoff call** (`c45a2bc`): the client does a ~6-minute prep (business basics + access); staff fill in the rest live on the call (jump anywhere, never blocked, optional transcript drafting once AI is connected); "Send to client to check" → the client reviews answers marked *From your call* → confirms → the workspace is built.
- **Client relationship cadence** (`e8f483e`): kickoff, day-3, weekly then fortnightly check-ins, and reviews at weeks 4, 8 and 12, mirrored to Attio as tasks; client emails default to a daily digest.
- **Storage spending cap** (`45ab9d8`): uploads are refused past a £50/month budget, with staff alerts.
- **Reply-to routing** (`8e0fedf`): replies to app emails reach the Workspace inbox.
- **Test workspaces never reach the CRM** (`4fb3bff`).

**Bugs found in live testing and fixed**
- Every action on the client admin page failing in production (`1546e6c`).
- The "New client" form silently refusing to submit (`cf54826`).
- Two-factor recovery codes never shown at enrolment, plus a way to replace them (`97506af`).
- `owner:create` hanging in Git Bash (`9250cd4`; use PowerShell).
- Blank provider settings treated as broken config (`2073a6d`).
- The System page claiming the CRM was connected when it wasn't (`4bc80c8`).

**Earlier in the sprint (26–27 Sept)**: the full backend brief completed and audited, acceptance journeys (87 checks), the launch asset pack, and the overnight sprint pack (prospects, A-tier one-pagers, email pack, contracts, stack plan, content register).

**Test status at last full run:** unit tests 866/866, end-to-end QA 634 passed with 0 failures, public-site freeze intact (104 files unchanged).

---

## 4. Booking, scripts and accounts

- **Calendly** (paid plan):
  - *Founder Research — 20 mins*: the research track. The research call is **20 minutes everywhere** now (scripts updated).
  - *Diagnosis call*: https://calendly.com/ilyas-threadlinehq/diagnosis-call. 60 minutes; Meet or phone; bookable up to 5 days ahead with 4 hours' notice; 15-minute buffer; the six booking questions from `BOOKING_QUESTIONS_AND_REMINDERS.md`; confirmation email plus day-before and 2-hour reminders. It sends from Calendly's address for now (an owner choice, to revisit). **The notetaker is on**, so every script now opens with a recording-consent line.
- **Google Workspace:** `social@threadlinehq.com` alias created for all social signups.
- **Social handles checked (28 Sept, not reserved yet):** `threadlinehq` is free on X and LinkedIn; use `threadline_hq` on Instagram, Threads, TikTok and YouTube (`threadlinehq` is taken there).
- **LinkedIn page:** to be created from the owner's own, barely used LinkedIn account. Confirm it's his only account; if not, the page goes on his girlfriend's account instead. Never create a second personal LinkedIn account.

---

## 5. Decisions made

| Decision | Outcome |
|---|---|
| Canonical domain | `threadlinehq.com` (www redirects to it) |
| Research call length | 20 minutes everywhere |
| Diagnosis call | 60 minutes, 4 hours' notice; revisit after market feedback |
| Invoicing | Manual invoices for now (template exists). **Stripe stays an ongoing to-do** as the company grows |
| Attio | Will likely be paid; buy later |
| Social bios | Version B (founder-led AI advisory firms); **may change with the new offer** |
| Recording | Notetaker on, with verbal consent at the start of every call |
| Calendly sender | Calendly's address for now, to keep the owner's inbox clear |
| Sales process | One-call close on the Diagnosis call; a second call only for a genuine second decision-maker, booked live |

---

## 6. Strategy: the open question

On 28 September the owner raised that the original positioning (multi-platform, "we diagnose which platform fits") doesn't feel right: it's hard to sell, there's no production line, and it's hard to outsource. His original idea was short-form video, he has made ads for years, and he has never used LinkedIn.

**Offer brief written 13 Oct:** `docs/launch-pack/strategy/OFFER_BRIEF_2026-10-13.md`.
- **Recommendation:** short-form video for founder-led B2B experts. Two recorded conversations every four weeks become 12–16 ad-standard clips, posted to LinkedIn, Shorts, Reels and TikTok. Price unchanged.
- **Guarantee (from the existing Drive design):** "100,000 views in 12 weeks or a full refund". Disclosed paid amplification makes this affordable to back. Test real cost per view with £50–100 first, and lower the number rather than weaken the refund if needed.
- **Four owner decisions are pending.** After they're made, rewrite the pitch, outreach, one-pagers, bios, welcome guide and the agreement (which currently disclaims views; solicitor review required).

Competitor research (Viral Coach, Viewz.gg) is correctly filed as research and must never be presented as Threadline results.

---

## 7. What's left (prioritised)

**Decisions first**
1. Offer and guarantee (the 4 decisions in the brief).
2. Cold email under the owner's own name: is that OK with the Deloitte clearance (currently posting only)?
3. Diagnosis link as a button on the public /apply page (`NEXT_PUBLIC_BOOKING_URL`)?

**Acquisition setup**
4. **Outbound domains** (parked; the slowest clock): use `threadlinehq.co` (owned, no DNS yet) plus buy `meetthreadline.com`, then DNS (SPF/DKIM/DMARC), 4 mailboxes, and Smartlead warm-up for 2–4 weeks. Cold email starts only after warm-up; personal messages and LinkedIn can go out before.
5. Reserve the social handles; LinkedIn page; bios after the offer is decided.
6. Attio: plan, API key, import the 68 prospects, timezone Zagreb → London.
7. A test booking from a second email address; check the research event against the spec.

**Copy (after the offer decision)**
8. Rewrite the pitch, outreach, 23 A-tier one-pagers, bios and welcome guide; work through `REVIEW_INDEX.md`; rehearse the research call and the demo.

**First sends**
9. Send the 7 A-tier personal messages, then 5–10 good touches a day; aim for 10 founder interviews.

**Client #1 readiness**
10. Owner's own dry run on the test client: the kickoff onboarding flow, then content → approval → report.
11. Test the editing route on 3–5 clips (Descript / OpusClip vs manual) and set the standard.
12. Transcription (AssemblyAI) and an Anthropic key with a spend cap.
13. **Vercel Pro** (the free plan is non-commercial only) before the first paying client.
14. Neon paid plan for a 7-day restore window before real client data.
15. Invoice bank details plus a test invoice; skim the contracts and send them to a solicitor; legal entity, ICO fee, privacy and cookie basis; PI and cyber insurance.
16. Support terms and a `hello@` alias; Sentry and Upstash (free tiers); record the onboarding videos once the offer is final.

**Housekeeping**
17. Upload new versions to Drive: the master to-do, the 3 call scripts with the consent line, the 20-minute changes, and this handoff (download first; never overwrite edits made elsewhere).
18. Delete the blank Vercel placeholder settings; delete the 4 local `.env.*.local` files at the very end.

**Later:** Stripe live payments; social platform API approvals; Library upload titles and thumbnails; queued build items (reply tracking, scoreboard, required call notes); cold email at volume after warm-up.

---

## 8. Where things are

| What | Where |
|---|---|
| Code | GitHub `ilyx22/Threadline`, branch `main` (pushes deploy production) |
| Master to-do (repo) | `docs/launch-pack/sprint/ops/THREADLINE_MASTER_TODO_2026-09-27_PROPOSED.md` |
| Master to-do (Drive) | file `1BZHgl4y9S2Zb0LeEcpeHiTJQWnmm9KEa` (edited outside the repo too; check before updating) |
| Offer brief | `docs/launch-pack/strategy/OFFER_BRIEF_2026-10-13.md` |
| Sales scripts | `docs/launch-pack/sales/` (SALES_CALL_GUIDE, RESEARCH_INTERVIEW_SCRIPT, CLOSE_TO_KICKOFF_CARD) |
| Booking spec | `docs/launch-pack/sprint/sales-extra/BOOKING_QUESTIONS_AND_REMINDERS.md` |
| Social spec | `docs/launch-pack/sprint/social/PROFILES.md` |
| Tool and price plan | `docs/launch-pack/sprint/stack/STACK.md`, `STACK_SETUP_CHECKLIST.md`; Drive "Live Tools & Subscriptions Register" |
| Activation runbook | `docs/launch-pack/sprint/ACTIVATION_RUNBOOK.md`, `docs/OWNER_ACTIVATION_CHECKLIST.md` |
| Prospects | `docs/launch-pack/sprint/prospects/prospects.csv` (68 rows), A-tier one-pagers in `sprint/a-tier-assets/` |
| Guarantee design and competitor research | Drive research folder (`THREADLINE_12_WEEK_PERFORMANCE_GUARANTEE_DESIGN_2026-09-27.md`, `THREADLINE_VIEWZ_GG_COMPETITOR_RESEARCH_2026-09-28.md`, Viral Coach files) |

---

## 9. Ground rules carried forward

- **The public site is frozen:** no copy, design or proof changes without the owner explicitly lifting the freeze.
- **Drive:** upload new versions only; never overwrite canonical source docs; check for outside edits first.
- **Never:** send real outreach, publish, buy anything or create accounts on the owner's behalf; never expose secrets; no destructive production operations.
- **Claims:** no proof Threadline doesn't hold; competitor results are never Threadline's; no guarantee wording goes public before owner approval and solicitor review.
- **Database changes:** the migration runs first (owner runs the command), then the push, so production never runs code ahead of its database.
- **Pace:** small, real wins. The owner is coming back from a hard couple of weeks.
