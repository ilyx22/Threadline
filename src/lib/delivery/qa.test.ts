import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { currentQa, QA_CHECKS, recordQaReview, turnaround } from "./qa";

const stamp = Date.now();
let orgId = "";
let itemId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-qa-${stamp}`, name: "QA QA", kind: "client", synthetic: true } })).id;
  const created = new Date(Date.now() - 50 * 3_600_000);
  itemId = (await prisma.contentItem.create({ data: { orgId, title: "Cut", stage: "approved", revisionCount: 2, createdAt: created } as never })).id;
  await prisma.contentEvent.create({ data: { orgId, contentItemId: itemId, type: "stage_change", fromStage: "editing", toStage: "in_review", createdAt: new Date(created.getTime() + 20 * 3_600_000) } });
  await prisma.contentEvent.create({ data: { orgId, contentItemId: itemId, type: "stage_change", fromStage: "in_review", toStage: "approved", createdAt: new Date(created.getTime() + 30 * 3_600_000) } });
});
after(async () => {
  await prisma.qaReview.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

const all = (pass: boolean, note?: string) => QA_CHECKS.map((c) => ({ key: c.key, pass, note }));

describe("internal QA and turnaround (DEL-06)", () => {
  it("needs every check answered and a reason for each failure; binds to the cut", async () => {
    await assert.rejects(recordQaReview(orgId, "u", itemId, { checks: all(true).slice(1) }), /Answer every check/);
    await assert.rejects(recordQaReview(orgId, "u", itemId, { checks: all(false) }), /what is wrong/);
    const r = await recordQaReview(orgId, "u", itemId, { checks: all(true) });
    assert.equal(r.result, "pass");
    assert.equal((await currentQa(orgId, itemId))?.current, true);
    await prisma.asset.create({ data: { orgId, contentItemId: itemId, category: "edited_media", title: "cut 2" } });
    assert.equal((await currentQa(orgId, itemId))?.current, false, "a new cut is not covered by the old pass");
  });

  it("measures turnaround from recorded history", async () => {
    const t = await turnaround(new Date(Date.now() - 7 * 86_400_000), orgId);
    assert.equal(t.pieces, 1);
    assert.equal(t.toReviewHours, 20);
    assert.equal(t.reviewToApprovalHours, 10);
    assert.equal(t.revisions, 2);
    assert.deepEqual(t.byEditor.map((e) => [e.editor, e.toApprovalHours]), [["Unassigned", 30]]);
  });
});
