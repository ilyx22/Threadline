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

export async function notify(input: { orgId: string; audience: Audience; kind: string; title: string; body?: string | null; href?: string | null; severity?: "info" | "success" | "warning" | "critical"; dedupeKey: string; now?: Date }) {
  const now = input.now ?? new Date();
  const ids = [...new Set(await recipients(input.orgId, input.audience))];
  const created: string[] = [];
  for (const userId of ids) {
    try {
      const n = await prisma.notification.create({
        data: { orgId: input.orgId, userId, kind: input.kind, title: input.title.slice(0, 200), body: input.body?.slice(0, 1000) ?? null, href: input.href ?? null, severity: input.severity ?? "info", dedupeKey: input.dedupeKey },
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

/** Daily: approvals waiting three days or more go to the backup approver and the owner. */
export async function escalateStaleApprovals(now = new Date()) {
  const cutoff = new Date(now.getTime() - 3 * 86_400_000);
  const day = now.toISOString().slice(0, 10);
  const items = await prisma.contentItem.findMany({ where: { stage: "in_review", updatedAt: { lt: cutoff } }, select: { id: true, orgId: true, title: true, org: { select: { slug: true } } } });
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
        dedupeKey: `escalate:${item.id}:${day}`,
        now,
      })
    ).length;
  }
  return sent;
}

/** Daily digest for people who chose it: unread notifications since their last digest. */
export async function sendDigests(now = new Date()) {
  const prefs = await prisma.notificationPreference.findMany({ where: { email: "digest", OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: now } }] } });
  let sent = 0;
  for (const p of prefs) {
    if (inQuietHours(p, now)) continue;
    const since = p.lastDigestAt ?? new Date(now.getTime() - 86_400_000);
    const items = await prisma.notification.findMany({ where: { userId: p.userId, orgId: p.orgId, readAt: null, emailedAt: null, createdAt: { gt: since } }, orderBy: { createdAt: "asc" }, take: 30 });
    if (!items.length) continue;
    const user = await prisma.user.findUnique({ where: { id: p.userId }, select: { email: true, name: true, isActive: true } });
    const org = await prisma.organization.findUnique({ where: { id: p.orgId }, select: { name: true, slug: true } });
    if (!user?.isActive || !org) continue;
    await enqueue(
      "email.send",
      { to: user.email, template: "digest", data: { name: user.name.split(" ")[0], workspaceName: org.name, items: items.map((i) => i.title), link: `${appUrl()}/app/${org.slug}` }, orgId: p.orgId },
      { idempotencyKey: `digest:${p.id}:${now.toISOString().slice(0, 10)}`, orgId: p.orgId },
    );
    await prisma.$transaction([
      prisma.notification.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { emailedAt: now } }),
      prisma.notificationPreference.update({ where: { id: p.id }, data: { lastDigestAt: now } }),
    ]);
    sent++;
  }
  return sent;
}
