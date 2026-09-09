import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, FlaskConical, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { LearningSections } from "@/lib/reports/learning-sections";

/**
 * The learning half of the report. Every line here is a record, not a
 * sentence a model wrote: frozen expectations, approved diagnoses,
 * corrections and verdicts. Empty sections say so.
 */
export function LearningReport({ learning }: { learning: LearningSections }) {
  const l = learning;
  return (
    <>
      <Card className="print-surface print-break">
        <CardHeader title="What we expected vs what happened" eyebrow="Section 07" description="The expectation was frozen before each piece went out. The reading is against it, not around it." />
        <CardBody className="pt-0">
          {l.expectedVsActual.length === 0 ? (
            <p className="text-[13px] text-faint print-muted">Nothing went live in this period, so there is nothing to compare.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="py-2 pr-3 font-medium">Piece</th>
                    <th className="py-2 pr-3 font-medium">Expected</th>
                    <th className="py-2 pr-3 font-medium">Actual</th>
                    <th className="py-2 font-medium">Reading</th>
                  </tr>
                </thead>
                <tbody>
                  {l.expectedVsActual.map((row) => (
                    <tr key={row.contentItemId} className="border-b border-line/60 align-top">
                      <td className="py-2 pr-3 text-ink print-ink">{row.title}</td>
                      <td className="py-2 pr-3 text-muted print-muted">
                        {row.expectedClass}
                        {row.expectedOverall ? ` · ${row.expectedOverall}/100` : ""}
                      </td>
                      <td className="py-2 pr-3 text-muted print-muted">{row.actualBand}</td>
                      <td className="py-2">
                        <Badge tone={row.failureClass === "none" ? "positive" : row.failureClass === "insufficient_data" || row.failureClass === "not diagnosed" ? "outline" : "warning"}>
                          {row.failureClass.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="print-surface print-break">
        <CardHeader title="What we learned" eyebrow="Section 08" />
        <CardBody className="pt-0">
          {l.learned.length === 0 ? (
            <p className="text-[13px] text-faint print-muted">No diagnosis was approved this period. Where a piece was too young to read, it is listed under data limitations rather than guessed at.</p>
          ) : (
            <ul className="space-y-3.5">
              {l.learned.map((item, i) => (
                <li key={i} className="flex gap-3">
                  {item.failureClass === "none" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium text-ink print-ink">{item.title}</p>
                      <Badge tone="outline">{item.failureClass.replace(/_/g, " ")}</Badge>
                      {!item.preserveThesis ? <Badge tone="negative">thesis in question</Badge> : null}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted print-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="print-surface">
          <CardHeader title="Weakest link" eyebrow="Section 09" />
          <CardBody className="pt-0">
            {l.weakestLink ? (
              <div className="flex gap-3">
                <Scale className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-[13.5px] font-medium text-ink print-ink">{l.weakestLink.label}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted print-muted">{l.weakestLink.explanation}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-faint print-muted">No approved diagnosis named a cause this period, so no link can honestly be called the weakest.</p>
            )}
          </CardBody>
        </Card>

        <Card className="print-surface">
          <CardHeader title="What changed, and did it work" eyebrow="Section 10" />
          <CardBody className="pt-0 space-y-3">
            {l.whatChanged.length === 0 ? (
              <p className="text-[13px] text-faint print-muted">No correction was recorded this period.</p>
            ) : (
              <ul className="space-y-2.5">
                {l.whatChanged.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[13px] text-ink print-ink">{c.correction}</p>
                      <p className="mt-0.5 text-[12px] text-faint print-muted">
                        {c.lever} lever · {c.verdict}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[12.5px] leading-relaxed text-muted print-muted">{l.whetherChangeWorked.sentence}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="print-surface">
          <CardHeader title="What we are testing next" eyebrow="Section 11" />
          <CardBody className="pt-0">
            {l.nextTests.length === 0 ? (
              <p className="text-[13px] text-faint print-muted">No test is queued from this period&apos;s readings yet.</p>
            ) : (
              <ul className="space-y-2">
                {l.nextTests.map((t, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-ink print-ink">
                    <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="print-surface">
          <CardHeader title="Data limitations and what is still unknown" eyebrow="Section 12" />
          <CardBody className="pt-0 space-y-2">
            {[...l.dataLimitations, ...l.stillUnknown].length === 0 ? (
              <p className="text-[13px] text-faint print-muted">Nothing to declare.</p>
            ) : (
              <ul className="space-y-2">
                {[...l.dataLimitations, ...l.stillUnknown].map((t, i) => (
                  <li key={i} className="flex gap-3 text-[12.5px] leading-relaxed text-muted print-muted">
                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
