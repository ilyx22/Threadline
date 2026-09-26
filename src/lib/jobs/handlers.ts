import "server-only";
import { registerHandler } from "./index";
import { sendEmail } from "@/lib/email";
import type { EmailTemplateKey, TemplateInput } from "@/lib/email/templates";

/**
 * Job handlers. Registered once per process by importing this module.
 * Each handler must be safe to run twice — a worker that dies after the
 * side effect but before `complete()` will re-run the job.
 */

export type EmailJobPayload = { to: string; template: EmailTemplateKey; data: Record<string, unknown>; orgId?: string | null };

registerHandler<EmailJobPayload>("email.send", async (payload, job) => {
  await sendEmail({
    to: payload.to,
    template: payload.template,
    data: payload.data as TemplateInput<typeof payload.template>,
    orgId: payload.orgId ?? job.orgId,
    jobId: job.id,
  });
});

registerHandler<{ publishRecordId: string; orgId: string }>("metrics.refresh", async (payload) => {
  const { refreshMetricsForRecord } = await import("@/lib/analytics/ingest");
  await refreshMetricsForRecord(payload.orgId, payload.publishRecordId);
});

registerHandler<{ orgId: string }>("metrics.refresh_org", async (payload) => {
  const { refreshMetricsForOrg } = await import("@/lib/analytics/ingest");
  await refreshMetricsForOrg(payload.orgId);
});

registerHandler("maintenance.prune", async () => {
  const { pruneTokens } = await import("@/lib/auth/tokens");
  const { pruneExpiredSessions } = await import("@/lib/auth/session");
  const { purgeExpiredStates } = await import("@/lib/integrations/oauth");
  await pruneTokens();
  await pruneExpiredSessions();
  await purgeExpiredStates();
});

registerHandler<{ outboxId: string }>("crm.sync", async (payload) => {
  const { sendOutboxRow } = await import("@/lib/crm/outbox");
  await sendOutboxRow(payload.outboxId);
});

registerHandler<{ taskId: string }>("processing.submit", async (payload) => {
  const { submitTask } = await import("@/lib/processing");
  await submitTask(payload.taskId);
});

registerHandler<{ recordId: string }>("publish.run", async (payload) => {
  const { runPublish } = await import("@/lib/publishing");
  await runPublish(payload.recordId);
});

registerHandler<{ recordId: string; attempt: number }>("publish.poll", async (payload) => {
  const { pollPublish } = await import("@/lib/publishing");
  await pollPublish(payload.recordId, payload.attempt);
});

registerHandler<{ exportId: string }>("export.build", async (payload) => {
  const { buildExport } = await import("@/lib/exports");
  await buildExport(payload.exportId);
});

registerHandler<{ assetId: string; orgId: string }>("mine.asset", async (payload) => {
  const { prisma } = await import("@/lib/db/client");
  const { mineAsset } = await import("@/lib/research/miner");
  // Mined on behalf of the workspace's owner, recorded on each item.
  const owner = await prisma.membership.findFirst({ where: { orgId: payload.orgId, isOwner: true }, select: { userId: true } });
  if (owner) await mineAsset(payload.orgId, owner.userId, payload.assetId);
});

/**
 * The daily housekeeping run (queued once per day by the cron runner): keep
 * every active engagement's service periods current, lapse old invitations,
 * re-offer held CRM work, and prune expired tokens and sessions.
 */
registerHandler("daily.tick", async () => {
  const { prisma } = await import("@/lib/db/client");
  const { ensurePeriods } = await import("@/lib/commercial/engagements");
  const { expireInvitations } = await import("@/lib/team/invitations");
  const { kickCrm } = await import("@/lib/crm/outbox");
  for (const e of await prisma.engagement.findMany({ where: { status: "active" }, select: { id: true } })) await ensurePeriods(e.id);
  await expireInvitations();
  // RNW-01: open renewal reviews ahead of the end of the initial term.
  const { openDueRenewals } = await import("@/lib/commercial/renewals");
  await openDueRenewals();
  // PRF-01: expired proof permissions flag the placements that rely on them.
  const { flagWithdrawnPlacements } = await import("@/lib/proof/placements");
  await flagWithdrawnPlacements();
  // BIL-01/BIL-04: draft due invoices and overdue reminders; issuing and
  // sending remain a person's decision.
  const { draftDueInvoices, draftOverdueReminders } = await import("@/lib/billing/invoices");
  for (const e of await prisma.engagement.findMany({ where: { status: "active" }, select: { id: true } })) await draftDueInvoices(e.id);
  await draftOverdueReminders();
  // OFF-01: end client access when an offboarding export window closes.
  const { closeExpiredAccess } = await import("@/lib/commercial/offboarding");
  await closeExpiredAccess();
  // NOT-01: escalate approvals left waiting, then send opted-in digests.
  const { escalateStaleApprovals, sendDigests } = await import("@/lib/notify");
  await escalateStaleApprovals();
  await sendDigests();
  // FILE-02/FILE-05: abort abandoned direct uploads; submit processing that waited for a provider.
  const { expireStaleUploads } = await import("@/lib/storage/direct");
  await expireStaleUploads();
  const { submitWaitingTasks } = await import("@/lib/processing");
  await submitWaitingTasks();
  // FILE-06: delete export files past their download window.
  const { expireExports } = await import("@/lib/exports");
  await expireExports();
  // INT-02: refresh platform tokens that expire within a day.
  const { refreshExpiringTokens } = await import("@/lib/publishing");
  await refreshExpiringTokens();
  // INT-03: queue any due scheduled publish whose job was lost.
  const { queueDuePublishes } = await import("@/lib/publishing");
  await queueDuePublishes();
  // COM-07: Threadline's own prospect follow-ups and unread applications.
  const { remindProspectFollowUps } = await import("@/lib/sales/follow-ups");
  await remindProspectFollowUps();
  // AI-06: remind lead owners of follow-ups that are due.
  const { remindDueFollowUps } = await import("@/lib/leads");
  await remindDueFollowUps();
  const held = await prisma.crmOutbox.findMany({ where: { state: { in: ["pending", "failed"] } }, select: { id: true }, take: 200 });
  await kickCrm(held.map((h) => h.id));
  const { pruneTokens } = await import("@/lib/auth/tokens");
  const { pruneExpiredSessions } = await import("@/lib/auth/session");
  await pruneTokens();
  await pruneExpiredSessions();
});

export const JOB_TYPES = ["email.send", "metrics.refresh", "metrics.refresh_org", "maintenance.prune", "crm.sync", "daily.tick", "processing.submit", "publish.run", "publish.poll", "export.build", "mine.asset"] as const;
