import "server-only";
import { prisma } from "@/lib/db/client";
import { getConnector } from "@/lib/integrations/connectors";
import { readCredential } from "@/lib/integrations/credentials";
import { normalise, unavailableKeys, type NormalisedMetrics } from "./normalise";

/**
 * Automatic analytics ingestion.
 *
 *   provider payload → normalise() → PerformanceSnapshot(source: "adapter")
 *
 * Provenance travels with every row (which provider, which endpoint, when,
 * and which fields were unknown / unavailable / unsupported / stale). The
 * unique key on (publishRecordId, source, providerRecordId, capturedAt)
 * makes a re-run of the same reading a no-op rather than a duplicate. Manual
 * snapshots keep `source: "manual"` and are never rewritten by ingestion —
 * the two can coexist and the UI labels each.
 */

export type IngestOutcome =
  | { ok: true; snapshotId: string; duplicate: false; unavailable: string[] }
  | { ok: true; snapshotId: string; duplicate: true; unavailable: string[] }
  | { ok: false; reason: "no_integration" | "auth_required" | "unsupported" | "unavailable" | "no_external_id" | "error"; message: string };

export async function refreshMetricsForRecord(orgId: string, publishRecordId: string, opts: { now?: Date } = {}): Promise<IngestOutcome> {
  const record = await prisma.publishRecord.findFirst({ where: { id: publishRecordId, orgId }, select: { id: true, platform: true, url: true, externalId: true, status: true } });
  if (!record) return { ok: false, reason: "error", message: "Publish record not found in this workspace." };
  if (record.status !== "published") return { ok: false, reason: "unavailable", message: "Only a published record can be measured." };
  const connector = getConnector(record.platform);
  if (!connector) return { ok: false, reason: "unsupported", message: `No connector for ${record.platform}.` };
  const integration = await prisma.integration.findUnique({ where: { orgId_provider: { orgId, provider: record.platform } } });
  if (!integration || integration.authStatus !== "connected") return { ok: false, reason: "auth_required", message: `${connector.label} is not connected for this workspace.` };
  const token = await readCredential(orgId, record.platform, "oauth_access");
  if (!token) return { ok: false, reason: "auth_required", message: "No usable access token; reconnect the account." };
  const externalId = record.externalId ?? connector.externalIdFromUrl?.(record.url ?? "") ?? null;
  if (!externalId) return { ok: false, reason: "no_external_id", message: "The provider's post id is unknown; publish through the connector or record the post URL." };

  const fetched = await connector.fetchMetrics({ accessToken: token, externalId });
  if (!fetched.ok) {
    await prisma.integration.update({ where: { id: integration.id }, data: { lastErrorAt: new Date(), lastErrorCode: fetched.code, lastErrorMessage: fetched.message.slice(0, 300), ...(fetched.code === "auth_expired" ? { authStatus: "expired", reconnectRequired: true } : {}) } });
    return { ok: false, reason: fetched.code === "auth_expired" ? "auth_required" : "unavailable", message: fetched.message };
  }
  const normalised = normalise({ provider: record.platform, raw: fetched.metrics, measuredAt: fetched.measuredAt, providerRecordId: externalId, now: opts.now });
  const stored = await storeSnapshot(orgId, record.id, record.platform, normalised, fetched.endpoint, opts.now);
  await prisma.integration.update({ where: { id: integration.id }, data: { lastSuccessfulSyncAt: new Date(), lastErrorCode: null, lastErrorMessage: null } });
  return { ok: true, snapshotId: stored.id, duplicate: stored.duplicate, unavailable: unavailableKeys(normalised) };
}

export async function storeSnapshot(orgId: string, publishRecordId: string, provider: string, n: NormalisedMetrics, endpoint: string, now = new Date()) {
  const capturedAt = n.measuredAt ?? now;
  const existing = await prisma.performanceSnapshot.findFirst({ where: { publishRecordId, source: "adapter", providerRecordId: n.providerRecordId, capturedAt } });
  if (existing) return { id: existing.id, duplicate: true };
  const v = n.values;
  const row = await prisma.performanceSnapshot.create({
    data: {
      orgId,
      publishRecordId,
      capturedAt,
      views: v.views ?? 0,
      impressions: v.impressions ?? 0,
      reach: v.reach ?? 0,
      likes: v.likes ?? 0,
      comments: v.comments ?? 0,
      shares: v.shares ?? 0,
      saves: v.saves ?? 0,
      watchTimeSec: v.watchTimeSec ?? 0,
      avgViewSec: v.avgViewSec ?? 0,
      retentionPct: v.retentionPct ?? 0,
      ctrPct: v.ctrPct ?? 0,
      source: "adapter",
      providerRecordId: n.providerRecordId,
      fetchedAt: now,
      provenance: JSON.stringify({ provider, endpoint, requestedAt: now.toISOString(), fields: n.states }),
      unavailable: JSON.stringify(unavailableKeys(n)),
    },
  });
  return { id: row.id, duplicate: false };
}

/** Refresh every published record of a workspace that has a connected integration. */
export async function refreshMetricsForOrg(orgId: string) {
  const records = await prisma.publishRecord.findMany({ where: { orgId, status: "published" }, select: { id: true } });
  const results: IngestOutcome[] = [];
  for (const r of records) results.push(await refreshMetricsForRecord(orgId, r.id));
  return results;
}

/** Freshness of the newest adapter reading for a record — the UI shows "measured 3 days ago", never a silent number. */
export async function metricFreshness(publishRecordId: string, now = new Date()) {
  const latest = await prisma.performanceSnapshot.findFirst({ where: { publishRecordId }, orderBy: { capturedAt: "desc" }, select: { capturedAt: true, source: true, unavailable: true } });
  if (!latest) return { state: "none" as const, ageHours: null, source: null, unavailable: [] as string[] };
  const ageHours = (now.getTime() - latest.capturedAt.getTime()) / 3_600_000;
  return { state: ageHours > 36 ? ("stale" as const) : ("fresh" as const), ageHours: Math.round(ageHours), source: latest.source, unavailable: JSON.parse(latest.unavailable) as string[] };
}
