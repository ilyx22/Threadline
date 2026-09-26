"use client";

import * as React from "react";
import Link from "next/link";
import {
  CALCULATOR_DEFAULTS,
  TARGET_MINUTES_PER_PIECE,
  TARGET_WEEKLY_OVERHEAD_MINUTES,
  calculate,
  type CalculatorInputs,
} from "@/lib/domain/calculator";
import { hours, money } from "@/lib/utils/format";

/**
 * Cost calculator, in the public site's own system (26 September 2026): the
 * inputs as a paper tile of ranges, the results as tiles with serif figures,
 * the same controls the Playbook uses. The copy and the arithmetic are the
 * ones the audit retained.
 *
 * Language discipline: this reports a current estimated operating cost and a
 * potential capacity release under a stated assumption. It never says "save",
 * never projects revenue, and shows the assumption it is using so the number
 * can be argued with.
 */
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function CalculatorClient() {
  const [inputs, setInputs] = React.useState<CalculatorInputs>(CALCULATOR_DEFAULTS);
  const result = calculate(inputs);

  const set = <K extends keyof CalculatorInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const founderShare = result.totalAnnualCost > 0 ? result.founderAnnualCost / result.totalAnnualCost : 0;
  const contractorShare = result.totalAnnualCost > 0 ? result.contractorAnnualCost / result.totalAnnualCost : 0;

  return (
    <div className="calc">
      {/* --------------------------------- Inputs --------------------------------- */}
      <section className="calc-inputs v9-tile is-paper" aria-labelledby="calc-inputs-title">
        <p className="v9-tag">Inputs</p>
        <h3 id="calc-inputs-title" className="v9-h3">
          Your numbers
        </h3>
        <div className="calc-fields">
          <RangeField
            label="What is an hour of your time worth?"
            hint="Not your salary: what the business loses when you spend an hour on something else."
            id="founderHourlyValue"
            value={inputs.founderHourlyValue}
            min={0}
            max={1000}
            step={25}
            format={(v) => money(v * 100)}
            onChange={(v) => set("founderHourlyValue", v)}
          />
          <RangeField
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
          <RangeField
            label="Monthly spend on writers, editors and tools"
            id="monthlyContractorCost"
            value={inputs.monthlyContractorCost}
            min={0}
            max={20000}
            step={250}
            format={(v) => money(v * 100, "GBP", { compact: true })}
            onChange={(v) => set("monthlyContractorCost", v)}
          />
          <RangeField
            label="Pieces published per 4-week period"
            id="piecesPerMonth"
            value={inputs.piecesPerMonth}
            min={0}
            max={60}
            step={1}
            format={(v) => String(v)}
            onChange={(v) => set("piecesPerMonth", v)}
          />
          <RangeField
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
        </div>
        <div className="calc-context">
          <p className="calc-context-title">Commercial context</p>
          <p className="calc-hint">Optional. Only fill these in if you genuinely know the numbers: a guess here makes the output worse, not better.</p>
          <div className="calc-context-fields">
            <label>
              <span className="v9-tag">
                Average deal value <em>Optional</em>
              </span>
              <input id="averageDealValue" type="number" inputMode="numeric" min={0} value={inputs.averageDealValue || ""} onChange={(e) => set("averageDealValue", Number(e.target.value))} />
            </label>
            <label>
              <span className="v9-tag">
                Deals per year from content <em>Optional</em>
              </span>
              <input id="dealsFromContentPerYear" type="number" inputMode="numeric" min={0} value={inputs.dealsFromContentPerYear || ""} onChange={(e) => set("dealsFromContentPerYear", Number(e.target.value))} />
            </label>
          </div>
        </div>
      </section>

      {/* --------------------------------- Outputs -------------------------------- */}
      <div className="calc-outputs">
        <section className="calc-tile v9-tile is-night is-total" aria-labelledby="calc-total-title">
          <p id="calc-total-title" className="v9-tag">
            Current estimated operating cost
          </p>
          <p className="calc-figure is-big">{money(result.totalAnnualCost * 100, "GBP")}</p>
          <p className="calc-sub">per year, at the figures above</p>
          <dl className="calc-bars">
            <div>
              <dt>Your time</dt>
              <dd>
                <span className="calc-bar" style={{ ["--w" as string]: `${Math.round(founderShare * 100)}%` }} aria-hidden="true" />
                <span>{money(result.founderAnnualCost * 100, "GBP", { compact: true })}</span>
              </dd>
            </div>
            <div>
              <dt>Contractors and tools</dt>
              <dd>
                <span className="calc-bar" style={{ ["--w" as string]: `${Math.round(contractorShare * 100)}%` }} aria-hidden="true" />
                <span>{money(result.contractorAnnualCost * 100, "GBP", { compact: true })}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div className="calc-pair">
          <section className="calc-tile v9-tile is-sky" aria-labelledby="calc-piece-title">
            <p id="calc-piece-title" className="v9-tag">
              Cost per shipped piece
            </p>
            <p className="calc-figure">{result.annualPieces > 0 ? money(result.costPerPiece * 100, "GBP") : ", "}</p>
            <p className="calc-sub">{result.annualPieces > 0 ? `${result.annualPieces} pieces a year` : "Add a publishing cadence"}</p>
          </section>
          <section className="calc-tile v9-tile is-peach" aria-labelledby="calc-time-title">
            <p id="calc-time-title" className="v9-tag">
              Your time in the operation
            </p>
            <p className="calc-figure">{hours(result.founderHoursPerYear)}</p>
            <p className="calc-sub">per year</p>
          </section>
        </div>

        <section className="calc-tile v9-tile is-mint" aria-labelledby="calc-scenario-title">
          <p className="v9-tag">Potential capacity released</p>
          <h3 id="calc-scenario-title" className="v9-h3">
            Scenario: a workflow where you only record and approve
          </h3>
          <div className="calc-pair is-inner">
            <div>
              <p className="v9-tag">Founder time under this scenario</p>
              <p className="calc-figure">{result.targetHoursPerWeek} hrs</p>
              <p className="calc-sub">per week, down from {inputs.founderHoursPerWeek}</p>
            </div>
            <div>
              <p className="v9-tag">Capacity released</p>
              <p className="calc-figure is-action">{hours(result.hoursReleasedPerYear)}</p>
              <p className="calc-sub">per year, valued at {money(result.releasedValue * 100, "GBP", { compact: true })}</p>
            </div>
          </div>
          <p className="calc-note">
            <strong>The assumption, stated openly: </strong>
            this scenario models the founder spending about {TARGET_MINUTES_PER_PIECE} minutes per published piece on recording, plus {TARGET_WEEKLY_OVERHEAD_MINUTES} minutes a week on approvals. Not zero: you never leave the loop entirely, and any calculator that shows zero is selling you something.
          </p>
        </section>

        {result.attributedRevenue != null ? (
          <section className="calc-tile v9-tile is-lilac" aria-labelledby="calc-commercial-title">
            <p className="v9-tag">From your figures</p>
            <h3 id="calc-commercial-title" className="v9-h3">
              Commercial context
            </h3>
            <div className="calc-pair is-inner">
              <div>
                <p className="v9-tag">Revenue attributed to content</p>
                <p className="calc-figure">{money(result.attributedRevenue * 100, "GBP", { compact: true })}</p>
              </div>
              <div>
                <p className="v9-tag">Per published piece</p>
                <p className="calc-figure">{result.revenuePerPiece != null ? money(result.revenuePerPiece * 100, "GBP") : ", "}</p>
              </div>
            </div>
            <p className="calc-note">This is your own historical figure divided by your own output. It is not a forecast and it does not imply that more pieces produce proportionally more revenue.</p>
          </section>
        ) : null}

        <p className="calc-notice">
          <strong>What this is and is not.</strong> These are estimates built from the numbers you entered. They describe the operation you have today and one scenario for a different workflow. It does not show a saving, a reach figure or a revenue outcome, because those are not things a calculator can know.
        </p>

        <Link href="/apply" className="v9-btn calc-cta">
          See if Threadline fits
          <Arrow />
        </Link>
      </div>
    </div>
  );
}

function RangeField({
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
    <div className="calc-field">
      <div className="calc-field-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="calc-value">
          {format(value)}
        </output>
      </div>
      {hint ? <p className="calc-hint">{hint}</p> : null}
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={format(value)} />
    </div>
  );
}
