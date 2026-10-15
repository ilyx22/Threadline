# Threadline: Master TODO (15 October 2026)

**Supersedes the 27 September master TODO as the working list.** The 27 September version (Drive `THREADLINE_MASTER_TODO_2026-09-27.md`, repo `THREADLINE_MASTER_TODO_2026-09-27_PROPOSED.md`) is kept unchanged as history. Every open item from it was carried here, marked done, or reclassified with a reason (§12). Factual production state: `SPRINT_HANDOFF_2026-10-13.md`. Strategy decisions in progress: `OFFER_BRIEF_2026-10-14_V2_SOURCE_AUDITED.md`, `THREADLINE_AUTHORITY_ONLY_BUSINESS_AUDIT_2026-10-15.md`, `GUARANTEE_ECONOMICS_AND_TESTS_2026-10-15_V2.md`, `OUTREACH_RECONCILIATION_2026-10-15.md`.

**Key:** `[ ]` open · `[x]` done · `[~]` partly done · **OWNER** = only you · **CLAUDE** = Claude prepares or builds (on request) · **BOTH** = together · **WAIT** = blocked by another item · **LATER** = deliberately deferred.

**Standing rules:** public site frozen; Drive = new versions only; no sends, purchases, account creation by Claude, publishing or guarantee wording without owner approval (and solicitor review for guarantees); automation preferred for admin and approved execution, AI drafts for owner review, owner keeps strategy, claims, commitments and quality; no new build programme that delays market contact.

---

## Where we are (one paragraph)

The product is live and tested on **threadlinehq.com**. Booking, scripts, contracts (draft), prospects and A-tier assets exist. The business plan is coherent with the coaches' teaching (15 Oct audit). **What's left is: decide the offer, connect the acquisition tools, and start conversations.** Nothing has been sent; revenue is £0.

---

## 0. Owner decisions (these unblock most of the list)

- [ ] **OWNER. Core offer:** short-form video for founder-led AI/tech advisory firms (OFFER_BRIEF V2), yes / no / adjust.
- [ ] **OWNER. Guarantee:** full refund (A) vs proportional (C); target (100,000 views is a candidate); media cap per client; refund reserve policy. Economics in GUARANTEE_ECONOMICS V2. Solicitor review before any use.
- [ ] **OWNER. Channels:** LinkedIn + Shorts + Reels default, TikTok optional.
- [ ] **OWNER. Paid-view test:** approve the exact £ (£50–100 proposed), platform and clips; publishing it is public.
- [x] ~~**OWNER. Deloitte:** is research and cold outreach under your own name OK with your clearance (posting only so far)?~~ ✅ **Cleared by the owner, 16 Oct 2026.**
- [ ] **OWNER. Outreach configuration:** starter (2 domains / 4 mailboxes ≈ 20 new/day) or full (≈100 new/day); pick ONE documented course configuration (the reconciliation shows several); budget once quoted.
- [ ] **OWNER. Evergreen-audio wording:** reusable Loom narration is fine, but never imply it was recorded live or personally.
- [ ] **OWNER. First campaign test:** baseline first (recommended) or a labelled comparison of two full sequences.
- [ ] **OWNER. Prospect list at volume:** how to size AI advisory properly (the ~4,000 figure is an unverified placeholder).
- [ ] **OWNER. Public booking button:** put the Diagnosis link on /apply (`NEXT_PUBLIC_BOOKING_URL`)? It's a visible public change.
- [x] Prospect system of record: **Attio for prospects and sales; Threadline for client delivery** (decided 15 Oct).
- [x] Software sending is course-aligned (manual sending is only the course's first stage; Instantly automation is taught). Decided 15 Oct.
- [x] Research call = 20 minutes everywhere; Diagnosis call = 60 minutes, 4 hours' notice (revisit after feedback); manual invoices now (Stripe stays a looming item); recording notetaker on with verbal consent; Calendly sender stays Calendly's for now.

## 1. Research track: first conversations (can start now)

- [ ] **OWNER. Send the Sesen AI step-1 research message** (contact form, then LinkedIn). Draft ready; sources re-verified 14 Oct. ~~**WAIT** on the Deloitte decision.~~ Cleared 16 Oct.
- [ ] **OWNER.** Then the other A-tier firms: 5–10 genuine research touches per working day; log each touch (message version is recorded).
- [ ] **OWNER.** Rehearse the 20-minute research call once (`sales/RESEARCH_INTERVIEW_SCRIPT.md`, consent line first).
- [ ] **OWNER.** ~10 substantive founder interviews; record VOC, problem energy 0–5 and awareness (fields exist).
- [ ] **OWNER.** Test a research booking end to end from a second email address (invite → 20-min event → confirmation → reminder).
- [ ] **OWNER/CLAUDE.** Check the Calendly research event against BOOKING_QUESTIONS Part 2 (name, email + one optional question).
- [ ] **OWNER.** No-show handling for the Diagnosis call: send the §1.7 message by hand when it happens.

## 2. Acquisition automation and infrastructure

- [ ] **OWNER → BOTH. Apollo + Clay pilot.** You create free accounts (`social@`); Claude checks the current allowances and estimates credits; Clay order: import → dedupe → website fit → reject mismatches **before** contact credits → research with sources → contacts → your review. **10 rows, then 50.** Measure fit rate, cost per usable prospect and review time; compare with the manual 68. (Tests the workflow, not market size.)
- [ ] **BOTH. Attio connection:** scoped API key → Vercel → redeploy → test. Syncs **clients only** (companies, people, deals, check-in tasks); prospects come from the Clay/sending tools.
- [ ] **CLAUDE (before Client #1). Fix the Attio deal duplicate:** Threadline always creates a new deal, so make it update the existing sales deal by company. **Rule meanwhile:** always set the client website when creating a client (companies match on domain).
- [ ] **BOTH, during the pilot. Verify:** Clay upserts without duplicates; replies stop the sequence and reach the right Attio record; interested replies create a task; prospect → client doesn't duplicate.
- [ ] **OWNER (parked). Sending domains:** `threadlinehq.co` (owned) + buy `meetthreadline.com` (or per the chosen configuration) → DNS (SPF/DKIM/DMARC) → mailboxes (real name, postal-address signature) → warm-up (course: ~2 weeks for mailboxes, 2–4 weeks to full capacity). Claude gives exact records.
- [ ] **OWNER. Sending tool:** Smartlead or Instantly, after the domains; connect to Attio.
- [ ] **OWNER.** Verifier (MillionVerifier) before the first cold batch.
- [ ] **CLAUDE (on request).** Correct `OUTREACH_RECONCILIATION` as V2: software sending is stage-specific (not a conflict); several mailbox configurations exist; course warm-up timing (2 weeks / 2–4 weeks).
- [ ] **CLAUDE (after §0 decisions).** Corrected new versions of TEST_PLAN, CAMPAIGN_PACK and LEAD_GEN_SYSTEM (one configuration, Loom OS metrics, initial-send denominators, evergreen audio, AI-advisory cell).
- [ ] **CLAUDE (on request).** A cohort scoreboard with the correct denominators (cash, acquisition hours, practical CAC).

## 3. Offer, copy and contracts (WAIT on §0)

- [ ] **CLAUDE.** Rewrite to the chosen offer as labelled DRAFTS: pitch, outreach, 23 A-tier one-pagers, profile bios, welcome guide and FAQ; a guarantee schedule for the agreement. Approved passages A–M stay verbatim.
- [ ] **OWNER.** Work through `REVIEW_INDEX.md`: approve or return each pack document.
- [ ] **OWNER.** Skim the contracts; send `sprint/contracts/` to a solicitor (MSA, SOW, DPA outline; the agreement's §6 disclaims views, so it changes if a views guarantee is chosen).
- [ ] **OWNER.** Proof band: keep the source, timeframe and definition on file privately.
- [ ] **OWNER.** Decide whether to lift the frozen-site freeze for any public-copy conflicts (report exists).

## 4. Client #1 readiness: delivery

- [ ] **OWNER. Your own dry run** on the test client: the live kickoff onboarding flow (staff view → send to client → client confirms → build), then content → approval → report, timed, with every snag noted.
- [ ] **OWNER. Editing dry run (3–5 clips)** per GUARANTEE_ECONOMICS V2 Part 2: AI-only vs hybrid vs manual vs freelancer; minutes, cost, accepted; set the standard route.
- [ ] **OWNER.** Verify the Day-7 installation plan; rehearse the 3–5 minute demo (Claude can seed a demo workspace).
- [ ] **OWNER.** Record per-section onboarding videos (after the offer is final).
- [ ] **BOTH.** Transcription provider (AssemblyAI) + wire processing so uploads move past "Processing queued".
- [ ] **BOTH.** Anthropic API key with a console spend limit, plus `AI_PRICE_*`; test each AI workflow end to end (a key alone doesn't prove the workflows).
- [ ] **OWNER + CLAUDE.** Verify signed bounce/complaint events and suppression, and weekly report email delivery.
- [ ] **OWNER + CLAUDE.** Test tenant-scoped file retrieval (the upload itself is tested).

## 5. Client #1 readiness: business, legal and ops

- [ ] **OWNER. Vercel Pro** (Hobby is non-commercial only) before the first paying client.
- [ ] **OWNER. Neon backups:** choose recovery objectives (D-03); paid plan for a 7-day restore window before real client data; rerun `db:drill`.
- [ ] **OWNER.** Confirm the encryption key is backed up separately (password manager).
- [ ] **OWNER.** Invoice: bank details on the template + one test invoice.
- [ ] **OWNER.** Entity, company number, address, privacy contact, retention, ICO fee, cookie basis (D-09, D-03); Claude then fills the hidden legal sections.
- [ ] **OWNER.** PI and cyber insurance; Cyber Essentials.
- [ ] **OWNER.** Support terms (D-07) + a `hello@` alias; re-test email replies from a non-plus address.
- [ ] **OWNER.** Sentry (error alerts) and Upstash (shared rate limits), free tiers.
- [ ] **LOOMING. Stripe** live payments as the company grows (manual invoices until then). Don't tick off.

## 6. Social and content

- [ ] **OWNER. Reserve handles** (spec PROFILES.md; sign up with `social@`; unique passwords, 2FA, recovery codes; asset register): X `@threadlinehq`; Instagram/Threads/TikTok/YouTube `threadline_hq` (`threadlinehq` is taken there; check whether the YouTube "Threadline Headquarters" is yours). **Bios WAIT on §0.**
- [ ] **OWNER. LinkedIn Company Page** from your own barely used account (confirm it's your only LinkedIn account; otherwise use your girlfriend's account; never a second personal account).
- [ ] **OWNER.** Review the content pack (register pre-scores) after the offer decision. The 1–14 October calendar is out of date, so re-plan it.
- [ ] **OWNER.** Schedule only through official tools; replies stay human; feed replies and objections into Attio.

## 7. Small builds queued (CLAUDE, only when they serve the next cycle)

- [ ] Attio deal update instead of a duplicate (§2), **before Client #1**.
- [ ] Reply class per touch (DR-48).
- [ ] Required VOC, next action and due date on attended calls (DR-49).
- [ ] Optional video slot per onboarding section (for your videos).
- [ ] Library: required title on upload + thumbnails (after Client #1).
- [ ] Anti-slop gate criterion; call-to-content mining of sales VOC (DR-53, once real transcripts exist).
- [ ] QA sweeps on a local build (public, browser, perf, vitals, visual); an accessibility report on frozen routes (report only).
- [ ] Synthetic full-chain walkthrough with screenshots; Recording Room headless test; ROOT_ID lineage test (DR-51); owner/next-action/due-date audit (DR-50).
- [ ] Editing scorecard (12 criteria) and the 100–300-item wedge corpus for Judge calibration.
- [ ] Friday audit task; recording reminders.

## 8. Housekeeping

- [ ] **CLAUDE.** Drive new versions: SALES_CALL_GUIDE, RESEARCH_INTERVIEW_SCRIPT, CLOSE_TO_KICKOFF_CARD (consent line), the 20-minute pack changes, OUTREACH_SEQUENCES (stale notes cleared). Check Drive copies for outside edits first.
- [ ] **OWNER (optional).** Change "15 minutes" to 20 in the canonical Google Doc playbook (Claude doesn't edit canonical docs).
- [ ] **OWNER.** Delete the blank Vercel placeholder settings; at the very end, delete the 4 local `.env.*.local` files.
- [ ] **OWNER.** Attio timezone Zagreb → London; Attio plan (will likely be paid; buy later).
- [ ] **OWNER (later).** Calendly named sender (connect Gmail) instead of notifications@calendly.com.

## 9. Later (deliberately deferred)

- Platform API apps and reviews: TikTok, Meta (one verification for Instagram/Facebook/Threads), Google/YouTube, LinkedIn developer app, X (paid tier); one end-to-end route per platform; Metricool optional.
- Paid acquisition beyond the guarantee CPV test; revenue share or performance pricing; generic billing software; fine-tuning; native video editor; newsletter as a client deliverable; partner/affiliate infrastructure; broad competitor expansion; category SEO library; exact founder-time claims; rebuilding the OS; Bright Data / Apify research providers (D-08).
- After Client #1 signs: Day-0 baseline, tracked asset IDs and links, weekly commercial signals, four-week reviews, delivery load and margin, optional success interview, then adjust cadence, price and staffing from Clients 1–3.

---

## 10. Done since 27 September (so we know where we are)

**Production (all live on threadlinehq.com):**
- [x] Database (Neon London), migrations applied (33).
- [x] File storage (R2 EU) with a £50 cap and alerts; 15.3 MB upload tested.
- [x] Email (Resend `mail.threadlinehq.com`) with reply-to; webhook on threadlinehq.com.
- [x] Encryption keys, cron secret, `DEPLOYMENT_ROLE=primary`; authorised cron run tested.
- [x] Owner account with 2FA and recovery codes.
- [x] Domain connected (apex + www redirect); app links use threadlinehq.com.
- [x] `threadlinex` isolated (Git disconnected).
- [x] Smoke test 9/9 on threadlinehq.com.

**Product:**
- [x] Kickoff-call onboarding (migration applied, deployed).
- [x] Client relationship cadence + digests.
- [x] Storage cap; synthetic workspaces kept out of the CRM.
- [x] Live bug fixes: client admin actions, new-client form, recovery codes, `owner:create`, System page.
- [x] Message version, problem energy and awareness fields on outreach and interviews.

**Sales and booking:**
- [x] Calendly Diagnosis call built to the spec: questions, description, buffer, confirmation, day-before and 2-hour reminders.
- [x] Research calls 20 minutes everywhere.
- [x] Recording-consent line in the sales, research and kickoff scripts.
- [x] Welcome Guide merged with Drive's "How we stay in touch".

**Pack (27 Sept "in progress", all delivered):**
- [x] 23 A-tier one-pagers; 68 prospects.
- [x] Authority addendum; content register; three-second profile test; case-study template; sales-extra templates (MVM, proposal, installation-led first touch, booking questions).
- [x] Stack, lead-gen and API docs; Brand Brain gap map; invoice template.

**Strategy:**
- [x] Offer brief (13 Oct) and V2 (ChatGPT, 14 Oct).
- [x] Guarantee economics + editing dry run + paid-test spec (V1, then V2).
- [x] Business audit (15 Oct): coherent with the coaches.
- [x] Outreach reconciliation.
- [x] Sprint handoff.

**Accounts:**
- [x] `social@threadlinehq.com` alias.
- [x] Handles checked.
- [x] Competitor research confirmed labelled as research.

## 11. Order of work (suggested)

1. §0 decisions (offer, guarantee, Deloitte) → 2. §1 research messages + §6 handles → 3. §2 Apollo/Clay pilot + Attio → 4. §4 your dry run + editing test → 5. §3 copy rewrite → 6. §2 domains and warm-up → 7. §5 legal and ops before the first paying client.

## 12. Reclassified from the 27 September list

| 27 Sept item | Now | Why |
|---|---|---|
| Retire/isolate `threadlinex` | Done | Git disconnected 28 Sept |
| Connect threadlinehq.com | Done | Live 28 Sept |
| Resolve 15 vs 20 minutes | Done | 20 everywhere, 28 Sept |
| Create Diagnosis event | Done | 60 min, built to spec, 28 Sept |
| Apply the kickoff migration before pushing c45a2bc | Done | Applied and deployed 28 Sept |
| Merge the Welcome Guide into Drive | Done | Uploaded as a new version, 27 Sept |
| Authorised cron; >10 MB upload | Done (retrieval still open, §4) | Tested 28 Sept |
| DEFER "Smartlead and multi-mailbox infrastructure" | Active (§2, configuration pending) | 15 Oct audit: software sending and volume are course-aligned |
| "Offer stays a founding hypothesis"; DEFER freezing positioning | Replaced by §0 offer decisions | OFFER_BRIEF V2 |
| "Publish the first batch (1–14 Oct calendar)" | Re-plan after the offer (§6) | Calendar dates passed; offer changing |
| Message version, problem energy, awareness (DR-48) | Done | Fields exist in the schema |
| Reply class, scoreboard, required VOC | Still queued (§2/§7) | Not built yet |
