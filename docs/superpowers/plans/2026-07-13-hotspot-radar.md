# Hotspot Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/tools/hotspots` workspace page for broad Douyin, Xiaohongshu, and Bilibili hotspot discovery.

**Architecture:** Keep the first version static and deterministic: a pure TypeScript data/helper module powers a client-side filter UI. The page reuses the existing tools workspace shell and opens external live sources in new tabs instead of scraping platform data.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS, lucide-react, Node test runner with `tsx --test`.

---

## File Structure

- Create `tests/hotspot-radar.test.ts`: verifies platform/topic/keyword filtering, stats, and generated search links.
- Create `src/lib/hotspot-radar.ts`: owns hotspot types, static entries, labels, helper functions, and search shortcut generation.
- Create `src/components/tools/hotspot-radar.tsx`: renders filters, search input, shortcut links, stats, empty state, and cards.
- Create `src/app/tools/hotspots/page.tsx`: authenticated workspace route with `WorkspacePageHeader`.
- Modify `src/components/tools/nav-config.ts`: adds `热点查询` to the `资源` group with a lucide icon.

## Task 1: Hotspot Helper Tests

**Files:**

- Create: `tests/hotspot-radar.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHotspotSearchShortcuts,
  filterHotspotEntries,
  getHotspotStats,
  hotspotEntries,
} from "../src/lib/hotspot-radar";

test("getHotspotStats counts platforms and entries", () => {
  const stats = getHotspotStats();

  assert.equal(stats.platforms, 3);
  assert.equal(stats.entries >= 12, true);
  assert.equal(stats.linkedEntries, stats.entries);
});

test("filterHotspotEntries filters by platform and topic", () => {
  const entries = filterHotspotEntries({
    platform: "douyin",
    topic: "电商",
  });

  assert.equal(entries.length >= 1, true);
  assert.equal(entries.every((entry) => entry.platform === "douyin"), true);
  assert.equal(entries.every((entry) => entry.topic === "电商"), true);
});

test("filterHotspotEntries searches title description platform and tags", () => {
  const entries = filterHotspotEntries({
    query: "评论区洞察",
  });

  assert.equal(entries.length >= 1, true);
  assert.equal(
    entries.some((entry) => entry.tags.includes("评论区洞察")),
    true,
  );
});

test("buildHotspotSearchShortcuts encodes Chinese and English keywords", () => {
  const shortcuts = buildHotspotSearchShortcuts("AI 穿搭");

  assert.equal(shortcuts.length, 3);
  assert.equal(
    shortcuts.every((shortcut) => shortcut.href.includes("AI%20%E7%A9%BF%E6%90%AD")),
    true,
  );
});

test("buildHotspotSearchShortcuts returns empty list for blank keyword", () => {
  assert.deepEqual(buildHotspotSearchShortcuts("   "), []);
});

test("hotspotEntries cover Douyin Xiaohongshu and Bilibili", () => {
  const platforms = new Set(hotspotEntries.map((entry) => entry.platform));

  assert.deepEqual([...platforms].sort(), [
    "bilibili",
    "douyin",
    "xiaohongshu",
  ]);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts`

Expected: FAIL because `src/lib/hotspot-radar.ts` does not exist.

## Task 2: Hotspot Data Module

**Files:**

- Create: `src/lib/hotspot-radar.ts`
- Test: `tests/hotspot-radar.test.ts`

- [ ] **Step 1: Implement the data module**

Create labels, entries, and pure helpers exactly where the tests import them. Include official or stable external links for Douyin hot list/search, Xiaohongshu search, Bilibili popular/search, and relevant operator research entries.

- [ ] **Step 2: Run tests to verify GREEN**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts`

Expected: PASS for all tests in `tests/hotspot-radar.test.ts`.

## Task 3: Hotspot Page UI

**Files:**

- Create: `src/components/tools/hotspot-radar.tsx`
- Create: `src/app/tools/hotspots/page.tsx`

- [ ] **Step 1: Add client component**

Use `useState` and `useMemo` to render platform/topic filter buttons, keyword input, generated shortcuts, stats text, entry cards, and empty state. Import all data from `src/lib/hotspot-radar.ts`.

- [ ] **Step 2: Add route page**

Create `/tools/hotspots` with `dynamic = "force-dynamic"`, `requireSignedInUser("/tools/hotspots")`, `WorkspacePageHeader`, and `HotspotRadar`.

- [ ] **Step 3: Run TypeScript-aware checks**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts`

Expected: PASS. This verifies data imports still compile after the UI additions.

## Task 4: Workspace Navigation

**Files:**

- Modify: `src/components/tools/nav-config.ts`

- [ ] **Step 1: Add navigation item**

Import a suitable lucide icon such as `Flame` and add:

```ts
{
  id: "hotspots",
  label: "热点查询",
  href: "/tools/hotspots",
  icon: Flame,
}
```

under the existing `资源` group.

- [ ] **Step 2: Verify active route behavior**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts tests/tool-directory.test.ts`

Expected: PASS for hotspot helper tests and existing tool directory tests.

## Task 5: Final Verification

**Files:**

- All changed files.

- [ ] **Step 1: Run focused tests**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts tests/tool-directory.test.ts`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm exec eslint src/lib/hotspot-radar.ts src/components/tools/hotspot-radar.tsx src/app/tools/hotspots/page.tsx src/components/tools/nav-config.ts tests/hotspot-radar.test.ts`

Expected: exit code 0.

- [ ] **Step 3: Inspect git diff**

Run: `git diff -- src/lib/hotspot-radar.ts src/components/tools/hotspot-radar.tsx src/app/tools/hotspots/page.tsx src/components/tools/nav-config.ts tests/hotspot-radar.test.ts docs/superpowers/plans/2026-07-13-hotspot-radar.md`

Expected: only hotspot radar implementation and plan changes are present.
