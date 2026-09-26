import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { verifySignature } from "@/lib/integrations/webhooks";
import { applyBillingEvent } from "@/lib/billing/stripe-events";
import { reportError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/stripe: Threadline's own Stripe account (BIL-02).
 * Verified with STRIPE_WEBHOOK_SECRET (Stripe-Signature, 5-minute tolerance),
 * deduplicated on the event id, then applied idempotently.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const raw = await req.text();
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const v = verifySignature("stripe", raw, req.headers, secret);
  if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 401 });
  const event = JSON.parse(raw) as { id: string; type: string; livemode?: boolean; data?: { object?: Record<string, unknown> } };
  if (event.livemode) return NextResponse.json({ error: "live-mode events are refused in this build" }, { status: 400 });
  try {
    await prisma.webhookEvent.create({ data: { provider: "stripe_billing", externalId: event.id, eventType: event.type, payload: raw.slice(0, 20_000), verified: true } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ received: true, outcome: "duplicate" });
    throw e;
  }
  try {
    const outcome = await applyBillingEvent(event);
    await prisma.webhookEvent.update({ where: { provider_externalId: { provider: "stripe_billing", externalId: event.id } }, data: { processedAt: new Date(), error: null } });
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    // Unmark so Stripe's retry is processed rather than deduplicated away.
    await prisma.webhookEvent.delete({ where: { provider_externalId: { provider: "stripe_billing", externalId: event.id } } }).catch(() => {});
    await reportError(error, { event: "billing.stripe_webhook", type: event.type });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
