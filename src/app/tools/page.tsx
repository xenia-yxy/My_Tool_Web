import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { WorkflowProgressBar } from "@/components/tools/workflow-progress-bar";
import { DashboardSummaryCards } from "@/components/tools/dashboard-summary-cards";
import { DashboardRecentImages } from "@/components/tools/dashboard-recent-images";
import { DashboardRecentDrafts } from "@/components/tools/dashboard-recent-drafts";
import { DashboardQuickActions } from "@/components/tools/dashboard-quick-actions";
import { requireSignedInUser } from "@/server/auth";
import { getToolsDashboardData } from "@/server/tools-dashboard";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const user = await requireSignedInUser("/tools");
  const data = await getToolsDashboardData(user.id);

  return (
    <>
      <WorkspacePageHeader
        description="查看今日工作流进度、近期成果和快捷入口，一步进入下一个创作环节。"
        title="工作台总览"
      />
      <div className="grid gap-5">
        <WorkflowProgressBar
          currentStage={data.currentStage}
          nextStep={data.nextStep}
          stageStatuses={data.stageStatuses}
        />

        <DashboardSummaryCards summary={data.summary} />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <DashboardRecentImages images={data.recentImages} />
          <DashboardRecentDrafts drafts={data.recentDrafts} />
        </div>

        <DashboardQuickActions />
      </div>
    </>
  );
}
