import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ingestLead, LEAD_CHANNELS, sourceForToken } from "@/lib/leads";
import { callerKey, LIMITS, rateLimitAsync } from "@/lib/security/rate-limit";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/inbound/leads (AI-06): authorised inbound lead capture for one
 * workspace, from its website form, a Zapier step or a batch import.
 *
 *   Authorization: Bearer tl_in_…   (created under Pipeline → Inbound sources)
 *   Body: one lead, or { leads: [...] } with up to 200.
 *   Lead: { name, email?, company?, channel?, message?, profileUrl?, externalRef?, occurredAt? }
 *
 * A repeated externalRef is ignored, so a sender can retry safely. Nothing is
 * sent back to the lead.
 */
const lead = z.object({
  name: z.string().min(1).max(200),
  email: z.string().max(320).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  channel: z.enum(LEAD_CHANNELS).optional(),
  message: z.string().max(10_000).optional().nullable(),
  profileUrl: z.string().max(600).optional().nullable(),
  externalRef: z.string().max(300).optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
});
const body = z.union([z.object({ leads: z.array(lead).min(1).max(200) }), lead]);

export async function POST(req: NextRequest) {
  const limited = await rateLimitAsync(await callerKey("inbound"), LIMITS.webhook);
  if (!limited.ok) return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": String(limited.retryAfterSeconds) } });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const source = token ? await sourceForToken(token) : null;
  if (!source) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const text = await req.text();
  if (text.length > 2_000_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid lead", issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });

  const leads = "leads" in parsed.data ? parsed.data.leads : [parsed.data];
  const results = [];
  for (const l of leads) {
    const r = await ingestLead(
      source.orgId,
      { ...l, channel: l.channel ?? (source.channel as (typeof LEAD_CHANNELS)[number]), occurredAt: l.occurredAt ? new Date(l.occurredAt) : null },
      { source: `inbound:${source.label}` },
    );
    results.push({ inquiryId: r.inquiryId, created: r.created, merged: r.merged, duplicate: r.duplicate });
  }
  log("info", "inbound.leads", { orgId: source.orgId, sourceId: source.id, count: results.length, created: results.filter((r) => r.created).length });
  return NextResponse.json({ ok: true, results });
}
