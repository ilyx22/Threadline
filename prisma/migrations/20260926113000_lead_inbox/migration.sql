-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "qualification" TEXT;

-- CreateTable
CREATE TABLE "LeadMessage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "externalRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplyDraft" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedBy" TEXT NOT NULL DEFAULT 'human',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplyDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundSource" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'website_form',
    "tokenHash" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "InboundSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadMessage_inquiryId_occurredAt_idx" ON "LeadMessage"("inquiryId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadMessage_orgId_channel_externalRef_key" ON "LeadMessage"("orgId", "channel", "externalRef");

-- CreateIndex
CREATE INDEX "ReplyDraft_inquiryId_status_idx" ON "ReplyDraft"("inquiryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InboundSource_tokenHash_key" ON "InboundSource"("tokenHash");

-- CreateIndex
CREATE INDEX "InboundSource_orgId_idx" ON "InboundSource"("orgId");

-- CreateIndex
CREATE INDEX "Inquiry_orgId_dedupeKey_idx" ON "Inquiry"("orgId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyDraft" ADD CONSTRAINT "ReplyDraft_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundSource" ADD CONSTRAINT "InboundSource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

