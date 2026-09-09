"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireInternal } from "@/lib/auth/guard";
import { auditInternal } from "@/lib/auth/audit";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Discovery economics on a prospect. Every figure is optional because
 * "unknown" is a real answer on a first call; money is integer minor units
 * with a currency; nothing is computed into a projection.
 */

const money = z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().min(0).max(1_000_000_000).optional());
const pct = z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().min(0).max(100).optional());
const int = z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().int().min(0).max(100_000).optional());

const economicsSchema = z.object({
  econCurrency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
  typicalDealValue: money,
  grossProfit: money,
  grossMarginPct: pct,
  ltv: money,
  qualifiedOppValue: money,
  cycleLengthDays: int,
  closeRatePct: pct,
  capacityNote: z.string().max(1000).optional(),
  acquisitionCost: money,
  acquisitionNote: z.string().max(2000).optional(),
  urgency: z.enum(["", "now", "quarter", "year", "none"]).optional(),
  economicConsequence: z.string().max(2000).optional(),
});

const toMinor = (v: number | undefined) => (v === undefined ? null : Math.round(v * 100));

export async function saveProspectEconomicsAction(prospectId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternal("acquisition.manage");
    const input = parseForm(economicsSchema, formData);
    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId }, select: { id: true, company: true } });
    if (!prospect) return err("That prospect no longer exists.", "not_found");
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        econCurrency: input.econCurrency,
        typicalDealValueMinor: toMinor(input.typicalDealValue),
        grossProfitMinor: toMinor(input.grossProfit),
        grossMarginPct: input.grossMarginPct ?? null,
        ltvMinor: toMinor(input.ltv),
        qualifiedOppValueMinor: toMinor(input.qualifiedOppValue),
        cycleLengthDays: input.cycleLengthDays ?? null,
        closeRatePct: input.closeRatePct ?? null,
        capacityNote: input.capacityNote ? cleanText(input.capacityNote, 1000) : null,
        acquisitionCostMinor: toMinor(input.acquisitionCost),
        acquisitionNote: input.acquisitionNote ? cleanText(input.acquisitionNote, 2000) : null,
        urgency: input.urgency || null,
        economicConsequence: input.economicConsequence ? cleanText(input.economicConsequence, 2000) : null,
        economicsUpdatedAt: new Date(),
      },
    });
    await auditInternal(admin.user.id, { action: "prospect.economics", entityType: "prospect", entityId: prospectId, summary: `Economics recorded for ${prospect.company}` });
    revalidatePath(`/admin/prospects/${prospectId}`);
    return okVoid("Economics saved. Blank fields stay unknown.");
  });
}

/**
 * Turn an application into a prospect without re-typing it. The prospect
 * starts in `new` with the application's answers carried into the notes and
 * economics where they map cleanly; the application keeps a link back.
 */
export async function createProspectFromApplicationAction(applicationId: string): Promise<ActionResult<{ prospectId: string }>> {
  return guarded(async () => {
    const admin = await requireInternal("acquisition.manage");
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return err("That application no longer exists.", "not_found");
    if (app.prospectId) return ok({ prospectId: app.prospectId }, "This application is already linked to a prospect.");

    const platforms = (() => { try { return JSON.parse(app.platforms) as string[]; } catch { return []; } })();
    const prospect = await prisma.prospect.create({
      data: {
        company: app.company,
        contactName: app.name,
        contactRole: app.role ?? null,
        website: app.website ?? null,
        state: "new",
        tier: "b",
        channel: "inbound_application",
        sourceNote: `Public application ${app.createdAt.toISOString().slice(0, 10)} · ${app.email}`,
        economicsNote: [`Revenue range: ${app.revenueRange}`, app.typicalDealValue ? `Typical deal value (disclosed): ${(app.typicalDealValue / 100).toLocaleString("en-GB")}` : null, app.capacityNote ? `Capacity: ${app.capacityNote}` : null].filter(Boolean).join("\n"),
        constraintHypothesis: `Bottleneck (their words): ${app.biggestBottleneck}\nSuccess looks like: ${app.successLooksLike}`,
        typicalDealValueMinor: app.typicalDealValue ?? null,
        capacityNote: app.capacityNote ?? null,
        acquisitionNote: app.acquisitionToday ?? null,
        urgency: app.urgency === "now" ? "now" : app.urgency === "quarter" ? "quarter" : null,
        notes: [`How content gets made today: ${app.contentProcess}`, `People involved: ${app.peopleInvolved}`, `Publish cadence: ${app.publishCadence}`, `Founder hours/week: ${app.founderHours}`, `Platforms: ${platforms.join(", ") || "not stated"}`, app.extra ? `Extra: ${app.extra}` : null].filter(Boolean).join("\n"),
        nextAction: "Read the application and decide: research conversation or diagnosis call",
        nextActionDueAt: new Date(Date.now() + 2 * 86_400_000),
        ownerId: admin.user.id,
      },
    });
    await prisma.application.update({ where: { id: applicationId }, data: { prospectId: prospect.id, status: app.status === "new" ? "reviewing" : app.status } });
    await auditInternal(admin.user.id, { action: "application.to_prospect", entityType: "application", entityId: applicationId, summary: `Created prospect ${prospect.company} from the application` });
    revalidatePath("/admin/applications");
    revalidatePath("/admin/prospects");
    return ok({ prospectId: prospect.id }, `${prospect.company} is now a prospect with a next action due in two days.`);
  });
}
