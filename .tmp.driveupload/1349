import "server-only";
import { prisma } from "@/lib/db/client";
import { loadBrandBrain } from "@/lib/data/workspace";
import {
  installationDay,
  installationProgress,
  isInstallationComplete,
  nextMilestone,
  resolveMilestones,
  type InstallationFacts,
  type MilestoneState,
} from "@/lib/domain/installation";

/**
 * Installation repository.
 *
 * Gathers the observable facts once, then hands them to the domain resolver.
 * Nothing about milestone status is decided here — this file only reads.
 */

export async function installationFacts(orgId: string): Promise<InstallationFacts> {
  const [
    brain,
    org,
    diagnosis,
    publishedRuns,
    runsInProgress,
    approvedSignals,
    scriptsReady,
    scriptsDrafted,
    contentItems,
    contentInProduction,
    recordingQueue,
    readiness,
  ] = await Promise.all([
    loadBrandBrain(orgId),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { onboardingStage: true },
    }),
    prisma.constraintDiagnosis.findFirst({
      where: { orgId, status: { in: ["active", "draft"] } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: { status: true, _count: { select: { assessments: true } } },
    }),
    prisma.intelligenceRun.count({ where: { orgId, status: "published" } }),
    prisma.intelligenceRun.count({
      where: { orgId, status: { in: ["scoping", "collecting", "synthesis", "review"] } },
    }),
    prisma.candidateSignal.count({ where: { orgId, decision: "approved" } }),
    prisma.script.count({ where: { orgId, qaState: { in: ["ready_to_record", "approved"] } } }),
    prisma.script.count({ where: { orgId, qaState: { in: ["ai_draft", "needs_fact_check"] } } }),
    prisma.contentItem.count({ where: { orgId } }),
    prisma.contentItem.count({
      where: { orgId, stage: { in: ["editing", "in_review", "changes_requested", "approved", "scheduled", "live"] } },
    }),
    // Scripts cleared to record that have not yet produced a content item.
    prisma.script.count({
      where: { orgId, qaState: { in: ["ready_to_record", "approved"] }, contentItems: { none: {} } },
    }),
    prisma.recordingReadiness.findUnique({
      where: { orgId },
      select: { status: true, submittedAt: true },
    }),
  ]);

  return {
    brandBrainCompleteness: brain.completeness,
    readinessStatus: readiness?.status ?? "not_assessed",
    readinessSubmitted: Boolean(readiness?.submittedAt),
    onboardingComplete: org?.onboardingStage === "complete",
    diagnosisActive: diagnosis?.status === "active",
    diagnosisDimensionsRated: diagnosis?._count.assessments ?? 0,
    publishedRuns,
    runsInProgress,
    approvedSignals,
    scriptsReady,
    scriptsDrafted,
    contentItems,
    contentInProduction,
    recordingQueue,
  };
}

export type InstallationView = {
  milestones: MilestoneState[];
  progress: number;
  complete: boolean;
  next: MilestoneState | null;
  day: number | null;
  startedAt: Date | null;
  blockers: MilestoneState[];
};

export async function installationView(orgId: string): Promise<InstallationView> {
  const [facts, stored, org] = await Promise.all([
    installationFacts(orgId),
    prisma.installationMilestone.findMany({
      where: { orgId },
      select: {
        key: true,
        note: true,
        blockedReason: true,
        signedOffAt: true,
        targetDate: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { startedAt: true, createdAt: true },
    }),
  ]);

  const milestones = resolveMilestones(facts, stored);
  const startedAt = org?.startedAt ?? org?.createdAt ?? null;

  return {
    milestones,
    progress: installationProgress(milestones),
    complete: isInstallationComplete(milestones),
    next: nextMilestone(milestones),
    day: installationDay(startedAt),
    startedAt,
    blockers: milestones.filter((m) => m.status === "blocked"),
  };
}

/** Compact form for the admin client list, where the full view is too heavy. */
export async function installationSummary(orgId: string) {
  const view = await installationView(orgId);
  return {
    progress: view.progress,
    complete: view.complete,
    day: view.day,
    nextKey: view.next?.key ?? null,
    nextLabel: view.next?.label ?? null,
    blockerCount: view.blockers.length,
  };
}
