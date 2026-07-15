CREATE TABLE "IpPrototypeProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipType" TEXT NOT NULL,
    "description" TEXT,
    "brandTone" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpPrototypeProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IpPrototypeGeneration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "ipType" TEXT NOT NULL,
    "outputGoal" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "styleText" TEXT,
    "draftImageUrl" TEXT,
    "styleImageUrl" TEXT,
    "imageUrl" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpPrototypeGeneration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IpPrototypeProject_authorId_updatedAt_idx" ON "IpPrototypeProject"("authorId", "updatedAt");
CREATE INDEX "IpPrototypeProject_authorId_ipType_idx" ON "IpPrototypeProject"("authorId", "ipType");
CREATE INDEX "IpPrototypeGeneration_authorId_createdAt_idx" ON "IpPrototypeGeneration"("authorId", "createdAt");
CREATE INDEX "IpPrototypeGeneration_projectId_createdAt_idx" ON "IpPrototypeGeneration"("projectId", "createdAt");
CREATE INDEX "IpPrototypeGeneration_ipType_outputGoal_idx" ON "IpPrototypeGeneration"("ipType", "outputGoal");

ALTER TABLE "IpPrototypeProject" ADD CONSTRAINT "IpPrototypeProject_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IpPrototypeGeneration" ADD CONSTRAINT "IpPrototypeGeneration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IpPrototypeProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IpPrototypeGeneration" ADD CONSTRAINT "IpPrototypeGeneration_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
