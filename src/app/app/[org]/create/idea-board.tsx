"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  FileText,
  Signal,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { IdeaStatusBadge } from "@/components/ui/status";
import { Tooltip } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { priorityBand } from "@/lib/domain/scoring";
import { COMMERCIAL_INTENT_META, PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";
import { setIdeaStatusAction } from "@/lib/actions/ideas";

export type IdeaRow = {
  id: string;
  title: string;
  concept: string | null;
  angle: string | null;
  hookConcept: string | null;
  pillar: string | null;
  platform: string;
  format: string;
  status: string;
  source: string;
  commercialIntent: string;
  priorityScore: number;
  noveltyScore: number;
  relevanceScore: number;
  proofStrength: number;
  formatFit: number;
  evidenceCount: number;
  scriptCount: number;
  patternTitle: string | null;
  createdAt: Date;
};

/**
 * Idea list with selection and bulk actions.
 *
 * Selection state is client-side; every mutation goes through the server action,
 * which re-validates the transition for each idea. A bulk action that includes
 * an illegal transition fails as a whole and says which idea blocked it, rather
 * than silently applying to some.
 */
export function IdeaBoard({
  slug,
  ideas,
  canApprove,
  canEdit,
  filtered,
}: {
  slug: string;
  ideas: IdeaRow[];
  canApprove: boolean;
  canEdit: boolean;
  filtered: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();

  // Clear selections when the underlying list changes (filter or navigation).
  React.useEffect(() => {
    setSelected(new Set());
  }, [ideas]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = ideas.length > 0 && selected.size === ideas.length;

  const bulk = (status: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await setIdeaStatusAction(slug, ids, status);
      if (result.ok) {
        toast.success(result.message ?? "Ideas updated.");
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
          selected.size > 0 ? "border-accent-line bg-accent-soft" : "border-line bg-surface",
        )}
      >
        <Checkbox
          checked={allSelected ? true : selected.size > 0 ? "indeterminate" : false}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(ideas.map((i) => i.id)) : new Set())
          }
          aria-label="Select all ideas"
        />
        <span className="text-[12.5px] text-muted">
          {selected.size > 0 ? (
            <>
              <span className="font-medium text-ink">{selected.size}</span> selected
            </>
          ) : (
            <>
              {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              {filtered ? " matching filters" : ""}
            </>
          )}
        </span>

        {selected.size > 0 ? (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button size="xs" variant="secondary" icon={Star} loading={pending} onClick={() => bulk("shortlisted")}>
              Shortlist
            </Button>
            {canApprove ? (
              <Button
                size="xs"
                variant="accent"
                icon={CheckCircle2}
                loading={pending}
                onClick={() => bulk("approved")}
              >
                Approve
              </Button>
            ) : null}
            <Button size="xs" variant="ghost" icon={X} loading={pending} onClick={() => bulk("rejected")}>
              Reject
            </Button>
            <Button size="xs" variant="ghost" icon={Archive} loading={pending} onClick={() => bulk("archived")}>
              Archive
            </Button>
          </div>
        ) : null}
      </div>

      <ul className="space-y-2">
        {ideas.map((idea) => {
          const band = priorityBand(idea.priorityScore);
          const intent = metaOf(COMMERCIAL_INTENT_META, idea.commercialIntent);
          const isSelected = selected.has(idea.id);

          return (
            <li key={idea.id}>
              <div
                className={cn(
                  "group flex gap-3 rounded-lg border bg-elevated p-3.5 transition-colors",
                  isSelected
                    ? "border-accent-line bg-[#181d23]"
                    : "border-line hover:border-line-strong hover:bg-[#181d23]",
                )}
              >
                {canEdit ? (
                  <Checkbox
                    className="mt-1"
                    checked={isSelected}
                    onCheckedChange={() => toggle(idea.id)}
                    aria-label={`Select ${idea.title}`}
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <Link
                      href={`/app/${slug}/create/ideas/${idea.id}`}
                      className="min-w-0 text-[14px] font-medium leading-snug text-ink transition-colors hover:text-accent"
                    >
                      {idea.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <IdeaStatusBadge status={idea.status} />
                      <Tooltip
                        content={`Relevance ${idea.relevanceScore} · Novelty ${idea.noveltyScore} · Proof ${idea.proofStrength} · Format fit ${idea.formatFit}`}
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[12px] tabular",
                            band.tone === "accent"
                              ? "border-accent-line bg-accent-soft text-accent"
                              : band.tone === "info"
                                ? "border-info/25 bg-info-soft text-info"
                                : "border-line text-faint",
                          )}
                        >
                          {Math.round(idea.priorityScore)}
                        </span>
                      </Tooltip>
                    </div>
                  </div>

                  {idea.angle || idea.concept ? (
                    <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                      {idea.angle ?? idea.concept}
                    </p>
                  ) : null}

                  {idea.hookConcept ? (
                    <p className="mt-2 border-l-2 border-line pl-2.5 text-[12.5px] italic leading-relaxed text-faint">
                      {idea.hookConcept}
                    </p>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {idea.pillar ? <Pill>{idea.pillar}</Pill> : null}
                    <Pill>{metaOf(PLATFORM_META, idea.platform).label}</Pill>
                    <Pill>{idea.format.replace(/_/g, " ")}</Pill>
                    <Badge tone={intent.tone}>{intent.label}</Badge>
                    {idea.source === "ai" ? <Pill>AI generated</Pill> : null}
                    {idea.source === "learning" ? <Pill>From a signal</Pill> : null}
                    {idea.evidenceCount > 0 ? (
                      <Tooltip content={`${idea.evidenceCount} linked research items`}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-ghost">
                          <Signal className="size-3" aria-hidden />
                          {idea.evidenceCount}
                        </span>
                      </Tooltip>
                    ) : null}
                    {idea.scriptCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ghost">
                        <FileText className="size-3" aria-hidden />
                        {idea.scriptCount}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[11px] text-ghost">
                      {relativeTime(idea.createdAt)}
                    </span>
                  </div>

                  {idea.patternTitle ? (
                    <p className="mt-2 text-[11.5px] text-ghost">
                      Signal: <span className="text-faint">{idea.patternTitle}</span>
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/app/${slug}/create/ideas/${idea.id}`}
                  className="hidden shrink-0 items-center self-center rounded-md p-2 text-ghost transition-colors group-hover:text-muted sm:flex"
                  aria-label={`Open ${idea.title}`}
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
