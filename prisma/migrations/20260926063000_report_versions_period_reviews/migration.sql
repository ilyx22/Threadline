-- DropIndex
DROP INDEX "WeeklyReport_orgId_periodStart_key";

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "finalisedAt" TIMESTAMP(3),
ADD COLUMN     "finalisedById" TEXT,
ADD COLUMN     "revisionReason" TEXT,
ADD COLUMN     "supersededAt" TIMESTAMP(3),
ADD COLUMN     "supersedesId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PeriodReview" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "figures" TEXT NOT NULL DEFAULT '{}',
    "action" TEXT NOT NULL DEFAULT '',
    "results" TEXT NOT NULL DEFAULT '',
    "problems" TEXT NOT NULL DEFAULT '',
    "future" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "finalisedAt" TIMESTAMP(3),
    "finalisedById" TEXT,
    "supersededAt" TIMESTAMP(3),
    "revisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodReview_orgId_periodStart_idx" ON "PeriodReview"("orgId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodReview_engagementId_periodNumber_version_key" ON "PeriodReview"("engagementId", "periodNumber", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_orgId_periodStart_version_key" ON "WeeklyReport"("orgId", "periodStart", "version");


-- Hand-written: one working draft per period at a time, and finalisation dates for existing final reports.
CREATE UNIQUE INDEX "WeeklyReport_one_draft_per_period" ON "WeeklyReport"("orgId", "periodStart") WHERE "status" = 'draft';
CREATE UNIQUE INDEX "PeriodReview_one_draft_per_period" ON "PeriodReview"("engagementId", "periodNumber") WHERE "status" = 'draft';
UPDATE "WeeklyReport" SET "finalisedAt" = "updatedAt" WHERE "status" = 'final' AND "finalisedAt" IS NULL;
