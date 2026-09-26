import "server-only";
import { prisma } from "@/lib/db/client";
import { openDispute, recordPayment } from "./invoices";

/**
 * Threadline's OWN Stripe billing events (BIL-02), as opposed to a client's
 * Stripe account (which feeds attribution through /api/webhooks/stripe).
 * Every effect is idempotent on a provider id, so redelivery is harmless.
 */
type Obj = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function applyBillingEvent(event: { id: string; type: string; data?: { object?: Obj } }): Promise<string> {
  const o = event.data?.object ?? {};
  if (event.type === "invoice.paid") {
    const inv = await prisma.invoice.findUnique({ where: { providerInvoiceId: str(o.id) ?? "-" } });
    if (!inv) return "unknown invoice";
    const paid = num(o.amount_paid) ?? 0;
    if (paid <= 0) return "nothing paid";
    const paidAt = num((o.status_transitions as Obj | undefined)?.paid_at);
    const r = await recordPayment(inv.id, { amountMinor: paid, method: "stripe", receivedAt: paidAt ? new Date(paidAt * 1000) : new Date(), reference: str(o.number), providerPaymentId: `invoice.paid:${str(o.id)}` });
    return r.duplicate ? "duplicate" : "payment recorded";
  }
  if (event.type === "charge.refunded") {
    const invoiceRef = str(o.invoice);
    const inv = invoiceRef ? await prisma.invoice.findUnique({ where: { providerInvoiceId: invoiceRef } }) : null;
    if (!inv) return "unknown invoice";
    const cumulative = num(o.amount_refunded) ?? 0;
    const prior = await prisma.payment.aggregate({ where: { invoiceId: inv.id, kind: "refund", method: "stripe" }, _sum: { amountMinor: true } });
    const delta = cumulative + (prior._sum.amountMinor ?? 0); // prior refunds are stored negative
    if (delta <= 0) return "no new refund";
    const r = await recordPayment(inv.id, { amountMinor: delta, kind: "refund", method: "stripe", receivedAt: new Date(), providerPaymentId: `refund:${str(o.id)}:${cumulative}` });
    return r.duplicate ? "duplicate" : "refund recorded";
  }
  if (event.type === "charge.dispute.created") {
    const invoiceRef = str((o as Obj).invoice) ?? null;
    const inv = invoiceRef ? await prisma.invoice.findUnique({ where: { providerInvoiceId: invoiceRef } }) : null;
    if (!inv) return "unknown invoice";
    await openDispute(inv.id, str(o.reason) ?? "Card dispute", num(o.amount), str(o.id));
    return "dispute opened";
  }
  return "ignored";
}
