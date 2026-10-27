# Knowledge base and automatic niche research — spec

Status: OWNER REQUEST 27 Oct 2026, spec for approval. Internal only.
To-do: section R in THREADLINE_MASTER_TODO_2026-10-20_V4_2_INFRASTRUCTURE_STARTED.md.

## Why

Without the Anthropic key the starter ideas are templates. With only the key they would be
generic chatbot output. Output quality comes from what the model is given each time:

1. **Threadline's own know-how** (SOPs, frameworks, course notes, winning scripts) — Part A.
2. **The client** (Brand Brain from onboarding) — exists.
3. **What is already winning in the client's niche, right now** — Part B.

Owner requirement for Part B: no manual niche build-up. Onboard a new type of client and the
system already knows what to search, where, and what good looks like.

## Part A — Threadline knowledge base

- **Library in admin** (staff only): upload documents (PDF, DOCX, MD, Google Doc export, pasted
  text). Each gets a type: SOP, framework (hooks, scripts, structures), example script (winning /
  losing), course note, objection bank, style rule.
- **Chunked and indexed** in Postgres (full-text first; embeddings only if retrieval proves weak).
- **Used on every generation** (ideas, scripts, hooks, reviews): the relevant chunks are added to
  the prompt next to the client's Brand Brain, with the source named so a reviewer can see why.
- **Course material** is guidance for the model, never quoted publicly or shown to clients.
- **Versioned**: replacing a document keeps the old one restorable; no silent overwrite.
- Feeds J04 (corpus/judge): example scripts tagged winning/losing become the comparison set.

## Part B — automatic niche research

### Flow (runs by itself when a workspace is built, then weekly)

1. **Search plan, generated.** From the Brand Brain (who they serve, pains, questions,
   objections, offer, competitors, accounts to watch, target platforms) the model writes a plan:
   search terms, hashtags, seed creators/channels and topics per platform. Stored as an editable
   *Research plan* on the workspace. Default: runs without waiting; staff can edit or pause.
2. **Niche memory.** Plans and results are filed under a niche label (e.g. "UK AI advisory for
   professional services"). A new client close to an existing niche starts from that niche's
   research immediately, then adds their own terms. Only public content is shared across
   workspaces; nothing client-private ever is.
3. **Collect** public posts per platform through the existing provider interface
   (`src/lib/research/providers.ts`): YouTube first (official API + free captions), then TikTok and
   Instagram via a paid scraper (Apify adapter already built, off), LinkedIn last (hardest).
   Hard caps per run and per workspace per month.
4. **Rank** by *outlier score*: views against the creator's usual views (not raw views), recency,
   engagement rate; then a relevance check against the client's audience. Output: top N per week.
5. **Analyse the top N (default 10/week)**
   - *Transcript*: captions where available, else a transcription service (B08).
   - *Visuals*: frames sampled densely in the first 3 seconds and sparsely after; the vision model
     records hook type, opening shot, on-screen text, framing, cut pace, B-roll, caption style,
     CTA.
6. **Winning patterns.** Per niche and per workspace: recurring hooks, structures, angles and
   visual patterns, each linked to the real examples behind it. Idea and script generation cite
   these. Anything shown to a client is labelled as other people's content, never as ours.

### Time to value

A new workspace has a research plan within minutes of the build and first ranked results within
the hour (budget allowing); an existing niche is instant.

### Guardrails

- Public content only; no logins, no rented accounts, no engagement; platform terms respected.
- Retrieved text is data, never instructions (existing quarantine).
- Never copy others' content; patterns and structure only.
- Competitor results never presented as Threadline's.
- Spend caps set in configuration; the run stops and says so when a cap is hit.

### Costs (to confirm in the pilot)

Pay-per-use only: scraper per result, transcription per minute, model per analysis. Pilot budget
£10–30 on one niche before any recurring spend; per-workspace monthly cap after.

## Build order

| Phase | What | Needs |
|---|---|---|
| R1 | Anthropic connected with spend cap (B06) | Owner console login |
| R2 | Knowledge base v1 (Part A) | Owner's documents |
| R3 | Generated research plan + niche memory + YouTube collection + ranking | R1 |
| R4 | Transcripts on top N (B08) | Transcription choice |
| R5 | TikTok/Instagram via scraper; pilot on first niche | Owner creates scraper account, approves pilot budget |
| R6 | Visual analysis of top N | R4 |
| R7 | Winning-patterns view + generation citing it | R3–R6 |
| R8 | LinkedIn collection | Benchmark of options |

Each phase is tested on the synthetic test workspace before a real client sees it.
