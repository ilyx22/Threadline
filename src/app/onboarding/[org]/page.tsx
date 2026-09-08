import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrgAccess } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { parseWith } from "@/lib/db/json";
import { z } from "zod";
import { onboardingDataSchema } from "@/lib/domain/onboarding";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgAccess(slug, "brain.edit");

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

  return (
    <OnboardingFlow
      slug={slug}
      orgName={ctx.org.name}
      founderName={ctx.user.name}
      currentStep={session.currentStep}
      completedSteps={completed}
      data={data}
    />
  );
}
