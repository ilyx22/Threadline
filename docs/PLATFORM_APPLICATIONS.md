# Platform applications — what to file, and when

Researched 2026-09-07 against current official documentation, not memory. Sources are linked
per platform. Re-check before filing: these programmes change their gates without much notice.

The purpose of this document is narrow. **Every first-party review clock that can start before
the feature is finished should start now.** A review queue is dead time we do not control, and the
only way to shorten it is to enter it earlier. Manual and provider-based ingestion exist so that
nothing is blocked while the clocks run — they are the fallback, not the reason to wait.

**State on 2026-09-09.** The connectors these applications unlock are built and tested to a
mocked HTTP boundary (`src/lib/integrations/connectors/`, `HANDOFF.md` §11). Filing is now the
whole remaining path to live publishing; no code is waiting on the reviews.

## Platform safety doctrine (locked 2026-09-09)

> Automate publishing through official rails. Do not automate human social behaviour.

Everything applied for here is an **official API with scoped, revocable OAuth permissions**, and
that is the only kind of access Threadline will ever use. Four action classes: PUBLISH and
ANALYTICS through official or authorised APIs; RESEARCH from permitted public or provider sources
with no authenticated scraping or access bypass; ENGAGEMENT (replies, comments, DMs, follows,
likes, connections) human by default. Never: browser bots or driver-operated accounts, cookie or
session-token automation, stored client social passwords, auto-like, engagement pods,
follow/unfollow automation, connection farming, bulk unsolicited replies/DMs/comments,
recommendation or location manipulation, or evasion of rate limits, app review or restrictions.
Secrets are encrypted at rest before any real credential exists, and every connector action
records platform, account, content, provider, action, timestamp, authorisation state, error state
and rate state. The full doctrine and its enforcement points are `HANDOFF.md` §16i; a rejected
application is never answered with a workaround.

---

## The distinction that governs everything here

| | |
|---|---|
| **Technically hard** | We can start today and the difficulty is ours. No clock. |
| **Blocked by an external gate** | Someone else decides, on their timetable. File immediately. |

Three of the four platforms below have a gate on **reading performance data**, and two of them have
no gate at all on **publishing**. That asymmetry is the single most useful fact in this document,
because it means publishing can ship long before analytics can, and the product should be built to
survive that gap rather than wait for it to close.

---

## 1. LinkedIn — the important one, and it splits in two

LinkedIn is the wedge's primary platform, so this is where the sequencing matters most.

### 1a. Publishing to a founder's own profile — **no gate, available today**

The **Share on LinkedIn** product is self-serve. It is enabled automatically when an app is
created in the Developer Portal, grants `w_member_social`, and posts text, article, image and
video shares to the authenticated member's own feed. No review, no partner programme, no queue.

- Endpoint: `POST https://api.linkedin.com/v2/ugcPosts`, header `X-Restli-Protocol-Version: 2.0.0`
- Rate limits: **150 requests per member per day**, 100,000 per app per day
- Media requires a two-step `registerUpload` then binary upload before the share is created

This is exactly Threadline's use case — the founder authenticates as themselves, and we publish to
their own profile. It needs no partner status and can be built the day the OAuth flow exists.

**Action: create the app now.** The self-serve product is a prerequisite for everything below, and
having a live app with real usage is material for the review that follows.

### 1b. Reading how those posts performed — **gated, file immediately**

Member post analytics are not in the self-serve product. They sit in the **Community Management
API** under the **Executive Management** use case, which is the one that covers posting to and
reading engagement on a *member's* profile rather than a company Page.

Two tiers, reviewed separately:

**Development tier** — reviewed on:
- an approved use case,
- a **verified business email address** (personal addresses fail the vetting outright),
- a verified organisation: legal name, registered address, website, privacy policy,
- the app **verified by a super admin of the associated LinkedIn Page**,
- no LinkedIn or Microsoft naming in the app (including "Linked" or "In" as substrings).

**Standard tier** — requires the Development tier already integrated, plus a downloadable,
high-resolution **screencast with narration** demonstrating, for Executive Management:
1. a user completing the full OAuth flow,
2. a user posting to their LinkedIn profile through our app,
3. how another member's comment on that post is displayed in our app,
4. which personal data fields from the commenter's profile we display,
5. any other core functionality touching member personal data.

**The trap that makes this urgent and careful at once.** Rejection is not a retry. LinkedIn's
documentation is explicit: a rejected app cannot re-apply — you must create a *new* app and start
again. So this is filed early, but not carelessly. There is also a 21-day deadline on the vetting
survey once it is triggered.

**Prerequisites to gather before filing** — every one of these is ours to control and none of them
requires the product to be finished:

- [ ] Registered legal entity (Community Management is commercial-use, registered-organisation only)
- [ ] Business email on the company domain, verified
- [ ] Company LinkedIn Page, with a super admin who can verify the app
- [ ] Privacy policy and data-deletion path published at a real URL
- [ ] Registered address and website matching the entity

**Reported timeline:** roughly 4–8 weeks at best, 3–4 months typically, across both tiers. This is
the long pole in the entire integration surface. It is the reason to file before anything else.

Sources: [Community Management App Review](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review),
[Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin),
[Increasing Access](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access)

---

## 2. TikTok for Developers — file now, the audit is short but it is a hard gate

The **Content Posting API** with Direct Post publishes video and photo to a creator's account under
the `video.publish` scope.

**The gate is unusual and worth stating precisely: an unaudited app is not rate-limited, it is
*silenced*.** Every post an unaudited client makes is forced to `SELF_ONLY` — visible to the
creator alone — regardless of the privacy level requested. The API returns success. The post
exists. Nobody sees it. An integration that is "working" in this state is not working at all, and
this is the failure mode most likely to be mistaken for success.

**Mandatory UX requirements**, enforced at audit and worth building correctly first time:
- **Query Creator Info must be called before every post**, to retrieve the creator's available
  privacy options rather than assuming them
- Per-post configuration of duet, stitch and comment settings must be exposed
- Commercial content disclosure where applicable

**To apply** (developers.tiktok.com/application/content-posting-api): a demo video of the upload
flow, a privacy policy URL, and a description of how user data is handled.

**Reported timeline:** ~5–10 business days once submitted — the shortest of the four, but the
consequence of not having it is total.

Sources: [Content Posting API — Get Started](https://developers.tiktok.com/doc/content-posting-api-get-started/)

### 2b. TikTok Shop Partner — analysed separately, and **not applicable**

TikTok Shop Partner Center is a different programme with a different registration, different terms
and a different review, aimed at commerce: order, product, fulfilment and affiliate operations. It
is not a superset of the ordinary developer APIs and holding one grants nothing on the other.

Threadline sells advisory services on a four-week retainer. There is no catalogue, no order, no
affiliate link. **Nothing in the roadmap needs it**, and applying would put a commerce use case in
front of a reviewer that our product does not have — which is how applications get rejected on
record. Revisit only if a client's content path ever ends in a product listing.

---

## 3. YouTube — start the audit early; the quota is the constraint, not the access

Access itself is not gated: a Google Cloud project with the Data API v3 enabled can upload today
with the `youtube.upload` scope. Two separate clocks matter.

**The quota clock.** The default allocation is 10,000 units/day shared across endpoints, with
100 `search.list` and 100 `videos.insert` calls. Upload costs were cut sharply in December 2025 and
moved into their own bucket in June 2026, which helps — but the **Audit and Quota Extension Form**
is reviewed over anything from a few weeks to several months. File it before the quota bites, not
after: a quota exhausted mid-engagement is a client's content not going out.

**The OAuth verification clock, which is the one that actually catches people.** `youtube.upload`
is a sensitive scope. An unverified app shows a warning screen before consent and is capped at
**100 users for the lifetime of the project** — and that cap is *permanent on the project*. It
cannot be reset by issuing a new client ID or redeploying. At Threadline's scale 100 clients is a
long way off, but the warning screen appears on client #1, in front of the founder we are trying to
look competent to. Verification is worth filing for that reason alone.

Sources: [Quota and Compliance Audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits),
[Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification),
[Unverified apps](https://support.google.com/googleapi/answer/7454865)

---

## 4. Meta / Instagram — the gate is business verification, and it is not about the app

Publishing needs `instagram_business_content_publish` at **Advanced Access**, which comes only
through App Review. But App Review is not the first gate.

**Business Verification in Meta Business Manager is a separate process with its own document
requirements, and it is a common independent rejection point.** It has nothing to do with our code
and everything to do with company documents, so it can be completed before a single line of
Instagram integration exists. There is no reason to sequence it after the build.

Other prerequisites: an Instagram **Professional** account (personal accounts have no API path at
all in 2026), a live-mode app, a published privacy policy, and a working data-deletion path.
Business Login for Instagram authenticates against Instagram directly with no Facebook account in
the loop, which simplifies onboarding for a founder who has never touched Business Manager.

**Reported timeline:** Meta's own estimate is 2–3 days per submission; real rounds run to weeks,
and a rejection restarts the clock.

Sources: [Overview of the Instagram API](https://developers.facebook.com/docs/instagram-platform/overview/)

---

## The order to file in

| # | Action | Clock | Blocks |
|---|---|---|---|
| 1 | Create the LinkedIn app; enable Share on LinkedIn | none — today | nothing; unblocks publishing |
| 2 | Meta Business Verification | weeks, document-driven | Instagram Advanced Access |
| 3 | LinkedIn Community Management, Development tier | 4–8 weeks+ | all member analytics |
| 4 | TikTok Content Posting audit | 5–10 business days | any TikTok post being *visible* |
| 5 | YouTube OAuth verification + quota extension form | weeks to months | scale, and the consent warning |
| 6 | LinkedIn Standard tier (needs #3 integrated + screencast) | 4–8 weeks+ | production analytics volume |

Items 1, 2 and 5 need nothing from the product and should be filed regardless of build order.
Items 3, 4 and 6 need a working integration to demonstrate — which is the argument for building the
publishing path against LinkedIn's self-serve product first, since it is the only one with no gate
in front of it and it produces the screencast material the gated applications ask for.

---

## What this means for the architecture

Nothing here changes the `AttributionProvider` / provider-boundary decision, and it should not.
Three points follow from the research:

1. **Publishing and analytics are separately gated on the same platform.** They must be separately
   capable in code — an integration that can post but cannot yet read performance is the *normal*
   state for months, not a broken one. A single "LinkedIn connected" boolean would model this
   wrongly.
2. **Manual ingestion is the permanent fallback, not a stopgap.** Every metric the platforms will
   eventually supply must already have a hand-entry path with its provenance recorded, because for
   the first several months that is the only path there is — and because evidence class is never
   raised by arithmetic (ADR-015), a hand-entered figure stays hand-entered in the reporting.
3. **The TikTok `SELF_ONLY` behaviour needs an explicit check, not a comment.** An integration
   whose posts silently go nowhere while reporting success is precisely the false negative the
   build doctrine forbids. Audit status belongs in the connection record, and an unaudited
   connection should refuse to publish rather than publish invisibly.
