"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { savePatternAction } from "@/lib/actions/intelligence";
import { deriveLearningsAction } from "@/lib/actions/performance";
import { PATTERN_KINDS, PATTERN_KIND_META, PATTERN_STATUS_OPTIONS } from "@/lib/domain/enums";
import { patternScore } from "@/lib/domain/scoring";

export type SignalDefaults = {
  id?: string;
  kind: string;
  title: string;
  description: string;
  status: string;
  confidence: number;
  impact: number;
  effort: number;
  nextExperiment: string;
};

export function NewSignalButton({ slug, existing }: { slug: string; existing?: SignalDefaults }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button icon={existing ? undefined : Plus} variant={existing ? "secondary" : "secondary"} onClick={() => setOpen(true)}>
        {existing ? "Edit signal" : "New signal"}
      </Button>
      {open ? <SignalDialog slug={slug} existing={existing} open onOpenChange={setOpen} /> : null}
    </>
  );
}

export function SignalDialog({
  slug,
  existing,
  open,
  onOpenChange,
}: {
  slug: string;
  existing?: SignalDefaults;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [confidence, setConfidence] = React.useState(existing?.confidence ?? 50);
  const [impact, setImpact] = React.useState(existing?.impact ?? 3);
  const [effort, setEffort] = React.useState(existing?.effort ?? 3);

  const score = patternScore({ confidence, impact, effort });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          title={existing ? "Edit signal" : "New signal"}
          description="Be conservative. A single data point is an outlier, not a pattern — and confidence should reflect sample size honestly."
        />
        <ActionForm
          action={savePatternAction.bind(null, slug, existing?.id ?? null)}
          onSuccess={() => {
            onOpenChange(false);
            router.refresh();
          }}
          className="contents"
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Kind" htmlFor="signalKind">
                    <NativeSelect id="signalKind" name="kind" defaultValue={existing?.kind ?? "outlier"}>
                      {PATTERN_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {PATTERN_KIND_META[k].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Status" htmlFor="signalStatus">
                    <NativeSelect id="signalStatus" name="status" defaultValue={existing?.status ?? "open"}>
                      {PATTERN_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <Field label="Title" htmlFor="signalTitle" error={fieldErrors.title}>
                  <Input
                    id="signalTitle"
                    name="title"
                    defaultValue={existing?.title}
                    required
                    autoFocus
                    placeholder="State the observation, not the conclusion"
                  />
                </Field>

                <Field
                  label="What the evidence shows"
                  htmlFor="signalDescription"
                  hint="Describe the evidence, not just the interpretation."
                >
                  <Textarea
                    id="signalDescription"
                    name="description"
                    defaultValue={existing?.description}
                    rows={5}
                  />
                </Field>

                <div className="rounded-lg border border-line bg-surface p-4">
                  <div className="mb-4 flex items-baseline justify-between">
                    <p className="text-[13px] font-medium text-ink">Prioritisation</p>
                    <p className="text-[12px] text-faint">
                      Score{" "}
                      <span className="ml-1 text-[15px] font-medium tabular text-accent">
                        {score.toFixed(1)}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="confidence" className="text-[12.5px] text-ink">
                          Confidence
                        </label>
                        <span className="text-[12px] tabular text-muted">{confidence}%</span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ghost">
                        A single data point cannot honestly exceed 40%.
                      </p>
                      <Slider
                        id="confidence"
                        value={[confidence]}
                        min={0}
                        max={100}
                        onValueChange={([v]) => setConfidence(v ?? 0)}
                        className="mt-1"
                      />
                      <input type="hidden" name="confidence" value={confidence} />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="impact" className="text-[12.5px] text-ink">
                          Impact
                        </label>
                        <span className="text-[12px] tabular text-muted">{impact}/5</span>
                      </div>
                      <Slider
                        id="impact"
                        value={[impact]}
                        min={1}
                        max={5}
                        onValueChange={([v]) => setImpact(v ?? 1)}
                        className="mt-1"
                      />
                      <input type="hidden" name="impact" value={impact} />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="effort" className="text-[12.5px] text-ink">
                          Effort
                        </label>
                        <span className="text-[12px] tabular text-muted">{effort}/5</span>
                      </div>
                      <Slider
                        id="effort"
                        value={[effort]}
                        min={1}
                        max={5}
                        onValueChange={([v]) => setEffort(v ?? 1)}
                        className="mt-1"
                      />
                      <input type="hidden" name="effort" value={effort} />
                    </div>
                  </div>
                </div>

                <Field
                  label="Next experiment"
                  htmlFor="nextExperiment"
                  hint="What would actually test this? A signal without a test never resolves."
                >
                  <Textarea
                    id="nextExperiment"
                    name="nextExperiment"
                    defaultValue={existing?.nextExperiment}
                    rows={3}
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">{existing ? "Save signal" : "Create signal"}</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/** Runs pattern detection over stored performance data. */
export function DeriveLearningsButton({ slug, isLive }: { slug: string; isLive: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const run = (days: number) => {
    startTransition(async () => {
      const result = await deriveLearningsAction(slug, days);
      if (result.ok) {
        toast.success(result.message ?? "Detection complete.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Button icon={Sparkles} variant="accent" onClick={() => setOpen(true)}>
        Detect patterns
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Detect patterns"
            description="Analyses published performance — by topic, format, hook shape and CTA — and records what the data supports."
          />
          <DialogBody className="space-y-4">
            {!isLive ? (
              <Notice tone="warning" title="Demo mode">
                No model provider is configured. Detection will run against your real performance
                data using the deterministic composer, and will say so if the data does not support
                a conclusion.
              </Notice>
            ) : null}
            <Notice tone="neutral">
              Detection is conservative by design. With fewer than five published pieces it will
              classify observations as outliers rather than patterns, and it will tell you when
              there is not enough evidence to conclude anything.
            </Notice>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90].map((days) => (
                <Button key={days} variant="secondary" loading={pending} onClick={() => run(days)}>
                  Last {days} days
                </Button>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
