# Guarantee economics, editing dry run and paid-view test

**14 October 2026. Preparation for owner decisions; nothing here is approved.** No spend, publishing, outreach or purchase is authorised by this document. Companion to `OFFER_BRIEF_2026-10-14_V2_SOURCE_AUDITED.md` (Drive) and the 13 October handoff.

**Rules used:** amounts exclude VAT. **UNKNOWN** marks an input with no Threadline data yet. No refund rate or likelihood of a miss is assumed anywhere; every scenario simply shows what happens *if* it occurs.

---

## Part 1. Cost and refund model (one client, 12 weeks)

### 1.1 Inputs

| Input | Value | Status |
|---|---|---|
| F: service fees | £10,000 (£2,500 implementation + 3 × £2,500, as currently structured) | Known |
| T: view target | 100,000 eligible views in 84 days | **Candidate**, not decided |
| O: organic eligible views | 0 / 25,000 / 50,000 used as scenarios | **UNKNOWN**: no Threadline data |
| c: cost per eligible paid view (CPV) | 1p / 2p / 3p / 5p / 10p used as scenarios | **UNKNOWN**: the paid test (Part 3) gives a first reading only |
| B: media cap per client | £1,500 or £3,000 used as scenarios | **Owner decision** |
| Founder hours | ~17 h per 4-week period (research/plan 3, recording 3, selection/QA 4, approvals/publishing 3, client calls 2, reporting 2), so **~51 h per client** | **Hypothesis**: replace with dry-run timings |
| h: value of a founder hour | £25 or £50 used as scenarios | **Owner decision** |
| E: editor cost per core video | £0 (owner edits) / £15 / £30 | **UNKNOWN**: market rates unverified |
| Core videos | 36–48 per client (12–16 per period) | **Workload hypothesis** |
| Tools | Descript ~$24/month, OpusClip ~$15–29/month, AssemblyAI ~$0.15 per audio hour (STACK.md, prices checked 26 Sept). Riverside **UNKNOWN**. Shared across clients | Approximate; re-check before buying |
| A: acquisition cost per client | Domains, mailboxes, Smartlead, Calendly plus founder sales hours | **UNKNOWN** until outreach runs |

### 1.2 Media needed to reach 100,000 views

| Organic views | 1p | 2p | 3p | 5p | 10p |
|---|---:|---:|---:|---:|---:|
| **0 (zero organic)** | £1,000 | £2,000 | £3,000 | £5,000 | £10,000 |
| 25,000 | £750 | £1,500 | £2,250 | £3,750 | £7,500 |
| 50,000 | £500 | £1,000 | £1,500 | £2,500 | £5,000 |

At 10p with zero organic, the media alone equals the whole fee. **CPV is the number that decides whether a 100,000 guarantee is viable.**

### 1.3 Outcome at a fixed media cap: full refund (A) vs proportional (C)

"Left" = fees − media − refund, **before** delivery, acquisition and other costs (subtract those separately, §1.4). C refund = £10,000 × (1 − V/T) when V < T.

**Media cap £1,500**

| Organic | CPV | Views reached | Hit? | Left under **A** | Left under **C** |
|---|---|---:|---|---:|---:|
| 0 | 1p | 100,000 | ✅ | £9,000 | £9,000 |
| 0 | 2p | 75,000 | ❌ | **−£1,500** | £6,000 |
| 0 | 3p | 50,000 | ❌ | **−£1,500** | £3,500 |
| 0 | 5p | 30,000 | ❌ | **−£1,500** | £1,500 |
| 0 | 10p | 15,000 | ❌ | **−£1,500** | £0 |
| 25,000 | 2p | 100,000 | ✅ | £8,500 | £8,500 |
| 25,000 | 3p | 75,000 | ❌ | **−£1,500** | £6,000 |
| 25,000 | 5p | 55,000 | ❌ | **−£1,500** | £4,000 |

**Media cap £3,000**

| Organic | CPV | Views reached | Hit? | Left under **A** | Left under **C** |
|---|---|---:|---|---:|---:|
| 0 | 2p | 100,000 | ✅ | £8,000 | £8,000 |
| 0 | 3p | 100,000 | ✅ | £7,000 | £7,000 |
| 0 | 5p | 60,000 | ❌ | **−£3,000** | £3,000 |
| 0 | 10p | 30,000 | ❌ | **−£3,000** | £0 |
| 25,000 | 3p | 100,000 | ✅ | £7,750 | £7,750 |
| 25,000 | 5p | 85,000 | ❌ | **−£3,000** | £5,500 |
| 25,000 | 10p | 55,000 | ❌ | **−£3,000** | £2,500 |

**Reading it:** under **A**, a miss by any amount means you refund £10,000 and lose the media too. Under **C**, the loss scales with the size of the miss. Note that "left" under A is still before delivery costs (§1.4), so the real loss on a miss is larger.

### 1.4 Delivery cost per client (hypothesis until the dry run)

| | Founder at £25/h | Founder at £50/h |
|---|---:|---:|
| Founder time (~51 h) | £1,275 | £2,550 |
| + editor £0 per video | £1,275 | £2,550 |
| + editor £15 per video (36–48) | £1,815–£1,995 | £3,090–£3,270 |
| + editor £30 per video (36–48) | £2,355–£2,715 | £3,630–£3,990 |
| + tools (allocated) | ~£50–£150 | ~£50–£150 |

**Contribution = Left (§1.3) − delivery (§1.4) − acquisition (UNKNOWN) − other.**
Example: cap £3,000, zero organic, 3p (a hit): £7,000 − ~£2,000 delivery = **~£5,000 before acquisition**. The same client missed under A: −£3,000 − £2,000 = **~−£5,000** (the cash refunded is £10,000).

### 1.5 Refund cash requirement

Refunds are paid **after** the fees have been received and partly spent, so the cash has to be available.

| Concurrent guaranteed clients that miss | Cash out under A | Cash out under C (example: each reaches 50,000) |
|---|---:|---:|
| 1 | £10,000 | £5,000 |
| 2 | £20,000 | £10,000 |
| 3 | £30,000 | £15,000 |

Misses can come together (the same platform, creative or audience problem across clients), so plan for at least two. **Under A, each guaranteed client needs £10,000 of refund cash that can't be spent until the guarantee period ends.**

---

## Part 2. Editing dry run: 3–5 clips (use the live test workspace)

**Goal:** choose the standard production route on evidence: quality, minutes, cost, turnaround.

**Setup**
- [ ] Choose the source: one 30–60 minute recording (the owner, or a willing contact with written permission). No client footage without permission.
- [ ] Upload to the test workspace Library (`test-dry-run`); note the upload time.
- [ ] Define "acceptable" in writing before editing: hook in the first 2 seconds; clean audio; readable captions; purposeful pacing; restrained cuts and punch-ins; correct facts; makes sense without the full conversation; brand treatment consistent.

**Per clip, run the routes and record the measurements**

| Route | What | Record |
|---|---|---|
| R1 AI-only | OpusClip auto-clip, minimal fixes | minutes of human fixing, accepted Y/N, cost |
| R2 Hybrid | OpusClip/Descript selection, then the owner edits to standard | minutes, accepted Y/N, cost |
| R3 Manual | The owner edits in CapCut/Descript from the transcript | minutes, accepted Y/N, cost |
| R4 Human editor (optional) | One freelance test edit to the written standard | £ quoted, turnaround, revision rounds, accepted Y/N |

- [ ] For each clip: hook strength (1–5), meaning preserved (Y/N), facts checked (Y/N), would publish (Y/N).
- [ ] Time the whole chain once: transcript → selection → edit → QA → approval in the portal → publish-ready.
- [ ] Put the results into §1.4 (replace the hypotheses with real minutes and £).
- [ ] Decide the standard route and keep 1 acceptable and 1 rejected example as the reference standard.

**Done when:** you know the minutes per acceptable video and the cost per video for the chosen route.

---

## Part 3. Paid-view test (specification only; spending not authorised)

**Purpose:** a first reading of eligible CPV for B2B expert clips. It can't prove a guarantee is safe; it shows whether 1–3p is plausible or fantasy.

| Item | Specification |
|---|---|
| Budget | **£50–100 total, pending owner approval of the exact amount** |
| Creative | 3–5 accepted clips from Part 2; permissioned; no client claims; no guarantee wording |
| Platforms | **One** primary platform first (fewer cells, a readable result), e.g. YouTube Shorts *or* Instagram Reels. LinkedIn's video-view definition differs and costs more, so test it separately later if needed |
| Account | A Threadline-owned account (once the handles exist). Publishing it is a public act and needs the owner's OK |
| Targeting | UK + US; job/interest targeting nearest to B2B decision-makers that the platform allows; record exactly what was used |
| Metric | The platform's native view field for that ad type, written down before the test (no double counting of ad-manager plus post totals) |
| Record | Date, creative ID, spend, eligible views, CPV, average watch time or completion, audience geography/demographics if available, profile visits and actions |
| Read | CPV ≤3p → the 100,000/£3,000 scenarios are plausible. 3–5p → raise the media cap or lower T. >5p → a 100,000 guarantee is not viable at this price; change T, the remedy or the price |
| Limit | One small test ≠ evidence of future CPV. Repeat on the first client's content before relying on it |

---

## Part 4. Decisions this answers

1. **Guarantee A or C?** A is simpler and stronger to sell but carries £10,000 of cash per client at risk. C keeps most of the fee on a partial miss.
2. **The target.** Is 100,000 viable once the test gives a real CPV (see Part 3, "Read")?
3. **Media cap per client.** £1,500 vs £3,000 (or another figure), which sets how much paid cover backs the promise.
4. **Refund reserve.** How much cash you can set aside before selling a guarantee, which limits how many guaranteed clients you can take on at once.
5. **Production route and price check.** Once Part 2 gives real minutes and cost, is £2,500 every four weeks enough after delivery and media?
