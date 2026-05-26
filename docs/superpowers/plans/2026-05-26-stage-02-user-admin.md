# Stage 02 User Login Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the stage 2 MVP that separates public user login from the independent admin management area, and lets admins publish knowledge notes to the public site.

**Architecture:** Keep one Next.js App Router project. Use `/login` and `/account` for the public user side, route-grouped `/admin` pages for the admin side, NextAuth Credentials for session handling, Prisma/PostgreSQL for users and notes, and server-side guards for all protected routes and writes.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, NextAuth v4 Credentials, Prisma/PostgreSQL, react-markdown, zod, Node `crypto.scrypt`, Node test runner via `tsx --test`.

---

## Source Docs

- `docs/08-stage-02-user-login-admin-ne-ti-ni-te.md`
- `docs/09-stage-02-user-login-admin-design.md`
- `docs/01-mvp-prd.md`
- `docs/02-technical-architecture.md`
- `docs/04-framework-design.md`

## Scope Boundary

Must build:

- Public user login at `/login`.
- Minimal logged-in account page at `/account`.
- Admin login at `/admin/login`.
- Protected admin dashboard under `/admin`.
- Admin note list, create, edit, publish, withdraw, and delete.
- Public knowledge list and detail pages backed by published notes.
- Server-side role checks for admin pages and admin writes.

Must not build:

- Registration.
- OAuth.
- Password reset.
- Payment or membership.
- Comments, likes, favorites.
- Uploads.
- Real AI/RAG assistant integration.
- Visual homepage builder.

## File Structure

Create:

- `src/lib/password.ts`  
  Pure password hashing and verification helper using Node `crypto.scrypt`.

- `src/lib/password.test.ts`  
  Node tests for password hashing, verification, and wrong-password rejection.

- `src/lib/auth/options.ts`  
  NextAuth configuration with Credentials provider, role-aware login scope, JWT callbacks, and session shaping.

- `src/lib/auth/guards.ts`  
  Server helpers for `getCurrentUser`, `requireUser`, and `requireAdmin`.

- `src/types/next-auth.d.ts`  
  Type augmentation for `Session.user.id` and `Session.user.role`.

- `src/app/api/auth/[...nextauth]/route.ts`  
  NextAuth route handler.

- `src/components/auth/login-form.tsx`  
  Shared client login form for public and admin login pages.

- `src/components/auth/logout-button.tsx`  
  Shared client sign-out button.

- `src/app/login/page.tsx`  
  Public user login page.

- `src/app/account/page.tsx`  
  Minimal protected user account page.

- `src/app/admin/(auth)/login/page.tsx`  
  Admin login page. URL remains `/admin/login`.

- `src/app/admin/(dashboard)/layout.tsx`  
  Protected admin shell layout. URL remains `/admin/*`.

- `src/app/admin/(dashboard)/page.tsx`  
  Admin dashboard.

- `src/app/admin/(dashboard)/notes/page.tsx`  
  Admin note list.

- `src/app/admin/(dashboard)/notes/new/page.tsx`  
  Admin note creation page.

- `src/app/admin/(dashboard)/notes/[id]/page.tsx`  
  Admin note edit page.

- `src/app/admin/(dashboard)/notes/actions.ts`  
  Server actions for note create, update, publish, withdraw, and delete.

- `src/components/admin/admin-shell.tsx`  
  Admin sidebar, header, and content shell.

- `src/components/admin/note-form.tsx`  
  Client form using server actions and preserving input on validation errors.

- `src/components/admin/note-row-actions.tsx`  
  Client buttons for publish, withdraw, delete, and delete confirmation.

- `src/components/admin/note-status-badge.tsx`  
  Small visual status badge for `PRIVATE` and `PUBLISHED`.

- `src/lib/notes/validation.ts`  
  Zod schema and normalization for note form data.

- `src/lib/notes/validation.test.ts`  
  Node tests for note validation and slug normalization.

- `src/app/(public)/knowledge/[slug]/page.tsx`  
  Public published note detail page.

- `prisma/migrations/20260526090000_add_user_role/migration.sql`  
  Add `USER` enum value.

- `prisma/migrations/20260526090100_user_role_default/migration.sql`  
  Change `User.role` default to `USER`.

Modify:

- `prisma/schema.prisma`  
  Add `USER` to `Role` and change `User.role` default from `ADMIN` to `USER`.

- `prisma/seed.ts`  
  Hash passwords, seed one admin, seed one front-end user, and keep existing seed notes under the admin author.

- `.env.example`  
  Add front-end user seed variables.

- `src/components/home/site-header.tsx`  
  Change public header login link from `/admin` to `/login`.

- `src/app/(public)/knowledge/page.tsx`  
  Replace placeholder with published note list from Prisma.

Delete:

- `src/app/admin/page.tsx`  
  Replace with route-grouped dashboard page at `src/app/admin/(dashboard)/page.tsx`.

Do not modify:

- Stage 1 homepage visual components except the header login link.
- Floating assistant behavior.
- Public tools/projects/services pages.

---

### Task 1: Add Password Hashing Foundation

**Files:**

- Create: `src/lib/password.test.ts`
- Create: `src/lib/password.ts`

- [ ] **Step 1: Write failing password tests**

Create `src/lib/password.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password";

test("hashPassword returns a non-plain-text encoded hash", async () => {
  const hash = await hashPassword("correct-password");

  assert.notEqual(hash, "correct-password");
  assert.match(hash, /^scrypt:/);
});

test("verifyPassword accepts the correct password", async () => {
  const hash = await hashPassword("correct-password");

  assert.equal(await verifyPassword("correct-password", hash), true);
});

test("verifyPassword rejects the wrong password", async () => {
  const hash = await hashPassword("correct-password");

  assert.equal(await verifyPassword("wrong-password", hash), false);
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm exec tsx --test src/lib/password.test.ts
```

Expected: FAIL because `src/lib/password.ts` does not exist.

- [ ] **Step 3: Implement password helper**

Create `src/lib/password.ts` using `node:crypto`:

```ts
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [scheme, salt, hash] = encodedHash.split(":");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const derivedKey = (await scrypt(password, salt, hashBuffer.length)) as Buffer;

  if (hashBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, derivedKey);
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
pnpm exec tsx --test src/lib/password.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/password.ts src/lib/password.test.ts
git commit -m "feat: add password hashing helper"
```

---

### Task 2: Extend Role Model and Seed Users

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260526090000_add_user_role/migration.sql`
- Create: `prisma/migrations/20260526090100_user_role_default/migration.sql`
- Modify: `prisma/seed.ts`
- Modify: `.env.example`

- [ ] **Step 1: Update Prisma schema role enum**

Change:

```prisma
enum Role {
  ADMIN
}
```

To:

```prisma
enum Role {
  ADMIN
  USER
}
```

Change:

```prisma
role Role @default(ADMIN)
```

To:

```prisma
role Role @default(USER)
```

- [ ] **Step 2: Add migrations**

Create `prisma/migrations/20260526090000_add_user_role/migration.sql`:

```sql
ALTER TYPE "Role" ADD VALUE 'USER';
```

Create `prisma/migrations/20260526090100_user_role_default/migration.sql`:

```sql
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
```

Use two migrations so PostgreSQL can commit the enum value before the default uses it.

- [ ] **Step 3: Update seed environment example**

Add to `.env.example`:

```env
USER_EMAIL="user@example.com"
USER_PASSWORD="change-this-user-password"
```

- [ ] **Step 4: Update seed script**

Update `prisma/seed.ts` to:

- Import `hashPassword` from `../src/lib/password`.
- Read `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD`.
- Upsert admin with `role: "ADMIN"` and hashed password.
- Upsert front-end user with `role: "USER"` and hashed password.
- Keep seed notes attached to the admin.

Critical update shape:

```ts
const adminPasswordHash = await hashPassword(adminPassword);
const userPasswordHash = await hashPassword(userPassword);

await prisma.user.upsert({
  where: { email: adminEmail },
  update: {
    name: "Admin",
    role: "ADMIN",
    passwordHash: adminPasswordHash,
  },
  create: {
    email: adminEmail,
    name: "Admin",
    role: "ADMIN",
    passwordHash: adminPasswordHash,
    notes: { create: seedNotes },
  },
});

await prisma.user.upsert({
  where: { email: userEmail },
  update: {
    name: "Demo User",
    role: "USER",
    passwordHash: userPasswordHash,
  },
  create: {
    email: userEmail,
    name: "Demo User",
    role: "USER",
    passwordHash: userPasswordHash,
  },
});
```

- [ ] **Step 5: Regenerate Prisma client**

Run:

```bash
pnpm prisma:generate
```

Expected: generated Prisma client succeeds.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm exec tsx --test src/lib/password.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260526090000_add_user_role/migration.sql prisma/migrations/20260526090100_user_role_default/migration.sql prisma/seed.ts .env.example
git commit -m "feat: add user role and seed accounts"
```

---

### Task 3: Add NextAuth Credentials Auth

**Files:**

- Create: `src/lib/auth/options.ts`
- Create: `src/lib/auth/guards.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create auth options**

Create a Credentials provider that accepts:

- `email`
- `password`
- `scope`, either `user` or `admin`

Authorize rules:

- Email must match an existing user.
- User must have `passwordHash`.
- Password must verify with `verifyPassword`.
- `scope === "admin"` requires `role === "ADMIN"`.
- `scope === "user"` requires `role === "USER"`.

Keep `session.strategy = "jwt"` because Credentials provider works cleanly with JWT sessions in NextAuth v4.

Callbacks must copy `id` and `role` from user to token and from token to session.

- [ ] **Step 2: Add server guards**

Create `src/lib/auth/guards.ts`:

```ts
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  return user;
}
```

- [ ] **Step 3: Add NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Add type augmentation**

Create `src/types/next-auth.d.ts` so TypeScript knows:

```ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

Also augment `next-auth/jwt` for `JWT.id` and `JWT.role`.

- [ ] **Step 5: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/options.ts src/lib/auth/guards.ts src/types/next-auth.d.ts src/app/api/auth/[...nextauth]/route.ts
git commit -m "feat: add credentials authentication"
```

---

### Task 4: Build Public Login and Account Pages

**Files:**

- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/logout-button.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/account/page.tsx`
- Modify: `src/components/home/site-header.tsx`

- [ ] **Step 1: Build shared login form**

`login-form.tsx` must be a client component using `signIn` from `next-auth/react`.

Props:

```ts
type LoginFormProps = {
  scope: "user" | "admin";
  title: string;
  description: string;
  callbackUrl: string;
};
```

Behavior:

- On submit, call `signIn("credentials", { email, password, scope, redirect: false, callbackUrl })`.
- Show a clear error when credentials fail.
- On success, `router.push(callbackUrl)` and `router.refresh()`.

- [ ] **Step 2: Build logout button**

`logout-button.tsx` must be a client component using `signOut({ callbackUrl })`.

- [ ] **Step 3: Create `/login`**

Public login page:

- If current session exists with `role === "USER"`, redirect to `/account`.
- If current session exists with `role === "ADMIN"`, redirect to `/admin`.
- Otherwise render `LoginForm` with `scope="user"` and `callbackUrl="/account"`.

- [ ] **Step 4: Create `/account`**

Account page:

- Use `requireUser()`.
- Display user name/email and role.
- Include return-home link.
- Include `LogoutButton`.
- Keep future capability placeholders minimal.

- [ ] **Step 5: Update homepage header login link**

Change `src/components/home/site-header.tsx` login link:

```tsx
href="/admin"
```

To:

```tsx
href="/login"
```

- [ ] **Step 6: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/login-form.tsx src/components/auth/logout-button.tsx src/app/login/page.tsx src/app/account/page.tsx src/components/home/site-header.tsx
git commit -m "feat: add public user login flow"
```

---

### Task 5: Build Protected Admin Shell

**Files:**

- Delete: `src/app/admin/page.tsx`
- Create: `src/app/admin/(auth)/login/page.tsx`
- Create: `src/app/admin/(dashboard)/layout.tsx`
- Create: `src/app/admin/(dashboard)/page.tsx`
- Create: `src/components/admin/admin-shell.tsx`

- [ ] **Step 1: Delete old admin placeholder**

Remove `src/app/admin/page.tsx`. The `/admin` route will be replaced by route group page `src/app/admin/(dashboard)/page.tsx`.

- [ ] **Step 2: Create admin login page**

`src/app/admin/(auth)/login/page.tsx`:

- If current session role is `ADMIN`, redirect to `/admin`.
- Otherwise render `LoginForm` with `scope="admin"` and `callbackUrl="/admin"`.
- Do not use public homepage header or assistant.

- [ ] **Step 3: Create protected dashboard layout**

`src/app/admin/(dashboard)/layout.tsx`:

- Call `requireAdmin()` server-side.
- Render `AdminShell`.
- Pass current admin identity to shell.

- [ ] **Step 4: Create admin shell**

`AdminShell` should contain:

- Sidebar links: `总览`, `知识库内容`, `用户管理`, `站点配置`.
- Mark P1 placeholders visually for `用户管理` and `站点配置`.
- Header with current admin email and logout button.
- Main content region.

- [ ] **Step 5: Create admin dashboard**

`src/app/admin/(dashboard)/page.tsx`:

- Query counts for all notes, published notes, private notes.
- Render compact dashboard cards.
- Link to `/admin/notes`.

- [ ] **Step 6: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin src/components/admin/admin-shell.tsx
git commit -m "feat: add protected admin shell"
```

---

### Task 6: Add Note Validation and Admin Actions

**Files:**

- Create: `src/lib/notes/validation.test.ts`
- Create: `src/lib/notes/validation.ts`
- Create: `src/app/admin/(dashboard)/notes/actions.ts`

- [ ] **Step 1: Write failing note validation tests**

Create tests for:

- Title is required.
- Slug is normalized to lowercase hyphenated form.
- Content is required.
- Invalid slug characters are rejected after normalization.

Run:

```bash
pnpm exec tsx --test src/lib/notes/validation.test.ts
```

Expected: FAIL because implementation does not exist.

- [ ] **Step 2: Implement validation**

Use `zod`:

```ts
export const noteInputSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(120),
  slug: z.string().trim().min(1, "slug 不能为空").max(120),
  excerpt: z.string().trim().max(240).optional(),
  content: z.string().trim().min(1, "正文不能为空"),
});
```

Add `normalizeSlug(value: string)` and `parseNoteFormData(formData: FormData)`.

- [ ] **Step 3: Run validation tests**

Run:

```bash
pnpm exec tsx --test src/lib/notes/validation.test.ts
```

Expected: PASS.

- [ ] **Step 4: Implement admin note server actions**

Create actions with `"use server"`:

- `createNoteAction(previousState, formData)`
- `updateNoteAction(noteId, previousState, formData)`
- `publishNoteAction(noteId)`
- `withdrawNoteAction(noteId)`
- `deleteNoteAction(noteId)`

Every action must call `requireAdmin()` before writing.

Rules:

- Create/update validate input through `parseNoteFormData`.
- Create uses current admin id as `authorId`.
- Slug uniqueness errors must return a form error instead of crashing.
- Publish sets `status: "PUBLISHED"` and sets `publishedAt` if missing.
- Withdraw sets `status: "PRIVATE"` and `publishedAt: null`.
- Delete removes the note.
- Mutations call `revalidatePath("/admin/notes")` and relevant public knowledge paths.

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
pnpm exec tsx --test src/lib/notes/validation.test.ts
pnpm lint
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/notes/validation.ts src/lib/notes/validation.test.ts src/app/admin/'(dashboard)'/notes/actions.ts
git commit -m "feat: add admin note actions"
```

PowerShell note: quote route-group paths that include parentheses.

---

### Task 7: Build Admin Note Management UI

**Files:**

- Create: `src/components/admin/note-form.tsx`
- Create: `src/components/admin/note-row-actions.tsx`
- Create: `src/components/admin/note-status-badge.tsx`
- Create: `src/app/admin/(dashboard)/notes/page.tsx`
- Create: `src/app/admin/(dashboard)/notes/new/page.tsx`
- Create: `src/app/admin/(dashboard)/notes/[id]/page.tsx`

- [ ] **Step 1: Build status badge**

Map:

- `PRIVATE` -> `私密`
- `PUBLISHED` -> `已发布`

- [ ] **Step 2: Build note form**

`NoteForm` must:

- Use `useActionState`.
- Preserve user input when validation fails.
- Render title, slug, excerpt, and content fields.
- Use textarea for content.
- Show returned error messages.
- Submit to create or update action depending on props.

- [ ] **Step 3: Build row actions**

`NoteRowActions` must:

- Render edit link.
- Render publish button for private notes.
- Render withdraw button for published notes.
- Render delete button with `window.confirm`.

- [ ] **Step 4: Build note list page**

`/admin/notes`:

- Query all notes ordered by `updatedAt desc`.
- Render table with title, slug, status, updated time, published time, actions.
- Include link to `/admin/notes/new`.
- Show empty state when no notes exist.

- [ ] **Step 5: Build new note page**

`/admin/notes/new`:

- Render `NoteForm` in create mode.

- [ ] **Step 6: Build edit note page**

`/admin/notes/[id]`:

- Query note by id.
- Use `notFound()` if missing.
- Render `NoteForm` in update mode.

- [ ] **Step 7: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin src/app/admin
git commit -m "feat: add admin note management"
```

---

### Task 8: Connect Public Knowledge Pages

**Files:**

- Modify: `src/app/(public)/knowledge/page.tsx`
- Create: `src/app/(public)/knowledge/[slug]/page.tsx`

- [ ] **Step 1: Replace knowledge list placeholder**

`/knowledge` must:

- Query only `status: "PUBLISHED"`.
- Order by `publishedAt desc`.
- Show title, excerpt, published date, and link to detail page.
- Show empty state when no published notes exist.

- [ ] **Step 2: Build knowledge detail page**

`/knowledge/[slug]` must:

- Query by slug and `status: "PUBLISHED"`.
- Return `notFound()` for missing or private notes.
- Render title, excerpt, published date.
- Render markdown content with `react-markdown`.

- [ ] **Step 3: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(public)'/knowledge
git commit -m "feat: publish notes to public knowledge"
```

PowerShell note: quote route-group paths that include parentheses.

---

### Task 9: End-to-End Verification

**Files:**

- No required edits unless verification exposes defects.

- [ ] **Step 1: Run all local tests**

Run:

```bash
pnpm exec tsx --test src/lib/password.test.ts src/lib/notes/validation.test.ts src/components/assistant/assistant-content.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Run Prisma generation**

Run:

```bash
pnpm prisma:generate
```

Expected: PASS.

- [ ] **Step 5: Verify database flow when DATABASE_URL is available**

Run:

```bash
pnpm prisma:migrate
pnpm prisma:seed
pnpm verify:prisma
```

Expected:

- Migration succeeds.
- Seed creates one admin and one user.
- Prisma verification prints connected user and note counts.

- [ ] **Step 6: Start dev server**

Run:

```bash
pnpm dev
```

Expected: server starts on an available localhost port.

- [ ] **Step 7: Manual browser acceptance checks**

Check:

- `/` header login goes to `/login`.
- `/login` accepts seeded user credentials and goes to `/account`.
- `/account` rejects unauthenticated access.
- `/admin/login` accepts seeded admin credentials and goes to `/admin`.
- `/admin` rejects unauthenticated access.
- User credentials cannot log into `/admin/login`.
- Admin can create a private note.
- Private note does not appear in `/knowledge`.
- Admin can publish the note.
- Published note appears in `/knowledge`.
- Published note detail opens at `/knowledge/[slug]`.
- Admin can withdraw the note.
- Withdrawn note no longer appears publicly.
- Admin can delete the note after confirmation.

- [ ] **Step 8: Final commit if fixes were needed**

If verification required fixes:

```bash
git add <changed-files>
git commit -m "fix: stabilize stage 2 user admin flow"
```

---

## Implementation Notes

- Use @superpowers:test-driven-development for implementation tasks that add password or validation logic.
- Use @superpowers:verification-before-completion before claiming the stage is complete.
- Do not use client-only checks as the source of truth for authorization.
- Do not place `/admin/login` under the protected dashboard layout.
- Keep admin UI denser and more operational than the public homepage.
- Keep public login clearly separate from admin login in copy, route, and redirect behavior.
