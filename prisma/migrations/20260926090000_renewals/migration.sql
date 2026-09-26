-- CreateTable
CREATE TABLE "RenewalReview" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "note" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenewalReview_orgId_state_idx" ON "RenewalReview"("orgId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalReview_engagementId_periodNumber_key" ON "RenewalReview"("engagementId", "periodNumber");

