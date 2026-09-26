import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import {
  addMessage,
  approveDraft,
  createInboundSource,
  dedupeKeyFor,
  draftReply,
  ingestLead,
  markDraftSent,
  qualifyLead,
  remindDueFollowUps,
  revokeInboundSource,
  setFollowUp,
  sourceForToken,
  speedToLead,
} from "./index";

const stamp = Date.now();
let orgId = "";
let ownerId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-leads-${stamp}`, name: "QA Leads", kind: "client", synthetic: true } })).id;
  ownerId = (await prisma.user.create({ data: { email: `leads-${stamp}@example.com`, name: "Owner", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId: ownerId, orgId, role: "client_admin", isOwner: true, contactRole: "primary" } });
});
after(async () => {
  await prisma.task.deleteMany({ where: { orgId } });
  await prisma.aiGeneration.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: ownerId } });
});

describe("lead inbox (AI-06)", () => {
  it("keys repeats by email, then profile URL", () => {
    assert.equal(dedupeKeyFor({ email: " Sam@Example.com " }), "email:sam@example.com");
    assert.equal(dedupeKeyFor({ profileUrl: "https://www.linkedin.com/in/Sam-Lee/" }), "url:linkedin.com/in/sam-lee");
    assert.equal(dedupeKeyFor({ email: "not an email" }), null);
  });

  it("ingests, routes to the primary contact, ignores a repeated delivery and merges a second message", async () => {
    const a = await ingestLead(orgId, { name: "Sam Lee", email: "sam@example.com", channel: "website_form", message: "Do you work with law firms?", externalRef: "f-1" }, { source: "inbound:Website" });
    assert.equal(a.created, true);
    const lead = await prisma.inquiry.findUniqueOrThrow({ where: { id: a.inquiryId } });
    assert.equal(lead.ownerId, ownerId);
    assert.equal(lead.evidenceBasis, "measured");
    const again = await ingestLead(orgId, { name: "Sam Lee", email: "sam@example.com", channel: "website_form", message: "Do you work with law firms?", externalRef: "f-1" }, { source: "inbound:Website" });
    assert.equal(again.duplicate, true);
    const second = await ingestLead(orgId, { name: "Sam", email: "SAM@example.com", channel: "email", message: "Also, what does it cost?", externalRef: "m-2" }, { source: "manual" });
    assert.equal(second.merged, true);
    assert.equal(second.inquiryId, a.inquiryId);
    assert.equal(await prisma.inquiry.count({ where: { orgId } }), 1);
    assert.equal(await prisma.leadMessage.count({ where: { inquiryId: a.inquiryId } }), 2);
  });

  it("refuses qualification on location alone", async () => {
    const lead = await prisma.inquiry.findFirstOrThrow({ where: { orgId } });
    await assert.rejects(qualifyLead(orgId, lead.id, ownerId, [{ criterion: "location", note: "Based in London" }]), /beyond location/);
    await qualifyLead(orgId, lead.id, ownerId, [{ criterion: "need", note: "Wants inbound from partners, not ads" }, { criterion: "location", note: "London" }]);
    const after = await prisma.inquiry.findUniqueOrThrow({ where: { id: lead.id } });
    assert.equal(after.stage, "qualified");
    assert.equal((JSON.parse(after.qualification!) as unknown[]).length, 2);
  });

  it("drafts a reply that is never sent until a person approves and marks it; that sets speed to lead", async () => {
    const lead = await prisma.inquiry.findFirstOrThrow({ where: { orgId } });
    await prisma.inquiry.update({ where: { id: lead.id }, data: { occurredAt: new Date(Date.now() - 90 * 60_000) } });
    const d = await draftReply(orgId, lead.id, ownerId);
    assert.equal(d.status, "draft");
    assert.equal(d.generatedBy, "ai");
    await assert.rejects(markDraftSent(orgId, d.id, ownerId), /Approve the reply/);
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { id: lead.id } })).firstResponseAt, null);
    await approveDraft(orgId, d.id, ownerId, "Hi Sam, yes. Could we speak on Tuesday?");
    await markDraftSent(orgId, d.id, ownerId);
    const done = await prisma.inquiry.findUniqueOrThrow({ where: { id: lead.id } });
    assert.ok(done.firstResponseAt);
    const out = await prisma.leadMessage.findFirstOrThrow({ where: { inquiryId: lead.id, direction: "out" } });
    assert.equal(out.body, "Hi Sam, yes. Could we speak on Tuesday?");
    const speed = await speedToLead(orgId, new Date(Date.now() - 86_400_000));
    assert.equal(speed.responded, 1);
    assert.ok(speed.medianMinutes! >= 89 && speed.medianMinutes! <= 91);
    // a later outbound message does not move the first response time
    await addMessage(orgId, lead.id, ownerId, { direction: "out", body: "Following up" });
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { id: lead.id } })).firstResponseAt?.getTime(), done.firstResponseAt!.getTime());
  });

  it("reminds the owner once per due follow-up", async () => {
    const lead = await prisma.inquiry.findFirstOrThrow({ where: { orgId } });
    await setFollowUp(orgId, lead.id, new Date());
    assert.equal(await remindDueFollowUps(new Date(Date.now() + 60_000)), 1);
    assert.equal(await remindDueFollowUps(new Date(Date.now() + 60_000)), 0);
    const task = await prisma.task.findFirstOrThrow({ where: { orgId, entityType: "inquiry", entityId: lead.id } });
    assert.equal(task.assigneeId, ownerId);
  });

  it("inbound tokens are stored hashed, work until revoked, and are per workspace", async () => {
    const { id, token } = await createInboundSource(orgId, ownerId, "Form");
    assert.equal(await prisma.inboundSource.count({ where: { tokenHash: token } }), 0);
    assert.equal((await sourceForToken(token))?.orgId, orgId);
    assert.equal(await sourceForToken("tl_in_wrong"), null);
    await revokeInboundSource(orgId, id);
    assert.equal(await sourceForToken(token), null);
  });
});
