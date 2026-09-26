import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson, parseStringArray } from "@/lib/db/json";
import { CONTENT_STAGES, type Role } from "@/lib/domain/enums";
import { clientScope } from "@/lib/domain/visibility";
import type { Claim } from "@/lib/domain/workflow";

/** Production repository: content items, board, comments, events, packaging. */

export type ContentFilters = {
  /** Assignment scope (TEAM-09): only these pieces. */
  ids?: string[];
  stage?: string[];
  platform?: string[];
  editorId?: string;
  priority?: string[];
  search?: string;
  overdue?: boolean;
};

export async function listContent(orgId: string, filters: ContentFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.ids) where.id = { in: filters.ids };
  if (filters.stage?.length) where.stage = { in: filters.stage };
  if (filters.platform?.length) where.platform = { in: filters.platform };
  if (filters.editorId) where.editorId = filters.editorId;
  if (filters.priority?.length) where.priority = { in: filters.priority };
  if (filters.overdue) {
    where.dueDate = { lt: new Date() };
    where.stage = { notIn: ["live"] };
  }
  if (filters.search?.trim()) {
    where.title = { contains: filters.search.trim() };
  }

  return prisma.contentItem.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    include: {
      editor: { select: { id: true, name: true, avatarHue: true } },
      founder: { select: { id: true, name: true, avatarHue: true } },
      idea: { select: { id: true, title: true, pillar: true } },
      script: { select: { id: true, title: true } },
      _count: { select: { assets: true, publishRecords: true, packages: true } },
    },
  });
}

export type ContentListItem = Awaited<ReturnType<typeof listContent>>[number];

/** Board grouped by stage, preserving the canonical stage order. */
export async function contentBoard(orgId: string, filters: ContentFilters = {}) {
  const items = await listContent(orgId, filters);
  const columns = CONTENT_STAGES.map((stage) => ({
    stage,
    items: items.filter((i) => i.stage === stage),
  }));
  return { columns, total: items.length };
}

export async function getContentItem(orgId: string, id: string) {
  const item = await prisma.contentItem.findFirst({
    where: { id, orgId },
    include: {
      editor: { select: { id: true, name: true, avatarHue: true } },
      founder: { select: { id: true, name: true, avatarHue: true } },
      approvedBy: { select: { id: true, name: true } },
      idea: {
        select: {
          id: true,
          title: true,
          pillar: true,
          angle: true,
          cta: true,
          priorityScore: true,
          status: true,
          patternId: true,
        },
      },
      script: {
        select: {
          id: true,
          title: true,
          qaState: true,
          estimatedSeconds: true,
          versions: { orderBy: { version: "desc" }, take: 1 },
        },
      },
      assets: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, avatarHue: true } } },
      },
      packages: true,
      publishRecords: {
        include: {
          account: { select: { handle: true, platform: true } },
          snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
        },
      },
      inquiries: { orderBy: { occurredAt: "desc" } },
    },
  });

  if (!item) return null;

  const version = item.script?.versions[0];
  return {
    ...item,
    scriptVersion: version
      ? {
          ...version,
          altHooks: parseStringArray(version.altHooks),
          claims: parseJson<Claim[]>(version.claims, []),
        }
      : null,
    packageList: item.packages.map((p) => ({
      ...p,
      hashtags: parseStringArray(p.hashtags),
      overlays: parseStringArray(p.overlays),
      thumbnailConcepts: parseStringArray(p.thumbnailConcepts),
      ctaOptions: parseStringArray(p.ctaOptions),
      clipOpportunities: parseJson<
        { label: string; startSec: number; endSec: number; rationale: string }[]
      >(p.clipOpportunities, []),
    })),
  };
}

export type ContentDetail = NonNullable<Awaited<ReturnType<typeof getContentItem>>>;

/**
 * Comments on a content item.
 *
 * Operator-private notes never cross into a client-scoped read. This is the
 * only place internal notes exist, which is what makes the exclusion a single
 * line rather than a convention every call site has to remember.
 */
export async function contentComments(orgId: string, contentItemId: string, role: Role) {
  return prisma.comment.findMany({
    where: {
      orgId,
      entityType: "content_item",
      entityId: contentItemId,
      ...clientScope.comments(role),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, avatarHue: true } } },
  });
}

export type ContentComment = Awaited<ReturnType<typeof contentComments>>[number];

export async function contentCounts(orgId: string, ids?: string[]) {
  const rows = await prisma.contentItem.groupBy({
    by: ["stage"],
    where: { orgId, ...(ids ? { id: { in: ids } } : {}) },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.stage] = row._count._all;
  return counts;
}

/** Workspace members eligible to be assigned as editors. */
export async function assignableEditors(orgId: string) {
  const memberships = await prisma.membership.findMany({
    where: { orgId, role: { in: ["editor", "client_admin", "internal_operator", "client_member"] } },
    include: { user: { select: { id: true, name: true, avatarHue: true, title: true } } },
  });
  return memberships.map((m) => ({ ...m.user, role: m.role }));
}

/** Items approved but not yet packaged — the packaging queue. */
export async function packagingQueue(orgId: string) {
  return prisma.contentItem.findMany({
    where: { orgId, stage: { in: ["approved", "scheduled", "live"] } },
    orderBy: { approvedAt: "desc" },
    include: {
      packages: { select: { id: true, platform: true, status: true } },
      script: {
        select: { versions: { orderBy: { version: "desc" }, take: 1, select: { hook: true, body: true } } },
      },
    },
  });
}
