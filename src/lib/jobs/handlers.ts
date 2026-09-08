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

export const JOB_TYPES = ["email.send", "metrics.refresh", "metrics.refresh_org", "maintenance.prune"] as const;
