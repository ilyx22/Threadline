"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { assetCategorySchema } from "@/lib/domain/enums";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { abortDirectUpload, completeDirectUpload, partTargets, startDirectUpload } from "@/lib/storage/direct";
import { prisma } from "@/lib/db/client";
import { retryTask } from "@/lib/processing";
import { err, guarded, ok, okVoid, type ActionResult } from "./shared";

/**
 * Direct uploads (FILE-02): the browser asks to start, receives part targets,
 * sends the parts, then asks the server to finish. Every step re-checks the
 * workspace and the library.upload capability; the session is bound to the
 * person who opened it.
 */
const startSchema = z.object({
  fileName: z.string().min(1).max(400),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive(),
  category: assetCategorySchema.default("raw_media"),
  title: z.string().max(240).optional(),
  contentItemId: z.string().max(60).optional(),
});

export async function startUploadAction(orgSlug: string, input: Omit<z.input<typeof startSchema>, "category"> & { category?: string }): Promise<ActionResult<{ sessionId: string; partSize: number; partCount: number }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    await enforceRateLimit(`upload:${ctx.org.id}`, LIMITS.upload);
    const parsed = startSchema.safeParse(input);
    if (!parsed.success) return err("That file cannot be uploaded.", "validation");
    const s = await startDirectUpload({ orgId: ctx.org.id, userId: ctx.user.id }, parsed.data);
    return ok({ sessionId: s.id, partSize: s.partSize, partCount: s.partCount });
  });
}

export async function uploadPartTargetsAction(orgSlug: string, sessionId: string, partNumbers: number[]): Promise<ActionResult<{ partNumber: number; bytes: number; url: string }[]>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    if (!Array.isArray(partNumbers)) return err("Invalid parts.", "validation");
    return ok(await partTargets({ orgId: ctx.org.id, userId: ctx.user.id }, sessionId, partNumbers.map(Number)));
  });
}

const partsSchema = z.array(z.object({ partNumber: z.number().int().positive(), etag: z.string().min(1).max(200) })).max(10_000);

export async function completeUploadAction(orgSlug: string, sessionId: string, parts: { partNumber: number; etag: string }[]): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    const parsed = partsSchema.safeParse(parts);
    if (!parsed.success) return err("Invalid parts.", "validation");
    const { assetId } = await completeDirectUpload({ orgId: ctx.org.id, userId: ctx.user.id }, sessionId, parsed.data);
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId }, select: { fileName: true } });
    await audit(ctx, { action: "asset.upload", entityType: "asset", entityId: assetId, summary: `Uploaded ${asset.fileName} to the library (direct upload)` });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/library`);
    return ok({ id: assetId }, "File uploaded.");
  });
}

export async function abortUploadAction(orgSlug: string, sessionId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    await abortDirectUpload({ orgId: ctx.org.id, userId: ctx.user.id }, sessionId);
    return okVoid();
  });
}

/** Staff: send a failed processing task again (FILE-05). */
export async function retryProcessingAction(orgSlug: string, taskId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    const done = await retryTask(taskId, ctx.org.id);
    if (!done) return err("Only a failed processing step can be retried.", "validation");
    await audit(ctx, { action: "processing.retry", entityType: "processing_task", entityId: taskId, summary: "Retried a processing step" });
    revalidatePath(`/app/${orgSlug}/library`);
    return okVoid("Sent again.");
  });
}
