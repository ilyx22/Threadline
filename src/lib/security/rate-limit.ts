import "server-only";
import { headers } from "next/headers";
import { clientIpFrom } from "./client-ip";

/**
 * Sliding-window rate limiter with a pluggable store.
 *
 * `memory` (default) is scoped to one server instance — right for a single
 * box and for development. `redis` uses an Upstash-compatible REST endpoint
 * (plain `fetch`, no client dependency) so every instance shares one window.
 *
 * Failure policy is explicit: when `RATE_LIMIT_STORE=redis` the limiter
 * FAILS CLOSED if the store cannot be reached — a login or application
 * endpoint that silently stops limiting because Redis blinked is the
 * failure this module exists to prevent. Set `RATE_LIMIT_FAIL_OPEN=true`
 * only for a deployment that has decided availability beats abuse control.
 */

type Window = { count: number; resetAt: number };

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export interface RateLimitStore {
  readonly name: string;
  /** Increment the window for `key`; returns the count and the window's reset time. */
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  reset(): Promise<void>;
}

/* ------------------------------- memory store ------------------------------ */

const buckets = new Map<string, Window>();
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of buckets) if (window.resetAt < now) buckets.delete(key);
}

function hitMemory(key: string, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const w = { count: 1, resetAt: now + windowMs };
    buckets.set(key, w);
    return w;
  }
  existing.count += 1;
  return existing;
}

export const memoryStore: RateLimitStore = {
  name: "memory",
  async hit(key, windowMs) {
    return hitMemory(key, windowMs);
  },
  async reset() {
    buckets.clear();
  },
};

/* ------------------------------- redis store ------------------------------- */

/**
 * Upstash REST protocol: POST an array command, get `{ result }`. Any
 * Redis-with-REST proxy that speaks the same shape works. Window key expiry is
 * set on first hit so abandoned keys disappear on their own.
 */
export function redisRestStore(url: string, token: string, fetchImpl: typeof fetch = fetch): RateLimitStore {
  async function command<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`rate-limit store responded ${res.status}`);
    const json = (await res.json()) as { result: T; error?: string };
    if (json.error) throw new Error(json.error);
    return json.result;
  }
  return {
    name: "redis",
    async hit(key, windowMs) {
      const count = await command<number>("INCR", `rl:${key}`);
      let ttl = await command<number>("PTTL", `rl:${key}`);
      if (count === 1 || ttl < 0) {
        await command("PEXPIRE", `rl:${key}`, windowMs);
        ttl = windowMs;
      }
      return { count, resetAt: Date.now() + ttl };
    },
    async reset() {
      /* shared state is not cleared from a single instance */
    },
  };
}

/* ------------------------------- selection --------------------------------- */

let store: RateLimitStore | null = null;

export function configuredStore(): RateLimitStore {
  if (store) return store;
  const mode = process.env.RATE_LIMIT_STORE ?? "memory";
  if (mode === "redis") {
    const url = process.env.RATE_LIMIT_REDIS_URL;
    const token = process.env.RATE_LIMIT_REDIS_TOKEN;
    if (!url || !token) throw new Error("RATE_LIMIT_STORE=redis needs RATE_LIMIT_REDIS_URL and RATE_LIMIT_REDIS_TOKEN");
    store = redisRestStore(url, token);
  } else {
    store = memoryStore;
  }
  return store;
}

/** Test seam. */
export function __setRateLimitStore(next: RateLimitStore | null) {
  store = next;
}

function decide(window: { count: number; resetAt: number }, limit: number): RateLimitResult {
  if (window.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - Date.now()) / 1000)) };
  }
  return { ok: true, remaining: limit - window.count, retryAfterSeconds: 0 };
}

/** Synchronous, memory-only. Kept for call sites that cannot await. */
export function rateLimit(key: string, options: { limit: number; windowMs: number }): RateLimitResult {
  return decide(hitMemory(key, options.windowMs), options.limit);
}

/** Store-backed variant. Fails closed on a store error unless explicitly told otherwise. */
export async function rateLimitAsync(key: string, options: { limit: number; windowMs: number }): Promise<RateLimitResult> {
  const s = configuredStore();
  try {
    return decide(await s.hit(key, options.windowMs), options.limit);
  } catch (error) {
    if (s.name === "memory") throw error;
    if (process.env.RATE_LIMIT_FAIL_OPEN === "true") {
      console.warn("[rate-limit] store unavailable, failing OPEN by configuration:", error instanceof Error ? error.message : error);
      return { ok: true, remaining: options.limit, retryAfterSeconds: 0 };
    }
    console.error("[rate-limit] store unavailable, failing CLOSED:", error instanceof Error ? error.message : error);
    return { ok: false, remaining: 0, retryAfterSeconds: 30 };
  }
}

/** Caller identity for rate limiting. Falls back to a constant when no IP is present. */
export async function callerKey(prefix: string) {
  // SEC-03: only proxy-set headers are trusted; see client-ip.ts.
  const ip = clientIpFrom(await headers()) ?? "unknown";
  return `${prefix}:${ip}`;
}

export const LIMITS = {
  login: { limit: 6, windowMs: 10 * 60_000 },
  /// Per account, across all addresses (SEC-06): slows a distributed guess
  /// against one mailbox without locking it for long.
  loginAccount: { limit: 10, windowMs: 15 * 60_000 },
  application: { limit: 5, windowMs: 60 * 60_000 },
  aiGeneration: { limit: 40, windowMs: 60 * 60_000 },
  upload: { limit: 60, windowMs: 60 * 60_000 },
  passwordReset: { limit: 5, windowMs: 60 * 60_000 },
  webhook: { limit: 600, windowMs: 60_000 },
} as const;

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, message?: string) {
    super(
      message ??
        `Too many attempts. Try again in ${
          retryAfterSeconds > 60 ? `${Math.ceil(retryAfterSeconds / 60)} minutes` : `${retryAfterSeconds} seconds`
        }.`,
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Throwing variant for server actions. */
export async function enforceRateLimit(prefix: string, options: { limit: number; windowMs: number }) {
  const key = await callerKey(prefix);
  const result = await rateLimitAsync(key, options);
  if (!result.ok) throw new RateLimitError(result.retryAfterSeconds);
  return result;
}

/** Exposed for tests. */
export function __resetRateLimits() {
  buckets.clear();
}
