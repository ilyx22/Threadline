import "server-only";
import { prisma } from "@/lib/db/client";
import { installationView } from "@/lib/data/installation";
import { EngagementError } from "./engagements";
import { dbDateFromIso, todayIn, type IsoDate } from "./calendar";

/**
 * Installation sign-off and the early win (ENG-03).
 *
 * Installation is its own phase: the client signs it off only when every item
 * on the checklist is complete (the gate), and the sign-off is recorded on the
 * engagement. The early win is defined at kickoff in words, and its actual
 * date is recorded with evidence when it happens. Nothing assumes a universal
 * day on which it must happen.
 */
async function currentFor(orgId: string) {
  const e = await prisma.engagement.findFirst({ where: { orgId, status: { in: ["draft", "active", "paused"] } }, orderBy: { createdAt: "desc" } });
  if (!e) throw new EngagementError("This workspace has no current engagement.");
  return e;
}

export async function signOffInstallation(orgId: string, userId: string, now = new Date()) {
  const e = await currentFor(orgId);
  if (e.installationSignedOffAt) return e;
  const view = await installationView(orgId);
  if (!view.complete) {
    const open = view.milestones.filter((m) => m.status !== "complete").map((m) => m.label);
    throw new EngagementError(`Installation is not finished yet. Still open: ${open.join("; ")}.`);
  }
  const done = await prisma.engagement.updateMany({ where: { id: e.id, installationSignedOffAt: null }, data: { installationSignedOffAt: now, installationSignedOffById: userId } });
  if (done.count !== 1) return prisma.engagement.findUniqueOrThrow({ where: { id: e.id } });
  return prisma.engagement.findUniqueOrThrow({ where: { id: e.id } });
}

export async function defineEarlyWin(orgId: string, definition: string) {
  const e = await currentFor(orgId);
  const text = definition.trim().slice(0, 500);
  if (text.length < 8) throw new EngagementError("Describe the early win as a concrete, checkable result.");
  if (e.earlyWinAchievedOn) throw new EngagementError("The early win has already been recorded; it is kept as it was agreed.");
  return prisma.engagement.update({ where: { id: e.id }, data: { earlyWinDefinition: text } });
}

export async function recordEarlyWin(orgId: string, input: { achievedOn?: IsoDate; evidence: string }, now = new Date()) {
  const e = await currentFor(orgId);
  if (!e.earlyWinDefinition) throw new EngagementError("Agree what the early win is before recording it.");
  const evidence = input.evidence.trim().slice(0, 1000);
  if (evidence.length < 8) throw new EngagementError("Say what shows the early win happened.");
  const day = input.achievedOn ?? todayIn(e.timezone, now);
  if (day > todayIn(e.timezone, now)) throw new EngagementError("An early win cannot be recorded for a future date.");
  return prisma.engagement.update({ where: { id: e.id }, data: { earlyWinAchievedOn: dbDateFromIso(day), earlyWinEvidence: evidence } });
}
