import "server-only";
import { prisma } from "@/lib/db/client";
import { chunkDocument, toOrQuery, type KnowledgeKind } from "./chunk";

/**
 * R2: Threadline knowledge base. Staff write it; generation reads it.
 *
 * Every save writes a KnowledgeDocVersion and re-chunks, so replacing a
 * document never loses the old text and retrieval always reflects the current
 * one. Nothing here is client-scoped: this is Threadline's own know-how.
 */

export type KnowledgeInput = {
  title: string;
  kind: KnowledgeKind;
  body: string;
  summary?: string | null;
  source?: string | null;
  platform?: string;
};

export async function createKnowledgeDoc(input: KnowledgeInput, userId: string | null) {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.knowledgeDoc.create({
      data: {
        title: input.title,
        kind: input.kind,
        body: input.body,
        summary: input.summary ?? null,
        source: input.source ?? null,
        platform: input.platform ?? "all",
        updatedById: userId,
      },
    });
    await tx.knowledgeDocVersion.create({ data: { docId: doc.id, version: 1, title: doc.title, kind: doc.kind, body: doc.body, savedById: userId } });
    await tx.knowledgeChunk.createMany({ data: chunkDocument(doc.body).map((c) => ({ ...c, docId: doc.id })) });
    return doc;
  });
}

export async function updateKnowledgeDoc(id: string, input: KnowledgeInput, userId: string | null) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.knowledgeDoc.findUnique({ where: { id }, select: { version: true } });
    if (!existing) return null;
    const version = existing.version + 1;
    const doc = await tx.knowledgeDoc.update({
      where: { id },
      data: {
        title: input.title,
        kind: input.kind,
        body: input.body,
        summary: input.summary ?? null,
        source: input.source ?? null,
        platform: input.platform ?? "all",
        version,
        updatedById: userId,
      },
    });
    await tx.knowledgeDocVersion.create({ data: { docId: id, version, title: doc.title, kind: doc.kind, body: doc.body, savedById: userId } });
    await tx.knowledgeChunk.deleteMany({ where: { docId: id } });
    await tx.knowledgeChunk.createMany({ data: chunkDocument(doc.body).map((c) => ({ ...c, docId: id })) });
    return doc;
  });
}

/** Restoring is a new version with the old text, so history only ever grows. */
export async function restoreKnowledgeVersion(id: string, version: number, userId: string | null) {
  const [doc, old] = await Promise.all([
    prisma.knowledgeDoc.findUnique({ where: { id } }),
    prisma.knowledgeDocVersion.findUnique({ where: { docId_version: { docId: id, version } } }),
  ]);
  if (!doc || !old) return null;
  return updateKnowledgeDoc(id, { title: old.title, kind: old.kind as KnowledgeKind, body: old.body, summary: doc.summary, source: doc.source, platform: doc.platform }, userId);
}

export async function setKnowledgeStatus(id: string, status: "active" | "archived") {
  return prisma.knowledgeDoc.update({ where: { id }, data: { status } });
}

export function listKnowledgeDocs() {
  return prisma.knowledgeDoc.findMany({
    orderBy: [{ status: "asc" }, { kind: "asc" }, { title: "asc" }],
    select: { id: true, title: true, kind: true, summary: true, platform: true, status: true, version: true, updatedAt: true, _count: { select: { chunks: true } } },
  });
}

export function getKnowledgeDoc(id: string) {
  return prisma.knowledgeDoc.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: "desc" }, select: { version: true, title: true, createdAt: true, savedById: true } } },
  });
}

export type KnowledgeHit = { docId: string; title: string; kind: string; heading: string | null; text: string };

/**
 * Chunks for a generation: every active style rule (they always apply), then
 * the best full-text matches for the task, at most two per document, inside a
 * character budget so the playbook cannot crowd out the client's own context.
 */
export async function searchKnowledge(input: { query: string; platform?: string; budgetChars?: number }): Promise<KnowledgeHit[]> {
  const budget = input.budgetChars ?? 7000;
  const platform = input.platform ?? "all";
  const hits: KnowledgeHit[] = [];
  let used = 0;
  const take = (h: KnowledgeHit) => {
    if (used + h.text.length > budget) return false;
    hits.push(h);
    used += h.text.length;
    return true;
  };

  const rules = await prisma.knowledgeChunk.findMany({
    where: { doc: { status: "active", kind: "style_rule", platform: { in: ["all", platform] } } },
    orderBy: [{ docId: "asc" }, { ordinal: "asc" }],
    select: { docId: true, heading: true, text: true, doc: { select: { title: true, kind: true } } },
    take: 20,
  });
  for (const r of rules) if (!take({ docId: r.docId, title: r.doc.title, kind: r.doc.kind, heading: r.heading, text: r.text })) break;

  const tsquery = toOrQuery(input.query);
  if (!tsquery) return hits;
  const rows = await prisma.$queryRaw<{ docId: string; title: string; kind: string; heading: string | null; text: string }[]>`
    SELECT c."docId", d."title", d."kind", c."heading", c."text"
    FROM "KnowledgeChunk" c
    JOIN "KnowledgeDoc" d ON d."id" = c."docId"
    WHERE d."status" = 'active'
      AND d."kind" <> 'style_rule'
      AND d."platform" IN ('all', ${platform})
      AND to_tsvector('english', coalesce(c."heading", '') || ' ' || c."text") @@ to_tsquery('english', ${tsquery})
    ORDER BY ts_rank(to_tsvector('english', coalesce(c."heading", '') || ' ' || c."text"), to_tsquery('english', ${tsquery})) DESC
    LIMIT 24`;
  const perDoc = new Map<string, number>();
  for (const row of rows) {
    const n = perDoc.get(row.docId) ?? 0;
    if (n >= 2) continue;
    if (take(row)) perDoc.set(row.docId, n + 1);
  }
  return hits;
}
