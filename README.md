# Xenia · 个人网站（My Web）

> 独立设计开发并**已上线运行**的个人网站 / IP 自媒体产品，采用现代全栈技术栈。
> 🌐 在线演示：http://47.106.108.150:3000

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Prisma
- PostgreSQL
- Auth.js / NextAuth.js

## 当前阶段

项目处于 MVP 内容发布后台阶段。

当前已完成公开首页、公开知识库路由、单管理员内容资产后台和 Markdown 发布闭环。

## 后台

后台入口不在公开端露出，直接访问：

```bash
/admin
```

初始化管理员账号：

```bash
pnpm prisma:seed
```

种子脚本会读取 `.env` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`，创建或更新单管理员账号。

## Docker 部署

生产部署示例：

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

默认映射到宿主机 `3000` 端口，不占用已有 `80` 端口服务。

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

- `docs/00-ne-ti-ni-te-process.md`
- `docs/01-mvp-prd.md`
- `docs/02-technical-architecture.md`
- `docs/03-open-source-reference.md`
- `docs/04-framework-design.md`
- `docs/05-database-setup-guide.md`
- `docs/06-stage-01-homepage-mvp.md`
- `docs/07-stage-01-homepage-ui-blueprint.md`
