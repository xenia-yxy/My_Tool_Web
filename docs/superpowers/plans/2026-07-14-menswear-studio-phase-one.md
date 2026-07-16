# Menswear Studio Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single men-outfit prompt form with a recoverable menswear workspace that stores private materials and model profiles, maps each reference image to a role and lock policy, and submits strict-fidelity batch generation jobs.

**Architecture:** Keep the existing Next.js monolith, Auth.js ownership checks, Prisma/PostgreSQL persistence, AI gateway, and unified image gallery. Add a small menswear domain layer for validation and prompt assembly, dedicated Prisma records for materials, model profiles, projects, prompt versions, and generation references, then expose them through member-only routes consumed by isolated `/tools/menswear/*` pages.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Auth.js, Zod, native fetch/FormData, Node `tsx --test` runner, Tailwind CSS, lucide-react.

---

## File Structure

- Create `src/lib/menswear-studio.ts`: pure types, normalization, strict-fidelity prompt construction, and reference-role validation.
- Create `tests/menswear-studio.test.ts`: unit tests for ownership-neutral domain rules and prompt output.
- Create `tests/menswear-studio-ui.test.ts`: route and renderer source contracts for isolated menswear pages.
- Modify `prisma/schema.prisma`: add private material, model profile, project, prompt version, and generation-reference records plus user relations.
- Create `prisma/migrations/20260714140000_add_menswear_studio/migration.sql`: additive PostgreSQL migration for the new records and indexes.
- Create `src/server/menswear-studio.ts`: ownership-scoped Prisma commands and upload normalization.
- Create `tests/menswear-studio-server.test.ts`: input validation and ownership-query tests using pure server normalizers.
- Create `src/app/api/tools/menswear/materials/route.ts`: list/create private material records.
- Create `src/app/api/tools/menswear/materials/[id]/route.ts`: read/update/delete one private material.
- Create `src/app/api/tools/menswear/models/route.ts`: list/create model profiles.
- Create `src/app/api/tools/menswear/models/[id]/route.ts`: read/update/delete one model profile.
- Create `src/app/api/tools/menswear/projects/route.ts`: list/create menswear projects.
- Create `src/app/api/tools/menswear/projects/[id]/route.ts`: read/update one project and its references.
- Create `src/app/api/tools/menswear/projects/[id]/generate/route.ts`: translate role-aware references into the existing image edit gateway and persist prompt versions.
- Create `src/components/tools/menswear/menswear-workspace.tsx`: project list and dashboard entry surface.
- Create `src/components/tools/menswear/strict-fidelity-generator.tsx`: isolated strict-fidelity generation form.
- Create `src/components/tools/menswear/material-library.tsx`: private material browser and selector.
- Create `src/components/tools/menswear/model-profile-manager.tsx`: private model-profile manager.
- Create `src/components/tools/menswear/reference-slot.tsx`: role-aware upload/material picker control.
- Create `src/app/tools/menswear/generate/page.tsx`, `src/app/tools/menswear/materials/page.tsx`, `src/app/tools/menswear/models/page.tsx`: page wrappers.
- Modify `src/app/tools/menswear/page.tsx`: turn the current route into the menswear workspace overview and preserve an explicit link to the new generator.
- Modify `src/components/tools/nav-config.ts`: retain the current `男装起号` entry and let nested routes resolve to it.
- Modify `src/components/tools/ai-image-gallery-workbench.tsx`: add a menswear-studio filter label when source metadata exists.

## Task 1: Menswear Domain Rules

**Files:**
- Create: `src/lib/menswear-studio.ts`
- Create: `tests/menswear-studio.test.ts`

- [ ] **Step 1: Write failing tests for role-aware reference normalization and strict prompts**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildStrictMenswearPrompt,
  normalizeMenswearGenerationInput,
} from "../src/lib/menswear-studio";

test("normalizes reference roles and forces product attributes to remain locked", () => {
  const input = normalizeMenswearGenerationInput({
    aspectRatio: "portrait",
    batchCount: 4,
    description: "浅黄色短袖衬衫和浅色牛仔裤",
    references: [
      { materialId: "shirt", role: "top", policy: "LOCKED", fidelity: 100 },
      { materialId: "pose", role: "pose", policy: "SYSTEM", fidelity: 40 },
    ],
  });

  assert.equal(input.references[0].role, "top");
  assert.equal(input.references[0].policy, "LOCKED");
  assert.equal(input.references[0].fidelity, 100);
  assert.equal(input.batchCount, 4);
});

test("strict prompt names every reference role and bans product invention", () => {
  const prompt = buildStrictMenswearPrompt({
    description: "浅黄色短袖衬衫和浅色牛仔裤",
    references: [
      { materialName: "浅黄色衬衫", role: "top", policy: "LOCKED", fidelity: 100 },
      { materialName: "校园树荫", role: "background", policy: "REPLACE", fidelity: 70 },
    ],
    modelName: "男模特 01",
    aspectRatio: "portrait",
    customInstructions: "自然走路，不要文字",
  });

  assert.match(prompt, /主上衣：浅黄色衬衫/);
  assert.match(prompt, /必须保持商品的颜色、版型、图案、Logo、材质/);
  assert.match(prompt, /背景：校园树荫/);
  assert.match(prompt, /男模特 01/);
  assert.match(prompt, /不得补全不可见商品细节/);
});

test("rejects generation without a locked product reference", () => {
  assert.throws(
    () => normalizeMenswearGenerationInput({ description: "男装图", references: [] }),
    /至少选择一件锁定的商品素材/,
  );
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/menswear-studio.test.ts`

Expected: FAIL because `src/lib/menswear-studio.ts` does not exist.

- [ ] **Step 3: Implement the pure domain layer**

Create `src/lib/menswear-studio.ts` with the following public contract:

```ts
export const menswearReferenceRoles = [
  "top", "inner", "bottom", "shoes", "bag", "accessory",
  "outfit", "model_face", "model_body", "pose", "background",
  "composition", "lighting", "mood",
] as const;

export const menswearReferencePolicies = [
  "LOCKED", "REPLACE", "LIMITED", "SYSTEM", "REMOVE",
] as const;

export type MenswearReferenceRole = (typeof menswearReferenceRoles)[number];
export type MenswearReferencePolicy = (typeof menswearReferencePolicies)[number];

export type MenswearGenerationReference = {
  materialId: string;
  role: MenswearReferenceRole;
  policy: MenswearReferencePolicy;
  fidelity: number;
  allowedChanges?: string[];
};
```

Implement `normalizeMenswearGenerationInput`, clamping `batchCount` to `1..30`, fidelity to `0..100`, accepting only `square`, `portrait`, and `landscape`, and rejecting requests with no `LOCKED` reference in one of `top`, `inner`, `bottom`, `shoes`, `bag`, `accessory`, or `outfit`.

Implement `buildStrictMenswearPrompt` with fixed rules that product identity cannot be altered and that hidden product details cannot be invented. Map each role to its Chinese display label and include policy, fidelity, selected model, aspect ratio, custom instructions, and an image-only negative rule.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `pnpm exec tsx --test tests/menswear-studio.test.ts`

Expected: PASS with three passing tests.

- [ ] **Step 5: Commit the isolated domain layer**

```bash
git add src/lib/menswear-studio.ts tests/menswear-studio.test.ts
git commit -m "feat: add menswear reference domain"
```

## Task 2: Private Menswear Persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260714140000_add_menswear_studio/migration.sql`
- Create: `tests/menswear-studio-server.test.ts`

- [ ] **Step 1: Write a failing migration and model-shape test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("menswear studio migration creates private materials, model profiles, and references", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync(
    "prisma/migrations/20260714140000_add_menswear_studio/migration.sql",
    "utf8",
  );

  assert.match(schema, /model MenswearMaterial/);
  assert.match(schema, /model MenswearModelProfile/);
  assert.match(schema, /model MenswearProjectReference/);
  assert.match(migration, /CREATE TABLE "MenswearMaterial"/);
  assert.match(migration, /FOREIGN KEY \("authorId"\)/);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/menswear-studio-server.test.ts`

Expected: FAIL because the new models and migration do not exist.

- [ ] **Step 3: Add additive Prisma models and migration**

Add these records, all scoped by `authorId` except system materials:

```prisma
model MenswearMaterial {
  id             String   @id @default(cuid())
  authorId       String
  author         User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  name           String
  category       String
  sourceType     String
  sourceUrl      String?
  rightsStatus   String   @default("PRIVATE")
  imageUrl       String
  previewUrl     String?
  maskUrl        String?
  tags           String[] @default([])
  analysis       Json     @default("{}")
  promptNotes    String?  @db.Text
  qualityScore   Int?
  completeness   Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  modelImages    MenswearModelProfileImage[]
  projectRefs    MenswearProjectReference[]
  @@index([authorId, category, updatedAt])
}

model MenswearModelProfile {
  id                  String   @id @default(cuid())
  authorId            String
  author              User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  name                String
  status              String   @default("DRAFT")
  profile             Json     @default("{}")
  faceLockStrength    Int      @default(90)
  bodyLockStrength    Int      @default(85)
  hairLockStrength    Int      @default(80)
  consentConfirmedAt  DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  images              MenswearModelProfileImage[]
  projects            MenswearProject[]
  @@index([authorId, updatedAt])
}

model MenswearProject {
  id             String   @id @default(cuid())
  authorId       String
  author         User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  modelProfileId String?
  modelProfile   MenswearModelProfile? @relation(fields: [modelProfileId], references: [id], onDelete: SetNull)
  name           String
  status         String   @default("DRAFT")
  description    String?  @db.Text
  settings       Json     @default("{}")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  references     MenswearProjectReference[]
  prompts        MenswearPromptVersion[]
  @@index([authorId, updatedAt])
}

model MenswearModelProfileImage {
  id             String   @id @default(cuid())
  profileId      String
  profile        MenswearModelProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  materialId     String
  material       MenswearMaterial @relation(fields: [materialId], references: [id], onDelete: Restrict)
  role           String
  position       Int
  createdAt      DateTime @default(now())
  @@unique([profileId, role, position])
  @@index([materialId])
}

model MenswearProjectReference {
  id             String   @id @default(cuid())
  projectId      String
  project        MenswearProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  materialId     String
  material       MenswearMaterial @relation(fields: [materialId], references: [id], onDelete: Restrict)
  role           String
  policy         String
  fidelity       Int
  allowedChanges String[] @default([])
  position       Int
  createdAt      DateTime @default(now())
  @@unique([projectId, role, position])
  @@index([materialId])
}

model MenswearPromptVersion {
  id           String   @id @default(cuid())
  projectId    String
  project      MenswearProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  systemPrompt String   @db.Text
  userPrompt   String?  @db.Text
  finalPrompt  String   @db.Text
  jobId        String?
  createdAt    DateTime @default(now())
  @@index([projectId, createdAt])
}
```

Add `MenswearModelProfileImage`, `MenswearProjectReference`, and `MenswearPromptVersion` with unique position constraints and `onDelete: Cascade` parent ownership. Add matching relation arrays to `User`.

The migration must be additive only: create six tables, indexes for `authorId`, foreign keys, and no destructive statements.

- [ ] **Step 4: Run the model-shape test and Prisma generation**

Run: `pnpm exec tsx --test tests/menswear-studio-server.test.ts`

Expected: PASS.

Run: `pnpm prisma generate`

Expected: Prisma Client generation succeeds.

- [ ] **Step 5: Commit schema work**

```bash
git add prisma/schema.prisma prisma/migrations/20260714140000_add_menswear_studio/migration.sql tests/menswear-studio-server.test.ts
git commit -m "feat: persist menswear studio records"
```

## Task 3: Ownership-Scoped Material and Model Services

**Files:**
- Create: `src/server/menswear-studio.ts`
- Modify: `tests/menswear-studio-server.test.ts`
- Create: `src/app/api/tools/menswear/materials/route.ts`
- Create: `src/app/api/tools/menswear/materials/[id]/route.ts`
- Create: `src/app/api/tools/menswear/models/route.ts`
- Create: `src/app/api/tools/menswear/models/[id]/route.ts`

- [ ] **Step 1: Extend the failing tests with input normalization and ownership predicates**

```ts
import {
  buildOwnedMenswearMaterialWhere,
  normalizeMenswearMaterialInput,
  normalizeMenswearModelProfileInput,
} from "../src/server/menswear-studio";

test("normalizes a private material and never accepts a public face source", () => {
  assert.deepEqual(
    normalizeMenswearMaterialInput({
      name: "  浅黄色短袖衬衫  ",
      category: "top",
      imageUrl: "/api/uploads/ai-images/shirt.png",
      rightsStatus: "PUBLIC",
      tags: ["夏季", "衬衫", "夏季"],
    }),
    {
      name: "浅黄色短袖衬衫",
      category: "top",
      imageUrl: "/api/uploads/ai-images/shirt.png",
      previewUrl: null,
      maskUrl: null,
      sourceType: "UPLOAD",
      sourceUrl: null,
      rightsStatus: "PRIVATE",
      tags: ["夏季", "衬衫"],
      analysis: {},
      promptNotes: null,
    },
  );
});

test("builds material lookup constrained to the current user", () => {
  assert.deepEqual(buildOwnedMenswearMaterialWhere("user-1", "material-1"), {
    id: "material-1",
    authorId: "user-1",
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `pnpm exec tsx --test tests/menswear-studio-server.test.ts`

Expected: FAIL because `src/server/menswear-studio.ts` does not export the service helpers.

- [ ] **Step 3: Implement service helpers and authenticated routes**

Implement service functions for create/list/get/update/delete private materials and model profiles. Every lookup must include `authorId`; no route may call Prisma with an ID-only lookup.

Route contract:

```text
GET    /api/tools/menswear/materials?category=top
POST   /api/tools/menswear/materials
GET    /api/tools/menswear/materials/:id
PATCH  /api/tools/menswear/materials/:id
DELETE /api/tools/menswear/materials/:id

GET    /api/tools/menswear/models
POST   /api/tools/menswear/models
GET    /api/tools/menswear/models/:id
PATCH  /api/tools/menswear/models/:id
DELETE /api/tools/menswear/models/:id
```

Each handler must require `getAppSession()` and `canUseMemberTools()`, return `401` for unsigned users, `404` for a missing or foreign record, `400` for validation errors, and JSON only.

- [ ] **Step 4: Run focused tests and lint**

Run: `pnpm exec tsx --test tests/menswear-studio-server.test.ts`

Expected: PASS.

Run: `pnpm exec eslint src/server/menswear-studio.ts src/app/api/tools/menswear/materials/route.ts src/app/api/tools/menswear/materials/[id]/route.ts src/app/api/tools/menswear/models/route.ts src/app/api/tools/menswear/models/[id]/route.ts tests/menswear-studio-server.test.ts`

Expected: exit code 0.

- [ ] **Step 5: Commit services and routes**

```bash
git add src/server/menswear-studio.ts src/app/api/tools/menswear/materials src/app/api/tools/menswear/models tests/menswear-studio-server.test.ts
git commit -m "feat: add private menswear materials and models"
```

## Task 4: Project References and Strict-Fidelity Generation Route

**Files:**
- Create: `src/app/api/tools/menswear/projects/route.ts`
- Create: `src/app/api/tools/menswear/projects/[id]/route.ts`
- Create: `src/app/api/tools/menswear/projects/[id]/generate/route.ts`
- Modify: `src/server/menswear-studio.ts`
- Modify: `tests/menswear-studio-server.test.ts`

- [ ] **Step 1: Add failing tests for reference persistence and provenance**

```ts
test("normalizes an ordered project reference with a role and lock policy", () => {
  assert.deepEqual(
    normalizeMenswearProjectReference({
      materialId: "material-1",
      role: "top",
      policy: "LOCKED",
      fidelity: 100,
      position: 0,
    }),
    {
      materialId: "material-1",
      role: "top",
      policy: "LOCKED",
      fidelity: 100,
      position: 0,
      allowedChanges: [],
    },
  );
});

```

- [ ] **Step 2: Run RED tests**

Run: `pnpm exec tsx --test tests/menswear-studio-server.test.ts`

Expected: FAIL because project-reference normalization and menswear project routes do not exist.

- [ ] **Step 3: Implement project routes and role-aware generation**

Create project CRUD with nested `MenswearProjectReference` replacement in one Prisma transaction. Validate every referenced material belongs to the project author and the selected model profile belongs to that same author.

The generation route must:

1. Load the owned project with its model profile, model images, references, and material images.
2. Convert project references into `buildStrictMenswearPrompt` input.
3. Download only owned material URLs into `File` instances, ordered by `position`.
4. Call `editImageWithReferences` once per requested image.
5. Reuse `createAiImageJob`, `markAiImageJobRunning`, `markAiImageJobCompleted`, and `createAiImageAsset` with `mode: "menswear"` and `sourceTool: "menswear-studio"`.
6. Create a `MenswearPromptVersion` with system prompt, user-edited prompt, final prompt, and the job ID.
7. Store role, policy, fidelity, material ID, and model ID in each asset `description` JSON payload for gallery provenance.

The dedicated generation route calls the existing `editImageWithReferences` helper directly and does not alter generic `/api/tools/image-generation` callers. It stores a JSON provenance payload in the existing asset `description` field only for assets whose source tool is `menswear-studio`.

- [ ] **Step 4: Run focused tests**

Run: `pnpm exec tsx --test tests/menswear-studio.test.ts tests/menswear-studio-server.test.ts tests/ai-image-tools.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit strict generation backend**

```bash
git add src/app/api/tools/menswear/projects src/server/menswear-studio.ts tests/menswear-studio-server.test.ts
git commit -m "feat: generate strict menswear projects"
```

## Task 5: Isolated Menswear Workspace Pages

**Files:**
- Create: `src/components/tools/menswear/reference-slot.tsx`
- Create: `src/components/tools/menswear/material-library.tsx`
- Create: `src/components/tools/menswear/model-profile-manager.tsx`
- Create: `src/components/tools/menswear/strict-fidelity-generator.tsx`
- Create: `src/components/tools/menswear/menswear-workspace.tsx`
- Create: `src/app/tools/menswear/generate/page.tsx`
- Create: `src/app/tools/menswear/materials/page.tsx`
- Create: `src/app/tools/menswear/models/page.tsx`
- Modify: `src/app/tools/menswear/page.tsx`
- Modify: `src/components/tools/nav-config.ts`

- [ ] **Step 1: Add a focused UI contract test for routes and navigation**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("menswear workspace exposes isolated generator, material, and model routes", () => {
  const rootPage = readFileSync("src/app/tools/menswear/page.tsx", "utf8");
  const generatorPage = readFileSync("src/app/tools/menswear/generate/page.tsx", "utf8");

  assert.match(rootPage, /MenswearWorkspace/);
  assert.match(generatorPage, /StrictFidelityGenerator/);
  assert.match(generatorPage, /严格保真生图/);
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm exec tsx --test tests/menswear-studio-ui.test.ts`

Expected: FAIL because the page and component files do not exist.

- [ ] **Step 3: Implement pages and page-scoped state**

`MenswearWorkspace` renders counters and links only. It must not render the generation form.

`MaterialLibrary` renders private materials with category filters, search, upload/create action, preview, edit, delete, and a `选择素材` callback for generator usage. System material entries are read-only and visually labelled.

`ModelProfileManager` renders profiles with status, consistency strengths, consent state, reference-image count, create/edit/delete actions, and an explicit private-material warning.

`StrictFidelityGenerator` renders:

- project name and description;
- model profile selector;
- one `ReferenceSlot` per role group: product, model, pose, background, composition, lighting, and mood;
- policy segmented control: locked, replace, limited, system, remove;
- fidelity select/slider fixed to 100 for locked product roles;
- aspect-ratio and batch-count selectors;
- a custom instructions textarea;
- live complete prompt preview;
- the existing `PromptEditorDialog` before submission;
- task-result thumbnails and link to the unified gallery.

Use `ImageReferenceUploader` only for temporary file capture; upload selected files as private material records before creating a project reference. Do not keep cross-page data solely in browser memory.

The existing `/tools/menswear` page becomes the overview. The legacy prompt form moves conceptually to `/tools/menswear/generate`; do not remove `/tools/womenswear` or modify its behavior in this phase.

- [ ] **Step 4: Run lint and route contract tests**

Run: `pnpm exec tsx --test tests/menswear-studio-ui.test.ts`

Expected: PASS.

Run: `pnpm exec eslint src/components/tools/menswear src/app/tools/menswear src/components/tools/nav-config.ts tests/menswear-studio-ui.test.ts`

Expected: exit code 0.

- [ ] **Step 5: Commit the isolated pages**

```bash
git add src/components/tools/menswear src/app/tools/menswear src/components/tools/nav-config.ts tests/menswear-studio-ui.test.ts
git commit -m "feat: add isolated menswear workspace pages"
```

## Task 6: Gallery Provenance, Verification, and Acceptance

**Files:**
- Modify: `src/components/tools/ai-image-gallery-workbench.tsx`
- Test: `tests/menswear-studio.test.ts`
- Test: `tests/menswear-studio-server.test.ts`
- Test: `tests/menswear-studio-ui.test.ts`

- [ ] **Step 1: Write a failing gallery renderer contract test**

```ts
test("gallery detail renders menswear provenance only for menswear-studio assets", () => {
  const gallery = readFileSync(
    "src/components/tools/ai-image-gallery-workbench.tsx",
    "utf8",
  );

  assert.match(gallery, /sourceTool === "menswear-studio"/);
  assert.match(gallery, /锁定商品参考/);
});
```

- [ ] **Step 2: Run RED or confirm missing gallery provenance rendering**

Run: `pnpm exec tsx --test tests/menswear-studio-ui.test.ts`

Expected: FAIL because the gallery does not render menswear-specific provenance.

- [ ] **Step 3: Render menswear provenance in gallery detail**

In `AssetDetailModal`, parse a JSON description only when `sourceTool === "menswear-studio"`. Render selected model profile ID, locked product roles, reference count, and a link back to `/tools/menswear/generate?projectId=...`. Keep normal asset descriptions rendered as plain text and never parse arbitrary descriptions as executable content.

- [ ] **Step 4: Run the full focused verification set**

Run:

```bash
pnpm exec tsx --test tests/menswear-studio.test.ts tests/menswear-studio-server.test.ts tests/menswear-studio-ui.test.ts tests/ai-image-assets.test.ts tests/ai-image-tools.test.ts tests/workbench-sessions.test.ts
```

Expected: all listed tests pass.

Run:

```bash
pnpm exec eslint src/lib/menswear-studio.ts src/server/menswear-studio.ts src/components/tools/menswear src/app/tools/menswear src/app/api/tools/menswear src/components/tools/ai-image-gallery-workbench.tsx tests/menswear-studio.test.ts tests/menswear-studio-server.test.ts tests/menswear-studio-ui.test.ts
```

Expected: exit code 0, excluding documented pre-existing warnings outside changed files.

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: either exit code 0 or only the pre-existing `tests/website-bookmarks.test.ts` errors already observed before this phase; any menswear-related error blocks completion.

- [ ] **Step 5: Perform authenticated browser acceptance**

With `pnpm exec next dev -p 3001` running and a signed-in member session:

1. Create a private top material.
2. Create a model profile with consent confirmation and at least one face reference.
3. Create a project using one locked top material and one system background.
4. Open the prompt dialog, edit the final prompt, generate two images.
5. Confirm both images appear in `/tools/image-gallery?mode=menswear` with provenance visible in details.
6. Refresh `/tools/menswear/generate?projectId=...` and confirm project references and prompt draft restore.
7. Confirm another account cannot fetch the material, profile, or project by ID.

- [ ] **Step 6: Commit verification-only changes**

```bash
git add src/components/tools/ai-image-gallery-workbench.tsx tests/menswear-studio-ui.test.ts
git commit -m "feat: show menswear generation provenance"
```

## Plan Self-Review

### Spec coverage

- Phase-one coverage: overview, private materials, system-material distinction in UI, multi-model profiles, strict product reference roles, lock policies, complete editable prompts, batch jobs, gallery linkage, ownership, recovery through persistent projects, and provenance.
- Deferred by the approved phase boundary: automatic web-image extraction and segmentation, product shape conversion, fidelity-scoring models, and publishing packages. These are phases two through four in the approved specification and require independent plans.

### Placeholder scan

- The plan contains no unresolved placeholder markers. Provider-specific image segmentation, identity embeddings, and external publishing are intentionally absent from this phase rather than left unspecified.

### Type consistency

- Reference role and policy names originate in `src/lib/menswear-studio.ts` and are reused by persistence, API, and UI tasks.
- Private material ownership consistently uses `authorId`.
- Generated gallery assets remain `mode: "menswear"` and use `sourceTool: "menswear-studio"` for provenance.
