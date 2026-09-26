import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { seesOperatorSurface } from "@/lib/domain/visibility";
import type { PeriodFigures } from "@/lib/reports/period-review";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ReviewEditor } from "./review-editor";

export const metadata: Metadata = { title: "Four-week review" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { key: "action", title: "Action", ask: "What we did this period." },
  { key: "results", title: "Results", ask: "What happened, measured against what we expected." },
  { key: "problems", title: "Problems", ask: "What got in the way, and what it cost." },
  { key: "future", title: "Future", ask: "What we do next period, and what we will measure." },
] as const;

/** One four-week review (REP-02). Clients read final versions only; staff write drafts. */
export default async function ReviewPage({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "reports.view");
  const staff = seesOperatorSurface(ctx.role);
  const review = await prisma.periodReview.findFirst({ where: { id, orgId: ctx.org.id, ...(staff ? {} : { status: "final" }) } });
  if (!review) notFound();
  const f = JSON.parse(review.figures) as Partial<PeriodFigures>;
  const d = (x: Date) => x.toISOString().slice(0, 10);
  const figures: [string, number | undefined][] = [
    ["Pieces published", f.published],
    ["Views", f.views],
    ["Inquiries", f.inquiries],
    ["Calls booked", f.callsBooked],
    ["Approvals given", f.approvalsGiven],
    ["Changes requested", f.changesRequested],
    ["Diagnoses approved", f.diagnosesApproved],
    ["Corrections made", f.correctionsMade],
  ];
  const editing = staff && review.status === "draft" && ctx.can("reports.finalise");

  return (
    <div className="space-y-6">
      <Link href={`/app/${slug}/reports`} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden /> Reports
      </Link>
      <header>
        <p className="text-eyebrow text-faint">Four-week review · {ctx.org.name}</p>
        <h1 className="mt-2 text-section">
          Period {review.periodNumber}: {d(review.periodStart)} to {d(new Date(review.periodEnd.getTime() - 86_400_000))}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={review.status === "final" ? "positive" : "outline"}>{review.status === "final" ? "Final" : "Draft"}</Badge>
          {review.version > 1 ? <Badge tone="outline">Version {review.version}</Badge> : null}
          {review.supersededAt ? <Badge tone="warning">Replaced by a corrected version</Badge> : null}
        </div>
        {review.revisionReason ? <p className="mt-3 text-[13px] text-muted">Correction of an earlier version: {review.revisionReason}</p> : null}
      </header>

      <Card>
        <CardHeader title="The period in numbers" description={`Computed from records${f.computedAt ? ` on ${f.computedAt.slice(0, 10)}` : ""}${review.status === "final" ? " and frozen when the review was finalised" : ""}.`} />
        <CardBody className="grid grid-cols-2 gap-4 pt-0 sm:grid-cols-4">
          {figures.map(([label, value]) => (
            <div key={label}>
              <p className="text-[12px] text-ghost">{label}</p>
              <p className="text-[20px] text-ink">{typeof value === "number" ? value.toLocaleString("en-GB") : "—"}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      {editing ? (
        <ReviewEditor slug={slug} reviewId={review.id} sections={SECTIONS.map((s) => ({ ...s, value: review[s.key] }))} />
      ) : (
        <>
          {SECTIONS.map((s) => (
            <Card key={s.key}>
              <CardHeader title={s.title} eyebrow={s.ask} />
              <CardBody className="pt-0">
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink">{review[s.key] || "Not written yet."}</p>
              </CardBody>
            </Card>
          ))}
          {staff && review.status === "final" && !review.supersededAt && ctx.can("reports.finalise") ? <ReviewEditor slug={slug} reviewId={review.id} sections={[]} reviseOnly /> : null}
        </>
      )}
    </div>
  );
}
