-- CreateEnum
CREATE TYPE "DailyPlanPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "DailyPlanItem"
ADD COLUMN "priority" "DailyPlanPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "plannedTime" TEXT;
