-- AlterTable
ALTER TABLE "AiGeneration" ADD COLUMN     "costMicroUsd" INTEGER,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "aiBudgetMicroUsd" INTEGER;

