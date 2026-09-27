import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { AttioClient } from "./attio";
import { crmBacklog, queueCrm, sendOutboxRow } from "./outbox";

/** A synthetic (test / dry-run) workspace must never reach the live CRM. */
const stamp = Date.now();
let orgId = "";
let calls = 0;
const client = new AttioClient("test", (async () => {
  calls++;
  return new Response(JSON.stringify({ data: { id: { record_id: "rec_x" } } }), { status: 200 });
}) as typeof fetch);

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-synthetic-crm-${stamp}`, name: "QA Synthetic CRM", kind: "client", synthetic: true } })).id;
});
after(async () => {
  await prisma.crmOutbox.deleteMany({ where: { entityId: orgId } });
  await prisma.crmLink.deleteMany({ where: { entityId: orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("CRM outbox and synthetic workspaces", () => {
  it("skips a synthetic workspace's rows without calling the CRM, and keeps them out of the backlog", async () => {
    const row = await queueCrm(prisma, { op: "upsert_company", entityType: "organization", entityId: orgId, name: "QA Synthetic CRM", domain: null }, `company:${orgId}`);
    assert.equal(await sendOutboxRow(row.id, { client }), "skipped");
    assert.equal(calls, 0, "the CRM was never called");
    const after = await prisma.crmOutbox.findUniqueOrThrow({ where: { id: row.id } });
    assert.match(after.lastError ?? "", /synthetic/);
    assert.ok(!(await crmBacklog()).some((r) => r.id === row.id), "not shown as waiting");
  });

  it("sends once the workspace is promoted to a real client", async () => {
    await prisma.organization.update({ where: { id: orgId }, data: { synthetic: false } });
    const row = await queueCrm(prisma, { op: "upsert_company", entityType: "organization", entityId: orgId, name: "QA Synthetic CRM", domain: null }, `company:${orgId}:real`);
    assert.equal(await sendOutboxRow(row.id, { client }), "sent");
    assert.equal(calls, 1);
  });
});
