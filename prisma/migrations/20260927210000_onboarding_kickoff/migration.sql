-- Onboarding on the kickoff call (additive).
ALTER TABLE "OnboardingSession" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'kickoff';
ALTER TABLE "OnboardingSession" ADD COLUMN "fieldSources" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "OnboardingSession" ADD COLUMN "sentForReviewAt" TIMESTAMP(3);
