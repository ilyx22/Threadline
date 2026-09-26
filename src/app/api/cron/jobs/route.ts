import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import "@/lib/jobs/handlers";
import { drainFor, enqueue, jobSummary } from "@/lib/jobs";
import { log, reportError } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/jobs (JOB-01). The scheduled runner for the database queue.
 *
 * Vercel Cron calls it with `Authorization: Bearer $CRON_SECRET` (vercel.json);
 * any external scheduler can call it the same way. Without CRON_SECRET set it
 * refuses every call. It claims work for at most 45 seconds, leaving margin
 * under the 60-second function limit; leases (5 minutes) make an interrupted
 * run safe, since unfinished jobs are reclaimed by the next one.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok = secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: secret ? "unauthorised" : "CRON_SECRET is not configured" }, { status: secret ? 401 : 503 });

  const workerId = `cron-${crypto.randomUUID().slice(0, 8)}`;
  try {
    // One housekeeping run per UTC day, however often the runner is called.
    await enqueue("daily.tick", {}, { idempotencyKey: `daily.tick:${new Date().toISOString().slice(0, 10)}` });
    const results = await drainFor(workerId, 45_000);
    const summary = await jobSummary();
    const byOutcome = results.reduce<Record<string, number>>((a, r) => ((a[r.outcome] = (a[r.outcome] ?? 0) + 1), a), {});
    log("info", "cron.jobs", { workerId, ran: results.length, byOutcome, queue: summary.counts });
    return NextResponse.json({ ran: results.length, byOutcome, queue: summary.counts, dead: summary.dead.length }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    await reportError(error, { event: "cron.jobs", workerId });
    return NextResponse.json({ error: "runner failed" }, { status: 500 });
  }
}
