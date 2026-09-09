"use client";

import { useTransition } from "react";
import { Award, CheckCircle2 } from "lucide-react";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { confirmSuccessAction, requestTestimonialAction, PROOF_PERMISSION_LABELS } from "@/lib/actions/proof-permission";
import type { ProofPermissionView } from "@/components/app/proof-permissions";

/** Operator side: confirm a positive outcome, then (and only then) record that a testimonial ask is appropriate. */
export function ProofAdmin({ orgSlug, view, gate }: { orgSlug: string; view: ProofPermissionView; gate: { appropriate: boolean; reason: string } }) {
  const [pending, start] = useTransition();
  const granted = Object.entries(view.flags).filter(([, v]) => v).map(([k]) => PROOF_PERMISSION_LABELS[k as keyof typeof PROOF_PERMISSION_LABELS]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <Badge tone={view.interviewWillingness === "yes" ? "positive" : view.interviewWillingness === "maybe" ? "warning" : view.interviewWillingness === "no" ? "negative" : "outline"}>
          interview: {view.interviewWillingness}
        </Badge>
        <Badge tone={view.successConfirmedAt ? "positive" : "outline"}>{view.successConfirmedAt ? `outcome confirmed ${new Date(view.successConfirmedAt).toLocaleDateString("en-GB")}` : "no outcome confirmed"}</Badge>
        {view.requestedAt ? <Badge tone="info">asked {new Date(view.requestedAt).toLocaleDateString("en-GB")}</Badge> : null}
      </div>

      <div>
        <p className="text-[12px] font-medium uppercase tracking-wide text-faint">Granted by the client</p>
        {granted.length === 0 ? <p className="mt-1 text-[13px] text-faint">Nothing. Their name, words, numbers and logo stay private.</p> : (
          <ul className="mt-1 space-y-0.5 text-[13px] text-ink">{granted.map((g) => <li key={g}>{g}</li>)}</ul>
        )}
      </div>

      <ActionForm action={confirmSuccessAction.bind(null, orgSlug)} className="space-y-3">
        {({ error }) => (
          <>
            <FormError error={error} />
            <Field label="Confirm a positive outcome" htmlFor="successNote" hint="Something a person could check: a booked call from a named post, a deal they attribute to the content, a repeatable win.">
              <Textarea id="successNote" name="successNote" rows={2} defaultValue={view.successNote ?? ""} />
            </Field>
            <SubmitButton icon={CheckCircle2} variant="secondary">Confirm outcome</SubmitButton>
          </>
        )}
      </ActionForm>

      <div className="rounded-lg border border-line p-3">
        <p className="text-[12.5px] text-muted">{gate.reason}</p>
        <Button
          className="mt-2"
          size="sm"
          variant={gate.appropriate ? "primary" : "ghost"}
          icon={Award}
          disabled={!gate.appropriate}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await requestTestimonialAction(orgSlug);
              if (r.ok) toast.success(r.message ?? "Recorded.");
              else toast.error(r.error);
            })
          }
        >
          Record that a testimonial ask is appropriate
        </Button>
      </div>
    </div>
  );
}
