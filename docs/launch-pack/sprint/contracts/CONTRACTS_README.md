# Client contract set: README

> **BUSINESS DRAFTS FOR SOLICITOR REVIEW. NOT LEGAL ADVICE.** Written 26 September 2026 by Threadline with AI assistance and not reviewed by a lawyer or accountant. Do not send any of these to a client until (1) a qualified solicitor in England and Wales has reviewed and finalised them, and (2) the owner has made the decisions below. Nothing here is decided on the owner's behalf; proposed values are recommendations. Not committed to git; Drive files untouched.

## Files

| File | What it is |
| --- | --- |
| `CLIENT_SERVICES_AGREEMENT.md` | Master terms: term and continuation, services, exclusions, client obligations, fees, no-guarantees, Day-7 milestone, IP, confidentiality, data protection, testimonials, offboarding, liability, law |
| `ORDER_FORM_SOW.md` | Per-client schedule with `{{fields}}`: parties, dates, fees, 28-day payment schedule (with a worked example), split payment, channels, Day-7 deliverables and inputs, exclusions, approvers, recording cadence, testimonial answer |
| `DPA_SUMMARY.md` | Processor-terms outline (Article 28 particulars) and the subprocessor list from `docs/TECHNICAL_HANDOFF.md` |
| `INVOICE_TEMPLATE.html` | A4 invoice using `brand-kit/templates/_brand.css` and the lockup SVG; 14-day terms (matches `paymentTermsDays ?? 14` in `src/lib/billing/invoices.ts`) |
| `INVOICE_TEMPLATE_preview.png` | Headless Chrome render of the template (794 × 1123, one A4 page) |

## Terms fixed from the sources (not reopened)

£2,500 implementation + £2,500 **every four weeks** (28-day Service Periods, never "monthly"); 12-week initial engagement = 3 Service Periods = **£10,000**; one offer; ~12–16 core short-form assets per period as a V1 working scope, not a guarantee; up to ~3 channels; video-led with text-led fallback; long-form YouTube pilot/custom only; exclusions (ads, funnels, email marketing, appointment setting, web development, daily community management, sales-team management, unlimited creative/revisions); access by delegated/native methods only, no passwords; no guarantees of revenue, leads, views, followers or a learning phase; split payment for implementation only, total unchanged; testimonial YES/MAYBE/NO recorded separately from consent to publish; England and Wales law.

## Owner decisions

| # | Decision | Proposed | Where |
| --- | --- | --- | --- |
| D-01 | Approve the founding offer and 14-day terms for live use | Approve as written | MSA 5.1; Order Form §3 |
| D-03 | Export window and retention (also recovery objectives) | Option 2: export 30 days, keep 90 days, then delete; invoices 6 years; audit logs 24 months | MSA 14.2; Order Form §8; DPA §8 |
| D-09 | Legal identity: trading entity, company number, address, privacy notice | Company or trading name + business postal address; solicitor-reviewed terms, privacy notice, DPA | Parties; invoice header/footer; MSA 10.3 |
| C-01 | Notice to end continuation after the initial term | At least 14 days before the end of a Service Period (alternative: 28 days) | MSA 2.3 |
| C-02 | Risk reversal: approve the Day-7 milestone (3–5 core messages/pillars + first 6–8 scripts, clock starts at kickoff + inputs) and choose the remedy | Option A: extend Period 1 by the days missed; Option C (refund backstop at Day 14) only if a stronger public promise is wanted | MSA 7; Order Form §4 |
| C-03 | Approval Window and revision rounds | 2 Working Days; 2 consolidated rounds per item; no deemed approval (nothing publishes unapproved) | MSA 3.8, 4.3; Order Form §5 |
| C-04 | Late payment | Pause after notice at 7 days overdue; statutory interest; termination right at 21 days overdue | MSA 5.6, 13.2 |
| C-06 | Early exit during the initial term | Full commitment to the 12 weeks (no early exit except for cause) | MSA 2.4 |
| C-07 | Liability cap | Fees paid and payable in the 12 weeks before the claim | MSA 15.3 |
| C-08 | Client-caused blocks | Timelines move, fees unchanged; Threadline may pause after 10 Working Days of block | MSA 4.8 |
| C-10 | Invoice timing | Implementation on signature; each period invoice up to 7 days before the period (as the app drafts it); all due 14 days after issue | MSA 5.3; Order Form §3 |
| C-11 | Default split for implementation | 2 × £1,250: on signature, and with the Period 2 invoice | MSA 5.5; Order Form §3 |
| C-12 | VAT registration status | Confirm with an accountant (registration threshold); template supports either | MSA 5.2; invoice |
| C-13 | Price-change notice for continuation periods | 28 days; initial-term fees fixed | MSA 5.7 |
| C-14 | Insurance (professional indemnity, public liability) | Obtain PI cover before the first client; state it if held | MSA 15.5 |
| C-15 | Mutual non-solicitation of staff | Omit at founding stage unless the solicitor advises otherwise | MSA 17.7 |
| C-16 | Breach-notification window to the client | 48 hours | DPA §3 |
| — | Processing worker and error tracker (Sentry vs GlitchTip) choice, so the subprocessor list is final | Existing backend-ledger owner items | DPA §4 |
| — | Confidentiality period | 3 years; indefinite for prompts, software and methods | MSA 9.4 |

## Clauses needing solicitor review

1. **Whole agreement**: structure, precedence (DPA > Order Form > master terms), B2B-only status, incorporation by reference through a signed Order Form, e-signature. (Parties; 17.1, 17.8)
2. **Automatic period-by-period continuation** and notice wording/prominence. (2.2–2.3)
3. **Initial-term commitment** and what is payable on early exit (debt vs damages, penalty rule). (2.4, 14.3)
4. **"Working scope, not a guarantee"**: that ~12–16 assets does not become a fixed-quantity obligation. (3.3)
5. **No-guarantees clause and exclusion of implied terms**, Supply of Goods and Services Act 1982, reasonable skill and care. (6)
6. **Risk-reversal milestone**: drafted as a service commitment with a sole remedy, not a results guarantee; conditions and clock start. (7)
7. **Intellectual property**: assignment vs licence of Agreed Final Outputs on payment; moral rights; copyright in AI-assisted/computer-generated works (CDPA s9(3)); Background IP retention and embedded-licence; working materials; third-party assets; no reverse engineering / anti-in-housing. (8)
8. **Generalised learnings** across clients vs Threadline's processor role (use of client data for its own purposes; prompts sent to AI providers). (8.6; DPA §6) *Highest-risk item.*
9. **Confidentiality** scope and duration. (9)
10. **DPA**: full Article 28 text, subprocessor objection mechanism, audit rights, breach timing, international transfers (UK Extension to the DPF / IDTA / UK Addendum, transfer risk assessments), controller/processor split for Attio and connected social platforms. (10; DPA)
11. **Testimonials and publicity**: separate written consent, withdrawal, ASA/CAP Code and the DMCC Act 2024 on reviews and testimonials. (11)
12. **Late payment** interest and suspension; Late Payment of Commercial Debts (Interest) Act 1998. (5.6)
13. **Client warranties and any indemnity** for supplied materials, claims and third-party consents (people in recordings). (4.7)
14. **Limitation and exclusion of liability**, UCTA 1977 reasonableness, cap amount. (15)
15. **Termination for cause and insolvency** wording (Corporate Insolvency and Governance Act 2020). (13)
16. **Force majeure**. (16)
17. **Retention and deletion** wording aligned with the privacy notice and DPA once D-03 is decided. (14.2)
18. **Invoice content**: UK invoice and VAT invoice requirements (accountant). (Invoice)
19. **Non-solicitation**, if included. (17.7)

## Before first use

- [ ] Owner decisions above made and the placeholders filled in the master terms.
- [ ] Solicitor review complete; versions numbered (`{{msa_version}}`, `{{dpa_version}}`).
- [ ] Privacy notice published and linked (D-09).
- [ ] Subprocessor regions and transfer mechanisms confirmed against live configuration.
- [ ] Invoice numbering sequence and bank details set; Stripe live mode approved (D-01).
- [ ] Editing examples ready to show before close (Order Form §4).
