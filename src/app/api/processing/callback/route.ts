import { NextResponse, type NextRequest } from "next/server";
import { applyCallback, parseCallback, processingConfig, verifySignature } from "@/lib/processing";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/processing/callback (FILE-05). The processing worker reports a
 * task's progress here. The signature is checked against the raw body before
 * anything is parsed; a repeated or late delivery is accepted but changes
 * nothing, so the worker can retry freely.
 */
export async function POST(req: NextRequest) {
  const cfg = processingConfig();
  if (!cfg) return NextResponse.json({ error: "processing is not configured" }, { status: 503 });
  const body = await req.text();
  if (body.length > 4_000_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (!verifySignature(body, req.headers.get("x-threadline-signature"), cfg.secret)) {
    log("warn", "processing.callback.unverified", {});
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const event = parseCallback(raw);
  if (!event) return NextResponse.json({ error: "invalid event" }, { status: 400 });
  const result = await applyCallback(event);
  log("info", "processing.callback", { taskId: event.taskId, status: event.status, applied: result.applied });
  return NextResponse.json({ ok: true, applied: result.applied });
}
