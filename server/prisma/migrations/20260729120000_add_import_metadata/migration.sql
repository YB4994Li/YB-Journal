-- Persist broker import identity so repeated Exness files can be reported safely.
ALTER TABLE "Trade"
ADD COLUMN "importSource" VARCHAR(30),
ADD COLUMN "sourceTradeId" VARCHAR(100),
ADD COLUMN "originalMarket" VARCHAR(100);

CREATE UNIQUE INDEX "Trade_accountId_importSource_sourceTradeId_key"
ON "Trade"("accountId", "importSource", "sourceTradeId");
