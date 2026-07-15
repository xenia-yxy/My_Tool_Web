CREATE TYPE "WorkbenchSessionStatus" AS ENUM ('DRAFT', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "WorkbenchSession" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "WorkbenchSessionStatus" NOT NULL DEFAULT 'DRAFT',
  "prompt" TEXT NOT NULL DEFAULT '',
  "inputSnapshot" JSONB NOT NULL,
  "outputSnapshot" JSONB NOT NULL,
  "imageAssetIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "externalJobId" TEXT,
  "errorMessage" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkbenchSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkbenchSession_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WorkbenchSession_authorId_toolId_updatedAt_idx"
  ON "WorkbenchSession"("authorId", "toolId", "updatedAt");

CREATE INDEX "WorkbenchSession_authorId_status_updatedAt_idx"
  ON "WorkbenchSession"("authorId", "status", "updatedAt");
