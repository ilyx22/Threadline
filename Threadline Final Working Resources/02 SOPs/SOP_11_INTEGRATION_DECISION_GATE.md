# DRAFT - BRANDING PENDING

**Status:** Internal operating document. Use now, but treat as v1 until validated by real Threadline prospects/clients.

---

# SOP 11 - Integration Decision Gate

## Trigger
3-5 clients reveal repeated platform usage/manual burden, a repeated client request, or an integration becomes a genuine commercial/delivery blocker.

## Objective
Choose the simplest access/publishing architecture justified by evidence.

## Step 1 - Measure
For each platform:
- clients using it;
- posts/month;
- manual minutes/month/client;
- error/rework risk;
- analytics/data needed;
- client access friction;
- revenue/sales importance.

## Step 2 - Candidate paths
A. Manual/native delegated access.
B. Approved aggregator/publishing layer.
C. Direct official API/OAuth integration.

## Step 3 - Compare
Score only for decision support:
- engineering/build time;
- platform review/audit burden;
- recurring software/API cost;
- analytics available;
- reliability;
- permission/security model;
- vendor lock-in;
- client UX;
- strategic differentiation.

## Step 4 - Rules
- Never require password sharing as the product architecture.
- No browser-extension posting hack.
- No fake 'connected' state.
- If direct API requires audit/review, document exact official requirement before committing.
- If manual burden is trivial, keep manual.

## Step 5 - Decision
Choose MANUAL / AGGREGATOR / DIRECT for each relevant platform and create implementation task only for the selected path.

## Definition of done
Decision is based on real client/platform/load evidence, not SaaS aesthetics.

## NEXT SOP
If implementation is approved, create a scoped engineering brief and then return to the active operating SOP. Do not let integration work pause acquisition unless it is a signed-client blocker.
