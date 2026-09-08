import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * Durable background jobs on the database.
 *
 * A job is a row: type, JSON payload, status, attempts, `runAt`, a lease
 * (`lockedAt`/`lockedBy`) and an optional idempotency key. Workers claim the
 * next runnable job with a conditional update (so two workers never run the
 * same row), execute the registered handler, and either complete it, schedule
 * a retry with exponential backoff, or mark it `dead` once attempts run out.
 * A lease older than `LEASE_MS` is treated as abandoned and re-claimable —
 * the worker that held it crashed.
 *
 * This is deliberately not a message broker. At Threadline's volume a table
 * with an index on (status, runAt) is the whole requirement, and it survives
 * a restart, which the in-process alternative did not.
 */

export const LEASE_MS = 5 * 60_000;
export const BASE_BACKOFF_MS = 30_000;
export const MAX_BACKOFF_MS = 6 * 60 * 60_000;

export type JobHandler<P = Record<string, unknown>> = (payload: P, job: { id: string; attempts: number; orgId: string | null }) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerHandler<P = Record<string, unknown>>(type: string, handler: JobHandler<P>) {
  handlers.set(type, handler as JobHandler);
}

export function registeredTypes() {
  return [...handlers.keys()];
}

export function backoffMs(attempts: number) {
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1));
}

export type EnqueueOptions = { idempotencyKey?: string; runAt?: Date; orgId?: string | null; maxAttempts?: number };

/**
 * Enqueue. With an idempotency key the second call returns the existing row —
 * the caller can enqueue "send this invite" from a retried request without
 * two emails going out.
 */
export async function enqueue(type: string, payload: Record<string, unknown>, opts: EnqueueOptions = {}) {
  if (opts.idempotencyKey) {
    const existing = await prisma.job.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
    if (existing) return { job: existing, created: false };
  }
  try {
    const job = await prisma.job.create({
      data: {
        type,
        payload: JSON.stringify(payload),
        runAt: opts.runAt ?? new Date(),
        orgId: opts.orgId ?? null,
        maxAttempts: opts.maxAttempts ?? 5,
        idempotencyKey: opts.idempotencyKey ?? null,
      },
    });
    return { job, created: true };
  } catch (error) {
    // Unique collision from a concurrent enqueue with the same key.
    if (opts.idempotencyKey && String(error).includes("Unique")) {
      const existing = await prisma.job.findUniqueOrThrow({ where: { idempotencyKey: opts.idempotencyKey } });
      return { job: existing, created: false };
    }
    throw error;
  }
}

/** Claim the next runnable job for this worker, or null. Conditional update = the lock. */
export async function claimNext(workerId: string, types?: string[]) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - LEASE_MS);
  const candidates = await prisma.job.findMany({
    where: {
      OR: [
        { status: "queued", runAt: { lte: now } },
        { status: "running", lockedAt: { lt: staleBefore } }, // abandoned lease
      ],
      ...(types ? { type: { in: types } } : {}),
    },
    orderBy: { runAt: "asc" },
    take: 5,
    select: { id: true, status: true, lockedAt: true },
  });
  for (const c of candidates) {
    const claimed = await prisma.job.updateMany({
      where: { id: c.id, status: c.status, lockedAt: c.lockedAt },
      data: { status: "running", lockedAt: now, lockedBy: workerId, attempts: { increment: 1 } },
    });
    if (claimed.count === 1) return prisma.job.findUniqueOrThrow({ where: { id: c.id } });
  }
  return null;
}

export async function complete(id: string) {
  await prisma.job.update({ where: { id }, data: { status: "succeeded", completedAt: new Date(), lockedAt: null, lockedBy: null, lastError: null } });
}

export async function fail(id: string, error: unknown) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id } });
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
  if (job.attempts >= job.maxAttempts) {
    await prisma.job.update({ where: { id }, data: { status: "dead", lastError: message, lockedAt: null, lockedBy: null } });
    return "dead" as const;
  }
  await prisma.job.update({
    where: { id },
    data: { status: "queued", lastError: message, lockedAt: null, lockedBy: null, runAt: new Date(Date.now() + backoffMs(job.attempts)) },
  });
  return "retry" as const;
}

/** Run at most one job. Returns what happened so callers (and tests) can assert on it. */
export async function runOnce(workerId: string, types?: string[]): Promise<{ id: string; type: string; outcome: "succeeded" | "retry" | "dead" | "no_handler" } | null> {
  const job = await claimNext(workerId, types);
  if (!job) return null;
  const handler = handlers.get(job.type);
  if (!handler) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "dead", lastError: `No handler registered for "${job.type}"`, lockedAt: null, lockedBy: null } });
    return { id: job.id, type: job.type, outcome: "no_handler" };
  }
  try {
    await handler(JSON.parse(job.payload) as Record<string, unknown>, { id: job.id, attempts: job.attempts, orgId: job.orgId });
    await complete(job.id);
    return { id: job.id, type: job.type, outcome: "succeeded" };
  } catch (error) {
    const outcome = await fail(job.id, error);
    return { id: job.id, type: job.type, outcome };
  }
}

/** Drain until nothing is runnable (bounded). Used by the dev worker tick and by tests. */
export async function drain(workerId: string, limit = 50) {
  const results = [];
  for (let i = 0; i < limit; i++) {
    const r = await runOnce(workerId);
    if (!r) break;
    results.push(r);
  }
  return results;
}

/** Operator view. */
export async function jobSummary() {
  const rows = await prisma.job.groupBy({ by: ["status"], _count: { _all: true } });
  const dead = await prisma.job.findMany({ where: { status: "dead" }, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, type: true, lastError: true, attempts: true, updatedAt: true } });
  return { counts: Object.fromEntries(rows.map((r) => [r.status, r._count._all])), dead };
}

/** Put a dead job back in the queue with a fresh attempt budget. */
export async function requeueDead(id: string) {
  await prisma.job.update({ where: { id }, data: { status: "queued", attempts: 0, runAt: new Date(), lastError: null } });
}
