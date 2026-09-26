import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { configReport } from "@/lib/env";
import { reportError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * GET /api/health (INF-06). Public, so it reveals no configuration detail:
 * overall status, whether the database answers, how many configuration
 * errors exist (not which), and the deployed commit. Staff see the full
 * report on the admin system screen. 200 when healthy, 503 otherwise.
 */
export async function GET() {
  const started = Date.now();
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (error) {
    await reportError(error, { event: "health.database" });
  }
  const { env, issues } = configReport();
  const configErrors = issues.filter((i) => i.level === "error").length;
  const status = !database ? "down" : configErrors ? "degraded" : "ok";
  return NextResponse.json(
    { status, database, configErrors, env, commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7), ms: Date.now() - started },
    { status: database ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
