# Threadline OS tool audit: 26 September 2026

**Question:** does the app work end to end, for the operator and for the client?

**Short answer:** yes, apart from the defects below, which are now fixed. The most important one: every app form cleared the user's input after a failed submit, and a `<select>` could then silently save the wrong value.

**Environment:**
- Local production build (`NEXT_DIST_DIR=.next-qa`, `next start -p 3001`) against the local test database.
- Production, Drive and email were not touched.
- The public frontend was not modified: all 104 frozen files match `evidence-public-freeze.txt` (b344360).

## What was tested

1. **Static checks:** `tsc --noEmit`, `eslint src`, `npm test` and the QA suite (`scripts/qa/run.cjs run-all`) against the rebuilt server.
2. **HTTP crawl:** 77 app routes, once as the super admin (ops@) and once as a client member (northbeam). That is 154 requests, checked for 5xx responses, error markers, 404s, unexpected redirects and the word "monthly".
3. **Browser walkthrough (Claude in Chrome):**
   - 58 staff and workspace routes, with console errors captured.
   - Every operator and client navigation item, including "Getting set up".
   - /admin, onboarding, reports and PDF, help, settings / your data, and effort.
4. **Browser flows** on a prospect:
   - Record a touch.
   - Demand source: a refused save (content credit without a note), then a successful save, then a reload.
   - The flow was checked again after each fix.
5. **Other key flows** were checked through the QA acceptance journeys, which drive the real server actions:
   - Application → convert → invite
   - Approvals, single and bulk
   - Request changes
   - Wedge early commercial test with an uncertainty note
   - Four-week review draft
   - Help request
   - Offboarding export

## Results

| Page / flow | Result |
| --- | --- |
| Operator routes (/admin/*), 77 routes crawled | Pass |
| Client workspace routes (/app/northbeam/*) | Pass. Staff-only pages redirect a client member to /no-access, as designed. |
| Onboarding (/onboarding/[org]) as a client member without Brand Brain rights | **Fixed.** It returned a 500; it now shows the no-access explanation. |
| "Getting set up" navigation item | Pass |
| Browser console on 58 routes | Pass (0 errors) |
| Record a touch | Pass |
| Demand source, refused save | **Fixed.** The chosen value was lost, and the next save stored the wrong source. |
| Demand source, successful save and reload | Pass, after the fix |
| Diagnosis page and four-week review dialog wording | **Fixed.** It said "Monthly strategy review". |
| Review cadence default | **Fixed.** It was one calendar month; it is now 28 days. |
| SOP "Four-week strategy review" | **Fixed.** Title and "Next period" wording. |
| Application → convert → invite | Pass (QA: sales, onboarding, spine:happy) |
| Approvals (single and bulk), request changes | Pass (QA: spine, approvals journeys) |
| Wedge early commercial test with an uncertainty note | Pass (QA: validation) |
| Four-week review draft, reports and PDF | Pass (QA: reports, periods) |
| Help request, your-data export, offboarding | Pass (QA acceptance journeys) |
| Tenancy and role isolation | Pass (QA: tenancy:read/write, roles, spine:isolation) |

## Defects fixed

1. **`src/components/forms/action-form.tsx`** (shared by 66 app forms; not used by the public site).
   - **Problem:** React 19 resets an uncontrolled form after every form `action`, including one that fails. After a refused submit, typed text vanished and selects fell back to their first option. On the prospect page, re-submitting then saved "Not known yet" (source null) instead of the chosen credit.
   - **Change:** the form now dispatches from `onSubmit` with `preventDefault`, so a refused submit keeps what was entered. `action` is kept so that submits made before hydration still POST to the server action and never become a GET that would put values in the URL.
   - On success the form remounts (keyed) and shows the freshly saved values. Calling `reset()` would have restored stale first-render values.
   - `SubmitButton` also reads a pending context, because `useFormStatus` no longer sees the submit.
2. **`src/app/onboarding/[org]/page.tsx`:** changed from `requireOrgAccess` to `requireOrgPage`. A teammate without `brain.edit` now gets the no-access page instead of a 500.
3. **Diagnosis wording:**
   - `src/app/app/[org]/intelligence/diagnosis/diagnosis-editor.tsx` and `page.tsx` (client-visible): "monthly" → "four-week".
4. **Review cadence:**
   - `src/lib/domain/diagnosis.ts`: `REVIEW_INTERVAL_DAYS = 28`.
   - `diagnosis.test.ts` now asserts 28 days.
5. **`src/lib/templates/master.ts`:** the SOP `monthly-review` is titled "Four-week strategy review", with "Next period". The key is unchanged so links still work.

## Open issues

| # | Issue | Severity | Owner |
| --- | --- | --- | --- |
| O-1 | "Monthly" survives in staff-only places where it is correct or harmless: admin metrics "Entered monthly" (calendar business metrics), the active-wedge SOP "or monthly", and the radar demo competitor text "Monthly retainer". | Low | Owner decides; no change is needed for clients. |
| O-2 | Public FAQ wording ("month to month" and others) conflicts with the four-week doctrine. The frontend is frozen, so this was not changed (strategy reconciliation K-01…K-03). | Medium | Owner |
| O-3 | Some flows were verified through QA journeys, not clicked in the browser: bulk approval, help request, export, apply → invite. Real email delivery and file upload were not exercised because email and production were out of scope. | Low | Owner dry run (OWNER_DRY_RUN.md) |
| O-4 | The ActionForm change affects every app form. Unit tests and the QA suite pass, and prospect forms were checked in the browser. The owner's dry run should still watch for forms that don't clear or refresh after saving. | Low | Owner dry run |
| O-5 | Test-environment note, not a defect: in a background automation tab, streamed pages do not reveal or hydrate until a frame is painted. | None | — |

## Test counts (final build)

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint src` | 0 problems |
| `npm test` | 824 / 824 pass (220 suites) |
| QA run-all | 623 pass + 2 pass-with-external-gate, 0 partial, 0 fail, 3 n/a (628 checks) |
| HTTP crawl | 154 requests: 0 5xx; the only markers are the designed /no-access redirects |
| Browser console | 0 errors across 58 routes |
| Public freeze | 104 / 104 OK |
