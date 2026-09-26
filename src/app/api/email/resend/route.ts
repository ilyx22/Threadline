import { NextResponse, type NextRequest } from "next/server";
import { applyResendEvent, verifySvix } from "@/lib/email/delivery";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/email/resend (NOT-02): Resend delivery webhooks (delivered,
 * delayed, bounced, complained). Configure in Resend with the signing secret
 * in RESEND_WEBHOOK_SECRET. The signature is checked on the raw body first.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
  if (!secret) return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET is not configured" }, { status: 503 });
  const body = await req.text();
  if (body.length > 1_000_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  const ok = verifySvix(body, { id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature") }, secret);
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const result = await applyResendEvent(event as Parameters<typeof applyResendEvent>[0]);
  log("info", "email.webhook", { type: (event as { type?: string }).type, applied: result.applied, suppressed: result.suppressed });
  return NextResponse.json({ ok: true });
}
