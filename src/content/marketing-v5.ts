/**
 * Threadline public site: v5 copy (review pass, 19 September 2026). One
 * place for every sentence on the homepage. Every factual statement here is
 * governed by docs/site/CLAIMS_EVIDENCE_LEDGER.md (ids in comments). Rules,
 * unchanged: no pricing, no proof, illustrative content labelled, no platform
 * in a headline, no promised numbers, no founder-hours figure, no AI in the
 * public category.
 */

export const links = { apply: "/apply", playbook: "/playbook", how: "/how-it-works", who: "/who-its-for" } as const;

export const hero = {
  eyebrow: "For expert-led B2B firms",
  headline: "Make the expertise that wins the work visible before the sales call.", // claim:C-HERO-V4
  body: "Threadline is a managed service. We take the judgement your firm already sells, turn it into work the right buyers keep meeting, and learn from what comes back. You talk, record, approve and sell. We run everything else.",
  cta: { label: "See if Threadline fits", href: links.apply },
  secondary: { label: "See what you receive", href: "#engagement" },
} as const;

/** Scene 2: the problem and the outcome, one section. */
export const problem = {
  eyebrow: "The commercial problem",
  headline: "Strong firms know far more than the market can see.",
  body: "Inside the firm: years of judgement, hundreds of client conversations, a method that works. Outside: a website, a few posts, and a buyer who has to take your word for it.",
  inside: "Inside the firm",
  outside: "What the market sees",
  crates: ["Client calls", "Method", "Proposals", "Judgement", "Case notes", "Pricing logic", "Delivery", "Objections handled", "Board memos", "Partner opinions", "Post-mortems", "Frameworks"],
  fragments: ["A website", "Two posts", "A referral", "A deck"],
  buyer: "A buyer, deciding on a referral and a deck",
  memory: {
    eyebrow: "What good looks like",
    headline: ["We are not trying to make you famous.", "We are trying to make you familiar to the people who matter."], // claim:C-MEMORY
    body: "The goal is a small pool of the right buyers who keep meeting your clear thinking until, when their problem arrives, it is obvious who to call. Familiarity earns attention. Repeated valuable attention builds authority. Authority makes every other acquisition channel work harder.",
    labels: ["Stranger", "Recognise", "Remember", "Trust", "Conversation"],
  },
} as const;

/** Scene 3: what you receive: one illustrative root idea through one engagement. */
export const engagement = {
  eyebrow: "What you receive",
  headline: "One idea, worked into visible expertise, distributed, measured and improved.",
  body: "Here is one root idea moving through one four-week service period. The idea, the outputs, the rooms, the numbers and the decision are all invented to show the shape of the work.", // claim:C-CADENCE
  illustrative: "Illustrative engagement. Not a client, not a result.",
  cadence: "Threadline runs in four-week service periods. The first engagement is three of them, because that is how long it takes to learn a founder, a buyer and a content combination honestly.", // claim:C-CADENCE
  rows: [
    {
      key: "idea",
      week: "Week 1",
      title: "The root idea",
      text: "From two client calls and a post-mortem: “Transformation programmes fail before the technology is chosen, because the decision process was never redesigned.” Written as one argument a buyer could disagree with, checked against what buyers actually ask.", // claim:C-THESIS-ILLUSTRATIVE
    },
    {
      key: "outputs",
      week: "Weeks 2–3",
      title: "The outputs",
      text: "A written post that makes the argument easy to encounter. A short video where the founder explains the judgement behind it. A document that makes the thinking useful enough to keep. Each in the founder’s voice, each fact-checked, each approved before it goes out.",
    },
    {
      key: "rooms",
      week: "Weeks 2–3",
      title: "The rooms",
      text: "Published in the two places this buyer actually reads, at a cadence the evidence supports, with a link Threadline can measure. The platform is a component, not the strategy.",
    },
    {
      key: "signals",
      week: "Weeks 3–4",
      title: "What came back",
      text: "Illustrative: 14 profile visits from firms of the right kind, 2 replies, 1 request for the document, 1 named enquiry. Each recorded as what it was, observed, inferred or confirmed, never upgraded by arithmetic.", // claim:C-EVIDENCE-CLASSES, C-SYNTHETIC-NUMBERS
    },
    {
      key: "decision",
      week: "Week 4",
      title: "The decision",
      text: "Expected: the argument would earn replies. Actual: it earned saves, not replies. Why: the opening line lost most readers before the argument. Change: the hook is rewritten; the idea is kept. Retest: the same root idea goes out again in the next period.", // claim:C-EXPECTATION
    },
  ],
  caveat: "Not every client gets every format. The mix is prescribed after diagnosis, and a derivative is not a new idea. No leads, views or revenue are promised.", // claim:C-NO-PROMISES
} as const;

export const burden = {
  eyebrow: "Founder burden",
  headline: "The part we need from you is the part nobody else can do.",
  body: "Four things. Everything around them, research, positioning, scripting, editing, packaging, distribution, measurement, diagnosis, is Threadline’s job.",
  you: [
    { verb: "Talk", note: "Your judgement, in conversation. That is the raw material." },
    { verb: "Record", note: "When being on camera adds trust. Not otherwise." },
    { verb: "Approve", note: "High-consequence outputs only. Nothing goes out unseen." },
    { verb: "Sell", note: "The real conversations, when they come." },
  ],
  machine: ["research", "positioning", "scripting", "editing", "packaging", "distribution", "measurement", "diagnosis"],
  relief: "You talk. You record. You approve. You sell. Threadline handles the machine.", // claim:C-DIVISION
} as const;

export const workshop = {
  eyebrow: "Our curated system",
  headline: "Your expertise goes in. A visible authority system comes out.",
  body: "One root idea travels six stations. Each has one job and one person deciding. Nothing goes out unread, and nothing that comes back is wasted.",
  stations: [
    { key: "intel", title: "Listen", plain: "What your buyers are asking, objecting to and searching for, in their words.", object: "Loose fragments, sorted." },
    { key: "thesis", title: "Decide the idea", plain: "The fragments become one argument worth testing. One root idea at a time.", object: "One spool, wound tight." },
    { key: "express", title: "Make it", plain: "The idea becomes the formats it deserves, written, spoken or shown, in your voice, checked and approved.", object: "The same idea, cut three ways." },
    { key: "distribute", title: "Put it in the room", plain: "Published where your buyer actually is, with a link we can measure.", object: "Dispatched to two rooms." },
    { key: "signal", title: "Read what came back", plain: "Visits, replies, requests, named enquiries: recorded with how sure we can be.", object: "Signals, labelled." },
    { key: "learn", title: "Change one thing", plain: "Expected is read against actual. The weak part is named, replaced, and the same idea is sent again.", object: "The same spool, one part new." },
  ],
  loop: "What the last station learns feeds the first.",
  controls: { prev: "Previous station", next: "Next station", station: "Station", group: "Choose a station" },
} as const;

export const diagnosis = {
  eyebrow: "How the system learns",
  headline: "Expected. Actual. Why. Change. Retest.",
  body: "Before a piece goes out we write down what we expect. After it has travelled we read what happened against that expectation, name the most likely reason for the gap, change one thing, and run it again. This is the difference between a content calendar and a system that gets smarter.",
  illustrative: "Illustrative cases. Not client results.", // claim:C-LEARNING-ILLUSTRATIVE
  states: ["Expected", "Actual", "Why", "Change", "Retest"] as const,
  components: ["Idea", "Hook", "Distribution", "Audience", "Destination"] as const,
  cases: [
    {
      key: "hook",
      title: "Good idea, weak hook",
      failing: "Hook",
      gauges: ["Relevance", "Opening", "Signal"] as const,
      expected: [82, 74, 70],
      actual: [84, 38, 24],
      after: [84, 71, 58],
      why: { verdict: "Idea held. Hook failed.", lines: ["Buyer relevance: strong", "First line: lost most readers before the argument", "Distribution: as planned"] },
      change: { verdict: "Rewrite the hook. Keep the idea.", control: "Hook rewritten around the failure it describes", lines: ["Proof moved to the second line", "Same root idea, same audience, same route"] },
      retest: { verdict: "Opening recovers. Signal follows.", lines: ["Read again after fourteen days", "Verdict recorded against the same root idea"] },
    },
    {
      key: "audience",
      title: "High reach, wrong audience",
      failing: "Audience",
      gauges: ["Reach", "Buyer fit", "Signal"] as const,
      expected: [40, 80, 70],
      actual: [96, 28, 20],
      after: [52, 76, 61],
      why: { verdict: "Idea travelled. To the wrong room.", lines: ["The framing reached peers, not buyers", "Commercial signal: near zero", "Positioning: too general to select the room"] },
      change: { verdict: "Reframe for the buyer’s problem.", control: "Rewritten for the buyer’s decision, not the profession’s debate", lines: ["Distribution narrowed to where buyers are", "Success redefined as the right responses"] },
      retest: { verdict: "Less reach. More buyers.", lines: ["Retested for signal, not reach", "Recorded against the same root"] },
    },
    {
      key: "destination",
      title: "High saves, no destination",
      failing: "Destination",
      gauges: ["Saves", "Relevance", "Signal"] as const,
      expected: [50, 78, 66],
      actual: [88, 82, 12],
      after: [84, 82, 63],
      why: { verdict: "The piece worked. It led nowhere.", lines: ["Buyers kept it and moved on", "No proof, profile or asset to go to next", "The signal had nowhere to land"] },
      change: { verdict: "Give the reader somewhere to go.", control: "A method asset and a diagnostic added as the next step", lines: ["Profile rewritten as the buyer’s problem", "Same piece, same audience"] },
      retest: { verdict: "Same attention. Now it moves.", lines: ["Asset requests recorded with their evidence class", "Read at fourteen days"] },
    },
  ],
  note: "Inference is labelled as inference. A bad week reads as a bad week.",
  controls: { run: "Run the loop", back: "Back", next: "Next", lever: "Pull the lever to make the change" },
} as const;

export const comparison = {
  eyebrow: "Compared with the alternatives",
  headline: "You could just hire a ghostwriter.",
  body: "Each alternative does real work. The difference is what surrounds the content: distribution, commercial signal, diagnosis and learning. These are capability descriptions, stated carefully, not a measured result.", // claim:C-COMPARISON
  capabilities: ["Output", "Distribution", "Commercial signal", "Diagnosis", "Learning"],
  rows: [
    { label: "Ghostwriting", fill: [1, 0, 0, 0, 0], note: "writes the posts" },
    { label: "Content production", fill: [1, 0.5, 0, 0, 0], note: "produces, sometimes publishes" },
    { label: "Internal execution", fill: [0.5, 0.5, 0.5, 0, 0], note: "depends on who you hire and keep" },
    { label: "Personal-brand service", fill: [1, 0.5, 0, 0, 0], note: "optimises for reach" },
    { label: "Threadline", fill: [1, 1, 1, 1, 1], note: "the whole loop", own: true },
  ],
  legend: { full: "Built in", half: "Sometimes, or depends", empty: "Typically not" },
} as const;

export const fit = {
  eyebrow: "Who it is for",
  headline: "Built for a specific kind of firm.",
  body: "Threadline works where judgement is what clients buy, one conversation is worth a lot, and the firm can take on more of the right work.",
  gate: { yes: "Through the gate", no: "Turned away, kindly" },
  good: ["Expert-led, where judgement is what clients buy", "Deal value that makes one conversation matter", "Proven expertise with a real offer behind it", "A trust-heavy sale", "Capacity to take on more of the right work", "Senior people willing to talk and approve", "Wants authority, not virality"],
  bad: ["Wants guaranteed virality", "Wants fake engagement or engagement pods", "Wants spam automation", "No founder input available", "Low-value commodity offer", "Cannot service additional demand"],
  more: { label: "Read the full fit description", href: links.who },
} as const;

export const closing = {
  headline: ["Your expertise already wins the work.", "The question is whether the market sees enough of it."],
  body: "A small number of firms at a time. Applications are read by a person and answered either way, including when the answer is that we are not the right fit.", // claim:C-FOUNDING, C-REPLY-EITHER-WAY
  cta: { label: "See if Threadline fits", href: links.apply },
  secondary: { label: "Read the Playbook first", href: links.playbook },
} as const;

export const nav = {
  links: [
    { label: "How it works", href: links.how },
    { label: "Who it is for", href: links.who },
    { label: "Playbook", href: links.playbook },
  ],
  signIn: { label: "Sign in", href: "/login" },
  cta: { label: "See if Threadline fits", short: "See if it fits", href: links.apply },
} as const;
