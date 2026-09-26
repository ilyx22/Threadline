-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "contactRole" TEXT,
ADD COLUMN     "isExpert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profiles" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "mfaVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mfaEnabledAt" TIMESTAMP(3),
ADD COLUMN     "mfaLastStep" INTEGER,
ADD COLUMN     "mfaRecoveryHashes" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "mfaSecret" TEXT;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "profiles" TEXT NOT NULL DEFAULT '[]',
    "isExpert" BOOLEAN NOT NULL DEFAULT false,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "contentItemId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_orgId_state_idx" ON "Invitation"("orgId", "state");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "WorkAssignment_userId_idx" ON "WorkAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkAssignment_orgId_userId_kind_contentItemId_key" ON "WorkAssignment"("orgId", "userId", "kind", "contentItemId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAssignment" ADD CONSTRAINT "WorkAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written (TEAM-02, TEAM-06): at most one pending invitation per address
-- per workspace, and at most one owner per workspace, enforced by the database
-- so concurrent requests cannot create duplicates.
CREATE UNIQUE INDEX "Invitation_one_pending_per_email" ON "Invitation"("orgId", lower("email")) WHERE "state" = 'pending';
CREATE UNIQUE INDEX "Membership_one_owner_per_org" ON "Membership"("orgId") WHERE "isOwner";

-- Backfill (TEAM-01): permission profiles from the existing roles.
UPDATE "Membership" SET "profiles" = '["admin","approver","commercial"]' WHERE "role" = 'client_admin';
UPDATE "Membership" SET "profiles" = '["contributor"]' WHERE "role" IN ('client_member', 'editor');

-- Backfill (TEAM-06): the earliest client admin of each client workspace is its owner.
UPDATE "Membership" m SET "isOwner" = true
FROM (
  SELECT DISTINCT ON (mm."orgId") mm."id"
  FROM "Membership" mm JOIN "Organization" o ON o."id" = mm."orgId"
  WHERE mm."role" = 'client_admin' AND o."kind" = 'client'
  ORDER BY mm."orgId", mm."isPrimary" DESC, mm."createdAt" ASC
) first_admin
WHERE m."id" = first_admin."id";
