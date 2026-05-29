import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于管理角色、权限边界和后台操作范围。"
      title="权限管理"
    >
      <AdminPlaceholder
        description="当前后台仍是单管理员模式，不引入完整 RBAC。这里保留权限管理入口，方便未来扩展多人协作。"
        nextStep="下一阶段如果出现多人后台使用，再补角色、权限点和操作审计。"
        title="权限管理暂未启用"
      />
    </AdminShell>
  );
}
