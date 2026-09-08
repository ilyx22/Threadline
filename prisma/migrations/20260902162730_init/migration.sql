-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "title" TEXT,
    "avatarHue" INTEGER NOT NULL DEFAULT 210,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
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
    "startedAt" DATETIME,
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
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
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandBrain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '{}',
    "founder" TEXT NOT NULL DEFAULT '{}',
    "voice" TEXT NOT NULL DEFAULT '{}',
    "contentRules" TEXT NOT NULL DEFAULT '{}',
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandBrain_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "priceModel" TEXT NOT NULL DEFAULT 'one_off',
    "mechanism" TEXT,
    "outcome" TEXT,
    "differentiators" TEXT NOT NULL DEFAULT '[]',
    "guarantees" TEXT,
    "ctas" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IcpProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "demographics" TEXT,
    "firmographics" TEXT,
    "pains" TEXT NOT NULL DEFAULT '[]',
    "desires" TEXT NOT NULL DEFAULT '[]',
    "objections" TEXT NOT NULL DEFAULT '[]',
    "triggers" TEXT NOT NULL DEFAULT '[]',
    "sophistication" TEXT NOT NULL DEFAULT 'moderate',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IcpProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProofItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "source" TEXT,
    "metricLabel" TEXT,
    "metricValue" TEXT,
    "claimStatus" TEXT NOT NULL DEFAULT 'allowed',
    "assetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProofItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "positioning" TEXT,
    "notes" TEXT,
    "threatLevel" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "sourceName" TEXT,
    "author" TEXT,
    "platform" TEXT,
    "competitorId" TEXT,
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedVia" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResearchItem_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'theme',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchItemTag" (
    "researchItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("researchItemId", "tagId"),
    CONSTRAINT "ResearchItemTag_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResearchItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pattern" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pattern_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatternEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "researchItemId" TEXT,
    "contentItemId" TEXT,
    "note" TEXT,
    "metricRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatternEvidence_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatternEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatternEvidence_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Idea" (
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
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Idea_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Idea_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Idea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ideaId" TEXT NOT NULL,
    "researchItemId" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "IdeaEvidence_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "ideaId" TEXT,
    "title" TEXT NOT NULL,
    "scriptType" TEXT NOT NULL DEFAULT 'short_form',
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "qaState" TEXT NOT NULL DEFAULT 'ai_draft',
    "estimatedSeconds" INTEGER NOT NULL DEFAULT 60,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "claimsVerified" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Script_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Script_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScriptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hook" TEXT NOT NULL,
    "altHooks" TEXT NOT NULL DEFAULT '[]',
    "body" TEXT NOT NULL,
    "cta" TEXT,
    "filmingNotes" TEXT,
    "claims" TEXT NOT NULL DEFAULT '[]',
    "contextUsed" TEXT NOT NULL DEFAULT '[]',
    "changeSummary" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'human',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptVersion_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScriptVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItem" (
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
    "recordedAt" DATETIME,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "liveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
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
    CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'comment',
    "timecodeMs" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "hashtags" TEXT NOT NULL DEFAULT '[]',
    "overlays" TEXT NOT NULL DEFAULT '[]',
    "thumbnailConcepts" TEXT NOT NULL DEFAULT '[]',
    "ctaOptions" TEXT NOT NULL DEFAULT '[]',
    "clipOpportunities" TEXT NOT NULL DEFAULT '[]',
    "repurposing" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedBy" TEXT NOT NULL DEFAULT 'human',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlatformPackage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlatformPackage_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "integrationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialAccount_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublishRecord" (
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
    CONSTRAINT "PublishRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PlatformPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublishRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
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
    CONSTRAINT "PerformanceSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PerformanceSnapshot_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inquiry" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "narrative" TEXT,
    "generatedById" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WeeklyReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperatingMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "founderHours" REAL NOT NULL DEFAULT 0,
    "hoursSaved" REAL NOT NULL DEFAULT 0,
    "cycleTimeHours" REAL NOT NULL DEFAULT 0,
    "approvalHours" REAL NOT NULL DEFAULT 0,
    "piecesShipped" INTEGER NOT NULL DEFAULT 0,
    "contractorCostMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperatingMetric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_configured',
    "config" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "connectedAt" DATETIME,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "ownerId" TEXT,
    "resolution" TEXT,
    "becomesSop" BOOLEAN NOT NULL DEFAULT false,
    "becomesFix" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportIssue_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportIssue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SopDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'delivery',
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SopDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SopDocument_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'welcome',
    "completedSteps" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OnboardingSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiGeneration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodStart" DATETIME NOT NULL,
    "leadsBySource" TEXT NOT NULL DEFAULT '{}',
    "salesCalls" INTEGER NOT NULL DEFAULT 0,
    "showRatePct" REAL NOT NULL DEFAULT 0,
    "closeRatePct" REAL NOT NULL DEFAULT 0,
    "cashCollectedMinor" INTEGER NOT NULL DEFAULT 0,
    "setupFeesMinor" INTEGER NOT NULL DEFAULT 0,
    "mrrMinor" INTEGER NOT NULL DEFAULT 0,
    "implementationHours" REAL NOT NULL DEFAULT 0,
    "supportHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_kind_status_idx" ON "Organization"("kind", "status");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_orgId_key" ON "Membership"("userId", "orgId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_orgId_createdAt_idx" ON "Notification"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Task_orgId_status_audience_idx" ON "Task"("orgId", "status", "audience");

-- CreateIndex
CREATE INDEX "Task_orgId_dueDate_idx" ON "Task"("orgId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "BrandBrain_orgId_key" ON "BrandBrain"("orgId");

-- CreateIndex
CREATE INDEX "Offer_orgId_idx" ON "Offer"("orgId");

-- CreateIndex
CREATE INDEX "IcpProfile_orgId_idx" ON "IcpProfile"("orgId");

-- CreateIndex
CREATE INDEX "ProofItem_orgId_kind_idx" ON "ProofItem"("orgId", "kind");

-- CreateIndex
CREATE INDEX "Competitor_orgId_idx" ON "Competitor"("orgId");

-- CreateIndex
CREATE INDEX "ResearchItem_orgId_kind_idx" ON "ResearchItem"("orgId", "kind");

-- CreateIndex
CREATE INDEX "ResearchItem_orgId_capturedAt_idx" ON "ResearchItem"("orgId", "capturedAt");

-- CreateIndex
CREATE INDEX "Tag_orgId_kind_idx" ON "Tag"("orgId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_orgId_name_key" ON "Tag"("orgId", "name");

-- CreateIndex
CREATE INDEX "ResearchItemTag_tagId_idx" ON "ResearchItemTag"("tagId");

-- CreateIndex
CREATE INDEX "Pattern_orgId_kind_status_idx" ON "Pattern"("orgId", "kind", "status");

-- CreateIndex
CREATE INDEX "PatternEvidence_patternId_idx" ON "PatternEvidence"("patternId");

-- CreateIndex
CREATE INDEX "Idea_orgId_status_idx" ON "Idea"("orgId", "status");

-- CreateIndex
CREATE INDEX "Idea_orgId_priorityScore_idx" ON "Idea"("orgId", "priorityScore");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaEvidence_ideaId_researchItemId_key" ON "IdeaEvidence"("ideaId", "researchItemId");

-- CreateIndex
CREATE INDEX "Script_orgId_qaState_idx" ON "Script"("orgId", "qaState");

-- CreateIndex
CREATE INDEX "ScriptVersion_scriptId_idx" ON "ScriptVersion"("scriptId");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptVersion_scriptId_version_key" ON "ScriptVersion"("scriptId", "version");

-- CreateIndex
CREATE INDEX "ContentItem_orgId_stage_idx" ON "ContentItem"("orgId", "stage");

-- CreateIndex
CREATE INDEX "ContentItem_orgId_dueDate_idx" ON "ContentItem"("orgId", "dueDate");

-- CreateIndex
CREATE INDEX "ContentEvent_contentItemId_createdAt_idx" ON "ContentEvent"("contentItemId", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_orgId_category_idx" ON "Asset"("orgId", "category");

-- CreateIndex
CREATE INDEX "Asset_contentItemId_idx" ON "Asset"("contentItemId");

-- CreateIndex
CREATE INDEX "Comment_orgId_entityType_entityId_idx" ON "Comment"("orgId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "PlatformPackage_orgId_idx" ON "PlatformPackage"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPackage_contentItemId_platform_key" ON "PlatformPackage"("contentItemId", "platform");

-- CreateIndex
CREATE INDEX "SocialAccount_orgId_platform_idx" ON "SocialAccount"("orgId", "platform");

-- CreateIndex
CREATE INDEX "PublishRecord_orgId_status_idx" ON "PublishRecord"("orgId", "status");

-- CreateIndex
CREATE INDEX "PublishRecord_orgId_scheduledFor_idx" ON "PublishRecord"("orgId", "scheduledFor");

-- CreateIndex
CREATE INDEX "PublishRecord_contentItemId_idx" ON "PublishRecord"("contentItemId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_orgId_capturedAt_idx" ON "PerformanceSnapshot"("orgId", "capturedAt");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_publishRecordId_capturedAt_idx" ON "PerformanceSnapshot"("publishRecordId", "capturedAt");

-- CreateIndex
CREATE INDEX "Inquiry_orgId_stage_idx" ON "Inquiry"("orgId", "stage");

-- CreateIndex
CREATE INDEX "Inquiry_orgId_occurredAt_idx" ON "Inquiry"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "WeeklyReport_orgId_periodStart_idx" ON "WeeklyReport"("orgId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_orgId_periodStart_key" ON "WeeklyReport"("orgId", "periodStart");

-- CreateIndex
CREATE INDEX "OperatingMetric_orgId_weekStart_idx" ON "OperatingMetric"("orgId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingMetric_orgId_weekStart_key" ON "OperatingMetric"("orgId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_orgId_provider_key" ON "Integration"("orgId", "provider");

-- CreateIndex
CREATE INDEX "SupportIssue_status_severity_idx" ON "SupportIssue"("status", "severity");

-- CreateIndex
CREATE INDEX "SopDocument_category_idx" ON "SopDocument"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SopDocument_key_key" ON "SopDocument"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_orgId_key" ON "OnboardingSession"("orgId");

-- CreateIndex
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiGeneration_orgId_createdAt_idx" ON "AiGeneration"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternalMetric_periodStart_key" ON "InternalMetric"("periodStart");
