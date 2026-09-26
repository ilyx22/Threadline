import "server-only";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { importScriptBlocks, type ImportBlock } from "./scripts";

/**
 * Verbatim import of the sales wording that exists in the founder's working
 * documents. Every block below is copied exactly from the named draft; none
 * is composed here. They land as `draft` (the documents are marked
 * "DRAFT — BRANDING PENDING") and become usable only when a person approves
 * them in /admin/scripts. Until then the UI shows CANONICAL COPY IMPORT REQUIRED.
 */

const DOC_DISCOVERY = "Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Sales_Discovery_and_Content_Diagnosis.md";
const DOC_OBJECTIONS = "Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_Answer_and_Objection_Vault.md";
/** SOP 03, whose "Canonical operator script library" holds the founder-approved 8 September 2026 passages A–M. */
const DOC_LIBRARY = "Threadline Final Working Resources/02 SOPs/SOP_03_DIAGNOSIS_SALES_CALL_V14.md";

const LIBRARY_STAGE: Record<string, ImportBlock["stage"]> = {
  A: "objection", B: "close", C: "offer", D: "offer", E: "offer", F: "offer", G: "objection",
  H: "objection", I: "offer", J: "offer", K: "offer", L: "close", M: "offer",
};

/**
 * The approved library, one block per lettered passage, text exactly as in the
 * SOP. Imported as drafts like every other block: the wording is founder
 * approved in the source, and a person confirms that by approving it here.
 */
export function blocksFromVerbatimLibrary(markdown: string): ImportBlock[] {
  const at = markdown.indexOf("## Canonical operator script library");
  if (at < 0) return [];
  const parts = markdown.slice(at).split(/^## (?=[A-M]\. )/m).slice(1);
  return parts.map((part) => {
    const [headingLine, ...rest] = part.split("\n");
    const letter = headingLine.slice(0, 1);
    const title = headingLine.slice(3).trim();
    const key = `library.${letter.toLowerCase()}_` + title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50);
    return { key, stage: LIBRARY_STAGE[letter] ?? "offer", context: `Approved library ${letter}: ${title}`, exactText: rest.join("\n").trim() };
  }).filter((b) => b.exactText.length > 0);
}

/** Split the discovery document into its numbered sections, keeping the text exactly as written. */
export function blocksFromDiscoveryDoc(markdown: string): ImportBlock[] {
  const sections = markdown.split(/^## /m).slice(1);
  const stageFor = (heading: string): ImportBlock["stage"] => {
    if (/objective|current machine|economics|content diagnosis/i.test(heading)) return "discovery";
    if (/consequence|desired state|reframe/i.test(heading)) return "diagnosis";
    if (/demo|service explanation/i.test(heading)) return "offer";
    if (/scope|close/i.test(heading)) return "close";
    return "discovery";
  };
  return sections.map((sec) => {
    const [headingLine, ...rest] = sec.split("\n");
    const heading = headingLine.trim();
    const key = "discovery." + heading.toLowerCase().replace(/^\d+\.\s*/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return { key, stage: stageFor(heading), context: `Discovery call — ${heading}`, exactText: rest.join("\n").trim() };
  }).filter((b) => b.exactText.length > 0);
}

/** Approved answers from the objection vault table: one block per row, the exact "Approved answer" cell. */
export function blocksFromObjectionDoc(markdown: string): ImportBlock[] {
  const rows = markdown.split("\n").filter((l) => l.startsWith("| '") || l.startsWith("| ‘"));
  return rows.map((row) => {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    const [question, , answer] = cells;
    const key = "objection." + question.replace(/['‘’?]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
    return { key, stage: "objection" as const, context: `Objection — ${question}`, exactText: answer };
  }).filter((b) => b.exactText && b.exactText.length > 0);
}

export async function importCanonicalDrafts(root = process.cwd()) {
  const results: { source: string; created: number; unchanged: number; missing?: boolean }[] = [];
  for (const [file, parser] of [[DOC_DISCOVERY, blocksFromDiscoveryDoc], [DOC_OBJECTIONS, blocksFromObjectionDoc], [DOC_LIBRARY, blocksFromVerbatimLibrary]] as const) {
    const full = path.join(root, file);
    if (!existsSync(full)) { results.push({ source: file, created: 0, unchanged: 0, missing: true }); continue; }
    const blocks = parser(readFileSync(full, "utf8"));
    const r = await importScriptBlocks(blocks, `${path.basename(file)} (draft — branding pending), imported verbatim ${new Date().toISOString().slice(0, 10)}`);
    results.push({ source: file, ...r });
  }
  return results;
}
