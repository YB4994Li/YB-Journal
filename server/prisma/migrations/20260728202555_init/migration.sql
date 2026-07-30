-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'MAD');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "TradeResult" AS ENUM ('WIN', 'LOSS', 'BREAK_EVEN');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "initialCapital" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "tradeNumber" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "strategyName" VARCHAR(120) NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "tradeDate" DATE NOT NULL,
    "session" VARCHAR(50),
    "timeframe" VARCHAR(30),
    "direction" "Direction" NOT NULL,
    "entryPrice" DECIMAL(20,8),
    "stopLoss" DECIMAL(20,8),
    "takeProfit" DECIMAL(20,8),
    "lotSize" DECIMAL(18,4),
    "plannedRR" DECIMAL(10,4),
    "resultR" DECIMAL(10,4),
    "exitPrice" DECIMAL(20,8),
    "riskPercentage" DECIMAL(7,4),
    "result" "TradeResult" NOT NULL,
    "profitLoss" DECIMAL(18,2) NOT NULL,
    "screenshotPath" VARCHAR(255),
    "emotion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_accountId_idx" ON "Trade"("accountId");

-- CreateIndex
CREATE INDEX "Trade_tradeDate_idx" ON "Trade"("tradeDate");

-- CreateIndex
CREATE INDEX "Trade_market_idx" ON "Trade"("market");

-- CreateIndex
CREATE INDEX "Trade_strategyName_idx" ON "Trade"("strategyName");

-- CreateIndex
CREATE INDEX "Trade_result_idx" ON "Trade"("result");

-- CreateIndex
CREATE INDEX "Trade_direction_idx" ON "Trade"("direction");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_accountId_tradeNumber_key" ON "Trade"("accountId", "tradeNumber");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
