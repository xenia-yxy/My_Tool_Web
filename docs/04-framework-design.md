# 项目框架设计文档

记录日期：2026-05-24

## 1. 当前阶段

当前处于 MVP 开发前的框架设计与项目初始化阶段。

上游依据：

- `docs/01-mvp-prd.md`
- `docs/02-technical-architecture.md`
- `docs/03-open-source-reference.md`
- `AI通用开发引入规范包`

本阶段目标：

- 固定长期技术栈。
- 参考优秀开源 starter，但形成自己的轻量框架。
- 搭建能运行、能扩展、不过度设计的项目底座。
- 为后续 MVP 页面和功能开发做准备。

## 2. 技术栈

| 层级 | 选型 |
| --- | --- |
| 全栈框架 | Next.js App Router |
| 前端框架 | React |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| UI 组件 | shadcn/ui 风格组件 |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 鉴权 | Auth.js / NextAuth.js |
| 内容渲染 | react-markdown |
| 输入校验 | zod |
| 请求状态 | SWR，按需使用 |
| 包管理 | pnpm |
| 代码托管 | GitHub，SSH remote |
| 部署 | Vercel |

## 2.1 数据库连接变量

Prisma Postgres 会提供两类连接串：

- `DATABASE_URL`：使用连接池，给 Next.js 应用运行时使用。
- `DIRECT_DATABASE_URL`：不使用连接池，给 Prisma migrate、一次性脚本和管理操作使用。

本项目约定：

```text
DATABASE_URL=pooled.db.prisma.io 连接串
DIRECT_DATABASE_URL=db.prisma.io 无连接池连接串
```

`.env` 只保存在本地和 Vercel 环境变量中，不能提交到 GitHub。

## 3. 项目结构

```text
E:/my_web
  docs/
    01-mvp-prd.md
    02-technical-architecture.md
    03-open-source-reference.md
    04-framework-design.md
  prisma/
    schema.prisma
  src/
    app/
      (public)/
        page.tsx
        knowledge/
          page.tsx
      admin/
        page.tsx
      tools/
        page.tsx
      layout.tsx
      globals.css
    components/
      ui/
    lib/
      prisma.ts
      utils.ts
    server/
  AI通用开发引入规范包/
```

## 4. 路由规划

### 公开区

| 路由 | 用途 | MVP 状态 |
| --- | --- | --- |
| `/` | 首页能力名片和最新文章入口 | 本阶段先放占位页 |
| `/knowledge` | 公开知识库列表 | 本阶段先放占位页 |
| `/knowledge/[slug]` | 公开文章详情 | 后续 MVP 阶段实现 |
| `/tools` | 自研工具入口预留 | 本阶段只预留路径 |

### 私人后台

| 路由 | 用途 | MVP 状态 |
| --- | --- | --- |
| `/admin` | 私人工作台 | 本阶段先放占位页 |
| `/admin/notes` | 笔记管理 | 后续 MVP 阶段实现 |
| `/admin/notes/new` | 新建笔记 | 后续 MVP 阶段实现 |
| `/admin/notes/[id]` | 编辑笔记 | 后续 MVP 阶段实现 |

## 5. 数据模型

MVP 第一阶段只建两个核心业务对象：

- `User`：单管理员账号。
- `Note`：私人笔记和公开文章共用模型。

为了兼容 Auth.js，数据库保留认证相关模型：

- `Account`
- `Session`
- `VerificationToken`

`Note` 使用 `status` 区分私密和公开：

```text
PRIVATE -> 私人笔记
PUBLISHED -> 公开文章
```

## 6. 权限设计

权限规则：

- 访客只能访问公开页面。
- 管理员登录后才能访问 `/admin`。
- 后台页面会通过中间件或服务端校验保护。
- 所有写操作必须在 Server Action 或 Route Handler 内再次校验权限。
- 前端隐藏按钮不能作为权限依据。

MVP 暂不做多角色系统，但 `User.role` 预留 `ADMIN`。

## 7. UI 设计规则

遵守规范包中的 UI 规则：

- 主任务优先。
- P0 信息优先显示。
- 后台使用企业后台密度。
- 主按钮每个页面只保留一个。
- 危险操作使用 danger token，并二次确认。
- 不做卡片套卡片。
- 页面必须考虑 loading、empty、error、submitting、success、permissionDenied。

## 8. 初始化策略

由于当前根目录已有规范包和文档，官方 `create-next-app .` 会拒绝在非空目录生成项目。

本项目采用手工最小骨架方式初始化：

- 保留现有规范包。
- 保留 `docs/` 文档。
- 在根目录新增 Next.js 所需配置和源码目录。
- 后续用 `pnpm install`、`prisma generate`、`pnpm build` 验证骨架。

## 9. Git 远端策略

本机使用 SSH 连接 GitHub。

远端使用：

```bash
git remote add origin git@github.com:yxy1112YXY/my_web.git
git branch -M main
```

推送命令：

```bash
git push -u origin main
```

推送前必须完成：

- 依赖安装。
- Prisma Client 生成。
- 构建或类型检查。
- 确认 `.env` 不进入仓库。

## 10. 本阶段不做

- 不实现真实登录流程。
- 不实现笔记 CRUD。
- 不实现发布/撤回。
- 不接 Stripe。
- 不接文件上传。
- 不接监控。
- 不做多用户。

这些属于后续 MVP 功能阶段。
