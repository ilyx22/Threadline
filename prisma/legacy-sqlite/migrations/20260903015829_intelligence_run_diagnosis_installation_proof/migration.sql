-- CreateTable
CREATE TABLE "IntelligenceRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scoping',
    "focus" TEXT,
    "summary" TEXT,
    "brief" TEXT NOT NULL DEFAULT '{}',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "signalCount" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "testCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntelligenceRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntelligenceRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "collectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RunSource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunSource_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunSource_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "decidedAt" DATETIME,
    "editedByHuman" BOOLEAN NOT NULL DEFAULT false,
    "patternId" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CandidateSignal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateSignal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateSignal_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CandidateSignal_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateSignalId" TEXT NOT NULL,
    "researchItemId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateEvidence_candidateSignalId_fkey" FOREIGN KEY ("candidateSignalId") REFERENCES "CandidateSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateEvidence_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConstraintDiagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "primaryConstraint" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence" TEXT,
    "commercialImpact" TEXT,
    "recommendedAction" TEXT,
    "experiment" TEXT,
    "reviewDate" DATETIME,
    "reviewedAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConstraintDiagnosis_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConstraintDiagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConstraintAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagnosisId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 3,
    "note" TEXT,
    "evidence" TEXT,
    CONSTRAINT "ConstraintAssessment_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ConstraintDiagnosis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallationMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "note" TEXT,
    "blockedReason" TEXT,
    "signedOffAt" DATETIME,
    "signedOffById" TEXT,
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallationMilestone_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstallationMilestone_signedOffById_fkey" FOREIGN KEY ("signedOffById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProofPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'month',
    "label" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "reportedFounderHours" REAL,
    "reportedContentOutput" INTEGER,
    "reportedCycleTimeDays" REAL,
    "reportedApprovalDays" REAL,
    "reportedAudienceSize" INTEGER,
    "reportedEngagementRate" REAL,
    "reportedQualifiedInquiries" INTEGER,
    "reportedCallsBooked" INTEGER,
    "reportedAttributableValueMinor" INTEGER,
    "attributionNote" TEXT,
    "qualitativeNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'client_reported',
    "lockedAt" DATETIME,
    "recordedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProofPeriod_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProofPeriod_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pattern_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pattern_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pattern_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "Pattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pattern" ("confidence", "createdAt", "description", "detectedBy", "effort", "id", "impact", "kind", "nextExperiment", "orgId", "score", "status", "title", "updatedAt") SELECT "confidence", "createdAt", "description", "detectedBy", "effort", "id", "impact", "kind", "nextExperiment", "orgId", "score", "status", "title", "updatedAt" FROM "Pattern";
DROP TABLE "Pattern";
ALTER TABLE "new_Pattern" RENAME TO "Pattern";
CREATE INDEX "Pattern_orgId_kind_status_idx" ON "Pattern"("orgId", "kind", "status");
CREATE INDEX "Pattern_runId_idx" ON "Pattern"("runId");
CREATE INDEX "Pattern_derivedFromId_idx" ON "Pattern"("derivedFromId");
CREATE TABLE "new_ResearchItem" (
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
    "sourceMeta" TEXT NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "runId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResearchItem_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResearchItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IntelligenceRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResearchItem" ("author", "body", "capturedAt", "collectedVia", "competitorId", "createdAt", "id", "kind", "metrics", "orgId", "platform", "sourceName", "title", "updatedAt", "url") SELECT "author", "body", "capturedAt", "collectedVia", "competitorId", "createdAt", "id", "kind", "metrics", "orgId", "platform", "sourceName", "title", "updatedAt", "url" FROM "ResearchItem";
DROP TABLE "ResearchItem";
ALTER TABLE "new_ResearchItem" RENAME TO "ResearchItem";
CREATE INDEX "ResearchItem_orgId_kind_idx" ON "ResearchItem"("orgId", "kind");
CREATE INDEX "ResearchItem_orgId_capturedAt_idx" ON "ResearchItem"("orgId", "capturedAt");
CREATE INDEX "ResearchItem_runId_idx" ON "ResearchItem"("runId");
CREATE UNIQUE INDEX "ResearchItem_orgId_dedupeKey_key" ON "ResearchItem"("orgId", "dedupeKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
