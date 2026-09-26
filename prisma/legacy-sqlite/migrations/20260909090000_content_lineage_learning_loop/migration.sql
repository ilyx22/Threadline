-- Content lineage and the learning loop.
--
-- SCORE -> EXPLAIN -> DIAGNOSE -> PRESCRIBE -> RETEST
--
-- Every new column on an existing table is nullable or defaulted, so historical
-- rows stay valid. Backfill runs separately and deliberately: a root invented
-- for old content would be a lineage claim nobody made.

CREATE TABLE "ContentRoot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "audience" TEXT,
    "pillar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" DATETIME,
    "closedReason" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentRoot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentRoot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ContentRoot_orgId_status_idx" ON "ContentRoot"("orgId", "status");
CREATE INDEX "ContentRoot_orgId_createdAt_idx" ON "ContentRoot"("orgId", "createdAt");

CREATE TABLE "ContentExpectation" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentExpectation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentExpectation_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentExpectation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ContentExpectation_orgId_subjectType_subjectId_idx" ON "ContentExpectation"("orgId", "subjectType", "subjectId");
CREATE INDEX "ContentExpectation_rootId_idx" ON "ContentExpectation"("rootId");
CREATE INDEX "ContentExpectation_orgId_rubricVersion_idx" ON "ContentExpectation"("orgId", "rubricVersion");

CREATE TABLE "ContentDiagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "rootId" TEXT,
    "contentItemId" TEXT,
    "expectationId" TEXT,
    "windowStart" DATETIME,
    "windowEnd" DATETIME,
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
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentDiagnosis_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentDiagnosis_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentDiagnosis_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentDiagnosis_expectationId_fkey" FOREIGN KEY ("expectationId") REFERENCES "ContentExpectation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentDiagnosis_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentDiagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ContentDiagnosis_orgId_createdAt_idx" ON "ContentDiagnosis"("orgId", "createdAt");
CREATE INDEX "ContentDiagnosis_rootId_idx" ON "ContentDiagnosis"("rootId");
CREATE INDEX "ContentDiagnosis_contentItemId_idx" ON "ContentDiagnosis"("contentItemId");

CREATE TABLE "CorrectionEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "verdictAt" DATETIME,
    "retestContentItemId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorrectionEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CorrectionEntry_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CorrectionEntry_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ContentDiagnosis" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CorrectionEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "CorrectionEntry_orgId_createdAt_idx" ON "CorrectionEntry"("orgId", "createdAt");
CREATE INDEX "CorrectionEntry_rootId_idx" ON "CorrectionEntry"("rootId");
CREATE INDEX "CorrectionEntry_orgId_lever_idx" ON "CorrectionEntry"("orgId", "lever");

-- Lineage on existing content. Nullable so nothing historical breaks.
ALTER TABLE "Idea" ADD COLUMN "rootId" TEXT REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Idea_rootId_idx" ON "Idea"("rootId");

ALTER TABLE "ContentItem" ADD COLUMN "rootId" TEXT REFERENCES "ContentRoot" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD COLUMN "derivedFromId" TEXT REFERENCES "ContentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD COLUMN "lineageRole" TEXT NOT NULL DEFAULT 'source';
CREATE INDEX "ContentItem_rootId_idx" ON "ContentItem"("rootId");
CREATE INDEX "ContentItem_derivedFromId_idx" ON "ContentItem"("derivedFromId");
