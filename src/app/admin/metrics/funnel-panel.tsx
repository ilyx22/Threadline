"use client";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/feedback";
import {
  dailyTouches,
  requiredFirstTouches,
  workdaysRemainingInMonth,
  type FunnelInput,
} from "@/lib/domain/funnel";

/**
 * Funnel maths.
 *
 * Turns a target into the activity it actually implies, from Threadline's own
 * recorded rates. Channel-agnostic on purpose: a first touch is a first touch,
 * and which channel delivers it is an operating choice rather than something
 * the maths cares about.
 *
 * The refusal path matters more than the happy path. Early on, the honest
 * answer is "not enough recorded data to project this" — and showing that is
 * more useful than showing a number derived from a rate nobody has measured.
 */
export function FunnelPanel({
  firstTouches,
  callsBooked,
  showRatePct,
  closeRatePct,
  periodLabel,
}: {
  firstTouches: number;
  callsBooked: number;
  showRatePct: number;
  closeRatePct: number;
  periodLabel: string;
}) {
  const [targetWins, setTargetWins] = React.useState(2);
  const [qualifiedRatePct, setQualifiedRatePct] = React.useState(70);

  const input: FunnelInput = {
    firstTouches,
    callsBooked,
    showRatePct,
    closeRatePct,
    qualifiedRatePct,
  };

  const projection = requiredFirstTouches(targetWins, input);
  const workdays = workdaysRemainingInMonth();
  const perDay = projection.ok ? dailyTouches(projection.requiredFirstTouches, workdays) : null;

  return (
    <Card>
      <CardHeader
        title="Funnel maths"
        eyebrow={periodLabel}
        description="What a target actually costs in first touches, from your own recorded rates."
      />
      <CardBody className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target wins this month" htmlFor="funnel-target-wins">
            <Input
              id="funnel-target-wins"
              type="number"
              min={1}
              value={targetWins}
              onChange={(e) => setTargetWins(Number(e.target.value))}
            />
          </Field>
          <Field
            label="Assumed qualified rate (%)"
            hint="Not recorded anywhere, so this is your assumption rather than a measurement."
            htmlFor="funnel-qualified-rate"
          >
            <Input
              id="funnel-qualified-rate"
              type="number"
              min={1}
              max={100}
              value={qualifiedRatePct}
              onChange={(e) => setQualifiedRatePct(Number(e.target.value))}
            />
          </Field>
        </div>

        <ul className="mt-5 space-y-2 border-t border-line pt-4">
          {projection.rates.map((rate) => (
            <li key={rate.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12.5px]">
              <span className="w-32 shrink-0 text-ink">{rate.label}</span>
              <span className="tabular text-muted">
                {rate.value === null ? "—" : `${(rate.value * 100).toFixed(1)}%`}
              </span>
              <Badge tone={rate.measured ? "info" : "warning"}>
                {rate.measured ? "Measured" : "Assumed"}
              </Badge>
              <span className="ml-auto text-right text-[11.5px] text-ghost">{rate.basis}</span>
            </li>
          ))}
        </ul>

        {projection.ok ? (
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-eyebrow text-faint">First touches needed</p>
                <p className="mt-1 text-[28px] font-medium tabular text-accent">
                  {projection.requiredFirstTouches.toLocaleString("en-GB")}
                </p>
              </div>
              <div>
                <p className="text-eyebrow text-faint">Per remaining workday</p>
                <p className="mt-1 text-[28px] font-medium tabular text-ink">
                  {perDay === null ? "—" : perDay}
                </p>
                <p className="mt-1 text-[11px] text-ghost">{workdays} workdays left this month</p>
              </div>
              <div>
                <p className="text-eyebrow text-faint">Compound conversion</p>
                <p className="mt-1 text-[28px] font-medium tabular text-ink">
                  {(projection.conversion * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {projection.containsAssumption ? (
              <p className="mt-4 text-[12px] leading-relaxed text-warning">
                One factor in this is assumed rather than measured, so treat the result as a
                planning figure rather than a forecast. It gets trustworthy once qualification is
                recorded against real calls.
              </p>
            ) : null}

            <p className="mt-3 text-[12px] leading-relaxed text-ghost">
              A first touch is one prospect contacted for the first time, by whatever channel is
              currently carrying outbound. The maths does not care which — the channel is an
              operating choice, and changing it changes the booking rate, not the formula.
            </p>
          </div>
        ) : (
          <Notice tone="warning" className="mt-5" title="Not enough recorded data to project this">
            {projection.reason} Missing: {projection.missing.join(", ")}.
          </Notice>
        )}
      </CardBody>
    </Card>
  );
}
