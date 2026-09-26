-- Outlier V1: format, and the two relevance ratings that stop raw virality
-- dominating the corpus. All three default to a non-committal value because the
-- honest state of an unreviewed row is "nobody has said", not a guess.
ALTER TABLE "ResearchExample" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "ResearchExample" ADD COLUMN "buyerRelevance" TEXT NOT NULL DEFAULT 'unrated';
ALTER TABLE "ResearchExample" ADD COLUMN "commercialIntent" TEXT NOT NULL DEFAULT 'unrated';
