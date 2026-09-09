"use client";

import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { CheckboxField } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { grantProofPermissionsAction, setInterviewWillingnessAction, PROOF_PERMISSION_LABELS } from "@/lib/actions/proof-permission";

export type ProofPermissionView = {
  interviewWillingness: string;
  successConfirmedAt: string | null;
  successNote: string | null;
  requestedAt: string | null;
  grantedAt: string | null;
  grantedNote: string | null;
  flags: Record<string, boolean>;
};

/** Client-side view: the willingness question and the per-use permissions. */
export function ProofPermissions({ orgSlug, view, canGrant }: { orgSlug: string; view: ProofPermissionView; canGrant: boolean }) {
  return (
    <div className="space-y-6">
      <ActionForm action={setInterviewWillingnessAction.bind(null, orgSlug)} className="space-y-3">
        {({ error }) => (
          <>
            <FormError error={error} />
            <Field label="If this goes well, would you be open to a short success interview?" htmlFor="interviewWillingness" hint="An answer, not a commitment. Nothing is used without the specific permissions below.">
              <NativeSelect id="interviewWillingness" name="interviewWillingness" defaultValue={view.interviewWillingness}>
                <option value="unknown">Not asked yet</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe — ask me when there is something to show</option>
                <option value="no">No</option>
              </NativeSelect>
            </Field>
            <SubmitButton variant="secondary">Save answer</SubmitButton>
          </>
        )}
      </ActionForm>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium text-ink">What Threadline may use</p>
          {view.grantedAt ? <Badge tone="outline">last set {new Date(view.grantedAt).toLocaleDateString("en-GB")}</Badge> : <Badge tone="outline">nothing granted</Badge>}
        </div>
        {canGrant ? (
          <ActionForm action={grantProofPermissionsAction.bind(null, orgSlug)} className="space-y-3">
            {({ error }) => (
              <>
                <FormError error={error} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(PROOF_PERMISSION_LABELS).map(([key, label]) => (
                    <CheckboxField key={key} id={`proof-${key}`} name={key} label={label} defaultChecked={view.flags[key] ?? false} />
                  ))}
                </div>
                <Field label="Anything to note" htmlFor="grantedNote" optional>
                  <Textarea id="grantedNote" name="grantedNote" rows={2} defaultValue={view.grantedNote ?? ""} />
                </Field>
                <SubmitButton variant="primary">Record permissions</SubmitButton>
              </>
            )}
          </ActionForm>
        ) : (
          <ul className="grid gap-1.5 text-[13px] sm:grid-cols-2">
            {Object.entries(PROOF_PERMISSION_LABELS).map(([key, label]) => (
              <li key={key} className={view.flags[key] ? "text-ink" : "text-faint line-through"}>{label}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
