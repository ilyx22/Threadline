import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { fingerprint } from "./approvals";

/**
 * Internal QA and turnaround (DEL-06).
 *
 * A QA pass records the editor checklist against the exact cut it checked; a
 * newer cut needs its own pass. Turnaround is read from the content history
 * (when a piece first went to review and when it was approved), so the numbers
 * are what happened, not what was planned.
 */
export const QA_CHECKS = [
  { key: "right_version", label: "Correct script version, source files, platform and format" },
  { key: "hook", label: "Hook lands immediately" },
  { key: "pacing", label: "Dead time removed; pacing supports comprehension" },
  { key: "captions", label: "Captions accurate and legible" },
  { key: "audio", label: "Audio levels and noise acceptable" },
  { key: "rights", label: "No uncleared assets" },
  { key: "claims", label: "No invented proof, statistics or claims; on-screen facts traced to the approved script" },
  { key: "cta", label: "CTA matches the approved strategy" },
  { key: "voice", label: "The founder still sounds like the founder" },
  { key: "banned", label: "No banned phrases or topics" },
  { key: "export", label: "Export quality, filename and version checked" },
] as const;
export type QaKey = (typeof QA_CHECKS)[number]["key"];

export async function recordQaReview(orgId: string, reviewerId: string, contentItemId: string, input: { checks: { key: string; pass: boolean; note?: string }[]; notes?: string }) {
  const fp = await fingerprint(orgId, { type: "content_item", id: contentItemId });
  if (!fp) throw new WorkflowError("That piece no longer exists.");
  const known = new Set<string>(QA_CHECKS.map((c) => c.key));
  const checks = input.checks.filter((c) => known.has(c.key)).map((c) => ({ key: c.key, pass: Boolean(c.pass), note: c.note?.trim().slice(0, 300) || undefined }));
  const missing = QA_CHECKS.filter((c) => !checks.some((x) => x.key === c.key));
  if (missing.length) throw new WorkflowError(`Answer every check (missing: ${missing.map((m) => m.label).join("; ")}).`);
  const failed = checks.filter((c) => !c.pass);
  if (failed.some((c) => !c.note)) throw new WorkflowError("Say what is wrong for each failed check.");
  return prisma.qaReview.create({ data: { orgId, contentItemId, versionLabel: fp.label, reviewerId, checks: JSON.stringify(checks), result: failed.length ? "fail" : "pass", notes: input.notes?.trim().slice(0, 1000) || null } });
}

/** The latest QA pass, and whether it covers the current cut. */
export async function currentQa(orgId: string, contentItemId: string) {
  const [latest, fp] = await Promise.all([
    prisma.qaReview.findFirst({ where: { orgId, contentItemId }, orderBy: { createdAt: "desc" } }),
    fingerprint(orgId, { type: "content_item", id: contentItemId }),
  ]);
  return latest ? { ...latest, checks: JSON.parse(latest.checks) as { key: string; pass: boolean; note?: string }[], current: latest.versionLabel === fp?.label } : null;
}

const H = 3_600_000;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * Turnaround over a window, from recorded history: hours from creation to the
 * first review, from first review to approval, and revision rounds, overall
 * and per editor. Only pieces approved in the window count.
 */
export async function turnaround(since: Date, orgId?: string) {
  const approvedEvents = await prisma.contentEvent.findMany({ where: { toStage: "approved", createdAt: { gte: since }, ...(orgId ? { orgId } : {}) }, select: { contentItemId: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  const ids = [...new Set(approvedEvents.map((e) => e.contentItemId))];
  if (!ids.length) return { pieces: 0, toReviewHours: null, reviewToApprovalHours: null, revisions: null, byEditor: [] as { editor: string; pieces: number; toApprovalHours: number | null; revisions: number | null }[] };
  const [items, reviews] = await Promise.all([
    prisma.contentItem.findMany({ where: { id: { in: ids } }, select: { id: true, createdAt: true, revisionCount: true, editor: { select: { name: true } } } }),
    prisma.contentEvent.findMany({ where: { contentItemId: { in: ids }, toStage: "in_review" }, select: { contentItemId: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const rows = items.map((i) => {
    const firstReview = reviews.find((r) => r.contentItemId === i.id)?.createdAt ?? null;
    const approved = approvedEvents.find((e) => e.contentItemId === i.id)!.createdAt;
    return {
      editor: i.editor?.name ?? "Unassigned",
      toReview: firstReview ? (firstReview.getTime() - i.createdAt.getTime()) / H : null,
      reviewToApproval: firstReview ? (approved.getTime() - firstReview.getTime()) / H : null,
      toApproval: (approved.getTime() - i.createdAt.getTime()) / H,
      revisions: i.revisionCount ?? 0,
    };
  });
  const round = (v: number | null) => (v === null ? null : Math.round(v * 10) / 10);
  const editors = [...new Set(rows.map((r) => r.editor))];
  return {
    pieces: rows.length,
    toReviewHours: round(median(rows.flatMap((r) => (r.toReview === null ? [] : [r.toReview])))),
    reviewToApprovalHours: round(median(rows.flatMap((r) => (r.reviewToApproval === null ? [] : [r.reviewToApproval])))),
    revisions: round(median(rows.map((r) => r.revisions))),
    byEditor: editors.map((e) => {
      const mine = rows.filter((r) => r.editor === e);
      return { editor: e, pieces: mine.length, toApprovalHours: round(median(mine.map((r) => r.toApproval))), revisions: round(median(mine.map((r) => r.revisions))) };
    }),
  };
}
