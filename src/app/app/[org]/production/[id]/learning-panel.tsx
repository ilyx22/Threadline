"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  approveDiagnosisAction,
  attachToRootAction,
  createRootAction,
  diagnoseContentAction,
  recordCorrectionAction,
  recordCorrectionVerdictAction,
  recordExpectationAction,
} from "@/lib/actions/learning";

export type LearningView = {
  contentItemId: string;
  live: boolean;
  roots: { id: string; label: string }[];
  rootId: string | null;
  expectation: { overall: number; expectedClass: string; confidence: string; createdAt: string } | null;
  diagnosis: { id: string; state: string; failureClass: string; explanation: string | null; failedAssumption: string | null; prescription: string | null; confidence: string } | null;
  corrections: { id: string; correction: string; worked: boolean | null }[];
  failureClasses: string[];
  levers: string[];
};

const label = (s: string) => s.replace(/_/g, " ");

/**
 * The learning loop on one piece (LRN-01): thesis, the expectation frozen
 * before publishing, the diagnosis after, the correction, and the verdict.
 * Operator work; clients see the approved outcome in reports.
 */
export function LearningPanel({ slug, view }: { slug: string; view: LearningView }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [newRoot, setNewRoot] = React.useState(false);
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Done.");
      else toast.error(r.error ?? "Something went wrong.");
      router.refresh();
    });

  return (
    <Card>
      <CardHeader title="Learning loop" eyebrow="Threadline only" description="Expect before publishing, diagnose after, change one thing, check whether it worked." />
      <CardBody className="space-y-5 pt-0">
        {/* 1. Thesis */}
        <section className="space-y-2">
          <p className="text-eyebrow text-faint">1 · Thesis this piece tests</p>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Thesis"
              value={view.rootId ?? ""}
              disabled={pending}
              onChange={(e) => e.target.value && run(() => attachToRootAction(slug, { contentItemId: view.contentItemId, rootId: e.target.value, lineageRole: "source" }))}
            >
              <option value="">Not on a thesis yet</option>
              {view.roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
            <Button size="xs" variant="ghost" onClick={() => setNewRoot((v) => !v)}>
              New thesis
            </Button>
          </div>
          {newRoot ? (
            <ActionForm
              action={createRootAction.bind(null, slug)}
              onSuccess={(d: unknown) => {
                setNewRoot(false);
                run(() => attachToRootAction(slug, { contentItemId: view.contentItemId, rootId: (d as { id: string }).id, lineageRole: "source" }));
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {({ error, fieldErrors }) => (
                <>
                  <div className="sm:col-span-2">
                    <FormError error={error} />
                  </div>
                  <Field label="Name" htmlFor="root-label" error={fieldErrors.label}>
                    <Input id="root-label" name="label" />
                  </Field>
                  <Field label="The claim, in one sentence" htmlFor="root-thesis" error={fieldErrors.thesis}>
                    <Input id="root-thesis" name="thesis" />
                  </Field>
                  <SubmitButton size="sm" variant="secondary">
                    Create and attach
                  </SubmitButton>
                </>
              )}
            </ActionForm>
          ) : null}
        </section>

        {/* 2. Expectation */}
        <section className="space-y-2">
          <p className="text-eyebrow text-faint">2 · Expectation, frozen before publishing</p>
          {view.expectation ? (
            <p className="text-[13px] text-muted">
              Scored <span className="text-ink">{view.expectation.overall}</span>, expected {label(view.expectation.expectedClass)} ({view.expectation.confidence} confidence), on {view.expectation.createdAt.slice(0, 10)}. Kept as recorded.
            </p>
          ) : (
            <p className="text-[13px] text-muted">No expectation recorded yet.</p>
          )}
          {!view.live ? (
            <Button size="xs" variant="secondary" disabled={pending} onClick={() => run(() => recordExpectationAction(slug, { subjectType: "content", subjectId: view.contentItemId, rootId: view.rootId ?? undefined }))}>
              {view.expectation ? "Record a new expectation" : "Freeze the expectation"}
            </Button>
          ) : null}
        </section>

        {/* 3. Diagnosis */}
        <section className="space-y-2">
          <p className="text-eyebrow text-faint">3 · Diagnosis after publishing</p>
          {!view.live ? <p className="text-[13px] text-muted">Available once the piece is live and has data.</p> : null}
          {view.live && !view.diagnosis ? (
            <Button size="xs" variant="secondary" disabled={pending} onClick={() => run(() => diagnoseContentAction(slug, view.contentItemId))}>
              Read the gap
            </Button>
          ) : null}
          {view.diagnosis ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <Badge tone={view.diagnosis.state === "approved" ? "positive" : "neutral"}>{view.diagnosis.state}</Badge>
                <span className="text-ink">{label(view.diagnosis.failureClass)}</span>
                <span className="text-ghost">{view.diagnosis.confidence} confidence</span>
              </div>
              {view.diagnosis.state !== "approved" ? (
                <ActionForm action={approveDiagnosisAction.bind(null, slug)} onSuccess={() => router.refresh()} className="grid gap-2">
                  {({ error, fieldErrors }) => (
                    <>
                      <FormError error={error} />
                      <input type="hidden" name="diagnosisId" value={view.diagnosis!.id} />
                      <Field label="What failed" htmlFor="dx-class">
                        <NativeSelect id="dx-class" name="failureClass" defaultValue={view.diagnosis!.failureClass}>
                          {view.failureClasses.map((c) => (
                            <option key={c} value={c}>
                              {label(c)}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field label="What happened, checkably" htmlFor="dx-exp" error={fieldErrors.explanation}>
                        <Textarea id="dx-exp" name="explanation" defaultValue={view.diagnosis!.explanation ?? ""} rows={3} />
                      </Field>
                      <Field label="The belief that turned out wrong" htmlFor="dx-fa" optional>
                        <Input id="dx-fa" name="failedAssumption" defaultValue={view.diagnosis!.failedAssumption ?? ""} />
                      </Field>
                      <Field label="What to do next" htmlFor="dx-rx" optional>
                        <Input id="dx-rx" name="prescription" defaultValue={view.diagnosis!.prescription ?? ""} />
                      </Field>
                      <SubmitButton size="sm" variant="primary">
                        Approve the diagnosis
                      </SubmitButton>
                    </>
                  )}
                </ActionForm>
              ) : null}
            </>
          ) : null}
        </section>

        {/* 4. Correction and verdict */}
        {view.diagnosis?.state === "approved" ? (
          <section className="space-y-2">
            <p className="text-eyebrow text-faint">4 · Correction, then verdict</p>
            {view.corrections.map((c) => (
              <div key={c.id} className="space-y-2 rounded-lg border border-line p-3 text-[13px]">
                <p className="text-ink">{c.correction}</p>
                {c.worked === null ? (
                  <ActionForm action={recordCorrectionVerdictAction.bind(null, slug)} onSuccess={() => router.refresh()} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    {({ error, fieldErrors }) => (
                      <>
                        <input type="hidden" name="correctionId" value={c.id} />
                        <div className="flex-1">
                          <FormError error={error} />
                          <Field label="Did it work, and how do we know" htmlFor={`v-${c.id}`} error={fieldErrors.verdictNote}>
                            <Input id={`v-${c.id}`} name="verdictNote" />
                          </Field>
                        </div>
                        <NativeSelect name="worked" aria-label="Worked" defaultValue="yes">
                          <option value="yes">It worked</option>
                          <option value="no">It did not</option>
                        </NativeSelect>
                        <SubmitButton size="sm" variant="secondary">
                          Record verdict
                        </SubmitButton>
                      </>
                    )}
                  </ActionForm>
                ) : (
                  <Badge tone={c.worked ? "positive" : "negative"}>{c.worked ? "worked" : "did not work"}</Badge>
                )}
              </div>
            ))}
            {!view.corrections.length ? (
              <ActionForm action={recordCorrectionAction.bind(null, slug)} onSuccess={() => router.refresh()} className="grid gap-2 sm:grid-cols-2">
                {({ error, fieldErrors }) => (
                  <>
                    <div className="sm:col-span-2">
                      <FormError error={error} />
                    </div>
                    <input type="hidden" name="diagnosisId" value={view.diagnosis!.id} />
                    {view.rootId ? <input type="hidden" name="rootId" value={view.rootId} /> : null}
                    <Field label="We believed" htmlFor="c-b" error={fieldErrors.believed}>
                      <Input id="c-b" name="believed" />
                    </Field>
                    <Field label="What actually happened" htmlFor="c-a" error={fieldErrors.actual}>
                      <Input id="c-a" name="actual" />
                    </Field>
                    <Field label="The failed assumption" htmlFor="c-f" error={fieldErrors.failedAssumption}>
                      <Input id="c-f" name="failedAssumption" defaultValue={view.diagnosis!.failedAssumption ?? ""} />
                    </Field>
                    <Field label="What we change" htmlFor="c-c" error={fieldErrors.correction}>
                      <Input id="c-c" name="correction" defaultValue={view.diagnosis!.prescription ?? ""} />
                    </Field>
                    <Field label="Lever" htmlFor="c-l">
                      <NativeSelect id="c-l" name="lever" defaultValue="other">
                        {view.levers.map((l) => (
                          <option key={l} value={l}>
                            {label(l)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <SubmitButton size="sm" variant="primary">
                      Record the correction
                    </SubmitButton>
                  </>
                )}
              </ActionForm>
            ) : null}
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}
