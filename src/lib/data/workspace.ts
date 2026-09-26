import { parseProfiles } from "@/lib/auth/roles";
import "server-only";
import { prisma } from "@/lib/db/client";
import { parseStringArray, parseWith } from "@/lib/db/json";
import { can, type Capability } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain/enums";
import { clientScope, seesOperatorSurface } from "@/lib/domain/visibility";
import {
  companyProfileSchema,
  contentRulesSchema,
  founderProfileSchema,
  overallCompleteness,
  sectionCompleteness,
  voiceProfileSchema,
  EMPTY_COMPANY,
  EMPTY_CONTENT_RULES,
  EMPTY_FOUNDER,
  EMPTY_VOICE,
  type BrandBrainBlocks,
} from "@/lib/domain/brand-brain";

/** Brand Brain, members, tasks, notifications, library and search. */

export async function loadBrandBrain(orgId: string) {
  const [brain, offers, icps, proof, org] = await Promise.all([
    prisma.brandBrain.findUnique({ where: { orgId } }),
    prisma.offer.findMany({ where: { orgId }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] }),
    prisma.icpProfile.findMany({ where: { orgId }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] }),
    prisma.proofItem.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, website: true, industry: true, geography: true, currency: true },
    }),
  ]);

  const blocks: BrandBrainBlocks = {
    company: parseWith(brain?.company, companyProfileSchema, EMPTY_COMPANY),
    founder: parseWith(brain?.founder, founderProfileSchema, EMPTY_FOUNDER),
    voice: parseWith(brain?.voice, voiceProfileSchema, EMPTY_VOICE),
    contentRules: parseWith(brain?.contentRules, contentRulesSchema, EMPTY_CONTENT_RULES),
  };

  const sections = sectionCompleteness(blocks, {
    offers: offers.length,
    icps: icps.length,
    proof: proof.length,
  });

  return {
    org,
    blocks,
    offers: offers.map((o) => ({
      ...o,
      differentiators: parseStringArray(o.differentiators),
      ctas: parseStringArray(o.ctas),
    })),
    icps: icps.map((i) => ({
      ...i,
      pains: parseStringArray(i.pains),
      desires: parseStringArray(i.desires),
      objections: parseStringArray(i.objections),
      triggers: parseStringArray(i.triggers),
    })),
    proof,
    sections,
    completeness: overallCompleteness(sections),
    updatedAt: brain?.updatedAt ?? null,
  };
}

export type BrandBrainData = Awaited<ReturnType<typeof loadBrandBrain>>;

export async function listMembers(orgId: string) {
  const memberships = await prisma.membership.findMany({
    where: { orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          title: true,
          avatarHue: true,
          lastSeenAt: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({
    ...m.user,
    role: m.role,
    membershipId: m.id,
    status: m.status,
    isOwner: m.isOwner,
    isExpert: m.isExpert,
    contactRole: m.contactRole,
    profiles: parseProfiles(m.profiles) as string[],
  }));
}

/** Pending and lapsed invitations for the members screen (TEAM-04). */
export async function listInvitations(orgId: string) {
  return prisma.invitation.findMany({
    where: { orgId, state: { in: ["pending", "expired"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, state: true, expiresAt: true, sentCount: true },
  });
}

export type Member = Awaited<ReturnType<typeof listMembers>>[number];

/* ----------------------------------- Tasks --------------------------------- */

export type TaskFilters = {
  audience?: string;
  status?: string[];
  kind?: string[];
  assigneeId?: string;
};

export async function listTasks(orgId: string, filters: TaskFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.audience) where.audience = filters.audience;
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.kind?.length) where.kind = { in: filters.kind };
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  return prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: { assignee: { select: { id: true, name: true, avatarHue: true } } },
  });
}

export type TaskItem = Awaited<ReturnType<typeof listTasks>>[number];

export async function taskCounts(orgId: string, audience = "client") {
  const rows = await prisma.task.groupBy({
    by: ["status"],
    where: { orgId, audience },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

/* ------------------------------- Notifications ------------------------------ */

/**
 * Capability required to be told about a notification kind.
 *
 * Workspace-wide notifications carry no `userId`, so without this they would
 * reach every member — including roles with no access to the surface the
 * notification links to. Telling an editor that a strategy brief exists is a
 * small leak, but it is still a leak, and the capability matrix is meant to be
 * the single answer to "who sees this".
 *
 * Kinds absent from this map are visible to anyone who can open the workspace.
 */
const NOTIFICATION_CAPABILITY: Record<string, Capability> = {
  intelligence_brief: "research.view",
  report: "reports.view",
  pipeline: "pipeline.view",
  approval: "production.view",
};

/** Kinds this role must not be told about. Used as a database-level exclusion. */
function hiddenKinds(role: Role): string[] {
  return Object.entries(NOTIFICATION_CAPABILITY)
    .filter(([, capability]) => !can(role, capability))
    .map(([kind]) => kind);
}

export async function listNotifications(
  orgId: string,
  userId: string,
  role: Role,
  limit = 25,
) {
  const hidden = hiddenKinds(role);
  return prisma.notification.findMany({
    where: {
      orgId,
      OR: [{ userId }, { userId: null }],
      ...(hidden.length ? { kind: { notIn: hidden } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadNotificationCount(orgId: string, userId: string, role: Role) {
  const hidden = hiddenKinds(role);
  return prisma.notification.count({
    where: {
      orgId,
      readAt: null,
      OR: [{ userId }, { userId: null }],
      ...(hidden.length ? { kind: { notIn: hidden } } : {}),
    },
  });
}

/* ---------------------------------- Library -------------------------------- */

export type LibraryFilters = {
  scope?: { ids: string[]; userId: string };
  category?: string[];
  search?: string;
  contentItemId?: string;
};

export async function listAssets(orgId: string, filters: LibraryFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.category?.length) where.category = { in: filters.category };
  if (filters.contentItemId) where.contentItemId = filters.contentItemId;
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { fileName: { contains: q } },
    ];
  }

  // TEAM-09: a contractor sees files of their pieces and files they uploaded.
  if (filters.scope) where.AND = [{ OR: [{ contentItemId: { in: filters.scope.ids } }, { uploadedById: filters.scope.userId }] }];

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, avatarHue: true } },
      contentItem: { select: { id: true, title: true, stage: true } },
    },
  });

  return assets.map((a) => ({ ...a, tagList: parseStringArray(a.tags) }));
}

export type LibraryAsset = Awaited<ReturnType<typeof listAssets>>[number];

export async function assetCounts(orgId: string) {
  const rows = await prisma.asset.groupBy({
    by: ["category"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.category] = row._count._all;
  return counts;
}

export async function getAsset(orgId: string, id: string) {
  return prisma.asset.findFirst({
    where: { id, orgId },
    include: { contentItem: { select: { id: true, title: true } } },
  });
}

/* ------------------------------- Global search ------------------------------ */

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};

/**
 * Cross-module search, scoped strictly to one organisation.
 *
 * SQLite `contains` is a substring scan; acceptable at v1 data volumes. A
 * Postgres deployment can swap in full-text behind this same function.
 */
/**
 * Global search.
 *
 * Scoped twice: to the organisation, and to what this role is allowed to see.
 * Search is the easiest place to leak a curated surface — a client typing a
 * competitor's name should not find the raw research item about them, or a
 * signal that was never approved.
 */
export async function searchWorkspace(
  orgId: string,
  orgSlug: string,
  query: string,
  role: Role,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const base = `/app/${orgSlug}`;
  const take = 6;
  const operator = seesOperatorSurface(role);

  const [ideas, scripts, content, research, patterns, assets, inquiries] = await Promise.all([
    prisma.idea.findMany({
      where: { orgId, title: { contains: q } },
      take,
      select: { id: true, title: true, status: true },
    }),
    prisma.script.findMany({
      where: { orgId, title: { contains: q } },
      take,
      select: { id: true, title: true, qaState: true },
    }),
    prisma.contentItem.findMany({
      where: { orgId, title: { contains: q } },
      take,
      select: { id: true, title: true, stage: true },
    }),
    // Raw research is operator-only. A client reaches the items that mattered
    // through the brief that cites them, with the reasoning attached.
    operator
      ? prisma.researchItem.findMany({
          where: { orgId, OR: [{ title: { contains: q } }, { body: { contains: q } }] },
          take,
          select: { id: true, title: true, kind: true },
        })
      : Promise.resolve([]),
    prisma.pattern.findMany({
      where: { orgId, title: { contains: q }, ...clientScope.patterns(role) },
      take,
      select: { id: true, title: true, kind: true },
    }),
    prisma.asset.findMany({
      where: { orgId, title: { contains: q } },
      take,
      select: { id: true, title: true, category: true },
    }),
    prisma.inquiry.findMany({
      where: { orgId, OR: [{ name: { contains: q } }, { company: { contains: q } }] },
      take,
      select: { id: true, name: true, company: true, stage: true },
    }),
  ]);

  return [
    ...ideas.map((i) => ({
      id: i.id,
      type: "Idea",
      title: i.title,
      subtitle: i.status,
      href: `${base}/create/ideas/${i.id}`,
    })),
    ...scripts.map((s) => ({
      id: s.id,
      type: "Script",
      title: s.title,
      subtitle: s.qaState.replace(/_/g, " "),
      href: `${base}/create/scripts/${s.id}`,
    })),
    ...content.map((c) => ({
      id: c.id,
      type: "Content",
      title: c.title,
      subtitle: c.stage.replace(/_/g, " "),
      href: `${base}/production/${c.id}`,
    })),
    ...research.map((r) => ({
      id: r.id,
      type: "Research",
      title: r.title,
      subtitle: r.kind.replace(/_/g, " "),
      href: `${base}/intelligence/radar?item=${r.id}`,
    })),
    ...patterns.map((p) => ({
      id: p.id,
      type: "Signal",
      title: p.title,
      subtitle: p.kind,
      href: `${base}/intelligence/signals/${p.id}`,
    })),
    ...assets.map((a) => ({
      id: a.id,
      type: "Asset",
      title: a.title,
      subtitle: a.category.replace(/_/g, " "),
      href: `${base}/library?asset=${a.id}`,
    })),
    ...inquiries.map((i) => ({
      id: i.id,
      type: "Pipeline",
      title: i.name,
      subtitle: i.company ?? i.stage,
      href: `${base}/pipeline?inquiry=${i.id}`,
    })),
  ];
}
