/**
 * Development / single-box job worker.
 *
 *   npm run jobs:worker            — poll forever
 *   npm run jobs:worker -- --once  — drain what is runnable and exit
 *
 * Production can run this same process under a supervisor, or call
 * `runOnce()` from a scheduled invocation (cron, a platform scheduler) —
 * the queue is the database, so any number of workers may share it.
 */
import "../../src/lib/jobs/handlers";
import { drain, jobSummary } from "../../src/lib/jobs";
import { prisma } from "../../src/lib/db/client";

const once = process.argv.includes("--once");
const intervalMs = Number(process.env.JOBS_POLL_MS ?? 5000);
const workerId = `${process.env.HOSTNAME ?? "worker"}-${process.pid}`;

async function tick() {
  const results = await drain(workerId);
  for (const r of results) console.log(`[jobs] ${r.type} ${r.id} → ${r.outcome}`);
  return results.length;
}

(async () => {
  console.log(`[jobs] worker ${workerId} started (${once ? "once" : `poll every ${intervalMs}ms`})`);
  if (once) {
    await tick();
    console.log("[jobs]", JSON.stringify(await jobSummary()));
    await prisma.$disconnect();
    return;
  }
  for (;;) {
    try {
      await tick();
    } catch (error) {
      console.error("[jobs] tick failed", error);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
})();
