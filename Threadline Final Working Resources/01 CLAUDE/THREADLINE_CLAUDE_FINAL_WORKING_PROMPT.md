THREADLINE — CLAUDE FINAL WORKING PROMPT

Treat this prompt as the current source of truth for the next implementation pass. It supersedes conflicting execution instructions in older V11–V14 Claude prompts, but does NOT authorise a rebuild. Preserve working code and completed features unless this prompt explicitly requires a change.

FIRST — INSPECT BEFORE CHANGING CODE  
Read the latest repo HANDOFF, ARCHITECTURE, PRODUCT\_SPEC, DATA\_MODEL, BUILD\_CHECKLIST, ACCEPTANCE\_TESTS and FUTURE\_BACKLOG. Inspect actual routes, models, tenancy/capability abstractions, audit behaviour, AI provider abstraction, fact/citation gates, integration-state handling and current operator/client surfaces.

DO NOT:  
• rebuild the application;  
• create duplicate domain models merely to mirror business wording;  
• break multi-tenancy, capability checks, audit trails, fact verification, honest integration states or one-codebase architecture;  
• create fake CRM/social/calendar/email connections;  
• build a generic CRM, email client, calendar, contact manager or social publisher;  
• add speculative product features unrelated to the task below.

BUSINESS SOURCE OF TRUTH  
Threadline is a high-end done-for-you managed content-growth service, not SaaS access.  
Immediate promise: “You already have the expertise. We turn it into content people actually want to watch.”  
Deeper outcome: “We run the system around it so that content compounds into authority and qualified demand.”  
Founder/client role: talk, record, approve, sell. Threadline runs the surrounding machine.  
Commercial hypothesis: £2,500 implementation \+ £2,500/month, 3-month initial engagement, one offer at launch.  
No revenue/views/leads/calls/virality guarantees.  
Expert-led B2B is an umbrella category; one active wedge/problem is validated before scaled acquisition.

METHODOLOGY AUTHORITY  
1\. founder-locked Threadline decisions;  
2\. reviewed Charlie Morgan / Imperium course principles;  
3\. real Threadline market/client/funnel/load evidence;  
4\. Daniel Fazio course only as tactical supplementation;  
5\. official technical/legal/platform facts.

THIS PASS HAS ONE CORE PURPOSE  
Turn the existing Threadline SOP library into an operator-only Living SOP Engine / Operating Cockpit so the founder does not have to remember which SOP applies or reread PDFs to know what to do next.

EXTERNAL CRM DECISION  
Do NOT build a replacement CRM.  
Assume an external CRM such as Attio (preferred) or Pipedrive handles contacts, companies, communications, broad pipeline and deal history.  
Threadline may store/link an external CRM record ID/URL, but the proprietary system is the state-driven methodology and execution layer.

CORE PRODUCT REQUIREMENT — LIVING SOP ENGINE  
Every relevant prospect/deal/workflow record must have, using existing concepts wherever possible:  
• current state;  
• owner;  
• tier where relevant;  
• next action;  
• due date;  
• required checklist items;  
• completion criteria;  
• allowed next states;  
• linked scripts/templates/resources;  
• notes/evidence;  
• audit history;  
• timestamps;  
• external CRM record ID/URL when relevant.

HARD INVARIANT  
No active record may exist without a next action and due date.  
If the existing domain model makes a literal hard database constraint inappropriate, enforce the invariant at the service/domain transition layer and cover it with tests.

TODAY / OPERATING COCKPIT  
Create or upgrade the operator landing experience so the founder opens Threadline and immediately sees actionable queues rather than static information.  
Surface:  
1\. today’s mathematically required qualified first-touch quota;  
2\. completed vs remaining first touches;  
3\. A-tier prospects requiring research/pre-completed value/Loom;  
4\. B-tier prospects ready for outreach;  
5\. replies requiring classification/action;  
6\. follow-ups due;  
7\. sales calls today;  
8\. booked calls with incomplete pre-call prep;  
9\. proposal/deal follow-ups;  
10\. overdue actions;  
11\. existing client blockers/approvals/proof items if current data models already support them.

Prioritise by commercial urgency and due date. Make the page understandable in seconds. Avoid vanity metrics and dashboard bloat.

REVERSE-ENGINEERED ACQUISITION  
Implement a small acquisition target/control component if no equivalent already exists.  
Inputs:  
• target wins;  
• remaining acquisition workdays;  
• booking rate;  
• show rate;  
• qualification rate;  
• close rate.  
Outputs:  
Required first touches \= target wins ÷ (booking × show × qualification × close).  
Daily quota \= remaining required touches ÷ remaining acquisition workdays.

Rules:  
• distinguish placeholder assumptions from actual Threadline rates;  
• allow rates to be updated weekly;  
• show required vs completed activity;  
• track channels separately where existing architecture supports source/channel cleanly;  
• if calculated quota becomes extreme, warn that the funnel should be diagnosed rather than merely increasing volume.

V1 WORKFLOW TEMPLATES — IMPLEMENT NOW  
Use existing workflow/task/checklist concepts if available. Do not create parallel systems if the repo already has appropriate abstractions.

A. MARKET VALIDATION  
CANDIDATE\_WEDGE → IMMERSION → INTERVIEWS → COMMERCIAL\_RESPONSE\_TEST → VALIDATED / REVISE.  
State checklists should capture evidence rather than just a checkbox label.  
Commercial-response testing is a secondary validation layer after qualitative problem validation.

B. PROSPECT QUALIFICATION  
NEW\_PROSPECT → QUALIFY → QUALIFIED\_A / QUALIFIED\_B / NOT\_FIT.  
Qualification should support wedge fit, economics/ability to pay, visible/likely problem, reachability and context quality.

C. QUALIFIED\_A  
Checklist:  
• website reviewed;  
• founder/content reviewed;  
• one specific achievement/content asset found;  
• likely constraint hypothesis recorded;  
• one useful market/content/competitor opportunity identified;  
• pre-completed-value asset prepared;  
• Loom recorded if justified;  
• outreach sent;  
• next action/due date set.  
Then transition to CONTACTED.

D. QUALIFIED\_B  
Checklist:  
• enough real research to make outreach specific and truthful;  
• outreach sent;  
• next action/due date set.  
Then CONTACTED.

E. REPLY CLASSIFICATION / REPLY-TO-BOOKING  
CONTACTED → REPLIED → one of:  
INTERESTED / CURIOUS / SEND\_INFO / NOT\_NOW / OBJECTION / REFERRAL / NOT\_FIT / BOOKED.  
Each state should display a concise objective and action checklist. Do not generate manipulative scripts. Leave room for real human conversation and store learnings from actual replies.

F. PRE-CALL PREPARATION  
BOOKED → CALL\_READY.  
Required checklist:  
• application / prior conversation reviewed;  
• business model/economics reviewed;  
• current content reviewed;  
• primary constraint hypothesis recorded;  
• only relevant Threadline demo/proof prepared;  
• reminder status confirmed.

G. SALES STATE MAP  
Provide an operator-facing state/checklist view for:  
OPEN → ECONOMICS → CURRENT\_STATE → DESIRED\_STATE → CONSTRAINT → CONSEQUENCE → PRESCRIPTION → DEMO → COMMERCIALS → DECISION.  
The wording must remain flexible; the required information should be visible.  
At call completion require one end state:  
WON / FOLLOW\_UP / PROPOSAL\_PROCESS / NOT\_FIT / LOST.  
Require exact VOC/objection notes and next action/due date for every active outcome.

SALES RULES EMBEDDED IN UI COPY  
• never pitch before diagnosis;  
• do not ask the buyer to invent their own package;  
• arrive with recurring-problem hypotheses once the niche is validated, but never fake certainty;  
• only demo modules relevant to the diagnosed constraint or material objection;  
• use economics to establish whether the problem is worth solving, not to promise outcomes;  
• treat genuine no-fit as a correct outcome.

FAZIO TACTICAL ADDITIONS TO REFLECT  
Do not change core methodology, but ensure the workflow supports:  
• A/B/C-style prospect effort segmentation (A/B is enough for V1 UI);  
• pre-completed-value outreach for A-tier prospects;  
• competence-display assets before strong case studies;  
• reply-to-booking as a measured stage;  
• economic-fit qualification;  
• constraint-relevant demos;  
• proof-interview trigger as a future workflow;  
• source-to-multi-asset repurposing as an existing/future content capability where it naturally fits;  
• editing-style profiles and structured paid-test editor hiring only if existing models already make a light implementation easy. Otherwise document as future workflow, do not overbuild.

SOP RENDERING PRINCIPLE  
Do not make the operator open a long SOP document to work.  
For the current state show:  
• what this state means;  
• why it matters;  
• exact checklist;  
• short scripts/examples only when genuinely helpful;  
• completion criteria;  
• next action / allowed next states;  
• optional link to long-form SOP.

STATE TRANSITION BEHAVIOUR  
When checklist requirements are satisfied:  
• enable valid next-state transitions;  
• automatically generate a sensible default next action \+ due date where deterministic;  
• log who changed what and when;  
• display missing required evidence before irreversible transitions;  
• allow manual override only with a reason;  
• never auto-send outreach, auto-publish content or make strategic judgments without explicit human action.

CLIENT RESULTS \+ ATTRIBUTION — MASTER CEO HUB ARCHITECTURE  
The broader CEO Hub must ultimately answer not only “what do I do next?” but also “is Threadline creating commercially valuable attention for each client?” Architect this now, but do not overbuild integrations before client \#1.

For each active client, support/link a measurement state and tracking health:  
• BASELINE\_PENDING / BASELINE\_READY;  
• TRACKING\_SETUP\_PENDING / TRACKING\_READY;  
• ACTIVE\_MEASUREMENT;  
• COMMERCIAL\_SIGNAL\_DUE;  
• PROOF\_READY.

Minimum measurement model:  
• Day-0 baseline for prior 30–90 days where available: founder hours, output, production/approval cycle, platform metrics, profile/site traffic, enquiries, booked calls, qualified opportunities, pipeline and closed-won revenue;  
• each baseline field labelled MEASURED / CLIENT\_REPORTED / UNAVAILABLE;  
• every published asset gets a persistent content/asset ID tied to client, channel, publish date, live URL, pillar/theme, CTA and destination;  
• use tracked links/UTMs for owned destinations where possible;  
• external CRM stores source plus opportunity/deal value where available;  
• booking/application source question captures “how did you hear about us / what content did you see?”;  
• weekly client Commercial Signal Capture collects DMs, enquiries, booked calls, opportunities and sales Threadline cannot observe automatically;  
• pull native platform analytics on a consistent cadence.

Separate results into four layers:  
1\. OPERATIONAL — founder hours, output, cycle time, approval time, revision/coordination burden;  
2\. ATTENTION — views, retention/watch time, saves, shares, comments, profile visits, audience quality;  
3\. COMMERCIAL INTENT — tracked clicks, opt-ins, DMs, enquiries, booked calls;  
4\. COMMERCIAL OUTCOME — qualified opportunities, pipeline and closed-won value where observable.

Attribution classes must be explicit:  
DIRECTLY\_TRACKED / BUYER\_NAMED\_CLIENT\_ATTRIBUTED / MULTI\_TOUCH\_INFLUENCED / ASSOCIATED\_CORRELATED / QUALITATIVE\_ONLY.  
Preserve first-touch and last-touch separately where supported. Never imply causal revenue attribution when evidence only supports influence/correlation.

The CEO Hub should expose a Results/Proof lane with client tracking health, stale/missing data alerts, current attributed/influenced pipeline and proof opportunities. When data quality supports it, calculate useful normalized metrics such as booked calls per 10k views, qualified pipeline per 10k views, revenue per asset and commercial value by topic/pillar/CTA. Hide/disable monetary efficiency when attribution quality is inadequate.

Do not build a generic analytics platform, but DO build/upgrade native Threadline attribution to produce the commercially useful outputs a client needs from a Trakyo-like attribution layer. Aim for outcome parity for Threadline's use case, not product breadth: tracked content journeys, first-touch, last-touch, linear multi-touch, form/opt-in/booking capture, opportunity/pipeline/revenue linkage, lead journey, and reporting by asset/topic/pillar/hook/CTA/platform where the existing data model supports it. Preserve evidence-strength labels and causal honesty. External attribution providers may later plug into the same normalized evidence model.

BUILD ONLY WHAT EARNS ITS PLACE  
V1 now: market validation, prospect qualification, A/B outreach, reply handling, pre-call prep, sales state map, Today queue, acquisition quota logic.  
Do NOT build full onboarding/delivery/proof/renewal workflow automation from scratch in this pass if equivalent modules do not already exist. The existing client/delivery modules should remain working. Real client \#1 use will earn deeper workflow encoding.

DESIGN  
Keep Threadline’s existing premium dark operator-software visual language.  
The Today screen and workflow cards should feel operational and calm, not like a crowded enterprise CRM.  
Use progressive disclosure. Clear primary action. Strong status hierarchy. Mobile-readable task queue.

TESTING / ACCEPTANCE  
Add/adjust tests for:  
• tenancy/capability boundaries;  
• active-record next-action/due-date invariant;  
• valid/invalid state transitions;  
• checklist completion gating;  
• automatic next-action creation where implemented;  
• acquisition quota calculations and edge cases;  
• client/operator visibility where new UI touches shared records;  
• audit events for state changes;  
• existing tests must remain green.

VERIFY  
Run the repo’s standard verification commands from HANDOFF/package scripts: typecheck, lint, tests, build and any relevant migration/seed checks.  
Perform focused browser QA of the new Today view and workflow progression.  
Do not claim completion if a check did not actually run.

HANDOFF UPDATE  
Update HANDOFF.md and any relevant architecture/product/acceptance docs with:  
• what was added;  
• exact states/workflow abstraction used;  
• external CRM philosophy;  
• acquisition quota logic;  
• known limitations;  
• browser QA still needed, if any;  
• commands/tests run and actual outcomes;  
• explicit next step: external market validation/acquisition, not more optional building.

FINAL PRINCIPLE  
This pass exists to make Threadline executable day-to-day. When complete, the founder should be able to open the app and know exactly what the next highest-value action is for every active prospect without remembering the SOP library.

POST-FINAL DELTA — 6 SEPTEMBER 2026  
The Living SOP / cockpit work above has now substantially shipped. For the next bounded implementation pass, the current priority is Threadline Attribution V1.5 plus any minimal support needed for the Synthetic Client Dry Run. This delta supersedes older language saying attribution should remain only optional/manual.

Build commercially useful attribution outputs, not a standalone attribution SaaS. Required capabilities: persistent content IDs \+ tracked redirect links; touchpoint/session journey; first-touch; last-touch; linear multi-touch; form/opt-in conversion capture; booking capture; opportunity/pipeline/closed-revenue linkage; CRM/payment/manual evidence mapping; lead journey timeline; client reporting by asset/topic/pillar/hook/CTA/platform/campaign where fields exist; attribution/data-quality strength; client Results \+ monthly-report integration; and strategy feedback into what to make more/less of next cycle.

Explicit non-goals unless real client demand later earns them: every external connector, ad attribution, browser/device fingerprinting, deterministic cross-device identity, elaborate ML/weighted attribution, generic analytics warehouse, or recreating Trakyo as a business.

Synthetic Client support should be operational rather than theatrical: allow one test client/workspace to run the real fulfilment path, log actual task time/cost/owner where existing architecture makes this light, and let the operator compare AI-heavy vs human vs hybrid production externally. Do not build a video editor into Threadline.

Preserve all current architecture, tenancy, evidence, security, audit and truthful-integration rules. Reuse existing models before adding new ones. Do not rebuild completed modules. Update HANDOFF and relevant product/data/acceptance docs with exact implementation, migrations, tests, QA and known limits.  
