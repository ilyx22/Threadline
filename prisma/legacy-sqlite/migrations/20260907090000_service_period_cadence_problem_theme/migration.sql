-- Commercial cadence is four-week service periods, not calendar months.
-- Renaming the column rather than reinterpreting it: a field called
-- `monthlyFee` holding a four-weekly fee is the kind of quiet inaccuracy that
-- eventually reaches an invoice.
ALTER TABLE "Organization" RENAME COLUMN "monthlyFee" TO "periodFee";

-- Proof comparison periods follow the service cadence for the same reason: a
-- period that drifted with the calendar would compare four weeks of work
-- against five.
UPDATE "ProofPeriod" SET "kind" = 'period' WHERE "kind" = 'month';

-- Convergence on a recurring problem is an operator judgement the system
-- counts. Null means "not yet classified", which is excluded from convergence
-- rather than guessed at.
ALTER TABLE "ValidationConversation" ADD COLUMN "problemTheme" TEXT;
