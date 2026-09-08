import "server-only";
import { prisma } from "@/lib/db/client";
import { INQUIRY_STAGES } from "@/lib/domain/enums";
import { sum } from "@/lib/domain/scoring";
import type { PeriodRange } from "./metrics";

/**
 * Pipeline repository.
 *
 * Deliberately lightweight — this is commercial attribution, not a CRM. It
 * exists to answer one question: what content is creating qualified conversations?
 */

export type PipelineFilters = {
  stage?: string[];
  source?: string[];
  search?: string;
  range?: PeriodRange;
};

export async function listInquiries(orgId: string, filters: PipelineFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.stage?.length) where.stage = { in: filters.stage };
  if (filters.source?.length) where.source = { in: filters.source };
  if (filters.range) {
    where.occurredAt = { gte: filters.range.start, lte: filters.range.end };
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [{ name: { contains: q } }, { company: { contains: q } }, { email: { contains: q } }];
  }

  return prisma.inquiry.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    include: {
      contentItem: { select: { id: true, title: true, platform: true } },
      publishRecord: { select: { id: true, url: true, platform: true } },
    },
  });
}

export type InquiryItem = Awaited<ReturnType<typeof listInquiries>>[number];

export async function inquiryBoard(orgId: string, filters: PipelineFilters = {}) {
  const items = await listInquiries(orgId, filters);
  return INQUIRY_STAGES.map((stage) => ({
    stage,
    items: items.filter((i) => i.stage === stage),
    value: sum(items.filter((i) => i.stage === stage).map((i) => i.valueMinor)),
  }));
}

/**
 * Content ranked by the commercial conversation it produced.
 * This is the view that justifies the whole pipeline layer.
 */
export async function contentAttribution(orgId: string, range?: PeriodRange) {
  const inquiries = await prisma.inquiry.findMany({
    where: {
      orgId,
      contentItemId: { not: null },
      ...(range ? { occurredAt: { gte: range.start, lte: range.end } } : {}),
    },
    include: {
      contentItem: {
        select: {
          id: true,
          title: true,
          platform: true,
          idea: { select: { pillar: true, cta: true } },
          publishRecords: {
            where: { status: "published" },
            select: { url: true, snapshots: { orderBy: { capturedAt: "desc" }, take: 1 } },
          },
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      contentItemId: string;
      title: string;
      platform: string;
      pillar: string | null;
      cta: string | null;
      url: string | null;
      views: number;
      inquiries: number;
      qualified: number;
      calls: number;
      won: number;
      valueMinor: number;
    }
  >();

  for (const inquiry of inquiries) {
    const content = inquiry.contentItem;
    if (!content) continue;

    const existing = grouped.get(content.id) ?? {
      contentItemId: content.id,
      title: content.title,
      platform: content.platform,
      pillar: content.idea?.pillar ?? null,
      cta: content.idea?.cta ?? null,
      url: content.publishRecords[0]?.url ?? null,
      views: content.publishRecords[0]?.snapshots[0]?.views ?? 0,
      inquiries: 0,
      qualified: 0,
      calls: 0,
      won: 0,
      valueMinor: 0,
    };

    existing.inquiries += 1;
    if (["qualified", "call_booked", "won"].includes(inquiry.stage)) existing.qualified += 1;
    if (["call_booked", "won"].includes(inquiry.stage)) existing.calls += 1;
    if (inquiry.stage === "won") {
      existing.won += 1;
      existing.valueMinor += inquiry.valueMinor;
    }

    grouped.set(content.id, existing);
  }

  return [...grouped.values()].sort((a, b) => {
    if (b.calls !== a.calls) return b.calls - a.calls;
    return b.qualified - a.qualified;
  });
}

/** Which CTAs actually convert, computed from linked inquiries. */
export async function ctaPerformance(orgId: string) {
  const inquiries = await prisma.inquiry.findMany({
    where: { orgId, cta: { not: null } },
    select: { cta: true, stage: true, valueMinor: true },
  });

  const grouped = new Map<string, { cta: string; count: number; calls: number; valueMinor: number }>();
  for (const inquiry of inquiries) {
    const key = inquiry.cta as string;
    const existing = grouped.get(key) ?? { cta: key, count: 0, calls: 0, valueMinor: 0 };
    existing.count += 1;
    if (["call_booked", "won"].includes(inquiry.stage)) existing.calls += 1;
    if (inquiry.stage === "won") existing.valueMinor += inquiry.valueMinor;
    grouped.set(key, existing);
  }

  return [...grouped.values()].sort((a, b) => b.calls - a.calls);
}

export async function inquiryCounts(orgId: string) {
  const rows = await prisma.inquiry.groupBy({
    by: ["stage"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.stage] = row._count._all;
  return counts;
}

/** Content items available to attribute an inquiry to. */
export async function attributableContent(orgId: string) {
  return prisma.contentItem.findMany({
    where: { orgId, stage: "live" },
    orderBy: { liveAt: "desc" },
    select: { id: true, title: true, platform: true, liveAt: true },
    take: 100,
  });
}
