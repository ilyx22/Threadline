import "server-only";
import { prisma } from "@/lib/db/client";
import { getStorage, storageProviderName } from "@/lib/storage";
import { WorkflowError } from "@/lib/domain/workflow";
import { endEngagement } from "./engagements";

/**
 * Offboarding (OFF-01, PRV-01).
 *
 * Starting it ends the engagement, cancels the workspace's queued jobs,
 * disconnects every integration and deletes its stored credentials, and
 * writes a complete export the client can download during an export window.
 * Client access ends when the window closes. Tenant data is kept until the
 * retention date and deleted only when a person confirms it (never on a
 * timer), and not at all while a legal hold is set. Every step is recorded in
 * an OffboardingRecord that outlives the tenant as the evidence.
 */
type Step = { step: string; outcome: string; at: string };

/** A JSON export of the workspace's records (files are listed, not inlined). */
export async function buildWorkspaceExport(orgId: string) {
  const [org, members, brain, ideas, scripts, content, packages, publishes, inquiries, events, reports, reviews, invoices, approvals, comments, assets] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { name: true, slug: true, website: true, industry: true, createdAt: true, startedAt: true } }),
    prisma.membership.findMany({ where: { orgId }, select: { role: true, profiles: true, user: { select: { name: true, email: true, title: true } } } }),
    prisma.brandBrain.findUnique({ where: { orgId } }),
    prisma.idea.findMany({ where: { orgId } }),
    prisma.script.findMany({ where: { orgId }, include: { versions: true } }),
    prisma.contentItem.findMany({ where: { orgId } }),
    prisma.platformPackage.findMany({ where: { orgId } }),
    prisma.publishRecord.findMany({ where: { orgId } }),
    prisma.inquiry.findMany({ where: { orgId } }),
    prisma.commercialEvent.findMany({ where: { orgId } }),
    prisma.weeklyReport.findMany({ where: { orgId, status: "final" } }),
    prisma.periodReview.findMany({ where: { orgId, status: "final" } }),
    prisma.invoice.findMany({ where: { orgId }, include: { lines: true, payments: true } }),
    prisma.approval.findMany({ where: { orgId } }),
    prisma.comment.findMany({ where: { orgId, internal: false } }),
    prisma.asset.findMany({ where: { orgId }, select: { id: true, title: true, fileName: true, category: true, mimeType: true, sizeBytes: true, createdAt: true } }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    format: "threadline-workspace-export/1",
    note: "Files are listed under `files`; download them from the workspace library before access ends.",
    workspace: org,
    members,
    brandBrain: brain,
    ideas,
    scripts,
    content,
    packages,
    publishes,
    inquiries,
    commercialEvents: events,
    weeklyReports: reports,
    periodReviews: reviews,
    invoices,
    approvals,
    comments,
    files: assets,
  };
}

export async function startOffboarding(orgId: string, staffId: string, opts: { reason: string; exportDays?: number; retentionDays?: number; now?: Date }) {
  const now = opts.now ?? new Date();
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  if (org.kind !== "client") throw new WorkflowError("Only a client workspace can be offboarded.");
  if (org.offboardedAt) throw new WorkflowError("This workspace is already being offboarded.");
  const steps: Step[] = [];
  const log = (step: string, outcome: string) => steps.push({ step, outcome, at: new Date().toISOString() });

  const live = await prisma.engagement.findFirst({ where: { orgId, status: { in: ["active", "paused", "draft"] } } });
  if (live && live.status !== "draft") {
    await endEngagement(live.id, "ended", `Offboarding: ${opts.reason}`, now);
    log("engagement", "ended");
  } else log("engagement", live ? "draft left unactivated" : "none active");

  const cancelled = await prisma.job.updateMany({ where: { orgId, status: "queued" }, data: { status: "cancelled", lastError: "Cancelled by offboarding" } });
  log("jobs", `${cancelled.count} queued job(s) cancelled`);

  const creds = await prisma.credential.deleteMany({ where: { orgId } });
  await prisma.socialAccount.updateMany({ where: { orgId }, data: { isConnected: false } });
  await prisma.integration.updateMany({ where: { orgId }, data: { status: "disconnected" } });
  log("integrations", `${creds.count} stored credential(s) deleted; accounts disconnected`);

  const data = await buildWorkspaceExport(orgId);
  const file = new File([JSON.stringify(data, null, 2)], `${org.slug}-export.json`, { type: "application/json" });
  const stored = await getStorage().put({ orgId, file, prefix: "exports" });
  const asset = await prisma.asset.create({
    data: { orgId, category: "report", title: `Workspace export ${now.toISOString().slice(0, 10)}`, fileName: stored.fileName, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes, storagePath: stored.storagePath, storageProvider: storageProviderName(), version: 1, uploadedById: staffId },
  });
  log("export", `written (${stored.sizeBytes} bytes)`);

  const accessEndsAt = new Date(now.getTime() + (opts.exportDays ?? 30) * 86_400_000);
  const retentionUntil = new Date(accessEndsAt.getTime() + (opts.retentionDays ?? 90) * 86_400_000);
  await prisma.organization.update({ where: { id: orgId }, data: { offboardedAt: now, accessEndsAt, retentionUntil, status: "churned" } });
  log("access", `client access ends ${accessEndsAt.toISOString().slice(0, 10)}; data kept until ${retentionUntil.toISOString().slice(0, 10)}`);

  return prisma.offboardingRecord.create({
    data: { orgId, orgName: org.name, reason: opts.reason.slice(0, 1000), steps: JSON.stringify(steps), startedById: staffId, accessEndsAt, retentionUntil, exportAssetId: asset.id },
  });
}

/** Daily: end client access for workspaces whose export window has closed. */
export async function closeExpiredAccess(now = new Date()) {
  const orgs = await prisma.organization.findMany({ where: { offboardedAt: { not: null }, accessEndsAt: { lt: now } }, select: { id: true } });
  let suspended = 0;
  for (const o of orgs) {
    const r = await prisma.membership.updateMany({ where: { orgId: o.id, status: "active", role: { in: ["client_admin", "client_member", "editor"] } }, data: { status: "suspended", suspendedAt: now } });
    suspended += r.count;
  }
  return suspended;
}

/** Workspaces past retention and not on hold: listed for a person to confirm deletion. */
export async function dueForDeletion(now = new Date()) {
  return prisma.organization.findMany({ where: { offboardedAt: { not: null }, retentionUntil: { lt: now }, legalHold: false }, select: { id: true, name: true, retentionUntil: true } });
}

/**
 * Delete a tenant after its retention date, on a person's confirmation. Files
 * are removed from storage first (best effort, each failure recorded), then
 * the organisation row, whose foreign keys cascade to every tenant table.
 */
export async function deleteTenant(orgId: string, confirmSlug: string, now = new Date()) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  if (confirmSlug !== org.slug) throw new WorkflowError("Type the workspace address exactly to confirm deletion.");
  if (!org.offboardedAt || !org.retentionUntil) throw new WorkflowError("Offboard the workspace first.");
  if (org.legalHold) throw new WorkflowError("This workspace is on legal hold and cannot be deleted.");
  if (org.retentionUntil > now) throw new WorkflowError(`Data is kept until ${org.retentionUntil.toISOString().slice(0, 10)}.`);
  const assets = await prisma.asset.findMany({ where: { orgId }, select: { storagePath: true } });
  let fileFailures = 0;
  for (const a of assets) {
    if (!a.storagePath) continue;
    await getStorage().delete(a.storagePath).catch(() => fileFailures++);
  }
  const counts = {
    memberships: await prisma.membership.count({ where: { orgId } }),
    contentItems: await prisma.contentItem.count({ where: { orgId } }),
    ideas: await prisma.idea.count({ where: { orgId } }),
    assets: assets.length,
    invoices: await prisma.invoice.count({ where: { orgId } }),
    fileDeleteFailures: fileFailures,
  };
  // Invoices and payments are financial records kept for the statutory period;
  // they are not tenant-cascaded (no foreign key to the organisation).
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.offboardingRecord.update({ where: { orgId }, data: { deletedAt: now, deletionCounts: JSON.stringify(counts) } });
  return counts;
}
