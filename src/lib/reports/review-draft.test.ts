import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { draftReviewSections } from "./period-review";

const stamp = Date.now();
let orgId = "";
let userId = "";
let reviewId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-rdraft-${stamp}`, name: "QA Review Draft", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `rdraft-${stamp}@example.com`, name: "Operator", passwordHash: "x" } })).id;
  const e = await prisma.engagement.create({ data: { orgId, status: "active", setupFeeMinor: 1, periodFeeMinor: 1 } });
  const figures = { published: 6, views: 4200, inquiries: 3, qualified: 2, callsBooked: 1, won: 0, approvalsGiven: 5, changesRequested: 2, diagnosesApproved: 1, correctionsMade: 2, correctionsWorked: 1, weeklyReportsFinal: 4, computedAt: new Date().toISOString() };
  reviewId = (await prisma.periodReview.create({ data: { orgId, engagementId: e.id, periodNumber: 1, periodStart: new Date(Date.now() - 28 * 86_400_000), periodEnd: new Date(), figures: JSON.stringify(figures), createdById: userId, problems: "Written by the operator; keep this." } })).id;
});
after(async () => {
  await prisma.aiGeneration.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("four-week review drafts (AI-07)", () => {
  it("drafts only empty sections from the frozen figures and never overwrites the operator", async () => {
    const r = await draftReviewSections(reviewId, orgId, userId);
    assert.deepEqual(r.filled.sort(), ["action", "future", "results"]);
    const row = await prisma.periodReview.findUniqueOrThrow({ where: { id: reviewId } });
    assert.equal(row.problems, "Written by the operator; keep this.");
    assert.match(row.results, /4,200 views/);
    assert.match(row.action, /\[demo draft\]/, "demo output is labelled");
    assert.equal(row.status, "draft", "a draft is never finalised by the machine");
    await assert.rejects(draftReviewSections(reviewId, orgId, userId), /nothing was changed/);
  });
});
