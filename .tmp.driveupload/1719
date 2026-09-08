"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  CHECK_STATE_META,
  CHECK_STATES,
  READINESS_STATUS_META,
  READINESS_STATUSES,
  RECORDING_FORMATS,
  RECORDING_FORMAT_META,
  suggestedStatus,
  type CheckState,
  type ReadinessStatus,
} from "@/lib/domain/readiness";
import {
  addReadinessReferenceAction,
  assessRecordingSetupAction,
  submitRecordingSetupAction,
} from "@/lib/actions/readiness";

/**
 * Recording readiness forms.
 *
 * The assessment form recomputes the suggested status live as checks change, so
 * an operator sees what the evidence points at before choosing. Overriding it is
 * allowed and the server still refuses an impossible combination — a setup with
 * a blocking check cannot be saved as ready however the dropdown is set.
 */

/* ------------------------------ Client submits ----------------------------- */

export function SetupForm({
  slug,
  roomNotes,
  gearNotes,
  formats,
}: {
  slug: string;
  roomNotes: string;
  gearNotes: string;
  formats: string[];
}) {
  const router = useRouter();

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-medium text-ink">Your setup</h2>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
          Describe where you record and what you record on. Rough is fine — we are looking for what
          is actually there, not a spec sheet.
        </p>
      </div>

      <Card>
        <CardBody className="pt-4">
          <ActionForm
            action={submitRecordingSetupAction.bind(null, slug)}
            onSuccess={() => router.refresh()}
          >
            {({ fieldErrors, error }) => (
              <div className="space-y-4">
                <FormError error={error} />

                <Field
                  label="Formats you need"
                  hint="Long-form is part of a pilot rather than the base retainer — pick it only if it has been agreed."
                  error={fieldErrors.formats}
                >
                  <div className="space-y-2">
                    {RECORDING_FORMATS.map((format) => (
                      <CheckboxField
                        key={format}
                        id={`format-${format}`}
                        name="formats"
                        value={format}
                        defaultChecked={formats.includes(format)}
                        label={RECORDING_FORMAT_META[format].label}
                        description={RECORDING_FORMAT_META[format].description}
                      />
                    ))}
                  </div>
                </Field>

                <Field
                  label="The room"
                  hint="Where do you sit, what is behind you, what is the light doing, is it quiet?"
                  error={fieldErrors.roomNotes}
                >
                  <Textarea
                    name="roomNotes"
                    rows={4}
                    defaultValue={roomNotes}
                    placeholder="Home office, window on my left, white wall behind me. Boiler kicks in occasionally."
                  />
                </Field>

                <Field
                  label="What you record on"
                  hint="Camera or phone, microphone, lights, tripod, anything you already own."
                  error={fieldErrors.gearNotes}
                >
                  <Textarea
                    name="gearNotes"
                    rows={3}
                    defaultValue={gearNotes}
                    placeholder="iPhone 14 on a small tripod, AirPods for audio, no lights."
                  />
                </Field>

                <div className="flex justify-end">
                  <SubmitButton variant="accent">Send for review</SubmitButton>
                </div>
              </div>
            )}
          </ActionForm>
        </CardBody>
      </Card>
    </section>
  );
}

export function ReferenceForm({ slug }: { slug: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} variant="secondary" onClick={() => setOpen(true)}>
        Add a photo or clip
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Add a reference"
            description="A link to a photo or a short clip. Anywhere you can share from is fine — we only store the link."
          />
          <ActionForm
            action={addReadinessReferenceAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Type" error={fieldErrors.category}>
                    <NativeSelect name="category" defaultValue="setup_photo">
                      <option value="setup_photo">Setup photo</option>
                      <option value="test_clip">Test clip</option>
                    </NativeSelect>
                  </Field>
                  <Field label="Name" error={fieldErrors.title}>
                    <Input name="title" required placeholder="Wide shot of the room" />
                  </Field>
                  <Field label="Link" error={fieldErrors.url}>
                    <Input name="url" type="url" required placeholder="https://" />
                  </Field>
                  <Field label="Note" optional error={fieldErrors.description}>
                    <Textarea name="description" rows={2} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Add</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* --------------------------- Operator assessment --------------------------- */

type CheckRow = {
  key: string;
  label: string;
  question: string;
  state: CheckState;
  note: string;
};

export function AssessmentForm({
  slug,
  status,
  recommendation,
  clientAction,
  checks,
}: {
  slug: string;
  status: ReadinessStatus;
  recommendation: string;
  clientAction: string;
  checks: CheckRow[];
}) {
  const router = useRouter();
  const [states, setStates] = React.useState<Record<string, CheckState>>(
    () => Object.fromEntries(checks.map((c) => [c.key, c.state])) as Record<string, CheckState>,
  );
  const [chosen, setChosen] = React.useState<ReadinessStatus>(status);

  const live = suggestedStatus(checks.map((c) => ({ key: c.key, state: states[c.key] ?? "unknown" })));
  const overriding = chosen !== live && chosen !== "not_assessed";
  const needsAction = chosen === "blocked" || chosen === "ready_with_limitation";

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-medium text-ink">Assessment</h2>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
          Threadline only. Rate what you can actually see and hear in the clip, then give an honest
          status — a limitation named now is cheaper than one discovered in the third batch.
        </p>
      </div>

      <Card>
        <CardBody className="pt-4">
          <ActionForm
            action={assessRecordingSetupAction.bind(null, slug)}
            onSuccess={() => router.refresh()}
          >
            {({ fieldErrors, error }) => (
              <div className="space-y-5">
                <FormError error={error} />

                <div className="space-y-3">
                  {checks.map((check) => (
                    <div
                      key={check.key}
                      className="rounded-lg border border-line bg-elevated px-4 py-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium text-ink">{check.label}</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-muted">
                            {check.question}
                          </p>
                        </div>
                        <NativeSelect
                          name={`state_${check.key}`}
                          value={states[check.key] ?? "unknown"}
                          onChange={(e) =>
                            setStates((prev) => ({
                              ...prev,
                              [check.key]: e.target.value as CheckState,
                            }))
                          }
                          className="w-40 shrink-0"
                        >
                          {CHECK_STATES.map((state) => (
                            <option key={state} value={state}>
                              {CHECK_STATE_META[state].label}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <Textarea
                        className="mt-2.5"
                        name={`note_${check.key}`}
                        rows={2}
                        defaultValue={check.note}
                        placeholder="What did you actually see or hear?"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-line pt-5">
                  <Notice
                    tone={live === "blocked" ? "warning" : live === "ready" ? "positive" : "info"}
                    title={`The checks point at: ${READINESS_STATUS_META[live].label}`}
                  >
                    {READINESS_STATUS_META[live].description}
                  </Notice>

                  <Field label="Status" error={fieldErrors.status}>
                    <NativeSelect
                      name="status"
                      value={chosen}
                      onChange={(e) => setChosen(e.target.value as ReadinessStatus)}
                    >
                      {READINESS_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {READINESS_STATUS_META[value].label}
                          {value === live ? " (suggested)" : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  {overriding ? (
                    <p className="text-[12px] leading-relaxed text-warning">
                      This differs from what the checks say. The server still refuses an impossible
                      combination — a blocking check cannot be saved as ready.
                    </p>
                  ) : null}

                  <Field
                    label="Recommendation"
                    optional
                    hint="What would you tell them to change, in plain language?"
                    error={fieldErrors.recommendation}
                  >
                    <Textarea name="recommendation" rows={3} defaultValue={recommendation} />
                  </Field>

                  <Field
                    label="The one thing the client must do"
                    hint={
                      needsAction
                        ? "Required. A blocker with no action is a status nobody can act on."
                        : "Only needed when the setup is blocked or limited."
                    }
                    error={fieldErrors.clientAction}
                  >
                    <Textarea
                      name="clientAction"
                      rows={2}
                      defaultValue={clientAction}
                      placeholder="Move the desk so the window is in front of you rather than behind."
                    />
                  </Field>

                  <div className="flex justify-end">
                    <SubmitButton variant="accent">Save assessment</SubmitButton>
                  </div>
                </div>
              </div>
            )}
          </ActionForm>
        </CardBody>
      </Card>
    </section>
  );
}
