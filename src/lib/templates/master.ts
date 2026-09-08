/**
 * The master template.
 *
 * Threadline's product thesis is that 80–90% of the system is identical between
 * clients and only configuration changes. This file is that 80–90%: the default
 * structure every new client workspace is created from.
 *
 * Changing a default here changes every future client. Existing clients are not
 * retro-fitted, because their configuration is theirs once onboarding has run.
 */

export const MASTER_TEMPLATE = {
  modules: [
    "intelligence",
    "create",
    "production",
    "distribution",
    "performance",
    "pipeline",
    "library",
    "reports",
  ],

  platforms: ["linkedin", "youtube_shorts", "instagram"],

  formats: ["short_form", "talking_head", "text_post"],

  /**
   * Default content pillars. Deliberately structural rather than topical, so
   * they hold for any founder-led business and get specialised during onboarding.
   */
  pillars: [
    "Founder POV",
    "Frameworks and mechanisms",
    "Case studies and proof",
    "Objection handling",
    "Market commentary",
    "Behind the business",
  ],

  cadencePerWeek: 3,

  /** Tasks created for a brand-new client, before onboarding has run. */
  onboardingTasks: [
    {
      title: "Complete the Threadline onboarding",
      description:
        "Fifteen short steps. This is what configures the system around your business — it takes about 25 minutes and saves as you go.",
      kind: "decide",
      audience: "client",
      priority: "high",
      estimateMin: 25,
    },
    {
      title: "Upload your three best-performing pieces of content",
      description:
        "Whatever has worked before, in any format. This calibrates the system to what your audience already responds to.",
      kind: "upload",
      audience: "client",
      priority: "medium",
      estimateMin: 10,
    },
    {
      title: "Send over any customer case studies or testimonials",
      description:
        "Real proof is the difference between content that teaches and content that converts. Anything you have cleared for public use.",
      kind: "upload",
      audience: "client",
      priority: "medium",
      estimateMin: 10,
    },
    {
      title: "Book your Brand Brain interview",
      description:
        "A 60-minute conversation where we capture your beliefs, stories and voice properly. This is the single highest-leverage hour of the installation.",
      kind: "decide",
      audience: "client",
      priority: "high",
      estimateMin: 60,
    },
    {
      title: "Configure the client workspace",
      description: "Branding, platforms, cadence, integrations and permissions.",
      kind: "ops",
      audience: "internal",
      priority: "high",
      estimateMin: 45,
    },
    {
      title: "Run the initial market research pass",
      description:
        "Competitors, customer language, recurring questions and objections. Target 25 research items before the first idea generation.",
      kind: "ops",
      audience: "internal",
      priority: "high",
      estimateMin: 180,
    },
  ],
} as const;

export type MasterTemplate = typeof MASTER_TEMPLATE;

/**
 * Internal SOP library.
 *
 * Structured, editable operating documents. These are templates: the body is a
 * real starting point an operator refines, not placeholder text.
 */
export const SOP_TEMPLATES: {
  key: string;
  title: string;
  category: string;
  summary: string;
  body: string;
}[] = [
  {
    key: "active-wedge",
    title: "Active wedge and problem hypothesis",
    category: "sales",
    summary:
      "The one market wedge and one expensive problem Threadline is currently selling against. Reviewed on evidence, not on preference.",
    body: `## Purpose
Hold Threadline to one wedge and one problem at a time.

"Expert-led B2B" is the umbrella category, not a validated niche. It is too broad to
write a first line to, and a business that tries to speak to all of it says nothing
specific to any of it. This document names the wedge currently being sold against, the
expensive problem being claimed, and how confident we are actually entitled to be.

## The sequence
1. Candidate wedges
2. Market immersion
3. Direct problem and solution validation
4. Freeze one wedge, one problem, one outcome hypothesis
5. Launch readiness
6. Funnel maths
7. Acquisition
8. Diagnosis and sales
9. Client #1
10. Measured delivery and proof
11. Improve the reusable 80%

Do not run steps 6 to 9 against an unfrozen hypothesis. Rewriting the offer mid-campaign
destroys the only signal the campaign was producing.

## Current state
- **Umbrella category:** expert-led B2B businesses
- **Active wedge:** [the specific segment: who they are, what they sell, roughly what size]
- **Expensive problem claimed:** [the problem, in their words, and what it costs them]
- **Outcome hypothesis:** [what changes for them if we are right]
- **Status:** candidate | in immersion | validating | frozen
- **Frozen on:** [date, or blank]

## Evidence
Record every validation conversation: who, when, what they said the problem was in their
own words, and whether they raised it or we did.

| Date | Who | Problem in their words | Volunteered? |
|---|---|---|---|
|  |  |  |  |

## How to read the evidence
Two thresholds, doing two different jobs.

**Five conversations is an interim checkpoint.** It is enough to notice whether a hypothesis
is going anywhere and to decide whether to keep booking. It is not enough to decide anything
about a market. A business that freezes a wedge on five conversations has mostly measured its
own ability to find five agreeable people.

**Ten makes the wedge eligible for a validation decision** — eligible, not validated.
Eligibility is about sample size; validation is about what the sample says.

**Validation needs more than five of them converging on the same expensive recurring
problem.** Note this is a count, not a proportion: six of ten converging is a signal, and six
of forty is evidence the hypothesis is wrong. Always report the sample size beside it.

Specifically:
- No percentage, ever. At these sample sizes a rate is false precision that somebody will
  eventually quote in a sales call.
- Convergence is a judgement about whether two people described the same expensive problem in
  different words. A person makes that judgement and assigns the theme; the system counts what
  is assigned and ignores what is left blank.
- A problem we named first and they agreed with is much weaker evidence than one they raised
  themselves. Record which it was, and treat a sample where we named everything as no evidence
  at all regardless of its size.
- Disconfirming conversations are the valuable ones. Write those down in full.

## Review
Revisit when acquisition data contradicts the hypothesis, when five more conversations
have happened, or monthly, whichever comes first. Change the wedge deliberately, on
evidence, and record why. Drifting between wedges without recording the change is how a
business ends up unable to say what worked.`,
  },
  {
    key: "lead-qualification",
    title: "Lead qualification",
    category: "sales",
    summary: "Decide within ten minutes whether an applicant is a Threadline client.",
    body: `## Purpose
Protect delivery capacity by only advancing applicants we can genuinely install a system for.

## Qualify in
- Founder-led business where the founder's face, opinion or credibility affects acquisition
- Monetised: existing revenue, existing offer, existing customers
- Content already contributes to pipeline, or the founder is committed to making it
- The founder personally will record and approve — not a delegate
- Budget is consistent with a high-ticket installation

## Qualify out
- Wants views rather than customers
- Expects guaranteed virality or guaranteed lead volume
- Will not appear on camera
- No offer, or an offer that changes monthly
- Wants a freelancer to execute someone else's plan

## Process
1. Read the application within one working day.
2. Score against qualify-in criteria. Three or more, advance.
3. Advance: move to "Call booked" and send the booking link.
4. Decline: reply personally within 48 hours. Say why. Suggest where they should go instead.

## Output
Application status updated in the admin portal, with review notes explaining the decision.`,
  },
  {
    key: "discovery-call",
    title: "Discovery call",
    category: "sales",
    summary: "Diagnose the operation before proposing anything.",
    body: `## Purpose
Understand the current content operation well enough to say honestly whether Threadline helps.

## Structure (45 minutes)
1. **Current state (12 min)** — Who does what today? Walk me through the last piece you published, start to finish.
2. **Cost (8 min)** — Founder hours per week. Contractor spend. What breaks when you are busy.
3. **Commercial link (8 min)** — How does attention become a conversation today? What happened the last time content produced a customer?
4. **Constraint (7 min)** — What is the actual bottleneck: ideas, recording, editing, approval or distribution?
5. **Fit and next step (10 min)** — Say plainly whether this is a fit. If it is, describe the installation.

## Rules
- Do not present slides.
- Do not quote a price before the constraint is identified.
- If they are not a fit, say so on the call.
- Never promise reach, views or lead volume.

## Output
Notes captured against the application. Decision recorded: proposal, nurture or decline.`,
  },
  {
    key: "proposal",
    title: "Proposal and close",
    category: "sales",
    summary: "One page. The diagnosis, the installation, the cost, the terms.",
    body: `## Contents
1. **What we found** — the constraint, stated in their words.
2. **What we install** — the specific modules and workflow for their operation.
3. **What they keep doing** — expertise, judgment, face, voice, recording, approval, sales.
4. **What we take over** — research, planning, scripting, coordination, packaging, measurement.
5. **Timeline** — installation weeks, then operating cadence.
6. **Investment** — setup fee and the fee for each four-week service period.
7. **What this is not** — no guaranteed reach, no guaranteed leads, no posting on their behalf without approval.

## Rules
- Never include a projected view count, lead count or revenue figure.
- Time-released estimates are framed as scenarios based on their own numbers.
- Send within 24 hours of the call.

## Output
Proposal sent, follow-up scheduled for three working days.`,
  },
  {
    key: "onboarding",
    title: "Client onboarding",
    category: "delivery",
    summary: "From signed to a populated command centre in ten working days.",
    body: `## Day 0 — Workspace
- Create the client from the master template in the admin portal.
- Set package, fees, currency, cadence and platforms.
- Create the founder account and share credentials securely.

## Days 1–3 — Context
- Founder completes the 15-step onboarding.
- Run the Brand Brain interview (see the Brand Brain interview SOP).
- Load transcripts, best-performing content and proof into the Library.

## Days 3–6 — Research
- Complete the initial market research pass (see the research SOP).
- Target 25+ research items, 5+ competitors, tagged.
- Create the first three signals.

## Days 6–8 — First cycle
- Generate and triage 30 ideas. Approve 8.
- Script the top 5. Fact-check every flagged claim.
- Build the first recording queue.

## Days 8–10 — Handover
- Walk the founder through Home, Recording Room and the approval flow.
- Confirm the weekly cadence and the reporting day.
- Move the workspace status from onboarding to active.

## Output
Populated workspace, a recording queue waiting, and a founder who knows the three screens they use.`,
  },
  {
    key: "brand-brain-interview",
    title: "Brand Brain interview",
    category: "delivery",
    summary: "The 60 minutes that determine whether output sounds like the founder.",
    body: `## Purpose
Capture beliefs, stories, opinions and voice in enough depth that generated drafts start close.

## Preparation
- Read their last twenty pieces of content.
- Note phrases they repeat and structures they favour.
- Record the call with consent.

## Questions
**Beliefs**
- What does nearly everyone in your market believe that you think is wrong?
- What do you refuse to do that others do?

**Stories**
- What is the most expensive mistake you have made in this business?
- Tell me about a customer whose situation you understood immediately.

**Mechanism**
- If someone hired you tomorrow, what happens in the first two weeks?
- What is the part clients always underestimate?

**Objections**
- What is the last objection you heard, in their words?
- What is the objection you think is actually fair?

**Voice**
- Read me the last thing you wrote that sounded exactly like you.
- What phrasing makes you cringe?

## After
- Transcribe and store in the Library.
- Populate Founder and Voice in the Brand Brain, using their words verbatim where possible.
- Fill "Sounds like me" and "Does NOT sound like me" with real examples, not descriptions.

## Output
Brand Brain completeness above 80%, with voice examples quoted directly.`,
  },
  {
    key: "research",
    title: "Market research pass",
    category: "research",
    summary: "Turn a market into tagged, searchable evidence.",
    body: `## Cadence
Initial pass during onboarding, then a two-hour refresh every fortnight.

## Sources
- Competitor content, prioritising their outliers rather than their average
- Customer questions from the client's own inbox, calls and comments
- Objections recorded on sales calls
- Community and forum discussion in the client's category
- Adjacent creators the ICP already follows

## Rules
- Capture customer language verbatim. Do not paraphrase into marketing copy.
- Record the source and the date for every item.
- Tag every item. An untagged item is invisible to the system.
- Prefer twenty specific items to one hundred generic ones.

## Targets per pass
- 25+ research items
- 5+ competitors profiled
- 10+ verbatim customer language items
- 5+ objections

## Output
Research items tagged in Market Radar, then a signal detection pass to surface patterns.`,
  },
  {
    key: "script-qa",
    title: "Script QA rubric",
    category: "production",
    summary: "What has to be true before a script reaches the founder.",
    body: `## Gate 1 — Factual integrity
- Every flagged claim is verified or removed. **The system enforces this.**
- No statistic without a source the client can point to.
- No client name or result used without written permission.

## Gate 2 — Voice
- Would the founder say this sentence out loud?
- No phrase from the "does NOT sound like me" list.
- Uses at least one documented phrase or structure of theirs.

## Gate 3 — Substance
- Contains one specific mechanism, example or number — not general advice.
- The hook works with the sound off and no context.
- The argument would survive a knowledgeable reader disagreeing with it.

## Gate 4 — Commercial
- The CTA matches the piece's objective.
- High-intent pieces reference the mechanism behind the offer.
- Nothing overclaims what the offer delivers.

## Fail conditions
Any unverified claim. Any invented proof. Any hype intensifier. Any generic advice with no specific.

## Output
Script moved to "Ready to record" and, once the founder signs off, "Approved".`,
  },
  {
    key: "production-qa",
    title: "Production QA",
    category: "production",
    summary: "What an edit must satisfy before it reaches the founder for approval.",
    body: `## Technical
- Audio levelled, no clipping, no room hum
- Colour consistent across cuts
- Captions accurate, correctly timed, correctly spelled
- Correct aspect ratio and safe margins for the destination platform

## Editorial
- Hook lands within the first two seconds
- No dead air longer than half a second
- Text overlays match the script's overlay notes
- The CTA is legible and on screen long enough to read

## Compliance
- Nothing on screen contradicts the client's compliance notes
- No customer identifiable without permission
- Music licensed

## Process
- Editor self-checks against this list before moving to "In review"
- A revision request must name the timecode and the change required
- Three revisions on one piece triggers a conversation, not a fourth revision

## Output
Piece moved to "In review" with a note confirming this checklist passed.`,
  },
  {
    key: "weekly-cadence",
    title: "Weekly client cadence",
    category: "account",
    summary: "The rhythm that keeps the operation moving without meetings.",
    body: `## Monday
- Operator clears the cross-client queue: overdue approvals, blocked production, missing recordings.
- Founder opens Home. Records what is queued. Approves what is waiting.

## Tuesday–Wednesday
- Editors work the board.
- Operator runs research capture and idea triage.

## Thursday
- Scripts for next cycle written and fact-checked.
- Packaging generated for approved pieces.

## Friday
- Performance data entered for everything published this week.
- Weekly report generated and sent.
- Next week's recording queue built.

## Rules
- No standing meeting. The report is the meeting.
- Anything needing a decision goes into Tasks, not into a message thread.
- If the founder has not recorded by Wednesday, the operator calls them.

## Output
Weekly report delivered, recording queue ready for Monday.`,
  },
  {
    key: "monthly-review",
    title: "Monthly strategy review",
    category: "account",
    summary: "Sixty minutes on what the data changed our mind about.",
    body: `## Preparation
- Four weekly reports to hand
- Signal engine reviewed: which hypotheses resolved, which are still open
- Pipeline reviewed: which content produced qualified conversations

## Agenda
1. **Output** — shipped vs target, and why the gap exists if there is one.
2. **What worked** — the two strongest pieces and the structural reason they worked.
3. **What did not** — the two weakest, and whether the cause was concept, hook or distribution.
4. **Commercial** — inquiries and calls attributed to content.
5. **Constraint** — where the operation is slowest, and what we are changing.
6. **Next month** — pillar weighting, formats, tests.

## Rules
- Lead with the commercial read, not the reach numbers.
- Every recommendation cites a signal or a metric.
- Leave with three decisions, not a list of ideas.

## Output
Decisions recorded as signals and tasks. Content rules updated if pillar weighting changed.`,
  },
  {
    key: "support-escalation",
    title: "Support and bug escalation",
    category: "support",
    summary: "How issues get triaged, owned and turned into product fixes.",
    body: `## Severity
- **Critical** — a client cannot record, approve or publish. Respond within 1 hour.
- **High** — a workflow is broken but has a workaround. Respond same day.
- **Medium** — degraded experience. Respond within two working days.
- **Low** — cosmetic or a request. Next scheduled cycle.

## Process
1. Log the issue in the admin portal with severity, client and owner.
2. Reproduce before diagnosing. Record the exact steps.
3. Communicate to the client: what happened, what the workaround is, when it will be fixed.
4. On resolution, record what fixed it.
5. Decide: does this become an SOP change, a product fix, or both? Tick the flags.

## The rule that matters
Every issue resolved twice becomes a product fix or an SOP. Solving the same problem three times manually is a failure of this process.

## Output
Issue resolved, with the SOP or product-fix flag set and the follow-up created.`,
  },
  {
    key: "scope-changes",
    title: "Scope changes",
    category: "account",
    summary: "Protect the system from becoming bespoke.",
    body: `## Principle
The product stays 80–90% identical between clients. Configuration changes; the system does not fork.

## When a client asks for something new
1. Can it be achieved with existing configuration? Configure it.
2. Would every client benefit? Add it to the product backlog.
3. Is it genuinely specific to them? Price it separately as a service, delivered outside the platform.
4. Would it require a client-specific code path? Decline. Explain why.

## Never
- Fork the codebase per client
- Add a feature flag that only one client uses
- Promise a delivery date for product work on a client call

## Output
Decision recorded and communicated in writing, with the reasoning.`,
  },
  {
    key: "renewal",
    title: "Renewal",
    category: "account",
    summary: "Renewal is decided by the previous ninety days, not the conversation.",
    body: `## Sixty days out
- Review output vs target across the engagement.
- Review commercial signal: inquiries and calls attributed to content.
- Review founder time: hours in vs hours released.
- Identify the strongest single piece of evidence the system is working.

## Thirty days out
- Present the ninety-day review, using only stored data.
- State plainly whether the engagement is working.
- If it is not, diagnose the cause before proposing continuation.

## Renewal conversation
- Lead with what the data shows.
- Propose the next ninety days as a specific plan, not a continuation.
- If the client should not renew, say so.

## Output
Decision recorded. If renewing, the next quarter's plan is in the workspace before the current term ends.`,
  },
  {
    key: "offboarding",
    title: "Offboarding",
    category: "account",
    summary: "Leave the client with everything they paid for.",
    body: `## Principle
The client owns their content, their context and their data. Offboarding is a handover, not a lockout.

## Process
1. Confirm the end date and the final delivery in writing.
2. Export the Brand Brain, all scripts, all research and all reports.
3. Transfer media files, or confirm they already hold the originals.
4. Deliver a written handover: what the operating rhythm was, what worked, what to keep doing.
5. Complete any in-flight production. Do not abandon half-edited work.
6. Set the workspace to churned. Retain data for the contractual period, then delete.
7. Ask for a candid exit conversation. Record what we would do differently.

## Never
- Withhold work as leverage
- Delete anything before the contractual retention period ends
- Skip the exit conversation because it was a difficult engagement

## Output
Handover pack delivered, workspace archived, exit notes recorded against the client.`,
  },
];
