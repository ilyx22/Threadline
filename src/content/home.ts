/**
 * Threadline homepage copy — the 24 September 2026 rebuild. One place for
 * every sentence on the front page. Governed by docs/site/CLAIMS_EVIDENCE_LEDGER.md
 * (ids in comments) and docs/site/FOUNDER_FEEDBACK_DESIGN_BRIEF.md. Rules:
 * no pricing, no proof that does not exist, illustrative material labelled,
 * no platform in a headline, no promised numbers, no founder-hours figure,
 * no AI in the public category. Deeper detail lives on /how-it-works,
 * /who-its-for and /playbook.
 */

export const links = { apply: "/apply", playbook: "/playbook", how: "/how-it-works", who: "/who-its-for" } as const;

export const hero = {
  eyebrow: "A managed authority system for expert-led B2B firms",
  headline: "Make the expertise that wins the work visible before the sales call.", // claim:C-HERO-V4
  lead: "Threadline takes the judgement your firm already sells, turns it into work the right buyers keep meeting, and learns from what comes back. You talk, record when useful, approve and sell. Threadline runs the system around you.",
  cta: { label: "See if Threadline fits", href: links.apply },
  secondary: { label: "How it works", href: links.how },
  fit: "Built for firms where judgement is what clients buy and one conversation is worth a lot.",
  /** The object beside the headline: what one buyer has met before the first call. Every line invented and labelled. */
  desk: {
    label: "What one buyer has met before the first call",
    sheets: [
      { kind: "Point of view", title: "Transformation programmes fail before the technology is chosen.", meta: "Written · 640 words · approved by the founder" }, // claim:C-THESIS-ILLUSTRATIVE
      { kind: "Short video", title: "The decision that gets skipped, explained in three minutes.", meta: "Recorded · the founder, on camera" },
      { kind: "Working document", title: "A decision-process check for a board that is about to buy.", meta: "Kept · requested by name" },
    ],
    ledger: [
      ["Encounters", "3 pieces, 2 rooms"],
      ["Evidence", "1 request · 1 reply"],
      ["Next", "A conversation"],
    ],
    stamp: "Illustrative",
  },
} as const;

export const gap = {
  index: "02",
  eyebrow: "The visibility gap",
  headline: "Strong firms know far more than the market can see.",
  body: "Inside the firm there are years of judgement, hundreds of client conversations and a method that works. Outside there is a website, a few posts and a buyer who has to take your word for it. The gap is not a marketing problem. It is a visibility problem, and it costs the firm every time a buyer decides without meeting the thinking.",
  inside: {
    label: "Inside the firm",
    note: "Private, uneven, mostly unwritten",
    items: ["Client calls", "Method", "Proposals", "Judgement", "Case notes", "Pricing logic", "Delivery decisions", "Objections handled", "Board memos", "Partner opinions", "Post-mortems", "Frameworks"],
  },
  outside: {
    label: "What the market sees",
    note: "Public, thin, easy to forget",
    items: ["A website", "Two posts, months apart", "A referral, if one arrives", "A deck, after the call"],
  },
  strand: "One strand gets out",
} as const;

export const memory = {
  index: "03",
  eyebrow: "Market memory",
  headline: ["We are not trying to make you famous.", "We are trying to make you familiar to the people who matter."], // claim:C-MEMORY
  body: "The goal is a small pool of the right buyers who keep meeting your clear thinking until, when their problem arrives, it is obvious who to call. Familiarity earns attention. Repeated useful attention builds authority. Authority makes every other acquisition channel work harder.",
  encounters: [
    { n: "01", state: "Stranger", piece: "A post", where: "read on the train, half-remembered" },
    { n: "02", state: "Recognised", piece: "A note", where: "kept at the desk for the argument in it" },
    { n: "03", state: "Remembered", piece: "A short video", where: "sent to a colleague with one line" },
    { n: "04", state: "Trusted", piece: "A proof note", where: "answered a question in a board meeting" },
    { n: "05", state: "Conversation", piece: "A call", where: "when the problem finally arrived" },
  ],
  caption: "Five ordinary encounters over a few months. Nothing viral. One buyer who now knows what your firm is good at.",
} as const;

export const roles = {
  index: "04",
  eyebrow: "The working relationship",
  headline: "You talk, record when useful, approve and sell. Threadline runs the system around you.", // claim:C-DIVISION
  body: "The part we need from you is the part nobody else can do. Everything around it is run, recorded and read back to you.",
  you: {
    label: "You",
    rows: [
      { verb: "Talk", note: "Your judgement, in conversation. That is the raw material." },
      { verb: "Record", note: "When being on camera adds trust. Not otherwise." },
      { verb: "Approve", note: "High-consequence outputs only. Nothing goes out unseen." },
      { verb: "Sell", note: "The real conversations, when they come." },
    ],
  },
  threadline: {
    label: "Threadline",
    rows: [
      { verb: "Research", note: "Research runs and sourced signals: what your buyers ask, object to and search for." },
      { verb: "Positioning", note: "Root ideas written as arguments, with claims checked before they travel." },
      { verb: "Production", note: "Scripts, edits, derivatives and packaging, in your voice." },
      { verb: "Control", note: "An approval queue with a record of who signed what, and when." },
      { verb: "Distribution", note: "Publishing records and a measured link for every placement." },
      { verb: "Evidence", note: "Signals recorded as observed, inferred or confirmed, never rounded up." }, // claim:C-EVIDENCE-CLASSES
      { verb: "Attribution", note: "Conversations and pipeline traced back to the work that earned them." },
      { verb: "Learning", note: "Expected read against actual; one change; a weekly report you can read in five minutes." }, // claim:C-EXPECTATION
    ],
  },
  handoff: "Approval is the only handoff. Everything else comes to you finished.",
} as const;

export const workshop = {
  index: "05",
  eyebrow: "The Authority Workshop",
  headline: "Your expertise goes in. A visible authority system comes out.",
  body: "One root idea travels six stations. Each station has one job, one person deciding, and one object that changes hands. Nothing is duplicated; nothing goes out unread.",
  stations: [
    {
      key: "listen",
      n: "01",
      title: "Listen",
      plain: "What your buyers are asking, objecting to and searching for, in their words, gathered from research runs and the calls you already have.",
      object: { label: "Fragments", lines: ["“Why do these programmes stall after the vendor is chosen?”", "“We have a method. It is not written down.”", "“Who has actually done this in our sector?”"] },
      decided: "Sorted by Threadline; nothing published",
    },
    {
      key: "decide",
      n: "02",
      title: "Decide the idea",
      plain: "The fragments become one argument worth testing: a root idea a buyer could disagree with, checked against what buyers actually ask.",
      object: { label: "Root idea · v1", lines: ["Transformation programmes fail before the technology is chosen, because the decision process was never redesigned."], stamp: "Illustrative" }, // claim:C-THESIS-ILLUSTRATIVE
      decided: "Argued by you, in conversation; written by Threadline",
    },
    {
      key: "make",
      n: "03",
      title: "Make it",
      plain: "The idea becomes the expressions it deserves: written, spoken or shown, in your voice, fact-checked and approved before anything leaves.",
      object: { label: "Expressions", lines: ["A written post", "A short video", "A working document"] },
      decided: "Approved by you",
    },
    {
      key: "place",
      n: "04",
      title: "Put it in the room",
      plain: "Published where this buyer actually reads, at a cadence the evidence supports, with a link Threadline can measure. The platform is a component, not the strategy.",
      object: { label: "Placements", lines: ["Room 1 · where the buyer reads", "Room 2 · where the buyer is asked", "One measured link"] },
      decided: "Prescribed by Threadline after diagnosis",
    },
    {
      key: "read",
      n: "05",
      title: "Read what came back",
      plain: "Visits, replies, requests and named enquiries, each recorded with how sure we can be: observed, inferred or confirmed.",
      object: { label: "Signals", lines: ["14 profile visits · observed", "2 replies · confirmed", "1 request for the document · confirmed"], stamp: "Illustrative" }, // claim:C-SYNTHETIC-NUMBERS
      decided: "Recorded by Threadline; read with you",
    },
    {
      key: "change",
      n: "06",
      title: "Change one thing",
      plain: "Expected is read against actual. The weak part is named and replaced, the idea is kept, and the same argument goes out again.",
      object: { label: "Root idea · v2", lines: ["Same argument. New opening line. Same buyer, same rooms."], stamp: "Illustrative" },
      decided: "Decided together, recorded in the weekly report",
    },
  ],
  loop: "What the last station learns feeds the first.",
  controls: { group: "Choose a station", station: "Station" },
} as const;

export const expressions = {
  index: "06",
  eyebrow: "One idea, the right expressions",
  headline: "One idea, the right expressions.",
  body: "A root idea is not a post. It is an argument that can be met in several forms, each prescribed for the buyer and the room, each carrying the same thinking. Platforms are components we prescribe after diagnosis, not packages you have to choose.",
  root: { label: "Root idea", title: "Transformation programmes fail before the technology is chosen.", stamp: "Illustrative" }, // claim:C-THESIS-ILLUSTRATIVE
  forms: [
    { kind: "Written post", role: "Makes the argument easy to meet", room: "Where the buyer reads" },
    { kind: "Short video", role: "Lets the buyer hear the judgement behind it", room: "Where trust is built on camera" },
    { kind: "Working document", role: "Useful enough to keep and pass on", room: "Sent, requested, forwarded" },
    { kind: "Conversation brief", role: "Turns a reply into a real discussion", room: "The call, when it comes" },
  ],
  route: ["Useful encounter", "Recognised", "Remembered", "Asked", "A conversation"],
  routeNote: "The route ends in human conversation and honest evidence, not in reach.", // claim:C-NO-PROMISES
} as const;

export const learning = {
  index: "07",
  eyebrow: "Commercial learning",
  headline: "Expected. Actual. Why. Change. Retest.",
  body: "Before a piece goes out we write down what we expect. After it has travelled we read what happened against that expectation, name the most likely reason for the gap, change one thing, and run it again. This is the difference between a content calendar and a system that gets smarter.",
  illustrative: "Illustrative cases. Not client results.", // claim:C-LEARNING-ILLUSTRATIVE
  note: "Inference is labelled as inference. A bad week reads as a bad week. No leads, views or revenue are promised.", // claim:C-NO-PROMISES
  more: { label: "Read how a service period runs", href: links.how },
} as const;

export const fit = {
  index: "08",
  eyebrow: "Fit",
  headline: "Built for a specific kind of firm.",
  body: "Threadline works where judgement is what clients buy, one conversation is worth a lot, and the firm can take on more of the right work. It is not a ghostwriting service, a content agency or a self-serve tool.",
  good: { label: "A good fit", items: ["Expert-led, where judgement is what clients buy", "Deal value that makes one conversation matter", "Proven expertise with a real offer behind it", "Senior people willing to talk and approve", "Wants authority, not virality"] },
  bad: { label: "Not a fit", items: ["Wants guaranteed reach or virality", "Wants engagement pods or automation", "No founder input available", "A commodity offer with a short sale", "Cannot service additional demand"] },
  more: { label: "Read the full fit description", href: links.who },
} as const;

export const closing = {
  headline: ["Your expertise already wins the work.", "The question is whether the market sees enough of it."],
  body: "A small number of firms at a time. Applications are read by a person and answered either way, including when the answer is that we are not the right fit.", // claim:C-FOUNDING, C-REPLY-EITHER-WAY
  cta: { label: "See if Threadline fits", href: links.apply },
  secondary: { label: "Read the Playbook first", href: links.playbook },
} as const;
