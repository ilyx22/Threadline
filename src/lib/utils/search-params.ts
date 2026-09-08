/**
 * Search-param readers used by server components to turn a URL into repository
 * filters. Deliberately outside the client filter module: a function exported
 * from a `"use client"` file becomes a client reference and cannot be called
 * on the server.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function readFilter(params: RawSearchParams, key: string): string[] | undefined {
  const value = params[key];
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : [value];
  const cleaned = list.filter((v) => typeof v === "string" && v.trim().length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function readSingle(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  if (!value) return undefined;
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.trim().length > 0 ? first : undefined;
}

export function readNumber(params: RawSearchParams, key: string, fallback: number): number {
  const raw = readSingle(params, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readBool(params: RawSearchParams, key: string): boolean {
  const raw = readSingle(params, key);
  return raw === "1" || raw === "true";
}
