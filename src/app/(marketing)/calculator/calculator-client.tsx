"use client";

import * as React from "react";
import { ArrowRight, Info } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { HorizontalRank } from "@/components/charts";
import {
  CALCULATOR_DEFAULTS,
  TARGET_MINUTES_PER_PIECE,
  TARGET_WEEKLY_OVERHEAD_MINUTES,
  calculate,
  type CalculatorInputs,
} from "@/lib/domain/calculator";
import { hours, money } from "@/lib/utils/format";

/**
 * Cost calculator.
 *
 * Language discipline: this reports a current estimated operating cost and a
 * potential capacity release under a stated assumption. It never says "save",
 * never projects revenue, and shows the assumption it is using so the number
 * can be argued with.
 */
export function CalculatorClient() {
  const [inputs, setInputs] = React.useState<CalculatorInputs>(CALCULATOR_DEFAULTS);
  const result = calculate(inputs);

  const set = <K extends keyof CalculatorInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      {/* --------------------------------- Inputs --------------------------------- */}
      <Card>
        <CardHeader title="Your numbers" eyebrow="Inputs" />
        <CardBody className="space-y-6 pt-0">
          <SliderField
            label="What is an hour of your time worth?"
            hint="Not your salary — what the business loses when you spend an hour on something else."
            id="founderHourlyValue"
            value={inputs.founderHourlyValue}
            min={0}
            max={1000}
            step={25}
            format={(v) => money(v * 100)}
            onChange={(v) => set("founderHourlyValue", v)}
          />

          <SliderField
            label="Hours per week you spend on content"
            hint="Including thinking about it, rewriting drafts and chasing people."
            id="founderHoursPerWeek"
            value={inputs.founderHoursPerWeek}
            min={0}
            max={40}
            step={0.5}
            format={(v) => `${v} hrs`}
            onChange={(v) => set("founderHoursPerWeek", v)}
          />

          <SliderField
            label="Monthly spend on writers, editors and tools"
            id="monthlyContractorCost"
            value={inputs.monthlyContractorCost}
            min={0}
            max={20000}
            step={250}
            format={(v) => money(v * 100, "GBP", { compact: true })}
            onChange={(v) => set("monthlyContractorCost", v)}
          />

          <SliderField
            label="Pieces published per 4-week period"
            id="piecesPerMonth"
            value={inputs.piecesPerMonth}
            min={0}
            max={60}
            step={1}
            format={(v) => String(v)}
            onChange={(v) => set("piecesPerMonth", v)}
          />

          <SliderField
            label="Days from idea to published"
            hint="Your typical cycle time, not your best case."
            id="cycleTimeDays"
            value={inputs.cycleTimeDays}
            min={0}
            max={90}
            step={1}
            format={(v) => `${v} days`}
            onChange={(v) => set("cycleTimeDays", v)}
          />

          <div className="border-t border-line pt-5">
            <p className="text-[13px] font-medium text-ink">Commercial context</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Optional. Only fill these in if you genuinely know the numbers — a guess here makes
              the output worse, not better.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Average deal value" htmlFor="averageDealValue" optional>
                <Input
                  id="averageDealValue"
                  type="number"
                  min={0}
                  value={inputs.averageDealValue || ""}
                  onChange={(e) => set("averageDealValue", Number(e.target.value))}
                />
              </Field>
              <Field label="Deals per year from content" htmlFor="dealsFromContentPerYear" optional>
                <Input
                  id="dealsFromContentPerYear"
                  type="number"
                  min={0}
                  value={inputs.dealsFromContentPerYear || ""}
                  onChange={(e) => set("dealsFromContentPerYear", Number(e.target.value))}
                />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* --------------------------------- Outputs -------------------------------- */}
      <div className="space-y-4">
        <Card accent>
          <CardBody className="pt-5">
            <p className="text-eyebrow text-faint">Current estimated operating cost</p>
            <p className="mt-2.5 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-none tabular text-accent">
              {money(result.totalAnnualCost * 100, "GBP")}
            </p>
            <p className="mt-2 text-[13px] text-muted">per year, at the figures above</p>

            <div className="mt-6">
              <HorizontalRank
                data={[
                  { label: "Your time", value: result.founderAnnualCost },
                  { label: "Contractors and tools", value: result.contractorAnnualCost },
                ]}
                format="number"
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardBody className="pt-5">
              <p className="text-eyebrow text-faint">Cost per shipped piece</p>
              <p className="mt-2 text-[24px] font-medium leading-none tabular text-ink">
                {result.annualPieces > 0 ? money(result.costPerPiece * 100, "GBP") : "—"}
              </p>
              <p className="mt-2 text-[12px] text-muted">
                {result.annualPieces > 0
                  ? `${result.annualPieces} pieces a year`
                  : "Add a publishing cadence"}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-5">
              <p className="text-eyebrow text-faint">Your time in the operation</p>
              <p className="mt-2 text-[24px] font-medium leading-none tabular text-ink">
                {hours(result.founderHoursPerYear)}
              </p>
              <p className="mt-2 text-[12px] text-muted">per year</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Scenario: a workflow where you only record and approve"
            eyebrow="Potential capacity released"
          />
          <CardBody className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-eyebrow text-faint">Founder time under this scenario</p>
                <p className="mt-2 text-[24px] font-medium leading-none tabular text-ink">
                  {result.targetHoursPerWeek} hrs
                </p>
                <p className="mt-1.5 text-[12px] text-muted">per week, down from {inputs.founderHoursPerWeek}</p>
              </div>
              <div>
                <p className="text-eyebrow text-faint">Capacity released</p>
                <p className="mt-2 text-[24px] font-medium leading-none tabular text-accent">
                  {hours(result.hoursReleasedPerYear)}
                </p>
                <p className="mt-1.5 text-[12px] text-muted">
                  per year, valued at {money(result.releasedValue * 100, "GBP", { compact: true })}
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-md border border-line bg-surface p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
              <p className="text-[12px] leading-relaxed text-muted">
                <span className="text-ink">The assumption, stated openly: </span>
                this scenario models the founder spending about{" "}
                {TARGET_MINUTES_PER_PIECE} minutes per published piece on recording, plus{" "}
                {TARGET_WEEKLY_OVERHEAD_MINUTES} minutes a week on approvals. Not zero — you never
                leave the loop entirely, and any calculator that shows zero is selling you
                something.
              </p>
            </div>
          </CardBody>
        </Card>

        {result.attributedRevenue != null ? (
          <Card>
            <CardHeader title="Commercial context" eyebrow="From your figures" />
            <CardBody className="pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-eyebrow text-faint">Revenue attributed to content</p>
                  <p className="mt-2 text-[22px] font-medium leading-none tabular text-ink">
                    {money(result.attributedRevenue * 100, "GBP", { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-eyebrow text-faint">Per published piece</p>
                  <p className="mt-2 text-[22px] font-medium leading-none tabular text-ink">
                    {result.revenuePerPiece != null
                      ? money(result.revenuePerPiece * 100, "GBP")
                      : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-ghost">
                This is your own historical figure divided by your own output. It is not a forecast
                and it does not imply that more pieces produce proportionally more revenue.
              </p>
            </CardBody>
          </Card>
        ) : null}

        <Notice tone="neutral" title="What this is and is not">
          These are estimates built from the numbers you entered. They describe the operation you
          have today and one scenario for a different workflow. Threadline does not guarantee a
          saving, a reach figure or a revenue outcome, and no honest calculator could.
        </Notice>

        <ButtonLink href="/apply" variant="accent" size="lg" iconRight={ArrowRight} fullWidth>
          Apply for a content growth diagnosis
        </ButtonLink>
      </div>
    </div>
  );
}

function SliderField({
  label,
  hint,
  id,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className="shrink-0 text-[14px] font-medium tabular text-accent">
          {format(value)}
        </span>
      </div>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? min)}
        className="mt-2"
      />
    </div>
  );
}
