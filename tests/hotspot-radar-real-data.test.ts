import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildUnavailableSourceResult,
  buildFallbackSourceResult,
  buildHotspotAnalysis,
  normalizeBilibiliPopularItems,
  normalizeHotspotQuery,
} from "../src/server/hotspot-radar";

test("normalizeHotspotQuery falls back invalid params to all filters", () => {
  const query = normalizeHotspotQuery({
    platform: "unknown",
    query: "  AI 热点  ",
    topic: "bad-topic",
  });

  assert.deepEqual(query, {
    platform: "all",
    query: "AI 热点",
    topic: "all",
  });
});

test("normalizeBilibiliPopularItems creates ranked real hotspot items", () => {
  const items = normalizeBilibiliPopularItems([
    {
      bvid: "BV123",
      owner: { name: "科技UP" },
      stat: { like: 830, view: 12500 },
      title: "AI 工具爆火",
    },
  ]);

  assert.deepEqual(items, [
    {
      author: "科技UP",
      heatLabel: "1.3万播放 · 830点赞",
      id: "bilibili-BV123",
      kind: "real",
      rank: 1,
      title: "AI 工具爆火",
      topic: "AI",
      url: "https://www.bilibili.com/video/BV123",
    },
  ]);
});

test("buildFallbackSourceResult marks unavailable platforms as official entry", () => {
  const source = buildFallbackSourceResult(
    "douyin",
    "2026-07-13T00:00:00.000Z",
    "平台页面需要用户在官方页面确认。",
  );

  assert.equal(source.platform, "douyin");
  assert.equal(source.status, "fallback");
  assert.equal(source.items.length >= 1, true);
  assert.equal(source.items[0].kind, "fallback");
  assert.match(source.message, /官方页面/);
});

test("buildUnavailableSourceResult never turns a failed request into hotspot data", () => {
  const source = buildUnavailableSourceResult(
    "douyin",
    "2026-07-14T00:00:00.000Z",
    "抖音未提供可稳定访问的公开热榜接口。",
  );

  assert.equal(source.status, "unavailable");
  assert.equal(source.items.length, 0);
  assert.match(source.message, /公开热榜接口/);
});

test("buildHotspotAnalysis references real ranked items when present", () => {
  const analysis = buildHotspotAnalysis({
    platform: "bilibili",
    query: "AI",
    sources: [
      {
        fetchedAt: "2026-07-13T00:00:00.000Z",
        items: [
          {
            author: "科技UP",
            heatLabel: "1.3万播放",
            id: "bilibili-BV123",
            kind: "real",
            rank: 1,
            title: "AI 工具爆火",
            topic: "AI",
            url: "https://www.bilibili.com/video/BV123",
          },
        ],
        message: "已获取 B站热门真实数据。",
        platform: "bilibili",
        sourceName: "B站热门",
        sourceUrl:
          "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1",
        status: "real",
      },
    ],
    topic: "AI",
  });

  assert.match(analysis.trendSummary, /#1 AI 工具爆火/);
  assert.equal(analysis.basis, "real-data");
  assert.equal(
    analysis.riskChecks.some((item) => item.includes("原始链接")),
    true,
  );
});

test("buildHotspotAnalysis states fallback basis when no real items exist", () => {
  const source = buildFallbackSourceResult(
    "xiaohongshu",
    "2026-07-13T00:00:00.000Z",
    "小红书需要打开官方页面确认实时结果。",
  );
  const analysis = buildHotspotAnalysis({
    platform: "xiaohongshu",
    query: "穿搭",
    sources: [source],
    topic: "生活",
  });

  assert.equal(analysis.basis, "fallback-context");
  assert.match(analysis.trendSummary, /不是实时榜单结论/);
});
