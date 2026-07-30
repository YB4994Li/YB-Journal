CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PAUSED', 'PASSED', 'FAILED', 'CLOSED', 'ARCHIVED');
ALTER TABLE "Account"
  ADD COLUMN "externalReference" VARCHAR(120),
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Strategy" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "normalizedKey" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "color" VARCHAR(30),
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Strategy_normalizedKey_key" ON "Strategy"("normalizedKey");

ALTER TABLE "Trade" ADD COLUMN "strategyId" INTEGER;
CREATE INDEX "Trade_strategyId_idx" ON "Trade"("strategyId");
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Strategy" ("name", "normalizedKey", "updatedAt")
SELECT DISTINCT ON (lower(regexp_replace(trim("strategyName"), '\s+', ' ', 'g')))
       initcap(regexp_replace(trim("strategyName"), '\s+', ' ', 'g')),
       lower(regexp_replace(trim("strategyName"), '\s+', ' ', 'g')),
       CURRENT_TIMESTAMP
FROM "Trade"
WHERE "strategyName" IS NOT NULL AND trim("strategyName") <> ''
ORDER BY lower(regexp_replace(trim("strategyName"), '\s+', ' ', 'g')), "id";

UPDATE "Trade" t
SET "strategyId" = s."id", "strategyName" = s."name"
FROM "Strategy" s
WHERE lower(regexp_replace(trim(t."strategyName"), '\s+', ' ', 'g')) = s."normalizedKey";
