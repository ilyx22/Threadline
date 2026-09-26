import "server-only";
import { prisma } from "@/lib/db/client";
import { enqueue } from "@/lib/jobs";
import { WorkflowError } from "@/lib/domain/workflow";
import { buildWorkspaceExport } from "@/lib/commercial/offboarding";
import { getStorage, storageProviderName } from "@/lib/storage";

/**
 * On-demand exports (FILE-06). A workspace admin asks for an export; a job
 * writes it to private storage; it can be downloaded for seven days through
 * the normal file route (membership re-checked), then the file is deleted.
 * One export at a time per workspace, and at most one an hour.
 */
const KEEP_MS = 7 * 86_400_000;

export async function requestExport(orgId: string, userId: string, now = new Date()) {
  const recent = await prisma.dataExport.findFirst({ where: { orgId, createdAt: { gte: new Date(now.getTime() - 3_600_000) } }, orderBy: { createdAt: "desc" } });
  if (recent && recent.status === "queued") throw new WorkflowError("An export is already being prepared.");
  if (recent) throw new WorkflowError("An export was made in the last hour. Use that one, or try again later.");
  const row = await prisma.dataExport.create({ data: { orgId, requestedById: userId } });
  await enqueue("export.build", { exportId: row.id }, { idempotencyKey: `export.build:${row.id}`, orgId });
  return row;
}

/** Job: build the export file. Safe to run twice: only a queued export is built. */
export async function buildExport(exportId: string, now = new Date()) {
  const e = await prisma.dataExport.findUnique({ where: { id: exportId } });
  if (!e || e.status !== "queued") return null;
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: e.orgId }, select: { slug: true } });
  try {
    const data = await buildWorkspaceExport(e.orgId);
    const file = new File([JSON.stringify(data, null, 2)], `${org.slug}-export-${now.toISOString().slice(0, 10)}.json`, { type: "application/json" });
    const stored = await getStorage().put({ orgId: e.orgId, file, prefix: "exports" });
    const asset = await prisma.asset.create({
      data: { orgId: e.orgId, category: "report", title: `Data export ${now.toISOString().slice(0, 10)}`, fileName: stored.fileName, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes, storagePath: stored.storagePath, storageProvider: storageProviderName(), uploadedById: e.requestedById, tags: '["export"]', source: "export", sourceNote: "Data export requested from workspace settings" },
    });
    const moved = await prisma.dataExport.updateMany({ where: { id: e.id, status: "queued" }, data: { status: "ready", assetId: asset.id, sizeBytes: stored.sizeBytes, readyAt: now, expiresAt: new Date(now.getTime() + KEEP_MS) } });
    if (moved.count !== 1) {
      // Another run finished first: remove this duplicate file.
      await getStorage().delete(stored.storagePath).catch(() => {});
      await prisma.asset.delete({ where: { id: asset.id } });
    }
    return asset.id;
  } catch (err) {
    await prisma.dataExport.update({ where: { id: e.id }, data: { status: "failed", error: (err instanceof Error ? err.message : "Export failed").slice(0, 500) } });
    throw err;
  }
}

/** Daily tick: delete export files past their window; keep the row as the record. */
export async function expireExports(now = new Date()) {
  const due = await prisma.dataExport.findMany({ where: { status: "ready", expiresAt: { lt: now } }, take: 200 });
  for (const e of due) {
    if (e.assetId) {
      const a = await prisma.asset.findUnique({ where: { id: e.assetId } });
      if (a?.storagePath) await getStorage().delete(a.storagePath).catch(() => {});
      if (a) await prisma.asset.delete({ where: { id: a.id } });
    }
    await prisma.dataExport.update({ where: { id: e.id }, data: { status: "expired", assetId: null } });
  }
  return due.length;
}

export async function listExports(orgId: string) {
  const rows = await prisma.dataExport.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 10 });
  const assets = await prisma.asset.findMany({ where: { id: { in: rows.map((r) => r.assetId).filter((x): x is string => Boolean(x)) } }, select: { id: true, storagePath: true } });
  return rows.map((r) => ({ ...r, downloadPath: assets.find((a) => a.id === r.assetId)?.storagePath ?? null }));
}
