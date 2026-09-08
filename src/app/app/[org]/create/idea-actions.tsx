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
import { createIdeaAction, generateIdeasAction } from "@/lib/actions/ideas";
import { COMMERCIAL_INTENT_OPTIONS, FORMAT_OPTIONS, PLATFORM_OPTIONS } from "@/lib/domain/enums";
import { ideaPriority } from "@/lib/domain/scoring";

/** Manual idea capture. */
export function NewIdeaButton({
  slug,
  pillars,
  variant = "secondary",
}: {
  slug: string;
  pillars: string[];
  variant?: "secondary" | "primary";
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} variant={variant} onClick={() => setOpen(true)}>
        New idea
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="New idea"
            description="Scores drive the ranking. Be honest — an idea with no supporting proof should score low on proof strength."
          />
          <ActionForm
            action={createIdeaAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Title" htmlFor="title" error={fieldErrors.title}>
                    <Input id="title" name="title" required autoFocus placeholder="The concept in one line" />
                  </Field>
                  <Field label="Concept" htmlFor="concept" hint="What the piece is actually about.">
                    <Textarea id="concept" name="concept" rows={3} />
                  </Field>
                  <Field label="Angle" htmlFor="angle" hint="How it is approached — the thing that makes it not generic.">
                    <Textarea id="angle" name="angle" rows={2} />
                  </Field>
                  <Field label="Hook concept" htmlFor="hookConcept" hint="The opening line, or the direction for it.">
                    <Textarea id="hookConcept" name="hookConcept" rows={2} />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Platform" htmlFor="platform">
                      <NativeSelect id="platform" name="platform" defaultValue="linkedin">
                        {PLATFORM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Format" htmlFor="format">
                      <NativeSelect id="format" name="format" defaultValue="short_form">
                        {FORMAT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Commercial intent" htmlFor="commercialIntent">
                      <NativeSelect id="commercialIntent" name="commercialIntent" defaultValue="medium">
                        {COMMERCIAL_INTENT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pillar" htmlFor="pillar" optional>
                      <NativeSelect id="pillar" name="pillar" defaultValue="">
                        <option value="">No pillar</option>
                        {pillars.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="CTA" htmlFor="cta" optional>
                      <Input id="cta" name="cta" />
                    </Field>
                  </div>

                  <ScoreFields />
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Create idea</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Live-updating score sliders that show the resulting priority. */
export function ScoreFields({
  defaults,
}: {
  defaults?: {
    relevanceScore: number;
    noveltyScore: number;
    proofStrength: number;
    formatFit: number;
    commercialIntent: string;
  };
}) {
  const [scores, setScores] = React.useState({
    relevanceScore: defaults?.relevanceScore ?? 60,
    noveltyScore: defaults?.noveltyScore ?? 55,
    proofStrength: defaults?.proofStrength ?? 50,
    formatFit: defaults?.formatFit ?? 60,
  });

  const priority = ideaPriority({
    ...scores,
    commercialIntent: defaults?.commercialIntent ?? "medium",
  });

  const rows: { key: keyof typeof scores; label: string; hint: string }[] = [
    { key: "relevanceScore", label: "Relevance", hint: "How directly this speaks to the audience's live problem." },
    { key: "noveltyScore", label: "Novelty", hint: "Whether this angle has been covered already." },
    { key: "proofStrength", label: "Proof strength", hint: "How much real evidence backs it." },
    { key: "formatFit", label: "Format fit", hint: "How well the idea suits the chosen format." },
  ];

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-ink">Scoring</p>
        <p className="text-[12px] text-faint">
          Priority <span className="ml-1 text-[15px] font-medium tabular text-accent">{Math.round(priority)}</span>
        </p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={row.key} className="text-[12.5px] text-ink">
                {row.label}
              </label>
              <span className="text-[12px] tabular text-muted">{scores[row.key]}</span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-ghost">{row.hint}</p>
            <Slider
              id={row.key}
              value={[scores[row.key]]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setScores((s) => ({ ...s, [row.key]: v ?? 0 }))}
              className="mt-1"
            />
            <input type="hidden" name={row.key} value={scores[row.key]} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** AI generation with an honest demo-mode notice. */
export function GenerateIdeasButton({ slug, isLive }: { slug: string; isLive: boolean }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Sparkles} variant="accent" onClick={() => setOpen(true)}>
        Generate ideas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Generate ideas"
            description="Uses the Brand Brain, market research and what has already performed in this workspace."
          />
          <ActionForm
            action={generateIdeasAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  {!isLive ? (
                    <Notice tone="warning" title="Demo generation">
                      No model provider is configured, so ideas will be composed deterministically
                      from this workspace&apos;s own stored context. Output is real and usable, but it is
                      not a live model call. Set <code className="text-faint">ANTHROPIC_API_KEY</code>{" "}
                      to enable live generation.
                    </Notice>
                  ) : null}

                  <Field label="How many" htmlFor="count">
                    <NativeSelect id="count" name="count" defaultValue="6">
                      {[3, 6, 9, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} ideas
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field
                    label="Steer"
                    htmlFor="steer"
                    optional
                    hint="Optional direction for this batch — a theme, a platform, a specific objection."
                  >
                    <Textarea
                      id="steer"
                      name="steer"
                      rows={3}
                      placeholder="Focus on the hiring-too-early theme, aimed at founders about to make a first sales hire."
                    />
                  </Field>

                  <p className="text-[12px] leading-relaxed text-faint">
                    Generated ideas land in the backlog for review. Nothing is approved automatically.
                  </p>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent" icon={Sparkles} pendingLabel="Generating…">
                    Generate
                  </SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
