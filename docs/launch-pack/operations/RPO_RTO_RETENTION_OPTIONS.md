# Recovery objectives and retention: options for the owner (not decided)

None of these options is approved. The owner chooses; the maintainer records the choice in TECHNICAL_HANDOFF.md and the ledger rows INF-09, PRV-01 and OFF-01.

## Recovery point and time objectives (INF-09)

| Option | RPO (data you can lose) | RTO (time to be back) | What it needs | Cost and implications |
| --- | --- | --- | --- | --- |
| A. Lean | 24 hours | 1 working day | Neon point-in-time restore (history ≥ 1 day) plus the existing restore drill | Free tier; a bad day loses up to a day of client edits and approvals |
| B. Recommended for first clients | 1 hour or less (PITR) | 4 hours | Neon PITR history ≥ 7 days; storage bucket versioning on; the drill run each quarter | Low cost (Neon retention); protects approvals and billing records well |
| C. Stronger | Minutes | 1 hour | B, plus a standby branch, uptime alerting with on-call, and a written incident rota | Paid plans; only worth it with several clients |

## Data retention (PRV-01, OFF-01)

| Data | Option 1 (minimal) | Option 2 (balanced, current defaults) | Option 3 (longer) | Notes |
| --- | --- | --- | --- | --- |
| Client workspace after offboarding | Export window 14 days, then delete | Export 30 days, then keep 90 days, then delete | Keep 12 months | The current form defaults to Option 2 |
| Uploaded media | Delete with the workspace | Same as the workspace | Same | Masters live in client-owned storage where agreed |
| Invoices and billing records | Legal minimum (UK: 6 years) | 6 years | 6 years | Not a choice below the legal minimum |
| Audit logs | 12 months | 24 months | 6 years | Needed for security investigations |
| Prospect and CRM records (Threadline's own) | 12 months after last contact | 24 months | 36 months | Honour opt-outs immediately, whatever the option |
| Research items and public-source copies | 12 months | 24 months | Workspace lifetime | Provenance kept with each item |

**Also needed with PRV-01:**
- a privacy contact;
- a subprocessor list (already drafted in TECHNICAL_HANDOFF.md);
- a DPA template;
- a counsel check of the data-ownership wording (O-14).
