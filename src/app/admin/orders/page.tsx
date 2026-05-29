import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于承接咨询服务、SOP 交付、工具订阅或其他商业化记录。"
      title="订单管理"
    >
      <AdminPlaceholder
        description="当前阶段还没有真实交易和服务订单，不展示虚拟金额或假转化数据。订单管理先作为商业化模块边界。"
        nextStep="下一阶段可以从服务线索、咨询订单和交付状态开始设计。"
        title="订单管理暂未启用"
      />
    </AdminShell>
  );
}
