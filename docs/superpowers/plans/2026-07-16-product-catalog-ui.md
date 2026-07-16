# Product Catalog UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a standalone, user-scoped product catalog that displays multi-image products without reading or writing the existing material library.

**Architecture:** Product list and editor routes consume the dedicated Product, ProductCategory, and ProductImage APIs. Image files first use the existing upload endpoint as storage only; a later explicit copy action will create independent material records, preserving the separation from the material library.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Tailwind CSS, existing image upload API.

---

### Task 1: Prove that product routes are visible

**Files:**
- Create: `src/app/tools/products/page.tsx`
- Create: `src/components/tools/product-catalog/product-catalog-page.tsx`
- Modify: `tests/product-catalog.test.ts`

- [ ] Add a source-level failing test that requires the list route and product card fields: primary image, category, image count, AI analysis state, search, and category filter.
- [ ] Run `pnpm exec tsx --test tests/product-catalog.test.ts` and confirm failure because no list page exists.
- [ ] Implement list loading from `/api/tools/products` and `/api/tools/product-categories`, then render loading, empty, error, and populated states.
- [ ] Re-run the test and commit the visible catalog page.

### Task 2: Create the product editor and image collection flow

**Files:**
- Create: `src/app/tools/products/new/page.tsx`
- Create: `src/app/tools/products/[id]/page.tsx`
- Create: `src/components/tools/product-catalog/product-editor.tsx`
- Modify: `src/app/api/tools/product-categories/[id]/route.ts`
- Modify: `tests/product-catalog.test.ts`

- [ ] Add failing tests for one to twelve images, manual primary-image selection, and category update/delete routes.
- [ ] Implement the editor with product data fields, upload previews, image removal, primary-image controls, save, detail load, and category management.
- [ ] Implement category PATCH and DELETE with current-user isolation.
- [ ] Run focused tests and lint.

### Task 3: Connect controlled AI analysis and material export

**Files:**
- Create: `src/app/api/tools/products/[id]/analyze/route.ts`
- Create: `src/app/api/tools/products/[id]/copy-to-materials/route.ts`
- Modify: `src/server/product-catalog.ts`
- Modify: `tests/product-catalog.test.ts`

- [ ] Add failing tests that analysis is only triggered by an explicit request and image export uses a new material record.
- [ ] Implement multi-image vision analysis and editable analysis persistence.
- [ ] Implement explicit copy of selected product images to independent material entries.
- [ ] Run focused tests, build, and commit.
