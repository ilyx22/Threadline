# TikTok for Developers: application guide, plus Meta, YouTube, LinkedIn and X notes

Checked against official documentation on 26 September 2026 (sources linked inline). This guide adds to `docs/PLATFORM_APPLICATIONS.md`; it does not replace it. **Nothing has been applied for.** The owner files everything; nobody else does it on the owner's behalf.

Doctrine: publish and read analytics through official, scoped, revocable OAuth. No shared passwords, no browser automation, no rented accounts.

---

## 1. What Threadline needs from TikTok

| Need | TikTok product | Scopes (as in `src/lib/integrations/connectors/tiktok.ts`) |
|---|---|---|
| Founder connects their TikTok | **Login Kit** (web) | `user.info.basic` |
| Post a finished video straight to the founder's account | **Content Posting API: Direct Post** | `video.publish` |
| Or send the video to the founder's TikTok inbox as a draft they finish in the app | **Content Posting API: Upload** | `video.upload` |
| Read view, like, comment and share counts | **Display API** (`/v2/video/query/`) | `video.list` |
| Research API | **Not applicable.** It is limited to academic and non-profit researchers and states "Commercial activities are explicitly prohibited" ([Research API](https://developers.tiktok.com/products/research-api/)). | — |

**Direct Post compared with Upload (draft).**
- **Direct Post** publishes immediately, with the caption, privacy and interaction settings the user chose in *our* UI. It is the product that needs the strict UX and the audit.
- **Upload** puts the video in the creator's TikTok inbox. The creator must "click on inbox notifications to continue the editing flow in TikTok and complete the post" ([Upload guide](https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content)). This suits a managed service well: the founder keeps the final tap.
- Request only the products you will demo. The review guidelines say unused products and scopes should be removed to avoid delays ([App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)).
- **Recommendation:** apply for Login Kit, Content Posting (Direct Post and Upload) and Display API, and demo all four scopes. If you cannot demo `video.list` metrics in the app, drop that scope from both the connector and the application.

---

## 2. Step by step

### Step 0: prerequisites (own these before opening the portal)

- [ ] Legal entity and registered address, published on the privacy and terms pages. The checklist shows these sections are **hidden until provided**, so fill them in first.
- [ ] A fully developed public website on the final domain (`https://threadlinehq.com`). TikTok rejects landing pages and login pages. **Privacy Policy and Terms of Service must be visible on the site without opening a menu** ([App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)).
- [ ] `NEXT_PUBLIC_APP_URL=https://threadlinehq.com` set in Vercel, so the OAuth redirect URI is on the same domain as the website shown in the demo video.
- [ ] A **test TikTok account set to Private**. Unaudited clients can post only to private accounts (see §3).
- [ ] A 1024×1024 app icon (JPEG or PNG, 5 MB or less) ([Create an app](https://developers.tiktok.com/doc/getting-started-create-an-app)).

### Step 1: developer account and organisation

1. Sign up at developers.tiktok.com with a Threadline business email, not a personal one.
2. Create an **Organisation** ("Threadline" plus the legal name) and create the app under it. TikTok "highly recommends" organisations over individual accounts ([Create an app](https://developers.tiktok.com/doc/getting-started-create-an-app)).
3. The blueprint says a Threadline developer organisation may already exist. If it does, use it; do not create a second one.

### Step 2: create the app

Fill in the following ([Create an app](https://developers.tiktok.com/doc/getting-started-create-an-app)):
- **Name.** Suggested: "Threadline". It must not contain "TikTok".
- **Icon.**
- **Category.**
- **Description.** It appears on the consent screen. Say plainly: *"Threadline lets expert founders publish videos their team has prepared and approved to their own TikTok account, and see how those videos perform."*
- **Terms URL:** `https://threadlinehq.com/terms`.
- **Privacy URL:** `https://threadlinehq.com/privacy`. Confirm the real paths before submitting.
- **Platform:** Web, with website URL `https://threadlinehq.com`.

### Step 3: add the products

1. **Login Kit** (Web). Add the redirect URI, which must be **HTTPS, static, with no query parameters and no fragment**. Up to 10 are allowed, each under 512 characters ([Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web)). The app builds it as `${NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback` (`src/lib/integrations/oauth.ts`, `redirectUriFor`; route `src/app/api/oauth/[provider]/callback/route.ts`):
   - `https://threadlinehq.com/api/oauth/tiktok/callback` (production)
   - `https://threadline-fawn.vercel.app/api/oauth/tiktok/callback` (only while the custom domain is not yet live; remove it later)
2. **Content Posting API.** Turn on **Direct Post** ([Get started](https://developers.tiktok.com/doc/content-posting-api-get-started)).
3. **Display API** for `video.list`, if you are keeping it.
4. **Media source verification.**
   - The connector uses `PULL_FROM_URL`. That requires verifying ownership of the **domain** (a DNS TXT record) or an exact **URL prefix** ([Media transfer guide](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide)).
   - Signed R2 URLs on `*.r2.cloudflarestorage.com` cannot be verified by us. Give the R2 bucket a custom domain such as `media.threadlinehq.com` and verify that. The alternative is to switch the connector to `FILE_UPLOAD` (chunks of 5–64 MB, final chunk up to 128 MB, at most 4 GB).
5. **Credentials.**
   - Copy the **Client key** into `TIKTOK_CLIENT_ID` and the **Client secret** into `TIKTOK_CLIENT_SECRET` (Vercel, Production).
   - Leave `TIKTOK_APP_AUDITED` unset until the audit passes.

### Step 4: sandbox build and test (before submitting)

1. Test against the sandbox. A sandbox environment is **required for first-time app reviews** ([App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)).
2. Connect the **private** test account through `/app/<org>/settings/integrations`.
3. Post one video through the full flow.
4. Confirm it appears as SELF_ONLY.
5. **PKCE.** The connector sends PKCE (`usesPkce: true`). The web Login Kit page does not mention PKCE, so confirm in the sandbox that the token exchange succeeds.

### Step 5: record the demo video

Requirements: at least one video, up to 5, each **50 MB or less**. It must show the complete end-to-end flow for every product and scope requested. For a web app, **the domain in the video must match the website URL** ([App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines)).

Suggested shot list (about 3 minutes, 1080p, narrated):
1. Open `https://threadlinehq.com`. Show the footer with the Privacy and Terms links.
2. Sign in as a Threadline user, then go to Integrations and click "Connect TikTok". Show the TikTok consent screen listing the scopes. Approve it and land back on the app showing the connected account.
3. Open an approved video in the publish screen. Show the creator's **nickname** from creator info, the **privacy dropdown with no default** (the options come from creator info), **comment, duet and stitch toggles all off by default**, the **commercial content disclosure** toggle (off by default), the **editable caption**, the **video preview**, and the **Music Usage Confirmation** consent. Click Post.
4. Show the status changing from processing to published, then the post in the TikTok app.
5. If `video.list` is requested, show the metrics appearing on the Performance page.
6. Disconnect the account in the app, to show revocation.

### Step 6: submit the app review

1. Complete "App review" with one explanation per product and scope, matching the video.
2. Submit. The app moves Draft → In Review → Live or Not Approved, and you can resubmit after edits ([Create an app](https://developers.tiktok.com/doc/getting-started-create-an-app)).
3. **Timeline:** "App review may take several days to two weeks after submission" ([FAQ](https://developers.tiktok.com/doc/getting-started-faq)).

### Step 7: the Content Posting audit (a separate gate)

- Passing app review makes the app Live. **Direct Post content stays private until the API client passes the Content Posting audit.** Quote: "to lift the restrictions on content visibility, your API client must undergo an audit to verify compliance with our Terms of Service" ([Get started](https://developers.tiktok.com/doc/content-posting-api-get-started)).
- The audit form lives in the portal. `docs/PLATFORM_APPLICATIONS.md` gives developers.tiktok.com/application/content-posting-api; that page returned 403 without sign-in, so **its fields are unverified here**.
- Expect it to ask for the demo video, the UX compliance in §5 and a description of data handling.
- **Timeline:** TikTok publishes no figure for the audit. "About 5–10 business days" in `PLATFORM_APPLICATIONS.md` is a reported estimate, **not an official one**.
- **Realistic end to end:** 1–2 weeks of build fixes (§6), then up to 2 weeks for app review, then the audit (unknown, plan for 1–3 weeks). That totals **roughly 3–7 weeks** from starting.
- After the audit passes, set `TIKTOK_APP_AUDITED=true` and redeploy.

---

## 3. What an unaudited app can do

Source: [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines) and [Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post).

- All content is restricted to **SELF_ONLY** (private) viewing.
- **Up to 5 users can post in a 24-hour window.**
- The posting account **must be set to private** at the time of posting. Posting to a public account is blocked at `/publish/video/init/`.
- To make a video public later, the owner switches the account to public and then changes each video's privacy to "Everyone" by hand.
- Rate limits:
  - 6 requests per minute per user token on Direct Post init;
  - 20 per minute on creator-info;
  - a per-creator daily post cap (the error is `spam_risk_too_many_posts`) and a per-client daily cap on active publishing users. **Neither number is published.**

**Consequence for Threadline:** until the audit passes, TikTok is a **manual publish** channel. The registry's manual fallback already covers it: publish in-app, then paste the URL back. Do not onboard a client to TikTok API publishing on an unaudited client.

---

## 4. Tokens

- Authorise at `https://www.tiktok.com/v2/auth/authorize/`.
- Exchange tokens at `https://open.tiktokapis.com/v2/oauth/token/`, which is what the connector uses.
- **Unverified:** access-token and refresh-token lifetimes. The "Manage user access tokens" page returned 403. Read them in the portal and make sure the job runner refreshes tokens before they expire.

---

## 5. Direct Post UX requirements (enforced at audit)

Source: [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines) and [Query Creator Info](https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info).

1. **Call creator info before each post** (`POST /v2/post/publish/creator_info/query/`). Show the creator's nickname. Stop if the creator cannot post more today.
2. **Privacy level.** The user selects it from a dropdown **with no default**. The options must equal `privacy_level_options`.
3. **Interaction settings.** Comment, duet and stitch are **all off by default** and turned on manually. If creator info says one is disabled, grey it out. Photo posts support comments only.
4. **Commercial content disclosure**, off by default:
   - "Your Brand" labels the post "Promotional content".
   - "Branded Content" labels it "Paid partnership".
5. **No promotional watermarks or logos** added to the creator's content.
6. **Preset caption text must be editable** by the user before posting.
7. **Show a preview** of the content.
8. Show the **Music Usage Confirmation** declaration, and send media only **after explicit user consent**.

---

## 6. Gaps in the current connector against §5 (report only; code not changed)

`src/lib/integrations/connectors/tiktok.ts`:

| # | Gap | Why it matters |
|---|---|---|
| 1 | No call to `creator_info/query` before `publish/video/init` | Required by the guidelines |
| 2 | `privacy_level` is hard-coded to `PUBLIC_TO_EVERYONE` when `TIKTOK_APP_AUDITED=true` | It must come from the user's choice, with no default |
| 3 | `disable_duet`, `disable_comment` and `disable_stitch` are sent as `false`, which switches all three **on** by default | The guidelines require them off until the user turns them on, and they must respect creator info's disabled flags |
| 4 | No commercial content disclosure fields (`brand_content_toggle` / `brand_organic_toggle` in the Direct Post API) | Required UX. **Check the exact field names in the Direct Post reference.** |
| 5 | Unclear whether the publish UI shows the nickname, preview, editable caption and music consent | Needs a UI check before recording the demo |
| 6 | Uses `PULL_FROM_URL` with R2 signed URLs | Needs a verified custom media domain, or a switch to `FILE_UPLOAD` |
| 7 | Requests `video.list` | Needs the Display API product and a demo of it, or remove the scope |

Fixing 1–5 is a build task for the publish screen. Fix it before recording the demo video, because rejection costs a fresh review cycle.

---

## 7. Other platforms (short notes)

### Meta: Instagram, Facebook Page, Threads

- **Publishing permissions.**
  - Instagram: `instagram_business_content_publish` (Instagram Login) or `instagram_content_publish` (Facebook Login), plus `instagram_basic`.
  - A **professional** account is needed.
  - Limit: **100 API-published posts per rolling 24 hours per account**; a carousel counts as one ([Content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)).
  - Facebook Page and Threads scopes are as listed in `docs/PLATFORM_APPLICATIONS.md` §4b.
- **App Review.** It is required for anyone without a role on the app ([App Review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review)). The submission needs:
  - one **screen recording per permission** at 1080p or better, showing the user granting it;
  - reviewer test credentials, and never your personal account;
  - a privacy policy URL;
  - a unique justification for each permission.
- **Review timeline:** "you should receive a decision within a week" ([Submission guide](https://developers.facebook.com/docs/app-review/submission-guide)).
- **Business Verification.** It is mandatory for advanced access when other businesses use the app ([Business verification](https://developers.facebook.com/docs/development/release/business-verification)). The document list and timeline are in Business Manager help and **were not verified here**.
- Start business verification first. It is document-driven and independent of code. One verification covers Instagram, Facebook and Threads.
- Also have ready: a data-deletion instructions URL (a standard app-settings field; **not confirmed on the page fetched**).
- Redirect URIs: `…/api/oauth/instagram/callback`, `…/api/oauth/facebook/callback`, `…/api/oauth/threads/callback`.

### YouTube (Google)

- **Uploads from unverified API projects created after 28 July 2020 are private until audit** ([videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert)). This is the same trap as TikTok, and `PLATFORM_APPLICATIONS.md` does not mention it.
- Quota: default 10,000 units a day, plus **100 `videos.insert` a day** and 100 `search.list` a day. An upload costs **1 unit in the Video Uploads bucket**, not 1,600 as `TECHNICAL_HANDOFF.md` says ([quota and audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)).
- More quota, and the lifting of the private-upload restriction, both go through the **YouTube API Services Audit and Quota Extension Form**. No official timeline was found.
- **OAuth verification** for sensitive scopes (`youtube.upload`, `youtube.readonly`) needs:
  - a privacy policy on the same domain as the home page;
  - Search Console domain verification;
  - a justification per scope;
  - an unlisted YouTube demo video of the consent flow.
- Verification typically takes **3–5 business days** ([sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)).
- Redirect: `…/api/oauth/youtube/callback`.

### LinkedIn

- **Share on LinkedIn** is self-serve. Add the product and you get `w_member_social`. Limits: 150 requests per member per day, 100,000 per app per day ([Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)). It posts to the founder's own profile. This is the only gate-free publishing path.
- **Community Management API** (member post analytics, Executive Management use case) is "only available to registered legal organizations for commercial use cases". It needs:
  - a verified business email (personal addresses fail);
  - the legal name, registered address, website and privacy policy;
  - **app verification by a super admin of the organisation's LinkedIn Page**;
  - no "Linked" or "In" in the app name.
- **A rejection means creating a new app**; you cannot re-apply with the same one. The Standard tier needs a narrated, downloadable screencast ([CM app review](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)).
- **API version:** the connector sends `LinkedIn-Version: 202409`. The oldest documented version is now 202510, which sunsets on 15 October 2026 ([versioning](https://learn.microsoft.com/en-us/linkedin/marketing/versioning)). Update to 202609 before any live test.
- Redirect: `…/api/oauth/linkedin/callback`.
- **No LinkedIn automation tools**, for outreach or anything else ([User Agreement §8.2](https://www.linkedin.com/legal/user-agreement)).

### X

- **Pay-per-use**, with no subscription or minimum ([X API pricing](https://docs.x.com/x-api/getting-started/pricing)):
  - $0.015 per post created;
  - **$0.20 per post that contains a URL**;
  - reads $0.005 per post and $0.010 per user;
  - "owned reads" $0.001.
- A thread of N replies is N post creations.
- The docs no longer mention legacy Basic or Pro tiers, so update the "Paid API tier" wording in the checklist.
- Redirect: `…/api/oauth/x/callback`.

---

## 8. Filing order (all platforms)

| # | Action | Gate length (official where stated) |
|---|---|---|
| 1 | Fill in the legal entity, address and privacy contact on the site; connect `threadlinehq.com` | Owner |
| 2 | Create the LinkedIn app and add Share on LinkedIn; fix the API version | None |
| 3 | Meta Business Verification | Unverified; document-driven |
| 4 | Google Cloud project, consent screen, sensitive-scope verification | 3–5 business days |
| 5 | TikTok organisation, app, sandbox; fix §6 gaps; app review | "Several days to two weeks" |
| 6 | TikTok Content Posting audit | No official figure |
| 7 | YouTube audit and quota extension (also lifts private-only uploads) | No official figure |
| 8 | LinkedIn Community Management (Development tier, then Standard) | No official figure; one shot per app |
