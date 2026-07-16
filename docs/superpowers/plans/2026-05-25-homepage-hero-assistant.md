# Homepage Hero Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the first-screen homepage around the `AI Practice` personal brand and add a scoped floating `AI Practice Assistant` MVP.

**Architecture:** Keep the visual refresh inside the existing homepage component structure. Add assistant behavior as a small client widget backed by a pure local answer-matching module, so the MVP is testable and does not imply real model/RAG capability.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, Node test runner via `tsx --test`.

---

## Source Specs

- `docs/superpowers/specs/2026-05-25-homepage-hero-assistant-design.md`
- `docs/06-stage-01-homepage-mvp.md`
- `docs/07-stage-01-homepage-ui-blueprint.md`

## File Structure

Create:

- `src/components/assistant/assistant-content.ts`  
  Pure local data and answer-selection logic for the assistant.

- `src/components/assistant/assistant-content.test.ts`  
  Tests for the answer-selection logic.

- `src/components/assistant/ai-practice-assistant.tsx`  
  Client floating widget with preset questions, simple keyword input, local answers, and accessible buttons.

Modify:

- `src/components/home/site-header.tsx`  
  Replace icon-card branding with text logo, light text navigation, `联系` primary action, and quiet `登录` link.

- `src/components/home/hero-section.tsx`  
  Replace current multi-color hero card with the `AI Practice` personal brand hero and restrained practice map.

- `src/components/home/ambient-field.tsx`  
  Reduce background color accents to a unified cool-blue/slate treatment.

- `src/app/globals.css`  
  Update page background and ambient helpers to match the restrained first-screen palette.

- `src/app/(public)/page.tsx`  
  Mount the floating assistant globally on the homepage.

Do not modify:

- Prisma schema or migrations.
- Auth implementation.
- Admin behavior beyond linking the header login to `/admin`.

---

### Task 1: Add Tested Assistant Content Logic

**Files:**

- Create: `src/components/assistant/assistant-content.test.ts`
- Create: `src/components/assistant/assistant-content.ts`

- [ ] **Step 1: Write failing tests for local assistant matching**

Create tests that import `getAssistantAnswer`, `assistantPrompts`, and `fallbackAssistantAnswer`.

Test cases:

- A site-introduction question returns an answer mentioning `AI Practice`.
- An SOP question returns an answer mentioning `SOP`.
- An unknown question returns the fallback answer.
- Preset prompts are non-empty.

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm exec tsx --test src/components/assistant/assistant-content.test.ts
```

Expected: FAIL because `assistant-content.ts` does not exist yet.

- [ ] **Step 3: Implement local assistant content**

Create `assistant-content.ts` with:

- `AssistantPrompt` type.
- `assistantPrompts` array.
- `fallbackAssistantAnswer`.
- `getAssistantAnswer(question: string)` using lowercase keyword matching.

Keep it deterministic and local.

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
pnpm exec tsx --test src/components/assistant/assistant-content.test.ts
```

Expected: PASS.

---

### Task 2: Build Floating Assistant Widget

**Files:**

- Create: `src/components/assistant/ai-practice-assistant.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Implement client widget**

Create a `"use client"` component with:

- Bottom-right floating trigger.
- Compact trigger label `问问 AI Practice`.
- Open panel title `AI Practice Assistant`.
- Preset prompt buttons from `assistantPrompts`.
- Local answer display.
- Text input with keyword matching via `getAssistantAnswer`.
- Close button.

- [ ] **Step 2: Mount on homepage**

Import and render `AiPracticeAssistant` in `src/app/(public)/page.tsx` after the existing sections.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

---

### Task 3: Redesign Header

**Files:**

- Modify: `src/components/home/site-header.tsx`

- [ ] **Step 1: Replace logo and nav layout**

Update header to:

```text
AI Practice        知识库   工具   项目   SOP 服务        联系   登录
```

Implementation requirements:

- No sparkles icon.
- Text-first logo.
- Light text navigation.
- `联系` links to `#contact` and is the primary public action.
- `登录` links to `/admin` and is visually quiet.
- Mobile must not create horizontal overflow.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

---

### Task 4: Redesign Hero and Ambient Palette

**Files:**

- Modify: `src/components/home/hero-section.tsx`
- Modify: `src/components/home/ambient-field.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace hero copy and structure**

Use the approved copy:

```text
AI Practice
一个个人 AI 实践者的数字据点
记录真实 AI 实践，把知识、工具和流程沉淀成可持续生长的系统。
```

Keep primary actions:

- `阅读知识库`
- `查看工具`

- [ ] **Step 2: Replace right-side visual with Practice Map**

Use a restrained list/panel for:

- `Knowledge Notes`
- `Tool Experiments`
- `Project Logs`
- `SOP Systems`

Use slate/gray/one cool-blue accent only.

- [ ] **Step 3: Unify background palette**

Remove competing cyan/violet/emerald hero background emphasis. Keep a subtle cool-blue/slate ambient grid/glow.

- [ ] **Step 4: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

---

### Task 5: Final Verification and Run Server

**Files:**

- No required file edits.

- [ ] **Step 1: Run assistant tests**

Run:

```bash
pnpm exec tsx --test src/components/assistant/assistant-content.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 3: Start dev server from worktree**

Run:

```bash
pnpm dev
```

Expected: server starts on an available localhost port.

- [ ] **Step 4: Report URL and changed files**

Report the localhost URL and summarize the implementation.

