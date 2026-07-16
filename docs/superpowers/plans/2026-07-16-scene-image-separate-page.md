# Scene Image Separate Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate scene-image creation from strict-fidelity menswear generation into clear, independently reachable workflows.

**Architecture:** The strict-fidelity route keeps product, model, and role-level fidelity controls only. A new scene-image route owns scene upload, scene mode, output ratio, and scene-specific prompt composition, while reusing the existing material upload, project, image-generation, gallery, and history APIs.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, existing menswear project and image generation APIs.

---

### Task 1: Lock the new navigation contract

**Files:**
- Modify: `tests/menswear-studio-ui.test.ts`
- Modify: `tests/tool-navigation.test.ts`
- Modify: `src/lib/tool-navigation.ts`
- Modify: `src/components/tools/menswear/menswear-workspace.tsx`

- [ ] **Step 1: Write failing tests**

```ts
assert.match(workspaceSource, /\/tools\/menswear\/scene-image/);
assert.match(navSource, /场景图生成/);
assert.doesNotMatch(strictGeneratorSource, /SceneReferenceUploader/);
```

- [ ] **Step 2: Run the two tests and confirm they fail because the route and isolated navigation are absent.**

```powershell
pnpm exec tsx --test tests/menswear-studio-ui.test.ts tests/tool-navigation.test.ts
```

- [ ] **Step 3: Add the scene-image navigation entry and remove scene wording from the strict-fidelity entry.**

- [ ] **Step 4: Run the two tests and confirm they pass.**

### Task 2: Create the standalone scene-image workflow

**Files:**
- Create: `src/app/tools/menswear/scene-image/page.tsx`
- Create: `src/components/tools/menswear/scene-image-generator.tsx`
- Modify: `src/components/tools/menswear/strict-fidelity-generator.tsx`
- Modify: `src/lib/menswear-studio.ts`
- Test: `tests/menswear-studio.test.ts`
- Test: `tests/menswear-studio-ui.test.ts`

- [ ] **Step 1: Write failing tests for a scene-specific prompt and a signed-in standalone route.**

```ts
assert.match(scenePageSource, /requireSignedInUser\("\/tools\/menswear\/scene-image"\)/);
assert.match(buildSceneImagePrompt({ sceneMode: "background_only", description: "夏日街景" }), /不得出现人物/);
assert.doesNotMatch(strictGeneratorSource, /sceneMode/);
```

- [ ] **Step 2: Run the focused tests and confirm they fail because the standalone page and prompt builder are absent.**

- [ ] **Step 3: Implement `SceneImageGenerator` with modes `try_on`, `product_replace`, and `background_only`.**

It must upload one to six scene images through `SceneReferenceUploader`, add a locked product reference only for the first two modes, expose ratio and scene instructions, show an editable prompt dialog, and save generated images through the existing menswear project generation endpoint.

- [ ] **Step 4: Remove scene mode, scene upload, scene ratio, and scene instruction state from `StrictFidelityGenerator`.**

- [ ] **Step 5: Run the focused tests and confirm they pass.**

### Task 3: Verify the product boundary

**Files:**
- Modify: `tests/menswear-studio-server.test.ts`
- Modify: `tests/menswear-studio-ui.test.ts`
- Test: `tests/menswear-studio.test.ts`

- [ ] **Step 1: Add tests that generated scene images retain standard title, tags, caption, and gallery history fields.**
- [ ] **Step 2: Run the complete menswear and navigation test set.**
- [ ] **Step 3: Run ESLint for the changed route and components, then `pnpm build`.**
- [ ] **Step 4: Commit the feature, merge it to `main`, rebuild the offline Docker image, and deploy only `my-web`.**
