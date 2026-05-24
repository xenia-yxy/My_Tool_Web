# My Web

个人网站与 IP 自媒体产品。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Prisma
- PostgreSQL
- Auth.js / NextAuth.js

## 当前阶段

项目处于 MVP 框架初始化阶段。

当前只搭建框架底座，不实现完整登录、笔记 CRUD、发布/撤回和支付等业务能力。

## Prisma

生成客户端：

```bash
pnpm prisma:generate
```

迁移数据库：

```bash
pnpm prisma:migrate
```

写入种子数据：

```bash
pnpm prisma:seed
```

验证连接：

```bash
pnpm verify:prisma
```

## 文档

- `docs/01-mvp-prd.md`
- `docs/02-technical-architecture.md`
- `docs/03-open-source-reference.md`
- `docs/04-framework-design.md`
- `docs/05-database-setup-guide.md`
