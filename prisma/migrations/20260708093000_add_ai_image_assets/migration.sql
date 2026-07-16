-- CreateTable
CREATE TABLE "AiImageAsset" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "note" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiImageAsset_authorId_createdAt_idx" ON "AiImageAsset"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "AiImageAsset_mode_createdAt_idx" ON "AiImageAsset"("mode", "createdAt");

-- AddForeignKey
ALTER TABLE "AiImageAsset" ADD CONSTRAINT "AiImageAsset_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
