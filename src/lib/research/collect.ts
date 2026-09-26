import "server-only";
import { prisma } from "@/lib/db/client";
import { stringify } from "@/lib/db/json";
import { evidenceFingerprint } from "@/lib/domain/intelligence";

/**
 * Evidence collection shared by intelligence runs and scheduled research
 * (AI-02). Moved out of the runs action file so the scheduler can use it
 * without these functions becoming callable server actions.
 */
export type PreparedEvidence = {
  kind: string;
  title: string;
  body: string;
  url: string | null;
  sourceName: string | null;
  author?: string | null;
  platform?: string | null;
  collectedVia: string;
  capturedAt?: Date;
  meta: Record<string, unknown>;
};

/**
 * Write evidence, skipping anything already held.
 *
 * Deduplication is by fingerprint within the organisation, so an item captured
 * by a previous run is reused rather than duplicated — which keeps "three
 * independent sources say this" an honest statement.
 */
export async function persistEvidence(orgId: string, runId: string, items: PreparedEvidence[]) {
  let collected = 0;
  let duplicates = 0;

  for (const item of items) {
    const dedupeKey = evidenceFingerprint({ url: item.url, title: item.title, body: item.body });

    const existing = await prisma.researchItem.findFirst({
      where: { orgId, dedupeKey },
      select: { id: true, runId: true },
    });

    if (existing) {
      duplicates += 1;
      // Attach an orphaned item to this run so it can still be cited, but never
      // steal an item that another run already claims as its evidence.
      if (!existing.runId) {
        await prisma.researchItem.update({ where: { id: existing.id }, data: { runId } });
      }
      continue;
    }

    await prisma.researchItem.create({
      data: {
        orgId,
        runId,
        kind: item.kind,
        title: item.title.slice(0, 300),
        body: item.body.slice(0, 8000),
        url: item.url,
        sourceName: item.sourceName,
        author: item.author ?? null,
        platform: item.platform ?? null,
        capturedAt: item.capturedAt ?? new Date(),
        collectedVia: item.collectedVia,
        sourceMeta: stringify(item.meta),
        dedupeKey,
      },
    });
    collected += 1;
  }

  return { collected, duplicates };
}

/**
 * Read the records this workspace already holds.
 *
 * These are the only genuinely automatic sources in the product, precisely
 * because they need no third-party credentials — the data is already ours.
 */
export async function collectInternal(
  orgId: string,
  kind: string,
  start: Date,
  end: Date,
): Promise<PreparedEvidence[]> {
  if (kind === "historic_content") {
    const records = await prisma.publishRecord.findMany({
      where: { orgId, status: "published", publishedAt: { lte: end } },
      orderBy: { publishedAt: "desc" },
      take: 25,
      include: {
        contentItem: { select: { title: true, format: true, selectedHook: true } },
        snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
          select: { views: true, likes: true, comments: true, capturedAt: true },
        },
      },
    });

    return records.map((record) => {
      const snapshot = record.snapshots[0];
      return {
        kind: "content_example",
        title: record.contentItem?.title ?? "Published piece",
        body: [
          record.contentItem?.selectedHook ? `Hook: ${record.contentItem.selectedHook}` : null,
          `Platform: ${record.platform}`,
          record.contentItem?.format ? `Format: ${record.contentItem.format}` : null,
          snapshot
            ? `Measured ${snapshot.views} views, ${snapshot.likes} likes, ${snapshot.comments} comments as at ${snapshot.capturedAt.toISOString().slice(0, 10)}.`
            : "No performance reading recorded yet.",
        ]
          .filter(Boolean)
          .join("\n"),
        url: record.url,
        sourceName: "Own published content",
        platform: record.platform,
        collectedVia: "run",
        capturedAt: record.publishedAt ?? new Date(),
        meta: {
          sourceType: "historic_content",
          collectionMode: "workspace",
          publishRecordId: record.id,
          views: snapshot?.views ?? null,
        },
      };
    });
  }

  if (kind === "performance") {
    const snapshots = await prisma.performanceSnapshot.findMany({
      where: { orgId, capturedAt: { gte: start, lte: end } },
      orderBy: { views: "desc" },
      take: 40,
      include: {
        publishRecord: {
          select: { platform: true, url: true, contentItem: { select: { title: true, format: true } } },
        },
      },
    });
    if (snapshots.length === 0) return [];

    const views = snapshots.map((s) => s.views).sort((a, b) => a - b);
    const median = views[Math.floor(views.length / 2)] ?? 0;
    const top = snapshots.slice(0, 5);

    return [
      {
        kind: "trend",
        title: `Measured performance, ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
        body: [
          `${snapshots.length} readings. Median views ${median}.`,
          "Strongest pieces in this period:",
          ...top.map(
            (s) =>
              `- "${s.publishRecord?.contentItem?.title ?? "Untitled"}" (${s.publishRecord?.platform ?? "unknown"}, ${s.publishRecord?.contentItem?.format ?? "unknown format"}): ${s.views} views, ${s.likes} likes, ${s.comments} comments.`,
          ),
        ].join("\n"),
        url: null,
        sourceName: "Workspace performance data",
        collectedVia: "run",
        capturedAt: end,
        meta: { sourceType: "performance", collectionMode: "workspace", readings: snapshots.length, median },
      },
    ];
  }

  if (kind === "pipeline") {
    const inquiries = await prisma.inquiry.findMany({
      where: { orgId, occurredAt: { gte: start, lte: end } },
      orderBy: { occurredAt: "desc" },
      take: 60,
      include: { contentItem: { select: { title: true } } },
    });
    if (inquiries.length === 0) return [];

    const byStage: Record<string, number> = {};
    for (const inquiry of inquiries) byStage[inquiry.stage] = (byStage[inquiry.stage] ?? 0) + 1;
    const attributed = inquiries.filter((i) => i.contentItemId);

    return [
      {
        kind: "trend",
        title: `Commercial outcomes, ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
        body: [
          `${inquiries.length} pipeline records: ${Object.entries(byStage)
            .map(([stage, count]) => `${count} ${stage.replace(/_/g, " ")}`)
            .join(", ")}.`,
          `${attributed.length} named a specific piece of content as their source.`,
          ...attributed
            .slice(0, 8)
            .map((i) => `- ${i.stage.replace(/_/g, " ")} from "${i.contentItem?.title ?? "unknown piece"}"${i.cta ? ` via ${i.cta}` : ""}.`),
        ].join("\n"),
        url: null,
        sourceName: "Workspace pipeline data",
        collectedVia: "run",
        capturedAt: end,
        meta: {
          sourceType: "pipeline",
          collectionMode: "workspace",
          records: inquiries.length,
          attributed: attributed.length,
        },
      },
    ];
  }

  return [];
}


export function researchKindForSource(kind: string): string {
  switch (kind) {
    case "competitor":
    case "creator":
      return "competitor_post";
    case "sales_call":
    case "customer_language":
      return "customer_language";
    case "historic_content":
      return "content_example";
    case "performance":
    case "pipeline":
    case "category":
      return "trend";
    case "note":
      return "source";
    default:
      return "content_example";
  }
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
