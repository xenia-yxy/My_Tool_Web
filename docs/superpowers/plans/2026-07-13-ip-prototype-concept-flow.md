# IP Prototype Concept Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the IP prototype tool from a loose idea prompt into a structured IP concept flow with positioning, audience, personality, visual anchors, avoid rules, and scenario output.

**Architecture:** Keep the feature inside the existing IP prototype surface. Add optional concept fields to shared prompt builders and server prompt builders, pass those fields through the existing multipart generation route, and update the client form without changing the database schema.

**Tech Stack:** Next.js App Router, TypeScript, React client component, Node test runner with `tsx --test`.

---

### Task 1: Prompt Builder Supports Concept Fields

**Files:**
- Modify: `src/lib/image-generation-workflow.ts`
- Modify: `src/server/ip-prototype.ts`
- Test: `tests/ip-prototype.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions to `buildIpPrototypePrompt includes draft, style, and IP direction`:

```ts
const prompt = buildIpPrototypePrompt({
  projectName: "Xenia 个人形象",
  ipType: "person",
  outputGoal: "refine",
  prompt: "保持人物松弛但有攻击性",
  styleText: "白底、冷静、带一点手作粗糙感",
  conceptStatement: "把混乱想法整理成可发布资产的 AI 实践者分身",
  targetAudience: "AI 实践者、内容创作者、潜在企业 SOP 客户",
  personality: "冷静、可信、直接、耐心",
  visualAnchors: "便签、节点、小屏幕、浅色工作台",
  avoidDirections: "不要幼态、暗黑赛博、复杂机甲",
  scenario: "首页首屏和工具台引导",
  hasDraftImage: true,
  hasStyleImage: true,
});

assert.match(prompt, /立意：把混乱想法整理成可发布资产的 AI 实践者分身/);
assert.match(prompt, /目标用户：AI 实践者、内容创作者、潜在企业 SOP 客户/);
assert.match(prompt, /性格：冷静、可信、直接、耐心/);
assert.match(prompt, /视觉锚点：便签、节点、小屏幕、浅色工作台/);
assert.match(prompt, /避免方向：不要幼态、暗黑赛博、复杂机甲/);
assert.match(prompt, /应用场景：首页首屏和工具台引导/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test tests/ip-prototype.test.ts`

Expected: FAIL because the prompt does not include `立意` and the other new concept fields.

- [ ] **Step 3: Add optional concept fields**

Add optional concept fields to the prompt input types and include them in the generated prompt:

```ts
conceptStatement?: string | null;
targetAudience?: string | null;
personality?: string | null;
visualAnchors?: string | null;
avoidDirections?: string | null;
scenario?: string | null;
```

The prompt should include a new `IP 立意定义：` section before `用户当前想法：`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test tests/ip-prototype.test.ts`

Expected: PASS.

### Task 2: Route Passes Concept Fields

**Files:**
- Modify: `src/app/api/tools/ip-prototypes/[id]/generate/route.ts`
- Modify: `src/server/ip-prototype.ts`

- [ ] **Step 1: Extend generation input**

Add the same optional concept fields to `IpPrototypeGenerationInput` and normalized output.

- [ ] **Step 2: Pass form fields through route**

In the generate route, pass these form fields into `generationInput`:

```ts
conceptStatement: getFormText(formData, "conceptStatement"),
targetAudience: getFormText(formData, "targetAudience"),
personality: getFormText(formData, "personality"),
visualAnchors: getFormText(formData, "visualAnchors"),
avoidDirections: getFormText(formData, "avoidDirections"),
scenario: getFormText(formData, "scenario"),
```

- [ ] **Step 3: Keep storage unchanged**

Do not add database columns. The complete final prompt already gets stored in `IpPrototypeGeneration.prompt` and `AiImageAsset.prompt`.

### Task 3: Client Form Adds Concept Flow

**Files:**
- Modify: `src/components/tools/ip-prototype-workbench.tsx`

- [ ] **Step 1: Add client state**

Add state for:

```ts
conceptStatement
targetAudience
personality
visualAnchors
avoidDirections
scenario
```

- [ ] **Step 2: Include fields in prompt preview**

Pass those values to `buildIpPromptPreview`.

- [ ] **Step 3: Include fields in multipart form**

Add the same values to `formData` before generation.

- [ ] **Step 4: Add visible form section**

Add a new section titled `立意定义` before image upload. Include fields for one-line concept, target audience, personality, visual anchors, avoid directions, and application scenario.

- [ ] **Step 5: Update page helper text**

Update the four-step explanation so the flow reads as: define IP intent, provide references, describe current image goal, confirm and generate.

### Task 4: Verification

**Files:**
- Verify only, no planned edits.

- [ ] **Step 1: Run focused tests**

Run: `pnpm exec tsx --test tests/ip-prototype.test.ts tests/image-generation-workflow.test.ts`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: PASS or report pre-existing unrelated failures separately.

- [ ] **Step 3: Review diff**

Run: `git diff -- src/lib/image-generation-workflow.ts src/server/ip-prototype.ts src/app/api/tools/ip-prototypes/[id]/generate/route.ts src/components/tools/ip-prototype-workbench.tsx tests/ip-prototype.test.ts docs/superpowers/plans/2026-07-13-ip-prototype-concept-flow.md`

Expected: diff only contains the planned IP concept flow changes.

