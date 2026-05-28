import assert from "node:assert/strict";
import { test } from "node:test";
import {
  makeSlug,
  normalizeContentAssetInput,
  resolvePublication,
} from "../src/server/content-assets";

test("makeSlug normalizes ascii titles and falls back for non-ascii titles", () => {
  assert.equal(makeSlug(" AI SOP Flow: MVP! "), "ai-sop-flow-mvp");
  assert.equal(makeSlug("内容资产", "seed-1"), "content-seed-1");
});

test("normalizeContentAssetInput trims fields and prepares a private content asset", () => {
  const result = normalizeContentAssetInput({
    title: "  AI SOP Flow  ",
    slug: "  Custom Slug  ",
    excerpt: "  一线实践复盘  ",
    content: "  # 标题\n\n正文  ",
  });

  assert.deepEqual(result, {
    title: "AI SOP Flow",
    slug: "custom-slug",
    excerpt: "一线实践复盘",
    content: "# 标题\n\n正文",
  });
});

test("resolvePublication sets publishedAt only while published", () => {
  const firstPublishedAt = new Date("2026-05-28T03:00:00.000Z");
  const secondPublishedAt = new Date("2026-05-28T04:00:00.000Z");

  assert.deepEqual(resolvePublication("PUBLISHED", null, firstPublishedAt), {
    status: "PUBLISHED",
    publishedAt: firstPublishedAt,
  });

  assert.deepEqual(
    resolvePublication("PUBLISHED", firstPublishedAt, secondPublishedAt),
    {
      status: "PUBLISHED",
      publishedAt: firstPublishedAt,
    },
  );

  assert.deepEqual(resolvePublication("PRIVATE", firstPublishedAt, secondPublishedAt), {
    status: "PRIVATE",
    publishedAt: null,
  });
});
