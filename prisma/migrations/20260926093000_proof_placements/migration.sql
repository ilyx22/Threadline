-- AlterTable
ALTER TABLE "ProofPermission" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "scopeNote" TEXT;

-- CreateTable
CREATE TABLE "ProofPlacement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "evidence" TEXT,
    "placedById" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flaggedAt" TIMESTAMP(3),
    "flagReason" TEXT,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ProofPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProofPlacement_orgId_permission_idx" ON "ProofPlacement"("orgId", "permission");

