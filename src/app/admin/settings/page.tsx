import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于管理站点基础配置、公开展示开关和系统级偏好。"
      title="系统设置"
    >
      <AdminPlaceholder
        description="当前系统配置仍然保持代码和环境变量管理，不在后台提前暴露不可用设置项。"
        nextStep="下一阶段可以从站点标题、联系入口和首页模块开关开始。"
        title="系统设置暂未启用"
      />
    </AdminShell>
  );
}
