import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Signal, Video } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { getIdea } from "@/lib/data/ideas";
import { explainIdeaPriority, priorityBand } from "@/lib/domain/scoring";
import { COMMERCIAL_INTENT_META, PLATFORM_META, RESEARCH_KIND_META, metaOf } from "@/lib/domain/enums";
import { Badge, Pill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/tabs";
import { DefinitionList, ScoreBar } from "@/components/ui/data";
import { IdeaStatusBadge, StageBadge, ScriptQaBadge } from "@/components/ui/status";
import { formatDate } from "@/lib/utils/dates";
import { IdeaDetailActions } from "./idea-detail-actions";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Idea" };

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "ideas.view");
  const idea = await getIdea(ctx.org.id, id);
  if (!idea) notFound();

  const band = priorityBand(idea.priorityScore);
  const components = explainIdeaPriority(idea);
  const intent = metaOf(COMMERCIAL_INTENT_META, idea.commercialIntent);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Create", href: `/app/${slug}/create` },
          { label: "Ideas", href: `/app/${slug}/create` },
          { label: idea.title },
        ]}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <IdeaStatusBadge status={idea.status} />
            <Badge tone={intent.tone}>{intent.label}</Badge>
            {idea.source === "ai" ? <Pill>AI generated</Pill> : null}
            {idea.source === "learning" ? <Pill>From a signal</Pill> : null}
            {idea.source === "onboarding" ? <Pill>From onboarding</Pill> : null}
          </div>
          <h1 className="mt-3 text-hero">{idea.title}</h1>
          {idea.concept ? (
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{idea.concept}</p>
          ) : null}
        </div>

        <IdeaDetailActions
          slug={slug}
          ideaId={idea.id}
          status={idea.status}
          hasScript={idea.scripts.length > 0}
          canApprove={ctx.can("ideas.approve")}
          canEdit={ctx.can("ideas.create")}
          canScript={ctx.can("scripts.edit")}
          experts={(await prisma.membership.findMany({ where: { orgId: ctx.org.id, isExpert: true, isOwner: false, status: "active" }, select: { userId: true, user: { select: { name: true } } } })).map((m) => ({ id: m.userId, name: m.user.name }))}
          defaults={{
            title: idea.title,
            concept: idea.concept ?? "",
            angle: idea.angle ?? "",
            hookConcept: idea.hookConcept ?? "",
            audience: idea.audience ?? "",
            painDesire: idea.painDesire ?? "",
            pillar: idea.pillar ?? "",
            platform: idea.platform,
            format: idea.format,
            objective: idea.objective ?? "",
            cta: idea.cta ?? "",
            commercialIntent: idea.commercialIntent,
            relevanceScore: idea.relevanceScore,
            noveltyScore: idea.noveltyScore,
            proofStrength: idea.proofStrength,
            formatFit: idea.formatFit,
            rationale: idea.rationale ?? "",
          }}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="The angle" eyebrow="Concept" />
            <CardBody className="space-y-5 pt-0">
              {idea.angle ? (
                <div>
                  <p className="text-eyebrow mb-1.5 text-faint">Approach</p>
                  <p className="text-[13.5px] leading-relaxed text-ink">{idea.angle}</p>
                </div>
              ) : null}
              {idea.hookConcept ? (
                <div>
                  <p className="text-eyebrow mb-1.5 text-faint">Hook direction</p>
                  <p className="border-l-2 border-accent-line pl-3 text-[14px] italic leading-relaxed text-ink">
                    {idea.hookConcept}
                  </p>
                </div>
              ) : null}
              <DefinitionList
                items={[
                  { label: "Audience", value: idea.audience || "—" },
                  { label: "Pain or desire", value: idea.painDesire || "—" },
                  { label: "Objective", value: idea.objective || "—" },
                  { label: "CTA", value: idea.cta || "—" },
                ]}
              />
            </CardBody>
          </Card>

          {/* Evidence — the lineage backwards */}
          <Card>
            <CardHeader
              title="Evidence"
              eyebrow="Why this idea exists"
              description="The research and signals this idea was built from."
            />
            <CardBody className="pt-0">
              {idea.pattern ? (
                <Link
                  href={`/app/${slug}/intelligence/signals/${idea.pattern.id}`}
                  className="mb-4 flex gap-3 rounded-lg border border-accent-line bg-accent-soft p-3.5 transition-colors hover:bg-[rgba(200,169,107,0.18)]"
                >
                  <Signal className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-eyebrow text-accent">Signal · {idea.pattern.kind}</p>
                    <p className="mt-1 text-[13px] font-medium text-ink">{idea.pattern.title}</p>
                    {idea.pattern.description ? (
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                        {idea.pattern.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ) : null}

              {idea.evidence.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
                  No research linked to this idea. Ideas grounded in captured research consistently
                  outperform ideas that are not.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {idea.evidence.map((link) => {
                    const kind = metaOf(RESEARCH_KIND_META, link.researchItem.kind);
                    return (
                      <li key={link.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Badge tone={kind.tone} className="mt-0.5 shrink-0">
                            {kind.label}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-snug text-ink">
                              {link.researchItem.title}
                            </p>
                            {link.researchItem.body ? (
                              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                                {link.researchItem.body}
                              </p>
                            ) : null}
                            {link.researchItem.sourceName ? (
                              <p className="mt-1 text-[11px] text-ghost">
                                {link.researchItem.sourceName}
                              </p>
                            ) : null}
                          </div>
                          {link.researchItem.url ? (
                            <a
                              href={link.researchItem.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="shrink-0 p-1 text-ghost transition-colors hover:text-muted"
                              aria-label="Open source"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Downstream — the lineage forwards */}
          {idea.scripts.length > 0 || idea.contentItems.length > 0 ? (
            <Card>
              <CardHeader title="What this produced" eyebrow="Downstream" />
              <CardBody className="space-y-3 pt-0">
                {idea.scripts.map((script) => (
                  <Link
                    key={script.id}
                    href={`/app/${slug}/create/scripts/${script.id}`}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong"
                  >
                    <FileText className="size-4 shrink-0 text-faint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{script.title}</span>
                    <ScriptQaBadge state={script.qaState} />
                  </Link>
                ))}
                {idea.contentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/${slug}/production/${item.id}`}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong"
                  >
                    <Video className="size-4 shrink-0 text-faint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{item.title}</span>
                    <StageBadge stage={item.stage} />
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card accent={band.tone === "accent"}>
            <CardHeader title="Priority" eyebrow="Score" />
            <CardBody className="pt-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-medium leading-none tabular text-accent">
                  {Math.round(idea.priorityScore)}
                </span>
                <Badge tone={band.tone}>{band.label}</Badge>
              </div>
              <div className="mt-5 space-y-3.5">
                {components.map((c) => (
                  <ScoreBar
                    key={c.label}
                    label={`${c.label} · ${Math.round(c.weight * 100)}% weight`}
                    value={c.value}
                    tone={c.value >= 75 ? "accent" : "neutral"}
                  />
                ))}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ghost">
                Priority is a weighted blend of these four scores plus a commercial-intent bonus.
                Nothing here is model-generated.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  { label: "Pillar", value: idea.pillar || "—" },
                  { label: "Platform", value: metaOf(PLATFORM_META, idea.platform).label },
                  { label: "Format", value: idea.format.replace(/_/g, " ") },
                  { label: "Source", value: idea.source.replace(/_/g, " ") },
                  {
                    label: "Created",
                    value: `${formatDate(idea.createdAt)}${idea.createdBy ? ` by ${idea.createdBy.name}` : ""}`,
                  },
                ]}
              />
            </CardBody>
          </Card>

          {idea.rationale ? (
            <Card>
              <CardHeader title="Rationale" eyebrow="Why it was scored this way" />
              <CardBody className="pt-0">
                <p className="text-[12.5px] leading-relaxed text-muted">{idea.rationale}</p>
              </CardBody>
            </Card>
          ) : null}

          <ButtonLink
            href={`/app/${slug}/create`}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            Back to ideas
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
