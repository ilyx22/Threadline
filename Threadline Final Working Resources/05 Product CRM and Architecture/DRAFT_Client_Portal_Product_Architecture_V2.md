# DRAFT - BRANDING PENDING

**Status:** Internal working document. Not final. Not client-ready until Threadline branding/logo, legal/commercial review where relevant, and real-client validation are complete.

---

# Threadline Client Portal Product Architecture V2

## Recommendation in one sentence
Use **one Threadline product/data model with two deliberately different surfaces**: an operator workspace for running the machine and a client portal for decisions, approvals, deliverables and value visibility.

## Why not give clients the full operator portal?
The operator needs raw evidence, rejected candidates, internal tasks, vendor notes, confidence debates, time/cost data and exceptions. Exposing these creates cognitive load and invites micromanagement without improving client decisions.

## Why not build a completely separate application?
A separate app duplicates state, permissions, QA, analytics and integration logic. The separation should be in server-enforced capabilities and presentation, not duplicated data.

## Industry pattern
Modern agency client-portal products emphasize structured requests, status visibility, files, feedback/approvals, billing/reporting and white-label presentation, while explicitly separating client-visible work from internal capacity/staff notes. Threadline should adopt that pattern while keeping its unique Intelligence/Diagnosis layer.

## Client information architecture
### 1. Home - `What needs my attention?`
Above the fold:
- `Record 4`;
- `Approve 2`;
- `Decide 1`;
- next deadline;
- current cycle status;
- one useful result/learning.

### 2. Threadline is working on...
Real computed proof of activity, e.g.:
- market sources reviewed;
- approved signals in strategy;
- scripts in draft/review;
- assets in edit;
- posts scheduled/live;
- experiments currently running.
Never fabricate counts. Every number resolves to real records.

### 3. Recording Room
Only recording-ready work, instructions, teleprompter/outline, setup checklist and upload status.

### 4. Approvals
One place for script and media approvals. Consolidated feedback, version status and clear deadline. Track approval cycle time as an operational metric.

### 5. Content / Calendar
Client-readable stages only: `Preparing`, `Needs You`, `In Production`, `Scheduled`, `Live`. Avoid internal sub-status noise unless it changes a client action.

### 6. Intelligence / Strategy
Curated published outputs:
- primary constraint hypothesis;
- 3-5 strongest findings;
- evidence/source inspection;
- tests being run;
- why they matter.
Do not expose raw noisy research or rejected candidates by default.

### 7. Results
Lead with business interpretation, not dashboards:
- what changed;
- what worked/didn't;
- qualified commercial signals;
- relevant platform metrics;
- baseline/comparison;
- what Threadline changes next.

### 8. Reports / Library / Integrations
Historical briefs/reports, approved assets, billing/plan if added, members and connection status.

## Internal-only operator surface
Keep hidden by default:
- rejected/unreviewed intelligence;
- internal QA comments;
- editor/vendor assignment and rates;
- Threadline margins/costs;
- AI prompts/provider spend;
- operator time tracking;
- incident/debug logs;
- private client-health notes;
- internal sales/acquisition data;
- tentative diagnosis before publication.

## Permission architecture
Use deny-by-default capability checks at server/repository and UI levels. Do not rely on simply hiding menu items. Recommended object visibility states:
- `INTERNAL`;
- `CLIENT_DRAFT`;
- `CLIENT_ACTION_REQUIRED`;
- `CLIENT_PUBLISHED`.
This gives Threadline an explicit publication boundary.

## Communication rule
The client portal should replace status-chasing, not human relationship. Weekly/monthly interpretation still matters. A client who never opens a dashboard should still understand the value during the recurring review.

## Build priority
Before client #1, do not redesign every page. Build the minimum client shell:
1. Home / action queue;
2. Recording;
3. Approvals;
4. Content status;
5. Results/report;
6. curated Intelligence brief.
Everything else can stay behind feature flags until real usage demands it.
