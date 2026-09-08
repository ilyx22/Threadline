"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { stringify, stringifyArray, parseRecord, parseStringArray } from "@/lib/db/json";
import {
  callOutcomeSchema,
  callStageSchema,
  prospectStateSchema,
  prospectTierSchema,
  replyClassSchema,
} from "@/lib/domain/enums";
import {
  assertActiveRecord,
  assertCallOutcome,
  assertProspectTransition,
  defaultNextAction,
  OUTCOME_TO_STATE,
  prospectState,
  REPLY_GUIDANCE,
  resolveCheck,
} from "@/lib/domain/sop";
import { WorkflowError } from "@/lib/domain/workflow";
import {
  checkbox,
  cleanText,
  cleanUrl,
  err,
  guarded,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Threadline's own acquisition and sales operations.
 *
 * Every action here writes an internal record — no organisation is involved and
 * no client role holds `acquisition.manage`. Three rules are enforced on every
 * write rather than left to the interface:
 *
 *   1. **The checklist gates the transition.** Skipping it requires a written
 *      reason, which is recorded in the audit trail rather than swallowed.
 *   2. **No active record without a next action and a due date.** When a state
 *      has a deterministic default the system supplies it; when it does not,
 *      the operator has to.
 *   3. **Nothing is ever sent.** No action here contacts anybody. Sending is a
 *      human act performed in the operator's own tools, recorded here
 *      afterwards. A system that could send on a schedule would eventually send
 *      something nobody read first.
 */

const REVALIDATE = ["/admin", "/admin/prospects", "/admin/acquisition", "/admin/market"];

function revalidateAll(extra?: string) {
  for (const path of REVALIDATE) revalidatePath(path);
  if (extra) revalidatePath(extra);
}

/**
 * Reply classes that count as a positive reply in the funnel.
 *
 * A reply is not a positive reply, and a positive reply is not a booking. The
 * distinction is what makes the reply-to-booking conversion measurable — and
 * that conversion is where most outbound quietly loses the deals it earned.
 */
const POSITIVE_REPLIES = new Set(["interested", "curious", "booked"]);

/* -------------------------------- Prospects -------------------------------- */

const prospectSchema = z.object({
  company: z.string().min(2, "Enter the company.").max(200),
  contactName: z.string().max(200).optional(),
  contactRole: z.string().max(200).optional(),
  website: z.string().max(600).optional(),
  tier: prospectTierSchema.default("b"),
  wedgeId: z.string().optional(),
  channel: z.string().max(120).optional(),
  sourceNote: z.string().max(2000).optional(),
  economicsNote: z.string().max(4000).optional(),
  constraintHypothesis: z.string().max(4000).optional(),
  crmProvider: z.string().max(60).optional(),
  crmRecordId: z.string().max(200).optional(),
  crmRecordUrl: z.string().max(600).optional(),
  nextAction: z.string().max(300).optional(),
  nextActionDueAt: optionalDate,
  notes: z.string().max(8000).optional(),
});

export async function saveProspectAction(
  prospectId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(prospectSchema, formData);

    const existing = prospectId
      ? await prisma.prospect.findUnique({ where: { id: prospectId } })
      : null;
    if (prospectId && !existing) return err("That prospect no longer exists.", "not_found");

    const state = existing?.state ?? "new";
    const fallback = defaultNextAction(prospectState(state));

    const nextAction = input.nextAction ?? existing?.nextAction ?? fallback?.action ?? null;
    const nextActionDueAt =
      input.nextActionDueAt ?? existing?.nextActionDueAt ?? fallback?.dueAt ?? null;

    assertActiveRecord(state, { nextAction, nextActionDueAt }, "prospect");

    const data = {
      company: cleanText(input.company, 200),
      contactName: input.contactName ? cleanText(input.contactName, 200) : null,
      contactRole: input.contactRole ? cleanText(input.contactRole, 200) : null,
      website: cleanUrl(input.website),
      tier: input.tier,
      wedgeId: input.wedgeId || null,
      channel: input.channel ? cleanText(input.channel, 120) : null,
      sourceNote: input.sourceNote ? cleanText(input.sourceNote) : null,
      economicsNote: input.economicsNote ? cleanText(input.economicsNote) : null,
      constraintHypothesis: input.constraintHypothesis
        ? cleanText(input.constraintHypothesis)
        : null,
      crmProvider: input.crmProvider ? cleanText(input.crmProvider, 60) : null,
      crmRecordId: input.crmRecordId ? cleanText(input.crmRecordId, 200) : null,
      crmRecordUrl: cleanUrl(input.crmRecordUrl),
      nextAction,
      nextActionDueAt,
      notes: input.notes ? cleanText(input.notes) : null,
    };

    const record = existing
      ? await prisma.prospect.update({ where: { id: existing.id }, data })
      : await prisma.prospect.create({ data: { ...data, ownerId: admin.user.id } });

    await auditInternal(admin.user.id, {
      action: existing ? "prospect.update" : "prospect.create",
      entityType: "Prospect",
      entityId: record.id,
      summary: `${existing ? "Updated" : "Added"} prospect ${record.company}`,
      meta: { tier: record.tier, state: record.state },
    });

    revalidateAll(`/admin/prospects/${record.id}`);
    return ok({ id: record.id }, existing ? "Saved." : "Prospect added.");
  });
}

/**
 * A checklist write.
 *
 * `mode` is the important field. "toggle" carries no value at all — the server
 * reads what is stored and flips it, which is what makes a self-saving checkbox
 * correct regardless of what the browser managed to serialise at the moment of
 * the click. "set" is used where the operator explicitly pressed save, and the
 * posted value is authoritative.
 */
const checkSchema = z.object({
  key: z.string().min(1).max(120),
  state: z.string().min(1).max(60),
  mode: z.enum(["toggle", "set"]).default("set"),
  done: checkbox,
  note: z.string().max(4000).optional(),
});

export async function toggleProspectCheckAction(
  prospectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    await requireInternalStrict("acquisition.manage");
    const input = parseForm(checkSchema, formData);

    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) return err("That prospect no longer exists.", "not_found");

    const definition = prospectState(input.state);
    const item = definition.checklist.find((c) => c.key === input.key);
    if (!item) return err("That checklist item does not belong to this state.", "validation");

    const existing = await prisma.sopCheck.findUnique({
      where: { prospectId_state_key: { prospectId, state: input.state, key: input.key } },
    });

    const { done, note } = resolveCheck(
      input.mode,
      { done: input.done, note: input.note ? cleanText(input.note) : null },
      existing,
    );

    if (done && item.requiresNote && !note) {
      return err(
        `"${item.label}" asks for what you found, not just that you looked. Write it down — it is the part with value.`,
        "workflow",
      );
    }

    await prisma.sopCheck.upsert({
      where: {
        prospectId_state_key: { prospectId, state: input.state, key: input.key },
      },
      create: {
        prospectId,
        state: input.state,
        key: input.key,
        done,
        note,
        completedAt: done ? new Date() : null,
      },
      update: { done, note, completedAt: done ? new Date() : null },
    });

    revalidateAll(`/admin/prospects/${prospectId}`);
    return okVoid();
  });
}

const advanceSchema = z.object({
  to: prospectStateSchema,
  nextAction: z.string().max(300).optional(),
  nextActionDueAt: optionalDate,
  override: z.string().max(600).optional(),
  closedReason: z.string().max(600).optional(),
});

export async function advanceProspectAction(
  prospectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(advanceSchema, formData);

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { checks: true },
    });
    if (!prospect) return err("That prospect no longer exists.", "not_found");

    assertProspectTransition(prospect.state, input.to, {
      checks: prospect.checks
        .filter((c) => c.state === prospect.state)
        .map((c) => ({ key: c.key, done: c.done, note: c.note })),
      override: input.override,
    });

    const target = prospectState(input.to);
    const fallback = defaultNextAction(target);
    const nextAction = input.nextAction ?? fallback?.action ?? null;
    const nextActionDueAt = input.nextActionDueAt ?? fallback?.dueAt ?? null;

    assertActiveRecord(input.to, { nextAction, nextActionDueAt }, "prospect");

    const now = new Date();
    const terminal = ["won", "lost", "not_fit"].includes(input.to);

    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        state: input.to,
        nextAction,
        nextActionDueAt,
        // A first touch is dated when the message actually goes out, which is
        // the moment the record reaches "contacted". Every booking rate in the
        // product is counted from this column.
        firstTouchAt: input.to === "contacted" ? (prospect.firstTouchAt ?? now) : prospect.firstTouchAt,
        repliedAt: input.to === "replied" ? (prospect.repliedAt ?? now) : prospect.repliedAt,
        closedAt: terminal ? now : null,
        closedReason: terminal ? (input.closedReason ? cleanText(input.closedReason, 600) : null) : null,
      },
    });

    await auditInternal(admin.user.id, {
      action: "prospect.transition",
      entityType: "Prospect",
      entityId: prospectId,
      summary: `${prospect.company}: ${prospect.state} → ${input.to}`,
      meta: {
        from: prospect.state,
        to: input.to,
        // An override is a decision, and decisions belong in the record rather
        // than in somebody's memory of why the checklist was skipped.
        override: input.override ?? null,
      },
    });

    revalidateAll(`/admin/prospects/${prospectId}`);
    return okVoid(`Moved to ${target.state.replace(/_/g, " ")}.`);
  });
}

const replySchema = z.object({
  replyClass: replyClassSchema,
  note: z.string().max(4000).optional(),
  nextActionDueAt: optionalDate,
});

export async function classifyReplyAction(
  prospectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(replySchema, formData);

    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) return err("That prospect no longer exists.", "not_found");

    const guidance = REPLY_GUIDANCE[input.replyClass];
    const now = new Date();
    const dueAt = input.nextActionDueAt ?? new Date(now.getTime());
    if (!input.nextActionDueAt) {
      dueAt.setDate(dueAt.getDate() + guidance.dueInDays);
      dueAt.setHours(12, 0, 0, 0);
    }

    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        state: "replied",
        replyClass: input.replyClass,
        repliedAt: prospect.repliedAt ?? now,
        positiveReplyAt: POSITIVE_REPLIES.has(input.replyClass)
          ? (prospect.positiveReplyAt ?? now)
          : prospect.positiveReplyAt,
        nextAction: guidance.smallestStep,
        nextActionDueAt: dueAt,
        notes: input.note
          ? [prospect.notes, cleanText(input.note)].filter(Boolean).join("\n\n")
          : prospect.notes,
      },
    });

    await auditInternal(admin.user.id, {
      action: "prospect.reply",
      entityType: "Prospect",
      entityId: prospectId,
      summary: `${prospect.company}: reply classified as ${input.replyClass}`,
      meta: { replyClass: input.replyClass },
    });

    revalidateAll(`/admin/prospects/${prospectId}`);
    return okVoid("Reply classified.");
  });
}

/* --------------------------------- Calls ----------------------------------- */

const bookSchema = z.object({
  scheduledAt: z.string().min(1, "Choose a date and time."),
});

export async function bookCallAction(
  prospectId: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(bookSchema, formData);

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return err("That is not a valid date and time.", "validation");
    }

    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) return err("That prospect no longer exists.", "not_found");

    const call = await prisma.salesCall.create({
      data: { prospectId, scheduledAt, ownerId: admin.user.id },
    });

    // Preparation starts now rather than the night before, so the due date is
    // the day before the call — or today, when the call is sooner than that.
    const prepDue = new Date(scheduledAt);
    prepDue.setDate(prepDue.getDate() - 1);
    prepDue.setHours(12, 0, 0, 0);
    const due = prepDue < new Date() ? new Date() : prepDue;

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { state: "booked", nextAction: "Prepare the call", nextActionDueAt: due },
    });

    await auditInternal(admin.user.id, {
      action: "prospect.booked",
      entityType: "Prospect",
      entityId: prospectId,
      summary: `${prospect.company}: call booked`,
      meta: { callId: call.id, scheduledAt: scheduledAt.toISOString() },
    });

    revalidateAll(`/admin/prospects/${prospectId}`);
    return ok({ id: call.id }, "Call booked. Preparation is now due.");
  });
}

const stageSchema = z.object({
  stage: callStageSchema,
  covered: checkbox,
  note: z.string().max(4000).optional(),
});

export async function saveCallStageAction(
  callId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    await requireInternalStrict("acquisition.manage");
    const input = parseForm(stageSchema, formData);

    const call = await prisma.salesCall.findUnique({ where: { id: callId } });
    if (!call) return err("That call no longer exists.", "not_found");

    const covered = new Set(parseStringArray(call.stagesCovered));
    if (input.covered) covered.add(input.stage);
    else covered.delete(input.stage);

    const notes = Object.fromEntries(
      Object.entries(parseRecord(call.stageNotes)).map(([k, v]) => [k, String(v ?? "")]),
    );
    if (input.note) notes[input.stage] = cleanText(input.note);
    else delete notes[input.stage];

    await prisma.salesCall.update({
      where: { id: callId },
      data: { stagesCovered: stringifyArray([...covered]), stageNotes: stringify(notes) },
    });

    revalidateAll(`/admin/prospects/${call.prospectId}`);
    return okVoid();
  });
}

const outcomeSchema = z.object({
  outcome: callOutcomeSchema,
  attended: checkbox,
  qualified: checkbox,
  offerMade: checkbox,
  voc: z.string().max(8000).optional(),
  objections: z.string().max(8000).optional(),
  value: z.coerce.number().min(0).default(0),
  nextAction: z.string().max(300).optional(),
  nextActionDueAt: optionalDate,
});

export async function recordCallOutcomeAction(
  callId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(outcomeSchema, formData);

    const call = await prisma.salesCall.findUnique({
      where: { id: callId },
      include: { prospect: true },
    });
    if (!call) return err("That call no longer exists.", "not_found");

    if (!input.attended) {
      // A no-show is a funnel event, not an outcome. Recording it as one would
      // corrupt the show rate, which is the number that tells you whether the
      // problem is the booking or the call.
      await prisma.salesCall.update({
        where: { id: callId },
        data: { attended: false, completedAt: new Date() },
      });
      const due = new Date();
      due.setDate(due.getDate() + 1);
      due.setHours(12, 0, 0, 0);
      await prisma.prospect.update({
        where: { id: call.prospectId },
        data: { state: "follow_up", nextAction: "Rebook after the no-show", nextActionDueAt: due },
      });
      await auditInternal(admin.user.id, {
        action: "call.no_show",
        entityType: "SalesCall",
        entityId: callId,
        summary: `${call.prospect.company}: did not attend`,
      });
      revalidateAll(`/admin/prospects/${call.prospectId}`);
      return okVoid("Recorded as a no-show.");
    }

    assertCallOutcome(input.outcome, {
      voc: input.voc,
      nextAction: input.nextAction,
      nextActionDueAt: input.nextActionDueAt,
      stagesCovered: parseStringArray(call.stagesCovered),
    });

    const nextState = OUTCOME_TO_STATE[input.outcome];
    const fallback = defaultNextAction(prospectState(nextState));
    const nextAction = input.nextAction ?? fallback?.action ?? null;
    const nextActionDueAt = input.nextActionDueAt ?? fallback?.dueAt ?? null;
    assertActiveRecord(nextState, { nextAction, nextActionDueAt }, "prospect");

    const now = new Date();
    const terminal = ["won", "lost", "not_fit"].includes(nextState);

    await prisma.$transaction([
      prisma.salesCall.update({
        where: { id: callId },
        data: {
          attended: true,
          qualified: input.qualified,
          offerMade: input.offerMade,
          outcome: input.outcome,
          voc: input.voc ? cleanText(input.voc) : null,
          objections: input.objections ? cleanText(input.objections) : null,
          valueMinor: Math.round(input.value * 100),
          completedAt: now,
        },
      }),
      prisma.prospect.update({
        where: { id: call.prospectId },
        data: {
          state: nextState,
          nextAction,
          nextActionDueAt,
          closedAt: terminal ? now : null,
        },
      }),
    ]);

    await auditInternal(admin.user.id, {
      action: "call.outcome",
      entityType: "SalesCall",
      entityId: callId,
      summary: `${call.prospect.company}: ${input.outcome.replace(/_/g, " ")}`,
      meta: { outcome: input.outcome, qualified: input.qualified },
    });

    revalidateAll(`/admin/prospects/${call.prospectId}`);
    return okVoid("Outcome recorded.");
  });
}

/* --------------------------------- Target ---------------------------------- */

const targetSchema = z.object({
  label: z.string().min(2, "Name the target.").max(200),
  targetWins: z.coerce.number().int().min(1, "A target of zero wins needs no plan."),
  periodStart: optionalDate,
  periodEnd: optionalDate,
  assumedBookingRatePct: z.coerce.number().min(0).max(100).default(0),
  assumedShowRatePct: z.coerce.number().min(0).max(100).default(0),
  assumedQualifiedRatePct: z.coerce.number().min(0).max(100).default(0),
  assumedCloseRatePct: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(4000).optional(),
});

export async function saveTargetAction(
  targetId: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(targetSchema, formData);

    if (!input.periodStart || !input.periodEnd) {
      return err("A target needs a start and an end. Without a period there is no daily quota.", "validation");
    }
    if (input.periodEnd <= input.periodStart) {
      return err("The end of the period has to come after the start.", "validation");
    }

    const data = {
      label: cleanText(input.label, 200),
      targetWins: input.targetWins,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      assumedBookingRatePct: input.assumedBookingRatePct,
      assumedShowRatePct: input.assumedShowRatePct,
      assumedQualifiedRatePct: input.assumedQualifiedRatePct,
      assumedCloseRatePct: input.assumedCloseRatePct,
      notes: input.notes ? cleanText(input.notes) : null,
    };

    if (targetId) {
      await prisma.acquisitionTarget.update({ where: { id: targetId }, data });
    } else {
      // Only one target is active at a time. Two live targets means two daily
      // quotas, which means neither is the answer to "how much today".
      await prisma.acquisitionTarget.updateMany({
        where: { status: "active" },
        data: { status: "closed" },
      });
      await prisma.acquisitionTarget.create({ data: { ...data, status: "active" } });
    }

    await auditInternal(admin.user.id, {
      action: "acquisition.target",
      entityType: "AcquisitionTarget",
      entityId: targetId,
      summary: `${targetId ? "Updated" : "Set"} acquisition target: ${data.targetWins} wins by ${data.periodEnd.toDateString()}`,
    });

    revalidateAll();
    return okVoid("Target saved.");
  });
}

/* ---------------------------- Weekly control loop --------------------------- */

const reviewSchema = z.object({
  weekStart: optionalDate,
  counts: z.string().max(4000),
  brokenStep: z.string().max(120).optional(),
  variableChanged: z.string().max(600).optional(),
  hypothesis: z.string().max(2000).optional(),
  learning: z.string().max(4000).optional(),
});

export async function saveFunnelReviewAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("acquisition.manage");
    const input = parseForm(reviewSchema, formData);

    if (!input.weekStart) return err("Choose the week being reviewed.", "validation");

    // One meaningful variable per week. Changing five things at once produces a
    // result that cannot be attributed to any of them, which is worse than
    // changing nothing at all.
    if (input.variableChanged && input.variableChanged.split(/[,;\n]/).filter((s) => s.trim()).length > 1) {
      throw new WorkflowError(
        "Change one variable. Several at once produces a result nobody can attribute, and next week you will not know which one worked.",
      );
    }

    await prisma.funnelReview.upsert({
      where: { weekStart: input.weekStart },
      create: {
        weekStart: input.weekStart,
        counts: input.counts,
        brokenStep: input.brokenStep ?? null,
        variableChanged: input.variableChanged ? cleanText(input.variableChanged, 600) : null,
        hypothesis: input.hypothesis ? cleanText(input.hypothesis) : null,
        learning: input.learning ? cleanText(input.learning) : null,
        createdById: admin.user.id,
      },
      update: {
        brokenStep: input.brokenStep ?? null,
        variableChanged: input.variableChanged ? cleanText(input.variableChanged, 600) : null,
        hypothesis: input.hypothesis ? cleanText(input.hypothesis) : null,
        learning: input.learning ? cleanText(input.learning) : null,
      },
    });

    await auditInternal(admin.user.id, {
      action: "acquisition.review",
      entityType: "FunnelReview",
      summary: `Weekly acquisition review for ${input.weekStart.toDateString()}`,
      meta: { brokenStep: input.brokenStep ?? null },
    });

    revalidateAll();
    return okVoid("Review recorded and the counts are frozen.");
  });
}
