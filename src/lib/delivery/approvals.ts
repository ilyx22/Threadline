import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import type { AuthContext } from "@/lib/auth/guard";

/**
 * Exact-version approvals (DEL-02, DEL-03, DEL-04).
 *
 * Every approval records WHAT was approved (a SHA-256 fingerprint of the
 * material fields, plus a readable version label), WHO approved it and on what
 * AUTHORITY, and optionally what it covers. A material edit afterwards makes
 * the fingerprint differ, so the approval is stale: it is marked superseded,
 * the item drops back to needing review, and publishing refuses it until the
 * new version is approved. When Threadline staff record a decision the
 * authority says so ("staff_on_behalf"), so client approval and internal
 * sign-off are never confused; nothing is approved automatically.
 */
export type ApprovableType = "script" | "content_item" | "platform_package" | "idea";
export type Entity = { type: ApprovableType; id: string };

const sha = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");

/** The fingerprint and label of the current version of a piece of work. */
export async function fingerprint(orgId: string, e: Entity): Promise<{ hash: string; label: string } | null> {
  if (e.type === "script") {
    const s = await prisma.script.findFirst({ where: { id: e.id, orgId }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
    const v = s?.versions[0];
    if (!s || !v) return null;
    return { hash: sha({ t: s.title, h: v.hook, b: v.body, c: v.cta, cl: v.claims }), label: `script v${v.version}` };
  }
  if (e.type === "platform_package") {
    const p = await prisma.platformPackage.findFirst({ where: { id: e.id, orgId } });
    if (!p) return null;
    return {
      hash: sha({ pl: p.platform, wt: p.workingTitle, t: p.title, c: p.caption, d: p.description, h: p.hashtags, o: p.overlays, th: p.thumbnailRef, cta: p.ctaOptions }),
      label: `${p.platform} package, edited ${p.updatedAt.toISOString().slice(0, 16).replace("T", " ")}`,
    };
  }
  if (e.type === "content_item") {
    const c = await prisma.contentItem.findFirst({ where: { id: e.id, orgId }, select: { title: true, format: true, platform: true, revisionCount: true } });
    if (!c) return null;
    const cuts = await prisma.asset.findMany({ where: { orgId, contentItemId: e.id, category: "edited_media" }, orderBy: { createdAt: "asc" }, select: { id: true } });
    return { hash: sha({ t: c.title, f: c.format, p: c.platform, cuts: cuts.map((a) => a.id) }), label: `cut ${cuts.length || 0}, revision ${c.revisionCount}` };
  }
  const i = await prisma.idea.findFirst({ where: { id: e.id, orgId } });
  if (!i) return null;
  const { updatedAt: _u, createdAt: _c, status: _s, ...rest } = i as Record<string, unknown>;
  void _u;
  void _c;
  void _s;
  return { hash: sha(rest), label: "idea" };
}

/** The authority a reviewer acts on in this workspace. */
export async function authorityOf(ctx: AuthContext): Promise<"designated_approver" | "backup_approver" | "workspace_admin" | "staff_on_behalf"> {
  if (ctx.isInternal) return "staff_on_behalf";
  const m = await prisma.membership.findUnique({ where: { userId_orgId: { userId: ctx.user.id, orgId: ctx.org.id } }, select: { contactRole: true } });
  if (ctx.profiles.includes("approver")) return m?.contactRole === "backup" ? "backup_approver" : "designated_approver";
  return "workspace_admin";
}

/**
 * Record a decision on the CURRENT version. `expectedHash`, when given, is the
 * version the reviewer was looking at; if the work changed since, the decision
 * is refused rather than applied to something they did not see.
 */
export async function recordDecision(
  ctx: AuthContext,
  e: Entity,
  decision: "approved" | "changes_requested" | "rejected",
  opts: { note?: string | null; scope?: string | null; expectedHash?: string | null; batchId?: string | null; reviewRequestedAt?: Date | null } = {},
) {
  const fp = await fingerprint(ctx.org.id, e);
  if (!fp) throw new WorkflowError("That item no longer exists.");
  if (opts.expectedHash && opts.expectedHash !== fp.hash) throw new WorkflowError("This changed after you opened it. Review the current version.");
  const authority = await authorityOf(ctx);
  return prisma.approval.create({
    data: {
      orgId: ctx.org.id,
      entityType: e.type,
      entityId: e.id,
      versionLabel: fp.label,
      contentHash: fp.hash,
      decision,
      reviewerId: ctx.user.id,
      authority,
      scope: opts.scope ?? null,
      note: opts.note?.slice(0, 2000) ?? null,
      batchId: opts.batchId ?? null,
      reviewRequestedAt: opts.reviewRequestedAt ?? null,
    },
  });
}

/** The approval covering the current version, or null. */
export async function currentApproval(orgId: string, e: Entity) {
  const fp = await fingerprint(orgId, e);
  if (!fp) return null;
  const latest = await prisma.approval.findFirst({ where: { orgId, entityType: e.type, entityId: e.id, supersededAt: null }, orderBy: { decidedAt: "desc" } });
  return latest && latest.decision === "approved" && latest.contentHash === fp.hash ? latest : null;
}

/** Mark approvals stale after a material edit. Returns how many were superseded. */
export async function supersedeApprovals(orgId: string, e: Entity, reason: string) {
  const r = await prisma.approval.updateMany({
    where: { orgId, entityType: e.type, entityId: e.id, decision: "approved", supersededAt: null },
    data: { supersededAt: new Date(), supersededReason: reason.slice(0, 300) },
  });
  return r.count;
}

/** Refuse to release anything whose current version is not approved (DEL-03). */
export async function assertReleasable(orgId: string, items: Entity[]) {
  for (const e of items) {
    if (!(await currentApproval(orgId, e))) {
      const what = e.type === "platform_package" ? "The packaging" : e.type === "content_item" ? "The finished piece" : "This item";
      throw new WorkflowError(`${what} has changed since it was approved, or has not been approved. Approve the current version first.`);
    }
  }
}
