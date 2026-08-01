ALTER TYPE "PhaseStatus" RENAME VALUE 'PENDING' TO 'LOCKED';

ALTER TABLE "Account"
  DROP COLUMN "breakEvenThresholdPercent",
  ADD COLUMN "maximumLossPercentage" DECIMAL(7,3);

ALTER TABLE "AccountPhase"
  DROP COLUMN "breakEvenThresholdPercent";

UPDATE "AccountPhase" p
SET "currentBalance" = p."initialBalance" + COALESCE((
  SELECT SUM(t."profitLoss") FROM "Trade" t WHERE t."phaseId" = p.id
), 0);

UPDATE "AccountPhase"
SET status = 'FAILED', "failedAt" = NOW(), "endDate" = CURRENT_DATE
WHERE status = 'ACTIVE'
  AND "maximumLossPercentage" IS NOT NULL
  AND "currentBalance" <= "initialBalance" * (1 - "maximumLossPercentage" / 100);
