import "server-only";
import { prisma } from "@/lib/db/client";
import {
  attribute,
  attributionCoverage,
  outcomeLanguage,
  per10k,
  rollUp,
  type AssetCredit,
  type CommercialOutcome,
  type Coverage,
  type Touch,
} from "@/lib/domain/attribution";
import {
  ATTRIBUTION_STRENGTH,
  COMMERCIAL_FUNNEL,
  type AttributionClass,
  type AttributionModel,
  type CommercialEventKind,
} from "@/lib/domain/enums";
import { publishedAssets, type PeriodRange } from "./metrics";

/**
 * Attribution reads.
 *
 * Everything here is derived at read time from touchpoints and commercial
 * events. Nothing is precomputed and nothing is cached into a column — the same
 * reasoning as the acquisition funnel (ADR-012): a stored roll-up disagrees
 * with its inputs the moment somebody corrects a record.
 *
 * Every function takes an `orgId` that must originate from an AuthContext.
 */

/* -------------------------------- Journeys ---------------------------------- */

export type JourneyStep =
  | {
      type: "touch";
      id: string;
      occurredAt: Date;
      kind: string;
      platform: string | null;
      campaign: string | null;
      referrerHost: string | null;
      source: string;
      contentItemId: string | null;
      contentTitle: string | null;
      note: string | null;
    }
  | {
      type: "event";
      id: string;
      occurredAt: Date;
      kind: CommercialEventKind;
      valueMinor: number;
      currency: string;
      source: string;
      evidence: AttributionClass;
      evidenceBasis: string;
      note: string | null;
      recordedBy: string | null;
      externalRecordUrl: string | null;
    };

export type Journey = {
  visitorId: string | null;
  inquiryId: string | null;
  personLabel: string;
  steps: JourneyStep[];
  /** What each model says about the most valuable outcome in the journey. */
  models: {
    model: AttributionModel;
    contentItemId: string | null;
    title: string | null;
    reason: string | null;
  }[];
  /** Carried from the outcome, never computed. */
  evidence: AttributionClass | null;
  valueMinor: number;
};

/**
 * The buyer journey behind one lead.
 *
 * Ordered strictly by time and deliberately shows both what is known and where
 * the record is thin: a timeline that renders only the complete journeys would
 * make the data look far better than it is.
 */
export async function journeyForInquiry(orgId: string, inquiryId: string): Promise<Journey | null> {
  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, orgId },
    select: { id: true, name: true, company: true, visitorId: true, valueMinor: true },
  });
  if (!inquiry) return null;

  const [touchpoints, events] = await Promise.all([
    prisma.touchpoint.findMany({
      where: {
        orgId,
        ...(inquiry.visitorId ? { visitorId: inquiry.visitorId } : { id: "__none__" }),
      },
      include: { contentItem: { select: { id: true, title: true } } },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.commercialEvent.findMany({
      where: { orgId, OR: [{ inquiryId }, ...(inquiry.visitorId ? [{ visitorId: inquiry.visitorId }] : [])] },
      include: { recordedBy: { select: { name: true } } },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  const steps: JourneyStep[] = [
    ...touchpoints.map((t) => ({
      type: "touch" as const,
      id: t.id,
      occurredAt: t.occurredAt,
      kind: t.kind,
      platform: t.platform,
      campaign: t.campaign,
      referrerHost: t.referrerHost,
      source: t.source,
      contentItemId: t.contentItemId,
      contentTitle: t.contentItem?.title ?? null,
      note: t.note,
    })),
    ...events.map((e) => ({
      type: "event" as const,
      id: e.id,
      occurredAt: e.occurredAt,
      kind: e.kind as CommercialEventKind,
      valueMinor: e.valueMinor,
      currency: e.currency,
      source: e.source,
      evidence: e.attribution as AttributionClass,
      evidenceBasis: e.evidenceBasis,
      note: e.note,
      recordedBy: e.recordedBy?.name ?? null,
      externalRecordUrl: e.externalRecordUrl,
    })),
  ].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  // The outcome worth attributing is the most valuable one; where nothing has a
  // value, the furthest down the funnel.
  const best = [...events].sort(
    (a, b) =>
      b.valueMinor - a.valueMinor ||
      COMMERCIAL_FUNNEL.indexOf(b.kind as CommercialEventKind) -
        COMMERCIAL_FUNNEL.indexOf(a.kind as CommercialEventKind),
  )[0];

  const touches: Touch[] = touchpoints.map((t) => ({
    id: t.id,
    contentItemId: t.contentItemId,
    occurredAt: t.occurredAt,
  }));

  const titles = new Map(touchpoints.filter((t) => t.contentItem).map((t) => [t.contentItem!.id, t.contentItem!.title]));

  const models = best
    ? (["first_touch", "last_touch", "linear"] as AttributionModel[]).map((model) => {
        const result = attribute(model, touches, {
          id: best.id,
          kind: best.kind as CommercialEventKind,
          occurredAt: best.occurredAt,
          valueMinor: best.valueMinor,
          evidence: best.attribution as AttributionClass,
        });
        const top = result.credits[0] ?? null;
        return {
          model,
          contentItemId: top?.contentItemId ?? null,
          title: top ? (titles.get(top.contentItemId) ?? null) : null,
          reason: result.reason,
        };
      })
    : [];

  return {
    visitorId: inquiry.visitorId,
    inquiryId: inquiry.id,
    personLabel: [inquiry.name, inquiry.company].filter(Boolean).join(" · "),
    steps,
    models,
    evidence: best ? (best.attribution as AttributionClass) : null,
    valueMinor: best?.valueMinor ?? inquiry.valueMinor,
  };
}

/** Recent journeys, most valuable first. Operator surface. */
export async function recentJourneys(orgId: string, limit = 12) {
  const inquiries = await prisma.inquiry.findMany({
    where: { orgId },
    orderBy: [{ valueMinor: "desc" }, { occurredAt: "desc" }],
    take: limit,
    select: { id: true },
  });

  const journeys = await Promise.all(inquiries.map((i) => journeyForInquiry(orgId, i.id)));
  return journeys.filter((j): j is Journey => Boolean(j));
}

/* ------------------------------ Asset roll-up ------------------------------- */

export type AttributedAsset = AssetCredit & {
  title: string;
  platform: string;
  pillar: string | null;
  cta: string | null;
  hook: string | null;
  views: number;
  touches: number;
};

export type AssetAttribution = {
  model: AttributionModel;
  assets: AttributedAsset[];
  coverage: Coverage;
  /** Outcomes considered, so a reader can see the denominator. */
  outcomes: number;
};

/**
 * Credit per asset across a period.
 *
 * The coverage gate rides along with the result rather than being applied by
 * the caller — a caller that forgets it would render money-per-asset from four
 * correlations and one traceable deal, which is arithmetically true and
 * completely misleading.
 */
export async function assetAttribution(
  orgId: string,
  range: PeriodRange,
  model: AttributionModel = "linear",
): Promise<AssetAttribution> {
  const events = dedupeByDeal(
    await prisma.commercialEvent.findMany({
      where: { orgId, occurredAt: { gte: range.start, lte: range.end }, valueMinor: { gt: 0 } },
      select: {
        id: true,
        kind: true,
        occurredAt: true,
        valueMinor: true,
        attribution: true,
        visitorId: true,
        inquiryId: true,
      },
    }),
  );

  const visitorIds = [...new Set(events.map((e) => e.visitorId).filter((v): v is string => Boolean(v)))];

  const touchpoints = visitorIds.length
    ? await prisma.touchpoint.findMany({
        where: { orgId, visitorId: { in: visitorIds } },
        select: { id: true, visitorId: true, contentItemId: true, occurredAt: true },
      })
    : [];

  const byVisitor = new Map<string, Touch[]>();
  for (const t of touchpoints) {
    if (!t.visitorId) continue;
    const list = byVisitor.get(t.visitorId) ?? [];
    list.push({ id: t.id, contentItemId: t.contentItemId, occurredAt: t.occurredAt });
    byVisitor.set(t.visitorId, list);
  }

  const journeys = events.map((event) => ({
    touches: event.visitorId ? (byVisitor.get(event.visitorId) ?? []) : [],
    outcome: {
      id: event.id,
      kind: event.kind as CommercialEventKind,
      occurredAt: event.occurredAt,
      valueMinor: event.valueMinor,
      evidence: event.attribution as AttributionClass,
    } satisfies CommercialOutcome,
  }));

  const credits = rollUp(model, journeys);

  // Attach the strategy metadata the credit is only useful with.
  const items = credits.length
    ? await prisma.contentItem.findMany({
        where: { orgId, id: { in: credits.map((c) => c.contentItemId) } },
        select: {
          id: true,
          title: true,
          platform: true,
          selectedHook: true,
          idea: { select: { pillar: true, cta: true } },
        },
      })
    : [];

  const meta = new Map(items.map((i) => [i.id, i]));
  const assets = await publishedAssets(orgId, range);
  const viewsById = new Map<string, number>();
  for (const asset of assets) {
    viewsById.set(asset.contentItemId, (viewsById.get(asset.contentItemId) ?? 0) + asset.views);
  }

  const touchCounts = new Map<string, number>();
  for (const t of touchpoints) {
    if (!t.contentItemId) continue;
    touchCounts.set(t.contentItemId, (touchCounts.get(t.contentItemId) ?? 0) + 1);
  }

  return {
    model,
    outcomes: events.length,
    coverage: attributionCoverage(
      events.map((e) => ({ evidence: e.attribution as AttributionClass })),
    ),
    assets: credits.map((credit) => {
      const item = meta.get(credit.contentItemId);
      return {
        ...credit,
        title: item?.title ?? "Content no longer in the workspace",
        platform: item?.platform ?? "unknown",
        pillar: item?.idea?.pillar ?? null,
        cta: item?.idea?.cta ?? null,
        hook: item?.selectedHook ?? null,
        views: viewsById.get(credit.contentItemId) ?? 0,
        touches: touchCounts.get(credit.contentItemId) ?? 0,
      };
    }),
  };
}

/**
 * One deal, one credited outcome.
 *
 * A deal that becomes an opportunity and then closes produces two valued
 * events, and crediting both would count the same money twice — once as
 * pipeline and once as revenue. Those are different things and adding them
 * together produces a figure that describes neither.
 *
 * The furthest-down-funnel event wins, because it is the most recent statement
 * of what actually happened. Events with no lead attached are left alone: there
 * is nothing to say they belong to the same deal, and guessing would be worse
 * than the double count it was trying to avoid.
 */
function dedupeByDeal<
  T extends { kind: string; inquiryId: string | null; occurredAt: Date },
>(events: T[]): T[] {
  const byDeal = new Map<string, T>();
  const unattached: T[] = [];

  for (const event of events) {
    if (!event.inquiryId) {
      unattached.push(event);
      continue;
    }
    const existing = byDeal.get(event.inquiryId);
    if (
      !existing ||
      COMMERCIAL_FUNNEL.indexOf(event.kind as CommercialEventKind) >
        COMMERCIAL_FUNNEL.indexOf(existing.kind as CommercialEventKind)
    ) {
      byDeal.set(event.inquiryId, event);
    }
  }

  return [...byDeal.values(), ...unattached];
}

/* ------------------------------- Dimensions --------------------------------- */

export type DimensionRow = {
  key: string;
  label: string;
  assets: number;
  events: number;
  valueMinor: number;
  views: number;
  /** Commercial events per 10,000 views. Null below a readable amount of reach. */
  eventsPer10k: number | null;
};

/**
 * Attribution grouped by a strategy dimension.
 *
 * Assets missing the dimension are grouped under an explicit "not recorded"
 * row rather than dropped. A pillar breakdown that silently omits half the
 * output looks like a complete picture and is not one.
 */
export function byDimension(
  assets: AttributedAsset[],
  pick: (a: AttributedAsset) => string | null,
  label = "Not recorded",
): DimensionRow[] {
  const groups = new Map<string, DimensionRow>();

  for (const asset of assets) {
    const key = pick(asset) ?? "__missing__";
    const row = groups.get(key) ?? {
      key,
      label: key === "__missing__" ? label : key,
      assets: 0,
      events: 0,
      valueMinor: 0,
      views: 0,
      eventsPer10k: null,
    };
    row.assets += 1;
    row.events += asset.events;
    row.valueMinor += asset.valueMinor;
    row.views += asset.views;
    groups.set(key, row);
  }

  return [...groups.values()]
    .map((row) => ({ ...row, eventsPer10k: per10k(row.events, row.views) }))
    .sort((a, b) => b.valueMinor - a.valueMinor || b.events - a.events);
}

/* --------------------------------- Funnel ----------------------------------- */

export type FunnelStageRow = {
  kind: CommercialEventKind;
  count: number;
  valueMinor: number;
};

/**
 * The content-to-commercial funnel.
 *
 * Only stages with data are returned. Rendering an empty stage implies the
 * absence of an event was observed, when usually it just was not recorded —
 * and a funnel of zeroes reads as failure rather than as a measurement gap.
 */
export async function commercialFunnel(
  orgId: string,
  range: PeriodRange,
): Promise<{ stages: FunnelStageRow[]; clicks: number; complete: boolean }> {
  const [events, clicks] = await Promise.all([
    prisma.commercialEvent.groupBy({
      by: ["kind"],
      where: { orgId, occurredAt: { gte: range.start, lte: range.end } },
      _count: { _all: true },
      _sum: { valueMinor: true },
    }),
    prisma.touchpoint.count({
      where: { orgId, kind: "click", occurredAt: { gte: range.start, lte: range.end } },
    }),
  ]);

  const byKind = new Map(events.map((e) => [e.kind, e]));

  const stages = COMMERCIAL_FUNNEL.filter((kind) => byKind.has(kind)).map((kind) => ({
    kind,
    count: byKind.get(kind)?._count._all ?? 0,
    valueMinor: byKind.get(kind)?._sum.valueMinor ?? 0,
  }));

  return {
    stages,
    clicks,
    // "Complete" means every stage has at least one recorded event, which is
    // the only condition under which stage-to-stage rates mean anything.
    complete: stages.length === COMMERCIAL_FUNNEL.length,
  };
}

/* ----------------------------- Tracking health ------------------------------ */

export type HealthCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

/**
 * Whether this client's measurement can support a claim at all.
 *
 * Runs before anybody interprets a number. The distinction it protects is
 * between **good data** and **a good result**: a client with no tracked links
 * has no commercial signal because nothing was measured, not because the
 * content failed, and reporting the two the same way is how a working
 * engagement gets cancelled.
 */
export async function trackingHealth(orgId: string): Promise<{
  checks: HealthCheck[];
  score: number;
  summary: string;
}> {
  const [baseline, published, withUrl, links, linkedAssets, events, tracedEvents, lastSnapshot] =
    await Promise.all([
      prisma.proofPeriod.count({ where: { orgId, kind: "baseline" } }),
      prisma.publishRecord.count({ where: { orgId, status: "published" } }),
      prisma.publishRecord.count({ where: { orgId, status: "published", url: { not: null } } }),
      prisma.trackedLink.count({ where: { orgId, active: true } }),
      prisma.trackedLink.findMany({
        where: { orgId, active: true, contentItemId: { not: null } },
        select: { contentItemId: true },
        distinct: ["contentItemId"],
      }),
      prisma.commercialEvent.count({ where: { orgId } }),
      prisma.commercialEvent.count({
        where: { orgId, attribution: { in: ["directly_tracked", "buyer_named"] } },
      }),
      prisma.performanceSnapshot.findFirst({
        where: { orgId },
        orderBy: { capturedAt: "desc" },
        select: { capturedAt: true },
      }),
    ]);

  const staleDays = lastSnapshot
    ? Math.floor((Date.now() - lastSnapshot.capturedAt.getTime()) / 86_400_000)
    : null;

  const checks: HealthCheck[] = [
    {
      key: "baseline",
      label: "Day-0 baseline",
      ok: baseline > 0,
      detail:
        baseline > 0
          ? "Captured. Comparisons have something to compare against."
          : "Not captured. Without it there is nothing to compare against, and it cannot be reconstructed later.",
    },
    {
      key: "urls",
      label: "Live URLs",
      ok: published === 0 || withUrl === published,
      detail:
        published === 0
          ? "Nothing published yet."
          : `${withUrl} of ${published} published assets have a live URL recorded.`,
    },
    {
      key: "links",
      label: "Tracked links",
      ok: links > 0,
      detail:
        links > 0
          ? `${links} active, covering ${linkedAssets.length} ${linkedAssets.length === 1 ? "asset" : "assets"}.`
          : "None. Clicks cannot be observed, so no journey can start.",
    },
    {
      key: "events",
      label: "Commercial events",
      ok: events > 0,
      detail:
        events > 0
          ? `${events} recorded, ${tracedEvents} of them traceable to content.`
          : "None recorded. Nothing downstream of a click is visible yet.",
    },
    {
      key: "metrics",
      label: "Platform metrics",
      ok: staleDays !== null && staleDays <= 14,
      detail:
        staleDays === null
          ? "Never captured."
          : staleDays <= 14
            ? `Last refreshed ${staleDays} ${staleDays === 1 ? "day" : "days"} ago.`
            : `Last refreshed ${staleDays} days ago. Attention figures are out of date.`,
    },
  ];

  const passing = checks.filter((c) => c.ok).length;
  const score = Math.round((passing / checks.length) * 100);

  return {
    checks,
    score,
    summary:
      passing === checks.length
        ? "Measurement is complete enough to interpret."
        : `${checks.length - passing} of ${checks.length} measurement checks are incomplete. Treat missing tracking as missing data, not as zero commercial value.`,
  };
}

/* ------------------------------ Tracked links ------------------------------- */

export async function listTrackedLinks(orgId: string) {
  const links = await prisma.trackedLink.findMany({
    where: { orgId },
    include: {
      contentItem: { select: { id: true, title: true } },
      _count: { select: { touchpoints: true } },
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return links;
}

/** Strongest evidence class present, for a one-line honest summary. */
export function strongestEvidence(classes: AttributionClass[]): AttributionClass | null {
  if (classes.length === 0) return null;
  return classes.reduce((best, c) =>
    ATTRIBUTION_STRENGTH[c] > ATTRIBUTION_STRENGTH[best] ? c : best,
  );
}

/* --------------------------- The client's answer ---------------------------- */

export type CommercialClaim = {
  evidence: AttributionClass;
  events: number;
  valueMinor: number;
  /** The strongest sentence this evidence actually supports. */
  sentence: string;
};

export type ClientSummary = {
  clicks: number;
  claims: CommercialClaim[];
  /** Assets worth repeating, strongest evidence first. */
  topAssets: { contentItemId: string; title: string; events: number; evidence: AttributionClass }[];
  coverage: Coverage;
  /** One line about whether the measurement can support any of this. */
  measurement: string;
};

/**
 * What the client is shown on Results.
 *
 * Curated on purpose. The operator surface carries tracked links, raw journeys
 * and coverage arithmetic; a client wants to know what happened, what
 * contributed, and how much of that is actually defensible. Grouping by
 * evidence class rather than summing everything into one figure is the whole
 * point: "£40,000 of pipeline" and "£40,000 of pipeline that moved during the
 * period" are different claims, and only one of them is usually true.
 */
export async function clientAttributionSummary(
  orgId: string,
  range: PeriodRange,
  formatMoney: (minor: number) => string = (m) => String(m),
): Promise<ClientSummary> {
  const [events, clicks, health, attribution] = await Promise.all([
    prisma.commercialEvent.findMany({
      where: { orgId, occurredAt: { gte: range.start, lte: range.end } },
      select: { attribution: true, valueMinor: true },
    }),
    prisma.touchpoint.count({
      where: { orgId, kind: "click", occurredAt: { gte: range.start, lte: range.end } },
    }),
    trackingHealth(orgId),
    assetAttribution(orgId, range, "linear"),
  ]);

  const groups = new Map<AttributionClass, { events: number; valueMinor: number }>();
  for (const event of events) {
    const key = event.attribution as AttributionClass;
    const group = groups.get(key) ?? { events: 0, valueMinor: 0 };
    group.events += 1;
    group.valueMinor += event.valueMinor;
    groups.set(key, group);
  }

  const claims: CommercialClaim[] = [...groups.entries()]
    .sort((a, b) => ATTRIBUTION_STRENGTH[b[0]] - ATTRIBUTION_STRENGTH[a[0]])
    .map(([evidence, group]) => ({
      evidence,
      events: group.events,
      valueMinor: group.valueMinor,
      // The strongest sentence this class of evidence actually supports.
      // Written here rather than in the page, so no surface can accidentally
      // describe a correlation as something the content caused.
      sentence: outcomeLanguage(
        evidence,
        group.valueMinor > 0
          ? formatMoney(group.valueMinor)
          : `${group.events} commercial ${group.events === 1 ? "event" : "events"}`,
      ),
    }));

  return {
    clicks,
    claims,
    coverage: attribution.coverage,
    measurement: health.summary,
    topAssets: attribution.assets.slice(0, 5).map((a) => ({
      contentItemId: a.contentItemId,
      title: a.title,
      events: a.events,
      evidence: a.bestEvidence,
    })),
  };
}
