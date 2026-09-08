-- Capture provenance. Descriptive fields and metrics are tracked separately
-- because they have genuinely different trust: a title can be read off a public
-- page, a view count cannot be read off anything without credentials.
ALTER TABLE "ResearchExample" ADD COLUMN "provenance" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "ResearchExample" ADD COLUMN "metricsProvenance" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "ResearchExample" ADD COLUMN "enrichedAt" DATETIME;
ALTER TABLE "ResearchExample" ADD COLUMN "enrichmentNote" TEXT;
