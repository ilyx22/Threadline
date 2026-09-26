-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "processingState" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "uploadId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "partSize" INTEGER NOT NULL,
    "partCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "category" TEXT NOT NULL,
    "title" TEXT,
    "contentItemId" TEXT,
    "assetId" TEXT,
    "error" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "externalId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "outputAssetId" TEXT,
    "error" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffortEntry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorKind" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "workDate" DATE NOT NULL,
    "contentItemId" TEXT,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EffortEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_storagePath_key" ON "UploadSession"("storagePath");

-- CreateIndex
CREATE INDEX "UploadSession_status_expiresAt_idx" ON "UploadSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "UploadSession_orgId_userId_idx" ON "UploadSession"("orgId", "userId");

-- CreateIndex
CREATE INDEX "ProcessingTask_status_idx" ON "ProcessingTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingTask_assetId_kind_key" ON "ProcessingTask"("assetId", "kind");

-- CreateIndex
CREATE INDEX "EffortEntry_orgId_workDate_idx" ON "EffortEntry"("orgId", "workDate");

-- CreateIndex
CREATE INDEX "EffortEntry_orgId_actorKind_workDate_idx" ON "EffortEntry"("orgId", "actorKind", "workDate");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingTask" ADD CONSTRAINT "ProcessingTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingTask" ADD CONSTRAINT "ProcessingTask_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EffortEntry" ADD CONSTRAINT "EffortEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A day holds at most 1,440 minutes; zero or negative effort is refused.
ALTER TABLE "EffortEntry" ADD CONSTRAINT "EffortEntry_minutes_range" CHECK ("minutes" BETWEEN 1 AND 1440);
