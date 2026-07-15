# Social Commerce Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/tools/social-commerce` workbench that generates Xiaohongshu and Xianyu cover directions, image prompts, titles, copy, tags or keywords, and publish checks.

**Architecture:** Add a pure TypeScript workflow library for all generation logic, then build a client workbench that calls the library and optionally submits image prompts to the existing `/api/tools/image-generation` endpoint. Keep routing and navigation consistent with the current tools area; do not add database tables or external platform integrations.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, Node test runner.

---

## File Structure

- Create `src/lib/social-commerce-workflow.ts`: Pure generation helpers and exported types. No React, no fetch, no browser APIs.
- Create `tests/social-commerce-workflow.test.ts`: Node test coverage for platform-specific generation behavior.
- Create `src/components/tools/social-commerce-workbench.tsx`: Client form, platform switcher, generated result cards, copy buttons, image submission.
- Create `src/app/tools/social-commerce/page.tsx`: Server page wrapper using the existing `WorkspacePageHeader`.
- Modify `src/components/tools/nav-config.ts`: Add the new tool to the existing ecommerce group.
- Modify `package.json`: Add `tests/social-commerce-workflow.test.ts` to the root `test` script.

Execution note: target tool-shell files are currently untracked in this workspace, so implementation should run in the current workspace and keep edits scoped to the files listed above.

---

### Task 1: Workflow Library Tests

**Files:**
- Create: `tests/social-commerce-workflow.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for Xiaohongshu and Xianyu generation**

Create `tests/social-commerce-workflow.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSocialCommerceOutput,
  getSocialCommercePresets,
} from "../src/lib/social-commerce-workflow";

test("xiaohongshu output generates cover, titles, caption, tags, and image-only prompt", () => {
  const output = buildSocialCommerceOutput({
    platform: "xiaohongshu",
    itemDescription: "夏季通勤白色短袖衬衫，适合小个子女生",
    audience: "小个子女生",
    scene: "夏季通勤",
    sellingPoint: "清爽、显高、好搭配",
    contentType: "种草笔记",
    hasReferenceImages: true,
  });

  assert.equal(output.platform, "xiaohongshu");
  assert.equal(output.aspectRatio, "portrait");
  assert.ok(output.coverDirections.length >= 4);
  assert.ok(output.titleCandidates.length >= 6);
  assert.match(output.titleCandidates[0].title, /小个子女生|夏季通勤|白色短袖衬衫/);
  assert.match(output.caption, /开头|体验|注意/);
  assert.ok(output.tags.includes("#小个子女生"));
  assert.match(output.imagePrompt, /不要生成任何文字/);
  assert.match(output.imagePrompt, /先分析上传参考图/);
});

test("xianyu output generates search titles, listing copy, keywords, scripts, and square prompt", () => {
  const output = buildSocialCommerceOutput({
    platform: "xianyu",
    itemDescription: "索尼 WH-1000XM5 黑色降噪耳机",
    audience: "通勤降噪用户",
    scene: "通勤和办公室",
    sellingPoint: "降噪强、续航正常、配件齐全",
    brand: "索尼",
    model: "WH-1000XM5",
    category: "降噪耳机",
    condition: "95新",
    flaws: "右耳罩有轻微使用痕迹",
    accessories: "包装盒、收纳盒、音频线、充电线",
    priceRange: "1500-1700",
    transferReason: "换新款",
    hasReferenceImages: true,
  });

  assert.equal(output.platform, "xianyu");
  assert.equal(output.aspectRatio, "square");
  assert.ok(output.titleCandidates.length >= 6);
  assert.match(output.titleCandidates[0].title, /索尼/);
  assert.match(output.titleCandidates[0].title, /WH-1000XM5/);
  assert.match(output.titleCandidates[0].title, /95新/);
  assert.match(output.caption, /成色|瑕疵|配件|转卖原因/);
  assert.ok(output.keywords.includes("索尼"));
  assert.ok(output.replyScripts.length >= 3);
  assert.match(output.imagePrompt, /真实商品首图/);
  assert.match(output.imagePrompt, /不要改造成色/);
});

test("xianyu publish checks warn when condition, flaws, or accessories are missing", () => {
  const output = buildSocialCommerceOutput({
    platform: "xianyu",
    itemDescription: "二手键盘",
  });

  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /成色/.test(item.message)));
  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /瑕疵/.test(item.message)));
  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /配件/.test(item.message)));
});

test("presets expose separate platform options", () => {
  const presets = getSocialCommercePresets();

  assert.ok(presets.xiaohongshu.contentTypes.includes("种草笔记"));
  assert.ok(presets.xianyu.conditions.includes("95新"));
  assert.ok(presets.xianyu.scenes.includes("真实商品首图"));
});
```

- [ ] **Step 2: Add the new test file to `package.json`**

Update the `test` script so it includes:

```json
"tests/social-commerce-workflow.test.ts"
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
pnpm exec tsx --test tests/social-commerce-workflow.test.ts
```

Expected: FAIL because `src/lib/social-commerce-workflow.ts` does not exist.

---

### Task 2: Workflow Library Implementation

**Files:**
- Create: `src/lib/social-commerce-workflow.ts`
- Test: `tests/social-commerce-workflow.test.ts`

- [ ] **Step 1: Implement exported types, presets, and output builder**

Create `src/lib/social-commerce-workflow.ts` with:

```ts
export type SocialCommercePlatform = "xiaohongshu" | "xianyu";

export type SocialCommerceInput = {
  platform: SocialCommercePlatform;
  itemDescription?: string;
  audience?: string;
  scene?: string;
  sellingPoint?: string;
  extraInstructions?: string;
  contentType?: string;
  brand?: string;
  model?: string;
  category?: string;
  condition?: string;
  flaws?: string;
  accessories?: string;
  priceRange?: string;
  transferReason?: string;
  hasReferenceImages?: boolean;
};

export type TitleCandidate = {
  type: string;
  title: string;
};

export type CoverDesignDirection = {
  name: string;
  description: string;
  overlayTitle: string;
};

export type PublishChecklistItem = {
  label: string;
  status: "pass" | "warning";
  message: string;
};

export type SocialCommerceOutput = {
  platform: SocialCommercePlatform;
  aspectRatio: "portrait" | "square";
  coverDirections: CoverDesignDirection[];
  titleCandidates: TitleCandidate[];
  caption: string;
  tags: string[];
  keywords: string[];
  replyScripts: string[];
  publishChecks: PublishChecklistItem[];
  imagePrompt: string;
};
```

Then implement:

```ts
export function getSocialCommercePresets() {
  return {
    xiaohongshu: {
      contentTypes: ["种草笔记", "干货清单", "对比测评", "穿搭/好物图文", "经验分享"],
      audiences: ["小个子女生", "通勤女生", "大学生", "职场新人", "租房党", "宝妈", "男生通勤"],
      scenes: ["夏季通勤", "宿舍好物", "办公室", "周末出门", "租房生活", "开学季"],
    },
    xianyu: {
      conditions: ["全新", "99新", "95新", "9成新", "8成新", "有明显使用痕迹"],
      scenes: ["真实商品首图", "配件合集", "细节特写", "瑕疵说明图", "使用场景图"],
      categories: ["数码", "服饰", "家电", "家具", "母婴", "美妆", "图书"],
    },
  };
}
```

Implement `buildSocialCommerceOutput(input)` by routing to platform-specific helpers. Use conservative fallbacks:

- Xiaohongshu fallback item: `实用好物`
- Xianyu fallback item: `二手商品`
- Xiaohongshu fallback audience: `目标用户`
- Xianyu fallback condition: empty string, so checks can warn

- [ ] **Step 2: Implement Xiaohongshu generation helpers**

Behavior:

- `aspectRatio` is `portrait`.
- At least four cover directions.
- At least six titles.
- Caption includes section labels `开头`、`体验`、`注意`、`互动`.
- Tags include `#${audience}` and platform-safe topic tags.
- Image prompt includes `不要生成任何文字`.
- If `hasReferenceImages` is true, image prompt includes `先分析上传参考图`.

- [ ] **Step 3: Implement Xianyu generation helpers**

Behavior:

- `aspectRatio` is `square`.
- At least four cover directions.
- At least six titles.
- First title includes brand, model, category, and condition when present.
- Caption includes section labels `成色`、`瑕疵`、`配件`、`转卖原因`、`发货`.
- Keywords include brand, model, category, condition, and scene when present.
- Reply scripts include at least three reusable buyer replies.
- Image prompt includes `真实商品首图` and `不要改造成色`.

- [ ] **Step 4: Implement publish checks**

Xiaohongshu checks:

- Warn if title/copy would rely on absolute words like `最好`、`第一`、`必买`.
- Warn if no audience was provided.
- Pass if tags exist.

Xianyu checks:

- Warn if `condition` is empty.
- Warn if `flaws` is empty.
- Warn if `accessories` is empty.
- Warn if `priceRange` is empty.
- Pass when each field is present.

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
pnpm exec tsx --test tests/social-commerce-workflow.test.ts
```

Expected: PASS.

---

### Task 3: Workbench UI and Page

**Files:**
- Create: `src/components/tools/social-commerce-workbench.tsx`
- Create: `src/app/tools/social-commerce/page.tsx`

- [ ] **Step 1: Create the page wrapper**

Create `src/app/tools/social-commerce/page.tsx`:

```tsx
import { SocialCommerceWorkbench } from "@/components/tools/social-commerce-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function SocialCommercePage() {
  return (
    <>
      <WorkspacePageHeader
        description="面向小红书笔记和闲鱼商品发布，生成封面方向、标题文案、图片提示词和发布检查。"
        title="小红书 / 闲鱼内容设计"
      />
      <SocialCommerceWorkbench />
    </>
  );
}
```

- [ ] **Step 2: Build the client workbench**

Create `src/components/tools/social-commerce-workbench.tsx` as a client component that:

- Imports `buildSocialCommerceOutput`, `getSocialCommercePresets`, and `SocialCommercePlatform`.
- Keeps form state for all fields in the spec.
- Uses a platform segmented control with labels `小红书` and `闲鱼`.
- Shows Xiaohongshu-only content type buttons when platform is `xiaohongshu`.
- Shows Xianyu-only fields for brand, model, category, condition, flaws, accessories, price range, and transfer reason.
- Calls `buildSocialCommerceOutput` on form changes with `useMemo`.
- Renders result cards for cover directions, title candidates, caption, tags/keywords, reply scripts, publish checks, and image prompt.
- Provides copy buttons using `navigator.clipboard.writeText`.
- Provides a `生成封面底图` button that posts to `/api/tools/image-generation` with:

```ts
{
  mode: "social-commerce",
  sourceTool: "social-commerce",
  description: output.imagePrompt,
  purpose: output.titleCandidates[0]?.title ?? "社交电商封面",
  style: platform === "xiaohongshu" ? "小红书封面" : "闲鱼首图",
  caption: output.caption,
  tags: output.tags.join(" "),
  productKeywords: output.keywords.join("，"),
  aspectRatio: output.aspectRatio,
  quality: "low",
  batchCount: 1
}
```

Expected UI shape:

- Left column width around `380px`.
- Right column flexible.
- Buttons use lucide icons such as `Copy`, `ImageIcon`, `Loader2`, `CheckCircle2`, `AlertTriangle`.
- No nested cards.
- No marketing hero.

- [ ] **Step 3: Run TypeScript/lint feedback for the new UI**

Run:

```bash
pnpm lint
```

Expected: no new lint errors from the social commerce files. If unrelated existing lint errors appear, record them separately.

---

### Task 4: Navigation Entry

**Files:**
- Modify: `src/components/tools/nav-config.ts`

- [ ] **Step 1: Add a navigation icon import**

Add `Store` or another existing lucide icon to the import list:

```ts
  Store,
```

- [ ] **Step 2: Add the ecommerce nav item**

Inside the `ecommerce` group, after `snack-grocery`, add:

```ts
{
  id: "social-commerce",
  label: "小红书/闲鱼",
  href: "/tools/social-commerce",
  icon: Store,
},
```

- [ ] **Step 3: Verify navigation type checks**

Run:

```bash
pnpm lint
```

Expected: no new lint errors from `nav-config.ts`.

---

### Task 5: Full Verification

**Files:**
- Test: `tests/social-commerce-workflow.test.ts`
- Verify: `package.json`, `src/lib/social-commerce-workflow.ts`, `src/components/tools/social-commerce-workbench.tsx`, `src/app/tools/social-commerce/page.tsx`, `src/components/tools/nav-config.ts`

- [ ] **Step 1: Run focused workflow tests**

Run:

```bash
pnpm exec tsx --test tests/social-commerce-workflow.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all configured tests pass, including `tests/social-commerce-workflow.test.ts`.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected: no new lint errors from changed files.

- [ ] **Step 4: Run production build if lint and tests pass**

Run:

```bash
pnpm build
```

Expected: build succeeds. If build fails because of unrelated pre-existing workspace changes, capture the exact failure and changed-file status.

- [ ] **Step 5: Review final diff**

Run:

```bash
git diff -- src/lib/social-commerce-workflow.ts tests/social-commerce-workflow.test.ts src/components/tools/social-commerce-workbench.tsx src/app/tools/social-commerce/page.tsx src/components/tools/nav-config.ts package.json docs/superpowers/plans/2026-07-13-social-commerce.md
```

Expected: diff only contains the planned feature and plan document.

