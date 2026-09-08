"use server";

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
