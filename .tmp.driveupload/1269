"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { wedgeStateSchema } from "@/lib/domain/enums";
import {
  assertActiveRecord,
  assertInterviewEvidence,
  assertWedgeTransition,
  defaultNextAction,
  readValidation,
  resolveCheck,
  wedgeState,
} from "@/lib/domain/sop";
import {
  checkbox,
  cleanText,
  err,
  guarded,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Market validation.
 *
 * The gate that decides whether there is a business here, held as state rather
 * than as a document. Two rules are enforced rather than suggested:
 *
 *   1. **The interview sample has to exist before commercial testing.** Not
 *      "should", not "ideally". A commercial response test run against an
 *      unvalidated problem produces a number nobody can interpret, and the
 *      temptation to run it early is strongest exactly when the evidence is
 *      weakest.
 *   2. **Whether they raised the problem is recorded separately from what the
 *      problem was.** Agreement with our own suggestion is the weakest evidence
 *      available, and merging the two columns is how a hypothesis survives
 *      being wrong.
 */

function revalidateAll(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/market");
  if (id) revalidatePath(`/admin/market/${id}`);
}

const wedgeSchema = z.object({
  label: z.string().min(2, "Name the wedge.").max(200),
  summary: z.string().max(4000).optional(),
  problem: z.string().max(4000).optional(),
  outcome: z.string().max(4000).optional(),
  qualification: z.string().max(4000).optional(),
  mechanism: z.string().max(4000).optional(),
  scoreEconomics: z.coerce.number().int().min(0).max(5).default(0),
  scorePain: z.coerce.number().int().min(0).max(5).default(0),
  scoreReach: z.coerce.number().int().min(0).max(5).default(0),
  scorePrecedent: z.coerce.number().int().min(0).max(5).default(0),
  nextAction: z.string().max(300).optional(),
  nextActionDueAt: optionalDate,
  notes: z.string().max(8000).optional(),
});

export async function saveWedgeAction(
  wedgeId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(wedgeSchema, formData);

    const existing = wedgeId ? await prisma.marketWedge.findUnique({ where: { id: wedgeId } }) : null;
    if (wedgeId && !existing) return err("That wedge no longer exists.", "not_found");

    const state = existing?.state ?? "candidate";
    const fallback = defaultNextAction(wedgeState(state));
    const nextAction = input.nextAction ?? existing?.nextAction ?? fallback?.action ?? null;
    const nextActionDueAt =
      input.nextActionDueAt ?? existing?.nextActionDueAt ?? fallback?.dueAt ?? null;

    assertActiveRecord(state, { nextAction, nextActionDueAt }, "wedge");

    const data = {
      label: cleanText(input.label, 200),
      summary: input.summary ? cleanText(input.summary) : null,
      problem: input.problem ? cleanText(input.problem) : null,
      outcome: input.outcome ? cleanText(input.outcome) : null,
      qualification: input.qualification ? cleanText(input.qualification) : null,
      mechanism: input.mechanism ? cleanText(input.mechanism) : null,
      scoreEconomics: input.scoreEconomics,
      scorePain: input.scorePain,
      scoreReach: input.scoreReach,
      scorePrecedent: input.scorePrecedent,
      nextAction,
      nextActionDueAt,
      notes: input.notes ? cleanText(input.notes) : null,
    };

    const record = existing
      ? await prisma.marketWedge.update({ where: { id: existing.id }, data })
      : await prisma.marketWedge.create({ data: { ...data, ownerId: admin.user.id } });

    await auditInternal(admin.user.id, {
      action: existing ? "wedge.update" : "wedge.create",
      entityType: "MarketWedge",
      entityId: record.id,
      summary: `${existing ? "Updated" : "Added"} wedge ${record.label}`,
    });

    revalidateAll(record.id);
    return ok({ id: record.id }, existing ? "Saved." : "Wedge added.");
  });
}

/** See the note on the equivalent schema in acquisition.ts. */
const checkSchema = z.object({
  key: z.string().min(1).max(120),
  state: z.string().min(1).max(60),
  mode: z.enum(["toggle", "set"]).default("set"),
  done: checkbox,
  note: z.string().max(6000).optional(),
});

export async function toggleWedgeCheckAction(
  wedgeId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    await requireInternalStrict("acquisition.manage");
    const input = parseForm(checkSchema, formData);

    const definition = wedgeState(input.state);
    const item = definition.checklist.find((c) => c.key === input.key);
    if (!item) return err("That checklist item does not belong to this state.", "validation");

    const existing = await prisma.sopCheck.findUnique({
      where: { wedgeId_state_key: { wedgeId, state: input.state, key: input.key } },
    });

    const { done, note } = resolveCheck(
      input.mode,
      { done: input.done, note: input.note ? cleanText(input.note) : null },
      existing,
    );

    if (done && item.requiresNote && !note) {
      return err(
        `"${item.label}" asks for what you found. A tick on its own records that somebody looked, which is not the same thing.`,
        "workflow",
      );
    }

    await prisma.sopCheck.upsert({
      where: { wedgeId_state_key: { wedgeId, state: input.state, key: input.key } },
      create: {
        wedgeId,
        state: input.state,
        key: input.key,
        done,
        note,
        completedAt: done ? new Date() : null,
      },
      update: { done, note, completedAt: done ? new Date() : null },
    });

    revalidateAll(wedgeId);
    return okVoid();
  });
}

const advanceSchema = z.object({
  to: wedgeStateSchema,
  nextAction: z.string().max(300).optional(),
  nextActionDueAt: optionalDate,
  override: z.string().max(600).optional(),
});

export async function advanceWedgeAction(
  wedgeId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(advanceSchema, formData);

    const wedge = await prisma.marketWedge.findUnique({
      where: { id: wedgeId },
      include: {
        checks: true,
        conversations: { select: { volunteered: true, problem: true, problemTheme: true } },
      },
    });
    if (!wedge) return err("That wedge no longer exists.", "not_found");

    assertWedgeTransition(wedge.state, input.to, {
      checks: wedge.checks
        .filter((c) => c.state === wedge.state)
        .map((c) => ({ key: c.key, done: c.done, note: c.note })),
      override: input.override,
    });

    // The sample gate. Unlike the checklist this one has no override, because
    // the whole purpose of the state is that the conversations happened and
    // that they said the same thing.
    if (wedge.state === "interviews" && input.to === "commercial_test") {
      const reading = readValidation(
        wedge.conversations.map((c) => ({
          volunteered: c.volunteered,
          problem: c.problem,
          theme: c.problemTheme,
        })),
      );
      assertInterviewEvidence(reading.total, reading.convergence);
    }

    const target = wedgeState(input.to);
    const fallback = defaultNextAction(target);
    const nextAction = input.nextAction ?? fallback?.action ?? null;
    const nextActionDueAt = input.nextActionDueAt ?? fallback?.dueAt ?? null;
    assertActiveRecord(input.to, { nextAction, nextActionDueAt }, "wedge");

    await prisma.marketWedge.update({
      where: { id: wedgeId },
      data: {
        state: input.to,
        nextAction,
        nextActionDueAt,
        frozenAt: input.to === "validated" ? new Date() : null,
      },
    });

    await auditInternal(admin.user.id, {
      action: "wedge.transition",
      entityType: "MarketWedge",
      entityId: wedgeId,
      summary: `${wedge.label}: ${wedge.state} → ${input.to}`,
      meta: { from: wedge.state, to: input.to, override: input.override ?? null },
    });

    revalidateAll(wedgeId);
    return okVoid(`Moved to ${input.to.replace(/_/g, " ")}.`);
  });
}

export async function setActiveWedgeAction(
  wedgeId: string,
  _prev: ActionResult | null,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");

    const wedge = await prisma.marketWedge.findUnique({ where: { id: wedgeId } });
    if (!wedge) return err("That wedge no longer exists.", "not_found");

    // One active wedge. Immersing in two markets at once produces shallow
    // knowledge of both and a message specific to neither.
    await prisma.$transaction([
      prisma.marketWedge.updateMany({ where: { active: true }, data: { active: false } }),
      prisma.marketWedge.update({ where: { id: wedgeId }, data: { active: true } }),
    ]);

    await auditInternal(admin.user.id, {
      action: "wedge.activate",
      entityType: "MarketWedge",
      entityId: wedgeId,
      summary: `${wedge.label} is now the active wedge`,
    });

    revalidateAll(wedgeId);
    return okVoid(`${wedge.label} is now the active wedge.`);
  });
}

const conversationSchema = z.object({
  person: z.string().min(2, "Who did you speak to?").max(200),
  company: z.string().max(200).optional(),
  heldAt: optionalDate,
  problem: z.string().min(5, "What did they say the problem was?").max(4000),
  /**
   * The recurring problem this belongs to. Convergence is a judgement about
   * whether two people described the same expensive problem in different words,
   * and no string comparison can make it — so an operator makes it and the
   * system counts it.
   */
  problemTheme: z.string().max(200).optional(),
  volunteered: checkbox,
  quote: z.string().max(4000).optional(),
  currentProcess: z.string().max(4000).optional(),
  triedBefore: z.string().max(4000).optional(),
  consequence: z.string().max(4000).optional(),
  notes: z.string().max(8000).optional(),
});

export async function addConversationAction(
  wedgeId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(conversationSchema, formData);

    const wedge = await prisma.marketWedge.findUnique({ where: { id: wedgeId } });
    if (!wedge) return err("That wedge no longer exists.", "not_found");

    await prisma.validationConversation.create({
      data: {
        wedgeId,
        person: cleanText(input.person, 200),
        company: input.company ? cleanText(input.company, 200) : null,
        heldAt: input.heldAt ?? new Date(),
        problem: cleanText(input.problem),
        problemTheme: input.problemTheme ? cleanText(input.problemTheme, 200) : null,
        volunteered: input.volunteered,
        quote: input.quote ? cleanText(input.quote) : null,
        currentProcess: input.currentProcess ? cleanText(input.currentProcess) : null,
        triedBefore: input.triedBefore ? cleanText(input.triedBefore) : null,
        consequence: input.consequence ? cleanText(input.consequence) : null,
        notes: input.notes ? cleanText(input.notes) : null,
      },
    });

    await auditInternal(admin.user.id, {
      action: "wedge.conversation",
      entityType: "MarketWedge",
      entityId: wedgeId,
      summary: `Research conversation recorded for ${wedge.label}`,
      meta: { volunteered: input.volunteered },
    });

    revalidateAll(wedgeId);
    return okVoid("Conversation recorded.");
  });
}
