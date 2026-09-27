# Threadline prospect list — 26 September 2026

`prospects.csv` (UTF-8, all fields quoted) has one row per firm: the 15-firm first US batch after its re-check, plus 53 newly researched firms. That is 68 rows: 46 qualified new firms and 7 informative rejects.

This is desk research only. Nobody has been contacted, no accounts were created and no Drive files were changed. Every row has status `not contacted`.

## Authority basis

The work follows the Drive playbook **THREADLINE_FIRST_US_RESEARCH_PROSPECT_BATCH_AND_OUTREACH_PLAYBOOK_V1**.

- **Authority hierarchy.** Charlie Morgan / Imperium is the primary acquisition authority. Dream 100 and pre-completed value is the supporting execution doctrine.
- **Doctrine translation** section:
  - list quality comes before copy;
  - business-model fit is checked before the Authority-System Gap;
  - A-tier gets disproportionate research and pre-completed value;
  - B-tier gets truthful personalisation without spending founder time.
- **Business-Model Filter.** This is applied first. It produces `bm_filter_pass` and `bm_filter_reason`.
- **Authority-System Gap, 10 dimensions.** These are scored qualitatively and written into `gap_dimensions` and `gap_hypothesis`.
- **A / B / REJECT definitions.** These produce `tier` and `fit_score` (1–10).
- **Channel selection rule by prospect.** This produces `channel`:
  - A-tier with an active LinkedIn → LinkedIn;
  - A-tier with weak LinkedIn but a business email → email;
  - A-tier with no easy contact → contact form, then LinkedIn;
  - B-tier → the shortest truthful channel.
- **What to log before send.** This defines the columns, including `next_action` and `due_date`.
- **Refreshed A-tier micro-assets (21 Sept 2026).** Regavon stays removed and RousseauAI is re-qualified.
- **GTM Market Durability SOP.** Section 3 sets the first wedge: AI/digital-transformation advisory in the US and UK. Section 20 sets the order for adjacent expansion: strategy/GTM, then finance/CFO, then accounting/tax. The new segments are sized in that order.

> **Authority order update (26 September 2026).** The playbook's hierarchy above ("Charlie Morgan / Imperium is the primary acquisition authority") is now refined by `../authority/AUTHORITY_ADDENDUM.md` §B: law and platform terms first; then EasyGrow 2.0 and Acquisition Nirvana (Charlie Morgan's Imperium acquisition programmes); then the general Imperium Academy material; then live Threadline evidence; Daniel Fazio stays tactical. This list is a **research-track** list and its rows are unchanged. The commercial list is built with the EasyGrow method in the last section of this file. ADAPTATION (draft, owner review).

## Method

1. **Re-check of the existing 15.** For each firm I fetched the live site and confirmed the founder on the firm's own site or a public profile. I captured one current observation per firm.
2. **New research.** For each of the four segments I searched, fetched each candidate's home, about/team and insights pages, and checked:
   - how recent the content is;
   - whether there are case studies, a newsletter or a podcast.

   I ran the filter first, then the gap scoring. I dropped any firm where I could not find a real, specific, URL-cited observation.
3. **Founder names.** A name is filled in only when the firm's site or a public profile states it. Otherwise the field is blank.
4. **Email addresses.** No personal emails were guessed or scraped. Where email is the channel, or a site lists a generic inbox, the address is replaced with `find via tool`. Business phone numbers are recorded only where the firm publishes them on its own site.
5. **Next actions and due dates:**

| Tier | Next action | Due |
|---|---|---|
| A | Re-verify latest activity → build a 1-page pre-completed asset → Step-1 research message | 2026-10-01 |
| B | Re-verify → Step-1 message, with no bespoke asset until there is a signal | 2026-10-08 (my default; the brief did not set one) |
| REJECT | Archive | none |

## Counts

| Segment | A | B | REJECT | Total |
|---|---|---|---|---|
| AI advisory/transformation: re-checked 15 | 7 | 6 | 2 | 15 |
| AI advisory/transformation: new (9 US, 7 UK) | 5 | 11 | 2 | 18 |
| Strategy/GTM consulting (6 US, 6 UK) | 4 | 8 | 1 | 13 |
| Fractional executive / CFO advisory | 4 | 6 | 2 | 12 |
| Specialist accounting/tax advisory | 3 | 5 | 2 | 10 |
| **Total** | **23** | **36** | **9** | **68** |

That gives 46 new qualified firms (16 new A, 30 new B) and 23 A-tier accounts in total.

Several B-tier firms are **positive controls**: firms whose authority system is already mature. Per the playbook section "Why positive controls matter", they are useful for research calls rather than as pain-heavy prospects. They are:

- Periculum, Interactive Intel, bosio.digital;
- Arion Research, LaTour AI, AI Mindset, Future Solving Co., Formation Advisory;
- Magnus, Monevate, Pricing I/O, DemandMaven, Bridge Group;
- VCMO, CFO Advisors;
- Kene, VITA.

## Re-check results for the existing 15

- **Verified live, founder confirmed:** Hostetter Group, ArcPoint, Novara, Parallel Advisory, Aventurasoft, Ideal State, Periculum, Interactive Intel, bosio.digital.
- **AIML Governance:** live. The firm site gives only the founder's first name, "Deidra". Search results and deidraproctor.com suggest the surname Proctor, but the firm's site never says so, so the field stays "Deidra". Her personal LinkedIn headline currently shows "Paradigm Alliance Group", so check that before any outreach. The /team/ and /blog/ pages return 404.
- **Regavon:** remains **REMOVED**. The site still says it is "not a firm, product or commercial practice".
- **RousseauAI:** **REJECT**. The live site sells $97 seven-day challenges and $497–$2,997 toolkits. The $25k roadmap, $100k sprint and fractional CAIO offers now appear only in stale search snippets, so it fails the filter on "low-ticket dominant model".
- **Foresight Consulting Group:** founder **verified** on the firm's own About page as **Lena Harness**. Upgraded to A.
- **Tech Love Consulting:** downgraded to **B**. The site is a JS shell whose content cannot be read. Its sitemap points to techlove.consulting, which does not resolve. Public posts are framed for SMBs, so the economics are uncertain.
- **Starrett Consulting:** kept at **A**, with lower confidence. The site is JS-rendered and now leads with investigations. The AI-governance positioning lives on the sister site starrettlaw.com, which is where the observation comes from.

## Caveats and failed verifications

- **Founder LinkedIn activity was not measured.** It was inferred at most from search snippets, so treat every "LinkedIn" channel as provisional and re-check it before sending, as the playbook requires.
- **Founder not identified, so the field is blank:**
  - Head of AI (headofai.ai);
  - CFO Advisors (Alex Wu is listed as Managing Partner, but founder status is unverified);
  - Charles River CFO;
  - Synvestable and Alexander Clifford (both REJECT).
- **Third-party or snippet-only facts, not confirmed on the firm's own site:**
  - VITA's founder, Greg McNally (press interviews);
  - Revenue Funnel's roughly £21k fee;
  - Monevate's $4M revenue;
  - Northstar Clarity's founding year (Wikipedia);
  - AI Advisory Group's Denver location and Insight AI's Mesa location;
  - DemandMaven's founder role (inferred from social links).
- **Size or segment edge cases:**
  - Kene Partners and CFOx may exceed 50 people.
  - Blais Halpert is a tax *law* boutique, not an accounting firm.
  - Holden Advisors' founder has stepped back, so the likely contact is CEO Brian Doyle.
  - Flow Partners' co-founder Olek Skwarczek's LinkedIn headline shows another venture ("Multiples"), so confirm which partner is active.
  - Parallel Advisory's founder also runs other ventures.
- **Pages that failed to fetch:**
  - blog.summone.co.uk;
  - LITax /about and /tp-benchmarking;
  - AIML Governance /blog and /team;
  - Deeks /newsletter/;
  - 5FT View's blog;
  - Flow Partners' overview PDF.
- **Dropped for lack of a verifiable observation or founder:**
  - Fractional AI Advisors, uptakeAI, NorthStar Intelligence;
  - Bluebird Partners, The Finance People;
  - Leo Berwick, Constable VAT, AVS VAT.
- **Dropped for fit:**
  - ScaleWithCFO (solo, low-ticket);
  - BaseFirma, Blue Ridge Partners (too large);
  - T2D3 (a product);
  - RH Blake (execution agency);
  - Quantum, Pace Pricing (outside the target geographies).
- **Observations are dated 26 September 2026.** The playbook requires re-verifying the person and their latest activity immediately before any send.

## Corrections applied 27 Sept

These are the CSV corrections listed in `../a-tier-assets/INDEX.md` (from the 26 Sept re-check). Only the fields named here were changed; columns and row order are unchanged.

- **RECHECK-02 (AIML Governance):** `verification_notes` now records that deidraproctor.com links to aimlgovernance.com, which confirms the Proctor surname link. `founder_name` stays "Deidra" because the firm's own site still gives only her first name.
- **AI-02 (AI Governance Limited):** `gap_hypothesis` no longer counts the book as on-site authority, because the book is not mentioned on the firm site.
- **AI-05 (ASA):** "case studies" became "client testimonials" in `gap_hypothesis` and `pre_completed_value`, with a note added.
- **GTM-01 (Craig Group):** the "GTM diligence is as important as financial diligence" line, which is not on the site, was removed from `pre_completed_value`, with a note added.
- **GTM-02 (Groove):** `gap_hypothesis` and `verification_notes` were rewritten. Insights has 8 articles, the latest dated 9 Jan 2025. Impacts has 12 case-study titles with no quantified results. There is no newsletter.
- **FRACT-01 (Till CFO):** four fixes:
  - the team is 13, not 15;
  - the post carries Bo's byline;
  - the unfound quote was replaced by a verified one (`observation`, `observation_url`);
  - the post dates are recorded (1 Feb 2026 on the post, 7 May 2026 on the index).
- **FRACT-02 (WrightCFO):** `gap_hypothesis` now reflects weekly posting. The gap is the lack of an owned audience (no newsletter or podcast), not inconsistency. `gap_dimensions` was left as it was.
- **FRACT-03 (Flow Partners):** 40+ client logos became 60+.
- **FRACT-04 (CFOx):** no newsletter signup was found, so `gap_hypothesis` was corrected.
- **TAX-02 (Blais Halpert):** `gap_hypothesis` and `observation` now say the newest technical piece is from Jul 2020 and the newest post of any kind is from Sep 2021.

## Owner decisions (from the A-tier re-check)

- **GTM-03 Holden Advisors:** decide whether to address Dr. Reed K. Holden (founder, now Executive Advisor) or Brian Doyle (President & CEO). The row is unchanged.
- **TAX-02 Blais Halpert:** confirm whether a tax *law* boutique (LLP) fits the specialist accounting and tax advisory segment. The row stays at tier A until you decide.
- **RECHECK-06 Starrett Consulting:** confirm which brand he leads with (starrettconsulting.com or starrettlaw.com) before the asset is sent.

## EasyGrow list-building method (commercial track)

**Status:** ADAPTATION (draft, owner review), 26 September 2026. This is the method for the **commercial** cold-email list (`../emails/CAMPAIGN_PACK.md`), not for the research list above. No list has been built with it yet.

**Authority basis** (`../authority/AUTHORITY_ADDENDUM.md` §C.2 and §E.2):
- EasyGrow "7_ Lead Sourcing" (Drive `1mGXKP3WhXrFhLBEkuqh1NBssnb6jIV3V`): manual first ("The manual process … WILL get the best results"); "Finding where you niche congregates > Finding an extraction point > Extracting the data"; for consultants, LinkedIn, then the website, then a finder tool; email order "Email Scraper -> Ctrl-F relevant pages -> Google search -> Email permutator"; owner order "Website > Google Search > Company Filing > Social Media"; "100 leads for the day".
- EasyGrow "0 Lead Sourcing Walkthrough" (`172lYWFDLQURazBwjZBQCk2x-LRpAqT3Q`): databases are "a last resort".
- EasyGrow "17 Email System FAQs" (`1t4bHEn6l1MxUDbPwGglH49eMsFbs6f5d`): no accept-all, no info@; send to personal addresses; bounce ceiling 2%.
- Lead-sourcer sizing (`1FcuvPPN…`): "Sourcing 100 leads will take a lead sourcer between 4-7 hours".
- The Loom Doctor (`1zTcCZN4G6wYwiIB_puMXeDHzwVieWWQM`): a screened niche needs another outbound system.
- Rank 1 (law and platform terms): PECR corporate/individual subscriber rule, TPS/CTPS, UK GDPR Art. 14, LinkedIn User Agreement §8.2 (no scraping or automation). These override any sourcing shortcut in the course material (for example buying accounts for scraping credits, which is **not adopted**).

### One segment first

The commercial list covers **one segment** until the owner decides otherwise (ADD D3; EasyGrow "Choose ONE system", about 120 days). **Recommended: S2, strategy and GTM consulting** (reasoning in `../emails/CAMPAIGN_PACK.md` §5.1).

**`segment_priority` column: not added to `prospects.csv`.** The one-segment rule governs the commercial list, and every firm in `prospects.csv` belongs to the research track, which is excluded from commercial outreach at domain level (`../emails/BULK_LIST_FILTER_SPEC.md` §5). A priority flag on research rows would suggest they could enter the commercial cell, so the file is left unchanged. The commercial export carries its own `segment` column (spec §7).

### The eight steps

1. **Where the segment congregates.** Start from places where S2 founders and partners show up: LinkedIn (people search and company pages), Consultancy.uk and Clutch strategy categories, the Management Consultancies Association and the Institute of Consulting member directories (UK), conference speaker and podcast guest lists, and Companies House SIC 70229 (UK). Pick one **extraction point** per session and work it by hand. Avoid over-mined pages (EasyGrow's "blasted list" warning). Apollo or another database is used **only to fill gaps**.
2. **Owner or decision-maker.** Confirm the person in this order: firm **website** (about/team), **Google**, **Companies House** (UK: officers and persons with significant control) or the **state filing** (US), then **social profiles**. One person per firm: the founder or managing partner.
3. **Email address.** Find it in this order: finder tool (**Snov.io or Hunter**), **Ctrl-F** on the site's pages, **Google** (`"@domain.com"` plus the name), then a **permutator** (first@, first.last@) checked by the verifiers.
   - **Verify twice**: NeverBounce, then MillionVerifier, within 7 days of sending.
   - Keep only **"Valid"** on both. No "accept all" / catch-all, no unknown, and **no role addresses** (info@, hello@, contact@, office@, support@, sales@, enquiries@). **Personal, named work addresses only.**
4. **Quota and sizing.** **100 new verified prospects a weekday** (solo fallback 50). Budget **4–7 hours per 100**. Record the actual minutes per 100 each day; if it runs above 7 hours, the extraction point is poor.
5. **First line.** Each record carries **one verified first-line observation and its source URL**, drawn from the pattern list in `../emails/CAMPAIGN_PACK.md` §2.1 (a recent post or article, a job opening, a new service or report page, a podcast or talk, published testimonials, an announced milestone, the site's own method wording). Clay or AI drafting is allowed, but **a person checks every line against its URL** before loading. **No fabricated or embellished observations.** No first line, no send.
6. **Screen check.** Record whether the named person appears to read their own inbox (`screen_check`: Y / N / unclear), from signals such as founder-signed site copy, a direct email published under their name, or an assistant named as the contact route. If more than about a quarter of a day's batch is N or unclear, **flag the segment for a channel change** (Loom Doctor) rather than pushing email harder.
7. **Compliance fields.**
   - **UK:** `legal_form` from Companies House. Incorporated firms only (Ltd, PLC, LLP, Scottish partnership). **Sole traders and general partnerships in England, Wales and Northern Ireland are excluded from cold email** (PECR individual subscribers). `unknown` is not sent.
   - **Phone:** if a business number is recorded, record `tps_ctps_checked` (UK) with the date **before any call**. Numbers are only ever used after a reply (`../emails/REPLY_PLAYBOOK.md` §4.2).
   - **Suppression:** run the suppression list, the research-track domains (every domain in `prospects.csv`), existing `/admin/prospects` records, the 90-day touch log and the conflict list against **every batch** (`../emails/BULK_LIST_FILTER_SPEC.md` §5).
   - **Data source:** record `data_source` per row; it appears in the email footer (UK GDPR Art. 14).
8. **Quality gate.** A daily QA sample of 20 rows must pass at about 70% or more (business-model filter, first line, screen check). After sending, **batch bounce must stay under 2%**. If it is higher, **stop using that source and fix it** before the next batch.

### Columns

The commercial export columns are listed in `../emails/BULK_LIST_FILTER_SPEC.md` §7 (including `source_point`, `first_line`, `first_line_url`, `screen_check`, `legal_form`, `verify_1_result`, `verify_2_result`, `tps_ctps_checked`, `sourcing_minutes`). Keep the commercial list in a separate file from `prospects.csv` so the two tracks never mix.
