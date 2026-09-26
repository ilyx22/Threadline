import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { notify } from "@/lib/notify";

/**
 * Client-raised support requests (CX-07). A member of a client workspace
 * asks for help; it lands in the operators' support queue with the workspace
 * attached, and Threadline's operators are notified. The client sees the
 * status of their workspace's requests, never another workspace's.
 */
export async function raiseRequest(orgId: string, userId: string, input: { title: string; description?: string | null; blocking: boolean }) {
  const title = input.title.trim().slice(0, 200);
  if (title.length < 4) throw new WorkflowError("Say in a few words what you need.");
  const recent = await prisma.supportIssue.count({ where: { orgId, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 10) throw new WorkflowError("Ten requests in the last hour. We have them; someone will be in touch.");
  const who = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const issue = await prisma.supportIssue.create({
    data: { orgId, title, description: [input.description?.trim().slice(0, 4000), `Raised by ${who?.name ?? "a member"} from the workspace.`].filter(Boolean).join("\n\n"), severity: input.blocking ? "high" : "medium" },
  });
  const internal = await prisma.organization.findFirst({ where: { kind: "internal" }, select: { id: true } });
  if (internal) {
    const staff = await prisma.membership.findMany({ where: { orgId: internal.id, status: "active", role: { in: ["internal_operator", "super_admin"] } }, select: { userId: true } });
    if (staff.length) {
      await notify({ orgId: internal.id, audience: { userIds: staff.map((s) => s.userId) }, kind: "support", title: `${input.blocking ? "Blocking: " : ""}${title}`, href: "/admin/support", severity: input.blocking ? "warning" : "info", dedupeKey: `support:${issue.id}` });
    }
  }
  return issue;
}

export async function listRequests(orgId: string) {
  return prisma.supportIssue.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, status: true, severity: true, createdAt: true, resolvedAt: true, resolution: true } });
}
