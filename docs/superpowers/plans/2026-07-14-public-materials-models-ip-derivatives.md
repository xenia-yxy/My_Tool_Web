# Public Materials, Models, and IP Derivatives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make materials reusable through upload and visual selection, add reference-driven model images, and make IP derivative modes use purpose-specific controls and larger batches.

**Architecture:** Keep `MenswearMaterial.authorId` for traceability while making material listing and project references public. Extract a reusable image lightbox and material picker for uploads, references, material cards, and gallery references. Model generation reuses the existing AI image gateway and stores output as a material attached to the profile.

**Tech Stack:** Next.js App Router, React, Prisma, existing image-generation gateway, node:test.

---

### Task 1: Public Material Selection and Preview

**Files:**
- Create: `src/components/tools/image-preview-dialog.tsx`
- Create: `src/components/tools/menswear/material-picker-dialog.tsx`
- Modify: `src/components/tools/menswear/reference-slot.tsx`
- Modify: `src/components/tools/menswear/material-library.tsx`
- Modify: `src/components/tools/image-reference-uploader.tsx`
- Modify: `src/server/menswear-studio.ts`
- Test: `tests/menswear-studio-ui.test.ts`

- [ ] Add failing UI assertions for visual material picker, upload preview, and public library labels.
- [ ] Verify the assertions fail before implementation.
- [ ] Add an image preview dialog and use it for uploaded previews, material cards, and selected references.
- [ ] Replace the reference select-only workflow with an upload box and thumbnail material-picker dialog.
- [ ] List public materials for selection while keeping creator ownership for delete/update operations.
- [ ] Run the focused menswear tests.

### Task 2: Model References and Generated Images

**Files:**
- Create: `src/app/api/tools/menswear/models/[id]/generate/route.ts`
- Modify: `src/components/tools/menswear/model-profile-manager.tsx`
- Modify: `src/components/tools/menswear/types.ts`
- Modify: `src/server/menswear-studio.ts`
- Test: `tests/menswear-studio-server.test.ts`

- [ ] Add failing tests for generated model material attachment and face reference support.
- [ ] Verify the tests fail before implementation.
- [ ] Generate face or full-body model assets with text generation or uploaded references.
- [ ] Store the result as a public material and append it to the model profile.
- [ ] Display profile reference/generated thumbnails with full-size preview.
- [ ] Run the focused model tests.

### Task 3: IP Derivative Mode Controls

**Files:**
- Modify: `src/lib/ip-derivative-factory.ts`
- Modify: `src/components/tools/ip-derivative-factory-workbench.tsx`
- Modify: `tests/ip-derivative-factory.test.ts`

- [ ] Add failing tests for mode-specific preset controls and prompt output.
- [ ] Verify the tests fail before implementation.
- [ ] Define expression, action, outfit, and scene preset data by derivative mode.
- [ ] Render only the controls relevant to the selected mode and merge the selected values into the prompt.
- [ ] Expand the selectable batch count through 30 images.
- [ ] Run focused IP derivative tests.

### Task 4: Gallery and Navigation Cleanup

**Files:**
- Modify: `src/components/tools/ai-image-gallery-workbench.tsx`
- Modify: `src/components/tools/menswear/menswear-workspace.tsx`
- Modify: `tests/menswear-studio-ui.test.ts`

- [ ] Add failing tests for clickable reference thumbnails and absence of the menswear gallery dashboard entry.
- [ ] Verify the tests fail before implementation.
- [ ] Add full-screen preview for gallery result images and reference images.
- [ ] Remove the dedicated menswear gallery dashboard card while retaining the unified gallery result link.
- [ ] Run the focused UI tests.

### Task 5: Verification and Release

- [ ] Run menswear, IP derivative, navigation, and gallery focused tests.
- [ ] Run `pnpm lint` and `pnpm build`.
- [ ] Build an offline `my-web` image, package it without environment files, and deploy only `my-web`.
- [ ] Verify production image tag, migration status, public root response, and protected tool routes.
