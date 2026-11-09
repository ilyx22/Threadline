# Benchmark templates (9 Nov 2026)

Copy one set per root. Status words: DRAFT, PRESENT_UNVERIFIED, DRY_RUN_VERIFIED, LIVE_VERIFIED, BLOCKED. Label every output **SYNTHETIC / UNVALIDATED**.

## T1. Source packet (BUILD-02, BUILD-03)

| Field | Value |
|---|---|
| ROOT_ID | |
| Source ID, passage or timestamp | |
| Source owner; date | |
| Tenant | DRYRUN-2026-11 SYNTHETIC ADVISORY |
| Permission | |
| Route | PUBLIC_CONTENT_ELIGIBLE / INTERNAL_CONVERSION_ONLY / PRIVATE_CLIENT_DELIVERY / EXCLUDED |
| Buyer and situation (observed or **inferred**) | |
| Buyer's actual words (kept apart from proposed public wording) | |
| Expert's answer and interpretation | |
| Uncertainty | |
| Intended job; platform; destination | |
| Claims and evidence class (E1–E8) | |
| Prohibited uses | |
| Brand Brain version | |
| Genuine voice examples, with provenance | |

## T2. Evidence card (online signals)

SIGNAL_ID · URL/title/author · platform · published · captured (timezone) · factual summary · claim needing verification · primary source · observed metrics and time · **unavailable metrics** · buyer problem · why now · original contribution · uncertainty · expiry/recheck.

Rank 0–2 each: buyer relevance, credibility, usefulness now, originality, current content job. Select 8–10, hold 5–7, reject 0–4. Hard holds override the total. Never rank on likes alone.

## T3. Roles for the run

One operator can run these, but each output is saved separately: **call miner**, **trend scout**, **conversation finder** (no replies sent), **outlier analyst** (own posts; "insufficient baseline" until posts exist), **Claude writer**, **Judge** (advisory only), **human approver**.

## T4. Drafting packet

Use the prompt in SOP D4 of the LinkedIn/X SOP, unchanged. Attach T1 and only eligible cards. Get two angles and the missing inputs first; the expert picks the thesis, then ask for the script and native LinkedIn/X versions. Missing source or interpretation means **HOLD**, not invention.

## T5. Sentence and scene QC ledger

One row per meaningful line or scene:

| Version | Line or scene | Function | Source or claim check | Hook promise and payoff line | Voice | Proof placement | Visual | CTA fit | Defect | Reason code | Proposed fix | Needs expert? | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

- **Function:** scene/problem, evidence, interpretation, mechanism, consequence, qualification, next action.
- **Reason codes:** FACTUAL, DOCTRINE, CLAIM_BOUNDARY, VOICE, TERMINOLOGY, POSITIONING, COMPLIANCE, FORMAT_PREFERENCE.
- **Decision:** accept, rewrite, hold, reject. "Make it punchier" is not a valid entry.
- Human decisions are recorded independently of any model score.

## T6. Exact-version approval ledger

| Asset ID | ROOT_ID | Account and destination | File SHA-256 or text hash | CTA | App approval ID | Approver | Authority | UTC | Decision | Superseded by |
|---|---|---|---|---|---|---|---|---|---|---|

Any change to text, cut, media, CTA or **account** voids the row. The account column is manual because of defect D3 in the capability matrix. No response means pending.

## T7. No-send queue preview

| Key (tenant/account/asset/version) | Platform | Account | Exact version hash | Media | Local time and zone | UTC | Expiry | Owner | URL | Status | Reconciliation note |
|---|---|---|---|---|---|---|---|---|---|---|---|

URL is always `https://example.invalid/NOT-LIVE/<asset>`. Status stops at **NOT LIVE: PREVIEW**. After an injected timeout, record the reconciliation before any retry.

## T8. Learning record

LEARNING_ID · ROOT_ID · ASSET_ID · prediction and confidence (written **before** results) · test variable · metric, native definition and window · measured / reported / unavailable · attribution label · expected vs actual · diagnosis · competing explanation · intervention · owner · retest date.

## T9. Editing comparison

Use section 4 of `sprint/ops/C01_EDITING_COMPARISON_RUN_SHEET_2026-11-03.md` and the SUB03 12-point standard. Keep the raw file, first pass and accepted export for each route.
