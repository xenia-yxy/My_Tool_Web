# Hotspot Radar Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Hotspot Radar so it fetches verifiable Bilibili hotspot data, clearly marks Douyin/Xiaohongshu fallback sources, and renders deterministic analysis.

**Architecture:** Add a server-side hotspot query module with source adapters and pure normalization/analysis helpers. Expose it through `GET /api/tools/hotspots`, then update the client component to fetch the API and render real-data, fallback, loading, error, and analysis states.

**Tech Stack:** Next.js App Router route handlers, TypeScript, React client component, SWR, Node test runner with `tsx --test`, built-in `fetch`.

---

## File Structure

- Create `tests/hotspot-radar-real-data.test.ts`: verifies query normalization, Bilibili payload normalization, fallback shape, and deterministic analysis.
- Create `src/server/hotspot-radar.ts`: server-only query orchestration, Bilibili adapter, fallback adapter, and pure analysis helpers.
- Create `src/app/api/tools/hotspots/route.ts`: authenticated API route returning `HotspotQueryResponse`.
- Modify `src/components/tools/hotspot-radar.tsx`: fetch API data with SWR and render real/fallback/analysis sections.
- Modify `package.json`: include the new test file in `pnpm test`.

## Task 1: Real Data Helper Tests

**Files:**

- Create: `tests/hotspot-radar-real-data.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFallbackSourceResult,
  buildHotspotAnalysis,
  normalizeBilibiliPopularItems,
  normalizeHotspotQuery,
} from "../src/server/hotspot-radar";

test("normalizeHotspotQuery falls back invalid params to all filters", () => {
  const query = normalizeHotspotQuery({
    platform: "unknown",
    topic: "bad-topic",
    query: "  AI 热点  ",
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
      title: "AI 工具爆火",
      owner: { name: "科技UP" },
      stat: { view: 12500, like: 830 },
    },
  ]);

  assert.deepEqual(items, [
    {
      author: "科技UP",
      heatLabel: "1.3万播放 · 830点赞",
      id: "bilibili-BV123",
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

test("buildHotspotAnalysis references real ranked items when present", () => {
  const analysis = buildHotspotAnalysis({
    query: "AI",
    platform: "bilibili",
    topic: "AI",
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
        sourceUrl: "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1",
        status: "real",
      },
    ],
  });

  assert.match(analysis.trendSummary, /#1 AI 工具爆火/);
  assert.equal(analysis.basis, "real-data");
  assert.equal(analysis.riskChecks.some((item) => item.includes("原始链接")), true);
});

test("buildHotspotAnalysis states fallback basis when no real items exist", () => {
  const source = buildFallbackSourceResult(
    "xiaohongshu",
    "2026-07-13T00:00:00.000Z",
    "小红书需要打开官方页面确认实时结果。",
  );
  const analysis = buildHotspotAnalysis({
    query: "穿搭",
    platform: "xiaohongshu",
    topic: "生活",
    sources: [source],
  });

  assert.equal(analysis.basis, "fallback-context");
  assert.match(analysis.trendSummary, /不是实时榜单结论/);
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm exec tsx --test tests/hotspot-radar-real-data.test.ts`

Expected: FAIL because `src/server/hotspot-radar.ts` does not exist.

## Task 2: Server Query Module

**Files:**

- Create: `src/server/hotspot-radar.ts`
- Test: `tests/hotspot-radar-real-data.test.ts`

- [ ] **Step 1: Implement server module**

Implement exported helpers used by the tests plus `queryHotspotSources(query, fetcher = fetch)`.

Key behavior:

- `normalizeHotspotQuery` accepts `platform`, `topic`, and `query`, normalizing invalid platform/topic values to `all`.
- `normalizeBilibiliPopularItems` maps public Bilibili popular payload items into ranked real items.
- `buildFallbackSourceResult` reuses `hotspotEntries` from `src/lib/hotspot-radar.ts` for official fallback links.
- `buildHotspotAnalysis` is deterministic and uses `basis: "real-data"` only when real items exist.
- `queryHotspotSources` fetches `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1` only when platform is `all` or `bilibili`; Douyin and Xiaohongshu return fallback results.

- [ ] **Step 2: Run GREEN**

Run: `pnpm exec tsx --test tests/hotspot-radar-real-data.test.ts`

Expected: PASS.

## Task 3: API Route

**Files:**

- Create: `src/app/api/tools/hotspots/route.ts`

- [ ] **Step 1: Add route handler**

Create a `GET` handler that calls `requireSignedInUser("/tools/hotspots")`, normalizes `request.nextUrl.searchParams`, calls `queryHotspotSources`, and returns JSON. Unexpected errors return HTTP 500.

- [ ] **Step 2: Run focused tests**

Run: `pnpm exec tsx --test tests/hotspot-radar-real-data.test.ts tests/hotspot-radar.test.ts`

Expected: PASS.

## Task 4: Client UI Upgrade

**Files:**

- Modify: `src/components/tools/hotspot-radar.tsx`

- [ ] **Step 1: Fetch API data**

Use SWR to fetch `/api/tools/hotspots?platform=...&topic=...&query=...`, keeping existing filters and keyword input.

- [ ] **Step 2: Render source status, real items, fallback cards, and analysis**

Render:

- `实时数据状态`
- `真实热点列表`
- `官方确认入口`
- `热点分析`
- Existing static entry cards as `入口库` so navigation remains available.

- [ ] **Step 3: Run lint on changed client/server files**

Run: `pnpm exec eslint src/server/hotspot-radar.ts src/app/api/tools/hotspots/route.ts src/components/tools/hotspot-radar.tsx tests/hotspot-radar-real-data.test.ts`

Expected: exit code 0.

## Task 5: Test Script and Verification

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Include new test**

Add `tests/hotspot-radar-real-data.test.ts` to the `test` script next to `tests/hotspot-radar.test.ts`.

- [ ] **Step 2: Run full tests**

Run: `pnpm test`

Expected: all tests pass, including hotspot real-data tests.

- [ ] **Step 3: Run live API smoke check**

With the local Next dev server running, call:

`Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/tools/hotspots?platform=bilibili&topic=AI&query=AI'`

Expected: authenticated sessions may return login protection if not signed in; server module has already been tested without live network dependency. If authenticated manually in browser, the page should show Bilibili real items and fallback-only status for restricted platforms.
