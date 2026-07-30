-- Non-destructive funded account and phase support. Existing accounts remain REAL
-- and existing trades remain account-scoped with a nullable phaseId.
CREATE TYPE "AccountType" AS ENUM ('REAL', 'FUNDED');
CREATE TYPE "PhaseType" AS ENUM ('EVALUATION', 'VERIFICATION', 'FUNDED_LIVE', 'CUSTOM');
CREATE TYPE "PhaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'PASSED', 'FAILED', 'ARCHIVED');

ALTER TABLE "Account"
ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'REAL',
ADD COLUMN "broker" VARCHAR(120),
ADD COLUMN "propFirm" VARCHAR(120),
ADD COLUMN "platform" VARCHAR(120),
ADD COLUMN "accountSize" DECIMAL(18,2),
ADD COLUMN "notes" TEXT;

CREATE TABLE "AccountPhase" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phaseType" "PhaseType" NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'PENDING',
    "orderIndex" INTEGER NOT NULL,
    "initialBalance" DECIMAL(18,2) NOT NULL,
    "currentBalance" DECIMAL(18,2) NOT NULL,
    "profitTargetPercentage" DECIMAL(7,3),
    "maximumLossPercentage" DECIMAL(7,3),
    "dailyLossLimitPercentage" DECIMAL(7,3),
    "minimumTradingDays" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "passedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountPhase_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Trade" ADD COLUMN "phaseId" INTEGER;
CREATE UNIQUE INDEX "AccountPhase_accountId_orderIndex_key" ON "AccountPhase"("accountId", "orderIndex");
CREATE INDEX "AccountPhase_accountId_status_idx" ON "AccountPhase"("accountId", "status");
CREATE INDEX "Trade_phaseId_idx" ON "Trade"("phaseId");
ALTER TABLE "AccountPhase" ADD CONSTRAINT "AccountPhase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "AccountPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
