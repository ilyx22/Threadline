import "server-only";
import { prisma } from "@/lib/db/client";
import { addDays, monthGrid, startOfMonth } from "@/lib/utils/dates";

/** Distribution repository: publish records, accounts, calendar, integrations. */

export type DistributionFilters = {
  status?: string[];
  platform?: string[];
  search?: string;
  from?: Date;
  to?: Date;
};

export async function listPublishRecords(orgId: string, filters: DistributionFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.platform?.length) where.platform = { in: filters.platform };
  if (filters.from || filters.to) {
    where.OR = [
      {
        scheduledFor: {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: filters.to } : {}),
        },
      },
      {
        publishedAt: {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: filters.to } : {}),
        },
      },
    ];
  }
  if (filters.search?.trim()) {
    where.contentItem = { title: { contains: filters.search.trim() } };
  }

  return prisma.publishRecord.findMany({
    where,
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    include: {
      contentItem: { select: { id: true, title: true, stage: true, format: true } },
      account: { select: { id: true, handle: true, platform: true, isConnected: true } },
      package: { select: { id: true, title: true, caption: true, status: true } },
      snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });
}

export type PublishRecordItem = Awaited<ReturnType<typeof listPublishRecords>>[number];

export async function getPublishRecord(orgId: string, id: string) {
  return prisma.publishRecord.findFirst({
    where: { id, orgId },
    include: {
      contentItem: {
        select: {
          id: true,
          title: true,
          stage: true,
          script: {
            select: { versions: { orderBy: { version: "desc" }, take: 1, select: { hook: true } } },
          },
        },
      },
      package: true,
      account: true,
      snapshots: { orderBy: { capturedAt: "desc" } },
      inquiries: true,
    },
  });
}

/** Calendar grid for a month, with publish records bucketed by day. */
export async function distributionCalendar(orgId: string, month: Date) {
  const cells = monthGrid(month);
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;

  const records = await prisma.publishRecord.findMany({
    where: {
      orgId,
      OR: [
        { scheduledFor: { gte: first, lte: addDays(last, 1) } },
        { publishedAt: { gte: first, lte: addDays(last, 1) } },
      ],
    },
    include: {
      contentItem: { select: { id: true, title: true } },
    },
    orderBy: { scheduledFor: "asc" },
  });

  const byDay = new Map<string, typeof records>();
  for (const record of records) {
    const date = record.publishedAt ?? record.scheduledFor;
    if (!date) continue;
    const key = dayKey(date);
    const list = byDay.get(key) ?? [];
    list.push(record);
    byDay.set(key, list);
  }

  const monthStart = startOfMonth(month);
  return {
    cells: cells.map((date) => ({
      date,
      key: dayKey(date),
      inMonth: date.getMonth() === monthStart.getMonth(),
      records: byDay.get(dayKey(date)) ?? [],
    })),
    total: records.length,
  };
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export async function listSocialAccounts(orgId: string) {
  return prisma.socialAccount.findMany({
    where: { orgId },
    orderBy: [{ platform: "asc" }, { handle: "asc" }],
    include: {
      integration: { select: { provider: true, status: true } },
      _count: { select: { publishRecords: true } },
    },
  });
}

export async function listIntegrations(orgId: string) {
  return prisma.integration.findMany({ where: { orgId }, orderBy: { provider: "asc" } });
}

export async function getIntegration(orgId: string, provider: string) {
  return prisma.integration.findUnique({ where: { orgId_provider: { orgId, provider } } });
}

export async function distributionCounts(orgId: string) {
  const rows = await prisma.publishRecord.groupBy({
    by: ["status"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

/** Approved content that has no publish record yet — the scheduling queue. */
export async function schedulingQueue(orgId: string) {
  return prisma.contentItem.findMany({
    where: { orgId, stage: "approved", publishRecords: { none: {} } },
    orderBy: { approvedAt: "asc" },
    include: { packages: { select: { id: true, platform: true } } },
  });
}
