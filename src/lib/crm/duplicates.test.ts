import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { provisionClientWorkspace } from "@/lib/commercial/provision";
import { AttioClient } from "./attio";
import { parseAttioRecordRef, sendOutboxRow } from "./outbox";

/**
 * E07: a sale already worked as a deal in Attio must not become a second deal
 * at conversion, and a company with no domain must not be created blind (the
 * CRM cannot match it, so every send would add another).
 */
const stamp = Date.now();
const staff = { userId: "", name: "Operator", role: "internal_operator" as const };
const orgIds: string[] = [];
const DEAL = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const calls: { method: string; url: string }[] = [];
let n = 0;
const client = new AttioClient(
  "test-token",
  (async (url: string, init: RequestInit) => {
    calls.push({ method: String(init.method), url });
    const id = /deals\/records\/([^/?]+)$/.exec(url)?.[1] ?? `rec_e07_${stamp}_${++n}`;
    return new Response(JSON.stringify({ data: { id: { record_id: id }, web_url: null } }), { status: 200 });
  }) as unknown as typeof fetch,
);

before(async () => {
  staff.userId = (await prisma.user.create({ data: { email: `e07-op-${stamp}@example.com`, name: "Operator", passwordHash: "x" } })).id;
});
after(async () => {
  const engagements = await prisma.engagement.findMany({ where: { orgId: { in: orgIds } }, select: { id: true } });
  const members = await prisma.membership.findMany({ where: { orgId: { in: orgIds } }, select: { userId: true } });
  await prisma.crmOutbox.deleteMany({ where: { OR: [{ entityId: { in: orgIds } }, { entityId: { in: engagements.map((e) => e.id) } }] } });
  await prisma.crmLink.deleteMany({ where: { OR: [{ entityId: { in: orgIds } }, { entityId: { in: engagements.map((e) => e.id) } }, { remoteId: { startsWith: `rec_e07_${stamp}_` } }] } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [staff.userId, ...members.map((m) => m.userId)] } } });
});

async function rowsFor(orgId: string) {
  const e = await prisma.engagement.findFirstOrThrow({ where: { orgId } });
  const rows = await prisma.crmOutbox.findMany({ where: { OR: [{ entityId: orgId }, { entityId: e.id }, { operation: "upsert_person", payload: { contains: orgId } }] } });
  return { e, op: (o: string) => rows.find((r) => r.operation === o)! };
}

describe("CRM duplicates (E07)", () => {
  it("reads an Attio record id from a pasted page address or the bare id, and refuses anything else", () => {
    assert.equal(parseAttioRecordRef(`https://app.attio.com/threadlinehq/deals/record/${DEAL.toUpperCase()}/overview`), DEAL);
    assert.equal(parseAttioRecordRef(DEAL), DEAL);
    assert.equal(parseAttioRecordRef("  "), null);
    assert.throws(() => parseAttioRecordRef("Halden deal"), /not an Attio record/);
  });

  it("links the existing deal at conversion, so the won deal updates it instead of creating a second", async () => {
    const r = await provisionClientWorkspace(staff, { name: "E07 Linked Ltd", slug: `qa-e07-linked-${stamp}`, website: "https://e07-linked.example", founder: { name: "Lee Founder", email: `e07-lee-${stamp}@example.com` }, existingCrmDealId: DEAL });
    orgIds.push(r.org.id);
    const { e, op } = await rowsFor(r.org.id);
    const link = await prisma.crmLink.findUnique({ where: { provider_entityType_entityId: { provider: "attio", entityType: "engagement", entityId: e.id } } });
    assert.equal(link?.remoteId, DEAL);

    calls.length = 0;
    assert.equal(await sendOutboxRow(op("upsert_company").id, { client }), "sent");
    assert.equal(await sendOutboxRow(op("upsert_person").id, { client }), "sent");
    assert.equal(await sendOutboxRow(op("upsert_deal").id, { client }), "sent");
    const dealCalls = calls.filter((c) => c.url.includes("/deals/"));
    assert.deepEqual(dealCalls.map((c) => c.method), ["PATCH"], "updated, never created");
    assert.match(dealCalls[0].url, new RegExp(`deals/records/${DEAL}$`));
  });

  it("refuses to link a deal that is already linked to another engagement", async () => {
    await assert.rejects(
      provisionClientWorkspace(staff, { name: "E07 Second Ltd", slug: `qa-e07-second-${stamp}`, founder: { name: "Sam Founder", email: `e07-sam-${stamp}@example.com` }, existingCrmDealId: DEAL }),
      /already linked to another Threadline engagement/,
    );
    assert.equal(await prisma.organization.count({ where: { slug: `qa-e07-second-${stamp}` } }), 0, "nothing half-made");
  });

  it("parks a company with no domain for review instead of creating it blind, then sends once the website is added", async () => {
    const r = await provisionClientWorkspace(staff, { name: "E07 No Domain Ltd", slug: `qa-e07-nodomain-${stamp}`, website: null, founder: { name: "Kim Founder", email: `e07-kim-${stamp}@example.com` } });
    orgIds.push(r.org.id);
    const { op } = await rowsFor(r.org.id);
    const company = op("upsert_company");

    calls.length = 0;
    assert.equal(await sendOutboxRow(company.id, { client }), "needs_review");
    assert.equal(calls.length, 0, "the CRM was not called");
    assert.match((await prisma.crmOutbox.findUniqueOrThrow({ where: { id: company.id } })).lastError ?? "", /No website domain/);

    await prisma.organization.update({ where: { id: r.org.id }, data: { website: "https://www.e07-nodomain.example" } });
    await prisma.crmOutbox.update({ where: { id: company.id }, data: { state: "pending", attempts: 0, lastError: null } }); // what Retry does
    assert.equal(await sendOutboxRow(company.id, { client }), "sent");
    assert.match(calls[0].url, /companies\/records\?matching_attribute=domains/);
  });
});
