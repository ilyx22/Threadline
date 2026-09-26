import "server-only";
import { createHash, createHmac, createPublicKey, randomUUID, timingSafeEqual, verify as verifyAsym } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

/**
 * Inbound webhooks from CRM and payment providers: the boundary where an
 * external system's fact (a deal closed, a payment landed) becomes a
 * Threadline commercial event with provenance.
 *
 * Rules (SEC-05):
 *   - each provider is verified by ITS OWN documented mechanism (below), with
 *     the workspace's stored credential, before anything is acted on;
 *   - an unverified delivery is logged under a random key and never claims the
 *     provider's event id, so a forged event cannot block the genuine one;
 *   - a verified delivery is deduplicated per workspace on the provider's
 *     event id, inside one transaction with the commercial event it creates,
 *     so a crash can never leave an event "seen" but not recorded;
 *   - where the provider signs a timestamp, stale deliveries are refused
 *     (Stripe and HubSpot: 5 minutes, as documented; Pipedrive and HighLevel
 *     carry a timestamp in the authenticated body: 24 hours, covering their
 *     retry schedules). Attio signs no timestamp; its Idempotency-Key header
 *     is the dedupe key, and dedupe rows are kept, so a replay is a no-op;
 *   - the attribution class is `qualitative_only` unless the payload joins to
 *     an inquiry that already carries a journey.
 *
 * Provider contracts (checked 26 September 2026 against official docs):
 *   stripe       Stripe-Signature: t=…,v1=HMAC-SHA256(secret, "t.body") hex
 *   hubspot      X-HubSpot-Signature-v3: base64 HMAC-SHA256(secret, method+uri+body+timestamp)
 *   pipedrive    HTTP basic auth on the subscription URL (no signature exists);
 *                stored credential is "user:password"
 *   attio        Attio-Signature (or legacy X-Attio-Signature): hex HMAC-SHA256(secret, body)
 *   gohighlevel  X-GHL-Signature: base64 Ed25519 over the body with HighLevel's
 *                published key (the RSA X-WH-Signature was retired 1 Sept 2026);
 *                the stored credential is the client's location id, so another
 *                HighLevel account cannot post into this workspace
 */

export const WEBHOOK_PROVIDERS = ["stripe", "hubspot", "pipedrive", "attio", "gohighlevel"] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

/** What the stored credential means per provider, for the settings screen. */
export const WEBHOOK_CREDENTIAL_LABEL: Record<WebhookProvider, string> = {
  stripe: "Signing secret (whsec_…) from the Stripe webhook endpoint",
  hubspot: "App client secret from the HubSpot developer app",
  pipedrive: "Basic-auth user and password set on the Pipedrive webhook, as user:password",
  attio: "Webhook secret shown when the Attio webhook was created",
  gohighlevel: "The client's HighLevel location id (HighLevel signs with its own published key)",
};

/** HighLevel's published Ed25519 webhook key (marketplace.gohighlevel.com webhook guide). */
const GHL_ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;
let ghlPublicKey = GHL_ED25519_PUBLIC_KEY;
/** Tests only: substitute a key pair, since HighLevel's private key is theirs. */
export function __setGhlPublicKeyForTests(pem: string | null) {
  ghlPublicKey = pem ?? GHL_ED25519_PUBLIC_KEY;
}

export const REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const FUTURE_SKEW_MS = 5 * 60 * 1000;

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

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const jsonOrNull = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Verify a delivery by the provider's own documented mechanism. */
export function verifySignature(provider: WebhookProvider, rawBody: string, headers: Headers, secret: string, now = Date.now()): { ok: boolean; reason?: string } {
  switch (provider) {
    case "stripe": {
      const header = headers.get("stripe-signature") ?? "";
      const pairs = header.split(",").map((kv) => kv.split("=") as [string, string]);
      const t = pairs.find(([k]) => k === "t")?.[1];
      const v1s = pairs.filter(([k]) => k === "v1").map(([, v]) => v);
      if (!t || v1s.length === 0) return { ok: false, reason: "missing stripe-signature" };
      if (Math.abs(now / 1000 - Number(t)) > 300) return { ok: false, reason: "timestamp outside tolerance" };
      const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
      return v1s.some((v) => safeEqual(expected, v)) ? { ok: true } : { ok: false, reason: "signature mismatch" };
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
    case "pipedrive": {
      const auth = headers.get("authorization") ?? "";
      if (!/^basic /i.test(auth)) return { ok: false, reason: "missing basic auth" };
      const given = Buffer.from(auth.slice(6).trim(), "base64").toString("utf8");
      return safeEqual(given, secret) ? { ok: true } : { ok: false, reason: "basic auth mismatch" };
    }
    case "attio": {
      const sig = headers.get("attio-signature") ?? headers.get("x-attio-signature") ?? "";
      if (!sig) return { ok: false, reason: "missing attio-signature" };
      const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
      return safeEqual(expected, sig.toLowerCase()) ? { ok: true } : { ok: false, reason: "signature mismatch" };
    }
    case "gohighlevel": {
      const sig = headers.get("x-ghl-signature") ?? "";
      if (!sig) return { ok: false, reason: "missing x-ghl-signature" };
      let valid = false;
      try {
        valid = verifyAsym(null, Buffer.from(rawBody, "utf8"), createPublicKey(ghlPublicKey), Buffer.from(sig, "base64"));
      } catch {
        valid = false;
      }
      if (!valid) return { ok: false, reason: "signature mismatch" };
      // The signature proves HighLevel sent it, not that it concerns THIS client.
      const location = str(obj(jsonOrNull(rawBody)).locationId);
      return location && safeEqual(location, secret.trim()) ? { ok: true } : { ok: false, reason: "location does not match this workspace" };
    }
  }
}

/** Refuse a verified delivery whose authenticated body timestamp is stale or in the future. */
export function replayProblem(provider: WebhookProvider, body: unknown, now = Date.now()): string | null {
  let at: number | null = null;
  if (provider === "pipedrive") {
    const t = num(obj(obj(body).meta).timestamp);
    if (t !== null) at = t < 1e12 ? t * 1000 : t;
  } else if (provider === "gohighlevel") {
    const raw = obj(body).timestamp;
    const t = typeof raw === "string" ? Date.parse(raw) : num(raw);
    if (t !== null && Number.isFinite(t)) at = t;
  } else {
    return null; // stripe and hubspot are checked in the signature; attio signs no timestamp
  }
  if (at === null) return "no timestamp in the delivery";
  if (now - at > REPLAY_WINDOW_MS) return "delivery older than the replay window";
  if (at - now > FUTURE_SKEW_MS) return "delivery timestamp is in the future";
  return null;
}

/**
 * Parse a provider payload into the neutral shape. Unknown event types parse
 * with `kind: null` and are stored, not acted on. `headers` supplies ids that
 * some providers put outside the body (Attio's Idempotency-Key).
 */
export function parseWebhook(provider: WebhookProvider, body: unknown, headers: Headers = new Headers()): ParsedWebhook | null {
  const b = obj(body);
  const now = new Date();
  const blank = { valueMinor: null, currency: null, cashCollectedMinor: null, externalRecordId: null, externalRecordUrl: null, externalDealId: null, externalPaymentId: null, contactEmail: null };
  switch (provider) {
    case "stripe": {
      const id = str(b.id);
      const type = str(b.type) ?? "";
      const o = obj(obj(b.data).object);
      if (!id) return null;
      const paid = type === "payment_intent.succeeded" || type === "invoice.paid" || type === "checkout.session.completed";
      const amount = num(o.amount_received ?? o.amount_paid ?? o.amount_total);
      return {
        externalId: id,
        eventType: type,
        kind: paid ? "won" : null,
        valueMinor: amount,
        currency: str(o.currency)?.toUpperCase() ?? null,
        cashCollectedMinor: paid ? amount : null,
        externalRecordId: str(o.id),
        externalRecordUrl: null,
        externalDealId: str(o.subscription) ?? str(o.invoice) ?? null,
        externalPaymentId: str(o.id),
        contactEmail: str(o.receipt_email) ?? str(obj(o.customer_details).email) ?? null,
        occurredAt: num(b.created) ? new Date(Number(b.created) * 1000) : now,
      };
    }
    case "hubspot": {
      const first = obj(Array.isArray(body) ? body[0] : body);
      const id = str(first.eventId) ?? str(first.objectId);
      if (!id) return null;
      const stage = str(first.propertyValue) ?? "";
      const won = /closedwon/i.test(stage);
      return {
        ...blank,
        externalId: id,
        eventType: str(first.subscriptionType) ?? "deal.propertyChange",
        kind: won ? "won" : /appointmentscheduled|meeting/i.test(stage) ? "booked_call" : stage ? "opportunity" : null,
        externalRecordId: str(first.objectId),
        externalDealId: str(first.objectId),
        occurredAt: num(first.occurredAt) ? new Date(Number(first.occurredAt)) : now,
      };
    }
    case "pipedrive": {
      const meta = obj(b.meta);
      const v2 = str(meta.version) === "2.0";
      const entity = str(v2 ? meta.entity : meta.object) ?? "deal";
      const current = obj(v2 ? b.data : (b.current ?? b.data));
      const recordId = str(v2 ? meta.entity_id : meta.id) ?? str(current.id);
      if (!recordId) return null;
      const eventId = v2 ? str(meta.id) : null;
      const status = entity === "deal" ? (str(current.status) ?? "") : "";
      const value = num(current.value);
      const ts = num(meta.timestamp);
      return {
        ...blank,
        externalId: eventId ?? `${str(meta.action) ?? "event"}:${recordId}:${str(meta.timestamp) ?? ""}`,
        eventType: `${entity}.${str(meta.action) ?? "updated"}`,
        kind: status === "won" ? "won" : status === "open" ? "opportunity" : null,
        valueMinor: value === null ? null : Math.round(value * 100),
        currency: str(current.currency) ?? null,
        externalRecordId: recordId,
        externalDealId: entity === "deal" ? recordId : null,
        occurredAt: ts ? new Date(ts < 1e12 ? ts * 1000 : ts) : now,
      };
    }
    case "attio": {
      // Attio delivers { webhook_id, events: [{ event_type, id: {...}, actor }] }:
      // ids only, no stage or value. Acting on them needs a record fetch through
      // the Attio API (the CRM sync, COM-04), so these are stored, not acted on.
      const events = Array.isArray(b.events) ? b.events.map(obj) : [];
      const key = headers.get("idempotency-key") ?? createHash("sha256").update(JSON.stringify(body)).digest("hex");
      if (!events.length && !str(b.webhook_id)) return null;
      const firstId = obj(events[0]?.id);
      return {
        ...blank,
        externalId: key,
        eventType: events.map((e) => str(e.event_type) ?? "unknown").join(",") || "unknown",
        kind: null,
        externalRecordId: str(firstId.record_id) ?? str(firstId.entry_id),
        occurredAt: now,
      };
    }
    case "gohighlevel": {
      const id = str(b.webhookId) ?? str(b.id);
      if (!id) return null;
      const type = str(b.type) ?? "unknown";
      const status = (str(b.status) ?? "").toLowerCase();
      const value = num(b.monetaryValue);
      const opportunityId = type.startsWith("Opportunity") ? str(b.id) : null;
      const at = typeof b.timestamp === "string" ? Date.parse(b.timestamp) : NaN;
      return {
        ...blank,
        externalId: id,
        eventType: type,
        kind: type === "OpportunityStatusUpdate" && status === "won" ? "won" : type === "OpportunityCreate" ? "opportunity" : type === "AppointmentCreate" ? "booked_call" : null,
        valueMinor: value === null ? null : Math.round(value * 100),
        externalRecordId: str(b.id),
        externalDealId: opportunityId,
        contactEmail: str(b.email),
        occurredAt: Number.isFinite(at) ? new Date(at) : now,
      };
    }
  }
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * Store the delivery and, when verified and mapped to a funnel event, record
 * the commercial event with CRM/payment provenance, atomically.
 */
export async function ingestWebhook(input: { provider: WebhookProvider; orgId: string; verified: boolean; rawBody: string; parsed: ParsedWebhook | null; reason?: string }) {
  if (!input.verified) {
    // Logged for the operator (a wrong secret shows up here), under a random
    // key: an unverified sender can never claim the provider's event id.
    await prisma.webhookEvent.create({
      data: {
        provider: input.provider,
        externalId: `unverified:${randomUUID()}`,
        orgId: input.orgId,
        eventType: input.parsed?.eventType ?? "unparsed",
        payload: input.rawBody.slice(0, 2_000),
        verified: false,
        error: input.reason ?? "unverified",
      },
    });
    return { stored: true, acted: false, reason: "unverified" as const };
  }
  if (!input.parsed) return { stored: false, acted: false, reason: "unparseable" as const };
  const parsed = input.parsed;
  // Event ids are unique per provider account, not across accounts, so the
  // dedupe key is scoped to the workspace.
  const externalId = `${input.orgId}:${parsed.externalId}`;

  try {
    return await prisma.$transaction(async (tx) => {
      const stored = await tx.webhookEvent.create({
        data: { provider: input.provider, externalId, orgId: input.orgId, eventType: parsed.eventType, payload: input.rawBody.slice(0, 20_000), verified: true },
      });
      if (!parsed.kind) {
        await tx.webhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date() } });
        return { stored: true, acted: false, reason: "no_funnel_mapping" as const };
      }
      // Join to an inquiry only when an operator has already recorded this
      // external deal id against one; never on a fuzzy name match.
      const prior = parsed.externalDealId
        ? await tx.commercialEvent.findFirst({ where: { orgId: input.orgId, externalDealId: parsed.externalDealId, inquiryId: { not: null } }, select: { inquiry: { select: { id: true, visitorId: true } } } })
        : null;
      const inquiry = prior?.inquiry ?? null;
      const org = await tx.organization.findUniqueOrThrow({ where: { id: input.orgId }, select: { currency: true } });
      const event = await tx.commercialEvent.create({
        data: {
          orgId: input.orgId,
          kind: parsed.kind,
          occurredAt: parsed.occurredAt,
          inquiryId: inquiry?.id ?? null,
          visitorId: inquiry?.visitorId ?? null,
          valueMinor: parsed.valueMinor ?? 0,
          currency: parsed.currency ?? org.currency,
          source: input.provider === "stripe" ? "payment" : "crm",
          externalProvider: input.provider,
          externalRecordId: parsed.externalRecordId,
          externalRecordUrl: parsed.externalRecordUrl,
          externalDealId: parsed.externalDealId,
          externalPaymentId: parsed.externalPaymentId,
          cashCollectedMinor: parsed.cashCollectedMinor,
          collectedAt: parsed.cashCollectedMinor ? parsed.occurredAt : null,
          evidenceBasis: "measured",
          // The provider proves the deal exists, not that content caused it.
          attribution: inquiry?.visitorId ? "associated" : "qualitative_only",
          note: `Recorded from ${input.provider} webhook ${parsed.eventType}`,
        },
      });
      await tx.webhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date() } });
      return { stored: true, acted: true, reason: "recorded" as const, eventId: event.id };
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { stored: true, acted: false, reason: "duplicate" as const };
    throw e;
  }
}
