# Stage 01 Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Stage 1 public homepage MVP: a light, premium, interactive AI practitioner landing page with clear entrances to knowledge, tools, projects, SOP services, and contact.

**Architecture:** Keep the homepage data-driven with local typed config arrays so the future admin console can replace static data without rewriting page structure. Split animation, section, and card components into focused files to avoid a large `page.tsx`. Use Tailwind and local shadcn-style primitives only; do not introduce another UI library.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, local shadcn-style components.

---

## Source Specs

- `docs/00-ne-ti-ni-te-process.md`
- `docs/06-stage-01-homepage-mvp.md`
- `docs/07-stage-01-homepage-ui-blueprint.md`
- `AI通用开发引入规范包/rules/ui/00-ui-development-rules.md`
- `AI通用开发引入规范包/rules/ui/02-state-and-feedback-rules.md`
- `AI通用开发引入规范包/rules/component-libraries/00-component-library-rules.md`

## Scope

In scope:

- Replace the current `/` placeholder with the Stage 1 public homepage.
- Use a light visual direction, not a black hero.
- Add restrained dynamic effects: soft grid, glow follow, floating particles, hover lift.
- Add public route placeholders for `/projects` and `/services`.
- Keep content static and typed for this stage.

Out of scope:

- Auth/login UI.
- Admin console.
- Real payment.
- User accounts.
- Full knowledge detail pages.
- Real tool execution.
- Heavy WebGL or 3D.

## File Structure

Create:

- `src/app/(public)/projects/page.tsx`  
  Placeholder route for project showcase.

- `src/app/(public)/services/page.tsx`  
  Placeholder route for SOP service.

- `src/components/home/home-data.ts`  
  Typed static content for navigation, entrances, featured knowledge, tools, projects, and contact actions.

- `src/components/home/ambient-field.tsx`  
  Client component for light grid, soft cursor glow, and lightweight particles. Must disable cursor tracking on coarse pointers/mobile.

- `src/components/home/site-header.tsx`  
  Header navigation for public homepage.

- `src/components/home/hero-section.tsx`  
  Hero text, primary actions, and visual summary.

- `src/components/home/entrance-grid.tsx`  
  Knowledge/tool/project/service entrance cards.

- `src/components/home/featured-section.tsx`  
  Featured knowledge, tools, and project cards.

- `src/components/home/contact-section.tsx`  
  Contact and conversion section.

- `src/components/ui/card.tsx`  
  Local shadcn-style card primitive.

- `src/components/ui/badge.tsx`  
  Local shadcn-style badge primitive.

Modify:

- `src/app/(public)/page.tsx`  
  Compose the homepage from the new section components.

- `src/app/globals.css`  
  Add light theme tokens, background helpers, animation keyframes, and reduced-motion handling.

- `src/app/layout.tsx`  
  Update metadata to match the Stage 1 homepage positioning.

Do not modify:

- Prisma models.
- Auth-related code.
- Admin route behavior.

---

### Task 1: Add Static Homepage Data

**Files:**

- Create: `src/components/home/home-data.ts`

- [ ] **Step 1: Create typed content config**

Add exports for:

```ts
export type EntranceItem = {
  title: string;
  description: string;
  href: string;
  status: "已开放" | "即将上线" | "内测中";
  accent: "blue" | "cyan" | "violet" | "emerald";
};

export type FeaturedItem = {
  title: string;
  description: string;
  meta: string;
  href: string;
  status?: string;
};
```

Add arrays:

- `navItems`: 知识库, 工具, 项目, SOP 服务, 联系.
- `entrances`: knowledge, tools, projects, services.
- `featuredKnowledge`: 2 items.
- `featuredTools`: 2 items.
- `featuredProjects`: 1 item.
- `contactActions`: 微信咨询, 抖音/小红书关注, GitHub/邮箱.

- [ ] **Step 2: Keep copy aligned with positioning**

Use copy that expresses:

```text
AI 实践者
一线做东西
数字系统构建
工具、知识、项目和 SOP 服务都在这里生长
```

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/home-data.ts
git commit -m "feat: add homepage content config"
```

---

### Task 2: Add UI Primitives

**Files:**

- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`

- [ ] **Step 1: Implement Card primitive**

Create `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` using `cn`.

Use stable radius, border, and light surface styles:

```ts
"rounded-lg border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur"
```

- [ ] **Step 2: Implement Badge primitive**

Create variants:

- `default`
- `secondary`
- `success`
- `warning`

Keep badge compact and readable.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/badge.tsx
git commit -m "feat: add homepage UI primitives"
```

---

### Task 3: Add Ambient Light Interaction

**Files:**

- Create: `src/components/home/ambient-field.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Implement client component**

`ambient-field.tsx` must start with:

```ts
"use client";
```

Behavior:

- Render soft light grid and decorative particles.
- Track pointer position only when `window.matchMedia("(pointer: fine)")` matches.
- Store pointer coordinates in CSS variables `--pointer-x` and `--pointer-y`.
- No database, network, or external animation library.

- [ ] **Step 2: Add CSS helpers**

In `globals.css`, add:

- `.ambient-grid`
- `.ambient-glow`
- `.float-slow`
- `@keyframes float`
- `@media (prefers-reduced-motion: reduce)` to disable animation.

- [ ] **Step 3: Verify mobile-safe behavior**

Check that the component renders without `window` during SSR and only accesses browser APIs inside `useEffect`.

- [ ] **Step 4: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ambient-field.tsx src/app/globals.css
git commit -m "feat: add light ambient homepage effect"
```

---

### Task 4: Build Homepage Sections

**Files:**

- Create: `src/components/home/site-header.tsx`
- Create: `src/components/home/hero-section.tsx`
- Create: `src/components/home/entrance-grid.tsx`
- Create: `src/components/home/featured-section.tsx`
- Create: `src/components/home/contact-section.tsx`

- [ ] **Step 1: Implement SiteHeader**

Header requirements:

- Logo/system name.
- Navigation: 知识库, 工具, 项目, SOP 服务, 联系.
- Light translucent background.
- Responsive: collapse nav into horizontal wrap or compact links, no hamburger required for Stage 1.

- [ ] **Step 2: Implement HeroSection**

Hero requirements:

- P0 headline expressing AI practitioner credibility.
- Supporting copy explaining the site purpose.
- Primary action: 查看自研工具.
- Secondary action: 阅读知识库.
- Tertiary text/link: SOP 咨询.
- Include a small visual module showing "Knowledge / Tools / Projects / SOP".

- [ ] **Step 3: Implement EntranceGrid**

Render four entrance cards from `entrances`.

Each card:

- Title.
- Description.
- Status badge.
- Clear href.
- Hover lift and light accent.

- [ ] **Step 4: Implement FeaturedSection**

Render:

- Featured knowledge 2 items.
- Featured tools 2 items.
- Featured project 1 item.

Empty state rule:

- If an array is empty, render "即将上线" instead of blank space.

- [ ] **Step 5: Implement ContactSection**

Render:

- SOP service positioning.
- Contact actions from config.
- Clear conversion text without hard sales tone.

- [ ] **Step 6: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/home
git commit -m "feat: add homepage sections"
```

---

### Task 5: Compose Public Homepage and Placeholder Routes

**Files:**

- Modify: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/projects/page.tsx`
- Create: `src/app/(public)/services/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Compose homepage**

Use:

- `AmbientField`
- `SiteHeader`
- `HeroSection`
- `EntranceGrid`
- `FeaturedSection`
- `ContactSection`

Ensure:

- Main element has light background.
- No black hero.
- Sections have stable spacing.
- Text does not overlap at mobile widths.

- [ ] **Step 2: Add `/projects` placeholder**

Placeholder must explain:

```text
项目展示即将上线，后续展示正在构建的工具、产品和案例。
```

- [ ] **Step 3: Add `/services` placeholder**

Placeholder must explain:

```text
SOP 服务即将上线，后续展示自动化流程、企业服务和咨询入口。
```

- [ ] **Step 4: Update metadata**

Title:

```text
YXY AI Practice | AI 实践者数字据点
```

Description:

```text
一个 AI 实践者的公开首页，连接知识库、自研工具、项目展示和 SOP 服务。
```

- [ ] **Step 5: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/home src/app/layout.tsx
git commit -m "feat: compose stage 1 public homepage"
```

---

### Task 6: Visual QA and Stage Documentation

**Files:**

- Modify: `docs/07-stage-01-homepage-ui-blueprint.md`

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

Expected:

```text
Local: http://localhost:3000
```

- [ ] **Step 2: Manual browser QA**

Check:

- `/`
- `/knowledge`
- `/tools`
- `/projects`
- `/services`

Viewport checks:

- Desktop width.
- Mobile/narrow width.

Acceptance checks:

- First screen is not black.
- First screen has premium light AI/product feel.
- Entrance matrix is visible.
- Dynamic effect is present but readable.
- No text overlaps.
- Placeholder routes are reachable.

- [ ] **Step 3: Update UI blueprint QA notes**

Add a "Implementation QA" section to `docs/07-stage-01-homepage-ui-blueprint.md` with:

- Verified routes.
- Verified commands.
- Known limitations.

- [ ] **Step 4: Final verification**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 5: Commit and push**

```bash
git add docs/07-stage-01-homepage-ui-blueprint.md
git commit -m "docs: record stage 1 homepage QA"
git push
```

---

## Completion Criteria

- Homepage `/` implements the Stage 1 design.
- `/projects` and `/services` routes exist.
- No black main visual.
- Clear entry points exist for knowledge, tools, projects, SOP services, and contact.
- Static data is typed and isolated.
- Dynamic effects are light and mobile-safe.
- `pnpm lint` passes.
- `pnpm build` passes.
- Changes are committed and pushed.

