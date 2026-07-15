# Workbench Session and History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist workbench work across navigation, expose editable full prompts and tool-scoped histories for every tool, and verify all tool actions.

**Architecture:** Add one user-owned `WorkbenchSession` database record and guarded session API. A shared client hook maintains an active record and a small localStorage recovery copy. A reusable modal and history page consume that record while individual tool workbenches only provide their input/output snapshots and generated prompt.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Zod, Tailwind, node:test with tsx.

---

### Task 1: Define the session registry and database persistence

**Files:**
- Create: `src/lib/workbench-sessions.ts`
- Create: `src/server/workbench-sessions.ts`
- Create: `prisma/migrations/20260713133000_add_workbench_sessions/migration.sql`
- Modify: `prisma/schema.prisma`
- Modify: `tests/ai-image-assets.test.ts`
- Create: `tests/workbench-sessions.test.ts`

- [ ] **Step 1: Write the failing registry and normalization tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getWorkbenchTool,
  normalizeWorkbenchSessionInput,
} from "../src/server/workbench-sessions";

test("normalizes a bounded workbench session payload", () => {
  assert.deepEqual(
    normalizeWorkbenchSessionInput({
      toolId: "ai-image",
      title: "夏日饮品海报",
      prompt: "完整提示词",
      inputSnapshot: { subject: "饮品" },
      outputSnapshot: { imageUrl: "/image.png" },
      status: "RUNNING",
    }),
    {
      toolId: "ai-image",
      title: "夏日饮品海报",
      prompt: "完整提示词",
      inputSnapshot: { subject: "饮品" },
      outputSnapshot: { imageUrl: "/image.png" },
      imageAssetIds: [],
      externalJobId: null,
      errorMessage: null,
      status: "RUNNING",
    },
  );
});

test("rejects unknown tool IDs and oversized JSON snapshots", () => {
  assert.equal(getWorkbenchTool("not-a-tool"), null);
  assert.throws(() => normalizeWorkbenchSessionInput({ toolId: "ai-image", title: "x", prompt: "x", inputSnapshot: "x".repeat(100_001) }));
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec tsx --test tests/workbench-sessions.test.ts`

Expected: FAIL because the session module does not exist.

- [ ] **Step 3: Add schema, migration, and registry**

Add the relation and model in `prisma/schema.prisma`:

```prisma
enum WorkbenchSessionStatus {
  DRAFT
  RUNNING
  SUCCEEDED
  FAILED
}

model WorkbenchSession {
  id             String                 @id @default(cuid())
  authorId       String
  author         User                   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  toolId         String
  title          String
  status         WorkbenchSessionStatus @default(DRAFT)
  prompt         String                 @default("") @db.Text
  inputSnapshot  Json
  outputSnapshot Json
  imageAssetIds  String[]               @default([])
  externalJobId  String?
  errorMessage   String?                @db.Text
  completedAt    DateTime?
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  @@index([authorId, toolId, updatedAt])
  @@index([authorId, status, updatedAt])
}
```

Create a migration that creates the enum, table, foreign key, and both indexes. In `src/lib/workbench-sessions.ts`, export the complete navigation tool registry with `id`, `label`, `href`, and `supportsPrompt`, including the standalone `overview` entry as well as every grouped navigation item. In `src/server/workbench-sessions.ts`, use the registry to validate input, trim text, cap title at 160 characters, cap prompt at 30,000 characters, accept only object/array JSON snapshots below 96 KiB, deduplicate no more than 30 image asset IDs, and accept only `DRAFT`, `RUNNING`, `SUCCEEDED`, or `FAILED`.

- [ ] **Step 4: Implement server-owned session operations**

```ts
export async function createWorkbenchSession(authorId: string, input: WorkbenchSessionInput) {
  return prisma.workbenchSession.create({ data: { authorId, ...normalizeWorkbenchSessionInput(input) } });
}

export async function listWorkbenchSessions(authorId: string, toolId: string) {
  if (!getWorkbenchTool(toolId)) throw new Error("工具类型不正确");
  return prisma.workbenchSession.findMany({
    where: { authorId, toolId },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
}
```

Implement `getWorkbenchSession` and `updateWorkbenchSession` with `id` plus `authorId` ownership checks. Only allow fields from the normalized input and set `completedAt` when status becomes `SUCCEEDED` or `FAILED`.

- [ ] **Step 5: Run tests and generate Prisma client**

Run: `pnpm exec tsx --test tests/workbench-sessions.test.ts tests/ai-image-assets.test.ts`

Expected: PASS.

Run: `pnpm prisma:generate`

Expected: Prisma Client generated successfully.

- [ ] **Step 6: Commit the persistence layer**

```bash
git add prisma/schema.prisma prisma/migrations/20260713133000_add_workbench_sessions/migration.sql src/lib/workbench-sessions.ts src/server/workbench-sessions.ts tests/workbench-sessions.test.ts tests/ai-image-assets.test.ts
git commit -m "feat: add persisted workbench sessions"
```

### Task 2: Expose authenticated session APIs

**Files:**
- Create: `src/app/api/tools/sessions/route.ts`
- Create: `src/app/api/tools/sessions/[id]/route.ts`
- Create: `tests/workbench-session-routes.test.ts`
- Reference: `src/app/api/tools/image-assets/route.ts`
- Reference: `src/lib/http-response.ts`

- [ ] **Step 1: Write failing API route tests**

```ts
test("session routes require a signed-in user and keep sessions user-scoped", async () => {
  const response = await GET(new Request("http://localhost/api/tools/sessions?toolId=ai-image"));
  assert.equal(response.status, 401);
});

test("patching a session never updates another user's record", async () => {
  const response = await PATCH(new Request("http://localhost/api/tools/sessions/foreign", { method: "PATCH", body: JSON.stringify({ title: "x" }) }), { params: Promise.resolve({ id: "foreign" }) });
  assert.equal(response.status, 404);
});
```

- [ ] **Step 2: Run the API tests and verify failure**

Run: `pnpm exec tsx --test tests/workbench-session-routes.test.ts`

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement list and create route**

Use the same `requireSignedInUser` and JSON helpers as existing tools APIs. `GET` requires a valid `toolId` search parameter and returns `{ sessions }`; `POST` parses JSON, calls `createWorkbenchSession`, and returns `{ session }` with status 201. Return a structured 400 for invalid payloads and preserve standard 401/500 semantics.

- [ ] **Step 4: Implement retrieve and patch route**

`GET /api/tools/sessions/[id]` returns the owned session or 404. `PATCH` merges only supplied normalized fields with the existing record, rejects unrecognized fields, and returns the updated record. Never accept `authorId` from the client.

- [ ] **Step 5: Run session API tests**

Run: `pnpm exec tsx --test tests/workbench-sessions.test.ts tests/workbench-session-routes.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the API surface**

```bash
git add src/app/api/tools/sessions tests/workbench-session-routes.test.ts
git commit -m "feat: expose workbench session APIs"
```

### Task 3: Build shared prompt, persistence, and history UI

**Files:**
- Create: `src/components/tools/prompt-editor-dialog.tsx`
- Create: `src/components/tools/tool-history-link.tsx`
- Create: `src/components/tools/workbench-session-client.ts`
- Create: `src/components/tools/workbench-history-page.tsx`
- Create: `src/app/tools/history/[toolId]/page.tsx`
- Create: `tests/workbench-session-client.test.ts`
- Modify: `src/components/tools/tool-page-header.tsx`

- [ ] **Step 1: Write failing client helper tests**

```ts
import { getSessionCacheKey, mergeRestoredSession } from "../src/components/tools/workbench-session-client";

test("restores a matching cached session without overwriting server state", () => {
  assert.equal(getSessionCacheKey("ai-image"), "workbench-session:ai-image");
  assert.equal(mergeRestoredSession({ id: "server", status: "RUNNING" }, { toolId: "ai-image", status: "DRAFT" }).id, "server");
});
```

- [ ] **Step 2: Run and verify client helper failure**

Run: `pnpm exec tsx --test tests/workbench-session-client.test.ts`

Expected: FAIL because the client session module does not exist.

- [ ] **Step 3: Implement shared session client**

Export `useWorkbenchSession(toolId)` with `restore`, `create`, `persist`, `setPrompt`, and `markStatus` methods. The hook calls the session API and stores only `{ id, toolId, status, title, prompt, inputSnapshot, outputSnapshot, imageAssetIds, externalJobId }` under `workbench-session:<toolId>`. It uses a 500 ms debounce for edits, flushes on `pagehide`, and never writes files or credentials to localStorage.

- [ ] **Step 4: Implement accessible prompt dialog and history link**

`PromptEditorDialog` must use the existing modal styling conventions from `PromptConfirmDialog`, expose a labelled textarea, copy action, cancel action, and disabled save state. `ToolHistoryLink` receives a known tool ID and renders a `History` icon button linking to `/tools/history/<toolId>`. Extend `ToolPageHeader` with optional `toolId`, `prompt`, and `onPromptChange` props so client tool pages can place both actions consistently.

- [ ] **Step 5: Implement dynamic history page**

Validate `[toolId]` against the registry, load the signed-in user's sessions server-side, and render `WorkbenchHistoryPage`. Each record shows title, status, timestamps, output summary, first valid image asset URL if present, full prompt dialog, and a reopen link to the original tool. Provide an empty state and an invalid-tool `notFound()` response.

- [ ] **Step 6: Run client and route tests**

Run: `pnpm exec tsx --test tests/workbench-session-client.test.ts tests/workbench-session-routes.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit shared UI**

```bash
git add src/components/tools/prompt-editor-dialog.tsx src/components/tools/tool-history-link.tsx src/components/tools/workbench-session-client.ts src/components/tools/workbench-history-page.tsx src/components/tools/tool-page-header.tsx src/app/tools/history/[toolId]/page.tsx tests/workbench-session-client.test.ts
git commit -m "feat: add workbench prompt and history UI"
```

### Task 4: Make image-generating tools recoverable

**Files:**
- Modify: `src/components/tools/ai-image-tool.tsx`
- Modify: `src/components/tools/outfit-prompt-workbench.tsx`
- Modify: `src/components/tools/snack-grocery-prompt-workbench.tsx`
- Modify: `src/components/tools/social-commerce-workbench.tsx`
- Modify: `src/components/tools/ip-prototype-workbench.tsx`
- Modify: `src/components/tools/digital-product-pack-workbench.tsx`
- Modify: `src/components/tools/ai-image-gallery-workbench.tsx`
- Modify: `tests/image-generation-workflow.test.ts`
- Modify: `tests/outfit-prompt-workbench.test.ts`
- Modify: `tests/snack-grocery-prompt-workbench.test.ts`
- Modify: `tests/social-commerce-workflow.test.ts`
- Modify: `tests/ip-prototype.test.ts`

- [ ] **Step 1: Add failing generation lifecycle assertions**

```ts
test("image generation persists RUNNING before provider completion", () => {
  const lifecycle = buildGenerationSessionLifecycle({ toolId: "ai-image", prompt: "p" });
  assert.equal(lifecycle.beforeRequest.status, "RUNNING");
  assert.equal(lifecycle.onSuccess.status, "SUCCEEDED");
  assert.equal(lifecycle.onFailure.status, "FAILED");
});
```

- [ ] **Step 2: Run the focused workflow tests and verify failure**

Run: `pnpm exec tsx --test tests/image-generation-workflow.test.ts tests/outfit-prompt-workbench.test.ts tests/snack-grocery-prompt-workbench.test.ts tests/social-commerce-workflow.test.ts tests/ip-prototype.test.ts`

Expected: FAIL because lifecycle persistence helpers do not exist.

- [ ] **Step 3: Integrate session lifecycle in each image tool**

For each component, derive its complete prompt before submission, call `session.create({ status: "RUNNING", inputSnapshot, prompt })`, then use the returned session ID to persist external job ID and result URLs. On success, persist output metadata and asset IDs as `SUCCEEDED`; on caught error, persist its safe message as `FAILED`. On mount, call `restore()` and apply restored form and result state before accepting a new submission. Add prompt/history actions near the primary generate control without replacing existing detailed outputs.

`ai-image-tool.tsx` must include the selected mode, description, style, ratio, quality, and batch count in its input snapshot. The outfit, snack, and social workbenches must omit raw `File` objects from snapshots and only retain uploaded URLs returned by the upload API. The IP workbench must reference existing project/generation IDs rather than duplicating image binary data.

- [ ] **Step 4: Reconcile gallery output with active sessions**

Extend the gallery's refresh path to include `RUNNING` and `FAILED` asset/job cards when an active session references them. Do not create duplicate gallery assets; session records only point to the existing IDs.

- [ ] **Step 5: Run focused image tests**

Run: `pnpm exec tsx --test tests/ai-image-assets.test.ts tests/ai-image-tools.test.ts tests/image-generation-workflow.test.ts tests/outfit-prompt-workbench.test.ts tests/snack-grocery-prompt-workbench.test.ts tests/social-commerce-workflow.test.ts tests/ip-prototype.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit recoverable generation**

```bash
git add src/components/tools/ai-image-tool.tsx src/components/tools/outfit-prompt-workbench.tsx src/components/tools/snack-grocery-prompt-workbench.tsx src/components/tools/social-commerce-workbench.tsx src/components/tools/ip-prototype-workbench.tsx src/components/tools/digital-product-pack-workbench.tsx src/components/tools/ai-image-gallery-workbench.tsx tests/image-generation-workflow.test.ts tests/outfit-prompt-workbench.test.ts tests/snack-grocery-prompt-workbench.test.ts tests/social-commerce-workflow.test.ts tests/ip-prototype.test.ts
git commit -m "feat: restore in-progress image workbench sessions"
```

### Task 5: Record and expose non-image tool histories

**Files:**
- Modify: `src/components/tools/hotspot-radar.tsx`
- Modify: `src/components/tools/series-video-analyzer.tsx`
- Modify: `src/components/tools/fashion-prompts-workbench.tsx`
- Modify: `src/components/tools/daily-plan-panel.tsx`
- Modify: `src/components/tools/website-bookmark-manager.tsx`
- Modify: `src/components/tools/tool-directory.tsx`
- Modify: `src/app/tools/page.tsx`
- Modify: `src/app/tools/image-gallery/page.tsx`
- Modify: `src/app/tools/sites/page.tsx`
- Modify: `src/app/tools/plan/page.tsx`
- Modify: `tests/hotspot-radar.test.ts`
- Modify: `tests/hotspot-radar-real-data.test.ts`
- Modify: `tests/daily-plan.test.ts`
- Modify: `tests/tool-directory.test.ts`
- Modify: `tests/website-bookmarks.test.ts`

- [ ] **Step 1: Add failing action-record tests**

```ts
test("hotspot query history preserves query and output summary", () => {
  assert.deepEqual(buildHotspotSessionSnapshot({ query: "AI", sources: ["weibo"] }), {
    inputSnapshot: { query: "AI", sources: ["weibo"] },
    title: "热点查询：AI",
  });
});
```

- [ ] **Step 2: Run non-image tests and verify failure**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts tests/hotspot-radar-real-data.test.ts tests/daily-plan.test.ts tests/tool-directory.test.ts tests/website-bookmarks.test.ts`

Expected: FAIL because action snapshot helpers do not exist.

- [ ] **Step 3: Persist tool-specific summaries**

After a successful hotspot search, video analysis, fashion prompt generation, plan save, bookmark mutation, directory filter/application, dashboard quick action, and gallery filter/action, create or update one `SUCCEEDED` session. Store only user-visible query/form fields and result summaries. For each tool, derive an editable `prompt` or action description, attach prompt/history controls, and restore its latest non-destructive input state on return.

For server-rendered wrappers (`page.tsx`, `plan/page.tsx`, `sites/page.tsx`, `image-gallery/page.tsx`), pass the explicit `toolId` to their client components. Do not add hidden history records merely for opening a page; record a meaningful submitted action only.

- [ ] **Step 4: Cover routes that redirect or share implementation**

Map `fashion-prompts` to its redirect target, `outfit-image` to the shared outfit tool, and gender-specific tools to distinct IDs (`menswear`, `womenswear`) so their history filters remain separate. Ensure each registry item has a history path even if it shares a React component.

- [ ] **Step 5: Run non-image tests**

Run: `pnpm exec tsx --test tests/hotspot-radar.test.ts tests/hotspot-radar-real-data.test.ts tests/daily-plan.test.ts tests/tool-directory.test.ts tests/website-bookmarks.test.ts tests/tool-navigation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit non-image history coverage**

```bash
git add src/components/tools/hotspot-radar.tsx src/components/tools/series-video-analyzer.tsx src/components/tools/fashion-prompts-workbench.tsx src/components/tools/daily-plan-panel.tsx src/components/tools/website-bookmark-manager.tsx src/components/tools/tool-directory.tsx src/app/tools/page.tsx src/app/tools/image-gallery/page.tsx src/app/tools/sites/page.tsx src/app/tools/plan/page.tsx tests/hotspot-radar.test.ts tests/hotspot-radar-real-data.test.ts tests/daily-plan.test.ts tests/tool-directory.test.ts tests/website-bookmarks.test.ts
git commit -m "feat: record workbench tool histories"
```

### Task 6: Move hotspot navigation and validate every visible tool entry

**Files:**
- Modify: `src/components/tools/nav-config.ts`
- Modify: `tests/tool-navigation.test.ts`
- Create: `tests/workbench-tool-registry.test.ts`

- [ ] **Step 1: Add navigation and registry coverage**

```ts
test("hotspot query is a creation tool", () => {
  const create = navGroups.find((group) => group.id === "create");
  const resource = navGroups.find((group) => group.id === "resource");
  assert.equal(create?.items.some((item) => item.id === "hotspots"), true);
  assert.equal(resource?.items.some((item) => item.id === "hotspots"), false);
  assert.equal(getActiveGroupId("/tools/hotspots"), "create");
});

test("every visible nav item has a history registry entry", () => {
  for (const item of [overviewNav, ...navGroups.flatMap((group) => group.items)]) {
    assert.ok(getWorkbenchTool(item.id));
  }
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm exec tsx --test tests/tool-navigation.test.ts tests/workbench-tool-registry.test.ts`

Expected: FAIL because Hotspot Query remains in Resource and the registry has not been fully mapped.

- [ ] **Step 3: Move the navigation item**

Move the unchanged `hotspots` item object from the `resource` group's `items` array to the `create` group's array, after Series Video Analyzer. Do not change its `href` or ID. Complete any missing registry entries and verify labels match the navigation labels.

- [ ] **Step 4: Run navigation tests**

Run: `pnpm exec tsx --test tests/tool-navigation.test.ts tests/workbench-tool-registry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit navigation move**

```bash
git add src/components/tools/nav-config.ts tests/tool-navigation.test.ts tests/workbench-tool-registry.test.ts
git commit -m "feat: move hotspot query to creation"
```

### Task 7: Verify button behavior and publish the delivery report

**Files:**
- Create: `docs/features/2026-07-13-workbench-session-history-delivery.md`
- Modify: `README.md` only if a user-facing route list is maintained there

- [ ] **Step 1: Run static and automated verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected: all commands exit 0. If unrelated pre-existing failures occur, identify the exact command and test file in the delivery report without suppressing the failure.

- [ ] **Step 2: Run authenticated browser smoke checks**

Start the application with `pnpm dev`. For every visible tool navigation item, verify its route returns a page, its primary action is enabled only when required inputs are valid, its History action points to the matching `/tools/history/<toolId>` path, and its prompt action opens an editable modal. For AI image tools, submit a configured request against the local/mock provider path, navigate to another tool, return, and verify the active state plus result card remain visible.

- [ ] **Step 3: Write the delivery report**

Include:

```md
# Workbench Session and History Delivery Report

## Completed Requirements
- Navigation-safe generation state and image result recovery
- Editable full prompt dialog on every tool
- Tool-scoped history routes for every visible tool
- Hotspot Query moved to Create

## Verification
| Area | Command or flow | Result |
| --- | --- | --- |
| Unit and API tests | `pnpm test` | PASS/FAIL with detail |
| Lint | `pnpm lint` | PASS/FAIL with detail |
| Production build | `pnpm build` | PASS/FAIL with detail |
| Browser smoke | all tool entries | PASS/FAIL with detail |

## Provider-Dependent Limits
List only checks that could not run without a configured provider credential.
```

- [ ] **Step 4: Review changed files and final status**

Run: `git status --short` and `git diff --check`.

Expected: no whitespace errors and only intentional changes staged for the final commit.

- [ ] **Step 5: Commit the report**

```bash
git add docs/features/2026-07-13-workbench-session-history-delivery.md README.md
git commit -m "docs: add workbench session delivery report"
```
