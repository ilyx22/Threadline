import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { getClient, listAuditLog } from "@/lib/data/admin";
import { diagnosisSummary } from "@/lib/data/diagnosis";
import { installationView } from "@/lib/data/installation";
import { openRun, publishedRuns } from "@/lib/data/runs";
import { CONSTRAINT_DIMENSION_META, type ConstraintDimension } from "@/lib/domain/enums";
import { volumeVerdict } from "@/lib/domain/diagnosis";
import { MILESTONE_STATUS_META } from "@/lib/domain/installation";
import { longFormEnabled, longFormScope } from "@/lib/domain/longform";
import { recordingReadinessSummary } from "@/lib/data/readiness";
import { READINESS_STATUS_META, type ReadinessStatus } from "@/lib/domain/readiness";
import { LongFormScope } from "./longform-scope";
import { SyntheticScope } from "./synthetic-scope";
import { ProofAdmin } from "./proof-admin";
import { proofPermissionView, testimonialGate } from "@/lib/data/proof-permission";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Avatar, DefinitionList, StatCard } from "@/components/ui/data";
import { Progress } from "@/components/ui/controls";
import { IntegrationStatusBadge, OrgStatusBadge, RoleBadge } from "@/components/ui/status";
import { compactNumber, money } from "@/lib/utils/format";
import { formatDate, relativeTime } from "@/lib/utils/dates";
import { integrationByProvider } from "@/lib/integrations/registry";
import { ClientConfigForm } from "./client-config-form";
import { EngagementPanel } from "./engagement-panel";
import { currentEngagement, ensurePeriods } from "@/lib/commercial/engagements";

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireInternal("admin.clients.manage");

  const client = await getClient(id);
  if (!client || client.kind !== "client") notFound();

  const [audit, installation, diagnosis, currentRun, briefs, readiness] = await Promise.all([
    listAuditLog(client.id, 20),
    installationView(client.id),
    diagnosisSummary(client.id, admin.role),
    openRun(client.id),
    publishedRuns(client.id, 3),
    recordingReadinessSummary(client.id),
  ]);
  const scope = longFormScope(client.modulesEnabled);
  const proofView = await proofPermissionView(client.id);
  const engagementRow = await currentEngagement(client.id);
  if (engagementRow && (engagementRow.status === "active" || engagementRow.status === "paused")) await ensurePeriods(engagementRow.id);
  const engagement = engagementRow ? await currentEngagement(client.id) : null;
  const scopeChanges = engagement ? await prisma.scopeChange.findMany({ where: { engagementId: engagement.id }, orderBy: { createdAt: "desc" } }) : [];
  const offerName = engagement ? ((JSON.parse(engagement.offerSnapshot) as { name?: string }).name ?? "Engagement") : "";

  const proofGate = testimonialGate(proofView);
  const configuredIntegrations = client.integrations.filter((i) => i.status === "configured");

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Clients", href: "/admin/clients" }, { label: client.name }]}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OrgStatusBadge status={client.status} />
            <Badge tone="outline">{client.packageTier}</Badge>
            <Badge tone="outline">Onboarding: {client.onboardingStage.replace(/_/g, " ")}</Badge>
          </div>
          <h1 className="mt-3 text-hero">{client.name}</h1>
          <p className="mt-2 text-[13px] text-muted">
            /{client.slug}
            {client.website ? (
              <>
                {" · "}
                <a
                  href={client.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent transition-colors hover:text-accent-bright"
                >
                  {client.website.replace(/^https?:\/\//, "")}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href={`/app/${client.slug}`} variant="secondary" iconRight={ExternalLink}>
            Open workspace
          </ButtonLink>
          {client.onboardingStage !== "complete" ? (
            <ButtonLink href={`/onboarding/${client.slug}`} variant="accent">
              Onboarding
            </ButtonLink>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Content items" value={client._count.contentItems} />
        <StatCard label="Ideas" value={client._count.ideas} />
        <StatCard label="Research" value={client._count.researchItems} />
        <StatCard
          label="Published (30d)"
          value={client.performance.published}
          sublabel={`${compactNumber(client.performance.views)} views`}
          emphasis
        />
        <StatCard
          label="Pipeline"
          value={client._count.inquiries}
          sublabel="records"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EngagementPanel
            engagement={
              engagement
                ? {
                    id: engagement.id,
                    status: engagement.status,
                    offerName,
                    currency: engagement.currency,
                    setupFeeMinor: engagement.setupFeeMinor,
                    periodFeeMinor: engagement.periodFeeMinor,
                    periodDays: engagement.periodDays,
                    initialPeriods: engagement.initialPeriods,
                    startDate: engagement.startDate ? engagement.startDate.toISOString().slice(0, 10) : null,
                    earlyWinDueDate: engagement.earlyWinDueDate ? engagement.earlyWinDueDate.toISOString().slice(0, 10) : null,
                    timezone: engagement.timezone,
                    periods: engagement.periods.map((p) => ({ number: p.number, startDate: p.startDate.toISOString().slice(0, 10), endDate: p.endDate.toISOString().slice(0, 10), status: p.status, feeMinor: p.feeMinor })),
                    scopeChanges: scopeChanges.map((c) => ({ id: c.id, summary: c.summary, state: c.state, effectiveFromPeriod: c.effectiveFromPeriod, feeChangeMinor: c.feeChangeMinor })),
                  }
                : null
            }
          />

          <ClientConfigForm
            orgId={client.id}
            defaults={{
              name: client.name,
              status: client.status,
              packageTier: client.packageTier,
              website: client.website ?? "",
              industry: client.industry ?? "",
              geography: client.geography ?? "",
              setupFee: client.setupFee / 100,
              periodFee: client.periodFee / 100,
              supportNotes: client.supportNotes ?? "",
              accentHex: client.accentHex ?? "",
            }}
            currency={client.currency}
          />

          {/* ------------------------- Delivery state ------------------------- */}
          <Card>
            <CardHeader
              title="Installation"
              eyebrow={
                installation.complete
                  ? "Complete"
                  : installation.day
                    ? `Day ${installation.day} · ${installation.progress}%`
                    : `${installation.progress}%`
              }
              description="Derived from real workspace records. An operator blocker always overrides it."
              action={
                <ButtonLink
                  href={`/app/${client.slug}/install`}
                  variant="ghost"
                  size="sm"
                  iconRight={ExternalLink}
                >
                  Open
                </ButtonLink>
              }
            />
            <CardBody className="pt-0">
              <Progress value={installation.progress} />
              <ul className="mt-4 space-y-2">
                {installation.milestones.map((milestone) => {
                  const meta = MILESTONE_STATUS_META[milestone.status];
                  return (
                    <li key={milestone.key} className="text-[12.5px]">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="text-ink">{milestone.label}</span>
                        <span className="ml-auto text-ghost">{milestone.detail}</span>
                      </div>
                      {milestone.blockedReason ? (
                        <p className="mt-1 pl-1 text-[12px] leading-relaxed text-negative">
                          {milestone.blockedReason}
                        </p>
                      ) : null}
                      <p className="mt-0.5 pl-1 text-[11.5px] leading-relaxed text-faint">
                        {milestone.operatorAction}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Constraint diagnosis"
              eyebrow={diagnosis ? diagnosis.status : "Not started"}
              action={
                <ButtonLink
                  href={`/app/${client.slug}/intelligence/diagnosis`}
                  variant="ghost"
                  size="sm"
                  iconRight={ExternalLink}
                >
                  Open
                </ButtonLink>
              }
            />
            <CardBody className="pt-0">
              {!diagnosis ? (
                <p className="py-4 text-center text-[12.5px] text-faint">
                  No diagnosis. Until one exists, every recommendation for this client is an
                  assumption that more content is the answer.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-[15px] font-medium text-ink">
                      {CONSTRAINT_DIMENSION_META[
                        diagnosis.primaryConstraint as ConstraintDimension
                      ]?.label ?? diagnosis.primaryConstraint}
                    </p>
                    <Badge tone="outline">{diagnosis.severity}</Badge>
                    <span className="text-[11.5px] text-ghost">
                      {diagnosis.dimensionsRated}/9 rated · avg {diagnosis.average.toFixed(1)} ·
                      confidence {diagnosis.confidence}%
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                    {volumeVerdict(diagnosis.primaryConstraint as ConstraintDimension)}
                  </p>
                  {diagnosis.recommendedAction ? (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-faint">
                      Next: {diagnosis.recommendedAction}
                    </p>
                  ) : null}
                  {diagnosis.reviewDate ? (
                    <p className="mt-2 text-[11.5px] text-ghost">
                      Review due {formatDate(diagnosis.reviewDate)}
                      {diagnosis.reviewDate < new Date() ? " — overdue" : ""}
                    </p>
                  ) : null}
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Intelligence cycles"
              eyebrow={currentRun ? `Open: ${currentRun.status}` : `${briefs.length} published`}
              action={
                <ButtonLink
                  href={`/app/${client.slug}/intelligence/runs`}
                  variant="ghost"
                  size="sm"
                  iconRight={ExternalLink}
                >
                  Open
                </ButtonLink>
              }
            />
            <CardBody className="pt-0">
              {currentRun ? (
                <p className="mb-3 rounded-md border border-line bg-elevated px-3 py-2 text-[12.5px] text-ink">
                  <span className="text-accent">In progress: </span>
                  {currentRun.label} — {currentRun.status}
                </p>
              ) : null}
              {briefs.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-faint">
                  No brief has been published to this client yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {briefs.map((brief) => (
                    <li
                      key={brief.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12.5px]"
                    >
                      <Link
                        href={`/app/${client.slug}/intelligence/runs/${brief.id}`}
                        className="text-ink hover:text-accent"
                      >
                        {brief.label}
                      </Link>
                      <span className="text-ghost">
                        {brief.approvedCount} approved · {brief._count.research} evidence
                      </span>
                      <span className="ml-auto text-ghost">
                        {brief.publishedAt ? relativeTime(brief.publishedAt) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recording setup"
              eyebrow={
                readiness
                  ? READINESS_STATUS_META[readiness.status as ReadinessStatus].label
                  : "Not submitted"
              }
              description="Whether this client can actually produce publishable footage, repeatably."
              action={
                <ButtonLink
                  href={`/app/${client.slug}/install/recording`}
                  variant="ghost"
                  size="sm"
                  iconRight={ExternalLink}
                >
                  Open
                </ButtonLink>
              }
            />
            <CardBody className="pt-0">
              {!readiness ? (
                <p className="py-4 text-center text-[12.5px] text-faint">
                  The client has not described their setup yet. Until they do, the first batch is a
                  guess.
                </p>
              ) : (
                <>
                  <p className="text-[13px] leading-relaxed text-muted">
                    {READINESS_STATUS_META[readiness.status as ReadinessStatus].description}
                  </p>
                  {readiness.clientAction ? (
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-warning">
                      Client action: {readiness.clientAction}
                    </p>
                  ) : null}
                  {readiness.recommendation ? (
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-faint">
                      {readiness.recommendation}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[11.5px] text-ghost">
                    {readiness.checksAssessed} of 7 checks assessed
                    {readiness.reviewedAt ? ` · reviewed ${formatDate(readiness.reviewedAt)}` : ""}
                  </p>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Long-form"
              eyebrow={longFormEnabled(client.modulesEnabled) ? "In scope" : "Pilot / custom"}
              description="YouTube long-form is a pilot with its own capacity and pricing, never a silent part of the retainer."
            />
            <CardBody className="pt-0">
              <LongFormScope
                orgId={client.id}
                enabled={longFormEnabled(client.modulesEnabled)}
                label={scope.label}
                note={scope.note}
                tone={scope.tone}
                canManage={admin.can("longform.manage")}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Proof and testimonial"
              eyebrow={proofGate.appropriate ? "Ask is appropriate" : "Not yet"}
              description="A testimonial is asked for after a confirmed positive outcome, never because time has passed. Permissions are the client's to grant."
            />
            <CardBody className="pt-0">
              <ProofAdmin orgSlug={client.slug} view={proofView} gate={proofGate} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Workspace status"
              eyebrow={client.synthetic ? "Synthetic" : "Real client"}
              description="Whether anything in this workspace may be treated as a real client result."
            />
            <CardBody className="pt-0">
              <SyntheticScope
                orgId={client.id}
                synthetic={client.synthetic}
                canManage={admin.can("admin.clients.manage")}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent activity" eyebrow="Audit log" />
            <CardBody className="pt-0">
              {audit.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-faint">Nothing recorded yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {audit.map((entry) => (
                    <li key={entry.id} className="flex gap-2.5">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] leading-snug text-muted">
                          <span className="text-ink">{entry.actor?.name ?? "System"}</span>{" "}
                          {entry.summary}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ghost">
                          {entry.action} · {relativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Commercials" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  { label: "Setup fee", value: money(client.setupFee, client.currency) },
                  { label: "Fee per 4-week period", value: money(client.periodFee, client.currency) },
                  { label: "Currency", value: client.currency },
                  {
                    label: "Started",
                    value: client.startedAt ? formatDate(client.startedAt) : "—",
                  },
                  {
                    label: "Last activity",
                    value: client.lastActivityAt ? relativeTime(client.lastActivityAt) : "Never",
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Brand Brain" eyebrow="Context strength" />
            <CardBody className="pt-0">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-muted">Completeness</span>
                <span className="text-[17px] font-medium tabular text-accent">
                  {client.brandBrain?.completeness ?? 0}%
                </span>
              </div>
              <Progress value={client.brandBrain?.completeness ?? 0} className="mt-2.5" />
              <p className="mt-3 text-[11.5px] text-ghost">
                {client.brandBrain?.updatedAt
                  ? `Last updated ${formatDate(client.brandBrain.updatedAt)}`
                  : "Never populated"}
              </p>
              <Link
                href={`/app/${client.slug}/intelligence`}
                className="mt-3 inline-block text-[12.5px] text-accent transition-colors hover:text-accent-bright"
              >
                Open the Brand Brain
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Members" eyebrow={`${client.memberships.length}`} />
            <CardBody className="pt-0">
              <ul className="space-y-2.5">
                {client.memberships.map((membership) => (
                  <li key={membership.id} className="flex items-center gap-2.5">
                    <Avatar
                      name={membership.user.name}
                      hue={membership.user.avatarHue}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] text-ink">{membership.user.name}</p>
                      <p className="truncate text-[11px] text-ghost">{membership.user.email}</p>
                    </div>
                    <RoleBadge role={membership.role} />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Integrations"
              eyebrow={`${configuredIntegrations.length} configured`}
            />
            <CardBody className="pt-0">
              <ul className="space-y-2">
                {client.integrations.slice(0, 8).map((integration) => {
                  const definition = integrationByProvider(integration.provider);
                  return (
                    <li
                      key={integration.id}
                      className="flex items-center justify-between gap-3 text-[12.5px]"
                    >
                      <span className="truncate text-muted">
                        {definition?.name ?? integration.provider}
                      </span>
                      <IntegrationStatusBadge status={integration.status} />
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          {client.supportNotes ? (
            <Card>
              <CardHeader title="Support notes" eyebrow="Internal" />
              <CardBody className="pt-0">
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                  {client.supportNotes}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
