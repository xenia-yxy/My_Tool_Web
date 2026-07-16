# Intelligent Creation Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Intelligent Creation Center with a persistent freeform creation canvas, managed reusable Skills, and an Agent that drafts editable canvas plans from a natural-language request.

**Architecture:** Preserve current generation, materials, gallery, authentication, and workbench-session services as domain executors. Add a Creative Skill registry with versioned configuration, a canvas-session aggregate that stores node/edge and execution snapshots, and API routes that enforce ownership. The canvas client renders compact asset and Skill cards, persists debounced layout changes, and calls an Agent planning endpoint that proposes cards before any costly generation is submitted.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Zod, Tailwind CSS, Lucide React, Node test runner via `tsx --test`.

---

## Existing Structure To Reuse

- `src/components/tools/nav-config.ts`: left navigation definitions and active-route matching.
- `src/components/tools/workspace-shell.tsx`: authenticated tools shell and page heading pattern.
- `src/lib/workbench-sessions.ts` and `src/server/workbench-sessions.ts`: current session validation and persistence patterns.
- `src/server/agent-chat.ts` and `src/app/api/agent/chat/route.ts`: authenticated AI gateway and fallback behavior.
- `src/app/api/tools/image-assets/route.ts`: user-owned generated gallery asset access.
- `src/app/api/tools/menswear/materials/route.ts`: public material-center access.
- `src/components/tools/prompt-editor-dialog.tsx`: existing editable complete-prompt dialog.
- `src/components/ui/*`: shared Button, Card, Dialog, Input, Select, Textarea and Badge components.
- `prisma/schema.prisma`: authoritative persistent model definitions.

## Planned File Structure

- Create: `src/lib/creative-skills.ts` - system Skill catalog, configuration types, validation helpers and Agent planning contracts.
- Create: `src/server/creative-skills.ts` - ownership checks, CRUD, version publishing, seed-on-read system Skill lookup.
- Create: `src/server/creative-canvas.ts` - canvas session/node/edge/run validation and persistence.
- Create: `src/server/creative-canvas-agent.ts` - deterministic planner plus AI-backed plan enrichment, never starts generation.
- Create: `src/components/creative-center/creative-center-shell.tsx` - focused canvas layout and local toolbar primitives.
- Create: `src/components/creative-center/creative-canvas.tsx` - freeform viewport, selection, drag, zoom and role-labelled edges.
- Create: `src/components/creative-center/creative-canvas-node.tsx` - compact asset, text and Skill card renderers.
- Create: `src/components/creative-center/canvas-inspector.tsx` - selected node parameters, full prompt editing, task state and output actions.
- Create: `src/components/creative-center/canvas-agent-composer.tsx` - fixed-bottom natural-language composer and plan-review state.
- Create: `src/components/creative-center/skill-library.tsx` - canvas Skill picker and material picker.
- Create: `src/components/creative-center/skill-manager.tsx` - Skill list, filters, enable toggle and CRUD dialogs.
- Create: `src/components/creative-center/skill-editor.tsx` - versioned form for name, inputs, template, defaults and Agent description.
- Create: `src/app/tools/creative-center/canvas/page.tsx` - authenticated canvas entry route.
- Create: `src/app/tools/creative-center/canvas/[sessionId]/page.tsx` - authenticated existing-canvas route.
- Create: `src/app/tools/creative-center/skills/page.tsx` - authenticated Skill manager route.
- Create: `src/app/tools/creative-center/skills/new/page.tsx` - authenticated Skill creation route.
- Create: `src/app/tools/creative-center/skills/[skillId]/page.tsx` - authenticated Skill detail/edit route.
- Create: `src/app/api/tools/creative-skills/route.ts` - list and create endpoints.
- Create: `src/app/api/tools/creative-skills/[skillId]/route.ts` - read, update and delete endpoints.
- Create: `src/app/api/tools/creative-skills/[skillId]/toggle/route.ts` - explicit enable/disable endpoint.
- Create: `src/app/api/tools/creative-canvases/route.ts` - create and list endpoints.
- Create: `src/app/api/tools/creative-canvases/[sessionId]/route.ts` - get, patch and duplicate endpoints.
- Create: `src/app/api/tools/creative-canvases/[sessionId]/agent-plan/route.ts` - authenticated planning endpoint.
- Create: `src/app/api/tools/creative-canvases/[sessionId]/runs/route.ts` - record accepted plans and delegated executor results.
- Modify: `prisma/schema.prisma` - add Creative Skill, version, canvas, node, edge and run relations.
- Create: `prisma/migrations/20260716100000_add_creative_center/migration.sql` - additive database migration.
- Modify: `src/components/tools/nav-config.ts` - add the new first-class navigation group and routes.
- Modify: `src/lib/workbench-sessions.ts` - register the canvas history tool ID only if it is used by the existing generic history page.
- Create: `tests/creative-skills.test.ts` - validation, permissions, catalog and version tests.
- Create: `tests/creative-canvas.test.ts` - session snapshots, edge rules and Agent plan tests.
- Modify: `tests/tool-navigation.test.ts` - assert navigation and route activation.

## Task 1: Define System Skills And Domain Contracts

**Files:**
- Create: `src/lib/creative-skills.ts`
- Test: `tests/creative-skills.test.ts`

- [ ] **Step 1: Write the failing catalog and template validation tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSkillPrompt,
  getSystemCreativeSkills,
  normalizeCreativeSkillDraft,
} from "../src/lib/creative-skills";

test("system catalog exposes every first-release canvas executor", () => {
  assert.deepEqual(
    getSystemCreativeSkills().map((skill) => skill.executorKey),
    [
      "menswear-generate",
      "menswear-style-reference",
      "menswear-multi-outfit",
      "platform-cover-design",
      "ip-derivative-factory",
      "menswear-model-generate",
      "menswear-material-extract",
      "hotspot-research",
    ],
  );
});

test("skill prompt interpolates only declared input variables", () => {
  const draft = normalizeCreativeSkillDraft({
    name: "秋季穿搭",
    executorKey: "menswear-multi-outfit",
    promptTemplate: "主体：{subject}\n季节：{season}",
    inputs: [{ key: "subject", type: "image", label: "主体图", required: true }],
  });

  assert.equal(buildSkillPrompt(draft, { subject: "白衬衫", season: "秋季" }), "主体：白衬衫\n季节：{season}");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts`

Expected: FAIL because `creative-skills.ts` does not yet exist.

- [ ] **Step 3: Implement the typed catalog and normalizers**

```ts
export type CreativeSkillInputType = "text" | "image" | "images" | "select" | "multi-select" | "number" | "toggle";
export type CreativeSkillInput = {
  key: string;
  type: CreativeSkillInputType;
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean | string[];
};

export type CreativeSkillDraft = {
  name: string;
  description: string;
  category: string;
  executorKey: string;
  inputs: CreativeSkillInput[];
  promptTemplate: string;
  negativePrompt: string;
  agentInstructions: string;
};

export function buildSkillPrompt(skill: CreativeSkillDraft, values: Record<string, unknown>) {
  return skill.promptTemplate.replace(/\{([a-z][a-z0-9_]*)\}/gi, (placeholder, key) => {
    if (!skill.inputs.some((input) => input.key === key)) return placeholder;
    const value = values[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : placeholder;
  });
}
```

Implement `getSystemCreativeSkills()` as immutable application data, with one complete configuration per system executor. The normalizer must reject empty names, invalid input types, duplicate input keys, templates larger than 30,000 characters and executor keys not in the system allow-list.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the isolated contract change**

```bash
git add src/lib/creative-skills.ts tests/creative-skills.test.ts
git commit -m "feat: define creative skill contracts"
```

## Task 2: Add Versioned Skill And Canvas Persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260716100000_add_creative_center/migration.sql`
- Create: `src/server/creative-skills.ts`
- Create: `src/server/creative-canvas.ts`
- Test: `tests/creative-skills.test.ts`
- Test: `tests/creative-canvas.test.ts`

- [ ] **Step 1: Write failing normalization tests for ownership-safe payloads**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeCanvasPatch, normalizeCanvasNode } from "../src/server/creative-canvas";

test("canvas node limits arbitrary snapshots and accepts only known node kinds", () => {
  assert.deepEqual(
    normalizeCanvasNode({
      clientId: "node-1",
      kind: "skill",
      position: { x: 240, y: 120 },
      skillVersionId: "skill-version-1",
      snapshot: { values: { season: "秋季" } },
    }),
    {
      clientId: "node-1",
      kind: "skill",
      position: { x: 240, y: 120 },
      skillVersionId: "skill-version-1",
      snapshot: { values: { season: "秋季" } },
    },
  );
  assert.throws(() => normalizeCanvasPatch({ nodes: "not-an-array" }));
});
```

- [ ] **Step 2: Run tests to verify the persistence API is missing**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts tests/creative-canvas.test.ts`

Expected: FAIL because the creative server modules do not yet exist.

- [ ] **Step 3: Add additive Prisma entities and migration**

Add these models and owner relations to `prisma/schema.prisma`:

```prisma
model CreativeSkill {
  id        String   @id @default(cuid())
  authorId  String?
  ownerType String
  name      String
  category  String
  enabled   Boolean  @default(true)
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  versions  CreativeSkillVersion[]

  @@index([authorId, updatedAt])
  @@index([ownerType, enabled])
}

model CreativeSkillVersion {
  id          String   @id @default(cuid())
  skillId     String
  skill       CreativeSkill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  version     Int
  config      Json
  createdAt   DateTime @default(now())
  canvasNodes CreativeCanvasNode[]

  @@unique([skillId, version])
}

model CreativeCanvasSession {
  id        String   @id @default(cuid())
  authorId  String
  title     String
  status    String   @default("DRAFT")
  viewport  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  nodes     CreativeCanvasNode[]
  edges     CreativeCanvasEdge[]
  runs      CreativeCanvasRun[]

  @@index([authorId, updatedAt])
}

model CreativeCanvasNode {
  id             String   @id @default(cuid())
  sessionId      String
  session        CreativeCanvasSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  clientId       String
  kind           String
  position       Json
  snapshot       Json
  skillVersionId String?
  skillVersion   CreativeSkillVersion? @relation(fields: [skillVersionId], references: [id], onDelete: SetNull)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([sessionId, clientId])
}

model CreativeCanvasEdge {
  id            String   @id @default(cuid())
  sessionId     String
  session       CreativeCanvasSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sourceNodeId  String
  targetNodeId  String
  role          String
  createdAt     DateTime @default(now())

  @@unique([sessionId, sourceNodeId, targetNodeId, role])
}

model CreativeCanvasRun {
  id          String   @id @default(cuid())
  sessionId   String
  session     CreativeCanvasSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  nodeId      String?
  kind        String
  status      String
  input       Json
  output      Json
  errorMessage String? @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Use `jsonb` in the PostgreSQL migration, create all foreign keys and indexes matching the schema, and add `creativeSkills` and `creativeCanvasSessions` relations to `User`. Generate Prisma after the migration is committed locally with `pnpm prisma:generate`; do not run a production database migration during development.

- [ ] **Step 4: Implement server helpers with explicit ownership checks**

Expose these functions from `src/server/creative-skills.ts`:

```ts
export async function listCreativeSkills(authorId: string, includeDisabled = false) {}
export async function getCreativeSkill(authorId: string, skillId: string) {}
export async function createCreativeSkill(authorId: string, input: unknown) {}
export async function updateCreativeSkill(authorId: string, skillId: string, input: unknown) {}
export async function setCreativeSkillEnabled(authorId: string, skillId: string, enabled: boolean) {}
export async function deleteCreativeSkill(authorId: string, skillId: string) {}
```

Expose these functions from `src/server/creative-canvas.ts`:

```ts
export async function createCreativeCanvas(authorId: string, title?: string) {}
export async function listCreativeCanvases(authorId: string) {}
export async function getCreativeCanvas(authorId: string, sessionId: string) {}
export async function patchCreativeCanvas(authorId: string, sessionId: string, input: unknown) {}
export async function duplicateCreativeCanvas(authorId: string, sessionId: string) {}
```

`patchCreativeCanvas()` must replace nodes and edges inside a single transaction, validate that every edge refers to a submitted node, reject self-referencing edges, and retain `snapshot` data when the linked Skill version is later changed or deleted.

- [ ] **Step 5: Run focused tests and Prisma verification**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts tests/creative-canvas.test.ts && pnpm prisma:generate && pnpm verify:prisma`

Expected: PASS with generated Prisma client and schema verification succeeding.

- [ ] **Step 6: Commit persistence foundation**

```bash
git add prisma/schema.prisma prisma/migrations/20260716100000_add_creative_center/migration.sql src/server/creative-skills.ts src/server/creative-canvas.ts tests/creative-skills.test.ts tests/creative-canvas.test.ts
git commit -m "feat: persist creative skills and canvas sessions"
```

## Task 3: Expose Authenticated Skill And Canvas APIs

**Files:**
- Create: `src/app/api/tools/creative-skills/route.ts`
- Create: `src/app/api/tools/creative-skills/[skillId]/route.ts`
- Create: `src/app/api/tools/creative-skills/[skillId]/toggle/route.ts`
- Create: `src/app/api/tools/creative-canvases/route.ts`
- Create: `src/app/api/tools/creative-canvases/[sessionId]/route.ts`
- Test: `tests/creative-skills.test.ts`
- Test: `tests/creative-canvas.test.ts`

- [ ] **Step 1: Add failing API authorization and normalization tests**

```ts
test("creative skill API accepts only a name and supported configuration fields", () => {
  assert.throws(() => normalizeCreativeSkillRequest({ name: "", unknown: true }));
});

test("canvas patch rejects an edge whose source card is absent", () => {
  assert.throws(() => normalizeCanvasPatch({
    nodes: [],
    edges: [{ sourceClientId: "missing", targetClientId: "skill-1", role: "主体图" }],
  }));
});
```

- [ ] **Step 2: Run the focused tests to verify the route helpers fail**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts tests/creative-canvas.test.ts`

Expected: FAIL until request normalizers and route handlers are added.

- [ ] **Step 3: Implement routes using the existing authorization pattern**

Use the same `getAppSession()` plus `canUseMemberTools()` check as `src/app/api/tools/sessions/route.ts`. Return `401` for unauthenticated users, `404` for records outside the current user's ownership, `400` for invalid bodies, and never return another user's canvas, Skill or configuration.

Use this route shape:

```text
GET    /api/tools/creative-skills?includeDisabled=true
POST   /api/tools/creative-skills
GET    /api/tools/creative-skills/:skillId
PATCH  /api/tools/creative-skills/:skillId
DELETE /api/tools/creative-skills/:skillId
POST   /api/tools/creative-skills/:skillId/toggle
GET    /api/tools/creative-canvases
POST   /api/tools/creative-canvases
GET    /api/tools/creative-canvases/:sessionId
PATCH  /api/tools/creative-canvases/:sessionId
POST   /api/tools/creative-canvases/:sessionId?operation=duplicate
```

- [ ] **Step 4: Run API and schema tests**

Run: `pnpm exec tsx --test tests/creative-skills.test.ts tests/creative-canvas.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit API boundaries**

```bash
git add src/app/api/tools/creative-skills src/app/api/tools/creative-canvases tests/creative-skills.test.ts tests/creative-canvas.test.ts
git commit -m "feat: add creative center APIs"
```

## Task 4: Add Navigation And Skill Management Pages

**Files:**
- Modify: `src/components/tools/nav-config.ts`
- Create: `src/app/tools/creative-center/skills/page.tsx`
- Create: `src/app/tools/creative-center/skills/new/page.tsx`
- Create: `src/app/tools/creative-center/skills/[skillId]/page.tsx`
- Create: `src/components/creative-center/skill-manager.tsx`
- Create: `src/components/creative-center/skill-editor.tsx`
- Modify: `tests/tool-navigation.test.ts`
- Test: `tests/creative-skills.test.ts`

- [ ] **Step 1: Write the navigation and UI-source contract tests**

```ts
test("creative center is a first-class sidebar section", () => {
  const creativeCenter = navGroups.find((group) => group.id === "creative-center");
  assert.deepEqual(creativeCenter?.items.map((item) => item.id), [
    "creative-canvas",
    "creative-skills",
  ]);
  assert.equal(getActiveNavId("/tools/creative-center/canvas"), "creative-canvas");
  assert.equal(getActiveNavId("/tools/creative-center/skills"), "creative-skills");
});
```

- [ ] **Step 2: Run navigation tests to verify they fail**

Run: `pnpm exec tsx --test tests/tool-navigation.test.ts`

Expected: FAIL because the Creative Center group does not yet exist.

- [ ] **Step 3: Add the navigation group and server page guards**

Add a `creative-center` navigation group after `create`, using `PanelsTopLeft` as its icon. Add exactly two items: `创作画布` at `/tools/creative-center/canvas` and `Skill 管理` at `/tools/creative-center/skills`. Every new page must call `requireSignedInUser()` before rendering, matching the existing protected tool pages.

- [ ] **Step 4: Implement the manager and editor UX**

`SkillManager` must provide a search field, category filter, enabled/disabled filter, system/team/custom type badge, a link to create a Skill, copy action, toggle action and delete confirmation. System Skills show no delete button; copying creates a custom draft.

`SkillEditor` must be a form with these concrete fields: name, description, category, executor, input list, prompt template, negative prompt, Agent use instructions and enabled state. Inputs are edited as repeatable rows with key, label, type, required state, default value and select options. Saving posts an explicit versioned configuration to the Skill API.

Use `PromptEditorDialog` for the multi-line prompt template, and preserve the existing 8px-or-less card radius design language.

- [ ] **Step 5: Run focused UI contract tests**

Run: `pnpm exec tsx --test tests/tool-navigation.test.ts tests/creative-skills.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Skill management UI**

```bash
git add src/components/tools/nav-config.ts src/app/tools/creative-center/skills src/components/creative-center/skill-manager.tsx src/components/creative-center/skill-editor.tsx tests/tool-navigation.test.ts tests/creative-skills.test.ts
git commit -m "feat: add creative skill management"
```

## Task 5: Build The Persistent Freeform Canvas

**Files:**
- Create: `src/app/tools/creative-center/canvas/page.tsx`
- Create: `src/app/tools/creative-center/canvas/[sessionId]/page.tsx`
- Create: `src/components/creative-center/creative-center-shell.tsx`
- Create: `src/components/creative-center/creative-canvas.tsx`
- Create: `src/components/creative-center/creative-canvas-node.tsx`
- Create: `src/components/creative-center/skill-library.tsx`
- Create: `src/components/creative-center/canvas-inspector.tsx`
- Create: `src/components/creative-center/use-creative-canvas-session.ts`
- Test: `tests/creative-canvas.test.ts`

- [ ] **Step 1: Write failing reducer tests for editing canvas state**

```ts
import { createCanvasState, reduceCanvasState } from "../src/components/creative-center/use-creative-canvas-session";

test("connecting an asset to a Skill records a labelled role edge", () => {
  const initial = createCanvasState();
  const withNodes = reduceCanvasState(initial, {
    type: "replace",
    nodes: [
      { clientId: "asset-1", kind: "asset", position: { x: 20, y: 20 }, snapshot: {} },
      { clientId: "skill-1", kind: "skill", position: { x: 400, y: 20 }, snapshot: {} },
    ],
    edges: [],
  });
  const next = reduceCanvasState(withNodes, {
    type: "connect",
    sourceClientId: "asset-1",
    targetClientId: "skill-1",
    role: "风格参考",
  });

  assert.equal(next.edges[0]?.role, "风格参考");
});
```

- [ ] **Step 2: Run the reducer test to verify it fails**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts`

Expected: FAIL because the canvas state module does not yet exist.

- [ ] **Step 3: Implement pure canvas state and debounced persistence**

Create a reducer-backed `useCreativeCanvasSession()` hook that loads `/api/tools/creative-canvases/:sessionId`, maintains `nodes`, `edges`, `viewport`, `selectedClientId`, `isSaving` and `saveError`, writes the latest valid state after 700 ms of inactivity, and writes an immediate final snapshot on `pagehide`.

The hook must persist local storage under `creative-canvas:<sessionId>` before network requests. If network restoration fails, show the cached state as a recoverable offline draft and do not discard user changes.

- [ ] **Step 4: Implement the canvas interaction model**

Render a full-height work surface with a subtle grid, pan via blank-space drag, wheel zoom constrained from 40% to 160%, and card drag. The left rail contains icon buttons with tooltips for add Skill, add material, add text, zoom in, zoom out and fit content. Do not render decorative cards inside cards.

Render edges in an absolutely-positioned SVG layer. Edge labels use role names such as `主体图`, `风格参考`, `模特参考` and `继续创作`; hide raw source/target IDs from users. Use click selection plus inspector actions to connect cards, instead of requiring users to drag technical handles.

- [ ] **Step 5: Implement cards and the inspector**

Asset cards show a thumbnail, source name, source type and actions for preview, use as source and extract to materials. Skill cards show the Skill name, one-line prompt summary, input completeness, status and up to four output thumbnails.

The inspector appears only for an active card. For a Skill it shows role-based input slots, default options, full editable prompt through `PromptEditorDialog`, generation status and output actions. For assets it shows large preview, source information and `继续创作` actions. All image previews open the existing accessible fullscreen-dialog style.

- [ ] **Step 6: Run focused canvas tests**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the working canvas**

```bash
git add src/app/tools/creative-center/canvas src/components/creative-center/creative-center-shell.tsx src/components/creative-center/creative-canvas.tsx src/components/creative-center/creative-canvas-node.tsx src/components/creative-center/skill-library.tsx src/components/creative-center/canvas-inspector.tsx src/components/creative-center/use-creative-canvas-session.ts tests/creative-canvas.test.ts
git commit -m "feat: add persistent creative canvas"
```

## Task 6: Add Agent Plan Drafting And Bottom Composer

**Files:**
- Create: `src/server/creative-canvas-agent.ts`
- Create: `src/app/api/tools/creative-canvases/[sessionId]/agent-plan/route.ts`
- Create: `src/components/creative-center/canvas-agent-composer.tsx`
- Modify: `src/components/creative-center/creative-center-shell.tsx`
- Test: `tests/creative-canvas.test.ts`

- [ ] **Step 1: Write failing deterministic planning tests**

```ts
import { buildCreativeCanvasPlan } from "../src/server/creative-canvas-agent";

test("agent plan turns a cover request into an editable plan without submitting generation", async () => {
  const plan = await buildCreativeCanvasPlan({
    message: "用这件衬衫做秋季小红书封面",
    availableSkills: getSystemCreativeSkills(),
    existingNodes: [],
  });

  assert.equal(plan.requiresConfirmation, true);
  assert.deepEqual(plan.nodes.map((node) => node.executorKey), [
    "menswear-multi-outfit",
    "platform-cover-design",
  ]);
  assert.equal(plan.actions.some((action) => action.type === "submit-generation"), false);
});
```

- [ ] **Step 2: Run the planning test to verify it fails**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts`

Expected: FAIL because the Agent planner does not exist.

- [ ] **Step 3: Implement deterministic plan-first routing with optional model enrichment**

`buildCreativeCanvasPlan()` must use catalog executor descriptions and keyword routing to create a valid plan even when no AI model is configured. It may call the existing text gateway only to improve titles and editable prompt drafts. The output must always be validated against the declared planning schema and include `requiresConfirmation: true`.

The planner must never call image-generation, material upload, model generation or hotspot retrieval endpoints. Its only side effect is returning a plan proposal.

- [ ] **Step 4: Implement the fixed-bottom composer**

The composer includes a multi-line text input, attachment button, send icon button, planning state, visible plan summary and actions `应用到画布` and `取消`. Applying a plan adds cards and labelled edges locally, then persists the canvas. It does not execute a Skill. A selected Skill can be referenced in the message context but does not override locked node values.

- [ ] **Step 5: Run Agent and canvas tests**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Agent composition**

```bash
git add src/server/creative-canvas-agent.ts src/app/api/tools/creative-canvases/[sessionId]/agent-plan/route.ts src/components/creative-center/canvas-agent-composer.tsx src/components/creative-center/creative-center-shell.tsx tests/creative-canvas.test.ts
git commit -m "feat: add creative canvas agent planning"
```

## Task 7: Adapt Existing Executors And Record Runs

**Files:**
- Create: `src/app/api/tools/creative-canvases/[sessionId]/runs/route.ts`
- Modify: `src/lib/image-generation-workflow.ts`
- Modify: `src/components/tools/ai-image-tool.tsx`
- Modify: `src/components/tools/menswear/style-reference-generator.tsx`
- Modify: `src/components/tools/menswear/multi-outfit-generator.tsx`
- Modify: `src/components/tools/platform-cover-design-workbench.tsx`
- Modify: `src/components/tools/ip-derivative-factory-workbench.tsx`
- Modify: `src/components/tools/menswear/model-profile-manager.tsx`
- Modify: `src/components/tools/menswear/material-library.tsx`
- Test: `tests/creative-canvas.test.ts`
- Test: `tests/image-generation-workflow.test.ts`

- [ ] **Step 1: Write failing delegation tests**

```ts
test("canvas run snapshots the final prompt and returned gallery assets", () => {
  const run = normalizeCreativeCanvasRun({
    nodeId: "node-1",
    kind: "executor",
    status: "SUCCEEDED",
    input: { finalPrompt: "保持商品真实细节" },
    output: { imageAssetIds: ["asset-1"] },
  });

  assert.equal(run.output.imageAssetIds[0], "asset-1");
});
```

- [ ] **Step 2: Run delegation tests to verify they fail**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts tests/image-generation-workflow.test.ts`

Expected: FAIL until the canvas-run normalizer and executor context are implemented.

- [ ] **Step 3: Add an explicit canvas execution context**

Add optional `creativeCanvasSessionId` and `creativeCanvasNodeClientId` fields to the existing image-generation request normalization and generation-session output. Existing callers must keep current behavior when the fields are absent.

For each listed workbench, add a non-disruptive `从创作画布打开` mode that restores referenced assets, applies the final prompt held in the canvas Skill-card snapshot, and sends the optional canvas context with the existing request. On success or failure, post a `CreativeCanvasRun` record through the new runs API. The old standalone routes and existing `WorkbenchSession` history must continue to work unchanged.

- [ ] **Step 4: Add result continuation behavior**

When a delegated executor returns `AiImageAsset` IDs, the canvas run route updates the corresponding Skill-card snapshot with output image URLs, asset IDs, final prompt, title, tags and caption. The result action `继续创作` creates an asset node linked to the selected downstream Skill with the selected role; it never duplicates the binary file.

- [ ] **Step 5: Run regression and focused tests**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts tests/image-generation-workflow.test.ts tests/menswear-style-reference.test.ts`

Expected: PASS, including existing source-tool and session-restoration assertions.

- [ ] **Step 6: Commit executor integration**

```bash
git add src/app/api/tools/creative-canvases/[sessionId]/runs/route.ts src/lib/image-generation-workflow.ts src/components/tools/ai-image-tool.tsx src/components/tools/menswear/style-reference-generator.tsx src/components/tools/menswear/multi-outfit-generator.tsx src/components/tools/platform-cover-design-workbench.tsx src/components/tools/ip-derivative-factory-workbench.tsx src/components/tools/menswear/model-profile-manager.tsx src/components/tools/menswear/material-library.tsx tests/creative-canvas.test.ts tests/image-generation-workflow.test.ts tests/menswear-style-reference.test.ts
git commit -m "feat: connect canvas skills to existing generators"
```

## Task 8: Complete Responsive UI, History Access And Release Verification

**Files:**
- Modify: `src/components/creative-center/creative-center-shell.tsx`
- Modify: `src/components/creative-center/creative-canvas.tsx`
- Modify: `src/components/tools/workbench-history-page.tsx`
- Modify: `src/lib/workbench-sessions.ts`
- Modify: `tests/tool-navigation.test.ts`
- Modify: `tests/creative-canvas.test.ts`

- [ ] **Step 1: Write failing accessibility and restore-source assertions**

```ts
test("creative canvas snapshots retain viewport, nodes, edges and pending run state", () => {
  const patch = normalizeCanvasPatch({
    title: "秋季封面项目",
    viewport: { x: -20, y: 40, zoom: 0.8 },
    nodes: [{ clientId: "skill-1", kind: "skill", position: { x: 100, y: 100 }, snapshot: { status: "RUNNING" } }],
    edges: [],
  });
  assert.equal(patch.viewport.zoom, 0.8);
  assert.equal(patch.nodes[0]?.snapshot.status, "RUNNING");
});
```

- [ ] **Step 2: Run focused tests to verify the final restore contract**

Run: `pnpm exec tsx --test tests/creative-canvas.test.ts tests/tool-navigation.test.ts`

Expected: PASS after prior tasks; this is a regression checkpoint before release polish.

- [ ] **Step 3: Finish mobile and history behavior**

On screens below `lg`, collapse the left library into a drawer, replace the persistent inspector with a full-height side panel, and preserve the bottom Agent composer above the mobile safe area. The canvas must keep a minimum 44px target size for all icon controls and never hide the current result under the composer.

Add a `创作画布` filter/link in the existing history experience only when canvas sessions are registered in `workbenchTools`; otherwise add a direct `历史项目` action on the canvas header that lists the current user's `CreativeCanvasSession` records and opens `/tools/creative-center/canvas/:sessionId`.

- [ ] **Step 4: Run complete verification**

Run: `pnpm exec tsx --test tests/*.test.ts`

Expected: all tests PASS.

Run: `pnpm lint`

Expected: exit code 0; document any pre-existing warnings without suppressing them.

Run: `pnpm build`

Expected: Next.js production build succeeds.

- [ ] **Step 5: Perform browser smoke checks**

Verify while signed in:

1. `/tools/creative-center/canvas` creates a canvas and persists a dragged card after reload.
2. Adding a system Skill, editing its full prompt and restoring the page preserves the exact prompt.
3. Agent input creates a plan preview but no generation job before confirmation.
4. A generated image can be selected as a downstream reference and opens a large preview.
5. `/tools/creative-center/skills` creates, copies, disables and deletes a custom Skill; a disabled Skill is absent from the canvas library and Agent plan candidates.
6. An old canvas remains readable after its custom Skill is edited or deleted.

- [ ] **Step 6: Commit release-ready UI and tests**

```bash
git add src/components/creative-center src/components/tools/workbench-history-page.tsx src/lib/workbench-sessions.ts tests/creative-canvas.test.ts tests/tool-navigation.test.ts
git commit -m "feat: finish creative center canvas experience"
```

## Plan Self-Review

- Spec coverage: Task 1 defines the complete first-release system Skill catalog; Tasks 2-4 cover versioned CRUD, ownership and navigation; Task 5 provides an easy freeform canvas; Task 6 provides the bottom Agent composer and editable plan-first behavior; Task 7 reuses existing generators and result continuation; Task 8 covers recovery, history, responsive behavior and release verification.
- Scope control: arbitrary external APIs, executable user scripts, user-authored model providers, multi-user collaboration and published composite Skills remain explicitly outside the first implementation phase.
- Data consistency: every canvas node stores a Skill version and snapshot, while every execution records its final prompt and asset IDs. Historic projects therefore remain readable and reproducible after Skill edits or deletion.
- Naming consistency: the plan uses `CreativeSkill`, `CreativeSkillVersion`, `CreativeCanvasSession`, `CreativeCanvasNode`, `CreativeCanvasEdge` and `CreativeCanvasRun` in every task.
