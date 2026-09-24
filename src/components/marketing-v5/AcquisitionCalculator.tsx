"use client";

import * as React from "react";
import { PLAYBOOK_TOOLS } from "@/content/public-site";
import { ACQUISITION_BOUNDS, ACQUISITION_DEFAULTS, acquisitionModel, formatCount, normaliseInputs, RATE_KEYS, type AcquisitionInputs } from "@/lib/domain/acquisition-model";

type Key = keyof AcquisitionInputs;

const FIELDS: { key: Key; label: string; help: string; unit: string }[] = [
  { key: "targetWins", label: "Engagements you want to win", help: "In the period you are planning for.", unit: "" },
  { key: "bookingRatePct", label: "Booking rate", help: "Of the right buyers who meet your thinking, the share who book a conversation.", unit: "%" },
  { key: "showRatePct", label: "Show rate", help: "Of booked conversations, the share that are attended.", unit: "%" },
  { key: "qualifiedRatePct", label: "Qualification rate", help: "Of attended conversations, the share that are genuinely a fit.", unit: "%" },
  { key: "closeRatePct", label: "Close rate", help: "Of qualified conversations, the share you win.", unit: "%" },
];

/**
 * Model the commercial maths: the funnel read backwards. The visitor types
 * the rates; the model says how many first touches with the right buyers the
 * target implies, which stage loses the most people, and which rate a
 * ten-point improvement would move the answer most. Every number is the
 * visitor's assumption; nothing here is a forecast and the page says so.
 */
export function AcquisitionCalculator() {
  const id = React.useId();
  const [inputs, setInputs] = React.useState<AcquisitionInputs>(ACQUISITION_DEFAULTS);
  const result = React.useMemo(() => acquisitionModel(normaliseInputs(inputs)), [inputs]);
  const t = PLAYBOOK_TOOLS.model;

  const set = (key: Key, raw: string) => {
    const v = raw === "" ? Number.NaN : Number(raw);
    setInputs((s) => ({ ...s, [key]: Number.isFinite(v) ? v : s[key] }));
  };
  const commit = () => setInputs((s) => normaliseInputs(s));
  const leverKey = result.ok && result.leverage ? result.leverage.key : null;

  return (
    <div className="acq">
      <form className="acq-inputs" onSubmit={(e) => e.preventDefault()} aria-describedby={`${id}-note`}>
        {FIELDS.map((f) => {
          const b = ACQUISITION_BOUNDS[f.key];
          const fid = `${id}-${f.key}`;
          const isLever = RATE_KEYS.includes(f.key as (typeof RATE_KEYS)[number]) && leverKey === f.key;
          return (
            <div key={f.key} className={`acq-field${isLever ? " is-lever" : ""}`}>
              <label htmlFor={fid}>{f.label}</label>
              <span className="acq-help" id={`${fid}-help`}>
                {f.help}
              </span>
              <input id={fid} type="number" inputMode="decimal" min={b.min} max={b.max} step={b.step} value={Number.isFinite(inputs[f.key]) ? inputs[f.key] : ""} onChange={(e) => set(f.key, e.target.value)} onBlur={commit} aria-describedby={`${fid}-help`} />
              <input type="range" min={b.min} max={b.max} step={b.step} value={normaliseInputs(inputs)[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-label={`${f.label}${f.unit ? ", percent" : ""}`} />
            </div>
          );
        })}
      </form>

      <div className="acq-out" aria-live="polite">
        {result.ok ? (
          <>
            {[...result.stages].reverse().map((s) => (
              <div key={s.key} className={`acq-stage${s.key === "touches" ? " is-top" : s.key === "wins" ? " is-win" : ""}`}>
                <span className="acq-stage-label">
                  {s.label}
                  {s.fromRate !== null ? <small>{Math.round(s.fromRate * 1000) / 10}% become the stage below</small> : <small>{t.targetNote}</small>}
                </span>
                <span className="acq-stage-value">{formatCount(s.count)}</span>
              </div>
            ))}
            <p className="acq-verdict">
              {result.leverage ? (
                <>
                  <strong>{result.leverage.label}</strong> {t.leverLine} {formatCount(result.leverage.touchesIfImproved)} {t.leverTail}
                </>
              ) : (
                t.leverNone
              )}
            </p>
          </>
        ) : (
          <p className="acq-refusal">{result.reason}</p>
        )}
        <p className="acq-note" id={`${id}-note`}>
          {t.note}
        </p>
      </div>
    </div>
  );
}
