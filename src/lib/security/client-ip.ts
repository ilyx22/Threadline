/**
 * The caller's IP address, from headers only a trusted proxy can set (SEC-03).
 *
 * X-Forwarded-For is a list the CLIENT can prepend to, so its first entry is
 * attacker-controlled. Rules, in order:
 *   - on Vercel, the platform overwrites X-Real-IP / X-Vercel-Forwarded-For with
 *     the connecting address, so those are used;
 *   - behind another proxy, TRUSTED_PROXY_HOPS=n takes the n-th address from
 *     the RIGHT of X-Forwarded-For (the one the outermost trusted proxy saw);
 *   - otherwise nothing is trusted and the result is null.
 * Callers that need a key use "unknown", which shares one bucket: safer than
 * letting a spoofed header grant a fresh bucket per request.
 */
export function clientIpFrom(h: Headers, env: Record<string, string | undefined> = process.env): string | null {
  const clean = (v: string | null | undefined) => {
    const s = (v ?? "").split(",")[0].trim();
    return /^[0-9a-fA-F:.]{2,45}$/.test(s) ? s : null;
  };
  if (env.VERCEL) return clean(h.get("x-vercel-forwarded-for")) ?? clean(h.get("x-real-ip"));
  const hops = Number(env.TRUSTED_PROXY_HOPS ?? 0);
  if (Number.isInteger(hops) && hops > 0) {
    const list = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return clean(list[list.length - hops]);
  }
  return null;
}
