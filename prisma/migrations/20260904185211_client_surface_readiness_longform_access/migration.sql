-- CreateTable
CREATE TABLE "RecordingReadiness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_assessed',
    "formats" TEXT NOT NULL DEFAULT '[]',
    "roomNotes" TEXT,
    "gearNotes" TEXT,
    "recommendation" TEXT,
    "clientAction" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecordingReadiness_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecordingReadiness_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadinessCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "readinessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'unknown',
    "note" TEXT,
    CONSTRAINT "ReadinessCheck_readinessId_fkey" FOREIGN KEY ("readinessId") REFERENCES "RecordingReadiness" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'comment',
    "timecodeMs" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "body", "createdAt", "entityId", "entityType", "id", "kind", "orgId", "resolved", "timecodeMs") SELECT "authorId", "body", "createdAt", "entityId", "entityType", "id", "kind", "orgId", "resolved", "timecodeMs" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_orgId_entityType_entityId_idx" ON "Comment"("orgId", "entityType", "entityId");
CREATE INDEX "Comment_orgId_internal_idx" ON "Comment"("orgId", "internal");
CREATE TABLE "new_Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_configured',
    "accessMethod" TEXT NOT NULL DEFAULT 'manual',
    "config" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "connectedAt" DATETIME,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Integration" ("config", "connectedAt", "createdAt", "id", "lastSyncAt", "notes", "orgId", "provider", "status", "updatedAt") SELECT "config", "connectedAt", "createdAt", "id", "lastSyncAt", "notes", "orgId", "provider", "status", "updatedAt" FROM "Integration";
DROP TABLE "Integration";
ALTER TABLE "new_Integration" RENAME TO "Integration";
CREATE UNIQUE INDEX "Integration_orgId_provider_key" ON "Integration"("orgId", "provider");
CREATE TABLE "new_Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "effort" INTEGER NOT NULL DEFAULT 3,
    "score" REAL NOT NULL DEFAULT 0,
    "nextExperiment" TEXT,
    "detectedBy" TEXT NOT NULL DEFAULT 'manual',
    "runId" TEXT,
    "derivedFromId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "successMetric" TEXT,
    "feedbackNote" TEXT,
    "lastFeedbackAt" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pattern_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pattern_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pattern_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "Pattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pattern" ("confidence", "createdAt", "derivedFromId", "description", "detectedBy", "effort", "feedbackNote", "id", "impact", "kind", "lastFeedbackAt", "nextExperiment", "orgId", "rank", "runId", "score", "status", "successMetric", "title", "updatedAt") SELECT "confidence", "createdAt", "derivedFromId", "description", "detectedBy", "effort", "feedbackNote", "id", "impact", "kind", "lastFeedbackAt", "nextExperiment", "orgId", "rank", "runId", "score", "status", "successMetric", "title", "updatedAt" FROM "Pattern";
DROP TABLE "Pattern";
ALTER TABLE "new_Pattern" RENAME TO "Pattern";
CREATE INDEX "Pattern_orgId_kind_status_idx" ON "Pattern"("orgId", "kind", "status");
CREATE INDEX "Pattern_runId_idx" ON "Pattern"("runId");
CREATE INDEX "Pattern_derivedFromId_idx" ON "Pattern"("derivedFromId");
CREATE TABLE "new_PlatformPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "workingTitle" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "hashtags" TEXT NOT NULL DEFAULT '[]',
    "overlays" TEXT NOT NULL DEFAULT '[]',
    "thumbnailConcepts" TEXT NOT NULL DEFAULT '[]',
    "ctaOptions" TEXT NOT NULL DEFAULT '[]',
    "clipOpportunities" TEXT NOT NULL DEFAULT '[]',
    "repurposing" TEXT,
    "thumbnailRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'human',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlatformPackage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlatformPackage_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlatformPackage_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlatformPackage" ("caption", "clipOpportunities", "contentItemId", "createdAt", "ctaOptions", "description", "generatedBy", "hashtags", "id", "orgId", "overlays", "platform", "repurposing", "status", "thumbnailConcepts", "title", "updatedAt") SELECT "caption", "clipOpportunities", "contentItemId", "createdAt", "ctaOptions", "description", "generatedBy", "hashtags", "id", "orgId", "overlays", "platform", "repurposing", "status", "thumbnailConcepts", "title", "updatedAt" FROM "PlatformPackage";
DROP TABLE "PlatformPackage";
ALTER TABLE "new_PlatformPackage" RENAME TO "PlatformPackage";
CREATE INDEX "PlatformPackage_orgId_idx" ON "PlatformPackage"("orgId");
CREATE UNIQUE INDEX "PlatformPackage_contentItemId_platform_key" ON "PlatformPackage"("contentItemId", "platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RecordingReadiness_orgId_key" ON "RecordingReadiness"("orgId");

-- CreateIndex
CREATE INDEX "RecordingReadiness_status_idx" ON "RecordingReadiness"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessCheck_readinessId_key_key" ON "ReadinessCheck"("readinessId", "key");
