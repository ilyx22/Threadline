import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { listMembers, listTasks, taskCounts } from "@/lib/data/workspace";
import { EmptyState } from "@/components/ui/feedback";
import { TaskList, NewTaskButton } from "./task-client";
import { DeliveryLoadSummary } from "./delivery-load";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "tasks.view");

  const [clientTasks, internalTasks, counts, members] = await Promise.all([
    listTasks(ctx.org.id, { audience: "client" }),
    ctx.isInternal ? listTasks(ctx.org.id, { audience: "internal" }) : Promise.resolve([]),
    taskCounts(ctx.org.id, "client"),
    listMembers(ctx.org.id),
  ]);

  const open = clientTasks.filter((t) => t.status === "open" || t.status === "in_progress");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Tasks</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Only things that genuinely need you. Recording and approval tasks are created and closed
            automatically as content moves — this is not a project-management tool.
          </p>
        </div>
        <NewTaskButton
          slug={slug}
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          canCreateInternal={ctx.isInternal}
        />
      </header>

      {clientTasks.length === 0 && internalTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing needs you"
          description="Tasks appear here when a decision, a recording, an approval or a piece of information is required from you."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-medium tabular text-ink">{open.length}</span>
                <span className="text-[12px] text-faint">Open</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-medium tabular text-ink">{counts.done ?? 0}</span>
                <span className="text-[12px] text-faint">Completed</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-medium tabular text-ink">
                  {open.reduce((a, t) => a + (t.estimateMin ?? 0), 0)}
                </span>
                <span className="text-[12px] text-faint">Minutes estimated</span>
              </div>
            </div>

            <TaskList
              slug={slug}
              canComplete={ctx.can("tasks.complete")}
              tasks={clientTasks.map(serialiseTask)}
              emptyLabel="Nothing needs you right now."
            />
          </section>

          {ctx.isInternal && internalTasks.length > 0 ? (
            <section>
              <h2 className="mb-3 text-[15px] font-medium text-ink">Internal operations</h2>
              <p className="mb-3 text-[12.5px] text-muted">
                Visible to Threadline staff only. The client does not see these.
              </p>
              {/*
                What delivery actually costs, measured rather than estimated.
                Operator-only: this is Threadline's own instrumentation, and a
                client has no reason to see how long their work took us.
              */}
              <DeliveryLoadSummary
                currency={ctx.org.currency}
                synthetic={ctx.org.synthetic}
                activeMinutes={internalTasks.reduce((a, t) => a + (t.activeMinutes ?? 0), 0)}
                waitingMinutes={internalTasks.reduce((a, t) => a + (t.waitingMinutes ?? 0), 0)}
                costMinor={internalTasks.reduce((a, t) => a + t.costMinor, 0)}
                logged={internalTasks.filter((t) => t.activeMinutes !== null).length}
                total={internalTasks.length}
              />

              <TaskList
                slug={slug}
                canComplete
                showLoad
                tasks={internalTasks.map(serialiseTask)}
                emptyLabel="No operational tasks."
              />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function serialiseTask(task: Awaited<ReturnType<typeof listTasks>>[number]) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    kind: task.kind,
    audience: task.audience,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    estimateMin: task.estimateMin,
    activeMinutes: task.activeMinutes,
    waitingMinutes: task.waitingMinutes,
    costMinor: task.costMinor,
    workClass: task.workClass,
    loadNote: task.loadNote,
    assigneeName: task.assignee?.name ?? null,
    assigneeHue: task.assignee?.avatarHue ?? 210,
    entityType: task.entityType,
    entityId: task.entityId,
  };
}
