"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import {
  attributionClassSchema,
  evidenceBasisSchema,
  inquirySourceSchema,
  inquiryStageSchema,
} from "@/lib/domain/enums";
import { canMoveInquiry, WorkflowError } from "@/lib/domain/workflow";
import { cleanText, cleanUrl, err, guarded, ok, okVoid, optionalDate, parseForm, type ActionResult } from "./shared";

/** Pipeline mutations — lightweight commercial attribution, not a CRM. */

const inquirySchema = z.object({
  name: z.string().min(2, "Enter a name.").max(200),
  company: z.string().max(200).optional(),
  email: z.string().email("Enter a valid email address.").max(200).optional().or(z.literal("")),
  stage: inquiryStageSchema.default("inquiry"),
  source: inquirySourceSchema.default("content"),
  contentItemId: z.string().optional(),
  cta: z.string().max(300).optional(),
  leadMagnet: z.string().max(200).optional(),
  link: z.string().max(600).optional(),
  value: z.coerce.number().min(0).default(0),
  occurredAt: optionalDate,
  notes: z.string().max(4000).optional(),
  // How strongly this is actually connected to the content, and who observed
  // it. Defaults are the weakest honest answer rather than the flattering one:
  // an unclassified signal is a correlation somebody reported, until evidence
  // says otherwise.
  attribution: attributionClassSchema.default("qualitative_only"),
  evidenceBasis: evidenceBasisSchema.default("client_reported"),
  evidenceSource: z.string().max(300).optional(),
});

export async function saveInquiryAction(
  orgSlug: string,
  inquiryId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const input = parseForm(inquirySchema, formData);

    // Attribution must point at content in THIS workspace.
    let publishRecordId: string | null = null;
    if (input.contentItemId) {
      const content = await prisma.contentItem.findFirst({
        where: { id: input.contentItemId, orgId: ctx.org.id },
        include: {
          publishRecords: {
            where: { status: "published" },
            orderBy: { publishedAt: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      });
      if (!content) return err("That content item is not in this workspace.", "validation");
      publishRecordId = content.publishRecords[0]?.id ?? null;
    }

    const data = {
      name: cleanText(input.name, 200),
      company: input.company ?? null,
      email: input.email || null,
      stage: input.stage,
      source: input.source,
      contentItemId: input.contentItemId ?? null,
      publishRecordId,
      cta: input.cta ?? null,
      leadMagnet: input.leadMagnet ?? null,
      link: cleanUrl(input.link),
      valueMinor: Math.round(input.value * 100),
      currency: ctx.org.currency,
      occurredAt: input.occurredAt ?? new Date(),
      closedAt: ["won", "lost"].includes(input.stage) ? new Date() : null,
      notes: input.notes ? cleanText(input.notes) : null,
      attribution: input.attribution,
      evidenceBasis: input.evidenceBasis,
      evidenceSource: input.evidenceSource ? cleanText(input.evidenceSource, 300) : null,
    };

    let id = inquiryId;
    if (inquiryId) {
      const existing = await prisma.inquiry.findFirst({
        where: { id: inquiryId, orgId: ctx.org.id },
        select: { id: true, stage: true },
      });
      if (!existing) return err("That record no longer exists.", "not_found");

      if (existing.stage !== input.stage && !canMoveInquiry(existing.stage as never, input.stage)) {
        throw new WorkflowError(
          `A pipeline record cannot move from ${existing.stage.replace(/_/g, " ")} to ${input.stage.replace(/_/g, " ")}.`,
        );
      }
      await prisma.inquiry.update({ where: { id: inquiryId }, data });
    } else {
      const created = await prisma.inquiry.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    await audit(ctx, {
      action: inquiryId ? "inquiry.update" : "inquiry.create",
      entityType: "inquiry",
      entityId: id,
      summary: `${inquiryId ? "Updated" : "Logged"} pipeline record for ${input.name}`,
      meta: { stage: input.stage, attributed: Boolean(input.contentItemId) },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/pipeline`);
    revalidatePath(`/app/${orgSlug}`);
    if (input.contentItemId) revalidatePath(`/app/${orgSlug}/production/${input.contentItemId}`);

    return ok({ id: id as string }, inquiryId ? "Pipeline record updated." : "Pipeline record added.");
  });
}

export async function setInquiryStageAction(
  orgSlug: string,
  inquiryId: string,
  stage: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const target = inquiryStageSchema.parse(stage);

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, orgId: ctx.org.id },
      select: { id: true, name: true, stage: true, contentItemId: true },
    });
    if (!inquiry) return err("That record no longer exists.", "not_found");
    if (inquiry.stage === target) return okVoid("Already in that stage.");

    if (!canMoveInquiry(inquiry.stage as never, target)) {
      throw new WorkflowError(
        `A pipeline record cannot move from ${inquiry.stage.replace(/_/g, " ")} to ${target.replace(/_/g, " ")}.`,
      );
    }

    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        stage: target,
        closedAt: ["won", "lost"].includes(target) ? new Date() : null,
      },
    });

    await audit(ctx, {
      action: "inquiry.stage",
      entityType: "inquiry",
      entityId: inquiryId,
      summary: `Moved ${inquiry.name} to ${target.replace(/_/g, " ")}`,
      meta: { from: inquiry.stage, to: target },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/pipeline`);
    revalidatePath(`/app/${orgSlug}`);
    if (inquiry.contentItemId) revalidatePath(`/app/${orgSlug}/production/${inquiry.contentItemId}`);

    return okVoid("Stage updated.");
  });
}

export async function deleteInquiryAction(orgSlug: string, inquiryId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "pipeline.edit");
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, orgId: ctx.org.id },
      select: { id: true, name: true },
    });
    if (!inquiry) return err("That record no longer exists.", "not_found");

    await prisma.inquiry.delete({ where: { id: inquiryId } });
    await audit(ctx, {
      action: "inquiry.delete",
      entityType: "inquiry",
      entityId: inquiryId,
      summary: `Deleted pipeline record for ${inquiry.name}`,
    });
    revalidatePath(`/app/${orgSlug}/pipeline`);

    return okVoid("Record deleted.");
  });
}
