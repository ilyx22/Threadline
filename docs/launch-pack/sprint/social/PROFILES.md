# Threadline social profiles: setup kit

**Status: drafted; owner review pending.** Prepared 26 September 2026. No account has been created, no handle has been checked for availability and nothing has been posted. The owner creates every account by hand.

Companion files in this folder:
- `ASSET_REGISTER_TEMPLATE.csv`: one row per account.
- `CALENDAR_14_DAYS.md`: the first 14 days of posts, taken from the Drive content pack.

---

## 0. Before any account is created

These gates apply to every platform. If one is not met, stop and record why in the asset register.

1. **Employer clearance.** The master to-do (P1, brand and content engine) says brand-led execution "does not remove the separate employer/outside-business compliance question". A LinkedIn Company Page needs a personal LinkedIn account as its admin. So the LinkedIn page waits on that check.
   - Do not add Threadline to the admin's personal Experience section.
   - Do not create a second personal LinkedIn account. The master to-do and the content engine both forbid it.
2. **Domain.** Every link below uses **threadlinehq.com**, the main domain. It is **not yet connected to the website**: OWNER_DECISIONS D-02 records Google mail and DMARC on the domain, but no web record.
   - The owner must first add the domain to the Vercel project `threadline` and point DNS at it.
   - Then open `https://threadlinehq.com/how-it-works` and confirm it loads before pasting it anywhere. The route exists in the codebase (`src/app/(marketing)/how-it-works/page.tsx`, listed in `sitemap.ts` and allowed in `robots.ts`), but it has never been served on this domain.
   - Until then, leave the link fields empty. Do not put a dead link on a profile.
3. **Identity.** Threadline is company-led. No founder name, face or photo, and no invented spokesperson or persona. Replies are written as "we" (Threadline). Sales conversations and contracts still name a real person (BRAND_GUIDELINES §6).
4. **Claims.** Every profile follows these rules:
   - no pricing;
   - no guarantees of views, followers, leads or revenue;
   - no proof we do not hold;
   - no "AI-powered" category language;
   - four-week wording if terms ever come up ("every four weeks", "12-week initial engagement"), never "monthly".
   - **The public site's proof band is not repeated.** Its "100m+ views" and "10,000+ conversions" figures (CLAIMS_AUDIT P-01) appear on no profile and in no post.
5. **Email.** Use a role mailbox on the domain for every signup (placeholder `{{social_email}}`, for example a `social@` alias the owner creates in Google Workspace). Never use a personal address.
   - This keeps the accounts transferable.
   - It keeps the founder's personal identity off the recovery path.

### The three-second profile test

This is the pass condition for every profile below (master to-do P1; content engine "Profile-as-funnel architecture"). A qualified visitor must be able to tell, in about three seconds:
- **Buyer:** who it is for.
- **Problem:** what goes wrong today.
- **Mechanism or proof:** how Threadline addresses it.
- **Next action:** what to do next.

Proof is a gap at launch. We hold no client result we can publish, so the mechanism does that job. The page and the pinned post show the loop (research, root idea, native expressions, signal, next test) in place of a result.

### Buyer wording: an owner decision

BRAND_GUIDELINES §6 says to "name the wedge, not the umbrella", and gives "For founder-led AI advisory firms" as its example. The content pack uses the umbrella, "expert-led B2B firms". So each bio below comes in two versions:
- **A (umbrella):** matches the pack. Use it if the wedge is not yet confirmed for public use.
- **B (wedge):** matches the brand guideline. It names the buyer, not the category, so it does not break the "AI is not the public category" rule.

The owner picks one, and the same version is used on every platform.

### Handle priority

Handle availability has **not been checked**. The owner checks each one at signup. Consistency across platforms matters more than a short handle: choose the highest option that is free on **all** planned platforms. If none is, use the highest option free on each platform and record the differences in the register.

| Priority | Handle | Notes |
| --- | --- | --- |
| 1 | `threadlinehq` | Matches the domain. Most likely to be free everywhere. Recommended standard. |
| 2 | `threadline` | Shortest. Probably taken on most platforms. Take it only if it is free on all of them, or at least on LinkedIn and X. |
| 3 | `threadline_hq` | For platforms that allow underscores (X, Instagram/Threads, TikTok, YouTube). |
| 4 | `threadline.hq` | For platforms that allow full stops (Instagram/Threads, TikTok). Readers often misread it; use it as a last resort. |
| 5 | `threadline-hq` | LinkedIn public URL and YouTube handle only (they allow hyphens). |

Reserve one account per platform. Do not register holding duplicates.

### Assets

All paths are relative to `docs/launch-pack/brand-kit/`.

| Use | File | Why |
| --- | --- | --- |
| Avatar, recommended | `icons/avatar-dark-800.png` (800×800) | Night ground `#101A33` with the marigold mark. Marigold on night is 5.9:1 (BRAND_GUIDELINES §2) and reads at feed size. |
| Avatar, alternate | `icons/avatar-light-800.png` (800×800) | Paper ground `#F5F2EA`. Marigold on a light ground is 2.9:1, so the mark is weaker at small sizes. Keep this as the alternate. |
| Avatar, small upload limits | `icons/avatar-dark-400.png` (400×400) | Where a platform rejects 800 px. |
| LinkedIn banner | `social/threadline-linkedin-banner-1128x191.png` | Built for the Company Page. The content sits right of where the logo overlaps the banner. |
| X header | `social/threadline-x-header-1500x500.png` | Carries the canonical line "We are not trying to make you famous…". |
| YouTube banner | **Not in the kit (gap).** | YouTube needs 2560×1440, with the safe area in the centre 1546×423. Commission it from the X header's SVG and composition before YouTube goes public. Until then, leave the banner empty. |

Use the same avatar on every platform. Do not crop the mark into a circle badge: the avatar files are already built for a circular crop (BRAND_GUIDELINES §1, "Do not").

### Security checklist (every platform)

- [ ] Sign up with `{{social_email}}`, never a personal address.
- [ ] Generate a unique password in the owner's password manager, and save it there at once.
- [ ] Turn on 2FA with an **authenticator app** where the platform allows it (SMS only as a fallback).
- [ ] Save the backup or recovery codes in the password manager entry. Do not keep them in email or on the desktop.
- [ ] Set a recovery email or phone the owner controls. Record which one (not the value) in the register's "recovery method stored" column.
- [ ] Fill in the asset-register row: platform, handle, URL, owner, 2FA, recovery, status, purpose, created date.
- [ ] Connect no third-party posting, engagement or growth tools. Schedule only through native or officially authorised tools, and keep replies human (content pack publishing gate; transcript audit §6: no engagement pods or platform-risky automation).
- [ ] Run the three-second test on a phone and a desktop, logged out, before the first post.

---

## 1. LinkedIn Company Page (primary trust layer)

**Role.** This is the trust layer that prospects from LinkedIn outbound land on when they look Threadline up (transcript audit §1: outbound is the primary acquisition experiment, and content is the trust layer). It is the most important profile in this kit.

| Field | Content | Limit / count |
| --- | --- | --- |
| Page name | Threadline | 100 chars; 10 used |
| Public URL | `linkedin.com/company/threadlinehq`, then `…/threadline`, then `…/threadline-hq` (handle priority above) | Letters, numbers, hyphens |
| Tagline, version A | For expert-led B2B firms: the expertise in your calls, turned into authority content and a commercial learning loop. | 120 chars; **116** |
| Tagline, version B | For founder-led AI advisory firms: the expertise in your calls, turned into authority content and a learning loop. | 120 chars; **114** |
| Website | `https://threadlinehq.com` (only after D-02 is done) | |
| Custom button | "Visit website", linking to `https://threadlinehq.com/how-it-works` | |
| Industry | Owner to choose (for example "Marketing Services"). Choose what is true. | |
| Company size | Owner to state honestly. Do not inflate it. | |
| Location / address | `{{postal_address}}` placeholder. Never invent an address; leave it blank if unconfirmed. | |
| Logo | `icons/avatar-dark-800.png` | 400×400 minimum |
| Banner | `social/threadline-linkedin-banner-1128x191.png` | 1128×191 |

**About / Overview** (limit 2,000 characters; **1,012** used). Version A is shown. For version B, swap "expert-led B2B firms" for "founder-led AI advisory firms".

> Threadline works with expert-led B2B firms whose strongest thinking is trapped in sales calls, proposals and years of operator judgement.
>
> The constraint is rarely a shortage of expertise. It is the absence of a repeatable system that extracts it, packages it for the right buyer, distributes it in the native form of each platform and learns from the response.
>
> How it works: buyer research, then a root idea, then native expressions for each platform, then distribution, buyer response and commercial signals, then diagnosis and the next test. Every asset traces back to one root idea, so the learning does not fragment across platforms.
>
> The division of labour: You talk. You record. You approve. You sell. Threadline handles the machine.
>
> We are not trying to make you famous. We are trying to make you familiar to the people who matter.
>
> What we will not do: promise views, followers, leads or revenue, or present analysis as a client result.
>
> See how the system works: https://threadlinehq.com/how-it-works

Adapted from the pack's LinkedIn post 1, post 3 and root thesis 5, plus two canonical lines used word for word. No figures, no pricing, no founder.

**Pinned / featured.** Pin **LinkedIn post 3** from the pack ("A calendar is not a system", which spells out the loop). It carries the mechanism, which is the part of the three-second test we can pass without proof. Once `/how-it-works` resolves, add it as the second featured item.

**Three-second test:**
- Buyer: tagline.
- Problem: the first two lines of About.
- Mechanism: the pinned loop.
- Next action: the "Visit website" button.

**Setup, specific to LinkedIn:**
- [ ] Employer clearance confirmed (gate 1).
- [ ] 2FA on the admin's personal LinkedIn account, which is where page access lives.
- [ ] Add no second admin unless a real, named second person exists.
- [ ] Turn the page's "Visit website" button on only after D-02.
- [ ] Register row filled in.

---

## 2. X

**Role.** A text-argument channel: the pack's 30 source posts are written for it. Posting is modest and review-led (see the calendar).

| Field | Content | Limit / count |
| --- | --- | --- |
| Handle | `@threadlinehq`, then `@threadline`, then `@threadline_hq` | 4–15 chars; letters, numbers, underscore |
| Display name | Threadline | 50 chars; 10 used |
| Bio, version A | For expert-led B2B firms whose best thinking is stuck in calls and proposals. We turn it into authority content, then learn from buyer response. | 160 chars; **144** |
| Bio, version B | For founder-led AI advisory firms whose best thinking is stuck in calls and proposals. We turn it into authority content and learn from response. | 160 chars; **145** |
| Website field | `threadlinehq.com/how-it-works` (29 chars; field limit 100). Only after D-02. | |
| Location | Leave blank, or a region the owner confirms. Never a street address. | 30 chars |
| Avatar | `icons/avatar-dark-800.png` | 400×400 recommended |
| Header | `social/threadline-x-header-1500x500.png` | 1500×500 |

**CTA.** The website field. Posts carry no links during week 1; the profile carries the CTA.

**Pinned post.** **X post 3** from the pack: "A content calendar tells you what goes live. A content operating system tells you why it exists, what happened, and what changes next." Add one reply to it:
- after D-02, the link `threadlinehq.com/how-it-works`;
- before D-02, no link at all.

**Three-second test:**
- Buyer and problem: the bio.
- Mechanism: the pinned post.
- Next action: the website field.

**Setup, specific to X:**
- [ ] 2FA by authenticator app. X has restricted SMS 2FA to paid tiers, so use the app.
- [ ] Save the backup code in the password manager.
- [ ] Do not buy verification or promotion (transcript audit §6: no paid boosts before the launch channel works).
- [ ] Register row filled in.

---

## 3. Threads

**Role.** Conversational adaptations: the pack's 15 Threads posts.

**Dependency.** A Threads profile is created from an Instagram account and **takes the Instagram username**. Settle the Instagram handle (section 4) first.

| Field | Content | Limit / count |
| --- | --- | --- |
| Handle | Same as Instagram: `threadlinehq`, then `threadline`, then `threadline_hq`, then `threadline.hq` | Set by Instagram |
| Name | Threadline (imported from Instagram) | |
| Bio (version A; swap the buyer phrase for B) | For expert-led B2B firms: your best thinking is stuck in calls. We turn it into authority content, then learn from buyer response. | 150 chars; **130** |
| Link | `https://threadlinehq.com/how-it-works` (only after D-02) | Up to 5 links |
| Avatar | `icons/avatar-dark-800.png` | |

**CTA.** The profile link.

**Pinned post.** **Threads post 3** from the pack ("A content calendar answers 'what goes live?' A real operating system also answers…").

**Setup:**
- [ ] 2FA is set on the parent Instagram account in Meta Accounts Center, and covers Threads.
- [ ] Record Threads as its own register row, with a note that it depends on Instagram.
- [ ] Set the profile to public.

---

## 4. Instagram (reserve and complete; no posting in the first 14 days)

**Role.** It exists so the handle is held and Threads can be created. There is no feed content yet: the pack's 10 short-form scripts have not been recorded. Transcript audit §6 also rules out a secondary platform before the launch channel and fulfilment are working.

| Field | Content | Limit / count |
| --- | --- | --- |
| Username | `threadlinehq`, then `threadline`, then `threadline_hq`, then `threadline.hq` | 30 chars |
| Name | Threadline | 30 chars; 10 used |
| Bio (version A; line breaks count as characters) | For expert-led B2B firms.<br>Your expertise, turned into authority content.<br>You talk. You record. You approve. You sell.<br>See how it works below. | 150 chars; **141** |
| Link | `https://threadlinehq.com/how-it-works` (only after D-02) | Up to 5 links |
| Account type | Professional (Business). This gives the link and insights without a personal profile. | |
| Avatar | `icons/avatar-dark-800.png` | 320×320 minimum |

**CTA.** The bio link.

**Pinned or featured item.** None until video exists. When scripts are produced and approved, pin **script 3** from the pack (the four-question gate), because it is the most reusable. Then pin **script 2** (calendar vs operating system).

**Setup:**
- [ ] 2FA by authenticator app in Meta Accounts Center.
- [ ] Download the recovery codes into the password manager.
- [ ] Do not link the account to a personal Facebook profile. If Meta requires a Facebook Page, use a Threadline page, not a personal one.
- [ ] Register row filled in, status "reserved".

---

## 5. YouTube (reserve and complete; no uploads in the first 14 days)

**Role.** It holds the handle for the pack's first long-form video ("Why Founder-Led B2B Content Fails (Even When the Expertise Is Excellent)"), which is not yet recorded.

| Field | Content | Limit / count |
| --- | --- | --- |
| Handle | `@threadlinehq`, then `@threadline`, then `@threadline-hq`, then `@threadline_hq` | 3–30 chars |
| Channel name | Threadline | 10 used (limit set by YouTube; keep it short) |
| Description | See below | 1,000 chars; **702** |
| Links | `https://threadlinehq.com/how-it-works` (only after D-02) | |
| Profile picture | `icons/avatar-dark-800.png` | 800×800 recommended |
| Banner | **Gap:** none in the kit (see Assets) | 2560×1440 |

**Description** (version A):

> Threadline works with expert-led B2B firms whose best thinking is stuck in sales calls, proposals and years of operator judgement.
>
> On this channel we break down why expert-led content fails even when the expertise is excellent, and how a system turns one idea into native content for each platform, then learns from how buyers respond.
>
> The loop: buyer research, root idea, native expressions, distribution, buyer response, diagnosis, next test.
>
> Examples on this channel are analysis, labelled as analysis. They are not client results.
>
> We are not trying to make you famous. We are trying to make you familiar to the people who matter.
>
> See how the system works: https://threadlinehq.com/how-it-works

The labelling line comes from pack outline section 8: a public company teardown, "clearly labelled as analysis rather than a client result".

**Featured item.** The first long-form video, once recorded and approved. Leave the channel trailer empty until then.

**CTA.** The channel link. Per pack outline section 9, the in-video CTA ("inspect the system / request a research conversation") is used only after the site and booking path pass QA. Keep the research conversation separate from a sales call (transcript audit §4A).

**Setup:**
- [ ] Create the channel as a **Brand Account** under the `{{social_email}}` Google account, so it is not tied to a personal name and can have managers added later.
- [ ] Turn on 2-Step Verification on that Google account.
- [ ] Store backup codes in the password manager.
- [ ] Register row filled in, status "reserved".

---

## 6. TikTok (reserve only; no posting in the first 14 days)

**Role.** A handle reservation for later short-form distribution of the pack's scripts, once they are recorded. Treat TikTok as a secondary platform: the target market has to be shown to be reachable there before any effort goes in (transcript audit §2: "Validate platform activity rather than assuming it").

| Field | Content | Limit / count |
| --- | --- | --- |
| Username | `threadlinehq`, then `threadline`, then `threadline_hq`, then `threadline.hq` | 2–24 chars |
| Name | Threadline | 30 chars; 10 used |
| Bio (version A) | For expert-led B2B firms: expertise into authority content. How it works: | 80 chars; **73** |
| Website | `https://threadlinehq.com/how-it-works` (only after D-02). The field appears on Business accounts; where TikTok does not offer it, drop "How it works:" from the bio. | |
| Account type | Business | |
| Avatar | `icons/avatar-dark-400.png` | 200×200 minimum |

**Pinned item.** None until video exists. Later, pin **script 3** first, then **script 10** ("The closed loop").

**Setup:**
- [ ] 2-step verification with an authenticator app.
- [ ] Recovery email set to `{{social_email}}`.
- [ ] No growth or engagement tools.
- [ ] Register row filled in, status "reserved".

---

## 7. Items from the Drive pack that need a fix before they are used on profiles

| Pack item | Issue | Fix |
| --- | --- | --- |
| Profile "Short bio" (188 chars) | Too long for X (160), Instagram and Threads (150) and TikTok (80). It also **never names the buyer**, so it fails the three-second test. | Use the per-platform bios above, which open with the buyer. |
| Profile CTA `threadlinehq.com/how-it-works` | The route exists in code, but the domain has no web record (D-02; CLAIMS_AUDIT C-04). | Connect the domain, then check the URL loads. Until then, leave link fields empty. |
| Profile "Avatar: existing Threadline mark" | The live site favicon is the **old** "T" mark (BRAND_GUIDELINES §8, item 1). | Use the kit files `icons/avatar-*`, which carry the current mark, not the site favicon. |

---

## 8. Authority basis

| Principle | Source (document and section) | Where it is applied here |
| --- | --- | --- |
| **Charlie Morgan: competence and inbound doctrine.** Content has four jobs: "Demonstrate competence before the sale… Generate inbound conversations and assist outbound conversion." | `THREADLINE_FOUNDER_CONTENT_ENGINE_FINAL_WORKING.md`, Authority item 2 and "Core objective" | Every bio and pinned post shows the mechanism (competence), not a claim. Profile links point to how it works, not a sales pitch. |
| **Charlie Morgan: the profile as the proof layer.** "The profile is a conversion asset, not a biography", and a qualified visitor should understand who, what problem, why credible and the next step "within seconds". "Great content poured into a weak profile is a leak." | Same file, "Profile-as-funnel architecture" and "LinkedIn profile as conversion infrastructure"; master to-do P1 (three-second profile test) | The three-second test on every profile. One primary CTA each. LinkedIn is treated as the main proof surface. |
| **Charlie Morgan: consistency over volatility.** Content never reduces required outbound. | Content engine, "Cadence doctrine" items 1 and 4 | Modest cadence. Secondary platforms are reserved, not activated. |
| **Daniel Fazio: competence display.** | `authority_reuse_gap_register_2026-09-21.md`, Content row ("Charlie inbound/content doctrine; Fazio source-to-multi-asset"); content pack authority line ("Fazio's competence-display and source-to-multi-asset principles"); content engine: content "can publicly demonstrate Threadline competence through… teardowns… expected-vs-actual reviews" | The pins are the pack's mechanism and gate items. YouTube is framed around labelled teardowns. |
| **Daniel Fazio: source to multi-asset.** One source becomes many native assets. | The same gap-register row; pack YouTube "Extraction plan" | The Threads posts are adaptations of the X theses, not copies. YouTube and short video are reserved for the recorded source plus its extraction. |
| **Fazio limit.** "Do not use unsupported forecasts." | Gap register, item 7 | No view, follower or lead expectations appear on any profile. |
| **Marcos Ruiz: PESTO** (Personal, Expertise, Social proof, Trending, Opinions), plus a commercial job for every item. | `transcript_audit_memory_2026-09-24.md` §2 "Content"; BRAND_GUIDELINES §6 | Used in the calendar. On profiles, it explains why the Social-proof slot is empty rather than filled with site claims. |
| **Marcos Ruiz: content runs alongside outbound**, company-led and covert initially. "LinkedIn outbound is the primary acquisition experiment. Threadline-led content is the trust layer." | Transcript audit §1 | LinkedIn Company Page first. No founder identity. Other platforms are reserved only. |
| **What not to trigger.** No secondary platform, paid boost or trend bot before the launch channel works; no engagement pods. | Transcript audit §6 | Instagram, YouTube and TikTok are reserve-only. No tools connected. |
| **Company-led, no fabricated founder or duplicate LinkedIn.** | Master to-do P1; content pack "Use"; BRAND_GUIDELINES §6 | Gate 1 and gate 3. |

**Source note (resolved 26 Sept).** The transcript audit names "Marcos Ruiz/Birdhouse" and "Thomas Murray/Vantage". PESTO is attributed to Marcos Ruiz (Birdhouse) everywhere in the pack.
