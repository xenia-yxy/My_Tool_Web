-- CreateEnum
CREATE TYPE "DailyPlanStatus" AS ENUM ('TODO', 'DONE');

-- CreateTable
CREATE TABLE "DailyPlanItem" (
    "id" TEXT NOT NULL,
    "planDate" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "status" "DailyPlanStatus" NOT NULL DEFAULT 'TODO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyPlanItem_authorId_planDate_sortOrder_idx" ON "DailyPlanItem"("authorId", "planDate", "sortOrder");

-- CreateIndex
CREATE INDEX "DailyPlanItem_authorId_status_idx" ON "DailyPlanItem"("authorId", "status");

-- AddForeignKey
ALTER TABLE "DailyPlanItem" ADD CONSTRAINT "DailyPlanItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
