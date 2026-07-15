CREATE TABLE "MenswearMaterial" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "rightsStatus" TEXT NOT NULL DEFAULT 'PRIVATE',
  "imageUrl" TEXT NOT NULL,
  "previewUrl" TEXT,
  "maskUrl" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "analysis" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "promptNotes" TEXT,
  "qualityScore" INTEGER,
  "completeness" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenswearMaterial_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearMaterial_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MenswearModelProfile" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "profile" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "faceLockStrength" INTEGER NOT NULL DEFAULT 90,
  "bodyLockStrength" INTEGER NOT NULL DEFAULT 85,
  "hairLockStrength" INTEGER NOT NULL DEFAULT 80,
  "consentConfirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenswearModelProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearModelProfile_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MenswearProject" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "modelProfileId" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "description" TEXT,
  "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenswearProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearProject_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MenswearProject_modelProfileId_fkey"
    FOREIGN KEY ("modelProfileId") REFERENCES "MenswearModelProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "MenswearModelProfileImage" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenswearModelProfileImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearModelProfileImage_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "MenswearModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MenswearModelProfileImage_materialId_fkey"
    FOREIGN KEY ("materialId") REFERENCES "MenswearMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MenswearProjectReference" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "fidelity" INTEGER NOT NULL,
  "allowedChanges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenswearProjectReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearProjectReference_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "MenswearProject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MenswearProjectReference_materialId_fkey"
    FOREIGN KEY ("materialId") REFERENCES "MenswearMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MenswearPromptVersion" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "userPrompt" TEXT,
  "finalPrompt" TEXT NOT NULL,
  "jobId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenswearPromptVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenswearPromptVersion_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "MenswearProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MenswearMaterial_authorId_category_updatedAt_idx"
  ON "MenswearMaterial"("authorId", "category", "updatedAt");
CREATE INDEX "MenswearModelProfile_authorId_updatedAt_idx"
  ON "MenswearModelProfile"("authorId", "updatedAt");
CREATE INDEX "MenswearProject_authorId_updatedAt_idx"
  ON "MenswearProject"("authorId", "updatedAt");
CREATE INDEX "MenswearModelProfileImage_materialId_idx"
  ON "MenswearModelProfileImage"("materialId");
CREATE INDEX "MenswearProjectReference_materialId_idx"
  ON "MenswearProjectReference"("materialId");
CREATE INDEX "MenswearPromptVersion_projectId_createdAt_idx"
  ON "MenswearPromptVersion"("projectId", "createdAt");

CREATE UNIQUE INDEX "MenswearModelProfileImage_profileId_role_position_key"
  ON "MenswearModelProfileImage"("profileId", "role", "position");
CREATE UNIQUE INDEX "MenswearProjectReference_projectId_role_position_key"
  ON "MenswearProjectReference"("projectId", "role", "position");
