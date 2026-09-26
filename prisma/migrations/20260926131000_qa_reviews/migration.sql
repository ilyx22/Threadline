-- CreateTable
CREATE TABLE "QaReview" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "checks" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QaReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QaReview_orgId_contentItemId_createdAt_idx" ON "QaReview"("orgId", "contentItemId", "createdAt");

