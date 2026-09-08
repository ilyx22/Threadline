-- CreateTable
CREATE TABLE "MarketWedge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'candidate',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "problem" TEXT,
    "outcome" TEXT,
    "qualification" TEXT,
    "mechanism" TEXT,
    "scoreEconomics" INTEGER NOT NULL DEFAULT 0,
    "scorePain" INTEGER NOT NULL DEFAULT 0,
    "scoreReach" INTEGER NOT NULL DEFAULT 0,
    "scorePrecedent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "frozenAt" DATETIME,
    "ownerId" TEXT,
    "nextAction" TEXT,
    "nextActionDueAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketWedge_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wedgeId" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "company" TEXT,
    "heldAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problem" TEXT NOT NULL,
    "volunteered" BOOLEAN NOT NULL DEFAULT false,
    "quote" TEXT,
    "currentProcess" TEXT,
    "triedBefore" TEXT,
    "consequence" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationConversation_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "contactRole" TEXT,
    "website" TEXT,
    "state" TEXT NOT NULL DEFAULT 'new',
    "tier" TEXT NOT NULL DEFAULT 'b',
    "wedgeId" TEXT,
    "channel" TEXT,
    "sourceNote" TEXT,
    "economicsNote" TEXT,
    "constraintHypothesis" TEXT,
    "replyClass" TEXT,
    "ownerId" TEXT,
    "nextAction" TEXT,
    "nextActionDueAt" DATETIME,
    "crmProvider" TEXT,
    "crmRecordId" TEXT,
    "crmRecordUrl" TEXT,
    "firstTouchAt" DATETIME,
    "repliedAt" DATETIME,
    "positiveReplyAt" DATETIME,
    "closedAt" DATETIME,
    "closedReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prospect_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SopCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prospectId" TEXT,
    "wedgeId" TEXT,
    "state" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SopCheck_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SopCheck_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prospectId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "offerMade" BOOLEAN NOT NULL DEFAULT false,
    "stagesCovered" TEXT NOT NULL DEFAULT '[]',
    "stageNotes" TEXT NOT NULL DEFAULT '{}',
    "outcome" TEXT,
    "voc" TEXT,
    "objections" TEXT,
    "valueMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "ownerId" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesCall_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesCall_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcquisitionTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "targetWins" INTEGER NOT NULL DEFAULT 2,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assumedBookingRatePct" REAL NOT NULL DEFAULT 0,
    "assumedShowRatePct" REAL NOT NULL DEFAULT 0,
    "assumedQualifiedRatePct" REAL NOT NULL DEFAULT 0,
    "assumedCloseRatePct" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FunnelReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "counts" TEXT NOT NULL DEFAULT '{}',
    "brokenStep" TEXT,
    "variableChanged" TEXT,
    "hypothesis" TEXT,
    "learning" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FunnelReview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'inquiry',
    "source" TEXT NOT NULL DEFAULT 'content',
    "contentItemId" TEXT,
    "publishRecordId" TEXT,
    "cta" TEXT,
    "leadMagnet" TEXT,
    "link" TEXT,
    "valueMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "notes" TEXT,
    "attribution" TEXT NOT NULL DEFAULT 'qualitative_only',
    "evidenceBasis" TEXT NOT NULL DEFAULT 'client_reported',
    "evidenceSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("closedAt", "company", "contentItemId", "createdAt", "cta", "currency", "email", "id", "leadMagnet", "link", "name", "notes", "occurredAt", "orgId", "publishRecordId", "source", "stage", "updatedAt", "valueMinor") SELECT "closedAt", "company", "contentItemId", "createdAt", "cta", "currency", "email", "id", "leadMagnet", "link", "name", "notes", "occurredAt", "orgId", "publishRecordId", "source", "stage", "updatedAt", "valueMinor" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE INDEX "Inquiry_orgId_stage_idx" ON "Inquiry"("orgId", "stage");
CREATE INDEX "Inquiry_orgId_occurredAt_idx" ON "Inquiry"("orgId", "occurredAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MarketWedge_state_idx" ON "MarketWedge"("state");

-- CreateIndex
CREATE INDEX "MarketWedge_active_idx" ON "MarketWedge"("active");

-- CreateIndex
CREATE INDEX "ValidationConversation_wedgeId_heldAt_idx" ON "ValidationConversation"("wedgeId", "heldAt");

-- CreateIndex
CREATE INDEX "Prospect_state_nextActionDueAt_idx" ON "Prospect"("state", "nextActionDueAt");

-- CreateIndex
CREATE INDEX "Prospect_tier_state_idx" ON "Prospect"("tier", "state");

-- CreateIndex
CREATE INDEX "Prospect_firstTouchAt_idx" ON "Prospect"("firstTouchAt");

-- CreateIndex
CREATE INDEX "SopCheck_prospectId_idx" ON "SopCheck"("prospectId");

-- CreateIndex
CREATE INDEX "SopCheck_wedgeId_idx" ON "SopCheck"("wedgeId");

-- CreateIndex
CREATE UNIQUE INDEX "SopCheck_prospectId_state_key_key" ON "SopCheck"("prospectId", "state", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SopCheck_wedgeId_state_key_key" ON "SopCheck"("wedgeId", "state", "key");

-- CreateIndex
CREATE INDEX "SalesCall_scheduledAt_idx" ON "SalesCall"("scheduledAt");

-- CreateIndex
CREATE INDEX "SalesCall_prospectId_idx" ON "SalesCall"("prospectId");

-- CreateIndex
CREATE INDEX "AcquisitionTarget_status_periodStart_idx" ON "AcquisitionTarget"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelReview_weekStart_key" ON "FunnelReview"("weekStart");

-- CreateIndex
CREATE INDEX "FunnelReview_weekStart_idx" ON "FunnelReview"("weekStart");
