# Workbench Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Make image generation, gallery download, series analysis, social-commerce cover generation, and the hotspot radar usable as working product flows.

**Architecture:** Keep the current Next.js application and Auth.js permissions. Add a small server-side ZIP writer and a protected ZIP route; reuse the current editable prompt dialog on generation surfaces; retain static hotspot links only as a clearly separate manual-reference area.

**Tech Stack:** Next.js App Router, React, TypeScript, Node test runner, native browser APIs.

---

### Task 1: Download Archive

**Files:** `tests/ai-image-assets.test.ts`, `src/server/ai-image-assets.ts`, `src/app/api/tools/image-assets/download-zip/route.ts`, `src/components/tools/ai-image-gallery-workbench.tsx`

- [ ] Add failing unit tests for ZIP request normalization and archive binary structure.
- [ ] Implement a dependency-free ZIP writer and asset download route scoped to the signed-in author.
- [ ] Change gallery multi-select download to one ZIP download; preserve direct single-file download.

### Task 2: Explicit Actions And Data Integrity

**Files:** `src/components/tools/series-video-analyzer.tsx`, `src/server/hotspot-radar.ts`, `src/components/tools/hotspot-radar.tsx`, `tests/hotspot-radar-real-data.test.ts`

- [ ] Make analysis a snapshot created by a dedicated button instead of recalculating while typing.
- [ ] Add tests for unavailable source status and remove the impression that navigation links are live data.
- [ ] Render fetch status and real results before any manual-reference links.

### Task 3: Prompt-First Generation And Media Preview

**Files:** `src/components/tools/ai-image-tool.tsx`, `src/components/tools/social-commerce-workbench.tsx`, `src/components/tools/ai-image-gallery-workbench.tsx`

- [ ] Open the shared full-prompt editor before submitting each generation request.
- [ ] Make generated results and uploaded reference images inspectable in an image viewer.
- [ ] Add a social-commerce quantity selector and thumbnail previews for every uploaded reference image.

### Task 4: Verification

**Files:** changed source and test files

- [ ] Run focused tests after every red/green cycle.
- [ ] Run TypeScript checking, focused lint, and the project test suite where test-script integrity permits.
- [ ] Start the development server and inspect the affected desktop interactions.
