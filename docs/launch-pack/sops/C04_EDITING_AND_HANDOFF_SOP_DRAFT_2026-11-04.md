# C04 + ED5: editing and handoff SOP (draft, 4 Nov 2026)

> **Status:** DRAFT, NOT BENCHMARKED. Internal only. Ilyas approves quality and this SOP.
>
> **Covers:** master to-do C04 (12-criterion QA, file naming, storage, source-to-derivative IDs, handoff, revision, overflow and fallback), ED5 (fallback and overflow route) and ED8 (handoff, naming, storage, revision workflow).
>
> **Depends on:**
> - **C01** (editing comparison, not yet run): real minutes, the hook bar and the observed tool steps.
> - **C02** (standard route, not yet chosen): the tool and the fallback route.
> - **C11** (primary and backup editor): whether anyone other than the owner edits.
>
> Every tool-specific step is marked **TO FILL after C01/C02**. No tool is chosen here and no tool results are assumed.
>
> **Sources:**
> - SUB03 V2 (`sops/candidates-2026-10-16/SUB03_EDITING_BENCHMARK_AND_PRODUCTION_CANDIDATE_V2.md`), sections B to D;
> - `strategy/GUARANTEE_ECONOMICS_AND_TESTS_2026-10-15_V2.md`, Part 2 (the acceptance bar);
> - `sprint/ops/C01_EDITING_COMPARISON_RUN_SHEET_2026-11-03.md`;
> - `sprint/ops/C09_SUPPORT_AND_RECOVERY_PLAN_2026-11-04.md`, section 4;
> - `onboarding/RECORDING_GUIDE.md` and `onboarding/REVIEW_AND_APPROVAL.md`;
> - `sprint/contracts/CLIENT_SERVICES_AGREEMENT.md` 3.7–3.8 and `CONTRACTS_README.md` C-03;
> - Router V2 doctrine: AUTHORITY-FIRST / HIGH-RETENTION / LOW-NOISE.
>
> **Product facts** were checked in the code on 4 Nov 2026.

## 1. The 12-criterion QA checklist

This is one editing standard. It reconciles:
- the economics acceptance bar: "hook in the first 2 seconds; clean audio; readable captions; purposeful pacing; restrained cuts and punch-ins; correct facts; makes sense without the full conversation; brand treatment consistent";
- the fifteen SUB03 V2 checks, which already absorb ED3.

The master to-do asks for twelve criteria, so the fifteen are merged into twelve. Every SUB03 requirement is kept; none is dropped.

**Two rules:**
- **Gating (G):** failing any gating criterion means REVISION or REJECT, however good the styling or hook.
- **Not scored here:** time, cost, turnaround, revisions and reliability go in the delivery ledger (SUB03 A5/A7), not in this checklist.

| # | Criterion | Pass means | Sources | Merged from |
|---|---|---|---|---|
| 1 G | **Meaning and context** | The speaker's intended point and its necessary qualifications survive. No cut removes context that changes the meaning. | SUB03 1, 5 | SUB03 1 + the meaning part of 5 |
| 2 G | **Factual accuracy** | Names, numbers, examples and technical terms match the source, and on screen and in captions. Uncertain words are checked against the footage, never guessed. | SUB03 2; econ "correct facts" | — |
| 3 G | **Claims and permissions** | No unapproved guarantee, proof, story, private information or invented result. Packaging must also clear the app's block on unverified figures and promise language. | SUB03 3; REVIEW_AND_APPROVAL "What blocks approval" | — |
| 4 | **Hook** | The opening earns the intended buyer's attention within the first 2 seconds and speaks to that buyer. It is not misleading or unsupported. Scored 1–5, with the reason recorded. | SUB03 13, 4; econ "hook in the first 2 seconds" | SUB03 13 + 4 (audience relevance) |
| 5 | **Retention structure** | There is a clear opening, body and payoff, and each beat earns the next. The clip makes sense without the full conversation. The payoff lands before attention goes. No dead air or padding. Judged on the export, not the transcript. | SUB03 14, 5; econ "makes sense without the full conversation" | SUB03 14 + the structure part of 5 |
| 6 | **Pacing and restraint** | The pacing suits the content and the speaker. Cuts and punch-ins are restrained, with no emoji, meme or noise effects. | SUB03 15; econ "purposeful pacing; restrained cuts and punch-ins"; C01 brief style | — |
| 7 | **Audio** | Speech is intelligible at a consistent level, with no distracting clipping or noise. Checked on the actual export. | SUB03 6; econ "clean audio" | — |
| 8 | **Captions** | Burned-in captions have the right words, spelling and timing, and are readable where they are placed. | SUB03 7; econ "readable captions" | — |
| 9 | **Visual framing** | The subject is clear. Cuts, B-roll and reframing help comprehension and never mislead. | SUB03 8 | — |
| 10 | **Brand and voice** | The agreed style and treatment are applied consistently, and the speaker's delivery stays natural. It doesn't look like a generic agency template. | SUB03 9; econ "brand treatment consistent" | — |
| 11 | **Destination readiness** | The agreed format, crop and safe area are right, and the export profile is verified for the chosen destination. | SUB03 10 | — |
| 12 G | **Rights, access and delivery integrity** | Media, music and fonts are permitted, and nothing confidential is exposed. The file is the right root, piece and version. It plays to the end, and the captions match the media. The owner's QA sign-off is recorded. | SUB03 11, 12 | SUB03 11 + 12 |

**Mapping to C01.** The C01 evidence sheet uses SUB03 numbering, where the gating checks are 1, 2, 3, 11 and 12. Here the gating checks are 1, 2, 3 and 12. The substance is identical, because criterion 12 holds both SUB03 11 and 12.

**What to record per piece:**
- PASS / REVISION / REJECT, with the reason;
- the hook score (1–5);
- "would publish Y/N".

The standard is never framed as "basic". Heavier creator-style editing is premium intensity and out of standard scope (section 5).

**Not set by this SOP:**
- **TO FILL after C01:** the minimum hook score for PASS.
- No loudness, bitrate or subtitle specification is set until current platform requirements are verified and a real playback check is done (SUB03 B).

## 2. IDs, file naming and storage

### 2.1 IDs (what the app holds)

| ID | Where it lives in the app | Rule |
|---|---|---|
| **ROOT_ID** (test family) | The Learning panel on a piece. The root has a short label and a one-sentence thesis. | A new claim gets a new root. A new hook on the same claim keeps its root, so the results stay comparable. Proposed label format: `{CLIENTCODE}-RT{nn}`, as in Threadline's own `TL-RT11` (R9 batch 1). |
| **Piece** | The content item | Proposed short reference: the last 6 characters of the app's piece ID. **To confirm:** whether a visible short reference exists. |
| **Lineage** | `derivedFromId` and the lineage role on the piece | `source` is the original recording or piece. `derivative` is a short cut from an interview, or a text version of a video. `retest` is a deliberate re-attempt at the same thesis after a diagnosis. A derivative always points at its source piece and stays on the same root. |

Files follow the piece's root. File every piece under its root **before** uploading drafts. D7, "ROOT_ID survives all derivatives", is checked at step 6 of the handoff.

### 2.2 File names

**Pattern:** `{CLIENTCODE}_{ROOT}_{PIECE}_{ROLE}_v{nn}_{STATE}[_src-{in}-{out}].{ext}`

Fields:
- **ROLE** is `SRC`, `DER` or `RET`.
- **STATE** is `original`, `draft`, `approved` or `final`.
- `_src-{in}-{out}` gives the source timestamps. It is **required for derivatives**, for example `_src-04m12s-05m20s`.

Examples:
- `ACME_RT03_a1b2c3_SRC_v01_original.mp4`
- `ACME_RT03_d4e5f6_DER_v02_draft_src-04m12s-05m20s.mp4`

Test files keep the C01 form, for example `TL-TEST-SRC-001_…_original.mp4`.

Rules:
- Versions only go up. Never overwrite the last approved version (SUB03 C7).
- Captions and thumbnails take the same stem plus `_captions.srt` or `_thumb.png`.
- Do not rename files already in production as part of adopting this SOP (SUB03 D).

### 2.3 Storage

| What | Canonical home | Notes |
|---|---|---|
| Original source | Library, attached to the **source** piece | Stored privately in R2, with a 512 MB limit. Never edited; this file is the reference for checks 1 and 2. Over 512 MB, or a client link: attach the link (Drive, Dropbox or WeTransfer) to the piece. Malware scanning is **off**, so accept only the client's own known files (C09). |
| Drafts (`v01`, `v02` …) | Library, attached to the **derivative** piece | Each draft is uploaded before the piece moves to `in_review`. |
| Approved and final package | Library on the same piece, plus the platform package in the app | The package is what the client approves before a publish record can be released. |
| Editor brief, QA results, fix notes | **Internal staff notes** on the piece | Clients can't see these. Never put client-facing wording here. |
| Working project in the editing tool | The tool's workspace: **working copy only** | **TO FILL after C01/C02:** tool, project naming, retention, and whether uploads train models (C01 §3 checks). Delete client media from the tool's cloud once the piece is live: **TO FILL** the deletion steps. |
| Transcript | Written by hand onto the piece | Transcription is not connected (B08, C09). |

## 3. Handoff, step by step (founder → editor → review → client approval → publish → live URL)

At launch the owner is usually the editor too (C11 open). Still do every step: the stages and the IDs are what make a later handoff possible.

| # | Who | App stage | Step |
|---|---|---|---|
| 1 | Client | → `raw` | Records from the Recording Room, marks the piece as recorded, then uses **Upload raw footage** or adds a link (RECORDING_GUIDE §3). |
| 2 | Owner | `raw` | Checks the upload plays all the way through and that the source permission is in place. Writes the transcript by hand, correcting names and numbers and marking uncertain words. Files the piece under its root. Bad audio or footage: ask for a specific pickup, never hide it with effects (SUB03 D). |
| 3 | Owner | `raw` | Picks the segments, keeping the meaning, the source in/out times and the root. For each clip, creates a **derivative** piece pointing at the source. Writes the brief in the internal notes: buyer, intended point, source segment, factual boundaries, destination and format, style, branding, CTA, and a useful date. Assigns the editor. |
| 4 | Editor | → `editing` | Produces the first pass on the standard route (**TO FILL after C01/C02:** the tool steps). Keeps the source unchanged and keeps project, draft and approved exports separate. |
| 5 | Editor, then owner | `editing` | Runs the 12 criteria on the export and fixes internal failures before the client sees anything. Records the result in the notes. Any changed claim needs fresh approval: check against the script. |
| 6 | Owner | `editing` → `in_review` | Signs off QA (criterion 12). Uploads the named draft to the derivative piece and confirms the root and source link (D7). Sends one consolidated batch for client review with notes for each version. |
| 7 | Client approver | `in_review` → `approved` / `changes_requested` | Approves the exact version, or uses **Request changes** with a note. A changed cut comes back for approval again; approval never carries over to a new cut (REVIEW_AND_APPROVAL). |
| 8 | Editor | `changes_requested` → `editing` → `in_review` | Revises against the note. Logs the reason and the time, re-runs the 12 criteria, and bumps the version (section 4). |
| 9 | Owner | `approved` | Builds the final package: media, captions, thumbnail, copy and destination instructions. The client approves the platform package. The packaging blocks (unverified figures, promise language) must clear. |
| 10 | Client, or Threadline with delegated access | → `live` | Publishing is **manual on every platform**: post the approved package from the client's own account. Never ask for a password. Check what actually went out (an export is not a publication), then record the live URL on the piece. |
| 11 | Owner | `live` | Updates the time, cost and revision ledger. Deletes working media from the tool's cloud (**TO FILL**). |

**Turnaround.** No turnaround or response time is stated to clients. The approval window and revision rounds are owner decision C-03, and response targets are a C09 decision. Internally, the "useful date" in the brief is a planning date, not a promise.

## 4. Revision rules

**Proposed limit:** up to **2 consolidated rounds** per item (agreement 3.8). This is still **OWNER DECISION C-03**, so don't quote it to a client until it is approved.

**One revision means:** one **Request changes** from the client approver on one version, with a note. All the feedback in that note counts as a single round, however many points it lists. Feedback left on an earlier cut (labelled "Earlier version") belongs to that cut's round.

**What does not count as a revision:**
- our internal QA fixes before `in_review`;
- re-work to correct a failure on a gating criterion (1, 2, 3 or 12) that we introduced, such as a wrong figure or a caption error.

**What is new work, not a revision.** These are logged, not silently absorbed, and may be quoted separately or reduce new pieces that period (agreement 3.7–3.8):
- changes after approval;
- a new claim, which needs a new root;
- a re-record;
- extra derivatives or formats beyond the agreed set;
- heavier creator-style or premium editing;
- long-form, unless a pilot is agreed;
- unlimited bespoke creative.

**Escalation.** More than two revision cycles on an item, or repeated across items, triggers a brief, quality or scope diagnosis under SOP 06 (SUB03 C10). Unsupported meaning or claims: **hold and escalate to the owner**.

## 5. Overflow and fallback route (ED5)

This is consistent with C09 §4 ("Editing" row). **Backup editor: none at launch** (C11 decides). The aim is full quality on fewer pieces rather than more pieces at lower quality.

| Trigger | First response | If that fails | Tell the client? |
|---|---|---|---|
| **Overflow:** pieces due this week exceed editing capacity | Owner edits on the standard route (C02). Prioritise by agreed due order, then by root (keep one test family comparable). **TO FILL after C01/C06:** the capacity threshold, in accepted pieces per week. | Ship fewer pieces at full quality and say so in the weekly report. The rest move to a replanned date. | Yes, if a promised piece slips |
| **Editor unavailable, late or below standard** | Owner takes the piece back at the last good draft, which is in the Library, so no work is lost. Record the blocker on the piece. | Named backup (none yet; C11), or an owner-managed replan. Give a useful date, never a false "shipped" status (SUB03 D). | Yes, if a promised piece slips |
| **Tool failure or outage** | Switch to the tested fallback route (**TO FILL after C02:** route and steps). Keep the draft history. | Manual edit by the owner. Hold the piece rather than lower the standard. | Only if it delays them |
| **Draft fails QA twice** | Diagnose the brief, source and route. Fix and re-run all 12. | REJECT that cut. Re-select the segment, or ask for a pickup. | Only if it delays them |
| **Unusable footage** | Ask for a specific pickup, or agree a limited alternative. | Text-led fallback: make a text derivative (for example a LinkedIn text version) on the same root, pointing at the source, after client approval. | Yes |
| **Upload or processing fails** | Client re-uploads, or sends a shared link that is attached in the Library (C09). | Owner attaches the link by hand and writes the transcript by hand. | Only if it delays them |
| **Publishing problem** | Manual posting from the client's account. Record the live URL the same day. | If a scheduler is added later (E15) and fails, go back to manual. | Yes, the same day |
| **Client late** (approval or recording) | Record the blocker and its impact on the piece. | No contractual exclusion is assumed. Raise it in the weekly report. | Yes, as part of the normal report |

**Overflow never means:**
- skipping a gating criterion;
- publishing anything unapproved;
- sending client media to an untested tool or a freelancer without the owner's go and confirmed terms.

## 6. TO FILL after C01/C02 (and the related owner decisions)

1. **C02:** the standard route and tool. Step-by-step instructions for steps 4 and 8 of the handoff, from the observed C01 run. Optionally a screen walkthrough with no credentials showing.
2. **C02:** the fallback route and its steps (section 5, "Tool failure").
3. **C01:** the minimum hook score for PASS, and the measured minutes per accepted clip (QA, fix and edit).
4. **C01:** each tool's terms on privacy, training, retention and deletion; the editing tool's project naming; and the steps for deleting from the tool's cloud.
5. **C01/C02:** export profiles for each destination, verified against current platform requirements with a playback check (criterion 11).
6. **C03:** ACCEPTABLE, PREMIUM and REJECT reference examples to attach to section 1.
7. **C06:** the overflow threshold (accepted pieces per week the owner can carry alongside acquisition).
8. **C11:** primary and backup editor (or "self-delivery plus this fallback"), their access level and how files are handed to them.
9. **Owner decision C-03:** revision rounds and the approval window. **C09 §6:** response targets.
10. **Product check:** whether the piece shows a short reference before section 2.1 relies on it. *Checked 4 Nov:* the revision count does go up by one on each **Request changes** (`src/lib/actions/content.ts:121`) and is shown on the production board and the piece page, so section 4 can rely on it.
