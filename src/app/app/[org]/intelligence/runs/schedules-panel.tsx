"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ActionButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { createScheduleAction, toggleScheduleAction } from "@/lib/actions/schedules";

type Row = { id: string; label: string; cadenceDays: number; active: boolean; nextRunAt: string; lastOutcome: string | null };

/** AI-02: recurring research runs; each run waits for a person once collected. */
export function SchedulesPanel({ slug, rows }: { slug: string; rows: Row[] }) {
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [cadence, setCadence] = React.useState("7");
  const [sources, setSources] = React.useState("historic_content | Our published work\ncompetitor | A rival's blog | https://");
  const [pending, start] = React.useTransition();
  return (
    <section className="space-y-3 rounded-md border border-line p-4 text-[12.5px]" aria-labelledby="sched-h">
      <h2 id="sched-h" className="text-[13px] font-medium text-ink">
        Scheduled research
      </h2>
      <p className="text-muted">A schedule opens a run on its cadence and collects workspace records and public pages. Sources that need a person stay pending, and unreadable ones say why. Nothing is published from a run without review.</p>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            <span className="text-muted">
              <span className="text-ink">{r.label}</span> · every {r.cadenceDays} days · {r.active ? `next ${new Date(r.nextRunAt).toLocaleDateString("en-GB")}` : "paused"}
              {r.lastOutcome ? ` · last: ${summarise(r.lastOutcome)}` : ""}
            </span>
            <ActionButton size="xs" variant="ghost" action={() => toggleScheduleAction(slug, r.id, !r.active)} onDone={() => router.refresh()}>
              {r.active ? "Pause" : "Resume"}
            </ActionButton>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name, e.g. Weekly market read" aria-label="Schedule name" />
        <Input type="number" min={1} max={90} value={cadence} onChange={(e) => setCadence(e.target.value)} aria-label="Every how many days" />
      </div>
      <Textarea rows={3} value={sources} onChange={(e) => setSources(e.target.value)} aria-label="Sources, one per line: kind | label | url" />
      <Button
        size="sm"
        disabled={pending || !label.trim()}
        onClick={() =>
          start(async () => {
            const r = await createScheduleAction(slug, { label, cadenceDays: Number(cadence), sources });
            if (r.ok) {
              setLabel("");
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        Schedule
      </Button>
    </section>
  );
}

function summarise(json: string) {
  try {
    const o = JSON.parse(json) as { skipped?: string; collected?: number; unavailable?: unknown[]; waitingForPerson?: unknown[] };
    if (o.skipped) return `skipped (${o.skipped})`;
    return `${o.collected ?? 0} collected, ${o.unavailable?.length ?? 0} unavailable, ${o.waitingForPerson?.length ?? 0} waiting for a person`;
  } catch {
    return "recorded";
  }
}
