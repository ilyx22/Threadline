# DRAFT - BRANDING PENDING

**Status:** Internal working document. Not final. Not client-ready until Threadline branding/logo, legal/commercial review where relevant, and real-client validation are complete.

---

# Threadline Platform Integrations - API, Approval + Licensing Roadmap

## Short answer
You generally do **not** buy a blanket 'social media publishing licence'. Direct integrations work through each platform's developer program and OAuth. The client authorizes Threadline; Threadline stores tokens securely and uses approved scopes. Some platforms require app review/audit, some impose quotas, and X currently charges API usage.

## Architecture before any live OAuth
Before connecting real client accounts:
- encrypted credential/token storage;
- per-tenant token ownership;
- least-privilege scopes;
- refresh-token lifecycle and expiry handling;
- revoke/disconnect path;
- audit log of publish/read actions;
- CSRF/state protection for OAuth callbacks;
- webhook signature validation where used;
- privacy policy / terms / data-retention behavior;
- never ask clients for platform passwords when OAuth exists.

## Platform matrix - checked against current public/official documentation in Sep 2026
### YouTube
**Need:** Google Cloud project, YouTube Data API enabled, OAuth 2.0 credentials/scopes.  
**Important:** unverified API projects created after July 2020 have API uploads restricted to private visibility until the project passes YouTube's compliance audit.  
**Cost/licence:** no blanket publishing licence in the documentation reviewed; quota/audit rules apply.  
**Threadline:** good direct-integration candidate, but manual upload is perfectly acceptable during early validation.

### LinkedIn
**Need:** LinkedIn developer app + Community Management API access + member OAuth consent. `w_member_social` allows posting on behalf of an authenticated member; organization posting uses `w_organization_social`.  
**Approval:** Community Management has Development and Standard tiers. Standard is the production tier and LinkedIn vets applications; current documentation asks for a working use-case demonstration/screencast for Standard access.  
**Read caveat:** some member read/social permissions remain restricted, so publishing and analytics capability should be validated against the exact approved scopes rather than assumed.  
**Threadline:** likely the long-pole integration for our ICP. Start the application once the production domain, privacy policy and working integration demo are ready.

### Instagram
**Need:** Meta app, OAuth/business login, Instagram Professional account (Business/Creator) and content-publish permissions.  
**Approval:** serving customer accounts requires the appropriate access level/app review; Meta's current API materials distinguish Standard vs Advanced access.  
**Publishing:** official APIs support professional-account content publishing including Reels; media may need to be reachable by Meta during publishing.  
**Threadline:** direct integration is realistic after secure token storage and app review. Keep manual publishing until then.

### TikTok
**Need:** registered TikTok developer app, Content Posting API, user authorization, approved `video.publish` scope.  
**Approval:** unaudited clients are restricted to private visibility; public direct posting requires audit/compliance approval.  
**Threadline:** later integration. Early clients can publish manually from approved final assets.

### X
**Need:** developer project/app + OAuth/token + Posts API.  
**Cost:** current X API documentation uses pay-per-use credits; writes are billed per request.  
**Threadline:** only integrate if enough clients actually use X. Manual copy/paste is cheap at low volume.

## Phase plan
### Phase 0 - now
- manual publish / schedule;
- store final package, target date and live URL;
- transparent `MANUAL` or `ADAPTER ONLY` state in the UI.

### Phase 1 - first repeated client demand
- encrypted token store;
- one integration only, chosen by actual ICP usage;
- read-only metric import can precede auto-publishing if it creates more learning value.

### Phase 2 - production integrations
- OAuth connect/disconnect UX;
- queue/retry/idempotency;
- platform-specific publish validation;
- webhook/metric refresh;
- explicit failure states, never simulated success.

### Phase 3 - resilience
- background jobs;
- provider version migration process;
- per-platform health checks;
- rate/quota monitoring;
- fallback to manual workflow when APIs fail.

## Direct APIs vs a third-party social scheduler
A third-party platform can reduce engineering/API maintenance but adds subscription cost, dependency and potentially narrower analytics. Direct APIs give Threadline better lineage and control but cost more engineering/review effort. Do not choose philosophically: compare once 3-5 clients reveal the actual platform mix.

## Browser extensions
Do not make a browser extension or browser automation the core publishing mechanism merely to avoid API review. Official OAuth/API integrations are more durable and easier to explain to clients. An extension should exist only for a narrow workflow the official platform permits and where it has a clear user benefit.
