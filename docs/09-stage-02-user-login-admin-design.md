# 阶段 2：用户端登录与后台管理设计文档

记录日期：2026-05-26

## 1. 设计目标

阶段 2 的目标是建立清晰的前后台身份边界，并搭建同项目内独立的后台管理框架。

核心结论：

```text
公开首页的“登录”是前台用户登录。
后台管理是独立管理系统，放在同一个 Next.js 项目的 /admin 路由分区中。
```

阶段 2 不新建独立后台项目，不做完整会员系统，不做完整后台配置平台。先完成最小可用的身份边界、后台框架和知识库内容管理。

## 2. 产品边界

### 2.1 前台用户端

前台用户端面向公开访客和登录用户。

路由范围：

```text
/
/login
/account
/knowledge
/knowledge/[slug]
/tools
/projects
/services
```

本阶段前台登录只做最小能力：

- 用户可以进入 `/login`。
- 用户登录成功后进入 `/account`。
- `/account` 展示用户基础信息和后续能力占位。
- 不做注册、收藏、评论、会员、付费。

### 2.2 后台管理端

后台管理端面向管理员。

路由范围：

```text
/admin/login
/admin
/admin/notes
/admin/notes/new
/admin/notes/[id]
```

后台管理端用于管理用户端个人 Web 的内容。阶段 2 P0 先管理知识库内容，后续再扩展首页配置、工具、项目和服务管理。

后台不使用公开首页导航、首屏动效或悬浮小助手。

## 3. 角色与权限

### 3.1 角色

当前 Prisma `Role` 只有：

```text
ADMIN
```

阶段 2 需要扩展为：

```text
ADMIN
USER
```

角色含义：

- `USER`：前台用户，只能访问用户端账户区域，不能进入后台。
- `ADMIN`：后台管理员，可以访问后台管理端和执行内容管理操作。

### 3.2 权限规则

- 访客可以访问公开页面。
- 前台用户登录后可以访问 `/account`。
- 前台用户不能访问 `/admin` 或任何 `/admin/*` 页面。
- 管理员必须通过 `/admin/login` 登录。
- 管理员可以访问 `/admin/*`。
- 后台写操作必须服务端校验 `ADMIN` 角色。
- 公开知识库只展示 `PUBLISHED` 内容。
- 私密内容不能通过公开 slug 访问。

## 4. 认证设计

### 4.1 登录入口分离

前台用户登录：

```text
/login
```

后台管理员登录：

```text
/admin/login
```

两者可以复用同一个认证底座，但必须有不同的入口、重定向和权限校验。

### 4.2 登录后跳转

前台用户：

```text
/login -> /account
```

后台管理员：

```text
/admin/login -> /admin
```

如果前台用户尝试访问后台：

```text
/admin/* -> /admin/login 或无权限页
```

如果管理员访问前台账户页，可以允许访问，也可以跳转后台。MVP 阶段建议允许访问，降低规则复杂度。

### 4.3 密码策略

- 密码不能明文存储。
- `User.passwordHash` 存储哈希。
- 种子数据或后台创建用户时写入哈希。
- `.env` 中的 `ADMIN_PASSWORD` 只用于初始化管理员，不进入前端。

## 5. 后台管理框架

### 5.1 是否新建项目

不新建独立后台项目。

采用：

```text
同一个 Next.js 项目内的 /admin 路由分区。
```

原因：

- 当前仍是 MVP，拆项目会增加部署、鉴权、接口、环境变量和类型共享成本。
- 前后台共享 Prisma/PostgreSQL 数据模型。
- Next.js App Router 已能满足路由分区、layout、server action 和权限校验。
- 后台当前主要管理个人 Web 内容，不需要独立部署或独立技术栈。

### 5.2 推荐目录结构

```text
src/app/
  (public)/
    page.tsx
    knowledge/
      page.tsx
      [slug]/
        page.tsx

  login/
    page.tsx

  account/
    page.tsx

  admin/
    login/
      page.tsx
    layout.tsx
    page.tsx
    notes/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
```

### 5.3 后台布局

后台 `layout.tsx` 负责：

- 服务端校验管理员身份。
- 渲染后台侧边栏。
- 渲染顶部栏。
- 渲染内容区。

后台布局结构：

```text
AdminShell
  Sidebar
    总览
    内容管理
    用户管理（P1 占位）
    站点配置（P1 占位）
  Header
    当前页面标题
    当前管理员
    退出登录
  Main
    page content
```

视觉方向：

- 管理系统风格。
- 信息密度高于公开首页。
- 以表格、表单、状态标签和明确操作按钮为主。
- 不做大 Hero。
- 不使用公开首页的动态背景和悬浮小助手。

## 6. 内容管理设计

阶段 2 后台 P0 只管理知识库内容。

### 6.1 数据对象

沿用 `Note`：

```text
Note
  id
  title
  slug
  excerpt
  content
  status
  authorId
  publishedAt
  createdAt
  updatedAt
```

状态：

```text
PRIVATE   -> 后台私密内容 / 未发布草稿
PUBLISHED -> 前台公开文章
```

### 6.2 内容列表

路由：

```text
/admin/notes
```

展示字段：

- 标题
- slug
- 状态
- 更新时间
- 发布时间
- 操作

操作：

- 编辑
- 发布
- 撤回
- 删除

删除必须二次确认。

### 6.3 新建和编辑

路由：

```text
/admin/notes/new
/admin/notes/[id]
```

字段：

- 标题
- slug
- 摘要
- 正文

正文输入：

- MVP 使用 textarea。
- 前台详情页用 `react-markdown` 渲染。
- 不引入富文本编辑器。

保存失败：

- 不能丢失用户输入。
- 显示明确错误提示。

### 6.4 发布和撤回

发布：

- `status` 改为 `PUBLISHED`。
- 如果 `publishedAt` 为空，则写入当前时间。

撤回：

- `status` 改为 `PRIVATE`。
- MVP 阶段建议清空 `publishedAt`，避免公开排序语义混乱。

## 7. 前台知识库设计

### 7.1 知识库列表

路由：

```text
/knowledge
```

数据：

- 只查询 `PUBLISHED` 内容。
- 按 `publishedAt` 倒序。

状态：

- 有内容：展示文章列表。
- 无内容：展示空状态，不显示空白页面。

### 7.2 文章详情

路由：

```text
/knowledge/[slug]
```

规则：

- 只允许访问 `PUBLISHED` 内容。
- 不存在或未发布时返回 404。
- 正文使用 `react-markdown` 渲染。

## 8. 用户账户页设计

路由：

```text
/account
```

MVP 内容：

- 当前登录用户基础信息。
- 返回首页。
- 退出登录。
- 后续能力占位：工具使用、收藏、会员或专属能力。

不做：

- 用户资料编辑。
- 头像上传。
- 收藏列表。
- 订单或会员。

## 9. 技术实现约束

必须实现：

- `Role` 扩展为 `ADMIN` / `USER`。
- 认证服务端可读取当前用户和角色。
- `/admin/*` 服务端校验 `ADMIN`。
- 后台写操作服务端校验 `ADMIN`。
- `/account` 服务端校验已登录用户。
- 前台知识库只查询 `PUBLISHED`。

不在阶段 2 实现：

- 注册。
- OAuth。
- 找回密码。
- 完整 RBAC。
- 支付。
- 上传。
- AI 检索。

## 10. 验收标准

- 公开首页“登录”进入 `/login`。
- 前台用户登录成功后进入 `/account`。
- 未登录访问 `/account` 会跳转 `/login`。
- 前台用户不能访问 `/admin`。
- 管理员通过 `/admin/login` 登录。
- 管理员登录后进入 `/admin`。
- 未登录访问 `/admin/*` 会跳转 `/admin/login`。
- 非管理员访问 `/admin/*` 被拒绝。
- 后台使用独立管理布局。
- 管理员可以新建知识库内容。
- 管理员可以编辑知识库内容。
- 管理员可以发布内容。
- 发布后内容出现在 `/knowledge`。
- `/knowledge/[slug]` 可以访问已发布文章详情。
- 管理员可以撤回内容。
- 撤回后内容不再出现在公开知识库。
- 管理员可以删除内容，且删除前有二次确认。
- 私密内容不能通过公开 slug 访问。
- `pnpm lint` 通过。
- `pnpm build` 通过。

