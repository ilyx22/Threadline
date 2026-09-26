import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { configReport } from "@/lib/env";
import { jobSummary } from "@/lib/jobs";
import { crmBacklog } from "@/lib/crm/outbox";
import { strandedWork } from "@/lib/team/members";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SystemButton } from "./system-client";

export const metadata: Metadata = { title: "System" };
export const dynamic = "force-dynamic";

const when = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : "—");

/**
 * The operator's view of the machinery (OPS-02): configuration problems, the
 * job queue and its dead letters, work waiting to reach the CRM, recent
 * webhook deliveries, email failures, and work stranded by suspensions.
 * Values of configuration are never shown, only names and problems.
 */
export default async function SystemPage() {
  await requireInternal("admin.view");
  const [{ env, issues }, jobs, crm, webhooks, emails, stranded, recentAudit] = await Promise.all([
    Promise.resolve(configReport()),
    jobSummary(),
    crmBacklog(),
    prisma.webhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 25, select: { id: true, provider: true, eventType: true, verified: true, error: true, processedAt: true, receivedAt: true, orgId: true } }),
    prisma.emailMessage.findMany({ where: { status: "failed" }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, toEmail: true, template: true, error: true, createdAt: true } }),
    strandedWork(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, action: true, summary: true, createdAt: true } }),
  ]);
  const errors = issues.filter((i) => i.level === "error");

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">System</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          What the background machinery is doing and what needs a person. Environment: <strong className="text-ink">{env}</strong>.
        </p>
      </header>

      <Card>
        <CardHeader title="Configuration" description={errors.length ? `${errors.length} problem(s) stop parts of the product working.` : "No blocking problems."} />
        <CardBody className="space-y-1.5 pt-0">
          {issues.length ? (
            issues.map((i) => (
              <p key={i.name + i.message} className="text-[13px]">
                <Badge tone={i.level === "error" ? "negative" : "neutral"}>{i.level}</Badge> <span className="font-mono text-ink">{i.name}</span> <span className="text-muted">{i.message}</span>
              </p>
            ))
          ) : (
            <p className="text-[13px] text-muted">Everything required is set.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Jobs" description={Object.entries(jobs.counts).map(([k, v]) => `${v} ${k}`).join(" · ") || "The queue is empty."} />
        <CardBody className="space-y-2 pt-0">
          {jobs.dead.length ? (
            jobs.dead.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <Badge tone="negative">dead</Badge>
                <span className="font-mono text-ink">{j.type}</span>
                <span className="text-muted">after {j.attempts} attempts: {j.lastError}</span>
                <SystemButton kind="job" id={j.id} />
              </div>
            ))
          ) : (
            <p className="text-[13px] text-muted">No dead jobs.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="CRM sync" description={crm.length ? `${crm.length} change(s) not yet in the CRM.` : "Everything is in the CRM."} />
        <CardBody className="space-y-2 pt-0">
          {crm.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <Badge tone={c.state === "needs_review" || c.state === "dead" ? "negative" : "neutral"}>{c.state}</Badge>
              <span className="font-mono text-ink">{c.operation}</span>
              <span className="text-muted">{c.lastError ?? ""}</span>
              {c.state !== "pending" ? <SystemButton kind="crm" id={c.id} /> : null}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent webhook deliveries" description="Unverified deliveries are logged and never acted on." />
        <CardBody className="space-y-1 pt-0">
          {webhooks.map((w) => (
            <p key={w.id} className="text-[12.5px] text-muted">
              <Badge tone={w.verified ? "positive" : "negative"}>{w.verified ? "verified" : "refused"}</Badge> {w.provider} · {w.eventType} · {when(w.receivedAt)}
              {w.error ? ` · ${w.error}` : ""}
            </p>
          ))}
          {!webhooks.length ? <p className="text-[13px] text-muted">None yet.</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Email failures" />
        <CardBody className="space-y-1 pt-0">
          {emails.map((m) => (
            <p key={m.id} className="text-[12.5px] text-muted">
              {when(m.createdAt)} · {m.template} to {m.toEmail.replace(/(.).*@/, "$1***@")} · {m.error}
            </p>
          ))}
          {!emails.length ? <p className="text-[13px] text-muted">No failed emails.</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Stranded work" description="Open tasks still assigned to suspended members." />
        <CardBody className="space-y-1 pt-0">
          {stranded.map((t) => (
            <p key={t.id} className="text-[12.5px] text-muted">{t.title}</p>
          ))}
          {!stranded.length ? <p className="text-[13px] text-muted">None.</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Latest audit entries" />
        <CardBody className="space-y-1 pt-0">
          {recentAudit.map((a) => (
            <p key={a.id} className="text-[12.5px] text-muted">
              {when(a.createdAt)} · <span className="font-mono">{a.action}</span> · {a.summary}
            </p>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
