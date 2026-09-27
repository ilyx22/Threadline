-- AlterTable
ALTER TABLE "Engagement" ADD COLUMN     "cadenceOffsetDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkInWeekday" INTEGER,
ADD COLUMN     "kickoffAt" TIMESTAMP(3),
ADD COLUMN     "relationshipOwnerId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "subjectId" TEXT,
ADD COLUMN     "subjectType" TEXT;

-- CreateTable
CREATE TABLE "RelationshipTouch" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "completedAt" TIMESTAMP(3),
    "attioTaskId" TEXT,
    "syncedDueAt" TIMESTAMP(3),
    "remoteClosed" BOOLEAN NOT NULL DEFAULT false,
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipTouch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipTouch_orgId_status_idx" ON "RelationshipTouch"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipTouch_engagementId_key_key" ON "RelationshipTouch"("engagementId", "key");

-- AddForeignKey
ALTER TABLE "RelationshipTouch" ADD CONSTRAINT "RelationshipTouch_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

