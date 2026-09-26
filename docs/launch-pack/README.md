# Threadline business launch asset pack: index and manifest

Produced 27 September 2026 for the brief's section 18A. The pack is 152 files (about 4.8 MB) under `docs/launch-pack/`.

**Status words:**

| Word | Meaning |
| --- | --- |
| **production-complete** | Built and checked |
| **drafted; owner review pending** | Content for the owner to approve |
| **owner-approved** | Signed off by the owner. **Nothing in this pack is owner-approved yet**, except the verbatim sales passages, which are founder-approved in their Drive source |

Start with `MASTER_LAUNCH_CHECKLIST.md`.

## Map

| Area | Finished files (entry point) | Editable sources | Exports | Status |
| --- | --- | --- | --- | --- |
| Inventory | [INVENTORY.md](INVENTORY.md) | — | — | production-complete |
| Master checklist | [MASTER_LAUNCH_CHECKLIST.md](MASTER_LAUNCH_CHECKLIST.md) | — | — | production-complete |
| A. Brand kit | [brand-kit/INDEX.html](brand-kit/INDEX.html), [BRAND_GUIDELINES.md](brand-kit/BRAND_GUIDELINES.md) | `brand-kit/logo/svg/*.svg`, `brand-kit/icons/*.svg`, `brand-kit/templates/*.html` | `brand-kit/logo/png/` (27), `brand-kit/icons/*.png` and `.ico`, `brand-kit/previews/` | production-complete; owner approval pending (O-08) |
| B. Onboarding pack | [onboarding/README.md](onboarding/README.md) (9 files) | the Markdown files | — | drafted; owner review pending (O-16) |
| C. Sales call resources | [sales/SALES_CALL_GUIDE.md](sales/SALES_CALL_GUIDE.md), [LIVE_CALL_ONE_PAGER.html](sales/LIVE_CALL_ONE_PAGER.html), [APPROVED_VERBATIM_LIBRARY.md](sales/APPROVED_VERBATIM_LIBRARY.md), [ADMIN_SCRIPTS_CHECK.md](sales/ADMIN_SCRIPTS_CHECK.md) | the Markdown files and the HTML | one-pager prints to one A4 page | library: founder-approved in the source. Guide and adaptations: drafted; owner review pending (O-09) |
| D. Outreach | [outreach/OUTREACH_SEQUENCES.md](outreach/OUTREACH_SEQUENCES.md), [PERSONALISATION_AND_RESEARCH.md](outreach/PERSONALISATION_AND_RESEARCH.md), [WORKED_EXAMPLES.md](outreach/WORKED_EXAMPLES.md) | the Markdown files | — | drafted; owner review pending (O-09). Nothing sent; nobody enrolled |
| E. Ten newsletter graphics | [newsletter-graphics/README.md](newsletter-graphics/README.md), [contact-sheet.png](newsletter-graphics/contact-sheet.png) | `newsletter-graphics/src/*.svg`, `build.py`, `render.sh` | `newsletter-graphics/export/` (10 × 1200 px, 10 × 1080 px) | drafted; owner review pending (O-16, O-10) |
| Claims audit | [claims/CLAIMS_AUDIT.md](claims/CLAIMS_AUDIT.md) | — | — | production-complete; O-01 open |
| Strategy reconciliation | [strategy/STRATEGY_RECONCILIATION.md](strategy/STRATEGY_RECONCILIATION.md) | — | — | production-complete |
| Research | [research/RESEARCH_PROVIDER_AUDIT.md](research/RESEARCH_PROVIDER_AUDIT.md), [AGENT_WORKFLOWS.md](research/AGENT_WORKFLOWS.md) | — | — | production-complete; Apify off (O-11) |
| Operations | [operations/READINESS_MATRIX.md](operations/READINESS_MATRIX.md), [USABILITY_VERIFICATION.md](operations/USABILITY_VERIFICATION.md), [OWNER_DRY_RUN.md](operations/OWNER_DRY_RUN.md), [RPO_RTO_RETENTION_OPTIONS.md](operations/RPO_RTO_RETENTION_OPTIONS.md) | — | — | production-complete; RPO/RTO and retention are owner decisions |

## Canonical sources used (Google Drive, read 27 September 2026)

| Source | Drive id |
| --- | --- |
| Master Blueprint | `1xf87hFmxd9ox6ocFj2PTr1brwLL7dRBzzXnmeIF3gU0` |
| SOP Router | `12-Y9gblI7HgdtWXhd0zPdDKP49hqVoZlMEGaRTempN4` |
| SOP 03 | `11q7dbVBUAs0noq7hoNV2jEyHU6C9eElX` |
| SOP 04 | `1iwAKxQaxZ981bfgraKjwfrrWbacB03EQ` |
| Outreach playbook | `1km_ovpl0Zwn70AlQ0gHECdMhxC1SjONYwATx_qAZ_4s` |
| Intake draft | `1qLzuNWDQv5JD5a7H5v1R0g5i7xocEaAK` |
| Content launch pack | `1RVAWSpIeDADlyDzxaERmFp5S3NkEFfKd` |

- The Drive originals were **not modified**. They are the current versions.
- The stale repo copies (SOP 03/04 and three commercial drafts) were updated to match them.

## Drive upload

The folder **"Threadline Launch Pack 2026-09-27"** was created in the owner's Drive: https://drive.google.com/drive/folders/14Yn_BrojRjwJcEz9va-EHM8PXjUY1Sff

It holds four Google Docs, uploaded 27 September 2026 and each read back to confirm the content:

| File | Contents |
| --- | --- |
| 00 manifest | This index |
| 01 master launch checklist | Full copy |
| 02 claims audit | Condensed copy (the repository file is canonical) |
| 03 strategy reconciliation | Condensed copy (the repository file is canonical) |

**Not uploaded:** the rest of the pack (brand kit, graphics, onboarding, sales, outreach, research and operations files, including all binaries). It is upload-ready in this directory. Drag `docs/launch-pack/` into the folder to complete it. The canonical Drive sources were not modified; they are already current.

## Verification (this pass)

- **Unit and database tests:** 824 passed, 0 failed.
- **Types and lint:** `tsc` and `eslint src` clean.
- **QA suites:**
  - `suite-sales-validation`: all checks pass, including 7 new ones (early test, validation, touches, demand source).
  - `marketing-v9`: 62 passed, 0 failed.
  - `run-all`: 623 passed, 2 passed with an external gate, 0 partial, 0 failed (628 checks, 3 n/a).
- **Public freeze:** 104 protected files; only `src/content/home.ts`, `playbook.ts` and `public-site.ts` changed (inaccurate-claim exception). Their hashes were re-recorded.
- **Renders inspected:**
  - newsletter contact sheet and exports;
  - brand-kit lockups, icons and template previews;
  - the one-pager fits one A4 page.
