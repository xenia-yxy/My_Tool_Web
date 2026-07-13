# Series Video Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/tools/series-video-analyzer` workbench that analyzes serialized short-video performance from mixed link and manual metric input.

**Architecture:** Put deterministic analysis in a pure TypeScript module, then consume it from a client-side tool component. Add a protected Next.js route and a tools navigation entry, matching the existing `/tools/*` pattern.

**Tech Stack:** Next.js App Router, React client component, TypeScript, lucide-react icons, existing UI components, Node `tsx --test`.

---

## File Structure

- Create `src/lib/series-video-analyzer.ts`: pure types, platform detection, metric normalization, derived metric calculation, analysis generation, report generation.
- Create `tests/series-video-analyzer.test.ts`: Node test coverage for the pure analysis behavior.
- Create `src/components/tools/series-video-analyzer.tsx`: client-side form, analysis cards, copy report button.
- Create `src/app/tools/series-video-analyzer/page.tsx`: protected route and page header.
- Modify `src/components/tools/nav-config.ts`: add the tool to the "创作" nav group.

## Task 1: Analysis Library

**Files:**
- Create: `tests/series-video-analyzer.test.ts`
- Create: `src/lib/series-video-analyzer.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/series-video-analyzer.test.ts` with tests that import:

```ts
import {
  analyzeSeriesVideo,
  buildSeriesVideoReport,
  detectVideoPlatform,
  normalizeSeriesVideoMetrics,
} from "../src/lib/series-video-analyzer";
```

Required tests:

```ts
test("detectVideoPlatform recognizes common short video links", () => {
  assert.equal(detectVideoPlatform("https://v.douyin.com/abc"), "douyin");
  assert.equal(detectVideoPlatform("https://www.xiaohongshu.com/explore/1"), "xiaohongshu");
  assert.equal(detectVideoPlatform("https://b23.tv/abc"), "bilibili");
  assert.equal(detectVideoPlatform("https://example.com/video"), "other");
});

test("normalizeSeriesVideoMetrics clamps invalid values", () => {
  const metrics = normalizeSeriesVideoMetrics({
    views: -10,
    likes: 12,
    comments: -1,
    favorites: 4,
    shares: 2,
    followersGained: -5,
    completionRate: 130,
    averageWatchSeconds: -9,
  });

  assert.equal(metrics.views, 0);
  assert.equal(metrics.comments, 0);
  assert.equal(metrics.followersGained, 0);
  assert.equal(metrics.completionRate, 100);
  assert.equal(metrics.averageWatchSeconds, 0);
});

test("analyzeSeriesVideo diagnoses high views with weak follower conversion", () => {
  const analysis = analyzeSeriesVideo({
    title: "挑战舞蹈博主第 1 天",
    niche: "舞蹈博主",
    link: "https://v.douyin.com/abc",
    metrics: {
      views: 10000,
      likes: 500,
      comments: 30,
      favorites: 20,
      shares: 10,
      followersGained: 1,
      completionRate: 55,
      averageWatchSeconds: 18,
    },
  });

  assert.equal(analysis.platform, "douyin");
  assert.equal(analysis.primaryDiagnosis.includes("人设"), true);
  assert.equal(analysis.nextActions.some((item) => item.includes("下一条")), true);
});

test("analyzeSeriesVideo diagnoses low views with strong favorites", () => {
  const analysis = analyzeSeriesVideo({
    title: "普通人做资料号真实复盘",
    niche: "资料号",
    metrics: {
      views: 300,
      likes: 15,
      comments: 2,
      favorites: 30,
      shares: 4,
      followersGained: 3,
      completionRate: 62,
      averageWatchSeconds: 22,
    },
  });

  assert.equal(analysis.primaryDiagnosis.includes("标题封面"), true);
});

test("analyzeSeriesVideo returns a useful baseline when only a link is provided", () => {
  const analysis = analyzeSeriesVideo({
    link: "https://www.bilibili.com/video/BV123",
  });

  assert.equal(analysis.platform, "bilibili");
  assert.equal(analysis.primaryDiagnosis.includes("补充"), true);
  assert.equal(analysis.scoreLabel, "待补充数据");
});

test("buildSeriesVideoReport includes summary and next actions", () => {
  const analysis = analyzeSeriesVideo({
    title: "挑战 100 个自媒体赛道第 1 期",
    niche: "舞蹈博主",
    metrics: {
      views: 1000,
      likes: 80,
      comments: 25,
      favorites: 6,
      shares: 3,
      followersGained: 12,
      completionRate: 72,
      averageWatchSeconds: 21,
    },
  });

  const report = buildSeriesVideoReport(analysis);

  assert.equal(report.includes("系列视频分析报告"), true);
  assert.equal(report.includes("下一步建议"), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/series-video-analyzer.test.ts`

Expected: FAIL because `src/lib/series-video-analyzer.ts` does not exist.

- [ ] **Step 3: Implement the library**

Create `src/lib/series-video-analyzer.ts` with exported types and these functions:

```ts
export function detectVideoPlatform(link?: string): SeriesVideoPlatform
export function normalizeSeriesVideoMetrics(metrics?: Partial<SeriesVideoMetrics>): SeriesVideoMetrics
export function analyzeSeriesVideo(input: SeriesVideoInput): SeriesVideoAnalysis
export function buildSeriesVideoReport(analysis: SeriesVideoAnalysis): string
```

Behavior:

- Detect Douyin, Xiaohongshu, Bilibili, or `other`.
- Clamp metrics to non-negative values and completion rate to 0-100.
- Calculate like, comment, favorite, share, and follower rates from views.
- If no useful metrics exist, return `scoreLabel: "待补充数据"`.
- Choose a primary diagnosis from the rules in the design document.
- Include practical next actions and title suggestions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/series-video-analyzer.test.ts`

Expected: PASS.

## Task 2: Client Workbench

**Files:**
- Create: `src/components/tools/series-video-analyzer.tsx`

- [ ] **Step 1: Create the client component**

Build a `"use client"` component that:

- Keeps form state for link, platform, niche, episode, title, publish date, duration, summary, and all metrics.
- Calls `analyzeSeriesVideo` from `useMemo`.
- Shows input sections, metric inputs, diagnosis cards, next action list, title suggestions, and copy report button.
- Uses existing `Card`, `Badge`, `Button` style conventions from nearby tool components.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: no new type errors from the component.

## Task 3: Route and Navigation

**Files:**
- Create: `src/app/tools/series-video-analyzer/page.tsx`
- Modify: `src/components/tools/nav-config.ts`

- [ ] **Step 1: Add route**

Create a protected page matching nearby tools:

```tsx
import { SeriesVideoAnalyzer } from "@/components/tools/series-video-analyzer";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function SeriesVideoAnalyzerPage() {
  await requireSignedInUser("/tools/series-video-analyzer");

  return (
    <>
      <WorkspacePageHeader
        description="记录系列视频链接和关键数据，诊断标题、开头、人设、赛道价值，并生成下一条建议。"
        title="系列视频分析"
      />
      <SeriesVideoAnalyzer />
    </>
  );
}
```

- [ ] **Step 2: Add navigation entry**

In `src/components/tools/nav-config.ts`, import `LineChart` from `lucide-react` and add this item under the "创作" group:

```ts
{
  id: "series-video-analyzer",
  label: "系列视频分析",
  href: "/tools/series-video-analyzer",
  icon: LineChart,
}
```

- [ ] **Step 3: Run navigation tests**

Run: `npx tsx --test tests/tool-navigation.test.ts`

Expected: PASS.

## Task 4: Final Verification

**Files:**
- Verify changed files only.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npx tsx --test tests/series-video-analyzer.test.ts tests/tool-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: PASS or only pre-existing unrelated errors. If errors are related to this feature, fix them.

- [ ] **Step 3: Review git diff**

Run: `git diff -- src/lib/series-video-analyzer.ts tests/series-video-analyzer.test.ts src/components/tools/series-video-analyzer.tsx src/app/tools/series-video-analyzer/page.tsx src/components/tools/nav-config.ts`

Expected: changes are limited to the planned files.

## Self-Review

- Spec coverage: platform recognition, mixed input, local deterministic analysis, copyable report, route, navigation, and tests are covered.
- Placeholder scan: no implementation placeholders remain in the plan.
- Type consistency: function and type names are stable across tests, implementation, and component.
