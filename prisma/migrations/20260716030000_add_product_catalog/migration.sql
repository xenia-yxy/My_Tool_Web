CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sellPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "scenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "aiAnalysis" JSONB NOT NULL DEFAULT '{}',
  "aiAnalyzedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductCategory_authorId_name_key" ON "ProductCategory"("authorId", "name");
CREATE INDEX "ProductCategory_authorId_sortOrder_idx" ON "ProductCategory"("authorId", "sortOrder");
CREATE INDEX "Product_authorId_updatedAt_idx" ON "Product"("authorId", "updatedAt");
CREATE INDEX "Product_authorId_categoryId_idx" ON "Product"("authorId", "categoryId");
CREATE UNIQUE INDEX "ProductImage_productId_position_key" ON "ProductImage"("productId", "position");
CREATE INDEX "ProductImage_productId_isPrimary_idx" ON "ProductImage"("productId", "isPrimary");
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
