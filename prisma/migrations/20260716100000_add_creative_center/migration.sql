CREATE TABLE "CreativeSkill" (
  "id" TEXT NOT NULL,
  "authorId" TEXT,
  "ownerType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreativeSkill_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeSkill_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreativeSkillVersion" (
  "id" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreativeSkillVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeSkillVersion_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "CreativeSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreativeCanvasSession" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "viewport" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreativeCanvasSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeCanvasSession_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreativeCanvasNode" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "position" JSONB NOT NULL,
  "snapshot" JSONB NOT NULL,
  "skillVersionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreativeCanvasNode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeCanvasNode_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CreativeCanvasSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CreativeCanvasNode_skillVersionId_fkey"
    FOREIGN KEY ("skillVersionId") REFERENCES "CreativeSkillVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CreativeCanvasEdge" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "sourceNodeId" TEXT NOT NULL,
  "targetNodeId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreativeCanvasEdge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeCanvasEdge_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CreativeCanvasSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreativeCanvasRun" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "nodeId" TEXT,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreativeCanvasRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreativeCanvasRun_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CreativeCanvasSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CreativeSkill_authorId_updatedAt_idx" ON "CreativeSkill"("authorId", "updatedAt");
CREATE INDEX "CreativeSkill_ownerType_enabled_idx" ON "CreativeSkill"("ownerType", "enabled");
CREATE UNIQUE INDEX "CreativeSkillVersion_skillId_version_key" ON "CreativeSkillVersion"("skillId", "version");
CREATE INDEX "CreativeCanvasSession_authorId_updatedAt_idx" ON "CreativeCanvasSession"("authorId", "updatedAt");
CREATE UNIQUE INDEX "CreativeCanvasNode_sessionId_clientId_key" ON "CreativeCanvasNode"("sessionId", "clientId");
CREATE UNIQUE INDEX "CreativeCanvasEdge_sessionId_sourceNodeId_targetNodeId_role_key"
  ON "CreativeCanvasEdge"("sessionId", "sourceNodeId", "targetNodeId", "role");
