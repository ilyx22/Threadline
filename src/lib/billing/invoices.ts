import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { addDays, dbDateFromIso, isoFromDbDate, todayIn } from "@/lib/commercial/calendar";
import { WorkflowError } from "@/lib/domain/workflow";
import { StripeClient, StripeError, stripeKey } from "./stripe";

/**
 * Invoices, payments, credits, refunds and disputes (BIL-01, BIL-02, BIL-04).
 *
 * Rules:
 *  - one invoice authority per engagement (manual or Stripe), chosen on the
 *    engagement; the two are never mixed for the same engagement;
 *  - the setup invoice and one invoice per 28-day period are drafted
 *    automatically; ISSUING is a person's decision;
 *  - an issued invoice is never edited: it is voided (only while unpaid, with a
 *    reason) or corrected with a credit note;
 *  - the balance is total, minus payments (refunds count negative), minus
 *    issued credit notes; an invoice is paid when the balance reaches zero;
 *  - overdue invoices produce reminder DRAFTS; nothing is emailed until a
 *    person approves it.
 */
type Db = Prisma.TransactionClient | typeof prisma;

export async function nextInvoiceNumber(db: Db = prisma, year = new Date().getUTCFullYear()) {
  const rows = await db.$queryRaw<{ n: bigint }[]>`SELECT nextval('invoice_number_seq') AS n`;
  return `TL-${year}-${String(rows[0].n).padStart(4, "0")}`;
}

export async function invoiceBalance(invoiceId: string, db: Db = prisma) {
  const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, select: { totalMinor: true } });
  const [paid, credited] = await Promise.all([
    db.payment.aggregate({ where: { invoiceId }, _sum: { amountMinor: true } }),
    db.invoice.aggregate({ where: { creditsInvoiceId: invoiceId, kind: "credit_note", status: { in: ["issued", "paid"] } }, _sum: { totalMinor: true } }),
  ]);
  return inv.totalMinor - (paid._sum.amountMinor ?? 0) - (credited._sum.totalMinor ?? 0);
}

async function createDraft(db: Db, input: { orgId: string; engagementId: string; kind: "setup" | "period"; periodNumber: number | null; currency: string; lines: { description: string; amountMinor: number }[]; provider: string }) {
  const total = input.lines.reduce((a, l) => a + l.amountMinor, 0);
  try {
    return await db.invoice.create({
      data: {
        orgId: input.orgId,
        engagementId: input.engagementId,
        number: await nextInvoiceNumber(db),
        kind: input.kind,
        periodNumber: input.periodNumber,
        currency: input.currency,
        totalMinor: total,
        provider: input.provider,
        lines: { create: input.lines.map((l) => ({ description: l.description, quantity: 1, unitMinor: l.amountMinor, amountMinor: l.amountMinor })) },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // already drafted
    throw e;
  }
}

/** Draft the setup invoice and the invoices of periods that have started or start within a week. Idempotent. */
export async function draftDueInvoices(engagementId: string, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId }, include: { periods: true, org: { select: { name: true } } } });
  if (e.status === "draft" || !e.startDate) return [];
  const made = [];
  if (e.setupFeeMinor > 0 && !(await prisma.invoice.findFirst({ where: { engagementId, kind: "setup", status: { not: "void" } } }))) {
    const inv = await createDraft(prisma, { orgId: e.orgId, engagementId, kind: "setup", periodNumber: null, currency: e.currency, provider: e.billingProvider, lines: [{ description: `${e.org.name}: Threadline setup`, amountMinor: e.setupFeeMinor }] });
    if (inv) made.push(inv);
  }
  const horizon = addDays(todayIn(e.timezone, now), 7);
  for (const p of e.periods) {
    if (p.status === "paused" || isoFromDbDate(p.startDate) > horizon) continue;
    if (await prisma.invoice.findFirst({ where: { engagementId, kind: "period", periodNumber: p.number, status: { not: "void" } } })) continue;
    const end = addDays(isoFromDbDate(p.endDate), -1);
    const inv = await createDraft(prisma, { orgId: e.orgId, engagementId, kind: "period", periodNumber: p.number, currency: e.currency, provider: e.billingProvider, lines: [{ description: `Service period ${p.number} (${isoFromDbDate(p.startDate)} to ${end})`, amountMinor: p.feeMinor }] });
    if (inv) made.push(inv);
  }
  return made;
}

/** Issue a draft: fixes the due date; with Stripe, creates and finalises the Stripe invoice (test mode). */
export async function issueInvoice(invoiceId: string, opts: { now?: Date; stripe?: StripeClient; contactEmail?: string | null } = {}) {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
  if (inv.status !== "draft") throw new WorkflowError("Only a draft invoice can be issued.");
  const e = inv.engagementId ? await prisma.engagement.findUnique({ where: { id: inv.engagementId }, include: { org: { select: { name: true } } } }) : null;
  const tz = e?.timezone ?? "Europe/London";
  const terms = e?.paymentTermsDays ?? 14;
  const due = addDays(todayIn(tz, opts.now), terms);
  let providerInvoiceId: string | null = null;
  let hostedUrl: string | null = null;
  if (inv.provider === "stripe") {
    if (!e) throw new WorkflowError("A Stripe invoice needs an engagement.");
    const client = opts.stripe ?? new StripeClient(stripeKey());
    let customer = e.stripeCustomerId;
    if (!customer) {
      if (!opts.contactEmail) throw new WorkflowError("Set a primary contact with an email before billing through Stripe.");
      customer = (await client.createCustomer({ name: e.org.name, email: opts.contactEmail, orgId: e.orgId })).id;
      await prisma.engagement.update({ where: { id: e.id }, data: { stripeCustomerId: customer } });
    }
    const s = await client.createInvoice({ customer, invoiceId: inv.id, number: inv.number, currency: inv.currency, daysUntilDue: terms, lines: inv.lines.map((l) => ({ description: l.description, amountMinor: l.amountMinor })) });
    providerInvoiceId = s.id;
    hostedUrl = s.hosted_invoice_url ?? null;
  }
  const claimed = await prisma.invoice.updateMany({ where: { id: inv.id, status: "draft" }, data: { status: "issued", issuedAt: opts.now ?? new Date(), dueDate: dbDateFromIso(due), providerInvoiceId, hostedUrl } });
  if (claimed.count !== 1) throw new WorkflowError("That invoice was issued by someone else just now.");
  return prisma.invoice.findUniqueOrThrow({ where: { id: inv.id } });
}

async function settle(invoiceId: string, db: Db) {
  const balance = await invoiceBalance(invoiceId, db);
  const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, select: { status: true } });
  if (balance <= 0 && inv.status === "issued") await db.invoice.update({ where: { id: invoiceId }, data: { status: "paid", paidAt: new Date() } });
  if (balance > 0 && inv.status === "paid") await db.invoice.update({ where: { id: invoiceId }, data: { status: "issued", paidAt: null } });
  return balance;
}

/** Record money received (partial payments welcome) or refunded (kind "refund", positive amount entered). */
export async function recordPayment(invoiceId: string, input: { amountMinor: number; kind?: "payment" | "refund"; method: string; receivedAt: Date; reference?: string | null; evidence?: string | null; providerPaymentId?: string | null; recordedById?: string | null }) {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) throw new WorkflowError("Enter a positive amount.");
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.status === "draft" || inv.status === "void") throw new WorkflowError("Payments are recorded against issued invoices only.");
  const signed = input.kind === "refund" ? -input.amountMinor : input.amountMinor;
  try {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: { orgId: inv.orgId, invoiceId, amountMinor: signed, kind: input.kind ?? "payment", method: input.method, receivedAt: input.receivedAt, reference: input.reference ?? null, evidence: input.evidence ?? null, providerPaymentId: input.providerPaymentId ?? null, recordedById: input.recordedById ?? null },
      });
      const balance = await settle(invoiceId, tx);
      return { payment: p, balance, duplicate: false };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { payment: null, balance: await invoiceBalance(invoiceId), duplicate: true };
    throw e;
  }
}

export async function voidInvoice(invoiceId: string, reason: string, opts: { stripe?: StripeClient } = {}) {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.status === "void") return inv;
  if (inv.status === "paid" || (await prisma.payment.count({ where: { invoiceId } }))) throw new WorkflowError("An invoice with payments cannot be voided. Issue a credit note or record a refund.");
  if (inv.provider === "stripe" && inv.providerInvoiceId) await (opts.stripe ?? new StripeClient(stripeKey())).voidInvoice(inv.providerInvoiceId, inv.id);
  return prisma.invoice.update({ where: { id: invoiceId }, data: { status: "void", voidedAt: new Date(), voidReason: reason.slice(0, 1000) } });
}

/** A credit note reduces what is owed on an issued invoice. */
export async function issueCreditNote(invoiceId: string, amountMinor: number, reason: string, userId: string) {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.status !== "issued" && inv.status !== "paid") throw new WorkflowError("Credit notes apply to issued invoices.");
  if (!Number.isInteger(amountMinor) || amountMinor <= 0 || amountMinor > inv.totalMinor) throw new WorkflowError("The credit must be positive and no more than the invoice total.");
  return prisma.$transaction(async (tx) => {
    const note = await tx.invoice.create({
      data: { orgId: inv.orgId, engagementId: inv.engagementId, number: await nextInvoiceNumber(tx), kind: "credit_note", currency: inv.currency, totalMinor: amountMinor, status: "issued", issuedAt: new Date(), creditsInvoiceId: inv.id, notes: reason.slice(0, 1000), createdById: userId, provider: "manual", lines: { create: [{ description: `Credit against ${inv.number}: ${reason.slice(0, 200)}`, unitMinor: amountMinor, amountMinor }] } },
    });
    await settle(inv.id, tx);
    return note;
  });
}

export async function openDispute(invoiceId: string, reason: string, amountMinor: number | null = null, providerDisputeId: string | null = null) {
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  try {
    return await prisma.dispute.create({ data: { orgId: inv.orgId, invoiceId, reason: reason.slice(0, 1000), amountMinor, providerDisputeId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return prisma.dispute.findUniqueOrThrow({ where: { providerDisputeId: providerDisputeId! } });
    throw e;
  }
}

export async function closeDispute(disputeId: string, state: "won" | "lost" | "withdrawn", note: string) {
  return prisma.dispute.update({ where: { id: disputeId }, data: { state, closedAt: new Date(), note: note.slice(0, 1000) } });
}

/** Issued invoices past their due date with money still owed. */
export async function overdueInvoices(orgId?: string, now = new Date()) {
  const today = dbDateFromIso(todayIn("Europe/London", now));
  const candidates = await prisma.invoice.findMany({ where: { status: "issued", dueDate: { lt: today }, kind: { not: "credit_note" }, ...(orgId ? { orgId } : {}) }, orderBy: { dueDate: "asc" } });
  const out = [];
  for (const inv of candidates) {
    const balance = await invoiceBalance(inv.id);
    if (balance > 0) out.push({ ...inv, balance, disputed: (await prisma.dispute.count({ where: { invoiceId: inv.id, state: "open" } })) > 0 });
  }
  return out;
}

/**
 * Draft (never send) a reminder for each overdue, undisputed invoice to the
 * workspace's commercial contact, at most once a week per invoice (BIL-04).
 */
export async function draftOverdueReminders(now = new Date()) {
  const made = [];
  for (const inv of await overdueInvoices(undefined, now)) {
    if (inv.disputed) continue;
    const recent = await prisma.paymentReminder.findFirst({ where: { invoiceId: inv.id, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) }, state: { not: "discarded" } } });
    if (recent) continue;
    const contact = await prisma.membership.findFirst({
      where: { orgId: inv.orgId, status: "active", OR: [{ profiles: { contains: '"commercial"' } }, { contactRole: "primary" }] },
      orderBy: [{ contactRole: "asc" }],
      select: { user: { select: { email: true, name: true } } },
    });
    if (!contact) continue;
    const amount = new Intl.NumberFormat("en-GB", { style: "currency", currency: inv.currency }).format(inv.balance / 100);
    made.push(
      await prisma.paymentReminder.create({
        data: {
          orgId: inv.orgId,
          invoiceId: inv.id,
          toEmail: contact.user.email,
          subject: `Invoice ${inv.number}: ${amount} outstanding`,
          body: `Hello ${contact.user.name.split(" ")[0]},\n\nInvoice ${inv.number} was due on ${inv.dueDate ? isoFromDbDate(inv.dueDate) : "its due date"} and ${amount} is still outstanding. If it has been paid, thank you, and please reply with the payment reference so we can match it.\n\nThreadline`,
        },
      }),
    );
  }
  return made;
}

export { StripeError };
