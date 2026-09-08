import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FileText, Mic } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { listScripts, scriptCounts } from "@/lib/data/scripts";
import { scriptingQueue } from "@/lib/data/ideas";
import {
  PLATFORM_META,
  PLATFORM_OPTIONS,
  SCRIPT_QA_STATES,
  SCRIPT_QA_META,
  SCRIPT_TYPE_OPTIONS,
  metaOf,
} from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { Badge, Pill } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { ScriptQaBadge, StageBadge } from "@/components/ui/status";
import { duration, pluralise } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/dates";
import { NewScriptButton } from "./script-actions";

export const metadata: Metadata = { title: "Scripts" };

export default async function ScriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "scripts.view");

  const filters = {
    qaState: readFilter(query, "state"),
    scriptType: readFilter(query, "type"),
    platform: readFilter(query, "platform"),
    search: readSingle(query, "q"),
  };

  const [scripts, counts, queue] = await Promise.all([
    listScripts(ctx.org.id, filters),
    scriptCounts(ctx.org.id),
    scriptingQueue(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const needsCheck = scripts.filter((s) => s.unverifiedClaims > 0).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Scripts</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Full scripts with alternate hooks, filming notes and version history. Every statement a
            reasonable person could challenge is flagged as a claim — and a script cannot reach the
            recording queue while any claim is unverified.
          </p>
        </div>
        {ctx.can("scripts.edit") ? <NewScriptButton slug={slug} /> : null}
      </header>

      {queue.length > 0 ? (
        <Card accent>
          <CardHeader
            title={`${pluralise(queue.length, "approved idea")} waiting to be scripted`}
            eyebrow="Scripting queue"
            description="Highest priority first."
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {queue.slice(0, 5).map((idea) => (
                <li key={idea.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-8 shrink-0 text-[12px] tabular text-accent">
                    {Math.round(idea.priorityScore)}
                  </span>
                  <Link
                    href={`/app/${slug}/create/ideas/${idea.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                  >
                    {idea.title}
                  </Link>
                  <Pill>{metaOf(PLATFORM_META, idea.platform).label}</Pill>
                </li>
              ))}
            </ul>
            {queue.length > 5 ? (
              <p className="mt-3 text-[12px] text-faint">
                +{queue.length - 5} more in the{" "}
                <Link href={`/app/${slug}/create?status=approved`} className="text-accent hover:underline">
                  approved ideas
                </Link>
                .
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {needsCheck > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-[13px] leading-relaxed text-muted">
            <span className="font-medium text-ink">
              {pluralise(needsCheck, "script needs", "scripts need")} fact-checking.
            </span>{" "}
            These cannot enter the recording queue until every flagged claim is verified or removed.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
        {SCRIPT_QA_STATES.map((state) => (
          <div key={state} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-medium tabular text-ink">{counts[state] ?? 0}</span>
            <span className="text-[12px] text-faint">{SCRIPT_QA_META[state].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search scripts" />
          <MultiFilter
            name="state"
            label="QA state"
            options={SCRIPT_QA_STATES.map((s) => ({
              value: s,
              label: SCRIPT_QA_META[s].label,
              count: counts[s] ?? 0,
            }))}
          />
          <MultiFilter name="type" label="Type" options={SCRIPT_TYPE_OPTIONS} />
          <MultiFilter name="platform" label="Platform" options={PLATFORM_OPTIONS} />
        </FilterBar>
        <ActiveFilters labels={{ state: "State", type: "Type", platform: "Platform" }} />
      </div>

      {scripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={total === 0 ? "No scripts yet" : "Nothing matches those filters"}
          description={
            total === 0
              ? "Approve an idea and send it to scripting, or start a script from scratch."
              : `${total} scripts exist in this workspace.`
          }
          action={total === 0 && ctx.can("scripts.edit") ? <NewScriptButton slug={slug} /> : undefined}
          compact={total > 0}
        />
      ) : (
        <ul className="space-y-2">
          {scripts.map((script) => {
            const contentItem = script.contentItems[0];
            return (
              <li key={script.id}>
                <Link
                  href={`/app/${slug}/create/scripts/${script.id}`}
                  className="block rounded-lg border border-line bg-elevated p-3.5 transition-colors hover:border-line-strong hover:bg-[#181d23]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <p className="min-w-0 text-[14px] font-medium leading-snug text-ink">
                      {script.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {script.unverifiedClaims > 0 ? (
                        <Badge tone="warning" icon={AlertTriangle}>
                          {script.unverifiedClaims} to verify
                        </Badge>
                      ) : null}
                      {contentItem ? <StageBadge stage={contentItem.stage} /> : null}
                      <ScriptQaBadge state={script.qaState} />
                    </div>
                  </div>

                  {script.latest?.hook ? (
                    <p className="mt-2 line-clamp-2 border-l-2 border-line pl-2.5 text-[12.5px] italic leading-relaxed text-muted">
                      {script.latest.hook}
                    </p>
                  ) : (
                    <p className="mt-2 text-[12.5px] text-ghost">No body written yet.</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Pill>{script.scriptType.replace(/_/g, " ")}</Pill>
                    <Pill>{metaOf(PLATFORM_META, script.platform).label}</Pill>
                    <Pill>{duration(script.estimatedSeconds)}</Pill>
                    {script.wordCount > 0 ? <Pill>{script.wordCount} words</Pill> : null}
                    <Pill>v{script._count.versions}</Pill>
                    {script.idea ? (
                      <span className="text-[11px] text-ghost">from “{script.idea.title}”</span>
                    ) : null}
                    <span className="ml-auto text-[11px] text-ghost">
                      {relativeTime(script.updatedAt)}
                    </span>
                  </div>

                  {script.qaState === "approved" && !contentItem ? (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-accent">
                      <Mic className="size-3.5" aria-hidden />
                      In the recording queue
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
