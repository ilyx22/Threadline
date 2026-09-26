import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { runGeneration } from "@/lib/ai";
import { loadWorkspaceContext, renderContext, type ContextBlock } from "@/lib/ai/context";
import { leadReplyPrompt } from "@/lib/ai/prompts";
import { fence, neutralise } from "@/lib/ai/untrusted";

/**
 * The lead inbox (AI-06).
 *
 * What it does: takes leads from authorised sources (a workspace's inbound
 * token, manual entry, a batch import), merges repeats from the same person,
 * routes each to an owner, records what qualified it, drafts a reply for a
 * person to check, reminds about follow-ups, and measures speed to lead.
 *
 * What it never does: send. A reply is drafted, approved by a person, sent by
 * that person on the channel itself, then marked as sent here. There is no
 * universal social inbox: platforms whose DMs have no authorised API are
 * entered by hand, linked or imported.
 */
export const LEAD_CHANNELS = ["manual", "email", "website_form", "linkedin_dm", "x_dm", "instagram_dm", "phone", "referral", "other"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];
export const QUALIFICATION_CRITERIA = ["fit", "need", "authority", "budget", "timing", "location"] as const;
export type Criterion = (typeof QUALIFICATION_CRITERIA)[number];

const DAY = 86_400_000;
const MERGE_WINDOW_DAYS = 90;

export type LeadInput = {
  name: string;
  email?: string | null;
  company?: string | null;
  channel: LeadChannel;
  message?: string | null;
  profileUrl?: string | null;
  externalRef?: string | null;
  occurredAt?: Date | null;
};

/** The key two messages from the same person share: email first, then profile URL. */
export function dedupeKeyFor(input: { email?: string | null; profileUrl?: string | null }) {
  const email = input.email?.trim().toLowerCase();
  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return `email:${email}`;
  if (input.profileUrl) {
    try {
      const u = new URL(input.profileUrl.trim());
      if (u.protocol === "https:" || u.protocol === "http:") return `url:${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "").toLowerCase()}`;
    } catch {
      /* not a URL */
    }
  }
  return null;
}

/** Owner for a new lead: the workspace's primary contact, else its first active admin. */
export async function routeOwner(orgId: string) {
  const primary = await prisma.membership.findFirst({ where: { orgId, contactRole: "primary", status: "active" }, select: { userId: true } });
  if (primary) return primary.userId;
  const admin = await prisma.membership.findFirst({ where: { orgId, role: "client_admin", status: "active" }, orderBy: { createdAt: "asc" }, select: { userId: true } });
  return admin?.userId ?? null;
}

/**
 * Take one inbound lead. A repeat delivery (same channel and message id) is
 * ignored; a new message from someone with an open inquiry in the last 90 days
 * joins that inquiry instead of creating a second one.
 */
export async function ingestLead(orgId: string, input: LeadInput, provenance: { source: string; createdById?: string | null }) {
  const name = input.name.trim().slice(0, 200);
  if (!name) throw new WorkflowError("A lead needs a name.");
  if (!LEAD_CHANNELS.includes(input.channel)) throw new WorkflowError("Unknown channel.");
  const externalRef = input.externalRef?.trim().slice(0, 300) || null;
  if (externalRef) {
    const seen = await prisma.leadMessage.findUnique({ where: { orgId_channel_externalRef: { orgId, channel: input.channel, externalRef } }, select: { inquiryId: true } });
    if (seen) return { inquiryId: seen.inquiryId, created: false, merged: false, duplicate: true };
  }
  const occurredAt = input.occurredAt && !Number.isNaN(input.occurredAt.getTime()) && input.occurredAt.getTime() <= Date.now() + 60_000 ? input.occurredAt : new Date();
  const dedupeKey = dedupeKeyFor(input);
  const open = dedupeKey
    ? await prisma.inquiry.findFirst({
        where: { orgId, dedupeKey, stage: { notIn: ["won", "lost"] }, occurredAt: { gte: new Date(Date.now() - MERGE_WINDOW_DAYS * DAY) } },
        orderBy: { occurredAt: "desc" },
        select: { id: true },
      })
    : null;

  const body = input.message?.trim().slice(0, 10_000) ?? "";
  try {
    return await prisma.$transaction(async (tx) => {
      let inquiryId = open?.id;
      if (!inquiryId) {
        const created = await tx.inquiry.create({
          data: {
            orgId,
            name,
            email: input.email?.trim().toLowerCase() || null,
            company: input.company?.trim().slice(0, 200) || null,
            link: input.profileUrl?.trim().slice(0, 600) || null,
            channel: input.channel,
            source: input.channel === "referral" ? "referral" : "content",
            dedupeKey,
            ownerId: await routeOwner(orgId),
            occurredAt,
            evidenceBasis: provenance.source.startsWith("inbound:") ? "measured" : "client_reported",
            evidenceSource: provenance.source.slice(0, 200),
          },
        });
        inquiryId = created.id;
      }
      if (body || externalRef) {
        await tx.leadMessage.create({ data: { orgId, inquiryId, direction: "in", channel: input.channel, body, externalRef, occurredAt, createdById: provenance.createdById ?? null } });
      }
      return { inquiryId, created: !open, merged: Boolean(open), duplicate: false };
    });
  } catch (e) {
    // A concurrent delivery of the same message: the other one won.
    if (externalRef && String(e).includes("Unique")) {
      const seen = await prisma.leadMessage.findUniqueOrThrow({ where: { orgId_channel_externalRef: { orgId, channel: input.channel, externalRef } } });
      return { inquiryId: seen.inquiryId, created: false, merged: false, duplicate: true };
    }
    throw e;
  }
}

async function inquiryIn(orgId: string, inquiryId: string) {
  const i = await prisma.inquiry.findFirst({ where: { id: inquiryId, orgId } });
  if (!i) throw new WorkflowError("That lead no longer exists.");
  return i;
}

export type Evidence = { criterion: Criterion; note: string };

/**
 * Record what qualified a lead. At least one criterion other than location,
 * with a note saying what was established, is required: where someone is
 * says nothing about whether they need or can buy the offer.
 */
export async function qualifyLead(orgId: string, inquiryId: string, userId: string, evidence: Evidence[]) {
  const i = await inquiryIn(orgId, inquiryId);
  const clean = evidence
    .filter((e) => QUALIFICATION_CRITERIA.includes(e.criterion))
    .map((e) => ({ criterion: e.criterion, note: e.note.trim().slice(0, 500) }))
    .filter((e) => e.note.length >= 3);
  if (!clean.some((e) => e.criterion !== "location")) throw new WorkflowError("Say what qualified this lead beyond location: fit, need, authority, budget or timing.");
  const at = new Date().toISOString();
  const previous = i.qualification ? (JSON.parse(i.qualification) as unknown[]) : [];
  const next = [...previous, ...clean.map((e) => ({ ...e, by: userId, at }))].slice(-50);
  await prisma.inquiry.update({ where: { id: i.id }, data: { qualification: JSON.stringify(next), ...(i.stage === "inquiry" ? { stage: "qualified" } : {}) } });
  return next;
}

export async function assignOwner(orgId: string, inquiryId: string, ownerId: string | null) {
  await inquiryIn(orgId, inquiryId);
  if (ownerId) {
    const m = await prisma.membership.findFirst({ where: { orgId, userId: ownerId, status: "active" }, select: { id: true } });
    if (!m) throw new WorkflowError("The owner must be an active member of this workspace.");
  }
  await prisma.inquiry.update({ where: { id: inquiryId }, data: { ownerId } });
}

export async function setFollowUp(orgId: string, inquiryId: string, at: Date | null) {
  await inquiryIn(orgId, inquiryId);
  if (at && at.getTime() < Date.now() - DAY) throw new WorkflowError("A follow-up cannot be in the past.");
  await prisma.inquiry.update({ where: { id: inquiryId }, data: { followUpAt: at } });
}

/** Record a message a person sent or received outside Threadline. */
export async function addMessage(orgId: string, inquiryId: string, userId: string, input: { direction: "in" | "out"; body: string; occurredAt?: Date }) {
  const i = await inquiryIn(orgId, inquiryId);
  const body = input.body.trim().slice(0, 10_000);
  if (!body) throw new WorkflowError("Write the message.");
  const occurredAt = input.occurredAt ?? new Date();
  await prisma.leadMessage.create({ data: { orgId, inquiryId, direction: input.direction, channel: i.channel, body, occurredAt, createdById: userId } });
  if (input.direction === "out" && !i.firstResponseAt) await prisma.inquiry.update({ where: { id: i.id }, data: { firstResponseAt: occurredAt } });
}

/* ----------------------------- Draft replies ----------------------------- */

export async function draftReply(orgId: string, inquiryId: string, userId: string) {
  const i = await inquiryIn(orgId, inquiryId);
  const thread = await prisma.leadMessage.findMany({ where: { inquiryId }, orderBy: { occurredAt: "asc" }, take: 20 });
  const blocks: ContextBlock[] = ["CLIENT_CONTEXT", "OFFER_CONTEXT"];
  const context = await loadWorkspaceContext(orgId, { blocks });
  const lastIn = [...thread].reverse().find((m) => m.direction === "in");
  const template = leadReplyPrompt({
    context: renderContext(context, blocks),
    leadName: i.name,
    channel: i.channel,
    // AI-09: the lead's own words are third-party text: neutralised and fenced as data.
    thread: thread.length ? thread.map((m, n) => (m.direction === "in" ? `From the lead:\n${fence(`m${n + 1}`, neutralise(m.body, 1500).text)}` : `Us: ${m.body}`)).join("\n\n") : "(no message text recorded)",
  });
  const { result, meta } = await runGeneration(template, { orgId, userId, kind: "lead_reply", entityType: "inquiry", entityId: i.id, demoContext: { ...context.demo, leadName: i.name, leadMessage: lastIn?.body } });
  return prisma.replyDraft.create({ data: { orgId, inquiryId, body: result.text.trim().slice(0, 5000), generatedBy: "ai", isDemo: meta.isDemo, createdById: userId } });
}

async function draftIn(orgId: string, draftId: string) {
  const d = await prisma.replyDraft.findFirst({ where: { id: draftId, orgId } });
  if (!d) throw new WorkflowError("That draft no longer exists.");
  return d;
}

/** A person checks the text and releases it; an edit is saved with the approval. */
export async function approveDraft(orgId: string, draftId: string, userId: string, body?: string) {
  const d = await draftIn(orgId, draftId);
  if (d.status !== "draft") throw new WorkflowError("Only a draft can be approved.");
  const text = (body ?? d.body).trim();
  if (!text) throw new WorkflowError("The reply is empty.");
  await prisma.replyDraft.update({ where: { id: d.id }, data: { status: "approved", body: text.slice(0, 5000), approvedById: userId, approvedAt: new Date() } });
}

/** The person sent the approved reply on the channel; record it and the response time. */
export async function markDraftSent(orgId: string, draftId: string, userId: string) {
  const d = await draftIn(orgId, draftId);
  const now = new Date();
  const moved = await prisma.replyDraft.updateMany({ where: { id: d.id, status: "approved" }, data: { status: "sent", sentById: userId, sentAt: now } });
  if (moved.count !== 1) throw new WorkflowError("Approve the reply before marking it sent.");
  await addMessage(orgId, d.inquiryId, userId, { direction: "out", body: d.body, occurredAt: now });
}

export async function discardDraft(orgId: string, draftId: string) {
  const d = await draftIn(orgId, draftId);
  if (d.status === "sent") throw new WorkflowError("A sent reply cannot be discarded.");
  await prisma.replyDraft.update({ where: { id: d.id }, data: { status: "discarded" } });
}

/* ------------------------- Reminders and measures ------------------------ */

/** Daily tick: a task for the owner of each lead whose follow-up is due. One per lead per date. */
export async function remindDueFollowUps(now = new Date()) {
  const due = await prisma.inquiry.findMany({ where: { followUpAt: { lte: now }, stage: { notIn: ["won", "lost"] } }, select: { id: true, orgId: true, name: true, ownerId: true, followUpAt: true }, take: 500 });
  let created = 0;
  for (const i of due) {
    const title = `Follow up with ${i.name}`;
    const exists = await prisma.task.findFirst({ where: { orgId: i.orgId, entityType: "inquiry", entityId: i.id, title, status: { in: ["open", "in_progress"] } }, select: { id: true } });
    if (exists) continue;
    await prisma.task.create({ data: { orgId: i.orgId, title, kind: "decide", audience: "client", assigneeId: i.ownerId, entityType: "inquiry", entityId: i.id, dueDate: i.followUpAt } as never });
    created++;
  }
  return created;
}

/**
 * Speed to lead: minutes from the lead's first inbound message (or arrival) to
 * the first reply a person recorded, over a window; and leads still waiting.
 */
export async function speedToLead(orgId: string, since: Date, now = new Date()) {
  const leads = await prisma.inquiry.findMany({ where: { orgId, occurredAt: { gte: since } }, select: { id: true, name: true, occurredAt: true, firstResponseAt: true, stage: true, ownerId: true } });
  const minutes = leads.filter((l) => l.firstResponseAt).map((l) => Math.max(0, Math.round((l.firstResponseAt!.getTime() - l.occurredAt.getTime()) / 60_000))).sort((a, b) => a - b);
  const median = minutes.length ? (minutes.length % 2 ? minutes[(minutes.length - 1) / 2] : Math.round((minutes[minutes.length / 2 - 1] + minutes[minutes.length / 2]) / 2)) : null;
  const waiting = leads.filter((l) => !l.firstResponseAt && l.stage !== "lost" && now.getTime() - l.occurredAt.getTime() > DAY);
  return { leads: leads.length, responded: minutes.length, medianMinutes: median, waitingOver24h: waiting.map((l) => ({ id: l.id, name: l.name, since: l.occurredAt })) };
}

/* ---------------------------- Inbound sources ---------------------------- */

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Create an inbound source. The token is returned once and never stored. */
export async function createInboundSource(orgId: string, userId: string, label: string, channel: LeadChannel = "website_form") {
  const token = `tl_in_${randomBytes(24).toString("base64url")}`;
  const row = await prisma.inboundSource.create({ data: { orgId, label: label.trim().slice(0, 80) || "Inbound", channel, tokenHash: hashToken(token), createdById: userId } });
  return { id: row.id, token };
}

export async function revokeInboundSource(orgId: string, id: string) {
  await prisma.inboundSource.updateMany({ where: { id, orgId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function sourceForToken(token: string) {
  if (!token.startsWith("tl_in_")) return null;
  const s = await prisma.inboundSource.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!s || s.revokedAt) return null;
  await prisma.inboundSource.update({ where: { id: s.id }, data: { lastUsedAt: new Date() } });
  return s;
}
