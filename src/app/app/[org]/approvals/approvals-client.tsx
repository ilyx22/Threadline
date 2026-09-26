"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Boxes, Check, FileText, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { bulkApproveAction } from "@/lib/actions/review";
import { relativeTime } from "@/lib/utils/dates";

export type QueueItem = {
  id: string;
  kind: "script" | "content" | "package";
  title: string;
  ask: string;
  context: string | null;
  href: string;
  waitingSince: string;
  waitingDays: number;
  hash: string | null;
  versionLabel: string | null;
};

const KIND_META: Record<QueueItem["kind"], { label: string; icon: React.ElementType; tone: "accent" | "info" | "purple" }> = {
  script: { label: "Script", icon: FileText, tone: "accent" },
  content: { label: "Edit", icon: Video, tone: "info" },
  package: { label: "Packaging", icon: Boxes, tone: "purple" },
};

/** The approval queue with safe bulk approval of selected current versions (CX-02). */
export function ApprovalQueue({ slug, items, canApprove }: { slug: string; items: QueueItem[]; canApprove: Record<QueueItem["kind"], boolean> }) {
  const router = useRouter();
  const allowed = (k: QueueItem["kind"]) => canApprove[k];
  const selectable = items.filter((i) => allowed(i.kind) && i.hash);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const key = (i: QueueItem) => `${i.kind}:${i.id}`;
  const toggle = (i: QueueItem) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key(i))) next.delete(key(i));
      else next.add(key(i));
      return next;
    });

  const approve = () => {
    const chosen = items.filter((i) => selected.has(key(i)) && i.hash).map((i) => ({ kind: i.kind, id: i.id, hash: i.hash! }));
    if (!chosen.length) return;
    if (!window.confirm(`Approve ${chosen.length} item${chosen.length === 1 ? "" : "s"} exactly as you see them now?`)) return;
    startTransition(async () => {
      const r = await bulkApproveAction(slug, chosen);
      if (r.ok) toast.success(r.message ?? "Approved.");
      else toast.error(r.error);
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {selectable.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-elevated px-4 py-2.5">
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            <input
              type="checkbox"
              checked={selected.size === selectable.length}
              onChange={(e) => setSelected(e.target.checked ? new Set(selectable.map(key)) : new Set())}
            />
            Select all you can approve
          </label>
          <span className="flex-1" />
          <Button size="sm" variant="primary" icon={Check} disabled={!selected.size} loading={pending} onClick={approve}>
            Approve selected ({selected.size})
          </Button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          const waited = item.waitingDays;
          const canPick = allowed(item.kind) && Boolean(item.hash);
          return (
            <li key={key(item)} className="flex items-start gap-3">
              {selectable.length > 1 ? (
                <input
                  type="checkbox"
                  aria-label={`Select ${item.title}`}
                  className="mt-6"
                  disabled={!canPick}
                  checked={selected.has(key(item))}
                  onChange={() => toggle(item)}
                />
              ) : null}
              <Link href={item.href} className="block min-w-0 flex-1">
                <Card interactive className="p-0">
                  <CardBody className="pt-4">
                    <div className="flex gap-4">
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border ${waited >= 3 ? "border-warning/35 bg-warning-soft text-warning" : "border-line bg-surface text-faint"}`}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {item.context ? <span className="text-[11.5px] text-ghost">{item.context}</span> : null}
                          {item.versionLabel ? <span className="text-[11.5px] text-ghost">· {item.versionLabel}</span> : null}
                          <span className={`ml-auto text-[11.5px] ${waited >= 3 ? "text-warning" : "text-ghost"}`}>waiting {relativeTime(new Date(item.waitingSince))}</span>
                        </div>
                        <p className="mt-2 text-[14.5px] font-medium leading-snug text-ink">{item.title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                          <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-hidden />
                          {item.ask}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
