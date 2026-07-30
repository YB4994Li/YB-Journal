-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "closeTimeUtc" TIMESTAMP(3),
ADD COLUMN     "openTimeUtc" TIMESTAMP(3),
ADD COLUMN     "sessionDetection" VARCHAR(20),
ADD COLUMN     "sessionTimezone" VARCHAR(50);
