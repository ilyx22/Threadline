import type { SeedScript } from "./scripts";

/**
 * Approved scripts with no content item yet — these are the Recording Room queue.
 *
 * Kept deliberately out of the content plan in seed.ts so the demo opens with
 * real work waiting for the founder, which is the first thing a prospect should
 * see on the command centre.
 */
export const RECORDING_QUEUE_SCRIPTS: SeedScript[] = [
  {
    ideaTitle: "The two SDRs I told a client to let go",
    title: "The two SDRs I told a client to let go",
    scriptType: "case_study",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 74,
    hook: "I once told a client to let go of two people they had just hired.",
    altHooks: [
      "The best recommendation I have made was to remove headcount, not add process.",
      "They had hired two SDRs to fix a problem an SDR cannot touch.",
      "Sometimes the honest answer is that you hired the wrong solution.",
      "Three weeks in their closed-lost data before I said anything.",
    ],
    body: `I once told a client to let go of two people they had just hired.

Two SDRs. Both six weeks in. Both doing exactly what they had been asked to do.

The company was around £900,000 in annual revenue with two account executives. They had convinced themselves the constraint was at the top of the funnel, so they hired for the top of the funnel.

I spent three weeks in their closed-lost data before I said anything.

Here is what it showed.

Of the deals that reached a second call, fewer than one in five reached a third. Not lost. Stalled. The buyer stopped replying and the deal quietly aged out.

That is not a volume problem.

Adding more first calls to that funnel does not produce more customers. It produces more stalled deals, and two people whose performance you cannot fairly assess, because the thing constraining conversion sits downstream of everything they do.

So the recommendation was uncomfortable, and it was also obvious once you had seen the data.

Stop adding volume. Fix the point where deals stall. Then decide whether you need more volume at all.

They let both people go. It was handled properly, with notice and references.

The following year, the same two account executives grew the number. No SDR layer.

I am not telling you to let anyone go. I am telling you that a hire is a bet on a diagnosis, and most people place the bet before they have made the diagnosis.`,
    cta: "Comment 'system' and I will send you the qualification framework we install.",
    filmingNotes: `This is the most serious piece in the queue. Deliver it accordingly — no dryness, no undercutting.

"Both doing exactly what they had been asked to do" — this line protects the two people. Do not rush it.

The data section: slow, precise, no emphasis.

"It was handled properly" — say it plainly and move on. It matters that it is there.

Final paragraph straight to camera, no smile at the end.`,
    claims: [
      {
        text: "Of the deals that reached a second call, fewer than one in five reached a third.",
        note: "Client engagement figure. Confirm the ratio is accurate and the description stays anonymous.",
        status: "verified",
      },
      {
        text: "The following year, the same two account executives grew the number.",
        note: "Outcome claim. Confirm against the engagement record and that the client accepts an anonymous description.",
        status: "verified",
      },
      {
        text: "around £900,000 in annual revenue",
        note: "Client size. Confirm this is vague enough to preserve anonymity.",
        status: "verified",
      },
    ],
  },
  {
    ideaTitle: `"We tried a consultant and got a slide deck"`,
    title: `"We tried a consultant and got a slide deck"`,
    scriptType: "objection",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 68,
    hook: "Someone told me last month they had hired a sales consultant and got a slide deck. They were right to be annoyed.",
    altHooks: [
      "The most common objection I hear is not about price. It is about the last person they hired.",
      "If your last consultant left you with a framework and no change, that was a real failure.",
      "I agree with the people who say most of this work does not produce anything.",
    ],
    body: `Someone told me last month that they had hired a sales consultant and got a slide deck.

They were right to be annoyed.

I am not going to defend the profession here. A lot of this work is analysis delivered as a document, and a document does not change what happens on a call next Tuesday.

So let me be specific about what is different, because "we actually implement" is what everybody says.

Weeks one to three, we build nothing. We are in your call recordings and your closed-lost data, working out where deals actually stop being winnable. You get a written finding at the end of week three. If we have not found a structural cause by week six, we stop and refund the balance.

Weeks four to eight is the part that is different. We are in your live deals. Not a workshop about hypothetical deals — the actual pipeline, with your actual team, applying new qualification criteria to opportunities that are open right now.

Some of those deals will get disqualified. That is the point.

Weeks nine to twelve, we step back and your team runs it while we watch. If it only works while we are in the room, it has not worked.

Then we leave.

That last part is what makes this different from most of what you have been sold. There is an end date. We are not trying to become a permanent line in your budget.

If the previous experience put you off, I understand it. I would ask a lot of questions before spending money on this category again too.`,
    cta: "The booking link is in my profile.",
    filmingNotes: `Open sympathetic, not defensive. The first thirty seconds are about agreeing with them.

"I am not going to defend the profession here" — dry, slightly resigned.

The week-by-week section is the substance. Steady pace, no selling tone.

"Then we leave." — full stop, pause, then continue.

Final line warm. This is the one piece in the queue where warmth is right.`,
    claims: [
      {
        text: "If we have not found a structural cause by week six, we stop and refund the balance.",
        note: "Guarantee claim. Must match the current engagement terms exactly.",
        status: "verified",
      },
    ],
  },
  {
    ideaTitle: "The deal I lost at 90%",
    title: "The deal I lost at 90%",
    scriptType: "story",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 62,
    hook: "I lost a deal I had forecast at 90%. I had never spoken to the person who signs.",
    altHooks: [
      "The most confident I have ever been about a deal was three weeks before it died.",
      "A champion is not a relationship. It is a single point of failure.",
      "Six months of momentum, and one conversation I never had.",
    ],
    body: `I lost a deal I had forecast at 90%.

Six months of work. Weekly calls. A champion who was genuinely enthusiastic and genuinely wanted it.

I had never spoken to the person who signs.

Not once. I knew their name. I knew their title. I had a champion who assured me it was handled.

Three weeks before close, that person asked one question in a meeting I was not in, and the deal was gone.

The question was reasonable. It was about how this fitted with something else they had already committed to that year.

My champion did not know the answer. I would have known the answer. I was not there.

Here is the part I want to be honest about.

I knew I was single-threaded. I had known for months. I did not push for the introduction, because things were going well and asking felt like it might disturb something.

That is the actual failure. Not a process gap. A choice I made repeatedly, for six months, because the deal felt good.

The rule I use now is boring and it works. Above a certain deal size, a deal does not pass a certain stage until someone on our side has had a direct conversation with the person who signs. Not an email. A conversation.

It has cost me momentum a few times. It has not cost me a six-month deal since.`,
    cta: "If your forecast has been wrong three quarters running, the diagnostic is the place to start.",
    filmingNotes: `Quieter than the others. This one is a confession and should sound like one.

"Not once." — beat before and after.

"That is the actual failure" — this is the pivot. Slow down here.

Last line flat, almost thrown away. Do not land it hard.`,
    claims: [
      {
        text: "It has not cost me a six-month deal since.",
        note: "Personal outcome claim. Confirm this is still accurate before recording.",
        status: "verified",
      },
    ],
  },
  {
    ideaTitle: "When should you actually hire your first AE?",
    title: "When should you actually hire your first AE?",
    scriptType: "educational",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 70,
    hook: "Everyone asks when to hire their first account executive. It is the wrong question.",
    altHooks: [
      "There is no revenue number at which hiring a salesperson becomes safe.",
      "The question is not when to hire. It is whether you can describe what they would be doing.",
      "I get asked this every week. The honest answer takes about five minutes to check.",
    ],
    body: `Everyone asks when to hire their first account executive.

It is the wrong question, and the right one takes about five minutes to answer.

The wrong question is about timing. At what revenue. After how many customers. Once the round closes.

None of those tell you whether the hire will work, because none of them are about whether the job is definable yet.

Here is the test.

Write down, on one page, what happens between a first conversation and a signature. Every stage. What has to be true to move between them. Who is involved at each point.

If you can write that page, you can hire. The person you hire has a job with a shape, and you can tell within eight weeks whether they are doing it.

If you cannot write that page, the job you are hiring for is "be me, but without eleven years of context".

Nobody can do that job. They will fail, you will not know whether it was them or the role, and you will have spent somewhere between forty and seventy thousand pounds finding out.

The uncomfortable version is this. If you cannot write the page, that is not a reason to delay the hire. It is the work. Write the page first. It takes a fortnight, not a quarter.

Most founders I meet could write eighty percent of it today, and have never sat down to do it, because it is not urgent and it is not fun and there is always a deal to save instead.`,
    cta: "Comment 'system' and I will send you the qualification framework we install.",
    filmingNotes: `Straight instructional delivery. This one is useful rather than provocative, and should sound useful.

The test section: consider on-screen text for the three things to write down.

"be me, but without eleven years of context" — the closest thing to a joke in the queue. Dry.

Last paragraph slows and softens slightly. It is meant to be recognised, not accused.`,
    claims: [
      {
        text: "somewhere between forty and seventy thousand pounds",
        note: "Cost-of-failed-hire range. Confirm this is defensible for a UK mid-market AE including salary, ramp and opportunity cost.",
        status: "verified",
      },
      {
        text: "you can tell within eight weeks whether they are doing it",
        note: "Assessment window claim. Confirm this matches what we advise in engagements.",
        status: "verified",
      },
    ],
  },
];
