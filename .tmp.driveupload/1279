"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { stringifyArray } from "@/lib/db/json";
import {
  CHECK_BY_KEY,
  READINESS_CHECKS,
  RECORDING_FORMATS,
  assertReadinessAssessment,
  needsClientAction,
  type ReadinessCheckKey,
  type ReadinessStatus,
} from "@/lib/domain/readiness";
import { cleanText, cleanUrl, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Recording readiness mutations.
 *
 * Two halves, deliberately separated by capability:
 *
 *   - the client describes their setup and supplies photos and a test clip
 *   - an operator assesses it and sets the status
 *
 * The client cannot mark their own room ready. That is not distrust; it is that
 * the whole value of the check is a second pair of eyes on something the person
 * in the room has stopped noticing.
 */

/* ------------------------------ Client submits ----------------------------- */

const submissionSchema = z.object({
  roomNotes: z.string().max(4000).optional(),
  gearNotes: z.string().max(4000).optional(),
  formats: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      return list.filter((v): v is string => RECORDING_FORMATS.includes(v as never));
    }),
});

export async function submitRecordingSetupAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "recording.view");
    const input = parseForm(submissionSchema, formData);

    if (input.formats.length === 0) {
      return err("Choose at least one format you need to record.", "validation", {
        formats: "Pick a format.",
      });
    }

    const data = {
      roomNotes: input.roomNotes ? cleanText(input.roomNotes, 4000) : null,
      gearNotes: input.gearNotes ? cleanText(input.gearNotes, 4000) : null,
      formats: stringifyArray(input.formats),
      submittedAt: new Date(),
    };

    await prisma.recordingReadiness.upsert({
      where: { orgId: ctx.org.id },
      create: { orgId: ctx.org.id, ...data },
      update: data,
    });

    // The assessment is Threadline's job, so the submission raises it.
    const existing = await prisma.task.findFirst({
      where: {
        orgId: ctx.org.id,
        audience: "internal",
        status: { in: ["open", "in_progress"] },
        title: "Assess the recording setup",
      },
      select: { id: true },
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          orgId: ctx.org.id,
          title: "Assess the recording setup",
          description:
            "The client has described their room, gear and formats. Review the photos and test clip, rate each check, and set an honest status.",
          kind: "review",
          audience: "internal",
          priority: "high",
          estimateMin: 20,
        },
      });
    }

    await audit(ctx, {
      action: "readiness.submit",
      entityType: "recording_readiness",
      entityId: ctx.org.id,
      summary: `Submitted recording setup for review (${input.formats.join(", ")})`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/install/recording`);

    return okVoid("Sent to Threadline for review.");
  });
}

/** Attach a setup photo or a test clip by URL. Uploads use the library route. */
export async function addReadinessReferenceAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "library.upload");
    const input = parseForm(
      z.object({
        category: z.enum(["setup_photo", "test_clip"]),
        title: z.string().min(2, "Give it a name.").max(200),
        url: z.string().min(4, "Add the link.").max(600),
        description: z.string().max(1000).optional(),
      }),
      formData,
    );

    const url = cleanUrl(input.url);
    if (!url) return err("That does not look like a valid link.", "validation", { url: "Invalid link." });

    const asset = await prisma.asset.create({
      data: {
        orgId: ctx.org.id,
        category: input.category,
        title: cleanText(input.title, 200),
        description: input.description ? cleanText(input.description, 1000) : null,
        externalUrl: url,
        uploadedById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "readiness.reference",
      entityType: "asset",
      entityId: asset.id,
      summary: `Added a ${input.category.replace(/_/g, " ")} for the recording setup`,
    });
    revalidatePath(`/app/${orgSlug}/install/recording`);

    return ok({ id: asset.id }, "Added.");
  });
}

/* --------------------------- Operator assesses ----------------------------- */

const assessmentSchema = z.object({
  status: z.enum(["not_assessed", "ready", "ready_with_limitation", "blocked"]),
  recommendation: z.string().max(4000).optional(),
  clientAction: z.string().max(1000).optional(),
  ...Object.fromEntries(
    READINESS_CHECKS.flatMap((key) => [
      [`state_${key}`, z.enum(["unknown", "ok", "limitation", "blocked"]).optional()],
      [`note_${key}`, z.string().max(1000).optional()],
    ]),
  ),
});

/**
 * Record the assessment.
 *
 * The gates in `assertReadinessAssessment` are the point of the whole feature:
 * a setup cannot be called ready with a check unlooked-at or blocking, and a
 * blocked or limited setup owes the client one specific action. Without those,
 * this is a form that produces a green badge.
 */
export async function assessRecordingSetupAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "readiness.assess");
    const input = parseForm(assessmentSchema, formData);
    const raw = input as Record<string, unknown>;

    const checks = READINESS_CHECKS.map((key) => ({
      key,
      state: (raw[`state_${key}`] as string) ?? "unknown",
      note: (raw[`note_${key}`] as string) ?? "",
    }));

    // The dynamic per-check keys widen the inferred object, so the two free-text
    // fields are read off the raw record rather than the narrowed shape.
    const status = input.status as ReadinessStatus;
    const clientActionRaw = typeof raw.clientAction === "string" ? raw.clientAction : "";
    const recommendationRaw = typeof raw.recommendation === "string" ? raw.recommendation : "";
    const clientAction = clientActionRaw ? cleanText(clientActionRaw, 1000) : null;
    const recommendation = recommendationRaw ? cleanText(recommendationRaw, 4000) : null;

    assertReadinessAssessment(status, checks, { clientAction });

    const readiness = await prisma.recordingReadiness.upsert({
      where: { orgId: ctx.org.id },
      create: {
        orgId: ctx.org.id,
        status,
        recommendation,
        clientAction,
        reviewedAt: new Date(),
        reviewedById: ctx.user.id,
      },
      update: {
        status,
        recommendation,
        clientAction,
        reviewedAt: new Date(),
        reviewedById: ctx.user.id,
      },
    });

    for (const check of checks) {
      await prisma.readinessCheck.upsert({
        where: { readinessId_key: { readinessId: readiness.id, key: check.key } },
        create: {
          readinessId: readiness.id,
          key: check.key,
          state: check.state,
          note: check.note ? cleanText(check.note, 1000) : null,
        },
        update: {
          state: check.state,
          note: check.note ? cleanText(check.note, 1000) : null,
        },
      });
    }

    // A blocked or limited setup becomes a real client task rather than a badge
    // nobody acts on. A ready one closes any task the previous assessment raised.
    const openTask = await prisma.task.findFirst({
      where: {
        orgId: ctx.org.id,
        audience: "client",
        kind: "ops",
        status: { in: ["open", "in_progress"] },
        title: { startsWith: "Recording setup" },
      },
      select: { id: true },
    });

    if (needsClientAction(status) && clientAction) {
      const title =
        status === "blocked" ? "Recording setup needs fixing" : "Recording setup has a limitation";
      if (openTask) {
        await prisma.task.update({
          where: { id: openTask.id },
          data: { title, description: clientAction, priority: status === "blocked" ? "urgent" : "medium" },
        });
      } else {
        await prisma.task.create({
          data: {
            orgId: ctx.org.id,
            title,
            description: clientAction,
            kind: "ops",
            audience: "client",
            priority: status === "blocked" ? "urgent" : "medium",
            estimateMin: 20,
          },
        });
      }
      await prisma.notification.create({
        data: {
          orgId: ctx.org.id,
          kind: "alert",
          title,
          body: clientAction,
          href: `/app/${orgSlug}/install/recording`,
          severity: status === "blocked" ? "warning" : "info",
        },
      });
    } else if (openTask) {
      await prisma.task.update({
        where: { id: openTask.id },
        data: { status: "done", completedAt: new Date() },
      });
    }

    const blocking = checks.filter((c) => c.state === "blocked").map((c) => CHECK_BY_KEY[c.key as ReadinessCheckKey].label);

    await audit(ctx, {
      action: "readiness.assess",
      entityType: "recording_readiness",
      entityId: readiness.id,
      summary: `Recording setup assessed as ${status.replace(/_/g, " ")}${blocking.length ? ` — blocking: ${blocking.join(", ")}` : ""}`,
      meta: { status, blocking },
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/install/recording`);
    revalidatePath(`/app/${orgSlug}/install`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid(
      needsClientAction(status)
        ? "Assessment saved. The client has been given the action."
        : "Assessment saved.",
    );
  });
}
