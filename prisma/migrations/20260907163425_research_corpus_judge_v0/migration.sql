-- CreateTable
CREATE TABLE "ResearchExample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wedgeId" TEXT,
    "platform" TEXT NOT NULL,
    "creatorHandle" TEXT NOT NULL,
    "creatorName" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "transcript" TEXT,
    "notes" TEXT,
    "illustrative" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchExample_wedgeId_fkey" FOREIGN KEY ("wedgeId") REFERENCES "MarketWedge" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResearchExample_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExampleAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExampleAnalysis_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "ResearchExample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JudgeVerdict" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JudgeVerdict_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JudgeVerdict_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "ResearchExample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JudgeCalibration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricVersion" TEXT NOT NULL,
    "pairs" INTEGER NOT NULL DEFAULT 0,
    "outperformers" INTEGER NOT NULL DEFAULT 0,
    "separation" REAL,
    "sufficient" BOOLEAN NOT NULL DEFAULT false,
    "reading" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "runById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
