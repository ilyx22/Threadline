/**
 * Claim checks on packaging (DEL-05).
 *
 * Captions, titles and descriptions are where numbers and promises slip in
 * after the script was checked. A package may repeat a figure only when the
 * same figure appears in the piece's script and the script's claims are
 * verified; guarantee language is refused outright, because outcomes are
 * never promised. The check is pure so it can be tested and shown before
 * approval.
 */
const FIGURE = /(?:[£$€]\s?\d[\d,.]*\s?(?:k|m|bn)?|\b\d[\d,.]*\s?(?:%|x\b|k\b|m\b|bn\b)|\b\d[\d,.]*\s+(?:clients|customers|leads|calls|days|weeks|months|hours|views|followers|deals|times)\b)/gi;
const GUARANTEE = /\b(guarantee[ds]?|risk[- ]free|money[- ]back|proven to|always works|100% (?:success|results)|#1\b|number one)\b/gi;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/,/g, "").trim();

export function figuresIn(text: string) {
  return [...new Set((text.match(FIGURE) ?? []).map(norm))];
}

export function guaranteesIn(text: string) {
  return [...new Set((text.match(GUARANTEE) ?? []).map((g) => g.toLowerCase()))];
}

/** What stops a package being approved, as sentences a reviewer can act on. Empty means clear. */
export function packageClaimProblems(packageText: string, script: { text: string; claimsVerified: boolean } | null): string[] {
  const problems: string[] = [];
  const guarantees = guaranteesIn(packageText);
  if (guarantees.length) problems.push(`Remove promise language: ${guarantees.join(", ")}.`);
  const figures = figuresIn(packageText);
  if (!figures.length) return problems;
  if (!script) {
    problems.push(`These figures have no script behind them to verify: ${figures.join(", ")}.`);
    return problems;
  }
  const backed = new Set(figuresIn(script.text));
  const unbacked = figures.filter((f) => !backed.has(f));
  if (unbacked.length) problems.push(`These figures are not in the script: ${unbacked.join(", ")}. Add and verify them there, or remove them.`);
  else if (!script.claimsVerified) problems.push(`The script's claims are not verified yet, and the packaging repeats ${figures.join(", ")}. Verify them on the script first.`);
  return problems;
}
