-- AlterEnum
ALTER TYPE "DailyPlanStatus" ADD VALUE IF NOT EXISTS 'DOING';
ALTER TYPE "DailyPlanStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- CreateEnum
CREATE TYPE "DailyPlanQuadrant" AS ENUM ('DO_NOW', 'SCHEDULE', 'DELEGATE', 'DELETE');

-- AlterTable
ALTER TABLE "DailyPlanItem"
ADD COLUMN "weekStartDate" DATE,
ADD COLUMN "quadrant" "DailyPlanQuadrant" NOT NULL DEFAULT 'SCHEDULE',
ADD COLUMN "dueDate" DATE,
ADD COLUMN "estimateMinutes" INTEGER,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- Backfill week starts using PostgreSQL's ISO-style week start.
UPDATE "DailyPlanItem"
SET "weekStartDate" = date_trunc('week', "planDate"::timestamp)::date
WHERE "weekStartDate" IS NULL;

-- AlterTable
ALTER TABLE "DailyPlanItem"
ALTER COLUMN "weekStartDate" SET NOT NULL;

-- CreateIndex
CREATE INDEX "DailyPlanItem_authorId_weekStartDate_quadrant_idx" ON "DailyPlanItem"("authorId", "weekStartDate", "quadrant");
