import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { activateEngagement, createDraftEngagement } from "./engagements";
import { decideRenewal, openDueRenewals } from "./renewals";

const stamp = Date.now();
let orgId = "";
let engagementId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-renew-${stamp}`, name: "QA Renew", kind: "client", synthetic: true } })).id;
  const e = await prisma.$transaction((tx) => createDraftEngagement(tx, { orgId, timezone: "Europe/London" }));
  engagementId = e.id;
  // Periods: 1 Jun, 29 Jun, 27 Jul; the initial term ends 24 Aug.
  await activateEngagement(e.id, "2026-06-01", new Date("2026-06-02T09:00:00Z"));
});
after(async () => {
  await prisma.renewalReview.deleteMany({ where: { orgId } });
  await prisma.crmOutbox.deleteMany({ where: { entityId: { startsWith: engagementId } } });
  await prisma.job.deleteMany({ where: { type: "crm.sync" } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("renewals (RNW-01)", () => {
  it("opens once, 21 days before the initial term ends, with a task and a CRM opportunity", async () => {
    assert.equal((await openDueRenewals(new Date("2026-08-01T09:00:00Z"))).filter((r) => r.orgId === orgId).length, 0, "too early");
    const opened = (await openDueRenewals(new Date("2026-08-04T09:00:00Z"))).filter((r) => r.orgId === orgId);
    assert.equal(opened.length, 1);
    assert.equal(opened[0].dueDate.toISOString().slice(0, 10), "2026-08-24");
    assert.equal((await openDueRenewals(new Date("2026-08-05T09:00:00Z"))).filter((r) => r.orgId === orgId).length, 0, "only once");
    assert.ok(await prisma.task.findFirst({ where: { orgId, title: { contains: "Renewal review" } } }));
    assert.ok(await prisma.crmOutbox.findFirst({ where: { idempotencyKey: `deal:${engagementId}:renewal:3` } }));
  });

  it("is decided by a person, once; ending it ends the engagement", async () => {
    const review = await prisma.renewalReview.findFirstOrThrow({ where: { orgId } });
    const decided = await decideRenewal(review.id, "ended", "Client is hiring in-house", "staff");
    assert.equal(decided.state, "ended");
    assert.equal((await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } })).status, "ended");
    await assert.rejects(decideRenewal(review.id, "renewed", "changed mind", "staff"), /already been decided/);
  });
});
