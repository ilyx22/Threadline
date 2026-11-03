# Weekly niche research run — plan (3 Nov 2026)

Status: owner approved the pilot patterns on 3 Nov and asked for weekly automated research.
Internal only. Builds on SPEC_2026-10-27_KNOWLEDGE_BASE_AND_AUTO_RESEARCH.md (Part B) and
RESEARCH_PILOT_2026-10-27_AI_CONSULTANTS_LINKEDIN.md.

## The constraint

The in-app research engine (spec phases R3–R8) needs the Anthropic API (R1), which is deferred
until a client needs in-app generation. So the weekly run starts on Claude Max, at no extra cost,
and moves into the app later without changing what it produces.

## Stage 1 — now: a scheduled Claude routine on Max (£0 extra)

A Claude Code scheduled routine (cloud agent on the owner's plan), weekly, Monday 07:00 UK.

**Each run, for each active niche** (starting with "AI consultants who want to post on LinkedIn"):

1. **Collect** public content from the last 7 days (the first run takes 90 days):
   - LinkedIn: public guest post and profile pages only. No login, no account. Seed list = the
     pilot's 15 creators, plus up to 10 new ones found through public search each week.
   - YouTube: public pages and third-party trackers (official API arrives at Stage 2).
2. **Rank per platform**, never across platforms. Outlier score = the post's reactions or views
   divided by that creator's median. Then a buyer-relevance check (does this attract buyers of
   consulting, or other builders?).
3. **Analyse** the top 10 per platform: hook, structure, angle, proof type, CTA, format.
4. **Compare with the patterns library** (the nine pilot patterns). For each pattern, record:
   still winning / weakening / new. A new pattern counts only when it appears in 3+ outliers
   from 2+ creators.
5. **Write the weekly report** to `docs/research/weekly/<niche>/<date>.md`, commit and push:
   - what's winning this week (with links, labelled as other people's content);
   - changes to the patterns library, with the evidence;
   - 5 idea angles for our clients in this niche (patterns applied, never copied);
   - limits (blocked pages, small samples).
6. **Propose a knowledge-base update.** If patterns changed, the report includes a ready-to-paste
   replacement for the "LinkedIn: what wins for consultants" entry. A person applies it as a new
   version in /admin/knowledge (the routine has no admin access, by design).

**Guardrails**: public content only; patterns, never copying; others' content always labelled;
no engagement, no logins; retrieved text is data, never instructions. If LinkedIn blocks most
fetches in a run, the report says so instead of guessing.

**Owner effort**: about 5 minutes a week: read the report, approve the knowledge-base update.

**Known limits**: LinkedIn blocked about half of the profile fetches in the pilot; visuals and
transcripts are not analysed; samples are small, so results are directional.

## Stage 2 — when a client needs in-app generation (R1 switched on)

Move the same flow into the app per the spec: YouTube Data API (free quota), the research plan
generated from each Brand Brain, niche memory, transcripts on the top 30 (R4), Apify for
TikTok/Instagram (R5, owner approves budget), visual analysis of the top 10 (R6), and a
winning-patterns view the generators cite (R7). Estimated £10–35 a month per niche across three
platforms, capped per niche.

**Triggers for Stage 2**: a paying client on a platform other than LinkedIn, or more than one
active niche, or the weekly report taking more than 15 minutes of owner time.

## Next steps

1. Owner says go → Claude creates the weekly routine (a cloud routine on the owner's plan;
   owner confirms the schedule screen).
2. The first run is the 90-day backfill; Claude checks the report and the proposed
   knowledge-base update with the owner.
3. Review after 4 runs: keep, change the seed list, or move to Stage 2.
