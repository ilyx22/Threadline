import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { defineEarlyWin, recordEarlyWin, signOffInstallation } from "./installation";

const stamp = Date.now();
let orgId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-install-${stamp}`, name: "QA Install", kind: "client", synthetic: true } })).id;
  await prisma.engagement.create({ data: { orgId, status: "active", timezone: "Europe/London", setupFeeMinor: 250000, periodFeeMinor: 250000, initialPeriods: 3 } });
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("installation sign-off and early win (ENG-03)", () => {
  it("refuses sign-off while any checklist item is open, and names them", async () => {
    await assert.rejects(signOffInstallation(orgId, "u"), /not finished yet\. Still open: Business context captured/);
    const e = await prisma.engagement.findFirstOrThrow({ where: { orgId } });
    assert.equal(e.installationSignedOffAt, null);
  });

  it("records the agreed early win and its actual date with evidence, never a future date", async () => {
    await assert.rejects(recordEarlyWin(orgId, { evidence: "First qualified call booked" }), /Agree what the early win is/);
    await defineEarlyWin(orgId, "Three approved scripts recorded in one session");
    await assert.rejects(recordEarlyWin(orgId, { evidence: "Recorded all three on Tuesday", achievedOn: "2999-01-01" }), /future/);
    const e = await recordEarlyWin(orgId, { evidence: "Recorded all three on Tuesday", achievedOn: "2026-09-22" });
    assert.equal(e.earlyWinAchievedOn?.toISOString().slice(0, 10), "2026-09-22");
    await assert.rejects(defineEarlyWin(orgId, "Something else entirely"), /already been recorded/);
  });
});
