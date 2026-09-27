import "server-only";
import { prisma } from "@/lib/db/client";
import { enqueue } from "@/lib/jobs";
import { notify } from "@/lib/notify";
import { appUrl } from "@/lib/app-url";
import { StorageError } from "./index";
import { budgetFromEnv, crossedThresholds, estimateMonthlyGbp, formatGb, type StorageBudget } from "./budget-math";

/**
 * Storage spending cap (owner decision, 27 September 2026).
 *
 * Cloudflare R2 has no hard spending limit and the owner has no capped card,
 * so the cap lives here: the monthly budget in pounds is turned into a total
 * stored-bytes ceiling (see budget-math.ts). New uploads are refused once the
 * ceiling would be passed, and staff are alerted as usage crosses the free
 * tier and parts of the budget. Data exports and offboarding exports are never
 * blocked: they are a contractual obligation, and they expire on their own.
 */

/** Bytes stored now, plus bytes reserved by direct uploads still in progress. */
export async function storedBytes(): Promise<number> {
  // Summed in SQL as float8: sizeBytes is a 32-bit column, and a Prisma
  // aggregate over it would overflow once the total passes about 2 GB.
  const rows = await prisma.$queryRaw<{ total: number }[]>`
    SELECT
      COALESCE((SELECT SUM("sizeBytes")::float8 FROM "Asset" WHERE "storagePath" IS NOT NULL), 0)
      + COALESCE((SELECT SUM("sizeBytes")::float8 FROM "UploadSession" WHERE "status" = 'uploading'), 0) AS total`;
  return Number(rows[0]?.total ?? 0);
}

/** Refuse an upload that would take total storage past the budget ceiling. */
export async function assertStorageBudget(additionalBytes: number, budget: StorageBudget = budgetFromEnv()) {
  const used = await storedBytes();
  if (used + Math.max(0, additionalBytes) > budget.capBytes) {
    throw new StorageError(
      `Storage is at its spending cap (${formatGb(used)} of ${formatGb(budget.capBytes)}, about £${budget.budgetGbp} a month). ` +
        "Delete files you no longer need, or ask the owner to raise STORAGE_BUDGET_GBP.",
    );
  }
}

/**
 * Daily: alert Threadline staff once per threshold per calendar month, in-app
 * and by email to OPS_NOTIFY_EMAIL when set.
 */
export async function checkStorageBudget(now = new Date(), budget: StorageBudget = budgetFromEnv()) {
  const used = await storedBytes();
  const crossed = crossedThresholds(used, budget);
  if (!crossed.length) return { used, alerted: [] as string[] };

  const internal = await prisma.organization.findFirst({ where: { kind: "internal" }, select: { id: true } });
  const staff = internal
    ? (await prisma.membership.findMany({ where: { orgId: internal.id, status: "active", role: { in: ["super_admin", "internal_operator"] } }, select: { userId: true } })).map((m) => m.userId)
    : [];
  const month = now.toISOString().slice(0, 7);
  const estimate = estimateMonthlyGbp(used, budget);
  const alerted: string[] = [];
  for (const t of crossed) {
    const dedupeKey = `storage-budget:${t.key}:${month}`;
    const title = t.title;
    const body = `${formatGb(used)} stored. Estimated R2 cost about £${estimate.toFixed(2)} a month; uploads stop at ${formatGb(budget.capBytes)} (£${budget.budgetGbp} budget).`;
    if (internal && staff.length) {
      await notify({ orgId: internal.id, audience: { userIds: staff }, kind: "storage_budget", title, body, href: "/admin/system", severity: t.severity, dedupeKey, now });
    }
    const ops = process.env.OPS_NOTIFY_EMAIL?.trim();
    if (ops) {
      await enqueue("email.send", { to: ops, template: "notification", data: { name: "Threadline", title, body, link: `${appUrl()}/admin/system` } }, { idempotencyKey: dedupeKey });
    }
    alerted.push(t.key);
  }
  return { used, alerted };
}
