import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson, parseStringArray } from "@/lib/db/json";
import type { Claim } from "@/lib/domain/workflow";

/**
 * Lineage resolution — the organisational memory the product is selling.
 *
 * Given a content item, reconstruct the entire chain that produced it and
 * everything it produced in turn:
 *
 *   research signal -> pattern -> idea -> script (+ hook chosen, claims verified)
 *     -> content item (+ who approved, when, how many revisions)
 *       -> publish records -> performance -> commercial signal -> learning
 *
 * Implemented as explicit relations rather than inference, so this is a query
 * with a definite answer rather than a guess (docs/DATA_MODEL.md section 11).
 */

export type LineageStep = {
  key: string;
  stage: string;
  title: string;
  detail?: string;
  meta?: string;
  href?: string;
  status?: "complete" | "current" | "pending";
  actor?: string;
  at?: Date | null;
};

export async function contentLineage(orgId: string, contentItemId: string, orgSlug: string) {
  const item = await prisma.contentItem.findFirst({
    where: { id: contentItemId, orgId },
    include: {
      approvedBy: { select: { name: true } },
      founder: { select: { name: true } },
      editor: { select: { name: true } },
      idea: {
        include: {
          pattern: {
            include: {
              evidence: {
                include: { researchItem: { select: { id: true, title: true, kind: true } } },
              },
            },
          },
          evidence: {
            include: {
              researchItem: {
                select: { id: true, title: true, kind: true, sourceName: true, url: true },
              },
            },
          },
        },
      },
      script: {
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      },
      publishRecords: {
        include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 1 } },
      },
      inquiries: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!item) return null;

  const steps: LineageStep[] = [];
  const base = `/app/${orgSlug}`;

  /* 1. Research signal */
  const researchItems = [
    ...(item.idea?.evidence.map((e) => e.researchItem) ?? []),
    ...(item.idea?.pattern?.evidence.map((e) => e.researchItem).filter(Boolean) ?? []),
  ].filter((r): r is NonNullable<typeof r> => Boolean(r));

  const uniqueResearch = dedupeById(researchItems);

  if (uniqueResearch.length > 0) {
    steps.push({
      key: "research",
      stage: "Research signal",
      title:
        uniqueResearch.length === 1
          ? uniqueResearch[0]!.title
          : `${uniqueResearch.length} research items`,
      detail: uniqueResearch
        .slice(0, 3)
        .map((r) => r.title)
        .join(" · "),
      href: `${base}/intelligence/radar`,
      status: "complete",
    });
  }

  /* 2. Pattern */
  if (item.idea?.pattern) {
    steps.push({
      key: "pattern",
      stage: "Signal detected",
      title: item.idea.pattern.title,
      detail: item.idea.pattern.description ?? undefined,
      meta: `${item.idea.pattern.kind} · confidence ${item.idea.pattern.confidence}%`,
      href: `${base}/intelligence/signals/${item.idea.pattern.id}`,
      status: "complete",
    });
  }

  /* 3. Idea */
  if (item.idea) {
    steps.push({
      key: "idea",
      stage: "Idea",
      title: item.idea.title,
      detail: item.idea.angle ?? item.idea.concept ?? undefined,
      meta: `Priority ${Math.round(item.idea.priorityScore)} · ${item.idea.source} · ${item.idea.status}`,
      href: `${base}/create/ideas/${item.idea.id}`,
      status: "complete",
      at: item.idea.createdAt,
    });
  }

  /* 4. Script */
  if (item.script) {
    const version = item.script.versions[0];
    const claims = parseJson<Claim[]>(version?.claims, []);
    const verified = claims.filter((c) => c.status === "verified").length;
    steps.push({
      key: "script",
      stage: "Script",
      title: item.script.title,
      detail: version?.hook,
      meta: [
        `v${version?.version ?? 1}`,
        claims.length > 0 ? `${verified}/${claims.length} claims verified` : "no claims flagged",
        item.script.qaState.replace(/_/g, " "),
      ].join(" · "),
      href: `${base}/create/scripts/${item.script.id}`,
      status: "complete",
      at: item.script.approvedAt,
    });
  }

  /* 5. Hook selection */
  if (item.selectedHook) {
    const version = item.script?.versions[0];
    const alternates = parseStringArray(version?.altHooks);
    steps.push({
      key: "hook",
      stage: "Hook selected",
      title: item.selectedHook,
      meta: alternates.length > 0 ? `Chosen over ${alternates.length} alternates` : undefined,
      status: "complete",
    });
  }

  /* 6. Recording */
  steps.push({
    key: "recorded",
    stage: "Recorded",
    title: item.recordedAt ? "Footage delivered" : "Not yet recorded",
    actor: item.founder?.name,
    at: item.recordedAt,
    status: item.recordedAt ? "complete" : "pending",
  });

  /* 7. Production */
  steps.push({
    key: "production",
    stage: "Production",
    title: item.editor?.name ? `Edited by ${item.editor.name}` : "Awaiting editor",
    meta:
      item.revisionCount > 0
        ? `${item.revisionCount} revision${item.revisionCount === 1 ? "" : "s"}`
        : "No revisions",
    status: ["approved", "scheduled", "live"].includes(item.stage)
      ? "complete"
      : item.editor
        ? "current"
        : "pending",
  });

  /* 8. Approval */
  steps.push({
    key: "approval",
    stage: "Approved",
    title: item.approvedBy?.name ? `Approved by ${item.approvedBy.name}` : "Not yet approved",
    at: item.approvedAt,
    status: item.approvedAt ? "complete" : "pending",
  });

  /* 9. Distribution */
  const published = item.publishRecords.filter((r) => r.status === "published");
  steps.push({
    key: "distribution",
    stage: "Published",
    title:
      published.length > 0
        ? published.map((r) => r.platform).join(", ")
        : item.publishRecords.length > 0
          ? "Scheduled, not yet live"
          : "Not scheduled",
    detail: published[0]?.url ?? undefined,
    at: published[0]?.publishedAt ?? null,
    status: published.length > 0 ? "complete" : item.publishRecords.length > 0 ? "current" : "pending",
    href: `${base}/distribution`,
  });

  /* 10. Performance */
  const totalViews = published.reduce((a, r) => a + (r.snapshots[0]?.views ?? 0), 0);
  if (published.length > 0) {
    steps.push({
      key: "performance",
      stage: "Performance",
      title: `${totalViews.toLocaleString("en-GB")} views`,
      meta: published
        .map((r) => {
          const s = r.snapshots[0];
          return s ? `${r.platform}: ${s.views.toLocaleString("en-GB")} views, ${s.retentionPct}% retention` : null;
        })
        .filter(Boolean)
        .join(" · "),
      href: `${base}/performance`,
      status: totalViews > 0 ? "complete" : "current",
    });
  }

  /* 11. Commercial signal */
  if (item.inquiries.length > 0) {
    const calls = item.inquiries.filter((i) => ["call_booked", "won"].includes(i.stage)).length;
    steps.push({
      key: "commercial",
      stage: "Commercial signal",
      title: `${item.inquiries.length} inquir${item.inquiries.length === 1 ? "y" : "ies"} attributed`,
      meta: calls > 0 ? `${calls} booked call${calls === 1 ? "" : "s"}` : undefined,
      href: `${base}/pipeline`,
      status: "complete",
    });
  }

  return {
    item,
    steps,
    research: uniqueResearch,
    totalViews,
    inquiries: item.inquiries,
    events: item.events,
  };
}

export type Lineage = NonNullable<Awaited<ReturnType<typeof contentLineage>>>;

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Reverse lookup: everything a research item eventually produced. */
export async function researchImpact(orgId: string, researchItemId: string) {
  const item = await prisma.researchItem.findFirst({
    where: { id: researchItemId, orgId },
    include: {
      ideaLinks: {
        include: {
          idea: {
            include: {
              contentItems: {
                include: {
                  publishRecords: {
                    where: { status: "published" },
                    include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 1 } },
                  },
                  inquiries: true,
                },
              },
            },
          },
        },
      },
      evidenceFor: { include: { pattern: { select: { id: true, title: true, kind: true } } } },
    },
  });

  if (!item) return null;

  const ideas = item.ideaLinks.map((l) => l.idea);
  const contentItems = ideas.flatMap((i) => i.contentItems);
  const views = contentItems
    .flatMap((c) => c.publishRecords)
    .reduce((a, r) => a + (r.snapshots[0]?.views ?? 0), 0);
  const inquiries = contentItems.flatMap((c) => c.inquiries).length;

  return { item, ideas, contentItems, views, inquiries, patterns: item.evidenceFor.map((e) => e.pattern) };
}
