"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ActionResult } from "@/lib/actions/shared";
import { SopChecklist, type ChecklistRow } from "./sop-checklist";

/**
 * One state, rendered as work rather than as documentation.
 *
 * The operator should be able to do the job from this card without opening
 * anything: what the state means, why it matters, the exact checklist, what
 * finished looks like, and where it can go next. The long-form SOP is a link at
 * the bottom, and the intent is that it is almost never followed.
 */

export type StateView = {
  state: string;
  meaning: string;
  why: string;
  completion: string;
  next: string[];
  sopKey?: string;
};

export function StatePanel({
  view,
  label,
  items,
  progress,
  complete,
  toggleAction,
  advanceAction,
  stateLabels,
}: {
  view: StateView;
  label: string;
  items: ChecklistRow[];
  progress: number;
  complete: boolean;
  toggleAction: (prev: never, formData: FormData) => Promise<ActionResult>;
  advanceAction: (prev: never, formData: FormData) => Promise<ActionResult>;
  stateLabels: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader
        title={label}
        description={view.meaning}
        action={complete ? <Badge tone="positive">Ready to move</Badge> : null}
      />
      <CardBody className="space-y-5">
        <p className="border-l-2 border-line pl-3 text-[12.5px] leading-relaxed text-muted">
          {view.why}
        </p>

        <SopChecklist state={view.state} items={items} progress={progress} action={toggleAction} />

        <div className="rounded-md border border-line bg-raised/40 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Done when</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{view.completion}</p>
        </div>

        {view.next.length > 0 ? (
          <TransitionForm
            action={advanceAction}
            next={view.next}
            stateLabels={stateLabels}
            complete={complete}
          />
        ) : (
          <p className="text-[12.5px] text-muted">
            This is the end of the acquisition process. What happens next is a different SOP.
          </p>
        )}

        {view.sopKey ? (
          <Link
            href={`/admin/sops/${view.sopKey}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-muted"
          >
            <BookOpen className="size-3.5" aria-hidden />
            Long-form SOP, if you need it
          </Link>
        ) : null}
      </CardBody>
    </Card>
  );
}

function TransitionForm({
  action,
  next,
  stateLabels,
  complete,
}: {
  action: (prev: never, formData: FormData) => Promise<ActionResult>;
  next: string[];
  stateLabels: Record<string, string>;
  complete: boolean;
}) {
  const [target, setTarget] = React.useState(next[0] ?? "");

  return (
    <ActionForm action={action} className="space-y-3 border-t border-line pt-4">
      {({ fieldErrors, error }) => (
        <>
          <FormError error={error} />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Move to" htmlFor="move-to">
              <NativeSelect
                id="move-to"
                name="to"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {next.map((s) => (
                  <option key={s} value={s}>
                    {stateLabels[s] ?? s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex items-end">
              <SubmitButton icon={ArrowRight} variant="accent">
                Move
              </SubmitButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/*
              Ids are namespaced because the record form further down the page
              owns fields with the same names. Two elements sharing an id break
              every label association on the page, not just their own.
            */}
            <Field
              label="Next action"
              htmlFor="move-next-action"
              optional
              hint="Leave blank to use the default for that state."
              error={fieldErrors.nextAction}
            >
              <Input id="move-next-action" name="nextAction" placeholder="What happens next" />
            </Field>
            <Field label="Due" htmlFor="move-due" optional error={fieldErrors.nextActionDueAt}>
              <Input id="move-due" name="nextActionDueAt" type="date" icon={CalendarClock} />
            </Field>
          </div>

          {!complete ? (
            <Field
              label="Reason for moving on early"
              htmlFor="move-override"
              hint="The checklist is not finished. Moving anyway is allowed, but the reason goes into the audit trail."
            >
              <Textarea id="move-override" name="override" rows={2} placeholder="Why this is the right call" />
            </Field>
          ) : null}
        </>
      )}
    </ActionForm>
  );
}

/** The next action and its date, shown wherever a record is open. */
export function NextActionCard({
  nextAction,
  dueAt,
  overdue,
}: {
  nextAction: string | null;
  dueAt: Date | null;
  overdue: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        overdue ? "border-negative/30 bg-negative-soft/30" : "border-line bg-elevated"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Next action</p>
      <p className="mt-1 text-[13.5px] leading-snug text-ink">
        {nextAction ?? "Nothing recorded — this record is invisible in the queue."}
      </p>
      <p className={`mt-1 text-[12px] ${overdue ? "text-negative" : "text-muted"}`}>
        {dueAt
          ? `${overdue ? "Overdue since" : "Due"} ${dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
          : "No date set"}
      </p>
    </div>
  );
}
