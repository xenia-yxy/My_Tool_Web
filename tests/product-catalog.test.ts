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
