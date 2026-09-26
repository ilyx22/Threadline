import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { AttioClient } from "@/lib/crm/attio";
import { sendOutboxRow } from "@/lib/crm/outbox";
import { acceptInvitation } from "@/lib/team/invitations";
import { activateEngagement, decideScopeChange, endEngagement, ensurePeriods, pauseEngagement, proposeScopeChange, resumeEngagement } from "./engagements";
import { provisionClientWorkspace } from "./provision";

const stamp = Date.now();
const staff = { userId: "", name: "Operator", role: "internal_operator" as const };
let appId = "";
const orgIds: string[] = [];

before(async () => {
  staff.userId = (await prisma.user.create({ data: { email: `op-${stamp}@example.com`, name: "Operator", passwordHash: "x" } })).id;
  appId = (
    await prisma.application.create({
      data: { name: "Jane Founder", email: `jane-${stamp}@example.com`, company: "Halden Legal", website: "https://www.halden-legal.example", whatYouSell: "x", revenueRange: "x", contentProcess: "x", peopleInvolved: "x", publishCadence: "x", biggestBottleneck: "x", founderHours: "x", successLooksLike: "x", urgency: "x" },
    })
  ).id;
});
after(async () => {
  const members = await prisma.membership.findMany({ where: { orgId: { in: orgIds } }, select: { userId: true } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [staff.userId, ...members.map((m) => m.userId)] } } });
  await prisma.application.deleteMany({ where: { id: appId } });
  await prisma.crmOutbox.deleteMany({ where: { OR: [{ entityId: { in: orgIds } }, { entityId: appId }] } });
  await prisma.crmLink.deleteMany({ where: { remoteId: { startsWith: `rec_${stamp}_` } } });
  await prisma.job.deleteMany({ where: { type: "crm.sync" } });
});

describe("conversion (COM-03)", () => {
  it("creates workspace, draft engagement on the standard offer, founder invitation and CRM rows in one step, idempotently", async () => {
    const first = await provisionClientWorkspace(staff, { name: "Halden Legal", slug: `qa-halden-${stamp}`, founder: { name: "Jane Founder", email: `jane-${stamp}@example.com` }, sourceApplicationId: appId });
    orgIds.push(first.org.id);
    assert.equal(first.alreadyConverted, false);
    const e = await prisma.engagement.findFirstOrThrow({ where: { orgId: first.org.id } });
    assert.deepEqual([e.status, e.setupFeeMinor, e.periodFeeMinor, e.periodDays, e.initialPeriods], ["draft", 250000, 250000, 28, 3]);
    assert.equal(JSON.parse(e.offerSnapshot).key, "standard");
    const app = await prisma.application.findUniqueOrThrow({ where: { id: appId } });
    assert.deepEqual([app.orgId, app.status, app.outcome], [first.org.id, "accepted", "won"]);
    const outbox = await prisma.crmOutbox.findMany({ where: { OR: [{ entityId: first.org.id }, { entityId: appId }, { entityId: e.id }] } });
    assert.deepEqual(outbox.map((o) => o.operation).sort(), ["upsert_company", "upsert_deal", "upsert_person"]);
    assert.equal(JSON.parse(outbox.find((o) => o.operation === "upsert_deal")!.payload).valueMinor, 1_000_000, "£10,000 initial contract value");

    const again = await provisionClientWorkspace(staff, { name: "Halden Legal", slug: `qa-halden-2-${stamp}`, founder: { name: "Jane Founder", email: `jane-${stamp}@example.com` }, sourceApplicationId: appId });
    assert.equal(again.alreadyConverted, true);
    assert.equal(again.org.id, first.org.id);

    // The founder accepts and becomes owner and primary contact.
    const token = new URL(first.inviteLink!).searchParams.get("token")!;
    const accepted = await acceptInvitation(token, null, "a-strong-password-7");
    assert.equal(accepted.ok, true);
    const m = await prisma.membership.findFirstOrThrow({ where: { orgId: first.org.id } });
    assert.deepEqual([m.role, m.isOwner, m.contactRole, m.isExpert], ["client_admin", true, "primary", true]);
  });

  it("refuses a taken slug without leaving a half-made workspace", async () => {
    const before = await prisma.organization.count();
    await assert.rejects(provisionClientWorkspace(staff, { name: "Clash", slug: `qa-halden-${stamp}`, founder: { name: "X", email: `x-${stamp}@example.com` } }), /slug is already taken/);
    assert.equal(await prisma.organization.count(), before);
  });
});

describe("engagement lifecycle (ENG-01, ENG-05)", () => {
  it("activates on a start date, keeps periods one ahead, pauses, resumes, and ends", async () => {
    const org = orgIds[0];
    const e = await prisma.engagement.findFirstOrThrow({ where: { orgId: org } });
    const periods = await activateEngagement(e.id, "2026-09-01", new Date("2026-09-02T09:00:00Z"));
    assert.deepEqual(periods.map((p) => [p.number, p.startDate.toISOString().slice(0, 10), p.status]), [
      [1, "2026-09-01", "current"],
      [2, "2026-09-29", "upcoming"],
      [3, "2026-10-27", "upcoming"],
    ]);
    await assert.rejects(activateEngagement(e.id, "2026-09-01"), /Only a draft/);
    // Ten weeks later: period 3 is current and period 4 exists.
    const later = await ensurePeriods(e.id, new Date("2026-11-10T09:00:00Z"));
    assert.deepEqual(later.map((p) => p.status), ["complete", "complete", "current", "upcoming"]);

    // Pause on 12 Nov: period 4 (starting 24 Nov) is held; resume on 15 Dec re-plans it from the resume date.
    await pauseEngagement(e.id, new Date("2026-11-12T09:00:00Z"));
    assert.equal((await prisma.servicePeriod.findFirstOrThrow({ where: { engagementId: e.id, number: 4 } })).status, "paused");
    const resumed = await resumeEngagement(e.id, new Date("2026-12-15T09:00:00Z"));
    const p4 = resumed.find((p) => p.number === 4)!;
    assert.equal(p4.startDate.toISOString().slice(0, 10), "2026-12-15");
    assert.equal(p4.status, "current");
    assert.ok(resumed.some((p) => p.number === 5 && p.startDate.toISOString().slice(0, 10) === "2027-01-12"));

    // A fee change approved from period 5 applies to period 5 onwards only.
    const change = await proposeScopeChange(e.id, { summary: "Add long-form", requestedById: staff.userId, effectiveFromPeriod: 5, feeChangeMinor: 50000 });
    await decideScopeChange(change.id, "approved", staff.userId);
    await assert.rejects(decideScopeChange(change.id, "rejected", staff.userId), /already been decided/);
    const fees = await prisma.servicePeriod.findMany({ where: { engagementId: e.id }, orderBy: { number: "asc" }, select: { number: true, feeMinor: true } });
    assert.deepEqual(fees.map((f) => f.feeMinor), [250000, 250000, 250000, 250000, 300000]);

    await endEngagement(e.id, "ended", "Client chose not to renew", new Date("2026-12-20T09:00:00Z"));
    assert.equal((await prisma.engagement.findUniqueOrThrow({ where: { id: e.id } })).status, "ended");
    assert.equal(await prisma.servicePeriod.count({ where: { engagementId: e.id, number: 5 } }), 0, "unstarted periods leave the plan");
  });
});

describe("CRM outbox (COM-04)", () => {
  it("holds rows outside production, sends in dependency order with a mocked Attio, and parks rejected rows", async () => {
    const rows = await prisma.crmOutbox.findMany({ where: { OR: [{ entityId: orgIds[0] }, { entityId: appId }, { operation: "upsert_deal", payload: { contains: orgIds[0] } }] } });
    const byOp = (op: string) => rows.find((r) => r.operation === op)!;
    assert.equal(await sendOutboxRow(byOp("upsert_company").id, { env: {} }), "pending", "never writes to a CRM outside production");

    const calls: { method: string; url: string; body: string }[] = [];
    let n = 0;
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ method: String(init.method), url, body: String(init.body) });
      return new Response(JSON.stringify({ data: { id: { record_id: `rec_${stamp}_${++n}` }, web_url: `https://app.attio.com/r/${n}` } }), { status: 200 });
    }) as unknown as typeof fetch;
    const client = new AttioClient("test-token", fake);

    await assert.rejects(sendOutboxRow(byOp("upsert_deal").id, { client }), /Waiting for the company and person/);
    assert.equal(await sendOutboxRow(byOp("upsert_company").id, { client }), "sent");
    assert.equal(await sendOutboxRow(byOp("upsert_person").id, { client }), "sent");
    assert.equal(await sendOutboxRow(byOp("upsert_deal").id, { client }), "sent");
    assert.match(calls[0].url, /companies\/records\?matching_attribute=domains/);
    assert.match(calls[0].body, /halden-legal\.example/);
    assert.match(calls[2].url, /deals\/records$/);
    assert.match(calls[2].body, /"currency_value":10000/);
    assert.equal(await sendOutboxRow(byOp("upsert_company").id, { client }), "sent", "a sent row is not sent twice");
    assert.equal(calls.length, 3);

    const bad = new AttioClient("t", (async () => new Response(JSON.stringify({ message: "unknown attribute" }), { status: 400 })) as unknown as typeof fetch);
    const extra = await prisma.crmOutbox.create({ data: { provider: "attio", entityType: "organization", entityId: orgIds[0], operation: "upsert_company", payload: JSON.stringify({ op: "upsert_company", entityType: "organization", entityId: orgIds[0], name: "X", domain: "x.example" }), idempotencyKey: `test:${stamp}` } });
    assert.equal(await sendOutboxRow(extra.id, { client: bad }), "needs_review");
    await prisma.crmOutbox.delete({ where: { id: extra.id } });
  });
});
