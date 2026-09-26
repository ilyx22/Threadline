import "server-only";
import { prisma } from "@/lib/db/client";
import { enqueue } from "@/lib/jobs";
import { getConnector, type PublishOutcome } from "@/lib/integrations/connectors";
import { publishThread, splitThread } from "@/lib/integrations/connectors/x";
import { readCredential, putCredential } from "@/lib/integrations/credentials";
import { refreshAccessToken } from "@/lib/integrations/oauth";
import { assertReleasable } from "@/lib/delivery/approvals";
import { getStorage } from "@/lib/storage";
import { sideEffectsAllowed } from "@/lib/env";

/**
 * Scheduled publishing through platform connectors (INT-03, INT-02, JOB-02).
 *
 * A publish record with method "integration" and status "scheduled" is
 * published by a job at its time, only if the content and package are still
 * approved at that moment. Sub-states live in `providerStatus`:
 *   PUBLISHING   the request is being sent (claimed; no second worker sends it)
 *   PROCESSING   the platform is processing media; polled until it is ready
 *   PUBLISHED    done, with the platform's id
 *   UNCERTAIN    the request was sent but no answer came back. It is NOT
 *                retried automatically, because a retry could post twice;
 *                a person checks the platform and records the outcome.
 * Only production deployments publish (sideEffectsAllowed).
 */
const POLL_DELAY_MS = 60_000;
const MAX_POLLS = 30;
const REFRESH_MARGIN_MS = 5 * 60_000;

export class PublishBlocked extends Error {}

/**
 * A usable access token, refreshed when it is about to expire (INT-02). The
 * refresh runs under a per-integration advisory lock, so two jobs never spend
 * the same refresh token (some providers rotate it on use).
 */
export async function accessTokenFor(orgId: string, provider: string, now = new Date(), marginMs = REFRESH_MARGIN_MS) {
  const integration = await prisma.integration.findUnique({ where: { orgId_provider: { orgId, provider } } });
  if (!integration || integration.authStatus !== "connected") throw new PublishBlocked(`${provider} is not connected for this workspace.`);
  const fresh = !integration.tokenExpiresAt || integration.tokenExpiresAt.getTime() - now.getTime() > marginMs;
  if (fresh) {
    const token = await readCredential(orgId, provider, "oauth_access");
    if (!token) throw new PublishBlocked("No usable access token; reconnect the account.");
    return { token, externalAccountId: integration.externalAccountId };
  }
  const connector = getConnector(provider);
  const config = connector?.authConfig();
  if (!config) throw new PublishBlocked(`${provider} app credentials are not configured.`);
  const result = await prisma.$transaction(
    async (tx): Promise<{ token: string; externalAccountId: string | null } | { blocked: string; reconnect: boolean; code: string } | { retry: string }> => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`refresh:${orgId}:${provider}`}))`;
      // Another job may have refreshed while this one waited for the lock.
      const again = await tx.integration.findUniqueOrThrow({ where: { id: integration.id } });
      if (again.tokenExpiresAt && again.tokenExpiresAt.getTime() - Date.now() > marginMs) {
        const token = await readCredential(orgId, provider, "oauth_access");
        if (token) return { token, externalAccountId: again.externalAccountId };
      }
      const refreshToken = await readCredential(orgId, provider, "oauth_refresh");
      if (!refreshToken) return { blocked: "The access token expired and there is no refresh token; reconnect the account.", reconnect: true, code: "auth_expired" };
      const out = await refreshAccessToken({ config, refreshToken });
      if (!out.ok) return out.retryable ? { retry: out.reason } : { blocked: `${out.reason} Reconnect the account.`, reconnect: true, code: "refresh_failed" };
      const expiresAt = out.token.expiresInSec ? new Date(Date.now() + out.token.expiresInSec * 1000) : null;
      await putCredential({ orgId, provider, purpose: "oauth_access", secret: out.token.accessToken, scopes: out.token.scopesGranted, expiresAt, externalAccountId: integration.externalAccountId });
      if (out.token.refreshToken) await putCredential({ orgId, provider, purpose: "oauth_refresh", secret: out.token.refreshToken, scopes: out.token.scopesGranted, externalAccountId: integration.externalAccountId });
      await tx.integration.update({ where: { id: integration.id }, data: { tokenExpiresAt: expiresAt, lastVerifiedAt: new Date(), reconnectRequired: false } });
      return { token: out.token.accessToken, externalAccountId: integration.externalAccountId };
    },
    { timeout: 30_000 },
  );
  if ("retry" in result) throw new Error(result.retry);
  if ("blocked" in result) {
    // Recorded outside the transaction, so the reconnect prompt survives the refusal.
    await prisma.integration.update({ where: { id: integration.id }, data: { authStatus: "expired", reconnectRequired: true, lastErrorAt: new Date(), lastErrorCode: result.code, lastErrorMessage: result.blocked.slice(0, 300) } });
    throw new PublishBlocked(result.blocked);
  }
  return result;
}

/**
 * Daily (INT-02): refresh tokens that expire within a day, so a scheduled
 * publish or metrics read never meets an expired token; a refusal marks the
 * integration for reconnection, which the workspace sees as a prompt.
 */
export async function refreshExpiringTokens(now = new Date()) {
  const soon = await prisma.integration.findMany({ where: { authStatus: "connected", tokenExpiresAt: { lte: new Date(now.getTime() + 86_400_000) } }, select: { orgId: true, provider: true } });
  const out = { refreshed: 0, reconnect: 0, failed: 0 };
  for (const i of soon) {
    try {
      await accessTokenFor(i.orgId, i.provider, now, 86_400_000);
      out.refreshed++;
    } catch (e) {
      if (e instanceof PublishBlocked) out.reconnect++;
      else out.failed++;
    }
  }
  return out;
}

/** Queue the publish job for a scheduled integration record, at its time. */
export async function schedulePublish(recordId: string) {
  const r = await prisma.publishRecord.findUnique({ where: { id: recordId } });
  if (!r || r.status !== "scheduled" || r.method !== "integration" || !r.scheduledFor) return null;
  const { job } = await enqueue("publish.run", { recordId }, { idempotencyKey: `publish.run:${r.id}:${r.scheduledFor.toISOString()}`, runAt: r.scheduledFor, orgId: r.orgId, maxAttempts: 4 });
  return job.id;
}

async function mediaFor(orgId: string, contentItemId: string) {
  const asset = await prisma.asset.findFirst({ where: { orgId, contentItemId, category: "edited_media", storagePath: { not: null } }, orderBy: { version: "desc" } });
  if (!asset?.storagePath) return { mediaUrl: null, mediaKind: "none" as const };
  const store = getStorage() as { signedGetUrl?: (p: string, seconds?: number) => string };
  if (!store.signedGetUrl) throw new PublishBlocked("Publishing media needs S3 storage, so the platform can fetch the file.");
  return { mediaUrl: store.signedGetUrl(asset.storagePath, 3600), mediaKind: asset.mimeType?.startsWith("video/") ? ("video" as const) : asset.mimeType?.startsWith("image/") ? ("image" as const) : ("none" as const) };
}

async function markPublished(recordId: string, orgId: string, contentItemId: string, externalId: string, url: string | null, raw: unknown) {
  await prisma.publishRecord.update({ where: { id: recordId }, data: { status: "published", providerStatus: "PUBLISHED", externalId, url: url ?? undefined, publishedAt: new Date(), failureReason: null, providerPayload: JSON.stringify(raw ?? null).slice(0, 4000) } });
  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId }, select: { stage: true } });
  if (item && item.stage !== "live") {
    await prisma.contentItem.update({ where: { id: contentItemId }, data: { stage: "live", liveAt: new Date() } });
    await prisma.contentEvent.create({ data: { orgId, contentItemId, type: "published", fromStage: item.stage, toStage: "live", note: "Published through the platform connector" } });
  }
  await enqueue("metrics.refresh", { publishRecordId: recordId, orgId }, { idempotencyKey: `metrics.first:${recordId}`, runAt: new Date(Date.now() + 24 * 3_600_000), orgId });
}

async function fail(recordId: string, reason: string, providerStatus = "FAILED") {
  await prisma.publishRecord.update({ where: { id: recordId }, data: { status: "failed", providerStatus, failureReason: reason.slice(0, 500) } });
}

/** Job: publish one scheduled record. Safe to run twice: only an unclaimed scheduled record is sent. */
export async function runPublish(recordId: string, now = new Date()) {
  const r = await prisma.publishRecord.findUnique({ where: { id: recordId }, include: { package: true } });
  if (!r || r.status !== "scheduled" || r.method !== "integration") return { state: "skipped" as const };
  if (r.scheduledFor && r.scheduledFor.getTime() > now.getTime() + 60_000) return { state: "early" as const };
  if (!sideEffectsAllowed()) return { state: "skipped" as const, reason: "not production" };
  const connector = getConnector(r.platform);
  if (!connector) return fail(r.id, `No connector for ${r.platform}.`).then(() => ({ state: "failed" as const }));

  // Approval is re-checked at publish time: a change after scheduling blocks it.
  try {
    await assertReleasable(r.orgId, [{ type: "content_item", id: r.contentItemId }, ...(r.packageId ? [{ type: "platform_package" as const, id: r.packageId }] : [])]);
  } catch (e) {
    await fail(r.id, `Not released: ${e instanceof Error ? e.message : "approval is no longer current"}`);
    return { state: "failed" as const };
  }

  // Claim: from here a second worker will not send it.
  const claimed = await prisma.publishRecord.updateMany({ where: { id: r.id, status: "scheduled", OR: [{ providerStatus: null }, { providerStatus: { notIn: ["PUBLISHING", "PROCESSING", "UNCERTAIN"] } }] }, data: { providerStatus: "PUBLISHING" } });
  if (claimed.count !== 1) return { state: "skipped" as const };

  let request: Parameters<typeof connector.publish>[0];
  try {
    const { token, externalAccountId } = await accessTokenFor(r.orgId, r.platform, now);
    const media = await mediaFor(r.orgId, r.contentItemId);
    const text = [r.package?.caption ?? r.package?.description ?? "", ...(r.package ? (JSON.parse(r.package.hashtags) as string[]).map((h) => (h.startsWith("#") ? h : `#${h}`)) : [])].join(" ").trim();
    request = { accessToken: token, externalAccountId, text, title: r.package?.title ?? undefined, ...media, idempotencyKey: r.id };
  } catch (e) {
    if (e instanceof PublishBlocked) {
      await fail(r.id, e.message);
      return { state: "failed" as const };
    }
    // Nothing was sent yet (token refresh, storage): release the claim and let the job retry.
    await prisma.publishRecord.update({ where: { id: r.id }, data: { providerStatus: null } });
    throw e;
  }

  // X: text longer than one post goes out as a thread (INT-03); a break partway is recorded, never re-posted.
  if (r.platform === "x" && request.text.length > 280) return publishXThread(r, request.accessToken, splitThread(request.text));

  let outcome: PublishOutcome;
  try {
    outcome = await connector.publish(request);
  } catch {
    // A timeout or dropped connection after the request left: it may have posted.
    outcome = { ok: false, code: "network", message: "No answer from the platform.", retryable: false };
  }

  if (!outcome.ok) {
    if (outcome.code === "network") {
      await fail(r.id, "The platform did not answer after the request was sent. Check the account before retrying: it may already be posted.", "UNCERTAIN");
      return { state: "uncertain" as const };
    }
    if (outcome.code === "auth_expired") await prisma.integration.updateMany({ where: { orgId: r.orgId, provider: r.platform }, data: { authStatus: "expired", reconnectRequired: true, lastErrorAt: new Date(), lastErrorCode: outcome.code, lastErrorMessage: outcome.message.slice(0, 300) } });
    if (outcome.retryable) {
      // Rate limits and platform errors mean nothing was posted: release and retry later.
      await prisma.publishRecord.update({ where: { id: r.id }, data: { providerStatus: null, failureReason: outcome.message.slice(0, 500) } });
      throw new Error(outcome.message);
    }
    await fail(r.id, outcome.message);
    return { state: "failed" as const };
  }
  if (outcome.providerStatus === "PUBLISHED") {
    await markPublished(r.id, r.orgId, r.contentItemId, outcome.externalId, outcome.url, outcome.raw);
    return { state: "published" as const };
  }
  await prisma.publishRecord.update({ where: { id: r.id }, data: { providerStatus: "PROCESSING", externalId: outcome.externalId, providerPayload: JSON.stringify(outcome.raw ?? null).slice(0, 4000) } });
  await enqueue("publish.poll", { recordId: r.id, attempt: 1 }, { idempotencyKey: `publish.poll:${r.id}:1`, runAt: new Date(Date.now() + POLL_DELAY_MS), orgId: r.orgId });
  return { state: "processing" as const };
}

/** Job: poll a processing record until the platform finishes, then finalise it. */
export async function pollPublish(recordId: string, attempt: number) {
  const r = await prisma.publishRecord.findUnique({ where: { id: recordId } });
  if (!r || r.status !== "scheduled" || r.providerStatus !== "PROCESSING" || !r.externalId) return { state: "skipped" as const };
  const connector = getConnector(r.platform);
  if (!connector?.publishStatus) return fail(r.id, "This platform cannot report processing status.").then(() => ({ state: "failed" as const }));
  let access;
  try {
    access = await accessTokenFor(r.orgId, r.platform);
  } catch (e) {
    if (e instanceof PublishBlocked) return fail(r.id, e.message).then(() => ({ state: "failed" as const }));
    throw e;
  }
  const st = await connector.publishStatus({ accessToken: access.token, externalId: r.externalId });
  const again = async () => {
    if (attempt >= MAX_POLLS) return fail(r.id, "The platform was still processing after 30 checks.").then(() => ({ state: "failed" as const }));
    await enqueue("publish.poll", { recordId: r.id, attempt: attempt + 1 }, { idempotencyKey: `publish.poll:${r.id}:${attempt + 1}`, runAt: new Date(Date.now() + POLL_DELAY_MS * Math.min(attempt + 1, 10)), orgId: r.orgId });
    return { state: "processing" as const };
  };
  if (!st.ok) return st.code === "rate_limited" || st.code === "provider_error" || st.code === "network" ? again() : fail(r.id, st.message).then(() => ({ state: "failed" as const }));
  if (st.status === "processing") return again();
  if (st.status === "failed") return fail(r.id, st.message ?? "The platform could not process the media.").then(() => ({ state: "failed" as const }));
  if (st.status === "published") {
    await markPublished(r.id, r.orgId, r.contentItemId, st.externalId ?? r.externalId, st.url ?? null, st);
    return { state: "published" as const };
  }
  // Ready: the container needs its publish call.
  if (!connector.finalize || !access.externalAccountId) return fail(r.id, "The processed media could not be published: no account id.").then(() => ({ state: "failed" as const }));
  const fin = await connector.finalize({ accessToken: access.token, externalAccountId: access.externalAccountId, externalId: r.externalId });
  if (!fin.ok) {
    if (fin.code === "network") return fail(r.id, "The platform did not answer the publish call. Check the account before retrying.", "UNCERTAIN").then(() => ({ state: "uncertain" as const }));
    return fin.retryable ? again() : fail(r.id, fin.message).then(() => ({ state: "failed" as const }));
  }
  await markPublished(r.id, r.orgId, r.contentItemId, fin.externalId, fin.url, fin.raw);
  return { state: "published" as const };
}

async function publishXThread(r: { id: string; orgId: string; contentItemId: string }, accessToken: string, posts: string[], replyTo?: string, alreadyPosted: string[] = []) {
  let result: Awaited<ReturnType<typeof publishThread>>;
  try {
    result = await publishThread(accessToken, posts, replyTo);
  } catch {
    // A dropped connection mid-thread: some posts may have gone out. A person checks.
    await prisma.publishRecord.update({ where: { id: r.id }, data: { status: "failed", providerStatus: "UNCERTAIN", failureReason: "The platform stopped answering partway through the thread. Check the account before continuing.", providerPayload: JSON.stringify({ postedIds: alreadyPosted, remaining: posts }) } });
    return { state: "uncertain" as const };
  }
  const posted = [...alreadyPosted, ...(result.ok ? result.ids : result.posted)];
  if (result.ok) {
    await markPublished(r.id, r.orgId, r.contentItemId, posted[0], `https://x.com/i/status/${posted[0]}`, { threadIds: posted });
    return { state: "published" as const };
  }
  if (!posted.length) {
    await fail(r.id, result.message);
    return { state: "failed" as const };
  }
  await prisma.publishRecord.update({
    where: { id: r.id },
    data: { status: "failed", providerStatus: "PARTIAL_THREAD", externalId: posted[0], failureReason: `Posted ${posted.length} of ${posted.length + (posts.length - (result.ok ? posts.length : result.posted.length))} posts, then: ${result.message}. Resume to post the rest as replies; nothing already posted is sent again.`.slice(0, 500), providerPayload: JSON.stringify({ postedIds: posted, remaining: posts.slice(result.posted.length) }) },
  });
  return { state: "partial" as const };
}

/** A person resumes a partly posted X thread: the remaining posts go out as replies to the last one posted. */
export async function resumeThread(orgId: string, recordId: string) {
  const r = await prisma.publishRecord.findFirst({ where: { id: recordId, orgId, platform: "x", providerStatus: "PARTIAL_THREAD" } });
  if (!r) throw new PublishBlocked("That record is not a partly posted thread.");
  const payload = JSON.parse(r.providerPayload ?? "{}") as { postedIds?: string[]; remaining?: string[] };
  if (!payload.postedIds?.length || !payload.remaining?.length) throw new PublishBlocked("Nothing is left to post.");
  const { token } = await accessTokenFor(orgId, "x");
  return publishXThread(r, token, payload.remaining, payload.postedIds[payload.postedIds.length - 1], payload.postedIds);
}

/** A person resolves an UNCERTAIN record after checking the platform. */
export async function resolveUncertain(orgId: string, recordId: string, outcome: { posted: true; url: string } | { posted: false }) {
  const r = await prisma.publishRecord.findFirst({ where: { id: recordId, orgId, providerStatus: "UNCERTAIN" } });
  if (!r) return false;
  if (outcome.posted) {
    await markPublished(r.id, orgId, r.contentItemId, r.externalId ?? "", outcome.url, { resolvedBy: "person" });
  } else {
    await prisma.publishRecord.update({ where: { id: r.id }, data: { status: "scheduled", providerStatus: null, failureReason: null, scheduledFor: new Date() } });
    await schedulePublish(r.id);
  }
  return true;
}

const STALE_CLAIM_MS = 15 * 60_000;

/**
 * A worker that claimed a send and then died leaves the record claimed. After
 * fifteen minutes the claim is released as UNCERTAIN (the post may have gone
 * out, so a person checks; nothing is sent again automatically). A record left
 * processing with no poll pending gets its poll queued again.
 */
export async function reapStaleClaims(now = new Date()) {
  const stale = await prisma.publishRecord.updateMany({
    where: { status: "scheduled", providerStatus: "PUBLISHING", updatedAt: { lt: new Date(now.getTime() - STALE_CLAIM_MS) } },
    data: { status: "failed", providerStatus: "UNCERTAIN", failureReason: "The worker stopped after claiming this post, so it may or may not have been published. Check the account before sending it again." },
  });
  const processing = await prisma.publishRecord.findMany({ where: { status: "scheduled", providerStatus: "PROCESSING", updatedAt: { lt: new Date(now.getTime() - 2 * 3_600_000) } }, select: { id: true, orgId: true } });
  let repolled = 0;
  for (const r of processing) {
    const pending = await prisma.job.count({ where: { type: "publish.poll", status: { in: ["queued", "running"] }, payload: { contains: r.id } } });
    if (pending) continue;
    await enqueue("publish.poll", { recordId: r.id, attempt: 1 }, { idempotencyKey: `publish.poll:${r.id}:reaped:${now.toISOString().slice(0, 13)}`, orgId: r.orgId });
    repolled++;
  }
  return { released: stale.count, repolled };
}

/** Daily tick backstop: queue any due scheduled record whose job was lost. */
export async function queueDuePublishes(now = new Date()) {
  await reapStaleClaims(now);
  const due = await prisma.publishRecord.findMany({ where: { status: "scheduled", method: "integration", scheduledFor: { lte: now }, OR: [{ providerStatus: null }, { providerStatus: { notIn: ["PUBLISHING", "PROCESSING", "UNCERTAIN"] } }] }, select: { id: true }, take: 200 });
  for (const r of due) await schedulePublish(r.id);
  return due.length;
}
