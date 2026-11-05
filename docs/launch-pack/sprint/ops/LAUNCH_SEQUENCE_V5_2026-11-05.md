# Launch sequence V5: gated order (5 November 2026)

**Supersedes the ordering in section 2 of `THREADLINE_MASTER_TODO_2026-10-20_V4_2_INFRASTRUCTURE_STARTED.md`.** Task IDs, wording and evidence stay in the master to-do; this file only decides **order**. Owner-requested after the D01 discussion.

## What went wrong

The V4.2 order put the editing comparison (C01) first. In practice, work was picked by **"what can be done without the owner"** instead of **"what is next in the dependency chain"**. So downstream assets (sales script F01, campaign pack H04, DM sequences H07, response playbook H09, contract checks F04, landing audit G01) were drafted while the offer (D01) was undecided and the delivery system had never been tested. Those drafts now need rework, and the real critical path (proving delivery) did not move.

## Rules from now on

1. **Gate order wins.** Work only on the current gate's tasks, plus slow clocks (below). "Doesn't need the owner" is not a reason to do something now.
2. **Nothing is drafted downstream of an open decision or an unproven step.** At most a skeleton with placeholders, clearly marked "built on assumption X".
3. **Slow external clocks start early.** Anything with lead time we don't control (platform reviews, solicitor, KYC, renewals) starts as soon as its inputs exist.
4. **Each gate has a pass test with evidence**, owner-confirmed, before the next gate's work starts.
5. **Weekly check (Monday):** name the current gate, what blocks it, and confirm nothing outside it is being worked on.
6. **Existing early drafts are frozen** (F01, H04, H07, H09, G01 report, F04 check, C04). They're revised once Gate 2 passes, not before.

## Gates

### Gate 0: offer frame (provisional, passed 5 Nov)
D01/D02 provisional (`strategy/DECISION_2026-11-05_D01_D02_PROVISIONAL.md`). D04 refund parked.

### Gate 1: prove delivery (CURRENT)
The question it answers: can Threadline produce good short-form video for a B2B expert from one session, at a known time and cost, without being "just clipping"?

| Order | Task | What it settles | Owner needed |
|---|---|---|---|
| 1.1 | Delivery method evidence (competitors, directed session) | Which recording method to test | No |
| 1.2 | Delivery stack inventory (what exists, what's untested) | Which tools to test; test list | No |
| 1.3 | Ideation and scripting test: research and "top videos"/outlier tools, AI scripter SOP → a 12-angle brief for the owner's own recording | Whether we can decide *what to say* well | Review the brief |
| 1.4 | **C01 recording + editing comparison:** directed session vs pure conversation; 2–3 AI editors vs AI + owner touch-up vs manual; minutes per clip, pass/fail against the 12-point QA | Whether video-only scales; editing route | Record about 1 h; judge clips |
| 1.5 | C02 production route + C03 acceptable/premium/reject examples | The standard; first proof samples | Approve |
| 1.6 | C05/C06 time one realistic cycle; update cost and capacity | Margin and client cap | Partly |
| 1.7 | C10 accept the delivery minimum (and C11 editor backup if human editing is needed) | **Gate 1 pass** | Yes |

### Gate 2: lock the offer
D01/D02 final, D04 refund decided (uses C01 + the D05 paid-view test, spend needs owner approval), D07 proof check, D08 one internal offer spec, D09 claims register. **Pass:** one signed-off spec everything else copies from.

### Gate 3: build the selling assets from the spec
Revise the frozen drafts (F01, H04, H07, H09), contracts F04 → solicitor F05, landing copy G02–G03 → G08, VSL G04–G07 if kept, own content H02–H03 (using Gate 1 samples), F02 rehearsal.

### Gate 4: only the plumbing the first cycle needs
Lead list E05/E08/E09 (Attio by hand first), payments F07–F12 + F13, posting route E15 before the first client's first publish, B06–B08 AI/transcription as Gate 1 shows they're needed. Further automation (E10–E18) only for a link that actually breaks.

### Gate 5: go live
I01–I06 dress rehearsals, sign-off, first batch.

## Slow clocks: start now, run alongside any gate

- TikTok Content Posting API audit and Meta (Instagram) app review: long, uncontrolled lead times; start once the posting route is chosen in 1.2.
- Company legal name, address, Stripe KYC (F07).
- Book a solicitor slot (send work at Gate 3, booking can happen now).
- Mailboxes: DMARC to quarantine about 17 Nov (S5); renewals Zapmail 19–20 Nov, Smartlead 3 Dec.
- Research calls (H08/J01) with the two format/camera questions: buyer voice feeds Gate 2.
