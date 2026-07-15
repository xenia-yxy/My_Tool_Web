-- Add structured publishing metadata and generation status to AI image assets.
ALTER TABLE "AiImageAsset"
  ADD COLUMN "sourceTool" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
  ADD COLUMN "jobId" TEXT,
  ADD COLUMN "caption" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "productKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "errorMessage" TEXT;

CREATE INDEX "AiImageAsset_authorId_status_createdAt_idx"
  ON "AiImageAsset"("authorId", "status", "createdAt");

CREATE INDEX "AiImageAsset_jobId_idx"
  ON "AiImageAsset"("jobId");

-- Persist generation batches so the unified gallery can reason about status.
CREATE TABLE "AiImageJob" (
  "id" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "sourceTool" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "batchCount" INTEGER NOT NULL DEFAULT 1,
  "completedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "authorId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiImageJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiImageJob_authorId_createdAt_idx"
  ON "AiImageJob"("authorId", "createdAt");

CREATE INDEX "AiImageJob_authorId_status_createdAt_idx"
  ON "AiImageJob"("authorId", "status", "createdAt");

CREATE INDEX "AiImageJob_mode_createdAt_idx"
  ON "AiImageJob"("mode", "createdAt");

ALTER TABLE "AiImageJob"
  ADD CONSTRAINT "AiImageJob_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
