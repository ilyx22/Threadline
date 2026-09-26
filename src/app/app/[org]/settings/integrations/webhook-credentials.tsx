"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { removeWebhookCredentialAction, saveWebhookCredentialAction } from "@/lib/actions/webhooks";

export type WebhookRow = {
  provider: string;
  label: string;
  endpoint: string;
  stored: boolean;
  setAt: string | null;
  lastUsedAt: string | null;
  lastDelivery: { at: string; verified: boolean; error: string | null } | null;
};

/** Staff-only: inbound webhook endpoints and the credential that verifies each. */
export function WebhookCredentials({ slug, rows, storageReady }: { slug: string; rows: WebhookRow[]; storageReady: boolean }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader
        title="Inbound webhooks"
        description="Register the endpoint with the client's provider, then store the value that proves a delivery came from their account. Deliveries without a stored value are refused and logged, never acted on."
      />
      <CardBody className="space-y-5 pt-0">
        {!storageReady ? (
          <p className="text-[13px] text-muted">Credential encryption keys are not configured on this deployment, so no value can be stored yet.</p>
        ) : null}
        {rows.map((r) => (
          <div key={r.provider} className="space-y-2 border-t border-line pt-4 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-[14px] capitalize text-ink">{r.provider === "gohighlevel" ? "HighLevel" : r.provider}</strong>
              {r.stored ? <Badge tone="positive">Verified deliveries</Badge> : <Badge tone="neutral">Not set</Badge>}
              {r.lastDelivery ? (
                <span className="text-[12px] text-ghost">
                  Last delivery {new Date(r.lastDelivery.at).toLocaleString("en-GB")} {r.lastDelivery.verified ? "(verified)" : `(refused: ${r.lastDelivery.error ?? "unverified"})`}
                </span>
              ) : null}
            </div>
            <p className="break-all font-mono text-[12px] text-muted">{r.endpoint}</p>
            <ActionForm action={saveWebhookCredentialAction.bind(null, slug, r.provider)} onSuccess={() => router.refresh()} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {({ error }) => (
                <>
                  <div className="flex-1">
                    <FormError error={error} />
                    <Field label={r.label} htmlFor={`wh-${r.provider}`}>
                      <Input id={`wh-${r.provider}`} name="secret" type="password" autoComplete="off" placeholder={r.stored ? "Stored. Paste a new value to replace it." : ""} />
                    </Field>
                  </div>
                  <SubmitButton variant="primary" icon={r.stored ? KeyRound : Check} disabled={!storageReady}>
                    {r.stored ? "Replace" : "Store"}
                  </SubmitButton>
                  {r.stored ? (
                    <ActionButton variant="ghost" icon={Trash2} action={() => removeWebhookCredentialAction(slug, r.provider)} confirm="Remove this credential? Deliveries from this provider will be refused." onDone={() => router.refresh()}>
                      Remove
                    </ActionButton>
                  ) : null}
                </>
              )}
            </ActionForm>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
