-- AlterTable
ALTER TABLE "MarketWedge" ADD COLUMN     "testedBeforeValidation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uncertaintyAt" TIMESTAMP(3),
ADD COLUMN     "uncertaintyById" TEXT,
ADD COLUMN     "uncertaintyNote" TEXT;

