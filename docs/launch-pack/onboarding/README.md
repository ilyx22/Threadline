# Client onboarding pack

Written against the app as built on 27 September 2026: the routes in `src/app/app/[org]/**`, `src/app/onboarding/[org]`, `src/app/(auth)/account`, the roles in `src/lib/auth/roles.ts`, and the client navigation in `src/lib/navigation.ts`. The pack deliberately links to in-app forms rather than copying their questions; onboarding and the Brand Brain are filled in inside the app.

Sources: SOP 04 Close to Kickoff, the Onboarding + Brand Brain Intake draft, DRAFT_Recording_Readiness_Install_V2, DRAFT_Day7_Win_Plan, CLIENT_AND_OPERATOR_RUNBOOK and OWNER_ACTIVATION_CHECKLIST.

| File | Purpose | Status |
| --- | --- | --- |
| [WELCOME_GUIDE.md](WELCOME_GUIDE.md) | After signing: milestones, the three four-week periods, who does what | drafted; owner review pending |
| [TEAM_AND_ACCESS.md](TEAM_AND_ACCESS.md) | Invites, roles, profiles, contacts, two-factor, notifications, removing people | drafted; owner review pending |
| [BRAND_BRAIN_GUIDE.md](BRAND_BRAIN_GUIDE.md) | Brand Brain, prefill confirmation, versions, installation sign-off | drafted; owner review pending |
| [RECORDING_GUIDE.md](RECORDING_GUIDE.md) | Setup review, pre-flight, Recording Room, troubleshooting | drafted; owner review pending |
| [REVIEW_AND_APPROVAL.md](REVIEW_AND_APPROVAL.md) | Approvals queue, bulk approval, versions, what blocks approval | drafted; owner review pending |
| [REPORTING_SUPPORT_ESCALATION.md](REPORTING_SUPPORT_ESCALATION.md) | Weekly reports, four-week reviews, PDF, the first cycle, Help, escalation | drafted; owner review pending (support owner and response times not set) |
| [FAQ.md](FAQ.md) | 15 client questions | drafted; owner review pending |
| [OFFBOARDING_AND_EXPORT.md](OFFBOARDING_AND_EXPORT.md) | Export, offboarding, retention options | drafted; owner review pending (retention is an owner decision) |

## Rules applied

- Recurring periods are "four-week periods", never "monthly".
- No numeric founder-time promise: the Master Blueprint forbids a quantitative founder-hours claim until measured Delivery Load validates one.
- Installation "within the first week" is written as an aim, not a guarantee.
- Integrations are described as "once connected" or "by hand". Platform posting, email delivery, file processing and scanning, and two-factor all depend on configuration that isn't yet done in production (see OWNER_ACTIVATION_CHECKLIST sections 2 to 7).
- There are no outcome guarantees and no invented response times.

## UI gaps found (for the owner or maintainer)

1. **Installation page isn't in the client sidebar.** It's reached from **This week** while installation runs, and from **Recording → Your setup**. Consider a nav item during installation.
2. **Terminology clash (fixed 27 September 2026):** the milestone read "30-day strategy approved". It is now **"First four-week period strategy approved"**, and the sign-off confirmation says "first-period strategy".
3. **No in-app pre-flight checklist.** The readiness review exists, but the per-session pre-flight lives only in this guide. The Router's saved presets and marked positions aren't modelled; formats are only vertical short-form or horizontal long-form.
4. **Support has no named owner, SLA or response-time field.** Requests have a status and a blocking flag only. The escalation contact is an owner decision.
5. **Retention period isn't approved.** The offboarding form default is 30-day export then 90 days.
6. **The export excludes file binaries.** Files are listed, and must be downloaded from the Library one by one.
7. **Client two-factor needs `CREDENTIAL_ENCRYPTION_KEYS` in production.** Until it's set, **Account security** says two-factor can't be enrolled.
8. **Invitation emails need Resend configured.** Until then, invitation links are shown on screen and sent by hand.
