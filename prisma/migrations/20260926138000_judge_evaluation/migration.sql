-- CreateTable
CREATE TABLE "JudgeEvaluation" (
    "id" TEXT NOT NULL,
    "fraction" DOUBLE PRECISION NOT NULL,
    "results" TEXT NOT NULL,
    "runById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgePromotion" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "evaluationId" TEXT,
    "note" TEXT,
    "promotedById" TEXT NOT NULL,
    "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "retiredById" TEXT,

    CONSTRAINT "JudgePromotion_pkey" PRIMARY KEY ("id")
);

