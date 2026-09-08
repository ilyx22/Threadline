import type { z } from "zod";

/**
 * Typed access to JSON-encoded String columns.
 *
 * The schema stores structured values as JSON strings for provider portability
 * (docs/ARCHITECTURE.md ADR-001). These helpers are the only place that parses
 * them, so a malformed or legacy value degrades to a safe default instead of
 * throwing inside a React Server Component and blanking a page.
 */

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Parse and validate against a Zod schema, falling back on any failure. */
export function parseWith<T>(
  value: string | null | undefined,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (!value) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(value));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export function parseStringArray(value: string | null | undefined): string[] {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is string => typeof v === "string");
}

export function parseRecord(value: string | null | undefined): Record<string, unknown> {
  const parsed = parseJson<unknown>(value, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as Record<string, unknown>;
}

export function parseNumberRecord(value: string | null | undefined): Record<string, number> {
  const raw = parseRecord(value);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function stringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function stringifyArray(value: readonly string[] | null | undefined): string {
  return JSON.stringify(Array.isArray(value) ? value.filter(Boolean) : []);
}

/** Split a textarea of one-per-line values into a clean array. */
export function linesToArray(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function arrayToLines(value: readonly string[] | null | undefined): string {
  return (value ?? []).join("\n");
}
