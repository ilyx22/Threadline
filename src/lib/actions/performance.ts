"use server";

import { Prisma } from "@prisma/client";
import { detectMapping, normaliseUrl, parseCsv, toCandidates } from "@/lib/analytics/csv-import";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { detectPatterns } from "@/lib/ai/generators";
import { patternScore } from "@/lib/domain/scoring";
import { getAdapter } from "@/lib/integrations/adapter";
import { integrationByProvider } from "@/lib/integrations/registry";
import {
  breakdowns,
  classifyAssets,
  lastNDays,
  publishedAssets,
  topPerformers,
  underPerformers,
} from "@/lib/data/metrics";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/** Performance loop mutations: metric entry, learning derivation, write-back to signals. */

const metricSchema = z.object({
  publishRecordId: z.string().min(1),
  views: z.coerce.number().int().min(0).default(0),
  impressions: z.coerce.number().int().min(0).default(0),
  reach: z.coerce.number().int().min(0).default(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  watchTimeSec: z.coerce.number().int().min(0).default(0),
  avgViewSec: z.coerce.number().min(0).default(0),
  retentionPct: z.coerce.number().min(0).max(100).default(0),
  ctrPct: z.coerce.number().min(0).max(100).default(0),
  leads: z.coerce.number().int().min(0).default(0),
  bookedCalls: z.coerce.number().int().min(0).default(0),
  revenue: z.coerce.number().min(0).default(0),
});

export async function addPerformanceSnapshotAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "performance.edit");
    const input = parseForm(metricSchema, formData);

    const record = await prisma.publishRecord.findFirst({
      where: { id: input.publishRecordId, orgId: ctx.org.id },
      include: { contentItem: { select: { id: true, title: true } } },
    });
    if (!record) return err("That publish record no longer exists.", "not_found");
    if (record.status !== "published") {
      return err("Mark the record published before adding performance data.", "workflow");
    }

    await prisma.performanceSnapshot.create({
      data: {
        orgId: ctx.org.id,
        publishRecordId: record.id,
        views: input.views,
        impressions: input.impressions,
        reach: input.reach,
        likes: input.likes,
        comments: input.comments,
        shares: input.shares,
        saves: input.saves,
        watchTimeSec: input.watchTimeSec,
        avgViewSec: input.avgViewSec,
        retentionPct: input.retentionPct,
        ctrPct: input.ctrPct,
        leads: input.leads,
        bookedCalls: input.bookedCalls,
        revenueMinor: Math.round(input.revenue * 100),
        source: "manual",
      },
    });

    await prisma.contentEvent.create({
      data: {
        orgId: ctx.org.id,
        contentItemId: record.contentItemId,
        type: "metric_added",
        note: `${input.views.toLocaleString("en-GB")} views recorded`,
        actorId: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "performance.snapshot",
      entityType: "publish_record",
      entityId: record.id,
      summary: `Recorded performance for "${record.contentItem.title}"`,
      meta: { views: input.views },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/performance`);
    revalidatePath(`/app/${orgSlug}/production/${record.contentItemId}`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid("Performance recorded.");
  });
}

/**
 * Attempt a metric import through the provider adapter.
 *
 * In v1 every social adapter reports `unavailable`, and this action surfaces
 * that message verbatim rather than pretending an import ran.
 */
export async function importMetricsAction(
  orgSlug: string,
  provider: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "performance.edit");
    const definition = integrationByProvider(provider);
    if (!definition) return err("Unknown integration.", "not_found");

    const integration = await prisma.integration.findUnique({
      where: { orgId_provider: { orgId: ctx.org.id, provider } },
    });

    const adapter = getAdapter(provider);
    if (!adapter.fetchMetrics) {
      return err(`${definition.name} does not support metric import.`, "workflow");
    }

    const result = await adapter.fetchMetrics({
      config: integration ? JSON.parse(integration.config) : {},
      externalUrl: "",
    });

    if (!result.ok) {
      return err(result.message, "workflow");
    }

    return okVoid("Metrics imported.");
  });
}

/**
 * Derive learnings from performance and write them back into the Signal Engine.
 *
 * This is the loop closing: performance produces patterns, patterns feed idea
 * generation, ideas become the next cycle's content.
 */
export async function deriveLearningsAction(
  orgSlug: string,
  days = 60,
): Promise<ActionResult<{ created: number; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);

    const range = lastNDays(days);
    const assets = await publishedAssets(ctx.org.id, range);

    if (assets.length < 3) {
      return err(
        "There is not enough published content yet to derive a reliable pattern. Publish at least three pieces first.",
        "workflow",
      );
    }

    const b = breakdowns(assets);
    const classified = classifyAssets(assets);

    const summary = [
      `Published assets in the last ${days} days: ${assets.length}`,
      `Top performers: ${topPerformers(assets, 5)
        .map((a) => `"${a.title}" (${a.platform}, ${a.views} views, ${a.retentionPct}% retention)`)
        .join("; ")}`,
      `Under performers: ${underPerformers(assets, 3)
        .map((a) => `"${a.title}" (${a.views} views)`)
        .join("; ")}`,
      `By topic: ${b.byTopic.map((t) => `${t.label}: ${t.count} pieces, ${t.avgViews} avg views`).join("; ")}`,
      `By format: ${b.byFormat.map((f) => `${f.label}: ${f.count} pieces, ${f.avgViews} avg views`).join("; ")}`,
      `By hook shape: ${b.byHookShape.map((h) => `${h.label}: ${h.count} pieces, ${h.avgViews} avg views`).join("; ")}`,
      `By CTA: ${b.byCta.map((c) => `${c.label}: ${c.leads} leads from ${c.count} pieces`).join("; ")}`,
      `Winners: ${classified.filter((c) => c.verdict === "winner").length}, losers: ${classified.filter((c) => c.verdict === "loser").length}`,
    ].join("\n");

    const { patterns, meta } = await detectPatterns({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      performanceSummary: summary,
    });

    let created = 0;
    for (const pattern of patterns) {
      // Avoid re-creating an identical pattern on every run.
      const existing = await prisma.pattern.findFirst({
        where: { orgId: ctx.org.id, title: pattern.title },
        select: { id: true },
      });
      if (existing) continue;

      const record = await prisma.pattern.create({
        data: {
          orgId: ctx.org.id,
          kind: pattern.kind,
          title: pattern.title,
          description: pattern.description,
          confidence: Math.round(pattern.confidence),
          impact: Math.round(pattern.impact),
          effort: Math.round(pattern.effort),
          score: patternScore(pattern),
          nextExperiment: pattern.nextExperiment,
          status: pattern.kind === "learning" ? "validated" : "open",
          detectedBy: "performance_loop",
        },
      });

      // Attach the strongest performers as evidence so the claim is inspectable.
      const evidence = topPerformers(assets, 3);
      if (evidence.length > 0) {
        await prisma.patternEvidence.createMany({
          data: evidence.map((a) => ({
            patternId: record.id,
            contentItemId: a.contentItemId,
            note: `${a.views.toLocaleString("en-GB")} views`,
            metricRef: "views",
          })),
        });
      }

      created += 1;
    }

    await audit(ctx, {
      action: "performance.learnings",
      entityType: "pattern",
      summary: `Derived ${created} signal${created === 1 ? "" : "s"} from performance${meta.isDemo ? " (demo mode)" : ""}`,
      meta: { created, days, isDemo: meta.isDemo },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);
    revalidatePath(`/app/${orgSlug}/performance`);

    return ok(
      { created, isDemo: meta.isDemo },
      created === 0
        ? "No new patterns found — the existing signals already cover what the data shows."
        : `${created} new signal${created === 1 ? "" : "s"} added.`,
    );
  });
}

/**
 * INT-05: import platform metrics from a CSV export. `mode=preview` reports
 * what would happen (mapping, matches, duplicates, problems) and writes
 * nothing; `mode=import` writes one snapshot per matched row, deduplicated on
 * the row's fingerprint, and audits the import.
 */
export async function importMetricsCsvAction(
  orgSlug: string,
  _prev: ActionResult<CsvImportSummary> | null,
  formData: FormData,
): Promise<ActionResult<CsvImportSummary>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "performance.edit");
    const file = formData.get("file");
    const mode = formData.get("mode") === "import" ? "import" : "preview";
    if (!(file instanceof File) || file.size === 0) return err("Choose a CSV file.", "validation", { file: "Choose a file." });
    if (file.size > 2_000_000) return err("That file is larger than 2 MB. Export a shorter date range.", "validation");
    const rows = parseCsv(await file.text());
    if (rows.length < 2) return err("The file has no data rows.", "validation");
    const { mapping, ignored } = detectMapping(rows[0]);
    if (mapping.url === undefined && mapping.postId === undefined) return err("No column identifies the post (expected a post URL or post id column).", "validation");
    const candidates = toCandidates(rows, mapping);
    const records = await prisma.publishRecord.findMany({ where: { orgId: ctx.org.id, status: "published" }, select: { id: true, url: true, externalId: true } });
    const byUrl = new Map(records.filter((r) => r.url).map((r) => [normaliseUrl(r.url), r.id]));
    const byId = new Map(records.filter((r) => r.externalId).map((r) => [r.externalId!, r.id]));
    const summary: CsvImportSummary = { mode, rows: candidates.length, mapped: Object.keys(mapping), ignored, matched: 0, created: 0, duplicates: 0, unmatched: [], problems: [] };
    for (const c of candidates) {
      if (c.problem) {
        summary.problems.push(`Line ${c.line}: ${c.problem}`);
        continue;
      }
      const recordId = (c.postId && byId.get(c.postId)) || byUrl.get(normaliseUrl(c.url));
      if (!recordId) {
        summary.unmatched.push(`Line ${c.line}: ${c.url ?? c.postId}`);
        continue;
      }
      summary.matched++;
      if (mode !== "import") continue;
      try {
        await prisma.performanceSnapshot.create({ data: { orgId: ctx.org.id, publishRecordId: recordId, capturedAt: c.capturedAt ?? new Date(), source: "csv", providerRecordId: c.fingerprint, fetchedAt: new Date(), provenance: JSON.stringify({ provider: "csv", file: file.name.slice(0, 120), line: c.line }), ...c.metrics } });
        summary.created++;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") summary.duplicates++;
        else throw e;
      }
    }
    summary.unmatched = summary.unmatched.slice(0, 50);
    summary.problems = summary.problems.slice(0, 50);
    if (mode === "import") {
      await audit(ctx, { action: "performance.csv_import", entityType: "performance_snapshot", entityId: ctx.org.id, summary: `Imported ${summary.created} snapshot(s) from ${file.name} (${summary.duplicates} duplicate, ${summary.unmatched.length} unmatched)` });
      revalidatePath(`/app/${orgSlug}/performance`);
    }
    return ok(summary, mode === "import" ? `${summary.created} snapshot(s) imported.` : `${summary.matched} of ${summary.rows} row(s) match a published post.`);
  });
}

export type CsvImportSummary = { mode: "preview" | "import"; rows: number; mapped: string[]; ignored: string[]; matched: number; created: number; duplicates: number; unmatched: string[]; problems: string[] };
