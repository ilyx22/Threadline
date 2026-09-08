import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Users,
} from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { assignableEditors, contentComments, getContentItem } from "@/lib/data/content";
import { contentLineage } from "@/lib/data/lineage";
import { PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { Badge, Pill, PriorityBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Avatar, DefinitionList } from "@/components/ui/data";
import { StageBadge, StageProgress } from "@/components/ui/status";
import { bytes, compactNumber, duration } from "@/lib/utils/format";
import { formatDate, formatDateTime, relativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { ContentWorkspace } from "./content-workspace";

export const metadata: Metadata = { title: "Content" };

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "production.view");

  const [item, comments, editors, lineage] = await Promise.all([
    getContentItem(ctx.org.id, id),
    contentComments(ctx.org.id, id, ctx.role),
    assignableEditors(ctx.org.id),
    contentLineage(ctx.org.id, id, slug),
  ]);

  if (!item || !lineage) notFound();

  const totalViews = item.publishRecords.reduce((a, r) => a + (r.snapshots[0]?.views ?? 0), 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Production", href: `/app/${slug}/production` },
          { label: item.title },
        ]}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={item.stage} />
            <PriorityBadge priority={item.priority} />
            <Pill>{metaOf(PLATFORM_META, item.platform).label}</Pill>
            <Pill>{item.format.replace(/_/g, " ")}</Pill>
            {item.revisionCount > 0 ? (
              <Badge tone="warning">
                {item.revisionCount} revision{item.revisionCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-hero">{item.title}</h1>
          {item.selectedHook ? (
            <p className="mt-3 border-l-2 border-accent-line pl-3 text-[14px] italic leading-relaxed text-muted">
              {item.selectedHook}
            </p>
          ) : null}
          <div className="mt-4">
            <StageProgress stage={item.stage} />
          </div>
        </div>
      </header>

      <ContentWorkspace
        slug={slug}
        canEdit={ctx.can("production.edit")}
        canApprove={ctx.can("production.approve")}
        canAssign={ctx.can("production.assign")}
        canUpload={ctx.can("library.upload")}
        canGenerate={ctx.can("ai.generate")}
        item={{
          id: item.id,
          title: item.title,
          stage: item.stage,
          platform: item.platform,
          priority: item.priority,
          dueDate: item.dueDate ? item.dueDate.toISOString() : null,
          editorId: item.editorId,
          selectedHook: item.selectedHook,
        }}
        editors={editors.map((e) => ({ id: e.id, name: e.name, avatarHue: e.avatarHue }))}
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          kind: c.kind,
          resolved: c.resolved,
          authorName: c.author?.name ?? "Threadline",
          authorHue: c.author?.avatarHue ?? 210,
          createdAt: c.createdAt.toISOString(),
        }))}
        packages={item.packageList.map((p) => ({
          id: p.id,
          platform: p.platform,
          title: p.title,
          caption: p.caption,
          description: p.description,
          hashtags: p.hashtags,
          overlays: p.overlays,
          thumbnailConcepts: p.thumbnailConcepts,
          ctaOptions: p.ctaOptions,
          clipOpportunities: p.clipOpportunities,
          repurposing: p.repurposing,
          status: p.status,
          generatedBy: p.generatedBy,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------------------- Script + assets ---------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {item.scriptVersion ? (
            <Card>
              <CardHeader
                title="Script"
                eyebrow={`Version ${item.scriptVersion.version}`}
                action={
                  item.script ? (
                    <Link
                      href={`/app/${slug}/create/scripts/${item.script.id}`}
                      className="text-[12px] text-accent transition-colors hover:text-accent-bright"
                    >
                      Open in editor
                    </Link>
                  ) : null
                }
              />
              <CardBody className="pt-0">
                <p className="text-[15px] font-medium leading-relaxed text-ink">
                  {item.scriptVersion.hook}
                </p>
                <div className="mt-4 whitespace-pre-wrap text-[13.5px] leading-[1.85] text-muted">
                  {item.scriptVersion.body}
                </div>
                {item.scriptVersion.cta ? (
                  <p className="mt-4 border-t border-line pt-4 text-[13.5px] text-accent">
                    {item.scriptVersion.cta}
                  </p>
                ) : null}
                {item.scriptVersion.filmingNotes ? (
                  <div className="mt-4 rounded-md border border-line bg-surface p-3.5">
                    <p className="text-eyebrow mb-2 text-faint">Filming notes</p>
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                      {item.scriptVersion.filmingNotes}
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Files" eyebrow={`${item.assets.length} attached`} />
            <CardBody className="pt-0">
              {item.assets.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
                  No files attached yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {item.assets.map((asset) => (
                    <li key={asset.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <Paperclip className="size-3.5 shrink-0 text-faint" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{asset.title}</p>
                        <p className="mt-0.5 text-[11px] text-ghost">
                          {asset.category.replace(/_/g, " ")}
                          {asset.sizeBytes ? ` · ${bytes(asset.sizeBytes)}` : ""}
                          {asset.uploadedBy ? ` · ${asset.uploadedBy.name}` : ""} ·{" "}
                          {relativeTime(asset.createdAt)}
                        </p>
                      </div>
                      <Pill>v{asset.version}</Pill>
                      {asset.storagePath ? (
                        <a
                          href={`/api/files/${asset.storagePath}`}
                          className="shrink-0 p-1 text-ghost transition-colors hover:text-muted"
                          aria-label={`Download ${asset.title}`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : asset.externalUrl ? (
                        <a
                          href={asset.externalUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="shrink-0 p-1 text-ghost transition-colors hover:text-muted"
                          aria-label={`Open ${asset.title}`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* ---------------------------------- Lineage --------------------------------- */}
          <Card>
            <CardHeader
              title="Lineage"
              eyebrow="Organisational memory"
              description="Where this piece came from, and everything it produced."
            />
            <CardBody className="pt-0">
              <ol className="relative">
                {lineage.steps.map((step, i) => {
                  const last = i === lineage.steps.length - 1;
                  return (
                    <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                      {!last ? (
                        <span className="absolute left-[11px] top-6 bottom-0 w-px bg-line" aria-hidden />
                      ) : null}
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
                          step.status === "complete"
                            ? "border-positive/35 bg-positive-soft text-positive"
                            : step.status === "current"
                              ? "border-accent-line bg-accent-soft text-accent"
                              : "border-line bg-surface text-ghost",
                        )}
                      >
                        {step.status === "complete" ? (
                          <CheckCircle2 className="size-3" aria-hidden />
                        ) : step.status === "current" ? (
                          <Clock className="size-3" aria-hidden />
                        ) : (
                          <Circle className="size-2.5" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-eyebrow text-faint">{step.stage}</p>
                        <p className="mt-1 text-[13px] leading-snug text-ink">
                          {step.href ? (
                            <Link
                              href={step.href}
                              className="transition-colors hover:text-accent"
                            >
                              {step.title}
                            </Link>
                          ) : (
                            step.title
                          )}
                        </p>
                        {step.detail ? (
                          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                            {step.detail}
                          </p>
                        ) : null}
                        {step.meta ? (
                          <p className="mt-1 text-[11.5px] text-ghost">{step.meta}</p>
                        ) : null}
                        {step.at ? (
                          <p className="mt-1 text-[11px] text-ghost">
                            {formatDateTime(step.at)}
                            {step.actor ? ` · ${step.actor}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>
        </div>

        {/* -------------------------------- Sidebar -------------------------------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  {
                    label: "Editor",
                    value: item.editor ? (
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={item.editor.name} hue={item.editor.avatarHue} size="xs" />
                        {item.editor.name}
                      </span>
                    ) : (
                      "Unassigned"
                    ),
                  },
                  { label: "Founder", value: item.founder?.name ?? "—" },
                  { label: "Due", value: item.dueDate ? formatDate(item.dueDate) : "No date" },
                  { label: "Recorded", value: item.recordedAt ? formatDate(item.recordedAt) : "Not yet" },
                  {
                    label: "Approved",
                    value: item.approvedAt
                      ? `${formatDate(item.approvedAt)}${item.approvedBy ? ` by ${item.approvedBy.name}` : ""}`
                      : "Not yet",
                  },
                  { label: "Live", value: item.liveAt ? formatDate(item.liveAt) : "Not yet" },
                ]}
              />
            </CardBody>
          </Card>

          {item.publishRecords.length > 0 ? (
            <Card>
              <CardHeader
                title="Distribution"
                eyebrow={totalViews > 0 ? `${compactNumber(totalViews)} views` : "Scheduled"}
              />
              <CardBody className="space-y-3 pt-0">
                {item.publishRecords.map((record) => {
                  const snapshot = record.snapshots[0];
                  return (
                    <div key={record.id} className="rounded-md border border-line bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-medium text-ink">
                          {metaOf(PLATFORM_META, record.platform).label}
                        </span>
                        <Badge tone={record.status === "published" ? "positive" : "outline"}>
                          {record.status}
                        </Badge>
                      </div>
                      {snapshot ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
                          <span>
                            <span className="tabular text-ink">{compactNumber(snapshot.views)}</span>{" "}
                            views
                          </span>
                          {snapshot.retentionPct > 0 ? (
                            <span>
                              <span className="tabular text-ink">{snapshot.retentionPct}%</span>{" "}
                              retention
                            </span>
                          ) : null}
                          {snapshot.leads > 0 ? (
                            <span>
                              <span className="tabular text-ink">{snapshot.leads}</span> leads
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {record.url ? (
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-accent transition-colors hover:text-accent-bright"
                        >
                          View live
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          ) : null}

          {item.inquiries.length > 0 ? (
            <Card accent>
              <CardHeader
                title="Commercial signal"
                eyebrow={`${item.inquiries.length} attributed`}
                description="Conversations this piece produced."
              />
              <CardBody className="pt-0">
                <ul className="space-y-2">
                  {item.inquiries.map((inquiry) => (
                    <li key={inquiry.id} className="flex items-center gap-2.5">
                      <Users className="size-3.5 shrink-0 text-faint" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                        {inquiry.name}
                        {inquiry.company ? (
                          <span className="text-faint"> · {inquiry.company}</span>
                        ) : null}
                      </span>
                      <Badge tone="outline">{inquiry.stage.replace(/_/g, " ")}</Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {/* Timeline */}
          <Card>
            <CardHeader title="History" eyebrow={`${item.events.length} events`} />
            <CardBody className="pt-0">
              <ul className="space-y-3">
                {item.events.slice(0, 14).map((event) => (
                  <li key={event.id} className="flex gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-snug text-muted">
                        <span className="text-ink">{event.actor?.name ?? "Threadline"}</span>{" "}
                        {event.type === "stage_change" && event.toStage
                          ? `moved it to ${event.toStage.replace(/_/g, " ")}`
                          : event.type.replace(/_/g, " ")}
                      </p>
                      {event.note ? (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{event.note}</p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-ghost">
                        {relativeTime(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {item.script ? (
            <Link
              href={`/app/${slug}/create/scripts/${item.script.id}`}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-elevated px-4 py-3 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <FileText className="size-4 text-faint" aria-hidden />
              Open the script
              {item.script.estimatedSeconds ? (
                <span className="ml-auto text-[11.5px] text-ghost">
                  {duration(item.script.estimatedSeconds)}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
