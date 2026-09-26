import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * Proof placements (PRF-01). A placement may only rest on a permission that is
 * granted and unexpired; withdrawing or expiring a permission flags every live
 * placement that relies on it, so a person takes it down.
 */
export const PROOF_PERMISSIONS = ["allowInterview", "allowInternalUse", "allowTestimonial", "allowPublicTestimonial", "allowNamedCaseStudy", "allowAnonCaseStudy", "allowPublishMetrics", "allowLogo"] as const;
export type ProofPermissionKey = (typeof PROOF_PERMISSIONS)[number];

export async function recordPlacement(orgId: string, input: { permission: ProofPermissionKey; content: string; location: string; evidence?: string | null; placedById: string }, now = new Date()) {
  const p = await prisma.proofPermission.findUnique({ where: { orgId } });
  const granted = Boolean(p && (p as Record<string, unknown>)[input.permission] === true);
  if (!granted) throw new Error("That use has not been permitted by the client.");
  if (p?.expiresAt && p.expiresAt < now) throw new Error("The client's permission has expired.");
  return prisma.proofPlacement.create({ data: { orgId, permission: input.permission, content: input.content.slice(0, 2000), location: input.location.slice(0, 500), evidence: input.evidence ?? null, placedById: input.placedById } });
}

/** Flag live placements whose permission is no longer granted or has expired. */
export async function flagWithdrawnPlacements(orgId?: string, now = new Date()) {
  const live = await prisma.proofPlacement.findMany({ where: { removedAt: null, flaggedAt: null, ...(orgId ? { orgId } : {}) } });
  let flagged = 0;
  for (const pl of live) {
    const p = await prisma.proofPermission.findUnique({ where: { orgId: pl.orgId } });
    const granted = Boolean(p && (p as Record<string, unknown>)[pl.permission] === true);
    const expired = Boolean(p?.expiresAt && p.expiresAt < now);
    if (!granted || expired) {
      await prisma.proofPlacement.update({ where: { id: pl.id }, data: { flaggedAt: now, flagReason: expired ? "Permission expired" : "Permission withdrawn by the client" } });
      flagged++;
    }
  }
  return flagged;
}
