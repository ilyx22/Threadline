# Owner dry-run script: one synthetic client, end to end

**Purpose:** find the friction before a real client does, and measure real owner minutes. This replaces assumptions; it is the Blueprint's human-hours test.

**Where to run it:**
- **Locally, or on the primary deployment once it is configured.**
- **Never on the mirror.**

**Rules:**
- Use a synthetic organisation named `DRYRUN <date>`.
- Synthetic activity is **excluded from proof, billing and messages**:
  - Stripe stays in **test mode**.
  - Invitations go to addresses you own.
  - Publish by the **manual route** only (record a URL, post nothing).
  - Never mark anything as a testimonial or case study.
  - Delete the org afterwards through offboarding.
- Use a stopwatch.
  - Record **active minutes** and **waiting minutes** separately.
  - Class each step as OWNER-ONLY / DELEGATABLE / AUTOMATABLE / WAITING.
  - Log friction (anything confusing, slow or wrong) as it happens.

| # | Step | Where | Done when | Active min | Waiting min | Class | Friction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Application**: submit as a prospect | `/apply` | The application shows in Admin → Applications | | | | |
| 2 | **Review**: read and decide | Admin → Applications | Decision recorded; the reply drafted (not sent to a real person) | | | | |
| 3 | **Conversion**: convert to a client with the standard offer | Application → Convert | Org, engagement and offer snapshot exist; test-mode invoice (not sent) | | | | |
| 4 | **Invitation**: invite the client admin (your second address) | Admin → Client → Team | Invite accepted; two-factor offered | | | | |
| 5 | **Onboarding**: complete it as the client | `/onboarding/[org]` | Brand Brain sections confirmed; installation signed off | | | | |
| 6 | **Client teammate**: invite an approver and a viewer | Settings → Team | Each sees only what their role allows | | | | |
| 7 | **Content delivery**: mine a transcript, generate ideas, write a script, record, upload a cut | Library → Create → Recording | Piece reaches review with a version | | | | |
| 8 | **Approval and revision**: request a change, re-cut, approve by bulk approval | Approvals | Approval covers the new version only | | | | |
| 9 | **Results**: record a manual publish, enter performance, freeze an expectation beforehand | Distribution → Performance | Diagnosis shows expected vs actual | | | | |
| 10 | **Report**: weekly report, then a four-week review; download the PDF | Reports | Final version visible to the client | | | | |
| 11 | **Support**: raise a Help request as the client; answer it as staff | Help / Admin | Status changes visible both sides | | | | |
| 12 | **Offboarding**: offboard the synthetic client; export first | Settings → Your data; Admin → Offboarding | Access revoked; export link works; deletion scheduled | | | | |

**Afterwards:**

- Totals:
  - owner-only minutes
  - founder-side minutes (steps 5, 7–8 as client)
  - operator minutes per client
  - waiting time
- The three worst frictions, each with a proposed fix.
- Whether the internal 60 min/week founder target looks plausible (it stays internal until real clients confirm it).

Record the results in `docs/launch-pack/operations/DRY_RUN_RESULTS_<date>.md`.
