/**
 * Stripe Invoicing adapter (BIL-02). TEST MODE ONLY in this build: any key that
 * is not a `sk_test_` key is refused, so nothing here can charge real money.
 *
 * Contract (docs.stripe.com/invoicing/integration, checked 26 Sept 2026):
 *   POST /v1/customers                  name, email, metadata
 *   POST /v1/invoices                   customer, collection_method=send_invoice,
 *                                       days_until_due, currency, auto_advance=false, metadata
 *   POST /v1/invoiceitems               customer, invoice, amount, currency, description
 *   POST /v1/invoices/{id}/finalize
 *   POST /v1/invoices/{id}/send         (Stripe emails the hosted invoice)
 *   webhooks: invoice.paid, invoice.payment_failed, charge.refunded, charge.dispute.created
 * Bodies are form-encoded; every write carries an Idempotency-Key so a retry
 * never creates a second customer or invoice.
 */
export class StripeError extends Error {
  constructor(message: string, readonly kind: "retry" | "review" | "config", readonly status?: number) {
    super(message);
    this.name = "StripeError";
  }
}

export function stripeKey(env: Record<string, string | undefined> = process.env): string {
  const key = (env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) throw new StripeError("STRIPE_SECRET_KEY is not configured.", "config");
  if (!key.startsWith("sk_test_")) throw new StripeError("Only Stripe test-mode keys (sk_test_…) are accepted in this build. Live billing needs an explicit owner decision.", "config");
  return key;
}

const form = (data: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();

export class StripeClient {
  constructor(private key: string, private fetchImpl: typeof fetch = fetch) {}

  private async post<T>(path: string, data: Record<string, string | number | undefined>, idempotencyKey: string): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(`https://api.stripe.com${path}`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.key}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": idempotencyKey },
        body: form(data),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (e) {
      throw new StripeError(`Stripe unreachable: ${e instanceof Error ? e.message : String(e)}`, "retry");
    }
    const body = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
    if (res.status === 429 || res.status >= 500) throw new StripeError(`Stripe ${res.status}`, "retry", res.status);
    if (!res.ok || !body) throw new StripeError(`Stripe refused the request (${res.status}): ${body?.error?.message ?? "no detail"}`, "review", res.status);
    return body;
  }

  createCustomer(input: { name: string; email: string; orgId: string }) {
    return this.post<{ id: string }>("/v1/customers", { name: input.name, email: input.email, "metadata[threadline_org]": input.orgId }, `customer:${input.orgId}`);
  }

  async createInvoice(input: { customer: string; invoiceId: string; number: string; currency: string; daysUntilDue: number; lines: { description: string; amountMinor: number }[] }) {
    const inv = await this.post<{ id: string }>(
      "/v1/invoices",
      { customer: input.customer, collection_method: "send_invoice", days_until_due: input.daysUntilDue, currency: input.currency.toLowerCase(), auto_advance: "false", "metadata[threadline_invoice]": input.invoiceId, "metadata[threadline_number]": input.number },
      `invoice:${input.invoiceId}`,
    );
    let i = 0;
    for (const line of input.lines) {
      await this.post("/v1/invoiceitems", { customer: input.customer, invoice: inv.id, amount: line.amountMinor, currency: input.currency.toLowerCase(), description: line.description }, `invoiceitem:${input.invoiceId}:${i++}`);
    }
    return this.post<{ id: string; hosted_invoice_url?: string | null; status?: string }>(`/v1/invoices/${inv.id}/finalize`, {}, `finalize:${input.invoiceId}`);
  }

  sendInvoice(providerInvoiceId: string, invoiceId: string) {
    return this.post<{ id: string; status?: string }>(`/v1/invoices/${providerInvoiceId}/send`, {}, `send:${invoiceId}`);
  }

  voidInvoice(providerInvoiceId: string, invoiceId: string) {
    return this.post<{ id: string; status?: string }>(`/v1/invoices/${providerInvoiceId}/void`, {}, `void:${invoiceId}`);
  }
}
