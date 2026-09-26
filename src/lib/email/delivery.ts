import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";

/**
 * Delivery events and suppression (NOT-02).
 *
 * Resend signs webhooks the Svix way: headers `svix-id`, `svix-timestamp` and
 * `svix-signature` ("v1,<base64>" entries, space separated); the signed
 * content is `<id>.<timestamp>.<body>`, HMAC-SHA256 with the base64 key after
 * the `whsec_` prefix. Deliveries older than five minutes are refused.
 *
 * A permanent bounce or a spam complaint suppresses the address, and nothing
 * more is sent to it until a person lifts the suppression. A temporary bounce
 * or a delay is recorded, not suppressed.
 */
const TOLERANCE_S = 300;

export function verifySvix(body: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, secret: string, now = Date.now()) {
  if (!headers.id || !headers.timestamp || !headers.signature || !secret.startsWith("whsec_")) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > TOLERANCE_S) return false;
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${body}`).digest();
  return headers.signature.split(" ").some((entry) => {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export async function isSuppressed(email: string) {
  const row = await prisma.emailSuppression.findUnique({ where: { email: email.trim().toLowerCase() } });
  return Boolean(row && !row.liftedAt);
}

export async function suppress(email: string, reason: "bounce" | "complaint" | "manual", detail?: string | null) {
  const address = email.trim().toLowerCase();
  await prisma.emailSuppression.upsert({
    where: { email: address },
    create: { email: address, reason, detail: detail?.slice(0, 500) ?? null },
    update: { reason, detail: detail?.slice(0, 500) ?? null, liftedAt: null },
  });
}

export async function liftSuppression(email: string) {
  await prisma.emailSuppression.updateMany({ where: { email: email.trim().toLowerCase(), liftedAt: null }, data: { liftedAt: new Date() } });
}

type ResendEvent = { type?: string; created_at?: string; data?: { email_id?: string; to?: string[] | string; bounce?: { type?: string; subType?: string; message?: string } } };

/** Apply one verified Resend event. Idempotent: repeating an event changes nothing further. */
export async function applyResendEvent(event: ResendEvent) {
  const providerId = event.data?.email_id;
  const to = (Array.isArray(event.data?.to) ? event.data!.to : event.data?.to ? [event.data.to] : []).map((t) => String(t).toLowerCase());
  const at = event.created_at ? new Date(event.created_at) : new Date();
  const where = providerId ? { providerId } : null;
  switch (event.type) {
    case "email.delivered":
      if (where) await prisma.emailMessage.updateMany({ where: { ...where, deliveredAt: null }, data: { deliveredAt: at } });
      return { applied: true, suppressed: 0 };
    case "email.delivery_delayed":
      if (where) await prisma.emailMessage.updateMany({ where, data: { deliveryError: "Delivery delayed by the receiving server." } });
      return { applied: true, suppressed: 0 };
    case "email.bounced": {
      const permanent = (event.data?.bounce?.type ?? "").toLowerCase() === "permanent";
      const detail = [event.data?.bounce?.type, event.data?.bounce?.subType, event.data?.bounce?.message].filter(Boolean).join(": ");
      if (where) await prisma.emailMessage.updateMany({ where, data: { bouncedAt: at, deliveryError: detail.slice(0, 500) || "Bounced" } });
      if (permanent) for (const t of to) await suppress(t, "bounce", detail);
      return { applied: true, suppressed: permanent ? to.length : 0 };
    }
    case "email.complained":
      if (where) await prisma.emailMessage.updateMany({ where, data: { complainedAt: at } });
      for (const t of to) await suppress(t, "complaint", "Marked as spam by the recipient");
      return { applied: true, suppressed: to.length };
    default:
      return { applied: false, suppressed: 0 };
  }
}
