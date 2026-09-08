import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Quote } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { getWedge } from "@/lib/data/acquisition";
import { advanceWedgeAction, toggleWedgeCheckAction } from "@/lib/actions/validation";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { WEDGE_STATES, WEDGE_STATE_META, metaOf } from "@/lib/domain/enums";
import { INTERIM_CHECKPOINT, VALIDATION_DECISION_MINIMUM } from "@/lib/domain/sop";
import { formatDate } from "@/lib/utils/dates";
import { NextActionCard, StatePanel } from "../../_components/state-panel";
import { ConversationForm, HypothesisForm } from "./wedge-detail";

export const metadata: Metadata = { title: "Wedge" };

const STATE_LABELS = Object.fromEntries(
  WEDGE_STATES.map((s) => [s, metaOf(WEDGE_STATE_META, s).label]),
);

export default async function WedgePage({ params }: { params: Promise<{ id: string }> }) {
  await requireInternal("acquisition.view");
  const { id } = await params;

  const wedge = await getWedge(id);
  if (!wedge) notFound();

  const state = metaOf(WEDGE_STATE_META, wedge.state);
  const overdue = Boolean(wedge.nextActionDueAt && wedge.nextActionDueAt < new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/admin/market"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-faint transition-colors hover:text-muted"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Market
      </Link>

      <header>
        <h1 className="text-section">{wedge.label}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={state.tone}>{state.label}</Badge>
          {wedge.active ? <Badge tone="accent">Active</Badge> : null}
          {wedge.frozenAt ? (
            <span className="text-[12.5px] text-muted">Frozen {formatDate(wedge.frozenAt)}</span>
          ) : null}
          <span className="text-[12.5px] text-faint">
            {wedge._count.prospects} prospect{wedge._count.prospects === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <NextActionCard
        nextAction={wedge.nextAction}
        dueAt={wedge.nextActionDueAt}
        overdue={overdue}
      />

      {/* How the evidence should be read, before anyone reads it. The reading is
          deliberately never a percentage: with a sample this small, a rate would
          be false precision that somebody would eventually quote out loud. */}
      {/*
        Two thresholds, reported separately. Five says "worth reviewing"; ten
        says "large enough to decide on"; and neither says anything until more
        than five of them converge on the same expensive problem.
      */}
      <Notice
        tone={
          wedge.reading.decisionEligible && wedge.reading.convergenceMet
            ? "positive"
            : wedge.reading.checkpointReached
              ? "info"
              : "warning"
        }
        title={`${wedge.reading.total} conversations · ${wedge.reading.convergence} converging${
          wedge.reading.decisionEligible
            ? " · eligible for a decision"
            : ` · ${VALIDATION_DECISION_MINIMUM - wedge.reading.total} to eligibility`
        }`}
      >
        {wedge.reading.reading}
        {wedge.reading.checkpointReached && !wedge.reading.decisionEligible ? (
          <span className="mt-1 block text-[12px] text-faint">
            {INTERIM_CHECKPOINT} is an interim checkpoint. It is a reason to look, not a reason to
            decide.
          </span>
        ) : null}
        {wedge.reading.unclassified > 0 ? (
          <span className="mt-1 block text-[12px] text-faint">
            {wedge.reading.unclassified} conversation
            {wedge.reading.unclassified === 1 ? " has" : "s have"} no problem theme assigned, so
            {wedge.reading.unclassified === 1 ? " it is" : " they are"} not counted as converging.
          </span>
        ) : null}
      </Notice>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <StatePanel
            view={{
              state: wedge.definition.state,
              meaning: wedge.definition.meaning,
              why: wedge.definition.why,
              completion: wedge.definition.completion,
              next: wedge.definition.next,
              sopKey: wedge.definition.sopKey,
            }}
            label={state.label}
            items={wedge.status.items}
            progress={wedge.status.progress}
            complete={wedge.status.complete}
            toggleAction={toggleWedgeCheckAction.bind(null, wedge.id)}
            advanceAction={advanceWedgeAction.bind(null, wedge.id)}
            stateLabels={STATE_LABELS}
          />

          <Card>
            <CardHeader
              title="Research conversations"
              description="Not disguised sales calls. The point is what they say when nobody is selling."
            />
            <CardBody className="space-y-6">
              <ConversationForm
                wedgeId={wedge.id}
                themes={[
                  ...new Set(
                    wedge.conversations
                      .map((c) => c.problemTheme?.trim())
                      .filter((t): t is string => Boolean(t)),
                  ),
                ]}
              />

              {wedge.conversations.length === 0 ? (
                <EmptyState
                  compact
                  icon={Quote}
                  title="Nothing recorded yet"
                  description={`${INTERIM_CHECKPOINT} conversations is a checkpoint worth reviewing; ${VALIDATION_DECISION_MINIMUM} makes the wedge eligible for a validation decision. Neither is proof, and neither can establish a rate.`}
                />
              ) : (
                <ul className="space-y-3">
                  {wedge.conversations.map((c) => (
                    <li key={c.id} className="rounded-md border border-line px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium text-ink">{c.person}</p>
                        {c.company ? (
                          <span className="text-[12px] text-faint">{c.company}</span>
                        ) : null}
                        <span className="text-[11.5px] text-faint">{formatDate(c.heldAt)}</span>
                        <Badge tone={c.volunteered ? "positive" : "neutral"}>
                          {c.volunteered ? "They raised it" : "We named it"}
                        </Badge>
                        {c.problemTheme ? (
                          <Badge tone="info">{c.problemTheme}</Badge>
                        ) : (
                          <span className="text-[11px] text-warning">No theme — not counted</span>
                        )}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">
                        {c.problem}
                      </p>
                      {c.quote ? (
                        <p className="mt-2 border-l-2 border-line pl-3 text-[12px] italic leading-relaxed text-muted">
                          {c.quote}
                        </p>
                      ) : null}
                      {c.consequence ? (
                        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                          Costs them: {c.consequence}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <HypothesisForm
          wedge={{
            id: wedge.id,
            label: wedge.label,
            summary: wedge.summary,
            problem: wedge.problem,
            outcome: wedge.outcome,
            qualification: wedge.qualification,
            mechanism: wedge.mechanism,
            scoreEconomics: wedge.scoreEconomics,
            scorePain: wedge.scorePain,
            scoreReach: wedge.scoreReach,
            scorePrecedent: wedge.scorePrecedent,
            nextAction: wedge.nextAction,
            nextActionDueAt: wedge.nextActionDueAt?.toISOString() ?? null,
            notes: wedge.notes,
          }}
        />
      </div>
    </div>
  );
}
