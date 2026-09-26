-- AlterTable
ALTER TABLE "AcquisitionTarget" ADD COLUMN     "audienceAsOf" TIMESTAMP(3),
ADD COLUMN     "audienceSize" INTEGER;

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "demandSource" TEXT,
ADD COLUMN     "demandSourceNote" TEXT;

-- CreateTable
CREATE TABLE "ProspectTouch" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT,
    "note" TEXT,
    "byId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectTouch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectTouch_at_idx" ON "ProspectTouch"("at");

-- CreateIndex
CREATE INDEX "ProspectTouch_prospectId_at_idx" ON "ProspectTouch"("prospectId", "at");

-- AddForeignKey
ALTER TABLE "ProspectTouch" ADD CONSTRAINT "ProspectTouch_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

