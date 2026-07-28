# 登录流程与账户管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页登录、受保护页面回跳和管理员账户维护做成安全可用的完整流程。

**Architecture:** 使用现有 NextAuth Credentials、Prisma `User` 和登录审计。管理员 API 管理用户，`authVersion` 使停用或重置密码立即令旧会话失效。

**Tech Stack:** Next.js、NextAuth、Prisma/PostgreSQL、TypeScript、node:test。

---

### Task 1: 会话版本和用户状态

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260728090000_add_user_auth_version/migration.sql`
- Modify: `src/server/auth.ts`
- Test: `tests/auth-permissions.test.ts`

- [ ] 写出停用或版本不匹配用户不能保留会话的失败测试。
- [ ] 新增 `authVersion` 和 `USER` 默认角色，令认证会话验证当前用户状态。
- [ ] 运行认证目标测试。

### Task 2: 管理员用户服务和 API

**Files:**
- Create: `src/server/user-management.ts`
- Create: `src/app/api/account/users/route.ts`
- Create: `src/app/api/account/users/[id]/route.ts`
- Test: `tests/user-management.test.ts`

- [ ] 写出创建、重置密码、停用和最后管理员保护的失败测试。
- [ ] 实现只对管理员开放的用户管理服务和 API。
- [ ] 运行目标测试。

### Task 3: 首页登录弹框和账户管理页

**Files:**
- Modify: `src/components/home/login-prompt.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/app/account/page.tsx`
- Create: `src/app/account/users/page.tsx`
- Create: `src/components/account/user-management.tsx`

- [ ] 关闭弹框时移除登录查询参数，保持安全回跳。
- [ ] 添加管理员入口和用户创建、编辑、重置、启停界面。
- [ ] 运行 lint 和生产构建。

### Task 4: 发布验证

**Files:**
- Modify: `.env.example`
- Test: `tests/login-redirect-target.test.ts`
- Test: `tests/user-auth-redirects.test.ts`

- [ ] 覆盖登录首页弹框和安全回跳。
- [ ] 运行相关测试、全量可完成的检查和生产构建。
- [ ] 建立离线 Docker 发布包，执行服务器数据库备份、迁移、部署和冒烟验证。
