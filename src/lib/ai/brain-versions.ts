import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * Brand Brain versions (AI-03, ENG-04). The database trigger writes a version
 * on every change; this module reads them, restores one (which is itself a
 * new version, so a rollback is never destructive), and finds AI drafts
 * written against an older version, which need a refresh or a check.
 */
export async function currentBrainVersion(orgId: string) {
  return (await prisma.brandBrain.findUnique({ where: { orgId }, select: { version: true } }))?.version ?? null;
}

export async function listBrainVersions(orgId: string, take = 30) {
  return prisma.brandBrainVersion.findMany({ where: { orgId }, orderBy: { version: "desc" }, take, select: { version: true, changed: true, createdAt: true } });
}

/** Put an earlier version back. The trigger records it as the next version. */
export async function restoreBrainVersion(orgId: string, version: number) {
  const v = await prisma.brandBrainVersion.findUnique({ where: { orgId_version: { orgId, version } } });
  if (!v) throw new WorkflowError("That version does not exist.");
  const updated = await prisma.brandBrain.update({ where: { orgId }, data: { company: v.company, founder: v.founder, voice: v.voice, contentRules: v.contentRules } });
  return updated.version;
}

/** Scripts still in draft whose latest AI version was written against an older Brand Brain. */
export async function staleDrafts(orgId: string) {
  const current = await currentBrainVersion(orgId);
  if (current === null) return [];
  const scripts = await prisma.script.findMany({
    where: { orgId, qaState: { in: ["ai_draft", "needs_fact_check"] } },
    select: { id: true, title: true, versions: { orderBy: { version: "desc" }, take: 1, select: { brainVersion: true, generatedBy: true } } },
  });
  return scripts
    .filter((s) => s.versions[0] && s.versions[0].generatedBy !== "human" && s.versions[0].brainVersion !== null && s.versions[0].brainVersion < current)
    .map((s) => ({ id: s.id, title: s.title, writtenAgainst: s.versions[0].brainVersion!, current }));
}
