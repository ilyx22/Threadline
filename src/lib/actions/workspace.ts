"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { canAssignRoleIn, canManageMemberWithRole } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain/enums";
import { stringify, stringifyArray } from "@/lib/db/json";
import {
  assetCategorySchema,
  claimPermissionSchema,
  proofKindSchema,
  roleSchema,
  taskKindSchema,
  taskStatusSchema,
} from "@/lib/domain/enums";
import {
  companyProfileSchema,
  contentRulesSchema,
  founderProfileSchema,
  overallCompleteness,
  sectionCompleteness,
  voiceProfileSchema,
  EMPTY_COMPANY,
  EMPTY_CONTENT_RULES,
  EMPTY_FOUNDER,
  EMPTY_VOICE,
} from "@/lib/domain/brand-brain";
import { parseWith } from "@/lib/db/json";
import { getStorage, storageProviderName } from "@/lib/storage";
import { queueProcessingFor } from "@/lib/processing";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import {
  cleanText,
  cleanUrl,
  commaField,
  err,
  guarded,
  linesField,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/** Brand Brain, settings, members, tasks and library mutations. */

async function recomputeCompleteness(orgId: string) {
  const [brain, offers, icps, proof] = await Promise.all([
    prisma.brandBrain.findUnique({ where: { orgId } }),
    prisma.offer.count({ where: { orgId } }),
    prisma.icpProfile.count({ where: { orgId } }),
    prisma.proofItem.count({ where: { orgId } }),
  ]);
  if (!brain) return;

  const sections = sectionCompleteness(
    {
      company: parseWith(brain.company, companyProfileSchema, EMPTY_COMPANY),
      founder: parseWith(brain.founder, founderProfileSchema, EMPTY_FOUNDER),
      voice: parseWith(brain.voice, voiceProfileSchema, EMPTY_VOICE),
      contentRules: parseWith(brain.contentRules, contentRulesSchema, EMPTY_CONTENT_RULES),
    },
    { offers, icps, proof },
  );

  await prisma.brandBrain.update({
    where: { orgId },
    data: { completeness: overallCompleteness(sections) },
  });
}

async function ensureBrain(orgId: string) {
  return prisma.brandBrain.upsert({
    where: { orgId },
    create: { orgId },
    update: {},
  });
}

/* ------------------------------- Brand Brain -------------------------------- */

const companyFormSchema = z.object({
  description: z.string().max(4000).optional(),
  website: z.string().max(300).optional(),
  category: z.string().max(400).optional(),
  geography: z.string().max(400).optional(),
  products: linesField,
  teamSize: z.string().max(400).optional(),
  revenueRange: z.string().max(400).optional(),
});

export async function saveCompanyProfileAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(companyFormSchema, formData);

    await ensureBrain(ctx.org.id);
    const profile = companyProfileSchema.parse({
      description: input.description ?? "",
      // QA-007: a company website is rendered as a link. Anything that is not
      // an http(s) URL is dropped rather than stored — "javascript:" included.
      website: input.website ? (cleanUrl(input.website) ?? "") : "",
      category: input.category ?? "",
      geography: input.geography ?? "",
      products: input.products,
      teamSize: input.teamSize ?? "",
      revenueRange: input.revenueRange ?? "",
    });

    await prisma.brandBrain.update({
      where: { orgId: ctx.org.id },
      data: { company: stringify(profile) },
    });

    // Keep the org record consistent with the Brand Brain.
    await prisma.organization.update({
      where: { id: ctx.org.id },
      data: {
        website: cleanUrl(profile.website),
        industry: profile.category || null,
        geography: profile.geography || null,
      },
    });

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "brain.company",
      entityType: "brand_brain",
      summary: "Updated the company profile",
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Company profile saved.");
  });
}

const founderFormSchema = z.object({
  name: z.string().max(400).optional(),
  title: z.string().max(400).optional(),
  bio: z.string().max(4000).optional(),
  experience: z.string().max(4000).optional(),
  beliefs: linesField,
  opinions: linesField,
  stories: linesField,
  credentials: linesField,
  approvedAnecdotes: linesField,
});

export async function saveFounderProfileAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(founderFormSchema, formData);

    await ensureBrain(ctx.org.id);
    const profile = founderProfileSchema.parse({
      name: input.name ?? "",
      title: input.title ?? "",
      bio: input.bio ?? "",
      experience: input.experience ?? "",
      beliefs: input.beliefs,
      opinions: input.opinions,
      stories: input.stories,
      credentials: input.credentials,
      approvedAnecdotes: input.approvedAnecdotes,
    });

    await prisma.brandBrain.update({
      where: { orgId: ctx.org.id },
      data: { founder: stringify(profile) },
    });

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "brain.founder",
      entityType: "brand_brain",
      summary: "Updated the founder profile",
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Founder profile saved.");
  });
}

const voiceFormSchema = z.object({
  tone: z.string().max(4000).optional(),
  vocabulary: z.string().max(4000).optional(),
  sentenceStructure: z.string().max(4000).optional(),
  humour: z.string().max(4000).optional(),
  phrasesUsed: linesField,
  phrasesAvoided: linesField,
  soundsLikeMe: linesField,
  notMe: linesField,
});

export async function saveVoiceProfileAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(voiceFormSchema, formData);

    await ensureBrain(ctx.org.id);
    const profile = voiceProfileSchema.parse({
      tone: input.tone ?? "",
      vocabulary: input.vocabulary ?? "",
      sentenceStructure: input.sentenceStructure ?? "",
      humour: input.humour ?? "",
      phrasesUsed: input.phrasesUsed,
      phrasesAvoided: input.phrasesAvoided,
      soundsLikeMe: input.soundsLikeMe,
      notMe: input.notMe,
    });

    await prisma.brandBrain.update({
      where: { orgId: ctx.org.id },
      data: { voice: stringify(profile) },
    });

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "brain.voice",
      entityType: "brand_brain",
      summary: "Updated the voice profile",
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Voice profile saved.");
  });
}

const contentRulesFormSchema = z.object({
  platforms: commaField,
  formats: commaField,
  preferredCtas: linesField,
  cadencePerWeek: z.coerce.number().int().min(0).max(50).default(3),
  pillars: linesField,
  topics: linesField,
  bannedTopics: linesField,
  complianceNotes: z.string().max(4000).optional(),
});

export async function saveContentRulesAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(contentRulesFormSchema, formData);

    await ensureBrain(ctx.org.id);
    const rules = contentRulesSchema.parse({
      platforms: input.platforms,
      formats: input.formats,
      preferredCtas: input.preferredCtas,
      cadencePerWeek: input.cadencePerWeek,
      pillars: input.pillars,
      topics: input.topics,
      bannedTopics: input.bannedTopics,
      complianceNotes: input.complianceNotes ?? "",
    });

    await prisma.brandBrain.update({
      where: { orgId: ctx.org.id },
      data: { contentRules: stringify(rules) },
    });

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "brain.rules",
      entityType: "brand_brain",
      summary: "Updated content rules",
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);
    revalidatePath(`/app/${orgSlug}/settings`);

    return okVoid("Content rules saved.");
  });
}

/* ----------------------------------- Offers ---------------------------------- */

const offerFormSchema = z.object({
  name: z.string().min(2, "Give the offer a name.").max(200),
  isPrimary: z.union([z.literal("on"), z.literal("true")]).optional(),
  price: z.coerce.number().min(0).default(0),
  priceModel: z.enum(["one_off", "retainer", "subscription", "hybrid"]).default("one_off"),
  mechanism: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
  differentiators: linesField,
  guarantees: z.string().max(1000).optional(),
  ctas: linesField,
  exclusions: z.string().max(2000).optional(),
});

export async function saveOfferAction(
  orgSlug: string,
  offerId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(offerFormSchema, formData);
    const isPrimary = Boolean(input.isPrimary);

    const data = {
      name: cleanText(input.name, 200),
      isPrimary,
      priceMinor: Math.round(input.price * 100),
      currency: ctx.org.currency,
      priceModel: input.priceModel,
      mechanism: input.mechanism ?? null,
      outcome: input.outcome ?? null,
      differentiators: stringifyArray(input.differentiators),
      guarantees: input.guarantees ?? null,
      ctas: stringifyArray(input.ctas),
      exclusions: input.exclusions ?? null,
    };

    let id = offerId;
    if (offerId) {
      const existing = await prisma.offer.findFirst({
        where: { id: offerId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!existing) return err("That offer no longer exists.", "not_found");
      await prisma.offer.update({ where: { id: offerId }, data });
    } else {
      const created = await prisma.offer.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    // Only one offer can be primary; it drives AI context selection.
    if (isPrimary && id) {
      await prisma.offer.updateMany({
        where: { orgId: ctx.org.id, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: offerId ? "offer.update" : "offer.create",
      entityType: "offer",
      entityId: id,
      summary: `${offerId ? "Updated" : "Added"} offer "${input.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return ok({ id: id as string }, offerId ? "Offer saved." : "Offer added.");
  });
}

export async function deleteOfferAction(orgSlug: string, offerId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, orgId: ctx.org.id },
      select: { id: true, name: true },
    });
    if (!offer) return err("That offer no longer exists.", "not_found");

    await prisma.offer.delete({ where: { id: offerId } });
    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "offer.delete",
      entityType: "offer",
      entityId: offerId,
      summary: `Deleted offer "${offer.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Offer deleted.");
  });
}

/* ------------------------------------ ICP ------------------------------------ */

const icpFormSchema = z.object({
  name: z.string().min(2, "Name this audience.").max(200),
  isPrimary: z.union([z.literal("on"), z.literal("true")]).optional(),
  description: z.string().max(2000).optional(),
  demographics: z.string().max(2000).optional(),
  firmographics: z.string().max(2000).optional(),
  pains: linesField,
  desires: linesField,
  objections: linesField,
  triggers: linesField,
  sophistication: z.enum(["low", "moderate", "high"]).default("moderate"),
});

export async function saveIcpAction(
  orgSlug: string,
  icpId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(icpFormSchema, formData);
    const isPrimary = Boolean(input.isPrimary);

    const data = {
      name: cleanText(input.name, 200),
      isPrimary,
      description: input.description ?? null,
      demographics: input.demographics ?? null,
      firmographics: input.firmographics ?? null,
      pains: stringifyArray(input.pains),
      desires: stringifyArray(input.desires),
      objections: stringifyArray(input.objections),
      triggers: stringifyArray(input.triggers),
      sophistication: input.sophistication,
    };

    let id = icpId;
    if (icpId) {
      const existing = await prisma.icpProfile.findFirst({
        where: { id: icpId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!existing) return err("That audience no longer exists.", "not_found");
      await prisma.icpProfile.update({ where: { id: icpId }, data });
    } else {
      const created = await prisma.icpProfile.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    if (isPrimary && id) {
      await prisma.icpProfile.updateMany({
        where: { orgId: ctx.org.id, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: icpId ? "icp.update" : "icp.create",
      entityType: "icp",
      entityId: id,
      summary: `${icpId ? "Updated" : "Added"} audience "${input.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return ok({ id: id as string }, icpId ? "Audience saved." : "Audience added.");
  });
}

export async function deleteIcpAction(orgSlug: string, icpId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const icp = await prisma.icpProfile.findFirst({
      where: { id: icpId, orgId: ctx.org.id },
      select: { id: true, name: true },
    });
    if (!icp) return err("That audience no longer exists.", "not_found");

    await prisma.icpProfile.delete({ where: { id: icpId } });
    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "icp.delete",
      entityType: "icp",
      entityId: icpId,
      summary: `Deleted audience "${icp.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Audience deleted.");
  });
}

/* ----------------------------------- Proof ----------------------------------- */

const proofFormSchema = z.object({
  kind: proofKindSchema,
  title: z.string().min(2, "Give the proof a title.").max(300),
  body: z.string().max(4000).optional(),
  source: z.string().max(300).optional(),
  metricLabel: z.string().max(200).optional(),
  metricValue: z.string().max(200).optional(),
  claimStatus: claimPermissionSchema.default("allowed"),
});

export async function saveProofAction(
  orgSlug: string,
  proofId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const input = parseForm(proofFormSchema, formData);

    const data = {
      kind: input.kind,
      title: cleanText(input.title, 300),
      body: input.body ? cleanText(input.body) : null,
      source: input.source ?? null,
      metricLabel: input.metricLabel ?? null,
      metricValue: input.metricValue ?? null,
      claimStatus: input.claimStatus,
    };

    let id = proofId;
    if (proofId) {
      const existing = await prisma.proofItem.findFirst({
        where: { id: proofId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!existing) return err("That proof item no longer exists.", "not_found");
      await prisma.proofItem.update({ where: { id: proofId }, data });
    } else {
      const created = await prisma.proofItem.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: proofId ? "proof.update" : "proof.create",
      entityType: "proof",
      entityId: id,
      summary: `${proofId ? "Updated" : "Added"} proof "${input.title}"`,
      meta: { claimStatus: input.claimStatus },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return ok({ id: id as string }, proofId ? "Proof saved." : "Proof added.");
  });
}

export async function deleteProofAction(orgSlug: string, proofId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const proof = await prisma.proofItem.findFirst({
      where: { id: proofId, orgId: ctx.org.id },
      select: { id: true, title: true },
    });
    if (!proof) return err("That proof item no longer exists.", "not_found");

    await prisma.proofItem.delete({ where: { id: proofId } });
    await recomputeCompleteness(ctx.org.id);
    await audit(ctx, {
      action: "proof.delete",
      entityType: "proof",
      entityId: proofId,
      summary: `Deleted proof "${proof.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/brain`);

    return okVoid("Proof deleted.");
  });
}

/* ---------------------------------- Settings --------------------------------- */

const workspaceSchema = z.object({
  name: z.string().min(2).max(200),
  website: z.string().max(300).optional(),
  industry: z.string().max(200).optional(),
  geography: z.string().max(200).optional(),
  timezone: z.string().max(80).default("Europe/London"),
});

export async function updateWorkspaceAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");
    const input = parseForm(workspaceSchema, formData);

    await prisma.organization.update({
      where: { id: ctx.org.id },
      data: {
        name: cleanText(input.name, 200),
        website: cleanUrl(input.website),
        industry: input.industry ?? null,
        geography: input.geography ?? null,
        timezone: input.timezone,
      },
    });

    await audit(ctx, {
      action: "workspace.update",
      entityType: "organization",
      entityId: ctx.org.id,
      summary: "Updated workspace settings",
    });
    revalidatePath(`/app/${orgSlug}/settings`);

    return okVoid("Workspace updated.");
  });
}

/* ----------------------------------- Members --------------------------------- */

// Adding members goes through invitations (src/lib/actions/team.ts): an admin
// never sets another person's password (TEAM-10).

export async function updateMemberRoleAction(
  orgSlug: string,
  userId: string,
  role: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    const target = roleSchema.parse(role);

    if (!canAssignRoleIn(ctx.role, target, ctx.org.kind)) {
      return err("You cannot grant that role.", "auth");
    }
    if (userId === ctx.user.id) {
      return err("You cannot change your own role.", "validation");
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId: ctx.org.id } },
      include: { user: { select: { name: true } } },
    });
    if (!membership) return err("That person is not a member of this workspace.", "not_found");
    if (!canManageMemberWithRole(ctx.role, membership.role as Role, ctx.org.kind)) {
      return err("You cannot change that person's role.", "auth");
    }
    if (membership.isOwner && target !== "client_admin") {
      return err("The owner must stay an admin. Transfer ownership first.", "workflow");
    }

    // Never demote the last workspace admin. Checked and written in one
    // serialisable transaction so two concurrent demotions cannot both pass.
    const blocked = await prisma.$transaction(
      async (tx) => {
        if (membership.role === "client_admin" && target !== "client_admin") {
          const admins = await tx.membership.count({ where: { orgId: ctx.org.id, role: "client_admin" } });
          if (admins <= 1) return true;
        }
        await tx.membership.update({
          where: { userId_orgId: { userId, orgId: ctx.org.id } },
          data: { role: target },
        });
        return false;
      },
      { isolationLevel: "Serializable" },
    );
    if (blocked) return err("This is the only workspace admin. Promote someone else first.", "workflow");

    await audit(ctx, {
      action: "member.role",
      entityType: "membership",
      entityId: userId,
      summary: `Changed ${membership.user.name} to ${target.replace(/_/g, " ")}`,
      meta: { from: membership.role, to: target },
    });
    revalidatePath(`/app/${orgSlug}/settings/members`);

    return okVoid("Role updated.");
  });
}

/* ------------------------------------ Tasks ---------------------------------- */

const taskSchema = z.object({
  title: z.string().min(3, "Describe the task.").max(240),
  description: z.string().max(2000).optional(),
  kind: taskKindSchema.default("ops"),
  audience: z.enum(["client", "internal"]).default("client"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: optionalDate,
  assigneeId: z.string().optional(),
  estimateMin: z.coerce.number().int().min(0).max(600).optional(),
});

export async function createTaskAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "tasks.view");
    const input = parseForm(taskSchema, formData);

    if (input.assigneeId) {
      const membership = await prisma.membership.findUnique({
        where: { userId_orgId: { userId: input.assigneeId, orgId: ctx.org.id } },
      });
      if (!membership) return err("That person is not a member of this workspace.", "validation");
    }

    const task = await prisma.task.create({
      data: {
        orgId: ctx.org.id,
        title: cleanText(input.title, 240),
        description: input.description ? cleanText(input.description) : null,
        kind: input.kind,
        audience: input.audience,
        priority: input.priority,
        dueDate: input.dueDate,
        assigneeId: input.assigneeId ?? null,
        estimateMin: input.estimateMin ?? null,
      },
    });

    await audit(ctx, {
      action: "task.create",
      entityType: "task",
      entityId: task.id,
      summary: `Created task "${task.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/tasks`);
    revalidatePath(`/app/${orgSlug}`);

    return ok({ id: task.id }, "Task created.");
  });
}

export async function setTaskStatusAction(
  orgSlug: string,
  taskId: string,
  status: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "tasks.complete");
    const target = taskStatusSchema.parse(status);

    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId: ctx.org.id },
      select: { id: true, title: true },
    });
    if (!task) return err("That task no longer exists.", "not_found");

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: target,
        completedAt: target === "done" ? new Date() : null,
      },
    });

    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/tasks`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid(target === "done" ? "Task completed." : "Task updated.");
  });
}

export async function deleteTaskAction(orgSlug: string, taskId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "tasks.complete");
    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId: ctx.org.id },
      select: { id: true },
    });
    if (!task) return err("That task no longer exists.", "not_found");

    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath(`/app/${orgSlug}/tasks`);

    return okVoid("Task removed.");
  });
}

/* ----------------------------------- Library --------------------------------- */

const assetUploadSchema = z.object({
  file: z.instanceof(File),
  category: assetCategorySchema.default("research_doc"),
  title: z.string().max(240).optional(),
  description: z.string().max(2000).optional(),
  contentItemId: z.string().optional(),
  tags: commaField,
});

export async function uploadLibraryAssetAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    await enforceRateLimit(`upload:${ctx.org.id}`, LIMITS.upload);
    const input = parseForm(assetUploadSchema, formData);

    if (input.contentItemId) {
      const item = await prisma.contentItem.findFirst({
        where: { id: input.contentItemId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!item) return err("That content item is not in this workspace.", "validation");
    }

    const stored = await getStorage().put({
      orgId: ctx.org.id,
      file: input.file,
      prefix: "library",
    });

    const asset = await prisma.asset.create({
      data: {
        orgId: ctx.org.id,
        contentItemId: input.contentItemId ?? null,
        category: input.category,
        title: input.title?.trim() || stored.fileName,
        description: input.description ?? null,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        storagePath: stored.storagePath,
        storageProvider: storageProviderName(),
        tags: stringifyArray(input.tags),
        uploadedById: ctx.user.id,
        source: "upload",
        sourceNote: `Uploaded to the library by ${ctx.user.name} as ${stored.fileName}`,
      },
    });
    await queueProcessingFor(asset);

    await audit(ctx, {
      action: "asset.upload",
      entityType: "asset",
      entityId: asset.id,
      summary: `Uploaded ${stored.fileName} to the library`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/library`);

    return ok({ id: asset.id }, "File uploaded.");
  });
}

const linkAssetSchema = z.object({
  category: assetCategorySchema.default("research_doc"),
  title: z.string().min(2, "Give this a title.").max(240),
  description: z.string().max(2000).optional(),
  externalUrl: z.string().min(4, "Add a link.").max(600),
  contentItemId: z.string().optional(),
  tags: commaField,
});

/** Record an external file (Drive, Dropbox) as a library entry. */
export async function linkLibraryAssetAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    const input = parseForm(linkAssetSchema, formData);

    const url = cleanUrl(input.externalUrl);
    if (!url) return err("Enter a valid link.", "validation", { externalUrl: "Enter a valid link." });

    const asset = await prisma.asset.create({
      data: {
        orgId: ctx.org.id,
        contentItemId: input.contentItemId ?? null,
        category: input.category,
        title: cleanText(input.title, 240),
        description: input.description ?? null,
        externalUrl: url,
        tags: stringifyArray(input.tags),
        uploadedById: ctx.user.id,
        // CX-05: provenance a person can read later.
        source: "link",
        sourceNote: `Linked from ${new URL(url).hostname} by ${ctx.user.name}`,
      },
    });

    await audit(ctx, {
      action: "asset.link",
      entityType: "asset",
      entityId: asset.id,
      summary: `Linked "${input.title}" in the library`,
    });
    revalidatePath(`/app/${orgSlug}/library`);

    return ok({ id: asset.id }, "Link added to the library.");
  });
}

export async function deleteAssetAction(orgSlug: string, assetId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, orgId: ctx.org.id },
    });
    if (!asset) return err("That file no longer exists.", "not_found");

    if (asset.storagePath) {
      await getStorage().delete(asset.storagePath);
    }
    await prisma.asset.delete({ where: { id: assetId } });

    await audit(ctx, {
      action: "asset.delete",
      entityType: "asset",
      entityId: assetId,
      summary: `Deleted "${asset.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/library`);
    if (asset.contentItemId) revalidatePath(`/app/${orgSlug}/production/${asset.contentItemId}`);

    return okVoid("File deleted.");
  });
}

/* -------------------------------- Notifications ------------------------------ */

export async function markNotificationsReadAction(orgSlug: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.view");

    await prisma.notification.updateMany({
      where: {
        orgId: ctx.org.id,
        readAt: null,
        OR: [{ userId: ctx.user.id }, { userId: null }],
      },
      data: { readAt: new Date() },
    });

    revalidatePath(`/app/${orgSlug}`);
    return okVoid();
  });
}
