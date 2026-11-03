# A08: account security and renewals (3 Nov 2026)

> **Status:** DRAFT. Owner fills in the blanks marked **?**.
>
> **Scope:** security per account (login, 2FA, recovery, who pays, renewal). It sits alongside the subscriptions register V14 on Drive (`1tQBpwltZojFLY544-m5Cmt4m6kKHhZol`) and doesn't replace it.
>
> **Never put passwords, recovery codes, API keys or card numbers here.** Write "in password manager", not the value.

## Accounts

| Account | Login email | 2FA | Recovery stored | Paid by | Plan / cost | Renews | Notes |
|---|---|---|---|---|---|---|---|
| Google Workspace (threadlinehq.com) | ilyas@threadlinehq.com | ? | ? | ? | ? | ? | Holds business mail and the social@ alias; the most important account to protect |
| Namecheap | username ilyx22 | ? | ? | PayPal | 5 outreach domains + main domain | Oct 2027 (outreach), Sept 2027 (.co) | Auto-renew on |
| Vercel | owner | ? | ? | — | Hobby (free, non-commercial) | — | Pro needed before the first paying client |
| Neon (production DB) | Google sign-in | via Google | via Google | — | Free | — | Short restore window; decide backups before real client data |
| Cloudflare R2 | Google sign-in | via Google | via Google | PayPal | Usage; £50 cap and alerts | — | |
| Resend | ilyas@threadlinehq.com | ? | ? | — | Tier unverified | ? | Transactional mail only |
| Threadline app owner account | ilyas@threadlinehq.com | **On** (enforced for staff) | Recovery codes: ? | — | — | — | 2FA prompt seen live 3 Nov |
| Calendly | ilyas@threadlinehq.com | ? | ? | **Personal PayPal** | Paid; plan unverified | ? | Consider moving billing to a business method |
| Attio | ilyas@threadlinehq.com | ? | ? | — | **Free** (Pro trial left to lapse, 3 Nov) | — | Check on 4 Nov that data is intact |
| Zapmail (10 mailboxes) | **i.sumra22@hotmail.com** | ? | ? | ? | Starter $39/mo | **~19–20 Nov** | The only business-critical account on a personal email. Move it to ilyas@ or secure the hotmail account with 2FA |
| Smartlead | ilyas@threadlinehq.com | ? | ? | ? | Base $39/mo | **3 Dec** | Warm-up running; no API on Base |
| Instantly | not confirmed | ? | — | — | No paid plan | — | Close it or record it |
| GitHub (repo ilyx22/Threadline) | owner | ? | ? | — | Free | — | main deploys to production; 2FA strongly advised |
| Claude | owner | ? | ? | ? | Max (plan unverified) | ? | Separate from Anthropic API billing |
| LinkedIn (personal) | ilyas@threadlinehq.com | ? | ? | — | Free | — | The only personal account; no second account |
| X / Instagram / TikTok / Threads / YouTube | ilyas@threadlinehq.com | Passkey on X, TikTok and Instagram (owner-reported, "Dio Brando" Chrome profile); others ? | ? | — | Free | — | TikTok created via US VPN; keep location consistent |

## The five that matter most, in order

1. **Google Workspace:** 2FA on, recovery codes in a password manager. Every other account resets through this mailbox.
2. **GitHub:** 2FA on. A push to main deploys production.
3. **Zapmail:** either move its login to a business address, or give the hotmail account 2FA. It controls all 10 sending mailboxes.
4. **Vercel and Cloudflare:** production and file storage. Confirm 2FA, whether through Google or set directly.
5. **The Threadline owner account:** confirm the recovery codes are stored somewhere other than this computer.

## Renewal dates to watch

- **4 Nov:** Attio is on Free and the data is intact.
- **~19–20 Nov:** Zapmail renewal ($39).
- **3 Dec:** Smartlead renewal ($39).
- **Calendly:** renewal date unknown; check its billing page.
- **Sept/Oct 2027:** domain renewals (auto-renew on).

## Done when

Every **?** is filled in, the five above are confirmed, and no row lists a password or code.
