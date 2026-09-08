"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Columns3, FileText, List, Paperclip, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill, PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Tooltip,
} from "@/components/ui/menu";
import { StageBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { CONTENT_STAGE_META, PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { nextContentStages } from "@/lib/domain/workflow";
import { dueLabel, isOverdue } from "@/lib/utils/dates";
import { assignEditorAction, moveContentAction } from "@/lib/actions/content";

export type BoardItem = {
  id: string;
  title: string;
  stage: string;
  platform: string;
  format: string;
  priority: string;
  dueDate: string | null;
  revisionCount: number;
  editorName: string | null;
  editorId: string | null;
  editorHue: number;
  assetCount: number;
  packageCount: number;
  publishCount: number;
  pillar: string | null;
  hasScript: boolean;
};

type Editor = { id: string; name: string; avatarHue: number };

/**
 * Kanban and table over the same data and the same actions.
 *
 * Stage moves are offered from `nextContentStages`, the same map the server
 * enforces — so the board never presents a move the server would reject.
 */
export function ProductionBoard({
  slug,
  columns,
  editors,
  canEdit,
  canApprove,
  canAssign,
}: {
  slug: string;
  columns: { stage: string; items: BoardItem[] }[];
  editors: Editor[];
  canEdit: boolean;
  canApprove: boolean;
  canAssign: boolean;
}) {
  const [view, setView] = React.useState<"board" | "table">("board");
  const [revision, setRevision] = React.useState<BoardItem | null>(null);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("tl.production.view");
      if (stored === "table" || stored === "board") setView(stored);
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const changeView = (next: "board" | "table") => {
    setView(next);
    try {
      localStorage.setItem("tl.production.view", next);
    } catch {
      /* ignore */
    }
  };

  const move = (item: BoardItem, stage: string) => {
    // A revision request must carry a reason; collect it before calling.
    if (stage === "changes_requested") {
      setRevision(item);
      return;
    }
    startTransition(async () => {
      const result = await moveContentAction(slug, item.id, stage);
      if (result.ok) {
        toast.success(result.message ?? "Stage updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const assign = (item: BoardItem, editorId: string | null) => {
    startTransition(async () => {
      const result = await assignEditorAction(slug, item.id, editorId);
      if (result.ok) {
        toast.success(result.message ?? "Assignment updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const allItems = columns.flatMap((c) => c.items);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">
          {allItems.length} {allItems.length === 1 ? "piece" : "pieces"}
        </p>
        <SegmentedControl
          value={view}
          onValueChange={changeView}
          size="sm"
          options={[
            { value: "board", label: "Board", icon: Columns3 },
            { value: "table", label: "Table", icon: List },
          ]}
        />
      </div>

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 lg:-mx-6 lg:px-6">
          <div className="flex min-w-max gap-3">
            {columns.map((column) => {
              const meta = metaOf(CONTENT_STAGE_META, column.stage);
              return (
                <section key={column.stage} className="flex w-[17rem] shrink-0 flex-col">
                  <header className="mb-2.5 flex items-center gap-2 px-0.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: CONTENT_STAGE_META[column.stage as keyof typeof CONTENT_STAGE_META]?.color }}
                      aria-hidden
                    />
                    <h2 className="text-[12.5px] font-medium text-ink">{meta.label}</h2>
                    <span className="text-[11.5px] tabular text-ghost">{column.items.length}</span>
                  </header>

                  <div className="flex-1 space-y-2 rounded-lg bg-surface/40 p-2">
                    {column.items.length === 0 ? (
                      <p className="px-2 py-6 text-center text-[11.5px] text-ghost">Empty</p>
                    ) : (
                      column.items.map((item) => (
                        <BoardCard
                          key={item.id}
                          slug={slug}
                          item={item}
                          editors={editors}
                          canEdit={canEdit}
                          canApprove={canApprove}
                          canAssign={canAssign}
                          pending={pending}
                          onMove={move}
                          onAssign={assign}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Stage</TH>
              <TH>Platform</TH>
              <TH>Editor</TH>
              <TH>Priority</TH>
              <TH>Due</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {allItems.map((item) => (
              <TR key={item.id} interactive>
                <TD>
                  <Link href={`/app/${slug}/production/${item.id}`}>
                    <CellTitle secondary={item.pillar ?? undefined}>{item.title}</CellTitle>
                  </Link>
                </TD>
                <TD>
                  <StageBadge stage={item.stage} />
                </TD>
                <TD>{metaOf(PLATFORM_META, item.platform).label}</TD>
                <TD>
                  {item.editorName ? (
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={item.editorName} hue={item.editorHue} size="xs" />
                      {item.editorName}
                    </span>
                  ) : (
                    <span className="text-ghost">Unassigned</span>
                  )}
                </TD>
                <TD>
                  <PriorityBadge priority={item.priority} />
                </TD>
                <TD className={isOverdue(item.dueDate) ? "text-negative" : undefined}>
                  {dueLabel(item.dueDate)}
                </TD>
                <TD align="right">
                  <StageMenu
                    item={item}
                    canEdit={canEdit}
                    canApprove={canApprove}
                    pending={pending}
                    onMove={move}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Revision request — a reason is mandatory */}
      <Dialog open={Boolean(revision)} onOpenChange={(open) => !open && setRevision(null)}>
        <DialogContent>
          <DialogHeader
            title="Request changes"
            description="Name the timecode and the change. A revision request without specifics costs an entire edit cycle."
          />
          <form
            action={(formData) => {
              const note = String(formData.get("note") ?? "").trim();
              if (!note) {
                toast.error("Add a revision note.");
                return;
              }
              const item = revision;
              if (!item) return;
              startTransition(async () => {
                const result = await moveContentAction(slug, item.id, "changes_requested", note);
                if (result.ok) {
                  toast.success(result.message ?? "Sent back with your notes.");
                  setRevision(null);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              });
            }}
          >
            <DialogBody>
              <Field
                label="What needs to change"
                htmlFor="note"
                hint="The editor sees this verbatim."
              >
                <Textarea
                  id="note"
                  name="note"
                  rows={5}
                  required
                  autoFocus
                  placeholder="Cut the first eight seconds and open on the variance line. Everything after 00:20 is fine."
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRevision(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending}>
                Send back
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardCard({
  slug,
  item,
  editors,
  canEdit,
  canApprove,
  canAssign,
  pending,
  onMove,
  onAssign,
}: {
  slug: string;
  item: BoardItem;
  editors: Editor[];
  canEdit: boolean;
  canApprove: boolean;
  canAssign: boolean;
  pending: boolean;
  onMove: (item: BoardItem, stage: string) => void;
  onAssign: (item: BoardItem, editorId: string | null) => void;
}) {
  const overdue = isOverdue(item.dueDate) && item.stage !== "live";

  return (
    <article
      className={cn(
        "rounded-lg border bg-elevated p-3 transition-colors hover:border-line-strong",
        overdue ? "border-negative/30" : "border-line",
      )}
    >
      <Link
        href={`/app/${slug}/production/${item.id}`}
        className="block text-[12.5px] font-medium leading-snug text-ink transition-colors hover:text-accent"
      >
        {item.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill>{metaOf(PLATFORM_META, item.platform).label}</Pill>
        {item.priority === "high" || item.priority === "urgent" ? (
          <PriorityBadge priority={item.priority} />
        ) : null}
        {item.revisionCount > 0 ? (
          <Tooltip content={`${item.revisionCount} revision${item.revisionCount === 1 ? "" : "s"}`}>
            <span className="inline-flex items-center gap-1 text-[11px] text-warning">
              <RotateCcw className="size-3" aria-hidden />
              {item.revisionCount}
            </span>
          </Tooltip>
        ) : null}
        {item.assetCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-ghost">
            <Paperclip className="size-3" aria-hidden />
            {item.assetCount}
          </span>
        ) : null}
        {item.hasScript ? <FileText className="size-3 text-ghost" aria-hidden /> : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {canAssign ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded text-[11px] text-faint transition-colors hover:text-ink"
                >
                  {item.editorName ? (
                    <>
                      <Avatar name={item.editorName} hue={item.editorHue} size="xs" />
                      <span className="truncate">{item.editorName}</span>
                    </>
                  ) : (
                    <span className="text-ghost">Assign editor</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                {editors.map((editor) => (
                  <DropdownMenuItem key={editor.id} onSelect={() => onAssign(item, editor.id)}>
                    {editor.name}
                  </DropdownMenuItem>
                ))}
                {item.editorId ? (
                  <DropdownMenuItem onSelect={() => onAssign(item, null)}>Unassign</DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : item.editorName ? (
            <span className="flex items-center gap-1.5 text-[11px] text-faint">
              <Avatar name={item.editorName} hue={item.editorHue} size="xs" />
              <span className="truncate">{item.editorName}</span>
            </span>
          ) : null}
        </div>

        <span className={cn("shrink-0 text-[11px]", overdue ? "text-negative" : "text-ghost")}>
          {overdue ? (
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="size-3" aria-hidden />
              {dueLabel(item.dueDate)}
            </span>
          ) : (
            dueLabel(item.dueDate)
          )}
        </span>
      </div>

      {canEdit ? (
        <div className="mt-2.5 border-t border-line pt-2.5">
          <StageMenu
            item={item}
            canEdit={canEdit}
            canApprove={canApprove}
            pending={pending}
            onMove={onMove}
            compact
          />
        </div>
      ) : null}
    </article>
  );
}

function StageMenu({
  item,
  canEdit,
  canApprove,
  pending,
  onMove,
  compact,
}: {
  item: BoardItem;
  canEdit: boolean;
  canApprove: boolean;
  pending: boolean;
  onMove: (item: BoardItem, stage: string) => void;
  compact?: boolean;
}) {
  if (!canEdit) return null;

  const options = nextContentStages(item.stage as never).filter(
    (stage) => stage !== "approved" || canApprove,
  );

  if (options.length === 0) {
    return compact ? <span className="text-[11px] text-ghost">No further stage</span> : null;
  }

  // A single obvious next step is a button, not a menu.
  if (options.length === 1) {
    const target = options[0]!;
    return (
      <Button
        size="xs"
        variant={target === "approved" ? "accent" : "ghost"}
        iconRight={ArrowRight}
        loading={pending}
        onClick={() => onMove(item, target)}
        className={compact ? "-ml-2" : undefined}
      >
        {metaOf(CONTENT_STAGE_META, target).label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="xs" variant="ghost" className={compact ? "-ml-2" : undefined}>
          Move to
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "start" : "end"}>
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {options.map((stage) => (
          <DropdownMenuItem key={stage} onSelect={() => onMove(item, stage)}>
            <span className="flex-1">{metaOf(CONTENT_STAGE_META, stage).label}</span>
            {stage === "changes_requested" ? (
              <Badge tone="outline" className="ml-2">
                needs a note
              </Badge>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
