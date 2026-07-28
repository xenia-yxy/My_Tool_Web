# AI 配置中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户能在页面内安全维护并验证自己的 AI 模型配置，所有 AI 功能优先使用它。

**Architecture:** 复用 `AiProviderCredential` 加密存储和 AI Gateway 能力选择；扩展配置 CRUD 与连接验证，不为每个工具保存冗余绑定。

**Tech Stack:** Next.js、Prisma、TypeScript、node:test、AES-256-GCM。

---

### Task 1: 配置预设和更新逻辑

**Files:**
- Modify: `src/server/ai-model-configs.ts`
- Test: `tests/ai-model-configs.test.ts`

- [ ] 先为供应商预设与更新输入写失败测试。
- [ ] 实现输入校验、Key 保留规则和当前用户归属校验。
- [ ] 运行 `npx tsx --test tests/ai-model-configs.test.ts`。

### Task 2: 安全的连接验证接口

**Files:**
- Modify: `src/server/ai-model-configs.ts`
- Create: `src/app/api/ai-model-configs/[id]/test/route.ts`
- Test: `tests/ai-model-configs.test.ts`

- [ ] 为按能力验证模型配置写失败测试。
- [ ] 用 AI Gateway 对已保存配置执行最小、安全的调用。
- [ ] 运行目标测试。

### Task 3: 配置中心操作界面

**Files:**
- Modify: `src/components/account/ai-model-config-manager.tsx`
- Modify: `src/app/api/ai-model-configs/[id]/route.ts`

- [ ] 添加供应商预设、编辑、启用/停用和连接测试。
- [ ] API Key 仅新增或明确替换时提交。
- [ ] 确保错误提示不包含 Key。

### Task 4: 真实调用链验证

**Files:**
- Modify: `src/server/ai-image-tools.ts`
- Test: `tests/ai-image-tools.test.ts`
- Test: `tests/ai-gateway.test.ts`

- [ ] 确认文生图和图生图都使用用户运行时配置。
- [ ] 为缺少能力与用户优先级补回归测试。
- [ ] 运行相关测试、lint 和构建。
