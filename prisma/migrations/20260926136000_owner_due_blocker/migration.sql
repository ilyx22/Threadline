-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedReason" TEXT;

-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT;

