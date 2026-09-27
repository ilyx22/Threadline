import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { parseWith } from "@/lib/db/json";
import { z } from "zod";
import { onboardingDataSchema, onboardingPhase, type FieldSource } from "@/lib/domain/onboarding";
import { isLiveAi } from "@/lib/ai";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  // A teammate without Brand Brain rights gets a plain explanation, not an error page.
  const ctx = await requireOrgPage(slug, "brain.edit");

  const session = await prisma.onboardingSession.upsert({
    where: { orgId: ctx.org.id },
    create: { orgId: ctx.org.id, currentStep: "welcome", status: "in_progress" },
    update: {},
  });

  // A completed onboarding sends the founder into the product, not back through it.
  if (session.status === "complete" && session.currentStep === "done") {
    redirect(`/app/${slug}`);
  }

  const data = parseWith(session.data, onboardingDataSchema, onboardingDataSchema.parse({}));
  const completed = parseWith(session.completedSteps, z.array(z.string()), [] as string[]);
  const fieldSources = parseWith(session.fieldSources, z.record(z.string(), z.enum(["threadline", "client"])), {} as Record<string, FieldSource>);
  const phase = onboardingPhase({ mode: session.mode, isStaff: ctx.isInternal, sentForReview: Boolean(session.sentForReviewAt) });

  return (
    <OnboardingFlow
      slug={slug}
      orgName={ctx.org.name}
      founderName={ctx.user.name}
      currentStep={session.currentStep}
      completedSteps={completed}
      data={data}
      phase={phase}
      mode={session.mode}
      fieldSources={fieldSources}
      aiLive={ctx.isInternal && isLiveAi()}
    />
  );
}
