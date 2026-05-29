import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdminUser();

  return (
    <AdminShell
      description="后续用于展示内容、用户、工具和服务转化相关的真实指标。"
      title="数据大屏"
    >
      <AdminPlaceholder
        description="当前只展示内容运营数据，不做没有来源的访问量、收入或转化率大屏。"
        nextStep="下一阶段接入真实埋点或业务数据后，再补指标卡、趋势和转化漏斗。"
        title="数据大屏暂未启用"
      />
    </AdminShell>
  );
}
