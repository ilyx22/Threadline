/**
 * Threadline public site — v5 copy. One place for every sentence on the
 * homepage. Every factual statement here is governed by
 * docs/site/CLAIMS_EVIDENCE_LEDGER.md (ids in comments). Rules, unchanged:
 * no pricing, no proof, illustrative content labelled, no platform in a
 * headline, no promised numbers, no founder-hours figure.
 */

export const links = { apply: "/apply", playbook: "/playbook", how: "/how-it-works", who: "/who-its-for" } as const;

export const hero = {
  eyebrow: "For expert-led B2B firms",
  headline: "Make the expertise that wins the work visible before the sales call.", // claim:C-HERO-V4
  body: "Threadline turns the expertise inside high-value B2B firms into authority, qualified demand and a system that learns what actually moves buyers.",
  cta: { label: "See if Threadline fits", href: links.apply },
  secondary: { label: "How it works", href: "#workshop" },
} as const;

/** The six ideas, hung on the line under the hero. Value statements, not measurements (C-GRID). */
export const strip = {
  label: "What you are looking at",
  tags: [
    { figure: "4", line: "founder touchpoints. Talk, record, approve, sell." },
    { figure: "1", line: "managed loop from expertise to authority to learning." },
    { figure: "Idea first", line: "The idea determines the expression, not a platform quota." },
    { figure: "Buyer first", line: "Commercially valuable attention over empty reach." },
    { figure: "Expected → actual", line: "Diagnosis is built into every cycle." },
    { figure: "Low burden", line: "Threadline runs the machine. You keep the judgement." },
  ],
} as const;

export const problem = {
  eyebrow: "The commercial problem",
  headline: "Strong firms know far more than the market can see.",
  body: "Inside the firm: years of judgement, hundreds of client conversations, a method that works. Outside: a website, a few posts, and a buyer who has to take your word for it.",
  inside: "Inside the firm",
  outside: "What the market sees",
  crates: ["Client calls", "Method", "Proposals", "Judgement", "Case notes", "Pricing logic", "Delivery", "Objections handled", "Board memos", "Partner opinions", "Post-mortems", "Frameworks"],
  fragments: ["A website", "Two posts", "A referral", "A deck"],
  buyer: "A buyer, deciding on a referral and a deck",
} as const;

export const memory = {
  eyebrow: "Market memory",
  headline: ["We are not trying to make you famous.", "We are trying to make you familiar to the people who matter."], // claim:C-MEMORY
  body: "Familiarity earns attention. Repeated valuable attention builds authority. Authority makes every other acquisition channel work harder.",
  encounters: [
    { label: "Stranger", note: "A company update passes by. Nothing happens." },
    { label: "Recognise", note: "A useful idea lands. The name registers." },
    { label: "Remember", note: "The judgement behind it is quoted to a colleague." },
    { label: "Trust", note: "A proof asset answers the question they were about to ask." },
    { label: "Conversation", note: "When the problem arrives, it is obvious who to call." },
  ],
  note: "There is no magic number of exposures. There is a buyer who keeps meeting the same clear thinking until it is obvious who to call.",
} as const;

export const burden = {
  eyebrow: "Founder burden",
  headline: "The part we need from you is the part nobody else can do.",
  you: [
    { verb: "Talk", note: "Your judgement, in conversation." },
    { verb: "Record", note: "When being on camera adds trust. Not otherwise." },
    { verb: "Approve", note: "High-consequence outputs only." },
    { verb: "Sell", note: "The real conversations." },
  ],
  machine: ["research", "positioning", "scripting", "editing", "packaging", "distribution", "measurement", "diagnosis"],
  relief: "You talk. You record. You approve. You sell. Threadline handles the machine.", // claim:C-DIVISION
} as const;

export const workshop = {
  eyebrow: "The Authority Workshop",
  headline: "Your expertise goes in. A visible authority system comes out.",
  body: "One root idea travels the whole workshop. Each station changes it. Nothing is duplicated; everything is decided.",
  stations: [
    { key: "intel", title: "Market intelligence", plain: "What your buyers are asking, objecting to and searching for, in their words, with provenance.", object: "Loose fragments, sorted by what buyers actually ask." },
    { key: "thesis", title: "Positioning and the root thesis", plain: "Fragments of expertise are bound into one argument worth testing. One root idea at a time.", object: "One spool: the argument, wound tight." },
    { key: "express", title: "Native expression", plain: "The thesis becomes the formats it deserves, written, spoken or shown, each in your voice, each checked.", object: "The same idea, cut three ways." },
    { key: "distribute", title: "Production and distribution", plain: "Published where your buyer actually is, at a cadence the evidence supports. The platform is a component.", object: "Dispatched to the two rooms your buyer is in." },
    { key: "signal", title: "Commercial signal", plain: "Profile visits, replies, asset requests, named enquiries, recorded with their evidence class, never inflated.", object: "What came back, labelled by how sure we can be." },
    { key: "learn", title: "Diagnosis, correction, learning", plain: "Expected is read against actual. The weak part is named. One change goes back in and is retested.", object: "The same spool, one part replaced, sent again." },
  ],
  loop: "Learning feeds the next round of intelligence and ideas.",
  controls: { prev: "Previous station", next: "Next station", station: "Station" },
} as const;

export const expressions = {
  eyebrow: "One idea. The right expressions.",
  headline: "Idea first. Expression second.",
  body: "A single argument can become a written post, a short video, a document, a proof asset, a deeper piece, a diagnostic that captures demand, or something that nurtures the buyer who is not ready yet. Each measured on its own; all read together as one idea being tested.",
  thesis: { label: "Root thesis · illustrative", text: "Transformation programmes fail before the technology is chosen: the decision process was never redesigned." }, // claim:C-THESIS-ILLUSTRATIVE
  frames: [
    { kind: "post", label: "Written post", why: "Make the argument easy to encounter." },
    { kind: "video", label: "Short video", why: "Let buyers hear the judgement behind it." },
    { kind: "doc", label: "Document", why: "Make the thinking useful enough to keep." },
    { kind: "proof", label: "Proof asset", why: "Make the claim easier to believe." },
    { kind: "deep", label: "Deep piece", why: "Give the serious buyer the whole thing." },
    { kind: "diagnostic", label: "Diagnostic", why: "Give the ready buyer something useful to ask for." },
    { kind: "nurture", label: "Nurture asset", why: "Stay familiar until the timing is right." },
  ],
  caveat: "Not every client gets every format. The mix is prescribed after diagnosis, and a derivative is not a new idea.",
  hint: "Hover or tap an expression to see why it exists.",
} as const;

export const movement = {
  eyebrow: "Attention to commercial movement",
  headline: "Reach is not the result.",
  body: "Threadline optimises for commercially valuable attention, not just reach. A piece that travels to the wrong room is a targeting result, however good the numbers look.",
  steps: [
    { label: "Right-buyer attention", note: "The people who could buy notice.", evidence: "observed" },
    { label: "Proof, profile, destination", note: "They inspect what you have shown.", evidence: "observed" },
    { label: "Response or permission", note: "A reply, a request, a follow.", evidence: "observed" },
    { label: "Human conversation", note: "A person talks to a person.", evidence: "confirmed" },
    { label: "Commercial event", note: "Recorded with its evidence class.", evidence: "confirmed" },
  ],
  honesty: "Not every impression becomes revenue, and we do not pretend otherwise. Each step is recorded as what it was, observed, inferred or confirmed, never upgraded by arithmetic.", // claim:C-EVIDENCE-CLASSES
} as const;

export const diagnosis = {
  eyebrow: "How the system learns",
  headline: "Expected. Actual. Why. Change. Retest.",
  body: "Before a piece goes out we write down what we expect. After it has travelled we read what happened against that expectation, name the most likely reason for the gap, change one thing, and run it again.",
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
      change: { verdict: "Rewrite the hook. Keep the thesis.", control: "Hook rewritten around the failure it describes", lines: ["Proof moved to the second line", "Same root idea, same audience, same route"] },
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

export const cycle = {
  eyebrow: "The twelve-week learning cycle",
  headline: "Real market evidence, not a promise about algorithms.",
  body: "Threadline runs in four-week service periods. The first engagement is three of them, because that is how long it takes to learn a founder, a buyer and a content combination honestly.", // claim:C-CADENCE
  phases: [
    { label: "Establish and calibrate", note: "Many loose threads: the first theses, the first signals, expectations written before anything ships." },
    { label: "Refine and correct", note: "Diagnoses become corrections. The weak threads are cut; the ones that earned attention are doubled." },
    { label: "Concentrate and compound", note: "A few strong strands, woven. The system knows things about your market nobody else has written down." },
  ],
  note: "We do not say the algorithm needs ninety days. We say the learning does. No revenue is promised.", // claim:C-NO-PROMISES
} as const;

export const comparison = {
  eyebrow: "The honest comparison",
  headline: "You could just hire a ghostwriter.",
  body: "Each alternative does real work. The difference is what surrounds the content: distribution, commercial learning and diagnosis. These are capability descriptions, stated carefully, not a measured result.", // claim:C-COMPARISON
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
  gate: { yes: "Through the gate", no: "Turned away, kindly" },
  good: [
    "Expert-led, where judgement is what clients buy",
    "Deal value that makes one conversation matter",
    "Proven expertise with a real offer behind it",
    "A trust-heavy sale",
    "Capacity to take on more of the right work",
    "Senior people willing to talk and approve",
    "Wants authority, not virality",
  ],
  bad: ["Wants guaranteed virality", "Wants fake engagement or engagement pods", "Wants spam automation", "No founder input available", "Low-value commodity offer", "Cannot service additional demand"],
  more: { label: "Read the full fit description", href: links.who },
} as const;

export const closing = {
  headline: ["Your expertise already wins the work.", "The question is whether the market sees enough of it."],
  body: "A small number of firms at a time. Applications are read by a person and answered either way.", // claim:C-FOUNDING, C-REPLY-EITHER-WAY
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
