import * as React from "react";
import { Badge, Pill } from "@/components/ui/badge";
import { ProductFrame } from "./sections";

/**
 * Product visualisations.
 *
 * Composed from the real design system rather than screenshots: they stay
 * accurate as the product evolves, render sharply at any size, and cost nothing
 * to load. The content shown is the seeded demo workspace, which is fictional
 * and labelled as such wherever it could be mistaken for a customer result.
 */

export function CommandCentreView() {
  return (
    <ProductFrame label="Home · Command centre">
      <div className="space-y-3">
        <div>
          <p className="text-[15px] font-medium text-ink">Good morning, Alex.</p>
          <p className="mt-0.5 text-[12px] text-muted">3 things need you today.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Record", value: "4", meta: "~27 min", accent: true },
            { label: "Approve", value: "6", meta: "~12 min", accent: false },
            { label: "Decide", value: "1", meta: "strategy", accent: false },
          ].map((block) => (
            <div
              key={block.label}
              className={
                block.accent
                  ? "rounded-lg border border-accent-line bg-accent-soft p-3"
                  : "rounded-lg border border-line bg-surface p-3"
              }
            >
              <p className="text-eyebrow text-faint">{block.label}</p>
              <p
                className={
                  block.accent
                    ? "mt-1.5 text-[20px] font-medium leading-none tabular text-accent"
                    : "mt-1.5 text-[20px] font-medium leading-none tabular text-ink"
                }
              >
                {block.value}
              </p>
              <p className="mt-1 text-[10.5px] text-ghost">{block.meta}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-eyebrow mb-2 text-faint">What the system learned</p>
          <p className="text-[11.5px] leading-relaxed text-muted">
            First-person openings are reaching roughly 3x your median. Content naming the
            lead-volume misdiagnosis produced 4 of 7 qualified inquiries.
          </p>
        </div>
      </div>
    </ProductFrame>
  );
}

export function BrandBrainView() {
  return (
    <ProductFrame label="Intelligence · Brand Brain">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-eyebrow text-faint">Context strength</p>
          <p className="text-[17px] font-medium tabular text-accent">92%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full w-[92%] rounded-full bg-accent" />
        </div>

        <div className="space-y-1.5">
          {[
            ["Company", 100],
            ["Offer", 100],
            ["Customer", 100],
            ["Founder", 92],
            ["Voice", 96],
            ["Proof", 100],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 shrink-0 text-muted">{label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-muted/50"
                  style={{ width: `${value as number}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right tabular text-ghost">{value}%</span>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-line bg-surface p-2.5">
          <p className="text-eyebrow mb-1.5 text-faint">Sounds like me</p>
          <p className="text-[11px] italic leading-relaxed text-muted">
            &ldquo;Most founders think they have a lead problem. Almost none of them do.&rdquo;
          </p>
        </div>
      </div>
    </ProductFrame>
  );
}

export function IdeaEngineView() {
  const ideas = [
    { title: "The £480k forecast that closed at £120k", score: 94, pillar: "Founder POV" },
    { title: "You do not have a lead problem", score: 91, pillar: "Qualification" },
    { title: "The hidden cost of hiring an SDR too early", score: 88, pillar: "Hiring" },
    { title: "Why every closed-lost reason is wrong", score: 84, pillar: "Qualification" },
  ];

  return (
    <ProductFrame label="Create · Ideas">
      <ul className="space-y-2">
        {ideas.map((idea, i) => (
          <li
            key={idea.title}
            className="flex items-start gap-2.5 rounded-md border border-line bg-surface p-2.5"
          >
            <span
              className={
                i === 0
                  ? "mt-0.5 inline-flex h-5 min-w-7 items-center justify-center rounded border border-accent-line bg-accent-soft px-1 text-[10px] tabular text-accent"
                  : "mt-0.5 inline-flex h-5 min-w-7 items-center justify-center rounded border border-line px-1 text-[10px] tabular text-faint"
              }
            >
              {idea.score}
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] leading-snug text-ink">{idea.title}</p>
              <p className="mt-1 text-[10px] text-ghost">{idea.pillar}</p>
            </div>
          </li>
        ))}
      </ul>
    </ProductFrame>
  );
}

export function RecordingRoomView() {
  return (
    <ProductFrame label="Production · Recording Room">
      <div className="space-y-3">
        <div className="rounded-lg border border-accent-line bg-accent-soft p-3">
          <p className="text-[17px] font-medium tabular text-accent">4 pieces</p>
          <p className="mt-0.5 text-[11px] text-muted">
            Estimated recording time: 27 min
          </p>
        </div>

        <div className="rounded-md border border-line bg-surface p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Pill>LinkedIn</Pill>
            <Pill>Founder POV</Pill>
            <Pill>1:14</Pill>
          </div>
          <p className="text-[11.5px] font-medium text-ink">
            The two SDRs I told a client to let go
          </p>
          <p className="mt-2 border-l-2 border-accent-line pl-2.5 text-[11px] leading-relaxed text-muted">
            I once told a client to let go of two people they had just hired.
          </p>
        </div>

        <div className="rounded-md border border-line bg-surface p-2.5">
          <p className="text-eyebrow mb-1 text-faint">Teleprompter</p>
          <p className="text-[10.5px] text-ghost">
            Space to scroll · arrows for speed · full screen
          </p>
        </div>
      </div>
    </ProductFrame>
  );
}

export function ProductionBoardView() {
  const columns = [
    { stage: "Raw", count: 2, colour: "var(--color-stage-raw)" },
    { stage: "Editing", count: 3, colour: "var(--color-stage-editing)" },
    { stage: "In review", count: 6, colour: "var(--color-stage-review)" },
    { stage: "Approved", count: 2, colour: "var(--color-stage-approved)" },
  ];

  return (
    <ProductFrame label="Production · Board">
      <div className="grid grid-cols-4 gap-2">
        {columns.map((column) => (
          <div key={column.stage}>
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: column.colour }}
                aria-hidden
              />
              <span className="text-[10px] font-medium text-ink">{column.stage}</span>
              <span className="text-[10px] tabular text-ghost">{column.count}</span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: Math.min(column.count, 3) }).map((_, i) => (
                <div key={i} className="rounded border border-line bg-surface p-2">
                  <div className="h-1.5 w-full rounded-full bg-raised" />
                  <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-raised" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProductFrame>
  );
}

export function PerformanceView() {
  const bars = [42, 58, 36, 74, 51, 88, 63, 96, 71];

  return (
    <ProductFrame label="Performance · Overview">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Views", value: "635K", accent: true },
            { label: "Published", value: "9" },
            { label: "Calls booked", value: "3" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-line bg-surface p-2.5">
              <p className="text-eyebrow text-faint">{stat.label}</p>
              <p
                className={
                  stat.accent
                    ? "mt-1 text-[16px] font-medium leading-none tabular text-accent"
                    : "mt-1 text-[16px] font-medium leading-none tabular text-ink"
                }
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex h-24 items-end gap-1.5 rounded-md border border-line bg-surface p-2.5">
          {bars.map((height, i) => (
            <div
              key={i}
              className={i === bars.length - 2 ? "flex-1 rounded-t bg-accent" : "flex-1 rounded-t bg-raised"}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="space-y-1.5">
          {[
            ["First-person story", 92],
            ["Contrarian claim", 71],
            ["Question open", 44],
          ].map(([label, width]) => (
            <div key={label as string} className="flex items-center gap-2 text-[10.5px]">
              <span className="w-28 shrink-0 truncate text-muted">{label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${width as number}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProductFrame>
  );
}

export function DistributionView() {
  return (
    <ProductFrame label="Distribution · Calendar">
      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="text-center text-[9px] text-ghost">
            {day}
          </div>
        ))}
        {Array.from({ length: 21 }).map((_, i) => {
          const scheduled = [3, 5, 9, 12, 15, 17, 19].includes(i);
          const live = [3, 9, 15].includes(i);
          return (
            <div
              key={i}
              className="flex h-9 flex-col gap-0.5 rounded border border-line bg-surface p-1"
            >
              <span className="text-[8px] text-ghost">{i + 1}</span>
              {scheduled ? (
                <span
                  className={
                    live
                      ? "h-1.5 rounded-full bg-accent"
                      : "h-1.5 rounded-full bg-line-strong"
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-ghost">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-line-strong" aria-hidden />
          Scheduled
        </span>
      </div>
    </ProductFrame>
  );
}

export function ScriptEngineView() {
  return (
    <ProductFrame label="Create · Script">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="warning">2 unverified claims</Badge>
          <Pill>v3</Pill>
        </div>

        <p className="text-[12px] font-medium leading-relaxed text-ink">
          I forecast £480,000 one quarter. We closed £120,000.
        </p>

        <div className="space-y-1">
          {[
            "It was not optimism. I had no idea what was happening in those deals.",
            "Afterwards I went back through ninety call recordings.",
            "The same thing showed up again and again.",
          ].map((line) => (
            <p key={line} className="text-[10.5px] leading-relaxed text-muted">
              {line}
            </p>
          ))}
        </div>

        <div className="rounded-md border border-warning/25 bg-warning-soft p-2.5">
          <p className="text-eyebrow mb-1 text-warning">Needs verification</p>
          <p className="text-[10.5px] leading-relaxed text-muted">
            &ldquo;Ninety call recordings&rdquo; — confirm the count before recording.
          </p>
        </div>
      </div>
    </ProductFrame>
  );
}

/**
 * The Monday intelligence brief — the clearest proof of the mechanism.
 *
 * Every element shown maps to something real in the product: an approved signal
 * carries its evidence count, a ranked test carries the measure it is read on,
 * and a source that could not be collected says so. The content is the seeded
 * demo workspace, which is fictional.
 */
export function IntelligenceBriefView() {
  return (
    <ProductFrame label="Intelligence · Monday brief">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge tone="positive">Published</Badge>
          <span className="text-[10.5px] text-ghost">18 evidence items · 4 sources</span>
        </div>

        <p className="text-[12px] leading-relaxed text-muted">
          Three of the five sales calls this fortnight described the problem as &ldquo;we have
          leads, they just do not convert&rdquo;. Your current messaging answers a volume problem.
        </p>

        <div className="space-y-2">
          {[
            {
              kind: "Customer language",
              tone: "info" as const,
              title: "Buyers name a conversion problem, not a lead problem",
              evidence: 5,
              confidence: 62,
            },
            {
              kind: "Competitor theme",
              tone: "purple" as const,
              title: "Three competitors now lead with the same outcome claim",
              evidence: 4,
              confidence: 55,
            },
            {
              kind: "Content gap",
              tone: "positive" as const,
              title: "Nobody answers what to do in the first 30 days",
              evidence: 3,
              confidence: 48,
            },
          ].map((signal) => (
            <div key={signal.title} className="rounded-lg border border-line bg-surface p-2.5">
              <div className="flex items-center gap-1.5">
                <Badge tone={signal.tone}>{signal.kind}</Badge>
                <span className="text-[10px] text-ghost">
                  {signal.evidence} sources · {signal.confidence}%
                </span>
                <span className="ml-auto text-[10px] text-positive">Approved</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-snug text-ink">{signal.title}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-accent-line bg-accent-soft p-2.5">
          <p className="text-eyebrow mb-1.5 text-accent">Queued because of it</p>
          <p className="text-[11px] leading-relaxed text-muted">
            1 · Three pieces leading with the conversion framing.
            <br />
            Read on: qualified inquiries per published piece, over three weeks.
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-ghost">
          LinkedIn could not be collected automatically — no approved platform app. The two posts
          were pasted in with their URLs and timestamps.
        </p>
      </div>
    </ProductFrame>
  );
}

/**
 * The constraint diagnosis. Shown on the marketing site because it is the least
 * expected thing about the offer: a content company whose first act is to check
 * whether content is the answer.
 */
export function DiagnosisView() {
  return (
    <ProductFrame label="Intelligence · Constraint diagnosis">
      <div className="space-y-3">
        <div>
          <p className="text-eyebrow text-faint">Primary constraint</p>
          <p className="mt-1 text-[17px] font-medium tracking-tight text-ink">Positioning</p>
        </div>

        <div className="space-y-1.5">
          {[
            ["Positioning", 2],
            ["Audience / ICP", 4],
            ["Offer alignment", 3],
            ["Content-market fit", 4],
            ["Differentiation", 2],
            ["Creative quality", 4],
            ["Distribution", 3],
            ["Conversion path", 3],
            ["Operations", 2],
          ].map(([label, rating]) => (
            <div key={label as string} className="flex items-center gap-2 text-[10.5px]">
              <span className="w-24 shrink-0 text-muted">{label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={
                      step <= (rating as number)
                        ? (rating as number) <= 2
                          ? "size-1.5 rounded-full bg-negative"
                          : (rating as number) === 3
                            ? "size-1.5 rounded-full bg-warning"
                            : "size-1.5 rounded-full bg-positive"
                        : "size-1.5 rounded-full bg-raised"
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="rounded-lg border border-warning/25 bg-warning-soft p-2.5 text-[11px] leading-relaxed text-warning">
          More output will not fix this. Publishing more against an unresolved constraint makes the
          same problem more expensive.
        </p>
      </div>
    </ProductFrame>
  );
}

/**
 * The first week, as the client sees it. Every row here is derived from real
 * records in the product rather than a checkbox somebody ticks.
 */
export function InstallationView() {
  return (
    <ProductFrame label="Installation · Day 7">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-eyebrow text-faint">Day 7</p>
          <p className="text-[17px] font-medium tabular text-accent">
            7<span className="text-[12px] text-ghost">/7</span>
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full w-full rounded-full bg-accent" />
        </div>

        <div className="space-y-1.5">
          {[
            ["Business context captured", "Context strength 92%"],
            ["Constraint diagnosis complete", "Positioning, high severity"],
            ["First intelligence brief delivered", "3 signals, 18 evidence items"],
            ["30-day strategy approved", "Signed off"],
            ["First researched scripts ready", "6 cleared for recording"],
            ["First recording completed", "9 recorded pieces"],
            ["First assets in production", "6 pieces in production"],
          ].map(([label, detail]) => (
            <div key={label} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-positive" aria-hidden />
              <div className="min-w-0">
                <p className="text-[11.5px] leading-snug text-ink">{label}</p>
                <p className="text-[10px] text-ghost">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProductFrame>
  );
}
