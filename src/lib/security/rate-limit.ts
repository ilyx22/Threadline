import "server-only";
import { headers } from "next/headers";

/**
 * In-memory sliding-window rate limiter.
 *
 * Scoped to a single server instance, which is the correct trade-off for v1:
 * it stops credential stuffing and form abuse from one origin without adding a
 * Redis dependency. A multi-instance deployment should swap the `hits` map for a
 * shared store — the call sites do not change. Documented in HANDOFF.md.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Opportunistic cleanup so the map cannot grow without bound.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of buckets) {
    if (window.resetAt < now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    remaining: options.limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Caller identity for rate limiting. Falls back to a constant when no IP is present. */
export async function callerKey(prefix: string) {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

export const LIMITS = {
  login: { limit: 6, windowMs: 10 * 60_000 },
  application: { limit: 5, windowMs: 60 * 60_000 },
  aiGeneration: { limit: 40, windowMs: 60 * 60_000 },
  upload: { limit: 60, windowMs: 60 * 60_000 },
} as const;

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, message?: string) {
    super(
      message ??
        `Too many attempts. Try again in ${
          retryAfterSeconds > 60
            ? `${Math.ceil(retryAfterSeconds / 60)} minutes`
            : `${retryAfterSeconds} seconds`
        }.`,
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Throwing variant for server actions. */
export async function enforceRateLimit(
  prefix: string,
  options: { limit: number; windowMs: number },
) {
  const key = await callerKey(prefix);
  const result = rateLimit(key, options);
  if (!result.ok) throw new RateLimitError(result.retryAfterSeconds);
  return result;
}

/** Exposed for tests. */
export function __resetRateLimits() {
  buckets.clear();
}
