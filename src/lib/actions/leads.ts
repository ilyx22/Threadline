"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import {
  addMessage,
  approveDraft,
  assignOwner,
  createInboundSource,
  discardDraft,
  draftReply,
  ingestLead,
  LEAD_CHANNELS,
  markDraftSent,
  QUALIFICATION_CRITERIA,
  qualifyLead,
  revokeInboundSource,
  setFollowUp,
} from "@/lib/leads";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/** Lead inbox actions (AI-06). Every one needs pipeline.edit in the workspace. */
const path = (slug: string, id?: string) => (id ? `/app/${slug}/pipeline/${id}` : `/app/${slug}/pipeline`);

const manualLead = z.object({
  name: z.string().min(1, "Add a name.").max(200),
  email: z.string().max(320).optional(),
  company: z.string().max(200).optional(),
  channel: z.enum(LEAD_CHANNELS).default("manual"),
  message: z.string().max(10_000).optional(),
  profileUrl: z.string().max(600).optional(),
});

/** Manual entry for channels without an authorised API (most DMs). */
export async function addLeadAction(orgSlug: string, _prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const input = parseForm(manualLead, formData);
    const r = await ingestLead(ctx.org.id, { ...input, email: input.email || null, profileUrl: input.profileUrl || null }, { source: "manual", createdById: ctx.user.id });
    await audit(ctx, { action: "lead.add", entityType: "inquiry", entityId: r.inquiryId, summary: r.merged ? `Added a message from ${input.name} to their open lead` : `Added lead ${input.name}` });
    revalidatePath(path(orgSlug));
    return ok({ id: r.inquiryId }, r.merged ? "Added to their existing lead." : "Lead added.");
  });
}

const evidence = z.object({ criterion: z.enum(QUALIFICATION_CRITERIA), note: z.string().max(500) });

export async function qualifyLeadAction(orgSlug: string, inquiryId: string, items: { criterion: string; note: string }[]): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const parsed = z.array(evidence).max(10).safeParse(items);
    if (!parsed.success) return err("Choose a criterion for each note.", "validation");
    await qualifyLead(ctx.org.id, inquiryId, ctx.user.id, parsed.data);
    await audit(ctx, { action: "lead.qualify", entityType: "inquiry", entityId: inquiryId, summary: `Recorded qualification: ${parsed.data.map((e) => e.criterion).join(", ")}` });
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Qualification recorded.");
  });
}

export async function assignLeadAction(orgSlug: string, inquiryId: string, ownerId: string | null): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await assignOwner(ctx.org.id, inquiryId, ownerId || null);
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Owner updated.");
  });
}

export async function setFollowUpAction(orgSlug: string, inquiryId: string, date: string | null): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const at = date ? new Date(`${date}T09:00:00.000Z`) : null;
    if (at && Number.isNaN(at.getTime())) return err("Pick a date.", "validation");
    await setFollowUp(ctx.org.id, inquiryId, at);
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid(at ? "Follow-up set." : "Follow-up cleared.");
  });
}

export async function addLeadMessageAction(orgSlug: string, inquiryId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const input = parseForm(z.object({ direction: z.enum(["in", "out"]), body: z.string().min(1, "Write the message.").max(10_000) }), formData);
    await addMessage(ctx.org.id, inquiryId, ctx.user.id, input);
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Message recorded.");
  });
}

export async function draftReplyAction(orgSlug: string, inquiryId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await draftReply(ctx.org.id, inquiryId, ctx.user.id);
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Draft ready. Check it before you send it.");
  });
}

export async function approveDraftAction(orgSlug: string, inquiryId: string, draftId: string, body: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await approveDraft(ctx.org.id, draftId, ctx.user.id, body);
    await audit(ctx, { action: "lead.reply_approved", entityType: "inquiry", entityId: inquiryId, summary: "Approved a reply" });
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Approved. Send it yourself, then mark it sent.");
  });
}

export async function markSentAction(orgSlug: string, inquiryId: string, draftId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await markDraftSent(ctx.org.id, draftId, ctx.user.id);
    await audit(ctx, { action: "lead.reply_sent", entityType: "inquiry", entityId: inquiryId, summary: "Marked a reply as sent" });
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Marked as sent.");
  });
}

export async function discardDraftAction(orgSlug: string, inquiryId: string, draftId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await discardDraft(ctx.org.id, draftId);
    revalidatePath(path(orgSlug, inquiryId));
    return okVoid("Draft discarded.");
  });
}

export async function createInboundSourceAction(orgSlug: string, label: string): Promise<ActionResult<{ token: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const { id, token } = await createInboundSource(ctx.org.id, ctx.user.id, label);
    await audit(ctx, { action: "inbound_source.create", entityType: "inbound_source", entityId: id, summary: `Created inbound source "${label}"` });
    revalidatePath(`/app/${orgSlug}/pipeline/inbound`);
    return ok({ token }, "Copy the token now: it is not shown again.");
  });
}

export async function revokeInboundSourceAction(orgSlug: string, id: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    await revokeInboundSource(ctx.org.id, id);
    await audit(ctx, { action: "inbound_source.revoke", entityType: "inbound_source", entityId: id, summary: "Revoked an inbound source" });
    revalidatePath(`/app/${orgSlug}/pipeline/inbound`);
    return okVoid("Revoked.");
  });
}
