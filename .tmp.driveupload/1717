import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mic } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { readinessAssets, readinessView } from "@/lib/data/readiness";
import {
  CHECK_STATE_META,
  READINESS_STATUS_META,
  RECORDING_FORMAT_META,
  needsClientAction,
  type CheckState,
  type ReadinessStatus,
  type RecordingFormat,
} from "@/lib/domain/readiness";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/dates";
import { AssessmentForm, ReferenceForm, SetupForm } from "./readiness-forms";

export const metadata: Metadata = { title: "Recording setup" };

/**
 * Recording readiness.
 *
 * One page, two jobs. The client describes their room and supplies a test clip;
 * an operator watches it and gives an honest verdict. Both see the same status
 * and the same reasoning — there is no version of this where the client is told
 * everything is fine while the operator note says otherwise.
 */
export default async function RecordingSetupPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "recording.view");

  const [view, assets] = await Promise.all([
    readinessView(ctx.org.id),
    readinessAssets(ctx.org.id),
  ]);

  const canAssess = ctx.can("readiness.assess");
  const canSubmit = ctx.can("recording.complete") || canAssess;
  const status = view.status;
  const statusMeta = READINESS_STATUS_META[status];
  const record = view.record;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/${slug}/install`}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Installation
        </Link>
      </div>

      <header className="max-w-2xl">
        <h1 className="text-section">Recording setup</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Before the first batch, we check that your setup can actually produce publishable footage
          — and that you can reproduce it next week without help. A room problem is not something
          editing fixes; it just makes every piece slightly worse, quietly.
        </p>
      </header>

      {/* ------------------------------- The verdict ------------------------------ */}
      <Card className={status === "blocked" ? "border-negative/30" : undefined}>
        <CardBody className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{statusMeta.description}</p>

              {record?.clientAction && needsClientAction(status) ? (
                <p className="mt-4 rounded-md border border-accent-line bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-ink">
                  <span className="text-accent">What to do: </span>
                  {record.clientAction}
                </p>
              ) : null}

              {record?.recommendation ? (
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  {record.recommendation}
                </p>
              ) : null}

              <p className="mt-4 text-[11.5px] text-ghost">
                {view.assessed} of {view.total} checks assessed
                {record?.reviewedAt ? ` · reviewed ${formatDate(record.reviewedAt)}` : ""}
                {record?.reviewedBy ? ` by ${record.reviewedBy.name}` : ""}
              </p>
            </div>

            <div className="w-full shrink-0 lg:w-56">
              <Progress value={Math.round((view.assessed / view.total) * 100)} />
              {view.formats.length > 0 ? (
                <div className="mt-4">
                  <p className="text-eyebrow text-faint">Formats needed</p>
                  <ul className="mt-2 space-y-1">
                    {view.formats.map((format) => {
                      const meta = RECORDING_FORMAT_META[format as RecordingFormat];
                      return (
                        <li key={format} className="text-[12px] text-muted">
                          {meta?.label ?? format}
                          <span className="text-ghost"> · {meta?.orientation ?? ""}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {status === "not_assessed" && record?.submittedAt ? (
        <Notice tone="info" icon={Mic} title="With Threadline for review">
          Your setup was sent on {formatDate(record.submittedAt)}. We will watch the test clip and
          come back with a verdict and, if anything needs changing, one specific thing to change.
        </Notice>
      ) : null}

      {/* ------------------------------ The checks ------------------------------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-medium text-ink">What we check</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            Seven things, in the order they cost you attention. This is setup QA — we are not
            selling equipment, and the answer is usually a free change rather than a purchase.
          </p>
        </div>

        <ul className="grid gap-2 lg:grid-cols-2">
          {view.checks.map((check) => {
            const stateMeta = CHECK_STATE_META[check.state as CheckState] ?? CHECK_STATE_META.unknown;
            return (
              <li key={check.key}>
                <Card className="h-full p-0">
                  <CardBody className="pt-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13.5px] font-medium text-ink">{check.label}</p>
                      <Badge tone={stateMeta.tone}>{stateMeta.label}</Badge>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{check.question}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-ghost">{check.why}</p>
                    {check.note ? (
                      <p className="mt-2.5 border-t border-line pt-2.5 text-[12px] leading-relaxed text-faint">
                        {check.note}
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      {/* --------------------------- Photos and test clip ------------------------ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-ink">Photos and test clip</h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
              A wide shot of the room, a frame from where you sit, and thirty seconds of you talking
              normally. That is enough to judge all seven.
            </p>
          </div>
          {canSubmit ? <ReferenceForm slug={slug} /> : null}
        </div>

        {assets.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
            Nothing supplied yet. Add links, or upload them in the Library and tag them as setup
            photos.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <li key={asset.id}>
                <Card className="h-full p-0">
                  <CardBody className="pt-3.5">
                    <Badge tone="info">
                      {asset.category === "setup_photo" ? "Setup photo" : "Test clip"}
                    </Badge>
                    <p className="mt-2 text-[13px] font-medium leading-snug text-ink">
                      {asset.title}
                    </p>
                    {asset.description ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        {asset.description}
                      </p>
                    ) : null}
                    {asset.externalUrl ? (
                      <a
                        href={asset.externalUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-accent"
                      >
                        Open <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------------- Forms --------------------------------- */}
      {canSubmit ? (
        <SetupForm
          slug={slug}
          roomNotes={record?.roomNotes ?? ""}
          gearNotes={record?.gearNotes ?? ""}
          formats={view.formats}
        />
      ) : null}

      {canAssess ? (
        <AssessmentForm
          slug={slug}
          status={status}
          recommendation={record?.recommendation ?? ""}
          clientAction={record?.clientAction ?? ""}
          checks={view.checks.map((c) => ({
            key: c.key,
            label: c.label,
            question: c.question,
            state: c.state as CheckState,
            note: c.note ?? "",
          }))}
        />
      ) : null}
    </div>
  );
}

export type { ReadinessStatus };
