# 技术架构与选型

## 1. 选型结论

MVP 从第一天开始使用可长期扩展的全栈架构，不先做临时静态站，也不先用会被线上部署限制的本地 SQLite 方案。

| 层级 | 选型 |
| --- | --- |
| 全栈框架 | Next.js App Router |
| 前端框架 | React |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 组件库 | shadcn/ui 风格组件 |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 鉴权 | Auth.js / NextAuth.js |
| 内容渲染 | react-markdown |
| 输入校验 | zod |
| 状态请求 | SWR，按需使用 |
| 部署 | Vercel |
| 代码托管 | GitHub |
| 后期监控 | Plausible 或 Umami |
| 后期文件存储 | Vercel Blob 或 S3 |
| 后期支付 | Stripe 或按业务地区另选 |

## 2. 为什么选 Next.js App Router

本项目不是单纯展示站，而是公开网站加私人后台。

Next.js App Router 可以在一个项目内同时承载：

- 公开首页和公开文章。
- 后台工作台和笔记管理。
- Route Handlers。
- Server Actions。
- 服务端鉴权和权限校验。
- Metadata、SEO、图片和字体优化。
- 后续工具页、付费页、企业服务页扩展。

MVP 阶段不单独引入 Express 或 NestJS，避免一个人维护前后端两套工程。

## 3. 为什么从第一天用 PostgreSQL

原方案中的 SQLite 适合本地原型，但不适合作为本项目的长期线上主库。

原因：

- Vercel 的 Serverless 运行环境不适合依赖本地文件型数据库作为正式生产数据源。
- 后期要接入登录、笔记、工具状态、用户行为、付费、文件和企业服务，PostgreSQL 更稳。
- Prisma 从 SQLite 切 PostgreSQL 不只是改一行配置，还涉及连接串、迁移、线上数据迁移和行为验证。
- 既然目标是不推倒重来，就直接使用 PostgreSQL。

MVP 本地开发可以连接本地 PostgreSQL，也可以连接托管 PostgreSQL。

## 4. 为什么用 Prisma

Prisma 提供类型安全的数据访问和迁移能力，适合一个人长期维护项目。

本项目的第一批模型很少，先保留：

- `User`
- `Note`

后续按实际需要再扩展：

- `Tool`
- `Product`
- `ServiceCase`
- `Payment`
- `FileAsset`

## 5. 为什么用 Auth.js / NextAuth.js

MVP 只需要单管理员登录，但后期可能需要：

- OAuth 登录。
- 多用户。
- 角色权限。
- 付费用户。
- 管理员与普通用户区分。

因此从第一天使用 Auth.js / NextAuth.js 的结构，MVP 先只开启 Credentials 登录。

安全约束：

- 密码不能明文保存。
- Cookie 必须使用安全配置。
- 后台页面必须服务端鉴权。
- 写操作必须在服务端再次校验权限。
- 删除、发布、撤回等关键操作必须二次确认。

## 6. 为什么用 Tailwind CSS + shadcn/ui

Tailwind CSS 负责稳定的样式 token 和布局能力。

shadcn/ui 的特点是组件代码进入项目本身，后期可以按个人品牌和后台需求逐步调整，不被黑盒组件库限制。

MVP 阶段先创建最小必要组件：

- Button
- Input
- Textarea
- Card
- Badge
- Dialog
- Form 基础样式

不一次性导入大量组件。

## 7. GitHub 远端使用 SSH

用户给出的 HTTPS 远端是：

```bash
git remote add origin https://github.com/yxy1112YXY/my_web.git
```

由于本机使用 SSH，实际应使用：

```bash
git remote add origin git@github.com:yxy1112YXY/my_web.git
git branch -M main
git push -u origin main
```

这样 GitHub 认证会走本机 SSH key，不需要 HTTPS token 或账号密码。

## 8. 参考来源与使用方式

搭建时参考成熟项目和官方 starter 的技术组合，但不直接复制完整模板。

参考重点：

- Next.js 官方 App Router 项目结构。
- Prisma 官方 Next.js 指南。
- Auth.js / NextAuth.js 与 Prisma 的集成方式。
- shadcn/ui 的 Tailwind 与组件组织方式。

不直接套用大而全 starter 的原因：

- 本项目 MVP 只有单管理员和笔记发布闭环。
- 过早引入多用户、团队、订阅、复杂 RBAC 会拖慢 MVP。
- 保持目录结构小，后续每个能力再按阶段扩展。

## 9. MVP 项目结构

```text
src/
  app/
    (public)/
    admin/
    api/
  components/
    ui/
  lib/
  server/
prisma/
  schema.prisma
docs/
```

## 10. 当前阶段不做

- 不实现完整多用户。
- 不实现支付。
- 不实现文件上传。
- 不实现评论和互动。
- 不实现工具状态后台。
- 不做移动端极致优化。

