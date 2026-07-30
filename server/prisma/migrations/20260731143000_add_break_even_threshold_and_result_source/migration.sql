CREATE TYPE "ResultSource" AS ENUM ('AUTO', 'MANUAL');

ALTER TABLE "Account"
  ADD COLUMN "breakEvenThresholdPercent" DECIMAL(7,4) NOT NULL DEFAULT 0.05;

ALTER TABLE "AccountPhase"
  ADD COLUMN "breakEvenThresholdPercent" DECIMAL(7,4) NOT NULL DEFAULT 0.05;

ALTER TABLE "Trade"
  ADD COLUMN "resultSource" "ResultSource" NOT NULL DEFAULT 'AUTO';

-- Existing values cannot be reliably distinguished as manual or automatic.
-- They remain AUTO and are recalculated by the explicit recalculation script.
