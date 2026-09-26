-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "title" TEXT,
    "avatarHue" INTEGER NOT NULL DEFAULT 210,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
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
    "periodFee" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 80,
    "accentHex" TEXT,
    "modulesEnabled" TEXT NOT NULL DEFAULT '[]',
    "supportNotes" TEXT,
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'client',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "estimateMin" INTEGER,
    "activeMinutes" INTEGER,
    "waitingMinutes" INTEGER,
    "costMinor" INTEGER NOT NULL DEFAULT 0,
    "workClass" TEXT,
    "loadNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandBrain" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '{}',
    "founder" TEXT NOT NULL DEFAULT '{}',
    "voice" TEXT NOT NULL DEFAULT '{}',
    "contentRules" TEXT NOT NULL DEFAULT '{}',
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandBrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcpProfile" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcpProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "source" TEXT,
    "metricLabel" TEXT,
    "metricValue" TEXT,
    "claimStatus" TEXT NOT NULL DEFAULT 'allowed',
    "assetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "positioning" TEXT,
    "notes" TEXT,
    "threatLevel" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchItem" (
    "id" TEXT NOT NULL,
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
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedVia" TEXT NOT NULL DEFAULT 'manual',
    "sourceMeta" TEXT NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'theme',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchItemTag" (
    "researchItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ResearchItemTag_pkey" PRIMARY KEY ("researchItemId","tagId")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "effort" INTEGER NOT NULL DEFAULT 3,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextExperiment" TEXT,
    "detectedBy" TEXT NOT NULL DEFAULT 'manual',
    "runId" TEXT,
    "derivedFromId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "successMetric" TEXT,
    "feedbackNote" TEXT,
    "lastFeedbackAt" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternEvidence" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "researchItemId" TEXT,
    "contentItemId" TEXT,
    "note" TEXT,
    "metricRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
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
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "rationale" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "patternId" TEXT,
    "rootId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "intendedJob" TEXT NOT NULL DEFAULT 'authority',
    "requestId" TEXT,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaEvidence" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "researchItemId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "IdeaEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ideaId" TEXT,
    "title" TEXT NOT NULL,
    "scriptType" TEXT NOT NULL DEFAULT 'short_form',
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "qaState" TEXT NOT NULL DEFAULT 'ai_draft',
    "estimatedSeconds" INTEGER NOT NULL DEFAULT 60,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "claimsVerified" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptVersion" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ideaId" TEXT,
    "scriptId" TEXT,
    "title" TEXT NOT NULL,
    "selectedHook" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'raw',
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "format" TEXT NOT NULL DEFAULT 'short_form',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "editorId" TEXT,
    "founderId" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "rootId" TEXT,
    "derivedFromId" TEXT,
    "lineageRole" TEXT NOT NULL DEFAULT 'source',
    "recordedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "liveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "intendedJob" TEXT NOT NULL DEFAULT 'authority',

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'comment',
    "timecodeMs" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPackage" (
    "id" TEXT NOT NULL,
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
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'human',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "integrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "packageId" TEXT,
    "accountId" TEXT,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "method" TEXT NOT NULL DEFAULT 'manual',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "url" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributionMode" TEXT NOT NULL DEFAULT 'organic',
    "externalId" TEXT,
    "providerStatus" TEXT,
    "providerPayload" TEXT,

    CONSTRAINT "PublishRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "publishRecordId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "watchTimeSec" INTEGER NOT NULL DEFAULT 0,
    "avgViewSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctrPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "bookedCalls" INTEGER NOT NULL DEFAULT 0,
    "revenueMinor" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerRecordId" TEXT,
    "fetchedAt" TIMESTAMP(3),
    "provenance" TEXT,
    "unavailable" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
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
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "attribution" TEXT NOT NULL DEFAULT 'qualitative_only',
    "evidenceBasis" TEXT NOT NULL DEFAULT 'client_reported',
    "evidenceSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visitorId" TEXT,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "narrative" TEXT,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingMetric" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "founderHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cycleTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "piecesShipped" INTEGER NOT NULL DEFAULT 0,
    "contractorCostMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceRun" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scoping',
    "focus" TEXT,
    "summary" TEXT,
    "brief" TEXT NOT NULL DEFAULT '{}',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "signalCount" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "testCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunSource" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "competitorId" TEXT,
    "collectionMode" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusNote" TEXT,
    "content" TEXT,
    "itemsCollected" INTEGER NOT NULL DEFAULT 0,
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSignal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT,
    "soWhat" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "decisionNote" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "editedByHuman" BOOLEAN NOT NULL DEFAULT false,
    "patternId" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEvidence" (
    "id" TEXT NOT NULL,
    "candidateSignalId" TEXT NOT NULL,
    "researchItemId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstraintDiagnosis" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "primaryConstraint" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence" TEXT,
    "commercialImpact" TEXT,
    "recommendedAction" TEXT,
    "experiment" TEXT,
    "reviewDate" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstraintDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstraintAssessment" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 3,
    "note" TEXT,
    "evidence" TEXT,

    CONSTRAINT "ConstraintAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationMilestone" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "note" TEXT,
    "blockedReason" TEXT,
    "signedOffAt" TIMESTAMP(3),
    "signedOffById" TEXT,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofPeriod" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'month',
    "label" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reportedFounderHours" DOUBLE PRECISION,
    "reportedContentOutput" INTEGER,
    "reportedCycleTimeDays" DOUBLE PRECISION,
    "reportedApprovalDays" DOUBLE PRECISION,
    "reportedAudienceSize" INTEGER,
    "reportedEngagementRate" DOUBLE PRECISION,
    "reportedQualifiedInquiries" INTEGER,
    "reportedCallsBooked" INTEGER,
    "reportedAttributableValueMinor" INTEGER,
    "attributionNote" TEXT,
    "qualitativeNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'client_reported',
    "lockedAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingReadiness" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_assessed',
    "formats" TEXT NOT NULL DEFAULT '[]',
    "roomNotes" TEXT,
    "gearNotes" TEXT,
    "recommendation" TEXT,
    "clientAction" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordingReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessCheck" (
    "id" TEXT NOT NULL,
    "readinessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'unknown',
    "note" TEXT,

    CONSTRAINT "ReadinessCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_configured',
    "authStatus" TEXT NOT NULL DEFAULT 'none',
    "publishCapability" TEXT NOT NULL DEFAULT 'manual',
    "analyticsCapability" TEXT NOT NULL DEFAULT 'manual',
    "researchCapability" TEXT NOT NULL DEFAULT 'unavailable',
    "reviewStatus" TEXT NOT NULL DEFAULT 'not_required',
    "scopesRequested" TEXT NOT NULL DEFAULT '[]',
    "scopesGranted" TEXT NOT NULL DEFAULT '[]',
    "restrictions" TEXT NOT NULL DEFAULT '[]',
    "externalAccountId" TEXT,
    "externalAccountLabel" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "reconnectRequired" BOOLEAN NOT NULL DEFAULT false,
    "accessMethod" TEXT NOT NULL DEFAULT 'manual',
    "config" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportIssue" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "ownerId" TEXT,
    "resolution" TEXT,
    "becomesSop" BOOLEAN NOT NULL DEFAULT false,
    "becomesFix" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopDocument" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'delivery',
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SopDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'welcome',
    "completedSteps" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "typicalDealValue" INTEGER,
    "acquisitionToday" TEXT,
    "capacityNote" TEXT,
    "prospectId" TEXT,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneration" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMetric" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "leadsBySource" TEXT NOT NULL DEFAULT '{}',
    "salesCalls" INTEGER NOT NULL DEFAULT 0,
    "showRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closeRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashCollectedMinor" INTEGER NOT NULL DEFAULT 0,
    "setupFeesMinor" INTEGER NOT NULL DEFAULT 0,
    "mrrMinor" INTEGER NOT NULL DEFAULT 0,
    "implementationHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketWedge" (
    "id" TEXT NOT NULL,
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
    "frozenAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "nextAction" TEXT,
    "nextActionDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketWedge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationConversation" (
    "id" TEXT NOT NULL,
    "wedgeId" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "company" TEXT,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problem" TEXT NOT NULL,
    "problemTheme" TEXT,
    "volunteered" BOOLEAN NOT NULL DEFAULT false,
    "quote" TEXT,
    "currentProcess" TEXT,
    "triedBefore" TEXT,
    "consequence" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
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
    "nextActionDueAt" TIMESTAMP(3),
    "crmProvider" TEXT,
    "crmRecordId" TEXT,
    "crmRecordUrl" TEXT,
    "firstTouchAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "positiveReplyAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "econCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "typicalDealValueMinor" INTEGER,
    "grossProfitMinor" INTEGER,
    "grossMarginPct" DOUBLE PRECISION,
    "ltvMinor" INTEGER,
    "qualifiedOppValueMinor" INTEGER,
    "cycleLengthDays" INTEGER,
    "closeRatePct" DOUBLE PRECISION,
    "capacityNote" TEXT,
    "acquisitionCostMinor" INTEGER,
    "acquisitionNote" TEXT,
    "urgency" TEXT,
    "economicConsequence" TEXT,
    "economicsUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopCheck" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "wedgeId" TEXT,
    "state" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SopCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCall" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
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
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcquisitionTarget" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "targetWins" INTEGER NOT NULL DEFAULT 2,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assumedBookingRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assumedShowRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assumedQualifiedRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assumedCloseRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelReview" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "counts" TEXT NOT NULL DEFAULT '{}',
    "brokenStep" TEXT,
    "variableChanged" TEXT,
    "hypothesis" TEXT,
    "learning" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedLink" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Touchpoint" (
    "id" TEXT NOT NULL,
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
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Touchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashCollectedMinor" INTEGER,
    "attributableRevenueMinor" INTEGER,
    "attributionEligibility" TEXT NOT NULL DEFAULT 'ineligible',
    "attributionStatus" TEXT NOT NULL DEFAULT 'pending',
    "attributablePercentage" DOUBLE PRECISION,
    "exclusionReason" TEXT,
    "collectedAt" TIMESTAMP(3),
    "externalDealId" TEXT,
    "externalPaymentId" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedById" TEXT,
    "statusHistory" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "CommercialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchExample" (
    "id" TEXT NOT NULL,
    "wedgeId" TEXT,
    "platform" TEXT NOT NULL,
    "creatorHandle" TEXT NOT NULL,
    "creatorName" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'unknown',
    "buyerRelevance" TEXT NOT NULL DEFAULT 'unrated',
    "commercialIntent" TEXT NOT NULL DEFAULT 'unrated',
    "provenance" TEXT NOT NULL DEFAULT 'manual',
    "metricsProvenance" TEXT NOT NULL DEFAULT 'manual',
    "enrichedAt" TIMESTAMP(3),
    "enrichmentNote" TEXT,
    "transcript" TEXT,
    "notes" TEXT,
    "illustrative" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExampleAnalysis" (
    "id" TEXT NOT NULL,
    "exampleId" TEXT NOT NULL,
    "topic" TEXT,
    "buyerPain" TEXT,
    "hook" TEXT,
    "thesis" TEXT,
    "promise" TEXT,
    "proof" TEXT,
    "format" TEXT,
    "storyStructure" TEXT,
    "cta" TEXT,
    "emotionalDriver" TEXT,
    "whyItWorked" TEXT,
    "commercialRelevance" TEXT NOT NULL DEFAULT 'mixed',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExampleAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeVerdict" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "orgId" TEXT,
    "exampleId" TEXT,
    "rubricVersion" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "scores" TEXT NOT NULL DEFAULT '[]',
    "concerns" TEXT NOT NULL DEFAULT '[]',
    "calibrated" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeVerdict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeCalibration" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricVersion" TEXT NOT NULL,
    "pairs" INTEGER NOT NULL DEFAULT 0,
    "outperformers" INTEGER NOT NULL DEFAULT 0,
    "separation" DOUBLE PRECISION,
    "sufficient" BOOLEAN NOT NULL DEFAULT false,
    "reading" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "runById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRoot" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "audience" TEXT,
    "pillar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentExpectation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "rootId" TEXT,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "dimensions" TEXT NOT NULL DEFAULT '[]',
    "predictedStrengths" TEXT NOT NULL DEFAULT '[]',
    "predictedWeaknesses" TEXT NOT NULL DEFAULT '[]',
    "expectedClass" TEXT NOT NULL DEFAULT 'unknown',
    "confidence" TEXT NOT NULL DEFAULT 'low',
    "calibrated" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'none',
    "model" TEXT NOT NULL DEFAULT 'none',
    "promptVersion" TEXT NOT NULL DEFAULT 'none',
    "reasoning" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentExpectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDiagnosis" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "rootId" TEXT,
    "contentItemId" TEXT,
    "expectationId" TEXT,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "maturityDays" INTEGER,
    "evidence" TEXT NOT NULL DEFAULT '{}',
    "strongestDimension" TEXT,
    "weakestDimension" TEXT,
    "failureClass" TEXT NOT NULL DEFAULT 'insufficient_data',
    "explanation" TEXT,
    "failedAssumption" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'low',
    "preserveThesis" BOOLEAN NOT NULL DEFAULT true,
    "prescription" TEXT,
    "nextIntervention" TEXT,
    "retestBatchSize" INTEGER,
    "targetPlatform" TEXT,
    "targetFormat" TEXT,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'none',
    "model" TEXT NOT NULL DEFAULT 'none',
    "promptVersion" TEXT NOT NULL DEFAULT 'none',
    "approvalState" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionEntry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "rootId" TEXT,
    "diagnosisId" TEXT,
    "believed" TEXT NOT NULL,
    "actual" TEXT NOT NULL,
    "failedAssumption" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "lever" TEXT NOT NULL DEFAULT 'other',
    "worked" BOOLEAN,
    "verdictNote" TEXT,
    "verdictAt" TIMESTAMP(3),
    "retestContentItemId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sealed" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "externalAccountId" TEXT,
    "externalAccountLabel" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "sealedVerifier" TEXT,
    "returnTo" TEXT,
    "scopesRequested" TEXT NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "orgId" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
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
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesScript" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "exactText" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "provenance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "SalesScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCallScriptSnapshot" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "exactText" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCallScriptSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofPermission" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "interviewWillingness" TEXT NOT NULL DEFAULT 'unknown',
    "successConfirmedAt" TIMESTAMP(3),
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
    "grantedAt" TIMESTAMP(3),
    "grantedNote" TEXT,
    "requestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "orgId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Organization_synthetic_idx" ON "Organization"("synthetic");

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
CREATE INDEX "ResearchItem_runId_idx" ON "ResearchItem"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchItem_orgId_dedupeKey_key" ON "ResearchItem"("orgId", "dedupeKey");

-- CreateIndex
CREATE INDEX "Tag_orgId_kind_idx" ON "Tag"("orgId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_orgId_name_key" ON "Tag"("orgId", "name");

-- CreateIndex
CREATE INDEX "ResearchItemTag_tagId_idx" ON "ResearchItemTag"("tagId");

-- CreateIndex
CREATE INDEX "Pattern_orgId_kind_status_idx" ON "Pattern"("orgId", "kind", "status");

-- CreateIndex
CREATE INDEX "Pattern_runId_idx" ON "Pattern"("runId");

-- CreateIndex
CREATE INDEX "Pattern_derivedFromId_idx" ON "Pattern"("derivedFromId");

-- CreateIndex
CREATE INDEX "PatternEvidence_patternId_idx" ON "PatternEvidence"("patternId");

-- CreateIndex
CREATE INDEX "Idea_orgId_status_idx" ON "Idea"("orgId", "status");

-- CreateIndex
CREATE INDEX "Idea_orgId_priorityScore_idx" ON "Idea"("orgId", "priorityScore");

-- CreateIndex
CREATE INDEX "Idea_rootId_idx" ON "Idea"("rootId");

-- CreateIndex
CREATE UNIQUE INDEX "Idea_orgId_requestId_key" ON "Idea"("orgId", "requestId");

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
CREATE INDEX "ContentItem_rootId_idx" ON "ContentItem"("rootId");

-- CreateIndex
CREATE INDEX "ContentItem_derivedFromId_idx" ON "ContentItem"("derivedFromId");

-- CreateIndex
CREATE INDEX "ContentEvent_contentItemId_createdAt_idx" ON "ContentEvent"("contentItemId", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_orgId_category_idx" ON "Asset"("orgId", "category");

-- CreateIndex
CREATE INDEX "Asset_contentItemId_idx" ON "Asset"("contentItemId");

-- CreateIndex
CREATE INDEX "Comment_orgId_entityType_entityId_idx" ON "Comment"("orgId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_orgId_internal_idx" ON "Comment"("orgId", "internal");

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
CREATE UNIQUE INDEX "PerformanceSnapshot_publishRecordId_source_providerRecordId_key" ON "PerformanceSnapshot"("publishRecordId", "source", "providerRecordId", "capturedAt");

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
CREATE INDEX "IntelligenceRun_orgId_status_idx" ON "IntelligenceRun"("orgId", "status");

-- CreateIndex
CREATE INDEX "IntelligenceRun_orgId_periodStart_idx" ON "IntelligenceRun"("orgId", "periodStart");

-- CreateIndex
CREATE INDEX "RunSource_orgId_idx" ON "RunSource"("orgId");

-- CreateIndex
CREATE INDEX "RunSource_runId_status_idx" ON "RunSource"("runId", "status");

-- CreateIndex
CREATE INDEX "CandidateSignal_orgId_decision_idx" ON "CandidateSignal"("orgId", "decision");

-- CreateIndex
CREATE INDEX "CandidateSignal_runId_decision_idx" ON "CandidateSignal"("runId", "decision");

-- CreateIndex
CREATE INDEX "CandidateEvidence_researchItemId_idx" ON "CandidateEvidence"("researchItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEvidence_candidateSignalId_researchItemId_key" ON "CandidateEvidence"("candidateSignalId", "researchItemId");

-- CreateIndex
CREATE INDEX "ConstraintDiagnosis_orgId_status_idx" ON "ConstraintDiagnosis"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConstraintAssessment_diagnosisId_dimension_key" ON "ConstraintAssessment"("diagnosisId", "dimension");

-- CreateIndex
CREATE INDEX "InstallationMilestone_orgId_idx" ON "InstallationMilestone"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationMilestone_orgId_key_key" ON "InstallationMilestone"("orgId", "key");

-- CreateIndex
CREATE INDEX "ProofPeriod_orgId_periodStart_idx" ON "ProofPeriod"("orgId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ProofPeriod_orgId_kind_periodStart_key" ON "ProofPeriod"("orgId", "kind", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingReadiness_orgId_key" ON "RecordingReadiness"("orgId");

-- CreateIndex
CREATE INDEX "RecordingReadiness_status_idx" ON "RecordingReadiness"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessCheck_readinessId_key_key" ON "ReadinessCheck"("readinessId", "key");

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

-- CreateIndex
CREATE UNIQUE INDEX "TrackedLink_slug_key" ON "TrackedLink"("slug");

-- CreateIndex
CREATE INDEX "TrackedLink_orgId_active_idx" ON "TrackedLink"("orgId", "active");

-- CreateIndex
CREATE INDEX "TrackedLink_contentItemId_idx" ON "TrackedLink"("contentItemId");

-- CreateIndex
CREATE INDEX "Visitor_orgId_lastSeenAt_idx" ON "Visitor"("orgId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_orgId_token_key" ON "Visitor"("orgId", "token");

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

-- CreateIndex
CREATE UNIQUE INDEX "ResearchExample_url_key" ON "ResearchExample"("url");

-- CreateIndex
CREATE INDEX "ResearchExample_wedgeId_idx" ON "ResearchExample"("wedgeId");

-- CreateIndex
CREATE INDEX "ResearchExample_creatorHandle_idx" ON "ResearchExample"("creatorHandle");

-- CreateIndex
CREATE INDEX "ResearchExample_platform_idx" ON "ResearchExample"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ExampleAnalysis_exampleId_key" ON "ExampleAnalysis"("exampleId");

-- CreateIndex
CREATE INDEX "JudgeVerdict_subjectType_subjectId_idx" ON "JudgeVerdict"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "JudgeVerdict_orgId_createdAt_idx" ON "JudgeVerdict"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "JudgeCalibration_runAt_idx" ON "JudgeCalibration"("runAt");

-- CreateIndex
CREATE INDEX "ContentRoot_orgId_status_idx" ON "ContentRoot"("orgId", "status");

-- CreateIndex
CREATE INDEX "ContentRoot_orgId_createdAt_idx" ON "ContentRoot"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentExpectation_orgId_subjectType_subjectId_idx" ON "ContentExpectation"("orgId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "ContentExpectation_rootId_idx" ON "ContentExpectation"("rootId");

-- CreateIndex
CREATE INDEX "ContentExpectation_orgId_rubricVersion_idx" ON "ContentExpectation"("orgId", "rubricVersion");

-- CreateIndex
CREATE INDEX "ContentDiagnosis_orgId_createdAt_idx" ON "ContentDiagnosis"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentDiagnosis_rootId_idx" ON "ContentDiagnosis"("rootId");

-- CreateIndex
CREATE INDEX "ContentDiagnosis_contentItemId_idx" ON "ContentDiagnosis"("contentItemId");

-- CreateIndex
CREATE INDEX "CorrectionEntry_orgId_createdAt_idx" ON "CorrectionEntry"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "CorrectionEntry_rootId_idx" ON "CorrectionEntry"("rootId");

-- CreateIndex
CREATE INDEX "CorrectionEntry_orgId_lever_idx" ON "CorrectionEntry"("orgId", "lever");

-- CreateIndex
CREATE INDEX "Credential_orgId_provider_idx" ON "Credential"("orgId", "provider");

-- CreateIndex
CREATE INDEX "Credential_keyId_idx" ON "Credential"("keyId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_orgId_provider_purpose_key" ON "Credential"("orgId", "provider", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthState_state_key" ON "OAuthState"("state");

-- CreateIndex
CREATE INDEX "OAuthState_orgId_provider_idx" ON "OAuthState"("orgId", "provider");

-- CreateIndex
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

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

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandBrain" ADD CONSTRAINT "BrandBrain_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcpProfile" ADD CONSTRAINT "IcpProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofItem" ADD CONSTRAINT "ProofItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItemTag" ADD CONSTRAINT "ResearchItemTag_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItemTag" ADD CONSTRAINT "ResearchItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternEvidence" ADD CONSTRAINT "PatternEvidence_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternEvidence" ADD CONSTRAINT "PatternEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternEvidence" ADD CONSTRAINT "PatternEvidence_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaEvidence" ADD CONSTRAINT "IdeaEvidence_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaEvidence" ADD CONSTRAINT "IdeaEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEvent" ADD CONSTRAINT "ContentEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEvent" ADD CONSTRAINT "ContentEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEvent" ADD CONSTRAINT "ContentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPackage" ADD CONSTRAINT "PlatformPackage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPackage" ADD CONSTRAINT "PlatformPackage_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPackage" ADD CONSTRAINT "PlatformPackage_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishRecord" ADD CONSTRAINT "PublishRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishRecord" ADD CONSTRAINT "PublishRecord_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishRecord" ADD CONSTRAINT "PublishRecord_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PlatformPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishRecord" ADD CONSTRAINT "PublishRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingMetric" ADD CONSTRAINT "OperatingMetric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceRun" ADD CONSTRAINT "IntelligenceRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceRun" ADD CONSTRAINT "IntelligenceRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunSource" ADD CONSTRAINT "RunSource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunSource" ADD CONSTRAINT "RunSource_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunSource" ADD CONSTRAINT "RunSource_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSignal" ADD CONSTRAINT "CandidateSignal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSignal" ADD CONSTRAINT "CandidateSignal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSignal" ADD CONSTRAINT "CandidateSignal_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSignal" ADD CONSTRAINT "CandidateSignal_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_candidateSignalId_fkey" FOREIGN KEY ("candidateSignalId") REFERENCES "CandidateSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstraintDiagnosis" ADD CONSTRAINT "ConstraintDiagnosis_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstraintDiagnosis" ADD CONSTRAINT "ConstraintDiagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstraintAssessment" ADD CONSTRAINT "ConstraintAssessment_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ConstraintDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMilestone" ADD CONSTRAINT "InstallationMilestone_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMilestone" ADD CONSTRAINT "InstallationMilestone_signedOffById_fkey" FOREIGN KEY ("signedOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPeriod" ADD CONSTRAINT "ProofPeriod_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPeriod" ADD CONSTRAINT "ProofPeriod_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingReadiness" ADD CONSTRAINT "RecordingReadiness_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingReadiness" ADD CONSTRAINT "RecordingReadiness_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessCheck" ADD CONSTRAINT "ReadinessCheck_readinessId_fkey" FOREIGN KEY ("readinessId") REFERENCES "RecordingReadiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopDocument" ADD CONSTRAINT "SopDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopDocument" ADD CONSTRAINT "SopDocument_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneration" ADD CONSTRAINT "AiGeneration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneration" ADD CONSTRAINT "AiGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketWedge" ADD CONSTRAINT "MarketWedge_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationConversation" ADD CONSTRAINT "ValidationConversation_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopCheck" ADD CONSTRAINT "SopCheck_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopCheck" ADD CONSTRAINT "SopCheck_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCall" ADD CONSTRAINT "SalesCall_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCall" ADD CONSTRAINT "SalesCall_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelReview" ADD CONSTRAINT "FunnelReview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_trackedLinkId_fkey" FOREIGN KEY ("trackedLinkId") REFERENCES "TrackedLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_publishRecordId_fkey" FOREIGN KEY ("publishRecordId") REFERENCES "PublishRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEvent" ADD CONSTRAINT "CommercialEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEvent" ADD CONSTRAINT "CommercialEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEvent" ADD CONSTRAINT "CommercialEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEvent" ADD CONSTRAINT "CommercialEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchExample" ADD CONSTRAINT "ResearchExample_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchExample" ADD CONSTRAINT "ResearchExample_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExampleAnalysis" ADD CONSTRAINT "ExampleAnalysis_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "ResearchExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeVerdict" ADD CONSTRAINT "JudgeVerdict_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeVerdict" ADD CONSTRAINT "JudgeVerdict_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "ResearchExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRoot" ADD CONSTRAINT "ContentRoot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRoot" ADD CONSTRAINT "ContentRoot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentExpectation" ADD CONSTRAINT "ContentExpectation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentExpectation" ADD CONSTRAINT "ContentExpectation_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentExpectation" ADD CONSTRAINT "ContentExpectation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_expectationId_fkey" FOREIGN KEY ("expectationId") REFERENCES "ContentExpectation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDiagnosis" ADD CONSTRAINT "ContentDiagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionEntry" ADD CONSTRAINT "CorrectionEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionEntry" ADD CONSTRAINT "CorrectionEntry_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionEntry" ADD CONSTRAINT "CorrectionEntry_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ContentDiagnosis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionEntry" ADD CONSTRAINT "CorrectionEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCallScriptSnapshot" ADD CONSTRAINT "SalesCallScriptSnapshot_callId_fkey" FOREIGN KEY ("callId") REFERENCES "SalesCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCallScriptSnapshot" ADD CONSTRAINT "SalesCallScriptSnapshot_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "SalesScript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPermission" ADD CONSTRAINT "ProofPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

