import "server-only";
import { prisma } from "@/lib/db/client";
import { stringify } from "@/lib/db/json";
import type { AuthContext } from "./guard";

/**
 * Audit trail.
 *
 * Written for every state transition, approval, permission change and admin
 * action. Deliberately best-effort: an audit failure must never roll back the
 * user's actual work, but it is logged so the gap is visible.
 */

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
};

export async function audit(ctx: AuthContext, input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: ctx.org.id,
        actorId: ctx.user.id,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        meta: stringify(input.meta ?? {}),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}

/** Audit for internal actions that may not belong to a single tenant. */
export async function auditInternal(
  actorId: string,
  input: AuditInput & { orgId?: string | null },
) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: input.orgId ?? null,
        actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        meta: stringify(input.meta ?? {}),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record internal", input.action, error);
  }
}

/** Touch an organisation's activity marker; drives admin "last activity". */
export async function touchOrg(orgId: string) {
  await prisma.organization
    .update({ where: { id: orgId }, data: { lastActivityAt: new Date() } })
    .catch(() => {});
}
