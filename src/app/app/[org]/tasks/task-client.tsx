"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Trash2, X } from "lucide-react";
import { DeliveryLoadButton } from "./delivery-load";
import { cn } from "@/lib/utils/cn";
import { Badge, PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/data";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { createTaskAction, deleteTaskAction, setTaskStatusAction } from "@/lib/actions/workspace";
import { TASK_KINDS, TASK_KIND_META, metaOf } from "@/lib/domain/enums";
import { minutes } from "@/lib/utils/format";
import { dueLabel, isOverdue, toDateInput } from "@/lib/utils/dates";

type TaskView = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  audience: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimateMin: number | null;
  activeMinutes: number | null;
  waitingMinutes: number | null;
  costMinor: number;
  workClass: string | null;
  loadNote: string | null;
  assigneeName: string | null;
  assigneeHue: number;
  entityType: string | null;
  entityId: string | null;
};

export function TaskList({
  slug,
  tasks,
  canComplete,
  emptyLabel,
  showLoad,
}: {
  slug: string;
  tasks: TaskView[];
  canComplete: boolean;
  emptyLabel: string;
  /** Operator-only. Delivery Load is internal measurement, not client-facing. */
  showLoad?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const open = tasks.filter((t) => t.status === "open" || t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done" || t.status === "dismissed");

  const setStatus = (task: TaskView, status: string) => {
    startTransition(async () => {
      const result = await setTaskStatusAction(slug, task.id, status);
      if (result.ok) {
        toast.success(result.message ?? "Task updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = (task: TaskView) => {
    if (!window.confirm(`Remove "${task.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteTaskAction(slug, task.id);
      if (result.ok) {
        toast.success("Task removed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const href = (task: TaskView) => {
    if (task.entityType === "content_item" && task.entityId) {
      return `/app/${slug}/production/${task.entityId}`;
    }
    if (task.kind === "record") return `/app/${slug}/production/recording`;
    if (task.kind === "approve") return `/app/${slug}/production?stage=in_review`;
    if (task.kind === "upload") return `/app/${slug}/library`;
    return null;
  };

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-faint">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {open.map((task) => {
          const kind = metaOf(TASK_KIND_META, task.kind);
          const target = href(task);
          const overdue = isOverdue(task.dueDate);

          return (
            <li key={task.id}>
              <div
                className={cn(
                  "flex gap-3 rounded-lg border bg-elevated p-3.5 transition-colors",
                  overdue ? "border-negative/25" : "border-line",
                )}
              >
                {canComplete ? (
                  <Checkbox
                    className="mt-0.5"
                    checked={false}
                    onCheckedChange={() => setStatus(task, "done")}
                    disabled={pending}
                    aria-label={`Complete ${task.title}`}
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <p className="min-w-0 text-[13.5px] font-medium leading-snug text-ink">
                      {task.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                      {task.priority === "high" || task.priority === "urgent" ? (
                        <PriorityBadge priority={task.priority} />
                      ) : null}
                    </div>
                  </div>

                  {task.description ? (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                    <span className={overdue ? "text-negative" : "text-ghost"}>
                      {dueLabel(task.dueDate)}
                    </span>
                    {task.estimateMin ? (
                      <span className="text-ghost">~{minutes(task.estimateMin)}</span>
                    ) : null}
                    {task.assigneeName ? (
                      <span className="inline-flex items-center gap-1.5 text-ghost">
                        <Avatar name={task.assigneeName} hue={task.assigneeHue} size="xs" />
                        {task.assigneeName}
                      </span>
                    ) : null}
                    {target ? (
                      <Link
                        href={target}
                        className="ml-auto inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-bright"
                      >
                        Open
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                </div>

                {canComplete ? (
                  <div className="flex shrink-0 flex-col gap-0.5">
                    {showLoad ? (
                      <DeliveryLoadButton
                        slug={slug}
                        task={{
                          id: task.id,
                          title: task.title,
                          activeMinutes: task.activeMinutes,
                          waitingMinutes: task.waitingMinutes,
                          costMinor: task.costMinor,
                          workClass: task.workClass,
                          loadNote: task.loadNote,
                          done: task.status === "done",
                        }}
                      />
                    ) : null}
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={X}
                      loading={pending}
                      onClick={() => setStatus(task, "dismissed")}
                      title="Dismiss"
                    >
                      <span className="sr-only">Dismiss</span>
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Trash2}
                      loading={pending}
                      onClick={() => remove(task)}
                      title="Delete"
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {done.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer text-[12.5px] text-faint transition-colors hover:text-muted">
            {done.length} completed
          </summary>
          <ul className="mt-3 space-y-1.5">
            {done.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-faint line-through">
                  {task.title}
                </span>
                <Badge tone="outline">{task.status}</Badge>
                {canComplete ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    loading={pending}
                    onClick={() => setStatus(task, "open")}
                  >
                    Reopen
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function NewTaskButton({
  slug,
  members,
  canCreateInternal,
}: {
  slug: string;
  members: { id: string; name: string }[];
  canCreateInternal: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        New task
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="New task"
            description="Use this for things the system cannot infer. Recording and approval tasks are created automatically."
          />
          <ActionForm
            action={createTaskAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Task" htmlFor="taskTitle" error={fieldErrors.title}>
                    <Input id="taskTitle" name="title" required autoFocus />
                  </Field>
                  <Field label="Detail" htmlFor="taskDescription" optional>
                    <Textarea id="taskDescription" name="description" rows={3} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Type" htmlFor="taskKind">
                      <NativeSelect id="taskKind" name="kind" defaultValue="decide">
                        {TASK_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {TASK_KIND_META[k].label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Priority" htmlFor="taskPriority">
                      <NativeSelect id="taskPriority" name="priority" defaultValue="medium">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Due date" htmlFor="taskDue" optional>
                      <Input
                        id="taskDue"
                        name="dueDate"
                        type="date"
                        defaultValue={toDateInput(new Date())}
                      />
                    </Field>
                    <Field label="Estimate (minutes)" htmlFor="taskEstimate" optional>
                      <Input id="taskEstimate" name="estimateMin" type="number" min={0} max={600} />
                    </Field>
                  </div>

                  {members.length > 0 ? (
                    <Field label="Assign to" htmlFor="taskAssignee" optional>
                      <NativeSelect id="taskAssignee" name="assigneeId" defaultValue="">
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}

                  {canCreateInternal ? (
                    <Field
                      label="Visible to"
                      htmlFor="taskAudience"
                      hint="Internal tasks are hidden from the client."
                    >
                      <NativeSelect id="taskAudience" name="audience" defaultValue="client">
                        <option value="client">Client</option>
                        <option value="internal">Threadline internal</option>
                      </NativeSelect>
                    </Field>
                  ) : (
                    <input type="hidden" name="audience" value="client" />
                  )}
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Create task</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
