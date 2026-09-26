# Backend completion brief (owner, 26 September 2026)

This is the owner's implementation brief, stored verbatim so the work survives context compaction. The ledger (`BACKEND_COMPLETION_LEDGER.md`) tracks every requirement against it. Where the brief and the ledger disagree, the brief governs.

---

You are completing Threadline's backend and authenticated operating product. Implement the requirements below, test them, repair failures and document the result. This is an implementation task, not another proposal or audit-only exercise.
There is no arbitrary time or complexity constraint. Advanced capabilities are in scope. Work in dependency order and continue beyond first-client readiness until the full requested implementation is complete or a specific external dependency prevents verification. Do not label a missing feature “later” simply because a manual workaround exists. A manual route is a resilience requirement, not permission to skip its requested automated counterpart.
Use a durable implementation ledger so work survives context compaction. At each resumption read the ledger, inspect the actual Git state, and continue from the next unmet requirement. Do not repeat completed work. Do not endlessly expand the scope beyond this brief.

## 1. Authority, business model and immutable boundaries

### Sources and precedence
Read AGENTS.md where applicable, HANDOFF.md, README.md, architecture/data/product/acceptance/build/QA documents, docs/PLATFORM_APPLICATIONS.md, docs/audits/BACKEND_GAP_ANALYSIS_2026-09-25.md if present, FUTURE_BACKLOG.md, and the current implementation ledger. Inspect all relevant routes, actions, repositories, guards, jobs, providers, migrations and tests.
Use the Drive sources linked in this document if accessible. If not accessible, use the explicit strategy requirements in this brief and record the unavailable source. Never pretend you read it. Do not overwrite exact approved sales scripts with paraphrases.
Current explicit owner instructions govern scope. Current code governs what exists. The 26 September handoff governs approved frontend status. Current strategy governs service behaviour. Older “defer advanced work” or “stop at narrow v1” instructions are superseded by this request, while safe manual workflows and frontend preservation remain required. Verify platform behaviour against official documentation for the installed SDK/API version. Course/transcript claims are strategic inputs, not technical or legal authority.

### Business invariants
- Threadline is a premium managed authority/content service for expert-led B2B firms, supported by software. The client supplies expertise, records, approves and sells; Threadline operates the system.
- The current wedge is AI/digital-transformation/technology advisory businesses, primarily UK/US. Configure it; do not hardcode geography, niche or demographic assumptions as universal eligibility rules.
- One configurable founding offer: £2,500 implementation + £2,500 every four weeks, three initial service periods/12 weeks, £10,000 initial contract value. Preserve existing signed engagement terms when defaults change. Store currency and money precisely. Do not label four-week recurring revenue as monthly MRR without an explicitly labelled normalisation.
- Current delivery hypothesis: approximately 12–16 core short-form assets per four-week period, up to approximately three agreed channels. Platform derivatives are linked to a root and counted separately from core contracted assets. Scope is agreement-specific, never an invented guarantee.
- Video-led delivery with a written fallback; long-form/YouTube production can be enabled for an explicitly agreed pilot/custom scope. A connector supporting a channel does not grant entitlement to every service on that channel.
- Paid-ad management, websites, full funnels, email marketing, appointment setting, sales management, daily community management and unlimited revisions are not silently included. Software may support Threadline's acquisition and approved conversion workflows without selling those activities as client deliverables.
- Installation-led selling may emphasise tangible early deliverables. Disclose the full commercial commitment; never describe the implementation fee as a standalone purchase when the remaining engagement is mandatory. Do not introduce a free trial or change the offer automatically.
- Keep Threadline company-led where required by current identity preferences. Do not invent a founder persona, credentials, results or employment claims.
- Do not fabricate social proof. The public “100m+ views / 10,000+ conversions” claims require owner-supplied substantiation. Treat unresolved claims as a commercial readiness issue.

### Frontend and owner-work freeze
The approved public site is https://threadline-fawn.vercel.app. Do not redesign or rewrite it. Preserve homepage, public routes, playbook, calculator, application/sign-in presentation, legal-page presentation, copy, illustrations, styles, navigation, animations and QA baselines. Preserve uncommitted owner changes exactly.
Checkpoint Git state and protected-file hashes before editing. Application/auth backend wiring may change behind the unchanged presentation. Authenticated functional interfaces may change only to implement requirements, permissions, accessibility and usable workflows. No visual redesign cycle. Shared code, headers and middleware changes must be checked for public regressions even when public-file hashes stay unchanged.
Record required legal-copy/identity/claim changes precisely for the owner; do not silently change frozen public copy. A required unresolved correction must remain visible in the readiness verdict.

## 2. Audit once, create the implementation ledger, then execute
Record current branch/commit, modified/untracked files, actual deployed revision if accessible, environment names without secrets, installed versions, database provider, migration state, provider configuration and current tests. The earlier snapshot's 77 models/175 actions are orientation, not a specification or proof of completeness.
Create docs/implementation/BACKEND_COMPLETION_LEDGER.md. For each requirement record:
ID | user outcome | existing code | gap | dependencies | implementation status | tests/evidence | external gate | next action.
Distinguish EXISTING_VERIFIED, PARTIAL, MISSING, IMPLEMENTED_TESTED, EXTERNAL_CONFIGURATION_REQUIRED, PROVIDER_UNSUPPORTED, OWNER_DECISION_REQUIRED and LIVE_VERIFIED. A mock or credential-free contract test is not live verification. No unimplemented requirement may disappear through a renamed status.
Map every original prompt phase to this ledger. Reuse existing domain models/services. Split oversized files around real responsibilities as those areas are changed; finish the necessary refactoring after behaviour is connected. Avoid speculative frameworks, duplicate data stores and wholesale rewrites. Document the differences between signals, patterns, ideas, roots, expectations, diagnoses and corrections. Applied migrations remain immutable; preserve legacy migration history appropriately when establishing the PostgreSQL path.
Use staged work in this order: foundation/security → commercial conversion and identity → client/team workflow → delivery → automation/integrations → intelligence/learning → reporting/commercial lifecycle → full acceptance. First-client readiness is an intermediate milestone, not the stopping point.

## 3. Production infrastructure and recoverability
1. Establish managed PostgreSQL using existing suitable infrastructure, otherwise the proposed Neon adapter path. Create a valid provider-specific migration history matching the installed Prisma version; SQLite migrations cannot simply be replayed against PostgreSQL.
2. Determine whether existing databases contain real data. Preserve/export/transform it with reconciliation checks. Never reset, discard or overwrite unknown data. Test a clean PostgreSQL migration and the applicable upgrade/data-transfer route independently.
3. Use development/test PostgreSQL for database-sensitive acceptance. Document any intentionally retained SQLite-only development path; it cannot substitute for PostgreSQL tests.
4. Configure pooling/direct migration connections correctly for installed versions. Run migrations explicitly, not as a destructive side effect of app startup or every preview build. Separate seed/demo commands from deployment. Protect seeds from production and remove shared production credentials.
5. Keep Vercel for web hosting. Separate production, preview and tests across database, storage prefixes/buckets, provider credentials, email recipients, webhooks and jobs. Preview must never accidentally execute production work.
6. Validate required/optional environment variables; make unconfigured optional providers explicit. Health endpoints expose no secrets, private records or sensitive configuration. Internal health provides actionable diagnostics.
7. Use current suitable adapters for transactional email, private object storage, distributed throttling and monitoring; proposed defaults are Resend, S3-compatible R2, Upstash and Sentry. Avoid duplicate subscriptions when working equivalents already exist. Record external costs/configuration without purchasing unapproved services.
8. Configure automatic database backups and object retention/recovery appropriate to the actual provider. Document encryption-key recovery and access separately. Restore into an isolated environment and verify relational counts, file references and sample content. A scheduled backup setting is not a restore test.
9. Record owner-approved recovery objectives and retention. Until approved, mark them as pending rather than inventing a contractual promise. Provide deployment, rollback and forward-fix runbooks; a code rollback alone may not reverse schema changes.
10. Use structured redacted logs with request/tenant/job IDs, bounded retention, alert routing and health checks. Add actionable outage/dead-job/failed-email/storage/backup alerts. Public health and client UI must not reveal operational internals.

## 4. Identity, client teams and server-enforced access
Client team management is mandatory. Inspect and upgrade existing membership features; do not recreate a second membership subsystem.

### Required client responsibilities
Implement these permission profiles through the smallest clear extension of existing roles/capabilities. Profiles may combine explicitly for one person; no custom permissions-builder is required.

| Profile | Allowed responsibility | Boundaries |
| --- | --- | --- |
| Client workspace administrator | Invite/remove client colleagues, choose delegation, manage client preferences | Cannot create Threadline staff, rewrite internal strategy judgments or grant arbitrary global powers |
| Designated approver | Approve/request changes on assigned or authorised current content/strategy versions | Does not need team-administration powers; no automatic access to internal notes or billing |
| Contributor | Supply expertise, comments, recordings and requested assets; complete assigned inputs | Cannot finalise reports, publish, approve on behalf of someone else or change engagement scope |
| Viewer | Read authorised client-visible deliverables/status/reports | No mutation, generation or approval powers |
| Commercial contact | See authorised agreement/invoice/payment information and receive billing notices | Financial access is explicit, not automatically granted to every content collaborator |

A solo founder can hold the relevant profiles. Support more than one founder/expert per organisation with individual voice profiles and assignments, while retaining shared organisation context. One accountable primary client contact and a named backup must remain clear. Do not force separate workspaces per colleague or per social profile.

### Invitations and lifecycle
- Invite by email and allowed permissions; no administrator-selected/shared passwords. Store pending invitations with organisation, intended identity, grant, inviter, hashed token, expiry, state and audit history.
- Accept single-use invitations safely. Existing users authenticate to the matching identity and accept the additional workspace; never reset their password or expose whether another client's account exists. New users establish their own authentication. Wrong-account acceptance must fail clearly.
- Resend/revoke/expire invitations, invalidate superseded tokens, rate-limit abuse, prevent duplicate pending grants and make concurrent acceptance idempotent. Email scanners must not consume invitations or approve content through a GET request.
- Check current inviter authority and invitation validity on acceptance; a revoked grant or removed inviter cannot leave an unsafe privilege path. Do not activate access before acceptance.
- Change roles, suspend/remove members, transfer responsibility and revoke pending invitations. Apply loss of access immediately to requests, downloads, jobs and notifications. Preserve access to other authorised organisations; removal from one workspace is not global account deletion.
- Protect the last active client administrator/owner against both removal and demotion, including concurrent requests. Require explicit ownership transfer, not a count check vulnerable to races.
- Reassign outstanding client tasks/approvals when a person leaves or is unavailable. Show stranded work to the operator. Delegation never means silently approving outstanding content.
- Client admins can grant only supported client permissions. Verify both actor permissions and the target membership's type: they cannot demote/remove internal staff through tenant membership APIs.

### Internal staff and contractors
Resolve global staff through one authoritative internal mechanism. Verify hasInternalOperatorRole and all related guards: an internal-looking role on a client membership must not grant global access. Limit privileged role assignment to the appropriate administrative authority.
Support internal operators, editors/contractors and QA reviewers with assignment-scoped access where appropriate. A contractor sees required briefs, approved scripts, source footage and their work, not all client strategy, commercial data or other clients. Record QA, handoffs and access revocation. Never treat “editor” as both a client colleague and unrestricted Threadline employee without explicit scope.
Require strong MFA for privileged staff using mature mechanisms; secure enrolment/recovery, session rotation, password reset, account disablement and backup codes. Reuse sound auth foundations; migrate providers only with a clear security/maintenance case and a safe account migration.
Enforce permissions on every route, action, query, mutation, export, search, count, file, report and background execution. UI hiding is insufficient. Include organisation identity in cache boundaries; prevent authenticated response caching across users/tenants. Validate referenced records belong to the same tenant and permitted assignment, including nested IDs and bulk operations.

## 5. A client experience that does not create administration
Preserve and complete the existing Home/This Week and Record / Approve / Decide model. Separate “needs you” from “needs your colleague” and “Threadline is working on it.” All counts and statuses come from real records. An empty queue may say nothing needs the user; it must not falsely claim the system is healthy/running during an outage.
- Show role-aware requests with the exact decision, relevant preview, deadline, estimated effort where measured, accountable person and one next action. Group related assets in a review batch; allow safe bulk decisions only on explicitly selected current versions.
- Provide save/resume, preserved form input, recoverable upload failure, keyboard/mobile operation and safe deep links after sign-in. Do not ask users to re-enter data already supplied in the application/interview.
- Operator-prefill Brand Brain, ICP, voice, proof and strategy from supplied evidence; client confirms consequential facts. Onboarding is progressive: essential launch inputs first, remaining context assigned without blocking unrelated delivery.
- Delegates may upload and coordinate while the founder supplies expertise and retains only the decisions they choose. Route to designated approvers, not every member. Allow absence/backup settings and clear ownership changes.
- Allow short voice notes, files, links and concise corrections where relevant. Preserve source permissions/provenance and attach them to the right organisation/root.
- Consolidate comments and revision requests per asset/version. Mark internal notes explicitly and keep them internal across emails/exports. Notify the responsible operator of a client response, not the whole team.
- Show approved strategy, curated intelligence, content status, results, final reports and deliverables. Keep prompts, Judge weights, draft hypotheses, AI costs, correction internals, cross-client material, margins and operator SOPs private.
- Maintain a client-facing concise help/recording guide and support request path with owner/status. Do not build a chat replacement or expose raw support/debug logs.
- Measure founder input time, approval time, revision rounds, repeated questions and operator effort. Use these to improve service; do not invent “15 minutes a month” savings claims.

## 6. Commercial acquisition, Attio and client conversion
Attio owns Threadline's contacts, companies, commercial deals, sales stages, sales owners, follow-ups and won/lost decisions. Threadline owns application evidence, delivery and client workspaces. Client businesses' own customer/opportunity evidence is a different tenant-scoped dataset; never sync it into Threadline's sales pipeline by accident.
Read current official Attio authentication/object/webhook documentation. Reuse existing workspace/lists/fields; do not rebuild the already-configured CRM or infer missing credentials from an unconnected local environment.
Implement mapping, source ownership, normalisation, remote IDs, account identity, versions/hashes, outbox, retries, reconciliation, sync log, dead-letter handling and safe manual resolution. Never match people/companies solely by display name or merge customers automatically on a shared domain. Remote calls happen outside database transactions; retries must not duplicate local or external effects. Handle out-of-order events and webhook echoes. Use provider-supported signature/replay mechanisms, not invented headers or universal timestamp rules.
Keep prospect research/replied/nurture states, sales deal stages and delivery status separate. Preserve the actual configured sales process; qualified opportunities become deals. An unqualified/spam application must not automatically create a revenue opportunity.
Threadline deal value means the agreed value of Threadline's own engagement. Prospect/customer deal economics means the value of what that prospect sells; store separately. A won deal, accepted agreement, payment received and activated service are separate states with explicit policy.
Applications: validate, normalise, rate-limit and deduplicate genuine retries without blocking legitimate later submissions. Store answers/source evidence; enqueue one appropriate confirmation and operator notification; preserve the existing booking path. No automatic marketing subscription. Track owner, qualification, next action, due date, calls, proposals, objections and outcome. Research conversations are not automatically sales-qualified calls.
Conversion: explicit authorised command links application/prospect/deal to one correct client workspace and engagement. Use transaction/unique constraints for local creation; handle duplicate clicks, concurrency, existing users, returning clients, multiple experts and legitimate multiple engagements. Create pending founder invitation, onboarding state and installation foundation without manual DB editing. Do not create a new organisation every time an existing client buys another engagement. Audited overrides for approved credit terms must not pretend an invoice was paid.
Sync lifecycle outcomes and renewal/expansion opportunities to Attio through the owned-field rules. During outage, queue and visibly reconcile changes; preserve manual record links and a documented fallback. No competing hidden CRM edits.
For Threadline's acquisition, support approved target/ICP research, personalised briefs, script variants, channel/source attribution, objection logs and follow-up queues. Human-reviewed outreach drafts may use approved script libraries. Do not auto-send messages in this implementation run. Do not copy Vantage's rented-account model, account impersonation or engagement manipulation. Software capability is not blanket permission to contact people.

## 7. Engagements, scope, calendars and installation
Model agreement/version reference, authorised contacts, implementation scope, recurring scope, channel/profile entitlements, core asset allowance, derivative count, revision policy, dependencies, service start and period boundaries. Preserve historical terms on renewal. Calendar events use tenant timezone with DST-safe storage; four weeks means a defined 28-day period under the agreed policy, not “same date next month.”
Period start must follow an explicit agreed activation date, not silently fall back to workspace creation. Separate installation, initial engagement, service periods, pause and termination. Client delays/holidays trigger visible rescheduling and owner decisions according to agreed terms, never silent extra charges, deadline shifts or invented contractual penalties.
Installation includes commercial check, welcome/invitation, kickoff, prefilled onboarding, Brand Brain, offer/ICP, proof inventory/permissions, voice samples, existing content audit, access, recording readiness, baseline, first roots, initial deliverables and client sign-off. Track a concrete early win and its actual date; don't promise a universal day-seven result in software copy.
Maintain versioned creative brief, per-person voice/tone, editing style, preferred/disliked examples, prohibited claims, language, positioning, CTA and brand rules. Keep immutable source references and approval history. A meaningful strategy/voice change invalidates affected downstream drafts for review; it need not restart completed unrelated work.
Scope changes have description, estimate/impact, owner approval and effective version. Client suggestions are welcome but do not silently increase the contracted service. Entitlements control workflow availability, including custom long-form work.

## 8. Delivery, production and exact-version approvals
Connect the existing state machines: source/evidence → root → expectation → idea → script/written draft → QA → recording when required → editing → packaging → client review → scheduling/publication → measurement → diagnosis/correction/retest.
Support written posts/threads/carousels and video without forcing written work through recording states. Preserve ROOT_ID lineage across sources, clips, derivatives, platforms and commercial signals. Track core units and distribution variants honestly.
Every actionable item has tenant, engagement/period where applicable, owner, state, due date, dependencies, blocker, visibility and history. Validate transitions on the server. Facts/claims need supporting evidence or explicit removal/review before release. AI cannot declare its own unverifiable claims verified.
Approval records bind reviewer, authority, exact version/content hash, requested time, decision, timestamp and requested changes. Use reviewRequestedAt, not generic update time, for ageing. Concurrent edits/approvals return a clear stale-version response. Material edits after approval invalidate publication eligibility. Bind final media, caption, thumbnail and platform package to the approved release; record approval scope so a script approval is not mistaken for final edit approval.
Default to one designated approver with explicit backup/delegation. Support additional required reviewers where configured; do not require every colleague's approval by default. Consolidate feedback and record conflicts for the accountable approver. Never auto-approve because a deadline expired. No approval mutations through email GET links.
Provide safe preview, comments, change requests, comparison/version history, reissue, revision counters and limits/overage flags. Client approval does not automatically publish; scheduled publishing requires the authorised publication action/policy and current approval. Separate internal QA from client approval.
Build reusable production checklists, assignment/reassignment, primary/backup editor, internal QA and turnaround/capacity metrics. Keep production-ready assets and client-visible versions distinct from internal working files. Retain previous approved versions without enabling accidental stale publication.

## 9. Files, recordings and deliverables
Use private object storage with authorised tenant/assignment-scoped keys and metadata records. Fix file route access by checking the actual asset owner and caller authority, not simply whether the caller belongs to any organisation.
Implement direct-to-storage authorised uploads for large raw media, with resumable/multipart support where supported, progress, retry, checksums/size verification, expiry and cancellation. Do not route large media bodies through normal Vercel functions. Bind upload authorisation to caller, tenant, intended object and allowlisted type/size. Verify storage results before accepting completion; do not trust client-reported success. Clean abandoned uploads with safe retention rules.
Reject active SVG uploads by default; if a genuine requirement exists, use an isolated safe download route with an explicit security review. Validate MIME/magic bytes where applicable, filenames, metadata, quotas and download headers. Provide malware quarantine/scanning for accepted client file types with truthful pending/failed states; unsupported scan coverage must not be labelled clean.
Use short-lived signed reads or authorised delivery. Recheck permission when issuing links; never log signed URLs. Document the remaining validity window of already-issued links and mitigate sensitive revocation appropriately. Secure document/media previews and extracted/transcoded derivatives too.
Large transcoding, transcription and scanning jobs must use an execution model that supports their duration/size. Reuse suitable services/workers, with checksummed callbacks and idempotent task state; do not force them into a short cron invocation or build a video editor. Keep raw media intact and link transcripts/timestamps/outputs to the source. Allow manually supplied transcripts and edits as supported alternatives.
Deliverables cover diagnosis, client-safe Brand Brain/ICP/strategy, briefs, calendar, scripts/posts/media/packages, intelligence, reports, proof and handover. Reuse existing records and a unified index rather than creating duplicate canonical copies. Store versions, relationships, owner, status, delivery date and client visibility. Provide safe exports/manifests; large exports run asynchronously with expiring downloads. No internal notes/prompts/costs or other tenants' data in client exports.

## 10. Durable jobs, notifications and client attention
Complete the database-backed queue with protected scheduled execution suitable for Vercel, bounded claims, leases, atomic locking, lease recovery, time budgets, concurrency limits, retries/backoff/jitter, dead letters, cancellation and operational replay. Check actual plan/runtime/schedule limits. Long-running work uses an appropriate worker/service; cron dispatch need not perform the entire job.
Treat execution as at-least-once: unique business keys and reconciliation prevent duplicated consequences. Handle crashes after provider success but before local acknowledgement. Where the provider cannot prove whether a send/publish succeeded, mark the operation uncertain and reconcile before retrying; never promise universal exactly-once external delivery.
Schedule catch-up from durable due records, not assumptions that every cron tick ran. Use a transactional outbox where needed. Retest permission, tenant status and object version at execution time. Offboarding/pause/revocation cancels or suppresses incompatible queued work.
Implement jobs for application confirmations, invitations/resets, onboarding/input/recording reminders, approval reminders, internal deadlines, publishing/polling, metric refresh, stale evidence, report drafts/delivery, period tasks, proof requests, approved billing reminders, renewals, capacity alerts, retention/token cleanup, integration reconciliation, operator digest and commercial digest.
Separate security/transactional events from optional reminders. Apply recipient responsibility, timezone, quiet hours, digest preferences, deduplication, snooze, reminder history and bounded escalation. Security events can bypass ordinary digests when appropriate. Don't email every member about every state transition. Completed/reassigned requests must stop reminders. Reports are sent only after human finalisation; invoice reminders follow confirmed policy, not an AI's judgment.
Use approved templates, safe links, bounce/suppression handling and observable delivery state. SPF/DKIM previously reported complete should be verified for the actual selected sender rather than blindly reopened as undone. Keep marketing consent separate. Tests use a sink/allowlisted synthetic recipients, never real clients or prospects.

## 11. Full integration and publishing implementation
Complete the existing connector registry and remove misleading always-unavailable legacy paths only after callers are migrated safely. Required provider inventory includes current repository adapters for LinkedIn, X, Instagram, TikTok and YouTube. Add Facebook/Threads distribution capability from the content-engine plan where current official APIs support the intended operation. Unsupported capabilities must have precise documented reasons and manual workflows; do not fake endpoints, analytics or permissions.
For each provider, record account/profile types, supported formats, publishing/analytics capabilities, scopes, current API version, quotas, approval requirements, media constraints, cost gate and evidence of test level. Implement supported operations even if live credentials are pending; do not claim live success from mocks.
Implement authenticated OAuth start/callback, tenant/user binding, expiring single-use state, PKCE where supported/required, exact redirect allowlists, encrypted tokens, least scopes, expiry/refresh locking, reconnect/revoke and provider-account identity checks. Prevent login CSRF and attaching an account to the wrong tenant. Never ask for social account passwords. Handle multiple authorised profiles per client and detect conflicting account assignments.
Publishing includes approved per-platform packages, content/format validation, scheduling, cancellation, durable media processing, provider status polling, partial thread/sequence failures, reconciliation and duplicate prevention. Never label scheduled/accepted/processing as published until provider/manual evidence supports it. Handle token expiry, quota/429, processing rejection, account removal and uncertain timeout outcomes. Keep already-published records when future publication permission is revoked.
Manual publishing remains complete: export the approved package, mark responsible publisher/due date, record canonical URL/platform ID/actual time and verify what can be verified. No fake automatic status. Apply the same version/permission rules to manual and automated paths.
Metrics use timestamped snapshots with source, definition, observation window and freshness. Preserve platform-specific meaning; views, impressions, unique reach and conversions are not interchangeable. Zero, unknown, unsupported, unavailable and stale remain distinct. Support manual evidence, CSV imports with mapping/validation/deduplication and correction audit, plus connected refresh. Backfill and correction must not double count cumulative totals.
Implement available booking/form/CRM event connectors already represented in the repository (including Attio, HubSpot, Pipedrive and GoHighLevel where relevant) with tenant-specific identities and verified official webhook contracts. Keep Threadline's own commercial CRM credentials separate from client attribution connections. Add a safe manual import path for each unsupported/unconfigured source.

## 12. Attribution and commercial measurement
Capture day-zero baseline, source coverage, conversion destinations, content roots, approved CTAs, link IDs/UTMs, authorised intent events, buyer-reported source, booking, show, qualified opportunity, sale and cash evidence where available. Integrate existing client destinations rather than rebuilding their websites/calendars just for tracking.
Preserve evidence classes exactly:
- DIRECTLY_TRACKED
- BUYER_NAMED_CLIENT_ATTRIBUTED
- MULTI_TOUCH_INFLUENCED
- ASSOCIATED_CORRELATED
- QUALITATIVE_ONLY

Keep first/last touch and available intermediate evidence without pretending all journeys are observed. A generic profile/bio link does not establish exact-post attribution. Deduplicate people/events/revenue carefully, preserve refunds/corrections/currency, and distinguish booked pipeline, contracted revenue and cash collected. Do not sum the same sale across content/platforms or treat chronological association as causation.
Consent-aware measurement must fail closed for non-essential identifiers until the required consent exists. Preserve necessary operational records separately. Do not fingerprint users or manufacture cross-device identity. Tracked links need destination allowlists and open-redirect protection; redact sensitive URL data.
Build funnel/bottleneck views using defined denominators, date windows, qualified call counts, show/close rates, value and attribution coverage. The transcript's followers-per-call ratio is a heuristic, not an individual conversion proof: label new followers / attributed calls, show zero-denominator/low-sample states, and do not claim referral calls necessarily came from newly gained followers. Marcos's example ratios and revenue are not Threadline benchmarks or guarantees. Fit and business context matter more than inferred location/wealth.

## 13. Research, AI agents and the content engine
Implement the advanced engine as narrow, observable workflows using the existing providers, corpus and domain models. Do not copy tool-brand names from transcripts as if their software is installed. Model/API names in transcripts may be inaccurate; use configured supported models.

### Required workflows
1. Source/idea miner: ingest authorised research, sales, onboarding, coaching/client calls, uploaded transcripts and voice notes. Support a supported transcript connector such as Fathom when configured, plus manual import. Extract exact source spans, questions, objections, expertise, stories, proof, claims and candidate ideas; retain call/source/time references, permissions and context.
2. Market/trend researcher: use authorised sources/APIs and the existing ResearchProvider boundary to find relevant competitors, buyer pain, topics and timely developments. Schedule configurable runs, deduplicate, retain links/dates/source reliability and explain unavailable sources. Produce proposals, not autonomous posts. No rented social accounts, prohibited browser bots or access-control bypass.
3. Strategy/context engine: version Brand Brain, ICP, offer, creative brief, per-expert voice, editing preferences, client facts and approved evidence. Resolve conflicts explicitly. Client truth and current approvals outrank generic swipe files.
4. Content drafting and repurposing: use source-derived ideas, approved formats and platform constraints to create root-linked drafts and derivatives. Support PESTO (personal, expertise, social proof, trending, opinions), funnel role, objection handling and audience intent. Use measured performance to inform the mix; do not hardcode three daily posts/300 monthly posts or copy someone else's proof.
5. Judge/fact/voice QA: assess ICP relevance, clarity, evidence, claim risk, originality, voice, repetition, CTA/funnel fit, bad-fit attraction and platform constraints. Human input → AI draft → human review. Style cleanup must preserve meaning; punctuation or AI-detector scores cannot establish authorship or truth. Never invent personal stories to make writing sound human.
6. Inbox/lead-assist: build authorised inbound ingestion, deduplication, routing, qualification evidence, draft replies, follow-up reminders and speed-to-lead monitoring for supported channels. Unsupported DMs use manual entry/links/import. No fake universal social inbox or blanket automated cold outreach. Replies/sending follow explicit approved channel policies and human release; location alone is not qualification.
7. Learning/analytics: derive proposed explanations and tests from mature evidence, connect corrections to subsequent drafts, and produce report drafts for operator review.

Store run IDs, tenant, actor, provider/model, prompt/rubric/version, source references, outputs, timestamps, cost/tokens, failure/retry and human disposition. Provide cancellation, budgets, concurrency controls, timeouts, partial recovery and evaluation. Prevent duplicate billable calls where feasible; uncertain external outcomes require reconciliation. Mocks are explicit test data, never silent production fallbacks.
Treat uploaded documents, retrieved pages and transcripts as untrusted data, never as tool instructions. Defend against prompt injection, SSRF and malicious URLs; isolate credentials, tool permissions and tenant retrieval. No model tools may autonomously grant access, send money, publish unapproved content or export private data. Client members cannot trigger unlimited generation through broad default permissions.
Keep internal prompts, rubrics, routes, corrections and evaluation sets private. Cross-client learning requires an approved permission and anonymisation policy, with source traceability and deletion handling; never leak another client's private numbers or stories through retrieval. Public competitor content remains attributed research rather than copied deliverables.

## 14. Expected → actual → why → change → retest
Make the existing models/actions operable end to end in the authenticated product. Freeze a pre-publication expectation with hypothesis, audience/job, baseline, predicted class/rationale, confidence and rubric version. Link real outcome snapshots and their maturity windows. Don't backfill predictions after seeing results and represent them as forecasts.
Operator reviews likely cause, supporting evidence, alternative explanations and uncertainty. Distinguish thesis, hook, packaging, voice, offer, audience, distribution, recording and execution problems. A weak package does not automatically invalidate the root thesis. “Insufficient data” and mixed evidence are valid outcomes.
Approve a diagnosis, record the failed assumption, correction, owner, next test and resulting evidence. Feed approved lessons into context with scope/version controls; retain rollback when a lesson is contradicted. Client sees a concise explanation and next action, not internal correction logs.
Implement held-out evaluation with winners and losers, comparable context, hidden outcomes at prediction time and leakage checks. Track ranking/prediction quality, draft acceptance, founder/operator edit minutes, repeated errors, false positives/negatives and root-level commercial outcomes. Model scores are not observed business results. Add prompt/model comparison and human promotion/rollback controls. Do not fine-tune merely for sophistication; build the evaluation/data path and only activate a training experiment when authorised data and measured benefit justify it.

## 15. Reporting, operator control and capacity
The operator cockpit is an actionable work queue: today, overdue, waiting on client/Threadline, sales follow-ups, onboarding, approvals, production, publications, missing evidence, reports, billing/renewal, capacity and failures. Group/filter these rather than creating sixteen competing dashboards. Each item links to the next valid action with owner, deadline, cause and audit trail. Pagination, useful indexes and query limits must support real growth.
Weekly reports show completed work, pending decisions, publications, evidence, expectation versus actual, learning, constraints, changes, tests, commercial signals, limitations and next actions. Four-week reviews use ACTION → RESULTS → PROBLEMS → FUTURE and compare roots, failed assumptions, corrections, delivery, founder burden and next-period priorities. Preserve period boundaries and baseline methodology.
Reports are generated from real records, reviewed and finalised by an authorised operator, then stored as immutable versioned snapshots. Later corrections create an explicit revised version. Final reports alone reach client archive/email. Deduplicate delivery per report version/recipient, recheck access, record provider status and handle failed delivery. Offer safe printable/exportable output. Never manufacture insight to fill an empty week.
Track actual operator/editor effort, costs, turnaround, rework, WIP, dependencies and upcoming workload by client/person/period. Define capacity from configured availability and measured work, not an opaque AI health score. Alerts prompt human staffing/pricing decisions. Internal margin/costs stay internal; client-visible scope/invoices remain available to authorised contacts.

## 16. Agreements, billing, renewals, proof and offboarding
Implement manual invoice/payment records AND the Stripe-hosted Checkout/Invoicing integration when selected/configured. Keep exactly one invoice-creation authority per engagement. Record amount/currency, issue/due/paid dates, reference, status, partial payments, credits/refunds/disputes and evidence. Never store card data or mark paid from a browser success redirect alone. Verify signed provider events, out-of-order updates and replay/idempotency. Test mode only during implementation.
Store agreement/DPA version and signed evidence or authorised external signing reference; a payment receipt is not contract acceptance. Exact tax, contract, retention and renewal terms require owner/legal approval, not autonomous invention. Four-week schedules and implementation fees must match the actual agreement. Do not automatically bill, renew or suspend access based on inferred intent. Surface overdue payments and approved reminders to the correct commercial contact.
Open renewal review with enough configured lead time; compile delivery/value evidence, client friction, future plan and commercial decision. Create/link renewal/expansion opportunities in Attio without cloning the original deal incorrectly. A period rollover is not a new signed engagement. Support explicit renew, pause, expand, terminate and handover states.
Proof permissions distinguish internal use, anonymous/named case study, logo, testimonial, metrics and interview, with exact approved assets/claims/channel/scope/date and evidence. A future-success interview invitation is optional and contingent on real results. Generate proof packs only from approved evidence; revocation prevents future automated reuse and flags published placements for human follow-up. Never promise automatic removal of all historical third-party copies.
Offboarding includes final report, scoped asset export/handover, client-owned asset access per agreement, pending-item disposition, membership/invitation revocation, token disconnection, stopping publication/reminder/generation jobs, CRM state, retention/legal holds and deletion/anonymisation evidence. Distinguish removing one member from terminating a whole organisation. Preserve legally required records according to an approved policy; no automatic destructive retention job based on invented periods.

## 17. Security, privacy and operational readiness
Audit unauthenticated writes, rate limits, session handling, object access, cross-tenant references, files, webhook authentication, secrets, redirects, server fetches, caches and rendered user content. Use distributed throttling with trusted proxy handling, not arbitrary client-supplied forwarded IPs. Add suitable security headers/CSP without breaking approved public routes or authorised media previews.
Encrypt stored credentials with rotation/key-version handling; avoid exposing them in logs, errors, bundles, exports or health views. Use least-privilege provider credentials and CI secret/dependency scanning. Apply appropriate Origin/CSRF protection, body limits, request timeouts and provider-specific replay protection. Prevent SSRF through redirects, private address ranges and DNS changes.
Maintain operational data inventory, owner-reviewed retention table, subprocessor register, access/correction/export/erasure workflow, suppression and consent records, incident register and incident response runbook. Implement access review, staff offboarding, recovery drill and safe retention previews/holds. Backups need a documented deletion/recovery policy; do not claim immediate selective deletion where the provider cannot perform it.
Owner checklist must preserve unresolved legal entity/company/address/privacy details, retention decisions, ICO assessment, solicitor-reviewed services agreement/DPA, approved scope/payment/delay/IP/liability/termination/proof terms, insurance/Cyber Essentials decisions and public claims substantiation. Do not label generated drafts solicitor-approved or treat optional certifications as universally mandatory. Frozen public-site corrections remain a separate explicit release gate where required.

## 18. Verification: prove both everyday use and failure recovery
Run existing typecheck, lint, unit/domain tests, production build, feature verification and relevant QA suites. Add meaningful PostgreSQL integration and browser tests for changed behaviour. Do not disable assertions, replace tests with source-string checks or mark skips as passes. Record commands, environment, exit status and test counts. Verify current patched dependencies against official advisories without an unrelated framework rewrite.
Use isolated synthetic organisations and email/provider sandboxes. Never send real emails/DMs, mutate live CRM records, publish live posts, charge money or delete real data during tests. Synthetic data must be marked and excluded from public proof, training promotion and live business dashboards. Cleanup affects only the identified fixtures.

### Required acceptance journeys
1. Fresh application → validation/confirmation → qualification/Attio mapping → approved commercial state → single client conversion → secure founder invite → acceptance → resumed onboarding → installation → first delivery, without seed-only shortcuts or manual database edits.
2. Founder invites an existing-user colleague and a new-user delegate → correct acceptance → contributor upload → designated approver decision → commercial contact sees invoice → viewer is read-only. Founder avoids unnecessary admin. Remove/reassign a delegate and verify old access/links/pending jobs stop appropriately.
3. Idea/source → frozen expectation → script/written variant → claim QA → recording/upload where relevant → edit/package → request changes → revision → exact-version approval → manual and connected publication branches → metrics → approved diagnosis → correction/retest → final weekly/four-week report.
4. Multi-profile client, two unrelated client organisations and contractor assignments: attempt ID/slug/file/export/search/cache/report tampering and privilege escalation. Verify no internal notes, tokens, metrics or private evidence leak.
5. Concurrent conversions/invites/last-admin demotions; expired/replayed/revoked tokens; wrong-account acceptance; reset/MFA/session revocation; cross-tenant callbacks; stale approvals; duplicate/reordered webhooks; cron overlap, missed ticks and worker crash after external success.
6. Large recording interrupted/resumed; invalid/SVG/oversized/quarantined files; failed processing; signed-link expiry; lost credentials; provider outage/429; uncertain publish result; partial X thread; reconnect; no duplicate publication/payment/email.
7. Four-week/DST boundaries, pauses, client delays, missing inputs, poor recording, overdue approval, scope change and entitlement denial. Measure actual founder/operator work and revision burden rather than inventing a target pass time.
8. Invoice/manual payment and Stripe test events → renewal decision → proof permission/revocation → final export → offboard → jobs/tokens stopped → retention preview/hold → authorised synthetic deletion.
9. AI injection in source material, unsupported claims, wrong-client retrieval, missing-source provenance, generation budget/cancellation, mock-mode labelling and held-out evaluation leakage.
10. Empty PostgreSQL deploy and existing-data migration as applicable; isolated backup restore; production configuration readiness; public-file hash/diff freeze plus public regression smoke checks after shared backend changes.

Live external tests require configured authorised test accounts and explicit permission for their side effects. Missing credentials do not justify skipping local implementation, contract tests, error states or documentation, but they do prevent a LIVE_VERIFIED claim.

## 19. Completion, handoff and continuation rules
Deliver and maintain:
- docs/implementation/BACKEND_COMPLETION_LEDGER.md: every requirement, code evidence, verification and remaining dependency.
- docs/audits/FINAL_BACKEND_IMPLEMENTATION_AUDIT.md: before/after, findings fixed, remaining risks, source-of-truth/permissions matrix and public freeze proof.
- docs/OWNER_ACTIVATION_CHECKLIST.md: only actual owner inputs, grouped by provider/business decision, with why, exact setting, where to enter it, verification, cost/approval gate and whether it blocks first-client use or an advanced feature. Never include secrets.
- docs/TECHNICAL_HANDOFF.md: architecture/state machines, env reference, migrations, jobs, email/files, providers, deployment/rollback, backup/incident/retention, tests and supported manual operations.
- docs/CLIENT_AND_OPERATOR_RUNBOOK.md: invite/delegate, onboard, record, approve/revise, recover failed work, publish, enter evidence, finalise report, bill, renew and offboard, including permissions and failure recovery.

Use small coherent commits for your changes and preserve owner work. No destructive reset, unauthorised production mutation/deployment, real outreach or unapproved service purchase. Test and document all code-addressable work before consolidating external inputs. Ask only when an irreversible or policy-critical decision truly blocks safe progress; continue independent work in the meantime.
If a context/session limit interrupts the job, checkpoint safely with exact remaining IDs and resumption commands. Do not describe a checkpoint as project completion. Do not silently omit an advanced requirement to produce a green result.

Final response must distinguish:
1. First-client production readiness: YES/NO, with exact blockers. This means the deployed/configured journey and required operational controls are verified, not just local tests.
2. Full requested backend implementation: COMPLETE/INCOMPLETE, with every unmet requirement ID. External-gated code may be implemented/tested locally while its live operation remains unverified.
3. Deployment and external verification status: branch/commit/build, environment, migrations, actual deployment, provider-by-provider live/contract/mock status, backup restore evidence and public freeze result.
4. Major functional changes, including client teams and reduced client workload; preserved advanced capabilities; automation/security changes; exact tests and failures/skips; manual alternatives; remaining owner actions.
5. Links to the five documents and the single next owner action that unlocks the most progress.

Continue implementing now. The plan is the control mechanism; the completed, tested system is the deliverable.

## Coverage map for the original 24 phases

| Original phase | Revised coverage |
| --- | --- |
| 1 Inventory/protect | Sections 1–2, 18–19 |
| 2 Refactoring | Section 2, targeted throughout |
| 3 Production infrastructure | Sections 3, 9–10, 17–18 |
| 4 Attio | Section 6, 11–12, 16 |
| 5 Lead-to-client | Sections 4, 6–7 |
| 6 Authentication/security | Sections 4, 9, 17–18 |
| 7 Background automation | Section 10 |
| 8 Operator cockpit | Section 15 |
| 9 Delivery OS | Sections 7–8, 13–14 |
| 10 Deliverables/library | Section 9 |
| 11 Communication/approval | Sections 4–5, 8, 10 |
| 12 AI/research | Section 13 |
| 13 Learning loop | Section 14 |
| 14 Publication/analytics | Sections 11–12 |
| 15 Reporting | Section 15 |
| 16 Billing | Section 16 |
| 17 Team/capacity | Sections 4, 8, 15; client team lifecycle added |
| 18 Renewal/proof/offboard | Section 16 |
| 19 Authenticated design | Functional usability/accessibility in sections 4–5, 8–9; aesthetic redesign excluded |
| 20 Legal readiness | Section 17, owner checklist in section 19 |
| 21 Observability | Sections 3, 10, 15, 17 |
| 22 Testing | Section 18 |
| 23 Documentation | Section 19 |
| 24 Change management | Sections 1–2, 19 |

Note on sources: the brief refers to "Drive sources linked in this document". No links arrived with the pasted text, so none were read. The strategy requirements above are the operative source (recorded in the ledger as SRC-DRIVE: unavailable).
