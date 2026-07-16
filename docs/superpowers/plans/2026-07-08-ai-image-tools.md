# AI Image Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two administrator-only AI image tools: freeform image generation and outfit image generation.

**Architecture:** Keep the current Next.js monolith. Add a shared server helper for prompt construction and Aizhzo-compatible image API calls, one protected API route, and two client tool pages that share the same request/preview/download flow.

**Tech Stack:** Next.js App Router, React, TypeScript, Auth.js admin session, native `fetch`, Node test runner.

---

### Task 1: Shared AI Image Helpers

**Files:**
- Create: `src/server/ai-image-tools.ts`
- Test: `tests/ai-image-tools.test.ts`

- [ ] Write tests for prompt building, payload validation, and generated image response normalization.
- [ ] Implement minimal helper functions to pass those tests.
- [ ] Run `pnpm test`.

### Task 2: Protected API Route

**Files:**
- Create: `src/app/api/tools/image-generation/route.ts`
- Modify: `src/server/ai-image-tools.ts`

- [ ] Add POST handler that requires admin login.
- [ ] Accept JSON for freeform generation and multipart form data for outfit/reference-image generation.
- [ ] Call the shared Aizhzo image helper.
- [ ] Return `imageUrl`, `downloadUrl`, `prompt`, and `fileName`.

### Task 3: Tool Pages

**Files:**
- Create: `src/components/tools/ai-image-tool.tsx`
- Create: `src/app/tools/ai-image/page.tsx`
- Create: `src/app/tools/outfit-image/page.tsx`
- Modify: `src/app/tools/page.tsx`
- Modify: `src/components/home/home-data.ts`

- [ ] Build one reusable client component with mode-specific fields.
- [ ] Add the two route pages.
- [ ] Update `/tools` to link to both tools.
- [ ] Update homepage featured tools to point to the new pages.

### Task 4: Configuration And Verification

**Files:**
- Modify: `.env.example`
- Test: `tests/ai-image-tools.test.ts`

- [ ] Add placeholder Aizhzo image env vars without real secrets.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Report deployment readiness and the required server env vars.
