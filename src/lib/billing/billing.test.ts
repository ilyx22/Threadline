import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { activateEngagement, createDraftEngagement } from "@/lib/commercial/engagements";
import { draftDueInvoices, draftOverdueReminders, invoiceBalance, issueCreditNote, issueInvoice, overdueInvoices, recordPayment, voidInvoice } from "./invoices";
import { StripeClient, stripeKey } from "./stripe";
import { applyBillingEvent } from "./stripe-events";

const stamp = Date.now();
let orgId = "";
let engagementId = "";
let contactId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-bill-${stamp}`, name: "QA Billing", kind: "client", synthetic: true } })).id;
  contactId = (await prisma.user.create({ data: { email: `payer-${stamp}@example.com`, name: "Pat Payer", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId: contactId, orgId, role: "client_admin", contactRole: "primary", profiles: '["admin","commercial"]' } });
  const e = await prisma.$transaction((tx) => createDraftEngagement(tx, { orgId, timezone: "Europe/London" }));
  engagementId = e.id;
  await activateEngagement(e.id, "2026-09-01", new Date("2026-09-02T09:00:00Z"));
});
after(async () => {
  await prisma.paymentReminder.deleteMany({ where: { orgId } });
  await prisma.dispute.deleteMany({ where: { orgId } });
  await prisma.payment.deleteMany({ where: { orgId } });
  await prisma.invoice.deleteMany({ where: { orgId, kind: "credit_note" } });
  await prisma.invoice.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: contactId } });
});

describe("invoices and payments (BIL-01)", () => {
  it("drafts the setup invoice and started periods once, never issuing them automatically", async () => {
    const made = await draftDueInvoices(engagementId, new Date("2026-09-02T09:00:00Z"));
    assert.deepEqual(made.map((i) => [i.kind, i.periodNumber, i.totalMinor, i.status]).sort(), [["period", 1, 250000, "draft"], ["setup", null, 250000, "draft"]].sort());
    assert.match(made[0].number, /^TL-\d{4}-\d{4,}$/);
    assert.equal((await draftDueInvoices(engagementId, new Date("2026-09-02T09:00:00Z"))).length, 0, "idempotent");
  });

  it("issues with a due date, takes partial payments, and settles at zero", async () => {
    const setup = await prisma.invoice.findFirstOrThrow({ where: { engagementId, kind: "setup" } });
    const issued = await issueInvoice(setup.id, { now: new Date("2026-09-02T09:00:00Z") });
    assert.equal(issued.dueDate?.toISOString().slice(0, 10), "2026-09-16");
    await recordPayment(setup.id, { amountMinor: 100000, method: "bank_transfer", receivedAt: new Date() });
    assert.equal(await invoiceBalance(setup.id), 150000);
    await recordPayment(setup.id, { amountMinor: 150000, method: "bank_transfer", receivedAt: new Date() });
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: setup.id } })).status, "paid");
    await assert.rejects(voidInvoice(setup.id, "mistake"), /cannot be voided/);
    await recordPayment(setup.id, { amountMinor: 50000, kind: "refund", method: "bank_transfer", receivedAt: new Date() });
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: setup.id } })).status, "issued", "a refund reopens the balance");
    await issueCreditNote(setup.id, 50000, "Goodwill credit for a late start", "staff");
    assert.equal(await invoiceBalance(setup.id), 0);
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: setup.id } })).status, "paid");
  });

  it("surfaces overdue invoices and drafts, but never sends, a reminder to the commercial contact", async () => {
    const p1 = await prisma.invoice.findFirstOrThrow({ where: { engagementId, kind: "period", periodNumber: 1 } });
    await issueInvoice(p1.id, { now: new Date("2026-09-02T09:00:00Z") });
    const later = new Date("2026-10-01T09:00:00Z");
    assert.ok((await overdueInvoices(orgId, later)).some((i) => i.id === p1.id));
    const reminders = await draftOverdueReminders(later);
    const mine = reminders.filter((r) => r.orgId === orgId);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].state, "draft");
    assert.equal(mine[0].toEmail, `payer-${stamp}@example.com`);
    assert.equal((await draftOverdueReminders(later)).filter((r) => r.orgId === orgId).length, 0, "at most one a week");
    assert.equal(await prisma.job.count({ where: { type: "email.send", payload: { contains: mine[0].subject } } }), 0, "nothing queued to send");
  });
});

describe("Stripe billing in test mode only (BIL-02)", () => {
  it("refuses live and missing keys", () => {
    assert.throws(() => stripeKey({ STRIPE_SECRET_KEY: "sk_live_abc" }), /test-mode keys/);
    assert.throws(() => stripeKey({}), /not configured/);
    assert.equal(stripeKey({ STRIPE_SECRET_KEY: "sk_test_abc" }), "sk_test_abc");
  });

  it("creates customer, invoice, items and finalises with idempotency keys; applies paid, refund and dispute events once", async () => {
    await prisma.engagement.update({ where: { id: engagementId }, data: { billingProvider: "stripe" } });
    const p2 = await prisma.invoice.create({ data: { orgId, engagementId, number: `TEST-${stamp}`, kind: "adjustment", totalMinor: 30000, provider: "stripe", lines: { create: [{ description: "Extra long-form piece", unitMinor: 30000, amountMinor: 30000 }] } } });
    const calls: { path: string; body: string; key: string | null }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname;
      calls.push({ path, body: String(init.body), key: (init.headers as Record<string, string>)["idempotency-key"] });
      const id = path.includes("customers") ? "cus_1" : path.includes("invoiceitems") ? "ii_1" : "in_test_1";
      return new Response(JSON.stringify({ id, hosted_invoice_url: "https://invoice.stripe.com/i/test" }), { status: 200 });
    }) as unknown as typeof fetch;
    const issued = await issueInvoice(p2.id, { stripe: new StripeClient("sk_test_x", fake), contactEmail: `payer-${stamp}@example.com` });
    assert.equal(issued.providerInvoiceId, "in_test_1");
    assert.deepEqual(calls.map((c) => c.path), ["/v1/customers", "/v1/invoices", "/v1/invoiceitems", "/v1/invoices/in_test_1/finalize"]);
    assert.match(calls[1].body, /collection_method=send_invoice/);
    assert.ok(calls.every((c) => c.key), "every write carries an idempotency key");

    const paid = { id: "evt_1", type: "invoice.paid", data: { object: { id: "in_test_1", amount_paid: 30000, number: "ABC-1" } } };
    assert.equal(await applyBillingEvent(paid), "payment recorded");
    assert.equal(await applyBillingEvent(paid), "duplicate");
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: p2.id } })).status, "paid");
    const refund = { id: "evt_2", type: "charge.refunded", data: { object: { id: "ch_1", invoice: "in_test_1", amount_refunded: 10000 } } };
    assert.equal(await applyBillingEvent(refund), "refund recorded");
    assert.equal(await applyBillingEvent(refund), "no new refund");
    assert.equal(await invoiceBalance(p2.id), 10000);
    assert.equal(await applyBillingEvent({ id: "evt_3", type: "charge.dispute.created", data: { object: { id: "dp_1", invoice: "in_test_1", reason: "fraudulent", amount: 20000 } } }), "dispute opened");
    await applyBillingEvent({ id: "evt_3b", type: "charge.dispute.created", data: { object: { id: "dp_1", invoice: "in_test_1", reason: "fraudulent", amount: 20000 } } });
    assert.equal(await prisma.dispute.count({ where: { invoiceId: p2.id } }), 1);
  });
});
