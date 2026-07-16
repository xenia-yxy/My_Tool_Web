import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterWebsiteBookmarks,
  normalizeWebsiteBookmarkInput,
  normalizeWebsiteSummaryUrls,
  summarizeWebsiteBookmarkStats,
} from "../src/server/website-bookmarks";

test("normalizeWebsiteBookmarkInput prepares a bookmark", () => {
  assert.deepEqual(
    normalizeWebsiteBookmarkInput({
      title: "  蝉妈妈  ",
      url: " https://www.chanmama.com/ ",
      category: "douyin",
      subcategory: "数据分析",
      summary: " 抖音数据分析工具 ",
      tags: [" 抖音 ", "数据", "抖音", ""],
      note: " 重点关注竞品 ",
    }),
    {
      title: "蝉妈妈",
      url: "https://www.chanmama.com/",
      category: "douyin",
      subcategory: "数据分析",
      summary: "抖音数据分析工具",
      tags: ["抖音", "数据"],
      note: "重点关注竞品",
    },
  );
});

test("normalizeWebsiteBookmarkInput rejects unsafe or incomplete input", () => {
  assert.throws(
    () =>
      normalizeWebsiteBookmarkInput({
        title: "",
        url: "https://www.example.com",
        category: "ai",
      }),
    /网站名称不能为空/,
  );
  assert.throws(
    () =>
      normalizeWebsiteBookmarkInput({
        title: "bad",
        url: "javascript:alert(1)",
        category: "ai",
      }),
    /只支持 http 或 https/,
  );
});

test("normalizeWebsiteSummaryUrls parses multiline URL batches", () => {
  assert.deepEqual(
    normalizeWebsiteSummaryUrls(
      " https://example.com/a \n\nhttps://example.com/b\nhttps://example.com/a ",
    ),
    ["https://example.com/a", "https://example.com/b"],
  );

  assert.throws(
    () => normalizeWebsiteSummaryUrls("https://example.com/1\nhttps://example.com/2\nhttps://example.com/3\nhttps://example.com/4\nhttps://example.com/5\nhttps://example.com/6"),
    /一次最多总结 5 个网站/,
  );
});

test("filterWebsiteBookmarks filters by category and keyword", () => {
  const bookmarks = [
    {
      id: "1",
      title: "剪映",
      url: "https://www.capcut.cn/",
      category: "douyin",
      subcategory: "官方工具",
      summary: "视频剪辑工具",
      tags: ["视频"],
      note: null,
      source: "preset",
    },
    {
      id: "2",
      title: "Claude",
      url: "https://claude.ai/",
      category: "ai",
      subcategory: "文字写作",
      summary: "AI 写作和问答",
      tags: ["AI", "写作"],
      note: null,
      source: "preset",
    },
  ];

  assert.deepEqual(
    filterWebsiteBookmarks(bookmarks, { category: "ai", query: "写作" }).map(
      (bookmark) => bookmark.id,
    ),
    ["2"],
  );
  assert.deepEqual(
    filterWebsiteBookmarks(bookmarks, { category: "all", query: "剪辑" }).map(
      (bookmark) => bookmark.id,
    ),
    ["1"],
  );
});

test("summarizeWebsiteBookmarkStats counts category totals", () => {
  assert.deepEqual(
    summarizeWebsiteBookmarkStats([
      { category: "douyin" },
      { category: "douyin" },
      { category: "ai" },
    ]),
    {
      total: 3,
      douyin: 2,
      xiaohongshu: 0,
      ai: 1,
      crossPlatform: 0,
      custom: 0,
    },
  );
});
