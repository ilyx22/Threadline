import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { calibrationHistory, currentCalibration, listExamples } from "@/lib/data/corpus";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { CALIBRATION_MINIMUM, RUBRIC, RUBRIC_VERSION } from "@/lib/domain/judge";
import { formatDateTime } from "@/lib/utils/dates";
import { RunCalibrationButton } from "../research-client";

export const metadata: Metadata = { title: "Judge calibration" };

/**
 * Is the Judge's opinion worth anything?
 *
 * Corpus examples have a known outcome — how far each outperformed its own
 * creator. Scoring them with the same rubric used on client work, then checking
 * whether the Judge rated the winners higher, is the first honest answer.
 *
 * The page is deliberately blunt about its own limits. A separation on corpus
 * content says the rubric can tell good market content from ordinary market
 * content. It does not say the rubric can tell which of *our* scripts will earn
 * a client a buying conversation — that is a claim only client outcomes can
 * support, and the word "calibrated" is reserved for it.
 */
export default async function CalibrationPage() {
  await requireInternal("corpus.manage");

  const [reading, history, examples] = await Promise.all([
    currentCalibration(),
    calibrationHistory(),
    listExamples(),
  ]);

  const byId = new Map(examples.map((e) => [e.id, e]));

  return (
    <div className="space-y-8">
      <Link
        href="/admin/research"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-faint transition-colors hover:text-muted"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Research corpus
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Judge calibration</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Whether the rubric&apos;s opinion tracks what actually happened. Rubric{" "}
            <code>{RUBRIC_VERSION}</code>, {RUBRIC.length} criteria.
          </p>
        </div>
        <RunCalibrationButton />
      </header>

      <Notice tone={reading.sufficient ? "info" : "warning"} title="Reading">
        {reading.reading}
        {reading.excludedIllustrative > 0 ? (
          <span className="mt-1 block text-[12px] text-faint">
            {reading.excludedIllustrative} illustrative row
            {reading.excludedIllustrative === 1 ? " is" : "s are"} excluded. Their metrics were
            invented for the demo, and calibrating against invented outcomes would be worse than
            not calibrating at all.
          </span>
        ) : null}
      </Notice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Scored examples"
          value={reading.pairs}
          sublabel={`${CALIBRATION_MINIMUM} needed to conclude anything`}
        />
        <StatCard
          label="Actually outperformed"
          value={reading.outperformers}
          sublabel="strong or exceptional"
        />
        <StatCard
          label="Judge on those"
          value={reading.meanOnOutperformers ?? "—"}
          sublabel="mean score"
        />
        <StatCard
          label="Separation"
          value={reading.separation === null ? "—" : `${reading.separation > 0 ? "+" : ""}${reading.separation}`}
          sublabel={reading.meanOnRest !== null ? `vs ${reading.meanOnRest} on the rest` : ""}
          emphasis
        />
      </section>

      {reading.worstMisses.length > 0 ? (
        <section>
          <SectionHeading
            title="Where the Judge was most wrong"
            description="Pieces that outperformed their creator and the Judge rated low. This is where the rubric is missing something — read them before changing a weight."
          />
          <div className="overflow-hidden rounded-lg border border-line bg-elevated">
            <ul className="divide-y divide-line">
              {reading.worstMisses.map((miss) => {
                const example = byId.get(miss.exampleId);
                return (
                  <li key={miss.exampleId} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">
                        {example?.title ?? miss.exampleId}
                      </p>
                      <p className="text-[11.5px] text-faint">
                        {example?.creatorName ?? example?.creatorHandle} · {example?.outlier.reason}
                      </p>
                    </div>
                    <Badge tone="warning">Judge {miss.overall}/100</Badge>
                    <Badge tone="positive">{miss.band}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading
          title="Runs"
          description="Frozen, because the corpus grows. A run records what was concluded on the evidence available that day, which is the only way to see whether changing the rubric later actually helped."
        />
        {history.length === 0 ? (
          <EmptyState
            title="No runs yet"
            description="Score some corpus examples with the Judge, then run a calibration."
          />
        ) : (
          <div className="space-y-2">
            {history.map((run) => (
              <Card key={run.id}>
                <CardBody className="flex flex-wrap items-center gap-4 pt-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-ink">{run.reading}</p>
                    <p className="mt-1 text-[11.5px] text-faint">
                      {formatDateTime(run.runAt)} · rubric {run.rubricVersion} · {run.pairs} pairs
                    </p>
                  </div>
                  <Badge tone={run.sufficient ? "info" : "warning"}>
                    {run.sufficient ? "Readable" : "Too thin"}
                  </Badge>
                  {run.separation !== null ? (
                    <Badge tone={run.separation > 0 ? "positive" : "negative"}>
                      {run.separation > 0 ? "+" : ""}
                      {run.separation}
                    </Badge>
                  ) : null}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader
          title="What this can and cannot tell you"
          description="Worth reading before the separation number starts getting quoted."
        />
        <CardBody className="space-y-2 text-[12.5px] leading-relaxed text-muted">
          <p>
            <strong className="text-ink">It can tell you</strong> whether the rubric distinguishes
            market content that outperformed its creator from content that did not.
          </p>
          <p>
            <strong className="text-ink">It cannot tell you</strong> whether the rubric predicts
            which of our scripts will earn a client a buying conversation. That is a different
            claim and only client outcomes can support it — which is why nothing here is ever
            marked calibrated, however good the separation looks.
          </p>
          <p>
            <strong className="text-ink">The misses are the useful part.</strong> A high separation
            means the rubric agrees with reality on the easy cases. The pieces it rated low that
            went on to outperform are where it is missing something real.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
