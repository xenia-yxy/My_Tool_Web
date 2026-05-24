# 开源框架调研与采用策略

记录日期：2026-05-24

## 1. 调研目标

本项目不寻找一模一样的开源项目，而是学习优秀框架的工程组织方式：

- Next.js App Router 项目结构
- Auth.js / NextAuth.js 鉴权方式
- Prisma + PostgreSQL 数据层
- shadcn/ui 组件组织
- 后台布局和受保护路由
- 环境变量、部署、安全和后期扩展策略

原则：

- 参考成熟项目，不整套照搬。
- 保持 MVP 小，不提前引入 SaaS 复杂度。
- 框架要能服务后期扩展，但第一阶段只实现个人网站和单管理员后台。

## 2. 候选项目

| 项目 | 技术栈 | 参考价值 | 采用策略 |
| --- | --- | --- | --- |
| `caru-ini/next-authjs-template` | Next.js 15、Auth.js v5、Prisma、PostgreSQL、Tailwind、shadcn/ui、Docker | 与本项目技术组合最接近 | 重点参考认证、Prisma、shadcn、环境变量和 Docker 本地数据库结构 |
| `prisma/nextjs-auth-starter` | Next.js、NextAuth.js v4、Prisma Postgres、Prisma ORM、CRUD、Vercel | Prisma 官方维护，数据库与认证写法可信 | 重点参考 Prisma schema、CRUD、Server Actions/API Routes 和 Vercel 部署思路 |
| `vercel/nextjs-postgres-auth-starter` | Next.js、Tailwind、TypeScript、Drizzle、NextAuth、PostgreSQL | Vercel 官方 Next.js + Postgres + Auth 示例 | 参考 Vercel 部署、环境变量和受保护路由，不采用 Drizzle |
| `nextjs/saas-starter` | Next.js、Postgres、Stripe、shadcn/ui、Dashboard、RBAC | 后期商业化和付费能力参考 | 只作为企业级后期参考，MVP 不引入 Stripe、团队、订阅和 RBAC |
| `ixartz/Next-js-Boilerplate` | Next.js、TypeScript、Tailwind、测试、CI、监控、安全工具 | 工程规范完整 | 只借鉴工程质量意识，不引入其大量工具链 |

## 3. 为什么不直接使用完整模板

直接使用大模板会带来以下问题：

- 多用户、团队、RBAC、支付、邮件、监控、国际化会让 MVP 膨胀。
- 很多模板偏 SaaS，不是个人知识库和私人工作台。
- 部分模板使用 Drizzle、Clerk、Better Auth 等方案，与本项目已确认的 Prisma + Auth.js 方向不完全一致。
- 模板升级节奏和业务结构不一定适合长期自研。

本项目更适合：

```text
官方 Next.js 骨架
+ Prisma 官方数据层写法
+ Auth.js 认证结构
+ shadcn/ui 组件组织
+ 自定义个人网站业务模型
```

## 4. 最终采用策略

### 4.1 框架底座

采用官方 Next.js App Router 结构，使用 TypeScript、Tailwind CSS 和 ESLint。

### 4.2 认证

参考 `caru-ini/next-authjs-template` 的 Auth.js v5 结构，但 MVP 只做单管理员 Credentials 登录。

暂不引入：

- GitHub OAuth
- Google OAuth
- 多用户注册
- 邮箱验证
- 复杂角色权限

### 4.3 数据库

参考 `prisma/nextjs-auth-starter` 的 Prisma + PostgreSQL 思路。

MVP 从第一天使用 PostgreSQL，不使用 SQLite 作为线上主库。

### 4.4 UI

参考 shadcn/ui 的组件组织方式，组件代码留在项目内。

MVP 只保留基础组件：

- Button
- Input
- Textarea
- Badge
- Card
- Dialog

不一次性导入大量组件。

### 4.5 后台

参考 SaaS starter 和 dashboard starter 的布局思路，但只做个人后台：

- `/admin` 私人工作台
- `/admin/notes` 笔记管理
- `/admin/notes/new` 新建笔记
- `/admin/notes/[id]` 编辑笔记

不做团队、组织、付费、角色管理。

## 5. 来源记录

- `caru-ini/next-authjs-template`：https://github.com/caru-ini/next-authjs-template
- `prisma/nextjs-auth-starter`：https://github.com/prisma/nextjs-auth-starter
- `vercel/nextjs-postgres-auth-starter`：https://github.com/vercel/nextjs-postgres-auth-starter
- `nextjs/saas-starter`：https://github.com/nextjs/saas-starter
- `ixartz/Next-js-Boilerplate`：https://github.com/ixartz/Next-js-Boilerplate

