-- CreateTable
CREATE TABLE "TrackedLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "contentItemId" TEXT,
    "publishRecordId" TEXT,
    "platform" TEXT,
    "campaign" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackedLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackedLink_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrackedLink_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrackedLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Touchpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "visitorId" TEXT,
    "trackedLinkId" TEXT,
    "contentItemId" TEXT,
    "publishRecordId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'click',
    "platform" TEXT,
    "campaign" TEXT,
    "referrerHost" TEXT,
    "source" TEXT NOT NULL DEFAULT 'native',
    "providerRef" TEXT,
    "note" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Touchpoint_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Touchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Touchpoint_trackedLinkId_fkey" FOREIGN KEY ("trackedLinkId") REFERENCES "TrackedLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Touchpoint_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Touchpoint_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorId" TEXT,
    "inquiryId" TEXT,
    "valueMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalProvider" TEXT,
    "externalRecordId" TEXT,
    "externalRecordUrl" TEXT,
    "evidenceBasis" TEXT NOT NULL DEFAULT 'client_reported',
    "attribution" TEXT NOT NULL DEFAULT 'qualitative_only',
    "note" TEXT,
    "recordedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommercialEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "visitorId" TEXT,
    CONSTRAINT "Inquiry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("attribution", "closedAt", "company", "contentItemId", "createdAt", "cta", "currency", "email", "evidenceBasis", "evidenceSource", "id", "leadMagnet", "link", "name", "notes", "occurredAt", "orgId", "publishRecordId", "source", "stage", "updatedAt", "valueMinor") SELECT "attribution", "closedAt", "company", "contentItemId", "createdAt", "cta", "currency", "email", "evidenceBasis", "evidenceSource", "id", "leadMagnet", "link", "name", "notes", "occurredAt", "orgId", "publishRecordId", "source", "stage", "updatedAt", "valueMinor" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE INDEX "Inquiry_orgId_stage_idx" ON "Inquiry"("orgId", "stage");
CREATE INDEX "Inquiry_orgId_occurredAt_idx" ON "Inquiry"("orgId", "occurredAt");
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'client',
    "status" TEXT NOT NULL DEFAULT 'active',
    "packageTier" TEXT NOT NULL DEFAULT 'install',
    "onboardingStage" TEXT NOT NULL DEFAULT 'not_started',
    "industry" TEXT,
    "website" TEXT,
    "geography" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyFee" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 80,
    "accentHex" TEXT,
    "modulesEnabled" TEXT NOT NULL DEFAULT '[]',
    "supportNotes" TEXT,
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("accentHex", "createdAt", "currency", "geography", "healthScore", "id", "industry", "kind", "lastActivityAt", "modulesEnabled", "monthlyFee", "name", "onboardingStage", "packageTier", "setupFee", "slug", "startedAt", "status", "supportNotes", "timezone", "updatedAt", "website") SELECT "accentHex", "createdAt", "currency", "geography", "healthScore", "id", "industry", "kind", "lastActivityAt", "modulesEnabled", "monthlyFee", "name", "onboardingStage", "packageTier", "setupFee", "slug", "startedAt", "status", "supportNotes", "timezone", "updatedAt", "website" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_kind_status_idx" ON "Organization"("kind", "status");
CREATE INDEX "Organization_synthetic_idx" ON "Organization"("synthetic");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'client',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "assigneeId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "estimateMin" INTEGER,
    "activeMinutes" INTEGER,
    "waitingMinutes" INTEGER,
    "costMinor" INTEGER NOT NULL DEFAULT 0,
    "workClass" TEXT,
    "loadNote" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "audience", "completedAt", "createdAt", "description", "dueDate", "entityId", "entityType", "estimateMin", "id", "kind", "orgId", "priority", "status", "title", "updatedAt") SELECT "assigneeId", "audience", "completedAt", "createdAt", "description", "dueDate", "entityId", "entityType", "estimateMin", "id", "kind", "orgId", "priority", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_orgId_status_audience_idx" ON "Task"("orgId", "status", "audience");
CREATE INDEX "Task_orgId_dueDate_idx" ON "Task"("orgId", "dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TrackedLink_slug_key" ON "TrackedLink"("slug");

-- CreateIndex
CREATE INDEX "TrackedLink_orgId_active_idx" ON "TrackedLink"("orgId", "active");

-- CreateIndex
CREATE INDEX "TrackedLink_contentItemId_idx" ON "TrackedLink"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_token_key" ON "Visitor"("token");

-- CreateIndex
CREATE INDEX "Visitor_orgId_lastSeenAt_idx" ON "Visitor"("orgId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "Touchpoint_orgId_occurredAt_idx" ON "Touchpoint"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "Touchpoint_visitorId_occurredAt_idx" ON "Touchpoint"("visitorId", "occurredAt");

-- CreateIndex
CREATE INDEX "Touchpoint_contentItemId_idx" ON "Touchpoint"("contentItemId");

-- CreateIndex
CREATE INDEX "CommercialEvent_orgId_occurredAt_idx" ON "CommercialEvent"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "CommercialEvent_orgId_kind_idx" ON "CommercialEvent"("orgId", "kind");

-- CreateIndex
CREATE INDEX "CommercialEvent_inquiryId_idx" ON "CommercialEvent"("inquiryId");
