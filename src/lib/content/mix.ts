import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * The content mix as measured (AI-04): for published pieces whose idea carries
 * a PESTO category and funnel role, how many there were and what they earned
 * (latest views, inquiries linked to them). A category with fewer than three
 * published pieces is marked as too few to judge. This informs the mix; it
 * does not set a quota.
 */
export async function contentMix(orgId: string, since: Date) {
  const items = await prisma.contentItem.findMany({
    where: { orgId, liveAt: { gte: since }, idea: { pesto: { not: null } } },
    select: { id: true, idea: { select: { pesto: true, funnelRole: true } }, publishRecords: { select: { snapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { views: true } } } }, inquiries: { select: { id: true } } },
    take: 500,
  });
  const by = new Map<string, { pieces: number; views: number; inquiries: number }>();
  const add = (key: string, views: number, inquiries: number) => {
    const row = by.get(key) ?? { pieces: 0, views: 0, inquiries: 0 };
    row.pieces++;
    row.views += views;
    row.inquiries += inquiries;
    by.set(key, row);
  };
  for (const i of items) {
    const views = i.publishRecords.reduce((a, r) => a + (r.snapshots[0]?.views ?? 0), 0);
    add(`pesto:${i.idea!.pesto}`, views, i.inquiries.length);
    if (i.idea!.funnelRole) add(`funnel:${i.idea!.funnelRole}`, views, i.inquiries.length);
  }
  return [...by.entries()].map(([key, r]) => ({ key, ...r, viewsPerPiece: Math.round(r.views / r.pieces), inquiriesPerPiece: Math.round((r.inquiries / r.pieces) * 100) / 100, tooFew: r.pieces < 3 })).sort((a, b) => b.inquiriesPerPiece - a.inquiriesPerPiece || b.viewsPerPiece - a.viewsPerPiece);
}
