-- AlterTable
ALTER TABLE "ProspectTouch" ADD COLUMN     "messageVersion" TEXT;

-- AlterTable
ALTER TABLE "ValidationConversation" ADD COLUMN     "awarenessState" TEXT,
ADD COLUMN     "problemEnergy" INTEGER;

