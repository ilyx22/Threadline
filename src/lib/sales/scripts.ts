import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";

/**
 * Canonical sales scripts.
 *
 * A block is an exact piece of wording with a stable key, a version and a
 * checksum. AI may SELECT a block for a moment in a call; it may not
 * paraphrase one. When a block is used on a call the exact text and version
 * are snapshotted against the call, so what was said is what the record says.
 *
 * Only `approved` blocks are offered. Blocks imported from draft documents
 * arrive as `draft` with their provenance and stay unusable until a person
 * approves them — the UI labels this state CANONICAL COPY IMPORT REQUIRED.
 */

export const SCRIPT_STAGES = ["outreach", "research_call", "discovery", "diagnosis", "offer", "objection", "close", "kickoff"] as const;
export type ScriptStage = (typeof SCRIPT_STAGES)[number];

export const checksumOf = (text: string) => createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");

export async function listScripts(opts: { stage?: ScriptStage; includeRetired?: boolean } = {}) {
  return prisma.salesScript.findMany({
    where: { ...(opts.stage ? { stage: opts.stage } : {}), ...(opts.includeRetired ? {} : { status: { not: "retired" } }) },
    orderBy: [{ stage: "asc" }, { key: "asc" }, { version: "desc" }],
  });
}

/** The current usable block per key: the highest approved version. */
export async function approvedScripts(stage?: ScriptStage) {
  const rows = await prisma.salesScript.findMany({ where: { status: "approved", ...(stage ? { stage } : {}) }, orderBy: [{ key: "asc" }, { version: "desc" }] });
  const byKey = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!byKey.has(r.key)) byKey.set(r.key, r);
  return [...byKey.values()];
}

export async function createScriptVersion(input: { key: string; stage: ScriptStage; context: string; exactText: string; provenance: string }) {
  const latest = await prisma.salesScript.findFirst({ where: { key: input.key }, orderBy: { version: "desc" }, select: { version: true } });
  return prisma.salesScript.create({
    data: {
      key: input.key,
      version: (latest?.version ?? 0) + 1,
      stage: input.stage,
      context: input.context,
      exactText: input.exactText,
      checksum: checksumOf(input.exactText),
      provenance: input.provenance,
      status: "draft",
    },
  });
}

/** Approving a version retires the previously approved one for the same key. */
export async function approveScript(id: string) {
  const row = await prisma.salesScript.findUniqueOrThrow({ where: { id } });
  if (row.checksum !== checksumOf(row.exactText)) throw new Error("Checksum does not match the text; refusing to approve altered wording.");
  await prisma.salesScript.updateMany({ where: { key: row.key, status: "approved", id: { not: id } }, data: { status: "retired", retiredAt: new Date() } });
  return prisma.salesScript.update({ where: { id }, data: { status: "approved", approvedAt: new Date() } });
}

export async function retireScript(id: string) {
  return prisma.salesScript.update({ where: { id }, data: { status: "retired", retiredAt: new Date() } });
}

/** Snapshot the exact block against a call. Refuses anything not approved. */
export async function snapshotScriptForCall(callId: string, scriptId: string) {
  const script = await prisma.salesScript.findUniqueOrThrow({ where: { id: scriptId } });
  if (script.status !== "approved") throw new Error("Only an approved script block can be used on a call.");
  if (script.checksum !== checksumOf(script.exactText)) throw new Error("Script text does not match its checksum.");
  return prisma.salesCallScriptSnapshot.create({
    data: { callId, scriptId: script.id, key: script.key, version: script.version, checksum: script.checksum, exactText: script.exactText },
  });
}

/**
 * Deterministic selection: the approved block for a stage and key. The AI
 * layer may call this to choose *which* block; it never composes wording.
 */
export async function selectScript(stage: ScriptStage, key?: string) {
  const candidates = await approvedScripts(stage);
  if (key) return candidates.find((c) => c.key === key) ?? null;
  return candidates[0] ?? null;
}

/* ------------------------------------ Import ----------------------------------- */

export type ImportBlock = { key: string; stage: ScriptStage; context: string; exactText: string };

/**
 * Import blocks verbatim from a source document. Nothing is rewritten; an
 * identical text for the same key is not re-imported. Returns what changed.
 */
export async function importScriptBlocks(blocks: ImportBlock[], provenance: string) {
  let created = 0;
  let unchanged = 0;
  for (const b of blocks) {
    const latest = await prisma.salesScript.findFirst({ where: { key: b.key }, orderBy: { version: "desc" } });
    if (latest && latest.checksum === checksumOf(b.exactText)) { unchanged++; continue; }
    await createScriptVersion({ ...b, provenance });
    created++;
  }
  return { created, unchanged };
}

export async function scriptImportState() {
  const [total, approved, draft] = await Promise.all([
    prisma.salesScript.count(),
    prisma.salesScript.count({ where: { status: "approved" } }),
    prisma.salesScript.count({ where: { status: "draft" } }),
  ]);
  return { total, approved, draft, canonicalImportRequired: approved === 0 };
}
