"use server";

import { prisma } from "@/lib/db/client";
import { stringifyArray } from "@/lib/db/json";
import { applicationSchema } from "@/lib/domain/application";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { cleanText, cleanUrl, guarded, ok, parseForm, type ActionResult } from "./shared";

/**
 * Public application submission.
 *
 * The only unauthenticated write in the product. It is rate limited, validated
 * strictly, and writes to a table with no `orgId` — an application is not tenant
 * data until an operator converts it into a client.
 */

export async function submitApplicationAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    await enforceRateLimit("application", LIMITS.application);

    const input = parseForm(applicationSchema, formData);

    const platforms = Array.isArray(input.platforms)
      ? input.platforms
      : input.platforms
        ? [input.platforms]
        : [];

    // Same person within a day: update rather than creating duplicates.
    const existing = await prisma.application.findFirst({
      where: {
        email: input.email.toLowerCase(),
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
      },
      select: { id: true },
    });

    const data = {
      name: cleanText(input.name, 120),
      email: input.email.toLowerCase(),
      company: cleanText(input.company, 200),
      website: cleanUrl(input.website),
      whatYouSell: cleanText(input.whatYouSell, 2000),
      revenueRange: input.revenueRange,
      contentProcess: cleanText(input.contentProcess, 2000),
      peopleInvolved: input.peopleInvolved,
      publishCadence: input.publishCadence,
      biggestBottleneck: cleanText(input.biggestBottleneck, 2000),
      founderHours: input.founderHours,
      platforms: stringifyArray(platforms),
      successLooksLike: cleanText(input.successLooksLike, 2000),
      urgency: input.urgency,
      extra: input.extra ? cleanText(input.extra, 4000) : null,
    };

    const application = existing
      ? await prisma.application.update({ where: { id: existing.id }, data })
      : await prisma.application.create({ data });

    // COM-01: one confirmation to the applicant and one alert to Threadline per
    // application (an update within the day sends nothing new). Idempotency keys
    // make a retried submission harmless.
    if (!existing) {
      await enqueue("email.send", { to: application.email, template: "application_received", data: { name: application.name.split(" ")[0] } }, { idempotencyKey: `application:${application.id}:confirmation` });
      const ops = process.env.OPS_NOTIFY_EMAIL?.trim();
      if (ops) {
        await enqueue(
          "email.send",
          { to: ops, template: "application_operator_alert", data: { name: application.name, company: application.company, urgency: application.urgency, link: `${appUrl()}/admin/applications?open=${application.id}` } },
          { idempotencyKey: `application:${application.id}:operator` },
        );
      }
      await prisma.application.update({ where: { id: application.id }, data: { confirmationQueuedAt: new Date(), operatorNotifiedAt: ops ? new Date() : null } });
    }

    return ok({ id: application.id }, "Application received.");
  });
}
