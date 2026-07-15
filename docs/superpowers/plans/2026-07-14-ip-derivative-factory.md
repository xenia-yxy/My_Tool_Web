# IP Derivative Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an IP derivative factory tool for generating expression packs, action poses, outfits/decorations, and scene posters from a base IP image.

**Architecture:** Add a focused prompt-building library and a client workbench that reuses the existing image-generation API. Navigation, history, and prompt controls integrate through existing workspace registry and sourceTool mapping.

**Tech Stack:** Next.js App Router, React, TypeScript, existing image-generation API, node:test.

---

### Task 1: Prompt Model and Tests

**Files:**
- Create: `src/lib/ip-derivative-factory.ts`
- Create: `tests/ip-derivative-factory.test.ts`
- Modify: `src/lib/image-generation-workflow.ts`
- Modify: `tests/image-generation-workflow.test.ts`

- [ ] Write failing tests for mode presets and prompt generation.
- [ ] Write failing test mapping `sourceTool=ip-factory` to workbench tool `ip-factory`.
- [ ] Implement `buildIpDerivativePrompt`, mode labels, output labels, and preset helpers.
- [ ] Run focused tests.

### Task 2: Navigation and Registry

**Files:**
- Modify: `src/components/tools/nav-config.ts`
- Modify: `src/lib/workbench-sessions.ts`
- Modify: `tests/tool-navigation.test.ts`
- Modify: `tests/workbench-tool-registry.test.ts`

- [ ] Add failing tests for create-nav placement and workbench registry.
- [ ] Add `ip-factory` after `ip-prototype` in the Create group.
- [ ] Add `ip-factory` to workbench registry.
- [ ] Run navigation and registry tests.

### Task 3: Workbench UI

**Files:**
- Create: `src/components/tools/ip-derivative-factory-workbench.tsx`
- Create: `src/app/tools/ip-factory/page.tsx`

- [ ] Build a client workbench with base IP upload, optional reference upload, mode tabs, preset controls, editable prompt preview, and generation submit.
- [ ] Submit multipart requests to `/api/tools/image-generation` with `mode=custom`, `sourceTool=ip-factory`, `finalPrompt`, base IP image, and optional references.
- [ ] Display generated result thumbnails and link to image gallery.
- [ ] Rely on workspace shell prompt/history controls for global prompt editing and history page.

### Task 4: Verification

**Files:**
- Relevant tests above.

- [ ] Run `pnpm exec tsx --test tests/ip-derivative-factory.test.ts tests/image-generation-workflow.test.ts tests/tool-navigation.test.ts tests/workbench-tool-registry.test.ts`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
