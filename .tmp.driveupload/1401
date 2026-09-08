"use client";

import * as React from "react";
import { CalendarPlus, MessageSquare, Save } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  bookCallAction,
  classifyReplyAction,
  recordCallOutcomeAction,
  saveCallStageAction,
  saveProspectAction,
} from "@/lib/actions/acquisition";
import {
  CALL_OUTCOME_OPTIONS,
  CALL_STAGE_META,
  PROSPECT_TIER_OPTIONS,
  REPLY_CLASS_META,
  REPLY_CLASS_OPTIONS,
  metaOf,
} from "@/lib/domain/enums";
import { toDateInput } from "@/lib/utils/dates";

export type CallView = {
  id: string;
  scheduledAt: string;
  attended: boolean;
  outcome: string | null;
  voc: string | null;
  objections: string | null;
  completedAt: string | null;
  stages: { stage: string; covered: boolean; note: string | null }[];
  missing: string[];
};

/* --------------------------------- Replies --------------------------------- */

/**
 * Classifying a reply.
 *
 * The classification is not admin: it decides what the record's objective is,
 * sets the next action, and is the only way the reply-to-booking conversion
 * becomes measurable. The guidance under each option is an objective, not a
 * script — a script written by something that has never spoken to this market
 * would be worse than the operator's own sentence.
 */
export function ReplyPanel({
  prospectId,
  current,
}: {
  prospectId: string;
  current: string | null;
}) {
  const [selected, setSelected] = React.useState(current ?? "interested");
  const meta = metaOf(REPLY_CLASS_META, selected);

  return (
    <Card>
      <CardHeader
        title="A reply arrived"
        description="A reply is not a booking. Classifying it is what makes that conversion visible."
        action={current ? <Badge tone={metaOf(REPLY_CLASS_META, current).tone}>{metaOf(REPLY_CLASS_META, current).label}</Badge> : null}
      />
      <CardBody>
        <ActionForm action={classifyReplyAction.bind(null, prospectId)} className="space-y-4">
          {({ fieldErrors, error }) => (
            <>
              <FormError error={error} />
              <Field label="What kind of reply" htmlFor="replyClass" error={fieldErrors.replyClass}>
                <NativeSelect
                  id="replyClass"
                  name="replyClass"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {REPLY_CLASS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              {meta.description ? (
                <p className="rounded-md border border-line bg-raised/40 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                  {meta.description}
                </p>
              ) : null}

              <Field label="What they actually said" htmlFor="note" optional>
                <Textarea id="note" name="note" rows={3} placeholder="Their words, appended to the notes" />
              </Field>

              <div className="flex items-end gap-3">
                <Field label="Follow up on" htmlFor="nextActionDueAt" optional className="flex-1">
                  <Input id="nextActionDueAt" name="nextActionDueAt" type="date" />
                </Field>
                <SubmitButton icon={MessageSquare}>Classify</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </CardBody>
    </Card>
  );
}

/* ---------------------------------- Calls ---------------------------------- */

export function CallsPanel({
  prospectId,
  calls,
}: {
  prospectId: string;
  calls: CallView[];
}) {
  return (
    <Card>
      <CardHeader
        title="Diagnosis calls"
        description="The wording on the call is flexible. What has to be true by the end is not."
      />
      <CardBody className="space-y-5">
        <ActionForm action={bookCallAction.bind(null, prospectId)} className="flex items-end gap-3">
          {({ error }) => (
            <>
              <FormError error={error} />
              <Field label="Book a call" htmlFor="scheduledAt" className="flex-1">
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
              </Field>
              <SubmitButton icon={CalendarPlus} variant="secondary">
                Book
              </SubmitButton>
            </>
          )}
        </ActionForm>

        {calls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
      </CardBody>
    </Card>
  );
}

function CallCard({ call }: { call: CallView }) {
  const done = Boolean(call.completedAt);

  return (
    <div className="rounded-lg border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="text-[13px] text-ink">
          {new Date(call.scheduledAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {done ? (
          <Badge tone={call.attended ? "info" : "neutral"}>
            {call.attended ? (call.outcome ?? "recorded").replace(/_/g, " ") : "No show"}
          </Badge>
        ) : (
          <Badge tone="warning">Upcoming</Badge>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">State map</p>
          <ul className="space-y-1.5">
            {call.stages.map((stage) => (
              <StageRow key={stage.stage} callId={call.id} stage={stage} />
            ))}
          </ul>
        </div>

        {!done ? <OutcomeForm call={call} /> : <CompletedCall call={call} />}
      </div>
    </div>
  );
}

function StageRow({
  callId,
  stage,
}: {
  callId: string;
  stage: { stage: string; covered: boolean; note: string | null };
}) {
  const [open, setOpen] = React.useState(false);
  const meta = metaOf(CALL_STAGE_META, stage.stage);
  const id = `stage-${callId}-${stage.stage}`;

  return (
    <li>
      <ActionForm action={saveCallStageAction.bind(null, callId)}>
        <input type="hidden" name="stage" value={stage.stage} />
        <div className="rounded-md border border-line px-3 py-2">
          <div className="flex items-start gap-2.5">
            <CheckboxField
              id={id}
              name="covered"
              defaultChecked={stage.covered}
              label={meta.label}
              description={meta.description}
              onCheckedChange={() => setOpen(true)}
            />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="ml-auto shrink-0 text-[11.5px] text-faint hover:text-muted"
            >
              {open ? "Close" : stage.note ? "Note" : "Add note"}
            </button>
          </div>

          {stage.note && !open ? (
            <p className="mt-1.5 whitespace-pre-wrap pl-[26px] text-[12px] leading-relaxed text-muted">
              {stage.note}
            </p>
          ) : null}

          {open ? (
            <div className="mt-2 space-y-2 pl-[26px]">
              <Textarea
                name="note"
                rows={2}
                defaultValue={stage.note ?? ""}
                placeholder="What you learned here"
              />
              <SubmitButton size="sm" variant="secondary" icon={Save}>
                Save
              </SubmitButton>
            </div>
          ) : (
            <input type="hidden" name="note" value={stage.note ?? ""} />
          )}
        </div>
      </ActionForm>
    </li>
  );
}

function OutcomeForm({ call }: { call: CallView }) {
  const [attended, setAttended] = React.useState(true);

  return (
    <ActionForm
      action={recordCallOutcomeAction.bind(null, call.id)}
      className="space-y-4 border-t border-line pt-4"
    >
      {({ fieldErrors, error }) => (
        <>
          <FormError error={error} />

          <CheckboxField
            id={`attended-${call.id}`}
            name="attended"
            label="They attended"
            description="A no-show is a funnel event, not an outcome. Recording it as one corrupts the show rate."
            defaultChecked
            onCheckedChange={(c) => setAttended(Boolean(c))}
          />

          {attended ? (
            <>
              {call.missing.length > 0 ? (
                <p className="rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-[12px] leading-relaxed text-warning">
                  Not yet covered: {call.missing.map((m) => m.replace(/_/g, " ")).join(", ")}. An
                  outcome without these means the diagnosis was not made.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Outcome" htmlFor={`outcome-${call.id}`} error={fieldErrors.outcome}>
                  <NativeSelect id={`outcome-${call.id}`} name="outcome" defaultValue="follow_up">
                    {CALL_OUTCOME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Value if it closes" htmlFor={`value-${call.id}`} optional>
                  <Input
                    id={`value-${call.id}`}
                    name="value"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={0}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField
                  id={`qualified-${call.id}`}
                  name="qualified"
                  label="Genuinely a fit"
                  description="This is what turns the qualified rate from an assumption into a measurement."
                />
                <CheckboxField id={`offer-${call.id}`} name="offerMade" label="An offer was made" />
              </div>

              <Field
                label="Their exact words"
                htmlFor={`voc-${call.id}`}
                hint="Their language, not a paraphrase into ours. This is the raw material for the offer and the content."
                error={fieldErrors.voc}
              >
                <Textarea id={`voc-${call.id}`} name="voc" rows={4} />
              </Field>

              <Field label="Objections" htmlFor={`obj-${call.id}`} optional>
                <Textarea id={`obj-${call.id}`} name="objections" rows={2} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Next action" htmlFor={`na-${call.id}`} optional>
                  <Input id={`na-${call.id}`} name="nextAction" />
                </Field>
                <Field label="Due" htmlFor={`nad-${call.id}`} optional>
                  <Input id={`nad-${call.id}`} name="nextActionDueAt" type="date" />
                </Field>
              </div>
            </>
          ) : null}

          <SubmitButton variant="accent">Record outcome</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function CompletedCall({ call }: { call: CallView }) {
  if (!call.attended) {
    return <p className="text-[12.5px] text-muted">Did not attend.</p>;
  }
  return (
    <div className="space-y-3 border-t border-line pt-4">
      {call.voc ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Their words</p>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">
            {call.voc}
          </p>
        </div>
      ) : null}
      {call.objections ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Objections</p>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
            {call.objections}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- Details --------------------------------- */

export function DetailsPanel({
  prospect,
  wedges,
}: {
  prospect: {
    id: string;
    company: string;
    contactName: string | null;
    contactRole: string | null;
    website: string | null;
    tier: string;
    wedgeId: string | null;
    channel: string | null;
    sourceNote: string | null;
    economicsNote: string | null;
    constraintHypothesis: string | null;
    crmProvider: string | null;
    crmRecordId: string | null;
    crmRecordUrl: string | null;
    nextAction: string | null;
    nextActionDueAt: string | null;
    notes: string | null;
  };
  wedges: { id: string; label: string }[];
}) {
  return (
    <Card>
      <CardHeader title="Record" />
      <CardBody>
        <ActionForm action={saveProspectAction.bind(null, prospect.id)} className="space-y-4">
          {({ fieldErrors, error }) => (
            <>
              <FormError error={error} />

              <Field label="Company" htmlFor="company" error={fieldErrors.company}>
                <Input id="company" name="company" defaultValue={prospect.company} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact" htmlFor="contactName" optional>
                  <Input id="contactName" name="contactName" defaultValue={prospect.contactName ?? ""} />
                </Field>
                <Field label="Role" htmlFor="contactRole" optional>
                  <Input id="contactRole" name="contactRole" defaultValue={prospect.contactRole ?? ""} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Website" htmlFor="website" optional>
                  <Input id="website" name="website" defaultValue={prospect.website ?? ""} />
                </Field>
                <Field label="Tier" htmlFor="tier">
                  <NativeSelect id="tier" name="tier" defaultValue={prospect.tier}>
                    {PROSPECT_TIER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Wedge" htmlFor="wedgeId" optional>
                  <NativeSelect id="wedgeId" name="wedgeId" defaultValue={prospect.wedgeId ?? ""}>
                    <option value="">Not assigned</option>
                    {wedges.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Channel" htmlFor="channel" optional>
                  <Input id="channel" name="channel" defaultValue={prospect.channel ?? ""} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Next action" htmlFor="nextAction">
                  <Input id="nextAction" name="nextAction" defaultValue={prospect.nextAction ?? ""} />
                </Field>
                <Field label="Due" htmlFor="nextActionDueAt">
                  <Input
                    id="nextActionDueAt"
                    name="nextActionDueAt"
                    type="date"
                    defaultValue={toDateInput(prospect.nextActionDueAt)}
                  />
                </Field>
              </div>

              <Field
                label="Economics"
                htmlFor="economicsNote"
                optional
                hint="What one more good customer is worth to them."
              >
                <Textarea
                  id="economicsNote"
                  name="economicsNote"
                  rows={2}
                  defaultValue={prospect.economicsNote ?? ""}
                />
              </Field>

              <Field
                label="Constraint hypothesis"
                htmlFor="constraintHypothesis"
                optional
                hint="A hypothesis. Three minutes of browsing does not produce a diagnosis."
              >
                <Textarea
                  id="constraintHypothesis"
                  name="constraintHypothesis"
                  rows={2}
                  defaultValue={prospect.constraintHypothesis ?? ""}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="CRM" htmlFor="crmProvider" optional>
                  <Input
                    id="crmProvider"
                    name="crmProvider"
                    placeholder="Attio"
                    defaultValue={prospect.crmProvider ?? ""}
                  />
                </Field>
                <Field label="Record id" htmlFor="crmRecordId" optional>
                  <Input id="crmRecordId" name="crmRecordId" defaultValue={prospect.crmRecordId ?? ""} />
                </Field>
                <Field label="Record URL" htmlFor="crmRecordUrl" optional>
                  <Input id="crmRecordUrl" name="crmRecordUrl" defaultValue={prospect.crmRecordUrl ?? ""} />
                </Field>
              </div>

              <Field label="Notes" htmlFor="notes" optional>
                <Textarea id="notes" name="notes" rows={4} defaultValue={prospect.notes ?? ""} />
              </Field>

              <Field label="Why them" htmlFor="sourceNote" optional>
                <Textarea
                  id="sourceNote"
                  name="sourceNote"
                  rows={2}
                  defaultValue={prospect.sourceNote ?? ""}
                />
              </Field>

              <SubmitButton icon={Save} variant="secondary">
                Save record
              </SubmitButton>
            </>
          )}
        </ActionForm>
      </CardBody>
    </Card>
  );
}
