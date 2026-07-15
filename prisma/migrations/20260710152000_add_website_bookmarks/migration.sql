-- CreateTable
CREATE TABLE "WebsiteBookmark" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteBookmark_userId_updatedAt_idx" ON "WebsiteBookmark"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "WebsiteBookmark_category_subcategory_idx" ON "WebsiteBookmark"("category", "subcategory");

-- AddForeignKey
ALTER TABLE "WebsiteBookmark" ADD CONSTRAINT "WebsiteBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
