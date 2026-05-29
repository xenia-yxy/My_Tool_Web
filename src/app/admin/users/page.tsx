import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于承接登录用户、会员权益、咨询记录和个人 AI 助手使用记录。"
      title="用户管理"
    >
      <AdminPlaceholder
        description="当前 MVP 只有单管理员登录。用户管理先作为未来用户端的边界，不提前做会员、客户和多角色数据。"
        nextStep="下一阶段如果启动用户端，可以从用户列表、账号状态和基础权益字段开始。"
        title="用户管理暂未启用"
      />
    </AdminShell>
  );
}
