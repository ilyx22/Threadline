"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { deleteTenantAction, setLegalHoldAction, startOffboardingAction } from "@/lib/actions/offboarding";

export type OffboardingView = {
  orgId: string;
  slug: string;
  offboarded: boolean;
  accessEndsAt: string | null;
  retentionUntil: string | null;
  legalHold: boolean;
  deletable: boolean;
  steps: { step: string; outcome: string }[];
};

/** Staff: end a client relationship cleanly (OFF-01). */
export function OffboardingPanel({ view }: { view: OffboardingView }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Card>
      <CardHeader title="Offboarding" description="Ends the engagement, disconnects integrations, cancels queued work and gives the client a full export before their access closes." />
      <CardBody className="space-y-3 pt-0">
        {!view.offboarded ? (
          <details>
            <summary className="cursor-pointer text-[13px] text-muted">Start offboarding</summary>
            <ActionForm action={startOffboardingAction.bind(null, view.orgId)} onSuccess={() => router.refresh()} className="mt-3 grid gap-2 sm:grid-cols-3 sm:items-end">
              {({ error, fieldErrors }) => (
                <>
                  <div className="sm:col-span-3">
                    <FormError error={error} />
                  </div>
                  <Field label="Why the engagement is ending" htmlFor="off-reason" className="sm:col-span-3" error={fieldErrors.reason}>
                    <Input id="off-reason" name="reason" />
                  </Field>
                  <Field label="Export window (days)" htmlFor="off-export">
                    <Input id="off-export" name="exportDays" type="number" defaultValue={30} min={7} max={90} />
                  </Field>
                  <Field label="Keep data after that (days)" htmlFor="off-keep">
                    <Input id="off-keep" name="retentionDays" type="number" defaultValue={90} min={0} />
                  </Field>
                  <SubmitButton variant="secondary">Start offboarding</SubmitButton>
                </>
              )}
            </ActionForm>
          </details>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <Badge tone="warning">Offboarding</Badge>
              <span>Client access ends {view.accessEndsAt}; data kept until {view.retentionUntil}.</span>
              {view.legalHold ? <Badge tone="negative">Legal hold</Badge> : null}
              <span className="flex-1" />
              <Button
                size="xs"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await setLegalHoldAction(view.orgId, !view.legalHold);
                    if (r.ok) toast.success(r.message ?? "Saved.");
                    else toast.error(r.error);
                    router.refresh();
                  })
                }
              >
                {view.legalHold ? "Release legal hold" : "Set legal hold"}
              </Button>
            </div>
            <ul className="space-y-0.5 text-[12.5px] text-muted">
              {view.steps.map((s) => (
                <li key={s.step}>
                  <span className="text-ink">{s.step}</span>: {s.outcome}
                </li>
              ))}
            </ul>
            {view.deletable ? (
              <ActionForm action={deleteTenantAction.bind(null, view.orgId)} onSuccess={() => router.push("/admin/clients")} className="flex flex-col gap-2 rounded-lg border border-negative/30 p-3 sm:flex-row sm:items-end">
                {({ error }) => (
                  <>
                    <div className="flex-1">
                      <FormError error={error} />
                      <Field label={`Retention has passed. Type ${view.slug} to delete this client's data permanently.`} htmlFor="del-confirm">
                        <Input id="del-confirm" name="confirm" autoComplete="off" />
                      </Field>
                    </div>
                    <SubmitButton variant="secondary">Delete permanently</SubmitButton>
                  </>
                )}
              </ActionForm>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
