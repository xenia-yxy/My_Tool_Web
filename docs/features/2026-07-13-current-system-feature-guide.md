# 当前系统功能说明文档

## 1. 系统定位

当前系统是一个个人网站与自媒体/AI 工具工作台，核心目标是把内容生产、AI 生图、电商起号、资料整理、计划管理、IP 原型设计、内容发布和后台管理放在同一个个人生产系统里。

系统目前包含 5 层能力：

- 公开网站：展示首页、服务、项目、知识库文章。
- 用户账号：登录、用户中心、模型配置、会话权限。
- 工具工作台：计划、AI 生图、IP 原型、电商内容、热点、网站库、图片画廊、系列视频分析等。
- 内容后台：独立 Vite 管理端 + Next API，用于内容资产管理和发布。
- 数据与服务层：Prisma/PostgreSQL、Auth.js、AI 网关、图片资产、计划项、网站收藏、登录审计。

## 2. 技术架构

### 主应用

- 框架：Next.js App Router
- 语言：TypeScript
- UI：Tailwind CSS + 本地 UI 组件
- 认证：NextAuth/Auth.js Credentials 登录
- 数据库：PostgreSQL
- ORM：Prisma
- 测试：`tsx --test`

### 独立管理端

- 目录：`admin-frontend`
- 框架：Vite + React
- 端口：默认 `3002`
- 访问后端：通过 `VITE_ADMIN_BACKEND_URL`
- API 权限：通过 `VITE_ADMIN_API_TOKEN` 调用 Next 后端管理 API

### 本地运行

主应用：

```powershell
npm run dev
```

当前开发服务示例：

```text
http://localhost:3001
```

管理端：

```powershell
npm run admin:dev
```

## 3. 权限和账号体系

### 登录入口

路径：

```text
/login
```

功能：

- 支持账号/邮箱 + 密码登录。
- 登录后按 `callbackUrl` 返回目标页面。
- 已登录用户访问登录页会自动跳转到回调地址或用户中心。

### 用户中心

路径：

```text
/account
```

功能：

- 显示当前登录账号。
- 提供进入工具台入口。
- 提供模型配置入口。
- 提供退出登录能力。
- 展示账号安全说明。

### 账号安全

已实现能力：

- 8 小时会话有效期。
- 登录失败计数。
- 账号锁定时间。
- 禁用账号拦截。
- 登录 IP 和 User-Agent 记录。
- 登录审计表 `LoginAudit`。
- 安全回调地址校验，避免不安全跳转。

### 权限函数

主要服务：

- `requireSignedInUser(callbackPath)`：保护普通用户工具页。
- `requireAdminUser()`：保护管理员能力。
- `canUseMemberTools(role)`：判断是否可使用会员工具。
- `canAccessAdmin(role)`：判断是否可访问后台。

## 4. 公开网站功能

### 首页

路径：

```text
/
```

用途：

- 展示个人网站/工具系统入口。
- 引导用户进入知识库、项目、服务、工具或登录。

相关模块：

- `src/app/(public)/page.tsx`
- `src/components/home/*`

### 知识库列表

路径：

```text
/knowledge
```

用途：

- 展示已发布文章。
- 内容来源于 `Note` 表中状态为 `PUBLISHED` 的记录。

### 知识库详情

路径：

```text
/knowledge/[slug]
```

用途：

- 根据 slug 展示单篇已发布文章。
- 正文使用 Markdown 内容渲染。

### 项目页

路径：

```text
/projects
```

用途：

- 展示项目、案例或作品方向。

### 服务页

路径：

```text
/services
```

用途：

- 展示服务内容、能力说明或合作方向。

## 5. 工具工作台总览

### 工具首页

路径：

```text
/tools
```

权限：

- 需要登录。

功能：

- 展示当前工作流阶段。
- 展示今日计划完成情况。
- 展示草稿数量。
- 展示今日生成图片数量。
- 展示 IP 项目数量。
- 展示最近生成图片。
- 展示最近草稿文章。
- 提供快捷入口。

数据来源：

- `DailyPlanItem`
- `Note`
- `AiImageAsset`
- `IpPrototypeProject`

相关文件：

- `src/app/tools/page.tsx`
- `src/server/tools-dashboard.ts`
- `src/components/tools/dashboard-*`
- `src/components/tools/workflow-*`

### 工具导航分组

当前工具台导航分为 4 组：

- 规划
- 创作
- 电商
- 资源

导航配置文件：

```text
src/components/tools/nav-config.ts
```

## 6. 规划类功能

### 计划中心

路径：

```text
/tools/plan
```

权限：

- 需要登录。

功能：

- 管理今日计划。
- 管理本周计划。
- 支持四象限任务视图。
- 支持任务状态：待办、进行中、完成、取消。
- 支持优先级：低、中、高。
- 支持计划时间、截止日期、预计耗时、复盘备注。

数据模型：

- `DailyPlanItem`

核心字段：

- `planDate`
- `weekStartDate`
- `title`
- `note`
- `status`
- `priority`
- `quadrant`
- `plannedTime`
- `dueDate`
- `estimateMinutes`
- `reviewNote`
- `sortOrder`

接口：

- `GET /api/daily-plan`
- `POST /api/daily-plan`
- `PATCH /api/daily-plan/[id]`
- `DELETE /api/daily-plan/[id]`

相关文件：

- `src/app/tools/plan/page.tsx`
- `src/components/tools/daily-plan-panel.tsx`
- `src/server/daily-plan.ts`

## 7. 创作类功能

### AI 自定义生图

路径：

```text
/tools/ai-image
```

功能：

- 输入文字描述生成图片。
- 上传参考图后按描述编辑图片。
- 支持用途、风格、额外要求。
- 支持画幅：方图、竖图、横图。
- 支持质量：低、中、高。
- 支持批量数量限制。
- 生成结果进入图片资产库。

相关文件：

- `src/app/tools/ai-image/page.tsx`
- `src/components/tools/ai-image-tool.tsx`
- `src/server/ai-image-tools.ts`
- `src/server/ai-image-assets.ts`

接口：

- `POST /api/tools/image-generation`
- `GET /api/tools/image-assets`
- `POST /api/tools/image-assets`
- `PATCH /api/tools/image-assets/[id]`
- `DELETE /api/tools/image-assets/[id]`

数据模型：

- `AiImageAsset`
- `AiImageJob`

### IP 原型工坊

路径：

```text
/tools/ip-prototype
```

权限：

- 需要登录。

功能：

- 创建 IP 项目。
- 支持人物 IP、产品 IP、内容 IP。
- 支持项目描述和品牌气质。
- 支持上传草稿图和风格参考图。
- 支持输出目标：原型图、精修图、角色设定图、头像、封面、海报、系列图。
- 生成 IP 原型图片。
- 保存生成记录。
- 生成后自动给出后续任务草稿。

数据模型：

- `IpPrototypeProject`
- `IpPrototypeGeneration`

接口：

- `GET /api/tools/ip-prototypes`
- `POST /api/tools/ip-prototypes`
- `GET /api/tools/ip-prototypes/[id]`
- `PATCH /api/tools/ip-prototypes/[id]`
- `DELETE /api/tools/ip-prototypes/[id]`
- `POST /api/tools/ip-prototypes/[id]/generate`
- `GET /api/tools/ip-prototypes/tasks`
- `GET /api/tools/ip-prototype-generations/[id]`

相关文件：

- `src/app/tools/ip-prototype/page.tsx`
- `src/components/tools/ip-prototype-workbench.tsx`
- `src/server/ip-prototype.ts`

### 系列视频分析

路径：

```text
/tools/series-video-analyzer
```

权限：

- 需要登录。

功能：

- 输入视频链接和手动数据。
- 自动识别平台：抖音、小红书、B站、其他。
- 填写赛道、系列期数、标题、发布时间、视频时长、账号类型、内容简述。
- 填写播放、点赞、评论、收藏、转发、涨粉、完播率、平均观看。
- 自动计算互动率、点赞率、评论率、收藏率、转发率、涨粉率。
- 输出核心诊断。
- 输出分析依据。
- 输出数据解读。
- 输出下一步建议。
- 输出标题候选。
- 支持复制分析报告。

典型诊断：

- 播放高但涨粉低：人设或系列承接弱。
- 播放低但收藏高：内容有价值，标题封面或开头弱。
- 评论高但收藏低：情绪强但信息沉淀不足。
- 收藏高但评论低：内容有用但互动设计不足。
- 完播率低：开头或中段结构需要重做。
- 涨粉率高：赛道和表达方式值得继续。

相关文件：

- `src/app/tools/series-video-analyzer/page.tsx`
- `src/components/tools/series-video-analyzer.tsx`
- `src/lib/series-video-analyzer.ts`
- `tests/series-video-analyzer.test.ts`

## 8. 电商类功能

### 男装起号提示词

路径：

```text
/tools/menswear
```

功能：

- 上传男装参考图或输入商品描述。
- 生成男友风、学生党、通勤、170 显高等方向的图文提示词。
- 生成带货文案、封面思路和发布素材。
- 支持固定性别为男装场景。

相关文件：

- `src/app/tools/menswear/page.tsx`
- `src/components/tools/outfit-prompt-workbench.tsx`
- `src/lib/outfit-prompt-workbench.ts`

### 女装起号提示词

路径：

```text
/tools/womenswear
```

功能：

- 上传女装参考图或输入商品描述。
- 生成气质通勤、甜妹、小个子显高、微胖显瘦等方向的图文提示词。
- 生成带货文案、封面思路和发布素材。
- 支持固定性别为女装场景。

相关文件：

- `src/app/tools/womenswear/page.tsx`
- `src/components/tools/outfit-prompt-workbench.tsx`
- `src/lib/outfit-prompt-workbench.ts`

### 零食百货起号提示词

路径：

```text
/tools/snack-grocery
```

功能：

- 面向大学生、职场人、租房党、宿舍党等人群。
- 生成零食饮料、速食夜宵、百货收纳、暑假热点等清单图文。
- 生成发布包、选题、图文结构和提示词。

相关文件：

- `src/app/tools/snack-grocery/page.tsx`
- `src/components/tools/snack-grocery-prompt-workbench.tsx`
- `src/lib/snack-grocery-prompt-workbench.ts`
- `src/lib/snack-grocery-publishing-pack.ts`

### 小红书 / 闲鱼内容设计

路径：

```text
/tools/social-commerce
```

功能：

- 面向小红书笔记和闲鱼商品发布。
- 生成封面方向。
- 生成标题文案。
- 生成图片提示词。
- 生成发布检查项。
- 适合资料售卖、商品发布和内容种草场景。

相关文件：

- `src/app/tools/social-commerce/page.tsx`
- `src/components/tools/social-commerce-workbench.tsx`
- `src/lib/social-commerce-workflow.ts`

### 资料售卖包生成器

路径：

```text
/tools/digital-product-pack
```

功能：

- 将 AI 封面提示词、电商主图工作流、电商 Agent 资料整理为可上架的闲鱼数字资料包。
- 生成资料包结构、商品卖点、交付清单和发布文案。

相关文件：

- `src/app/tools/digital-product-pack/page.tsx`
- `src/components/tools/digital-product-pack-workbench.tsx`
- `src/lib/digital-product-pack.ts`

## 9. 资源类功能

### 网站库

路径：

```text
/tools/sites
```

功能：

- 保存常用网站。
- 支持网站标题、URL、分类、子分类、摘要、标签、备注。
- 内置大量默认网站，包括抖音、小红书、AI 写作、AI 图片、AI 视频、多模态平台、工具导航等。
- 支持搜索和分类筛选。
- 支持网页摘要生成。

数据模型：

- `WebsiteBookmark`

接口：

- `GET /api/website-bookmarks`
- `POST /api/website-bookmarks`
- `DELETE /api/website-bookmarks/[id]`
- `POST /api/website-bookmarks/summarize`

相关文件：

- `src/app/tools/sites/page.tsx`
- `src/components/tools/website-bookmark-manager.tsx`
- `src/server/website-bookmarks.ts`

### 热点雷达

路径：

```text
/tools/hotspots
```

权限：

- 需要登录。

功能：

- 聚合抖音、小红书、B站热点入口。
- 支持平台筛选。
- 支持类型筛选。
- 支持关键词搜索。
- 根据关键词生成跨平台快捷查询入口。
- 后端存在真实热点 API 能力，用于平台热点抓取/标准化。

接口：

- `GET /api/tools/hotspots`

相关文件：

- `src/app/tools/hotspots/page.tsx`
- `src/components/tools/hotspot-radar.tsx`
- `src/lib/hotspot-radar.ts`
- `src/server/hotspot-radar.ts`

### AI 图片画廊

路径：

```text
/tools/image-gallery
```

功能：

- 查看 AI 生成图片。
- 查看批量任务状态。
- 查看发布文案、标签、下载链接。
- 支持按模式和状态筛选。
- 支持编辑标题和备注。
- 支持删除图片资产。

数据模型：

- `AiImageAsset`
- `AiImageJob`

相关文件：

- `src/app/tools/image-gallery/page.tsx`
- `src/components/tools/ai-image-gallery-workbench.tsx`
- `src/server/ai-image-assets.ts`

### 网站工具汇总

路径：

```text
/tools/directory
```

功能：

- 保留旧版外部工具导航。
- 展示抖音、小红书、AI 写作、AI 图片、AI 视频、全模态、工具导航等外部工具。
- 推荐用户使用新版“网站库”沉淀可搜索资料。

相关文件：

- `src/app/tools/directory/page.tsx`
- `src/components/tools/tool-directory.tsx`
- `src/components/tools/tool-directory-data.ts`

## 10. AI 模型配置

### 模型配置页

路径：

```text
/account/models
```

权限：

- 需要登录。

功能：

- 添加模型供应商。
- 保存 API Key。
- API Key 加密存储。
- 显示 API Key 掩码。
- 标记模型能力。
- 启用/禁用模型配置。
- 删除模型配置。

支持供应商：

- openai-compatible
- openai
- openrouter
- anthropic
- google
- aizhzo
- custom

支持能力：

- text
- vision
- image.generate
- image.edit
- audio.transcribe
- audio.speech
- embedding
- video.generate
- tools

数据模型：

- `AiProviderCredential`

接口：

- `GET /api/ai-model-configs`
- `POST /api/ai-model-configs`
- `DELETE /api/ai-model-configs/[id]`

相关文件：

- `src/app/account/models/page.tsx`
- `src/components/account/ai-model-config-manager.tsx`
- `src/server/ai-model-configs.ts`
- `src/server/ai-gateway/*`

## 11. 个人 Agent 对话

接口：

```text
POST /api/agent/chat
```

功能：

- 接收用户问题和历史消息。
- 支持最多 8 条历史消息。
- 单次问题长度限制为 2000 字。
- 可选联网搜索。
- 支持 Tavily 或 SerpApi 搜索。
- 优先使用用户自己的模型配置。
- 没有模型配置时返回 fallback 可执行回复。

相关文件：

- `src/app/api/agent/chat/route.ts`
- `src/server/agent-chat.ts`

## 12. 内容管理和发布后台

### 独立管理端

目录：

```text
admin-frontend
```

功能：

- 管理端仪表盘。
- 查看全部内容资产数量、草稿数量、已发布数量。
- 查看最近更新内容。
- 内容资产列表。
- 按状态筛选：全部、草稿、已发布。
- 搜索标题、摘要或 slug。
- 新建内容。
- 编辑内容。
- 发布/撤回内容。
- 删除内容。

运行：

```powershell
npm run admin:dev
```

默认端口：

```text
3002
```

环境变量：

- `VITE_ADMIN_BACKEND_URL`
- `VITE_ADMIN_API_TOKEN`

### 管理 API

接口：

- `GET /api/admin/health`
- `GET /api/admin/dashboard`
- `GET /api/admin/content`
- `POST /api/admin/content`
- `GET /api/admin/content/[id]`
- `PATCH /api/admin/content/[id]`
- `DELETE /api/admin/content/[id]`
- `PATCH /api/admin/content/[id]/status`

认证：

- Bearer Token
- 环境变量：`ADMIN_API_TOKEN`
- CORS 白名单：`ADMIN_API_ALLOWED_ORIGINS`

数据模型：

- `Note`

状态：

- `PRIVATE`
- `PUBLISHED`

相关文件：

- `admin-frontend/src/main.tsx`
- `admin-frontend/src/admin-api.ts`
- `src/server/admin-api-auth.ts`
- `src/server/admin-content-api.ts`
- `src/server/content-assets.ts`
- `src/server/content-queries.ts`

## 13. 图片和上传能力

### AI 图片上传访问

接口：

```text
/api/uploads/ai-images/[fileName]
```

用途：

- 访问本地运行时保存的 AI 生成图片。

默认存储目录：

```text
.runtime/uploads/ai-images
```

### IP 原型参考图访问

接口：

```text
/api/uploads/ip-prototypes/[fileName]
```

用途：

- 访问 IP 原型上传的草稿图、风格图和生成图记录。

默认存储目录：

```text
.runtime/uploads/ip-prototypes
```

### OSS 支持

服务：

- `src/server/oss-storage.ts`

用途：

- 支持将图片上传到阿里云 OSS。
- 支持删除 OSS 对象。
- 未启用 OSS 时使用本地 `.runtime/uploads`。

## 14. 数据模型总览

### User

用途：

- 用户账号。
- 管理员/普通用户角色。
- 登录安全字段。
- 关联内容、图片、计划、模型配置、网站收藏等资源。

### Note

用途：

- 内容资产。
- 支持草稿和发布。
- 公开知识库读取已发布内容。

### AiImageAsset

用途：

- AI 生成图片资产。
- 保存模式、标题、描述、提示词、图片 URL、下载 URL、标签、参考图等。

### AiImageJob

用途：

- AI 批量生图任务。
- 保存任务状态、完成数量、失败数量、错误信息。

### IpPrototypeProject

用途：

- IP 原型项目。
- 保存项目名称、类型、描述、品牌气质。

### IpPrototypeGeneration

用途：

- IP 原型生成记录。
- 保存提示词、参考图、生成图、输出目标和备注。

### AiProviderCredential

用途：

- 用户模型 API Key 配置。
- 加密保存 API Key。
- 记录能力、模型、供应商和启用状态。

### WebsiteBookmark

用途：

- 用户自定义网站库记录。
- 保存网址、分类、摘要、标签和备注。

### DailyPlanItem

用途：

- 日计划和周计划。
- 支持四象限、优先级、状态和复盘。

### LoginAudit

用途：

- 登录审计。
- 记录成功/失败、原因、IP、User-Agent。

## 15. API 总览

### 认证

- `GET/POST /api/auth/[...nextauth]`

### 管理端

- `/api/admin/health`
- `/api/admin/dashboard`
- `/api/admin/content`
- `/api/admin/content/[id]`
- `/api/admin/content/[id]/status`

### Agent

- `/api/agent/chat`

### 模型配置

- `/api/ai-model-configs`
- `/api/ai-model-configs/[id]`

### 计划

- `/api/daily-plan`
- `/api/daily-plan/[id]`

### 工具

- `/api/tools/hotspots`
- `/api/tools/image-assets`
- `/api/tools/image-assets/[id]`
- `/api/tools/image-generation`
- `/api/tools/ip-prototypes`
- `/api/tools/ip-prototypes/[id]`
- `/api/tools/ip-prototypes/[id]/generate`
- `/api/tools/ip-prototypes/tasks`
- `/api/tools/ip-prototype-generations/[id]`

### 上传

- `/api/uploads/ai-images/[fileName]`
- `/api/uploads/ip-prototypes/[fileName]`

### 网站库

- `/api/website-bookmarks`
- `/api/website-bookmarks/[id]`
- `/api/website-bookmarks/summarize`

## 16. 测试覆盖

当前测试文件覆盖以下能力：

- 管理 API 鉴权
- 内容管理 API
- 管理账号种子数据
- 登录安全
- AI 凭证加密
- AI 网关
- AI 图片资产
- AI 图片生成工具
- 模型配置
- 权限判断
- 电商工作流
- 内容资产
- 日计划
- 数字资料包
- 热点雷达
- 图片生成工作流
- IP 原型
- 登录跳转
- OSS 存储
- 穿搭提示词工作台
- 密码哈希
- 系列视频分析
- 零食百货提示词
- 小红书/闲鱼工作流
- 工具目录
- 工具导航
- 用户登录重定向
- 网站库

常用测试命令：

```powershell
npm test
```

聚焦测试示例：

```powershell
npx tsx --test tests/series-video-analyzer.test.ts tests/tool-navigation.test.ts
```

## 17. 环境变量

### 认证和数据库

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 管理端 API

- `ADMIN_API_TOKEN`
- `ADMIN_API_ALLOWED_ORIGINS`
- `VITE_ADMIN_BACKEND_URL`
- `VITE_ADMIN_API_TOKEN`

### AI 和模型

- `AI_CREDENTIAL_ENCRYPTION_KEY`
- `AIZHZO_API_KEY`
- `AI_IMAGE_API_KEY`
- `AIZHZO_BASE_URL`
- `AI_IMAGE_BASE_URL`
- `AIZHZO_IMAGE_MODEL`
- `AI_IMAGE_MODEL`
- `AIZHZO_IMAGE_GENERATION_PATH`
- `AIZHZO_IMAGE_EDIT_PATH`

### 搜索

- `TAVILY_API_KEY`
- `SERPAPI_API_KEY`

### 对象存储

- 阿里云 OSS 相关配置，具体以 `src/server/oss-storage.ts` 为准。

## 18. 部署和运行

### 本地开发

```powershell
npm run dev
```

### 管理端开发

```powershell
npm run admin:dev
```

### 主应用构建

```powershell
npm run build
```

### 管理端构建

```powershell
npm run admin:build
```

### Docker 生产部署

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

### Prisma

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run verify:prisma
```

## 19. 当前已知状态

### 已可用

- 公开站点路由。
- 登录和用户中心。
- 工具台总览。
- 计划中心。
- AI 自定义生图。
- IP 原型工坊。
- 电商提示词工具。
- 小红书/闲鱼内容设计。
- 资料售卖包生成器。
- 网站库。
- 热点雷达。
- 图片画廊。
- 系列视频分析。
- 模型配置。
- 独立管理端内容管理。
- 管理 API。

### 需要注意

- 当前仓库存在大量未跟踪或未提交文件，文档描述基于当前工作区文件状态。
- 部分工具依赖用户登录和模型配置。
- 生图能力依赖模型 API Key 或环境变量。
- 网站摘要和 Agent 联网搜索依赖外部搜索或模型配置。
- 历史趋势类功能尚未完全落库，例如系列视频分析目前是单条分析，不保存历史。

## 20. 后续建议

### 优先级 1：稳定系统基线

- 清理 `.next/dev` 生成缓存。
- 重新运行 `npx tsc --noEmit`。
- 梳理当前大量未跟踪文件，决定哪些纳入版本管理。
- 将工具台相关新功能集中提交。

### 优先级 2：补齐系列实验管理

- 给系列视频分析增加历史记录。
- 支持同一赛道多条视频趋势。
- 支持一周复盘。
- 支持下一周选题计划。

### 优先级 3：强化工作台闭环

- 将计划中心、AI 生图、图片画廊、知识库草稿、发布后台串成完整内容工作流。
- 支持从生成图片一键进入内容草稿。
- 支持从 IP 原型生成后自动创建计划项。

### 优先级 4：完善管理端

- 管理端加入登录或更细权限。
- 内容编辑器增强 Markdown 预览。
- 增加图片资产选择。
- 增加发布前检查。

## 21. 总结

当前系统已经从“个人网站”扩展为一个面向自媒体和 AI 内容生产的个人工作台。它不只是展示页面，而是具备账号、计划、AI 模型、生图、素材管理、IP 原型、电商内容、热点观察、网站资料库、内容发布后台和系列视频分析等多模块能力。

当前最核心的产品方向是：把分散的 AI 工具、内容创作流程和自媒体复盘流程统一到一个可持续迭代的个人生产系统里。
