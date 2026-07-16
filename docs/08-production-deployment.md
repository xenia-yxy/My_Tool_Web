# My Web 生产部署与系统说明

更新时间：2026-07-09

## 1. 系统概况

项目名称：`my-web`

系统定位：个人网站与 AI 实践者数字据点，包含公开首页、公开登录、用户工具、知识库、AI 图片工具和独立本地管理端。

技术栈：

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth/Auth.js Credentials 登录
- Docker + Docker Compose

## 2. 当前隔离架构

管理端已按“真正前后端分离”处理：

| 模块 | 部署位置 | 访问方式 | 说明 |
|---|---|---|---|
| 用户端页面 | 服务器 Docker | `http://47.106.108.150:3000/` | 面向公开用户 |
| 用户端 API | 服务器 Docker | `/api/tools/*`、`/api/auth/*` | 用户登录和工具能力 |
| 管理端后端 API | 服务器 Docker | `/api/admin/*` | 仅 token 鉴权访问 |
| 管理端前端 | 本地电脑 | `http://localhost:3001` | 不部署到服务器 |

生产 Docker 构建会在 `pnpm build` 前删除：

```text
src/app/admin
```

因此线上用户站点不包含 `/admin`、`/admin/login` 等管理端页面；服务器只保留 `/api/admin/*` 管理后端接口。

## 3. 当前部署状态

服务器：

- IP：`47.106.108.150`
- 系统：CentOS Linux 8
- 部署根目录：`/opt/my-web`
- Docker：`26.1.3`
- Docker Compose：`v2.27.0`
- 应用容器：`my-web`
- 当前镜像：`my-web:20260709-5f02925-adminsplit1`
- 容器端口：`3000`
- 宿主机端口：`3000`

访问地址：

- 公网首页：`http://47.106.108.150:3000/`
- 公开登录页：`http://47.106.108.150:3000/login`
- 工具目录：`http://47.106.108.150:3000/tools`
- AI 生图工具：`http://47.106.108.150:3000/tools/ai-image`
- 穿搭图工具：`http://47.106.108.150:3000/tools/outfit-image`
- 管理端后端健康检查：`http://47.106.108.150:3000/api/admin/health`

## 4. 登录与权限模型

用户端登录：

- 入口：`/login`
- 可登录角色：`USER`、`ADMIN`
- 登录后可使用公开工具和用户中心

管理端访问：

- 前端入口：本地 `http://localhost:3001`
- 后端接口：服务器 `/api/admin/*`
- 鉴权方式：`Authorization: Bearer <ADMIN_API_TOKEN>`
- 允许来源：通过 `ADMIN_API_ALLOWED_ORIGINS` 控制，当前允许 `http://localhost:3001,http://localhost:3002`

权限规则：

- 未登录访问 `/tools/ai-image`：重定向到 `/login`
- `USER` 普通用户：可使用公开工具，不能使用管理 API
- `ADMIN` 管理员：可使用公开工具
- 管理 API 不使用用户端 Cookie，会单独校验 `ADMIN_API_TOKEN`
- 线上 `/admin` 页面不部署

账号、服务器密码和 token 属于敏感信息，只记录在本地私密文档：

```text
.deploy-private/my-web-production-private.md
```

该私密文档已被 Git 忽略，不应提交或公开转发。

## 5. 本地管理端启动

本地电脑需要设置：

```powershell
$env:ADMIN_BACKEND_URL="http://47.106.108.150:3000"
$env:ADMIN_API_TOKEN="私密文档中的 token"
pnpm admin:dev
```

默认本地管理端地址：

```text
http://localhost:3001
```

如果 3001 已被旧进程占用，可临时使用 3002：

```powershell
$env:ADMIN_BACKEND_URL="http://47.106.108.150:3000"
$env:ADMIN_API_TOKEN="私密文档中的 token"
.\node_modules\.bin\next.cmd dev admin-frontend -p 3002
```

本地管理端当前支持：

- 仪表盘统计
- 内容资产列表
- 内容搜索和状态筛选
- 新建内容
- 编辑内容
- 发布 / 撤回
- 删除内容

## 6. 环境变量

生产环境变量文件只放在服务器：

```bash
/opt/my-web/compose/.env.production
```

该文件不进入 Git、不进入部署包。主要变量包括：

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_API_TOKEN`
- `ADMIN_API_ALLOWED_ORIGINS`
- `ADMIN_FRONTEND_URL`
- `WEB_PORT`
- `AUTH_TRUST_HOST`
- `NODE_ENV`
- `AIZHZO_API_KEY`
- `AIZHZO_BASE_URL`
- `AIZHZO_IMAGE_MODEL`

当前 `NEXTAUTH_URL`：

```text
http://47.106.108.150:3000
```

AI 图片接口配置：

```text
AIZHZO_API_KEY=已在服务器配置，公开文档不记录明文
AIZHZO_BASE_URL=https://api.aizhzo.com
AIZHZO_IMAGE_MODEL=gpt-image-2
```

## 7. 数据库状态

数据库类型：PostgreSQL

已执行迁移：

- `20260708093000_add_ai_image_assets`
- `20260708100000_add_admin_login_security`

本次管理端前后端分离没有新增数据库迁移。

数据库安全约束：

- 没有执行 `prisma migrate reset`
- 没有执行 `prisma db push`
- 没有删除数据库
- 没有删除 Docker volume
- 没有执行 `docker compose down -v`

## 8. 常用运维命令

进入服务器：

```bash
ssh root@47.106.108.150
```

查看服务状态：

```bash
cd /opt/my-web/compose
docker compose --env-file ./.env.production --env-file ./release-current.env -f docker-compose.prod.yml ps
```

查看日志：

```bash
cd /opt/my-web/compose
docker compose --env-file ./.env.production --env-file ./release-current.env -f docker-compose.prod.yml logs --tail=200 my-web
```

重启服务：

```bash
cd /opt/my-web/compose
docker compose --env-file ./.env.production --env-file ./release-current.env -f docker-compose.prod.yml up -d --force-recreate my-web
```

服务器本机健康检查：

```bash
curl -I http://127.0.0.1:3000/
```

管理 API 健康检查：

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" http://127.0.0.1:3000/api/admin/health
```

## 9. 回滚方式

如需回滚到上一版本：

```bash
cd /opt/my-web/compose
cp release-current.env release-failed.env
cp release-previous.env release-current.env
docker compose --env-file ./.env.production --env-file ./release-current.env -f docker-compose.prod.yml up -d --force-recreate my-web
```

回滚时禁止删除数据库、禁止删除 Docker volume。

## 10. 阿里云安全组

当前应用使用公网端口：

```text
TCP 3000
```

服务器本机已监听：

```text
0.0.0.0:3000 -> container 3000
```

阿里云控制台安全组需要保留以下入方向规则：

| 协议 | 端口 | 授权对象 | 说明 |
|---|---:|---|---|
| TCP | 3000 | 0.0.0.0/0 | 当前公网访问网站和后端 API |

后续绑定域名时，建议改为 80/443，通过 Nginx 或云负载均衡反代到 `127.0.0.1:3000`。

## 11. 本次分离上线摘要

本次修复：

- 新增 `/api/admin/health`
- 新增 `/api/admin/dashboard`
- 新增 `/api/admin/content`
- 新增 `/api/admin/content/[id]`
- 新增 `/api/admin/content/[id]/status`
- 新增 `ADMIN_API_TOKEN` 鉴权
- 新增 `ADMIN_API_ALLOWED_ORIGINS` CORS 白名单
- 新增本地管理端 `admin-frontend`
- 生产 Docker 构建排除 `src/app/admin`
- 用户中心不再跳转线上 `/admin`

本次上线：

- 构建镜像：`my-web:20260709-5f02925-adminsplit1`
- 部署目录：`/opt/my-web`
- 管理端前端：仅本地运行，不进入服务器运行态

## 12. 验证结果

2026-07-09 已完成以下验证：

| 验证项 | 结果 |
|---|---|
| 单元测试 | 41/41 通过 |
| ESLint | 0 errors，3 个既有 `<img>` warning |
| 用户端源码构建 | 通过 |
| 本地管理端构建 | 通过 |
| 生产排除模拟构建 | 通过，路由列表不包含 `/admin` |
| 生产排除模拟中的 `/api/admin/*` | 保留 |
| 线上首页 `/` | HTTP 200 |
| 线上 `/admin` | HTTP 404 |
| 线上 `/admin/login` | HTTP 404 |
| 线上 `/api/admin/health` 不带 token | HTTP 401 |
| 线上 `/api/admin/health` 带 token | HTTP 200 |
| 本地管理端 `http://localhost:3002/content` | HTTP 200 |

说明：本次验证未发起真实 AI 图片生成扣费请求。
