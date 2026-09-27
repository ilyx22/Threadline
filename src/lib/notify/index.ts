import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";

/**
 * Notifications (NOT-01).
 *
 * `notify` routes one event to the people responsible for it, once each
 * (deduplicated on a key per person), in-app always. Email follows each
 * person's preference: off (the default), immediate (outside their quiet
 * hours and not while snoozed; held for the digest otherwise), or a daily
 * digest. Approvals that wait too long are escalated to the backup approver
 * and the owner, once per item per day.
 */
export type Audience =
  | { userIds: string[] }
  | { orgRole: "approvers" | "admins" | "commercial" | "all_clients" };

async function recipients(orgId: string, audience: Audience): Promise<string[]> {
  if ("userIds" in audience) return audience.userIds;
  const base = { orgId, status: "active" as const };
  const where =
    audience.orgRole === "approvers"
      ? { ...base, OR: [{ role: "client_admin" }, { profiles: { contains: '"approver"' } }] }
      : audience.orgRole === "admins"
        ? { ...base, role: "client_admin" }
        : audience.orgRole === "commercial"
          ? { ...base, OR: [{ profiles: { contains: '"commercial"' } }, { contactRole: "primary" }] }
          : { ...base, role: { in: ["client_admin", "client_member"] } };
  return (await prisma.membership.findMany({ where, select: { userId: true } })).map((m) => m.userId);
}

/** The local hour in a timezone. */
export function localHour(timeZone: string, now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now));
}

export function inQuietHours(pref: { quietStart: number | null; quietEnd: number | null; timezone: string }, now = new Date()) {
  if (pref.quietStart === null || pref.quietEnd === null) return false;
  const h = localHour(pref.timezone, now);
  return pref.quietStart <= pref.quietEnd ? h >= pref.quietStart && h < pref.quietEnd : h >= pref.quietStart || h < pref.quietEnd;
}

/**
 * Email default when a person has not chosen: client users get the daily
 * action digest (communication playbook, 27 Sept 2026); staff get nothing by
 * email unless they opt in. A saved preference always wins.
 */
export const CLIENT_ROLES = ["client_admin", "client_member"];
export function defaultEmailPreference(role: string) {
  return CLIENT_ROLES.includes(role) ? "digest" : "off";
}

export async function notify(input: { orgId: string; audience: Audience; kind: string; title: string; body?: string | null; href?: string | null; severity?: "info" | "success" | "warning" | "critical"; dedupeKey: string; subject?: { type: "content_item"; id: string }; now?: Date }) {
  const now = input.now ?? new Date();
  const ids = [...new Set(await recipients(input.orgId, input.audience))];
  const created: string[] = [];
  for (const userId of ids) {
    try {
      const n = await prisma.notification.create({
        data: { orgId: input.orgId, userId, kind: input.kind, title: input.title.slice(0, 200), body: input.body?.slice(0, 1000) ?? null, href: input.href ?? null, severity: input.severity ?? "info", dedupeKey: input.dedupeKey, subjectType: input.subject?.type ?? null, subjectId: input.subject?.id ?? null },
      });
      created.push(n.id);
      const pref = await prisma.notificationPreference.findUnique({ where: { userId_orgId: { userId, orgId: input.orgId } } });
      if (pref?.email === "immediate" && !(pref.snoozedUntil && pref.snoozedUntil > now) && !inQuietHours(pref, now)) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, isActive: true } });
        if (user?.isActive) {
          await enqueue("email.send", { to: user.email, template: "notification", data: { name: user.name.split(" ")[0], title: n.title, body: n.body ?? "", link: n.href ? `${appUrl()}${n.href}` : appUrl() }, orgId: input.orgId }, { idempotencyKey: `notify:${n.id}`, orgId: input.orgId });
          await prisma.notification.update({ where: { id: n.id }, data: { emailedAt: now } });
        }
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // already told
      throw e;
    }
  }
  return created;
}

/**
 * Daily: approvals waiting three days or more go to the backup approver and
 * the owner, once per item per revision (one overdue reminder, not a daily
 * chaser; the relationship owner handles it personally after that).
 */
export async function escalateStaleApprovals(now = new Date(), scope: { orgId?: string } = {}) {
  const cutoff = new Date(now.getTime() - 3 * 86_400_000);
  const items = await prisma.contentItem.findMany({ where: { stage: "in_review", updatedAt: { lt: cutoff }, ...(scope.orgId ? { orgId: scope.orgId } : {}) }, select: { id: true, orgId: true, title: true, revisionCount: true, org: { select: { slug: true } } } });
  let sent = 0;
  for (const item of items) {
    const people = await prisma.membership.findMany({ where: { orgId: item.orgId, status: "active", OR: [{ contactRole: "backup" }, { isOwner: true }] }, select: { userId: true } });
    if (!people.length) continue;
    sent += (
      await notify({
        orgId: item.orgId,
        audience: { userIds: people.map((p) => p.userId) },
        kind: "approval",
        title: `Waiting three days or more: ${item.title}`,
        body: "This piece is holding up a publishing slot. Approve it or send it back with a note.",
        href: `/app/${item.org.slug}/production/${item.id}`,
        severity: "warning",
        dedupeKey: `escalate:${item.id}:r${item.revisionCount ?? 0}`,
        subject: { type: "content_item", id: item.id },
        now,
      })
    ).length;
  }
  return sent;
}

/** True while the thing a notification points at still needs someone to act. */
async function stillActionable(n: { subjectType: string | null; subjectId: string | null; orgId: string }) {
  if (n.subjectType === "content_item" && n.subjectId) {
    const item = await prisma.contentItem.findFirst({ where: { id: n.subjectId, orgId: n.orgId }, select: { stage: true } });
    return item?.stage === "in_review";
  }
  return true;
}

/**
 * Daily action digest. Goes to people who chose it and, by default, to client
 * users who have not chosen (see defaultEmailPreference). Only for an active
 * member of the workspace; only unread items not already emailed; items whose
 * subject no longer needs action (approved, sent back, deleted) are dropped;
 * several notices about the same item collapse to one line; and nothing is
 * sent when nothing is left. At most one digest per person per day.
 */
export async function sendDigests(now = new Date(), scope: { orgId?: string } = {}) {
  const inScope = scope.orgId ? { orgId: scope.orgId } : {};
  const chosen = await prisma.notificationPreference.findMany({ where: { ...inScope, email: "digest", OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: now } }] } });
  const all = await prisma.notificationPreference.findMany({ where: inScope, select: { userId: true, orgId: true } });
  const hasPref = new Set(all.map((p) => `${p.userId}:${p.orgId}`));
  const defaults = (await prisma.membership.findMany({ where: { ...inScope, status: "active", role: { in: CLIENT_ROLES } }, select: { userId: true, orgId: true, role: true } })).filter(
    (m) => !hasPref.has(`${m.userId}:${m.orgId}`) && defaultEmailPreference(m.role) === "digest",
  );
  const candidates = [
    ...chosen.map((p) => ({ userId: p.userId, orgId: p.orgId, pref: p as typeof p | null })),
    ...defaults.map((m) => ({ userId: m.userId, orgId: m.orgId, pref: null })),
  ];
  let sent = 0;
  for (const c of candidates) {
    if (c.pref && inQuietHours(c.pref, now)) continue;
    const member = await prisma.membership.findFirst({ where: { userId: c.userId, orgId: c.orgId, status: "active" }, select: { id: true } });
    if (!member) continue;
    const since = c.pref?.lastDigestAt ?? new Date(now.getTime() - 86_400_000);
    const pending = await prisma.notification.findMany({ where: { userId: c.userId, orgId: c.orgId, readAt: null, emailedAt: null, createdAt: { gt: since } }, orderBy: { createdAt: "asc" }, take: 60 });
    if (!pending.length) continue;
    const keep: typeof pending = [];
    const seen = new Set<string>();
    for (const n of [...pending].reverse()) {
      const subject = n.subjectType && n.subjectId ? `${n.subjectType}:${n.subjectId}` : null;
      if (subject && seen.has(subject)) continue;
      if (!(await stillActionable(n))) continue;
      if (subject) seen.add(subject);
      keep.unshift(n);
    }
    const user = await prisma.user.findUnique({ where: { id: c.userId }, select: { email: true, name: true, isActive: true } });
    const org = await prisma.organization.findUnique({ where: { id: c.orgId }, select: { name: true, slug: true } });
    if (!user?.isActive || !org) continue;
    const pref = await prisma.notificationPreference.upsert({
      where: { userId_orgId: { userId: c.userId, orgId: c.orgId } },
      create: { userId: c.userId, orgId: c.orgId, email: "digest" },
      update: {},
    });
    if (keep.length) {
      const { created } = await enqueue(
        "email.send",
        { to: user.email, template: "digest", data: { name: user.name.split(" ")[0], workspaceName: org.name, items: keep.slice(0, 30).map((i) => i.title), link: `${appUrl()}/app/${org.slug}` }, orgId: c.orgId },
        { idempotencyKey: `digest:${pref.id}:${now.toISOString().slice(0, 10)}`, orgId: c.orgId },
      );
      if (created) sent++;
    }
    // Everything looked at is settled: sent, collapsed into a line, or no longer actionable.
    await prisma.$transaction([
      prisma.notification.updateMany({ where: { id: { in: pending.map((i) => i.id) } }, data: { emailedAt: now } }),
      prisma.notificationPreference.update({ where: { id: pref.id }, data: { lastDigestAt: now } }),
    ]);
  }
  return sent;
}
