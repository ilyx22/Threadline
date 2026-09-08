# DRAFT - BRANDING PENDING

**Status:** Internal operating document. Use now, but treat as v1 until validated by real Threadline prospects/clients.

---

# SOP 01 - Launch Readiness

## Trigger
Use while any Launch Gate item is incomplete.

## Objective
Reach a state where a qualified prospect can book, buy, pay, be onboarded and receive the first week of service without Threadline improvising critical infrastructure.

## Actions - execute in this order
### A. Product / deployment
- [ ] Run responsive browser QA at 1440 / 1024 / 768 / 390.
- [ ] Test client role separately from admin/operator.
- [ ] Verify teleprompter/fullscreen/print and Intelligence/Diagnosis/Install/Proof flows.
- [ ] Verify client cannot retrieve internal-only data by direct URL/server action, not merely hidden navigation.
- [ ] Change demo password/secrets.
- [ ] Deploy production app + Postgres.
- [ ] Run production smoke test.

### B. Client-surface minimum
- [ ] Client Home is action-first: Record / Approve / Decide.
- [ ] `Threadline is working on...` uses computed real records only.
- [ ] Internal/rejected research, AI/provider spend, vendor cost, internal QA/private notes are inaccessible to client role.
- [ ] Recording Readiness intake/status exists or has a manual equivalent ready for client #1.

### C. Commercial path
- [ ] Freeze founding offer: scope, asset count/cadence, channels, 3-month term, setup fee, monthly fee, exclusions.
- [ ] Freeze controllable risk reversal and client dependencies.
- [ ] Agreement/order form/SOW usable and reviewed enough to send as a business draft.
- [ ] Proposal template ready.
- [ ] Invoice/payment collection path ready.
- [ ] Booking page ready with concise qualification questions + reminders.

### D. Fulfilment bench
- [ ] Primary editor candidate identified/tested.
- [ ] Backup editor candidate identified/tested.
- [ ] Editing rates/capacity/turnaround known.
- [ ] File handoff + revision path understood.

### E. Acquisition system
- [ ] CRM/scoreboard ready.
- [ ] First 100 A/B-fit prospects loaded or source workflow proven.
- [ ] Email + LinkedIn profiles credible.
- [ ] First-touch + follow-up v1 ready.
- [ ] 3-5 minute closed-loop demo rehearsed.

## Definition of done
All five sections A-E are green OR a single explicit blocker has been documented with owner/next action/date. "Could probably do it" is not done.

## Stop rule
Do NOT build additional feature modules unless they are required to pass this gate, fix security/deployment, or address a repeated real prospect/client need.

## NEXT SOP
Once Launch Gate is green -> **SOP 02 - Daily Acquisition Operating SOP**. Send real first touches the same day if possible.
