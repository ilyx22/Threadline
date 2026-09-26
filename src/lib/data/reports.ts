import { clientScope, seesOperatorSurface } from "@/lib/domain/visibility";
import type { Role } from "@/lib/domain/enums";
import "server-only";
import { prisma } from "@/lib/db/client";
import { parseWith } from "@/lib/db/json";
import { weeklyReportPayloadSchema, type WeeklyReportPayload } from "@/lib/reports/weekly";
import { EMPTY_LEARNING } from "@/lib/reports/learning-sections";

const EMPTY_PAYLOAD = {
  periodLabel: "",
  shipped: { count: 0, target: 0, byPlatform: [], titles: [] },
  performance: {
    views: 0,
    impressions: 0,
    engagements: 0,
    avgRetention: 0,
    avgEngagementRate: 0,
    viewsDelta: null,
    publishedDelta: null,
  },
  wins: [],
  misses: [],
  learnings: [],
  nextWeek: { tests: [], priorities: [], recordingPlan: [], recordingMinutes: 0 },
  clientActions: [],
  operating: {
    founderHours: 0,
    hoursSaved: 0,
    cycleTimeHours: 0,
    approvalHours: 0,
    piecesShipped: 0,
    bottleneck: null,
  },
  commercial: {
    inquiries: 0,
    qualified: 0,
    callsBooked: 0,
    won: 0,
    valueMinor: 0,
    attributedToContent: 0,
  },
  attribution: {
    trackedClicks: 0,
    claims: [],
    monetaryAllowed: false,
    dataQualityNote: "No measurement recorded for this period.",
  },
  learning: EMPTY_LEARNING,
  generatedAt: new Date(0).toISOString(),
  isDemoNarrative: false,
} satisfies WeeklyReportPayload;

/**
 * Reports a caller may read. Clients see only final versions, and only the
 * latest final one per period (REP-01); staff see every version.
 */
export async function listReports(orgId: string, role: Role) {
  const client = !seesOperatorSurface(role);
  const reports = await prisma.weeklyReport.findMany({
    where: { orgId, ...clientScope.reports(role), ...(client ? { supersededAt: null } : {}) },
    orderBy: [{ periodStart: "desc" }, { version: "desc" }],
    include: { generatedBy: { select: { name: true } } },
  });

  return reports.map((r) => ({
    ...r,
    payload: parseWith(r.payload, weeklyReportPayloadSchema, EMPTY_PAYLOAD),
  }));
}

export type ReportListItem = Awaited<ReturnType<typeof listReports>>[number];

export async function getReport(orgId: string, id: string, role: Role) {
  const report = await prisma.weeklyReport.findFirst({
    where: { id, orgId, ...clientScope.reports(role) },
    include: {
      generatedBy: { select: { name: true } },
      org: { select: { name: true, currency: true } },
    },
  });
  if (!report) return null;
  return { ...report, payload: parseWith(report.payload, weeklyReportPayloadSchema, EMPTY_PAYLOAD) };
}

export type ReportDetail = NonNullable<Awaited<ReturnType<typeof getReport>>>;

export async function latestReport(orgId: string, role?: Role) {
  const report = await prisma.weeklyReport.findFirst({
    where: { orgId, ...(role ? clientScope.reports(role) : {}), supersededAt: null },
    orderBy: [{ periodStart: "desc" }, { version: "desc" }],
  });
  if (!report) return null;
  return { ...report, payload: parseWith(report.payload, weeklyReportPayloadSchema, EMPTY_PAYLOAD) };
}
