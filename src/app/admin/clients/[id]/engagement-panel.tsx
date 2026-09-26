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
import {
  activateEngagementAction,
  decideScopeChangeAction,
  endEngagementAction,
  pauseEngagementAction,
  proposeScopeChangeAction,
  resumeEngagementAction,
} from "@/lib/actions/engagement";
import type { ActionResult } from "@/lib/actions/shared";

export type EngagementView = {
  id: string;
  status: string;
  offerName: string;
  currency: string;
  setupFeeMinor: number;
  periodFeeMinor: number;
  periodDays: number;
  initialPeriods: number;
  startDate: string | null;
  earlyWinDueDate: string | null;
  timezone: string;
  periods: { number: number; startDate: string; endDate: string; status: string; feeMinor: number }[];
  scopeChanges: { id: string; summary: string; state: string; effectiveFromPeriod: number | null; feeChangeMinor: number | null }[];
};

const money = (minor: number, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
const tone = (s: string) => (s === "active" || s === "current" ? "positive" : s === "paused" ? "warning" : s === "draft" || s === "upcoming" ? "neutral" : "outline");

/** Staff view of a client's engagement: terms, calendar, lifecycle and scope (ENG-01, ENG-05). */
export function EngagementPanel({ engagement }: { engagement: EngagementView | null }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error);
    });
  };

  if (!engagement) {
    return (
      <Card>
        <CardHeader title="Engagement" description="No engagement is recorded for this workspace. Convert an application, or create the client again from the admin, to start one." />
      </Card>
    );
  }
  const e = engagement;
  const total = e.setupFeeMinor + e.periodFeeMinor * e.initialPeriods;

  return (
    <Card>
      <CardHeader
        title="Engagement"
        eyebrow={e.offerName}
        description={`${money(e.setupFeeMinor, e.currency)} setup, ${money(e.periodFeeMinor, e.currency)} per ${e.periodDays}-day period, ${e.initialPeriods} periods initially (${money(total, e.currency)}). Dates are ${e.timezone} calendar dates.`}
      />
      <CardBody className="space-y-5 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={tone(e.status)}>{e.status}</Badge>
          {e.startDate ? <span className="text-[12px] text-muted">from {e.startDate}</span> : null}
          {e.earlyWinDueDate ? <span className="text-[12px] text-muted">· early win due {e.earlyWinDueDate}</span> : null}
          <span className="flex-1" />
          {e.status === "active" ? (
            <Button size="xs" variant="ghost" disabled={pending} onClick={() => run(() => pauseEngagementAction(e.id), "Pause this engagement? Periods that have not started are held.")}>
              Pause
            </Button>
          ) : null}
          {e.status === "paused" ? (
            <Button size="xs" variant="secondary" disabled={pending} onClick={() => run(() => resumeEngagementAction(e.id))}>
              Resume
            </Button>
          ) : null}
        </div>

        {e.status === "draft" ? (
          <ActionForm action={activateEngagementAction.bind(null, e.id)} onSuccess={() => router.refresh()} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            {({ error, fieldErrors }) => (
              <>
                <div className="flex-1">
                  <FormError error={error} />
                  <Field label="First period starts on" htmlFor="startDate" error={fieldErrors.startDate}>
                    <Input id="startDate" name="startDate" type="date" required />
                  </Field>
                </div>
                <SubmitButton variant="primary">Activate</SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}

        {e.periods.length ? (
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-ghost">
              <tr>
                <th className="py-1 font-normal">Period</th>
                <th className="py-1 font-normal">Dates</th>
                <th className="py-1 font-normal">Fee</th>
                <th className="py-1 font-normal">State</th>
              </tr>
            </thead>
            <tbody>
              {e.periods.map((p) => (
                <tr key={p.number} className="border-t border-line">
                  <td className="py-1.5 text-ink">{p.number}</td>
                  <td className="py-1.5 text-muted">
                    {p.startDate} to {p.endDate}
                  </td>
                  <td className="py-1.5 text-muted">{money(p.feeMinor, e.currency)}</td>
                  <td className="py-1.5">
                    <Badge tone={tone(p.status)}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <div className="space-y-2">
          <p className="text-eyebrow text-faint">Scope changes</p>
          {e.scopeChanges.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <Badge tone={c.state === "approved" ? "positive" : c.state === "rejected" ? "outline" : "neutral"}>{c.state}</Badge>
              <span className="text-ink">{c.summary}</span>
              {c.feeChangeMinor ? <span className="text-muted">{c.feeChangeMinor > 0 ? "+" : ""}{money(c.feeChangeMinor, e.currency)} per period{c.effectiveFromPeriod ? ` from period ${c.effectiveFromPeriod}` : ""}</span> : null}
              {c.state === "proposed" ? (
                <>
                  <Button size="xs" variant="secondary" disabled={pending} onClick={() => run(() => decideScopeChangeAction(c.id, "approved"))}>
                    Approve
                  </Button>
                  <Button size="xs" variant="ghost" disabled={pending} onClick={() => run(() => decideScopeChangeAction(c.id, "rejected"))}>
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          ))}
          {e.status !== "ended" && e.status !== "terminated" ? (
            <ActionForm action={proposeScopeChangeAction.bind(null, e.id)} onSuccess={() => router.refresh()} className="grid gap-2 sm:grid-cols-4 sm:items-end">
              {({ error }) => (
                <>
                  <div className="sm:col-span-4">
                    <FormError error={error} />
                  </div>
                  <Field label="Change" htmlFor="scope-summary" className="sm:col-span-2">
                    <Input id="scope-summary" name="summary" placeholder="Add one long-form piece per period" />
                  </Field>
                  <Field label="Fee change per period" htmlFor="scope-fee" optional>
                    <Input id="scope-fee" name="feeChange" type="number" step="1" placeholder="500" />
                  </Field>
                  <Field label="From period" htmlFor="scope-from" optional>
                    <Input id="scope-from" name="effectiveFromPeriod" type="number" min={1} />
                  </Field>
                  <SubmitButton size="sm" variant="secondary">
                    Propose
                  </SubmitButton>
                </>
              )}
            </ActionForm>
          ) : null}
        </div>

        {e.status === "active" || e.status === "paused" ? (
          <details className="text-[12.5px]">
            <summary className="cursor-pointer text-muted">End or terminate</summary>
            <ActionForm action={endEngagementAction.bind(null, e.id)} onSuccess={() => router.refresh()} className="mt-3 grid gap-2 sm:grid-cols-3 sm:items-end">
              {({ error, fieldErrors }) => (
                <>
                  <div className="sm:col-span-3">
                    <FormError error={error} />
                  </div>
                  <Field label="How" htmlFor="end-kind">
                    <NativeSelect id="end-kind" name="kind" defaultValue="ended">
                      <option value="ended">Ended (term complete)</option>
                      <option value="terminated">Terminated early</option>
                    </NativeSelect>
                  </Field>
                  <Field label="Reason" htmlFor="end-reason" error={fieldErrors.reason}>
                    <Input id="end-reason" name="reason" />
                  </Field>
                  <SubmitButton size="sm" variant="secondary">
                    Record
                  </SubmitButton>
                </>
              )}
            </ActionForm>
          </details>
        ) : null}
      </CardBody>
    </Card>
  );
}
