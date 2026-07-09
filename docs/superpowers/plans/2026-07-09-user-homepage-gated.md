# Xenia 用户端公开首页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/` 改为 Xenia 的简洁个人 AI 实践网站公开首页，只保留品牌、个人简介和登录入口；工具、知识库、项目、服务、用户中心均登录后可见。

**Architecture:** 复用现有 Next.js App Router、NextAuth 会话和 `requireSignedInUser()`。新增一个小型登录跳转 helper，保证未登录访问受保护页面时带上 `callbackUrl`；首页则减少组件渲染，只保留 `SiteHeader` 和 `HeroSection`。

**Tech Stack:** Next.js App Router, TypeScript, NextAuth/Auth.js, Tailwind CSS, Node test runner.

---

## File Structure

- Create `src/server/user-auth-redirects.ts`: 负责标准化用户端 callback path，并生成 `/login?callbackUrl=...`。
- Create `tests/user-auth-redirects.test.ts`: 覆盖安全 callback 和登录链接生成。
- Modify `package.json`: 把新测试加入 `pnpm test`。
- Modify `src/server/auth.ts`: 让 `requireSignedInUser()` 支持传入目标路径。
- Modify `src/app/login/page.tsx`: 已登录用户访问登录页时按 `callbackUrl` 返回目标页。
- Modify protected pages:
  - `src/app/tools/page.tsx`
  - `src/app/tools/directory/page.tsx`
  - `src/app/tools/ai-image/page.tsx`
  - `src/app/tools/outfit-image/page.tsx`
  - `src/app/(public)/knowledge/page.tsx`
  - `src/app/(public)/knowledge/[slug]/page.tsx`
  - `src/app/(public)/projects/page.tsx`
  - `src/app/(public)/services/page.tsx`
  - `src/app/account/page.tsx`
- Modify homepage:
  - `src/app/(public)/page.tsx`: 只渲染首页背景、顶部和首屏。
  - `src/components/home/site-header.tsx`: 顶部只保留 `Xenia`、副标题和登录。
  - `src/components/home/hero-section.tsx`: 改为简洁个人网站首屏。
  - `src/app/layout.tsx`: 更新 metadata。

---

### Task 1: Add User Login Redirect Helper

**Files:**
- Create: `src/server/user-auth-redirects.ts`
- Create: `tests/user-auth-redirects.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing helper tests**

Create `tests/user-auth-redirects.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildUserLoginHref,
  normalizeUserCallbackPath,
} from "../src/server/user-auth-redirects";

test("normalizeUserCallbackPath accepts local absolute paths", () => {
  assert.equal(normalizeUserCallbackPath("/account"), "/account");
  assert.equal(normalizeUserCallbackPath("/tools"), "/tools");
  assert.equal(normalizeUserCallbackPath("/knowledge/article-1"), "/knowledge/article-1");
});

test("normalizeUserCallbackPath rejects unsafe or missing paths", () => {
  assert.equal(normalizeUserCallbackPath(undefined), "/account");
  assert.equal(normalizeUserCallbackPath(""), "/account");
  assert.equal(normalizeUserCallbackPath("https://example.com"), "/account");
  assert.equal(normalizeUserCallbackPath("//example.com"), "/account");
  assert.equal(normalizeUserCallbackPath(["/tools", "/account"]), "/tools");
});

test("buildUserLoginHref encodes callback URLs", () => {
  assert.equal(buildUserLoginHref("/account"), "/login?callbackUrl=%2Faccount");
  assert.equal(buildUserLoginHref("/tools"), "/login?callbackUrl=%2Ftools");
  assert.equal(
    buildUserLoginHref("/knowledge/article-1"),
    "/login?callbackUrl=%2Fknowledge%2Farticle-1",
  );
});
```

- [ ] **Step 2: Add the test file to `package.json`**

Change the `test` script to include `tests/user-auth-redirects.test.ts`:

```json
"test": "tsx --test tests/admin-credentials.test.ts tests/admin-login-security.test.ts tests/admin-navigation.test.ts tests/admin-seed-accounts.test.ts tests/auth-permissions.test.ts tests/ai-image-assets.test.ts tests/ai-image-tools.test.ts tests/content-assets.test.ts tests/password.test.ts tests/tool-directory.test.ts tests/user-auth-redirects.test.ts"
```

- [ ] **Step 3: Run the failing test**

Run:

```bash
pnpm test
```

Expected: FAIL because `src/server/user-auth-redirects.ts` does not exist.

- [ ] **Step 4: Implement the helper**

Create `src/server/user-auth-redirects.ts`:

```ts
const defaultUserCallbackPath = "/account";

export function normalizeUserCallbackPath(
  input?: string | string[],
  fallback = defaultUserCallbackPath,
) {
  const value = Array.isArray(input) ? input[0] : input;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function buildUserLoginHref(targetPath: string) {
  const callbackUrl = normalizeUserCallbackPath(targetPath);

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm test
```

Expected: PASS for the new helper tests and no regressions in existing tests.

- [ ] **Step 6: Commit**

```bash
git add package.json src/server/user-auth-redirects.ts tests/user-auth-redirects.test.ts
git commit -m "test: add user login redirect helpers"
```

---

### Task 2: Make Login Flow Preserve Callback Targets

**Files:**
- Modify: `src/server/auth.ts`
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Update `requireSignedInUser()`**

In `src/server/auth.ts`, add:

```ts
import { buildUserLoginHref } from "@/server/user-auth-redirects";
```

Replace `requireSignedInUser()` with:

```ts
export async function requireSignedInUser(callbackPath = "/account") {
  const session = await getAdminSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    redirect(buildUserLoginHref(callbackPath));
  }

  return session.user;
}
```

- [ ] **Step 2: Update `/login` callback behavior**

In `src/app/login/page.tsx`, add:

```ts
import { normalizeUserCallbackPath } from "@/server/user-auth-redirects";
```

Replace the page props and component body with:

```tsx
type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  const params = await searchParams;
  const callbackUrl = normalizeUserCallbackPath(params?.callbackUrl, "/account");

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/">
          返回首页
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold text-blue-700">Xenia</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            登录用户端
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            登录后进入个人工作区，查看仅登录后可见的内容和工具。
          </p>
        </div>
        <LoginForm defaultCallbackUrl={callbackUrl} submitLabel="登录" />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/server/auth.ts src/app/login/page.tsx
git commit -m "feat: preserve user login callback targets"
```

---

### Task 3: Gate User-Facing Inner Pages

**Files:**
- Modify: `src/app/tools/page.tsx`
- Modify: `src/app/tools/directory/page.tsx`
- Modify: `src/app/tools/ai-image/page.tsx`
- Modify: `src/app/tools/outfit-image/page.tsx`
- Modify: `src/app/(public)/knowledge/page.tsx`
- Modify: `src/app/(public)/knowledge/[slug]/page.tsx`
- Modify: `src/app/(public)/projects/page.tsx`
- Modify: `src/app/(public)/services/page.tsx`
- Modify: `src/app/account/page.tsx`

- [ ] **Step 1: Gate the tools index**

In `src/app/tools/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";
```

At the top of `ToolsPage()`:

```tsx
export default async function ToolsPage() {
  await requireSignedInUser("/tools");

  return (
```

- [ ] **Step 2: Gate the tool directory**

In `src/app/tools/directory/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";
```

At the top of `ToolDirectoryPage()`:

```tsx
export default async function ToolDirectoryPage() {
  await requireSignedInUser("/tools/directory");

  return (
```

- [ ] **Step 3: Preserve callbacks on existing tool pages**

In `src/app/tools/ai-image/page.tsx`, change:

```ts
await requireSignedInUser();
```

to:

```ts
await requireSignedInUser("/tools/ai-image");
```

In `src/app/tools/outfit-image/page.tsx`, change:

```ts
await requireSignedInUser();
```

to:

```ts
await requireSignedInUser("/tools/outfit-image");
```

- [ ] **Step 4: Gate knowledge pages**

In `src/app/(public)/knowledge/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";
```

At the top of `KnowledgePage()`:

```tsx
export default async function KnowledgePage() {
  await requireSignedInUser("/knowledge");
  const notes = await listPublishedContentAssets();

  return (
```

In `src/app/(public)/knowledge/[slug]/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";
```

After reading `slug`, add:

```tsx
  await requireSignedInUser(`/knowledge/${slug}`);
```

- [ ] **Step 5: Gate projects, services, and account**

In `src/app/(public)/projects/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";
```

At the top of `ProjectsPage()`:

```tsx
export default async function ProjectsPage() {
  await requireSignedInUser("/projects");

  return (
```

In `src/app/(public)/services/page.tsx`, add:

```ts
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";
```

At the top of `ServicesPage()`:

```tsx
export default async function ServicesPage() {
  await requireSignedInUser("/services");

  return (
```

In `src/app/account/page.tsx`, change:

```ts
const user = await requireSignedInUser();
```

to:

```ts
const user = await requireSignedInUser("/account");
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
pnpm test
pnpm build
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/tools/page.tsx src/app/tools/directory/page.tsx src/app/tools/ai-image/page.tsx src/app/tools/outfit-image/page.tsx "src/app/(public)/knowledge/page.tsx" "src/app/(public)/knowledge/[slug]/page.tsx" "src/app/(public)/projects/page.tsx" "src/app/(public)/services/page.tsx" src/app/account/page.tsx
git commit -m "feat: gate user-facing pages behind login"
```

---

### Task 4: Simplify Public Homepage for Xenia

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/components/home/site-header.tsx`
- Modify: `src/components/home/hero-section.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Render only header and hero on `/`**

In `src/app/(public)/page.tsx`, remove imports for:

```ts
import { ContactSection } from "@/components/home/contact-section";
import { EntranceGrid } from "@/components/home/entrance-grid";
import { FeaturedSection } from "@/components/home/featured-section";
```

Keep:

```ts
import { AmbientField } from "@/components/home/ambient-field";
import { HeroSection } from "@/components/home/hero-section";
import { SiteHeader } from "@/components/home/site-header";
```

Change `HomePage()` to:

```tsx
export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AmbientField />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <HeroSection />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Simplify the public header**

In `src/components/home/site-header.tsx`, replace the file with:

```tsx
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { buildUserLoginHref } from "@/server/user-auth-redirects";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link
          className="group inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-950"
          href="/"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-colors group-hover:bg-blue-100">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span>Xenia</span>
            <span className="mt-1 text-xs font-normal text-slate-500">
              个人 AI 实践网站
            </span>
          </span>
        </Link>

        <Link
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          href={buildUserLoginHref("/account")}
        >
          <LogIn aria-hidden="true" className="h-4 w-4" />
          登录
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Replace hero with a simple personal-site first screen**

In `src/components/home/hero-section.tsx`, replace the file with:

```tsx
import Link from "next/link";
import { ArrowRight, BookOpenText, Boxes, PenLine, Sparkles } from "lucide-react";
import { buildUserLoginHref } from "@/server/user-auth-redirects";
import { Button } from "@/components/ui/button";

const notes = [
  {
    title: "AI 实践记录",
    description: "沉淀真实使用 AI 工具、工作流和内容流程时的观察。",
    icon: PenLine,
  },
  {
    title: "工具实验",
    description: "记录我对效率工具、图片工具和自动化能力的验证。",
    icon: Boxes,
  },
  {
    title: "数字系统构建",
    description: "把个人网站、内容资产和工作流程整理成长期系统。",
    icon: BookOpenText,
  },
];

export function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-14 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Xenia 的个人网站
          </div>

          <h1 className="hero-title max-w-full break-words text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            记录我的 AI 实践、工具实验和数字系统构建
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            这是 Xenia 的个人网站，用来沉淀我在 AI 工具、内容流程、产品实践和自动化系统中的真实记录。
            部分内容和工具仅登录后可见。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="h-11 px-5">
              <Link href={buildUserLoginHref("/account")}>
                登录
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-slate-500">登录后进入用户端。</p>
          </div>
        </div>

        <div className="grid gap-3">
          {notes.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="rounded-xl border border-white/80 bg-white/72 p-5 shadow-sm backdrop-blur-xl"
                key={item.title}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update metadata**

In `src/app/layout.tsx`, set:

```ts
export const metadata: Metadata = {
  title: "Xenia | 个人 AI 实践网站",
  description:
    "Xenia 的个人网站，用来记录 AI 实践、工具实验和数字系统构建。部分内容和工具仅登录后可见。",
};
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
pnpm test
pnpm build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/page.tsx" src/components/home/site-header.tsx src/components/home/hero-section.tsx src/app/layout.tsx
git commit -m "feat: simplify public homepage for xenia"
```

---

### Task 5: Manual Verification

**Files:**
- Modify only files from previous tasks if verification finds a concrete issue.

- [ ] **Step 1: Use the running dev server or start one**

If the existing dev server on `http://localhost:3001` is running, use it.

If it is not running, start:

```bash
node_modules/.bin/next.cmd dev -p 3001
```

Expected: Next.js prints `Ready` and serves `http://localhost:3001`.

- [ ] **Step 2: Verify public homepage**

Open:

```text
http://localhost:3001/
```

Expected:

- Brand shows `Xenia`.
- Subtitle shows `个人 AI 实践网站`.
- Header only has the login button.
- Header does not show tools, knowledge, projects, services, contact, or admin.
- Hero title is `记录我的 AI 实践、工具实验和数字系统构建`.
- Hero has one login button and no tool-specific action button.
- Homepage does not render entrance grid, featured tools, knowledge cards, project cards, or service CTA.

- [ ] **Step 3: Verify login link**

Click the homepage login button.

Expected:

- Browser navigates to `/login?callbackUrl=%2Faccount`.
- Login page brand copy uses `Xenia`.

- [ ] **Step 4: Verify protected routes while logged out**

Open while logged out:

```text
http://localhost:3001/tools
http://localhost:3001/tools/directory
http://localhost:3001/knowledge
http://localhost:3001/projects
http://localhost:3001/services
http://localhost:3001/account
```

Expected:

- Each route redirects into `/login`.
- Each redirect carries the corresponding `callbackUrl`.

- [ ] **Step 5: Verify admin isolation**

Inspect the homepage and login page.

Expected:

- No visible homepage link points to `/admin`.
- No public copy mentions admin or management backend.
- Admin users can still access admin through existing protected admin routes.

- [ ] **Step 6: Verify responsive layout**

Check viewport widths:

```text
390px
768px
1440px
```

Expected:

- No horizontal overflow.
- Header brand and login button do not overlap.
- Hero title and description remain readable.
- Three explanation cards stack cleanly on mobile.

- [ ] **Step 7: Final commands**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all PASS.

- [ ] **Step 8: Commit verification polish if needed**

If verification required polish changes:

```bash
git add src
git commit -m "fix: polish xenia public homepage"
```

If no polish changes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Xenia brand and personal-site positioning are covered by Task 4.
- Public homepage simplification is covered by Task 4 and Task 5.
- Removal of public functional navigation is covered by Task 4.
- Login-gated tools, knowledge, projects, services, and account pages are covered by Task 3.
- Callback login behavior is covered by Tasks 1 and 2.
- Admin isolation is covered by Tasks 3, 4, and 5.
- Mobile and visual checks are covered by Task 5.

Placeholder scan:

- The plan has no placeholder tasks or missing implementation details.
- Code-changing steps include concrete code or exact replacement guidance.

Type consistency:

- `normalizeUserCallbackPath()` and `buildUserLoginHref()` are introduced in Task 1 and reused consistently.
- `requireSignedInUser(callbackPath = "/account")` remains backward compatible.
- Homepage no longer depends on `home-data.ts` for public navigation.
