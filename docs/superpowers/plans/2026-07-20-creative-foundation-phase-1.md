# Creative Foundation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make image storage, material/model selection, image jobs, prompt persistence, and feature histories reliable before the workflow UI is restructured.

**Architecture:** Keep the existing Next.js and Prisma model boundaries, but make the server database the source of truth for jobs and sessions. Add a storage path that uploads buffers directly to OSS when enabled, retains local fallback only when OSS is disabled, and makes runtime-file migration a separate guarded operation. Material categories are normalized centrally and model availability derives from the same materials API.

**Tech Stack:** Next.js 16, TypeScript, Prisma/PostgreSQL, Node test runner, Docker Compose, Aliyun OSS REST API.

---

### Task 1: Make image storage direct-to-OSS and testable

**Files:**
- Modify: `src/server/oss-storage.ts`
- Modify: `src/server/ai-image-tools.ts`
- Modify: `tests/oss-storage.test.ts`

- [ ] **Step 1: Write failing tests for direct object naming and local fallback selection**

```ts
test("builds separate OSS keys for generated and reference images", () => {
  assert.equal(buildOssObjectKey("xenia", "generated", "image.png"), "xenia/generated/image.png");
  assert.equal(buildOssObjectKey("xenia", "references", "face.jpg"), "xenia/references/face.jpg");
});

test("keeps a runtime URL only when OSS credentials are unavailable", () => {
  assert.equal(shouldUseRuntimeStorage({}), true);
  assert.equal(shouldUseRuntimeStorage(ossEnv), false);
});
```

- [ ] **Step 2: Run the OSS test file and verify the new tests fail**

Run: `pnpm exec tsx --test tests/oss-storage.test.ts`

Expected: failure because `buildOssObjectKey` and `shouldUseRuntimeStorage` do not exist.

- [ ] **Step 3: Add storage helpers and use them from generated/reference image saves**

```ts
export function buildOssObjectKey(prefix: string, folder: string, fileName: string) {
  return normalizeOssObjectKey(prefix, `${folder}/${fileName}`);
}

export function shouldUseRuntimeStorage(env: EnvSource = process.env) {
  return !isAliyunOssEnabled(env);
}
```

`saveGeneratedImageToRuntime` and `saveReferenceImageToRuntime` must upload the in-memory buffer directly when OSS is enabled; they may write to `.runtime/uploads/ai-images` only in explicit local fallback mode. Generated and reference objects must use different OSS subdirectories.

- [ ] **Step 4: Run storage tests**

Run: `pnpm exec tsx --test tests/oss-storage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/oss-storage.ts src/server/ai-image-tools.ts tests/oss-storage.test.ts
git commit -m "fix: store image buffers directly in oss"
```

### Task 2: Prevent image jobs from remaining RUNNING indefinitely

**Files:**
- Modify: `src/server/ai-gateway/provider-registry.ts`
- Modify: `src/server/ai-image-assets.ts`
- Modify: `src/server/ai-image-queue.ts`
- Modify: `tests/image-generation-queue.test.ts`

- [ ] **Step 1: Write failing tests for an aborted model request and stale job failure**

```ts
test("aborts an image request after the configured deadline", async () => {
  await assert.rejects(() => fetchWithTimeout(fakeFetch, "https://example.test", {}, 1), /超时/);
});

test("marks a stale running image job as failed instead of returning it to pending", async () => {
  assert.deepEqual(buildStaleJobUpdate(), { status: "FAILED", errorMessage: "生成任务超时" });
});
```

- [ ] **Step 2: Run queue tests and verify the new tests fail**

Run: `pnpm exec tsx --test tests/image-generation-queue.test.ts`

Expected: failure because timeout and stale-job helpers do not exist.

- [ ] **Step 3: Add an AbortController deadline to all provider fetches**

```ts
export async function fetchWithTimeout(fetchImpl: typeof fetch, input: RequestInfo | URL, init: RequestInit, timeoutMs = 120_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("模型请求超时，请重试");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
```

Use `fetchWithTimeout` for image/text/vision provider calls. Change stale job recovery to mark jobs and linked sessions as failed with an actionable error; never silently requeue a request that may still be executing remotely.

- [ ] **Step 4: Run queue and AI tool tests**

Run: `pnpm exec tsx --test tests/image-generation-queue.test.ts tests/ai-image-tools.test.ts tests/workbench-sessions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/ai-gateway/provider-registry.ts src/server/ai-image-assets.ts src/server/ai-image-queue.ts tests/image-generation-queue.test.ts
git commit -m "fix: fail stalled image jobs predictably"
```

### Task 3: Restore material/model usability through category normalization

**Files:**
- Modify: `src/server/menswear-studio.ts`
- Modify: `src/components/tools/menswear/material-library.tsx`
- Modify: `src/components/tools/menswear/model-profile-manager.tsx`
- Create: `tests/menswear-material-categories.test.ts`

- [ ] **Step 1: Write failing category tests**

```ts
test("maps legacy other materials with face tags to the face category", () => {
  assert.equal(resolveMaterialCategory({ category: "other", tags: ["脸部参考"] }), "model_face");
});

test("keeps explicitly selected material categories unchanged", () => {
  assert.equal(resolveMaterialCategory({ category: "background", tags: [] }), "background");
});
```

- [ ] **Step 2: Run the material category test and verify it fails**

Run: `pnpm exec tsx --test tests/menswear-material-categories.test.ts`

Expected: failure because `resolveMaterialCategory` does not exist.

- [ ] **Step 3: Implement one category registry and recovery classification**

Create a shared seven-category display registry with internal mappings for existing product categories. Add `resolveMaterialCategory` for legacy recovery hints but do not silently overwrite explicit user choices. In the material library, show “待分类” for recovered `other` images and provide a direct category edit action. In the model manager, show a clear empty state with direct actions to upload/select face and body images instead of an empty picker.

- [ ] **Step 4: Run material/model tests**

Run: `pnpm exec tsx --test tests/menswear-material-categories.test.ts tests/menswear-multi-outfit.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/menswear-studio.ts src/components/tools/menswear/material-library.tsx src/components/tools/menswear/model-profile-manager.tsx tests/menswear-material-categories.test.ts
git commit -m "fix: make recovered materials usable by model workflows"
```

### Task 4: Bind edited prompts and histories to the real feature request

**Files:**
- Modify: `src/lib/workbench-sessions.ts`
- Modify: `src/components/tools/workspace-shell.tsx`
- Modify: `src/app/api/tools/image-generation/route.ts`
- Modify: `tests/workbench-tool-registry.test.ts`
- Modify: `tests/workbench-session-routes.test.ts`

- [ ] **Step 1: Write failing tests for specific-path matching and explicit final prompts**

```ts
test("resolves the most specific workbench tool path", () => {
  assert.equal(getWorkbenchToolForPathname("/tools/menswear/style-reference")?.id, "menswear-style-reference");
});

test("uses a saved final prompt when the image request includes one", () => {
  assert.equal(resolveGenerationPrompt({ finalPrompt: "custom prompt" }), "custom prompt");
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `pnpm exec tsx --test tests/workbench-tool-registry.test.ts tests/workbench-session-routes.test.ts`

Expected: failure because paths are resolved by declaration order and prompt resolution is not exported/testable.

- [ ] **Step 3: Resolve the longest matching tool path and share prompt submission logic**

Sort matching tools by href length when resolving paths. Extract the exact `finalPrompt` resolution from the generation API into a tested helper. Update the header prompt dialog to save into the active generation draft through an event/callback boundary, so the next generate click sends the edited text instead of merely persisting a history note.

- [ ] **Step 4: Run session, registry, and generation tests**

Run: `pnpm exec tsx --test tests/workbench-tool-registry.test.ts tests/workbench-session-routes.test.ts tests/workbench-session-client.test.ts tests/ai-image-tools.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workbench-sessions.ts src/components/tools/workspace-shell.tsx src/app/api/tools/image-generation/route.ts tests/workbench-tool-registry.test.ts tests/workbench-session-routes.test.ts
git commit -m "fix: persist prompts and histories per workflow"
```

### Task 5: Add deployment preflight and guarded migration support

**Files:**
- Create: `scripts/migrate-runtime-images-to-oss.ts`
- Create: `scripts/verify-oss-storage.ts`
- Modify: `package.json`
- Modify: `docker-compose.prod.yml`
- Modify: `docs/superpowers/specs/2026-07-20-creative-system-restructure-design.md`
- Modify: `tests/oss-storage.test.ts`

- [ ] **Step 1: Write a failing storage migration dry-run test**

```ts
test("migration ignores files already backed by public OSS URLs", () => {
  assert.equal(shouldMigrateRuntimeUrl("https://design-yshine.oss-cn-beijing.aliyuncs.com/xenia/generated/a.png"), false);
  assert.equal(shouldMigrateRuntimeUrl("/api/uploads/ai-images/a.png"), true);
});
```

- [ ] **Step 2: Run the OSS test file and verify it fails**

Run: `pnpm exec tsx --test tests/oss-storage.test.ts`

Expected: failure because migration URL classification does not exist.

- [ ] **Step 3: Implement non-destructive preflight and migration scripts**

`verify-oss-storage.ts` must validate configuration and upload/delete a generated probe object under the configured prefix. `migrate-runtime-images-to-oss.ts` must require `--apply`, print a dry-run summary by default, upload each local image once, update only matching database URLs in a transaction, and delete local files only after a confirmed database update. It must back up no data itself and must never run automatically at application startup.

- [ ] **Step 4: Add package scripts and document the required production environment variables**

```json
{
  "oss:verify": "tsx scripts/verify-oss-storage.ts",
  "oss:migrate-runtime": "tsx scripts/migrate-runtime-images-to-oss.ts"
}
```

- [ ] **Step 5: Run focused tests, lint, and build**

Run: `pnpm exec tsx --test tests/oss-storage.test.ts tests/image-generation-queue.test.ts tests/workbench-tool-registry.test.ts tests/menswear-material-categories.test.ts && pnpm lint && pnpm build`

Expected: focused tests pass; lint has no errors; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add scripts/migrate-runtime-images-to-oss.ts scripts/verify-oss-storage.ts package.json docker-compose.prod.yml docs/superpowers/specs/2026-07-20-creative-system-restructure-design.md tests/oss-storage.test.ts
git commit -m "feat: add guarded oss migration preflight"
```

### Task 6: Production release only after secure OSS configuration

**Files:**
- Modify on server only: `/opt/my-web/compose/.env.production`
- Modify on server only: runtime image data after backup and verified migration

- [ ] **Step 1: Rotate the previously exposed AccessKey and create a least-privilege RAM key**

Do not store secrets in Git, source code, specifications, Docker image layers, or chat history.

- [ ] **Step 2: Configure production environment variables on the server**

Set `ALIYUN_OSS_ACCESS_KEY_ID`, `ALIYUN_OSS_ACCESS_KEY_SECRET`, `ALIYUN_OSS_BUCKET=design-yshine`, `ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com`, `ALIYUN_OSS_PUBLIC_BASE_URL=https://design-yshine.oss-cn-beijing.aliyuncs.com`, and `ALIYUN_OSS_PREFIX=xenia`.

- [ ] **Step 3: Build locally, deploy offline Docker image, and run OSS preflight**

Expected: probe object upload and delete succeed before any migration.

- [ ] **Step 4: Back up PostgreSQL and runtime directory, dry-run migration, then apply migration**

Expected: DB asset/material URLs become OSS URLs; local source files are removed only after successful update; image gallery and material previews return HTTP 200.

- [ ] **Step 5: Smoke test authenticated material upload, model profile creation, prompt edit, image generation, queue completion, and gallery reuse**

Expected: every tested image displays from `design-yshine.oss-cn-beijing.aliyuncs.com`; failed model calls leave actionable FAILED tasks rather than permanent RUNNING tasks.
