# 公开素材、模特档案与 IP 衍生工厂交付说明

更新日期：2026-07-14

## 功能交付

- 素材库统一为公开素材库：成员可以浏览、搜索、按分类筛选和引用图片；素材的创建者仍保留编辑、删除权限。
- 所有男装参考槽位支持本地上传并使用统一上传框回显；上传成功后自动入库、自动选中，并可点击放大查看。
- 从素材库选择时以完整图片缩略图展示，可搜索、按分类筛选、预览大图后再确认使用。
- 严格保真生图增加“模特脸部”和“模特身体”参考槽位。
- 模特档案支持从可视化公开素材库选择脸部、身体参考图；可以基于参考图生成脸部参考图或全身模特图，生成结果自动挂回档案并进入公开素材库。
- 男装工作台移除“男装图片画廊”入口，生成结果继续进入统一图片画廊。
- 统一图片画廊、素材缩略图、档案参考图、上传参考图均支持点击大图预览。
- IP 衍生工厂四种模式分别提供内置选项：
  - 表情包：表情、贴纸风格。
  - 动作姿势：动作、镜头。
  - 换装造型：服装主题、装饰。
  - 场景延展：场景、光线。
- IP 衍生批量输出数量扩展为 1、2、4、6、9、12、18、30 张。

## 验证结果

- 聚焦男装与 IP 衍生测试：24/24 通过。
- 全量测试：185/185 通过。
- `pnpm lint`：0 error，保留项目既有的 8 条 `img` 优化 warning。
- `pnpm build`：通过，包含模特生成接口 `/api/tools/menswear/models/[id]/generate`。
- 本地冒烟：`http://localhost:3001/` 返回 200；受保护的 `/tools/menswear` 返回 307 登录跳转。

## 部署包

- 镜像：`my-web:20260714-public-materials-models`。
- 压缩包：`E:\A_design\deploy-artifacts\20260714-public-materials-models.zip`。
- 校验文件：`E:\A_design\deploy-artifacts\20260714-public-materials-models.zip.sha256`。
- 包内容：Docker 镜像 tar、`docker-compose.prod.yml`、`release-manifest.env`。
- 数据库：本次无新增迁移，发布清单标记 `REQUIRES_DB_MIGRATE=false`；不覆盖生产 `.env.production`、数据库或 Docker 卷。

## 上线状态

已于 2026-07-14 完成生产上线。

- 生产地址：`http://47.106.108.150:3000`。
- 当前镜像：`my-web:20260714-public-materials-models`。
- 回滚镜像：`my-web:20260714-fa02391-menswearfix`。
- 服务器已完成 SHA-256 校验、离线镜像加载和仅 `my-web` 的强制重建。
- 线上冒烟：公网首页返回 200，`/tools/menswear` 未登录返回 307，容器启动日志无 error。
