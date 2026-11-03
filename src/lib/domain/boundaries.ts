/**
 * Brand Brain boundaries checked after generation (DR-19).
 *
 * Banned topics and phrases to avoid are sent to the model as instructions,
 * but an instruction is not a guarantee. Before a script or package can be
 * approved its text is checked against both lists, so nothing that names a
 * banned topic or uses an avoided phrase reaches a client's audience without a
 * person changing it first. The check is literal (whole words, any case): it
 * catches the words the client gave us, not every paraphrase, which is why a
 * person still reviews every piece.
 */
export type Boundaries = { bannedTopics: string[]; phrasesAvoided: string[] };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split "Politics, religion / crypto or NFTs" into the separate terms a person would mean. */
export function boundaryTerms(entries: string[]): string[] {
  const terms = entries
    .flatMap((e) => e.split(/[,;/\n]| and | or /i))
    .map((t) => t.trim().replace(/^["'“”‘’]+|["'“”‘’.!?]+$/g, "").trim())
    .filter((t) => t.length >= 3);
  return [...new Set(terms.map((t) => t.toLowerCase()))];
}

function hits(text: string, terms: string[]): string[] {
  return terms.filter((t) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(t).replace(/\s+/g, "\\s+")}(?![\\p{L}\\p{N}])`, "iu").test(text));
}

/** Sentences a reviewer can act on. Empty means clear. */
export function boundaryProblems(text: string, b: Boundaries): string[] {
  const problems: string[] = [];
  const topics = hits(text, boundaryTerms(b.bannedTopics));
  if (topics.length) problems.push(`This touches a banned topic in the Brand Brain: ${topics.join(", ")}. Remove it, or change the Brand Brain if the client has agreed.`);
  const phrases = hits(text, boundaryTerms(b.phrasesAvoided));
  if (phrases.length) problems.push(`This uses phrases the client avoids: ${phrases.join(", ")}.`);
  return problems;
}
