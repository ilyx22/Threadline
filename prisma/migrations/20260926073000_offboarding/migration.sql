-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "accessEndsAt" TIMESTAMP(3),
ADD COLUMN     "legalHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offboardedAt" TIMESTAMP(3),
ADD COLUMN     "retentionUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OffboardingRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "startedById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessEndsAt" TIMESTAMP(3) NOT NULL,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "exportAssetId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletionCounts" TEXT,

    CONSTRAINT "OffboardingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingRecord_orgId_key" ON "OffboardingRecord"("orgId");

