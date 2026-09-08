import "server-only";
import { prisma } from "@/lib/db/client";
import { checklistStatus, prospectState } from "@/lib/domain/sop";
import { ATTRIBUTION_STRENGTH, type AttributionClass } from "@/lib/domain/enums";
import { addDays, endOfDay, startOfDay } from "@/lib/utils/dates";
import { acquisitionPlan, invariantBreaches, type AcquisitionPlan } from "./acquisition";
import { operatorQueue } from "./admin";

/**
 * The operating cockpit.
 *
 * One question: what matters now. Everything on this surface is a queue of work
 * that can be acted on, ordered by commercial urgency rather than by module —
 * replies and follow-ups first because they can still become a booking today,
 * then the calls that are actually happening, then the new activity the target
 * requires, then the deeper work, then delivery.
 *
 * There are no vanity metrics here on purpose. A number that cannot change what
 * the operator does next is decoration, and decoration on this page costs
 * attention that the queues need.
 */

export type QueueItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  /** Lower sorts first. */
  rank: number;
  dueAt: Date | null;
  overdue: boolean;
  tone: "accent" | "warning" | "negative" | "info" | "neutral";
};

export type Cockpit = {
  plan: AcquisitionPlan;
  /** The single ordered list. This is the page's spine. */
  actions: QueueItem[];
  groups: {
    key: string;
    label: string;
    /** Why this group is where it is in the order. */
    reason: string;
    items: QueueItem[];
  }[];
  callsToday: {
    id: string;
    prospectId: string;
    company: string;
    scheduledAt: Date;
    prepared: boolean;
  }[];
  delivery: {
    total: number;
    overdueApprovals: number;
    blockedProduction: number;
    reportsDue: number;
    issues: number;
  };
  results: ResultsAlert[];
  breaches: Awaited<ReturnType<typeof invariantBreaches>>;
  wedge: {
    id: string;
    label: string;
    state: string;
    conversations: number;
    frozen: boolean;
  } | null;
};

export type ResultsAlert = {
  orgId: string;
  slug: string;
  name: string;
  message: string;
  severity: "warning" | "info";
};

const TODAY_TONE: Record<string, QueueItem["tone"]> = {
  replies: "warning",
  followups: "warning",
  calls: "accent",
  prep: "accent",
  proposals: "warning",
  outreach: "info",
  research: "info",
  qualify: "neutral",
};

export async function cockpit(): Promise<Cockpit> {
  const now = new Date();
  const todayEnd = endOfDay(now);

  const [plan, prospects, calls, queue, breaches, wedge, results] = await Promise.all([
    acquisitionPlan(),
    prisma.prospect.findMany({
      where: { state: { notIn: ["won", "lost", "not_fit"] } },
      include: { checks: true },
      orderBy: { nextActionDueAt: "asc" },
      take: 300,
    }),
    prisma.salesCall.findMany({
      where: {
        scheduledAt: { gte: startOfDay(now), lte: todayEnd },
        completedAt: null,
      },
      include: { prospect: { select: { id: true, company: true, state: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    operatorQueue(),
    invariantBreaches(),
    prisma.marketWedge.findFirst({
      where: { active: true },
      include: { _count: { select: { conversations: true } } },
    }),
    resultsAlerts(),
  ]);

  const item = (
    p: (typeof prospects)[number],
    group: string,
    detail: string,
    rank: number,
  ): QueueItem => ({
    id: `${group}:${p.id}`,
    href: `/admin/prospects/${p.id}`,
    title: p.company,
    detail,
    rank,
    dueAt: p.nextActionDueAt,
    overdue: Boolean(p.nextActionDueAt && p.nextActionDueAt < now),
    tone: TODAY_TONE[group] ?? "neutral",
  });

  const due = (p: (typeof prospects)[number]) =>
    Boolean(p.nextActionDueAt && p.nextActionDueAt <= todayEnd);

  // Group 1 — replies. A reply is a conversion stage that decays fastest.
  const replies = prospects
    .filter((p) => p.state === "replied")
    .map((p) => item(p, "replies", p.nextAction ?? "Classify the reply", 10));

  // Group 2 — anything dated for today or earlier that is still alive.
  const followups = prospects
    .filter((p) => due(p) && !["replied", "booked", "call_ready", "proposal"].includes(p.state))
    .map((p) => item(p, "followups", p.nextAction ?? "No next action recorded", 20));

  // Group 3 — preparation for calls that are actually happening.
  const prep = prospects
    .filter((p) => p.state === "booked")
    .map((p) => {
      const status = checklistStatus(
        prospectState(p.state),
        p.checks.filter((c) => c.state === p.state).map((c) => ({ key: c.key, done: c.done, note: c.note })),
      );
      return {
        ...item(
          p,
          "prep",
          status.complete
            ? "Prepared — mark call ready"
            : `Preparation ${status.progress}% — ${status.outstanding.length} outstanding`,
          status.complete ? 40 : 30,
        ),
      };
    });

  // Group 4 — proposals waiting on a decision.
  const proposals = prospects
    .filter((p) => p.state === "proposal")
    .map((p) => item(p, "proposals", p.nextAction ?? "Chase the decision", 45));

  // Group 5 — A-tier work: research and the pre-completed value asset.
  const research = prospects
    .filter((p) => p.state === "qualified_a")
    .map((p) => {
      const status = checklistStatus(
        prospectState(p.state),
        p.checks.filter((c) => c.state === p.state).map((c) => ({ key: c.key, done: c.done, note: c.note })),
      );
      return item(p, "research", `A-tier research ${status.progress}%`, 60);
    });

  // Group 6 — B-tier ready to be contacted.
  const outreach = prospects
    .filter((p) => p.state === "qualified_b")
    .map((p) => item(p, "outreach", p.nextAction ?? "Research and send the first touch", 70));

  // Group 7 — sourced but unqualified.
  const qualify = prospects
    .filter((p) => p.state === "new")
    .map((p) => item(p, "qualify", "Qualify or reject", 80));

  const groups = [
    {
      key: "replies",
      label: "Replies to handle",
      reason: "A reply can still become a booking today. Nothing else on this page can.",
      items: replies,
    },
    {
      key: "followups",
      label: "Due and overdue",
      reason: "Dated commitments, including the ones that have already slipped.",
      items: followups,
    },
    {
      key: "prep",
      label: "Call preparation",
      reason: "An unprepared diagnosis call becomes a pitch.",
      items: prep,
    },
    {
      key: "proposals",
      label: "Decisions outstanding",
      reason: "Proposals die of silence more often than of rejection.",
      items: proposals,
    },
    {
      key: "research",
      label: "A-tier work",
      reason: "Work done before attention is asked for. This is where competence is demonstrated.",
      items: research,
    },
    {
      key: "outreach",
      label: "Ready for a first touch",
      reason: "Researched enough to be specific. This is the quota.",
      items: outreach,
    },
    {
      key: "qualify",
      label: "Awaiting qualification",
      reason: "Sourced, unqualified. Contacting them to hit a number is how a list stops converting.",
      items: qualify,
    },
  ].filter((g) => g.items.length > 0);

  const actions = groups
    .flatMap((g) => g.items)
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity);
    });

  return {
    plan,
    actions,
    groups,
    callsToday: calls.map((c) => ({
      id: c.id,
      prospectId: c.prospect.id,
      company: c.prospect.company,
      scheduledAt: c.scheduledAt,
      prepared: c.prospect.state === "call_ready",
    })),
    delivery: {
      total: queue.total,
      overdueApprovals: queue.overdueApprovals.length,
      blockedProduction: queue.blockedProduction.length,
      reportsDue: queue.reportsDue.length,
      issues: queue.issues.length,
    },
    results,
    breaches,
    wedge: wedge
      ? {
          id: wedge.id,
          label: wedge.label,
          state: wedge.state,
          conversations: wedge._count.conversations,
          frozen: Boolean(wedge.frozenAt),
        }
      : null,
  };
}

/**
 * Whether each client's measurement is actually capable of proving anything.
 *
 * This is the Results lane's first job, and it runs before any number is
 * interpreted. A client publishing without a baseline, or with commercial
 * signals nobody could trace, will produce a monthly report full of figures
 * that cannot support a claim — and the honest time to notice that is now,
 * not at the review.
 *
 * Deliberately narrow. This checks whether the measurement exists; it does not
 * become an analytics platform.
 */
export async function resultsAlerts(): Promise<ResultsAlert[]> {
  const orgs = await prisma.organization.findMany({
    where: { kind: "client", status: "active" },
    select: {
      id: true,
      slug: true,
      name: true,
      proofPeriods: { where: { kind: "baseline" }, select: { id: true }, take: 1 },
      publishRecords: {
        where: { status: "published" },
        select: { id: true, url: true },
        take: 100,
      },
      inquiries: {
        where: { occurredAt: { gte: addDays(new Date(), -60) } },
        select: { attribution: true },
      },
    },
  });

  const alerts: ResultsAlert[] = [];

  for (const org of orgs) {
    const published = org.publishRecords.length;

    if (published > 0 && org.proofPeriods.length === 0) {
      alerts.push({
        orgId: org.id,
        slug: org.slug,
        name: org.name,
        severity: "warning",
        message: `${published} pieces are live with no Day-0 baseline recorded. Without it there is nothing to compare against, and the comparison cannot be reconstructed later.`,
      });
    }

    const missingUrls = org.publishRecords.filter((r) => !r.url).length;
    if (missingUrls > 0) {
      alerts.push({
        orgId: org.id,
        slug: org.slug,
        name: org.name,
        severity: "info",
        message: `${missingUrls} published ${missingUrls === 1 ? "asset has" : "assets have"} no live URL, so performance cannot be traced back to them.`,
      });
    }

    if (org.inquiries.length >= 3) {
      const weak = org.inquiries.filter(
        (i) => (ATTRIBUTION_STRENGTH[i.attribution as AttributionClass] ?? 0) <= 1,
      ).length;
      if (weak === org.inquiries.length) {
        alerts.push({
          orgId: org.id,
          slug: org.slug,
          name: org.name,
          severity: "info",
          message: `All ${org.inquiries.length} recent commercial signals are correlation only. Monetary efficiency should stay hidden for this client until something is traceable.`,
        });
      }
    }
  }

  return alerts;
}
