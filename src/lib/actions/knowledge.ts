"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import {
  createKnowledgeDoc,
  restoreKnowledgeVersion,
  setKnowledgeStatus,
  updateKnowledgeDoc,
} from "@/lib/knowledge";
import { KNOWLEDGE_KINDS, KNOWLEDGE_PLATFORMS } from "@/lib/knowledge/chunk";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * R2: knowledge base mutations. Staff only (the SOP capability), audited.
 * The body comes from the textarea or, when one is attached, a .md/.txt file.
 */

const MAX_BODY = 400_000;

const docSchema = z.object({
  title: z.string().min(2).max(200),
  kind: z.enum(KNOWLEDGE_KINDS),
  platform: z.enum(KNOWLEDGE_PLATFORMS).default("all"),
  summary: z.string().max(500).optional(),
  source: z.string().max(500).optional(),
  body: z.string().max(MAX_BODY).optional(),
  file: z.instanceof(File).optional(),
});

async function bodyFrom(input: z.infer<typeof docSchema>): Promise<string | null> {
  if (input.file && input.file.size > 0) {
    if (!/\.(md|markdown|txt)$/i.test(input.file.name)) return null;
    if (input.file.size > MAX_BODY * 2) return null;
    return cleanText(await input.file.text(), MAX_BODY);
  }
  return input.body ? cleanText(input.body, MAX_BODY) : "";
}

function fields(input: z.infer<typeof docSchema>, body: string) {
  return {
    title: cleanText(input.title, 200),
    kind: input.kind,
    platform: input.platform,
    summary: input.summary ? cleanText(input.summary, 500) : null,
    source: input.source ? cleanText(input.source, 500) : null,
    body,
  };
}

export async function createKnowledgeAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.sops");
    const input = parseForm(docSchema, formData);
    const body = await bodyFrom(input);
    if (body === null) return err("Attach a .md or .txt file (for PDFs and Docs, paste the text).", "validation");
    if (!body) return err("Paste the text or attach a file.", "validation");
    const doc = await createKnowledgeDoc(fields(input, body), admin.user.id);
    await auditInternal(admin.user.id, { action: "knowledge.create", entityType: "knowledge", entityId: doc.id, summary: `Added "${doc.title}" to the knowledge base` });
    revalidatePath("/admin/knowledge");
    return ok({ id: doc.id }, "Added.");
  });
}

export async function updateKnowledgeAction(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.sops");
    const input = parseForm(docSchema, formData);
    const body = await bodyFrom(input);
    if (body === null) return err("Attach a .md or .txt file (for PDFs and Docs, paste the text).", "validation");
    if (!body) return err("The document cannot be empty. Archive it instead.", "validation");
    const doc = await updateKnowledgeDoc(id, fields(input, body), admin.user.id);
    if (!doc) return err("That document no longer exists.", "not_found");
    await auditInternal(admin.user.id, { action: "knowledge.update", entityType: "knowledge", entityId: id, summary: `Updated "${doc.title}" (v${doc.version})` });
    revalidatePath("/admin/knowledge");
    revalidatePath(`/admin/knowledge/${id}`);
    return okVoid(`Saved as version ${doc.version}.`);
  });
}

export async function restoreKnowledgeAction(id: string, version: number): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.sops");
    const doc = await restoreKnowledgeVersion(id, version, admin.user.id);
    if (!doc) return err("That version no longer exists.", "not_found");
    await auditInternal(admin.user.id, { action: "knowledge.restore", entityType: "knowledge", entityId: id, summary: `Restored "${doc.title}" to v${version} (now v${doc.version})` });
    revalidatePath(`/admin/knowledge/${id}`);
    return okVoid(`Restored as version ${doc.version}.`);
  });
}

export async function setKnowledgeStatusAction(id: string, status: "active" | "archived"): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.sops");
    const doc = await setKnowledgeStatus(id, status === "archived" ? "archived" : "active");
    await auditInternal(admin.user.id, { action: `knowledge.${doc.status}`, entityType: "knowledge", entityId: id, summary: `${doc.status === "archived" ? "Archived" : "Reactivated"} "${doc.title}"` });
    revalidatePath("/admin/knowledge");
    revalidatePath(`/admin/knowledge/${id}`);
    return okVoid(doc.status === "archived" ? "Archived. It is no longer used in generation." : "Active again.");
  });
}
