/**
 * R2: split a knowledge document into retrieval chunks.
 *
 * Markdown headings start a new section and travel with every chunk cut from
 * it, so a retrieved chunk still says what it is about. Long sections are cut
 * on paragraph boundaries; a single paragraph longer than the cap is cut on
 * sentences. Pure, so it is tested without a database.
 */
export const KNOWLEDGE_KINDS = [
  "sop",
  "framework",
  "example_winning",
  "example_losing",
  "course_note",
  "objection_bank",
  "style_rule",
] as const;
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number];

export const KNOWLEDGE_KIND_LABEL: Record<KnowledgeKind, string> = {
  sop: "SOP",
  framework: "Framework",
  example_winning: "Example (winning)",
  example_losing: "Example (losing)",
  course_note: "Course note",
  objection_bank: "Objection bank",
  style_rule: "Style rule",
};

export const KNOWLEDGE_PLATFORMS = ["all", "linkedin", "youtube", "tiktok", "instagram", "x"] as const;

export type Chunk = { ordinal: number; heading: string | null; text: string };

const MAX_CHARS = 1500;

export function chunkDocument(body: string, maxChars = MAX_CHARS): Chunk[] {
  const sections: { heading: string | null; lines: string[] }[] = [{ heading: null, lines: [] }];
  for (const line of body.replace(/\r\n?/g, "\n").split("\n")) {
    const h = /^#{1,4}\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) sections.push({ heading: h[1].trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const paragraphs = section.lines
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .flatMap((p) => (p.length > maxChars ? splitLong(p, maxChars) : [p]));
    let current = "";
    for (const p of paragraphs) {
      if (current && current.length + p.length + 2 > maxChars) {
        chunks.push({ ordinal: chunks.length, heading: section.heading, text: current });
        current = "";
      }
      current = current ? `${current}\n\n${p}` : p;
    }
    if (current) chunks.push({ ordinal: chunks.length, heading: section.heading, text: current });
  }
  return chunks;
}

function splitLong(paragraph: string, maxChars: number): string[] {
  const sentences = paragraph.match(/[^.!?\n]+[.!?]*\s*/g) ?? [paragraph];
  const out: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current && current.length + s.length > maxChars) {
      out.push(current.trim());
      current = "";
    }
    // A "sentence" with no punctuation longer than the cap is cut hard.
    if (s.length > maxChars) {
      for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars).trim());
      continue;
    }
    current += s;
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

/**
 * Turn free text (a task, a title, the client's pains) into an OR tsquery.
 * Only plain word characters reach Postgres; everything else is dropped.
 */
export function toOrQuery(text: string, maxTerms = 24): string {
  const seen = new Set<string>();
  for (const word of text.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []) {
    if (STOP.has(word)) continue;
    seen.add(word);
    if (seen.size >= maxTerms) break;
  }
  return [...seen].join(" | ");
}

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "was", "but", "not",
  "have", "has", "they", "their", "them", "what", "when", "how", "who", "why", "will", "can",
  "into", "about", "more", "than", "our", "out", "all", "one", "its", "his", "her",
  "to", "an", "of", "in", "on", "is", "it", "be", "as", "at", "by", "or", "if", "we", "me", "my",
  "do", "so", "up", "no", "us", "s",
]);
