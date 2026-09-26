"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { WorkflowError } from "@/lib/domain/workflow";
import { closeDispute, draftDueInvoices, issueCreditNote, issueInvoice, openDispute, recordPayment, StripeError, voidInvoice } from "@/lib/billing/invoices";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Staff billing actions (BIL-01 to BIL-04). Every money change is audited
 * against the client workspace. Nothing here emails a client except
 * approveReminderAction, which is a person's explicit decision.
 */
const pounds = z.coerce.number().positive("Enter an amount.").max(1_000_000);
const minor = (n: number) => Math.round(n * 100);
const handle = (e: unknown) => (e instanceof WorkflowError || e instanceof StripeError ? err(e.message, "workflow") : null);

async function invoiceOrg(invoiceId: string) {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, orgId: true, number: true } });
  if (!inv) throw new WorkflowError("That invoice no longer exists.");
  return inv;
}
const refresh = (orgId: string) => revalidatePath(`/admin/clients/${orgId}`);

export async function draftInvoicesAction(engagementId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const made = await draftDueInvoices(engagementId);
    const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId }, select: { orgId: true } });
    if (made.length) await auditInternal(admin.user.id, { orgId: e.orgId, action: "billing.draft", entityType: "engagement", entityId: engagementId, summary: `Drafted ${made.length} invoice(s)` });
    refresh(e.orgId);
    return okVoid(made.length ? `${made.length} invoice(s) drafted. Review and issue them.` : "Nothing new to draft.");
  });
}

export async function issueInvoiceAction(invoiceId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    try {
      const inv = await invoiceOrg(invoiceId);
      const contact = await prisma.membership.findFirst({ where: { orgId: inv.orgId, status: "active", OR: [{ contactRole: "primary" }, { profiles: { contains: '"commercial"' } }] }, orderBy: { contactRole: "asc" }, select: { user: { select: { email: true } } } });
      const issued = await issueInvoice(invoiceId, { contactEmail: contact?.user.email ?? null });
      await auditInternal(admin.user.id, { orgId: inv.orgId, action: "billing.issue", entityType: "invoice", entityId: invoiceId, summary: `Issued ${issued.number} (${issued.provider}), due ${issued.dueDate?.toISOString().slice(0, 10)}` });
      refresh(inv.orgId);
      return okVoid(`${issued.number} issued.`);
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
  });
}

const paymentSchema = z.object({
  amount: pounds,
  kind: z.enum(["payment", "refund"]).default("payment"),
  method: z.enum(["bank_transfer", "card", "stripe", "other"]).default("bank_transfer"),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date."),
  reference: z.string().max(200).optional(),
  evidence: z.string().max(500).optional(),
});

export async function recordPaymentAction(invoiceId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(paymentSchema, formData);
    try {
      const inv = await invoiceOrg(invoiceId);
      const r = await recordPayment(invoiceId, { amountMinor: minor(input.amount), kind: input.kind, method: input.method, receivedAt: new Date(`${input.receivedAt}T12:00:00Z`), reference: input.reference ?? null, evidence: input.evidence ?? null, recordedById: admin.user.id });
      await auditInternal(admin.user.id, { orgId: inv.orgId, action: `billing.${input.kind}`, entityType: "invoice", entityId: invoiceId, summary: `Recorded a ${input.kind} of ${input.amount.toFixed(2)} on ${inv.number}; balance now ${(r.balance / 100).toFixed(2)}` });
      refresh(inv.orgId);
      return okVoid(`Recorded. Balance ${(r.balance / 100).toFixed(2)}.`);
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
  });
}

export async function creditNoteAction(invoiceId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(z.object({ amount: pounds, reason: z.string().trim().min(3, "Say why.").max(500) }), formData);
    try {
      const inv = await invoiceOrg(invoiceId);
      const note = await issueCreditNote(invoiceId, minor(input.amount), input.reason, admin.user.id);
      await auditInternal(admin.user.id, { orgId: inv.orgId, action: "billing.credit_note", entityType: "invoice", entityId: note.id, summary: `Credit note ${note.number} for ${input.amount.toFixed(2)} against ${inv.number}: ${input.reason}` });
      refresh(inv.orgId);
      return okVoid(`Credit note ${note.number} issued.`);
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
  });
}

export async function voidInvoiceAction(invoiceId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const { reason } = parseForm(z.object({ reason: z.string().trim().min(3, "Say why.").max(500) }), formData);
    try {
      const inv = await invoiceOrg(invoiceId);
      await voidInvoice(invoiceId, reason);
      await auditInternal(admin.user.id, { orgId: inv.orgId, action: "billing.void", entityType: "invoice", entityId: invoiceId, summary: `Voided ${inv.number}: ${reason}` });
      refresh(inv.orgId);
      return okVoid("Voided.");
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
  });
}

export async function disputeAction(invoiceId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const { reason } = parseForm(z.object({ reason: z.string().trim().min(3).max(500) }), formData);
    const inv = await invoiceOrg(invoiceId);
    await openDispute(invoiceId, reason);
    await auditInternal(admin.user.id, { orgId: inv.orgId, action: "billing.dispute_open", entityType: "invoice", entityId: invoiceId, summary: `Dispute opened on ${inv.number}: ${reason}` });
    refresh(inv.orgId);
    return okVoid("Dispute recorded. Reminders pause while it is open.");
  });
}

export async function closeDisputeAction(disputeId: string, state: "won" | "lost" | "withdrawn"): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const d = await closeDispute(disputeId, state, `Closed as ${state}`);
    await auditInternal(admin.user.id, { orgId: d.orgId, action: "billing.dispute_close", entityType: "dispute", entityId: d.id, summary: `Dispute closed: ${state}` });
    refresh(d.orgId);
    return okVoid("Dispute closed.");
  });
}

/** BIL-04: a person approves the drafted reminder; only then is it emailed. */
export async function approveReminderAction(reminderId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(z.object({ subject: z.string().trim().min(3).max(200), body: z.string().trim().min(10).max(5000) }), formData);
    const r = await prisma.paymentReminder.findUnique({ where: { id: reminderId } });
    if (!r || r.state !== "draft") return err("That reminder is no longer a draft.", "workflow");
    const claimed = await prisma.paymentReminder.updateMany({ where: { id: r.id, state: "draft" }, data: { state: "approved", approvedById: admin.user.id, approvedAt: new Date(), subject: input.subject, body: input.body } });
    if (claimed.count !== 1) return err("Someone else handled this reminder.", "workflow");
    await enqueue("email.send", { to: r.toEmail, template: "payment_reminder", data: { subject: input.subject, body: input.body }, orgId: r.orgId }, { idempotencyKey: `reminder:${r.id}`, orgId: r.orgId });
    await prisma.paymentReminder.update({ where: { id: r.id }, data: { state: "sent", sentAt: new Date() } });
    await auditInternal(admin.user.id, { orgId: r.orgId, action: "billing.reminder_sent", entityType: "payment_reminder", entityId: r.id, summary: `Approved and sent a payment reminder to ${r.toEmail}` });
    refresh(r.orgId);
    return okVoid("Reminder approved and sent.");
  });
}

export async function discardReminderAction(reminderId: string): Promise<ActionResult> {
  return guarded(async () => {
    await requireInternalStrict("admin.clients.manage");
    const r = await prisma.paymentReminder.update({ where: { id: reminderId }, data: { state: "discarded" } });
    refresh(r.orgId);
    return okVoid("Discarded.");
  });
}

export async function setBillingProviderAction(engagementId: string, provider: "manual" | "stripe"): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } });
    const issued = await prisma.invoice.count({ where: { engagementId, status: { in: ["issued", "paid"] }, provider: { not: provider } } });
    if (issued) return err("Invoices have already been issued through the other system. Keep one invoice authority per engagement.", "workflow");
    await prisma.$transaction([prisma.engagement.update({ where: { id: e.id }, data: { billingProvider: provider } }), prisma.invoice.updateMany({ where: { engagementId, status: "draft" }, data: { provider } })]);
    await auditInternal(admin.user.id, { orgId: e.orgId, action: "billing.provider", entityType: "engagement", entityId: e.id, summary: `Invoices for this engagement now go through ${provider}` });
    refresh(e.orgId);
    return okVoid(`Billing through ${provider}.`);
  });
}

const agreementSchema = z.object({
  kind: z.enum(["msa", "dpa", "sow", "order_form"]),
  version: z.string().trim().min(1).max(40),
  signedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  signedByName: z.string().trim().min(2).max(120),
  signedByRole: z.string().max(120).optional(),
  evidence: z.string().trim().min(3, "Say where the signed copy is.").max(500),
});

/** BIL-03: record a signed agreement's version and evidence (not its content). */
export async function recordAgreementAction(orgId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(agreementSchema, formData);
    const e = await prisma.engagement.findFirst({ where: { orgId }, orderBy: { createdAt: "desc" }, select: { id: true } });
    const doc = await prisma.agreementDocument.create({ data: { orgId, engagementId: e?.id ?? null, kind: input.kind, version: input.version, signedAt: new Date(`${input.signedAt}T12:00:00Z`), signedByName: input.signedByName, signedByRole: input.signedByRole ?? null, evidence: input.evidence, recordedById: admin.user.id } });
    if (e && (input.kind === "msa" || input.kind === "order_form")) await prisma.engagement.update({ where: { id: e.id }, data: { agreementVersion: input.version, agreementSignedAt: doc.signedAt, agreementEvidence: input.evidence } });
    await auditInternal(admin.user.id, { orgId, action: "agreement.record", entityType: "agreement", entityId: doc.id, summary: `Recorded ${input.kind.toUpperCase()} v${input.version} signed by ${input.signedByName}` });
    refresh(orgId);
    return okVoid("Agreement recorded.");
  });
}
