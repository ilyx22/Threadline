-- CreateTable
CREATE TABLE "ResearchSchedule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "focus" TEXT,
    "cadenceDays" INTEGER NOT NULL DEFAULT 7,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastRunId" TEXT,
    "lastOutcome" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchSchedule_active_nextRunAt_idx" ON "ResearchSchedule"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "ResearchSchedule_orgId_idx" ON "ResearchSchedule"("orgId");

