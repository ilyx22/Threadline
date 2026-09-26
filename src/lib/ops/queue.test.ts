import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { unifiedQueue } from "./queue";

const stamp = Date.now();
let orgId = "";
let recordId = "";
let leadId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-queue-${stamp}`, name: `QA Queue ${stamp}`, kind: "client", synthetic: true } })).id;
  const item = await prisma.contentItem.create({ data: { orgId, title: "Piece" } as never });
  recordId = (await prisma.publishRecord.create({ data: { orgId, contentItemId: item.id, platform: "linkedin", status: "failed", method: "integration", providerStatus: "UNCERTAIN" } })).id;
  leadId = (await prisma.inquiry.create({ data: { orgId, name: `Waiting lead ${stamp}`, occurredAt: new Date(Date.now() - 2 * 86_400_000) } })).id;
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("one operator queue (OPS-01)", () => {
  it("merges sources with cause, next action and link, most urgent first", async () => {
    const q = await unifiedQueue();
    const post = q.find((i) => i.kind === "uncertain post" && i.org === `QA Queue ${stamp}`);
    const lead = q.find((i) => i.kind === "lead waiting" && i.title === `Waiting lead ${stamp}`);
    assert.ok(post && lead);
    assert.equal(post.severity, 3);
    assert.match(post.next, /record whether it posted/);
    assert.match(lead.href, new RegExp(`/pipeline/${leadId}$`));
    assert.ok(q.indexOf(post) < q.indexOf(lead), "severity orders the list");
    for (let i = 1; i < q.length; i++) assert.ok(q[i - 1].severity >= q[i].severity);
    void recordId;
  });
});
