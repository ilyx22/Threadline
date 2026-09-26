import { randomUUID } from "node:crypto";
import { reportError } from "@/lib/log";
import "server-only";
import { z } from "zod";
import { AuthError } from "@/lib/auth/guard";
import { AiError } from "@/lib/ai/provider";
import { RateLimitError } from "@/lib/security/rate-limit";
import { StorageError } from "@/lib/storage";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * Uniform server action results.
 *
 * Actions never throw across the RSC boundary — an unhandled throw renders a
 * generic error digest and loses the message. Instead every action returns a
 * discriminated result the client can render precisely, while genuinely
 * unexpected errors are logged server-side and reported as such.
 */

export type ActionOk<T = undefined> = { ok: true; data: T; message?: string };
export type ActionErr = {
  ok: false;
  error: string;
  code: "auth" | "validation" | "workflow" | "rate_limit" | "ai" | "storage" | "not_found" | "unknown";
  fieldErrors?: Record<string, string>;
};
export type ActionResult<T = undefined> = ActionOk<T> | ActionErr;

export function ok<T>(data: T, message?: string): ActionOk<T> {
  return { ok: true, data, message };
}

export function okVoid(message?: string): ActionOk<undefined> {
  return { ok: true, data: undefined, message };
}

export function err(
  error: string,
  code: ActionErr["code"] = "unknown",
  fieldErrors?: Record<string, string>,
): ActionErr {
  return { ok: false, error, code, fieldErrors };
}

/**
 * Wrap an action body, translating known error types into structured results.
 * Next.js control-flow signals (redirect, notFound) must pass through untouched.
 */
export async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (isNextControlFlow(error)) throw error;

    if (error instanceof z.ZodError) {
      return err("Please check the highlighted fields.", "validation", zodFieldErrors(error));
    }
    if (error instanceof AuthError) {
      return err(
        "You do not have permission to do that.",
        "auth",
      );
    }
    if (error instanceof WorkflowError) {
      return err(error.message, "workflow");
    }
    if (error instanceof RateLimitError) {
      return err(error.message, "rate_limit");
    }
    if (error instanceof AiError) {
      return err(error.message, "ai");
    }
    if (error instanceof StorageError) {
      return err(error.message, "storage");
    }

    // A reference the person can quote to support; the full error goes to the
    // log and the error tracker, redacted, never to the browser.
    const ref = randomUUID().slice(0, 8);
    await reportError(error, { event: "action.unhandled", ref });
    return err(
      `Something went wrong on our side. The action was not completed. (Reference ${ref})`,
      "unknown",
    );
  }
}

/** Next.js signals redirect/notFound by throwing; those must not be swallowed. */
function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest === "NEXT_NOT_FOUND")
  );
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= friendlyMessage(issue);
  }
  return out;
}

/**
 * Translate a schema issue into something a person can act on.
 *
 * `parseForm` drops empty strings, so a blank required field arrives as
 * `undefined` and Zod describes it as "expected string, received undefined".
 * That is accurate and useless: it names a type, not the thing the reader has
 * to do. Every required field in the product would otherwise show it.
 */
function friendlyMessage(issue: z.core.$ZodIssue): string {
  const missing =
    issue.code === "invalid_type" && /received undefined|received null/i.test(issue.message);
  if (!missing) return issue.message;

  const field = issue.path[issue.path.length - 1];
  const label = typeof field === "string" ? humanise(field) : null;
  return label ? `${label} is required.` : "This field is required.";
}

/** `periodStart` -> "Period start". Used only for error copy. */
function humanise(field: string): string {
  const words = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Parse FormData through a Zod schema, coercing empty strings to undefined. */
export function parseForm<T>(schema: z.ZodType<T>, formData: FormData): T {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      raw[key] = value;
      continue;
    }
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (trimmed === "") continue;

    // Repeated keys (checkbox groups, multi-selects) become arrays.
    if (key in raw) {
      const existing = raw[key];
      raw[key] = Array.isArray(existing) ? [...existing, trimmed] : [existing, trimmed];
    } else {
      raw[key] = trimmed;
    }
  }
  return schema.parse(raw);
}

/** Zod helper: a textarea of one-per-line values becomes a string array. */
export const linesField = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  );

/** Zod helper: comma-separated values become a string array. */
export const commaField = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean),
  );

export const optionalDate = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  });

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === "on" || v === "true" || v === true);

/**
 * Sanitise free text before storage.
 *
 * The app never renders user text as HTML, so this is defence in depth rather
 * than the primary control: it strips control characters and caps length.
 */
export function cleanText(value: string, maxLength = 20_000) {
  return value
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("")
    .slice(0, maxLength)
    .trim();
}

export function cleanUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
