"use client";

import * as React from "react";
import { MessageSquarePlus, Save } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { addConversationAction, saveWedgeAction } from "@/lib/actions/validation";
import { toDateInput } from "@/lib/utils/dates";

/**
 * Recording a research conversation.
 *
 * `volunteered` is the field that matters most and it is deliberately awkward
 * to skip. A problem the buyer raised themselves is much stronger evidence than
 * one we named and they agreed with, and a system that stored both the same way
 * would let a hypothesis survive being wrong.
 */
export function ConversationForm({
  wedgeId,
  themes,
}: {
  wedgeId: string;
  /** Themes already used on this wedge, so they can be reused rather than retyped. */
  themes: string[];
}) {
  return (
    <ActionForm
      action={addConversationAction.bind(null, wedgeId)}
      className="space-y-4"
      resetOnSuccess
    >
      {({ fieldErrors, error }) => (
        <>
          <FormError error={error} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Who" htmlFor="person" error={fieldErrors.person}>
              <Input id="person" name="person" required />
            </Field>
            <Field label="Company" htmlFor="company" optional>
              <Input id="company" name="company" />
            </Field>
            <Field label="When" htmlFor="heldAt" optional>
              <Input id="heldAt" name="heldAt" type="date" defaultValue={toDateInput(new Date())} />
            </Field>
          </div>

          <Field
            label="The problem, in their words"
            htmlFor="problem"
            hint="Their language. Translating it into ours is how a market's vocabulary gets replaced by our own."
            error={fieldErrors.problem}
          >
            <Textarea id="problem" name="problem" rows={3} required />
          </Field>

          <Field
            label="Problem theme"
            htmlFor="problemTheme"
            hint="Which recurring problem this belongs to. Two people describing the same expensive problem in different words is a judgement only you can make — the system counts what you assign and ignores what you leave blank."
          >
            <Input
              id="problemTheme"
              name="problemTheme"
              list={`themes-${wedgeId}`}
              placeholder="e.g. expertise never leaves the room"
            />
            <datalist id={`themes-${wedgeId}`}>
              {themes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>

          <CheckboxField
            id={`volunteered-${wedgeId}`}
            name="volunteered"
            label="They raised it before we named it"
            description="Agreement with our own suggestion is the weakest evidence available. This distinction is the point of the whole exercise."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How they do it today" htmlFor="currentProcess" optional>
              <Textarea id="currentProcess" name="currentProcess" rows={2} />
            </Field>
            <Field label="What they have already tried" htmlFor="triedBefore" optional>
              <Textarea id="triedBefore" name="triedBefore" rows={2} />
            </Field>
          </div>

          <Field
            label="What it costs them"
            htmlFor="consequence"
            optional
            hint="Quantified if they gave a number, left empty if they did not."
          >
            <Textarea id="consequence" name="consequence" rows={2} />
          </Field>

          <Field label="A quote worth keeping" htmlFor="quote" optional>
            <Textarea id="quote" name="quote" rows={2} />
          </Field>

          <SubmitButton icon={MessageSquarePlus}>Record the conversation</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/** The frozen hypothesis: one sentence each, or blank. */
export function HypothesisForm({
  wedge,
}: {
  wedge: {
    id: string;
    label: string;
    summary: string | null;
    problem: string | null;
    outcome: string | null;
    qualification: string | null;
    mechanism: string | null;
    scoreEconomics: number;
    scorePain: number;
    scoreReach: number;
    scorePrecedent: number;
    nextAction: string | null;
    nextActionDueAt: string | null;
    notes: string | null;
  };
}) {
  return (
    <Card>
      <CardHeader
        title="The hypothesis"
        description="One sentence each. If a line cannot be written yet, leave it blank rather than filling it with something that sounds right."
      />
      <CardBody>
        <ActionForm action={saveWedgeAction.bind(null, wedge.id)} className="space-y-4">
          {({ fieldErrors, error }) => (
            <>
              <FormError error={error} />

              <Field label="Wedge" htmlFor="label" error={fieldErrors.label}>
                <Input id="label" name="label" defaultValue={wedge.label} required />
              </Field>

              <Field label="Who exactly" htmlFor="summary" optional>
                <Textarea id="summary" name="summary" rows={2} defaultValue={wedge.summary ?? ""} />
              </Field>

              <Field
                label="The expensive problem"
                htmlFor="problem"
                optional
                hint="The one the market itself confirmed, not the one we would prefer to solve."
              >
                <Textarea id="problem" name="problem" rows={2} defaultValue={wedge.problem ?? ""} />
              </Field>

              <Field label="Outcome hypothesis" htmlFor="outcome" optional>
                <Textarea id="outcome" name="outcome" rows={2} defaultValue={wedge.outcome ?? ""} />
              </Field>

              <Field
                label="Qualification"
                htmlFor="qualification"
                optional
                hint="What must already be true for them to succeed here."
              >
                <Textarea
                  id="qualification"
                  name="qualification"
                  rows={2}
                  defaultValue={wedge.qualification ?? ""}
                />
              </Field>

              <Field label="Mechanism" htmlFor="mechanism" optional>
                <Textarea
                  id="mechanism"
                  name="mechanism"
                  rows={2}
                  defaultValue={wedge.mechanism ?? ""}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Score name="scoreEconomics" label="Economics" value={wedge.scoreEconomics} />
                <Score name="scorePain" label="Pain" value={wedge.scorePain} />
                <Score name="scoreReach" label="Reach" value={wedge.scoreReach} />
                <Score name="scorePrecedent" label="Precedent" value={wedge.scorePrecedent} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Next action" htmlFor="nextAction">
                  <Input id="nextAction" name="nextAction" defaultValue={wedge.nextAction ?? ""} />
                </Field>
                <Field label="Due" htmlFor="nextActionDueAt">
                  <Input
                    id="nextActionDueAt"
                    name="nextActionDueAt"
                    type="date"
                    defaultValue={toDateInput(wedge.nextActionDueAt)}
                  />
                </Field>
              </div>

              <Field label="Notes" htmlFor="notes" optional>
                <Textarea id="notes" name="notes" rows={3} defaultValue={wedge.notes ?? ""} />
              </Field>

              <SubmitButton icon={Save} variant="secondary">
                Save
              </SubmitButton>
            </>
          )}
        </ActionForm>
      </CardBody>
    </Card>
  );
}

function Score({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <Field label={label} htmlFor={name}>
      <Input id={name} name={name} type="number" min={0} max={5} defaultValue={value} inputSize="sm" />
    </Field>
  );
}
