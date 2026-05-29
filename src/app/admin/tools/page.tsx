import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于管理自研工具、工具说明、入口状态和展示顺序。"
      title="工具管理"
    >
      <AdminPlaceholder
        description="工具管理已经进入后台结构，但当前阶段还没有真实工具运行平台。这里先保留模块入口，避免为了占位构造假工具数据。"
        nextStep="下一阶段可以从工具目录、工具状态和公开展示开关开始。"
        title="工具管理暂未启用"
      />
    </AdminShell>
  );
}
