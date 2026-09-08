import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbulb, Video } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { getScript } from "@/lib/data/scripts";
import { isLiveAi } from "@/lib/ai";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Card, CardBody } from "@/components/ui/card";
import { StageBadge } from "@/components/ui/status";
import { ScriptEditor } from "./script-editor";

export const metadata: Metadata = { title: "Script" };

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "scripts.view");
  const script = await getScript(ctx.org.id, id);
  if (!script) notFound();

  const contentItem = script.contentItems[0];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Create", href: `/app/${slug}/create` },
          { label: "Scripts", href: `/app/${slug}/create/scripts` },
          { label: script.title },
        ]}
      />

      {script.idea || contentItem ? (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5">
            {script.idea ? (
              <Link
                href={`/app/${slug}/create/ideas/${script.idea.id}`}
                className="inline-flex items-center gap-2 text-[12.5px] text-muted transition-colors hover:text-accent"
              >
                <Lightbulb className="size-3.5 text-faint" aria-hidden />
                <span className="text-ghost">From idea:</span>
                <span className="text-ink">{script.idea.title}</span>
              </Link>
            ) : null}
            {contentItem ? (
              <Link
                href={`/app/${slug}/production/${contentItem.id}`}
                className="inline-flex items-center gap-2 text-[12.5px] text-muted transition-colors hover:text-accent"
              >
                <Video className="size-3.5 text-faint" aria-hidden />
                <span className="text-ghost">In production:</span>
                <StageBadge stage={contentItem.stage} />
              </Link>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <ScriptEditor
        slug={slug}
        isLive={isLiveAi()}
        canEdit={ctx.can("scripts.edit")}
        canApprove={ctx.can("scripts.approve")}
        inProduction={Boolean(contentItem)}
        script={{
          id: script.id,
          title: script.title,
          scriptType: script.scriptType,
          platform: script.platform,
          qaState: script.qaState,
          estimatedSeconds: script.estimatedSeconds,
          currentVersion: script.currentVersion,
          ideaAngle: script.idea?.angle ?? null,
          ideaHook: script.idea?.hookConcept ?? null,
        }}
        current={
          script.current
            ? {
                hook: script.current.hook,
                altHooks: script.current.altHooks,
                body: script.current.body,
                cta: script.current.cta ?? "",
                filmingNotes: script.current.filmingNotes ?? "",
                claims: script.current.claims,
                contextUsed: script.current.contextUsed,
                version: script.current.version,
              }
            : null
        }
        history={script.history.map((h) => ({
          id: h.id,
          version: h.version,
          changeSummary: h.changeSummary,
          generatedBy: h.generatedBy,
          createdAt: h.createdAt.toISOString(),
          authorName: h.authorName,
          wordCount: h.wordCount,
        }))}
      />
    </div>
  );
}
