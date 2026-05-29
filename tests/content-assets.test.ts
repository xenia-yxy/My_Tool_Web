import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPublishedContentAssetHref,
  makeSlug,
  normalizeContentAssetInput,
  normalizeContentAssetFilter,
  normalizeContentAssetQuery,
  resolvePublication,
  summarizeContentAssetStats,
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

test("normalizeContentAssetFilter falls back to all for invalid status values", () => {
  assert.equal(normalizeContentAssetFilter("PRIVATE"), "PRIVATE");
  assert.equal(normalizeContentAssetFilter("PUBLISHED"), "PUBLISHED");
  assert.equal(normalizeContentAssetFilter(["PUBLISHED", "PRIVATE"]), "PUBLISHED");
  assert.equal(normalizeContentAssetFilter("ARCHIVED"), "ALL");
  assert.equal(normalizeContentAssetFilter(undefined), "ALL");
});

test("normalizeContentAssetQuery trims search text and ignores empty values", () => {
  assert.equal(normalizeContentAssetQuery("  ai sop  "), "ai sop");
  assert.equal(normalizeContentAssetQuery(["  published  ", "draft"]), "published");
  assert.equal(normalizeContentAssetQuery("   "), undefined);
  assert.equal(normalizeContentAssetQuery(undefined), undefined);
});

test("summarizeContentAssetStats counts draft and published assets", () => {
  assert.deepEqual(summarizeContentAssetStats([]), {
    total: 0,
    private: 0,
    published: 0,
  });

  assert.deepEqual(
    summarizeContentAssetStats([
      { status: "PRIVATE" },
      { status: "PUBLISHED" },
      { status: "PUBLISHED" },
    ]),
    {
      total: 3,
      private: 1,
      published: 2,
    },
  );
});

test("getPublishedContentAssetHref only returns public hrefs for published assets", () => {
  assert.equal(
    getPublishedContentAssetHref({ slug: "ai-sop-flow", status: "PUBLISHED" }),
    "/knowledge/ai-sop-flow",
  );
  assert.equal(
    getPublishedContentAssetHref({ slug: "draft-note", status: "PRIVATE" }),
    null,
  );
});
