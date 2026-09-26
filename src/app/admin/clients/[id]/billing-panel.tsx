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
  approveReminderAction,
  closeDisputeAction,
  creditNoteAction,
  discardReminderAction,
  disputeAction,
  draftInvoicesAction,
  issueInvoiceAction,
  recordAgreementAction,
  recordPaymentAction,
  setBillingProviderAction,
  voidInvoiceAction,
} from "@/lib/actions/billing";
import type { ActionResult } from "@/lib/actions/shared";

export type BillingView = {
  orgId: string;
  engagementId: string | null;
  provider: string;
  currency: string;
  invoices: { id: string; number: string; kind: string; periodNumber: number | null; totalMinor: number; balanceMinor: number; status: string; dueDate: string | null; overdue: boolean; hostedUrl: string | null; disputes: { id: string; state: string; reason: string }[] }[];
  reminders: { id: string; toEmail: string; subject: string; body: string }[];
  agreements: { id: string; kind: string; version: string; signedAt: string; signedByName: string }[];
};

const money = (m: number, c: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(m / 100);

/** Staff billing for one client: invoices, payments, credits, disputes, reminders and agreements. */
export function BillingPanel({ view }: { view: BillingView }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState<{ id: string; form: "pay" | "credit" | "void" | "dispute" } | null>(null);
  const run = (fn: () => Promise<ActionResult<unknown>>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error);
    });
  };
  const done = () => {
    setOpen(null);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader title="Billing" description="Invoices are drafted automatically for the setup fee and each period; issuing, reminders and corrections are your decisions." />
      <CardBody className="space-y-5 pt-0">
        {view.engagementId ? (
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span>Invoice authority:</span>
            <NativeSelect aria-label="Invoice authority" value={view.provider} onChange={(e) => run(() => setBillingProviderAction(view.engagementId!, e.target.value as "manual" | "stripe"))} disabled={pending}>
              <option value="manual">Manual (bank transfer)</option>
              <option value="stripe">Stripe (test mode)</option>
            </NativeSelect>
            <span className="flex-1" />
            <Button size="xs" variant="secondary" disabled={pending} onClick={() => run(() => draftInvoicesAction(view.engagementId!))}>
              Draft due invoices
            </Button>
          </div>
        ) : null}

        {view.invoices.length ? (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {view.invoices.map((inv) => (
              <li key={inv.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-medium text-ink">{inv.number}</span>
                  <span className="text-muted">{inv.kind === "period" ? `Period ${inv.periodNumber}` : inv.kind.replace("_", " ")}</span>
                  <span className="text-ink">{money(inv.totalMinor, view.currency)}</span>
                  <Badge tone={inv.status === "paid" ? "positive" : inv.overdue ? "negative" : inv.status === "void" ? "outline" : "neutral"}>{inv.overdue ? "overdue" : inv.status}</Badge>
                  {inv.status === "issued" ? <span className="text-ghost">balance {money(inv.balanceMinor, view.currency)}{inv.dueDate ? ` · due ${inv.dueDate}` : ""}</span> : null}
                  {inv.hostedUrl ? <a href={inv.hostedUrl} target="_blank" rel="noreferrer noopener" className="text-accent">Stripe page</a> : null}
                  <span className="flex-1" />
                  {inv.status === "draft" ? (
                    <Button size="xs" variant="primary" disabled={pending} onClick={() => run(() => issueInvoiceAction(inv.id), `Issue ${inv.number}? An issued invoice cannot be edited.`)}>
                      Issue
                    </Button>
                  ) : null}
                  {inv.status === "issued" || inv.status === "paid" ? (
                    <>
                      <Button size="xs" variant="ghost" onClick={() => setOpen({ id: inv.id, form: "pay" })}>Payment or refund</Button>
                      {inv.kind !== "credit_note" ? <Button size="xs" variant="ghost" onClick={() => setOpen({ id: inv.id, form: "credit" })}>Credit note</Button> : null}
                      <Button size="xs" variant="ghost" onClick={() => setOpen({ id: inv.id, form: "dispute" })}>Dispute</Button>
                    </>
                  ) : null}
                  {inv.status === "draft" || (inv.status === "issued" && inv.balanceMinor === inv.totalMinor) ? (
                    <Button size="xs" variant="ghost" onClick={() => setOpen({ id: inv.id, form: "void" })}>Void</Button>
                  ) : null}
                </div>
                {inv.disputes.filter((d) => d.state === "open").map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 text-[12px] text-negative">
                    Open dispute: {d.reason}
                    {(["won", "lost", "withdrawn"] as const).map((s) => (
                      <Button key={s} size="xs" variant="ghost" onClick={() => run(() => closeDisputeAction(d.id, s))}>{s}</Button>
                    ))}
                  </div>
                ))}
                {open?.id === inv.id ? (
                  <ActionForm
                    action={(open.form === "pay" ? recordPaymentAction : open.form === "credit" ? creditNoteAction : open.form === "void" ? voidInvoiceAction : disputeAction).bind(null, inv.id)}
                    onSuccess={done}
                    className="grid gap-2 sm:grid-cols-4 sm:items-end"
                  >
                    {({ error }) => (
                      <>
                        <div className="sm:col-span-4"><FormError error={error} /></div>
                        {open.form === "pay" ? (
                          <>
                            <Field label="Amount" htmlFor={`amt-${inv.id}`}><Input id={`amt-${inv.id}`} name="amount" type="number" step="0.01" /></Field>
                            <Field label="Type" htmlFor={`kind-${inv.id}`}>
                              <NativeSelect id={`kind-${inv.id}`} name="kind" defaultValue="payment"><option value="payment">Payment received</option><option value="refund">Refund paid out</option></NativeSelect>
                            </Field>
                            <Field label="Date" htmlFor={`date-${inv.id}`}><Input id={`date-${inv.id}`} name="receivedAt" type="date" /></Field>
                            <Field label="Reference" htmlFor={`ref-${inv.id}`} optional><Input id={`ref-${inv.id}`} name="reference" /></Field>
                            <Field label="Evidence (where the proof is)" htmlFor={`ev-${inv.id}`} className="sm:col-span-3" optional><Input id={`ev-${inv.id}`} name="evidence" placeholder="Bank statement 3 Oct, line 12" /></Field>
                            <input type="hidden" name="method" value="bank_transfer" />
                          </>
                        ) : open.form === "credit" ? (
                          <>
                            <Field label="Credit amount" htmlFor={`cr-${inv.id}`}><Input id={`cr-${inv.id}`} name="amount" type="number" step="0.01" /></Field>
                            <Field label="Reason" htmlFor={`crr-${inv.id}`} className="sm:col-span-2"><Input id={`crr-${inv.id}`} name="reason" /></Field>
                          </>
                        ) : (
                          <Field label={open.form === "void" ? "Why void it" : "What is disputed"} htmlFor={`rs-${inv.id}`} className="sm:col-span-3"><Input id={`rs-${inv.id}`} name="reason" /></Field>
                        )}
                        <div className="flex gap-2">
                          <SubmitButton size="sm" variant="primary">Save</SubmitButton>
                          <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
                        </div>
                      </>
                    )}
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">No invoices yet. They are drafted once the engagement is active.</p>
        )}

        {view.reminders.length ? (
          <div className="space-y-3">
            <p className="text-eyebrow text-faint">Reminders waiting for your approval</p>
            {view.reminders.map((r) => (
              <ActionForm key={r.id} action={approveReminderAction.bind(null, r.id)} onSuccess={() => router.refresh()} className="space-y-2 rounded-lg border border-line p-3">
                {({ error }) => (
                  <>
                    <FormError error={error} />
                    <p className="text-[12px] text-ghost">To {r.toEmail}</p>
                    <Input name="subject" defaultValue={r.subject} aria-label="Subject" />
                    <Textarea name="body" defaultValue={r.body} rows={5} aria-label="Message" />
                    <div className="flex gap-2">
                      <SubmitButton size="sm" variant="primary">Approve and send</SubmitButton>
                      <Button size="sm" variant="ghost" onClick={() => run(() => discardReminderAction(r.id))}>Discard</Button>
                    </div>
                  </>
                )}
              </ActionForm>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-eyebrow text-faint">Signed agreements</p>
          {view.agreements.map((a) => (
            <p key={a.id} className="text-[12.5px] text-muted">
              {a.kind.toUpperCase()} v{a.version}, signed {a.signedAt} by {a.signedByName}
            </p>
          ))}
          <ActionForm action={recordAgreementAction.bind(null, view.orgId)} onSuccess={() => router.refresh()} className="grid gap-2 sm:grid-cols-3 sm:items-end">
            {({ error }) => (
              <>
                <div className="sm:col-span-3"><FormError error={error} /></div>
                <Field label="Document" htmlFor="ag-kind">
                  <NativeSelect id="ag-kind" name="kind" defaultValue="msa"><option value="msa">Services agreement</option><option value="order_form">Order form</option><option value="dpa">Data processing agreement</option><option value="sow">Statement of work</option></NativeSelect>
                </Field>
                <Field label="Version" htmlFor="ag-ver"><Input id="ag-ver" name="version" placeholder="1.0" /></Field>
                <Field label="Signed on" htmlFor="ag-date"><Input id="ag-date" name="signedAt" type="date" /></Field>
                <Field label="Signed by" htmlFor="ag-name"><Input id="ag-name" name="signedByName" /></Field>
                <Field label="Their role" htmlFor="ag-role" optional><Input id="ag-role" name="signedByRole" /></Field>
                <Field label="Where the signed copy is" htmlFor="ag-ev"><Input id="ag-ev" name="evidence" placeholder="Library > Contracts > MSA v1 signed.pdf" /></Field>
                <SubmitButton size="sm" variant="secondary">Record agreement</SubmitButton>
              </>
            )}
          </ActionForm>
        </div>
      </CardBody>
    </Card>
  );
}
