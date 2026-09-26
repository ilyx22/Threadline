import "server-only";
import "./handlers";
import { registeredTypes, runOnce } from "./index";
import { reportError } from "@/lib/log";

/**
 * Run a few runnable jobs right after the current response (JOB-01), so an
 * invitation or confirmation goes out in seconds instead of waiting for the
 * scheduled runner. Only registered types are claimed, bounded to five jobs;
 * the cron runner remains the backstop for anything left over.
 */
export async function runSoon(limit = 5) {
  const types = registeredTypes();
  const workerId = `after-${crypto.randomUUID().slice(0, 8)}`;
  try {
    for (let i = 0; i < limit; i++) if (!(await runOnce(workerId, types))) break;
  } catch (error) {
    await reportError(error, { event: "jobs.run_soon", workerId });
  }
}
