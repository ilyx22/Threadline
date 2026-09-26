# Agent workflows: inputs, outputs, human checkpoints, failure states

Every AI-assisted step in Threadline OS is described here. The rules hold throughout:

- A person approves before anything leaves the building.
- Nothing is sent or published by a model.
- Retrieved text is data, never an instruction.
- A quote that is not in its source is dropped, not repaired.

The overall loop: capture expertise → maintain voice, claims and evidence → mine → AI draft → check → human approval → publish/record → feed back.

## 1. Mining (sources → evidence)

| | |
| --- | --- |
| **Trigger** | A transcript arrives (processing worker) or someone clicks **Mine it** on a Library text file |
| **Input** | Transcript, call notes, voice-note transcript, document, onboarding or coaching text |
| **Output** | Research items of kinds question, objection, expertise, story, proof, claim and idea seed. Each is an **exact quote** with asset, character offsets, source type and time. |
| **Human checkpoint** | Items are evidence for a person to review. Nothing is approved or published by mining. |
| **Failure states** | Quote not found in the source: dropped. No AI key: labelled mock output (`isDemo`), never counted as model work. Timeout or cancel: the generation is recorded as cancelled and not retried (AI-08). |
| **Queue** | Library / Intelligence evidence lists |

## 2. Research runs (sources → evidence)

- **Trigger:** a manual run, or a **scheduled research** run (1–90 days).
- **Input:** workspace records, pasted material, public URLs, and the optional Apify fallback.
- **Output:** research items with provenance and a fingerprint. Run sources are marked collected / unavailable (with reason) / waiting for a person.
- **Human checkpoint:** synthesis and signals are reviewed by Threadline before a client sees them. Nothing changes strategy until a person decides.
- **Failure states:** refused sources carry their reason; a skip while another run is open is recorded; duplicates are counted.
- **Queue:** Intelligence → Runs.
- See `RESEARCH_PROVIDER_AUDIT.md`.

## 3. Drafting (ideas, scripts, hooks, packaging, reports)

| | |
| --- | --- |
| **Input** | Brand Brain version (voice, claims, proof limits, content rules), evidence, lessons in force, performance context, the operator's steer |
| **Output** | Drafts with honest scores; each records the Brand Brain version it was written against |
| **Human checkpoints** | 1. An operator edits or accepts. 2. Internal QA against the editor checklist. 3. The **client approves an exact version**; any later change comes back for approval. |
| **Automatic checks before approval** | Packaging with a figure the script does not contain (or an unverified one), or with promise language, cannot be approved. Drafts written against an older Brand Brain version are listed for a check. |
| **Failure states** | Error or timeout: recorded on `AiGeneration`, with the status shown. Stale Brand Brain: flagged. Cancelled: stopped and recorded. |
| **Queues** | Create → Ideas / Scripts; Approvals (the client's, bulk approval skips any item whose version changed); Admin → Queue → Everything, in order |

## 4. Publishing and recording results

- **Input:** approved package; a connected account, or the manual route.
- **Output:** the post sent once at its time (approval is re-checked at send) or recorded by hand (URL and time).
- **Human checkpoint:** the approval is the gate; the manual route is always available.
- **Failure states:**
  - **Uncertain:** the platform never answered. The person checks the account, then records the URL or sends again.
  - **Partly posted thread:** resume the rest.
  - **Disconnected account:** the next action is to reconnect; nothing publishes meanwhile.
- **Queue:** Distribution, and Admin → Queue.

## 5. Diagnosis and learning (feed back)

- **Input:** the forecast frozen before publication, and actual performance.
- **Output:** SCORE → EXPLAIN → DIAGNOSE → PRESCRIBE → RETEST, and EXPECTED vs ACTUAL.
- **Human checkpoint:** diagnoses and corrections are approved before they appear in reports. **Make it a lesson** is a human decision, and lessons can be retired.
- **Failure states:** a piece younger than 14 days is "too early to read". A post-publication expectation is refused.

## 6. Inbox assistance (lead replies)

| | |
| --- | --- |
| **Trigger** | A lead arrives through an inbound source (form, Zapier, import) or is added by hand |
| **Input** | The lead thread and the Brand Brain |
| **Output** | A **suggested reply** (Draft a reply) |
| **Human checkpoint** | A person approves or edits it, **sends it themselves on the channel**, then marks **I sent it**. Threadline never sends lead replies. |
| **Failure states** | No AI key: labelled demo text. A follow-up date becomes a task on the day. Speed to lead is shown on the Pipeline page. |
| **Queue** | Pipeline |

## 7. Threadline's own outreach (acquisition)

- **Input:** prospects that pass the business-model filter, research notes, and the playbook scripts.
- **Output:** nothing is sent by software. The operator sends by hand, then records a **touch**. Replies are classified, calls booked, outcomes recorded, and the demand source is set with evidence.
- **Human checkpoint:** everything; this workflow is manual by design (no LinkedIn automation, no sequencer).
- **Failure states:** no active record may exist without a next action and a due date; a future-dated touch is refused.
