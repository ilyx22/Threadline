import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";
import { getStorage } from "@/lib/storage";

/**
 * Media processing (FILE-05): transcoding, transcription and thumbnails are
 * done by an external worker, never inside a request.
 *
 * Contract (PROCESSING_PROVIDER=webhook):
 *   submit    POST PROCESSING_ENDPOINT, JSON { taskId, kind, source: { url,
 *             mimeType, sizeBytes, fileName }, callbackUrl }. The source URL
 *             is a signed storage GET that lives 30 minutes.
 *   callback  POST /api/processing/callback, JSON { taskId, status:
 *             processing | succeeded | failed, externalId?, error?, output? }.
 *   Both directions carry `X-Threadline-Signature: t=<unix>,v1=<hex
 *   HMAC-SHA256(PROCESSING_WEBHOOK_SECRET, "<t>.<body>")>`, and deliveries
 *   older than five minutes are refused.
 *
 * States only move forward (queued, submitted, processing, then succeeded,
 * failed or cancelled), so a late or repeated callback never undoes a result.
 * Without a configured provider, tasks wait as `queued` and are submitted by
 * the daily tick once one is configured.
 */
export const PROCESSING_KINDS = ["transcode", "transcribe", "thumbnail"] as const;
export type ProcessingKind = (typeof PROCESSING_KINDS)[number];

const RANK: Record<string, number> = { queued: 0, submitted: 1, processing: 2, succeeded: 3, failed: 3, cancelled: 3 };
const TOLERANCE_S = 300;

type Env = Record<string, string | undefined>;
export function processingConfig(env: Env = process.env) {
  if ((env.PROCESSING_PROVIDER ?? "none") !== "webhook") return null;
  const endpoint = env.PROCESSING_ENDPOINT ?? "";
  const secret = env.PROCESSING_WEBHOOK_SECRET ?? "";
  if (!/^https:\/\//.test(endpoint) || secret.length < 16) return null;
  return { endpoint, secret };
}

export function kindsFor(mimeType: string | null): ProcessingKind[] {
  if (!mimeType) return [];
  if (mimeType.startsWith("video/")) return ["transcode", "transcribe", "thumbnail"];
  if (mimeType.startsWith("audio/")) return ["transcribe"];
  return [];
}

export function sign(body: string, secret: string, now = Date.now()) {
  const t = Math.floor(now / 1000);
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}

/** True when the header signs this exact body with the secret, within five minutes. */
export function verifySignature(body: string, header: string | null, secret: string, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > TOLERANCE_S || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest();
  const given = Buffer.from(parts.v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Create the processing tasks a new file needs, and submit them if a provider is configured. */
export async function queueProcessingFor(asset: { id: string; orgId: string; mimeType: string | null }) {
  const kinds = kindsFor(asset.mimeType);
  if (!kinds.length) return [];
  const provider = processingConfig() ? "webhook" : "none";
  await prisma.processingTask.createMany({ data: kinds.map((kind) => ({ orgId: asset.orgId, assetId: asset.id, kind, provider })), skipDuplicates: true });
  await prisma.asset.update({ where: { id: asset.id }, data: { processingState: "queued" } });
  const tasks = await prisma.processingTask.findMany({ where: { assetId: asset.id, status: "queued" }, select: { id: true } });
  if (provider === "webhook") for (const t of tasks) await enqueue("processing.submit", { taskId: t.id }, { idempotencyKey: `processing.submit:${t.id}`, orgId: asset.orgId });
  return tasks;
}

/** Submit one queued task to the worker (job handler). Safe to run twice: only a queued task is sent. */
export async function submitTask(taskId: string, fetchImpl: typeof fetch = fetch) {
  const cfg = processingConfig();
  if (!cfg) return { submitted: false, reason: "no provider" as const };
  const task = await prisma.processingTask.findUnique({ where: { id: taskId }, include: { asset: true } });
  if (!task || task.status !== "queued") return { submitted: false, reason: "not queued" as const };
  const store = getStorage() as { signedGetUrl?: (path: string, seconds?: number) => string };
  if (!task.asset.storagePath || !store.signedGetUrl) {
    await prisma.processingTask.update({ where: { id: task.id }, data: { error: "The worker needs S3 storage to fetch the file." } });
    return { submitted: false, reason: "storage" as const };
  }
  const body = JSON.stringify({
    taskId: task.id,
    kind: task.kind,
    source: { url: store.signedGetUrl(task.asset.storagePath, 1800), mimeType: task.asset.mimeType, sizeBytes: task.asset.sizeBytes, fileName: task.asset.fileName },
    callbackUrl: `${appUrl()}/api/processing/callback`,
  });
  await prisma.processingTask.update({ where: { id: task.id }, data: { attempts: { increment: 1 } } });
  const res = await fetchImpl(cfg.endpoint, { method: "POST", headers: { "content-type": "application/json", "x-threadline-signature": sign(body, cfg.secret) }, body });
  if (!res.ok) throw new Error(`Processing worker refused the task (${res.status}).`);
  const reply = (await res.json().catch(() => ({}))) as { externalId?: unknown };
  const externalId = typeof reply.externalId === "string" ? reply.externalId.slice(0, 200) : null;
  await prisma.processingTask.updateMany({ where: { id: task.id, status: "queued" }, data: { status: "submitted", provider: "webhook", externalId, submittedAt: new Date(), error: null } });
  await refreshAssetState(task.assetId);
  return { submitted: true as const };
}

export type CallbackEvent = {
  taskId: string;
  status: "processing" | "succeeded" | "failed";
  externalId?: string;
  error?: string;
  output?: { transcript?: string; durationMs?: number; width?: number; height?: number; renditions?: { label: string; mimeType?: string }[] };
};

export function parseCallback(raw: unknown): CallbackEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.taskId !== "string" || !["processing", "succeeded", "failed"].includes(String(r.status))) return null;
  return {
    taskId: r.taskId,
    status: r.status as CallbackEvent["status"],
    externalId: typeof r.externalId === "string" ? r.externalId.slice(0, 200) : undefined,
    error: typeof r.error === "string" ? r.error.slice(0, 1000) : undefined,
    output: r.output && typeof r.output === "object" ? (r.output as CallbackEvent["output"]) : undefined,
  };
}

/** Apply a verified callback. Returns whether it changed anything. */
export async function applyCallback(event: CallbackEvent) {
  const task = await prisma.processingTask.findUnique({ where: { id: event.taskId }, include: { asset: { select: { id: true, orgId: true, contentItemId: true, title: true, rootId: true } } } });
  if (!task) return { applied: false, reason: "unknown task" };
  const lower = Object.keys(RANK).filter((s) => RANK[s] < RANK[event.status]);
  const now = new Date();

  let outputAssetId: string | null = null;
  let result: string | null = null;
  if (event.status === "succeeded") {
    const out = event.output ?? {};
    const transcript = typeof out.transcript === "string" ? out.transcript.slice(0, 2_000_000) : "";
    const summary = {
      durationMs: typeof out.durationMs === "number" ? Math.round(out.durationMs) : undefined,
      width: typeof out.width === "number" ? out.width : undefined,
      height: typeof out.height === "number" ? out.height : undefined,
      renditions: Array.isArray(out.renditions) ? out.renditions.slice(0, 10).map((x) => ({ label: String(x.label).slice(0, 40), mimeType: x.mimeType ? String(x.mimeType).slice(0, 80) : undefined })) : undefined,
      transcriptChars: transcript ? transcript.length : undefined,
    };
    result = JSON.stringify(summary);
    // Claim the transition first, so two concurrent success callbacks store one transcript.
    const claimed = await prisma.processingTask.updateMany({ where: { id: task.id, status: { in: lower } }, data: { status: "succeeded", result, lastEventAt: now, completedAt: now, externalId: event.externalId ?? task.externalId, error: null } });
    if (claimed.count !== 1) return { applied: false, reason: "already final" };
    if (task.kind === "transcribe" && transcript) {
      const file = new File([transcript], `${(task.asset.title || "transcript").slice(0, 80)}.txt`, { type: "text/plain" });
      const stored = await getStorage().put({ orgId: task.orgId, file, prefix: "transcripts" });
      const a = await prisma.asset.create({
        data: { orgId: task.orgId, contentItemId: task.asset.contentItemId, category: "transcript", title: `Transcript: ${task.asset.title}`.slice(0, 240), fileName: stored.fileName, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes, storagePath: stored.storagePath, storageProvider: (getStorage() as { name?: string }).name ?? "local", source: "processing", sourceNote: `Transcribed from "${task.asset.title}" (asset ${task.asset.id}) by the processing worker`, rootId: task.asset.rootId },
      });
      outputAssetId = a.id;
      await prisma.processingTask.update({ where: { id: task.id }, data: { outputAssetId } });
    }
  } else {
    const changed = await prisma.processingTask.updateMany({
      where: { id: task.id, status: { in: lower } },
      data: { status: event.status, lastEventAt: now, externalId: event.externalId ?? task.externalId, ...(event.status === "failed" ? { error: event.error ?? "The worker reported a failure.", completedAt: now } : {}) },
    });
    if (changed.count !== 1) return { applied: false, reason: "out of order or already final" };
  }
  await refreshAssetState(task.assetId);
  return { applied: true, outputAssetId };
}

/** The file's overall processing state, from its tasks. */
export async function refreshAssetState(assetId: string) {
  const tasks = await prisma.processingTask.findMany({ where: { assetId }, select: { status: true } });
  const s = tasks.map((t) => t.status);
  const state = !s.length
    ? "none"
    : s.includes("failed")
      ? "failed"
      : s.every((x) => x === "succeeded" || x === "cancelled")
        ? "ready"
        : s.some((x) => x === "submitted" || x === "processing")
          ? "processing"
          : "queued";
  await prisma.asset.update({ where: { id: assetId }, data: { processingState: state } });
  return state;
}

/** Daily tick: submit tasks that waited for a provider, and requeue a failed task on request. */
export async function submitWaitingTasks() {
  if (!processingConfig()) return 0;
  const waiting = await prisma.processingTask.findMany({ where: { status: "queued" }, select: { id: true, orgId: true }, take: 200 });
  for (const t of waiting) await enqueue("processing.submit", { taskId: t.id }, { idempotencyKey: `processing.submit:${t.id}:${new Date().toISOString().slice(0, 10)}`, orgId: t.orgId });
  return waiting.length;
}

/** Staff action: send a failed task again. */
export async function retryTask(taskId: string, orgId: string) {
  const r = await prisma.processingTask.updateMany({ where: { id: taskId, orgId, status: "failed" }, data: { status: "queued", error: null, completedAt: null } });
  if (r.count !== 1) return false;
  const t = await prisma.processingTask.findUniqueOrThrow({ where: { id: taskId } });
  await refreshAssetState(t.assetId);
  if (processingConfig()) await enqueue("processing.submit", { taskId }, { idempotencyKey: `processing.submit:${taskId}:retry:${t.attempts}`, orgId });
  return true;
}
