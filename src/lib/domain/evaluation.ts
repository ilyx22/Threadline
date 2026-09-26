import { createHash } from "node:crypto";

/**
 * Held-out evaluation of the Judge (LRN-03).
 *
 * Calibration looks at every example the Judge has scored; evaluation keeps a
 * fixed share of examples back (chosen by a hash of the id, so the split never
 * drifts), scores the Judge only on those, and compares variants (rubric
 * version and model) on the same held-out set. Two things make it honest:
 *
 *   1. Leakage check: the text the Judge saw must not contain the outcome it
 *      is being checked against (the view, like or comment counts, or words
 *      that say how it performed). A leaked example is excluded, and counted.
 *   2. Ranking, not agreement: the measure is the chance that a piece which
 *      actually outperformed was scored above one that did not (AUC). 0.5 is a
 *      coin; below 0.5 is worse than a coin.
 *
 * A variant is promoted only by a person, and the previous one can be put
 * back; nothing here changes which rubric is in use.
 */
export type EvalPair = { exampleId: string; outperformed: boolean; overall: number; variant: string; subject: string; outcome: { views: number; likes: number; comments: number } };

export function isHeldOut(id: string, fraction = 0.3, salt = "threadline-eval-v1") {
  const h = createHash("sha256").update(`${salt}:${id}`).digest();
  return h.readUInt32BE(0) / 0xffffffff < fraction;
}

const fmt = (n: number) => [String(n), n.toLocaleString("en-GB"), n >= 1000 ? `${Math.round(n / 100) / 10}k` : null, n >= 1_000_000 ? `${Math.round(n / 100_000) / 10}m` : null].filter(Boolean) as string[];

/** Outcome facts that appear in the text the Judge saw. Empty means no leak. */
export function leakage(subject: string, outcome: { views: number; likes: number; comments: number }) {
  const text = subject.toLowerCase();
  const found: string[] = [];
  for (const [name, n] of Object.entries(outcome)) {
    if (n < 50) continue; // small numbers collide with ordinary text
    for (const f of fmt(n)) if (new RegExp(`(^|[^0-9.,])${f.replace(/[.,]/g, (c) => `\\${c}`)}([^0-9]|$)`, "i").test(text)) found.push(`${name} ${f}`);
  }
  if (/\b(went viral|outperformed|underperformed|top[- ]performing|flopped)\b/i.test(subject)) found.push("outcome wording");
  return [...new Set(found)];
}

/** Probability that a random outperformer scored above a random other piece (ties count half). */
export function auc(pairs: { outperformed: boolean; overall: number }[]) {
  const pos = pairs.filter((p) => p.outperformed).map((p) => p.overall);
  const neg = pairs.filter((p) => !p.outperformed).map((p) => p.overall);
  if (!pos.length || !neg.length) return null;
  let wins = 0;
  for (const a of pos) for (const b of neg) wins += a > b ? 1 : a === b ? 0.5 : 0;
  return Math.round((wins / (pos.length * neg.length)) * 1000) / 1000;
}

export type VariantResult = { variant: string; heldOut: number; leaked: number; outperformers: number; auc: number | null; sufficient: boolean };

export const EVAL_MINIMUM = 12;

/** Evaluate every variant on the held-out share only, excluding leaked examples. */
export function evaluateVariants(pairs: EvalPair[], fraction = 0.3): VariantResult[] {
  const held = pairs.filter((p) => isHeldOut(p.exampleId, fraction));
  const variants = [...new Set(held.map((p) => p.variant))];
  return variants.map((variant) => {
    const mine = held.filter((p) => p.variant === variant);
    const clean = mine.filter((p) => leakage(p.subject, p.outcome).length === 0);
    const a = auc(clean);
    const outperformers = clean.filter((p) => p.outperformed).length;
    return { variant, heldOut: clean.length, leaked: mine.length - clean.length, outperformers, auc: a, sufficient: clean.length >= EVAL_MINIMUM && outperformers > 0 && outperformers < clean.length };
  });
}
