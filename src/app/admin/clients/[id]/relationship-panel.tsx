"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { markTouchDoneAction, rescheduleStartAction, setRelationshipPlanAction } from "@/lib/actions/engagement";

export type RelationshipView = {
  engagementId: string;
  status: string;
  timezone: string;
  startDate: string | null;
  started: boolean;
  owner: string | null;
  checkInWeekday: number | null;
  checkInTime: string | null;
  kickoffLocal: { date: string; time: string } | null;
  touches: { id: string; key: string; title: string; dueLocal: string; status: string; inAttio: boolean; syncError: string | null }[];
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const statusTone = (s: string) => (s === "done" ? "positive" : s === "cancelled" ? "outline" : "neutral");

/**
 * The client relationship cadence (communication playbook, 27 Sept 2026): one
 * named owner, weekly calls in weeks 1-4 and fortnightly after, reviews in
 * place of the call. Production and approvals stay in the portal; these
 * follow-ups are mirrored to Attio as tasks for the relationship owner.
 */
export function RelationshipPanel({ view }: { view: RelationshipView | null }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  if (!view || view.status === "draft") {
    return (
      <Card>
        <CardHeader title="Relationship cadence" description="Planned once the engagement is active: kickoff, the day-2/3 check-in, weekly calls in weeks 1–4, fortnightly after, and the week-4, 8 and 12 reviews." />
      </Card>
    );
  }
  const v = view;
  const held = v.touches.find((t) => t.syncError?.startsWith("Held"));
  const done = (id: string) =>
    startTransition(async () => {
      const r = await markTouchDoneAction(id);
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <Card>
      <CardHeader
        title="Relationship cadence"
        description={`Times are in the client's timezone (${v.timezone}). Owner: ${v.owner ?? "not set (save the slot below to take it)"}. Tasks are mirrored to Attio for the owner; tick them there or here.`}
      />
      <CardBody className="space-y-4 pt-0">
        {held ? <p className="rounded-md border border-line px-3 py-2 text-[12.5px] text-muted">Attio: {held.syncError}</p> : null}
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-faint">
            <tr>
              <th className="py-1 font-normal">Touch</th>
              <th className="py-1 font-normal">Due ({v.timezone})</th>
              <th className="py-1 font-normal">Status</th>
              <th className="py-1 font-normal">Attio</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {v.touches.map((t) => (
              <tr key={t.id} className="border-t border-line align-top">
                <td className="py-1.5 pr-3">{t.title}</td>
                <td className="py-1.5 pr-3 tabular whitespace-nowrap">{t.dueLocal}</td>
                <td className="py-1.5 pr-3">
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                </td>
                <td className="py-1.5 pr-3 text-muted">{t.syncError && !t.syncError.startsWith("Held") ? <span className="text-negative">{t.syncError}</span> : t.inAttio ? "task" : "not yet"}</td>
                <td className="py-1.5 text-right">
                  {t.status === "planned" ? (
                    <Button size="xs" variant="ghost" disabled={pending} onClick={() => done(t.id)}>
                      Mark done
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {v.status === "active" ? (
          <ActionForm action={setRelationshipPlanAction.bind(null, v.engagementId)} onSuccess={() => router.refresh()} className="grid gap-2 sm:grid-cols-5 sm:items-end">
            {({ error, fieldErrors }) => (
              <>
                <div className="sm:col-span-5">
                  <FormError error={error} />
                </div>
                <Field label="Kickoff date" htmlFor="kickoffDate" optional>
                  <Input id="kickoffDate" name="kickoffDate" type="date" defaultValue={v.kickoffLocal?.date ?? ""} />
                </Field>
                <Field label="Kickoff time" htmlFor="kickoffTime" optional>
                  <Input id="kickoffTime" name="kickoffTime" type="time" defaultValue={v.kickoffLocal?.time ?? ""} />
                </Field>
                <Field label="Check-in day" htmlFor="checkInWeekday" optional>
                  <NativeSelect id="checkInWeekday" name="checkInWeekday" defaultValue={v.checkInWeekday === null ? "" : String(v.checkInWeekday)}>
                    <option value="">Same weekday as the start</option>
                    {WEEKDAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Check-in time" htmlFor="checkInTime" optional error={fieldErrors.checkInTime}>
                  <Input id="checkInTime" name="checkInTime" type="time" defaultValue={v.checkInTime ?? "10:00"} />
                </Field>
                <SubmitButton variant="secondary">Save cadence</SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}

        {v.status === "active" && !v.started ? (
          <ActionForm action={rescheduleStartAction.bind(null, v.engagementId)} onSuccess={() => router.refresh()} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            {({ error, fieldErrors }) => (
              <>
                <div className="flex-1">
                  <FormError error={error} />
                  <Field label="Launch delayed? Move the start" htmlFor="reschedule-start" error={fieldErrors.startDate} hint="Periods, the early-win date and every open touch move together. Tell the client the new dates.">
                    <Input id="reschedule-start" name="startDate" type="date" defaultValue={v.startDate ?? ""} required />
                  </Field>
                </div>
                <SubmitButton variant="ghost">Move start</SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}
      </CardBody>
    </Card>
  );
}
