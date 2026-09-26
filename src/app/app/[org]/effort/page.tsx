import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { FOUNDER_WEEKLY_BUDGET, founderMinutesByStep, recentEntries, weeklyEffort, weekStart } from "@/lib/effort";
import { KIND_LABEL, STEP_LABEL } from "@/lib/effort/labels";
import { EmptyState } from "@/components/ui/feedback";
import { DeleteEntryButton, RecordTimeButton } from "./effort-client";

export const metadata: Metadata = { title: "Time" };

const fmt = (m: number | null) => (m === null ? "not recorded" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim());

/**
 * Time spent (CX-08). The founder's hour a week is the promise; this page is
 * where it is kept honest. Staff see operator and editor time too.
 */
export default async function EffortPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const now = new Date();
  const [weeks, entries, byStep, content] = await Promise.all([
    weeklyEffort(ctx.org.id, 8, now),
    recentEntries(ctx.org.id, 40),
    founderMinutesByStep(ctx.org.id, new Date(weekStart(now).getTime() - 3 * 7 * 86_400_000)),
    prisma.contentItem.findMany({ where: { orgId: ctx.org.id, stage: { not: "live" } }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 50 }),
  ]);
  const names = new Map((await prisma.user.findMany({ where: { id: { in: [...new Set(entries.map((e) => e.userId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const visible = ctx.isInternal ? entries : entries.filter((e) => e.actorKind === "founder" || e.actorKind === "client_team");
  const kinds = ctx.isInternal ? ["operator", "editor", "founder", "client_team"] : ["founder", "client_team"];
  const today = now.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Time</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            The founder&apos;s time is meant to stay under {FOUNDER_WEEKLY_BUDGET} minutes a week. Record what it actually takes, so the promise is measured rather than assumed.
          </p>
        </div>
        <RecordTimeButton slug={slug} kinds={kinds} today={today} content={content} />
      </header>

      <section aria-labelledby="weeks-h">
        <h2 id="weeks-h" className="mb-2 text-[13px] font-medium text-ink">
          Last eight weeks
        </h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-[12.5px]">
            <thead className="text-left text-faint">
              <tr className="border-b border-line">
                <th className="px-3 py-2 font-normal">Week of</th>
                <th className="px-3 py-2 font-normal">Founder</th>
                <th className="px-3 py-2 font-normal">Team</th>
                {ctx.isInternal ? <th className="px-3 py-2 font-normal">Operator</th> : null}
                {ctx.isInternal ? <th className="px-3 py-2 font-normal">Editor</th> : null}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekStart} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 tabular text-muted">{w.weekStart}</td>
                  <td className={`px-3 py-2 tabular ${w.overBudget ? "text-negative" : w.founder === null ? "text-ghost" : "text-ink"}`}>
                    {fmt(w.founder)}
                    {w.overBudget ? " · over the hour" : ""}
                  </td>
                  <td className={`px-3 py-2 tabular ${w.clientTeam === null ? "text-ghost" : "text-ink"}`}>{fmt(w.clientTeam)}</td>
                  {ctx.isInternal ? <td className={`px-3 py-2 tabular ${w.operator === null ? "text-ghost" : "text-ink"}`}>{fmt(w.operator)}</td> : null}
                  {ctx.isInternal ? <td className={`px-3 py-2 tabular ${w.editor === null ? "text-ghost" : "text-ink"}`}>{fmt(w.editor)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {byStep.length ? (
        <section aria-labelledby="steps-h">
          <h2 id="steps-h" className="mb-2 text-[13px] font-medium text-ink">
            Where the founder&apos;s time went (four weeks)
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-muted">
            {byStep.map((s) => (
              <li key={s.step}>
                {STEP_LABEL[s.step] ?? s.step}: <span className="tabular text-ink">{fmt(s.minutes)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="entries-h">
        <h2 id="entries-h" className="mb-2 text-[13px] font-medium text-ink">
          Entries
        </h2>
        {visible.length === 0 ? (
          <EmptyState icon={Clock} title="No time recorded yet" description="Record the minutes spent on recording, reviewing, approving and calls." />
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line">
            {visible.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
                <span className="min-w-0 truncate text-muted">
                  <span className="tabular text-ink">{e.workDate.toISOString().slice(0, 10)}</span> · {KIND_LABEL[e.actorKind] ?? e.actorKind} · {STEP_LABEL[e.step] ?? e.step} · <span className="tabular text-ink">{fmt(e.minutes)}</span>
                  {e.note ? ` · ${e.note}` : ""} · {names.get(e.userId) ?? "former member"}
                </span>
                {ctx.isInternal || e.userId === ctx.user.id ? <DeleteEntryButton slug={slug} id={e.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
