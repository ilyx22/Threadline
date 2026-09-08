# DRAFT - BRANDING PENDING

**Status:** Internal working document. Not final. Not client-ready until Threadline branding/logo, legal/commercial review where relevant, and real-client validation are complete.

---

# Threadline Integration Access + Publishing Architecture V2

## Core decision
Threadline does not need direct social APIs to sell or fulfil client #1. Phase 0 is manual/native delegated access. Platform integrations are added only when measured operational pain or client experience justifies them.

## Three ways to publish
### A. Native delegated access - launch default
Use the platform's own team/admin permissions where possible. Never make password sharing normal operating procedure.

Examples:
- **YouTube:** client can invite a Manager/Editor in YouTube Studio; YouTube explicitly says channel permissions are safer than sharing Google credentials.
- **LinkedIn Company Page:** client can grant a real person Content Admin access; LinkedIn says Page admin access is tied to real member profiles and credential sharing violates policy.
- **Personal-profile channels:** where the platform does not offer safe agency delegation, deliver the approved package to the client or use an approved scheduler/OAuth route.

### B. Publishing abstraction layer / aggregator
Threadline sends approved content to one provider that maintains social-network integrations.

**Buffer (2026 public API):**
- public API available on current plans;
- supports app clients/OAuth so a third-party app can access users' Buffer accounts;
- Buffer remains the publishing layer;
- current third-party OAuth limitation: post-level analytics are not available to the external app, which weakens Threadline's learning loop.

**Ayrshare:**
- purpose-built social API covering many networks and multi-customer profiles;
- public pricing currently starts around $299/month for an MVP/Launch tier with up to 10 social profiles and $599/month for a larger Business tier;
- may dramatically reduce platform-specific engineering/review maintenance but creates a vendor dependency and recurring cost.

### C. Direct platform APIs
Highest control/lineage and potentially strongest analytics, but requires separate developer apps, OAuth/security, version maintenance and platform reviews.

## Current platform requirements - verified Sep 2026
### YouTube
- Google Cloud project + YouTube Data API + OAuth 2.0.
- API upload through `videos.insert` is supported.
- uploads from unverified API projects are restricted to private viewing until the project completes YouTube's compliance audit.
- manual channel permissions do **not** mean a delegate can automatically use the YouTube APIs; API authorization is a separate OAuth path.

**Launch decision:** use channel permissions/manual upload first. Direct API later if recurring publishing/analytics workload justifies it.

### LinkedIn
- developer app + Community Management API for production social-management use cases.
- Community Management currently has Development and Standard tiers; Standard is the unrestricted production tier and requires a separate application, with LinkedIn requesting a working use-case demonstration/screencast.
- member/company posting permissions depend on the exact approved product/scopes.

**Launch decision:** manual Page Content Admin for company pages where appropriate; client/manual/scheduler for personal profiles; start API application only after production domain/privacy policy and working integration demo exist.

### Instagram
- official Instagram API is for Professional accounts (Business/Creator), not consumer accounts.
- publishing requires the appropriate business/basic + content-publish permissions depending on login model.
- serving professional accounts Threadline does not own/manage requires the appropriate access level (Advanced Access where applicable).
- official publishing supports professional-account media including Reels; current docs impose a content-publishing rate limit.

**Launch decision:** manual/Meta-native workflow first, API after client mix proves demand.

### TikTok
- registered developer app + Content Posting API;
- approved `video.publish` scope + explicit creator authorization;
- unaudited clients are restricted to private posting and user/activity caps; public direct posting requires audit.

**Launch decision:** approved final package/manual publication first.

### X
- developer app/authentication required;
- X API currently uses pay-per-use credits, not a blanket subscription;
- writes are charged per request and reads per resource, with current rates exposed in the Developer Console/docs.

**Launch decision:** integrate only when X is repeatedly important to paying clients.

## OAuth/security baseline before any customer connection
- production HTTPS domain;
- public Privacy Policy and Terms;
- explicit consent screen explaining requested scopes;
- state/PKCE where appropriate;
- encrypted token storage at rest;
- tenant-bound credentials;
- refresh/expiry/revocation handling;
- disconnect/delete-data path;
- webhook signature verification;
- least-privilege scopes;
- audit trail for publish attempts;
- retry/idempotency so one failure cannot double-post;
- no secrets/tokens in client-side code or logs.

## Decision gate after first 3-5 clients
Measure:
- number of client profiles per platform;
- manual publishing minutes/client/month;
- analytics import minutes/client/month;
- platform failure/retry burden;
- need for personal-profile vs company-page posting;
- value of post-level analytics in Threadline;
- expected aggregator cost/client;
- engineering cost and review lead time.

Then choose:
- **Aggregator first** if platform mix is fragmented and speed matters.
- **Direct API first** if 70%+ of usage concentrates on one/two networks and Threadline needs deep lineage/analytics.
- **Stay manual** if the measured pain is trivial.

## Browser-extension rule
Do not build a browser extension to simulate posting/clicking as a way to evade official API reviews. Browser extensions can be legitimate for narrow user-assist workflows, but should not become the core publishing infrastructure when official delegated access/OAuth/API routes exist.
