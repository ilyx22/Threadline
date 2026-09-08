"use server";

import { prisma } from "@/lib/db/client";
import { stringifyArray } from "@/lib/db/json";
import { applicationSchema } from "@/lib/domain/application";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
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

    return ok({ id: application.id }, "Application received.");
  });
}
