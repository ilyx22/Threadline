/**
 * Seeded scripts for the demo workspace.
 *
 * Written in Alex Morgan's documented voice: short declarative lines, a
 * first-person number early, no intensifiers, no exclamation marks. Each carries
 * realistic flagged claims so the fact-check gate is demonstrable on a sales call.
 */

export type SeedClaim = { text: string; note: string; status: "unverified" | "verified" };

export type SeedScript = {
  ideaTitle: string;
  title: string;
  scriptType: string;
  platform: string;
  qaState: string;
  estimatedSeconds: number;
  hook: string;
  altHooks: string[];
  body: string;
  cta: string;
  filmingNotes: string;
  claims: SeedClaim[];
  /** Earlier versions, oldest first, to populate version history. */
  history?: { hook: string; body: string; changeSummary: string; generatedBy: string }[];
};

export const SCRIPTS: SeedScript[] = [
  {
    ideaTitle: "The £480k forecast that closed at £120k",
    title: "The £480k forecast that closed at £120k",
    scriptType: "founder_pov",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 78,
    hook: "I forecast £480,000 one quarter. We closed £120,000.",
    altHooks: [
      "The worst forecast I ever produced was not optimistic. It was uninformed.",
      "I have been wrong about a quarter by £360,000. Here is what I found afterwards.",
      "Everyone assumes a bad forecast means an optimistic seller. Usually it means an absent one.",
      "I went back through ninety call recordings to work out how I had been that wrong.",
    ],
    body: `I forecast £480,000 one quarter. We closed £120,000.

I want to be precise about the failure, because most people get it wrong.

It was not optimism. I was not talking the number up for the board.

It was that I had no idea what was actually happening inside those deals.

Afterwards I went back through the call recordings. Ninety of them.

And the same thing showed up again and again.

In almost every deal we lost, there was a moment — usually in the second call — where the buyer said something that should have changed the forecast. And nobody wrote it down.

"We'd need to get finance involved at some point."
"Our current contract runs to March."
"I'd have to check whether this sits with us or with ops."

Those are not objections. They are structural facts about whether the deal can close in the quarter.

We recorded none of them. Our CRM had a field for next steps and a field for close date, and no field for the thing that actually determines whether a deal happens.

So the forecast was not a forecast. It was a list of deals we felt good about.

Here is the part that took me longer to accept.

The fix was not a better forecasting model. The fix was changing what we were required to know before a deal could enter the stage where the forecast counted it.

Three facts. Who signs. What has to be true before they sign. What is already scheduled that gets in the way.

If you cannot answer those three, the deal does not enter the forecast. It sits outside it.

The first quarter we ran it that way, the pipeline number dropped by about a third and the forecast was accurate for the first time in two years.

That is not a coincidence. That is what an accurate forecast looks like when you stop counting deals you cannot describe.`,
    cta: "Comment 'system' and I will send you the qualification framework we install.",
    filmingNotes: `Straight to camera, no intro card, no name graphic. Start on the number with no preamble.

Hold a beat after "We closed £120,000" before moving on.

Drop the energy for the three quoted buyer lines — read them flat, as if quoting notes.

The three facts section should slow down. This is the part people screenshot.

Last line delivered flat. No upward inflection, no smile at the end.`,
    claims: [
      {
        text: "I forecast £480,000 one quarter. We closed £120,000.",
        note: "Personal figure from Alex's VP Sales role. Confirm the numbers are accurate and that naming them does not identify the employer.",
        status: "verified",
      },
      {
        text: "Afterwards I went back through the call recordings. Ninety of them.",
        note: "Confirm the count is approximately right before stating a specific number.",
        status: "verified",
      },
      {
        text: "The pipeline number dropped by about a third and the forecast was accurate for the first time in two years.",
        note: "Outcome claim. Confirm the drop and the accuracy improvement are supportable from records.",
        status: "verified",
      },
    ],
    history: [
      {
        hook: "Most sales forecasts are wrong because sellers are optimistic. Mine was wrong for a different reason.",
        body: "Most sales forecasts are wrong because sellers are optimistic.\n\nMine was wrong for a different reason, and it took me a long time to see it...",
        changeSummary: "Generated from idea",
        generatedBy: "ai",
      },
      {
        hook: "I forecast £480,000 one quarter. We closed £120,000.",
        body: "I forecast £480,000 one quarter. We closed £120,000.\n\nIt was not optimism...",
        changeSummary: "More direct: opened on the number instead of the general claim",
        generatedBy: "ai_refine",
      },
    ],
  },
  {
    ideaTitle: "You do not have a lead problem",
    title: "You do not have a lead problem",
    scriptType: "objection",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 66,
    hook: "Most founders think they have a lead problem. Almost none of them do.",
    altHooks: [
      "\"We need more leads\" is the most expensive sentence in early-stage B2B.",
      "Before you spend anything on more pipeline, count how many qualified deals went dark last quarter.",
      "I have never once found a lead volume problem where a founder told me there was one.",
      "The lead problem is real about ten percent of the time. Here is how to tell.",
    ],
    body: `Most founders think they have a lead problem.

Almost none of them do.

Here is what I actually see when I go and look.

The pipeline is full enough. The deals in it are not describable. Nobody can tell me who signs, what has to be true before they sign, or what else is already scheduled that gets in the way.

So deals sit. Then they go quiet. Then, ninety days later, they are marked closed-lost with the reason "timing".

That is not a lead problem. That is a qualification problem showing up two stages downstream, wearing a pipeline costume.

There is a test you can run this week.

Take every deal that went dark in the last ninety days. Not lost — dark. The ones that stopped replying.

For each one, write down who the economic buyer was.

If you cannot do that for more than half of them, more leads will not help you. They will give you more deals that go dark, and a larger number to feel bad about.

The reason this matters commercially is that the two problems have opposite solutions.

A lead problem is solved by spending money.

A qualification problem is solved by deciding, out loud, what you will not accept into the pipeline. That costs nothing and it makes the number go down before it goes up.

Which is exactly why most people would rather it were a lead problem.`,
    cta: "If your forecast has been wrong three quarters running, the diagnostic is the place to start.",
    filmingNotes: `Flat delivery throughout. This one works because it is unimpressed, not because it is emphatic.

"wearing a pipeline costume" — say it dry, do not land on it as a joke.

The test section: slow right down and count on your fingers if it feels natural.

Final line is the whole piece. Pause before it, then deliver it and stop. Do not add anything after it.`,
    claims: [
      {
        text: "Almost none of them do.",
        note: "Strong generalisation about client base. Confirm this is supportable across engagements rather than an impression.",
        status: "verified",
      },
    ],
  },
  {
    ideaTitle: "The hidden cost of hiring an SDR too early",
    title: "The hidden cost of hiring an SDR too early",
    scriptType: "founder_pov",
    platform: "linkedin",
    qaState: "approved",
    estimatedSeconds: 72,
    hook: "Hiring an SDR before you can explain why you lose deals is the most expensive mistake in early-stage B2B.",
    altHooks: [
      "The two most expensive people I have ever seen hired were both hired to fix the wrong problem.",
      "An SDR does not fix a conversion problem. They scale it.",
      "I have watched three companies hire an SDR to solve a problem an SDR cannot touch.",
      "Before you hire an SDR, answer one question. Most founders cannot.",
    ],
    body: `Hiring an SDR before you can explain why you lose deals is the most expensive mistake I see in early-stage B2B.

Not because SDRs do not work. Because of what the hire assumes.

Hiring an SDR assumes your problem is at the top. That if more of the right people entered the pipeline, more would come out of the other end at the same rate.

That is only true if you know what your rate is and why.

Most founders at this stage do not. And that is not a criticism — nobody has had time to find out.

So here is what happens.

You hire. It takes three months to ramp. Meetings go up. Deals go up. Conversion does not move, because the thing constraining conversion was never at the top.

Now you are nine months in, roughly £45,000 down between salary and ramp, and you have a harder question than the one you started with: is it the hire, or is it the process?

You cannot answer it, because you changed two things at once.

The order that works is boring.

Find out why you lose. Fix the qualification. Then, once your conversion rate is stable enough that you would bet on it, add volume to it.

Adding volume to an unstable rate does not give you more revenue. It gives you more variance, and a person whose performance you cannot fairly evaluate.

I have made this recommendation to enough founders now that I can tell you the reaction. Nobody likes it. It sounds like being told to go slower.

It is not. It is being told to find out what you are scaling before you scale it.`,
    cta: "Comment 'system' and I will send you the qualification framework we install.",
    filmingNotes: `Open flat and unhurried. The hook is a strong claim — do not add emphasis to it, let the content carry it.

"roughly £45,000 down" — say it plainly, it is an estimate and should sound like one.

Slow down on the three-step order. This is the takeaway.

Deliver the last two lines as one thought. No pause between them.`,
    claims: [
      {
        text: "roughly £45,000 down between salary and ramp",
        note: "Illustrative cost estimate. Confirm this is a defensible UK mid-market figure, and keep the word 'roughly'.",
        status: "verified",
      },
      {
        text: "It takes three months to ramp.",
        note: "Ramp-time claim. Confirm this matches what has been observed across engagements rather than a benchmark figure.",
        status: "verified",
      },
    ],
  },
  {
    ideaTitle: "Why every closed-lost reason in your CRM is wrong",
    title: "Why your closed-lost data is useless",
    scriptType: "short_form",
    platform: "youtube_shorts",
    qaState: "needs_fact_check",
    estimatedSeconds: 52,
    hook: "Every closed-lost reason in your CRM says price or timing. Both are usually lies.",
    altHooks: [
      "Your closed-lost data is not wrong by accident. It is wrong by design.",
      "Nobody on your team is incentivised to record why you actually lost.",
      "If all your losses are price and timing, you are not collecting loss reasons. You are collecting excuses.",
    ],
    body: `Every closed-lost reason in your CRM says price or timing.

Both are usually lies. Not deliberate ones.

Think about who fills that field in. It is the person who just lost the deal, filling in a form at the end of a bad week, choosing from a dropdown someone else wrote.

"Price" is the answer that makes it nobody's fault.
"Timing" is the answer that keeps the deal theoretically alive.

Neither tells you anything you can act on.

Here is what to do instead.

Take the field away from the rep. Have someone who was not on the deal spend fifteen minutes with the recordings and answer one question: at what point did this deal stop being winnable?

Not why the buyer said no. When it became unwinnable.

You will find it is almost never at the end. It is usually in the second call, at a moment everyone remembers as going well.

That is the data you needed. And it was there the whole time.`,
    cta: "The booking link is in my profile.",
    filmingNotes: `Fast open, no preamble. This is short form — the hook has to land in under two seconds.

"Both are usually lies" then a beat, then "Not deliberate ones."

Quoted dropdown values read flat.

The final line is the payoff. Land it and cut immediately — no sign-off.`,
    claims: [
      {
        text: "It is usually in the second call, at a moment everyone remembers as going well.",
        note: "Pattern claim about where deals become unwinnable. Confirm this is supported by engagement findings before recording.",
        status: "unverified",
      },
      {
        text: "fifteen minutes with the recordings",
        note: "Time estimate for a loss review. Confirm this is realistic for the process we actually run.",
        status: "unverified",
      },
    ],
  },
  {
    ideaTitle: "Your sales stages describe your activity, not their commitment",
    title: "Your pipeline stages are named after the wrong thing",
    scriptType: "educational",
    platform: "linkedin",
    qaState: "ready_to_record",
    estimatedSeconds: 68,
    hook: "Your pipeline stages are named after things you did. That is why your forecast is wrong.",
    altHooks: [
      "Look at your pipeline stages. Every one of them describes your activity, not their commitment.",
      "\"Demo booked\" is not a stage. It is something you did.",
      "There is a one-line test for whether your pipeline stages are any good.",
    ],
    body: `Look at your pipeline stages.

Demo booked. Proposal sent. Negotiation.

Every one of those describes something you did. None of them describe anything the buyer committed to.

That is why the forecast is wrong, and it is a naming problem before it is a maths problem.

If a stage is defined by your activity, you can move a deal forward on your own. You send a proposal, the deal advances, the forecast goes up. The buyer has done nothing.

So the pipeline fills with deals that have progressed without anyone on the other side agreeing to anything.

The fix is to rename every stage after something the buyer has to do.

Not "proposal sent". "Proposal reviewed with the person who signs."

Not "negotiation". "Commercial terms agreed in principle."

Not "demo booked". "Confirmed this is a problem they intend to solve this quarter."

Two things happen when you do this, and you should expect both.

Your pipeline number drops. Sometimes by a lot. Deals that had advanced on your activity fall back to where they actually are.

And your forecast starts working, because every stage now represents evidence rather than effort.

The first version of this is uncomfortable to show anyone. Show it anyway. A smaller number you believe is worth more than a larger one you do not.`,
    cta: "Comment 'system' and I will send you the qualification framework we install.",
    filmingNotes: `Read the three original stage names quickly and dismissively.

The three renamed stages: slow, deliberate, one at a time. Consider on-screen text for these three.

"Your pipeline number drops. Sometimes by a lot." — flat, matter of fact. Do not soften it.

Final line straight to camera.`,
    claims: [],
  },
  {
    ideaTitle: "The founder should be last in the deal, not first",
    title: "The founder should be last in the deal",
    scriptType: "founder_pov",
    platform: "linkedin",
    qaState: "ai_draft",
    estimatedSeconds: 64,
    hook: "By the time I get pulled into a deal, it has usually already gone wrong.",
    altHooks: [
      "Founders are used as a rescue mechanism. That is a design choice nobody made deliberately.",
      "If the founder joining a call is good news, your process is broken.",
      "You should be the last person in the deal, not the first.",
    ],
    body: `Founders tell me they are the bottleneck. They are right, and they usually think it is a time problem.

It is a sequencing problem.

Here is the pattern. A deal starts without you. It stalls. Someone brings you in to rescue it. You close it, because you can, and everyone concludes that deals need you.

So next time they bring you in earlier. Then earlier again. Within a year you are on first calls.

Nothing about that sequence was decided. It accumulated.

The correction is to define, in advance, the point at which you enter a deal — and to make that point late.

Above a certain value. After a specific stage. Once specific facts are known.

Two things happen.

Your team has to qualify properly, because you are not there to do it for them.

And when you do arrive, you arrive as the person who closes rather than the person who rescues. Those are different conversations, and buyers can tell which one they are in.

The uncomfortable version of this is that some deals will be lost that you would have saved. That is the cost, and it is worth paying, because the alternative is a business where every deal requires the one person who cannot be replaced.`,
    cta: "If your forecast has been wrong three quarters running, the diagnostic is the place to start.",
    filmingNotes: `Conversational open — this one is closer to thinking out loud than the others.

"It accumulated." — pause before and after.

The final paragraph is the argument. Slow down and hold eye contact.`,
    claims: [
      {
        text: "Some deals will be lost that you would have saved.",
        note: "Trade-off claim. Confirm we are comfortable stating this as a certainty rather than a risk.",
        status: "unverified",
      },
    ],
  },
];
