import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import type { Role } from "@/lib/domain/enums";
import { can, isInternalRole, type Capability } from "./roles";
import { getSessionUser, type SessionUser } from "./session";

/**
 * The security boundary.
 *
 * `middleware.ts` performs a cheap cookie check for redirect UX only. Everything
 * that actually reads or writes tenant data goes through the functions here,
 * which resolve the organisation from the URL slug and the caller from the
 * session — never from client-supplied input.
 *
 * Invariant: no repository or action may obtain an `orgId` except from an
 * `AuthContext` returned by this module.
 */

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export type OrgSummary = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  currency: string;
  timezone: string;
  accentHex: string | null;
  onboardingStage: string;
  packageTier: string;
  /// A dry-run workspace. Every surface that could be mistaken for real client
  /// evidence reads this and says so.
  synthetic: boolean;
  /// When the engagement began. Service periods are counted from here, so a
  /// workspace without one falls back to its creation date rather than
  /// pretending period 1 started today.
  startedAt: Date | null;
  createdAt: Date;
};

export type AuthContext = {
  user: SessionUser;
  org: OrgSummary;
  role: Role;
  /** True when the caller is Threadline staff acting inside a client workspace. */
  isInternal: boolean;
  can: (capability: Capability) => boolean;
};

/** Request-scoped memoisation so one render does not re-query the session. */
export const currentUser = cache(async (): Promise<SessionUser | null> => getSessionUser());

export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) {
    // Reaching here means a session cookie was present — middleware bounces
    // anonymous requests before they get this far — but the database has no
    // valid session behind it. The flag tells middleware that, so it stops
    // redirecting the caller back into a protected route and clears the dead
    // cookie instead. Without it the two loop until the browser gives up.
    const params = new URLSearchParams({ session: "expired" });
    if (nextPath) params.set("next", nextPath);
    redirect(`/login?${params.toString()}`);
  }
  return user;
}

const loadOrgBySlug = cache(async (slug: string) => {
  return prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      kind: true,
      status: true,
      currency: true,
      timezone: true,
      accentHex: true,
      onboardingStage: true,
      packageTier: true,
      synthetic: true,
      startedAt: true,
      createdAt: true,
    },
  });
});

const loadMembership = cache(async (userId: string, orgId: string) => {
  return prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  });
});

/**
 * Resolve an organisation the caller may access.
 *
 * A non-member gets `notFound()` rather than a 403, so the existence of another
 * client's workspace is not disclosed by probing slugs.
 */
export async function requireOrgAccess(
  slug: string,
  capability?: Capability,
): Promise<AuthContext> {
  const user = await requireUser(`/app/${slug}`);
  const org = await loadOrgBySlug(slug);
  if (!org) notFound();

  const membership = await loadMembership(user.id, org.id);

  let role: Role | null = (membership?.role as Role) ?? null;

  // Threadline staff work across client workspaces without an explicit membership
  // row in every one. Super admins are resolved from the user flag; operators must
  // hold an internal_operator membership in the internal organisation.
  if (!role) {
    if (user.isSuperAdmin) {
      role = "super_admin";
    } else if (await hasInternalOperatorRole(user.id)) {
      role = "internal_operator";
    }
  }

  if (!role) notFound();

  if (capability && !can(role, capability)) {
    throw new AuthError(`Missing capability: ${capability}`);
  }

  return {
    user,
    org,
    role,
    isInternal: isInternalRole(role),
    can: (c: Capability) => can(role, c),
  };
}

/**
 * Page-level variant of requireOrgAccess.
 *
 * A missing capability on a PAGE is a navigation mistake, not a fault, so the
 * caller is sent to a plain explanation rather than an error boundary. Server
 * actions keep using requireOrgAccess, which throws — an action has no page to
 * render and must report the failure in its result.
 */
export async function requireOrgPage(
  slug: string,
  capability?: Capability,
): Promise<AuthContext> {
  const ctx = await requireOrgAccess(slug);
  if (capability && !ctx.can(capability)) {
    redirect(`/no-access?area=workspace&org=${encodeURIComponent(slug)}`);
  }
  return ctx;
}

const hasInternalOperatorRole = cache(async (userId: string) => {
  const membership = await prisma.membership.findFirst({
    where: { userId, role: { in: ["internal_operator", "super_admin"] } },
    select: { id: true },
  });
  return Boolean(membership);
});

/** Guard for the admin portal. */
export async function requireInternal(capability?: Capability) {
  const user = await requireUser("/admin");

  let role: Role | null = null;
  if (user.isSuperAdmin) {
    role = "super_admin";
  } else if (await hasInternalOperatorRole(user.id)) {
    role = "internal_operator";
  }

  if (!role) {
    // Rendered as a plain explanation rather than an error boundary. Server
    // actions call requireInternalStrict instead, which throws.
    redirect("/no-access?area=admin");
  }
  if (capability && !can(role, capability)) {
    redirect("/no-access?area=admin");
  }

  return { user, role, can: (c: Capability) => can(role, c) };
}

/**
 * Strict variant for server actions, which cannot redirect a user to an
 * explanation page — they must fail loudly so the action result reports it.
 */
export async function requireInternalStrict(capability?: Capability) {
  const user = await requireUser("/admin");

  let role: Role | null = null;
  if (user.isSuperAdmin) {
    role = "super_admin";
  } else if (await hasInternalOperatorRole(user.id)) {
    role = "internal_operator";
  }

  if (!role) {
    throw new AuthError("The Threadline admin portal is only available to Threadline staff.");
  }
  if (capability && !can(role, capability)) {
    throw new AuthError(`Missing capability: ${capability}`);
  }

  return { user, role, can: (c: Capability) => can(role, c) };
}

/** Assert a capability inside an action that already resolved a context. */
export function requireCapability(ctx: AuthContext, capability: Capability) {
  if (!ctx.can(capability)) {
    throw new AuthError(`Missing capability: ${capability}`);
  }
}

/** Every organisation the caller can open, for the workspace switcher. */
export async function accessibleOrgs(user: SessionUser) {
  const internal = user.isSuperAdmin || (await hasInternalOperatorRole(user.id));

  if (internal) {
    return prisma.organization.findMany({
      where: { kind: "client" },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, status: true, kind: true },
    });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      org: { select: { id: true, slug: true, name: true, status: true, kind: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => m.org).filter((o) => o.kind === "client");
}

export async function isInternalUser(user: SessionUser) {
  return user.isSuperAdmin || (await hasInternalOperatorRole(user.id));
}
