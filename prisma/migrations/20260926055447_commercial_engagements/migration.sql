-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "confirmationQueuedAt" TIMESTAMP(3),
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDue" TIMESTAMP(3),
ADD COLUMN     "operatorNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "outcomeReason" TEXT,
ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "orgId" TEXT;

-- CreateTable
CREATE TABLE "OfferTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "setupFeeMinor" INTEGER NOT NULL,
    "periodFeeMinor" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL DEFAULT 28,
    "initialPeriods" INTEGER NOT NULL DEFAULT 3,
    "entitlements" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "offerTemplateId" TEXT,
    "offerSnapshot" TEXT NOT NULL DEFAULT '{}',
    "agreementVersion" TEXT,
    "agreementSignedAt" TIMESTAMP(3),
    "agreementEvidence" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "setupFeeMinor" INTEGER NOT NULL,
    "periodFeeMinor" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL DEFAULT 28,
    "initialPeriods" INTEGER NOT NULL DEFAULT 3,
    "startDate" DATE,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "activatedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "entitlements" TEXT NOT NULL DEFAULT '{}',
    "earlyWinDueDate" DATE,
    "sourceApplicationId" TEXT,
    "sourceProspectId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePeriod" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "feeMinor" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeChange" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "state" TEXT NOT NULL DEFAULT 'proposed',
    "requestedById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "effectiveFromPeriod" INTEGER,
    "feeChangeMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScopeChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmOutbox" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "remoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "CrmOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmLink" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "remoteObject" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "remoteUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferTemplate_key_key" ON "OfferTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_sourceApplicationId_key" ON "Engagement"("sourceApplicationId");

-- CreateIndex
CREATE INDEX "Engagement_orgId_status_idx" ON "Engagement"("orgId", "status");

-- CreateIndex
CREATE INDEX "ServicePeriod_orgId_startDate_idx" ON "ServicePeriod"("orgId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePeriod_engagementId_number_key" ON "ServicePeriod"("engagementId", "number");

-- CreateIndex
CREATE INDEX "ScopeChange_engagementId_state_idx" ON "ScopeChange"("engagementId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "CrmOutbox_idempotencyKey_key" ON "CrmOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CrmOutbox_state_createdAt_idx" ON "CrmOutbox"("state", "createdAt");

-- CreateIndex
CREATE INDEX "CrmOutbox_entityType_entityId_idx" ON "CrmOutbox"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmLink_provider_entityType_entityId_key" ON "CrmLink"("provider", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmLink_provider_remoteObject_remoteId_key" ON "CrmLink"("provider", "remoteObject", "remoteId");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_offerTemplateId_fkey" FOREIGN KEY ("offerTemplateId") REFERENCES "OfferTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePeriod" ADD CONSTRAINT "ServicePeriod_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeChange" ADD CONSTRAINT "ScopeChange_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reference data (ENG-02): the standard offer from the commercial brief:
-- £2,500 setup plus £2,500 per 28-day period, three periods initially
-- (£10,000 initial contract value). Amounts in minor units (pence).
INSERT INTO "OfferTemplate" ("id", "key", "name", "description", "currency", "setupFeeMinor", "periodFeeMinor", "periodDays", "initialPeriods", "entitlements", "active", "version", "updatedAt")
VALUES ('offer_standard_v1', 'standard', 'Threadline engagement', 'Setup plus three 28-day service periods, then period to period.', 'GBP', 250000, 250000, 28, 3, '{}', true, 1, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Backfill (ENG-01): every client workspace that has started gets an active
-- engagement carrying its existing fees, so period numbering is unchanged.
INSERT INTO "Engagement" ("id", "orgId", "offerSnapshot", "currency", "setupFeeMinor", "periodFeeMinor", "periodDays", "initialPeriods", "startDate", "timezone", "status", "activatedAt", "updatedAt")
SELECT 'eng_' || o."id", o."id", '{"source":"backfill from workspace fees"}', o."currency", o."setupFee", o."periodFee", 28, 3,
       (o."startedAt" AT TIME ZONE o."timezone")::date, o."timezone",
       CASE WHEN o."status" = 'churned' THEN 'ended' WHEN o."status" = 'paused' THEN 'paused' ELSE 'active' END,
       o."startedAt", CURRENT_TIMESTAMP
FROM "Organization" o
WHERE o."kind" = 'client' AND o."startedAt" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Engagement" e WHERE e."orgId" = o."id");
