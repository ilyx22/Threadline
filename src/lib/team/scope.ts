import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * Assignment-scoped access for contractors (TEAM-09).
 *
 * An editor is a contractor. They see and work on the pieces they are
 * assigned to (as the piece's editor, or through a work assignment) and
 * nothing else in the workspace: not the rest of the board, not other
 * pieces' files. A work assignment without a piece covers every piece, for
 * a contractor trusted with the whole workspace. Everyone else is
 * unrestricted here; their capabilities already decide what they can do.
 *
 * Returns null for "every piece", or the list of piece ids in scope.
 */
export async function contentScope(orgId: string, userId: string, role: string): Promise<string[] | null> {
  if (role !== "editor") return null;
  const [assignments, edited] = await Promise.all([
    prisma.workAssignment.findMany({ where: { orgId, userId }, select: { contentItemId: true } }),
    prisma.contentItem.findMany({ where: { orgId, editorId: userId }, select: { id: true } }),
  ]);
  if (assignments.some((a) => a.contentItemId === null)) return null;
  return [...new Set([...assignments.map((a) => a.contentItemId!), ...edited.map((e) => e.id)])];
}

/** Refuse an action on a piece outside the caller's assignment. */
export async function assertContentInScope(ctx: { org: { id: string }; user: { id: string }; role: string }, contentItemId: string) {
  const scope = await contentScope(ctx.org.id, ctx.user.id, ctx.role);
  if (scope && !scope.includes(contentItemId)) throw new WorkflowError("You are not assigned to that piece.");
}

/** Whether a stored file is visible to the caller (files of pieces in scope, or files they uploaded). */
export async function assetInScope(orgId: string, userId: string, role: string, asset: { contentItemId: string | null; uploadedById: string | null }) {
  const scope = await contentScope(orgId, userId, role);
  if (!scope) return true;
  if (asset.uploadedById === userId) return true;
  return Boolean(asset.contentItemId && scope.includes(asset.contentItemId));
}
