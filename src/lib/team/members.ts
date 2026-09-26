import "server-only";
import { prisma } from "@/lib/db/client";
import { canManageMemberWithRole, parseProfiles, type ClientProfile } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain/enums";

/**
 * Member lifecycle (TEAM-05, TEAM-06, TEAM-07, TEAM-08).
 *
 * Access is read from the membership on every request, so suspending or
 * removing a member takes effect on their next click. Work they were holding
 * is returned to the unassigned queue and reported, never silently dropped.
 * The owner cannot be suspended, removed or demoted; ownership moves only by an
 * explicit transfer to another active client admin, inside one serialisable
 * transaction (the database also allows at most one owner per workspace).
 */
export class MemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemberError";
  }
}

type Actor = { userId: string; role: Role };
type Org = { id: string; kind: string };

async function target(org: Org, userId: string) {
  const m = await prisma.membership.findUnique({ where: { userId_orgId: { userId, orgId: org.id } }, include: { user: { select: { name: true } } } });
  if (!m) throw new MemberError("That person is not a member of this workspace.");
  return m;
}

/** Return a departing member's open tasks to the unassigned queue. */
async function releaseWork(orgId: string, userId: string) {
  const r = await prisma.task.updateMany({ where: { orgId, assigneeId: userId, status: { in: ["open", "in_progress"] } }, data: { assigneeId: null } });
  await prisma.workAssignment.deleteMany({ where: { orgId, userId } });
  return r.count;
}

export async function suspendMember(actor: Actor, org: Org, userId: string) {
  if (userId === actor.userId) throw new MemberError("You cannot suspend yourself.");
  const m = await target(org, userId);
  if (!canManageMemberWithRole(actor.role, m.role as Role, org.kind)) throw new MemberError("You cannot suspend that person.");
  if (m.isOwner) throw new MemberError("The owner cannot be suspended. Transfer ownership first.");
  const blocked = await prisma.$transaction(
    async (tx) => {
      if (m.role === "client_admin") {
        const admins = await tx.membership.count({ where: { orgId: org.id, role: "client_admin", status: "active" } });
        if (admins <= 1) return true;
      }
      await tx.membership.update({ where: { id: m.id }, data: { status: "suspended", suspendedAt: new Date() } });
      return false;
    },
    { isolationLevel: "Serializable" },
  );
  if (blocked) throw new MemberError("This is the only active workspace admin. Promote someone else first.");
  const released = await releaseWork(org.id, userId);
  return { name: m.user.name, released };
}

export async function reinstateMember(actor: Actor, org: Org, userId: string) {
  const m = await target(org, userId);
  if (!canManageMemberWithRole(actor.role, m.role as Role, org.kind)) throw new MemberError("You cannot reinstate that person.");
  await prisma.membership.update({ where: { id: m.id }, data: { status: "active", suspendedAt: null } });
  return { name: m.user.name };
}

export async function removeMember(actor: Actor, org: Org, userId: string) {
  if (userId === actor.userId) throw new MemberError("You cannot remove yourself.");
  const m = await target(org, userId);
  if (!canManageMemberWithRole(actor.role, m.role as Role, org.kind)) throw new MemberError("You cannot remove that person.");
  if (m.isOwner) throw new MemberError("The owner cannot be removed. Transfer ownership first.");
  const released = await releaseWork(org.id, userId);
  const blocked = await prisma.$transaction(
    async (tx) => {
      if (m.role === "client_admin") {
        const admins = await tx.membership.count({ where: { orgId: org.id, role: "client_admin", status: "active" } });
        if (admins <= 1 && m.status === "active") return true;
      }
      await tx.membership.delete({ where: { id: m.id } });
      return false;
    },
    { isolationLevel: "Serializable" },
  );
  if (blocked) throw new MemberError("This is the only workspace admin. Promote someone else first.");
  return { name: m.user.name, released };
}

/** Move ownership to another active client admin. */
export async function transferOwnership(actor: Actor, org: Org, toUserId: string) {
  const from = await prisma.membership.findFirst({ where: { orgId: org.id, isOwner: true } });
  const actorIsOwner = from?.userId === actor.userId;
  if (!actorIsOwner && actor.role !== "super_admin" && actor.role !== "internal_operator") throw new MemberError("Only the owner or Threadline staff can transfer ownership.");
  const to = await target(org, toUserId);
  if (to.role !== "client_admin" || to.status !== "active") throw new MemberError("Ownership can only go to an active workspace admin. Promote them first.");
  if (to.isOwner) return { name: to.user.name };
  await prisma.$transaction(
    async (tx) => {
      await tx.membership.updateMany({ where: { orgId: org.id, isOwner: true }, data: { isOwner: false } });
      await tx.membership.update({ where: { id: to.id }, data: { isOwner: true } });
    },
    { isolationLevel: "Serializable" },
  );
  return { name: to.user.name };
}

/** Profiles, expert flag and contact role for a client member (TEAM-01, TEAM-08). */
export async function updateMemberProfile(actor: Actor, org: Org, userId: string, input: { profiles: ClientProfile[]; isExpert: boolean; contactRole: "primary" | "backup" | null; voiceNotes?: string | null }) {
  if (org.kind !== "client") throw new MemberError("Profiles apply to client workspaces only.");
  const m = await target(org, userId);
  if (!canManageMemberWithRole(actor.role, m.role as Role, org.kind)) throw new MemberError("You cannot change that person.");
  const profiles = parseProfiles(JSON.stringify(input.profiles)).filter((p) => p !== "admin" || m.role === "client_admin");
  await prisma.$transaction(async (tx) => {
    // One primary and one backup contact per workspace.
    if (input.contactRole) await tx.membership.updateMany({ where: { orgId: org.id, contactRole: input.contactRole, NOT: { id: m.id } }, data: { contactRole: null } });
    await tx.membership.update({ where: { id: m.id }, data: { profiles: JSON.stringify(profiles), isExpert: input.isExpert, contactRole: input.contactRole, ...(input.voiceNotes !== undefined ? { voiceNotes: input.voiceNotes?.trim().slice(0, 2000) || null } : {}) } });
  });
  return { name: m.user.name, profiles };
}

/** Open work held by members who can no longer act on it (suspended), for the operator queue. */
export async function strandedWork(orgId?: string) {
  const suspended = await prisma.membership.findMany({ where: { status: "suspended", ...(orgId ? { orgId } : {}) }, select: { userId: true, orgId: true } });
  if (!suspended.length) return [];
  return prisma.task.findMany({
    where: { OR: suspended.map((s) => ({ orgId: s.orgId, assigneeId: s.userId })), status: { in: ["open", "in_progress"] } },
    select: { id: true, title: true, orgId: true, assigneeId: true },
    take: 100,
  });
}
