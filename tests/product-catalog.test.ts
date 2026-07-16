import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  normalizeProductCategoryInput,
  normalizeProductInput,
} from "../src/lib/product-catalog";

test("product catalog schema keeps categories, products, and images separate from materials", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /model ProductCategory/);
  assert.match(schema, /model Product/);
  assert.match(schema, /model ProductImage/);
  assert.match(schema, /productCategories ProductCategory\[\]/);
});

test("normalizes a user-created product category", () => {
  assert.deepEqual(normalizeProductCategoryInput({ name: "  夏季服装  ", sortOrder: 4 }), {
    name: "夏季服装",
    sortOrder: 4,
  });
});

test("normalizes a product with multiple images and one primary image", () => {
  assert.deepEqual(normalizeProductInput({
    categoryId: " category-1 ",
    description: "  夏季男士短袖，实拍可见的浅色面料。 ",
    imageUrls: ["/uploads/a.png", "/uploads/b.png", "/uploads/a.png"],
    keywords: ["短袖男", "通勤短袖", "短袖男"],
    name: "  浅色短袖  ",
    primaryImageUrl: "/uploads/b.png",
    scenes: ["通勤", "校园"],
    sellPoints: ["宽松版型", "浅色"],
    tags: ["夏季", "短袖", "夏季"],
  }), {
    categoryId: "category-1",
    description: "夏季男士短袖，实拍可见的浅色面料。",
    imageUrls: ["/uploads/a.png", "/uploads/b.png"],
    keywords: ["短袖男", "通勤短袖"],
    name: "浅色短袖",
    primaryImageUrl: "/uploads/b.png",
    scenes: ["通勤", "校园"],
    sellPoints: ["宽松版型", "浅色"],
    tags: ["夏季", "短袖"],
  });
});

test("product catalog exposes a standalone visible list instead of the material library", () => {
  const page = readFileSync("src/app/tools/products/page.tsx", "utf8");
  const workspace = readFileSync("src/components/tools/product-catalog/product-catalog-page.tsx", "utf8");

  assert.match(page, /ProductCatalogPage/);
  assert.match(workspace, /\/api\/tools\/products/);
  assert.match(workspace, /\/api\/tools\/product-categories/);
  assert.match(workspace, /新建选品/);
  assert.match(workspace, /图片数量/);
  assert.match(workspace, /AI 分析状态/);
  assert.doesNotMatch(workspace, /menswear\/materials/);
});

test("product editor uploads its own images and saves a multi-image product", () => {
  const editor = readFileSync("src/components/tools/product-catalog/product-editor.tsx", "utf8");
  const uploadRoute = readFileSync("src/app/api/tools/products/upload/route.ts", "utf8");

  assert.match(editor, /\/api\/tools\/products\/upload/);
  assert.match(editor, /primaryImageUrl/);
  assert.match(editor, /\/api\/tools\/products\/\$\{productId\}/);
  assert.match(uploadRoute, /saveReferenceImageToRuntime/);
  assert.doesNotMatch(editor, /menswear\/materials/);
});
