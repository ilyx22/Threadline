/**
 * Public site content — one place for the copy, navigation and CTAs of the
 * pre-client experience. Every factual statement here is a claim that must
 * be VERIFIED in docs/site/CLAIMS_EVIDENCE_LEDGER.md; the ledger ids are
 * referenced beside the statements they govern (`claim:`).
 *
 * Wording rules (docs/site/BRAND_SOURCE_OF_TRUTH.md): never "monthly" for the
 * service cadence; no promised leads, revenue, followers, views, virality or
 * ROI; no AI-led positioning; synthetic demonstrations labelled on the page.
 */

export const SITE = {
  name: "Threadline",
  domain: "threadline.com",
  tagline: "Make the expertise that wins the work visible before the sales call.",
  description:
    "Threadline is a managed authority system for expert-led B2B firms. It turns the expertise inside the firm into authority, qualified demand and a system that learns what actually moves buyers. You talk, record, approve and sell. Threadline runs the machine.",
  primaryCta: { label: "See if Threadline fits", href: "/apply" },
  secondaryCta: { label: "See how it works", href: "/how-it-works" },
};

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/who-its-for", label: "Who it is for" },
  { href: "/playbook", label: "Playbook" },
] as const;

export const FOOTER = {
  line: "A managed authority system for expert-led firms. Installed and run with you, not sold self-serve.",
  columns: [
    { title: "Product", links: [{ href: "/how-it-works", label: "How it works" }, { href: "/who-its-for", label: "Who it is for" }, { href: "/calculator", label: "Cost of the status quo" }, { href: "/playbook", label: "The Founder Authority System" }] },
    { title: "Company", links: [{ href: "/apply", label: "Apply" }, { href: "/login", label: "Client sign in" }] },
    { title: "Fine print", links: [{ href: "/playbook/what-we-do-not-promise", label: "What we do not promise" }] },
  ],
  small: "Founding client programme. 12-week initial engagement, run in 4-week service periods. Commercial terms are discussed during the qualified sales process.", // claim:C-CADENCE — exact pricing is not published (DEC-017)
};

export const CRATES = ["Expertise", "Stories", "Proof", "Opinions", "Experience"] as const;

export const STATIONS = [
  { key: "understand", label: "Understand", detail: "Your business, buyer and offer, written down as the Brand Brain." },
  { key: "research", label: "Research", detail: "What your market is actually asking, in its own words." },
  { key: "signals", label: "Signals", detail: "The few patterns worth acting on, approved by a person." },
  { key: "ideas", label: "Ideas", detail: "Each one tied to a thesis it will test." },
  { key: "script", label: "Script", detail: "Written in your voice, every factual claim checked before it is recorded." },
  { key: "record", label: "Record", detail: "You talk. A teleprompter, a checklist, twenty minutes." },
  { key: "produce", label: "Produce", detail: "Cut, packaged, titled — one idea into the formats that fit it." },
  { key: "approve", label: "Approve", detail: "Nothing goes out that you have not seen." },
  { key: "distribute", label: "Distribute", detail: "Published where the buyer is, with a link we can measure." },
] as const;

export const RETURN_PATH = [
  { label: "Measure", detail: "Views, retention, saves — and who got in touch." },
  { label: "Expected vs actual", detail: "We wrote down what we expected before it went out. Now we compare." },
  { label: "Diagnose", detail: "If it missed, we name the most likely reason. If we cannot, we say so." },
  { label: "Change one thing", detail: "The opening, the proof, the format — one lever, not a rewrite." },
  { label: "Retest", detail: "The same thesis goes out again with the change. That is how we learn." },
] as const;

/** @deprecated Earlier homepages. Kept only for the sentences other pages still draw on (`HOME.problem.points`, `HOME.proof`, `HOME_V3.factory.chambers`) and for ledger traceability. Nothing else here renders. */
export const HOME = {
  hero: {
    eyebrow: "For expert-led businesses",
    title: ["You already have", "the expertise."],
    lead: "We turn it into content people actually want to watch — and run the system around it so that content compounds into authority and qualified demand.",
    sub: "You talk. You record. You approve. You sell. Threadline handles the machine.",
    note: "A small number of clients at a time. Applications are read by a person and answered either way.",
  },
  problem: {
    eyebrow: "The problem",
    title: "The market does not experience enough of what you know.",
    lead: "Eleven years of judgement, hundreds of client conversations, opinions you would defend in a room — and most of it never leaves your head. Not because it is not valuable. Because turning it into something worth watching, every week, is a second job.",
    crates: CRATES,
    points: [
      { title: "Nobody would choose to watch it", body: "The thinking is good; the piece reads a list to camera. The people who would have hired you never reach the part where you say something only you could say." },
      { title: "Topics chosen by mood", body: "This week's post comes from Sunday's mood, not from anything known about what your market is trying to solve." },
      { title: "Output that stops when you get busy", body: "Every piece needs you at four separate points. When delivery gets heavy, publishing goes quiet — exactly when pipeline matters." },
      { title: "No learning loop", body: "Nobody can say why one piece produced three conversations and the next produced none, so the same guesses repeat for quarters." },
    ],
  },
  fourThings: {
    eyebrow: "The division of labour",
    title: "You do four things. Threadline handles the machine.",
    you: [
      { label: "Talk", body: "Answer questions, tell the story, give the opinion. Twenty minutes, not a writing task." },
      { label: "Record", body: "A teleprompter and a checklist. One session covers a week." },
      { label: "Approve", body: "Every script and every cut passes you before it goes anywhere." },
      { label: "Sell", body: "Take the conversations the content starts." },
    ],
    machine: ["Understand", "Research", "Signals", "Ideas", "Script", "Produce", "Package", "Distribute", "Measure", "Diagnose", "Learn"],
    relief: "Everything else — the research, the choosing, the writing, the cutting, the packaging, the publishing, the measuring, the learning — is the machine's job.",
  },
  machine: {
    eyebrow: "The machine",
    title: "Expertise goes in one end. Content worth watching comes out the other.",
    lead: "Scroll and the line runs. Each station does one job and hands the piece to the next.",
    stations: STATIONS,
  },
  stopsHere: {
    eyebrow: "Where most stop",
    title: "Most agencies stop at publish. The machine turns round.",
    lead: "Publishing is the middle of the process, not the end. What comes back from the market is the most valuable thing the system produces, and almost nobody collects it.",
    path: RETURN_PATH,
  },
  branching: {
    eyebrow: "One idea, many expressions",
    title: "One thesis. Many packages. One learning history.",
    lead: "A single argument becomes a long-form piece, three shorts, a LinkedIn post, a thread and a newsletter section — each measured on its own, all read together as one idea being tested.",
    packages: ["Long-form", "Short", "Short", "LinkedIn", "Thread", "Newsletter"],
  },
  memory: {
    eyebrow: "Market memory",
    title: "We are not trying to make you famous. We are trying to make you familiar to the people who matter.",
    lead: "Familiarity earns attention. Repeated valuable attention builds authority. Authority makes every other acquisition channel work harder.",
    stages: ["Stranger", "Recognise", "Remember", "Trust", "Conversation"],
    note: "There is no magic number of exposures. There is a buyer who keeps meeting the same clear thinking until it is obvious who to call.",
  },
  attention: {
    eyebrow: "Commercial attention",
    title: "Reach is not the result.",
    lead: "Threadline optimises for commercially valuable attention, not just reach. A piece that travels to the wrong room is a targeting result, however good the numbers look.",
    left: { label: "Viral, wrong audience", body: "Large numbers. Nobody who could buy. Fun for a day, useless for the business." },
    right: { label: "Smaller, right buyer", body: "Modest reach. One named enquiry that says which post they saw. This is the outcome the system is built for." },
    signals: ["Named enquiry", "Booked call", "Tracked click", "Buyer mentions the piece"],
  },
  learns: {
    eyebrow: "How the system learns",
    title: "Written down before, read against after.",
    lead: "Before a piece goes out we record what we expect. After it has had time to travel, we read what happened against that expectation and name the most likely reason for the gap. Inference is labelled as inference.",
    card: {
      expected: "A typical result for this format; the opening was the strongest part.",
      actual: "Reach at a fifth of usual; the people who watched stayed to the end.",
      failure: "Hook and packaging — the argument was fine, the first line did not earn the click.",
      next: "Retest the same thesis with the opening rewritten around the buyer's moment.",
      verdict: "Retest read: it worked.",
    },
    disclaimer: "A diagnosis is a hypothesis with a name, not a certainty. When the evidence is too thin, the system says 'too early to read' instead of guessing.",
  },
  twelveWeeks: {
    eyebrow: "The first 12 weeks",
    title: "Three service periods. Real market evidence, not a promise about algorithms.",
    lead: "Threadline runs in 4-week service periods. The initial engagement is three of them.", // claim:C-CADENCE
    periods: [
      { label: "Period 1", title: "Establish and calibrate", body: "Brand Brain, research, first signals, first pieces out. We learn what your market responds to — and record what we expected first." },
      { label: "Period 2", title: "Refine and correct", body: "Diagnoses become corrections. The weakest link gets pressed on. Output settles into a rhythm you can keep." },
      { label: "Period 3", title: "Concentrate and compound", body: "The theses that earned attention get more of it. Derivatives multiply the winners. The learning history starts paying." },
      { label: "Period 4+", title: "Compound harder", body: "By now the system knows things about your market that nobody else has written down." },
    ],
    note: "We need repeated real market evidence before anyone can say what works for you. We do not say 'the algorithm needs 90 days'. We say the learning does.",
  },
  proof: {
    eyebrow: "Product proof",
    title: "No client results to show yet. So here is the system, working.",
    lead: "Threadline is a founding-client programme. Until real results exist and a client has agreed to share them, the only honest proof is the mechanism itself. Everything below is a synthetic demonstration.", // claim:C-NO-CASE-STUDIES
    label: "Synthetic demonstration — illustrative, not a client result",
    chain: [
      { label: "Evidence", body: "'The forecast is a feeling' — said by three founders on discovery calls." },
      { label: "Idea", body: "Why your forecast is a feeling, not a number." },
      { label: "Expectation", body: "Typical reach for the format; strongest dimension: relevance." },
      { label: "Published", body: "LinkedIn, Tuesday, with a tracked link." },
      { label: "Performance", body: "Reach a fifth of usual; retention high among those who watched." },
      { label: "Commercial signal", body: "One booked call. Buyer named the post." },
      { label: "Diagnosis", body: "Hook and packaging. Thesis preserved." },
      { label: "Correction", body: "Rewrite the opening around the board meeting where the number was wrong." },
      { label: "Retest", body: "Same thesis, new opening. Read at 14 days." },
      { label: "Trajectory", body: "Period 1: 1 diagnosed, 1 corrected, 1 verdict." },
    ],
  },
  fit: {
    eyebrow: "Fit",
    title: "Built for a specific kind of business.",
    good: [
      "Established expertise with a track record",
      "A real offer that a customer can buy",
      "Meaningful value per client, so one conversation matters",
      "Capacity to take on more of the right customers",
      "Willing to record and approve every week",
      "Understands that authority compounds rather than spikes",
      "Wants a managed system, not a tool to learn",
    ],
    bad: [
      "No real offer yet, or one that changes weekly",
      "Wants overnight fame by the end of the month",
      "Wants thought leadership without the thoughts",
      "Cannot give the expertise the time it takes to record",
      "Expects a revenue guarantee from content",
      "Could not serve more customers if they came",
    ],
  },
  cta: {
    title: "Apply for a content growth diagnosis.",
    lead: "Three short steps. Read by a person. Answered either way — including when the answer is that we are not the right fit.",
  },
};

export const HOW_IT_WORKS = {
  title: "How the machine works.",
  lead: "Raw expertise in. Market intelligence, content decisions, production, distribution, commercial response and learning — in that order, every service period.",
  stages: [
    { key: "raw", title: "Raw expertise", body: "You bring what only you have: what you know, what you have seen, what you would argue. It arrives as conversation, not as homework.", station: "founder" },
    { key: "intel", title: "Market intelligence", body: "The Scanner reads what your market says — its questions, objections and language — from your own records, from public sources and from what you paste in. Every source is kept with its provenance. Login-walled platforms are refused by name, never scraped in the dark.", station: "scanner" },
    { key: "decide", title: "Content decisions", body: "Signals become theses; theses become ideas; ideas become scripts in your voice. Every factual claim is checked before it can be recorded. A person approves each step — the machine proposes, it does not decide.", station: "assembly" },
    { key: "produce", title: "Production", body: "You record against a teleprompter. The Builder cuts and packages. One source piece becomes the formats that fit it, each with its own title, thumbnail and caption, all sharing one lineage.", station: "builder" },
    { key: "distribute", title: "Distribution", body: "Published where the buyer is, with a tracked link so that a click, a form and a booked call can be joined up later. Paid amplification is recorded separately from organic reach so the two are never confused.", station: "sorter" },
    { key: "response", title: "Commercial response", body: "Enquiries, booked calls and named mentions are recorded with their evidence class. A buyer saying 'I saw the post' is stronger evidence than a like, and the system never upgrades weak evidence into strong.", station: "buyer" },
    { key: "learn", title: "Learning", body: "Expected vs actual. Diagnosis. One correction. Retest. Verdict. The trajectory is shown as it happened — improving, flat or declining — and a bad period reads as a bad period.", station: "pipe" },
  ],
  gates: [
    { label: "Fact-check gate", body: "A script with an unverified factual claim cannot be marked ready to record." },
    { label: "Approval gate", body: "Nothing is scheduled that you have not approved." },
    { label: "Publish gate", body: "A record cannot be marked published without the live URL." },
    { label: "Reading gate", body: "A piece younger than 14 days is 'too early to read', not diagnosed." },
  ],
};

export const WHO_ITS_FOR = {
  title: "Expert-led B2B businesses with something proven to sell.",
  lead: "Threadline works when there is real expertise, a real offer and enough value per customer that one good conversation matters. It does not work as a shortcut to fame.",
  profile: [
    { label: "Buyer profile", body: "Founders, partners and senior operators of expert-led firms — advisory, consulting, professional services, specialist B2B — where the founder's judgement is the product." },
    { label: "Offer maturity", body: "An offer that has been sold more than once, with a price, a scope and a customer who can describe what they got." },
    { label: "Economics", body: "Meaningful value per client. If one additional good customer is worth four figures or more, content that starts one conversation a month pays for itself. If it is worth forty pounds, this is the wrong tool." },
    { label: "The founder's role", body: "Twenty minutes of recording and one approval pass a week. If that is not available, no system can manufacture your voice." },
    { label: "Expectations", body: "Three 4-week periods before anyone can say what works for your market. No promised leads, views or revenue. A report every week that shows what shipped, what we expected, what happened and what we are testing next." },
    { label: "What Threadline is", body: "A managed authority system: market intelligence, expertise extraction, the right expressions, distribution, commercial signal, diagnosis and learning, run for you, with you keeping the four things only you can do." },
    { label: "What it is not", body: "Not a tool you learn. Not a ghostwriting retainer. Not an audience-growth hack. Not an agency that stops at publish." },
  ],
  wedgeNote: "Our current research focus is senior founder- and partner-led AI and digital transformation advisory firms in the US and UK. That is a hypothesis we are testing in conversations, not a rule about who we work with.", // claim:C-WEDGE
};

export const APPLY = {
  eyebrow: "Founding client programme",
  title: "Apply for a diagnosis, not a pitch.",
  lead: "This is a diagnostic, not a signup. Your answers tell us where demand is actually constrained — and on several of the dimensions we look at, more content would make the problem more expensive rather than smaller.",
  reassurance: "Answer honestly. If the answer is that we are not the right fit, we would both rather know now, and you keep the finding either way.",
  meta: "Three short steps, about four minutes. Read by a person. Replied to either way.",
};

export const CALCULATOR = {
  eyebrow: "The cost of the status quo",
  title: "What does your content operation cost today?",
  lead: "Most founders have never costed it, because the largest line — their own time — never appears on an invoice. Put your real numbers in. This is a scenario built from your inputs: it computes what the current operation costs and what a different workflow would release. It never projects revenue, and organic content is not paid media — nothing here is a deterministic attribution model.",
};

export const PLAYBOOK = {
  eyebrow: "A resource, not a pitch",
  title: "The Founder Authority System",
  lead: "How expert-led businesses turn what they know into content the market wants, keep learning from what comes back, and become the obvious person to call. Read it in twenty minutes. Use it without us.",
  chapters: [
    { slug: "expertise-is-the-raw-material", title: "Expertise is the raw material", summary: "Why the best content in your category is already in your head, and why it does not leave on its own.", scene: "crates", keyIdea: "Content is not created. It is extracted, then shaped. If the extraction step is 'the founder sits down to write', it will not happen at the cadence the market needs.", reveal: { prompt: "What counts as raw material?", answer: "Opinions you would defend. Stories with a number in them. Mistakes you have paid for. Questions clients ask twice. Frameworks you use without naming. The thing you say on every second call." }, practice: "Record a 20-minute conversation answering: what do clients keep getting wrong before they reach you? That recording is a month of material." },
    { slug: "positioning-is-a-decision", title: "Positioning is a decision, not a discovery", summary: "One problem, one buyer, one argument — before a single piece is made.", scene: "founder", keyIdea: "Content amplifies whatever position it is given. If the position is 'we do lots of things for lots of people', the content will be watched by nobody in particular.", reveal: { prompt: "The one-sentence test", answer: "'We help [a specific buyer] solve [an expensive problem] by [a mechanism they do not have].' If the sentence needs a comma-list, the position is not decided yet." }, practice: "Write the sentence. Show it to the last three people who bought. Ask which word they would change." },
    { slug: "listen-before-you-speak", title: "Listen before you speak", summary: "Market intelligence is the difference between content that is about you and content that is for them.", scene: "scanner", keyIdea: "Your market is already telling you what it wants to watch — in the questions it asks on calls, the objections it raises before price, the words it uses for the problem. Write those down before choosing a topic.", reveal: { prompt: "Where the language lives", answer: "Discovery call notes. Support emails. The comment under a competitor's post that got more replies than the post. The thing a buyer said that made you wince because it was true." }, practice: "Collect ten exact quotes from buyers in a week. Underline the words you would never have chosen yourself." },
    { slug: "one-thesis-many-expressions", title: "One thesis, many expressions", summary: "Why the unit of content is the argument, not the post.", scene: "branching", keyIdea: "A thesis is an argument the market can react to. One thesis becomes a long piece, several shorts, a post and a thread — different expressions, one learning history. Cross-posting the same words everywhere is not the same thing.", reveal: { prompt: "Thesis or topic?", answer: "'Sales forecasting' is a topic. 'Your forecast is a feeling, not a number, and the board can tell' is a thesis. Only the second can be wrong — which is exactly why it can be tested." }, practice: "Take one topic you post about. Write three theses on it that someone could disagree with." },
    { slug: "distribution-is-a-place-not-a-blast", title: "Distribution is a place, not a blast", summary: "Publish where the buyer is; make the path from the piece to a conversation measurable.", scene: "sorter", keyIdea: "The buyer for a £20,000 engagement is not on every platform, and does not need to be. Distribution is choosing the two rooms they are in and being there consistently — with a link that lets you see who came through.", reveal: { prompt: "The measurement rule", answer: "If a piece has no tracked link and no call to action, its commercial result cannot be observed later. It can still be worth publishing — but say so at the time, not afterwards." }, practice: "For your last five pieces, write down how a buyer could have got in touch from each. Count the pieces where the answer is 'they couldn't'." },
    { slug: "repeated-exposure-builds-memory", title: "Repeated exposure builds memory", summary: "Familiarity earns attention; repeated valuable attention builds authority.", scene: "memory", keyIdea: "Nobody hires the person they saw once. They hire the person who kept being right in front of them until it was obvious who to call. There is no magic number of exposures — there is consistency of argument over months.", reveal: { prompt: "Famous vs familiar", answer: "Famous is many people knowing your name. Familiar is the right forty people knowing your position. The second is worth more and costs less." }, practice: "Name the forty people who matter for your next year. Would they recognise your argument from a single line?" },
    { slug: "measure-what-the-buyer-did", title: "Measure what the buyer did", summary: "Reach is a proxy. A named enquiry is a result.", scene: "attention", keyIdea: "Views tell you a piece travelled. They do not tell you where. The signals that matter are the ones with a buyer attached: a tracked click, a form, a booked call, a person saying 'I saw your post'. Weak evidence should never be counted as strong.", reveal: { prompt: "Evidence classes, in order", answer: "Directly tracked → buyer named the piece → multi-touch → associated in time → qualitative only. A report that sums these into one number is hiding the difference." }, practice: "Next time someone gets in touch, ask what they saw. Write the answer down with the date." },
    { slug: "write-down-what-you-expect", title: "Write down what you expect", summary: "The learning loop starts before the piece goes out.", scene: "inspector", keyIdea: "If you do not record what you expected, every result looks like what you expected. Write it down first — a sentence and a rough band — and read the result against it after two weeks.", reveal: { prompt: "What a diagnosis is", answer: "A named, checkable hypothesis about why the gap exists: idea, targeting, hook, delivery, retention, proof, distribution, call-to-action. Or 'too early to read'. Never 'the algorithm'." }, practice: "For your next piece, write one line: 'I expect this to do about X because Y.' Read it in 14 days." },
    { slug: "change-one-thing-and-retest", title: "Change one thing, then retest", summary: "Corrections are how a content operation gets smarter instead of busier.", scene: "pipe", keyIdea: "A piece that missed is not a failed thesis; it is a thesis with one wrong component. Change the component — the opening, the proof, the format — and run it again. Record whether the change worked. That record is the asset.", reveal: { prompt: "Why one lever", answer: "Change three things and you learn nothing, because you cannot tell which one mattered. Change one and you learn something you can use on every future piece." }, practice: "Pick your best-argued piece that underperformed. Rewrite only the first line. Post it again." },
    { slug: "what-we-do-not-promise", title: "What we do not promise", summary: "The honest limits of any content system, including this one.", scene: "stamp", keyIdea: "No system can promise leads, revenue, followers, views or virality, because the market decides and the market is not a machine. What can be promised is the process: evidence before ideas, expectations before publishing, diagnosis before the next batch, and a report that shows a bad week as a bad week.", reveal: { prompt: "So what is the guarantee?", answer: "Controllable things: the research is done, the pieces ship, every claim is checked, every result is read against an expectation, and you are never shown a number that flatters. Everything else is evidence, collected honestly." }, practice: "Ask any provider — including us — to show you a report from a bad month. If they cannot, they are not measuring." },
  ],
  closing: { title: "Want us to run the machine?", lead: "Threadline runs this system for a small number of expert-led businesses at a time. Apply and we will tell you honestly whether it fits.", cta: { label: "Apply", href: "/apply" } },
};

/**
 * The Playbook's tools. The model is arithmetic over the visitor's own
 * assumptions and says so on the page; it never projects revenue (C-CALC) and
 * never promises a result (C-NO-PROMISES).
 */
export const PLAYBOOK_TOOLS = {
  eyebrow: "Use it, not only read it",
  title: "Two things to do before you apply.",
  lead: "The Playbook is an operating model, so the useful parts are the ones you can put your own situation into.",
  diagnose: {
    eyebrow: "Diagnose",
    title: "Where is your authority system breaking?",
    lead: "Pick the description that sounds most like you. Each one maps to a station on the line.",
  },
  model: {
    eyebrow: "Model",
    title: "How much of the right attention does your target actually need?",
    lead: "Start from the engagements you want to win and read the funnel backwards. Change one rate and watch which stage moves.",
    targetNote: "Your target for the period.",
    leverLine: "is the rate to work on: ten points there and the same target needs about",
    leverTail: "first touches instead. Everything else being equal, which it never quite is.",
    leverNone: "Every rate is already high; the lever is the target itself.",
    note: "A model of your assumptions, not a forecast. It shows what your own numbers imply; it does not know your market, and it cannot promise any of these conversions will hold.",
  },
} as const;

export const NOT_FOUND = {
  title: "That page is not on the line.",
  lead: "The link may be out of date, or the record belongs to a workspace you cannot see.",
};


/* ------------------------------------------------------------------------ */
/* HOME v3 — the captivation pass (9 September 2026, evening).               */
/* Narrative order: hero → commercial problem → market memory → founder      */
/* burden → Authority Factory → one idea, the right expressions → attention  */
/* to commercial movement → learning loop → 12-week progression →            */
/* comparison → fit → final CTA. Every approved sentence from HOME is reused */
/* by reference; the new keys below hold the copy the brief specified.       */
/* ------------------------------------------------------------------------ */

export const HOME_V3 = {
  hero: {
    eyebrow: "For expert-led B2B firms",
    title: ["You already have the expertise.", "We turn it into content people actually want to watch."],
    lead: "And we run the system around it so that content compounds into authority and qualified demand.",
    sub: HOME.hero.sub,
    note: HOME.hero.note,
    primary: { label: "See if Threadline fits", href: "/apply" },
    secondary: { label: "See how the system works", href: "#factory" },
    machine: {
      token: "Your expertise",
      signals: ["Buyer question", "Objection", "Competitor gap"],
      thesis: "Why your forecast is a feeling, not a number",
      outputs: [
        { kind: "linkedin", label: "Text post", excerpt: "Most forecasts are a feeling with a spreadsheet around it. Three signs yours is one." },
        { kind: "video", label: "Native video", excerpt: "The board meeting where the number was wrong" },
        { kind: "carousel", label: "Carousel", excerpt: "1 / The feeling · 2 / The number · 3 / The fix" },
      ],
      responses: ["Profile visit", "Named enquiry"],
      learn: "Expected vs actual",
    },
  },
  problem: {
    eyebrow: "The commercial problem",
    title: HOME.problem.title,
    lead: HOME.problem.lead,
    without: { label: "Without a system", steps: ["Founder expertise", "Sporadic posts", "Random reach", "Weak consistency", "Analytics nobody acts on", "No clear learning"] },
    with: { label: "With Threadline", steps: ["Expertise", "Market intelligence", "Buyer-specific ideas", "Repeated exposure", "Commercial movement", "Diagnosis", "Improvement"] },
  },
  memory: {
    eyebrow: "The desired outcome",
    title: HOME.memory.title,
    lead: HOME.memory.lead,
    stages: HOME.memory.stages,
    note: HOME.memory.note,
    poolLabel: "A small pool of the right buyers",
    encountersLabel: "The same buyer, five encounters",
    cards: ["Why your forecast is a feeling", "The board meeting where the number was wrong", "What a real number needs"],
  },
  labour: {
    eyebrow: "Founder burden",
    title: "The part we need from you is the part nobody else can fake.",
    lead: HOME.hero.sub,
    you: [
      { label: "Talk", body: "Your judgement." },
      { label: "Record", body: "When the idea benefits from you being on camera." },
      { label: "Approve", body: "High-consequence outputs." },
      { label: "Sell", body: "Real conversations." },
    ],
    threadline: ["Research", "Positioning", "Market intelligence", "Ideation", "Writing", "Scripting", "Production", "Editing", "Packaging", "Distribution", "Measurement", "Diagnosis", "Iteration"],
    relief: HOME.fourThings.relief,
  },
  factory: {
    eyebrow: "The Authority Factory",
    title: "Your expertise goes in. A commercial authority system comes out.",
    lead: "Seven stations. You are needed at four of them, briefly. Everything else belongs to Threadline, and the last station feeds the first.",
    chambers: [
      { key: "input", label: "Founder input", items: ["judgement", "stories", "proof", "experience", "opinions"], founder: "Input", plain: "What only you have, captured in conversation." },
      { key: "intel", label: "Intelligence", items: ["market", "buyers", "competitors", "signals"], plain: "What your market is asking, in its own words." },
      { key: "create", label: "Create", items: ["thesis", "ideas", "native text", "scripts", "recording"], founder: "Record", plain: "One thesis at a time, in your voice; you record when it helps." },
      { key: "package", label: "Package", items: ["edit", "design", "QA", "claim check", "native formatting"], founder: "Approve", plain: "Cut, checked and formatted for where it will live; you approve." },
      { key: "distribute", label: "Distribute", items: ["prescribed platforms", "evidence-responsive cadence"], plain: "Published where your buyer is, at a cadence the evidence supports." },
      { key: "response", label: "Response", items: ["attention", "profile actions", "practical asset requests", "conversations", "other commercial signals"], founder: "Sell", plain: "What buyers did, recorded with its evidence class; you take the conversations." },
      { key: "learn", label: "Learn", items: ["expected", "actual", "diagnose", "change", "retest"], plain: "Read against what we expected; one change; retest." },
    ],
    loop: "Learning feeds the next cycle's intelligence and creation.",
  },
  expressions: {
    eyebrow: "One idea, the right expressions",
    title: "One idea. The right expressions.",
    lead: HOME.branching.lead,
    thesis: { label: "Root thesis · illustrative", text: "AI transformation projects often fail because firms optimise the technology before redesigning the decision process." },
    action: "Multiply",
    reset: "Back to one idea",
    outputs: [
      { kind: "linkedin", label: "LinkedIn text", excerpt: "Most AI transformations fail before the model is chosen. The decision process was never redesigned. Three signs it is happening to you:" },
      { kind: "video", label: "Video script", excerpt: "Open on the failure: 'We bought the model first.' Then the one question that would have saved the project." },
      { kind: "x", label: "X post", excerpt: "Optimise the decision, then the technology. Most firms do it the other way round and call it AI transformation." },
      { kind: "threads", label: "Threads post", excerpt: "A quiet reason AI projects stall: nobody redrew who decides what, and when. Technology cannot fix a decision path." },
      { kind: "carousel", label: "Carousel", excerpt: "1 / Technology first · 2 / Decision process untouched · 3 / Where it breaks · 4 / What to redesign" },
    ],
    caveat: "Not every platform, every time. The mix is prescribed after diagnosis, and a derivative is not a new idea.",
  },
  route: {
    eyebrow: "Attention to commercial movement",
    title: HOME.attention.title,
    lead: HOME.attention.lead,
    quote: "Threadline optimises for commercially valuable attention, not just reach.",
    steps: ["Content", "The right buyer notices", "Repeated familiarity", "Profile and proof inspection", "A practical asset or CTA, where useful", "Response or permission", "Human conversation", "Commercial event", "Learning"],
    left: { ...HOME.attention.left, number: "1,204,000", reading: "A viral piece in the wrong room. High reach, no buyer, nothing to learn from commercially." },
    right: { ...HOME.attention.right, number: "1,900", reading: "A modest piece in the right room. One named enquiry that says which post they saw. That is the result the route is built for." },
    honesty: "No leads are promised. Threadline improves the route from expertise to commercial movement and records each step with its evidence class.",
    illustrative: "Numbers illustrative — no client figures are shown on this site.",
  },
  learning: {
    eyebrow: "How the system learns",
    title: HOME.learns.title,
    lead: HOME.learns.lead,
    disclaimer: HOME.learns.disclaimer,
    asset: { title: "Why your forecast is a feeling, not a number", meta: "LinkedIn text · illustrative" },
    states: [
      { key: "expected", label: "Expected", headline: "Written down before it goes out", score: "82 / 100", lines: ["Strong: expertise, proof, buyer relevance", "Risk: opening retention"], note: "A decision-support rubric, not a prediction." },
      { key: "actual", label: "Actual", headline: "Read after it has had time to travel", lines: ["Buyer relevance: strong", "Opening retention: weaker than expected", "Profile actions: stronger than baseline"] },
      { key: "why", label: "Why", headline: "Idea success · packaging failure", lines: ["Idea quality: held", "Hook and packaging: weak", "Distribution: as planned", "Buyer relevance: strong", "Commercial path: open"], note: "Threadline separates idea, packaging, distribution, buyer relevance and commercial path so the right thing changes." },
      { key: "change", label: "Change", headline: "One lever, not a rewrite", lines: ["Hook rewritten", "Proof moved earlier", "Same core thesis retained"] },
      { key: "retest", label: "Retest", headline: "The updated asset re-enters the system", lines: ["Read again at 14 days", "Verdict recorded against the same root", "The next cycle starts better informed"] },
    ],
  },
  progression: {
    eyebrow: HOME.twelveWeeks.eyebrow,
    title: HOME.twelveWeeks.title,
    lead: HOME.twelveWeeks.lead,
    periods: HOME.twelveWeeks.periods,
    note: "We need enough real market evidence to learn your founder, buyer and content combination. We do not say the algorithm needs 90 days. We say the learning does.",
    legend: { hypotheses: "Hypotheses", validated: "Validated patterns" },
  },
  comparison: {
    eyebrow: "The honest comparison",
    title: "You could just hire a ghostwriter.",
    lead: "Threadline optimises the system around the content, not only the content itself. These are capability differences, stated carefully; none of them is a measured result.",
    columns: [
      { key: "threadline", label: "Threadline", sub: "Managed system" },
      { key: "ghost", label: "Ghostwriter", sub: "Writes posts" },
      { key: "agency", label: "Content agency", sub: "Produces content" },
      { key: "inhouse", label: "In-house", sub: "You run it" },
    ],
    rows: [
      { label: "Market intelligence before ideas", threadline: "core", ghost: "rarely", agency: "sometimes", inhouse: "depends" },
      { label: "Founder expertise extraction", threadline: "core", ghost: "typically light", agency: "sometimes", inhouse: "depends" },
      { label: "Positioning", threadline: "built in", ghost: "rarely", agency: "sometimes", inhouse: "depends" },
      { label: "Native format prescription", threadline: "built in", ghost: "no", agency: "sometimes", inhouse: "depends" },
      { label: "Video capability", threadline: "when useful", ghost: "rarely", agency: "typically", inhouse: "depends" },
      { label: "Text capability", threadline: "first class", ghost: "yes", agency: "yes", inhouse: "yes" },
      { label: "Production", threadline: "built in", ghost: "no", agency: "yes", inhouse: "depends" },
      { label: "Distribution", threadline: "built in", ghost: "rarely", agency: "often", inhouse: "depends" },
      { label: "Commercial signal capture", threadline: "core", ghost: "no", agency: "rarely", inhouse: "depends" },
      { label: "Root-idea lineage", threadline: "core", ghost: "no", agency: "rarely", inhouse: "rarely" },
      { label: "Expected vs actual diagnosis", threadline: "core", ghost: "no", agency: "rarely", inhouse: "rarely" },
      { label: "Correction and retest", threadline: "core", ghost: "no", agency: "sometimes", inhouse: "depends" },
      { label: "Founder operating burden", threadline: "talk · record · approve · sell", ghost: "brief and review", agency: "brief, review, manage", inhouse: "hire, manage, direct" },
    ],
    note: "'Typically', 'sometimes' and 'depends' mean exactly that. Threadline's column describes what is built into the system, not a measured comparison.",
  },
  fit: {
    eyebrow: "Who it is for",
    title: HOME.fit.title,
    good: HOME.fit.good,
    bad: HOME.fit.bad,
    more: { label: "Who it is for, in detail", href: "/who-its-for" },
  },
  cta: {
    eyebrow: "Next",
    title: "You already have the expertise. Let's build the system around it.",
    lead: HOME.cta.lead,
    outputs: ["Authority", "Familiarity", "Qualified demand", "Learning"],
    action: { label: "Apply to work with Threadline", href: "/apply" },
  },
} as const;

/** The optional diagnostic (How it works). Original categories; each routes to a factory station. */
export const DIAGNOSTIC = {
  eyebrow: "Where is your authority system breaking?",
  title: "Pick the description that sounds most like you.",
  lead: "Five places an authority system can break. Each one maps to a station on the line — and to the symptoms we hear most often on discovery calls.",
  categories: [
    { key: "position", label: "Position", body: "The market sees you but does not know what you should be known for.", chamber: "intel", stage: "intel" },
    { key: "create", label: "Create", body: "The expertise exists but rarely becomes strong content.", chamber: "create", stage: "decide" },
    { key: "distribute", label: "Distribute", body: "Good thinking exists but too few relevant buyers repeatedly encounter it.", chamber: "distribute", stage: "distribute" },
    { key: "convert", label: "Convert", body: "Attention exists but has no clean route into a commercial conversation.", chamber: "response", stage: "response" },
    { key: "learn", label: "Learn", body: "Publishing happens but nobody knows what should change next.", chamber: "learn", stage: "learn" },
  ],
  symptoms: HOME.problem.points,
  cta: { label: "See if Threadline fits", href: "/apply" },
} as const;
