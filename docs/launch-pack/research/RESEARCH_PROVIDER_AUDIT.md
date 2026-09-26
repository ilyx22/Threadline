# Research provider audit: scheduled runs against real ingestion (27 September 2026)

**Question:** when a scheduled research run fires, what actually enters the workspace, from where, and what happens when a source fails?

**Code:**
- `src/lib/research/providers.ts`, `schedules.ts`, `collect.ts`, `miner.ts`, and the new `apify.ts`
- `src/lib/domain/intelligence.ts` (`SOURCE_COLLECTION`)
- the daily tick in `src/lib/jobs/handlers.ts`

## Findings

| Area | What exists | Verdict |
| --- | --- | --- |
| **Adapters** | `internalWorkspaceProvider` (content, inquiries, notes); `manualProvider` (pasted material); `urlProvider` (a public page read server-side, SSRF-guarded, login walls refused by name). **New:** `apify` (optional). | The core runs on real sources only. Nothing is simulated. |
| **Live sources in a schedule** | Each source kind has a mode. `historic_content` and similar kinds read workspace records. `competitor` and `creator` read the given URLs. `category`, `sales_call` and `customer_language` are manual: the run records "Needs a person: paste the material". | Honest. Social platforms that need a login (LinkedIn, Instagram, most of X) are **refused**, and the reason is recorded on the source. |
| **Config and approval** | No platform API credentials exist. Apify now needs three things: `RESEARCH_EXTERNAL_PROVIDERS=apify` (owner approval), `APIFY_TOKEN` (a secret, sent as a bearer header, never in a URL) and `APIFY_ACTOR_ID`. The configuration check reports an error if the switch is on without the token or Actor. | Off by default. It is an owner decision (O-11), and the Blueprint wants Apify benchmarked against Bright Data first. |
| **Fallbacks** | Public reader refused → Apify, if approved and configured → otherwise the refusal stands, with both reasons recorded on the run source. | New fallback path. |
| **Scheduling** | `ResearchSchedule`, 1–90 days. The runner claims each tick atomically (no double run). Only one open run per workspace: a due schedule is skipped with a recorded reason. The daily tick runs due schedules. | Correct. Tested (`schedules.test.ts`). |
| **Dedupe** | A fingerprint (normalised URL + first 2,000 characters) is checked against the workspace's existing research items. Duplicates are counted and reported on the run source. | Correct. |
| **Provenance** | Every item carries provider, method, source ref, fetch time and note. Apify items also carry `actor:<id>` and the requested URL. Mined quotes carry the asset, character offsets and source type. | Correct. |
| **Prompt injection** | `quarantine()` strips control characters and flags instruction-shaped text. The flag is stored, and retrieved text is data, never an instruction. | Correct (tested for Apify output too). |
| **Cost** | No platform API spend today. Apify is capped per request (`APIFY_MAX_ITEMS`, default 20, max 100) and at 10 URLs per batch. An account out of credit reports `UNAVAILABLE`. AI usage is recorded per generation (`AiGeneration.costMicroUsd` from configured prices; null when no price is set, never guessed). | There is no monthly spend cap for Apify in-app; rely on the Apify account's own limit. Recommendation: set a hard usage limit in the Apify console (owner). |
| **Failures** | Per source: status `unavailable` with the reason. Per run: collected / duplicates / unavailable / waiting-for-a-person are stored on the schedule's `lastOutcome`. Apify timeouts (120 s), 401/403, 402 and non-JSON responses map to truthful states. | Visible on Intelligence → Runs and Scheduled research. |
| **Visibility** | Run and source statuses appear in the app. The operator queue carries failed and uncertain work. | Adequate. |

## What was not built, and why

- **Bright Data adapter.** Its dataset API is asynchronous (trigger, then poll a snapshot) and dataset-specific. The Blueprint asks for a benchmark on the exact Threadline schema before committing. The provider interface is ready: a Bright Data adapter plugs in the same way as `apify.ts`, and nothing else changes. Build it only if the benchmark picks it.
- **Search and creator sweeps.** No approved API exists. `unavailablePlatformProvider()` reports the truthful state instead of simulating results.

## Owner actions

- **O-11:** decide whether to approve Apify for public-content collection.
  - If yes, choose an Actor after a small benchmark, then set the environment variables in the primary project only (never the mirror).
  - Set a usage limit in the Apify console.
  - **Verify:** Admin → System shows no configuration errors, and a scheduled run over a login-walled URL records `collectionMode: adapter` items with Apify provenance.
