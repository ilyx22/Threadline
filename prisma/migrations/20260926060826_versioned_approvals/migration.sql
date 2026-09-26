-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "version" TEXT;

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "versionLabel" TEXT,
    "contentHash" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reviewerId" TEXT,
    "authority" TEXT NOT NULL,
    "scope" TEXT,
    "note" TEXT,
    "reviewRequestedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    "supersededReason" TEXT,
    "batchId" TEXT,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewBatch" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT,
    "dueAt" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "outcome" TEXT,

    CONSTRAINT "ReviewBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Approval_orgId_entityType_entityId_idx" ON "Approval"("orgId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Approval_orgId_decidedAt_idx" ON "Approval"("orgId", "decidedAt");

-- CreateIndex
CREATE INDEX "ReviewBatch_orgId_state_idx" ON "ReviewBatch"("orgId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewBatchItem_batchId_entityType_entityId_key" ON "ReviewBatchItem"("batchId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ReviewBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewBatchItem" ADD CONSTRAINT "ReviewBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ReviewBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
