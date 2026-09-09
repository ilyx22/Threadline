import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";

/**
 * Inbound webhooks from CRM and payment providers — the boundary where an
 * external system's fact (a deal closed, a payment landed) becomes a
 * Threadline commercial event with provenance.
 *
 * Rules:
 *   - the signature is verified with the workspace's stored secret before
 *     anything is parsed; an unsigned or mis-signed payload is recorded as
 *     `verified: false` and never acted on;
 *   - (provider, externalId) is unique, so a redelivered webhook is a no-op;
 *   - the event keeps `source: "crm" | "payment"` and the external ids, and
 *     its attribution class is `qualitative_only` unless the payload can be
 *     joined to an inquiry that already carries a journey — nothing here
 *     invents a stronger class than the evidence supports.
 */

export const WEBHOOK_PROVIDERS = ["stripe", "hubspot", "pipedrive", "attio", "gohighlevel"] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

export type ParsedWebhook = {
  externalId: string;
  eventType: string;
  kind: "opportunity" | "won" | "showed" | "booked_call" | "inquiry" | null;
  valueMinor: number | null;
  currency: string | null;
  cashCollectedMinor: number | null;
  externalRecordId: string | null;
  externalRecordUrl: string | null;
  externalDealId: string | null;
  externalPaymentId: string | null;
  contactEmail: string | null;
  occurredAt: Date;
};

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/** Verify a provider signature. Each provider signs differently; all reduce to an HMAC over the raw body. */
export function verifySignature(provider: WebhookProvider, rawBody: string, headers: Headers, secret: string, now = Date.now()): { ok: boolean; reason?: string } {
  switch (provider) {
    case "stripe": {
      const header = headers.get("stripe-signature") ?? "";
      const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
      const t = parts.t;
      const v1 = parts.v1;
      if (!t || !v1) return { ok: false, reason: "missing stripe-signature" };
      if (Math.abs(now / 1000 - Number(t)) > 300) return { ok: false, reason: "timestamp outside tolerance" };
      const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
      return safeEqual(expected, v1) ? { ok: true } : { ok: false, reason: "signature mismatch" };
    }
    case "hubspot": {
      const sig = headers.get("x-hubspot-signature-v3") ?? "";
      const ts = headers.get("x-hubspot-request-timestamp") ?? "";
      const uri = headers.get("x-threadline-request-uri") ?? "";
      if (!sig || !ts) return { ok: false, reason: "missing hubspot signature" };
      if (Math.abs(now - Number(ts)) > 300_000) return { ok: false, reason: "timestamp outside tolerance" };
      const expected = createHmac("sha256", secret).update(`POST${uri}${rawBody}${ts}`).digest("base64");
      return safeEqual(expected, sig) ? { ok: true } : { ok: false, reason: "signature mismatch" };
    }
    case "pipedrive":
    case "attio":
    case "gohighlevel": {
      // These providers offer either basic-auth or a shared-secret header; Threadline uses the shared-secret HMAC form.
      const sig = headers.get("x-webhook-signature") ?? headers.get("x-signature") ?? "";
      if (!sig) return { ok: false, reason: "missing signature header" };
      const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
      return safeEqual(expected, sig) ? { ok: true } : { ok: false, reason: "signature mismatch" };
    }
  }
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Parse a provider payload into the neutral shape. Unknown event types parse with `kind: null` and are stored, not acted on. */
export function parseWebhook(provider: WebhookProvider, body: unknown): ParsedWebhook | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const now = new Date();
  switch (provider) {
    case "stripe": {
      const id = str(b.id);
      const type = str(b.type) ?? "";
      const obj = ((b.data as Record<string, unknown> | undefined)?.object ?? {}) as Record<string, unknown>;
      if (!id) return null;
      const paid = type === "payment_intent.succeeded" || type === "invoice.paid" || type === "checkout.session.completed";
      const amount = num(obj.amount_received ?? obj.amount_paid ?? obj.amount_total);
      return {
        externalId: id,
        eventType: type,
        kind: paid ? "won" : null,
        valueMinor: amount,
        currency: str(obj.currency)?.toUpperCase() ?? null,
        cashCollectedMinor: paid ? amount : null,
        externalRecordId: str(obj.id),
        externalRecordUrl: null,
        externalDealId: str(obj.subscription) ?? str(obj.invoice) ?? null,
        externalPaymentId: str(obj.id),
        contactEmail: str(obj.receipt_email) ?? str((obj.customer_details as Record<string, unknown> | undefined)?.email) ?? null,
        occurredAt: num(b.created) ? new Date(Number(b.created) * 1000) : now,
      };
    }
    case "hubspot": {
      const first = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
      const id = str(first?.eventId) ?? str(first?.objectId);
      if (!id) return null;
      const stage = str(first.propertyValue) ?? "";
      const won = /closedwon/i.test(stage);
      return {
        externalId: String(id),
        eventType: str(first.subscriptionType) ?? "deal.propertyChange",
        kind: won ? "won" : /appointmentscheduled|meeting/i.test(stage) ? "booked_call" : stage ? "opportunity" : null,
        valueMinor: null,
        currency: null,
        cashCollectedMinor: null,
        externalRecordId: str(first.objectId),
        externalRecordUrl: null,
        externalDealId: str(first.objectId),
        externalPaymentId: null,
        contactEmail: null,
        occurredAt: num(first.occurredAt) ? new Date(Number(first.occurredAt)) : now,
      };
    }
    case "pipedrive": {
      const meta = (b.meta ?? {}) as Record<string, unknown>;
      const current = (b.current ?? b.data ?? {}) as Record<string, unknown>;
      const id = str(meta.id) ?? str(current.id);
      if (!id) return null;
      const status = str(current.status) ?? "";
      const value = num(current.value);
      return {
        externalId: `${str(meta.action) ?? "event"}:${id}:${str(meta.timestamp) ?? ""}`,
        eventType: `${str(meta.object) ?? "deal"}.${str(meta.action) ?? "updated"}`,
        kind: status === "won" ? "won" : status === "open" ? "opportunity" : null,
        valueMinor: value === null ? null : Math.round(value * 100),
        currency: str(current.currency) ?? null,
        cashCollectedMinor: null,
        externalRecordId: id,
        externalRecordUrl: null,
        externalDealId: id,
        externalPaymentId: null,
        contactEmail: null,
        occurredAt: now,
      };
    }
    case "attio":
    case "gohighlevel": {
      const id = str(b.id) ?? str(b.event_id) ?? str(b.webhookId);
      if (!id) return null;
      const type = str(b.type) ?? str(b.event) ?? "unknown";
      const stage = str(b.stage) ?? str((b.data as Record<string, unknown> | undefined)?.stage) ?? "";
      const value = num(b.value ?? b.monetaryValue ?? (b.data as Record<string, unknown> | undefined)?.value);
      return {
        externalId: id,
        eventType: type,
        kind: /won|closed/i.test(stage) || /won/i.test(type) ? "won" : /appointment|booked/i.test(type + stage) ? "booked_call" : /opportunit/i.test(type + stage) ? "opportunity" : null,
        valueMinor: value === null ? null : Math.round(value * 100),
        currency: str(b.currency) ?? null,
        cashCollectedMinor: null,
        externalRecordId: str(b.recordId) ?? str(b.opportunityId) ?? id,
        externalRecordUrl: str(b.url),
        externalDealId: str(b.opportunityId) ?? str(b.recordId),
        externalPaymentId: null,
        contactEmail: str(b.email) ?? str((b.contact as Record<string, unknown> | undefined)?.email),
        occurredAt: now,
      };
    }
  }
}

/**
 * Store the delivery (idempotently) and, when it maps to a funnel event, record
 * the commercial event with CRM/payment provenance.
 */
export async function ingestWebhook(input: { provider: WebhookProvider; orgId: string; verified: boolean; rawBody: string; parsed: ParsedWebhook | null; reason?: string }) {
  if (!input.parsed) {
    return { stored: false, acted: false, reason: "unparseable" as const };
  }
  const existing = await prisma.webhookEvent.findUnique({ where: { provider_externalId: { provider: input.provider, externalId: input.parsed.externalId } } });
  if (existing) return { stored: true, acted: false, reason: "duplicate" as const };

  const stored = await prisma.webhookEvent.create({
    data: {
      provider: input.provider,
      externalId: input.parsed.externalId,
      orgId: input.orgId,
      eventType: input.parsed.eventType,
      payload: input.rawBody.slice(0, 20_000),
      verified: input.verified,
      error: input.verified ? null : (input.reason ?? "unverified"),
    },
  });
  if (!input.verified) return { stored: true, acted: false, reason: "unverified" as const };
  if (!input.parsed.kind) {
    await prisma.webhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date() } });
    return { stored: true, acted: false, reason: "no_funnel_mapping" as const };
  }

  // Join to an inquiry only when an operator has already recorded this external
  // deal id against one (a prior commercial event carries the link); never on a
  // fuzzy name match.
  const prior = input.parsed.externalDealId
    ? await prisma.commercialEvent.findFirst({ where: { orgId: input.orgId, externalDealId: input.parsed.externalDealId, inquiryId: { not: null } }, select: { inquiry: { select: { id: true, visitorId: true } } } })
    : null;
  const inquiry = prior?.inquiry ?? null;

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: input.orgId }, select: { currency: true } });
  const event = await prisma.commercialEvent.create({
    data: {
      orgId: input.orgId,
      kind: input.parsed.kind,
      occurredAt: input.parsed.occurredAt,
      inquiryId: inquiry?.id ?? null,
      visitorId: inquiry?.visitorId ?? null,
      valueMinor: input.parsed.valueMinor ?? 0,
      currency: input.parsed.currency ?? org.currency,
      source: input.provider === "stripe" ? "payment" : "crm",
      externalProvider: input.provider,
      externalRecordId: input.parsed.externalRecordId,
      externalRecordUrl: input.parsed.externalRecordUrl,
      externalDealId: input.parsed.externalDealId,
      externalPaymentId: input.parsed.externalPaymentId,
      cashCollectedMinor: input.parsed.cashCollectedMinor,
      collectedAt: input.parsed.cashCollectedMinor ? input.parsed.occurredAt : null,
      evidenceBasis: "measured",
      // The provider proves the deal exists, not that content caused it.
      attribution: inquiry?.visitorId ? "associated" : "qualitative_only",
      note: `Recorded from ${input.provider} webhook ${input.parsed.eventType}`,
    },
  });
  await prisma.webhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date() } });
  return { stored: true, acted: true, reason: "recorded" as const, eventId: event.id };
}
