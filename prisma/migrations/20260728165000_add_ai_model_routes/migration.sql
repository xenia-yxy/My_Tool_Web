CREATE TABLE "AiModelRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'AUTO',
    "credentialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiModelRoute_userId_capability_key" ON "AiModelRoute"("userId", "capability");

CREATE INDEX "AiModelRoute_credentialId_idx" ON "AiModelRoute"("credentialId");

ALTER TABLE "AiModelRoute" ADD CONSTRAINT "AiModelRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiModelRoute" ADD CONSTRAINT "AiModelRoute_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "AiProviderCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
