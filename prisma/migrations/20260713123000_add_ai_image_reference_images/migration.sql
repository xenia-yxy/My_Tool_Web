-- Keep AiImageAsset aligned with prisma/schema.prisma and image tools that persist reference image URLs.
ALTER TABLE "AiImageAsset"
  ADD COLUMN IF NOT EXISTS "referenceImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
