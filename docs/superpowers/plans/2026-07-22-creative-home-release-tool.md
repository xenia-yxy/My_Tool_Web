# Creative Home And Release Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public personal homepage with a brand-neutral creative entry and add a private, non-persistent emotional release tool.

**Architecture:** The public page remains server-rendered and composes isolated client components for theme behavior and visual motion. The release tool is a client-only workbench page so user input never reaches an API or database.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, Node test runner.

---

### Task 1: Update workspace navigation

**Files:**
- Modify: `src/components/tools/nav-config.ts`
- Modify: `tests/tool-navigation.test.ts`

- [ ] Add an `emotional-release` item under the creation group with href `/tools/release`.
- [ ] Assert `/tools/release` resolves to that item and the creation group.

### Task 2: Build the private emotional release page

**Files:**
- Create: `src/app/tools/release/page.tsx`
- Create: `src/components/tools/emotional-release-tool.tsx`

- [ ] Render an input, three tone controls, local response templates, copy controls, and a clear action.
- [ ] Keep input and generated text in React state only; reject blank input and avoid API calls.
- [ ] Include a clear boundary message that the output is for a situation, not a real person.

### Task 3: Replace the public homepage

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/components/home/site-header.tsx`
- Modify: `src/components/home/hero-section.tsx`
- Modify: `src/components/home/ambient-field.tsx`
- Create: `src/components/home/theme-switch.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] Remove personal identifiers, contact links, old MVP card, and the public chat widget.
- [ ] Implement automatic time-based light/dark preference with a manual local override.
- [ ] Present `简即繁，慢即快` as the sole hero message and show product areas only as visual trajectory links after the fold.
- [ ] Use CSS-only animated layers, respect reduced-motion preferences, and preserve mobile layout.

### Task 4: Verify and release

**Files:**
- Test: `tests/tool-navigation.test.ts`

- [ ] Run the focused navigation test and lint on touched modules.
- [ ] Build the production image, deploy only the web and worker services, and verify the public home and authenticated release route.
