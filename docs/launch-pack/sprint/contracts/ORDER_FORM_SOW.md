# Threadline Order Form and Statement of Work

> **DRAFT FOR SOLICITOR REVIEW. NOT LEGAL ADVICE. DO NOT SEND TO A CLIENT UNTIL THE MASTER TERMS HAVE BEEN REVIEWED.**
>
> One Order Form per client. Replace every `{{field}}`; delete the guidance lines in *italics* before sending. Include **only the agreed scope** (SOP 04, step 2). Say "every four weeks", never "monthly". Owner decisions and solicitor items are listed in `CONTRACTS_README.md`.
>
> Status: DRAFT v0.1 (26 September 2026).

This Order Form is made under, and incorporates, the Threadline Client Services Agreement version {{msa_version}} ("master terms") and the Data Processing Agreement version {{dpa_version}}, copies of which have been provided to the Client. Words defined in the master terms have the same meaning here.

---

## 1. Parties and contacts

| | Threadline | Client |
| --- | --- | --- |
| Legal name | {{threadline_legal_entity}} | {{client_legal_name}} |
| Company number | {{threadline_company_number}} | {{client_company_number}} |
| Registered / business address | {{threadline_address}} | {{client_registered_address}} |
| VAT number (if any) | {{threadline_vat_number_or_"Not VAT registered"}} | {{client_vat_number}} |
| Signatory | {{threadline_signatory}}, {{title}} | {{client_signatory}}, {{title}} |
| Day-to-day contact | {{threadline_contact_name}}, {{email}} | {{client_contact_name}}, {{email}} |
| Billing contact (invoices sent to) | | {{client_billing_name}}, {{client_billing_email}} |
| Notices email | {{threadline_notices_email}} | {{client_notices_email}} |

*Check the client's legal name and company number on Companies House before sending (SOP 04, step 1).*

---

## 2. Dates

| Item | Value |
| --- | --- |
| Order Form date | {{order_date}} |
| **Start Date** (Service Period 1 begins) | {{start_date}} |
| Kickoff / Brand Brain session (60–90 minutes) | {{kickoff_datetime}} |
| Initial Term | 12 weeks: {{start_date}} to {{initial_term_end = start_date + 83 days}} |
| Commercial baseline start date | {{baseline_start_date}} *(SOP 04, step 10)* |

---

## 3. Fees

| Item | Fee (excl. VAT) |
| --- | --- |
| Implementation (once) | £{{implementation_fee = 2,500}} |
| Each Service Period (every four weeks, 28 days) | £{{period_fee = 2,500}} |
| **Initial contract value** (Implementation + 3 Service Periods) | **£{{initial_contract_value = 10,000}}** |
| VAT | {{vat_line: "Not VAT registered, no VAT charged" or "VAT at {{rate}}% added"}} |
| Continuation after the Initial Term | £{{period_fee}} per Service Period, period by period, until ended with at least {{notice_days, proposed 14}} days' notice before a period ends |

Payment terms: **every invoice is payable within 14 days of its issue date**, by bank transfer or the Stripe payment link on the invoice.

### Payment schedule

*Service Periods are 28 days. Period N starts on Start Date + 28 × (N − 1) days and ends 27 days later. Period invoices are issued up to 7 days before the period starts.*

| # | Invoice for | Service dates | Issue date | Due date (issue + 14 days) | Amount (excl. VAT) |
| --- | --- | --- | --- | --- | --- |
| 1 | Implementation | Installation, from the Installation Start | On signature: {{inv1_issue}} | {{inv1_due}} | £2,500 |
| 2 | Service Period 1 | {{p1_start}} to {{p1_end}} | {{inv2_issue}} | {{inv2_due}} | £2,500 |
| 3 | Service Period 2 | {{p2_start}} to {{p2_end}} | {{inv3_issue}} | {{inv3_due}} | £2,500 |
| 4 | Service Period 3 | {{p3_start}} to {{p3_end}} | {{inv4_issue}} | {{inv4_due}} | £2,500 |
| | **Initial Term total** | | | | **£10,000** |
| 5+ | Service Period 4 onwards (continuation) | each further 28 days | 7 days before each period | issue + 14 days | £2,500 each |

*Worked example (Start Date Monday 5 October 2026): Period 1 = 5 Oct to 1 Nov 2026; Period 2 = 2 Nov to 29 Nov; Period 3 = 30 Nov to 27 Dec (Initial Term ends 27 Dec 2026); Period 4, if continued, = 28 Dec 2026 to 24 Jan 2027. The Period 2 invoice would be issued 26 Oct and due 9 Nov.*

### Split payment (only if agreed; otherwise delete)

*Execution Manual V14.3: custom split payment only when a qualified prospect is sold and money timing is isolated; split implementation only; preserve total economics. Service Period fees are never split.*

| Instalment | Amount | Issue date | Due date |
| --- | --- | --- | --- |
| Implementation, part 1 (unlocks the fulfilment gate) | £{{split_1, proposed 1,250}} | On signature: {{date}} | {{date}} |
| Implementation, part 2 | £{{split_2, proposed 1,250}} | {{date, proposed with the Period 2 invoice}} | {{date}} |
| **Implementation total (unchanged)** | **£2,500** | | |

Reason recorded for the split: {{split_reason}}

### Fulfilment gate

Full fulfilment starts when: this Order Form is signed; the Implementation invoice (or split part 1) is paid; kickoff is booked. If the gate is met after {{start_date}}, the Start Date and the dates above move accordingly unless agreed otherwise in writing.

---

## 4. Scope of work

| Item | Agreed for this Client |
| --- | --- |
| **Channels** (up to about 3) | 1. {{channel_1}} 2. {{channel_2}} 3. {{channel_3_or_"none"}} |
| Format lead | {{video-led / text-led / mixed}}; text-led fallback where video is not right: {{fallback_channels}} |
| Core Assets per Service Period | **Approximately 12–16** (V1 working scope, not a guarantee; derivatives do not count) |
| Repurposing / derivatives | {{repurposing_rules, e.g. "each core video adapted to a LinkedIn text post where useful"}} |
| Publishing responsibility, by channel | {{channel}}: {{connected account via official API / Threadline posts by hand through a delegated role / Client posts}} |
| Strategy and research cadence | Weekly optimisation; review and report at the end of each Service Period |
| Reporting | Weekly report; four-week review {{meeting_or_written}} |
| Editing standard | Standard Threadline editing, as shown in {{examples_link}} before signature |
| Revision rounds per item | {{revision_rounds, proposed 2}} consolidated rounds |
| Long-form YouTube | **Not included** / Pilot agreed: {{pilot_scope_and_fee}} *(pilot or custom only; delete if not agreed)* |
| Other agreed items | {{none, or describe and price}} |

### Implementation and the Day-7 installation milestone

Installation Deliverables, due **within 7 days of the Installation Start** (master terms clause 7):

- [ ] **{{3–5}} core messages or content pillars**, in writing, for approval;
- [ ] **the first {{6–8}} researched scripts**, ready to review and record.

Required Inputs **needed for Day 7** (the milestone clock starts when these are received and kickoff has taken place):

| Input | Owner | Due |
| --- | --- | --- |
| Website and offer links | {{client_contact}} | {{date}} |
| Existing content channels (links) | {{client_contact}} | {{date}} |
| Relevant proof (case studies, figures, testimonials the Client already has rights to use) | {{client_contact}} | {{date}} |
| Access through delegated or native methods for {{channels}} (never passwords) | {{client_contact}} | {{date}} |
| Sales-call recordings or customer sources, if available | {{client_contact}} | {{date or "not available"}} |
| Onboarding questionnaire in the workspace | {{client_contact}} | {{date}} |

Remedy if Threadline misses the milestone for reasons within its control: **{{Option A: Period 1 extended by the days missed / Option B: £{{x}} credit / Option C: refund backstop at Day 14}}** *[OWNER DECISION C-02]*.

### Exclusions (not included unless added and priced here)

Paid advertising management · funnel building · email marketing · appointment setting · website or web development · daily community management (comments and DMs stay with the Client) · sales-team management · unlimited bespoke creative · unlimited revisions · heavier creator-style editing · long-form YouTube (unless a pilot is agreed above) · {{any_other_client_specific_exclusion}}

---

## 5. Client responsibilities for this engagement

| Item | Agreed |
| --- | --- |
| **Approver(s)** (authorised to approve content) | {{approver_1_name}}, {{role}}, {{email}}; {{approver_2_or_none}} |
| **Approval Window** | Within {{approval_window, proposed 2 Working Days}} of an item reaching Approvals |
| **Recording owner** | {{recording_owner_name}} |
| **Recording cadence** | {{e.g. one 60–90 minute batch session every two weeks; first session by {{date}}}} |
| Recording set-up | {{own set-up checked at installation / other}} |
| Commercial-signal reporting | Weekly, through **Commercial signal** on the Performance page or on the weekly call; owner: {{name}} |
| Comments and DM replies | {{client_person_named}} |
| Access method per channel | {{channel}}: {{role / partner access / OAuth connection}}. No passwords. |

---

## 6. Optional success-interview question

Asked verbatim at close (SOP 04):

> “One thing I ask every client at the start: if at the end of the initial 12 weeks you feel we’ve genuinely created something worth talking about, would you be open to a short recorded success interview? Completely optional, and obviously only if you’re happy with the result.”

| Field | Value |
| --- | --- |
| `testimonial_permission_if_successful` | ☐ YES ☐ MAYBE ☐ NO |
| Client's exact words | "{{exact_wording}}" |

This records willingness to consider a later interview only. **It is not consent to publish anything.** Any public use of a testimonial, case study, figure, logo or the Client's name needs separate written approval of the exact material (master terms clause 11).

---

## 7. Data protection

The Client's content and workspace data are processed by Threadline as processor under the DPA. Client-specific details:

| Item | Value |
| --- | --- |
| Client's data protection contact | {{name, email}} |
| Special category data expected? | {{No / describe}} *(default: No. Tell Threadline before supplying any.)* |
| Objections to listed subprocessors | {{none}} |

---

## 8. Offboarding

On ending: platform connections are disconnected and stored access deleted, queued posts cancelled, and a full export prepared. Export window: **{{export_days}}** days after access ends; data then kept for **{{retention_days}}** days and deleted, except invoices (6 years) and audit logs ({{audit_log_months}} months). *[OWNER DECISION D-03; recommended 30 / 90 days. Do not quote until approved.]*

---

## 9. Signature

By signing, each party agrees to this Order Form, the master terms and the DPA.

| For Threadline | For the Client |
| --- | --- |
| Signature: ____________________ | Signature: ____________________ |
| Name: {{threadline_signatory}} | Name: {{client_signatory}} |
| Title: {{title}} | Title: {{title}} |
| Date: {{date}} | Date: {{date}} |

---

*Internal checklist before sending (not part of the Order Form): legal name checked; only agreed scope included; exclusions listed; standard editing shown; dates computed in 28-day periods; no "monthly" anywhere; approver and recording owner named; access method is delegated or native; split payment, if any, is implementation-only and preserves £10,000; testimonial answer recorded with exact words.*
