"use client";

import * as React from "react";
import Link from "next/link";
import { Chamber } from "@/components/factory/objects";

/**
 * "Where is your authority system breaking?": Threadline's own diagnostic,
 * built on the frozen selector skeleton (reference-analysis/clones/
 * hydra-constraint-selector): tabs → the seven stations react → a symptom
 * card beside a dark "what Threadline changes" card. Categories are original
 * (Position / Create / Distribute / Convert / Learn). Exploratory, not a
 * verdict: it routes to the application, which is the real diagnostic.
 */
type Category = { key: string; label: string; body: string; chamber: string; stage: string };
type Stage = { key: string; title: string; body: string };
type Chamb = { key: string; label: string; founder?: string };
type Symptom = { title: string; body: string };

const SYMPTOM_FOR: Record<string, number | undefined> = { position: 1, create: 0, distribute: 2, convert: undefined, learn: 3 };

export function Diagnostic({ categories, chambers, stages, symptoms, cta }: { categories: readonly Category[]; chambers: readonly Chamb[]; stages: readonly Stage[]; symptoms: readonly Symptom[]; cta: { label: string; href: string } }) {
  const [sel, setSel] = React.useState(0);
  const cat = categories[sel];
  const stage = stages.find((s) => s.key === cat.stage) ?? stages[0];
  const symptom = SYMPTOM_FOR[cat.key] !== undefined ? symptoms[SYMPTOM_FOR[cat.key] as number] : undefined;
  const tabId = (i: number) => `diag-tab-${i}`;
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n = categories.length;
    const next = e.key === "ArrowRight" ? (sel + 1) % n : e.key === "ArrowLeft" ? (sel - 1 + n) % n : e.key === "Home" ? 0 : n - 1;
    setSel(next);
    document.getElementById(tabId(next))?.focus();
  };
  return (
    <div>
      <div className="tl-tabs" role="tablist" aria-label="Where is your authority system breaking?" onKeyDown={onKey}>
        {categories.map((c, i) => (
          <button key={c.key} id={tabId(i)} type="button" role="tab" aria-selected={i === sel} aria-controls="diag-panel" tabIndex={i === sel ? 0 : -1} className="tl-tab" onClick={() => setSel(i)}>
            <span className="tl-tab-idx" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            {c.label}
          </button>
        ))}
      </div>
      <div className="tl-diag-rail" aria-hidden>
        {chambers.map((ch, i) => (
          <Chamber key={ch.key} index={String(i + 1).padStart(2, "0")} label={ch.label} active={ch.key === cat.chamber} />
        ))}
      </div>
      <div id="diag-panel" role="tabpanel" aria-labelledby={tabId(sel)} className="tl-selector-cards">
        <div className="tl-detail">
          <p className="tl-label">
            {String(sel + 1).padStart(2, "0")} · {cat.label}
          </p>
          <p className="tl-sub-title mt-3 text-[color:var(--ink)]">{cat.body}</p>
          {symptom ? (
            <div className="mt-5 border-t border-[color:var(--line)] pt-4">
              <p className="tl-label">How it usually sounds</p>
              <p className="mt-2 text-[15px] font-medium text-[color:var(--ink)]">{symptom.title}</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-[color:var(--ink-soft)]">{symptom.body}</p>
            </div>
          ) : null}
        </div>
        <div className="tl-detail-dark">
          <div>
            <p className="tl-label">What Threadline changes here</p>
            <p className="mt-3 text-[18px] font-medium leading-snug">{stage.title}</p>
            <p className="mt-3 text-[16px] leading-relaxed opacity-90">{stage.body}</p>
          </div>
          <Link href={cta.href} className="tl-btn tl-btn-sm self-start border-[color:var(--paper)] bg-[color:var(--paper)] text-[color:var(--ink)] hover:bg-[color:var(--stamp-soft)] hover:text-[color:var(--ink)]">
            {cta.label}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {cat.label}: addressed at {stage.title}.
      </p>
    </div>
  );
}
