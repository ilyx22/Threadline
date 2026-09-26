import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { activateEngagement, createDraftEngagement } from "@/lib/commercial/engagements";
import { finaliseReview, openPeriodReview, reviseReview, saveReviewSections } from "./period-review";

const stamp = Date.now();
let orgId = "";
let engagementId = "";
const userId = "reviewer";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-review-${stamp}`, name: "QA Reviews", kind: "client", synthetic: true } })).id;
  const e = await prisma.$transaction((tx) => createDraftEngagement(tx, { orgId, timezone: "Europe/London" }));
  engagementId = e.id;
  await activateEngagement(e.id, "2026-07-01", new Date("2026-08-15T10:00:00Z"));
});
after(async () => {
  await prisma.periodReview.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("four-week reviews (REP-02)", () => {
  it("opens one draft per period with frozen figures, and only for started periods", async () => {
    const r = await openPeriodReview(orgId, engagementId, 1, userId);
    assert.equal(r.status, "draft");
    assert.equal(r.periodStart.toISOString().slice(0, 10), "2026-07-01");
    assert.equal(typeof JSON.parse(r.figures).published, "number");
    assert.equal((await openPeriodReview(orgId, engagementId, 1, userId)).id, r.id, "reopening returns the same draft");
    await assert.rejects(openPeriodReview(orgId, engagementId, 3, userId), /once the period has started/);
  });

  it("refuses to finalise with an empty section, then finalises and supports a correction", async () => {
    const r = await openPeriodReview(orgId, engagementId, 1, userId);
    await assert.rejects(finaliseReview(r.id, orgId, userId), /missing: action, results, problems, future/);
    await saveReviewSections(r.id, orgId, { action: "Shipped six pieces.", results: "Two beat expectation.", problems: "Recording slipped a week.", future: "Batch recording on Tuesdays." });
    const fin = await finaliseReview(r.id, orgId, userId);
    assert.equal(fin.status, "final");
    await assert.rejects(saveReviewSections(r.id, orgId, { action: "x", results: "x", problems: "x", future: "x" }), /Only a draft/);
    const v2 = await reviseReview(r.id, orgId, userId, "Views were double counted");
    assert.equal(v2.version, 2);
    await finaliseReview(v2.id, orgId, userId);
    const v1 = await prisma.periodReview.findUniqueOrThrow({ where: { id: r.id } });
    assert.ok(v1.supersededAt, "the first final is kept and marked replaced");
    assert.equal(v1.action, "Shipped six pieces.");
  });
});
