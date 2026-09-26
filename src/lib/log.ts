/**
 * Structured, redacted logging and error reporting (INF-07, INF-10).
 *
 * One JSON object per line on stdout/stderr, which Vercel's log drain and any
 * collector parse without configuration. Every entry carries a level, an event
 * name and whatever correlation ids the caller has (requestId, orgId, userId,
 * jobId). Values under keys that look secret are replaced, and email addresses
 * are masked, before anything is written.
 *
 * `reportError` additionally sends the error to an error tracker when
 * ERROR_REPORTING_DSN holds a Sentry-format DSN (Sentry, GlitchTip and other
 * compatible services accept the same envelope). It never throws and never
 * blocks longer than two seconds.
 */
type Fields = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

const SECRET_KEY = /pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|dsn|sealed|credential|signature/i;
const EMAIL = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (typeof value === "string") return value.replace(EMAIL, "$1***@$2").slice(0, 4000);
  if (value instanceof Error) return { name: value.name, message: redact(value.message, depth + 1), stack: value.stack?.split("\n").slice(0, 8).join("\n") };
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    return out;
  }
  return value;
}

export function log(level: Level, event: string, fields: Fields = {}) {
  if (level === "debug" && process.env.LOG_DEBUG !== "true") return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...(redact(fields) as Fields) });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

type Dsn = { endpoint: string; key: string };
export function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\/+/, "").split("/").pop();
    if (!u.username || !project) return null;
    const base = u.pathname.replace(/\/[^/]*$/, "");
    return { endpoint: `${u.protocol}//${u.host}${base}/api/${project}/envelope/`, key: u.username };
  } catch {
    return null;
  }
}

/** Log an error and, when configured, send it to the error tracker. */
export async function reportError(error: unknown, context: Fields = {}, fetchImpl: typeof fetch = fetch) {
  log("error", "error", { ...context, error });
  const dsn = parseDsn(process.env.ERROR_REPORTING_DSN);
  if (!dsn) return;
  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    environment: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: { values: [{ type: err.name, value: redact(err.message) as string, stacktrace: { frames: (err.stack ?? "").split("\n").slice(1, 20).reverse().map((l) => ({ function: l.trim() })) } }] },
    extra: redact(context),
  };
  const body = `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}`;
  try {
    await fetchImpl(dsn.endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope", "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=threadline/1.0` },
      body,
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    log("warn", "error_reporting.unreachable");
  }
}
