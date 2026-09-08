import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { getProspect, listWedges } from "@/lib/data/acquisition";
import { advanceProspectAction, toggleProspectCheckAction } from "@/lib/actions/acquisition";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  PROSPECT_STATE_META,
  PROSPECT_TIER_META,
  metaOf,
  PROSPECT_STATES,
} from "@/lib/domain/enums";
import { missingCallStages } from "@/lib/domain/sop";
import { parseStringArray } from "@/lib/db/json";
import { NextActionCard, StatePanel } from "../../_components/state-panel";
import { CallsPanel, DetailsPanel, ReplyPanel } from "./prospect-detail";

export const metadata: Metadata = { title: "Prospect" };

const STATE_LABELS = Object.fromEntries(
  PROSPECT_STATES.map((s) => [s, metaOf(PROSPECT_STATE_META, s).label]),
);

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireInternal("acquisition.view");
  const { id } = await params;

  const [prospect, wedges] = await Promise.all([getProspect(id), listWedges()]);
  if (!prospect) notFound();

  const state = metaOf(PROSPECT_STATE_META, prospect.state);
  const tier = metaOf(PROSPECT_TIER_META, prospect.tier);
  const overdue = Boolean(prospect.nextActionDueAt && prospect.nextActionDueAt < new Date());
  const showReply = ["contacted", "replied", "follow_up"].includes(prospect.state);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/prospects"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-faint transition-colors hover:text-muted"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Prospects
      </Link>

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-section">{prospect.company}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={state.tone}>{state.label}</Badge>
            <Badge tone={tier.tone}>{tier.label}</Badge>
            {prospect.contactName ? (
              <span className="text-[12.5px] text-muted">
                {prospect.contactName}
                {prospect.contactRole ? ` · ${prospect.contactRole}` : ""}
              </span>
            ) : null}
            {prospect.wedge ? (
              <Link
                href={`/admin/market/${prospect.wedge.id}`}
                className="text-[12.5px] text-faint hover:underline"
              >
                {prospect.wedge.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {prospect.website ? (
            <a
              href={prospect.website}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-faint hover:text-muted"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Website
            </a>
          ) : null}
          {prospect.crmRecordUrl ? (
            <a
              href={prospect.crmRecordUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-faint hover:text-muted"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {prospect.crmProvider ?? "CRM"}
            </a>
          ) : null}
        </div>
      </header>

      <NextActionCard
        nextAction={prospect.nextAction}
        dueAt={prospect.nextActionDueAt}
        overdue={overdue}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <StatePanel
            view={{
              state: prospect.definition.state,
              meaning: prospect.definition.meaning,
              why: prospect.definition.why,
              completion: prospect.definition.completion,
              next: prospect.definition.next,
              sopKey: prospect.definition.sopKey,
            }}
            label={state.label}
            items={prospect.status.items}
            progress={prospect.status.progress}
            complete={prospect.status.complete}
            toggleAction={toggleProspectCheckAction.bind(null, prospect.id)}
            advanceAction={advanceProspectAction.bind(null, prospect.id)}
            stateLabels={STATE_LABELS}
          />

          {showReply ? (
            <ReplyPanel prospectId={prospect.id} current={prospect.replyClass} />
          ) : null}

          <CallsPanel
            prospectId={prospect.id}
            calls={prospect.calls.map((call) => ({
              id: call.id,
              scheduledAt: call.scheduledAt.toISOString(),
              attended: call.attended,
              outcome: call.outcome,
              voc: call.voc,
              objections: call.objections,
              completedAt: call.completedAt?.toISOString() ?? null,
              stages: call.stages.map((s) => ({
                stage: s.stage,
                covered: s.covered,
                note: s.note,
              })),
              missing: missingCallStages(parseStringArray(call.stagesCovered)),
            }))}
          />
        </div>

        <div className="space-y-6">
          {prospect.economicsNote || prospect.constraintHypothesis ? (
            <Card>
              <CardHeader title="What we know" />
              <CardBody className="space-y-3">
                {prospect.economicsNote ? (
                  <Section label="Economics" body={prospect.economicsNote} />
                ) : null}
                {prospect.constraintHypothesis ? (
                  <Section label="Constraint hypothesis" body={prospect.constraintHypothesis} />
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <DetailsPanel
            wedges={wedges.map((w) => ({ id: w.id, label: w.label }))}
            prospect={{
              id: prospect.id,
              company: prospect.company,
              contactName: prospect.contactName,
              contactRole: prospect.contactRole,
              website: prospect.website,
              tier: prospect.tier,
              wedgeId: prospect.wedgeId,
              channel: prospect.channel,
              sourceNote: prospect.sourceNote,
              economicsNote: prospect.economicsNote,
              constraintHypothesis: prospect.constraintHypothesis,
              crmProvider: prospect.crmProvider,
              crmRecordId: prospect.crmRecordId,
              crmRecordUrl: prospect.crmRecordUrl,
              nextAction: prospect.nextAction,
              nextActionDueAt: prospect.nextActionDueAt?.toISOString() ?? null,
              notes: prospect.notes,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{body}</p>
    </div>
  );
}
