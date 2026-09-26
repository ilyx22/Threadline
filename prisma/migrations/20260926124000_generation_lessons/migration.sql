-- CreateTable
CREATE TABLE "GenerationLesson" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'workspace',
    "platform" TEXT,
    "basis" TEXT NOT NULL,
    "correctionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredById" TEXT,
    "retiredAt" TIMESTAMP(3),
    "retiredReason" TEXT,

    CONSTRAINT "GenerationLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationLesson_orgId_status_idx" ON "GenerationLesson"("orgId", "status");

