# Prisma Postgres 连接指南

记录日期：2026-05-24

## 1. 当前决策

本项目使用 Prisma Postgres Free + Vercel。

本地不安装 PostgreSQL，服务器也暂时不自建数据库。

原因：

- MVP 阶段避免数据库运维成本。
- Prisma Postgres 与 Vercel、Next.js、Prisma 的组合最顺。
- 后期即使迁移到 Neon、Supabase 或自建 PostgreSQL，代码层仍然是 Prisma + PostgreSQL，不需要推倒重来。

## 2. 两条连接串分别做什么

Prisma Postgres 会给两条连接串：

```text
连接串 / pooled.db.prisma.io
无连接池 / db.prisma.io
```

本项目约定：

```text
DATABASE_URL=连接串，给网站运行使用
DIRECT_DATABASE_URL=无连接池，给 Prisma migrate 建表使用
```

不要把连接串发到公开聊天、截图、GitHub 或文档中。

## 3. 本地 .env 怎么写

在项目根目录创建：

```text
E:\my_web\.env
```

内容模板：

```env
DATABASE_URL="粘贴 pooled.db.prisma.io 那条连接串"
DIRECT_DATABASE_URL="粘贴 db.prisma.io 那条无连接池连接串"
AUTH_SECRET="一串很长的随机字符"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="你的管理员邮箱"
ADMIN_PASSWORD="你的后台登录密码"
```

`.env` 已经被 `.gitignore` 忽略，不会进入 GitHub。

## 4. 怎么创建 .env

在 `E:\my_web` 终端运行：

```bash
notepad .env
```

然后把第 3 节模板复制进去，替换成你自己的连接串和密码。

保存后关闭记事本。

## 5. 填好 .env 后运行什么

先生成 Prisma Client：

```bash
pnpm prisma:generate
```

再把表结构创建到 Prisma Postgres：

```bash
pnpm exec prisma migrate dev --name init
```

写入种子数据：

```bash
pnpm prisma:seed
```

验证连接：

```bash
pnpm verify:prisma
```

如果成功，会看到类似：

```text
Applying migration `init`
Your database is now in sync with your schema
```

或：

```text
✅ Connected. Users: 1, Notes: 2
```

## 6. Vercel 里要配置什么

如果 Prisma Postgres 是从 Vercel Marketplace 创建并连接项目，Vercel 通常会自动添加 `DATABASE_URL`。

仍然需要确认或补充：

```text
DATABASE_URL
DIRECT_DATABASE_URL
AUTH_SECRET
AUTH_URL
ADMIN_EMAIL
ADMIN_PASSWORD
```

本地开发：

```text
AUTH_URL=http://localhost:3000
```

正式上线：

```text
AUTH_URL=https://你的域名
```

## 7. 当前阶段还不会做什么

本阶段只完成数据库连接准备和框架验证。

后续 MVP 功能阶段才会实现：

- 管理员登录
- 后台保护
- 笔记 CRUD
- 发布和撤回
- 公开文章展示

## 8. 关于 Prisma 页面一直转

如果本地终端已经出现以下结果，说明数据库连接已经成功：

```text
Database schema is up to date!
```

或者：

```text
✅ Connected. Users: 1, Notes: 2
```

这时 Prisma 网页向导仍然显示“正在等待连接到你的数据库”通常只是页面没有收到本地 CLI 的完成状态，不代表数据库没有连接成功。
