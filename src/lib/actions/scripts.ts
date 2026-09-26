"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isTextLed } from "@/lib/domain/workflow";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess, type AuthContext } from "@/lib/auth/guard";
import { generateHooks, generateScript, refineScriptContent } from "@/lib/ai/generators";
import { REFINE_INSTRUCTIONS, type RefineInstruction } from "@/lib/ai/prompts";
import { parseJson, parseStringArray, stringify, stringifyArray } from "@/lib/db/json";
import { platformSchema, scriptQaStateSchema, scriptTypeSchema } from "@/lib/domain/enums";
import { assertScriptTransition, type Claim } from "@/lib/domain/workflow";
import { recordDecision, supersedeApprovals } from "@/lib/delivery/approvals";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { estimateSpokenSeconds } from "@/lib/utils/format";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Script engine mutations.
 *
 * Script content is append-only: every change writes a new `ScriptVersion` with
 * a change summary, so history is complete and any version can be restored.
 */

async function loadScript(ctx: AuthContext, scriptId: string) {
  return prisma.script.findFirst({
    where: { id: scriptId, orgId: ctx.org.id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
}

/** Append a new version. The single place a script's content changes. */
async function appendVersion(
  ctx: AuthContext,
  scriptId: string,
  current: { version: number } | undefined,
  data: {
    hook: string;
    altHooks: string[];
    body: string;
    cta: string | null;
    filmingNotes: string | null;
    claims: Claim[];
    contextUsed: string[];
    changeSummary: string;
    generatedBy: string;
  },
) {
  const nextVersion = (current?.version ?? 0) + 1;

  const version = await prisma.scriptVersion.create({
    data: {
      scriptId,
      version: nextVersion,
      hook: cleanText(data.hook, 1000),
      altHooks: stringifyArray(data.altHooks),
      body: cleanText(data.body),
      cta: data.cta,
      filmingNotes: data.filmingNotes,
      claims: stringify(data.claims),
      contextUsed: stringifyArray(data.contextUsed),
      changeSummary: data.changeSummary,
      generatedBy: data.generatedBy,
      // AI-03: which Brand Brain version an AI draft was written against.
      brainVersion: data.generatedBy === "human" ? null : ((await prisma.brandBrain.findUnique({ where: { orgId: ctx.org.id }, select: { version: true } }))?.version ?? null),
      createdById: ctx.user.id,
    },
  });

  const before = await prisma.script.findUnique({ where: { id: scriptId }, select: { qaState: true } });
  await prisma.script.update({
    where: { id: scriptId },
    data: {
      currentVersion: nextVersion,
      estimatedSeconds: estimateSpokenSeconds(data.body),
      claimsVerified: data.claims.every((c) => c.status !== "unverified"),
      // DEL-03: a new version of an approved script needs approving again.
      ...(before?.qaState === "approved" ? { qaState: "ready_to_record", approvedAt: null } : {}),
    },
  });
  await supersedeApprovals(ctx.org.id, { type: "script", id: scriptId }, `new version v${nextVersion}`);

  return version;
}

/* ------------------------------ Create scripts ----------------------------- */

const createFromIdeaSchema = z.object({
  ideaId: z.string().min(1),
  scriptType: scriptTypeSchema.default("short_form"),
  targetSeconds: z.coerce.number().int().min(15).max(1800).default(60),
  generate: z.union([z.literal("on"), z.literal("true"), z.literal("false")]).optional(),
  speakerUserId: z.string().max(60).optional(),
});

export async function createScriptFromIdeaAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string; isDemo: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const input = parseForm(createFromIdeaSchema, formData);
    const shouldGenerate = input.generate === "on" || input.generate === "true";

    const idea = await prisma.idea.findFirst({
      where: { id: input.ideaId, orgId: ctx.org.id },
    });
    if (!idea) return err("That idea no longer exists.", "not_found");
    if (idea.status === "rejected" || idea.status === "archived") {
      return err("This idea is not active. Move it back to the backlog first.", "workflow");
    }

    const script = await prisma.script.create({
      data: {
        orgId: ctx.org.id,
        ideaId: idea.id,
        title: idea.title,
        scriptType: input.scriptType,
        platform: idea.platform,
        qaState: "ai_draft",
        estimatedSeconds: input.targetSeconds,
      },
    });

    let isDemo = false;

    if (shouldGenerate) {
      await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);
      const { script: generated, meta } = await generateScript({
        orgId: ctx.org.id,
        userId: ctx.user.id,
        title: idea.title,
        angle: idea.angle ?? undefined,
        hookConcept: idea.hookConcept ?? undefined,
        scriptType: input.scriptType,
        platform: idea.platform,
        targetSeconds: input.targetSeconds,
        cta: idea.cta ?? undefined,
        entityId: script.id,
        speakerUserId: input.speakerUserId || undefined,
      });
      isDemo = meta.isDemo;

      await appendVersion(ctx, script.id, undefined, {
        hook: generated.hook,
        altHooks: generated.altHooks,
        body: generated.body,
        cta: generated.cta || idea.cta,
        filmingNotes: generated.filmingNotes,
        claims: generated.claims,
        contextUsed: generated.contextUsed,
        changeSummary: `Generated from idea "${idea.title}"${meta.isDemo ? " in demo mode" : ""}`,
        generatedBy: "ai",
      });

      if (generated.claims.length > 0) {
        await prisma.script.update({
          where: { id: script.id },
          data: { qaState: "needs_fact_check" },
        });
      }
    } else {
      await appendVersion(ctx, script.id, undefined, {
        hook: idea.hookConcept ?? "",
        altHooks: [],
        body: "",
        cta: idea.cta,
        filmingNotes: null,
        claims: [],
        contextUsed: [],
        changeSummary: "Created blank from idea",
        generatedBy: "human",
      });
    }

    // Moving the idea to `scripted` is what makes the lineage explicit.
    await prisma.idea.update({ where: { id: idea.id }, data: { status: "scripted" } });

    await audit(ctx, {
      action: "script.create",
      entityType: "script",
      entityId: script.id,
      summary: `Created script "${script.title}"${shouldGenerate ? " with generation" : ""}`,
      meta: { ideaId: idea.id, generated: shouldGenerate, isDemo },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/create/scripts`);
    revalidatePath(`/app/${orgSlug}/create/ideas`);
    revalidatePath(`/app/${orgSlug}/create/ideas/${idea.id}`);

    return ok({ id: script.id, isDemo }, shouldGenerate ? "Script generated." : "Script created.");
  });
}

const blankScriptSchema = z.object({
  title: z.string().min(3).max(240),
  scriptType: scriptTypeSchema.default("short_form"),
  platform: platformSchema.default("linkedin"),
});

export async function createBlankScriptAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const input = parseForm(blankScriptSchema, formData);

    const script = await prisma.script.create({
      data: {
        orgId: ctx.org.id,
        title: cleanText(input.title, 240),
        scriptType: input.scriptType,
        platform: input.platform,
        qaState: "ai_draft",
      },
    });

    await appendVersion(ctx, script.id, undefined, {
      hook: "",
      altHooks: [],
      body: "",
      cta: null,
      filmingNotes: null,
      claims: [],
      contextUsed: [],
      changeSummary: "Created manually",
      generatedBy: "human",
    });

    await audit(ctx, {
      action: "script.create",
      entityType: "script",
      entityId: script.id,
      summary: `Created script "${script.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts`);

    return ok({ id: script.id }, "Script created.");
  });
}

/* -------------------------------- Edit content ----------------------------- */

const saveScriptSchema = z.object({
  hook: z.string().max(1000).default(""),
  body: z.string().max(20000).default(""),
  cta: z.string().max(600).optional(),
  filmingNotes: z.string().max(4000).optional(),
  changeSummary: z.string().max(300).optional(),
});

export async function saveScriptAction(
  orgSlug: string,
  scriptId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const input = parseForm(saveScriptSchema, formData);

    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const current = script.versions[0];
    const claims = parseJson<Claim[]>(current?.claims, []);

    // Nothing changed: avoid polluting the version history with no-op saves.
    if (current && current.hook === input.hook && current.body === input.body) {
      return okVoid("No changes to save.");
    }

    await appendVersion(ctx, scriptId, current, {
      hook: input.hook,
      altHooks: parseStringArray(current?.altHooks),
      body: input.body,
      cta: input.cta ?? current?.cta ?? null,
      filmingNotes: input.filmingNotes ?? current?.filmingNotes ?? null,
      claims,
      contextUsed: parseStringArray(current?.contextUsed),
      changeSummary: input.changeSummary || "Edited manually",
      generatedBy: "human",
    });

    await audit(ctx, {
      action: "script.edit",
      entityType: "script",
      entityId: scriptId,
      summary: `Edited script "${script.title}" (v${(current?.version ?? 0) + 1})`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return okVoid("Saved as a new version.");
  });
}

export async function selectHookAction(
  orgSlug: string,
  scriptId: string,
  hook: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const current = script.versions[0];
    if (!current) return err("This script has no versions yet.", "not_found");
    if (current.hook === hook) return okVoid("That hook is already selected.");

    const alternates = parseStringArray(current.altHooks);
    // The previously selected hook rejoins the alternates so nothing is lost.
    const nextAlternates = [current.hook, ...alternates.filter((h) => h !== hook)].filter(Boolean);

    await appendVersion(ctx, scriptId, current, {
      hook,
      altHooks: nextAlternates,
      body: current.body,
      cta: current.cta,
      filmingNotes: current.filmingNotes,
      claims: parseJson<Claim[]>(current.claims, []),
      contextUsed: parseStringArray(current.contextUsed),
      changeSummary: "Selected a different hook",
      generatedBy: "human",
    });

    await audit(ctx, {
      action: "script.hook",
      entityType: "script",
      entityId: scriptId,
      summary: `Selected a new hook for "${script.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return okVoid("Hook updated.");
  });
}

export async function restoreVersionAction(
  orgSlug: string,
  scriptId: string,
  version: number,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const target = await prisma.scriptVersion.findFirst({
      where: { scriptId, version },
    });
    if (!target) return err("That version no longer exists.", "not_found");

    // Restoring appends a new version rather than rewinding, so history is never lost.
    await appendVersion(ctx, scriptId, script.versions[0], {
      hook: target.hook,
      altHooks: parseStringArray(target.altHooks),
      body: target.body,
      cta: target.cta,
      filmingNotes: target.filmingNotes,
      claims: parseJson<Claim[]>(target.claims, []),
      contextUsed: parseStringArray(target.contextUsed),
      changeSummary: `Restored from v${version}`,
      generatedBy: "human",
    });

    await audit(ctx, {
      action: "script.restore",
      entityType: "script",
      entityId: scriptId,
      summary: `Restored "${script.title}" to v${version}`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return okVoid(`Restored version ${version}.`);
  });
}

/* --------------------------------- Claims ---------------------------------- */

export async function setClaimStatusAction(
  orgSlug: string,
  scriptId: string,
  claimId: string,
  status: "unverified" | "verified" | "removed",
): Promise<ActionResult<{ remaining: number }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const current = script.versions[0];
    if (!current) return err("This script has no versions yet.", "not_found");

    const claims = parseJson<Claim[]>(current.claims, []);
    const next = claims.map((c) => (c.id === claimId ? { ...c, status } : c));
    const remaining = next.filter((c) => c.status === "unverified").length;

    // Claim verification updates the current version in place: it records a human
    // review decision about existing text, not a change to the script itself.
    await prisma.scriptVersion.update({
      where: { id: current.id },
      data: { claims: stringify(next) },
    });
    await prisma.script.update({
      where: { id: scriptId },
      data: { claimsVerified: remaining === 0 },
    });

    await audit(ctx, {
      action: "script.claim",
      entityType: "script",
      entityId: scriptId,
      summary: `Marked a factual claim as ${status}`,
      meta: { claimId, status, remaining },
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return ok(
      { remaining },
      remaining === 0 ? "All claims reviewed." : `${remaining} claim${remaining === 1 ? "" : "s"} left to verify.`,
    );
  });
}

const addClaimSchema = z.object({ text: z.string().min(3).max(600), note: z.string().max(600).optional() });

export async function addClaimAction(
  orgSlug: string,
  scriptId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const input = parseForm(addClaimSchema, formData);
    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const current = script.versions[0];
    if (!current) return err("This script has no versions yet.", "not_found");

    const claims = parseJson<Claim[]>(current.claims, []);
    claims.push({
      id: randomUUID(),
      text: cleanText(input.text, 600),
      status: "unverified",
      note: input.note,
    });

    await prisma.scriptVersion.update({
      where: { id: current.id },
      data: { claims: stringify(claims) },
    });
    await prisma.script.update({ where: { id: scriptId }, data: { claimsVerified: false } });

    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);
    return okVoid("Claim added for verification.");
  });
}

/* ------------------------------- QA transitions ---------------------------- */

export async function setScriptStateAction(
  orgSlug: string,
  scriptId: string,
  state: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug);
    const target = scriptQaStateSchema.parse(state);

    if (target === "approved" && !ctx.can("scripts.approve")) {
      return err("Only a workspace admin can approve scripts.", "auth");
    }

    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");

    const current = script.versions[0];
    const claims = parseJson<Claim[]>(current?.claims, []);

    if ((target === "ready_to_record" || target === "approved") && !current?.body.trim()) {
      return err("This script has no body yet.", "workflow");
    }

    // Throws WorkflowError if the transition is illegal or claims are unverified.
    assertScriptTransition(script.qaState as never, target, claims);

    await prisma.script.update({
      where: { id: scriptId },
      data: { qaState: target, approvedAt: target === "approved" ? new Date() : null },
    });

    if (target === "approved") await recordDecision(ctx, { type: "script", id: scriptId }, "approved");

    await audit(ctx, {
      action: "script.state",
      entityType: "script",
      entityId: scriptId,
      summary: `Moved script "${script.title}" to ${target.replace(/_/g, " ")}`,
      meta: { from: script.qaState, to: target },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);
    revalidatePath(`/app/${orgSlug}/create/scripts`);
    revalidatePath(`/app/${orgSlug}/production/recording`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid(
      target === "approved" ? "Script approved and added to the recording queue." : "Script updated.",
    );
  });
}

/* --------------------------------- AI actions ------------------------------- */

const hooksSchema = z.object({ count: z.coerce.number().int().min(1).max(8).default(5) });

export async function generateHooksAction(
  orgSlug: string,
  scriptId: string,
  _prev: ActionResult<{ hooks: string[]; isDemo: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ hooks: string[]; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ai.generate");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);
    const input = parseForm(hooksSchema, formData);

    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");
    const current = script.versions[0];
    if (!current?.body.trim()) {
      return err("Write or generate the body first — hooks are derived from it.", "workflow");
    }

    const { hooks, meta } = await generateHooks({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      title: script.title,
      body: current.body,
      count: input.count,
      entityId: scriptId,
    });

    const merged = [...new Set([...parseStringArray(current.altHooks), ...hooks])].filter(
      (h) => h && h !== current.hook,
    );

    await prisma.scriptVersion.update({
      where: { id: current.id },
      data: { altHooks: stringifyArray(merged) },
    });

    await audit(ctx, {
      action: "script.hooks",
      entityType: "script",
      entityId: scriptId,
      summary: `Generated ${hooks.length} hook alternatives${meta.isDemo ? " (demo mode)" : ""}`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return ok({ hooks, isDemo: meta.isDemo }, `${hooks.length} hooks generated.`);
  });
}

const refineSchema = z.object({
  instruction: z.enum(Object.keys(REFINE_INSTRUCTIONS) as [RefineInstruction, ...RefineInstruction[]]),
  note: z.string().max(500).optional(),
});

export async function refineScriptAction(
  orgSlug: string,
  scriptId: string,
  _prev: ActionResult<{ isDemo: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ai.generate");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);
    const input = parseForm(refineSchema, formData);

    const script = await loadScript(ctx, scriptId);
    if (!script) return err("That script no longer exists.", "not_found");
    const current = script.versions[0];
    if (!current?.body.trim()) return err("There is nothing to refine yet.", "workflow");

    const refined = await refineScriptContent({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      hook: current.hook,
      body: current.body,
      cta: current.cta ?? undefined,
      instruction: input.instruction,
      note: input.note,
      entityId: scriptId,
    });

    await appendVersion(ctx, scriptId, current, {
      hook: refined.hook,
      altHooks: parseStringArray(current.altHooks),
      body: refined.body,
      cta: current.cta,
      filmingNotes: current.filmingNotes,
      claims: parseJson<Claim[]>(current.claims, []),
      contextUsed: parseStringArray(current.contextUsed),
      changeSummary:
        refined.changeSummary ||
        `${REFINE_INSTRUCTIONS[input.instruction].label}${refined.meta.isDemo ? " (demo mode)" : ""}`,
      generatedBy: "ai_refine",
    });

    await audit(ctx, {
      action: "script.refine",
      entityType: "script",
      entityId: scriptId,
      summary: `Refined "${script.title}": ${REFINE_INSTRUCTIONS[input.instruction].label}`,
      meta: { instruction: input.instruction, isDemo: refined.meta.isDemo },
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return ok({ isDemo: refined.meta.isDemo }, "Revision saved as a new version.");
  });
}

export async function regenerateScriptAction(
  orgSlug: string,
  scriptId: string,
): Promise<ActionResult<{ isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ai.generate");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);

    const script = await prisma.script.findFirst({
      where: { id: scriptId, orgId: ctx.org.id },
      include: { idea: true, versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!script) return err("That script no longer exists.", "not_found");

    const { script: generated, meta } = await generateScript({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      title: script.title,
      angle: script.idea?.angle ?? undefined,
      hookConcept: script.idea?.hookConcept ?? undefined,
      scriptType: script.scriptType,
      platform: script.platform,
      targetSeconds: script.estimatedSeconds,
      cta: script.idea?.cta ?? undefined,
      entityId: scriptId,
    });

    await appendVersion(ctx, scriptId, script.versions[0], {
      hook: generated.hook,
      altHooks: generated.altHooks,
      body: generated.body,
      cta: generated.cta || script.idea?.cta || null,
      filmingNotes: generated.filmingNotes,
      claims: generated.claims,
      contextUsed: generated.contextUsed,
      changeSummary: `Regenerated${meta.isDemo ? " in demo mode" : ""}`,
      generatedBy: "ai",
    });

    // Regeneration introduces unverified claims, so QA state steps back.
    if (generated.claims.length > 0 && script.qaState !== "ai_draft") {
      await prisma.script.update({ where: { id: scriptId }, data: { qaState: "needs_fact_check" } });
    }

    await audit(ctx, {
      action: "script.regenerate",
      entityType: "script",
      entityId: scriptId,
      summary: `Regenerated "${script.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);

    return ok({ isDemo: meta.isDemo }, "Regenerated as a new version.");
  });
}

/* ------------------------------ Send to recording --------------------------- */

export async function sendToRecordingAction(
  orgSlug: string,
  scriptId: string,
): Promise<ActionResult<{ contentItemId: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.approve");

    const script = await prisma.script.findFirst({
      where: { id: scriptId, orgId: ctx.org.id },
      include: {
        idea: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
        contentItems: { select: { id: true } },
      },
    });
    if (!script) return err("That script no longer exists.", "not_found");

    if (script.contentItems.length > 0) {
      return err("This script is already in production.", "workflow");
    }
    if (script.qaState !== "approved") {
      return err("Approve the script before sending it to recording.", "workflow");
    }

    const current = script.versions[0];
    const format = script.idea?.format ?? "short_form";
    const textLed = isTextLed({ format, platform: script.platform });

    const item = await prisma.contentItem.create({
      data: {
        orgId: ctx.org.id,
        ideaId: script.ideaId,
        scriptId: script.id,
        title: script.title,
        selectedHook: current?.hook ?? null,
        // Text-led work is written, not recorded: it starts in editing.
        stage: textLed ? "editing" : "raw",
        intendedJob: script.idea?.intendedJob ?? "authority",
        platform: script.platform,
        format,
        priority: (script.idea?.priorityScore ?? 0) >= 78 ? "high" : "medium",
        founderId: ctx.user.id,
      },
    });

    await prisma.contentEvent.create({
      data: {
        orgId: ctx.org.id,
        contentItemId: item.id,
        type: "stage_change",
        toStage: textLed ? "editing" : "raw",
        note: textLed ? "Text piece sent to production — no recording needed" : "Sent to recording from the script engine",
        actorId: ctx.user.id,
      },
    });

    if (!textLed) {
      await prisma.task.create({
        data: {
          orgId: ctx.org.id,
          title: `Record: ${script.title}`,
          description: current?.hook ?? undefined,
          kind: "record",
          audience: "client",
          priority: item.priority,
          entityType: "content_item",
          entityId: item.id,
          estimateMin: Math.max(4, Math.round((script.estimatedSeconds / 60) * 6)),
        },
      });
    }

    await audit(ctx, {
      action: "script.to_recording",
      entityType: "content_item",
      entityId: item.id,
      summary: textLed ? `Sent "${script.title}" to production (text)` : `Sent "${script.title}" to the recording queue`,
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/production/recording`);
    revalidatePath(`/app/${orgSlug}/production`);
    revalidatePath(`/app/${orgSlug}/create/scripts/${scriptId}`);
    revalidatePath(`/app/${orgSlug}`);

    return ok({ contentItemId: item.id }, textLed ? "Sent to production as a text piece." : "Added to the recording queue.");
  });
}

export async function deleteScriptAction(orgSlug: string, scriptId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.approve");
    const script = await prisma.script.findFirst({
      where: { id: scriptId, orgId: ctx.org.id },
      include: { _count: { select: { contentItems: true } } },
    });
    if (!script) return err("That script no longer exists.", "not_found");
    if (script._count.contentItems > 0) {
      return err("This script is in production and cannot be deleted.", "workflow");
    }

    await prisma.script.delete({ where: { id: scriptId } });
    if (script.ideaId) {
      await prisma.idea.update({ where: { id: script.ideaId }, data: { status: "approved" } });
    }

    await audit(ctx, {
      action: "script.delete",
      entityType: "script",
      entityId: scriptId,
      summary: `Deleted script "${script.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/scripts`);

    return okVoid("Script deleted.");
  });
}
