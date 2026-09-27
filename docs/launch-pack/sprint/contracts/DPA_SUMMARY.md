# Data Processing Agreement: outline and subprocessor list

> **DRAFT OUTLINE FOR SOLICITOR REVIEW. NOT LEGAL ADVICE. THIS IS NOT A COMPLETE DPA.**
>
> It sets out the processing terms Threadline intends to offer, so that a solicitor can draft (or adapt a standard) UK GDPR Article 28 agreement. The subprocessor list comes from `docs/TECHNICAL_HANDOFF.md` §5 and §7 (26 September 2026) and must be re-checked against live configuration before signature: several providers are "when configured" and some are not yet live.
>
> Status: DRAFT v0.1 (26 September 2026).

## 1. Roles

| Data | Controller | Processor |
| --- | --- | --- |
| Client Materials and workspace data: recordings, content, Brand Brain, the Client's team members' names, emails and roles, people appearing in content, buyer, enquiry and pipeline information the Client reports, platform metrics | **Client** | **Threadline** |
| Threadline's own account administration: client billing and contact details, invoices and payments, sales and CRM records about the Client as a customer | **Threadline** | n/a |
| Data platforms hold about the Client's own accounts | Platform (under the Client's terms with it) | n/a |

## 2. Processing details (Article 28(3) particulars)

- **Subject matter and purpose:** providing the Services under the Client Services Agreement: research, strategy, scripting, production, publishing, measurement, reporting and support.
- **Duration:** the term of the Agreement plus the export and retention period in §8.
- **Nature of processing:** storage, organisation, editing and transcoding of media, transcription, AI-assisted drafting and analysis, publishing to connected platforms, metrics collection, reporting, email notifications.
- **Data subjects:** the Client's founders, staff and contractors; people appearing in the Client's content; the Client's prospects and customers named in commercial-signal reports.
- **Personal data:** names, email addresses, job roles, voice and likeness in recordings, statements in content, enquiry and pipeline details, platform account identifiers and engagement metrics, workspace activity and audit logs.
- **Special category data:** not expected. The Client will not supply it without telling Threadline first and agreeing additional safeguards.

## 3. Threadline's processor commitments (to be drafted in full)

1. Process only on the Client's documented instructions (the Agreement, the Order Form and the Client's use of the workspace), and tell the Client if an instruction appears unlawful.
2. Confidentiality obligations on everyone who processes the data.
3. Appropriate technical and organisational measures (§5).
4. Use subprocessors only under written terms giving equivalent protection; keep the list in §4 current; give **{{notice_days, proposed 14}} days'** notice of a new or replacement subprocessor, during which the Client may object. **[SOLICITOR: objection remedy]**
5. Help the Client respond to data-subject requests (access, erasure, rectification) and with DPIAs and consultations where relevant.
6. Notify the Client of a personal data breach **without undue delay, and in any case within {{breach_hours, proposed 48}} hours** of becoming aware, with the information available. **[OWNER DECISION C-16] [SOLICITOR]**
7. At the end of the Services, delete or return the data (§8).
8. Make available information needed to show compliance, and allow reasonable audits (proposed: by questionnaire first, on-site only if required by a regulator or after a breach). **[SOLICITOR]**

## 4. Subprocessors (from TECHNICAL_HANDOFF.md, "when configured")

| Subprocessor | Purpose | Data | Location / transfer mechanism |
| --- | --- | --- | --- |
| Vercel Inc. | Application hosting, serverless functions, logs | All workspace data in transit; request logs (emails masked) | {{region}}; US company: UK Extension to the EU–US Data Privacy Framework or IDTA **[CONFIRM]** |
| Neon (PostgreSQL) | Primary database, point-in-time backups | All structured workspace data | {{region}} **[CONFIRM]** |
| Cloudflare R2 | File and media storage | Recordings, media, uploaded files | {{jurisdiction setting}} **[CONFIRM]** |
| Resend | Transactional email | Recipient names and emails, email content | {{region}}; US **[CONFIRM]** |
| Upstash | Shared rate limiting | IP addresses / request keys | {{region}} **[CONFIRM]** |
| Anthropic | AI generation and analysis | Content, Brand Brain, research and transcripts sent in prompts | US; commercial API terms (confirm no training on inputs and retention period) **[CONFIRM]** |
| Stripe | Invoicing and card payments | Billing contact, invoice lines, payment details | US/Ireland; Stripe DPA **[CONFIRM]** |
| Sentry or GlitchTip | Error reporting | Error context (secrets redacted, emails masked) | {{provider and region}} **[CONFIRM which]** |
| Processing worker | Transcode, transcription, thumbnails, scanning | Media files | **Not yet chosen (owner decision in the backend ledger)**; add before use |
| Apify (optional) | Public web research collection | Public content only; not client personal data by design | US; only if enabled (D-08, deferred) |
| Social platforms the Client connects (LinkedIn, YouTube, Instagram, Facebook, Threads, TikTok, X) | Publishing and metrics at the Client's direction | Content and account identifiers | These act under the Client's own terms with each platform. **[SOLICITOR: confirm they are not Threadline's subprocessors]** |

**Attio** (Threadline's CRM) holds Threadline's own sales records about the Client as a customer, where Threadline is controller. It is listed for transparency, not as a subprocessor. **[SOLICITOR: confirm]**

## 5. Security measures (summary, from the technical handoff)

- Tokens and secrets (platform tokens, webhook credentials, two-factor secrets) sealed at rest with AES-256-GCM; session and invitation tokens stored only as hashes.
- Role-based access in each workspace (owner, admin, approver, commercial, viewer, contributor); suspended members have no access.
- Private file storage with content sniffing; production separated from preview databases.
- Access to client platforms by delegated or native connection only; **no passwords held**.
- Audit logs of significant actions; error logs mask emails and redact secrets.
- Backups by database point-in-time recovery. **[OWNER DECISION D-03: recovery objectives, recommended RPO ≤ 1 hour, RTO 4 hours, quarterly restore drill]**

## 6. Threadline's own use of learnings

Threadline intends to improve its methods from generalised, de-identified learnings across clients (Master Blueprint, retention doctrine). As a processor it may not use the Client's personal data for its own purposes. Proposed wording: Threadline may derive and keep aggregated, de-identified insights that do not identify the Client or any individual and contain no personal data, and uses personal data only to provide the Services. **[SOLICITOR: essential review. Confirm this is lawful and whether it needs explicit Client authorisation, and whether prompts sent to AI providers are compatible.]**

## 7. International transfers

Several subprocessors are US-based or US-owned. Transfers must rely on the UK Extension to the EU–US Data Privacy Framework (where the recipient is certified), the ICO International Data Transfer Agreement or the UK Addendum to the EU SCCs, with a transfer risk assessment. **[SOLICITOR] [CONFIRM each provider's certification and region]**

## 8. Return and deletion

At the end of the Services: platform connections disconnected and access credentials deleted; a full JSON export offered for **{{export_days}}** days; workspace data deleted after **{{retention_days}}** days; invoices kept 6 years (tax); audit logs kept {{audit_log_months}} months; legal holds respected. Backups age out on the provider's point-in-time window (≥ 7 days). **[OWNER DECISION D-03, recommended 30 / 90 days, 6 years, 24 months]**

## 9. Still needed before this can be used

- Solicitor-drafted DPA text (or adoption of a reviewed standard), and the privacy notice (D-09).
- Confirmed regions and transfer mechanisms for every live subprocessor.
- A choice of processing worker and error tracker, then this list updated.
- A record of processing activities (Article 30) for Threadline as processor and controller; check ICO data protection fee registration. **[OWNER]**
