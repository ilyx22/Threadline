/**
 * THREADLINE — CONTENT SOURCE OF TRUTH
 * ====================================
 * Every word and link on the marketing site lives here. Components read from
 * here; none of them hard-code copy.
 *
 * Rules that do not move:
 *   - no pricing, tiers or "starting from" anywhere;
 *   - no proof, logos, testimonials, client names or figures — none exist yet;
 *   - every illustrative example is labelled illustrative on the page;
 *   - no platform in a headline: the platform is a component, not the category;
 *   - no promised leads, revenue, virality, followers or founder-time figures.
 */

export const brand = {
  name: 'Threadline',
  title: 'Threadline — make the expertise that wins the work visible',
  domain: 'https://threadline.example',
  description:
    'Threadline is a managed authority and qualified-demand system for expert-led B2B firms. ' +
    'It turns the expertise inside the business into content people actually want to watch, ' +
    'runs the system around it, and learns what actually moves buyers.',
  ogImage: '/og.png',
} as const;

/** Every destination in one place. `apply` is the only conversion path. */
export const links = {
  apply: '/apply',
  playbook: '/playbook',
  privacy: '/privacy-policy',
  /** Owner input: a monitored address. Obviously a placeholder until set. */
  email: 'mailto:hello@threadline.example',
} as const;

export const nav = {
  wordmark: 'Threadline',
  links: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Who it is for', href: '/who-its-for' },
    { label: 'Playbook', href: links.playbook },
  ],
  cta: { label: 'See if Threadline fits', short: 'See if it fits', href: links.apply },
} as const;

export const hero = {
  eyebrow: 'For expert-led B2B firms',
  headline: 'Make the expertise that wins the work visible before the sales call.',
  body:
    'Threadline turns the expertise inside high-value B2B firms into authority, qualified demand ' +
    'and a system that learns what actually moves buyers.',
  cta: { label: 'See if Threadline fits', href: links.apply },
  secondary: { label: 'How it works', href: '/#workshop' },
  /** The signature scene: raw expertise → the authority stack → visible expressions → signals back. */
  scene: {
    blocks: ['Client calls', 'Proposals', 'Delivery', 'Judgement', 'Method'],
    stackLabel: 'Authority',
    frames: [
      { kind: 'post', label: 'Written post' },
      { kind: 'video', label: 'Short video' },
      { kind: 'doc', label: 'Document' },
    ],
    signals: ['Profile visit', 'Reply', 'Enquiry'],
    buyers: 'The people who matter',
  },
} as const;

/** The ticker under the hero: where the expertise lives today. */
export const material = {
  lead: 'The expertise already exists. Today it lives in',
  items: [
    'client calls',
    'proposal decks',
    'delivery notes',
    'Slack threads',
    'partners’ heads',
    'pricing conversations',
    'post-mortems',
    'board memos',
    'private advice',
    'the method nobody wrote down',
  ],
} as const;

export const problem = {
  eyebrow: 'The commercial problem',
  headline: 'Strong firms know far more than the market can see.',
  body:
    'Inside the firm: years of judgement, hundreds of client conversations, a method that works. ' +
    'Outside: a website, a few posts, and a buyer who has to take your word for it.',
  inside: {
    label: 'Inside the firm',
    blocks: [
      'Client calls', 'Method', 'Proposals', 'Judgement', 'Case notes', 'Pricing logic',
      'Delivery', 'Objections handled', 'Board memos', 'Partner opinions', 'Post-mortems', 'Frameworks',
    ],
  },
  boundary: 'The firm boundary',
  buried: 'The thing buyers always ask',
  crossing: 'Our method, in one line',
  outside: {
    label: 'What the market sees',
    fragments: ['A website', 'Two posts'],
    buyer: 'A buyer, deciding on a referral and a deck',
  },
} as const;

export const memory = {
  eyebrow: 'Market memory',
  headline: 'We are not trying to make you famous. We are trying to make you familiar to the people who matter.',
  body:
    'Familiarity earns attention. Repeated valuable attention builds authority. Authority makes ' +
    'every other acquisition channel work harder.',
  encounters: [
    { label: 'Stranger', note: 'A useful piece passes by' },
    { label: 'Recognise', note: 'The name lands' },
    { label: 'Remember', note: 'The thinking is remembered' },
    { label: 'Trust', note: 'The judgement is trusted' },
    { label: 'Conversation', note: 'It is obvious who to call' },
  ],
  fieldLabel: 'A small pool of the right buyers',
  /** What passes the buyer, in order. The first is ignored — that is the joke and the point. */
  passes: [
    { kind: 'update', label: 'Company update', reacts: false },
    { kind: 'post', label: 'The method we use when…', reacts: true },
    { kind: 'video', label: 'The judgement behind it', reacts: true },
    { kind: 'proof', label: 'How it was applied', reacts: true },
    { kind: 'trigger', label: 'Asked for the method', reacts: true },
  ],
  note: 'There is no magic number of exposures. There is a buyer who keeps meeting the same clear thinking until it is obvious who to call.',
} as const;

export const burden = {
  eyebrow: 'Founder burden',
  headline: 'The part we need from you is the part nobody else can do.',
  you: [
    { verb: 'Talk', note: 'Your judgement, in conversation.' },
    { verb: 'Record', note: 'When being on camera adds trust.' },
    { verb: 'Approve', note: 'High-consequence outputs only.' },
    { verb: 'Sell', note: 'The real conversations.' },
  ],
  frameLabel: 'Threadline handles everything around those',
  pile: ['research', 'scripting', 'editing', 'packaging', 'posting', 'measuring', 'diagnosis', 'follow-ups'],
  ring: [
    'market intelligence', 'positioning', 'ideation', 'writing', 'scripting', 'production',
    'editing', 'packaging', 'distribution', 'measurement', 'diagnosis', 'correction',
  ],
  relief: 'You talk. You record. You approve. You sell. Threadline handles the machine.',
} as const;

export const workshop = {
  eyebrow: 'The Authority Workshop',
  headline: 'Your expertise goes in. A visible authority system comes out.',
  body:
    'Not a content factory. An editorial and analytical workshop where raw expertise is worked ' +
    'into ideas, expressed natively, put in front of the right buyers, and read back against what ' +
    'we expected.',
  /** Rows alternate small/big and big/small; each tile carries an original scene. */
  rows: [
    [
      { key: 'intel', size: 'small', tone: 'cobalt', title: 'Market intelligence',
        plain: 'What your buyers are asking, objecting to and searching for — in their words, with provenance.' },
      { key: 'thesis', size: 'big', tone: 'mist', title: 'Positioning and the root thesis',
        plain: 'Fragments of expertise are condensed into one argument worth testing. One root idea at a time.' },
    ],
    [
      { key: 'express', size: 'big', tone: 'vermilion', title: 'Expression',
        plain: 'The thesis becomes the formats it deserves — written, spoken, shown — each in your voice, each checked.' },
      { key: 'distribute', size: 'small', tone: 'mist', title: 'Distribution',
        plain: 'Published where your buyer actually is, at a cadence the evidence supports. The platform is a component.' },
    ],
    [
      { key: 'signal', size: 'small', tone: 'steel', title: 'Commercial signal',
        plain: 'Profile visits, replies, asset requests, named enquiries — recorded with their evidence class, never inflated.' },
      { key: 'learn', size: 'big', tone: 'night', title: 'Diagnosis, correction, learning',
        plain: 'Expected is read against actual. The weak link is named. One change goes back into the system and is retested.' },
    ],
  ],
  loop: 'Learning feeds the next round of intelligence and ideas.',
} as const;

export const expressions = {
  eyebrow: 'One idea. The right expressions.',
  headline: 'Idea first. Expression second.',
  body:
    'A single argument can become a written post, a short video, a document, a proof asset, a deeper ' +
    'educational piece, a diagnostic that captures demand, and something that nurtures the people who ' +
    'are not ready yet. Each measured on its own; all read together as one idea being tested.',
  thesis: {
    label: 'Root thesis · illustrative',
    text: 'Transformation programmes fail before the technology is chosen: the decision process was never redesigned.',
  },
  frames: [
    { kind: 'post', label: 'Written authority post', line: 'Three signs the decision path, not the tool, is the problem.', why: 'Make the argument easy to encounter.' },
    { kind: 'video', label: 'Short-form video', line: 'Open on the failure. Then the one question that would have saved it.', why: 'Let buyers hear the judgement behind it.' },
    { kind: 'doc', label: 'Document / carousel', line: 'Technology first · decision process untouched · where it breaks · what to redesign.', why: 'Make the thinking useful enough to keep.' },
    { kind: 'proof', label: 'Proof asset', line: 'How the method was applied, described without a client’s name until they agree.', why: 'Make the claim easier to believe.' },
    { kind: 'deep', label: 'Deep educational asset', line: 'The full argument, with the trade-offs and the exceptions.', why: 'Give the serious buyer the whole thing.' },
    { kind: 'diagnostic', label: 'Demand-capture diagnostic', line: 'Five questions that tell a buyer whether this is their problem.', why: 'Give the ready buyer something useful to ask for.' },
    { kind: 'nurture', label: 'Nurture asset', line: 'For the buyer who is right, but not yet.', why: 'Stay familiar until the timing is right.' },
  ],
  caveat: 'Not every client gets every format. The mix is prescribed after diagnosis, and a derivative is not a new idea.',
} as const;

export const movement = {
  eyebrow: 'Attention to commercial movement',
  headline: 'Reach is not the result.',
  body:
    'Threadline optimises for commercially valuable attention, not just reach. A piece that travels to ' +
    'the wrong room is a targeting result, however good the numbers look.',
  steps: [
    { label: 'Right-buyer attention', note: 'The people who could buy notice.' },
    { label: 'Proof, profile, destination', note: 'They inspect what you have shown.' },
    { label: 'Response or permission', note: 'A reply, a request, a follow.' },
    { label: 'Human conversation', note: 'A person talks to a person.' },
    { label: 'Opportunity', note: 'Recorded with its evidence class.' },
  ],
  honesty:
    'Not every impression becomes revenue, and we do not pretend otherwise. Each step is recorded as ' +
    'what it was — observed, inferred or confirmed — never upgraded by arithmetic.',
} as const;

export const diagnosis = {
  eyebrow: 'How the system learns',
  headline: 'Expected. Actual. Why. Change. Retest.',
  body:
    'Before a piece goes out we write down what we expect. After it has travelled we read what ' +
    'happened against that expectation, name the most likely reason for the gap, change one thing, ' +
    'and run it again.',
  illustrative: 'Illustrative cases — not client results.',
  states: ['Expected', 'Actual', 'Why', 'Change', 'Retest'] as const,
  /** The parts of a piece the diagnosis can isolate. One of them fails per case. */
  components: ['Idea', 'Hook', 'Distribution', 'Audience', 'Destination'] as const,
  cases: [
    {
      key: 'hook',
      title: 'Good idea, weak hook',
      failing: 'Hook',
      gauges: ['Relevance', 'Opening', 'Signal'] as const,
      expected: [82, 74, 70],
      actual: [84, 38, 24],
      after: [84, 71, 58],
      why: { verdict: 'Idea held. Hook failed.', lines: ['Buyer relevance: strong', 'First line: lost most readers before the argument', 'Distribution: as planned'] },
      change: { verdict: 'Rewrite the hook. Keep the thesis.', control: 'Hook rewritten around the failure it describes', lines: ['Proof moved to the second line', 'Same root idea, same audience, same route'] },
      retest: { verdict: 'Opening recovers. Signal follows.', lines: ['Read again after fourteen days', 'Verdict recorded against the same root idea'] },
    },
    {
      key: 'audience',
      title: 'High reach, wrong audience',
      failing: 'Audience',
      gauges: ['Reach', 'Buyer fit', 'Signal'] as const,
      expected: [40, 80, 70],
      actual: [96, 28, 20],
      after: [52, 76, 61],
      why: { verdict: 'Idea travelled. To the wrong room.', lines: ['The framing reached peers, not buyers', 'Commercial signal: near zero', 'Positioning: too general to select the room'] },
      change: { verdict: 'Reframe for the buyer’s problem.', control: 'Rewritten for the buyer’s decision, not the profession’s debate', lines: ['Distribution narrowed to where buyers are', 'Success redefined as the right responses'] },
      retest: { verdict: 'Less reach. More buyers.', lines: ['Retested for signal, not reach', 'Recorded against the same root'] },
    },
    {
      key: 'destination',
      title: 'High saves, no destination',
      failing: 'Destination',
      gauges: ['Saves', 'Relevance', 'Signal'] as const,
      expected: [50, 78, 66],
      actual: [88, 82, 12],
      after: [84, 82, 63],
      why: { verdict: 'The piece worked. It led nowhere.', lines: ['Buyers kept it and moved on', 'No proof, profile or asset to go to next', 'The signal had nowhere to land'] },
      change: { verdict: 'Give the reader somewhere to go.', control: 'A method asset and a diagnostic added as the next step', lines: ['Profile rewritten as the buyer’s problem', 'Same piece, same audience'] },
      retest: { verdict: 'Same attention. Now it moves.', lines: ['Asset requests recorded with their evidence class', 'Read at fourteen days'] },
    },
  ],
  note: 'Inference is labelled as inference. A bad week reads as a bad week.',
} as const;

export const cycle = {
  eyebrow: 'The twelve-week learning cycle',
  headline: 'Real market evidence, not a promise about algorithms.',
  body:
    'Threadline runs in four-week service periods. The first engagement is three of them, because ' +
    'that is how long it takes to learn a founder, a buyer and a content combination honestly.',
  phases: [
    { label: 'Establish', note: 'Brand brain, research, first signals, first pieces out. Expectations written before anything ships.' },
    { label: 'Calibrate', note: 'Diagnoses become corrections. The weakest link gets pressed on. Output settles into a rhythm you can keep.' },
    { label: 'Refine', note: 'The theses that earned attention get more of it. Derivatives multiply the winners.' },
    { label: 'Concentrate', note: 'The system knows things about your market nobody else has written down. It concentrates on them.' },
  ],
  legend: { hypotheses: 'Hypotheses', validated: 'Validated patterns' },
  note: 'We do not say the algorithm needs ninety days. We say the learning does. No revenue is promised.',
} as const;

export const comparison = {
  eyebrow: 'The honest comparison',
  headline: 'You could just hire a ghostwriter.',
  body:
    'Each alternative does real work. The difference is what surrounds the content: distribution, ' +
    'commercial learning and diagnosis. These are capability descriptions, stated carefully, not a ' +
    'measured result.',
  capabilities: ['Output', 'Distribution', 'Commercial signal', 'Diagnosis', 'Learning'],
  rows: [
    { label: 'Ghostwriting', fill: [1, 0, 0, 0, 0], note: 'writes the posts' },
    { label: 'Content production', fill: [1, 0.5, 0, 0, 0], note: 'produces, sometimes publishes' },
    { label: 'Internal execution', fill: [0.5, 0.5, 0.5, 0, 0], note: 'depends on who you hire and keep' },
    { label: 'Personal-brand service', fill: [1, 0.5, 0, 0, 0], note: 'optimises for reach' },
    { label: 'Threadline', fill: [1, 1, 1, 1, 1], note: 'output + distribution + commercial learning + diagnosis', own: true },
  ],
  legend: { full: 'Built in', half: 'Sometimes / depends', empty: 'Typically not' },
} as const;

export const fit = {
  eyebrow: 'Who it is for',
  headline: 'Built for a specific kind of firm.',
  good: [
    'Expert-led business where judgement is what clients buy',
    'Meaningful deal value, so one conversation matters',
    'Proven expertise with a real offer behind it',
    'A trust-heavy sale',
    'Commercial capacity to take on more of the right work',
    'Willing to talk, record and approve every week',
    'Wants authority, not virality',
  ],
  bad: [
    'Wants guaranteed virality',
    'Wants fake engagement or engagement pods',
    'Wants spam automation',
    'Refuses founder input',
    'Low-value commodity offer',
    'Cannot service additional demand',
  ],
} as const;

export const closing = {
  headline: ['Your expertise already wins the work.', 'The question is whether the market sees enough of it.'],
  body: 'A small number of firms at a time. Applications are read by a person and answered either way.',
  cta: { label: 'See if Threadline fits', href: links.apply },
  outputs: ['Authority', 'Familiarity', 'Qualified demand', 'Learning'],
  taller: 'One layer taller',
} as const;

/**
 * The six-cell summary of the managed service. Every `figure` is a value
 * statement until a verified client metric replaces it (then `evidence`
 * carries the ledger id). No cell may carry a number that was not measured.
 */
export const grid = {
  eyebrow: 'The system at a glance',
  headline: 'One managed loop around the expertise you already have.',
  cells: [
    { figure: '4', title: 'Founder touchpoints', line: 'Talk. Record. Approve. Sell.', inverse: false, evidence: null },
    { figure: '1 system', title: 'Expertise → authority → learning', line: 'One managed loop, not a content calendar.', inverse: true, evidence: null },
    { figure: 'Multi-format', title: 'The idea determines the expression', line: 'No platform quota disguised as strategy.', inverse: false, evidence: null },
    { figure: 'Buyer-first', title: 'Commercial attention over empty reach', line: 'The people who matter, matter more.', inverse: false, evidence: null },
    { figure: 'Expected → actual', title: 'Diagnosis built into the cycle', line: 'Reality changes the next decision.', inverse: false, evidence: null },
    { figure: 'Low burden', title: 'Threadline runs the machine', line: 'Senior expertise stays where it is valuable.', inverse: false, evidence: null },
  ],
} as const;

export const footer = {
  wordmark: 'Threadline',
  /** Link columns come from `FOOTER` in public-site.ts, the production site's map. */
  line: 'You talk. You record. You approve. You sell. Threadline handles the machine.',
  copyright: '© 2026 Threadline. Founding client programme.',
} as const;

export const apply = {
  eyebrow: 'Founding client programme',
  headline: 'Apply for a diagnosis, not a pitch.',
  body:
    'Three short questions. Your answers tell us where demand is actually constrained — and on ' +
    'several of the dimensions we look at, more content would make the problem more expensive, not smaller.',
  questions: [
    { label: 'What do you sell, and to whom?', hint: 'The offer, roughly what it costs, who buys it.' },
    { label: 'Where does your expertise live today?', hint: 'Calls, decks, delivery, one partner’s head — be honest.' },
    { label: 'What would a good outcome look like in twelve weeks?', hint: 'Not a number. A situation.' },
  ],
  submit: 'Send the application',
  reassurance: 'Read by a person. Answered either way — including when the answer is that we are not the right fit, and why.',
  fallback: 'Or write to us directly:',
} as const;

const site = {
  brand, links, nav, hero, material, problem, memory, burden, workshop, expressions,
  movement, diagnosis, cycle, comparison, fit, closing, footer, apply,
};
export default site;
