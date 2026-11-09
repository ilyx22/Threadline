# Capability matrix for the first delivery benchmark (BUILD-01, 9 Nov 2026)

Route traced from source to learning. Base: commit 9887a66 plus the fixes listed in section 3.

**Status words**
- **Verified working:** exercised, with a date. "Local" means automated tests against the local test database, not the live app.
- **Present, unverified:** code or account exists; the path this run needs has not been exercised.
- **Missing:** nothing exists. The manual bridge is named.
- **Optional:** not needed for this run.

**Checked today (9 Nov):**
- Production `/api/health`: 200, database connected, 0 config errors, commit 9887a66 (before these fixes).
- Unit tests 891/891 and typecheck and lint clean, on the local database.
- QA: see `02_TODO_DELTA` for the final count.

**Not checked today:** any signed-in production screen, the `test-dry-run` workspace, mailboxes, social accounts. Earlier dates below are historical evidence, not a fresh inspection.

## 1. The route

| # | Capability | Status | Evidence | Bridge or next action |
|---|---|---|---|---|
| 1 | Upload to private storage, tenant-scoped retrieval | Verified working (live, 3 Nov, 15.3 MB) | B09 | A 25–30 min source file is untested; the benchmark tests it |
| 2 | **Source routing before mining** | Verified working (local, 9 Nov). Missing until today | Fix F1; two new tests | Library control has not been used in a browser; fixtures F1–F3 test it |
| 3 | Brand Brain versions, onboarding | Verified working (live, 27 Oct and 3 Nov, synthetic) | B03/B04 | Benchmark's content not yet entered |
| 4 | Genuine voice examples with provenance | Missing as a structured store (`soundsLikeMe` is a plain list) | Schema | T1 packet; needs owner's real writing |
| 5 | Transcription | Missing (no worker exists) | 5 Nov inventory | Manual: editor's transcript or pasted text |
| 6 | Miner (exact quotes) | Present, unverified with a real model; demo-mode tests pass | `miner.test.ts` | Manual mining with T1/T2 |
| 7 | Roots and lineage (`ContentRoot`, derivatives) | Present, unverified with real clips | 5 Nov inventory | Exercised in the run |
| 8 | Research roles (miner, trend, conversation, outlier) | Missing as assistants | SOP §10 proposed | Manual prompts, T2/T3. Grok Bot is **optional**, Lane C |
| 9 | Claude drafting in the app | Present, unverified; API off | E20, demo only | Manual via Claude subscription, labelled |
| 10 | Claims and banned-topic gates | Verified working (live, 3 Nov) | B05/B10 | None |
| 11 | **Sentence and scene QC ledger** | Missing in app (comments have version and timecode, no line function or reason code) | Schema | T5 ledger |
| 12 | Recording Room, teleprompter | Present, unverified in a real session | QA only | Exercised at recording |
| 13 | Editing tools | Missing: no tool tried, no accounts | C01 run sheet | Owner creates free accounts |
| 14 | SUB03 standard | Present, unverified on real clips | Draft | Applied in the run |
| 15 | LinkedIn and X adaptations | Present (`PlatformPackage`), unverified | Schema | Exercised in the run |
| 16 | Exact-version approval, stale refusal, bulk skip | Verified working for ideas and scripts (live, 3 Nov; local today). Video derivative loop not run | B10 | Exercised in the run |
| 17 | Roles and cross-tenant boundaries | Verified working (local today; live B16/B17) | `tenancy.test.ts` | Re-check on benchmark's direct URLs |
| 18 | No-send queue preview | Present via the manual route; preview state missing | `PublishRecord` | T7 with `NOT-LIVE` URLs |
| 19 | Publishing connectors, schedulers | Optional for this run; mocks only | 5 Nov inventory | Do not mark live from this run |
| 20 | Manual and CSV metrics, duplicate refusal | Verified working (local today) | Fixture parsed; unique key | See D4, D5 |
| 21 | Missing versus zero | Stored correctly (local, 9 Nov). Not shown in reports | Fix F2; D5 | Read the `unavailable` field by hand in this run |
| 22 | Expected vs actual, weekly report | Partly verified (B12, 3 Nov) | B12 `[~]` | T8 plus report PDF |
| 23 | Support request, export, offboarding | Present, unverified in one journey | Dry-run steps 13–14 | Exercised in the run |
| 24 | Malware scanning of uploads | Missing (off, DR-11) | 5 Nov inventory | Owner-created test files only. **Blocks real-client uploads** |

## 2. Corrections accepted without repeating setup

- **Employer clearance granted 16 Oct.** The company-led-only rule in my 5 Nov brief, run sheet notes and memory is stale.
- **Domain and profiles** reported live; not recreated. Company Page still connection-gated.
- **Smartlead and Zapmail paid.** Mailbox login, connection and warm-up remain unverified.
- **Diagnosis is 60 minutes.** One in-app SOP template still has a 45-minute structure (`src/lib/templates/master.ts:233`). I left it unconfirmed because that template may be a different session.

## 3. Changes made today

| ID | Change | Status |
|---|---|---|
| F1 | Four source routes. Files can't be mined until routed; excluded files never. Non-public items are withheld from writer context, idea evidence, signal evidence and run extraction. Re-routing reaches items already mined and reports ideas citing them. No migration | Implemented, tested locally; not used in a browser or owner-accepted |
| F2 | Blank manual and CSV metrics recorded as unavailable | Implemented, typechecked; CSV parsing tested, database write not separately tested |

## 4. Open defects (logged, not fixed)

| ID | Defect | Why it can wait |
|---|---|---|
| D3 | Approval doesn't bind the destination account: `PlatformPackage` hash has platform but not account | No transfer in a no-send run. **Fix before any live publish.** T6 records the account by hand |
| D4 | A CSV reading dated before the post went live is accepted without warning. It doesn't overwrite a newer reading | Synthetic only; add a warning before real reporting |
| D5 | Reports and rankings read blanks as 0; `unavailable` is stored but not displayed | Read by hand; fix before client reporting |
| D6 | Content-item approval hashes cut IDs, not file bytes | T6 records SHA-256; review before real clients |
| D7 | The nightly mining job silently holds an unrouted file, with no prompt to route it | Library shows the control; add a visible task if it causes misses |

## 5. Smallest complete first slice

Eligible source → root → Claude draft (manual) → T5 ledger → recorded and edited asset, LinkedIn/X copy → app approval plus T6 → T7 preview → fixture metrics and report → scorecard. Procedure in `01_RUN_PLAN.md`.

Stop conditions are the hard fails in BUILD-13.
