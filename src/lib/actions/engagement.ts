"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { activateEngagement, decideScopeChange, EngagementError, endEngagement, pauseEngagement, proposeScopeChange, resumeEngagement } from "@/lib/commercial/engagements";
import { kickCrm, queueCrm } from "@/lib/crm/outbox";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Staff actions on a client's engagement (ENG-01, ENG-05). Every change is
 * audited; ending an engagement also mirrors the outcome to the CRM.
 */
async function load(engagementId: string) {
  const e = await prisma.engagement.findUnique({ where: { id: engagementId }, include: { org: { select: { id: true, name: true } } } });
  if (!e) throw new EngagementError("That engagement no longer exists.");
  return e;
}
const refresh = (orgId: string) => revalidatePath(`/admin/clients/${orgId}`);
const handle = (e: unknown) => (e instanceof EngagementError ? err(e.message, "workflow") : null);

export async function activateEngagementAction(engagementId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const { startDate } = parseForm(z.object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date.") }), formData);
    try {
      const e = await load(engagementId);
      await activateEngagement(e.id, startDate);
      await auditInternal(admin.user.id, { orgId: e.orgId, action: "engagement.activate", entityType: "engagement", entityId: e.id, summary: `Activated ${e.org.name}'s engagement from ${startDate}` });
      refresh(e.orgId);
      return okVoid("Engagement active. Periods are on the calendar.");
    } catch (x) {
      return handle(x) ?? Promise.reject(x);
    }
  });
}

export async function pauseEngagementAction(engagementId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    try {
      const e = await load(engagementId);
      await pauseEngagement(e.id);
      await auditInternal(admin.user.id, { orgId: e.orgId, action: "engagement.pause", entityType: "engagement", entityId: e.id, summary: `Paused ${e.org.name}'s engagement` });
      refresh(e.orgId);
      return okVoid("Paused. Periods that have not started are held.");
    } catch (x) {
      return handle(x) ?? Promise.reject(x);
    }
  });
}

export async function resumeEngagementAction(engagementId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    try {
      const e = await load(engagementId);
      await resumeEngagement(e.id);
      await auditInternal(admin.user.id, { orgId: e.orgId, action: "engagement.resume", entityType: "engagement", entityId: e.id, summary: `Resumed ${e.org.name}'s engagement` });
      refresh(e.orgId);
      return okVoid("Resumed. Held periods are re-planned from today.");
    } catch (x) {
      return handle(x) ?? Promise.reject(x);
    }
  });
}

export async function endEngagementAction(engagementId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(z.object({ kind: z.enum(["ended", "terminated"]), reason: z.string().trim().min(3, "Say why.").max(1000) }), formData);
    try {
      const e = await load(engagementId);
      await endEngagement(e.id, input.kind, input.reason);
      const row = await queueCrm(prisma, { op: "upsert_deal", entityType: "engagement", entityId: e.id, name: `${e.org.name}: Threadline engagement`, stage: input.kind === "terminated" ? "lost" : "won", valueMinor: null, currency: e.currency, companyEntity: { type: "organization", id: e.orgId }, personEntity: null }, `deal:${e.id}:${input.kind}`);
      await kickCrm([row.id]);
      await auditInternal(admin.user.id, { orgId: e.orgId, action: `engagement.${input.kind}`, entityType: "engagement", entityId: e.id, summary: `${input.kind === "ended" ? "Ended" : "Terminated"} ${e.org.name}'s engagement: ${input.reason}` });
      refresh(e.orgId);
      return okVoid("Recorded.");
    } catch (x) {
      return handle(x) ?? Promise.reject(x);
    }
  });
}

export async function proposeScopeChangeAction(engagementId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(
      z.object({
        summary: z.string().trim().min(3).max(300),
        detail: z.string().max(4000).optional(),
        effectiveFromPeriod: z.coerce.number().int().min(1).max(200).optional(),
        feeChange: z.coerce.number().min(-100000).max(100000).optional(),
      }),
      formData,
    );
    const e = await load(engagementId);
    await proposeScopeChange(e.id, { summary: input.summary, detail: input.detail, requestedById: admin.user.id, effectiveFromPeriod: input.effectiveFromPeriod ?? null, feeChangeMinor: input.feeChange ? Math.round(input.feeChange * 100) : null });
    await auditInternal(admin.user.id, { orgId: e.orgId, action: "engagement.scope_proposed", entityType: "engagement", entityId: e.id, summary: `Proposed a scope change for ${e.org.name}: ${input.summary}` });
    refresh(e.orgId);
    return okVoid("Proposed. It applies only once approved.");
  });
}

export async function decideScopeChangeAction(changeId: string, decision: "approved" | "rejected"): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    try {
      const c = await decideScopeChange(changeId, decision, admin.user.id);
      await auditInternal(admin.user.id, { orgId: c.orgId, action: `engagement.scope_${decision}`, entityType: "scope_change", entityId: c.id, summary: `${decision === "approved" ? "Approved" : "Rejected"} scope change: ${c.summary}` });
      refresh(c.orgId);
      return okVoid(decision === "approved" ? "Approved and applied." : "Rejected.");
    } catch (x) {
      return handle(x) ?? Promise.reject(x);
    }
  });
}
