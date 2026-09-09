"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isTextLed } from "@/lib/domain/workflow";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess, type AuthContext } from "@/lib/auth/guard";
import { generatePackaging } from "@/lib/ai/generators";
import { stringify, stringifyArray } from "@/lib/db/json";
import { contentStageSchema, prioritySchema, platformSchema } from "@/lib/domain/enums";
import { canMoveContent, requiresNote, WorkflowError } from "@/lib/domain/workflow";
import { assertPackageApprovable } from "@/lib/domain/longform";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { getStorage, storageProviderName } from "@/lib/storage";
import {
  cleanText,
  cleanUrl,
  err,
  guarded,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Production mutations: stage transitions, assignment, comments, revisions,
 * approvals, asset attachment and packaging.
 *
 * Every stage change writes a `ContentEvent`, which is what makes the timeline,
 * the audit history and the operating metrics (cycle time, approval turnaround)
 * real rather than estimated.
 */

async function recordEvent(
  ctx: AuthContext,
  contentItemId: string,
  data: { type: string; fromStage?: string | null; toStage?: string | null; note?: string | null },
) {
  await prisma.contentEvent.create({
    data: {
      orgId: ctx.org.id,
      contentItemId,
      type: data.type,
      fromStage: data.fromStage ?? null,
      toStage: data.toStage ?? null,
      note: data.note ?? null,
      actorId: ctx.user.id,
    },
  });
}

function revalidateContent(orgSlug: string, id: string) {
  revalidatePath(`/app/${orgSlug}/production`);
  revalidatePath(`/app/${orgSlug}/production/${id}`);
  revalidatePath(`/app/${orgSlug}`);
}

/* ------------------------------ Stage transitions --------------------------- */

const moveSchema = z.object({
  stage: contentStageSchema,
  note: z.string().max(2000).optional(),
});

export async function moveContentAction(
  orgSlug: string,
  contentItemId: string,
  stage: string,
  note?: string,
): Promise<ActionResult<{ stage: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    const input = moveSchema.parse({ stage, note });

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
    });
    if (!item) return err("That content item no longer exists.", "not_found");
    if (item.stage === input.stage) return ok({ stage: item.stage }, "Already in that stage.");

    if (!canMoveContent(item.stage as never, input.stage)) {
      throw new WorkflowError(
        `"${item.title}" cannot move from ${item.stage.replace(/_/g, " ")} to ${input.stage.replace(/_/g, " ")}.`,
      );
    }

    // Approving is a distinct capability from moving work along the board.
    if (input.stage === "approved" && !ctx.can("production.approve")) {
      return err("Only a workspace admin can approve content.", "auth");
    }

    // A rejection without a reason is the biggest source of production churn,
    // so the product refuses to record one.
    if (requiresNote(input.stage) && !input.note?.trim()) {
      return err(
        "Explain what needs to change. A revision request without notes wastes an edit cycle.",
        "validation",
        { note: "Add a revision note." },
      );
    }

    const data: Record<string, unknown> = { stage: input.stage };
    if (input.stage === "changes_requested") data.revisionCount = { increment: 1 };
    if (input.stage === "approved") {
      data.approvedAt = new Date();
      data.approvedById = ctx.user.id;
    }
    if (input.stage === "editing" && !item.recordedAt) data.recordedAt = new Date();
    if (input.stage === "live") data.liveAt = new Date();

    // Conditional on the stage this caller read. Two simultaneous requests —
    // a double-click on Approve — both pass the transition check above; only
    // the one whose UPDATE finds the row still in the expected stage may log an
    // event. Found by QA on 2026-09-09: the race double-logged approvals.
    const moved = await prisma.contentItem.updateMany({
      where: { id: contentItemId, orgId: ctx.org.id, stage: item.stage },
      data,
    });
    if (moved.count === 0) {
      return ok({ stage: input.stage }, "Already moved.");
    }

    await recordEvent(ctx, contentItemId, {
      type: input.stage === "changes_requested" ? "revision_requested" : "stage_change",
      fromStage: item.stage,
      toStage: input.stage,
      note: input.note ?? null,
    });

    if (input.stage === "changes_requested" && input.note) {
      await prisma.comment.create({
        data: {
          orgId: ctx.org.id,
          entityType: "content_item",
          entityId: contentItemId,
          body: cleanText(input.note, 2000),
          kind: "revision_request",
          authorId: ctx.user.id,
        },
      });
    }

    // Close the founder's approval task once the piece is approved.
    if (input.stage === "approved") {
      await prisma.task.updateMany({
        where: { orgId: ctx.org.id, entityId: contentItemId, kind: "approve", status: "open" },
        data: { status: "done", completedAt: new Date() },
      });
    }

    await audit(ctx, {
      action: "content.stage",
      entityType: "content_item",
      entityId: contentItemId,
      summary: `Moved "${item.title}" to ${input.stage.replace(/_/g, " ")}`,
      meta: { from: item.stage, to: input.stage },
    });
    await touchOrg(ctx.org.id);
    revalidateContent(orgSlug, contentItemId);
    revalidatePath(`/app/${orgSlug}/distribution`);

    return ok({ stage: input.stage }, stageMessage(input.stage));
  });
}

function stageMessage(stage: string) {
  switch (stage) {
    case "approved":
      return "Approved. Ready to package and schedule.";
    case "changes_requested":
      return "Sent back with your notes.";
    case "in_review":
      return "Sent for review.";
    case "editing":
      return "Moved to editing.";
    case "live":
      return "Marked live.";
    default:
      return "Stage updated.";
  }
}

/* --------------------------------- Assignment -------------------------------- */

export async function assignEditorAction(
  orgSlug: string,
  contentItemId: string,
  editorId: string | null,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.assign");

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");

    if (editorId) {
      // The assignee must be a member of THIS organisation.
      const membership = await prisma.membership.findUnique({
        where: { userId_orgId: { userId: editorId, orgId: ctx.org.id } },
        include: { user: { select: { name: true } } },
      });
      if (!membership) return err("That person is not a member of this workspace.", "validation");

      await prisma.contentItem.update({ where: { id: contentItemId }, data: { editorId } });
      await recordEvent(ctx, contentItemId, {
        type: "comment",
        note: `Assigned to ${membership.user.name}`,
      });
    } else {
      await prisma.contentItem.update({ where: { id: contentItemId }, data: { editorId: null } });
      await recordEvent(ctx, contentItemId, { type: "comment", note: "Editor unassigned" });
    }

    await audit(ctx, {
      action: "content.assign",
      entityType: "content_item",
      entityId: contentItemId,
      summary: `Assignment changed on "${item.title}"`,
    });
    revalidateContent(orgSlug, contentItemId);

    return okVoid(editorId ? "Editor assigned." : "Editor removed.");
  });
}

const detailsSchema = z.object({
  title: z.string().min(3).max(240),
  platform: platformSchema,
  priority: prioritySchema,
  dueDate: optionalDate,
  selectedHook: z.string().max(1000).optional(),
});

export async function updateContentDetailsAction(
  orgSlug: string,
  contentItemId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    const input = parseForm(detailsSchema, formData);

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        title: cleanText(input.title, 240),
        platform: input.platform,
        priority: input.priority,
        dueDate: input.dueDate,
        selectedHook: input.selectedHook ?? undefined,
      },
    });

    await audit(ctx, {
      action: "content.update",
      entityType: "content_item",
      entityId: contentItemId,
      summary: `Updated "${input.title}"`,
    });
    revalidateContent(orgSlug, contentItemId);

    return okVoid("Saved.");
  });
}

/* ---------------------------------- Comments --------------------------------- */

const commentSchema = z.object({
  body: z.string().min(1, "Write a comment first.").max(4000),
  kind: z.enum(["comment", "revision_request", "approval_note"]).default("comment"),
});

export async function addCommentAction(
  orgSlug: string,
  contentItemId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.view");
    const input = parseForm(commentSchema, formData);

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");

    await prisma.comment.create({
      data: {
        orgId: ctx.org.id,
        entityType: "content_item",
        entityId: contentItemId,
        body: cleanText(input.body, 4000),
        kind: input.kind,
        authorId: ctx.user.id,
      },
    });

    await recordEvent(ctx, contentItemId, { type: "comment", note: cleanText(input.body, 300) });
    await touchOrg(ctx.org.id);
    revalidateContent(orgSlug, contentItemId);

    return okVoid("Comment added.");
  });
}

export async function resolveCommentAction(
  orgSlug: string,
  commentId: string,
  resolved: boolean,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, orgId: ctx.org.id },
      select: { id: true, entityId: true },
    });
    if (!comment) return err("That comment no longer exists.", "not_found");

    await prisma.comment.update({ where: { id: commentId }, data: { resolved } });
    revalidateContent(orgSlug, comment.entityId);

    return okVoid(resolved ? "Marked resolved." : "Reopened.");
  });
}

/* ----------------------------------- Assets ---------------------------------- */

const uploadSchema = z.object({
  file: z.instanceof(File),
  category: z.string().max(60).default("raw_media"),
  title: z.string().max(240).optional(),
});

export async function uploadContentAssetAction(
  orgSlug: string,
  contentItemId: string,
  _prev: ActionResult<{ assetId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ assetId: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    await enforceRateLimit(`upload:${ctx.org.id}`, LIMITS.upload);

    const input = parseForm(uploadSchema, formData);

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true, stage: true, recordedAt: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");

    const stored = await getStorage().put({
      orgId: ctx.org.id,
      file: input.file,
      prefix: `content/${contentItemId}`,
    });

    const existingVersions = await prisma.asset.count({
      where: { orgId: ctx.org.id, contentItemId, category: input.category },
    });

    const asset = await prisma.asset.create({
      data: {
        orgId: ctx.org.id,
        contentItemId,
        category: input.category,
        title: input.title?.trim() || stored.fileName,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        storagePath: stored.storagePath,
        storageProvider: storageProviderName(),
        version: existingVersions + 1,
        uploadedById: ctx.user.id,
      },
    });

    await recordEvent(ctx, contentItemId, {
      type: "asset_added",
      note: `${stored.fileName} added`,
    });

    // Uploading raw footage is the signal that recording actually happened.
    if (input.category === "raw_media" && item.stage === "raw") {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { recordedAt: item.recordedAt ?? new Date() },
      });
    }

    await audit(ctx, {
      action: "asset.upload",
      entityType: "asset",
      entityId: asset.id,
      summary: `Uploaded ${stored.fileName} to "${item.title}"`,
      meta: { sizeBytes: stored.sizeBytes, mimeType: stored.mimeType },
    });
    await touchOrg(ctx.org.id);
    revalidateContent(orgSlug, contentItemId);
    revalidatePath(`/app/${orgSlug}/library`);

    return ok({ assetId: asset.id }, "File uploaded.");
  });
}

/** Mark a piece recorded from the Recording Room. */
export async function markRecordedAction(
  orgSlug: string,
  contentItemId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "recording.complete");

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
    });
    if (!item) return err("That content item no longer exists.", "not_found");
    if (item.stage !== "raw") return err("This piece has already moved past recording.", "workflow");
    if (isTextLed(item)) return err("This is a text piece — it is written and edited, not recorded.", "workflow");

    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { stage: "editing", recordedAt: new Date() },
    });

    await recordEvent(ctx, contentItemId, {
      type: "recorded",
      fromStage: "raw",
      toStage: "editing",
      note: "Marked recorded by the founder",
    });

    await prisma.task.updateMany({
      where: { orgId: ctx.org.id, entityId: contentItemId, kind: "record", status: "open" },
      data: { status: "done", completedAt: new Date() },
    });

    await audit(ctx, {
      action: "content.recorded",
      entityType: "content_item",
      entityId: contentItemId,
      summary: `Recorded "${item.title}"`,
    });
    await touchOrg(ctx.org.id);
    revalidateContent(orgSlug, contentItemId);
    revalidatePath(`/app/${orgSlug}/production/recording`);

    return okVoid("Marked recorded and sent to editing.");
  });
}

/* --------------------------------- Packaging --------------------------------- */

export async function generatePackagingAction(
  orgSlug: string,
  contentItemId: string,
  platforms: string[],
): Promise<ActionResult<{ created: number; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ai.generate");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);

    const targets = z.array(platformSchema).min(1).max(6).parse(platforms);

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      include: {
        script: { select: { versions: { orderBy: { version: "desc" }, take: 1 } } },
        packages: { select: { platform: true } },
      },
    });
    if (!item) return err("That content item no longer exists.", "not_found");
    if (!["approved", "scheduled", "live"].includes(item.stage)) {
      return err("Approve the content before packaging it for distribution.", "workflow");
    }

    const version = item.script?.versions[0];
    const { packages, meta } = await generatePackaging({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      title: item.title,
      hook: item.selectedHook ?? version?.hook,
      body: version?.body,
      platforms: targets,
      entityId: contentItemId,
    });

    let created = 0;
    for (const pkg of packages) {
      if (!targets.includes(pkg.platform as never)) continue;
      await prisma.platformPackage.upsert({
        where: { contentItemId_platform: { contentItemId, platform: pkg.platform } },
        create: {
          orgId: ctx.org.id,
          contentItemId,
          platform: pkg.platform,
          title: pkg.title,
          caption: pkg.caption,
          description: pkg.description,
          hashtags: stringifyArray(pkg.hashtags),
          overlays: stringifyArray(pkg.overlays),
          thumbnailConcepts: stringifyArray(pkg.thumbnailConcepts),
          ctaOptions: stringifyArray(pkg.ctaOptions),
          clipOpportunities: stringify(pkg.clipOpportunities),
          repurposing: pkg.repurposing,
          status: "draft",
          generatedBy: "ai",
        },
        update: {
          title: pkg.title,
          caption: pkg.caption,
          description: pkg.description,
          hashtags: stringifyArray(pkg.hashtags),
          overlays: stringifyArray(pkg.overlays),
          thumbnailConcepts: stringifyArray(pkg.thumbnailConcepts),
          ctaOptions: stringifyArray(pkg.ctaOptions),
          clipOpportunities: stringify(pkg.clipOpportunities),
          repurposing: pkg.repurposing,
          generatedBy: "ai",
        },
      });
      created += 1;
    }

    await audit(ctx, {
      action: "packaging.generate",
      entityType: "content_item",
      entityId: contentItemId,
      summary: `Packaged "${item.title}" for ${targets.join(", ")}`,
      meta: { platforms: targets, isDemo: meta.isDemo },
    });
    revalidateContent(orgSlug, contentItemId);
    revalidatePath(`/app/${orgSlug}/production/packaging`);

    return ok({ created, isDemo: meta.isDemo }, `Packaged for ${created} platform${created === 1 ? "" : "s"}.`);
  });
}

const packageSaveSchema = z.object({
  workingTitle: z.string().max(400).optional(),
  title: z.string().max(400).optional(),
  thumbnailRef: z.string().max(600).optional(),
  caption: z.string().max(6000).optional(),
  description: z.string().max(6000).optional(),
  hashtags: z.string().max(1000).optional(),
  repurposing: z.string().max(2000).optional(),
});

export async function savePackageAction(
  orgSlug: string,
  packageId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.edit");
    const input = parseForm(packageSaveSchema, formData);

    const pkg = await prisma.platformPackage.findFirst({
      where: { id: packageId, orgId: ctx.org.id },
      select: {
        id: true,
        contentItemId: true,
        platform: true,
        contentItem: { select: { format: true } },
      },
    });
    if (!pkg) return err("That package no longer exists.", "not_found");

    await prisma.platformPackage.update({
      where: { id: packageId },
      data: {
        workingTitle: input.workingTitle ?? null,
        title: input.title ?? null,
        thumbnailRef: cleanUrl(input.thumbnailRef) ?? input.thumbnailRef ?? null,
        caption: input.caption ?? null,
        description: input.description ?? null,
        hashtags: stringifyArray(
          (input.hashtags ?? "")
            .split(/[\s,]+/)
            .map((t) => t.trim())
            .filter(Boolean),
        ),
        repurposing: input.repurposing ?? null,
        generatedBy: "human",
        status: "ready",
      },
    });

    await audit(ctx, {
      action: "packaging.edit",
      entityType: "platform_package",
      entityId: packageId,
      summary: `Edited ${pkg.platform} packaging`,
    });
    revalidateContent(orgSlug, pkg.contentItemId);

    return okVoid("Packaging saved.");
  });
}

/**
 * Approve a package.
 *
 * Separate from saving on purpose — approving is a decision, and a decision
 * deserves its own audit entry and its own gate. On long-form the gate is real:
 * a package without a final title and a thumbnail gets finished by whoever
 * happens to be uploading, which is the improvisation the loop exists to remove.
 */
export async function approvePackageAction(
  orgSlug: string,
  packageId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.publish");

    const pkg = await prisma.platformPackage.findFirst({
      where: { id: packageId, orgId: ctx.org.id },
      select: {
        id: true,
        contentItemId: true,
        platform: true,
        status: true,
        workingTitle: true,
        title: true,
        thumbnailRef: true,
        description: true,
        contentItem: { select: { format: true, title: true } },
      },
    });
    if (!pkg) return err("That package no longer exists.", "not_found");
    if (pkg.status === "approved") return okVoid("Already approved.");

    assertPackageApprovable(pkg.contentItem.format, {
      workingTitle: pkg.workingTitle,
      title: pkg.title,
      thumbnailRef: pkg.thumbnailRef,
      description: pkg.description,
    });

    await prisma.platformPackage.update({
      where: { id: packageId },
      data: { status: "approved", approvedAt: new Date(), approvedById: ctx.user.id },
    });

    await audit(ctx, {
      action: "packaging.approve",
      entityType: "platform_package",
      entityId: packageId,
      summary: `Approved ${pkg.platform} packaging for "${pkg.contentItem.title}"`,
    });
    revalidateContent(orgSlug, pkg.contentItemId);

    return okVoid("Packaging approved.");
  });
}

export async function createPackageAction(
  orgSlug: string,
  contentItemId: string,
  platform: string,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "distribution.edit");
    const target = platformSchema.parse(platform);

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true },
    });
    if (!item) return err("That content item no longer exists.", "not_found");

    const existing = await prisma.platformPackage.findUnique({
      where: { contentItemId_platform: { contentItemId, platform: target } },
    });
    if (existing) {
      return err(`This piece already has a ${target} package. Edit that one instead.`, "workflow");
    }

    const pkg = await prisma.platformPackage.create({
      data: {
        orgId: ctx.org.id,
        contentItemId,
        platform: target,
        title: item.title,
        status: "draft",
        generatedBy: "human",
      },
    });

    revalidateContent(orgSlug, contentItemId);
    return ok({ id: pkg.id }, "Package created.");
  });
}
