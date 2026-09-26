-- AlterTable
ALTER TABLE "Engagement" ADD COLUMN     "earlyWinAchievedOn" DATE,
ADD COLUMN     "earlyWinDefinition" TEXT,
ADD COLUMN     "earlyWinEvidence" TEXT,
ADD COLUMN     "installationSignedOffAt" TIMESTAMP(3),
ADD COLUMN     "installationSignedOffById" TEXT;

