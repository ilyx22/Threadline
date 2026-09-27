# List filter and sourcing spec (commercial cold email)

**Status:** ADAPTATION (draft, owner review), 26 September 2026; restructured the same day to the revised authority order (`../authority/AUTHORITY_ADDENDUM.md`, "ADD"). No list has been pulled and no contact has been exported. The full step-by-step sourcing method is in `../prospects/PROSPECTS_README.md` §"EasyGrow list-building method"; this file holds the filters, the quality rules, dedupe and the sending infrastructure.

**What changed:** the list is now built **by hand first** from where the segment congregates, with a database (Apollo) as a last resort; one segment first (recommended S2); double verification with **no** catch-all and no role addresses; 100 verified prospects a weekday; a separate 10-domain, 20-inbox outbound set at no more than 20 emails per inbox per day.

**Authority basis (in rank order, ADD §B):**
1. Law: PECR (corporate versus individual subscribers), UK GDPR Art. 14, CAN-SPAM; LinkedIn User Agreement §8.2 (no scraping or automation).
2. **EasyGrow 2.0:** "7_ Lead Sourcing" (Drive `1mGXKP3WhXrFhLBEkuqh1NBssnb6jIV3V`) and "0 Lead Sourcing Walkthrough" (`172lYWFDLQURazBwjZBQCk2x-LRpAqT3Q`) for the manual method, sources and quotas; "17 Email System FAQs" (`1t4bHEn6l1MxUDbPwGglH49eMsFbs6f5d`) for accept-all and role addresses; "15 Scaling_ Account Creation" (`1oS-3LmrkXclDZMp6QHAz_eaKaqDdVORG`), "11 5_ Deliverability" (`14KW7Q2H…`) and the Deliverability Master Checklist (`1pJWf0XZ…`) for infrastructure and bounce limits; "14 Your Easygrow Roadmap" (`1OgnSxoIlNyxNo-I91G0iIUxXdy7VVrPl`) for one system; The Loom Doctor (`1zTcCZN4G6wYwiIB_puMXeDHzwVieWWQM`) for the screen check.
3. Imperium Academy-level Threadline documents: Execution Manual V14.3 §11 and the 7 Sept correction (Drive `1EhDghb6YVA28Zus0yQRniRHtB-x0TB5Q2oduj-duAY0`); First US Playbook V1 business-model filter and reject list (Drive `1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s`); GTM SOP §§4, 7, 9, 20, 25, 28 (Drive `1Nwp2mzwaR8CNYKtxzvob2pLTBm0sCA_uoMmvEr5vP_g`); `../../outreach/PERSONALISATION_AND_RESEARCH.md` §2.
5. Fazio: relevance and effort segmentation (Integration Audit item 3, Drive `1R_z8MqPbe2OflFNKCUNeCsXDsaKSKl--gflF5i7rX98`); AOM §3 "Do not contact C."

---

## 0. One segment first

CE1 uses **one** segment (ADD D3; EG Roadmap "Choose ONE system to start", about 120 days). **Recommended: S2, strategy and GTM consulting** (reasoning in `CAMPAIGN_PACK.md` §5.1; owner to confirm). The S1, S3 and S4 filters below are kept ready for later cells and are **not** pulled for CE1.

---

## 1. Filters that apply to every segment

| Filter | Setting | Why |
|---|---|---|
| Person location | United Kingdom **or** United States (50 states + DC) | GTM §3 validation geographies |
| Company HQ location | Same | Keeps the firm in scope for UK/US law and buyer context |
| Excluded geographies | Canada, EU/EEA, Australia and everywhere else | Not covered by the compliance notes (CASL, EU ePrivacy, Spam Act) |
| Seniority | Owner, Founder, C-suite, Partner | Founder/principal involved in sales or delivery (PB filter); EG "Send to personal addresses" of the owner |
| Employee count | 2–50 by default (segment overrides below); **exclude 200+ outright** | GTM §4 ICP; PB reject "large consultancy" |
| Email | **Personal, named address at the company domain only.** No free-mail (gmail, googlemail, outlook, hotmail, live, yahoo, icloud, me, aol, proton, gmx, btinternet, sky, virginmedia). **No role addresses** (info@, hello@, contact@, admin@, office@, team@, sales@, enquiries@, support@). | EG FAQ says "No" to info@; EG "Send to personal addresses"; PECR (free-mail often means an individual subscriber) |
| Contacts per firm | **One** (the most senior founder or managing partner) | One conversation per firm |
| Firm in one segment only | Assign by its primary offer | Keeps cells clean (GTM §7) |
| Must have | A working website and a findable description of what the firm sells; the website is also where the Loom is recorded | Business-model filter; Loom OS (recorded over the prospect's site) |
| Screen check | The named person appears to read their own inbox (founder-signed replies, no "PA to" or gatekeeper routing visible) | EG Loom Doctor: screened niches need another system |

### 1.1 Exclude everywhere (business-model filter, Playbook V1)

**Keyword exclusions** (company description / keywords / industry tags):
- *Commodity AI / automation shops:* chatbot, AI agency, automation agency, AI automation, n8n, Zapier, Make.com, RPA implementation, "AI agents for small business", voice agent, lead-gen automation.
- *Staff augmentation / dev shops:* software development, app development, web development, custom software, nearshore, offshore, outsourcing, staff augmentation, dedicated developers, IT staffing, body shop.
- *Low-ticket SMB as the dominant model:* bookkeeping (as primary service), virtual assistant, payroll bureau, "for small business owners" packages, fixed-fee accounting packages, tax preparation (individual returns).
- *IT operations:* managed services / MSP, IT support, VAR, reseller, systems integrator, Microsoft/Salesforce/HubSpot implementation partner.
- *Competitors and adjacent sellers (not buyers):* marketing agency, content agency, LinkedIn agency, ghostwriting, personal branding, PR agency, video production, SEO, lead generation, appointment setting, demand generation agency, SDR outsourcing.
- *Other:* recruitment / executive search, training/course sellers and coaching as the main model, software vendors (SaaS), public sector bodies, universities, non-profits. Tender/framework-led firms are a GTM §4 disqualifier.

**Named large-firm exclusions** (company name contains): Accenture, Deloitte, PwC, EY / Ernst & Young, KPMG, McKinsey, BCG / Boston Consulting Group, Bain, Oliver Wyman, Kearney, Roland Berger, Capgemini, IBM, Cognizant, Infosys, TCS / Tata Consultancy, Wipro, HCL, Grant Thornton, BDO, RSM, Baker Tilly, Mazars / Forvis Mazars, Crowe, Moore, CLA / CliftonLarsonAllen, Protiviti, Huron, FTI, Alvarez & Marsal, Gartner, Forrester. Plus anything with 200+ employees.

**Conflict exclusion.** The founder's employer (Deloitte, per `OUTREACH_SEQUENCES.md` §0.2) and any firm on the conflict list the owner confirms during employer clearance. **Owner to supply the conflict list** before the first batch.

**Mature authority machines** (PB reject for commercial outreach): drop firms with a visible in-house content team or an evidently consistent, multi-format founder content engine; they are research-track positive controls.

**"Blasted" lists** (EG): if a source is a public list that many agencies obviously mail (for example a directory's top-100 page), prefer less-mined extraction points.

---

## 2. Segment filters

These are the criteria the sourcer checks by hand; where a database is used to fill gaps, the same values are its filters.

### S2: Strategy and GTM consulting — **CE1 primary (recommended)**

| Filter | Setting |
|---|---|
| Titles | Founder; Co-Founder; CEO; Managing Partner; Managing Director; Principal; Partner (firms of 50 or fewer); Owner |
| Size | 2–50 |
| Industries | Management Consulting; Business Consulting and Services |
| Include keywords (any) | go-to-market strategy; GTM strategy; commercial strategy; growth strategy; pricing strategy; market entry; revenue strategy; commercial due diligence; corporate strategy; positioning strategy; B2B strategy consulting |
| Extra exclusions | HubSpot/Salesforce partner; RevOps implementation; CRM implementation; sales training; outsourced SDR; marketing agency; "growth agency" |
| Where they congregate | LinkedIn (founder profiles and company pages); Consultancy.uk and Clutch (strategy categories); the Management Consultancies Association and the Institute of Consulting (UK); Consulting-focused podcasts and conference speaker lists; Companies House SIC 70229 (UK) |

### S1: AI advisory and transformation — later cell

| Filter | Setting |
|---|---|
| Titles | Founder; Co-Founder; CEO; Managing Director; Managing Partner; Principal; Owner; Fractional Chief AI Officer / Fractional CAIO; Chief AI Officer (only at their own advisory firm) |
| Size | 2–50 |
| Industries | Management Consulting; Business Consulting and Services; IT Services and IT Consulting **only with an include keyword and no dev/MSP keyword** |
| Include keywords (any) | AI strategy; AI transformation; AI governance; responsible AI; AI adoption; AI readiness; AI risk; AI advisory; fractional CAIO; digital transformation advisory; AI change management; AI operating model |
| Notes | The research wedge: the research-list dedupe in §5 matters most here. |

### S3: Fractional executives and fractional CFO advisory — later cell

| Filter | Setting |
|---|---|
| Titles | Founder; Co-Founder; Managing Partner; Managing Director; Principal; CEO; Owner; **and** Fractional CFO; Part-time CFO; Portfolio CFO; Outsourced CFO; Interim CFO; Fractional COO / CTO / CRO (secondary) |
| Size | 1–50. **A one-person practice only if incorporated** (UK: Ltd or LLP at Companies House; US: LLC/Inc/PC or a firm domain and trading name) |
| Industries | Financial Services; Accounting; Management Consulting; Business Consulting and Services |
| Include keywords (any) | fractional CFO; part-time CFO; outsourced CFO; CFO services; FP&A advisory; fundraising readiness; investor readiness; exit readiness; board reporting; financial strategy; fractional executive |
| Extra exclusions | bookkeeping-first firms; low-ticket "CFO for $X" packages (manual check); payroll; tax preparation; fractional CMO / marketing (competitor adjacency) |
| UK PECR | **Exclude sole traders** (individual subscribers). |

### S4: Specialist accounting and tax advisory — later cell

| Filter | Setting |
|---|---|
| Titles | Founder; Managing Partner; Partner (firms of 75 or fewer); Principal; CEO; Owner; Director (only if a founder or owner) |
| Size | 2–75 |
| Industries | Accounting; Financial Services; Legal Services (tax boutiques only) |
| Include keywords (any) | international tax; cross-border tax; transfer pricing; transaction tax; M&A tax; VAT advisory; R&D tax (specialist boutiques); state and local tax / SALT; tax controversy; IRS representation; private client tax (high net worth); forensic accounting; valuation; restructuring advisory |
| Extra exclusions | general practice / "accountants for small business"; bookkeeping; payroll; individual tax returns; contingency-fee R&D claim volume shops; the named large-firm list; top-50 UK and top-100 US accounting firms |
| UK PECR | **Exclude general partnerships in England, Wales and Northern Ireland** (individual subscribers). LLPs, companies and Scottish partnerships are corporate subscribers. |
| Screen risk | Higher (partners' assistants). Run the screen check on every row. |

---

## 3. Legal-form column (UK rows)

Every UK row carries `legal_form` ∈ {Ltd, PLC, LLP, Scottish partnership, general partnership, sole trader, unknown}, checked at Companies House (free search). Send only to Ltd, PLC, LLP and Scottish partnership. `unknown` is not sent. US rows: `legal_form` optional. See `CAMPAIGN_PACK.md` §3.1.

---

## 4. List hygiene and quality gates

1. **Build by hand first** (EG 7_ Lead Sourcing: "The manual process … WILL get the best results"). Method, order and quotas: `../prospects/PROSPECTS_README.md`. Apollo or another database only to fill gaps ("a last resort", EG 0 Lead Sourcing Walkthrough). Never scrape LinkedIn or use export extensions.
2. **Quota:** 100 new verified prospects a weekday for the primary cell (EG: "100 leads for the day"; budget 4–7 hours per 100). Solo fallback: 50.
3. **Verify twice**, within 7 days of the send date: NeverBounce, then MillionVerifier (EG double verification). **Send only "Valid" on both.** Catch-all / accept-all, unknown and invalid are **never** sent (EG FAQ says "No" to accept-all; this replaces the earlier 10% catch-all allowance).
4. **Still in role.** Exclude anyone who has left, or started in the role in the last 30 days.
5. **First line.** Every row carries one verified first-line observation and its URL (`CAMPAIGN_PACK.md` §2.1). No first line, no send.
6. **Manual QA sample.** A second person (or the owner, the next morning) opens 20 random rows from each day's batch and checks the business-model filter, the first line and the screen check. **If fewer than about 70% pass, stop and fix the source** before the batch is loaded. Keep the pass rate: it is the qualified-universe estimate (GTM §9).
7. **Batch bounce gate.** If a batch bounces at 2% or more, stop using that source until fixed (EG "no more than a 2% bounce rate"; ADD E.2.8).
8. **Data source column.** Record `data_source` per row (for example "firm website; public LinkedIn profile; Snov.io"). It appears in the footer and the privacy notice (UK GDPR Art. 14).
9. **Freshness.** Do not send to any row older than 30 days without re-verifying.

---

## 5. Dedupe and suppression (in this order, before every send batch)

Match on **email address**, **company domain**, and **normalised firm name + person name** (fuzzy match; a person reviews near-misses).

| Order | Remove anyone who is… | Match level | Source |
|---|---|---|---|
| 1 | On the **suppression list**: opted out, asked for deletion, complained, bounced, "not interested", or closed after the Engaged track | Email; opt-outs and complaints also by domain | Sending tool + `/admin/prospects` |
| 2 | On the **research track**: the Playbook V1 15-prospect batch, the refreshed eight-account pack, the hold list, anyone in `/admin/market` research records or any research outreach, and every firm in `../prospects/prospects.csv` | **Domain** (the whole firm) | See list below |
| 3 | Already in `/admin/prospects` in any state (active, NOT_FIT, LOST, WON, client) | Domain | Admin export |
| 4 | Contacted by Threadline on any channel in the last 90 days | Email and domain | Touch log |
| 5 | On the conflict list (§1.1) | Domain / firm name | Owner |
| 6 | A duplicate within the list | Email and domain | This list |

**Research-list domains to exclude now** (Playbook V1 "First US batch"; re-check against the current Attio/admin records): thehostettergroup.com · aimlgovernance.com · arcpointconsulting.com · novarastrategies.com · regavon.com · starrettconsulting.com · paralleladvisory.co · techloveconsulting.com · RousseauAI (match by name) · foresight-consult.com · aventurasoft.com · idealstate.co · periculum.us · interactiveintel.com · bosio.digital. **Hold list (match by name):** South Florida AI (Kevin Sanchez) · Omnine (Dr Matt Goodwin) · Provenance (Ryan Vasquez) · US AI Advisors. Plus **every website domain in `../prospects/prospects.csv`** (68 rows, including 13 S2 firms).

**Suppression is permanent and portable.** Export after every batch and import into every future list and tool. Never re-add an opt-out (`OUTREACH_SEQUENCES.md` §10).

---

## 6. Sending infrastructure and daily limits

| Item | Rule | Authority basis |
|---|---|---|
| Domains | **10 secondary sending domains** that are clearly Threadline (truthful From line). **Never `threadlinehq.com`**, the primary brand and founder mailbox domain. Owner approval and budget: ADD §F.3. | EG-SCALE scale table; GTM §28 (protect the primary brand) |
| Inboxes | **2 per domain = 20**, Google Workspace or Outlook only, each in the real sender's name (for example first name and first.last). No invented senders, no free-mail, no bought accounts. | EG-SCALE ("Maximum 2 inboxes per domain"; "only … Google Workspace & Outlook"); rank 1 honesty |
| Per inbox per day | **At most 20 emails, warm-up included.** Never raised; scale by adding domains. | EG-SCALE ("never exceed the 20 limit per day"; "We DO NOT increase the amount of emails we send per account") |
| Daily total | About 100 new first touches plus follow-ups (about 370 at steady state). With warm-up inside the cap, 20 inboxes carry about 90 new a day; add 2 domains / 4 inboxes for a full 100 (owner decision). | EG-SEND; `CAMPAIGN_PACK.md` §0.4 |
| Warm-up | At least 2 weeks before the first cold send, 3–4 better; on for life. Owner decision on any warm-up network that simulates engagement. | EG Cold Email Mastery; EG-SCALE |
| Authentication | SPF, DKIM (2048-bit) and DMARC on every domain, aligned with the From domain; DMARC reporting on; all domains in Google Postmaster Tools | EG Deliverability |
| Unsubscribe | One-click `List-Unsubscribe` header (RFC 8058) plus the reply opt-out in the footer | CAN-SPAM; Google/Yahoo bulk-sender rules |
| Content | Plain text; no images, attachments or tracking; open and click tracking off; only arm A's email 1 carries one plain Loom link (`CAMPAIGN_PACK.md` §2.2) | EG-COPY |
| Timing | Every weekday (Monday–Friday), 08:00–11:00 recipient local time; UK and US separately; spread across the window (random gaps), oldest follow-ups first | EG-SEND |
| Reply handling | All inboxes forward replies to one monitored inbox, answered the same business day, target under 6 hours (`CAMPAIGN_PACK.md` B7) | EG-SEND (cold-to-warm forwarding); EG Testing Flow |
| Bounce | Under 2% per inbox; **warn at 2%, stop that inbox's sequence at 5%**; any bounced address is stopped at once | EG-SCALE; ADD E.1.3 |
| Placement | Weekly seed test per domain | ADD E.1.3 |
| Stop rules | 5% bounce in an inbox, a second complaint in the cell, or a blocklist listing: pause that inbox or domain (`TEST_PLAN.md` §2.4) | EG; Google spam-rate ceiling |

---

## 7. Export columns

`segment | arm | geography | first_name | last_name | title | firm | company_domain | email | verify_1_result (NeverBounce) | verify_2_result (MillionVerifier) | verify_date | employee_count | legal_form | companies_house_number | linkedin_url | source_point | data_source | screen_check (reads own inbox Y/N/unclear) | first_line | first_line_pattern | first_line_url | qa_pass (Y/N) | qa_note | sourcing_minutes | loom_url | loom_views | dedupe_checked_date | sending_inbox | message_version | initial_send_date | label (Not Interested/Engaged/Booked/No-Show) | tps_ctps_checked (UK phone only) | phone_source`

No column may hold private information, family or health details, or guesses about revenue (`PERSONALISATION_AND_RESEARCH.md` §1).
