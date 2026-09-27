# Threadline lead-generation system

Written 26 September 2026 and restructured the same day to the revised authority order in `../authority/AUTHORITY_ADDENDUM.md` ("ADD"): EasyGrow 2.0 (EG) and Acquisition Nirvana (AN) now rank above the Imperium Academy material, with law and platform terms above both. Status: ADAPTATION (draft, owner review). This is the operating system around the assets that already exist. It does not replace them:

| Asset | What it covers |
|---|---|
| `../emails/BULK_LIST_FILTER_SPEC.md` | Filters, legal-form rule, verification, dedupe, infrastructure and sending limits |
| `../emails/CAMPAIGN_PACK.md` | Authority order, copy, Loom rules, compliance footer |
| `../emails/TEST_PLAN.md` | CE1: one segment, Loom placement, 1,000 first touches, sample gates |
| `../emails/REPLY_PLAYBOOK.md` | Reply handling, labels, the Engaged track, no-shows |
| `../prospects/PROSPECTS_README.md` | The research list, and the EasyGrow list-building method |
| `docs/launch-pack/outreach/*` | Research-track sequences, personalisation |

Where this document repeats a rule from those files, the rule lives in the source file.

**ICP.**
- Who: expert-led B2B founders in the UK and US.
- **One commercial segment first** (ADD D3; EG Roadmap "Choose ONE system to start", about 120 days): **recommended S2, strategy and GTM consulting** (reasoning in `CAMPAIGN_PACK.md` §5.1; owner to confirm, ADD §F.4).
- Later cells: S1 AI and digital-transformation advisory (the research wedge), S3 fractional executives and fractional CFO advisory, S4 specialist accounting and tax advisory.
- Offer: £2,500 implementation, then £2,500 every four weeks (initial 12 weeks = £10,000).

**Channels and daily volume (per weekday).**

| Priority | System | Volume | Authority basis |
|---|---|---|---|
| **1 (primary)** | **Loom OS cold email** in the one segment | **100 new verified prospects** (about 370 emails with follow-ups) on a separate 10-domain, 20-inbox set; solo fallback 50 | ADD D2, D4; EG Loom Alchemy Metrics `1Vdw1icoz-5eYm2lYBDnZfQ3MpFi7BrcY` ("100+ per day"); EG "9_ Sending Looms" `1FH9_rgnEGJXjfc9PsenWP27pAfcnb4n1`; EG "15 Scaling_ Account Creation" `1oS-3LmrkXclDZMp6QHAz_eaKaqDdVORG` |
| 2 | **Manual LinkedIn** (EG Trojan DM principle, typed by hand) in the same segment | 5 new touches, plus the post-reply connection note for every Engaged prospect | ADD D4; EG Cold DM OS (`1yH4RvC3…`, `1oLfE0MO…`: assess after 6 weeks); LinkedIn User Agreement §8.2 |
| 3 | **Phone, after a reply only** | Engaged and booked prospects, under the TPS/CTPS and TCPA rules | ADD D4, C.6; `REPLY_PLAYBOOK.md` §4.2 |
| — | A-tier value-first (Dream accounts) | **No longer a commercial system.** A-tier firms stay on the research track (`OUTREACH_SEQUENCES.md`), which the owner runs separately | ADD D3 (one system); EG Roadmap |
| — | Cold calling, SMS, WhatsApp, Facebook | **Not used** | Rank 1 (law and platform terms); ADD D9 |

---

## 1. Sources, ranked for this ICP (EG manual-first order)

EG's rule: find where the segment congregates, find an extraction point, extract by hand; databases last (EG "7_ Lead Sourcing" `1mGXKP3WhXrFhLBEkuqh1NBssnb6jIV3V`; "0 Lead Sourcing Walkthrough" `172lYWFDLQURazBwjZBQCk2x-LRpAqT3Q`). Full method: `../prospects/PROSPECTS_README.md`.

| Rank | Source | Best for | How to use it | Watch-outs |
|---|---|---|---|---|
| 1 | **LinkedIn** (free search or Sales Navigator, manual) | Founders and managing partners in S2 (and later S1, S3) | Filters: headcount 1–50; seniority Owner / Partner / CXO; keywords such as "GTM strategy", "commercial strategy", "pricing strategy"; UK or US; years in current company 2 or more. Open each profile, then the firm's site. | No export extensions, no automation ([User Agreement §8.2](https://www.linkedin.com/legal/user-agreement)). Sales Navigator Core costs $119.99 a month ([plans](https://business.linkedin.com/sales-solutions/compare-plans)); start with the free trial. EG's "buy Sales Navigator via Fiverr" tip is **not adopted** (rank 1). |
| 2 | **Directories and associations**: Consultancy.uk ([firms](https://www.consultancy.uk/firms)), Clutch ([consulting](https://clutch.co/consulting)), The Manifest, the Management Consultancies Association, the Institute of Consulting, conference speaker lists, podcast guest lists | Firms that publish their thinking (good first lines) | Browse by hand; note firm and founder; go to the site | Check each site's terms before any bulk copying; avoid over-mined "top 100" pages (EG: avoid a "'blasted' list") |
| 3 | **Firm website** | Owner name, first line, the Loom backdrop | About/team, insights, case pages | Only what the firm publishes |
| 4 | **Companies House** (UK) | Owner confirmation and the **legal-form check for every UK row**; S2 discovery by SIC **70229** | [Advanced search](https://find-and-update.company-information.service.gov.uk/advanced-search), status Active. Other codes for later cells: 70221 (fractional CFO), 69203 (tax consultancy), 69201 (accounting), 62020 (IT consultancy, S1), 73200, 70210, 74909 ([SIC list](https://resources.companieshouse.gov.uk/sic/)) | Finds companies, not emails. An unregistered consultant is probably a sole trader: do not email in the UK (§5). |
| 5 | **Email finder** (Snov.io or Hunter), then Ctrl-F on the site, Google, and a permutator | The named person's work address | EG email-finding order | Double-verify (§2) |
| 6 | **LinkedIn content engagers** | Warmest cold: founders commenting on strategy/GTM posts | Manual connection note that refers to their comment (counts in the 5 a day) | Manual only |
| 7 | **Apollo.io** or another database | Filling gaps only | Same filters | EG: "a last resort"; database lists are mailed by many agencies. Credits metered; plan price **unverified** (see STACK.md). |
| 8 | Communities, Slack groups, events | Relationships and referrals, **not lists** | Genuine participation only | **Never scrape member lists, never mass-DM, never drop links.** For UK individuals it is also unsolicited marketing under PECR. |
| 9 | Clay | First-line enrichment later | EG calls Clay first lines "by far the most powerful angle" | A person checks every line; later only (STACK.md) |

---

## 2. Enrichment and verification flow

```
Congregation point (LinkedIn / directory / association / Companies House)
  → Firm website: business-model filter (spec §1.1) → REJECT or continue
  → Owner: website → Google → Companies House (UK) or state filing (US) → social profiles
  → UK only: Companies House legal form. Ltd / PLC / LLP / Scottish partnership → continue.
      Sole trader / general partnership / unknown → drop (no cold email).
  → Screen check: does the named person read their own inbox? Unclear or gatekept → flag
  → Email: finder → Ctrl-F site → Google → permutator
  → Verify twice within 7 days of send: NeverBounce, then MillionVerifier. Valid on both only.
      Never catch-all, unknown, invalid or role addresses.
  → First line + URL (pattern list, CAMPAIGN_PACK §2.1), human-checked
  → Dedupe and suppression (spec §5, in order):
      suppression list → research track (every prospects.csv domain) → /admin/prospects any state
      → contacted in last 90 days → conflict list → in-list duplicates
  → Daily QA sample: 20 rows. Pass 70% or more, or stop and fix the source.
  → Random arm assignment (TEST_PLAN §2.1) → Loom recorded (arm A now; arm B at step 3)
  → Load to the sending tool; log in /admin/prospects and Attio with initial_send_date.
  → Batch bounce 2% or more → stop that source.
```

**Dedupe against the research list.** The research track is excluded from commercial outbound **at domain level**: `../prospects/prospects.csv` (68 rows, all "not contacted"), the Playbook V1 batch domains and the hold list. Run the dedupe before every batch.

---

## 3. Who gets what

| Group | Who | Touch | Owner time per prospect |
|---|---|---|---|
| **Primary cell** | Passes filters, verification, screen check and has a verified first line | Loom OS sequence (4 emails at +2/+2/+3 business days), arm A or B | Sourcing 2.5–4 min (EG 4–7 h per 100) + Loom about 3 min |
| **Engaged** | Any reply that is not directly negative | 8 touches every 2 business days, each with the booking link; honest omnipresence (LinkedIn note; phone only where allowed) | About 15 min across the track |
| **A-tier research** | Fit 8+, active founder voice (research list) | Research track only; never the commercial sequence | Owner's research time, outside this system |

---

## 4. Daily operating rhythm (UK time, every weekday; Friday also runs the control loop)

UK sends go 08:00–11:00 UK; US sends go 08:00–11:00 US Eastern (13:00–16:00 UK). The sending tool spaces them; oldest follow-ups first.

| Time | Block | Minutes (base, 100 a day, owner plus lead sourcer) |
|---|---|---:|
| 08:00–08:30 | **Reply sweep 1**: overnight US replies, bounces, opt-outs → suppression; label everything | 30 |
| 08:30–09:00 | QA sample on the sourcer's batch; load tomorrow's batch | 20 |
| 09:00–13:45 | **Looms**: about 95 at steady state (50 arm A new, 45 arm B step 3), about 3 min each | 285 |
| 12:00 | **Reply sweep 2** (inside the Loom block; target: every reply within 6 hours) | (in replies) |
| 13:45–14:05 | LinkedIn: 5 manual touches + connection notes for new Engaged prospects | 20 |
| 14:05–16:30 | **Call window** (overlaps US mornings): diagnosis calls, confirmation calls, no-show protocol | 26–163 (scenario) |
| 16:30 | **Reply sweep 3**; Engaged-track touches due today | (in replies) |
| 16:50–17:10 | Log touches, update Attio and `/admin/prospects`, next actions | 20 |

**Friday** (after sending): freeze counts by initial send date → rates per arm → first broken stage past its gate (`TEST_PLAN.md` §5) → change one variable or nothing → re-verify next week's list → export suppression.

---

## 5. Compliance

Working notes, not legal advice. The footer lives in `CAMPAIGN_PACK.md` §3. **Law and platform terms rank above EG/AN** (ADD §B rank 1; owner to confirm, ADD §F.1).

**UK: PECR**
- Checked against the ICO on 26 September 2026 ([ICO email marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/)).
- **Corporate subscribers** (companies, LLPs, Scottish partnerships, government bodies) can be emailed **without consent**, with identification, a working opt-out and a "do not email" list.
- **Sole traders and some partnerships count as individuals**: consent or soft opt-in only, and a cold prospect never qualifies. Most relevant to S3 and S4.
- **Calls:** screen against TPS and CTPS before any call. **Texts** to individuals need consent.
- The ICO page says the guidance is **under review following the Data (Use and Access) Act 2025**; not verified here. Re-read before the first send.

**UK: UK GDPR**
- A named business email is personal data; lawful basis **legitimate interests** with a short LIA (purpose, necessity, balancing).
- **Article 14 notice** at first contact: `data_source` and the privacy notice.
- Honour objections immediately and permanently; "not interested" is treated as an objection.
- Retention: delete non-responders after a set period (suggestion: 12 months), including their Looms. Keep the suppression list indefinitely.

**US: CAN-SPAM and TCPA** ([FTC guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business))
- Accurate headers; non-deceptive subject; identified as commercial; **a valid physical postal address**; opt-out honoured **within 10 business days** (house rule: same day). Penalties up to **$53,088 per email** (FTC figure as of January 2024).
- No autodialled or prerecorded calls or texts to mobiles without consent (TCPA).

**Mailbox providers**
- Spam rate below 0.10%, never 0.30% ([Google](https://support.google.com/a/answer/81126)). Bounce under 2% per inbox; stop at 5%.
- SPF, DKIM and DMARC aligned on every domain.

**LinkedIn**
- No automation, bots, scraping extensions or "safe" cloud tools ([User Agreement §8.2(2) and (13)](https://www.linkedin.com/legal/user-agreement)). Every touch typed by the owner.

**Platform safety doctrine.** Engagement (replies, comments, DMs, follows, connection requests) is **human**. Only publishing and analytics are automated, through official APIs.

**No fake or rented accounts, inboxes or personas.** Every inbox is Threadline's, in a real sender's name, on Google Workspace or Outlook. EG tactics that break this (free Gmail farms, AI-headshot personas, "Sent from my iPhone" when untrue, bought accounts, pre-recorded Looms presented as live) are **not adopted** (ADD D9).

---

## 6. The maths

### 6.1 Model inputs

- **Period:** one **four-week cycle of 20 working days** (the same unit as the billing period; never "monthly").
- **Email:** 100 new first touches a day = **2,000 first touches a cycle**, about 7,400 emails with follow-ups (5% drop-out per step). About 1,900 Looms a cycle at steady state.
- **LinkedIn:** 5 new manual touches a day = 100 a cycle.
- **Booked** means a diagnosis call booked. **Qualified** means fit, budget and timing confirmed. **Close** means signed and the implementation fee paid (in full or the first part of an agreed split).
- **Revenue per client:** £2,500 every four weeks, plus £2,500 implementation.
- **Rates now anchor to EG benchmarks** (ADD C.11), which are still **not Threadline facts**: the base case sits on the **Loom OS floors** (LVR 10%, PRR 2%, ABR 1%); pessimistic is half the floor; strong is the Loom Alchemy range. Replace with actuals once each clears its sample gate (`TEST_PLAN.md` §4.2).

```
closes = [first touches × ABR (email) + LinkedIn touches × ABR (LinkedIn)] × show × qualified × close
```

| Assumption | Pessimistic | Base | Strong | Source |
|---|---:|---:|---:|---|
| Loom view rate (LVR) | 7% | 10% | 20% | EG Loom OS floor 10%; Loom Alchemy 15–25% |
| Email positive replies ÷ first touches (PRR) | 1% | 2% | 4% | EG Loom OS 2%; Loom Alchemy 3–5% |
| Email bookings ÷ first touches (ABR) | 0.5% | 1% | 2% | EG Loom OS 1%; Loom Alchemy 1.5–2.5% |
| LinkedIn positive replies ÷ touches | 3% | 4% | 6% | EG DM minimum 4%, benchmark 6% |
| LinkedIn bookings ÷ touches | 0.5% | 1% | 2% | EG DM minimum 1%, benchmark 2% |
| Show rate | 65% | 80% | 90% | EG expects no-shows 10–20%; pessimistic kept from the earlier model |
| Qualified share of shows | 50% | 55% | 65% | Threadline planning placeholder (unchanged) |
| Close rate of qualified | 15% | 20% | 30% | Threadline placeholder (unchanged); EG's "20-40%" is a marketing claim, not verified |

### 6.2 Funnel: one steady four-week cycle (100 email + 5 LinkedIn a day)

| Per cycle (20 working days) | Pessimistic | Base | Strong |
|---|---:|---:|---:|
| Email first touches | 2,000 | 2,000 | 2,000 |
| Looms sent | ~1,900 | ~1,900 | ~1,900 |
| Loom views | 133 | 190 | 380 |
| LinkedIn touches | 100 | 100 | 100 |
| **Positive replies** (email + LinkedIn) | **23** (20 + 3) | **44** (40 + 4) | **86** (80 + 6) |
| **Calls booked** | **10.5** | **21** | **42** |
| **Shows** | **6.8** | **16.8** | **37.8** |
| **Qualified** | **3.4** | **9.2** | **24.6** |
| **Closes** | **0.51** | **1.85** | **7.37** |
| New recurring revenue per four-week cycle | £1,280 | £4,620 | £18,428 |
| Implementation fees collected | £1,280 | £4,620 | £18,428 |
| Cycles of steady activity to reach **2 clients** (£5,000 every four weeks) | 3.9 | 1.1 | 0.3 |
| Owner hours per working day, with a lead sourcer (§6.4) | 6.5 | 7.6 | 10.0 |
| Owner hours per working day, owner sourcing alone | 12.0 | 13.1 | 15.5 |

**How to read it.**

1. **Lead time before any send.** 2–4 weeks of domain warm-up (ADD E.1.3), during which the sourcer builds the first 1,000. Then CE1 runs 10 business days of first touches and about 5 weeks to its full read (`TEST_PLAN.md` §2.3). **The first cycle after warm-up produces calls, not revenue**; in the base case the first close lands in the second cycle.
2. **Capacity is the binding constraint, not leads.** 100 a day is not a one-person job: sourcing alone is 4–7 hours (EG sizing), Looms about 4.75 hours. **Owner decision (CAMPAIGN_PACK B10):** a lead sourcer, or the solo fallback in §6.5.
3. **Delivery cap.** In the **strong** case, 7 closes a cycle far exceeds a founder-run service. Cut volume or raise the qualification bar; the goal is **2 clients**, then the AN Law of 15 (stay done-for-you until 15–30 happy clients; ADD D13).
4. **Pessimistic case.** 0.5 closes a cycle is about 4 cycles to 2 clients. Under EG doctrine that is still not a reason to change copy before the gates: first find the broken stage, and if ABR is in KPI, add volume (`TEST_PLAN.md` §5).
5. **Decision thresholds.** No copy or offer decision before about 500 first touches per arm; PRR read after 45 Loom views; ABR read after 9–10 positive replies; show rate after 30 bookings; sales script after 30–50 calls (ADD E.1.7, C.11).

### 6.3 List consumption against the addressable list

The addressable sizes are **placeholders, not researched facts**. Replace on day 1 with: `segment count (LinkedIn or Companies House) × manual-QA pass rate × verification yield`.

| Segment | Placeholder addressable (UK+US, after filters) | People used a cycle | Cycles to touch everyone once | Names to extract a cycle (at a placeholder 60% find-and-verify yield) |
|---|---:|---:|---:|---:|
| **S2 Strategy / GTM (primary)** | 15,000 | 2,100 | ~7 | ~3,500 |
| S1 AI advisory (research wedge) | 4,000 | (not in CE1) | <2 at this volume | — |
| S3 Fractional exec / CFO (UK: Ltd/LLP only) | 8,000 | (later) | ~4 | — |
| S4 Specialist accounting / tax | 12,000 | (later) | ~6 | — |

**Implications.**
- The EG commitment of about 120 days (about 4.3 cycles) uses about 9,000 S2 prospects: inside the placeholder pool, but only if the real count is close to it. **Measure it in week 1.**
- S1 at this volume would be exhausted in under two cycles and would collide with the research track; this is the main reason S2 is recommended (`CAMPAIGN_PACK.md` §5.1).
- Non-responders are not re-sent within 90 days; re-approach after 6 months or more only with a new angle.

### 6.4 Owner time per working day (100 a day)

| Block | Pessimistic | Base | Strong |
|---|---:|---:|---:|
| Sourcing 100 verified prospects (EG: 4–7 h per 100; midpoint) — **zero if a sourcer is hired** | 330 | 330 | 330 |
| Looms (~95 × 3 min) | 285 | 285 | 285 |
| Reply handling, labels, Engaged track, omnipresence | 35 | 60 | 110 |
| LinkedIn manual (5 touches + connection notes) | 20 | 20 | 20 |
| Diagnosis calls incl. prep (75 min per show) | 26 | 63 | 142 |
| Confirmation calls and no-show protocol (10 min per booking) | 5 | 10 | 21 |
| CRM logging and Friday numbers (averaged) | 20 | 20 | 20 |
| **Total, owner sourcing alone** | **721 min = 12.0 h** | **788 min = 13.1 h** | **928 min = 15.5 h** |
| **Total with a lead sourcer** | **391 min = 6.5 h** | **458 min = 7.6 h** | **598 min = 10.0 h** |

Delivery for signed clients comes **on top**. From client 2 onwards, delivery time is found by moving Loom recording to arm B's pattern (Looms only at step 3) if CE1 shows no clear difference.

### 6.5 Solo fallback: 50 a day (owner sourcing and recording)

| Per cycle | Pessimistic | Base | Strong |
|---|---:|---:|---:|
| Email first touches | 1,000 | 1,000 | 1,000 |
| Calls booked (incl. LinkedIn) | 5.5 | 11 | 22 |
| Shows | 3.6 | 8.8 | 19.8 |
| Qualified | 1.8 | 4.8 | 12.9 |
| Closes | 0.27 | 0.97 | 3.86 |
| Cycles to 2 clients | 7.5 | 2.1 | 0.5 |
| Owner hours per working day | 6.4 | 7.0 | 8.2 |

At 50 a day, CE1 takes 20 business days to reach 500 per arm, so the first read moves out by two weeks.

---

## 7. Optimisation levers, ranked by modelled impact (base case: 1.85 closes a cycle)

Each row changes one assumption and holds the rest. **Order of work follows EG: fix only the first broken stage, and only after its sample gate** (`TEST_PLAN.md` §5).

| Rank | Lever | Change modelled | Closes a cycle | Uplift |
|---|---|---|---:|---:|
| 1 | **Offer and risk reversal** (the milestone refund, **DECISION PENDING**, `CAMPAIGN_PACK.md` §1.3) | ABR 1% → 1.25%, close 20% → 24% (EG: an offer "can move your sales conversion rate by 10-40%") | 2.77 | **+50%** |
| 2 | **List quality** (manual sourcing, verified, unscreened, real first lines) | ABR 1% → 1.2%, qualified 55% → 62% | 2.48 | **+34%** |
| 3 | **Reply speed and the Engaged track** (under 6 hours; 8 touches; omnipresence) | ABR 1% → 1.3% on both channels | 2.40 | **+30%** |
| 4 | **One-call close and the payment concession ladder** (`SALES_CALL_GUIDE.md` §9.1, §11.1) | Close 20% → 25% | 2.31 | **+25%** |
| 5 | **Show-rate protocol** (book 2–4 days out, 24-hour confirmation, one-hour message, no-show protocol) | Show 80% → 90% | 2.08 | **+12%** |

**Speed and show rate together** (ranks 3 and 5) give **2.70 closes a cycle (+46%)**, cost nothing and need no new copy or list: **do these from day 1**. The offer lever waits for the owner's risk-reversal decision; test it only after the 500-per-arm gate, as one variable.

---

## 8. CE1 checkpoints

`TEST_PLAN.md` is the source. CE1 = 1,000 first touches in the one segment, 500 per arm, 100 a day, 20 inboxes.

| Checkpoint | When | Pass | If it fails |
|---|---|---|---|
| C0 | Before send 1, after at least 2 weeks' warm-up | Seed tests land in the inbox from every domain; merge fields, spintax, Loom links, footer, postal address, opt-out and reply routing work | Do not send |
| C1 | 100 first touches | Per-inbox bounce under 2%; no complaint; replies reach the monitored inbox | Pause; fix |
| C2 | 300 first touches, then weekly | Bounce under 2% per inbox, 0–1 complaints, seed placement per arm, no blocklist listing | Pause the inbox or domain; fix infrastructure before copy |
| C3 | 500 per arm through all 4 steps + 7 business days | Base yardstick (Loom OS floors): about 100 Loom views, 20 positive replies, 10 bookings across both arms. Pessimistic: about 70 views, 10 positives, 5 bookings. | First-broken-stage table; change one variable, or none if ABR is in KPI |

**Hard stops at any time:** an inbox at 5% bounce; a **second** spam complaint; any blocklist listing. **Never judge** a rate whose denominator is under 10.
