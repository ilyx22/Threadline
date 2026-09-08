-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "orgId" TEXT,
    "createdById" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT,
    "toEmail" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "providerId" TEXT,
    "error" TEXT,
    "jobId" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" DATETIME,
    "lockedBy" TEXT,
    "lastError" TEXT,
    "completedAt" DATETIME,
    "idempotencyKey" TEXT,
    "orgId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalesScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "exactText" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "provenance" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "retiredAt" DATETIME
);

-- CreateTable
CREATE TABLE "SalesCallScriptSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "exactText" TEXT NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesCallScriptSnapshot_callId_fkey" FOREIGN KEY ("callId") REFERENCES "SalesCall" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesCallScriptSnapshot_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "SalesScript" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProofPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "interviewWillingness" TEXT NOT NULL DEFAULT 'unknown',
    "successConfirmedAt" DATETIME,
    "successConfirmedById" TEXT,
    "successNote" TEXT,
    "allowInterview" BOOLEAN NOT NULL DEFAULT false,
    "allowInternalUse" BOOLEAN NOT NULL DEFAULT false,
    "allowTestimonial" BOOLEAN NOT NULL DEFAULT false,
    "allowPublicTestimonial" BOOLEAN NOT NULL DEFAULT false,
    "allowNamedCaseStudy" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonCaseStudy" BOOLEAN NOT NULL DEFAULT false,
    "allowPublishMetrics" BOOLEAN NOT NULL DEFAULT false,
    "allowLogo" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" DATETIME,
    "grantedNote" TEXT,
    "requestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProofPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "orgId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "error" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "website" TEXT,
    "whatYouSell" TEXT NOT NULL,
    "revenueRange" TEXT NOT NULL,
    "contentProcess" TEXT NOT NULL,
    "peopleInvolved" TEXT NOT NULL,
    "publishCadence" TEXT NOT NULL,
    "biggestBottleneck" TEXT NOT NULL,
    "founderHours" TEXT NOT NULL,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "successLooksLike" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "extra" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT,
    "typicalDealValue" INTEGER,
    "acquisitionToday" TEXT,
    "capacityNote" TEXT,
    "prospectId" TEXT,
    CONSTRAINT "Application_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("biggestBottleneck", "company", "contentProcess", "createdAt", "email", "extra", "founderHours", "id", "name", "peopleInvolved", "platforms", "publishCadence", "revenueRange", "reviewNotes", "status", "successLooksLike", "updatedAt", "urgency", "website", "whatYouSell") SELECT "biggestBottleneck", "company", "contentProcess", "createdAt", "email", "extra", "founderHours", "id", "name", "peopleInvolved", "platforms", "publishCadence", "revenueRange", "reviewNotes", "status", "successLooksLike", "updatedAt", "urgency", "website", "whatYouSell" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt");
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storagePath" TEXT,
    "externalUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("category", "contentItemId", "createdAt", "description", "externalUrl", "fileName", "id", "mimeType", "orgId", "sizeBytes", "storagePath", "tags", "title", "updatedAt", "uploadedById", "version") SELECT "category", "contentItemId", "createdAt", "description", "externalUrl", "fileName", "id", "mimeType", "orgId", "sizeBytes", "storagePath", "tags", "title", "updatedAt", "uploadedById", "version" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE INDEX "Asset_orgId_category_idx" ON "Asset"("orgId", "category");
CREATE INDEX "Asset_contentItemId_idx" ON "Asset"("contentItemId");
CREATE TABLE "new_CommercialEvent" (
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
    "cashCollectedMinor" INTEGER,
    "attributableRevenueMinor" INTEGER,
    "attributionEligibility" TEXT NOT NULL DEFAULT 'ineligible',
    "attributionStatus" TEXT NOT NULL DEFAULT 'pending',
    "attributablePercentage" REAL,
    "exclusionReason" TEXT,
    "collectedAt" DATETIME,
    "externalDealId" TEXT,
    "externalPaymentId" TEXT,
    "statusChangedAt" DATETIME,
    "statusChangedById" TEXT,
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "CommercialEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CommercialEvent" ("attribution", "createdAt", "currency", "evidenceBasis", "externalProvider", "externalRecordId", "externalRecordUrl", "id", "inquiryId", "kind", "note", "occurredAt", "orgId", "recordedById", "source", "updatedAt", "valueMinor", "visitorId") SELECT "attribution", "createdAt", "currency", "evidenceBasis", "externalProvider", "externalRecordId", "externalRecordUrl", "id", "inquiryId", "kind", "note", "occurredAt", "orgId", "recordedById", "source", "updatedAt", "valueMinor", "visitorId" FROM "CommercialEvent";
DROP TABLE "CommercialEvent";
ALTER TABLE "new_CommercialEvent" RENAME TO "CommercialEvent";
CREATE INDEX "CommercialEvent_orgId_occurredAt_idx" ON "CommercialEvent"("orgId", "occurredAt");
CREATE INDEX "CommercialEvent_orgId_kind_idx" ON "CommercialEvent"("orgId", "kind");
CREATE INDEX "CommercialEvent_inquiryId_idx" ON "CommercialEvent"("inquiryId");
CREATE TABLE "new_ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "ideaId" TEXT,
    "scriptId" TEXT,
    "title" TEXT NOT NULL,
    "selectedHook" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'raw',
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "format" TEXT NOT NULL DEFAULT 'short_form',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "editorId" TEXT,
    "founderId" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "rootId" TEXT,
    "derivedFromId" TEXT,
    "lineageRole" TEXT NOT NULL DEFAULT 'source',
    "recordedAt" DATETIME,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "liveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "intendedJob" TEXT NOT NULL DEFAULT 'authority',
    CONSTRAINT "ContentItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContentItem" ("approvedAt", "approvedById", "createdAt", "derivedFromId", "dueDate", "editorId", "format", "founderId", "id", "ideaId", "lineageRole", "liveAt", "orgId", "platform", "priority", "recordedAt", "revisionCount", "rootId", "scriptId", "selectedHook", "stage", "title", "updatedAt") SELECT "approvedAt", "approvedById", "createdAt", "derivedFromId", "dueDate", "editorId", "format", "founderId", "id", "ideaId", "lineageRole", "liveAt", "orgId", "platform", "priority", "recordedAt", "revisionCount", "rootId", "scriptId", "selectedHook", "stage", "title", "updatedAt" FROM "ContentItem";
DROP TABLE "ContentItem";
ALTER TABLE "new_ContentItem" RENAME TO "ContentItem";
CREATE INDEX "ContentItem_orgId_stage_idx" ON "ContentItem"("orgId", "stage");
CREATE INDEX "ContentItem_orgId_dueDate_idx" ON "ContentItem"("orgId", "dueDate");
CREATE INDEX "ContentItem_rootId_idx" ON "ContentItem"("rootId");
CREATE INDEX "ContentItem_derivedFromId_idx" ON "ContentItem"("derivedFromId");
CREATE TABLE "new_Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "concept" TEXT,
    "audience" TEXT,
    "painDesire" TEXT,
    "pillar" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "format" TEXT NOT NULL DEFAULT 'short_form',
    "angle" TEXT,
    "hookConcept" TEXT,
    "objective" TEXT,
    "cta" TEXT,
    "commercialIntent" TEXT NOT NULL DEFAULT 'medium',
    "noveltyScore" INTEGER NOT NULL DEFAULT 50,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "proofStrength" INTEGER NOT NULL DEFAULT 50,
    "formatFit" INTEGER NOT NULL DEFAULT 50,
    "priorityScore" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "rationale" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "patternId" TEXT,
    "rootId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "intendedJob" TEXT NOT NULL DEFAULT 'authority',
    "requestId" TEXT,
    CONSTRAINT "Idea_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Idea_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Idea_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Idea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Idea" ("angle", "audience", "commercialIntent", "concept", "createdAt", "createdById", "cta", "format", "formatFit", "hookConcept", "id", "noveltyScore", "objective", "orgId", "painDesire", "patternId", "pillar", "platform", "priorityScore", "proofStrength", "rationale", "relevanceScore", "rootId", "source", "status", "title", "updatedAt") SELECT "angle", "audience", "commercialIntent", "concept", "createdAt", "createdById", "cta", "format", "formatFit", "hookConcept", "id", "noveltyScore", "objective", "orgId", "painDesire", "patternId", "pillar", "platform", "priorityScore", "proofStrength", "rationale", "relevanceScore", "rootId", "source", "status", "title", "updatedAt" FROM "Idea";
DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";
CREATE INDEX "Idea_orgId_status_idx" ON "Idea"("orgId", "status");
CREATE INDEX "Idea_orgId_priorityScore_idx" ON "Idea"("orgId", "priorityScore");
CREATE INDEX "Idea_rootId_idx" ON "Idea"("rootId");
CREATE UNIQUE INDEX "Idea_orgId_requestId_key" ON "Idea"("orgId", "requestId");
CREATE TABLE "new_PerformanceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "publishRecordId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "watchTimeSec" INTEGER NOT NULL DEFAULT 0,
    "avgViewSec" REAL NOT NULL DEFAULT 0,
    "retentionPct" REAL NOT NULL DEFAULT 0,
    "ctrPct" REAL NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "bookedCalls" INTEGER NOT NULL DEFAULT 0,
    "revenueMinor" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerRecordId" TEXT,
    "fetchedAt" DATETIME,
    "provenance" TEXT,
    "unavailable" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "PerformanceSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PerformanceSnapshot_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PerformanceSnapshot" ("avgViewSec", "bookedCalls", "capturedAt", "comments", "createdAt", "ctrPct", "id", "impressions", "leads", "likes", "orgId", "publishRecordId", "reach", "retentionPct", "revenueMinor", "saves", "shares", "source", "views", "watchTimeSec") SELECT "avgViewSec", "bookedCalls", "capturedAt", "comments", "createdAt", "ctrPct", "id", "impressions", "leads", "likes", "orgId", "publishRecordId", "reach", "retentionPct", "revenueMinor", "saves", "shares", "source", "views", "watchTimeSec" FROM "PerformanceSnapshot";
DROP TABLE "PerformanceSnapshot";
ALTER TABLE "new_PerformanceSnapshot" RENAME TO "PerformanceSnapshot";
CREATE INDEX "PerformanceSnapshot_orgId_capturedAt_idx" ON "PerformanceSnapshot"("orgId", "capturedAt");
CREATE INDEX "PerformanceSnapshot_publishRecordId_capturedAt_idx" ON "PerformanceSnapshot"("publishRecordId", "capturedAt");
CREATE UNIQUE INDEX "PerformanceSnapshot_publishRecordId_source_providerRecordId_capturedAt_key" ON "PerformanceSnapshot"("publishRecordId", "source", "providerRecordId", "capturedAt");
CREATE TABLE "new_Prospect" (
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
    "econCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "typicalDealValueMinor" INTEGER,
    "grossProfitMinor" INTEGER,
    "grossMarginPct" REAL,
    "ltvMinor" INTEGER,
    "qualifiedOppValueMinor" INTEGER,
    "cycleLengthDays" INTEGER,
    "closeRatePct" REAL,
    "capacityNote" TEXT,
    "acquisitionCostMinor" INTEGER,
    "acquisitionNote" TEXT,
    "urgency" TEXT,
    "economicConsequence" TEXT,
    "economicsUpdatedAt" DATETIME,
    CONSTRAINT "Prospect_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prospect_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Prospect" ("channel", "closedAt", "closedReason", "company", "constraintHypothesis", "contactName", "contactRole", "createdAt", "crmProvider", "crmRecordId", "crmRecordUrl", "economicsNote", "firstTouchAt", "id", "nextAction", "nextActionDueAt", "notes", "ownerId", "positiveReplyAt", "repliedAt", "replyClass", "sourceNote", "state", "tier", "updatedAt", "website", "wedgeId") SELECT "channel", "closedAt", "closedReason", "company", "constraintHypothesis", "contactName", "contactRole", "createdAt", "crmProvider", "crmRecordId", "crmRecordUrl", "economicsNote", "firstTouchAt", "id", "nextAction", "nextActionDueAt", "notes", "ownerId", "positiveReplyAt", "repliedAt", "replyClass", "sourceNote", "state", "tier", "updatedAt", "website", "wedgeId" FROM "Prospect";
DROP TABLE "Prospect";
ALTER TABLE "new_Prospect" RENAME TO "Prospect";
CREATE INDEX "Prospect_state_nextActionDueAt_idx" ON "Prospect"("state", "nextActionDueAt");
CREATE INDEX "Prospect_tier_state_idx" ON "Prospect"("tier", "state");
CREATE INDEX "Prospect_firstTouchAt_idx" ON "Prospect"("firstTouchAt");
CREATE TABLE "new_PublishRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "packageId" TEXT,
    "accountId" TEXT,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "method" TEXT NOT NULL DEFAULT 'manual',
    "scheduledFor" DATETIME,
    "publishedAt" DATETIME,
    "url" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "distributionMode" TEXT NOT NULL DEFAULT 'organic',
    "externalId" TEXT,
    "providerStatus" TEXT,
    "providerPayload" TEXT,
    CONSTRAINT "PublishRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PlatformPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PublishRecord" ("accountId", "contentItemId", "createdAt", "failureReason", "id", "method", "orgId", "packageId", "platform", "publishedAt", "scheduledFor", "status", "updatedAt", "url") SELECT "accountId", "contentItemId", "createdAt", "failureReason", "id", "method", "orgId", "packageId", "platform", "publishedAt", "scheduledFor", "status", "updatedAt", "url" FROM "PublishRecord";
DROP TABLE "PublishRecord";
ALTER TABLE "new_PublishRecord" RENAME TO "PublishRecord";
CREATE INDEX "PublishRecord_orgId_status_idx" ON "PublishRecord"("orgId", "status");
CREATE INDEX "PublishRecord_orgId_scheduledFor_idx" ON "PublishRecord"("orgId", "scheduledFor");
CREATE INDEX "PublishRecord_contentItemId_idx" ON "PublishRecord"("contentItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_kind_idx" ON "AuthToken"("userId", "kind");

-- CreateIndex
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailMessage_toEmail_createdAt_idx" ON "EmailMessage"("toEmail", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_status_idx" ON "EmailMessage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "Job"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE INDEX "Job_type_status_idx" ON "Job"("type", "status");

-- CreateIndex
CREATE INDEX "SalesScript_stage_status_idx" ON "SalesScript"("stage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesScript_key_version_key" ON "SalesScript"("key", "version");

-- CreateIndex
CREATE INDEX "SalesCallScriptSnapshot_callId_idx" ON "SalesCallScriptSnapshot"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "ProofPermission_orgId_key" ON "ProofPermission"("orgId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_receivedAt_idx" ON "WebhookEvent"("provider", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_externalId_key" ON "WebhookEvent"("provider", "externalId");
