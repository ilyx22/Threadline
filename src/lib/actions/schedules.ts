"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { WorkflowError } from "@/lib/domain/workflow";
import { createSchedule, setScheduleActive } from "@/lib/research/schedules";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/** AI-02: schedule recurring research runs. Sources are one per line: kind | label | url. */
export async function createScheduleAction(orgSlug: string, input: { label: string; focus?: string; cadenceDays: number; sources: string }): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const sources = String(input.sources ?? "")
      .split(/\r?\n/)
      .map((l) => l.split("|").map((x) => x.trim()))
      .filter((p) => p[0])
      .map(([kind, label, url]) => ({ kind, label: label || kind, url: url || null }));
    try {
      const s = await createSchedule(ctx.org.id, ctx.user.id, { label: String(input.label ?? ""), focus: input.focus, cadenceDays: Number(input.cadenceDays), sources });
      await audit(ctx, { action: "research.schedule", entityType: "research_schedule", entityId: s.id, summary: `Scheduled "${s.label}" every ${s.cadenceDays} days` });
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "validation");
      if (e instanceof Error && e.name === "ZodError") return err("Unknown source kind. Use: competitor, creator, category, sales_call, customer_language, historic_content, performance, pipeline, url, note.", "validation");
      throw e;
    }
    revalidatePath(`/app/${orgSlug}/intelligence/runs`);
    return okVoid("Scheduled. The first run starts at the next daily tick.");
  });
}

export async function toggleScheduleAction(orgSlug: string, id: string, active: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    await setScheduleActive(ctx.org.id, id, active);
    revalidatePath(`/app/${orgSlug}/intelligence/runs`);
    return okVoid(active ? "Resumed." : "Paused.");
  });
}
