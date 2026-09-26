/**
 * AI run cost and budgets (AI-08).
 *
 * Prices are configuration, not constants in code: AI_PRICE_INPUT_PER_MTOK and
 * AI_PRICE_OUTPUT_PER_MTOK in US dollars per million tokens for the model in
 * use. With no price configured the cost is recorded as unknown (null) rather
 * than guessed. Demo (mock) runs cost nothing and are marked as demo.
 */
export function costMicroUsd(inputTokens: number, outputTokens: number, env: Record<string, string | undefined> = process.env): number | null {
  const pin = Number(env.AI_PRICE_INPUT_PER_MTOK);
  const pout = Number(env.AI_PRICE_OUTPUT_PER_MTOK);
  if (!Number.isFinite(pin) || !Number.isFinite(pout) || env.AI_PRICE_INPUT_PER_MTOK === undefined || env.AI_PRICE_OUTPUT_PER_MTOK === undefined) return null;
  // dollars per million tokens = micro-dollars per token
  return Math.round(inputTokens * pin + outputTokens * pout);
}

export function monthStartUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
