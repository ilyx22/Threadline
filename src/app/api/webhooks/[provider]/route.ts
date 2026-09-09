import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { readCredential } from "@/lib/integrations/credentials";
import { ingestWebhook, parseWebhook, verifySignature, WEBHOOK_PROVIDERS, type WebhookProvider } from "@/lib/integrations/webhooks";
import { rateLimitAsync, LIMITS } from "@/lib/security/rate-limit";

/**
 * POST /api/webhooks/{provider}?org={orgId}
 *
 * The org is named in the URL each workspace registers with its provider;
 * the secret that proves the sender is the one stored (encrypted) for that
 * workspace and provider. Nothing about the body is trusted until the
 * signature checks out. Always 200 to a verified sender, 202 for a stored
 * but unverified delivery (so the provider does not retry forever), 404 for
 * an unknown provider or workspace.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!(WEBHOOK_PROVIDERS as readonly string[]).includes(provider)) return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  const orgId = req.nextUrl.searchParams.get("org") ?? "";
  const org = orgId ? await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } }) : null;
  if (!org) return NextResponse.json({ error: "unknown workspace" }, { status: 404 });

  const limit = await rateLimitAsync(`webhook:${provider}:${org.id}`, LIMITS.webhook);
  if (!limit.ok) return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });

  const rawBody = await req.text();
  const secret = await readCredential(org.id, provider, "webhook_secret").catch(() => null);
  const headers = new Headers(req.headers);
  headers.set("x-threadline-request-uri", req.nextUrl.toString());
  const verification = secret ? verifySignature(provider as WebhookProvider, rawBody, headers, secret) : { ok: false, reason: "no webhook secret stored for this workspace" };

  let body: unknown = null;
  try { body = JSON.parse(rawBody); } catch { body = null; }
  const parsed = body ? parseWebhook(provider as WebhookProvider, body) : null;
  const result = await ingestWebhook({ provider: provider as WebhookProvider, orgId: org.id, verified: verification.ok, rawBody, parsed, reason: verification.ok ? undefined : verification.reason });
  return NextResponse.json({ received: true, outcome: result.reason }, { status: verification.ok ? 200 : 202 });
}
