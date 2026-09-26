import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { invoiceBalance } from "@/lib/billing/invoices";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Receipt } from "lucide-react";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

const money = (m: number, c: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(m / 100);

/**
 * The client's billing view (BIL-01, BIL-03): issued invoices with what is
 * still owed, and the agreements on record. Drafts are Threadline's working
 * state and are not shown.
 */
export default async function BillingPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "billing.view");
  const [invoices, agreements, engagement] = await Promise.all([
    prisma.invoice.findMany({ where: { orgId: ctx.org.id, status: { in: ["issued", "paid", "void"] } }, orderBy: { issuedAt: "desc" } }),
    prisma.agreementDocument.findMany({ where: { orgId: ctx.org.id }, orderBy: { signedAt: "desc" } }),
    prisma.engagement.findFirst({ where: { orgId: ctx.org.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const rows = await Promise.all(invoices.map(async (i) => ({ ...i, balance: i.status === "void" ? 0 : await invoiceBalance(i.id) })));
  const owed = rows.filter((r) => r.kind !== "credit_note" && r.status === "issued").reduce((a, r) => a + Math.max(0, r.balance), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Billing</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {engagement
            ? `${money(engagement.setupFeeMinor, engagement.currency)} setup, then ${money(engagement.periodFeeMinor, engagement.currency)} per ${engagement.periodDays}-day period. Payment terms: ${engagement.paymentTermsDays} days from issue.`
            : "Invoices appear here once your engagement starts."}
        </p>
      </header>

      {rows.length ? (
        <Card>
          <CardHeader title="Invoices" description={owed ? `${money(owed, ctx.org.currency)} outstanding.` : "Nothing outstanding."} />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {rows.map((r) => {
                const due = r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null;
                const overdue = r.status === "issued" && due && due < today && r.balance > 0;
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-[13.5px]">
                    <span className="font-medium text-ink">{r.number}</span>
                    <span className="text-muted">{r.kind === "period" ? `Period ${r.periodNumber}` : r.kind === "credit_note" ? "Credit note" : r.kind === "setup" ? "Setup" : "Adjustment"}</span>
                    <span className="text-ink">{money(r.totalMinor, r.currency)}</span>
                    <Badge tone={r.status === "paid" ? "positive" : overdue ? "negative" : "outline"}>{overdue ? "overdue" : r.status === "issued" ? "due" : r.status}</Badge>
                    {r.status === "issued" && r.kind !== "credit_note" ? <span className="text-ghost">{money(r.balance, r.currency)} to pay{due ? ` by ${due}` : ""}</span> : null}
                    {r.hostedUrl ? (
                      <a href={r.hostedUrl} target="_blank" rel="noreferrer noopener" className="text-accent">
                        View and pay
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <EmptyState icon={Receipt} title="No invoices yet" description="Your first invoice appears here when it is issued." compact />
      )}

      {agreements.length ? (
        <Card>
          <CardHeader title="Agreements on record" />
          <CardBody className="space-y-1 pt-0 text-[13px] text-muted">
            {agreements.map((a) => (
              <p key={a.id}>
                {a.kind === "msa" ? "Services agreement" : a.kind === "dpa" ? "Data processing agreement" : a.kind === "sow" ? "Statement of work" : "Order form"} version {a.version}, signed {a.signedAt.toISOString().slice(0, 10)} by {a.signedByName}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
