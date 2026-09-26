/**
 * The interactive Playbook: the things to do inside each chapter of The
 * Founder Authority System. The chapter text itself (title, summary, key
 * idea, the card to turn, the practice) stays in PLAYBOOK in public-site.ts;
 * this file holds the objects a reader can tap, sort, build, pick and drag.
 * Rules: no pricing, no promised outcomes, no invented client results;
 * anything illustrative says so.
 */

export const PLAYBOOK_HERO = {
  eyebrow: "A resource, not a pitch",
  title: ["The Founder", "Authority System"],
  lead: "How expert-led firms turn what they know into work the market wants, learn from what comes back, and become the obvious call. Ten short chapters, each with something to do. No email wall.",
  start: { label: "Start the playbook", href: "#chapter-1" },
  meta: "About 20 minutes, fully interactive",
  facts: [
    ["10", "chapters"],
    ["9", "things to try"],
    ["2", "tools"],
    ["0", "vanity metrics"],
  ],
} as const;

export const MAXIMS = ["Evidence before ideas", "Expected before published", "Change one thing, then retest", "Familiar, not famous", "A bad week reads as a bad week", "Platforms are components, not the strategy"] as const;

/** Chapter 01: what counts as raw material. Tap a crate. */
export const RAW_MATERIAL = [
  { front: "Opinions", back: "Opinions you would defend in a room of peers. The ones you soften in proposals." },
  { front: "Stories with a number", back: "A client situation with a figure in it: the budget, the delay, the saving, the thing that nearly went wrong." },
  { front: "Mistakes you paid for", back: "What you got wrong once and never again. Buyers trust scar tissue more than credentials." },
  { front: "Questions asked twice", back: "Anything two clients asked in the same month. If they asked, the market is asking." },
  { front: "Unnamed frameworks", back: "The way you always structure the first meeting, the diagnosis, the plan. It has steps. It has no name yet." },
  { front: "The second-call sentence", back: "The thing you say on every second call to explain why the obvious approach fails. That is a thesis." },
] as const;

/** Chapter 02: the one-sentence test. */
export const SENTENCE = {
  frame: ["We help", "solve", "by"],
  buyers: ["boards about to buy a transformation programme", "founders of specialist consultancies", "operations directors in mid-market manufacturers", "in-house legal teams at growth-stage companies"],
  problems: ["choosing the technology before the decision process is fixed", "selling expertise the market cannot see", "a supply chain that only works when nothing changes", "contracts that arrive faster than the team can read them"],
  mechanisms: ["a decision-process review before the vendor is chosen", "a managed authority system that learns from the market", "a constraint audit run with the plant, not about it", "a triage method that names what needs a lawyer"],
  verdicts: {
    decided: "Decided. One buyer, one problem, one mechanism. Content can amplify this.",
    list: "Not decided yet. A comma-list means the position is still a menu; content will be watched by nobody in particular.",
    empty: "Fill the three blanks. If you cannot, the position is the work, not the content.",
  },
} as const;

/** Chapter 03: where the language lives. Open each drawer. */
export const LANGUAGE_SOURCES = [
  { title: "Discovery-call notes", body: "The first ten minutes, before you start explaining. Write down the words they used for the problem, not yours." },
  { title: "Support and delivery emails", body: "What clients ask after they have bought. That is what the next buyer is worried about before they buy." },
  { title: "The comment under a competitor's post", body: "The reply that got more replies than the post. It is the market disagreeing in public." },
  { title: "The sentence that made you wince", body: "Because it was true. Keep it; it is the opening line of the piece you have been avoiding." },
  { title: "The objection before the price", body: "Whatever they say just before they ask what it costs. That is the real question." },
] as const;

/** Chapter 04: thesis or topic? Sort the cards. */
export const SORT_CARDS = [
  { text: "Sales forecasting", kind: "topic", why: "A subject. Nobody can disagree with it, so nobody can react to it." },
  { text: "Your forecast is a feeling, not a number, and the board can tell.", kind: "thesis", why: "An argument a buyer could disagree with. That is why it can be tested." },
  { text: "Digital transformation", kind: "topic", why: "A category. It has no edge to push against." },
  { text: "Transformation programmes fail before the technology is chosen, because the decision process was never redesigned.", kind: "thesis", why: "A cause, a claim and a consequence. It can be wrong, so it can be learned from." },
  { text: "Leadership in uncertain times", kind: "topic", why: "A mood. It will be watched by nobody in particular." },
  { text: "Most firms measure content by reach because reach is the only number they can see.", kind: "thesis", why: "A diagnosis with a reason. A reader can say 'not us' and mean it." },
] as const;

/** Chapter 05: choose the rooms, then make the route measurable. */
export const ROOMS = ["Where they read on the commute", "Where their peers argue in public", "The newsletter they forward", "The conference they never miss", "The document they ask for", "The call, when it comes"] as const;
export const ROUTE_RULE = {
  observable: "Observable later. A tracked link and a way to get in touch mean the commercial result can be read against what you expected.",
  half: "Half observable. You will know a buyer came, or that a buyer wrote, but not both. Say so now.",
  blind: "Not observable. It can still be worth publishing, but write down now that its result will be an anecdote, not evidence.",
} as const;

/** Chapter 06: famous versus familiar. Scrub the encounters. */
export const ENCOUNTERS = [
  { state: "Stranger", piece: "A post", note: "Read on the train, half-remembered. Nothing to hire yet." },
  { state: "Recognised", piece: "A note", note: "Kept at the desk for the argument in it. The name means something now." },
  { state: "Remembered", piece: "A short video", note: "Sent to a colleague with one line. Your position is being repeated by someone else." },
  { state: "Trusted", piece: "A proof note", note: "Answered a question in a board meeting. You were in the room without being there." },
  { state: "Conversation", piece: "A call", note: "When the problem finally arrived, it was obvious who to call." },
] as const;

/** Chapter 07: evidence classes, in order. */
export const EVIDENCE = [
  { name: "Directly tracked", strength: 100, example: "A click on the measured link, then a form, then a booked call." },
  { name: "Buyer named the piece", strength: 82, example: "“I saw your post about the decision process.” Written down, with the date." },
  { name: "Multi-touch", strength: 60, example: "Three encounters over two months, then an enquiry. Probably related; not proven." },
  { name: "Associated in time", strength: 36, example: "An enquiry the week the piece went out. Suggestive. Never counted as more." },
  { name: "Qualitative only", strength: 18, example: "“We keep hearing your name.” Real, and unmeasurable." },
] as const;
export const EVIDENCE_NOTE = "A report that adds these into one number is hiding the difference. Threadline records each signal with its class and never rounds up.";

/** Chapter 08: the expectation card. */
export const EXPECTATION = {
  measures: ["replies from buyers", "requests for the document", "profile visits from the right firms", "saves and forwards", "a named enquiry"],
  reasons: ["the opening line names the buyer's problem", "it argues something a buyer could disagree with", "it is going to the room where this buyer reads", "it carries a proof the buyer can check", "honestly, I am not sure"],
  note: "Read it in fourteen days, against what actually happened. Not before.",
} as const;

/** Chapter 10: what is a proxy and what is the job. Flip each card. */
export const PROMISES = [
  { front: "Leads?", back: "Not the scoreboard. The market decides, and the market is not a machine." },
  { front: "Views?", back: "Not the scoreboard. Reach is a proxy; a named enquiry is a result." },
  { front: "Followers?", back: "Not the scoreboard. Familiar with the right forty beats famous with everyone." },
  { front: "Research done?", back: "Always. Every idea starts from what buyers actually ask." },
  { front: "Every claim checked?", back: "Always. Nothing with an unverified fact can be recorded." },
  { front: "A bad month shown?", back: "Always. The report shows a bad week as a bad week." },
] as const;

/** The three periods of a first engagement, stated without promises. */
export const PERIODS = [
  { label: "Period 1", weeks: "Weeks 1–4", title: "It starts quietly.", body: "We learn you, one buyer and one content combination. Root ideas go out, expectations are written down, and the first readings come in." },
  { label: "Period 2", weeks: "Weeks 5–8", title: "The evidence starts arriving.", body: "Visits, saves, replies. Each is read against what we expected, one thing is changed and the same idea goes out again. The operation gets sharper every week." },
  { label: "Period 3", weeks: "Weeks 9–12", title: "The loop is running.", body: "The weekly report shows what is true for your market: which idea travels, which room answers, which opening line lands. From here the system compounds." },
] as const;
export const PERIODS_NOTE = "Three four-week periods, because that is how long it takes to learn a founder, a buyer and a content combination honestly. No result is promised for any of them."; // claim:C-CADENCE, C-NO-PROMISES
