CREATE TYPE "AssetClass" AS ENUM ('FOREX', 'METAL', 'INDEX', 'CRYPTO', 'COMMODITY');
CREATE TYPE "RiskCalculationMode" AS ENUM ('CONTRACT_SIZE', 'TICK_VALUE', 'FOREX_CONVERSION', 'UNSUPPORTED');
CREATE TYPE "RiskCalculationStatus" AS ENUM ('CALCULATED', 'MANUAL', 'UNAVAILABLE');

CREATE TABLE "InstrumentSpecification" (
  "id" SERIAL NOT NULL,
  "symbol" VARCHAR(50) NOT NULL,
  "normalizedSymbol" VARCHAR(50) NOT NULL,
  "displayName" VARCHAR(120) NOT NULL,
  "assetClass" "AssetClass" NOT NULL,
  "contractSize" DECIMAL(20,8),
  "tickSize" DECIMAL(20,8),
  "tickValuePerLot" DECIMAL(20,8),
  "pipSize" DECIMAL(20,8),
  "profitCurrency" VARCHAR(10),
  "calculationMode" "RiskCalculationMode" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstrumentSpecification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstrumentSpecification_normalizedSymbol_key"
  ON "InstrumentSpecification"("normalizedSymbol");

ALTER TABLE "Trade"
  ADD COLUMN "balanceAfterTrade" DECIMAL(18,2),
  ADD COLUMN "instrumentSpecificationId" INTEGER,
  ADD COLUMN "riskCalculationMode" "RiskCalculationMode",
  ADD COLUMN "contractSizeUsed" DECIMAL(20,8),
  ADD COLUMN "tickSizeUsed" DECIMAL(20,8),
  ADD COLUMN "tickValueUsed" DECIMAL(20,8),
  ADD COLUMN "pipSizeUsed" DECIMAL(20,8),
  ADD COLUMN "conversionRateUsed" DECIMAL(20,8),
  ADD COLUMN "riskCalculationSource" VARCHAR(255),
  ADD COLUMN "riskCalculationStatus" "RiskCalculationStatus" NOT NULL DEFAULT 'UNAVAILABLE',
  ADD COLUMN "riskCalculationError" VARCHAR(100);

CREATE INDEX "Trade_instrumentSpecificationId_idx" ON "Trade"("instrumentSpecificationId");
ALTER TABLE "Trade"
  ADD CONSTRAINT "Trade_instrumentSpecificationId_fkey"
  FOREIGN KEY ("instrumentSpecificationId") REFERENCES "InstrumentSpecification"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
