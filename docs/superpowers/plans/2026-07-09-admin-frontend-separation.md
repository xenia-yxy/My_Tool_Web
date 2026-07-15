# Admin Frontend Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split admin UI into a local-only frontend that calls production backend APIs, while production deployment exposes only the public site and backend APIs.

**Architecture:** Keep the existing public Next.js app as the production server and add token-protected `/api/admin/*` endpoints for admin operations. Add a separate local Next.js app under `admin-frontend/` that runs on port `3001` and calls the production server with `Authorization: Bearer <ADMIN_API_TOKEN>`. The Docker production image removes `src/app/admin` and admin components before building so admin pages are not shipped in the runtime app.

**Tech Stack:** Next.js, React, TypeScript, Prisma, Docker, token-based API auth, CORS.

---

### Task 1: Admin API Auth Boundary

**Files:**
- Create: `src/server/admin-api-auth.ts`
- Create: `tests/admin-api-auth.test.ts`
- Modify: `package.json`

- [ ] Add tests for bearer token parsing, CORS allow-list, unauthorized responses, and preflight headers.
- [ ] Implement `getAdminApiCorsHeaders`, `isAuthorizedAdminApiRequest`, `createAdminApiUnauthorizedResponse`, and `createAdminApiPreflightResponse`.
- [ ] Add the test file to the root test script.

### Task 2: Admin Backend APIs

**Files:**
- Create: `src/server/admin-content-api.ts`
- Create: `src/app/api/admin/health/route.ts`
- Create: `src/app/api/admin/dashboard/route.ts`
- Create: `src/app/api/admin/content/route.ts`
- Create: `src/app/api/admin/content/[id]/route.ts`
- Create: `src/app/api/admin/content/[id]/status/route.ts`
- Create: `tests/admin-content-api.test.ts`
- Modify: `package.json`

- [ ] Add tests for JSON input normalization and status transitions.
- [ ] Implement content CRUD helpers that reuse existing content validation.
- [ ] Implement token-protected API routes with CORS `OPTIONS` handlers.

### Task 3: Local Admin Frontend

**Files:**
- Create: `admin-frontend/app/layout.tsx`
- Create: `admin-frontend/app/page.tsx`
- Create: `admin-frontend/app/content/page.tsx`
- Create: `admin-frontend/app/content/new/page.tsx`
- Create: `admin-frontend/app/content/[id]/page.tsx`
- Create: `admin-frontend/app/globals.css`
- Create: `admin-frontend/lib/admin-api.ts`
- Create: `admin-frontend/next.config.ts`
- Create: `admin-frontend/tsconfig.json`
- Modify: `package.json`

- [ ] Add `admin:dev` and `admin:build` scripts.
- [ ] Build a local admin shell with server URL and token read from env vars.
- [ ] Implement dashboard, content list, create, edit, publish, withdraw, and delete flows through `/api/admin/*`.

### Task 4: Production Admin Page Exclusion

**Files:**
- Modify: `Dockerfile`
- Modify: `.env.example`

- [ ] Add `ADMIN_API_TOKEN` and `ADMIN_API_ALLOWED_ORIGINS` examples.
- [ ] Remove `src/app/admin` and `src/components/admin` during the production Docker build before `pnpm build`.
- [ ] Verify the root app still builds and the local admin app builds.

### Task 5: Documentation and Verification

**Files:**
- Modify: `docs/08-production-deployment.md`
- Modify: `.deploy-private/my-web-production-private.md`

- [ ] Document the separated deployment model.
- [ ] Document local admin startup commands and private env requirements.
- [ ] Run tests, lint, public build, admin build, and production admin exclusion simulation.

