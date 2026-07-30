CREATE TYPE "ImportSource" AS ENUM ('MANUAL', 'EXNESS', 'MT4', 'MT5', 'FUNDEDNEXT', 'GENERIC_CSV');
CREATE TYPE "CalculationStatus" AS ENUM ('CALCULATED', 'PARTIAL', 'MANUAL', 'UNAVAILABLE');

ALTER TABLE "Trade"
  ALTER COLUMN "strategyName" DROP NOT NULL,
  ADD COLUMN "plannedRROverride" DECIMAL(10,4),
  ADD COLUMN "realizedRMultiple" DECIMAL(10,4),
  ADD COLUMN "riskPercentageOverride" DECIMAL(7,4),
  ADD COLUMN "riskAmount" DECIMAL(18,2),
  ADD COLUMN "balanceBeforeTrade" DECIMAL(18,2),
  ADD COLUMN "calculationStatus" "CalculationStatus" NOT NULL DEFAULT 'UNAVAILABLE',
  ADD COLUMN "calculationWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Trade" ALTER COLUMN "importSource" DROP DEFAULT;
ALTER TABLE "Trade"
  ALTER COLUMN "importSource" TYPE "ImportSource"
  USING (
    CASE
      WHEN "importSource" = 'EXNESS' THEN 'EXNESS'
      WHEN "importSource" = 'MT4' THEN 'MT4'
      WHEN "importSource" IN ('MT5', 'METATRADER') THEN 'MT5'
      WHEN "importSource" = 'FUNDEDNEXT' THEN 'FUNDEDNEXT'
      WHEN "importSource" IS NULL THEN 'MANUAL'
      ELSE 'GENERIC_CSV'
    END
  )::"ImportSource";
ALTER TABLE "Trade" ALTER COLUMN "importSource" SET NOT NULL;
ALTER TABLE "Trade" ALTER COLUMN "importSource" SET DEFAULT 'MANUAL';

UPDATE "Trade"
SET "strategyName" = NULL
WHERE lower(trim("strategyName")) IN ('exness import', 'metatrader import', 'fundednext import', 'imported trade');
